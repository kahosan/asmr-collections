import type {
  DiscoveryExternalWork,
  DiscoveryHotProvider,
  DiscoveryRequest,
  DiscoveryRules,
  DLsiteRankPeriod
} from '@asmr-collections/shared';

import type { Prisma } from '~/lib/prisma/client';
import type { PopularWorks } from '~/types/popular';

import { createHash, randomUUID } from 'node:crypto';

import { prisma } from '~/lib/db';
import { storage } from '~/storage';
import { dlsite } from '~/provider/dlsite';
import { ASMROneProvider } from '~/provider/asmrone';

const DISCOVERY_INCLUDE = {
  circle: true,
  series: true,
  artists: true,
  illustrators: true,
  genres: true,
  translationInfo: true,
  // Recommendation scoring only needs these two fields. Do not fetch or
  // expose the persisted track JSON in a discovery response.
  playback: {
    select: {
      count: true,
      lastAt: true
    }
  }
} satisfies Prisma.WorkInclude;

interface PopularCacheEntry {
  works: PopularWorks
  expiresAt: number
}

type PopularSource =
  | { provider: 'dlsite', period: DLsiteRankPeriod }
  | { provider: 'asmrone', api: string };

const POPULAR_CACHE_TTL = 30 * 60 * 1000;
const POPULAR_CACHE_MAX = 8;
const DAY_MS = 86_400_000;

const MAX_PERSONAL_SEEDS = 12;
const PERSONAL_CORE_SEEDS = 6;
const PERSONAL_SEED_POOL_LIMIT = 48;
const PERSONAL_RECENCY_HALF_LIFE_DAYS = 30;
const PERSONAL_HOT_EXPLORATION_LIMIT = 24;
const PERSONAL_NEIGHBOR_LIMIT = 120;
const POPULAR_LIMIT = 100;

type DiscoveryWork = Prisma.WorkGetPayload<{ include: typeof DISCOVERY_INCLUDE }>;

interface LibraryCandidate {
  kind: 'library'
  work: DiscoveryWork
  sourceScore: number
  rank?: number
}

interface ExternalCandidate {
  kind: 'external'
  work: DiscoveryExternalWork
  provider: Exclude<DiscoveryHotProvider, 'personal'>
  rank: number
}

type Candidate = LibraryCandidate | ExternalCandidate;

type RankedCandidate = LibraryCandidate & {
  baseScore: number
};

interface DiscoveryContext {
  request: DiscoveryRequest
  seed: string
  excludeIds: Set<string>
  now: number
}

function createDiscoveryContext(request: DiscoveryRequest, now: number): DiscoveryContext {
  const source = request.scene === 'hot' ? 'personal' : request.source;
  const provider = request.scene === 'hot' ? request.provider : source;
  const date = request.date ?? new Date(now).toISOString().slice(0, 10);
  const seed = request.seed
    ?? (request.scene === 'random'
      ? randomUUID()
      : createHash('sha256')
        .update(`${date}:${request.scene}:${source}:${provider}`)
        .digest('hex')
        .slice(0, 24));

  return {
    request,
    seed,
    excludeIds: new Set(request.excludeIds.map(id => id.toUpperCase())),
    now
  };
}

export class DiscoveryEngine {
  readonly #popularCache = new Map<string, PopularCacheEntry>();
  readonly #db = prisma;
  readonly #storage = storage;
  readonly #dlsite = dlsite;

  async generate(request: DiscoveryRequest) {
    const context = createDiscoveryContext(request, Date.now());
    const candidates = await this.#collectCandidates(context);
    const storedIds = request.rules.storageOnly
      ? new Set((await this.#storage.list()).map(id => id.toUpperCase()))
      : undefined;

    const eligible = candidates.filter(candidate => {
      const workId = candidate.work.id.toUpperCase();
      if (context.excludeIds.has(workId)) return false;

      // External works do not have local playback or storage metadata. They
      // are only eligible for the hot scene and are filtered out when the
      // caller explicitly asks for locally stored works.
      if (candidate.kind === 'external')
        return request.scene === 'hot' && !request.rules.storageOnly;

      const { recentExcludeDays, storageOnly } = request.rules;
      if (recentExcludeDays > 0 && candidate.work.playback) {
        const cutoff = context.now - recentExcludeDays * DAY_MS;
        if (candidate.work.playback.lastAt.getTime() >= cutoff) return false;
      }

      return !storageOnly || (storedIds?.has(workId) ?? false);
    });
    const isProviderHot = request.scene === 'hot' && request.provider !== 'personal';
    const selected: Candidate[] = isProviderHot
      ? eligible
        .toSorted((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
        .slice(0, request.count)
      : this.#selectDiverse(
        eligible.flatMap(candidate => {
          if (candidate.kind !== 'library') return [];
          return [{ ...candidate, baseScore: this.#scoreCandidate(candidate, context) }];
        }),
        request.count,
        request.rules,
        context.seed
      );

    const response = {
      seed: context.seed,
      generatedAt: new Date(context.now).toISOString(),
      data: selected.map(candidate => {
        if (candidate.kind === 'external') {
          return {
            kind: 'external' as const,
            work: candidate.work,
            provider: candidate.provider,
            rank: candidate.rank
          };
        }

        const { playback, ...work } = candidate.work;
        const reason = playback
          ? `${Math.max(0, Math.floor((context.now - playback.lastAt.getTime()) / DAY_MS))} 天未播放`
          : '从未播放';

        return {
          kind: 'library' as const,
          work,
          reason,
          ...(candidate.rank === undefined ? {} : { rank: candidate.rank })
        };
      })
    };

    if (request.scene === 'hot') {
      return {
        ...response,
        scene: 'hot' as const,
        provider: request.provider
      };
    }

    return {
      ...response,
      scene: request.scene,
      source: request.source
    };
  }

  async #collectCandidates(context: DiscoveryContext): Promise<Candidate[]> {
    const { request } = context;
    if (request.scene === 'hot') {
      if (request.provider === 'personal')
        return this.#collectPersonalCandidates(context);

      const works = await this.#getPopularWorks(request);
      return this.#resolvePopularCandidates(works, request.provider, true);
    }

    if (request.source === 'personal')
      return this.#collectPersonalCandidates(context);

    const works = await this.#getPopularWorks({ provider: 'asmrone', api: request.api });
    return this.#resolvePopularCandidates(works, 'asmrone', false);
  }

  async #getPopularWorks(source: PopularSource) {
    const cacheKey = source.provider === 'asmrone' ? `asmrone:${source.api}` : `dlsite:${source.period}`;
    const cached = this.#popularCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      // Refresh insertion order so frequently used providers stay in the small
      // bounded cache.
      this.#popularCache.delete(cacheKey);
      this.#popularCache.set(cacheKey, cached);
      return cached.works;
    }

    if (cached)
      this.#popularCache.delete(cacheKey);

    const works = source.provider === 'asmrone'
      ? await new ASMROneProvider(source.api).popular(POPULAR_LIMIT)
      : await this.#dlsite.popular(source.period, POPULAR_LIMIT);

    if (this.#popularCache.size >= POPULAR_CACHE_MAX) {
      const oldest = this.#popularCache.keys().next().value;
      if (oldest)
        this.#popularCache.delete(oldest);
    }
    this.#popularCache.set(cacheKey, {
      works,
      expiresAt: Date.now() + POPULAR_CACHE_TTL
    });
    return works;
  }

  #queryWorks(ids?: string[]) {
    return this.#db.work.findMany({
      where: ids
        ? {
          OR: [
            { id: { in: ids } },
            { originalId: { in: ids } }
          ]
        }
        : undefined,
      include: DISCOVERY_INCLUDE
    });
  }

  async #resolvePopularCandidates(
    popularWorks: PopularWorks,
    provider: Exclude<DiscoveryHotProvider, 'personal'>,
    includeExternal: boolean
  ): Promise<Candidate[]> {
    if (popularWorks.length === 0) return [];

    const orderedPopularWorks = popularWorks.reduce<Array<{
      item: PopularWorks[number]
      index: number
      rawId: string
      id: string
      rank: number
    }>>((result, item, index) => {
      const rawId = item.id.trim();
      const id = rawId.toUpperCase();
      if (id.length === 0 || result.some(existing => existing.id === id))
        return result;

      result.push({
        item,
        index,
        rawId,
        id,
        rank: Number.isFinite(item.rank) ? item.rank : index + 1
      });
      return result;
    }, []).toSorted((a, b) => a.rank - b.rank || a.index - b.index);
    const ids = orderedPopularWorks.map(item => item.id);

    if (ids.length === 0) return [];

    const works = await this.#queryWorks(ids);
    const exactWorks = new Map(works.map(work => [work.id.toUpperCase(), work]));
    const originalWorks = new Map<string, DiscoveryWork>();
    for (const work of works) {
      if (work.originalId) {
        const originalId = work.originalId.toUpperCase();
        if (!originalWorks.has(originalId))
          originalWorks.set(originalId, work);
      }
    }

    const candidates: Candidate[] = [];
    const matchedWorkIds = new Set<string>();
    const maxPosition = Math.max(ids.length - 1, 1);

    for (const [position, popular] of orderedPopularWorks.entries()) {
      const exactWork = exactWorks.get(popular.id);
      const originalWork = originalWorks.get(popular.id);
      const work = exactWork ?? originalWork;
      if (work) {
        const workId = work.id.toUpperCase();
        if (matchedWorkIds.has(workId)) continue;

        matchedWorkIds.add(workId);
        candidates.push({
          kind: 'library',
          work,
          sourceScore: 1 - (position / maxPosition),
          ...(includeExternal ? { rank: popular.rank } : {})
        });
        continue;
      }

      if (includeExternal) {
        candidates.push({
          kind: 'external',
          work: {
            id: popular.rawId,
            name: popular.item.name,
            cover: popular.item.cover,
            intro: popular.item.intro,
            circle: popular.item.circle,
            genres: popular.item.genres
          },
          provider,
          rank: popular.rank
        });
      }
    }

    return candidates;
  }

  async #collectPersonalCandidates(context: DiscoveryContext): Promise<LibraryCandidate[]> {
    const { request, now } = context;
    const works = await this.#queryWorks();
    if (request.scene === 'random' && request.mode === 'pure') {
      return works.map(work => ({
        kind: 'library' as const,
        work,
        sourceScore: 0
      }));
    }

    const played = works.flatMap(work => {
      if (!work.playback) return [];

      return [{
        work,
        count: Math.max(0, work.playback.count),
        lastAt: work.playback.lastAt
      }];
    });

    const maxFrequency = played.reduce(
      (max, item) => Math.max(max, Math.log1p(item.count)),
      Number.EPSILON
    );
    const seedPool = played
      .map(item => {
        const days = Math.max(0, (now - item.lastAt.getTime()) / DAY_MS);
        const recency = 2 ** (-days / PERSONAL_RECENCY_HALF_LIFE_DAYS);
        const frequency = Math.log1p(item.count) / maxFrequency;

        return {
          work: item.work,
          lastAt: item.lastAt,
          weight: frequency * 0.45 + recency * 0.55
        };
      })
      .sort((a, b) => b.weight - a.weight || b.lastAt.getTime() - a.lastAt.getTime())
      .slice(0, PERSONAL_SEED_POOL_LIMIT);

    const coreSeeds = seedPool.slice(0, PERSONAL_CORE_SEEDS);
    const exploratorySeeds = seedPool
      .slice(coreSeeds.length)
      .map(seed => {
        const random = Math.max(
          this.#seededNumber(`${context.seed}:personal-seed:${seed.work.id}`),
          Number.MIN_VALUE
        );

        // Weighted sampling without replacement. A larger weight gives the
        // candidate a better chance while the request seed keeps the result
        // deterministic for a given day or "换一批" rotation.
        return {
          seed,
          key: Math.log(random) / Math.max(seed.weight, Number.EPSILON)
        };
      })
      .sort((a, b) => b.key - a.key)
      .slice(0, Math.max(0, MAX_PERSONAL_SEEDS - coreSeeds.length))
      .map(item => item.seed);
    const selectedSeeds = [...coreSeeds, ...exploratorySeeds];

    const similarityScores = await this.#calculateSimilarityScores(selectedSeeds, context);
    let maxScore = 0;
    for (const score of similarityScores.values())
      maxScore = Math.max(maxScore, score);

    const similarWorks = request.scene === 'random' || maxScore === 0
      ? works
      : works.filter(work => similarityScores.has(work.id));

    const isPersonalHot = request.scene === 'hot' && request.provider === 'personal';
    const popularityScores = new Map<string, number>();
    if (isPersonalHot) {
      const maxSales = works.reduce(
        (max, work) => Math.max(max, Math.log1p(Math.max(0, work.sales))),
        Number.EPSILON
      );
      const maxWishlist = works.reduce(
        (max, work) => Math.max(max, Math.log1p(Math.max(0, work.wishlistCount))),
        Number.EPSILON
      );

      for (const work of works) {
        const sales = Math.log1p(Math.max(0, work.sales)) / maxSales;
        const wishlist = Math.log1p(Math.max(0, work.wishlistCount)) / maxWishlist;
        const rating = Math.min(Math.max(work.rate, 0), 5) / 5;
        const ratingConfidence = Math.min(Math.max(work.rateCount, 0) / 20, 1);

        popularityScores.set(work.id, sales * 0.45 + wishlist * 0.35 + rating * ratingConfidence * 0.2);
      }
    }

    const candidateMap = new Map(similarWorks.map(work => [work.id, work]));
    if (isPersonalHot && maxScore > 0) {
      [...works]
        .sort((a, b) => (popularityScores.get(b.id) ?? 0) - (popularityScores.get(a.id) ?? 0))
        .slice(0, PERSONAL_HOT_EXPLORATION_LIMIT)
        .forEach(work => candidateMap.set(work.id, work));
    }

    const candidateWorks = candidateMap.size >= request.count
      ? [...candidateMap.values()]
      : works;

    return candidateWorks.map(work => {
      const similarity = maxScore > 0
        ? (similarityScores.get(work.id) ?? 0) / maxScore
        : 0;
      const popularity = popularityScores.get(work.id) ?? 0;
      const sourceScore = isPersonalHot
        ? (maxScore > 0 ? similarity * 0.8 + popularity * 0.2 : popularity)
        : similarity;

      return { kind: 'library' as const, work, sourceScore };
    });
  }

  async #calculateSimilarityScores(
    seeds: Array<{ work: DiscoveryWork, weight: number }>,
    context: DiscoveryContext
  ) {
    const scores = new Map<string, number>();

    await Promise.all(seeds.map(async ({ work: seed, weight }) => {
      try {
        const rows = await this.#db.$queryRaw<Array<{ id: string, distance: number | string }>>`
          SELECT candidate.id, candidate.embedding <=> seed.embedding AS distance
          FROM "Work" AS candidate
          CROSS JOIN "Work" AS seed
          WHERE seed.id = ${seed.id}
            AND candidate.embedding IS NOT NULL
            AND seed.embedding IS NOT NULL
            AND candidate.id <> ${seed.id}
          ORDER BY candidate.embedding <=> seed.embedding
          LIMIT ${PERSONAL_NEIGHBOR_LIMIT};
        `;

        rows.forEach((row, index) => {
          if (context.excludeIds.has(row.id.toUpperCase())) return;

          const rawDistance = Number(row.distance);
          const distance = Number.isFinite(rawDistance) ? Math.max(0, rawDistance) : 1;
          const similarity = Math.max(0, 1 - Math.min(distance, 1));
          const rankScore = similarity / Math.log2(index + 2);
          scores.set(row.id, (scores.get(row.id) ?? 0) + rankScore * weight);
        });
      } catch (error) {
        console.warn(`获取 ${seed.id} 的相似作品失败`, error);
      }
    }));

    return scores;
  }

  #scoreCandidate(candidate: LibraryCandidate, context: DiscoveryContext) {
    const { request, now, seed } = context;
    const jitter = this.#seededNumber(`${seed}:${candidate.work.id}`);
    if (request.mode === 'pure') return jitter;

    let novelty = 1;
    if (candidate.work.playback) {
      const days = Math.max(0, (now - candidate.work.playback.lastAt.getTime()) / DAY_MS);
      const ageScore = Math.min(days / 90, 1);
      const countScore = 1 / (1 + candidate.work.playback.count);
      novelty = ageScore * 0.7 + countScore * 0.3;
    }
    const lowPlay = candidate.work.playback
      ? 1 / (1 + candidate.work.playback.count)
      : 1;

    if (request.scene === 'hot') {
      // Personal hot recommendations use more exploration so “换一批” can
      // escape the same nearest-neighbour set when embeddings have not changed.
      return candidate.sourceScore * 1.6
        + novelty * 0.55
        + lowPlay * 0.15
        + jitter * 0.65;
    }

    return candidate.sourceScore * 1.45 + novelty * 1.2 + lowPlay * 0.65 + jitter * 0.65;
  }

  #selectDiverse(
    candidates: RankedCandidate[],
    count: number,
    rules: DiscoveryRules,
    seed: string
  ) {
    const remaining = [...candidates];
    const selected: RankedCandidate[] = [];
    const groupCounts = new Map<string, number>();
    const getCount = (key: string) => groupCounts.get(key) ?? 0;
    const increment = (key: string) => groupCounts.set(key, getCount(key) + 1);

    /** Prefer a candidate that has not appeared in an enabled diversity group. */
    const hasRepeatedGroup = (candidate: RankedCandidate) => {
      const { work } = candidate;
      if (rules.avoidDuplicateCircle
        && (rules.circleIds.length === 0 || rules.circleIds.includes(work.circleId))
        && getCount(`circle:${work.circleId}`) > 0)
        return true;

      if (rules.avoidDuplicateArtist) {
        for (const artist of work.artists) {
          if (rules.artistIds.length > 0 && !rules.artistIds.includes(artist.id)) continue;
          if (getCount(`artist:${artist.id}`) > 0) return true;
        }
      }

      if (rules.avoidDuplicateSeries && work.seriesId
        && getCount(`series:${work.seriesId}`) > 0)
        return true;

      if (rules.avoidDuplicateWorkType
        && getCount(`type:${work.id.slice(0, 2).toUpperCase()}`) > 0)
        return true;

      return rules.avoidDuplicateAgeCategory
        && getCount(`age:${work.ageCategory}`) > 0;
    };

    const diversityAdjustment = (candidate: RankedCandidate) => {
      const { work } = candidate;
      let adjustment = 0;

      if (rules.avoidDuplicateCircle
        && (rules.circleIds.length === 0 || rules.circleIds.includes(work.circleId)))
        adjustment -= getCount(`circle:${work.circleId}`) * 1.15;

      if (rules.avoidDuplicateArtist) {
        let repeated = 0;
        for (const artist of work.artists) {
          if (rules.artistIds.length > 0 && !rules.artistIds.includes(artist.id)) continue;
          repeated = Math.max(repeated, getCount(`artist:${artist.id}`));
        }
        adjustment -= repeated * 0.85;
      }

      if (rules.avoidDuplicateSeries && work.seriesId)
        adjustment -= getCount(`series:${work.seriesId}`) * 1.05;

      if (rules.avoidDuplicateWorkType) {
        const type = work.id.slice(0, 2).toUpperCase();
        adjustment -= getCount(`type:${type}`) * 0.55;
      }

      if (rules.avoidDuplicateAgeCategory)
        adjustment -= getCount(`age:${work.ageCategory}`) * 0.55;

      if (rules.forceGenreSpread) {
        const targetGenres = rules.genreIds.length > 0
          ? rules.genreIds
          : work.genres.map(genre => genre.id);
        let missingCount = 0;
        for (const id of targetGenres) {
          if (getCount(`genre:${id}`) === 0
            && work.genres.some(genre => genre.id === id))
            missingCount++;
        }
        adjustment += missingCount * 0.7;

        let repeated = 0;
        for (const genre of work.genres) {
          if (!targetGenres.includes(genre.id)) continue;
          repeated = Math.max(repeated, getCount(`genre:${genre.id}`));
        }
        adjustment -= repeated * 0.35;
      }

      return adjustment;
    };

    const updateGroupCounts = (candidate: RankedCandidate) => {
      const { work } = candidate;
      if (rules.avoidDuplicateCircle
        && (rules.circleIds.length === 0 || rules.circleIds.includes(work.circleId)))
        increment(`circle:${work.circleId}`);

      if (rules.avoidDuplicateArtist) {
        for (const artist of work.artists) {
          if (rules.artistIds.length > 0 && !rules.artistIds.includes(artist.id)) continue;
          increment(`artist:${artist.id}`);
        }
      }

      if (rules.avoidDuplicateSeries && work.seriesId)
        increment(`series:${work.seriesId}`);

      if (rules.avoidDuplicateWorkType)
        increment(`type:${work.id.slice(0, 2).toUpperCase()}`);

      if (rules.avoidDuplicateAgeCategory)
        increment(`age:${work.ageCategory}`);

      if (rules.forceGenreSpread) {
        const targetGenres = rules.genreIds.length > 0
          ? rules.genreIds
          : work.genres.map(genre => genre.id);
        for (const genre of work.genres) {
          if (targetGenres.includes(genre.id))
            increment(`genre:${genre.id}`);
        }
      }
    };

    while (remaining.length > 0 && selected.length < count) {
      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;
      const hasFreshGroup = remaining.some(candidate => !hasRepeatedGroup(candidate));

      remaining.forEach((candidate, index) => {
        if (hasFreshGroup && hasRepeatedGroup(candidate)) return;

        const diversity = diversityAdjustment(candidate);
        const tieBreaker = this.#seededNumber(`${seed}:slot-${selected.length}:${candidate.work.id}`) * 0.01;
        const score = candidate.baseScore + diversity + tieBreaker;

        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });

      const picked = remaining.splice(bestIndex, 1).pop();
      if (!picked) break;

      selected.push(picked);
      updateGroupCounts(picked);
    }

    return selected;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- shared deterministic helper for ranking and selection
  #seededNumber(seed: string) {
    const hex = createHash('sha256').update(seed).digest('hex').slice(0, 12);
    return Number.parseInt(hex, 16) / 0x1_00_00_00_00_00_00;
  }
}

export const discover = new DiscoveryEngine();

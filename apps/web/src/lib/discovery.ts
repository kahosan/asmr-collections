import { DEFAULT_DISCOVERY_COUNT, DEFAULT_DLSITE_RANK_PERIOD } from '@asmr-collections/shared';
import type {
  DiscoveryProvider,
  DiscoveryRequestInput,
  DiscoveryRules,
  DLsiteRankPeriod
} from '@asmr-collections/shared';

import type { DiscoveryOptions, SettingOptions } from '~/hooks/use-setting-options';

export const DISCOVERY_ENDPOINT = '/api/discover';

interface DiscoveryRotationOptions {
  date?: string
  rotation?: number
  excludeIds?: string[]
}

export type DiscoverySelection =
  | { scene: 'daily' | 'personal' }
  | {
    scene: 'hot'
    provider: DiscoveryProvider
    period?: DLsiteRankPeriod
  }
  | { scene: 'random' };

export function getDiscoveryDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getDiscoveryRules({ smartRandom, dailyCount, ...rules }: DiscoveryOptions): DiscoveryRules {
  return rules;
}

export function createDiscoveryRequest(options: Pick<SettingOptions, 'discovery' | 'asmrone'>, selection: DiscoverySelection & DiscoveryRotationOptions): DiscoveryRequestInput {
  const { scene } = selection;
  const rules = getDiscoveryRules(options.discovery);
  if (scene === 'random')
    return { scene: 'random', count: 1, rules };

  const { date = getDiscoveryDate(), rotation = 0, excludeIds = [] } = selection;
  const common = {
    count: scene === 'daily'
      ? options.discovery.dailyCount
      : Math.max(options.discovery.dailyCount, DEFAULT_DISCOVERY_COUNT),
    date,
    excludeIds,
    rules
  };

  if (scene !== 'hot') {
    return {
      ...common,
      scene,
      seed: `${date}:${scene}:${rotation}`
    };
  }

  const { provider, period = DEFAULT_DLSITE_RANK_PERIOD } = selection;
  const target = provider === 'dlsite'
    ? { provider, period }
    : { provider, api: options.asmrone.api };

  return {
    ...common,
    scene: 'hot',
    seed: `${date}:hot:${provider}:${rotation}`,
    ...target
  };
}

export function getDiscoveryFetchOptions(request: DiscoveryRequestInput): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  };
}

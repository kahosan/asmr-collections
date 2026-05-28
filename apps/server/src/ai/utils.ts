import type { WorkInfo } from '~/types/source';

export interface WorkPassage {
  name: string
  intro?: string | null
  ageCategory: number
  circle: { name: string }
  series?: { name: string } | null
  artists?: Array<{ name: string }>
  illustrators?: Array<{ name: string }>
  genres?: Array<{ name: string }>
}

const AGE_CATEGORY: Record<number, string> = {
  1: '全年龄',
  2: 'R15',
  3: 'R18'
};

export function formatPassage(work: WorkPassage) {
  const parts = [
    `作品名称: ${work.name}`,
    work.intro ? `作品简介: ${work.intro}` : '',
    work.genres?.length ? `标签: ${work.genres.map(g => g.name).join('、')}` : '',
    work.series?.name ? `所属系列: ${work.series.name}` : '',
    `年龄分级: ${AGE_CATEGORY[work.ageCategory]}'}`,
    `制作社团: ${work.circle.name}`,
    work.artists?.length ? `声优: ${work.artists.map(a => a.name).join('、')}` : '',
    work.illustrators?.length ? `画师: ${work.illustrators.map(i => i.name).join('、')}` : ''
  ];

  return parts.filter(Boolean).join(' ');
}

export function normalizeWorkInfo(work: WorkInfo): WorkPassage {
  return {
    name: work.name,
    intro: work.intro,
    ageCategory: work.age_category,
    circle: { name: work.maker.name },
    series: work.series ? { name: work.series.name } : null,
    artists: work.artists?.map(name => ({ name })),
    illustrators: work.illustrators?.map(name => ({ name })),
    genres: work.genres
  };
}

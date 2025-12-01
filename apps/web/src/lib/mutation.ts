import { mutate } from 'swr';

export function mutateWorkInfo(id: string) {
  return mutate(`work-info-${id}`);
}

export function mutateWorks() {
  return mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
}

export function mutateTracks(id: string) {
  mutate(key => typeof key === 'string' && key.startsWith(`work-tracks-${id}`));
}

export function mutateSimilar(id: string) {
  return mutate(`/api/work/similar/${id}?`);
};

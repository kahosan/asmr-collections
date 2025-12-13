import { mutate } from 'swr';

function mutateKey(prefix: string): (key: unknown) => boolean {
  return (key: unknown): boolean => {
    return typeof key === 'string' && key.startsWith(prefix);
  };
};

export function mutateWorkInfo(id: string) {
  return mutate(`work-info-${id}`);
}

export function mutateWorks() {
  return mutate(mutateKey('/api/works'));
}

export function mutateTracks(id: string) {
  return mutate(mutateKey(`work-tracks-${id}`));
}

export function mutateSimilar(id: string) {
  return mutate(mutateKey(`/api/work/similar/${id}`));
};

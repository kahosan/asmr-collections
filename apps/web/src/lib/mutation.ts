import { mutate } from 'swr';

export function mutateWorkInfo(id: string) {
  mutate(`work-info-${id}`);
}

export function mutateWorks() {
  mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
}

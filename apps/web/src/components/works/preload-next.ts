import useSWRImmutable from 'swr/immutable';

import { fetcher } from '~/lib/fetcher';

export default function PreloadNextWorks({ swrKey }: { swrKey: string | null }) {
  useSWRImmutable(swrKey, fetcher);

  return null;
}

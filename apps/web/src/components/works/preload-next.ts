import useSWR from 'swr';
import { fetcher } from '~/lib/fetcher';

export default function PreloadNextWorks({ swrKey }: { swrKey: string | null }) {
  useSWR(swrKey, fetcher);

  return null;
}

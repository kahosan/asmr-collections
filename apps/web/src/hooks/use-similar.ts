import { useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import useSWRImmutable from 'swr/immutable';

import { settingOptionsAtom } from './use-setting-options';

import { notifyError } from '~/utils';

import { fetcher } from '~/lib/fetcher';
import type { Work } from '~/types/work';

const useRecommenderAtom = focusAtom(settingOptionsAtom, optic => optic.prop('useAsmrOneRecommender'));
const asmrOneApi = focusAtom(settingOptionsAtom, optic => optic.prop('asmrOneApi'));

export function useSimilar(id: string) {
  const useRecommender = useAtomValue(useRecommenderAtom);
  const asmrOneApiUrl = useAtomValue(asmrOneApi);

  const searchParams = new URLSearchParams();
  if (useRecommender)
    searchParams.append('asmrOneApi', asmrOneApiUrl);

  return useSWRImmutable<Work[]>(`/api/work/similar/${id}?${searchParams.toString()}`, fetcher, {
    onError: e => notifyError(e, '获取相似作品失败')
  });
};

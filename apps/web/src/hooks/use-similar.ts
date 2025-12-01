import { useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import useSWRImmutable from 'swr/immutable';

import { withQuery } from '@asmr-collections/shared';

import { settingOptionsAtom } from './use-setting-options';

import { notifyError } from '~/utils';

import { fetcher } from '~/lib/fetcher';

import type { Work } from '@asmr-collections/shared';

const useRecommenderAtom = focusAtom(settingOptionsAtom, optic => optic.prop('useAsmrOneRecommender'));
const asmrOneApi = focusAtom(settingOptionsAtom, optic => optic.prop('asmrOneApi'));

export function useSimilar(id: string) {
  const useRecommender = useAtomValue(useRecommenderAtom);
  const asmrOneApiUrl = useAtomValue(asmrOneApi);

  const query = useRecommender ? { asmrOneApi: asmrOneApiUrl } : {};
  const key = withQuery(`/api/work/similar/${id}`, query);

  return useSWRImmutable<Work[]>(key, fetcher, {
    onError: e => notifyError(e, '获取相似作品失败'),
    errorRetryCount: 0
  });
};

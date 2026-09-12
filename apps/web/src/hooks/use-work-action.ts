import { useCallback } from 'react';

import { useToastMutation } from './use-toast-fetch';

import { mutateDiscover, mutatePlaylists, mutateSimilar, mutateWorkInfo, mutateWorks } from '~/lib/mutation';

import type { ToastOps } from './use-toast-fetch';

const WORK_ACTIONS = {
  create: { path: 'create', method: 'POST', text: '添加' },
  delete: { path: 'delete', method: 'DELETE', text: '删除' },
  update: { path: 'update', method: 'PUT', text: '数据更新' },
  'update-embedding': { path: 'update/embedding', method: 'PUT', text: '向量信息更新' }
} as const;

type WorkActionType = keyof typeof WORK_ACTIONS;

interface WorkActionResponse {
  message?: string
}

interface WorkActionOptions extends ToastOps<WorkActionResponse> {
  label?: string
}

function mutateWork(type: WorkActionType, id: string) {
  const mutations = [mutateDiscover()];

  if (type !== 'update-embedding')
    mutations.push(mutateWorks(), mutateWorkInfo(id), mutatePlaylists());

  if (type === 'create' || type === 'update-embedding')
    mutations.push(mutateSimilar(id));

  return Promise.allSettled(mutations);
}

export function useWorkAction(type: WorkActionType) {
  const config = WORK_ACTIONS[type];
  const [toastAction, isMutating, state] = useToastMutation<WorkActionResponse>(type);

  const action = useCallback((id: string, { label = id, finally: onFinally, ...toastOps }: WorkActionOptions = {}) => {
    return toastAction({
      key: `/api/work/${config.path}/${id}`,
      fetchOps: { method: config.method },
      toastOps: {
        loading: `${label} ${config.text}中...`,
        success: `${label} ${config.text}成功`,
        error: `${label} ${config.text}失败`,
        description: type === 'create' ? data => data.message : undefined,
        ...toastOps,
        async finally() {
          const revalidation = mutateWork(type, id);
          try {
            await onFinally?.();
          } finally {
            await revalidation;
          }
        }
      }
    });
  }, [config, toastAction, type]);

  return [action, isMutating, state] as const;
}

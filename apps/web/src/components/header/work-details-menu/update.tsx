import { mutate } from 'swr';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { DropdownMenuItem } from '~/components/ui/dropdown-menu';

export default function UpdateMenu({ id }: { id: string }) {
  const [refreshAction, refreshIsMutating] = useToastMutation('refresh');

  const update = () => {
    refreshAction({
      key: `/api/work/refresh/${id}`,
      fetchOps: { method: 'PUT' },
      toastOps: {
        loading: `${id} 数据更新中...`,
        success: `${id} 数据更新成功`,
        error: `${id} 数据更新失败`,
        finally() {
          mutate(key => typeof key === 'string' && key.startsWith('/api/work'));
        }
      }
    });
  };

  const updateVector = () => {
    refreshAction({
      key: `/api/work/refresh/embedding/${id}`,
      fetchOps: { method: 'PUT' },
      toastOps: {
        loading: `${id} 向量信息更新中...`,
        success: `${id} 向量信息更新成功`,
        error: `${id} 向量信息更新失败`,
        finally() {
          mutate(key => typeof key === 'string' && key.startsWith('/api/work'));
        }
      }
    });
  };

  return (
    <>
      <DropdownMenuItem disabled={refreshIsMutating} className="cursor-pointer" onClick={update}>
        更新信息
      </DropdownMenuItem>
      <DropdownMenuItem disabled={refreshIsMutating} className="cursor-pointer" onClick={updateVector}>
        更新向量
      </DropdownMenuItem>
    </>
  );
}

import { mutate } from 'swr';

import { useToastFetch } from '~/hooks/use-toast-fetch';

import { DropdownMenuItem } from '~/components/ui/dropdown-menu';

import type { Work } from '~/types/work';

export default function UpdateMenu({ id }: { id: string }) {
  const [isLoading, toastcher] = useToastFetch();

  const update = () => {
    toastcher<Work>(
      `/api/work/refresh/${id}`,
      { method: 'PUT' },
      {
        loading: `${id} 数据更新中...`,
        success: `${id} 数据更新成功`,
        error: `${id} 数据更新失败`,
        finally() {
          mutate(key => typeof key === 'string' && key.startsWith('/api/work'));
        }
      }
    );
  };

  const updateVector = () => {
    toastcher<Work>(
      `/api/work/refresh/embedding/${id}`,
      { method: 'PUT' },
      {
        loading: `${id} 向量信息更新中...`,
        success: `${id} 向量信息更新成功`,
        error: `${id} 向量信息更新失败`,
        finally() {
          mutate(key => typeof key === 'string' && key.startsWith('/api/work'));
        }
      }
    );
  };

  return (
    <>
      <DropdownMenuItem disabled={isLoading} className="cursor-pointer" onClick={update}>
        更新信息
      </DropdownMenuItem>
      <DropdownMenuItem disabled={isLoading} className="cursor-pointer" onClick={updateVector}>
        更新向量
      </DropdownMenuItem>
    </>
  );
}

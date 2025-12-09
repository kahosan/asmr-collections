import { Button } from '~/components/ui/button';
import { confirm } from '~/components/ui/confirmer';
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';

import { StorageDialog } from './storage-dialog';

import useSWRImmutable from 'swr/immutable';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { fetcher } from '~/lib/fetcher';

import type { StorageResponse, StoragesResponse } from '@asmr-collections/shared';

export function StorageSettings() {
  const { data, mutate } = useSWRImmutable<StoragesResponse>('/api/storage', fetcher, {
    suspense: true
  });

  if (!data) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">存储设置</h2>
        <StorageDialog actionType="create" mutate={mutate} />
      </div>
      <div className="border rounded-md max-w-full overflow-hidden grid mb-4">
        <ScrollArea className="w-full overflow-x-auto">
          <Table className="**:data-[slot=table-head]:text-center **:data-[slot=table-cell]:text-center">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-15">ID</TableHead>
                <TableHead className="min-w-25">名称</TableHead>
                <TableHead className="min-w-20">优先级</TableHead>
                <TableHead className="min-w-30">备注</TableHead>
                <TableHead className="min-w-45">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24">
                    暂无存储配置
                  </TableCell>
                </TableRow>
              )}
              {data.map(storage => (
                <TableRow key={storage.id}>
                  <TableCell>{storage.id}</TableCell>
                  <TableCell>{storage.name}</TableCell>
                  <TableCell>{storage.priority}</TableCell>
                  <TableCell className="text-muted-foreground">{storage.description || '-'}</TableCell>
                  <TableCell>
                    <StorageActions data={storage} mutate={mutate} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

interface StorageActionsProps {
  data: StorageResponse
  mutate: () => void
}

function StorageActions({ data, mutate }: StorageActionsProps) {
  const [action, isLoading] = useToastMutation<{ message: string }>('storage-delete');

  async function onDelete() {
    const yes = await confirm({
      title: `确定要删除存储 ${data.name} 吗？`,
      description: '删除后无法恢复，请谨慎操作'
    });

    if (!yes) return;

    action({
      key: `/api/storage/${data.id}`,
      fetchOps: {
        method: 'DELETE'
      },
      toastOps: {
        success() {
          mutate();
          return '存储删除成功';
        },
        description(data) {
          return data.message;
        },
        error: '存储删除失败'
      }
    });
  }

  return (
    <div className="flex gap-2 justify-center">
      <StorageDialog actionType="edit" data={data} mutate={mutate} storageId={data.id} />
      <Button variant="outline" size="default" onClick={onDelete} disabled={isLoading}>
        删除
      </Button>
    </div>
  );
}

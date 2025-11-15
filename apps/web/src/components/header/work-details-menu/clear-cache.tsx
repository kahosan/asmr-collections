import { DropdownMenuItem } from '~/components/ui/dropdown-menu';

import { useToastMutation } from '~/hooks/use-toast-fetch';

export default function ClearCacheMenu({ id}: { id: string }) {
  const [clearTracksAction, m1] = useToastMutation('clear-tracks-cache');

  const isMutating = m1;

  const handleClear = () => {
    clearTracksAction({
      key: `/api/tracks/${id}/cache/clear`,
      fetchOps: { method: 'POST' },
      toastOps: {
        loading: '正在清理曲目缓存...',
        success: '曲目缓存已清理',
        error: '清理曲目缓存失败'
      }
    });
  };

  return (
    <DropdownMenuItem
      title="清理本地库相关操作的缓存"
      disabled={isMutating}
      className="cursor-pointer"
      onClick={handleClear}
    >
      清理缓存
    </DropdownMenuItem>
  );
}

import { useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';
import { voiceLibraryOptionsAtom } from '~/hooks/use-setting-options';

import { useToastMutation } from '~/hooks/use-toast-fetch';
import { mutateTracks } from '~/lib/mutation';

const useLocalAtom = focusAtom(voiceLibraryOptionsAtom, optic => optic.prop('useLocalVoiceLibrary'));

export default function ClearCacheMenu({ id}: { id: string }) {
  const [clearTracksAction, m1] = useToastMutation('clear-tracks-cache');
  const enabled = useAtomValue(useLocalAtom);

  const isMutating = m1;

  const handleClear = () => {
    clearTracksAction({
      key: `/api/tracks/${id}/cache/clear`,
      fetchOps: { method: 'POST' },
      toastOps: {
        loading: '正在清理曲目缓存...',
        success: '曲目缓存已清理',
        error: '清理曲目缓存失败',
        finally() {
          mutateTracks(id);
        }
      }
    });
  };

  return (
    <DropdownMenuItem
      title="清理本地库相关操作的缓存"
      disabled={isMutating || !enabled}
      className="cursor-pointer"
      onClick={handleClear}
    >
      清理缓存
    </DropdownMenuItem>
  );
}

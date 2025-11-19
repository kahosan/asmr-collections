import { useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { DropdownMenuItem } from '~/components/ui/dropdown-menu';
import { settingOptionsAtom, voiceLibraryOptionsAtom } from '~/hooks/use-setting-options';

import { useToastMutation } from '~/hooks/use-toast-fetch';
import { mutateTracks } from '~/lib/mutation';

const useLocalAtom = focusAtom(voiceLibraryOptionsAtom, optic => optic.prop('useLocalVoiceLibrary'));
const asmrOneApiAtom = focusAtom(settingOptionsAtom, optic => optic.prop('asmrOneApi'));

export default function ClearCacheMenu({ id}: { id: string }) {
  const [clearTracksAction, m1] = useToastMutation('clear-tracks-cache');
  const local = useAtomValue(useLocalAtom);
  const asmrOneApi = useAtomValue(asmrOneApiAtom);

  const isMutating = m1;

  const searchParams = new URLSearchParams({
    local: local ? 'true' : 'false',
    asmrOneApi
  });

  const handleClear = () => {
    clearTracksAction({
      key: `/api/tracks/${id}/cache/clear?${searchParams.toString()}`,
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
      title="清理获取 tracks 的缓存"
      disabled={isMutating}
      className="cursor-pointer"
      onClick={handleClear}
    >
      清理缓存
    </DropdownMenuItem>
  );
}

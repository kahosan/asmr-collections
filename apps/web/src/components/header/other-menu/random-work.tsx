import { MenubarItem } from '~/components/ui/menubar';

import { noop } from 'swr/_internal';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { useToastMutation } from '~/hooks/use-toast-fetch';
import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { createDiscoveryRequest, DISCOVERY_ENDPOINT, getDiscoveryFetchOptions } from '~/lib/discovery';

import type { DiscoveryResponse } from '@asmr-collections/shared';

type RandomResponse = DiscoveryResponse | { id: string };

export function RandomWork() {
  const [action, loading] = useToastMutation<RandomResponse>('random');
  const options = useAtomValue(settingOptionsAtom);

  const navigate = useNavigate();

  const handleClick = () => {
    const request = options.discovery.smartRandom
      ? {
        key: DISCOVERY_ENDPOINT,
        fetchOps: getDiscoveryFetchOptions(createDiscoveryRequest(options, { scene: 'random' }))
      }
      : { key: '/api/work/random' };

    action({
      ...request,
      toastOps: { loading: '正在跳转...', error: '跳转失败' }
    })
      .unwrap()
      .then(response => {
        const id = 'id' in response
          ? response.id
          : response.data.at(0)?.work.id;
        if (!id) {
          toast.error('未找到可播放的作品');
          return;
        }
        navigate({ to: '/work-details/$id', params: { id } });
      })
      .catch(noop);
  };

  return (
    <MenubarItem onClick={handleClick} disabled={loading}>
      随心听
    </MenubarItem>
  );
}

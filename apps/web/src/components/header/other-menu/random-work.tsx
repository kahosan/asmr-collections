import { MenubarItem } from '~/components/ui/menubar';

import { noop } from 'swr/_internal';
import { useNavigate } from '@tanstack/react-router';

import { useToastMutation } from '~/hooks/use-toast-fetch';

export default function RandomWork() {
  const [action, loading] = useToastMutation<{ id: string }>('random');

  const navigate = useNavigate();

  const handleClick = () => {
    action({ key: '/api/work/random', toastOps: { loading: '正在跳转...', error: '跳转失败' } })
      .unwrap()
      .then(({ id }) => {
        navigate({ to: '/work-details/$id', params: { id } });
      })
      .catch(noop);
  };

  return (
    <MenubarItem onClick={handleClick} disabled={loading} className="cursor-pointer">
      随心听
    </MenubarItem>
  );
}

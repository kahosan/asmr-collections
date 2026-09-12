import { useWorkAction } from '~/hooks/use-work-action';

import { DropdownMenuItem } from '~/components/ui/dropdown-menu';

export function UpdateMenu({ id }: { id: string }) {
  const [updateAction, updateIsMutating] = useWorkAction('update');
  const [updateVectorAction, updateVectorIsMutating] = useWorkAction('update-embedding');

  const isMutating = updateIsMutating || updateVectorIsMutating;

  const update = () => {
    updateAction(id);
  };

  const updateVector = () => {
    updateVectorAction(id);
  };

  return (
    <>
      <DropdownMenuItem disabled={isMutating} onClick={update}>
        更新信息
      </DropdownMenuItem>
      <DropdownMenuItem disabled={isMutating} onClick={updateVector}>
        更新向量
      </DropdownMenuItem>
    </>
  );
}

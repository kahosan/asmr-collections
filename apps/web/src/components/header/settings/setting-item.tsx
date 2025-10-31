import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';

export function SettingItem({ id, children, ...props }: React.ComponentPropsWithoutRef<typeof Switch>) {
  return (
    <div className="flex justify-between">
      <Label htmlFor={id} className={props.disabled ? 'opacity-60' : ''}>{children}</Label>
      <Switch id={id} {...props} />
    </div>
  );
}

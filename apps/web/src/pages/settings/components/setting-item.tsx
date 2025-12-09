import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { cn } from '~/lib/utils';

export function SettingItem({ id, children, ...props }: React.ComponentPropsWithoutRef<typeof Switch>) {
  return (
    <div className="flex justify-between">
      <Label
        htmlFor={id}
        className={cn(props.disabled ? 'opacity-60' : '', 'max-w-[80%] leading-6')}
      >
        {children}
      </Label>
      <Switch id={id} {...props} />
    </div>
  );
}

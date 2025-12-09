import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export function SettingInput({ id, children, ...props }: React.ComponentPropsWithoutRef<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{children}</Label>
      <Input id={id} {...props} />
    </div>
  );
}

import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { cn } from '~/lib/utils';

interface SettingItemProps extends React.ComponentPropsWithoutRef<typeof Switch> {
  id: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function SettingItem({ id, children, description, action, ...props }: SettingItemProps) {
  function renderAction() {
    if (action) return action;
    return <Switch id={id} {...props} />;
  }

  function renderDescription() {
    if (!description) return null;
    return <p className="text-muted-foreground text-xs max-w-[90%]">{description}</p>;
  }

  return (
    <div className="flex justify-between items-center">
      <div className="w-full">
        <Label
          htmlFor={action ? undefined : id}
          className={cn(
            props.disabled && 'text-muted-foreground',
            'transition-colors max-w-[90%] leading-6'
          )}
        >
          {children}
        </Label>
        {renderDescription()}
      </div>
      {renderAction()}
    </div>
  );
}

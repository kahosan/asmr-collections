import { cn } from '~/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

function IconInput({ ref, className, type, icon, ...props }: InputProps & { ref?: React.RefObject<HTMLInputElement> }) {
  return (
    <div className="relative flex items-center">
      <div className="absolute right-2 top-2">
        {icon}
      </div>
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
}
IconInput.displayName = 'IconInput';

export { IconInput };

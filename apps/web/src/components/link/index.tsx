import { createLink } from '@tanstack/react-router';
import { ExternalLinkIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

interface BaseLinkProps extends React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>> {
  isExternal?: boolean
  underline?: 'hover' | 'always'
  showAnchorIcon?: boolean
  anchorIcon?: React.ReactNode
  ref: React.Ref<HTMLAnchorElement>
}

function BaseLink({
  isExternal,
  underline,
  showAnchorIcon,
  anchorIcon,
  children,
  ref,
  ...props
}: BaseLinkProps) {
  function renderAnchorIcon() {
    if (anchorIcon) return anchorIcon;
    return <ExternalLinkIcon className="size-4" />;
  }

  function renderContent() {
    if (showAnchorIcon) {
      return (
        <span className="flex items-center gap-1">
          {children}
          {renderAnchorIcon()}
        </span>
      );
    }

    return children;
  }

  return (
    <a
      ref={ref}
      {...props}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={cn(
        props.className,
        underline ? 'underline decoration-transparent underline-offset-4' : 'no-underline hover:no-underline',
        underline === 'hover' && 'hover:decoration-current transition-[text-decoration-color]',
        underline === 'always' && 'decoration-current',
        'cursor-pointer'
      )}
    >
      {renderContent()}
    </a>
  );
};

export const Link = createLink(BaseLink);

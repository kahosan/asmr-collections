import { createLink } from '@tanstack/react-router';
import { cn } from '~/lib/utils';

type IconLinkProps = React.ComponentProps<'a'> & {
  icon: React.ReactNode
};

function IconLinkBase(props: IconLinkProps) {
  const { className, icon, children } = props;
  return (
    <a
      {...props}
      className={cn(className, 'flex items-center gap-3 p-3')}
    >
      {icon}
      {children ? <div className="truncate">{children}</div> : null}
    </a>
  );
}

const IconLink = createLink(IconLinkBase);

export default IconLink;

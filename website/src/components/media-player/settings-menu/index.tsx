import { Link } from '@tanstack/react-router';
import { Separator } from '~/components/ui/separator';

export default function SettingsMenu({ workId }: { workId: string }) {
  return (
    <div className="w-full">
      <Separator className="mb-2" />
      <Link to="/work-details/$id" params={{ id: workId }} className="w-full text-center py-2 hover:bg-current/10 block rounded-xs">
        回到作品页
      </Link>
    </div>
  );
}

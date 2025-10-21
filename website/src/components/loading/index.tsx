import { RotateCw } from 'lucide-react';
import { cn } from '~/lib/utils';

export default function Loading({ isLoading, className }: { isLoading: boolean, className?: string }) {
  return isLoading && <RotateCw className={cn('flex animate-spin size-4', className)} />;
}

import { ErrorBoundary as Boundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';

function ErrorFallback({ error }: FallbackProps) {
  const message = 'message' in error ? error.message : '未知错误';
  return (
    <div className="mt-24 space-y-4">
      <h2 className="font-bold text-3xl">遇到了一些问题</h2>
      <p className="opacity-60">请重试。如果问题依旧存在，请在 GitHub 创建一个 Issue 并提供详细信息。 </p>
      <div className="flex gap-4">
        <Button variant="default" onClick={() => window.location.reload()}>重试</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">查看详情</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>错误详情</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="opacity-60 font-mono text-sm">{message}</div>
            <AlertDialogFooter>
              <AlertDialogCancel>关闭</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Boundary FallbackComponent={ErrorFallback}>
      {children}
    </Boundary>
  );
}

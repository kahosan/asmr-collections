import Header from './components/header';
import MediaPlayer from './components/media-player';
import ErrorBoundary from './components/error-boundary';

import { Confirmer } from './components/ui/confirmer';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <ErrorBoundary>
      <Header />
      <main className="max-w-7xl mx-auto p-4 pt-[calc(var(--navbar-height)+1rem)] mb-4">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Confirmer />
      <MediaPlayer />
    </ErrorBoundary>
  );
}

import Header from './components/header';
import MediaPlayer from './components/media-player';

import { Toaster } from './components/ui/sonner';
import { Confirmer } from './components/ui/confirmer';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto p-4 pt-[4.5rem] space-y-4">
        {children}
      </main>
      <Toaster position="top-right" />
      <Confirmer />
      <MediaPlayer />
    </>
  );
}

import Header from './components/header';
import MediaPlayer from './components/media-player';

import { Confirmer } from './components/ui/confirmer';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto p-4 pt-18">
        {children}
      </main>
      <Confirmer />
      <MediaPlayer />
    </>
  );
}

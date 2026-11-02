import { Container, Hotkey } from '@videojs/react';

// 音频没有画面，Container 仅用于承载媒体元素和全局快捷键
export function MediaContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container className="hidden">
      {children}
      <Hotkey target="document" keys="k" action="togglePaused" />
      <Hotkey target="document" keys="Space" action="togglePaused" />
      <Hotkey target="document" keys="m" action="toggleMuted" />
      <Hotkey target="document" keys="c" action="toggleSubtitles" />
      <Hotkey target="document" keys="j" action="seekStep" value={-5} />
      <Hotkey target="document" keys="ArrowLeft" action="seekStep" value={-5} />
      <Hotkey target="document" keys="l" action="seekStep" value={5} />
      <Hotkey target="document" keys="ArrowRight" action="seekStep" value={5} />
      <Hotkey target="document" keys="ArrowUp" action="volumeStep" value={0.05} />
      <Hotkey target="document" keys="ArrowDown" action="volumeStep" value={-0.05} />
      <Hotkey target="document" keys=">" action="speedUp" />
      <Hotkey target="document" keys="<" action="speedDown" />
    </Container>
  );
}

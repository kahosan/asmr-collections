import { useCallback, useEffect, useRef } from 'react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 200;

const PADDING = 16;

export function drawCaptionFrame(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const fontSize = Math.min(32, width / 14);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = width - PADDING * 2;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.4;
  const totalHeight = lines.length * lineHeight;
  const startY = (height - totalHeight) / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++)
    ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push('');
      continue;
    }

    let currentLine = '';
    for (const char of paragraph) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

interface UseVideoPipOptions {
  onClose: () => void
}

export function useVideoPip({ onClose }: UseVideoPipOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const openPip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) throw new Error('当前浏览器不支持画中画');

    await video.requestPictureInPicture();
  }, []);

  const closePip = useCallback(() => {
    if (document.pictureInPictureElement === videoRef.current)
      document.exitPictureInPicture();
  }, []);

  useEffect(() => {
    const DPR = window.devicePixelRatio;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH * DPR;
    canvas.height = CANVAS_HEIGHT * DPR;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(DPR, DPR);
      drawCaptionFrame(ctx, '...', CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    const video = document.createElement('video');
    video.style.display = 'none';
    video.muted = true;

    document.body.appendChild(video);

    const stream = canvas.captureStream(30);
    video.srcObject = stream;
    video.play();

    canvasRef.current = canvas;
    videoRef.current = video;

    const handleLeavePip = () => {
      onClose();
    };

    video.addEventListener('leavepictureinpicture', handleLeavePip);

    return () => {
      closePip();

      video.removeEventListener('leavepictureinpicture', handleLeavePip);
      video.remove();

      canvasRef.current = null;
      videoRef.current = null;
    };
  }, [closePip, onClose]);

  const drawFrame = useCallback((text: string) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !video) return;

    drawCaptionFrame(ctx, text, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  return { openPip, closePip, drawFrame };
}

import { atomWithStorage } from 'jotai/utils';

export type CaptionSize = 'sm' | 'md' | 'lg' | 'xl';

export const CAPTION_SIZES: Array<{ value: CaptionSize, label: string }> = [
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
  { value: 'xl', label: '特大' }
];

export const captionSizeAtom = atomWithStorage<CaptionSize>('video-caption-size', 'sm', undefined, {
  getOnInit: true
});

import { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';

import { hiddenImageAtom } from '~/hooks/use-hidden-image';
import { cn } from '~/lib/utils';

const DEFAULT_IMAGE_TRANSITION_DURATION = 150;
const DEFAULT_SHOW_LOADING_DURATION = 1500;

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'className'> {
  disableHidden?: boolean
  duration?: number
  showLoadingIndicator?: boolean
  showLoadingDuration?: number
  classNames?: {
    wrapper?: string
    img?: string
  }
}

export function Image({
  classNames,
  duration = DEFAULT_IMAGE_TRANSITION_DURATION,
  disableHidden = false,
  showLoadingIndicator = true,
  showLoadingDuration = DEFAULT_SHOW_LOADING_DURATION,
  style,
  ...props
}: ImageProps) {
  const isHiddenImage = useAtomValue(hiddenImageAtom);

  const [isLoading, setIsLoading] = useState(true);
  const [showIndicator, setShowIndicator] = useState(!props.src);

  const setupImg = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;

    if (img.complete) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      if (showLoadingIndicator)
        setShowIndicator(true);
    }, showLoadingDuration);

    const onLoad = () => {
      clearTimeout(timer);
      setShowIndicator(false);
      setIsLoading(false);
    };

    const onError = () => {
      clearTimeout(timer);
      setShowIndicator(false);
      setIsLoading(false);
    };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);

    return () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      clearTimeout(timer);
    };
  }, [showLoadingDuration, showLoadingIndicator]);

  return (
    <div className={cn('relative overflow-hidden size-full bg-zinc-300 dark:bg-zinc-700', classNames?.wrapper)}>
      {showIndicator && isLoading && (
        <div
          className={cn(
            'absolute inset-0 size-full flex items-center justify-center',
            'animate-in fade-in duration-400'
          )}
        >
          <div className="animate-pulse">
            <svg
              className="size-12 text-zinc-400 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      )}

      {props.src && <img
        {...props}
        ref={setupImg}
        alt={props.alt || 'image'}
        className={cn(
          'object-cover object-center absolute inset-0 size-full',
          'transition-opacity ease-in-out',
          isHiddenImage && !disableHidden && 'blur-xl',
          classNames?.img
        )}
        style={{
          transitionDuration: `${duration}ms`,
          opacity: isLoading ? 0 : 1,
          ...style
        }}
      />}
    </div>
  );
}

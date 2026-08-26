'use client';

import React, { useState } from 'react';

interface SmoothThumbnailProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  aspectRatioClass?: string;
  youtubeId?: string;
}

export const SmoothThumbnail: React.FC<SmoothThumbnailProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
  aspectRatioClass = 'aspect-video',
  youtubeId,
}) => {
  const initialSrc = src || fallbackSrc || '';
  const [errorSrc, setErrorSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const displaySrc = errorSrc || initialSrc;

  const handleError = () => {
    if (youtubeId && displaySrc && !displaySrc.includes('hqdefault')) {
      setErrorSrc(`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`);
    } else if (fallbackSrc && displaySrc !== fallbackSrc) {
      setErrorSrc(fallbackSrc);
    } else {
      setErrorSrc(
        `https://picsum.photos/seed/${encodeURIComponent(alt || youtubeId || 'thumb')}/640/360`
      );
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-200 dark:bg-[#1a1a1a] ${aspectRatioClass}`}>
      {/* Animated Shimmer Skeleton Placeholder */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-[#181818] dark:via-[#252525] dark:to-[#181818] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] transition-opacity duration-700 ${
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />

      {/* Smooth Image with progressive fade-in */}
      {displaySrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displaySrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            isLoaded
              ? 'opacity-100 blur-0 scale-100'
              : 'opacity-0 blur-xs scale-98'
          } ${className}`}
        />
      )}
    </div>
  );
};

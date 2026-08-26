'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Video } from '@/types';
import { ShortsIcon } from '@/components/Icons/ShortsIcon';
import { formatCompactViews } from '@/lib/youtube-views';
import { SmoothThumbnail } from './SmoothThumbnail';

interface ShortsShelfProps {
  shorts: Video[];
}

export const ShortsShelf: React.FC<ShortsShelfProps> = ({ shorts }) => {
  const { setCurrentView, setActiveVideo, fetchShorts } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScrollButtons, 350);
    }
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await fetchShorts(undefined, false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenShort = (short: Video) => {
    setActiveVideo(short);
    setCurrentView('shorts');
  };

  if (!shorts || shorts.length === 0) {
    return null;
  }

  // Display top 10-15 trending shorts in horizontal reel
  const displayShorts = shorts.slice(0, 15);

  return (
    <div id="home-shorts-shelf-container" className="w-full my-4 py-3 border-y border-gray-200 dark:border-[#272727]">
      {/* Header with YouTube Shorts Icon, Title, and Controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-600/10 dark:bg-red-500/15 text-red-600 dark:text-red-500">
            <ShortsIcon className="w-4.5 h-4.5" isActive={true} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Shorts
            </h2>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40">
              Trending Topik
            </span>
          </div>
        </div>

        {/* Action Controls: Refresh & Navigation Chevrons */}
        <div className="flex items-center gap-1.5">
          <button
            id="refresh-home-shorts-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Muat Shorts trending terbaru"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#272727] active:scale-95 transition-all cursor-pointer mr-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-red-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Memuat...' : 'Acak Shorts'}</span>
          </button>

          <button
            id="scroll-shorts-left-btn"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              canScrollLeft
                ? 'border-gray-300 dark:border-[#383838] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#272727] cursor-pointer'
                : 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-30'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            id="scroll-shorts-right-btn"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              canScrollRight
                ? 'border-gray-300 dark:border-[#383838] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#272727] cursor-pointer'
                : 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-30'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of Shorts */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollButtons}
        className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
      >
        {displayShorts.map((short, index) => {
          const viewsFormatted = formatCompactViews(short.views);
          return (
            <div
              key={short.id || `short-${index}`}
              id={`home-short-item-${short.id || index}`}
              onClick={() => handleOpenShort(short)}
              className="group relative shrink-0 w-[150px] sm:w-[175px] md:w-[195px] lg:w-[210px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer snap-start bg-neutral-900 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 select-none"
            >
              {/* Thumbnail Background */}
              <SmoothThumbnail
                src={short.thumbnailUrl}
                alt={short.title}
                aspectRatioClass="aspect-[9/16]"
                youtubeId={short.youtubeId}
                className="transition-transform duration-500 group-hover:scale-105"
              />

              {/* Top gradient for channel tag */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

              {/* Creator pill */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/90 truncate max-w-[130px]">
                  {short.channelTitle || 'Trending Creator'}
                </span>
              </div>

              {/* Bottom gradient for text readability (matches YT mobile & web) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

              {/* Bottom Overlay Info (Title & Penayangan) */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col justify-end text-white">
                <h3
                  className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 text-white group-hover:text-red-400 transition-colors drop-shadow-md mb-1"
                  title={short.title}
                >
                  {short.title}
                </h3>
                <p className="text-[11px] font-medium text-neutral-300/90">
                  {viewsFormatted} penayangan
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Video } from '@/types';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  Music2,
  CheckCircle2,
  Flame,
  RefreshCw,
  Heart,
} from 'lucide-react';
import Image from 'next/image';
import { ShortsCommentsModal } from './ShortsCommentsModal';

const TRENDING_QUERIES = [
  '#shorts viral trending',
  '#shorts fyp viral 2026',
  '#shorts trending indonesia',
  '#shorts tiktok viral trending',
  '#shorts popular trending',
];

export const ShortsView: React.FC = () => {
  const {
    shorts,
    activeVideo,
    fetchShorts,
    likedVideoIds,
    toggleLikeVideo,
    dislikedVideoIds,
    toggleDislikeVideo,
    subscribedChannelIds,
    toggleSubscribe,
    setShareModalVideo,
    openChannel,
  } = useApp();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeCommentsShort, setActiveCommentsShort] = useState<Video | null>(null);
  const [expandedDescriptionIndex, setExpandedDescriptionIndex] = useState<number | null>(null);
  const [showPlayStateFeedback, setShowPlayStateFeedback] = useState<boolean>(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ id: string; key: number } | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isAutoFetchingRef = useRef<boolean>(false);
  const queryRotationIndexRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastTapTimeRef = useRef<number>(0);

  // Keep itemRefs in sync with shorts length
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, shorts.length);
  }, [shorts.length]);

  // Simulate smooth progress bar for active short
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const approxDurationMs = 25000;
    const intervalTime = 200;
    const step = (intervalTime / approxDurationMs) * 100;

    const interval = setInterval(() => {
      setProgressPercentage((prev) => (prev >= 100 ? 0 : prev + step));
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [activeIndex, isPlaying]);

  // Handle intersection observer to detect which short is in focus
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
              setIsPlaying(true);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [shorts]);

  // Auto-fetch more shorts when near end of list
  useEffect(() => {
    if (activeIndex >= shorts.length - 3 && shorts.length > 0 && !isAutoFetchingRef.current) {
      isAutoFetchingRef.current = true;
      const nextQuery = TRENDING_QUERIES[queryRotationIndexRef.current % TRENDING_QUERIES.length];
      queryRotationIndexRef.current += 1;

      fetchShorts(nextQuery, true).finally(() => {
        setTimeout(() => {
          isAutoFetchingRef.current = false;
        }, 800);
      });
    }
  }, [activeIndex, shorts.length, fetchShorts]);

  // Scroll to index helper
  const scrollToIndex = useCallback((index: number) => {
    const target = itemRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleNext = useCallback(() => {
    if (activeIndex < shorts.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  }, [activeIndex, shorts.length, scrollToIndex]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  }, [activeIndex, scrollToIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Initial select or scroll to active video
  useEffect(() => {
    if (activeVideo && shorts.length > 0) {
      const idx = shorts.findIndex(
        (s) => s.id === activeVideo.id || (s.youtubeId && s.youtubeId === activeVideo.youtubeId)
      );
      if (idx !== -1) {
        scrollToIndex(idx);
      }
    }
  }, [activeVideo, shorts, scrollToIndex]);

  // Initial fetch if empty
  useEffect(() => {
    if (shorts.length === 0) {
      fetchShorts(undefined, false);
    }
  }, [fetchShorts, shorts.length]);

  const handleRefreshShorts = async () => {
    setIsRefreshing(true);
    try {
      await fetchShorts(undefined, false);
      setActiveIndex(0);
      scrollToIndex(0);
    } finally {
      setIsRefreshing(false);
    }
  };

  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVideoTap = (short: Video, e: React.MouseEvent) => {
    const clickTime = e.timeStamp;
    const DOUBLE_TAP_THRESHOLD = 280;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (clickTime - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD && lastTapTimeRef.current !== 0) {
      // Double Tap triggered -> Like video
      if (!likedVideoIds.includes(short.id)) {
        toggleLikeVideo(short.id, short);
      }
      setDoubleTapHeart({ id: short.id, key: Math.floor(clickTime) });
      setTimeout(() => setDoubleTapHeart(null), 900);
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = clickTime;
      tapTimeoutRef.current = setTimeout(() => {
        setIsPlaying((prev) => {
          const next = !prev;
          setShowPlayStateFeedback(true);
          setTimeout(() => setShowPlayStateFeedback(false), 700);
          return next;
        });
        lastTapTimeRef.current = 0;
      }, DOUBLE_TAP_THRESHOLD);
    }
  };

  const formatCount = (count: number): string => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem-3.25rem)] md:h-[calc(100dvh-3.5rem)] bg-black flex items-center justify-center overflow-hidden select-none">
      {/* Top Floating Controls: Trending FYP Pill & Refresh Button */}
      <div className="absolute top-3 left-3 sm:left-6 z-30 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
          <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
          <span className="hidden sm:inline">Shorts FYP</span>
        </div>
        <button
          id="refresh-shorts-btn"
          onClick={handleRefreshShorts}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 backdrop-blur-md border border-white/10 text-white text-xs font-medium shadow-lg transition-all cursor-pointer"
          title="Muat rekomendasi shorts baru"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">{isRefreshing ? 'Memuat...' : 'Acak Shorts'}</span>
        </button>
      </div>

      {/* Top Right Sound Toggle */}
      <div className="absolute top-3 right-3 sm:right-6 z-30 pointer-events-auto">
        <button
          id="shorts-global-mute-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted((prev) => !prev);
          }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-90 border border-white/10 shadow-lg cursor-pointer"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {shorts.length === 0 ? (
        <div className="w-full max-w-[420px] h-full sm:h-[88vh] sm:rounded-2xl bg-neutral-900 flex flex-col items-center justify-center p-6 text-center animate-pulse shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-red-500 animate-bounce" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Memuat YouTube Shorts...</h3>
          <p className="text-neutral-400 text-xs max-w-xs">
            Mengambil video Shorts terbaru yang viral untuk Anda.
          </p>
        </div>
      ) : (
        /* Vertical Snap Feed Container */
        <div
          ref={containerRef}
          id="shorts-vertical-feed"
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none flex flex-col items-center"
        >
          {shorts.map((short, index) => {
            const isActive = index === activeIndex;
            const isLiked = likedVideoIds.includes(short.id);
            const isDisliked = dislikedVideoIds.includes(short.id);
            const isSubscribed = subscribedChannelIds.includes(short.channelId);

            return (
              <div
                key={`${short.id}-${index}`}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                data-index={index}
                className="w-full h-full shrink-0 snap-start snap-always flex items-center justify-center relative p-0 md:py-3"
              >
                {/* 
                  Authentic YouTube Shorts Player Frame:
                  - On Mobile (<768px): 100% full width and height edge-to-edge, no side borders, no gaps.
                  - On Desktop (md+): Centered 9:16 aspect ratio box with smooth rounded corners and shadow.
                */}
                <div className="relative w-full h-full md:w-[calc((100vh-6rem)*9/16)] md:max-w-[440px] md:h-[calc(100vh-6rem)] md:max-h-[820px] md:rounded-2xl overflow-hidden bg-black flex items-center justify-center group shadow-2xl">
                  {/* Video Screen Tap Area */}
                  <div
                    className="relative w-full h-full cursor-pointer overflow-hidden flex items-center justify-center bg-black"
                    onClick={(e) => handleVideoTap(short, e)}
                  >
                    {isActive ? (
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {isPlaying ? (
                          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                            <iframe
                              src={`https://www.youtube.com/embed/${short.youtubeId}?autoplay=1&mute=${
                                isMuted ? 1 : 0
                              }&loop=1&playlist=${short.youtubeId}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1`}
                              title={short.title}
                              className="w-full h-full scale-[1.38] md:scale-[1.34] object-cover pointer-events-none origin-center"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <Image
                              src={short.thumbnailUrl}
                              alt={short.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 440px"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl">
                                <Play className="w-8 h-8 fill-white translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Animated Play/Pause feedback popup */}
                        {showPlayStateFeedback && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                            <div className="w-18 h-18 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 animate-in zoom-in-75 fade-in duration-150">
                              {isPlaying ? (
                                <Play className="w-9 h-9 fill-white translate-x-0.5" />
                              ) : (
                                <Pause className="w-9 h-9 fill-white" />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Double tap glowing heart animation */}
                        {doubleTapHeart?.id === short.id && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                            <div className="text-red-500 animate-in zoom-in-50 fade-in duration-200">
                              <Heart className="w-24 h-24 fill-red-500 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] scale-110" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={short.thumbnailUrl}
                          alt={short.title}
                          className="w-full h-full object-cover brightness-90"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (short.youtubeId && !target.src.includes('hqdefault')) {
                              target.src = `https://i.ytimg.com/vi/${short.youtubeId}/hqdefault.jpg`;
                            } else {
                              target.src = `https://picsum.photos/seed/${encodeURIComponent(short.title || short.id)}/480/854`;
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 
                    Right Floating Action Bar (Authentic YouTube Shorts):
                    Like, Dislike, Comments, Share, Remix/Disc
                  */}
                  <div className="absolute right-2.5 sm:right-3.5 bottom-12 sm:bottom-14 z-30 flex flex-col items-center gap-4 text-white pointer-events-auto">
                    {/* Like Button */}
                    <div className="flex flex-col items-center">
                      <button
                        id={`short-like-btn-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeVideo(short.id, short);
                        }}
                        aria-label="Suka short"
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-85 shadow-lg border border-white/10 ${
                          isLiked
                            ? 'bg-red-600 text-white shadow-red-600/40'
                            : 'bg-black/50 hover:bg-black/70 text-white'
                        }`}
                      >
                        <ThumbsUp className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-[11px] font-bold mt-1 text-white drop-shadow-md tracking-tight">
                        {formatCount(short.likes + (isLiked ? 1 : 0))}
                      </span>
                    </div>

                    {/* Dislike Button */}
                    <div className="flex flex-col items-center">
                      <button
                        id={`short-dislike-btn-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDislikeVideo(short.id);
                        }}
                        aria-label="Tidak suka short"
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-85 shadow-lg border border-white/10 ${
                          isDisliked
                            ? 'bg-neutral-800 text-red-400'
                            : 'bg-black/50 hover:bg-black/70 text-white'
                        }`}
                      >
                        <ThumbsDown className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${isDisliked ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-[10px] font-semibold mt-1 text-white/90 drop-shadow-md">
                        Tidak suka
                      </span>
                    </div>

                    {/* Comments Button */}
                    <div className="flex flex-col items-center">
                      <button
                        id={`short-comments-btn-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCommentsShort(short);
                        }}
                        aria-label="Buka komentar"
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center transition-all active:scale-85 shadow-lg border border-white/10 text-white"
                      >
                        <MessageSquare className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </button>
                      <span className="text-[11px] font-bold mt-1 text-white drop-shadow-md tracking-tight">
                        {formatCount(short.commentsCount || 18)}
                      </span>
                    </div>

                    {/* Share Button */}
                    <div className="flex flex-col items-center">
                      <button
                        id={`short-share-btn-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalVideo(short);
                        }}
                        aria-label="Bagikan short"
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center transition-all active:scale-85 shadow-lg border border-white/10 text-white"
                      >
                        <Share2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </button>
                      <span className="text-[10px] font-semibold mt-1 text-white/90 drop-shadow-md">
                        Bagikan
                      </span>
                    </div>

                    {/* Spinning Audio Track Vinyl Disc */}
                    <div className="mt-1 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700 p-0.5 border-2 border-white/40 shadow-xl ${
                          isPlaying && isActive ? 'animate-spin' : ''
                        }`}
                        style={{ animationDuration: '4s' }}
                      >
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={short.channelAvatar}
                            alt="Sound track avatar"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(short.channelTitle || 'YT')}`;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 
                    Bottom Video Metadata Overlay (Authentic YouTube Shorts):
                    Channel Info, Subscribe Pill, Title/Hashtags, Audio Track, and Red Progress Bar
                  */}
                  <div className="absolute inset-x-0 bottom-0 z-20 pt-20 pb-3 px-3.5 sm:px-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white pointer-events-none">
                    {/* Channel Row */}
                    <div className="flex items-center gap-2.5 mb-2 pointer-events-auto">
                      <div
                        className="relative w-9 h-9 rounded-full overflow-hidden border border-white/50 shrink-0 cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          openChannel(short.channelTitle, short.channelAvatar);
                        }}
                        title={`Kunjungi channel ${short.channelTitle}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={short.channelAvatar}
                          alt={short.channelTitle}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(short.channelTitle || 'creator')}/100/100`;
                          }}
                        />
                      </div>

                      <div
                        className="flex items-center gap-1.5 min-w-0 cursor-pointer group/chan"
                        onClick={(e) => {
                          e.stopPropagation();
                          openChannel(short.channelTitle, short.channelAvatar);
                        }}
                      >
                        <span className="font-bold text-sm text-white truncate drop-shadow-md group-hover/chan:underline">
                          @{short.channelTitle.toLowerCase().replace(/\s+/g, '')}
                        </span>
                        {short.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white/90 fill-white/20 shrink-0" />
                        )}
                      </div>

                      {/* Subscribe Button */}
                      <button
                        id={`short-subscribe-btn-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubscribe(short.channelId);
                        }}
                        className={`ml-1 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all active:scale-95 shadow-md cursor-pointer ${
                          isSubscribed
                            ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20'
                            : 'bg-white hover:bg-neutral-100 text-black'
                        }`}
                      >
                        {isSubscribed ? 'Disubscribe' : 'Subscribe'}
                      </button>
                    </div>

                    {/* Title & Expandable Caption */}
                    <div className="pr-14 pointer-events-auto">
                      <p
                        onClick={() =>
                          setExpandedDescriptionIndex((prev) =>
                            prev === index ? null : index
                          )
                        }
                        className={`text-xs sm:text-sm text-white font-normal drop-shadow-md leading-relaxed cursor-pointer ${
                          expandedDescriptionIndex === index ? '' : 'line-clamp-2'
                        }`}
                      >
                        {short.title}{' '}
                        {short.tags && short.tags.length > 0 && (
                          <span className="text-blue-300 font-medium">
                            {short.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Audio Marquee Ticker */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-white/90 font-medium pointer-events-auto pr-14">
                      <Music2 className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
                      <div className="overflow-hidden whitespace-nowrap w-full">
                        <span className="inline-block truncate">
                          Suara asli - {short.channelTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Red Playback Progress Bar at the very bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/20 z-30 overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300 ease-linear"
                      style={{ width: `${isActive && isPlaying ? progressPercentage : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Desktop Up & Down Navigation Chevrons */}
      <div className="hidden md:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-30">
        <button
          id="shorts-nav-prev-btn"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous short"
          className="w-11 h-11 rounded-full bg-neutral-900/80 hover:bg-neutral-800 disabled:opacity-25 backdrop-blur-md text-white flex items-center justify-center border border-neutral-700 shadow-2xl transition-transform active:scale-90 cursor-pointer"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <button
          id="shorts-nav-next-btn"
          onClick={handleNext}
          disabled={activeIndex === shorts.length - 1}
          aria-label="Next short"
          className="w-11 h-11 rounded-full bg-neutral-900/80 hover:bg-neutral-800 disabled:opacity-25 backdrop-blur-md text-white flex items-center justify-center border border-neutral-700 shadow-2xl transition-transform active:scale-90 cursor-pointer"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Sliding Comments Modal */}
      {activeCommentsShort && (
        <ShortsCommentsModal
          short={activeCommentsShort}
          isOpen={Boolean(activeCommentsShort)}
          onClose={() => setActiveCommentsShort(null)}
        />
      )}
    </div>
  );
};

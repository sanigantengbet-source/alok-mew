'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Mic,
  Video as VideoPlus,
  Bell,
  Grid,
  Moon,
  Sun,
  Settings,
  X,
  PlaySquare,
  Sparkles,
  ExternalLink,
  Radio,
  CheckCircle2,
  Tv,
  Music,
  Compass,
  ArrowLeft,
  Clock,
  Trash2,
  Check,
  Flame,
  Smartphone,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { NextTubeLogo } from './NextTubeLogo';
import { SmoothThumbnail } from '@/components/Feed/SmoothThumbnail';

export const Navbar: React.FC = () => {
  const {
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    searchHistory,
    addSearchHistory,
    removeSearchHistory,
    clearSearchHistory,
    setSelectedCategory,
    setCurrentView,
    activeVideo,
    setActiveVideo,
    setIsVoiceModalOpen,
    setIsUploadModalOpen,
    user,
    signOut,
    setIsLoginModalOpen,
    isDarkMode,
    toggleDarkMode,
    isMobileSearchOpen,
    setIsMobileSearchOpen,
    notifications,
    unreadNotificationCount,
    markNotificationsAsRead,
    markNotificationAsRead,
    removeNotification,
    clearAllNotifications,
    subscribedChannelIds,
    playVideoById,
  } = useApp();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const appsMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Fetch live YouTube suggestions as user types
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      const resetTimer = setTimeout(() => setLiveSuggestions([]), 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(() => {
      fetch(`/api/youtube/suggest?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.suggestions)) {
            setLiveSuggestions(data.suggestions);
          }
        })
        .catch(() => {});
    }, 180);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Clear search input if query was reset to empty
  useEffect(() => {
    if (!searchQuery) {
      const timer = setTimeout(() => setSearchInput(''), 0);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Focus mobile input when mobile search is opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (appsMenuRef.current && !appsMenuRef.current.contains(e.target as Node)) {
        setIsAppsMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addSearchHistory(trimmed);
    setSearchQuery(trimmed);
    setSelectedCategory('All');
    setCurrentView('home');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setSearchQuery('');
    setSearchInput('');
    setSelectedCategory('All');
  };

  // Determine list items to show:
  // If searchInput has text, show live suggestions from YouTube.
  // When searchInput is empty, show user's authentic search history only.
  const displayedItems = searchInput.trim().length > 0
    ? liveSuggestions
    : searchHistory;

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#272727] px-2 sm:px-4 flex items-center justify-between transition-colors">
      {/* MOBILE SEARCH OVERLAY (Full-width on small screens, exactly matching user screenshot design) */}
      {isMobileSearchOpen ? (
        <div className="md:hidden absolute inset-0 z-50 bg-[#0f0f0f] text-white flex flex-col h-screen animate-in fade-in duration-150 shadow-md">
          <div className="flex items-center px-3 gap-2 h-14 border-b border-[#222]">
            <button
              id="mobile-search-back-btn"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Back"
              className="p-2 rounded-full hover:bg-[#222] text-white shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center">
              <div className="flex items-center flex-1 h-10 px-3 bg-[#1e1e1e] rounded-full border border-[#333]">
                <input
                  ref={mobileInputRef}
                  id="navbar-mobile-search-input"
                  type="text"
                  placeholder="Search any YouTube video..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    id="navbar-clear-mobile-search-btn"
                    onClick={handleClearSearch}
                    className="p-1 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            <button
              id="navbar-mobile-voice-search-btn"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setIsVoiceModalOpen(true);
              }}
              aria-label="Search with voice"
              className="p-2.5 rounded-full bg-[#1e1e1e] text-white hover:bg-[#2a2a2a] shrink-0 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Search History / Live Suggestions List */}
          <div className="flex-1 overflow-y-auto py-1">
            {searchInput.trim().length === 0 && searchHistory.length > 0 && (
              <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-400">
                <span className="font-medium">Recent Searches</span>
                <button
                  type="button"
                  onClick={clearSearchHistory}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {searchInput.trim().length === 0 && searchHistory.length === 0 && (
              <div className="py-16 px-4 text-center text-gray-500">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-600 opacity-60" />
                <p className="text-sm font-medium text-gray-400">No recent searches</p>
                <p className="text-xs text-gray-500 mt-1">Search history will appear here once you search</p>
              </div>
            )}

            {displayedItems.map((item, idx) => {
              const isHistoryItem = searchInput.trim().length === 0;
              return (
                <div
                  key={`mob-sug-${idx}`}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1f1f1f] text-sm text-gray-200 transition-colors border-b border-[#181818]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput(item);
                      executeSearch(item);
                    }}
                    className="flex-1 flex items-center gap-4 text-left truncate cursor-pointer"
                  >
                    {isHistoryItem ? (
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate text-white font-normal">{item}</span>
                  </button>

                  {isHistoryItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchHistory(item);
                      }}
                      title="Remove from history"
                      className="p-1 text-gray-500 hover:text-gray-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* LEFT: Menu button & NextTube Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="navbar-sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition-colors touch-manipulation cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          id="navbar-logo-btn"
          onClick={handleGoHome}
          className="flex items-center group select-none touch-manipulation focus:outline-hidden cursor-pointer"
          aria-label="NextTube Home"
        >
          <NextTubeLogo size="md" />
        </button>
      </div>

      {/* MIDDLE: Search Bar & Voice Search (Desktop/Tablet) */}
      <div
        ref={searchContainerRef}
        className="relative max-w-2xl w-full mx-4 hidden md:flex items-center justify-center"
      >
        <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-xl">
          <div
            className={`flex items-center flex-1 h-10 px-3 bg-gray-50 dark:bg-[#121212] border ${
              isSearchFocused
                ? 'border-blue-600 dark:border-blue-500 shadow-inner'
                : 'border-gray-300 dark:border-[#303030]'
            } rounded-l-full transition-all`}
          >
            {isSearchFocused && (
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0 animate-in fade-in" />
            )}
            <input
              id="navbar-search-input"
              type="text"
              placeholder="Search videos, tutorials, channels..."
              value={searchInput}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                id="navbar-clear-search-btn"
                onClick={handleClearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            id="navbar-search-submit-btn"
            aria-label="Search"
            className="h-10 px-6 bg-gray-100 dark:bg-[#222222] border border-l-0 border-gray-300 dark:border-[#303030] rounded-r-full hover:bg-gray-200 dark:hover:bg-[#2c2c2c] text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Voice Search Button */}
        <button
          id="navbar-voice-search-btn"
          onClick={() => setIsVoiceModalOpen(true)}
          aria-label="Search with voice"
          className="ml-2.5 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#222222] dark:hover:bg-[#2c2c2c] text-gray-700 dark:text-gray-200 transition-colors shrink-0 cursor-pointer"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Search Recommendations / History Dropdown */}
        {isSearchFocused && displayedItems.length > 0 && (
          <div className="absolute top-12 left-0 right-14 bg-white dark:bg-[#212121] rounded-2xl shadow-xl border border-gray-200 dark:border-[#383838] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {searchInput.trim().length > 0
                  ? 'YouTube Suggestions'
                  : 'Recent Searches'}
              </span>
              {searchInput.trim().length === 0 && searchHistory.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearSearchHistory();
                  }}
                  className="text-[11px] text-red-500 hover:text-red-600 font-medium cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {displayedItems.map((item, idx) => {
              const isHistoryItem = searchInput.trim().length === 0;
              return (
                <div
                  key={`desk-sug-${idx}`}
                  className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#303030] flex items-center justify-between text-sm text-gray-800 dark:text-gray-200 transition-colors group"
                >
                  <button
                    id={`search-rec-${item.replace(/\s+/g, '-').toLowerCase()}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchInput(item);
                      executeSearch(item);
                    }}
                    className="flex-1 flex items-center gap-3 text-left truncate cursor-pointer"
                  >
                    {isHistoryItem ? (
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">{item}</span>
                  </button>

                  {isHistoryItem && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeSearchHistory(item);
                      }}
                      title="Remove from history"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Action Icons & User Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile Search Toggle */}
        <button
          id="navbar-mobile-search-toggle"
          onClick={() => setIsMobileSearchOpen(true)}
          aria-label="Open Search"
          className="md:hidden p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 touch-manipulation cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Create / Upload Video (Desktop) */}
        <button
          id="navbar-create-video-btn"
          onClick={() => {
            if (!user) {
              setIsLoginModalOpen(true);
            } else {
              setIsUploadModalOpen(true);
            }
          }}
          title="Create or Upload Video"
          className="hidden sm:flex p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition-colors relative items-center cursor-pointer"
        >
          <VideoPlus className="w-5 h-5" />
        </button>

        {/* NextTube Apps Grid Menu (Desktop) */}
        <div ref={appsMenuRef} className="relative hidden lg:block">
          <button
            id="navbar-apps-menu-btn"
            onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
            title="NextTube Apps"
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
          >
            <Grid className="w-5 h-5" />
          </button>

          {isAppsMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#212121] rounded-2xl shadow-xl border border-gray-200 dark:border-[#383838] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-[#2d2d2d]">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">NextTube Services</p>
              </div>
              <div className="py-1">
                {[
                  { name: 'NextTube Studio', icon: PlaySquare, color: 'text-red-600' },
                  { name: 'NextTube Music', icon: Music, color: 'text-red-500' },
                  { name: 'NextTube TV', icon: Tv, color: 'text-red-600' },
                  { name: 'NextTube AI Copilot', icon: Sparkles, color: 'text-purple-500' },
                ].map((item) => (
                  <button
                    key={item.name}
                    id={`app-item-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setIsAppsMenuOpen(false)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#303030] transition-colors cursor-pointer"
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div ref={notificationsRef} className="relative">
          <button
            id="navbar-notifications-btn"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            title="Notifikasi Channel Disubscribe"
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition-colors relative touch-manipulation cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-[#212121] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#383838] py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#303030] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    Notifikasi
                  </span>
                  {unreadNotificationCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                      {unreadNotificationCount} baru
                    </span>
                  ) : notifications.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-[#303030] text-gray-600 dark:text-gray-400">
                      {notifications.length}
                    </span>
                  ) : null}
                </div>

                {notifications.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      id="notif-mark-all-read-btn"
                      onClick={markNotificationsAsRead}
                      title="Tandai semua sudah dibaca"
                      className="p-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Dibaca</span>
                    </button>
                    <button
                      id="notif-clear-all-btn"
                      onClick={clearAllNotifications}
                      title="Hapus semua notifikasi"
                      className="p-1 text-xs text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-[#282828] scrollbar-none">
                {notifications.length === 0 ? (
                  <div className="px-6 py-10 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3">
                      <Bell className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Belum Ada Notifikasi
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[240px] mb-4">
                      Notifikasi akan otomatis muncul saat channel yang kamu subscribe mengupload video atau VT (Shorts) baru.
                    </p>
                    <button
                      id="notif-explore-subs-btn"
                      onClick={() => {
                        setCurrentView('subscriptions');
                        setIsNotificationsOpen(false);
                      }}
                      className="px-4 py-1.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Jelajahi Subscriptions
                    </button>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      id={`notif-item-${notif.id}`}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.videoId) {
                          playVideoById(notif.videoId);
                        }
                        setIsNotificationsOpen(false);
                      }}
                      className={`group w-full p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-left transition-colors cursor-pointer relative ${
                        !notif.isRead ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={notif.channelAvatar}
                          alt={notif.channelName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-[#333]"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(notif.channelName || 'YT')}`;
                          }}
                        />
                        {!notif.isRead && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-[#212121]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                            {notif.channelName}
                          </span>
                          {notif.type === 'shorts' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 uppercase tracking-wide">
                              VT Baru
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300">
                              Video
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {notif.title}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {notif.timeAgo}
                          </span>
                        </div>
                      </div>

                      {/* Video Thumbnail */}
                      {notif.thumbnail && (
                        <div className="w-16 h-10 rounded-md overflow-hidden shrink-0 bg-neutral-900 border border-gray-100 dark:border-[#303030]">
                          <SmoothThumbnail
                            src={notif.thumbnail}
                            alt="Video Thumbnail"
                            aspectRatioClass="aspect-video"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Single Dismiss Button */}
                      <button
                        id={`dismiss-notif-${notif.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                        title="Hapus notifikasi"
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-200 dark:hover:bg-[#383838] transition-all absolute top-2 right-2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button
          id="navbar-theme-toggle-btn"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Beralih ke Tema Terang (Light Mode)' : 'Beralih ke Tema Gelap (Dark Mode)'}
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition-all touch-manipulation cursor-pointer group active:scale-95"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Settings Button */}
        <button
          id="navbar-settings-btn"
          onClick={() => {
            setCurrentView('settings');
            setActiveVideo(null);
          }}
          title="Pengaturan & SponsorBlock"
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] text-gray-700 dark:text-gray-200 transition-colors touch-manipulation cursor-pointer"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

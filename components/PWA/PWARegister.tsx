'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';

export const PWARegister = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });
  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
  });

  const triggerNativeInstall = useCallback(async (promptToUse?: any) => {
    const prompt = promptToUse || deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt);
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).__pwaDeferredPrompt = null;
      }
    } else {
      setShowInstallModal(true);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('NextTube PWA ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('NextTube PWA ServiceWorker registration failed:', error);
          });
      });
    }

    // Capture native beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__pwaDeferredPrompt = e;
      
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!isStandalone && !dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for custom install requests (from Sidebar, Settings, etc.)
    const handleOpenInstall = () => {
      if ((window as any).__pwaDeferredPrompt) {
        triggerNativeInstall((window as any).__pwaDeferredPrompt);
      } else {
        setShowInstallModal(true);
      }
    };

    window.addEventListener('open-pwa-install', handleOpenInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, [isStandalone, triggerNativeInstall]);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    }
  };


  return (
    <>
      {/* 1. FLOATING INSTALL BANNER */}
      {!isStandalone && showInstallBanner && (
        <div
          id="pwa-install-banner"
          className="fixed bottom-20 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-50 max-w-sm bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-gray-200 dark:border-[#383838] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="NextTube Logo"
              className="w-9 h-9 rounded-xl shadow-xs shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">Install NextTube App</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Fast, lightweight &amp; ad-free player</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="pwa-banner-install-btn"
              onClick={() => triggerNativeInstall()}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              id="pwa-banner-close-btn"
              onClick={dismissBanner}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. COMPREHENSIVE PWA INSTALLATION MODAL / GUIDE */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#383838] rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#2d2d2d]">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="NextTube" className="w-10 h-10 rounded-2xl shadow-sm object-contain" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Install NextTube</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Progressive Web App (PWA)</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-[#2c2c2c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 space-y-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Nikmati NextTube seperti aplikasi native tanpa iklan dan tanpa boros kuota:
              </p>

              <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-[#282828]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dukungan Picture-in-Picture &amp; Pemutar Pop-up</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-[#282828]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>SponsorBlock &amp; DeArrow Thumbnail Terintegrasi</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-[#282828]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Akses Cepat Langsung dari Layar Utama HP / Desktop</span>
                </div>
              </div>

              {/* Instructions based on platform */}
              {isIOS ? (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Cara Install di iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>
                      Ketuk tombol <span className="font-semibold inline-flex items-center gap-1 bg-white/70 dark:bg-black/40 px-1 rounded"><Share className="w-3 h-3" /> Share</span> di menu browser Safari.
                    </li>
                    <li>
                      Gulir ke bawah dan pilih <span className="font-semibold inline-flex items-center gap-1 bg-white/70 dark:bg-black/40 px-1 rounded"><PlusSquare className="w-3 h-3" /> Tambahkan ke Layar Utama (Add to Home Screen)</span>.
                    </li>
                    <li>Ketuk <b>Tambah (Add)</b> di sudut kanan atas.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-3.5 bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-xs">
                    <Laptop className="w-4 h-4 text-red-500" />
                    <span>Cara Install di Android / Chrome / Windows / Mac:</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Klik tombol <b>Install Sekarang</b> di bawah ini, atau buka menu browser (titik 3 di kanan atas) &gt; pilih <b>&quot;Install NextTube&quot;</b> / <b>&quot;Tambahkan ke Layar Utama&quot;</b>.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#2d2d2d]">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-[#282828] transition-colors"
              >
                Tutup
              </button>
              {(!isIOS && (deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwaDeferredPrompt))) && (
                <button
                  onClick={() => triggerNativeInstall()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


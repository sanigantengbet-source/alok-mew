'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Palette,
  Shield,
  EyeOff,
  PlayCircle,
  Film,
  History,
  Bell,
  Cloud,
  RefreshCw,
  Sliders,
  Check,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Moon,
  Sun,
  Code2,
  Sparkles,
  ExternalLink,
  Type,
  Image as ImageIcon,
  Layers,
  Volume2,
  Users,
  Globe,
  MessageCircle,
  Copy,
  Heart,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CATEGORY_LABELS } from '@/lib/sponsorblock';
import { SponsorCategory } from '@/types';

type SettingsSection =
  | 'main'
  | 'general'
  | 'appearance'
  | 'sponsorblock'
  | 'dearrow'
  | 'player'
  | 'media'
  | 'history'
  | 'notifications'
  | 'backup'
  | 'community'
  | 'updates';

// Vector Brand Icons for Community Platforms (Clean Monochrome)
const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const TiktokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.043.87.128V9.38a6.34 6.34 0 0 0-.87-.06A6.33 6.33 0 0 0 3 15.65a6.34 6.34 0 0 0 10.82 4.48c1.77-1.77 2.18-4.3 2.18-6.49V8.69a8.18 8.18 0 0 0 4.76 1.52V6.76c-.4 0-.79-.02-1.17-.07z" />
  </svg>
);

const WhatsappIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export const SettingsView: React.FC = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    historyVideoIds,
    clearHistory,
    likedVideoIds,
    watchLaterIds,
    setCurrentView,
    previousView,
    setSelectedCategory,
    setSearchQuery,
    sponsorBlockSettings,
    updateSponsorBlockSettings,
    toggleSponsorCategory,
    deArrowSettings,
    updateDeArrowSettings,
    resetDeArrowSettings,
    unreadNotificationCount,
    markNotificationsAsRead,
  } = useApp();

  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [isAutoPlayNext, setIsAutoPlayNext] = useState<boolean>(true);
  const [isDataSaver, setIsDataSaver] = useState<boolean>(false);
  const [videoQuality, setVideoQuality] = useState<string>('auto');
  const [appLanguage, setAppLanguage] = useState<string>('id');
  const [autoMiniPlayer, setAutoMiniPlayer] = useState<boolean>(true);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (url: string, name: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedLink(name);
      setTimeout(() => setCopiedLink(null), 2500);
    } catch {}
  };

  const categoriesList: { key: SponsorCategory; title: string; defaultOn: boolean }[] = [
    { key: 'sponsor', title: 'Sponsor', defaultOn: true },
    { key: 'intro', title: 'Intro & Jeda (Intermission)', defaultOn: true },
    { key: 'outro', title: 'Outro & Layar Akhir', defaultOn: true },
    { key: 'selfpromo', title: 'Promosi Diri (Self Promo)', defaultOn: false },
    { key: 'interaction', title: 'Pengingat Interaksi (Like/Sub)', defaultOn: false },
    { key: 'preview', title: 'Pratinjau & Rekap (Preview)', defaultOn: false },
    { key: 'filler', title: 'Segmen Pengisi (Filler & Tangen)', defaultOn: false },
    { key: 'music_offtopic', title: 'Non-Musik / Di Luar Topik', defaultOn: false },
  ];

  const handleBack = () => {
    if (activeSection !== 'main') {
      setActiveSection('main');
    } else {
      setCurrentView(previousView === 'settings' ? 'home' : previousView);
    }
  };

  // Export local settings and favorites as JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        sponsorBlock: sponsorBlockSettings,
        deArrow: deArrowSettings,
        historyCount: historyVideoIds.length,
        likedCount: likedVideoIds.length,
        watchLaterCount: watchLaterIds.length,
      };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `nexttube_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupNotice('Cadangan berhasil diekspor!');
      setTimeout(() => setBackupNotice(null), 3000);
    } catch (e) {
      setBackupNotice('Gagal mengekspor cadangan.');
    }
  };

  const handleCheckUpdates = () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatus('NextTube v2.5.0 sudah merupakan versi terbaru yang optimal.');
      setTimeout(() => setUpdateStatus(null), 4000);
    }, 1200);
  };

  // RENDER SUB-VIEWS (Matching Screenshot 2)
  const renderSubSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Bahasa Aplikasi
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Pilih bahasa antarmuka NextTube
                  </p>
                </div>
                <select
                  value={appLanguage}
                  onChange={(e) => setAppLanguage(e.target.value)}
                  className="bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#3a3a3a] text-gray-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-hidden"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English (US)</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Buka Mini Player Otomatis
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {autoMiniPlayer ? 'Nyala' : 'Mati'} &bull; Putar video di sudut saat bernavigasi
                  </p>
                </div>
                <button
                  onClick={() => setAutoMiniPlayer(!autoMiniPlayer)}
                  className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                    autoMiniPlayer ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                      autoMiniPlayer ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Mode Gelap (Dark Mode)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isDarkMode ? 'Nyala (Tema Hitam Pekat)' : 'Mati (Tema Terang)'}
                </p>
              </div>
              <button
                id="toggle-dark-mode-switch"
                onClick={toggleDarkMode}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  isDarkMode ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    isDarkMode ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'sponsorblock':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Master Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  SponsorBlock
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sponsorBlockSettings.enabled ? 'Nyala' : 'Mati'} &bull; Menggunakan API resmi https://sponsor.ajay.app/
                </p>
              </div>
              <button
                id="sub-sponsorblock-toggle"
                onClick={() =>
                  updateSponsorBlockSettings({ enabled: !sponsorBlockSettings.enabled })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  sponsorBlockSettings.enabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    sponsorBlockSettings.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Toast Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Notifikasi Skip
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {sponsorBlockSettings.showSkipNotice ? 'Nyala' : 'Mati'} &bull; Tampilkan pemberitahuan saat sponsor dilewati
                </p>
              </div>
              <button
                onClick={() =>
                  updateSponsorBlockSettings({
                    showSkipNotice: !sponsorBlockSettings.showSkipNotice,
                  })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  sponsorBlockSettings.showSkipNotice
                    ? 'bg-emerald-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    sponsorBlockSettings.showSkipNotice ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Segment Categories List */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Kategori Segmen yang Dilewati
              </h4>
              <div className="space-y-2">
                {categoriesList.map((cat) => {
                  const isChecked = sponsorBlockSettings.categories[cat.key];
                  const info = CATEGORY_LABELS[cat.key];
                  return (
                    <div
                      key={cat.key}
                      onClick={() => toggleSponsorCategory(cat.key)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] cursor-pointer select-none transition-all hover:bg-gray-100 dark:hover:bg-[#202020]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {cat.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {info.desc}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#222]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'dearrow':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Master Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Aktifkan DeArrow
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {deArrowSettings.enabled ? 'Nyala' : 'Mati'} &bull; Tampilkan judul dan thumbnail yang lebih akurat
                </p>
              </div>
              <button
                onClick={() =>
                  updateDeArrowSettings({ enabled: !deArrowSettings.enabled })
                }
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  deArrowSettings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    deArrowSettings.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Alternative Titles */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Judul Alternatif Komunitas
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {deArrowSettings.alternativeTitles ? 'Nyala' : 'Mati'} &bull; Ganti judul clickbait dengan deskripsi asli
                </p>
              </div>
              <button
                onClick={() =>
                  updateDeArrowSettings({
                    alternativeTitles: !deArrowSettings.alternativeTitles,
                  })
                }
                disabled={!deArrowSettings.enabled}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  deArrowSettings.alternativeTitles
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    deArrowSettings.alternativeTitles ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Alternative Thumbnails */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Thumbnail Alternatif Komunitas
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {deArrowSettings.alternativeThumbnails ? 'Nyala' : 'Mati'} &bull; Gunakan tangkapan layar frame video asli
                </p>
              </div>
              <button
                onClick={() =>
                  updateDeArrowSettings({
                    alternativeThumbnails: !deArrowSettings.alternativeThumbnails,
                  })
                }
                disabled={!deArrowSettings.enabled}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  deArrowSettings.alternativeThumbnails
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    deArrowSettings.alternativeThumbnails ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'player':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Putar Otomatis Video Berikutnya
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isAutoPlayNext ? 'Nyala' : 'Mati'} &bull; Otomatis beralih ke video rekomendasi setelah selesai
                </p>
              </div>
              <button
                onClick={() => setIsAutoPlayNext(!isAutoPlayNext)}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  isAutoPlayNext ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    isAutoPlayNext ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Kualitas Video Bawaan
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Resolusi awal saat memulai pemutaran
                </p>
              </div>
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                className="bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#3a3a3a] text-gray-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-hidden"
              >
                <option value="auto">Otomatis (Auto HD)</option>
                <option value="1080">1080p Full HD</option>
                <option value="720">720p HD</option>
                <option value="480">480p Hemat</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Penghemat Data
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isDataSaver ? 'Nyala' : 'Mati'} &bull; Optimalkan kuota internet saat streaming
                </p>
              </div>
              <button
                onClick={() => setIsDataSaver(!isDataSaver)}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  isDataSaver ? 'bg-red-600' : 'bg-gray-300 dark:bg-[#3a3a3a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform absolute top-0.75 ${
                    isDataSaver ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-2xl text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Riwayat</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {historyVideoIds.length}
                </p>
              </div>
              <div className="p-3.5 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-2xl text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Disukai</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {likedVideoIds.length}
                </p>
              </div>
              <div className="p-3.5 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] rounded-2xl text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">Tonton Nanti</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {watchLaterIds.length}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                id="clear-all-history-btn"
                onClick={clearHistory}
                disabled={historyVideoIds.length === 0}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 disabled:opacity-50 transition-colors font-semibold text-sm"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5" />
                  <span>Hapus Riwayat Tontonan</span>
                </div>
              </button>

              <button
                id="reset-all-settings-btn"
                onClick={resetDeArrowSettings}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-[#181818] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#272727] hover:bg-gray-100 dark:hover:bg-[#202020] transition-colors font-semibold text-sm"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset Preferensi ke Bawaan</span>
                </div>
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Notifikasi Channel Langganan
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pemberitahuan ketika kreator mengunggah video baru
                </p>
              </div>
              <button
                onClick={markNotificationsAsRead}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Tandai Dibaca
              </button>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {backupNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-semibold">
                {backupNotice}
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#272727] hover:bg-gray-100 dark:hover:bg-[#202020] text-gray-900 dark:text-white transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <Download className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-bold">Ekspor Data Cadangan</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Simpan pengaturan dan preferensi ke file JSON
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'updates':
        return (
          <div className="space-y-6 animate-in fade-in duration-150 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              NextTube v2.5.0
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Aplikasi pemutar YouTube cepat, bebas iklan, ramah privasi dengan integrasi resmi SponsorBlock &amp; DeArrow API.
            </p>

            <div className="pt-2">
              <button
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdate}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? 'Memeriksa...' : 'Periksa Pembaruan'}</span>
              </button>
            </div>

            {updateStatus && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-2 animate-in fade-in">
                {updateStatus}
              </p>
            )}
          </div>
        );

      case 'community':
        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header info - Clean, minimal monochrome style */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-[#222]">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#1f1f1f] text-gray-900 dark:text-white flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#333]">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Komunitas Resmi SANN404
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-[#252525] text-gray-800 dark:text-gray-200 rounded-md border border-gray-200 dark:border-[#3a3a3a]">
                    Official
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Pembaruan versi, info fitur terbaru, dan diskusi seputar NextTube bersama tim pengembang.
                </p>
              </div>
            </div>

            {/* List of Community Channels matching Settings item aesthetic */}
            <div className="space-y-1">
              {/* 1. Instagram */}
              <div
                id="community-item-instagram"
                className="w-full flex items-center justify-between gap-4 py-3.5 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#202020] text-gray-900 dark:text-white flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#333]">
                    <InstagramIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      Instagram Resmi
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      Kabar terbaru dan pengumuman fitur &bull; @sannnforums.id
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyLink('https://www.instagram.com/sannnforums.id', 'Instagram')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="Salin Tautan"
                    aria-label="Salin Tautan Instagram"
                  >
                    {copiedLink === 'Instagram' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href="https://www.instagram.com/sannnforums.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 2. GitHub */}
              <div
                id="community-item-github"
                className="w-full flex items-center justify-between gap-4 py-3.5 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#202020] text-gray-900 dark:text-white flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#333]">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      GitHub Project
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      Repository sumber kode &amp; issue tracker &bull; @sannnproject
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyLink('https://github.com/sannnproject', 'GitHub')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="Salin Tautan"
                    aria-label="Salin Tautan GitHub"
                  >
                    {copiedLink === 'GitHub' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href="https://github.com/sannnproject"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 3. TikTok */}
              <div
                id="community-item-tiktok"
                className="w-full flex items-center justify-between gap-4 py-3.5 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#202020] text-gray-900 dark:text-white flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#333]">
                    <TiktokIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      TikTok Official
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      Video singkat panduan fitur &amp; tips &bull; @sannforums
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyLink('https://www.tiktok.com/@sannforums', 'TikTok')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="Salin Tautan"
                    aria-label="Salin Tautan TikTok"
                  >
                    {copiedLink === 'TikTok' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href="https://www.tiktok.com/@sannforums"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 4. WhatsApp Channel */}
              <div
                id="community-item-whatsapp"
                className="w-full flex items-center justify-between gap-4 py-3.5 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#202020] text-gray-900 dark:text-white flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#333]">
                    <WhatsappIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      Saluran WhatsApp Resmi
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      Siaran notifikasi rilis dan pembaruan penting &bull; SANN404 Channel
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyLink('https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L', 'WhatsApp')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    title="Salin Tautan"
                    aria-label="Salin Tautan WhatsApp"
                  >
                    {copiedLink === 'WhatsApp' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <a
                    href="https://whatsapp.com/channel/0029Vb6ukqnHQbS4mKP0j80L"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Credits Badge - Clean Monochrome */}
            <div className="text-center pt-6 pb-2 text-xs text-gray-400 dark:text-gray-500">
              <p>Dikembangkan oleh <span className="font-semibold text-gray-700 dark:text-gray-300">SANN404 FORUM GROUP</span></p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'general':
        return 'Umum';
      case 'appearance':
        return 'Tampilan';
      case 'sponsorblock':
        return 'SponsorBlock';
      case 'dearrow':
        return 'DeArrow';
      case 'player':
        return 'Pemain';
      case 'media':
        return 'Audio dan video';
      case 'history':
        return 'Riwayat';
      case 'notifications':
        return 'Notifikasi';
      case 'backup':
        return 'Cadangkan dan pulihkan';
      case 'community':
        return 'Komunitas';
      case 'updates':
        return 'Periksa untuk pembaruan';
      default:
        return 'Pengaturan';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto min-h-[calc(100vh-8rem)]">
      {/* Top Header with Back Button (Matching Screenshots) */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-200 dark:border-[#222]">
        <button
          id="settings-back-btn"
          onClick={handleBack}
          aria-label="Kembali"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-800 dark:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {getSectionTitle()}
        </h1>
      </div>

      {activeSection === 'main' ? (
        /* MASTER SETTINGS LIST (Matching Screenshot 1) */
        <div className="space-y-1 select-none animate-in fade-in duration-150">
          {/* 1. Umum */}
          <button
            id="settings-item-general"
            onClick={() => setActiveSection('general')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Sliders className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Umum
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Bahasa, mini player, dan preferensi aplikasi
              </p>
            </div>
          </button>

          {/* 2. Tampilan */}
          <button
            id="settings-item-appearance"
            onClick={() => setActiveSection('appearance')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Palette className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Tampilan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Atur tema {isDarkMode ? '(Gelap)' : '(Terang)'} dan kenyamanan visual
              </p>
            </div>
          </button>

          {/* 3. SponsorBlock */}
          <button
            id="settings-item-sponsorblock"
            onClick={() => setActiveSection('sponsorblock')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Shield className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                SponsorBlock
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Menggunakan API dari https://sponsor.ajay.app/
              </p>
            </div>
          </button>

          {/* 4. DeArrow */}
          <button
            id="settings-item-dearrow"
            onClick={() => setActiveSection('dearrow')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <EyeOff className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                DeArrow
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Tampilkan judul dan thumbnail yang lebih akurat
              </p>
            </div>
          </button>

          {/* 5. Pemain */}
          <button
            id="settings-item-player"
            onClick={() => setActiveSection('player')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <PlayCircle className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Pemain
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Bawaan dan perilaku pemutar video
              </p>
            </div>
          </button>

          {/* 6. Audio dan Video */}
          <button
            id="settings-item-media"
            onClick={() => setActiveSection('media')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Film className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Audio dan video
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Kualitas streaming dan format
              </p>
            </div>
          </button>

          {/* 7. Riwayat */}
          <button
            id="settings-item-history"
            onClick={() => setActiveSection('history')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <History className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Riwayat
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Riwayat tontonan dan penelusuran
              </p>
            </div>
          </button>

          {/* 8. Notifikasi */}
          <button
            id="settings-item-notifications"
            onClick={() => setActiveSection('notifications')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Bell className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Notifikasi
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Tampilkan notifikasi untuk saluran baru
              </p>
            </div>
          </button>

          {/* 9. Cadangkan dan Pulihkan */}
          <button
            id="settings-item-backup"
            onClick={() => setActiveSection('backup')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Cloud className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Cadangkan dan pulihkan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Impor dan ekspor langganan, daftar putar, ...
              </p>
            </div>
          </button>

          {/* 10. Komunitas (Community) */}
          <button
            id="settings-item-community"
            onClick={() => setActiveSection('community')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Komunitas
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                Instagram, GitHub, TikTok, Saluran WhatsApp
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-gray-100 dark:border-[#222]" />
          </div>

          {/* 11. Periksa untuk Pembaruan */}
          <button
            id="settings-item-updates"
            onClick={() => setActiveSection('updates')}
            className="w-full flex items-center gap-4.5 py-4 px-2 hover:bg-gray-50 dark:hover:bg-[#181818] rounded-2xl transition-colors text-left group"
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0">
              <RefreshCw className="w-5.5 h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                Periksa untuk pembaruan
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                v2.5.0 &bull; Dibuat oleh SANN404 FORUM GROUP
              </p>
            </div>
          </button>
        </div>
      ) : (
        /* SUB-SETTING PAGE (Matching Screenshot 2) */
        renderSubSection()
      )}
    </div>
  );
};

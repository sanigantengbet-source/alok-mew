'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white p-4">
      <h2 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm text-center max-w-md">
        Kami mengalami kendala saat memuat konten. Silakan muat ulang halaman.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>
  );
}

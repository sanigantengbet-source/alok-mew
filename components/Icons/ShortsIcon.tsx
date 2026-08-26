'use client';

import React from 'react';

interface ShortsIconProps {
  className?: string;
  isActive?: boolean;
}

/**
 * Authentic, clean, and pixel-perfect YouTube Shorts Icon
 */
export const ShortsIcon: React.FC<ShortsIconProps> = ({
  className = 'w-5 h-5',
  isActive = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={`${className} transition-transform duration-200`}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    shapeRendering="geometricPrecision"
  >
    {/* Outer YouTube Shorts S-Pill Badge */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.77 10.32c-.77-.32-1.2-.5-1.2-.5L18 8.6c1.8-1.05 2.41-3.34 1.36-5.14-1.05-1.8-3.34-2.41-5.14-1.36L6.16 6.8c-1.26.74-2.02 2.07-2.02 3.52 0 1.46.77 2.79 2.03 3.53l.77.45-.88.51c-1.8 1.05-2.41 3.34-1.36 5.14 1.05 1.8 3.34 2.41 5.14 1.36l8.06-4.7c1.26-.74 2.02-2.07 2.02-3.52 0-1.46-.77-2.79-2.03-3.53l-.11-.06z"
      className={
        isActive
          ? 'fill-red-600 dark:fill-red-500'
          : 'fill-gray-800 dark:fill-white'
      }
    />
    {/* High-contrast Center Play Triangle */}
    <polygon
      points="10,8.75 15.6,12 10,15.25"
      className={
        isActive
          ? 'fill-white'
          : 'fill-white dark:fill-[#0f0f0f]'
      }
    />
  </svg>
);

'use client';

import React from 'react';

interface NextTubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const NextTubeLogo: React.FC<NextTubeLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-11 h-11',
  };

  const textSizeClasses = {
    sm: 'text-base font-extrabold tracking-tight',
    md: 'text-lg sm:text-xl font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision PWA Logo Icon from /icon.svg */}
      <div className={`relative ${iconSizeClasses[size]} shrink-0 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.svg"
          alt="NextTube Logo"
          className="w-full h-full object-contain rounded-xl sm:rounded-2xl filter drop-shadow-md hover:scale-105 transition-transform duration-200"
        />
      </div>

      {showText && (
        <span className={`${textSizeClasses[size]} text-gray-900 dark:text-white flex items-center leading-none font-bold`}>
          Next<span className="text-[#FF1E27]">Tube</span>
        </span>
      )}
    </div>
  );
};


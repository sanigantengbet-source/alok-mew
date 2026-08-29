'use client';

import React from 'react';

interface NextTubeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const NextTubeLogo: React.FC<NextTubeLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizeClasses = {
    xs: 'w-5.5 h-5.5',
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-8.5 sm:h-8.5',
    lg: 'w-10 h-10',
  };

  const textSizeClasses = {
    xs: 'text-sm font-bold tracking-tight',
    sm: 'text-[15px] sm:text-base font-extrabold tracking-tight',
    md: 'text-[17px] sm:text-lg font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  };

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 select-none ${className}`}>
      {/* Precision Logo Icon */}
      <div className={`relative ${iconSizeClasses[size]} shrink-0 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/nexttube-logo.png"
          alt="NextTube Logo"
          className="w-full h-full object-contain filter drop-shadow-xs hover:scale-105 transition-transform duration-200"
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


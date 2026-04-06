import React from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "w-10 h-10", textClassName = "text-2xl", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${className} relative flex-shrink-0 text-primary`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.7" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Soft geometric cat face background */}
          <path d="M50 85 C25 85 15 65 15 45 C15 25 30 15 50 15 C70 15 85 25 85 45 C85 65 75 85 50 85 Z" fill="url(#catGrad)" opacity="0.15" />
          {/* Minimalist continuous line art for ears and face */}
          <path d="M25 35 L20 15 L40 25 M75 35 L80 15 L60 25" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Soft smile */}
          <path d="M35 55 Q50 68 65 55" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="35" cy="42" r="4.5" fill="currentColor" />
          <circle cx="65" cy="42" r="4.5" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span className={`font-headline font-semibold tracking-wide text-on-surface ${textClassName}`}>
          喵食记
        </span>
      )}
    </div>
  );
}

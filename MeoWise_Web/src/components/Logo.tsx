import React from 'react';

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export default function Logo({ className = "w-10 h-10", textClassName = "text-2xl", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${className} relative flex-shrink-0`}>
        <img src="/logo.png" alt="MeoWise Logo" className="w-full h-full object-contain" />
      </div>
      {showText && (
        <span className={`font-headline font-semibold tracking-wide text-on-surface ${textClassName}`}>
          喵食记
        </span>
      )}
    </div>
  );
}

import React from 'react';

export interface JevanCareLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'pulse' | 'inline' | 'button' | 'card' | 'page';
  color?: 'forest' | 'sage' | 'white' | 'emerald';
  label?: string;
  className?: string;
}

export const JevanCareLoader: React.FC<JevanCareLoaderProps> = ({
  size = 'md',
  variant = 'pulse',
  color = 'forest',
  label,
  className = '',
}) => {
  // Determine pixel sizes
  const sizeMap = {
    xs: { outer: 'w-4 h-4', inner: 'w-2 h-2', text: 'text-[10px]' },
    sm: { outer: 'w-5 h-5', inner: 'w-2.5 h-2.5', text: 'text-xs' },
    md: { outer: 'w-7 h-7', inner: 'w-3.5 h-3.5', text: 'text-sm' },
    lg: { outer: 'w-10 h-10', inner: 'w-5 h-5', text: 'text-base' },
    xl: { outer: 'w-14 h-14', inner: 'w-7 h-7', text: 'text-lg' },
  };

  // Color mappings
  const colorMap = {
    forest: {
      pulseBg: 'bg-[#1b3b2b]',
      ringBorder: 'border-[#1b3b2b]',
      text: 'text-[#1b3b2b] dark:text-[#f2f0e8]',
    },
    sage: {
      pulseBg: 'bg-[#2b503b]',
      ringBorder: 'border-[#2b503b]',
      text: 'text-[#2b503b] dark:text-[#d3e2cb]',
    },
    emerald: {
      pulseBg: 'bg-emerald-600',
      ringBorder: 'border-emerald-600',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    white: {
      pulseBg: 'bg-white',
      ringBorder: 'border-white',
      text: 'text-white',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const currentColor = colorMap[color] || colorMap.forest;

  const pulseGraphic = (
    <div className={`relative flex items-center justify-center shrink-0 ${currentSize.outer}`}>
      {/* Outer expanding gentle ring */}
      <span
        className={`absolute inset-0 rounded-full opacity-35 animate-ping ${currentColor.pulseBg}`}
        style={{ animationDuration: '2s' }}
      />
      {/* Middle breathing ring */}
      <span
        className={`absolute inset-1 rounded-full border border-current opacity-40 animate-pulse ${currentColor.ringBorder}`}
        style={{ animationDuration: '1.6s' }}
      />
      {/* Central solid core dot */}
      <span
        className={`rounded-full ${currentSize.inner} ${currentColor.pulseBg} shadow-xs transition-all`}
      />
    </div>
  );

  if (variant === 'button' || variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {pulseGraphic}
        {label && <span className={`font-medium ${currentSize.text} ${currentColor.text}`}>{label}</span>}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-6 bg-[#fcfaf6] dark:bg-[#121e17] border border-[#e6dfd3] dark:border-[#233529] rounded-2xl flex flex-col items-center justify-center text-center space-y-3 ${className}`}>
        {pulseGraphic}
        {label && <p className={`text-xs font-medium ${currentColor.text}`}>{label}</p>}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={`min-h-[220px] py-12 flex flex-col items-center justify-center text-center space-y-3 ${className}`}>
        {pulseGraphic}
        {label && (
          <p className={`text-sm font-medium tracking-wide ${currentColor.text} font-serif-editorial italic`}>
            {label}
          </p>
        )}
      </div>
    );
  }

  // Default pulse variant
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {pulseGraphic}
      {label && <span className={`font-medium ${currentSize.text} ${currentColor.text}`}>{label}</span>}
    </div>
  );
};

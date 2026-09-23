import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  activeKey: string;
  theme?: 'patient' | 'doctor';
  className?: string;
}

export const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  activeKey,
  theme = 'patient',
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => checkScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const observer = new MutationObserver(() => checkScroll());
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll]);

  // Automatically scroll active tab into view whenever activeKey changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const activeEl = el.querySelector('[data-active="true"]') as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeKey]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const isDoctor = theme === 'doctor';

  return (
    <div className={`relative w-full ${className}`}>
      {/* Left Fade Overlay & Arrow Button */}
      {canScrollLeft && (
        <div
          className={`absolute left-0 top-0 bottom-0 z-20 flex items-center pr-5 pointer-events-none ${
            isDoctor
              ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent'
              : 'bg-gradient-to-r from-[#fcfaf6] dark:from-[#121e17] via-[#fcfaf6]/90 dark:via-[#121e17]/90 to-transparent'
          }`}
        >
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className={`pointer-events-auto p-1.5 rounded-full shadow-md transition-all cursor-pointer ${
              isDoctor
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                : 'bg-white dark:bg-[#1a2d22] text-[#1b3b2b] dark:text-[#a3d4b6] border border-[#d3decf] dark:border-[#2a4535] hover:bg-[#e8eee5]'
            }`}
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Right Fade Overlay & Arrow Button */}
      {canScrollRight && (
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 flex items-center pl-5 pointer-events-none ${
            isDoctor
              ? 'bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent'
              : 'bg-gradient-to-l from-[#fcfaf6] dark:from-[#121e17] via-[#fcfaf6]/90 dark:via-[#121e17]/90 to-transparent'
          }`}
        >
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className={`pointer-events-auto p-1.5 rounded-full shadow-md transition-all cursor-pointer ${
              isDoctor
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                : 'bg-white dark:bg-[#1a2d22] text-[#1b3b2b] dark:text-[#a3d4b6] border border-[#d3decf] dark:border-[#2a4535] hover:bg-[#e8eee5]'
            }`}
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-none touch-pan-x py-2.5 px-2 flex items-center space-x-1 sm:space-x-2 w-full"
      >
        {children}
      </div>
    </div>
  );
};

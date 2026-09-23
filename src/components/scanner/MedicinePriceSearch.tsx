import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ShieldCheck, MapPin, IndianRupee, Sparkles } from 'lucide-react';

interface MedicinePriceSearchProps {
  onSearch: (query: string, filter: 'cheapest' | 'nearest' | 'available' | 'best_value') => void;
  isLoading: boolean;
  initialQuery?: string;
}

export const MedicinePriceSearch: React.FC<MedicinePriceSearchProps> = ({
  onSearch,
  isLoading,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'cheapest' | 'nearest' | 'available' | 'best_value'>('cheapest');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize initialQuery if updated externally
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [initialQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // Debounce search by 400ms without unmounting or re-creating input
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearch(val, activeFilter);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(query, activeFilter);
    }
  };

  const handleFilterSelect = (filter: 'cheapest' | 'nearest' | 'available' | 'best_value') => {
    setActiveFilter(filter);
    onSearch(query, filter);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-stone-200 dark:border-slate-700 shadow-xs space-y-3">
      {/* Input row */}
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search by medicine name (e.g. Paracetamol 650), pharmacy name, or area..."
          className="w-full pl-11 pr-24 py-3 text-sm bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium transition-all"
        />
        <button
          onClick={() => onSearch(query, activeFilter)}
          disabled={isLoading}
          className="absolute right-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-all shadow-xs disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-stone-100 dark:border-slate-700/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          <span>Sort & Filter:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => handleFilterSelect('cheapest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'cheapest'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-stone-200'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Cheapest</span>
          </button>

          <button
            onClick={() => handleFilterSelect('nearest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'nearest'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-stone-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Nearest</span>
          </button>

          <button
            onClick={() => handleFilterSelect('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'available'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Available Now</span>
          </button>

          <button
            onClick={() => handleFilterSelect('best_value')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === 'best_value'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Best Value</span>
          </button>
        </div>
      </div>
    </div>
  );
};

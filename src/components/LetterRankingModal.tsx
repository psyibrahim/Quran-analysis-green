import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Hash, 
  Percent, 
  ExternalLink, 
  BookOpen, 
  Award,
  ArrowDown,
  ArrowUp,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SectionHelpButton } from './SectionHelpModal';
import { formatSurahName } from '../utils/arabic';

interface LetterRankingModalProps {
  letter: string | null;
  onClose: () => void;
  surahs: SurahData[];
  letters: string[];
  letterNames: Record<string, string>;
  onSelectSurah: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onSelectLetter: (letter: string) => void;
  initialMetric?: 'count' | 'percentage';
}

export const LetterRankingModal: React.FC<LetterRankingModalProps> = ({
  letter,
  onClose,
  surahs,
  letters,
  letterNames,
  onSelectSurah,
  onOpenInReader,
  onSelectLetter,
  initialMetric = 'count'
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [metric, setMetric] = useState<'count' | 'percentage'>(initialMetric);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [excludeZeroCount, setExcludeZeroCount] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Show filters initially on larger desktop screens (>=768px), keep collapsed on mobile phones for optimal vertical room
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  
  // Dedicated reference for scrolling container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  // Sync initialMetric if prop changes
  useEffect(() => {
    setMetric(initialMetric);
  }, [initialMetric]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Scroll listener to toggle the floating jump button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop } = scrollContainerRef.current;
    setIsScrolledDown(scrollTop > 240);
  };

  const scrollToBottom = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  const scrollToTop = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const letterName = letter ? (letterNames[letter] || letter) : '';

  // Comprehensive letter summary statistics
  const letterStatsSummary = useMemo(() => {
    if (!letter) {
      return {
        totalOccurrences: 0,
        presentCount: 0,
        zeroCount: 0,
        zeroSurahs: [] as SurahData[],
        maxCountItem: { surah: undefined as SurahData | undefined, count: 0, pct: 0 },
        minCountItem: { surah: undefined as SurahData | undefined, count: 0, pct: 0, tiedCount: 0 },
        maxPctItem: { surah: undefined as SurahData | undefined, count: 0, pct: 0 },
        minPctItem: { surah: undefined as SurahData | undefined, count: 0, pct: 0, tiedCount: 0 }
      };
    }

    let totalOccurrences = 0;
    const nonZeroSurahs: Array<{ surah: SurahData; count: number; pct: number }> = [];
    const zeroSurahs: Array<SurahData> = [];

    surahs.forEach(s => {
      const count = s.letters.plainCounts[letter] || 0;
      const pct = s.letters.plainPercentages[letter] || 0;
      totalOccurrences += count;
      if (count > 0) {
        nonZeroSurahs.push({ surah: s, count, pct });
      } else {
        zeroSurahs.push(s);
      }
    });

    // Extremes by real count
    const sortedByCountDesc = [...surahs].sort((a, b) => {
      const ca = a.letters.plainCounts[letter] || 0;
      const cb = b.letters.plainCounts[letter] || 0;
      return cb - ca;
    });

    const maxCountSurah = sortedByCountDesc[0];
    const maxCount = maxCountSurah ? (maxCountSurah.letters.plainCounts[letter] || 0) : 0;
    const maxCountPct = maxCountSurah ? (maxCountSurah.letters.plainPercentages[letter] || 0) : 0;

    // Non-zero min count
    const nonZeroByCountAsc = [...nonZeroSurahs].sort((a, b) => a.count - b.count);
    const minCountItem = nonZeroByCountAsc[0] || { surah: undefined, count: 0, pct: 0 };
    const tiedMinCount = nonZeroSurahs.filter(item => item.count === minCountItem.count).length;

    // Extremes by percentage
    const sortedByPctDesc = [...surahs].sort((a, b) => {
      const pa = a.letters.plainPercentages[letter] || 0;
      const pb = b.letters.plainPercentages[letter] || 0;
      return pb - pa;
    });

    const maxPctSurah = sortedByPctDesc[0];
    const maxPct = maxPctSurah ? (maxPctSurah.letters.plainPercentages[letter] || 0) : 0;
    const maxPctCount = maxPctSurah ? (maxPctSurah.letters.plainCounts[letter] || 0) : 0;

    // Non-zero min percentage
    const nonZeroByPctAsc = [...nonZeroSurahs].sort((a, b) => a.pct - b.pct);
    const minPctItem = nonZeroByPctAsc[0] || { surah: undefined, count: 0, pct: 0 };
    const tiedMinPct = nonZeroSurahs.filter(item => item.pct === minPctItem.pct).length;

    return {
      totalOccurrences,
      presentCount: nonZeroSurahs.length,
      zeroCount: zeroSurahs.length,
      zeroSurahs,
      maxCountItem: { surah: maxCountSurah, count: maxCount, pct: maxCountPct },
      minCountItem: { surah: minCountItem.surah, count: minCountItem.count, pct: minCountItem.pct, tiedCount: tiedMinCount },
      maxPctItem: { surah: maxPctSurah, count: maxPctCount, pct: maxPct },
      minPctItem: { surah: minPctItem.surah, count: minPctItem.count, pct: minPctItem.pct, tiedCount: tiedMinPct }
    };
  }, [letter, surahs]);

  // Ranked surahs list according to metric, sorting, zero exclusion, and type filter
  const rankedSurahs = useMemo(() => {
    if (!letter) return [];

    let list = surahs.map(s => {
      const count = s.letters.plainCounts[letter] || 0;
      const percentage = s.letters.plainPercentages[letter] || 0;
      return {
        surah: s,
        count,
        percentage
      };
    });

    // Filter by revelation type
    if (typeFilter === 'Meccan') {
      list = list.filter(item => item.surah.isMeccan);
    } else if (typeFilter === 'Medinan') {
      list = list.filter(item => !item.surah.isMeccan);
    }

    // Exclude zero-occurrence surahs if requested
    if (excludeZeroCount) {
      list = list.filter(item => item.count > 0);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(item => 
        item.surah.name.includes(q) ||
        item.surah.number.toString().includes(q) ||
        (item.surah.englishName && item.surah.englishName.toLowerCase().includes(q))
      );
    }

    // Sort order
    list.sort((a, b) => {
      if (metric === 'count') {
        const diff = sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
        if (diff !== 0) return diff;
        return a.surah.number - b.surah.number;
      } else {
        const diff = sortOrder === 'desc' ? b.percentage - a.percentage : a.percentage - b.percentage;
        if (diff !== 0) return diff;
        return a.surah.number - b.surah.number;
      }
    });

    return list;
  }, [letter, surahs, metric, sortOrder, excludeZeroCount, typeFilter, searchQuery]);

  // Maximum value for proportional bar representation
  const maxRefValue = useMemo(() => {
    if (metric === 'count') {
      return letterStatsSummary.maxCountItem.count || 1;
    }
    return letterStatsSummary.maxPctItem.pct || 1;
  }, [metric, letterStatsSummary]);

  if (!letter) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-4xl h-[92vh] max-h-[92vh] sm:h-[90vh] sm:max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-colors my-auto ${
          isLight 
            ? 'bg-white border-ink-300 text-ink-900 shadow-2xl shadow-ink-300/60' 
            : 'bg-ink-950 border-ink-800 text-ink-100 shadow-2xl shadow-black'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL HEADER (PINNED AT TOP) */}
        <div className={`p-3 sm:p-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-900 border-ink-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-heading font-bold text-2xl shrink-0 shadow-sm border ${
              isLight 
                ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#8C6D2D]' 
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              {letter}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-sm sm:text-base font-bold font-heading ${
                  isLight ? 'text-ink-900' : 'text-ink-100'
                }`}>
                  ترتيب سور القرآن الكريم بحسب حرف «{letter}» ({letterName})
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  isLight 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {metric === 'count' ? 'مُرتب بالتعداد الفعلي' : 'مُرتب بالنسبة المئوية'}
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs font-mono mt-0.5 ${
                isLight ? 'text-ink-600' : 'text-ink-400'
              }`}>
                إجمالي التكرار: <strong className={`font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`}>{letterStatsSummary.totalOccurrences.toLocaleString('en-US')}</strong> • وارد في <strong className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{letterStatsSummary.presentCount}</strong> سورة • غائب عن <strong className={`font-bold ${isLight ? 'text-red-700' : 'text-red-400'}`}>{letterStatsSummary.zeroCount}</strong> سورة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick jump to bottom button */}
            <button
              onClick={scrollToBottom}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                isLight 
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800' 
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              }`}
              title="النزول المباشر إلى أسفل القائمة لرؤية الأقل تكراراً والسور الخالية"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إلى الأقل</span>
            </button>

            {/* Isolated Corner Help Button */}
            <SectionHelpButton 
              guideId="letter-ranking-modal" 
              variant="icon" 
              title="استعلام: شرح ترتيب الـ 114 سورة بهذا الحرف وكيفية قراءة القائمة" 
            />

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all shrink-0 ${
                isLight 
                  ? 'bg-ink-100 hover:bg-ink-200 border-ink-300 text-ink-700' 
                  : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-300 hover:text-white'
              }`}
              title="إغلاق النافذة (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. QUICK LETTER NAVIGATION STRIP (PINNED COMPACT BAR) */}
        <div className={`px-3 py-1.5 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 ${
          isLight ? 'bg-ink-100/95 border-ink-200' : 'bg-ink-900/70 border-ink-800'
        }`}>
          <span className={`text-[10px] font-mono whitespace-nowrap pl-1 ${
            isLight ? 'text-ink-600 font-bold' : 'text-ink-400'
          }`}>انتقال لحرف:</span>
          {letters.map((l) => (
            <button
              key={l}
              onClick={() => onSelectLetter(l)}
              className={`w-7 h-7 rounded-lg font-heading font-bold text-sm flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                l === letter
                  ? 'bg-[#1A5C5C] text-white shadow-sm font-extrabold scale-105'
                  : isLight
                    ? 'bg-white hover:bg-emerald-100 text-ink-800 border border-ink-300'
                    : 'bg-ink-900 hover:bg-ink-800 text-ink-300 border border-ink-800'
              }`}
              title={`استعراض حرف ${letterNames[l] || l}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* 3. SCROLLABLE BODY (UNIFIED SCROLL CONTAINER ENCOMPASSING EXTREMES, FILTERS & LIST) */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto scroll-smooth focus:outline-none flex flex-col"
        >
          {/* A. QUICK EXTREMES SUMMARY BANNER (INSIDE SCROLL BODY SO SCROLLING WORKS ANYWHERE) */}
          <div className={`p-2 sm:p-3 border-b grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs font-mono ${
            isLight ? 'bg-ink-50/90 border-ink-200' : 'bg-ink-900/40 border-ink-800'
          }`}>
            {/* Max Surah Box */}
            <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
              isLight 
                ? 'bg-emerald-50/90 border-emerald-300 text-ink-900' 
                : 'bg-emerald-950/20 border-emerald-500/30 text-ink-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                  isLight 
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700' 
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-bold ${
                    isLight ? 'text-emerald-800' : 'text-emerald-400'
                  }`}>
                    {metric === 'count' ? 'الأكثر تكراراً (بالتعداد الفعلي)' : 'الأعلى نسبة مئوية (%)'}
                  </div>
                  <div className={`font-heading font-bold text-sm ${
                    isLight ? 'text-ink-900' : 'text-ink-100'
                  }`}>
                    {formatSurahName(metric === 'count' 
                      ? letterStatsSummary.maxCountItem.surah?.name 
                      : letterStatsSummary.maxPctItem.surah?.name)}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className={`font-bold text-sm ${
                  isLight ? 'text-emerald-800' : 'text-emerald-400'
                }`}>
                  {metric === 'count' 
                    ? `${letterStatsSummary.maxCountItem.count.toLocaleString('en-US')} مرة`
                    : `${letterStatsSummary.maxPctItem.pct}%`}
                </div>
                <div className={`text-[10px] ${
                  isLight ? 'text-ink-600' : 'text-ink-400'
                }`}>
                  {metric === 'count' 
                    ? `${letterStatsSummary.maxCountItem.pct}% من حروفها`
                    : `${letterStatsSummary.maxPctItem.count.toLocaleString('en-US')} مرة`}
                </div>
              </div>
            </div>

            {/* Min Surah Box (Non-zero) */}
            <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
              isLight 
                ? 'bg-green-50/90 border-green-300 text-ink-900' 
                : 'bg-green-950/20 border-green-500/30 text-ink-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                  isLight 
                    ? 'bg-green-100 border-green-300 text-green-700' 
                    : 'bg-green-500/15 border-green-500/30 text-green-400'
                }`}>
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-bold ${
                    isLight ? 'text-green-800' : 'text-green-400'
                  }`}>
                    {metric === 'count' ? 'الأقل تكراراً (غير صفرية > 0)' : 'الأدنى نسبة (غير صفرية > 0)'}
                  </div>
                  <div className={`font-heading font-bold text-sm ${
                    isLight ? 'text-ink-900' : 'text-ink-100'
                  }`}>
                    {formatSurahName(metric === 'count' 
                      ? letterStatsSummary.minCountItem.surah?.name 
                      : letterStatsSummary.minPctItem.surah?.name)}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className={`font-bold text-sm ${
                  isLight ? 'text-green-800' : 'text-green-400'
                }`}>
                  {metric === 'count' 
                    ? `${letterStatsSummary.minCountItem.count.toLocaleString('en-US')} مرة`
                    : `${letterStatsSummary.minPctItem.pct}%`}
                </div>
                <div className={`text-[10px] ${
                  isLight ? 'text-ink-600' : 'text-ink-400'
                }`}>
                  {metric === 'count' 
                    ? `${letterStatsSummary.minCountItem.pct}% من حروفها`
                    : `${letterStatsSummary.minPctItem.count.toLocaleString('en-US')} مرة`}
                  {metric === 'count' && letterStatsSummary.minCountItem.tiedCount > 1 && (
                    <span className={`mr-1 ${isLight ? 'text-green-700' : 'text-green-300'}`}>
                      ({letterStatsSummary.minCountItem.tiedCount} سور)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* B. STICKY CONTROLS & FILTER TOOLBAR (COMPACT & COLLAPSIBLE FOR MOBILE) */}
          <div className={`sticky top-0 z-20 border-b shadow-xs backdrop-blur-md transition-colors ${
            isLight ? 'bg-ink-100/95 border-ink-200' : 'bg-ink-900/95 border-ink-800'
          }`}>
            {/* Top Compact Bar (Always visible: Toggle, Search & Quick Jumps) */}
            <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2 text-xs">
              
              {/* Toggle Criteria Button + Active Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-mono font-bold transition-all active:scale-95 ${
                    showFilters
                      ? isLight
                        ? 'bg-[#1A5C5C] text-white border-emerald-700 shadow-sm'
                        : 'bg-[#1A5C5C] text-white border-emerald-600 shadow-sm'
                      : isLight
                        ? 'bg-white hover:bg-ink-50 text-ink-700 border-ink-300 shadow-xs'
                        : 'bg-ink-950 hover:bg-ink-800 text-ink-300 border-ink-800'
                  }`}
                  title={showFilters ? 'إخفاء لوحة المعايير لتوفير أقصى مساحة للقائمة' : 'إظهار لوحة معايير الترتيب والفلترة'}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showFilters ? 'إخفاء المعايير' : 'قائمة المعايير'}</span>
                  {showFilters ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Compact Active Badges (shown when collapsed for quick glance) */}
                {!showFilters && (
                  <div 
                    onClick={() => setShowFilters(true)}
                    className="hidden sm:flex items-center gap-1 cursor-pointer text-[10px] font-mono select-none"
                    title="اضغط لفتح لوحة المعايير"
                  >
                    <span className={`px-2 py-0.5 rounded-md border font-medium ${
                      isLight ? 'bg-white border-ink-300 text-ink-700' : 'bg-ink-950 border-ink-800 text-ink-300'
                    }`}>
                      {metric === 'count' ? 'تعداد حقيقي' : 'نسبة %'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border font-medium ${
                      isLight ? 'bg-white border-ink-300 text-ink-700' : 'bg-ink-950 border-ink-800 text-ink-300'
                    }`}>
                      {sortOrder === 'desc' ? 'تنازلي' : 'تصاعدي'}
                    </span>
                    {typeFilter !== 'all' && (
                      <span className={`px-2 py-0.5 rounded-md border font-bold ${
                        typeFilter === 'Meccan'
                          ? isLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {typeFilter === 'Meccan' ? 'مكية' : 'مدنية'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Search & Direct Jump Buttons (Always reachable) */}
              <div className="flex items-center gap-1.5 flex-1 justify-end max-w-sm">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[100px] max-w-[180px] sm:max-w-[200px]">
                  <Search className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isLight ? 'text-ink-600' : 'text-ink-400'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالسورة..."
                    className={`w-full rounded-lg pr-7 pl-2 py-1 text-[11px] sm:text-xs focus:outline-none focus:border-[#1A5C5C] transition-colors ${
                      isLight 
                        ? 'bg-white border border-ink-300 text-ink-900 placeholder-ink-400' 
                        : 'bg-ink-950 border border-ink-700 text-ink-100 placeholder-ink-500'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 p-0.5"
                      title="مسح البحث"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Direct Jump Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={scrollToBottom}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 border active:scale-95 ${
                      isLight 
                        ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-700' 
                        : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-300'
                    }`}
                    title="القفز لنهاية القائمة (الأقل تكراراً)"
                  >
                    <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">الأسفل</span>
                  </button>
                  <button
                    onClick={scrollToTop}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 border active:scale-95 ${
                      isLight 
                        ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-700' 
                        : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-300'
                    }`}
                    title="القفز لبداية القائمة (الأعلى تكراراً)"
                  >
                    <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">الأعلى</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Expandable Criteria Panel */}
            {showFilters && (
              <div className={`p-2.5 sm:p-3.5 border-t space-y-3 transition-all text-xs ${
                isLight ? 'bg-ink-50/95 border-ink-200' : 'bg-ink-950/90 border-ink-800'
              }`}>
                {/* Responsive Criteria Grid */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  
                  {/* 1. Metric Selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-ink-500 block">
                      معيار الترتيب:
                    </span>
                    <div className={`inline-flex items-center gap-1 p-0.5 sm:p-1 rounded-xl border ${
                      isLight ? 'bg-white border-ink-300' : 'bg-ink-900 border-ink-800'
                    }`}>
                      <button
                        onClick={() => setMetric('count')}
                        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all ${
                          metric === 'count'
                            ? 'bg-[#1A5C5C] text-white shadow-sm'
                            : isLight 
                              ? 'text-ink-600 hover:text-ink-900' 
                              : 'text-ink-400 hover:text-ink-200'
                        }`}
                        title="عرض وترتيب السور بحسب التعداد الحقيقي"
                      >
                        <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>التعداد الحقيقي</span>
                      </button>
                      <button
                        onClick={() => setMetric('percentage')}
                        className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold transition-all ${
                          metric === 'percentage'
                            ? 'bg-[#1A5C5C] text-white shadow-sm'
                            : isLight 
                              ? 'text-ink-600 hover:text-ink-900' 
                              : 'text-ink-400 hover:text-ink-200'
                        }`}
                        title="عرض وترتيب السور بحسب النسبة المئوية"
                      >
                        <Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>النسبة المئوية (%)</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Sort Order */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-ink-500 block">
                      اتجاه الترتيب:
                    </span>
                    <div className={`inline-flex items-center gap-1 p-0.5 sm:p-1 rounded-xl border ${
                      isLight ? 'bg-white border-ink-300' : 'bg-ink-900 border-ink-800'
                    }`}>
                      <button
                        onClick={() => setSortOrder('desc')}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono transition-all ${
                          sortOrder === 'desc'
                            ? isLight
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : isLight ? 'text-ink-600 hover:text-ink-900' : 'text-ink-400 hover:text-ink-200'
                        }`}
                        title="من الأكثر إلى الأقل"
                      >
                        تنازلي (الأكثر أولاً)
                      </button>
                      <button
                        onClick={() => setSortOrder('asc')}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono transition-all ${
                          sortOrder === 'asc'
                            ? isLight
                              ? 'bg-green-100 text-green-800 border border-green-300 font-bold'
                              : 'bg-green-500/20 text-green-300 border border-green-500/40 font-bold'
                            : isLight ? 'text-ink-600 hover:text-ink-900' : 'text-ink-400 hover:text-ink-200'
                        }`}
                        title="من الأقل إلى الأكثر"
                      >
                        تصاعدي (الأقل أولاً)
                      </button>
                    </div>
                  </div>

                  {/* 3. Revelation Type Filter */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-ink-500 block">
                      مكان النزول:
                    </span>
                    <div className={`inline-flex items-center gap-1 p-0.5 sm:p-1 rounded-xl border ${
                      isLight ? 'bg-white border-ink-300' : 'bg-ink-900 border-ink-800'
                    }`}>
                      {[
                        { id: 'all', label: 'الكل' },
                        { id: 'Meccan', label: 'مكية' },
                        { id: 'Medinan', label: 'مدنية' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setTypeFilter(tab.id as any)}
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono transition-all ${
                            typeFilter === tab.id
                              ? isLight 
                                ? 'bg-ink-200 text-ink-900 font-bold' 
                                : 'bg-ink-800 text-ink-100 font-bold'
                              : isLight 
                                ? 'text-ink-600 hover:text-ink-900' 
                                : 'text-ink-400 hover:text-ink-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Exclude Zero Occurrences */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-ink-500 block">
                      السور الخالية:
                    </span>
                    <label className={`inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border select-none transition-colors ${
                      isLight 
                        ? 'bg-white border-ink-300 text-ink-800' 
                        : 'bg-ink-900 border-ink-800 text-ink-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={excludeZeroCount}
                        onChange={(e) => setExcludeZeroCount(e.target.checked)}
                        className="rounded bg-ink-800 border-ink-600 text-[#1A5C5C] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className="text-[11px] sm:text-xs font-mono font-medium">
                        استبعاد السور الخالية (تكرار = 0)
                      </span>
                    </label>
                  </div>

                </div>

                {/* Bottom of Criteria Panel: Helper Text & Collapse Button */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 dark:border-ink-800">
                  <span className="text-[10px] font-mono text-ink-500">
                    تُطبق هذه المعايير فورياً على ترتيب السور المعروضة
                  </span>
                  <button
                    onClick={() => setShowFilters(false)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border active:scale-95 ${
                      isLight 
                        ? 'bg-ink-200 hover:bg-ink-300 border-ink-300 text-ink-800' 
                        : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-200'
                    }`}
                    title="إخفاء لوحة المعايير للتركيز على القائمة"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>إخفاء المعايير</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* C. THE RANKED LIST OF SURAHS */}
          <div className="p-3 space-y-2 flex-1">
            {rankedSurahs.length === 0 ? (
              <div className={`p-8 text-center font-mono text-xs rounded-xl border ${
                isLight ? 'bg-ink-50 text-ink-500 border-ink-200' : 'bg-ink-900/30 text-ink-400 border-ink-800'
              }`}>
                لا توجد سور مطابقة لخيارات الفلترة المحددة.
              </div>
            ) : (
              <div className="space-y-1.5">
                {rankedSurahs.map((item, index) => {
                  const rankNumber = index + 1;
                  const isZero = item.count === 0;
                  const valuePercentOfMax = maxRefValue > 0 
                    ? ((metric === 'count' ? item.count : item.percentage) / maxRefValue) * 100 
                    : 0;

                  // Rank badge colors with robust theme support
                  const rankBadgeClass = rankNumber === 1
                    ? isLight 
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold shadow-sm'
                    : rankNumber === 2
                      ? isLight 
                        ? 'bg-ink-200 text-ink-800 border-ink-300 font-bold' 
                        : 'bg-ink-300/20 text-ink-200 border-ink-300/40 font-bold'
                      : rankNumber === 3
                        ? isLight 
                          ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold' 
                          : 'bg-amber-700/20 text-amber-400 border-amber-700/40 font-bold'
                        : isLight 
                          ? 'bg-ink-100 text-ink-700 border-ink-300 font-mono' 
                          : 'bg-ink-800/60 text-ink-400 border-ink-800 font-mono';

                  return (
                    <div
                      key={item.surah.number}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isZero
                          ? isLight 
                            ? 'bg-red-50/70 border-red-200' 
                            : 'bg-red-950/20 border-red-900/30'
                          : isLight
                            ? 'bg-white hover:bg-emerald-50/60 border-ink-200 text-ink-900 shadow-xs'
                            : 'bg-ink-900/60 hover:bg-ink-900 border-ink-800 text-ink-100'
                      }`}
                    >
                      {/* Left/Start: Rank & Surah Info */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {/* Rank Number Badge */}
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs shrink-0 ${rankBadgeClass}`}>
                          {rankNumber === 1 ? <Award className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} /> : `#${rankNumber}`}
                        </div>

                        {/* Surah Name & Metadata */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-heading font-bold text-sm sm:text-base ${
                              isLight ? 'text-ink-900' : 'text-ink-100'
                            }`}>
                              {formatSurahName(item.surah.name)}
                            </span>
                            <span className={`text-[10px] font-mono ${
                              isLight ? 'text-ink-500' : 'text-ink-400'
                            }`}>
                              ({item.surah.number})
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                              item.surah.isMeccan 
                                ? isLight 
                                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : isLight 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {item.surah.isMeccan ? 'مكية' : 'مدنية'}
                            </span>
                          </div>

                          <div className={`text-[10px] font-mono flex items-center gap-2 mt-0.5 ${
                            isLight ? 'text-ink-500' : 'text-ink-400'
                          }`}>
                            <span>{item.surah.totalChars.toLocaleString('en-US')} حرف إجمالي بالسورة</span>
                            <span>•</span>
                            <span>{item.surah.totalWords.toLocaleString('en-US')} كلمة</span>
                          </div>
                        </div>
                      </div>

                      {/* Right/End: Real Count, Percentage, Progress Bar & Actions */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-between sm:justify-end">
                        
                        {/* Quantitative metric details */}
                        <div className="text-right sm:text-left min-w-[130px]">
                          <div className="flex items-baseline gap-1.5 sm:justify-end">
                            <span className={`font-mono font-bold text-sm sm:text-base ${
                              isZero 
                                ? isLight ? 'text-red-600' : 'text-red-400' 
                                : isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'
                            }`}>
                              {metric === 'count' 
                                ? `${item.count.toLocaleString('en-US')} مرة`
                                : `${item.percentage}%`}
                            </span>
                            <span className={`text-[10px] font-mono ${
                              isLight ? 'text-ink-500' : 'text-ink-400'
                            }`}>
                              {metric === 'count' 
                                ? `(${item.percentage}%)`
                                : `(${item.count.toLocaleString('en-US')} مرة)`}
                            </span>
                          </div>

                          {/* Visual progress bar */}
                          <div className={`w-full sm:w-32 h-1.5 rounded-full overflow-hidden mt-1 ${
                            isLight ? 'bg-ink-200' : 'bg-ink-800'
                          }`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                isZero
                                  ? 'bg-red-500/40'
                                  : rankNumber === 1
                                    ? isLight ? 'bg-amber-500' : 'bg-amber-400'
                                    : isLight ? 'bg-[#1A5C5C]' : 'bg-[#2FA89D]'
                              }`}
                              style={{ width: `${Math.max(valuePercentOfMax, 1)}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 mr-2">
                          <button
                            onClick={() => {
                              onSelectSurah(item.surah);
                              onClose();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 border active:scale-95 ${
                              isLight 
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800' 
                                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                            }`}
                            title="فتح نافذة بصمة السورة"
                          >
                            <span>البصمة</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {onOpenInReader && (
                            <button
                              onClick={() => {
                                onOpenInReader(item.surah.number);
                                onClose();
                              }}
                              className={`p-1.5 rounded-lg text-[11px] transition-all border active:scale-95 ${
                                isLight 
                                  ? 'bg-ink-100 hover:bg-ink-200 border-ink-300 text-ink-700 hover:text-ink-900' 
                                  : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-300 hover:text-white'
                              }`}
                              title="قراءة في المصحف"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* D. DEDICATED BOTTOM INFORMATION SECTION */}
            <div className={`mt-4 p-3.5 rounded-xl border space-y-2.5 font-mono text-xs transition-colors ${
              isLight ? 'bg-ink-50 border-ink-200 text-ink-800' : 'bg-ink-900/60 border-ink-800 text-ink-300'
            }`}>
              <div className="flex items-center justify-between border-b pb-2 border-inherit">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-sm">
                    ملخص نهاية القائمة بحرف «{letter}»
                  </span>
                </div>
                <button 
                  onClick={scrollToTop}
                  className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <ArrowUp className="w-3 h-3" />
                  <span>العودة لأعلى القائمة</span>
                </button>
              </div>

              {/* Absent surahs full list */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-ink-500 text-[11px]">
                    السور الخالية تماماً من حرف «{letter}» (تكرار = 0):
                  </span>
                  <span className={`font-bold ${
                    letterStatsSummary.zeroCount > 0 
                      ? isLight ? 'text-red-600' : 'text-red-400' 
                      : isLight ? 'text-emerald-600' : 'text-emerald-400'
                  }`}>
                    {letterStatsSummary.zeroCount > 0 
                      ? `${letterStatsSummary.zeroCount} سورة` 
                      : 'لا توجد (موجود في جميع سور القرآن الـ 114)'}
                  </span>
                </div>

                {letterStatsSummary.zeroCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-inherit max-h-36 overflow-y-auto">
                    {letterStatsSummary.zeroSurahs.map(s => (
                      <button
                        key={s.number}
                        onClick={() => {
                          onSelectSurah(s);
                          onClose();
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-heading border transition-all active:scale-95 ${
                          isLight 
                            ? 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200 font-semibold' 
                            : 'bg-red-950/40 hover:bg-red-900/50 text-red-300 border-red-800/40'
                        }`}
                        title={`${formatSurahName(s.name)} (${s.number}) - اضغط لاستعراض بصمتها`}
                      >
                        {formatSurahName(s.name)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Note on data */}
              <p className={`text-[10px] leading-relaxed ${isLight ? 'text-ink-500' : 'text-ink-400'}`}>
                تم إحصاء مرات الورود بحسب الرسم العثماني الشريف المعتمد لمصحف المدينة المنورة (6,236 آية). التعداد الحقيقي يمثل عدد الحروف الفعلية، بينما النسبة المئوية تمثل حصة الحرف من مجموع أحرف السورة.
              </p>
            </div>
          </div>
        </div>

        {/* 4. FLOATING QUICK JUMP PILL BUTTON */}
        <div className="absolute bottom-16 left-4 z-30 pointer-events-auto">
          {isScrolledDown ? (
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border text-xs font-mono font-bold bg-[#1A5C5C] hover:bg-[#164e4e] text-white border-emerald-600 active:scale-95 transition-all"
              title="الصعود إلى أعلى القائمة"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>للأعلى</span>
            </button>
          ) : (
            <button
              onClick={scrollToBottom}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border text-xs font-mono font-bold active:scale-95 transition-all ${
                isLight 
                  ? 'bg-white hover:bg-ink-100 text-ink-800 border-ink-300 shadow-ink-300' 
                  : 'bg-ink-900 hover:bg-ink-800 text-emerald-300 border-ink-700 shadow-black'
              }`}
              title="النزول المباشر إلى أسفل القائمة لرؤية السور الأقل تكراراً والخالية"
            >
              <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>النزول للأسفل</span>
            </button>
          )}
        </div>

        {/* 5. MODAL FOOTER (PINNED AT BOTTOM) */}
        <div className={`p-2.5 sm:p-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono shrink-0 ${
          isLight 
            ? 'bg-ink-50 border-ink-200 text-ink-700' 
            : 'bg-ink-950 border-ink-800 text-ink-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>
              عرض <strong className={isLight ? 'text-[#1A5C5C] font-bold' : 'text-emerald-400 font-bold'}>{rankedSurahs.length}</strong> سورة بحسب حرف «{letter}»
            </span>
            <span>•</span>
            <span className={isLight ? 'text-ink-500' : 'text-ink-500'}>
              {excludeZeroCount ? 'مستبعد منها السور الخالية (0)' : 'متضمنة السور الخالية'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollToBottom}
              className={`px-3 py-1 rounded-lg font-mono text-xs transition-all border flex items-center gap-1 ${
                isLight 
                  ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-700' 
                  : 'bg-ink-900 hover:bg-ink-800 border-ink-700 text-ink-300'
              }`}
            >
              <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>نهاية القائمة</span>
            </button>

            <button
              onClick={onClose}
              className={`px-4 py-1 rounded-lg font-mono text-xs transition-all border font-bold ${
                isLight 
                  ? 'bg-ink-200 hover:bg-ink-300 border-ink-300 text-ink-800' 
                  : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-200'
              }`}
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

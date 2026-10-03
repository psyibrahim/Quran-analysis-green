import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  BookOpen, 
  Copy, 
  Check, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Layers,
  Filter,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { QuranAyah, QuranSurahCorpus } from '../types';
import { 
  WordFrequencyItem, 
  LexicalFilterOptions, 
  findMatchingAyahsForWord, 
  MatchedAyahResult,
  cleanArabicWord
} from '../utils/lexicalFilters';
import { formatSurahName, normalizeArabicText, matchAyahTokens } from '../utils/arabic';
import { useTheme } from '../context/ThemeContext';

export interface WordVersesModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  surahName: string;
  surahNumber: number;
  totalSurahAyahs: number;
  wordItem?: WordFrequencyItem;
  corpusSurah?: QuranSurahCorpus;
  lexicalOptions?: LexicalFilterOptions;
  onOpenInReader?: (surahNumber: number) => void;
}

export const WordVersesModal: React.FC<WordVersesModalProps> = ({
  isOpen,
  onClose,
  word,
  surahName,
  surahNumber,
  totalSurahAyahs,
  wordItem,
  corpusSurah,
  lexicalOptions,
  onOpenInReader,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [copiedAyahNum, setCopiedAyahNum] = useState<number | null>(null);
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [selectedVariantFilter, setSelectedVariantFilter] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(22);
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);

  // Header collapse state (defaults to false so merged words bar is immediately visible)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Extract EXCLUSIVELY the matching ayahs containing the target word
  const { matchingAyahs, totalOccurrences } = useMemo(() => {
    if (!corpusSurah || !corpusSurah.ayahs || !word) {
      return { matchingAyahs: [] as MatchedAyahResult[], totalOccurrences: 0 };
    }
    return findMatchingAyahsForWord(
      corpusSurah.ayahs,
      word,
      lexicalOptions,
      wordItem?.mergedVariants
    );
  }, [corpusSurah, word, lexicalOptions, wordItem?.mergedVariants]);

  // Pre-calculate full merged variants breakdown with exact counts
  const actualMergedVariants = useMemo(() => {
    if (wordItem?.mergedVariants && wordItem.mergedVariants.length > 0) {
      return wordItem.mergedVariants;
    }
    const counts: Record<string, number> = {};
    (matchingAyahs || []).forEach(item => {
      if (!item || !item.ayah) return;
      const tokens = (item.ayah.textUthmani || item.ayah.textSimple || '').trim().split(/\s+/);
      (item.matchedTokenIndices || []).forEach(idx => {
        const raw = tokens[idx];
        if (raw) {
          const v = cleanArabicWord(raw) || raw;
          if (v) {
            counts[v] = (counts[v] || 0) + 1;
          }
        }
      });
    });
    return Object.entries(counts)
      .map(([variant, count]) => ({ variant, count }))
      .sort((a, b) => b.count - a.count);
  }, [wordItem?.mergedVariants, matchingAyahs]);

  // Filter matching ayahs by internal search query and selected merged variant filter
  const displayedAyahs = useMemo(() => {
    let list = matchingAyahs || [];

    // 1. Filter by specific merged variant if selected by user
    if (selectedVariantFilter) {
      const cleanVar = cleanArabicWord(selectedVariantFilter) || selectedVariantFilter;
      const normVar = normalizeArabicText(selectedVariantFilter);

      list = list.filter(item => {
        if (!item || !item.ayah) return false;
        const tokens = (item.ayah.textUthmani || item.ayah.textSimple || '').trim().split(/\s+/);

        return (item.matchedTokenIndices || []).some(idx => {
          const raw = tokens[idx];
          if (!raw) return false;
          const std = cleanArabicWord(raw);

          return (
            std === selectedVariantFilter ||
            std === cleanVar ||
            raw === selectedVariantFilter ||
            std.replace(/ى/g, 'ي') === cleanVar.replace(/ى/g, 'ي') ||
            std.replace(/ي/g, 'ى') === cleanVar.replace(/ي/g, 'ى') ||
            std.replace(/ة/g, 'ه') === cleanVar.replace(/ة/g, 'ه') ||
            normalizeArabicText(std) === normVar
          );
        });
      });
    }

    // 2. Filter by search query with strict Tokenization
    if (!internalSearch.trim()) {
      return list;
    }
    const rawQ = internalSearch.trim();
    if (/^\d+$/.test(rawQ)) {
      const num = parseInt(rawQ, 10);
      return list.filter(item => item?.ayah?.numberInSurah === num);
    }
    return list.filter(item => {
      if (!item || !item.ayah) return false;
      const textUthmani = item.ayah.textUthmani || '';
      const textSimple = item.ayah.textSimple || '';
      const tokenMatch = matchAyahTokens(textUthmani || textSimple, rawQ);
      return tokenMatch.isMatch;
    });
  }, [matchingAyahs, internalSearch, selectedVariantFilter]);

  const handleCopyAyah = (ayah: QuranAyah) => {
    const sName = ayah.surahName || surahName;
    const textToCopy = `${ayah.textUthmani} ﴿${ayah.numberInSurah}﴾ [${formatSurahName(sName)}]`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAyahNum(ayah.numberInSurah);
    setTimeout(() => {
      setCopiedAyahNum(null);
    }, 2000);
  };

  if (!isOpen) return null;

  const coveragePercentage = totalSurahAyahs > 0 
    ? ((matchingAyahs.length / totalSurahAyahs) * 100).toFixed(1) 
    : '0';

  const excludedNonMatchingCount = Math.max(0, totalSurahAyahs - matchingAyahs.length);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 md:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-4xl h-[94vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-ink-200 text-ink-900' : 'bg-[#0B1716] border-ink-800 text-ink-100'
          }`}
          dir="rtl"
        >
          {/* HEADER SECTION (COLLAPSIBLE / COMPACT) */}
          <div className={`border-b transition-all shrink-0 ${
            isLight ? 'bg-ink-50/95 border-ink-200' : 'bg-[#10211F] border-ink-800/80'
          }`}>
            {/* PRIMARY COMPACT BAR (Always visible and ultra-clean on mobile) */}
            <div className="p-2.5 sm:p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>

                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span className="text-xs sm:text-sm font-semibold text-ink-400 hidden xs:inline">
                    لفظ:
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg font-heading text-base sm:text-lg font-bold border shadow-xs ${
                    isLight 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {word}
                  </span>
                  <span className="text-xs text-ink-400 hidden sm:inline">في</span>
                  <span className={`font-heading font-bold text-xs sm:text-sm truncate ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-300'}`}>
                    {formatSurahName(surahName)}
                  </span>
                  
                  {/* Matching verses badge */}
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border shrink-0 ${
                    isLight 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {matchingAyahs.length} آية
                  </span>

                  {/* Merged variants indicator pill if multiple surface forms exist */}
                  {actualMergedVariants && actualMergedVariants.length > 1 && (
                    <button
                      onClick={() => setIsHeaderCollapsed(false)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                        selectedVariantFilter
                          ? isLight
                            ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                          : isLight 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                      }`}
                      title="انقر لعرض وتصفية الصيغ المدمجة (مثل: ولا، فلا، بلا، لا)"
                    >
                      <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{actualMergedVariants.length} صيغ مدمجة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action controls in top bar */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Font Size Adjusters (Always accessible even in compact mode) */}
                <div className="hidden xs:flex items-center bg-black/20 px-1.5 py-0.5 rounded-lg border border-ink-700/40 text-xs">
                  <button
                    onClick={() => setFontSize(s => Math.max(16, s - 2))}
                    disabled={fontSize <= 16}
                    className="p-1 rounded hover:bg-ink-700 disabled:opacity-30 transition-colors"
                    title="تصغير خط الآيات"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold w-4 text-center">{fontSize}</span>
                  <button
                    onClick={() => setFontSize(s => Math.min(32, s + 2))}
                    disabled={fontSize >= 32}
                    className="p-1 rounded hover:bg-ink-700 disabled:opacity-30 transition-colors"
                    title="تكبير خط الآيات"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Search Toggle */}
                <button
                  onClick={() => setShowSearchInput(prev => !prev)}
                  className={`p-1.5 rounded-xl border transition-all ${
                    showSearchInput || internalSearch
                      ? 'bg-[#1A5C5C] text-white border-teal-600'
                      : isLight 
                        ? 'hover:bg-ink-200 border-ink-200 text-ink-600' 
                        : 'hover:bg-ink-800 border-ink-700 text-ink-300'
                  }`}
                  title="بحث سريع في الآيات"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Collapse / Expand Header Details Toggle */}
                <button
                  onClick={() => setIsHeaderCollapsed(prev => !prev)}
                  className={`px-2 py-1 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                    isHeaderCollapsed
                      ? isLight 
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold' 
                        : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-700/60 text-emerald-300 font-semibold'
                      : isLight
                        ? 'bg-ink-100 hover:bg-ink-200 border-ink-300 text-ink-700'
                        : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-300'
                  }`}
                  title={isHeaderCollapsed ? 'إظهار الكلمات المدمجة وتفاصيل الإحصاءات' : 'إخفاء الشريط العلوي للتركيز على قراءة الآيات'}
                >
                  {isHeaderCollapsed ? (
                    <>
                      <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>الكلمات المدمجة ({actualMergedVariants?.length || 1})</span>
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                      <span>إخفاء الشريط العلوي</span>
                    </>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-95 ${
                    isLight 
                      ? 'hover:bg-ink-200 border-ink-200 text-ink-600' 
                      : 'hover:bg-ink-800 border-ink-700 text-ink-300'
                  }`}
                  title="إغلاق النافذة (Esc)"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* EXPANDED DETAILS (Collapsible: can be hidden on mobile or on demand) */}
            {!isHeaderCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden border-t border-ink-700/20"
              >
                {/* Precision Note */}
                <div className={`px-3 sm:px-5 py-2 text-[11px] sm:text-xs flex items-center justify-between gap-2 ${
                  isLight ? 'bg-ink-100/70 text-ink-600' : 'bg-ink-900/40 text-ink-400'
                }`}>
                  <p className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                      <Filter className="w-3 h-3" />
                      حصر حصري:
                    </span>
                    <span>تُعرض حصراً الآيات الحاوية لهذا اللفظ</span>
                    <span className="opacity-75 hidden sm:inline">
                      (استُبعدت {excludedNonMatchingCount} آية لعدم احتوائها على الكلمة).
                    </span>
                  </p>

                  <button
                    onClick={() => setIsHeaderCollapsed(true)}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono shrink-0"
                  >
                    تصغير الترويسة ▲
                  </button>
                </div>

                {/* STATS STRIP */}
                <div className={`px-3 sm:px-5 py-2.5 border-t flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono ${
                  isLight ? 'bg-emerald-50/40 border-ink-200' : 'bg-ink-900/60 border-ink-800/80'
                }`}>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-ink-400">مرات التكرار:</span>
                      <strong className={`font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`}>
                        {totalOccurrences || wordItem?.count || 0}
                      </strong>
                    </div>

                    <span className="text-ink-500">•</span>

                    <div className="flex items-center gap-1">
                      <span className="text-ink-400">الآيات الحاوية:</span>
                      <strong className="text-emerald-400 font-bold">
                        {matchingAyahs.length}
                      </strong>
                      <span className="text-[10px] text-ink-400">
                        من {totalSurahAyahs} ({coveragePercentage}%)
                      </span>
                    </div>

                    {wordItem?.percentage !== undefined && (
                      <>
                        <span className="text-ink-500">•</span>
                        <div className="flex items-center gap-1">
                          <span className="text-ink-400">النسبة:</span>
                          <strong className="text-amber-400 font-bold">
                            {wordItem.percentage}%
                          </strong>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Font Zoom buttons on very small screens */}
                  <div className="flex xs:hidden items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg border border-ink-700/40">
                    <span className="text-[10px] text-ink-400">الخط:</span>
                    <button
                      onClick={() => setFontSize(s => Math.max(16, s - 2))}
                      disabled={fontSize <= 16}
                      className="p-0.5 text-xs"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-bold">{fontSize}</span>
                    <button
                      onClick={() => setFontSize(s => Math.min(32, s + 2))}
                      disabled={fontSize >= 32}
                      className="p-0.5 text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* MERGED VARIANTS INTERACTIVE STRIP (When multiple surface forms are unified under this word) */}
                {actualMergedVariants && actualMergedVariants.length > 1 && (
                  <div className={`px-3 sm:px-5 py-2.5 border-t flex flex-wrap items-center gap-2 text-xs transition-colors ${
                    isLight 
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                      : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-100'
                  }`}>
                    <span className="font-bold flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Layers className="w-4 h-4" />
                      الكلمات المدمجة ({actualMergedVariants.length}):
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {/* All variants button */}
                      <button
                        onClick={() => setSelectedVariantFilter(null)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                          selectedVariantFilter === null
                            ? isLight
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-emerald-500 text-ink-950 border-emerald-400 shadow-xs font-black'
                            : isLight
                              ? 'bg-white hover:bg-emerald-100/70 border-emerald-300 text-emerald-800'
                              : 'bg-emerald-900/40 hover:bg-emerald-900/70 border-emerald-700/60 text-emerald-300'
                        }`}
                      >
                        عرض الكل ({totalOccurrences || matchingAyahs.length})
                      </button>

                      {/* Individual variant pills */}
                      {actualMergedVariants.map((v, vIdx) => {
                        const isSelected = selectedVariantFilter === v.variant;
                        return (
                          <button
                            key={vIdx}
                            onClick={() => setSelectedVariantFilter(isSelected ? null : v.variant)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-all cursor-pointer border flex items-center gap-1 ${
                              isSelected
                                ? isLight
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-bold ring-2 ring-amber-300'
                                  : 'bg-amber-400 text-ink-950 border-amber-300 shadow-xs font-black ring-2 ring-amber-500/40'
                                : isLight 
                                  ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-800 hover:border-emerald-400' 
                                  : 'bg-ink-900/70 hover:bg-ink-800 border-ink-700 text-ink-200 hover:border-emerald-500/50'
                            }`}
                            title={`تصفية الآيات لعرض صيغة "${v.variant}" فقط`}
                          >
                            <span className="font-heading font-bold text-xs">{v.variant}</span>
                            <span className={`text-[10px] px-1 rounded-full ${
                              isSelected 
                                ? 'bg-black/20 text-inherit' 
                                : 'bg-ink-200 dark:bg-ink-800 text-ink-600 dark:text-ink-400'
                            }`}>
                              {v.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ACTIVE VARIANT FILTER BANNER (Visible when a variant filter is active, especially useful when header is collapsed) */}
            {selectedVariantFilter && (
              <div className={`px-3 sm:px-5 py-1.5 border-t flex items-center justify-between gap-2 text-xs font-mono shrink-0 ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-800/40 text-amber-200'
              }`}>
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>تصفية بالصيغة المدمجة:</span>
                  <strong className="font-heading font-bold text-sm text-amber-600 dark:text-amber-400">
                    "{selectedVariantFilter}"
                  </strong>
                  <span className="text-[11px] text-ink-500 dark:text-ink-400">
                    ({displayedAyahs.length} آية)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedVariantFilter(null)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 font-bold"
                >
                  <X className="w-3 h-3" />
                  <span>إلغاء التصفية</span>
                </button>
              </div>
            )}

            {/* QUICK SEARCH CONTROLLER (Collapsible or visible if search active) */}
            {(showSearchInput || internalSearch) && (
              <div className={`p-2 sm:px-4 border-t shrink-0 ${
                isLight ? 'bg-white border-ink-200' : 'bg-[#0B1716] border-ink-800/80'
              }`}>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-ink-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={internalSearch}
                    onChange={(e) => setInternalSearch(e.target.value)}
                    placeholder={`بحث برقم الآية أو بكلمة داخل الآيات الـ ${matchingAyahs.length}...`}
                    className={`w-full pr-8 pl-7 py-1.5 rounded-lg text-xs font-mono border focus:outline-none transition-all ${
                      isLight 
                        ? 'bg-ink-50 border-ink-300 focus:border-emerald-500 text-ink-900' 
                        : 'bg-[#142825] border-ink-700/70 focus:border-emerald-500 text-ink-100'
                    }`}
                    autoFocus
                  />
                  {internalSearch ? (
                    <button
                      onClick={() => setInternalSearch('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-ink-700 text-ink-400"
                      title="مسح البحث"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSearchInput(false)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-400 hover:text-ink-200 font-mono"
                    >
                      إغلاق
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SCROLLABLE VERSES LIST */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-5 space-y-2.5 sm:space-y-3.5 min-h-[200px]">
            {displayedAyahs.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-ink-500 opacity-60" />
                <p className="text-sm text-ink-400">
                  {internalSearch 
                    ? 'لا توجد آيات مطابقة لعبارة البحث المحددة.' 
                    : 'لم يتم العثور على آيات تحتوي هذا اللفظ في السورة المحددة.'}
                </p>
                {internalSearch && (
                  <button
                    onClick={() => setInternalSearch('')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 underline font-mono hover:text-emerald-300"
                  >
                    إعادة عرض كافة الآيات الحاوية للفظ ({matchingAyahs.length} آية)
                  </button>
                )}
              </div>
            ) : (
              displayedAyahs.map((item, idx) => {
                const { ayah, occurrencesCount, matchedTokenIndices } = item;
                const isCopied = copiedAyahNum === ayah.numberInSurah;
                const tokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/);
                const matchedSet = new Set(matchedTokenIndices);

                return (
                  <div
                    key={`${ayah.surahNumber || surahNumber}-${ayah.numberInSurah}`}
                    id={`word-ayah-${ayah.surahNumber || surahNumber}-${ayah.numberInSurah}`}
                    className={`p-2.5 sm:p-4 rounded-xl border transition-all ${
                      isLight 
                        ? 'bg-ink-50 hover:bg-emerald-50/30 border-ink-200' 
                        : 'bg-[#10211F] hover:bg-[#10211F] border-ink-800'
                    }`}
                  >
                    {/* Verse Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-ink-700/30 text-xs font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Surah Name Tag (if in multi-surah/cluster mode) */}
                        {ayah.surahName && (
                          <span className={`px-2 py-0.5 rounded-lg font-bold border text-[11px] sm:text-xs ${
                            isLight
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-heading'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-heading'
                          }`}>
                            {formatSurahName(ayah.surahName)}
                          </span>
                        )}

                        {/* Ayah Number Pill */}
                        <span className={`px-2 py-0.5 rounded-lg font-bold border text-[11px] sm:text-xs ${
                          isLight 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          الآية {ayah.numberInSurah}
                        </span>

                        <span className="text-[10px] sm:text-[11px] text-ink-400">
                          (جزء {ayah.juz} • ص {ayah.page})
                        </span>
                      </div>

                      {/* Repetition indicator in this verse & actions */}
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold border ${
                          occurrencesCount > 1
                            ? isLight 
                              ? 'bg-amber-100 text-amber-900 border-amber-300' 
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : isLight
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                        }`}>
                          {occurrencesCount > 1 
                            ? `${occurrencesCount} مرات` 
                            : 'ورود واحد'}
                        </span>

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyAyah(ayah)}
                          className={`p-1 sm:p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                            isCopied 
                              ? 'bg-emerald-500 text-white border-emerald-500' 
                              : isLight 
                                ? 'bg-white hover:bg-ink-100 border-ink-200 text-ink-600' 
                                : 'bg-[#142825] hover:bg-ink-700 border-ink-700 text-ink-300'
                          }`}
                          title="نسخ نص الآية"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden md:inline">
                            {isCopied ? 'تم النسخ' : 'نسخ'}
                          </span>
                        </button>

                        {/* Open in Reader Button */}
                        {onOpenInReader && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenInReader(ayah.surahNumber || surahNumber);
                            }}
                            className={`p-1 sm:p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                              isLight 
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700' 
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800/60 text-emerald-300'
                            }`}
                            title="فتح هذه السورة في القارئ"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden md:inline">في القارئ</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quranic Text Display with Word Highlighting */}
                    <div 
                      className="font-quran leading-[2.1] sm:leading-[2.3] text-right"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {tokens.map((tok, tIdx) => {
                        const isTokenMatched = matchedSet.has(tIdx);
                        const isMatch = isTokenMatched && (
                          !selectedVariantFilter ||
                          (() => {
                            const std = cleanArabicWord(tok);
                            const cleanVar = cleanArabicWord(selectedVariantFilter) || selectedVariantFilter;
                            return (
                              std === selectedVariantFilter ||
                              std === cleanVar ||
                              tok === selectedVariantFilter ||
                              std.replace(/ى/g, 'ي') === cleanVar.replace(/ى/g, 'ي') ||
                              std.replace(/ي/g, 'ى') === cleanVar.replace(/ي/g, 'ى') ||
                              std.replace(/ة/g, 'ه') === cleanVar.replace(/ة/g, 'ه') ||
                              normalizeArabicText(std) === normalizeArabicText(selectedVariantFilter)
                            );
                          })()
                        );

                        if (isMatch) {
                          return (
                            <React.Fragment key={tIdx}>
                              <mark 
                                className={`inline-block px-1 sm:px-1.5 py-0.5 mx-0.5 rounded-md font-bold transition-all shadow-xs ${
                                  isLight 
                                    ? 'bg-amber-200 text-amber-950 border border-amber-400' 
                                    : 'bg-amber-400/25 text-amber-200 border border-amber-400/40'
                                }`}
                              >
                                {tok}
                              </mark>
                              {' '}
                            </React.Fragment>
                          );
                        }

                        return (
                          <span 
                            key={tIdx} 
                            className={isLight ? 'text-ink-900' : 'text-ink-100'}
                          >
                            {tok}{' '}
                          </span>
                        );
                      })}

                      {/* Verse Ending Ornament */}
                      <span className="inline-flex items-center justify-center mx-1 text-[#1A5C5C] dark:text-[#C5A16A] font-serif select-none text-base">
                        ﴿{ayah.numberInSurah}﴾
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* BOTTOM FOOTER */}
          <div className={`p-2 sm:p-2.5 sm:px-4 border-t flex items-center justify-between gap-2 text-[11px] sm:text-xs font-mono shrink-0 ${
            isLight ? 'bg-ink-50 border-ink-200 text-ink-600' : 'bg-[#10211F] border-ink-800/80 text-ink-400'
          }`}>
            <span className="truncate">
              عرض {displayedAyahs.length} آية من {formatSurahName(surahName)}
            </span>
            <button
              onClick={onClose}
              className={`px-3 py-1 rounded-xl border text-xs font-sans font-bold transition-colors shrink-0 ${
                isLight 
                  ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-800' 
                  : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-200'
              }`}
            >
              إغلاق
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  AlignJustify, 
  List, 
  Sparkles,
  ArrowRightLeft,
  GitCompare,
  Flame,
  Music,
  BarChart3,
  SlidersHorizontal,
  Info,
  X,
  BookOpen
} from 'lucide-react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { SectionHelpButton } from './SectionHelpModal';
import { matchAyahTokens, formatSurahName, getCleanSurahName } from '../utils/arabic';
import { WordMatchMode } from '../types';
import { VerseNumberMedallion } from './ui/VerseNumberMedallion';
import { ManuscriptCorner } from './ui/ManuscriptCorner';
import { SegmentedControl } from './ui/SegmentedControl';
import { ResearchButton } from './ui/ResearchButton';
import { ResearchCard } from './ui/ResearchCard';

interface QuranReaderProps {
  onSelectSurahForAnalysis?: (surahNumber: number) => void;
  onNavigateTab?: (tab: any) => void;
  onCompareWith?: (surahA: number, surahB?: number) => void;
}

const QuranReaderComponent: React.FC<QuranReaderProps> = ({ 
  onSelectSurahForAnalysis,
  onNavigateTab,
  onCompareWith
}) => {
  const { 
    activeMushaf,
    setActiveMushaf,
    activeMeta,
    corpus, 
    surahs,
    selectedReaderSurah, 
    setSelectedReaderSurah, 
    includeBasmalahInFatihah, 
    readingMode,
    setReadingMode
  } = useQuranCorpus();

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [readerSearchMode, setReaderSearchMode] = useState<WordMatchMode>('lemma_affixes');
  const [fontSize, setFontSize] = useState<number>(24);
  const [activeAyahHover, setActiveAyahHover] = useState<number | null>(null);
  const [targetAyahInput, setTargetAyahInput] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Current surah data
  const currentCorpusSurah = useMemo(() => {
    return corpus.find(s => s.number === selectedReaderSurah) || corpus[0];
  }, [corpus, selectedReaderSurah]);

  const currentStatsSurah = useMemo(() => {
    return surahs.find(s => s.number === selectedReaderSurah) || surahs[0];
  }, [surahs, selectedReaderSurah]);

  // Top letters for this surah's mini linguistic fingerprint
  const topLettersInSurah = useMemo(() => {
    if (!currentStatsSurah?.letters?.plainCounts) return [];
    return Object.entries(currentStatsSurah.letters.plainCounts)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 6)
      .map(([letter, count]) => {
        const pct = currentStatsSurah.letters.plainPercentages?.[letter] || 0;
        return { letter, count, pct };
      });
  }, [currentStatsSurah]);

  // Filtered ayahs based on search query and Fatihah Basmalah setting
  const filteredAyahs = useMemo(() => {
    let list = currentCorpusSurah.ayahs;
    if (activeMushaf === 'kufi' && currentCorpusSurah.number === 1 && !includeBasmalahInFatihah) {
      list = [
        { numberInSurah: 1, numberInQuran: 2, textUthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', textSimple: 'الحمد لله رب العالمين', juz: 1, page: 1 },
        { numberInSurah: 2, numberInQuran: 3, textUthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', textSimple: 'الرحمن الرحيم', juz: 1, page: 1 },
        { numberInSurah: 3, numberInQuran: 4, textUthmani: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', textSimple: 'مالك يوم الدين', juz: 1, page: 1 },
        { numberInSurah: 4, numberInQuran: 5, textUthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', textSimple: 'إياك نعبد وإياك نستعين', juz: 1, page: 1 },
        { numberInSurah: 5, numberInQuran: 6, textUthmani: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', textSimple: 'اهدنا الصراط المستقيم', juz: 1, page: 1 },
        { numberInSurah: 6, numberInQuran: 7, textUthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ', textSimple: 'صراط الذين أنعمت عليهم', juz: 1, page: 1 },
        { numberInSurah: 7, numberInQuran: 7, textUthmani: 'غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', textSimple: 'غير المغضوب عليهم ولا الضالين', juz: 1, page: 1 }
      ];
    }
    if (!searchQuery.trim()) return list;
    const rawQ = searchQuery.trim();
    if (/^\d+$/.test(rawQ)) {
      const targetNum = parseInt(rawQ, 10);
      return list.filter(a => a.numberInSurah === targetNum);
    }
    return list.filter(a => {
      const res = matchAyahTokens(a.textUthmani || a.textSimple, rawQ, readerSearchMode);
      return res.isMatch;
    });
  }, [activeMushaf, currentCorpusSurah, searchQuery, includeBasmalahInFatihah, readerSearchMode]);

  // Navigate to prev/next surah
  const handlePrevSurah = () => {
    if (selectedReaderSurah > 1) {
      setSelectedReaderSurah(selectedReaderSurah - 1);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextSurah = () => {
    if (selectedReaderSurah < 114) {
      setSelectedReaderSurah(selectedReaderSurah + 1);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToAyah = (e: React.FormEvent) => {
    e.preventDefault();
    const ayahNum = parseInt(targetAyahInput, 10);
    if (!isNaN(ayahNum) && ayahNum >= 1 && ayahNum <= currentCorpusSurah.totalAyahs) {
      const el = document.getElementById(`ayah-${ayahNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setActiveAyahHover(ayahNum);
      }
      setTargetAyahInput('');
    }
  };

  // Reusable Sidebar & Drawer Content for Contextual Analysis
  const renderSidebarContent = () => (
    <div className="space-y-4">
      {/* Card 1: معالم السورة الإحصائية */}
      <ResearchCard padding="md" className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#33433F] pb-2">
          <span className="text-xs font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#C5A16A]" />
            معلومات السورة
          </span>
          <span className="text-[11px] font-mono text-[#B8935F] font-bold">
            {currentCorpusSurah.isMeccan ? 'مكية' : 'مدنية'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-sans-arabic">
          <div className="p-2 rounded-[4px] bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9]/60 dark:border-[#33433F]">
            <div className="text-[10px] text-[#7B8885] dark:text-[#8B9B96]">عدد الآيات</div>
            <div className="text-sm font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {currentCorpusSurah.totalAyahs}
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9]/60 dark:border-[#33433F]">
            <div className="text-[10px] text-[#7B8885] dark:text-[#8B9B96]">عدد الكلمات</div>
            <div className="text-sm font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {currentStatsSurah.totalWords?.toLocaleString() || 0}
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9]/60 dark:border-[#33433F]">
            <div className="text-[10px] text-[#7B8885] dark:text-[#8B9B96]">عدد الحروف</div>
            <div className="text-sm font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {currentStatsSurah.totalChars?.toLocaleString() || 0}
            </div>
          </div>
          <div className="p-2 rounded-[4px] bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9]/60 dark:border-[#33433F]">
            <div className="text-[10px] text-[#7B8885] dark:text-[#8B9B96]">التنوع المفرداتي</div>
            <div className="text-sm font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {currentStatsSurah.vocabularyDiversity 
                ? `${(currentStatsSurah.vocabularyDiversity > 1 ? currentStatsSurah.vocabularyDiversity : currentStatsSurah.vocabularyDiversity * 100).toFixed(1)}%` 
                : '—'}
            </div>
          </div>
        </div>
      </ResearchCard>

      {/* Card 2: البصمة اللغوية المصغرة (أعلى الحروف تكراراً بالسورة) */}
      <ResearchCard padding="md" className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#33433F] pb-2">
          <span className="text-xs font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#C5A16A]" />
            البصمة اللغوية للسورة
          </span>
          <span className="text-[10px] text-[#7B8885]">أعلى الحروف وروداً</span>
        </div>

        <div className="space-y-2">
          {topLettersInSurah.map((item) => (
            <div key={item.letter} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-heading text-sm font-bold text-[#0F1419] dark:text-[#F4F0E7]">
                  {item.letter}
                </span>
                <span className="text-[#53605E] dark:text-[#B7C1BC] text-[11px] tabular-nums">
                  {item.count} مرة ({item.pct.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#DED8C9]/50 dark:bg-[#33433F] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A5C5C] dark:bg-[#2B7470]"
                  style={{ width: `${Math.min(100, item.pct * 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ResearchCard>

      {/* Card 3: أدوات التحليل المباشر والتكامل */}
      <ResearchCard padding="md" className="space-y-3">
        <div className="text-xs font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] flex items-center gap-1.5 border-b border-[#DED8C9] dark:border-[#33433F] pb-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#B8935F]" />
          أدوات التحليل المباشر
        </div>
        
        <div className="space-y-1.5">
          {/* 1. تقرير بصمة السورة الكامل */}
          {onSelectSurahForAnalysis && (
            <button
              type="button"
              onClick={() => {
                onSelectSurahForAnalysis(selectedReaderSurah);
                setMobileDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-[4px] border border-[#1A5C5C]/30 bg-[#1A5C5C]/5 dark:bg-[#1A5C5C]/15 hover:bg-[#1A5C5C]/10 text-xs font-sans-arabic font-bold text-[#1A5C5C] dark:text-[#C5A16A] transition-colors cursor-pointer text-right"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#B8935F]" />
                <span>تقرير بصمة السورة الكامل</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-[#7B8885]" />
            </button>
          )}

          {/* 2. مقارنة السورة مع سورة أخرى */}
          {onCompareWith && (
            <button
              type="button"
              onClick={() => {
                onCompareWith(selectedReaderSurah);
                setMobileDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-[4px] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3] dark:hover:bg-[#1E2D2C] text-xs font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] transition-colors cursor-pointer text-right"
            >
              <span className="flex items-center gap-2">
                <GitCompare className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#2B7470]" />
                <span>مقارنة هذه السورة مع سورة أخرى</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-[#7B8885]" />
            </button>
          )}

          {/* 3. خريطة الحروف التكرارية */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => {
                onNavigateTab('letters-heatmap');
                setMobileDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-[4px] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3] dark:hover:bg-[#1E2D2C] text-xs font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] transition-colors cursor-pointer text-right"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#B8935F]" />
                <span>خريطة الحروف التكرارية (114×28)</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-[#7B8885]" />
            </button>
          )}

          {/* 4. التحليل المعجمي وقانون زيف */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => {
                onNavigateTab('lexical-richness');
                setMobileDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-[4px] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3] dark:hover:bg-[#1E2D2C] text-xs font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] transition-colors cursor-pointer text-right"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#2B7470]" />
                <span>غنى المعجم ومنحنى زيف</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-[#7B8885]" />
            </button>
          )}

          {/* 5. فواصل الآيات والإيقاع الصوتي */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => {
                onNavigateTab('verse-endings');
                setMobileDrawerOpen(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-[4px] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3] dark:hover:bg-[#1E2D2C] text-xs font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] transition-colors cursor-pointer text-right"
            >
              <span className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-[#B8935F]" />
                <span>فواصل الآيات والإيقاع الصوتي</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-[#7B8885]" />
            </button>
          )}
        </div>
      </ResearchCard>
    </div>
  );

  return (
    <div className="space-y-5 pb-16">
      
      {/* 1. Compact Research Control Bar */}
      <div className="bg-[#FBF9F2] dark:bg-[#172322] border border-[#DED8C9] dark:border-[#33433F] rounded-[8px] p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Row 1 / Left Zone: Surah Navigator & Picker + Jump to Ayah */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* Surah Selector with Prev / Next */}
            <div className="flex items-center gap-1 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={handlePrevSurah}
                disabled={selectedReaderSurah <= 1}
                className="p-2 sm:p-1.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 transition-colors"
                title="السورة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <select
                value={selectedReaderSurah}
                onChange={(e) => {
                  setSelectedReaderSurah(Number(e.target.value));
                  setSearchQuery('');
                }}
                className="flex-1 sm:flex-initial py-2 sm:py-1.5 px-2.5 sm:px-3 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] cursor-pointer focus:outline-none focus:border-[#1A5C5C] dark:focus:border-[#2B7470] min-w-0"
              >
                {corpus.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {formatSurahName(s.name)} ({s.isMeccan ? 'مكية' : 'مدنية'} · {s.totalAyahs} آية)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextSurah}
                disabled={selectedReaderSurah >= 114}
                className="p-2 sm:p-1.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 transition-colors"
                title="السورة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Ayah Form */}
            <form onSubmit={handleJumpToAyah} className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min="1"
                max={currentCorpusSurah.totalAyahs}
                placeholder={`الآية (1-${currentCorpusSurah.totalAyahs})`}
                value={targetAyahInput}
                onChange={(e) => setTargetAyahInput(e.target.value)}
                className="flex-1 sm:w-28 py-2 sm:py-1.5 px-2.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-xs text-center font-mono text-[#0F1419] dark:text-[#F4F0E7] focus:outline-none focus:border-[#1A5C5C]"
              />
              <button
                type="submit"
                className="py-2 sm:py-1.5 px-3 rounded-[6px] border border-[#1A5C5C] bg-[#1A5C5C] hover:bg-[#144848] text-[#F4F0E7] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                انتقال
              </button>
            </form>
          </div>

          {/* Row 2 / Right Zone: Search, Reading Mode, Font Size, Analysis Launcher */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-1 xl:pt-0 border-t xl:border-t-0 border-[#DED8C9]/60 dark:border-[#33433F]/60">
            
            {/* Search Field inside Surah */}
            <div className="relative flex-1 sm:flex-initial sm:min-w-[170px] min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-[#7B8885] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في ألفاظ السورة..."
                className="w-full py-1.5 pr-8 pl-6 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-xs text-[#0F1419] dark:text-[#F4F0E7] placeholder:text-[#7B8885] focus:outline-none focus:border-[#1A5C5C]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#7B8885] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Reading Mode Segmented Control */}
            <SegmentedControl
              size="sm"
              value={readingMode}
              onChange={(val) => setReadingMode(val as 'verses' | 'mushaf')}
              options={[
                { value: 'verses', label: 'الآيات المفصلة', icon: <List className="w-3.5 h-3.5" /> },
                { value: 'mushaf', label: 'المصحف المتصل', icon: <AlignJustify className="w-3.5 h-3.5" /> },
              ]}
            />

            {/* Font Size Adjusters */}
            <div className="inline-flex items-center p-0.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F1ECE0] dark:bg-[#121C1B] text-xs font-mono shrink-0">
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.max(18, prev - 2))}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] cursor-pointer transition-colors"
                title="تصغير خط المصحف"
              >
                A-
              </button>
              <span className="px-1.5 text-[11px] font-bold text-[#0F1419] dark:text-[#F4F0E7] tabular-nums">
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.min(38, prev + 2))}
                className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] cursor-pointer transition-colors"
                title="تكبير خط المصحف"
              >
                A+
              </button>
            </div>

            {/* Mobile Analysis Launcher Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden flex items-center gap-1.5 py-1.5 px-2.5 rounded-[6px] border border-[#B8935F]/40 bg-[#F7F2E8] dark:bg-[#1D2B29] text-[#1A5C5C] dark:text-[#C5A16A] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="عرض معلومات وبصمة السورة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B8935F]" />
              <span>تحليلات السورة</span>
            </button>

            {/* Jump to Deep Surah Analysis Action */}
            {onSelectSurahForAnalysis && (
              <ResearchButton
                variant="primary"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5 text-[#C5A16A]" />}
                onClick={() => onSelectSurahForAnalysis(selectedReaderSurah)}
                className="hidden sm:inline-flex"
              >
                بصمة السورة
              </ResearchButton>
            )}

            {/* Help Drawer Button */}
            <SectionHelpButton
              guideId="quran-reader"
              variant="icon"
              title="دليل المتن القرآني والعد العثماني"
            />
          </div>

        </div>
      </div>

      {/* 2. Manuscript-Inspired Editorial Surah Header */}
      <div className="relative bg-[#FBF9F2] dark:bg-[#172322] border border-[#DED8C9] dark:border-[#33433F] rounded-[8px] p-5 sm:p-7 md:p-8 text-center space-y-4">
        {/* Subtle Manuscript Corner Ornaments */}
        <ManuscriptCorner position="top-right" />
        <ManuscriptCorner position="top-left" />
        <ManuscriptCorner position="bottom-right" />
        <ManuscriptCorner position="bottom-left" />

        {/* Clean Editorial Metadata Line */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-sans-arabic text-[#53605E] dark:text-[#B7C1BC]">
          <span className="font-bold text-[#0F1419] dark:text-[#F4F0E7]">
            السورة رقم {currentCorpusSurah.number}
          </span>
          <span className="text-[#B8935F]">·</span>
          <span>{currentCorpusSurah.isMeccan ? 'مكية' : 'مدنية'}</span>
          <span className="text-[#B8935F]">·</span>
          <span className="font-mono tabular-nums">{currentCorpusSurah.totalAyahs} آيات</span>
          <span className="text-[#B8935F]">·</span>
          <span className="font-mono tabular-nums">{currentStatsSurah.totalWords?.toLocaleString() || 0} كلمة</span>
          <span className="text-[#B8935F]">·</span>
          <span className="font-mono tabular-nums">{currentStatsSurah.totalChars?.toLocaleString() || 0} حرفاً</span>
          <span className="text-[#B8935F]">·</span>
          <button
            type="button"
            onClick={() => setActiveMushaf(activeMushaf === 'kufi' ? 'madani' : 'kufi')}
            className="inline-flex items-center gap-1 font-bold text-[#1A5C5C] dark:text-[#C5A16A] hover:underline cursor-pointer"
            title="انقر للتبديل الفوري بين المصحفين"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>{activeMushaf === 'madani' ? 'المصحف المدني (ورش)' : 'المصحف الكوفي (حفص)'}</span>
          </button>
        </div>

        {/* Surah Calligraphic Title (Guaranteed single 'سورة') */}
        <div className="space-y-1">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-normal text-[#0F1419] dark:text-[#F4F0E7] tracking-normal">
            {formatSurahName(currentCorpusSurah.name)}
          </h1>
          <p className="text-xs text-[#7B8885] dark:text-[#8B9B96] font-sans">
            {currentCorpusSurah.englishName} · {currentCorpusSurah.englishNameTranslation}
          </p>
        </div>

        {/* Noble Basmalah Header */}
        <div className="pt-2">
          {currentCorpusSurah.number === 1 ? (
            <div className="inline-block py-2 px-6 rounded-[6px] border border-[#B8935F]/40 bg-[#F7F2E8] dark:bg-[#1D2B29]">
              <p className="font-quran text-2xl sm:text-3xl text-[#1A5C5C] dark:text-[#C5A16A]">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          ) : currentCorpusSurah.number === 9 ? null : (
            <div className="inline-block py-2 px-8 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B]">
              <p className="font-quran text-2xl sm:text-3xl text-[#0F1419] dark:text-[#F4F0E7]">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search Result Banner */}
      {searchQuery.trim() && (
        <div className="p-3 rounded-[6px] border border-[#B8935F]/40 bg-[#F7F2E8] dark:bg-[#262118] text-xs text-[#0F1419] dark:text-[#F4F0E7] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8935F]" />
            <span>
              عثر على <strong className="font-bold text-[#1A5C5C] dark:text-[#C5A16A]">{filteredAyahs.length}</strong> آية مطابقة للفظ «{searchQuery.trim()}» في {formatSurahName(currentCorpusSurah.name)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Mode Switcher */}
            <div className="inline-flex p-0.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251] text-[11px]">
              <button
                type="button"
                onClick={() => setReaderSearchMode('lemma_affixes')}
                className={`px-2 py-0.5 rounded-[3px] font-bold transition-colors cursor-pointer ${
                  readerSearchMode === 'lemma_affixes'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9]'
                }`}
                title="مجرد الكلمة مع السوابق واللواحق (حتمي)"
              >
                الكلمة وزوائدها
              </button>
              <button
                type="button"
                onClick={() => setReaderSearchMode('exact_plain')}
                className={`px-2 py-0.5 rounded-[3px] font-bold transition-colors cursor-pointer ${
                  readerSearchMode === 'exact_plain'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9]'
                }`}
                title="اللفظ الحرفي الصريح"
              >
                اللفظ التام
              </button>
              <button
                type="button"
                onClick={() => setReaderSearchMode('root_derivatives')}
                className={`px-2 py-0.5 rounded-[3px] font-bold transition-colors cursor-pointer ${
                  readerSearchMode === 'root_derivatives'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9]'
                }`}
                title="الجذر واشتقاقاته"
              >
                الجذر
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#8C6B37] dark:text-[#C5A16A] underline font-bold cursor-pointer"
            >
              إلغاء التصفية
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Reading Grid: Contextual Analysis Sidebar (Right) + Quran Reading Canvas (Center/Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Contextual Analysis Sidebar - Persistent & Sticky on Right in RTL Desktop */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-0.5">
          {renderSidebarContent()}
        </aside>

        {/* Main Quran Reading Canvas - Primary Experience */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
          <div
            ref={containerRef}
            className="bg-[#FBF9F2] dark:bg-[#172322] border border-[#DED8C9] dark:border-[#33433F] rounded-[8px] overflow-hidden"
          >
            {/* MODE 1: VERSE BY VERSE DETAILED INSPECTION */}
            {readingMode === 'verses' && (
              <div className="divide-y divide-[#DED8C9]/70 dark:divide-[#33433F]">
                {filteredAyahs.map((ayah) => {
                  const isHovered = activeAyahHover === ayah.numberInSurah;
                  const cleanA = ayah.textSimple.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF]/g, '').trim();
                  const wordsCount = cleanA ? cleanA.split(/\s+/).filter(w => /[\u0621-\u064A]/.test(w)).length : 0;
                  const charsCount = cleanA.replace(/\s+/g, '').length;

                  return (
                    <div
                      key={ayah.numberInSurah}
                      id={`ayah-${ayah.numberInSurah}`}
                      onMouseEnter={() => setActiveAyahHover(ayah.numberInSurah)}
                      onMouseLeave={() => setActiveAyahHover(null)}
                      className={`p-4 sm:p-6 transition-colors duration-150 ${
                        isHovered ? 'bg-[#F4F0E4]/60 dark:bg-[#1E2D2C]/60' : ''
                      }`}
                    >
                      {/* Quiet Verse Annotation Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#DED8C9]/40 dark:border-[#33433F]/50 text-xs font-sans-arabic text-[#53605E] dark:text-[#B7C1BC]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F1419] dark:text-[#F4F0E7]">
                            الآية {ayah.numberInSurah}
                          </span>
                          <span className="text-[#B8935F]/60">·</span>
                          <span className="text-[11px] text-[#7B8885] dark:text-[#8B9B96]">
                            موقعها {ayah.numberInQuran} في المصحف
                          </span>
                          <span className="text-[#B8935F]/60 hidden sm:inline">·</span>
                          <span className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] hidden sm:inline">
                            جزء {ayah.juz} · صفحة {ayah.page}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-[#7B8885] dark:text-[#8B9B96]">
                          <span>{wordsCount} كلمة</span>
                          <span>·</span>
                          <span>{charsCount} حرفاً</span>
                        </div>
                      </div>

                      {/* Quranic Text Display */}
                      <div
                        className="font-quran text-right leading-[2.4] sm:leading-[2.6]"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        <span className="text-[#0F1419] dark:text-[#F4F0E7]">
                          {(() => {
                            const rawTokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/).filter(Boolean);
                            if (!searchQuery.trim()) {
                              return ayah.textUthmani;
                            }
                            const matchRes = matchAyahTokens(ayah.textUthmani || ayah.textSimple, searchQuery.trim(), readerSearchMode);
                            const matchedSet = new Set(matchRes.matchedIndices);
                            return rawTokens.map((token, idx) => {
                              const isMatched = matchedSet.has(idx);
                              return (
                                <React.Fragment key={idx}>
                                  {isMatched ? (
                                    <mark className="bg-[#B8935F]/25 dark:bg-[#C5A16A]/25 text-[#0F1419] dark:text-[#F4F0E7] px-1 py-0.5 rounded-[3px] border-b border-[#B8935F]">
                                      {token}
                                    </mark>
                                  ) : (
                                    <span>{token}</span>
                                  )}
                                  {idx < rawTokens.length - 1 ? ' ' : ''}
                                </React.Fragment>
                              );
                            });
                          })()}
                        </span>

                        {/* Gold Geometric Verse Marker */}
                        <span className="inline-block mx-2 align-middle">
                          <VerseNumberMedallion number={ayah.numberInSurah} isHovered={isHovered} />
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* MODE 2: CONTINUOUS MUSHAF READING VIEW */}
            {readingMode === 'mushaf' && (
              <div className="p-5 sm:p-8 md:p-10">
                <div
                  className="font-quran leading-[2.5] sm:leading-[2.8] text-justify text-right text-[#0F1419] dark:text-[#F4F0E7]"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {filteredAyahs.map((ayah) => {
                    const isHovered = activeAyahHover === ayah.numberInSurah;
                    const rawTokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/).filter(Boolean);
                    const matchRes = searchQuery.trim() ? matchAyahTokens(ayah.textUthmani || ayah.textSimple, searchQuery.trim(), readerSearchMode) : null;
                    const matchedSet = new Set(matchRes?.matchedIndices || []);

                    return (
                      <React.Fragment key={ayah.numberInSurah}>
                        <span
                          id={`ayah-${ayah.numberInSurah}`}
                          onMouseEnter={() => setActiveAyahHover(ayah.numberInSurah)}
                          onMouseLeave={() => setActiveAyahHover(null)}
                          className={`transition-colors duration-150 px-0.5 rounded cursor-pointer ${
                            isHovered ? 'bg-[#B8935F]/20' : ''
                          }`}
                          title={`الآية ${ayah.numberInSurah} (${ayah.textSimple.split(' ').length} كلمات)`}
                        >
                          {searchQuery.trim() ? (
                            rawTokens.map((token, idx) => {
                              const isMatched = matchedSet.has(idx);
                              return (
                                <React.Fragment key={idx}>
                                  {isMatched ? (
                                    <mark className="bg-[#B8935F]/25 dark:bg-[#C5A16A]/25 text-[#0F1419] dark:text-[#F4F0E7] px-1 py-0.5 rounded-[3px] border-b border-[#B8935F]">
                                      {token}
                                    </mark>
                                  ) : (
                                    <span>{token}</span>
                                  )}
                                  {idx < rawTokens.length - 1 ? ' ' : ''}
                                </React.Fragment>
                              );
                            })
                          ) : (
                            ayah.textUthmani
                          )}
                        </span>
                        <span className="inline-block mx-1.5 align-middle">
                          <VerseNumberMedallion number={ayah.numberInSurah} isHovered={isHovered} />
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Surah Paging Bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handlePrevSurah}
              disabled={selectedReaderSurah <= 1}
              className="py-2 px-3.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] text-xs font-bold text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السورة السابقة: {selectedReaderSurah > 1 ? formatSurahName(corpus[selectedReaderSurah - 2].name) : ''}</span>
            </button>

            <span className="text-xs font-mono tabular-nums text-[#7B8885] dark:text-[#8B9B96]">
              {selectedReaderSurah} / 114
            </span>

            <button
              type="button"
              onClick={handleNextSurah}
              disabled={selectedReaderSurah >= 114}
              className="py-2 px-3.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] text-xs font-bold text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <span>السورة التالية: {selectedReaderSurah < 114 ? formatSurahName(corpus[selectedReaderSurah].name) : ''}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </main>

      </div>

      {/* Floating Mobile Analysis Launcher Button (Quick Access anywhere during reading) */}
      <div className="lg:hidden fixed bottom-6 left-5 z-30">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-2 py-2.5 px-4 rounded-full shadow-lg border border-[#B8935F]/60 bg-[#1A5C5C] hover:bg-[#134747] text-[#F4F0E7] text-xs font-bold active:scale-95 transition-all cursor-pointer select-none"
          title="معلومات وتحليلات السورة"
        >
          <Sparkles className="w-4 h-4 text-[#C5A16A]" />
          <span>تحليلات السورة</span>
        </button>
      </div>

      {/* Accessible Mobile Analysis Drawer / Sheet */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-up Sheet */}
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-drawer-title"
            className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-[#FBF9F2] dark:bg-[#172322] border-t-2 border-[#1A5C5C] dark:border-[#2B7470] rounded-t-[16px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
          >
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-[#DED8C9] dark:border-[#33433F] flex items-center justify-between bg-[#F7F4EA] dark:bg-[#121C1B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[6px] bg-[#1A5C5C]/10 dark:bg-[#1A5C5C]/30 border border-[#B8935F]/40 flex items-center justify-center text-[#1A5C5C] dark:text-[#C5A16A]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="mobile-drawer-title" className="font-bold text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                    تحليلات {formatSurahName(currentCorpusSurah.name)}
                  </h3>
                  <p className="text-[10px] text-[#7B8885] font-sans">
                    السورة {currentCorpusSurah.number} · {currentCorpusSurah.isMeccan ? 'مكية' : 'مدنية'} · {currentCorpusSurah.totalAyahs} آية
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-[6px] text-[#7B8885] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] hover:bg-[#DED8C9]/40 dark:hover:bg-[#33433F]/40 cursor-pointer"
                aria-label="إغلاق اللوحة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {renderSidebarContent()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const QuranReader = React.memo(QuranReaderComponent);

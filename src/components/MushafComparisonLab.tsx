import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Scale, 
  BookOpen, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  BarChart3,
  Lock,
  Unlock,
  Table,
  ChevronLeft,
  ChevronRight,
  Hash,
  ArrowUpDown,
  Split,
  GitMerge,
  Sparkles,
  Layers,
  Palette,
  Eye,
  Info,
  X,
  FileText,
  Download,
  Printer
} from 'lucide-react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { SectionHelpButton } from './SectionHelpModal';
import { MushafStatisticalDivergence } from './MushafStatisticalDivergence';
import { QuranAyah } from '../types';
import { 
  analyzeSurahDivergence, 
  SurahDivergenceAnalysis,
  AyahShiftInfo,
  WordTokenAnalysis 
} from '../utils/mushafVerseDiff';
import { MushafShiftRibbon } from './MushafShiftRibbon';
import { 
  MushafDifferenceToolbar, 
  ColoringMode, 
  WordDiffDepth, 
  AyahFilterMode 
} from './MushafDifferenceToolbar';
import { MushafVerseAnalysisCard } from './MushafVerseAnalysisCard';
import { MushafGlobalDiffModal } from './MushafGlobalDiffModal';
import { exportMushafDiffsToCSV, printFormattedReport, DiffExportRow } from '../utils/exportData';
import { formatSurahName } from '../utils/arabic';

export type ComparisonTab = 'direct-compare' | 'diff-table' | 'divergence-matrix';

export interface MushafComparisonLabProps {
  view?: ComparisonTab;
}

const MushafComparisonLabComponent: React.FC<MushafComparisonLabProps> = ({
  view = 'direct-compare'
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const {
    kufiDataset,
    madaniDataset,
    selectedReaderSurah,
    setSelectedReaderSurah
  } = useQuranCorpus();

  // Selected state
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(selectedReaderSurah || 1);
  const [filterMode, setFilterMode] = useState<'all' | 'diff' | 'same'>('diff');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [internalView, setInternalView] = useState<ComparisonTab>(view);

  useEffect(() => {
    setInternalView(view);
  }, [view]);

  const activeComparisonTab = internalView;
  const setActiveComparisonTab = (tab: ComparisonTab) => setInternalView(tab);
  
  // View mode: Simple vs Advanced Academic
  const [viewMode, setViewMode] = useState<'simplified' | 'advanced'>('advanced');

  // Global Diff Search Modal
  const [isGlobalSearchModalOpen, setIsGlobalSearchModalOpen] = useState<boolean>(false);

  // Synchronized scrolling state
  const [isSyncLocked, setIsSyncLocked] = useState<boolean>(true);
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Shift & Divergence Highlighting State
  const [coloringMode, setColoringMode] = useState<ColoringMode>('all');
  const [wordDiffDepth, setWordDiffDepth] = useState<WordDiffDepth>('reading_only');
  const [showCrossVerseStops, setShowCrossVerseStops] = useState<boolean>(true);
  const [ayahFilter, setAyahFilter] = useState<AyahFilterMode>('all');
  const [isRangeActive, setIsRangeActive] = useState<boolean>(false);
  const [rangeStartAyah, setRangeStartAyah] = useState<number>(1);
  const [rangeEndAyah, setRangeEndAyah] = useState<number>(7);
  const [activeWordTooltip, setActiveWordTooltip] = useState<{
    word: string;
    partner?: string;
    type: string;
    explanation?: string;
  } | null>(null);

  const kufiScrollRef = useRef<HTMLDivElement | null>(null);
  const madaniScrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // Compute 114 surah comparisons between Kufi and Madani
  const comparisonList = useMemo(() => {
    return kufiDataset.surahs.map((kSurah, idx) => {
      const mSurah = madaniDataset.surahs[idx];
      const ayahDiff = mSurah.totalAyahs - kSurah.totalAyahs;
      const wordDiff = mSurah.totalWords - kSurah.totalWords;
      const charDiff = mSurah.totalChars - kSurah.totalChars;
      const isDifferent = ayahDiff !== 0;

      return {
        number: kSurah.number,
        name: kSurah.name,
        englishName: kSurah.englishName,
        isMeccan: kSurah.isMeccan,
        revelationType: kSurah.revelationType,
        kufi: {
          ayahs: kSurah.totalAyahs,
          words: kSurah.totalWords,
          chars: kSurah.totalChars,
          diversity: kSurah.vocabularyDiversity
        },
        madani: {
          ayahs: mSurah.totalAyahs,
          words: mSurah.totalWords,
          chars: mSurah.totalChars,
          diversity: mSurah.vocabularyDiversity
        },
        diff: {
          ayahs: ayahDiff,
          words: wordDiff,
          chars: charDiff,
          isDifferent
        }
      };
    });
  }, [kufiDataset, madaniDataset]);

  // Filtered comparison items for dropdown
  const filteredList = useMemo(() => {
    return comparisonList.filter(item => {
      if (filterMode === 'diff' && !item.diff.isDifferent) return false;
      if (filterMode === 'same' && item.diff.isDifferent) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const numMatch = item.number.toString() === q;
        const nameMatch = item.name.includes(q);
        const enMatch = item.englishName.toLowerCase().includes(q);
        return numMatch || nameMatch || enMatch;
      }
      return true;
    });
  }, [comparisonList, filterMode, searchQuery]);

  // Auto-sync selectedSurahNum if current selection is not in filteredList
  useEffect(() => {
    if (filteredList.length > 0) {
      const exists = filteredList.some(item => item.number === selectedSurahNum);
      if (!exists) {
        setSelectedSurahNum(filteredList[0].number);
        setSelectedReaderSurah(filteredList[0].number);
      }
    }
  }, [filteredList, selectedSurahNum, setSelectedReaderSurah]);

  // Index in current filtered list for prev/next buttons
  const currentFilteredIndex = useMemo(() => {
    return filteredList.findIndex(item => item.number === selectedSurahNum);
  }, [filteredList, selectedSurahNum]);

  const handlePrevSurah = () => {
    if (currentFilteredIndex > 0) {
      const target = filteredList[currentFilteredIndex - 1];
      setSelectedSurahNum(target.number);
      setSelectedReaderSurah(target.number);
    }
  };

  const handleNextSurah = () => {
    if (currentFilteredIndex >= 0 && currentFilteredIndex < filteredList.length - 1) {
      const target = filteredList[currentFilteredIndex + 1];
      setSelectedSurahNum(target.number);
      setSelectedReaderSurah(target.number);
    }
  };

  // Selected surah records
  const currentComparison = comparisonList[selectedSurahNum - 1] || comparisonList[0];
  const kufiCorpusSurah = kufiDataset.corpus[selectedSurahNum - 1];
  const madaniCorpusSurah = madaniDataset.corpus[selectedSurahNum - 1];

  // Verified Madani ayahs from dedicated corpus
  const displayedMadaniAyahs: QuranAyah[] = useMemo(() => {
    return madaniCorpusSurah?.ayahs || [];
  }, [madaniCorpusSurah]);

  // Count totals
  const totalDiffSurahs = comparisonList.filter(c => c.diff.isDifferent).length;
  const totalSameSurahs = comparisonList.filter(c => !c.diff.isDifferent).length;
  const totalAyahsInSurah = Math.max(kufiCorpusSurah?.ayahs.length || 0, displayedMadaniAyahs.length);

  // Divergence analysis computed for current surah
  const divergenceAnalysis: SurahDivergenceAnalysis = useMemo(() => {
    return analyzeSurahDivergence(
      selectedSurahNum,
      kufiCorpusSurah?.ayahs || [],
      displayedMadaniAyahs
    );
  }, [selectedSurahNum, kufiCorpusSurah, displayedMadaniAyahs]);

  // Jump to next/previous divergent ayah
  const handleJumpNextDiff = () => {
    const diffs = divergenceAnalysis.divergentAyahNumbers;
    if (diffs.length === 0) return;
    const current = highlightedAyah || 0;
    const next = diffs.find(n => n > current);
    if (next !== undefined) {
      handleJumpToAyah(next);
    } else {
      handleJumpToAyah(diffs[0]);
    }
  };

  const handleJumpPrevDiff = () => {
    const diffs = divergenceAnalysis.divergentAyahNumbers;
    if (diffs.length === 0) return;
    const current = highlightedAyah || (totalAyahsInSurah + 1);
    const reversed = [...diffs].reverse();
    const prev = reversed.find(n => n < current);
    if (prev !== undefined) {
      handleJumpToAyah(prev);
    } else {
      handleJumpToAyah(diffs[diffs.length - 1]);
    }
  };

  // Auto-reset or clamp custom ayah range when surah changes
  useEffect(() => {
    setRangeStartAyah(1);
    setRangeEndAyah(totalAyahsInSurah);
  }, [selectedSurahNum, totalAyahsInSurah]);

  // Filtered ayahs according to user selection and custom range
  const filteredKufiAyahs = useMemo(() => {
    let ayahs = kufiCorpusSurah?.ayahs || [];
    
    // Apply custom range if enabled
    if (isRangeActive) {
      const min = Math.min(rangeStartAyah, rangeEndAyah);
      const max = Math.max(rangeStartAyah, rangeEndAyah);
      ayahs = ayahs.filter(a => a.numberInSurah >= min && a.numberInSurah <= max);
    }

    if (ayahFilter === 'all') return ayahs;
    return ayahs.filter(a => {
      const shift = divergenceAnalysis.kufiShiftMap.get(a.numberInSurah);
      if (ayahFilter === 'diff_only') return shift && shift.type !== 'exact';
      if (ayahFilter === 'words_only') return shift && shift.hasWordDiff;
      if (ayahFilter === 'lexical_only') return shift && shift.hasLexicalDiff;
      if (ayahFilter === 'farsh_only') return shift && shift.hasReadingDiff;
      return true;
    });
  }, [kufiCorpusSurah, ayahFilter, isRangeActive, rangeStartAyah, rangeEndAyah, divergenceAnalysis]);

  const filteredMadaniAyahs = useMemo(() => {
    let ayahs = displayedMadaniAyahs;

    // Apply custom range if enabled
    if (isRangeActive) {
      const min = Math.min(rangeStartAyah, rangeEndAyah);
      const max = Math.max(rangeStartAyah, rangeEndAyah);
      ayahs = ayahs.filter(a => a.numberInSurah >= min && a.numberInSurah <= max);
    }

    if (ayahFilter === 'all') return ayahs;
    return ayahs.filter(a => {
      const shift = divergenceAnalysis.madaniShiftMap.get(a.numberInSurah);
      if (ayahFilter === 'diff_only') return shift && shift.type !== 'exact';
      if (ayahFilter === 'words_only') return shift && shift.hasWordDiff;
      if (ayahFilter === 'lexical_only') return shift && shift.hasLexicalDiff;
      if (ayahFilter === 'farsh_only') return shift && shift.hasReadingDiff;
      return true;
    });
  }, [displayedMadaniAyahs, ayahFilter, isRangeActive, rangeStartAyah, rangeEndAyah, divergenceAnalysis]);

  const lexicalDiffAyahsCount = useMemo(() => {
    return Array.from(divergenceAnalysis.kufiShiftMap.values()).filter(s => s.hasLexicalDiff).length;
  }, [divergenceAnalysis]);

  const farshDiffAyahsCount = useMemo(() => {
    return Array.from(divergenceAnalysis.kufiShiftMap.values()).filter(s => s.hasReadingDiff).length;
  }, [divergenceAnalysis]);

  // Synchronized scroll handlers
  const handleKufiScroll = () => {
    if (!isSyncLocked || isScrollingRef.current || isProgrammaticScrollRef.current || !kufiScrollRef.current || !madaniScrollRef.current) return;
    isScrollingRef.current = true;
    const kEl = kufiScrollRef.current;
    const mEl = madaniScrollRef.current;
    const maxK = kEl.scrollHeight - kEl.clientHeight;
    if (maxK > 0) {
      const ratio = kEl.scrollTop / maxK;
      const maxM = mEl.scrollHeight - mEl.clientHeight;
      mEl.scrollTop = ratio * maxM;
    }
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  };

  const handleMadaniScroll = () => {
    if (!isSyncLocked || isScrollingRef.current || isProgrammaticScrollRef.current || !kufiScrollRef.current || !madaniScrollRef.current) return;
    isScrollingRef.current = true;
    const kEl = kufiScrollRef.current;
    const mEl = madaniScrollRef.current;
    const maxM = mEl.scrollHeight - mEl.clientHeight;
    if (maxM > 0) {
      const ratio = mEl.scrollTop / maxM;
      const maxK = kEl.scrollHeight - kEl.clientHeight;
      kEl.scrollTop = ratio * maxK;
    }
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  };

  // Reset scroll positions when surah changes
  useEffect(() => {
    if (kufiScrollRef.current) kufiScrollRef.current.scrollTop = 0;
    if (madaniScrollRef.current) madaniScrollRef.current.scrollTop = 0;
    setHighlightedAyah(null);
  }, [selectedSurahNum]);

  // Jump to specific ayah smoothly in both panels with intelligent ID matching
  const handleJumpToAyah = (ayahNum: number) => {
    setHighlightedAyah(ayahNum);
    isProgrammaticScrollRef.current = true;

    // Scroll Kufi panel
    const kTarget = document.getElementById(`kufi-ayah-${ayahNum}`);
    if (kTarget && kufiScrollRef.current) {
      const container = kufiScrollRef.current;
      const kRect = kTarget.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const targetTop = container.scrollTop + (kRect.top - cRect.top) - 20;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }

    // Scroll Madani panel (locate direct match or equivalent Hafs verse mapping)
    let mTarget = document.getElementById(`madani-ayah-${ayahNum}`);
    if (!mTarget && displayedMadaniAyahs.length > 0) {
      const mAyah = displayedMadaniAyahs.find(a => a.numberInHafs?.includes(ayahNum));
      if (mAyah) {
        mTarget = document.getElementById(`madani-ayah-${mAyah.numberInSurah}`);
      } else {
        const clampedIndex = Math.min(ayahNum - 1, displayedMadaniAyahs.length - 1);
        if (clampedIndex >= 0) {
          mTarget = document.getElementById(`madani-ayah-${displayedMadaniAyahs[clampedIndex].numberInSurah}`);
        }
      }
    }
    if (mTarget && madaniScrollRef.current) {
      const container = madaniScrollRef.current;
      const mRect = mTarget.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const targetTop = container.scrollTop + (mRect.top - cRect.top) - 20;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }

    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 600);
  };

  // Font size classes for Quranic Arabic text
  const fontClasses = {
    normal: 'text-base sm:text-lg leading-loose sm:leading-[2.2]',
    large: 'text-lg sm:text-xl leading-loose sm:leading-[2.4]',
    xlarge: 'text-xl sm:text-2xl leading-loose sm:leading-[2.6]'
  };

  // Active highlighted ayah data derivations for analysis card
  const activeKufiAyah = highlightedAyah ? kufiCorpusSurah?.ayahs[highlightedAyah - 1] : undefined;
  const activeKufiShiftInfo = highlightedAyah ? divergenceAnalysis.kufiShiftMap.get(highlightedAyah) : undefined;
  const activeMappedMadaniNums = activeKufiShiftInfo?.mappedNumbers || (highlightedAyah ? [highlightedAyah] : []);
  const activeMadaniAyahs = activeMappedMadaniNums
    .map(num => displayedMadaniAyahs.find(a => a.numberInSurah === num))
    .filter(Boolean) as QuranAyah[];
  const activeKufiTokens = highlightedAyah ? divergenceAnalysis.kufiWordDiffs.get(highlightedAyah) : undefined;
  const activeMadaniTokens = activeMappedMadaniNums.length > 0 
    ? divergenceAnalysis.madaniWordDiffs.get(activeMappedMadaniNums[0]) 
    : undefined;

  // Render Kufi Ayah text with word difference highlighting and cross-verse breaks
  const renderKufiAyahContent = (ayah: QuranAyah, ayahNum: number) => {
    const shiftInfo = divergenceAnalysis.kufiShiftMap.get(ayahNum);
    const wordTokens = divergenceAnalysis.kufiWordDiffs.get(ayahNum) || [];

    if (coloringMode === 'none' || wordTokens.length === 0) {
      return (
        <p className={`font-quran-hafs text-right font-bold select-text ${fontClasses[fontSize]} ${isLight ? 'text-black' : 'text-ink-100'}`}>
          {ayah.textUthmani}
        </p>
      );
    }

    return (
      <p className={`font-quran-hafs text-right font-bold select-text ${fontClasses[fontSize]} ${isLight ? 'text-black' : 'text-ink-100'}`}>
        {wordTokens.map((token, wIdx) => {
          const isLexical = token.type === 'lexical_diff';
          const isReading = token.type === 'reading_diff';
          const isOrtho = token.type === 'orthographic_diff' && wordDiffDepth === 'all';
          const isHighlight = 
            (coloringMode === 'all' || coloringMode === 'words') ? (isLexical || isReading || isOrtho) :
            coloringMode === 'lexical' ? isLexical :
            coloringMode === 'farsh' ? (isReading || isOrtho) :
            false;

          const crossBreak = showCrossVerseStops 
            ? shiftInfo?.crossVerseBreaks.find(b => b.wordIndex === wIdx)
            : undefined;

          let wordStyle = 'inline-block mx-0.5 transition-colors rounded-xs';
          if (isHighlight) {
            if (isLexical) {
              wordStyle += isLight 
                ? ' bg-rose-100 text-rose-950 px-1 py-0.5 font-bold border-b-2 border-rose-600 rounded-xs cursor-pointer shadow-2xs hover:bg-rose-200' 
                : ' bg-rose-950/80 text-rose-100 px-1 py-0.5 font-bold border-b-2 border-rose-500 cursor-pointer shadow-xs';
            } else if (isReading) {
              wordStyle += isLight 
                ? ' bg-amber-100 text-amber-950 px-1 py-0.5 font-bold border-b-2 border-amber-600 rounded-xs cursor-pointer shadow-2xs hover:bg-amber-200' 
                : ' bg-amber-950/80 text-amber-100 px-1 py-0.5 font-bold border-b-2 border-amber-500 cursor-pointer shadow-xs';
            } else if (isOrtho) {
              wordStyle += isLight 
                ? ' bg-teal-50 text-ink-950 px-1 py-0.5 font-medium border-b-2 border-dashed border-teal-600 rounded-xs cursor-pointer hover:bg-teal-100' 
                : ' border-b border-dashed border-teal-500 cursor-pointer px-0.5';
            }
          }

          return (
            <React.Fragment key={`kufi-w-${ayahNum}-${wIdx}`}>
              <span
                onClick={(e) => {
                  if (isHighlight) {
                    e.stopPropagation();
                    setActiveWordTooltip({
                      word: token.clean,
                      partner: token.partner,
                      type: isLexical ? 'اختلاف رسم/حرف' : isReading ? 'اختلاف قراءة/فرش' : 'اختلاف ضبط عثماني',
                      explanation: token.explanation
                    });
                  }
                }}
                className={wordStyle}
                title={isHighlight ? (token.explanation || `${token.clean} ↔ ${token.partner}`) : undefined}
              >
                {token.raw}
              </span>
              {crossBreak && (
                <span 
                  className="inline-flex items-center gap-1 mx-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-lime-100 dark:bg-lime-900/90 text-lime-950 dark:text-lime-100 border border-lime-400 dark:border-lime-600 shadow-2xs align-middle cursor-help"
                  title={crossBreak.label}
                >
                  <span>۝</span>
                  <span>{crossBreak.label}</span>
                </span>
              )}
            </React.Fragment>
          );
        })}
      </p>
    );
  };

  // Render Madani Ayah text with word difference highlighting and cross-verse breaks
  const renderMadaniAyahContent = (ayah: QuranAyah, ayahNum: number) => {
    const shiftInfo = divergenceAnalysis.madaniShiftMap.get(ayahNum);
    const wordTokens = divergenceAnalysis.madaniWordDiffs.get(ayahNum) || [];

    if (coloringMode === 'none' || wordTokens.length === 0) {
      return (
        <p className={`font-quran-warsh text-right font-bold select-text ${fontClasses[fontSize]} ${isLight ? 'text-black' : 'text-ink-100'}`}>
          {ayah.textUthmani}
        </p>
      );
    }

    return (
      <p className={`font-quran-warsh text-right font-bold select-text ${fontClasses[fontSize]} ${isLight ? 'text-black' : 'text-ink-100'}`}>
        {wordTokens.map((token, wIdx) => {
          const isLexical = token.type === 'lexical_diff';
          const isReading = token.type === 'reading_diff';
          const isOrtho = token.type === 'orthographic_diff' && wordDiffDepth === 'all';
          const isHighlight = 
            (coloringMode === 'all' || coloringMode === 'words') ? (isLexical || isReading || isOrtho) :
            coloringMode === 'lexical' ? isLexical :
            coloringMode === 'farsh' ? (isReading || isOrtho) :
            false;

          const crossBreak = showCrossVerseStops 
            ? shiftInfo?.crossVerseBreaks.find(b => b.wordIndex === wIdx)
            : undefined;

          let wordStyle = 'inline-block mx-0.5 transition-colors rounded-[3px]';
          if (isHighlight) {
            if (isLexical) {
              wordStyle += isLight 
                ? ' bg-[#FAF1EF] text-[#824436] px-1 py-0.5 font-bold border-b-2 border-[#9E5D4E] cursor-pointer hover:bg-[#F3E3DF]' 
                : ' bg-[#261B19] text-[#E8BBB0] px-1 py-0.5 font-bold border-b-2 border-[#B57363] cursor-pointer';
            } else if (isReading) {
              wordStyle += isLight 
                ? ' bg-[#F7F2E8] text-[#8C6B37] px-1 py-0.5 font-bold border-b-2 border-[#B8935F] cursor-pointer hover:bg-[#EFE7D8]' 
                : ' bg-[#241F16] text-[#E4C597] px-1 py-0.5 font-bold border-b-2 border-[#C5A16A] cursor-pointer';
            } else if (isOrtho) {
              wordStyle += isLight 
                ? ' bg-[#EDF5F4] text-[#1A5C5C] px-1 py-0.5 font-medium border-b-2 border-dashed border-[#1A5C5C] cursor-pointer hover:bg-[#DCEAE7]' 
                : ' border-b border-dashed border-[#2B7470] text-[#79A9A0] cursor-pointer px-0.5';
            }
          }

          return (
            <React.Fragment key={`madani-w-${ayahNum}-${wIdx}`}>
              <span
                onClick={(e) => {
                  if (isHighlight) {
                    e.stopPropagation();
                    setActiveWordTooltip({
                      word: token.clean,
                      partner: token.partner,
                      type: isLexical ? 'اختلاف رسم/حرف' : isReading ? 'اختلاف قراءة/فرش' : 'اختلاف ضبط عثماني',
                      explanation: token.explanation
                    });
                  }
                }}
                className={wordStyle}
                title={isHighlight ? (token.explanation || `${token.clean} ↔ ${token.partner}`) : undefined}
              >
                {token.raw}
              </span>
              {crossBreak && (
                <span 
                  className="inline-flex items-center gap-1 mx-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-100 dark:bg-teal-900/90 text-teal-950 dark:text-teal-100 border border-teal-400 dark:border-teal-600 shadow-2xs align-middle cursor-help"
                  title={crossBreak.label}
                >
                  <span>۝</span>
                  <span>{crossBreak.label}</span>
                </span>
              )}
            </React.Fragment>
          );
        })}
      </p>
    );
  };

  // Export surah differences to CSV
  const handleExportSurahDiffsCSV = () => {
    const diffRows: DiffExportRow[] = [];
    divergenceAnalysis.kufiWordDiffs.forEach((tokens, ayahNum) => {
      const diffTokens = tokens.filter(t => t.type !== 'identical');
      const shift = divergenceAnalysis.kufiShiftMap.get(ayahNum);
      const mAyahNums = shift?.mappedNumbers || [ayahNum];
      const kText = kufiCorpusSurah?.ayahs[ayahNum - 1]?.textUthmani || '';
      const mText = mAyahNums.map(n => madaniCorpusSurah?.ayahs[n - 1]?.textUthmani || '').join(' ');
      
      if (diffTokens.length > 0 || (shift && shift.type !== 'exact')) {
        diffRows.push({
          surahNumber: selectedSurahNum,
          surahName: currentComparison.name,
          ayahNumber: ayahNum,
          diffType: shift?.type === 'split' ? 'انقسام فواصل' : shift?.type === 'merged' ? 'دمج فواصل' : shift?.type === 'shifted' ? 'زحزحة ترقيم' : 'فروق فرش ورسم',
          kufiText: kText,
          madaniText: mText,
          details: diffTokens.map(t => `${t.raw} ⟵ ${t.partner || ''} (${t.explanation || ''})`).join(' ؛ ') || shift?.description || ''
        });
      }
    });

    exportMushafDiffsToCSV(diffRows, `Surah_${selectedSurahNum}_${currentComparison.name}_Differences.csv`);
  };

  // Generate formatted printable comparison report (PDF)
  const handlePrintSurahComparison = () => {
    const rowsHtml = divergenceAnalysis.divergentAyahNumbers.map((ayahNum, idx) => {
      const kAyah = kufiCorpusSurah?.ayahs[ayahNum - 1];
      const shift = divergenceAnalysis.kufiShiftMap.get(ayahNum);
      const mAyahNums = shift?.mappedNumbers || [ayahNum];
      const mText = mAyahNums.map(n => madaniCorpusSurah?.ayahs[n - 1]?.textUthmani || '').join(' ');
      const tokens = divergenceAnalysis.kufiWordDiffs.get(ayahNum) || [];
      const diffTokens = tokens.filter(t => t.type !== 'identical');

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>آية ${ayahNum} (حفص)<br><span style="font-size:10px;color:#6F7F7B;">تقابل آية ${mAyahNums.join('، ')} (ورش)</span></td>
          <td><span class="badge" style="background:#DCE9E5;color:#164B4B;">${shift?.badgeLabel || 'فروق فرش'}</span></td>
          <td class="font-quran-hafs" style="color:#10211F;">${kAyah?.textUthmani || ''}</td>
          <td class="font-quran-warsh" style="color:#047857;">${mText}</td>
          <td style="font-size:11px;color:#53605E;">${diffTokens.map(t => t.explanation).filter(Boolean).join(' ؛ ') || shift?.description || ''}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div style="margin-bottom:15px;padding:12px;background:#F8F6EF;border-radius:8px;border:1px solid #E2DDCF;font-size:13px;line-height:1.6;">
        <strong>تقرير مقارنة ${formatSurahName(currentComparison.name)} (${currentComparison.isMeccan ? 'مكية' : 'مدنية'}):</strong><br>
        • عدد الآيات: الكوفي (حفص) ${currentComparison.kufi.ayahs} آية | المدني (ورش) ${currentComparison.madani.ayahs} آية (الفارق: ${currentComparison.diff.ayahs} آية).<br>
        • مواضع الخلاف الكلية بالسورة: ${divergenceAnalysis.divergentAyahNumbers.length} موضع | فروق الكلمات والفرش: ${divergenceAnalysis.totalWordDifferences} كلمة.
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;">#</th>
            <th style="width:130px;">الآية والترقيم</th>
            <th style="width:130px;">نوع الخلاف</th>
            <th>نص مصحف الكوفة (حفص)</th>
            <th>نص مصحف المدينة (ورش)</th>
            <th style="width:180px;">البيان والإيضاح</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" style="text-align:center;">لا توجد فروق في هذه السورة، تطابق تام في فواصل الآي والفرش.</td></tr>'}
        </tbody>
      </table>
    `;

    printFormattedReport(
      `مقارنة ${formatSurahName(currentComparison.name)} بين مصحفي الكوفة والمدينة`,
      `حفص عن عاصم مقابل ورش عن نافع`,
      html
    );
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Master Header: Streamlined, Compact & Zero Filler */}
      <div className={`border rounded-xl p-4 sm:p-5 shadow-sm transition-colors duration-200 ${
        isLight ? 'bg-white border-ink-200 shadow-ink-100' : 'bg-ink-900 border-ink-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`p-1.5 rounded-lg border ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-[#1A5C5C]' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <Scale className="w-5 h-5" />
              </span>
              <h2 className={`text-xl font-bold font-heading ${
                isLight ? 'text-ink-900' : 'text-ink-100'
              }`}>
                مقارنة المصحفين: الكوفي (حفص) والمدني (ورش)
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-950/80 text-teal-300 border-teal-700/60'
              }`}>
                فصل جذري 100%
              </span>
              <SectionHelpButton 
                guideId="mushaf-comparison"
                variant="button"
                title="دليل المقارنة المنهجية"
              />
            </div>

            {/* Concise summary badges bar without filler */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              }`}>
                <span className="w-2 h-2 rounded-full bg-[#1A5C5C]"></span>
                <span>الكوفي: <strong>6,236 آية</strong></span>
              </div>

              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>المدني: <strong>6,214 آية</strong></span>
              </div>

              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/50 border-amber-800 text-amber-300'
              }`}>
                <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                <span>فارق الآيات: <strong>-22 آية</strong> (في 50 سورة)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* TAB 1: SYNCHRONIZED COMPARISON LAB (آية بآية) */}
      {activeComparisonTab === 'direct-compare' && (
        <div className="space-y-4">
          
          {/* 1. SURAH SELECTOR & COMPARATIVE PROFILE CARD */}
          <div className={`border rounded-xl p-4 shadow-xs transition-colors duration-200 ${
            isLight ? 'bg-white border-ink-300 shadow-ink-100' : 'bg-ink-900 border-ink-800'
          }`}>
            {/* Top Row: Surah Filter Classification, Search, and Navigator */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Surah Scope Filter Tabs */}
              <div className={`flex items-center gap-1 text-xs p-1 rounded-xl border self-start ${
                isLight ? 'bg-ink-100 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <button
                  onClick={() => setFilterMode('diff')}
                  className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterMode === 'diff'
                      ? isLight ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-xs' : 'bg-amber-500/20 text-amber-300 font-bold'
                      : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-white/70' : 'text-ink-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>السور المختلفة ({totalDiffSurahs})</span>
                </button>

                <button
                  onClick={() => setFilterMode('same')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterMode === 'same'
                      ? isLight ? 'bg-emerald-100 text-emerald-950 font-extrabold border border-emerald-300 shadow-xs' : 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-white/70' : 'text-ink-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>المتطابقة ({totalSameSurahs})</span>
                </button>

                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterMode === 'all'
                      ? isLight ? 'bg-emerald-100 text-emerald-950 font-extrabold border border-emerald-300 shadow-xs' : 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-white/70' : 'text-ink-400'
                  }`}
                >
                  <span>الكل (114)</span>
                </button>
              </div>

              {/* Surah Dropdown Selector with Instant Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-ink-500' : 'text-ink-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="ابحث باسم السورة أو رقمها..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded-lg pr-9 pl-3 py-1.5 text-xs font-bold transition-all border ${
                      isLight 
                        ? 'bg-ink-50 border-ink-300 text-ink-950 placeholder-ink-500 focus:bg-white focus:border-[#1A5C5C] shadow-2xs' 
                        : 'bg-ink-950 border-ink-800 text-ink-200 placeholder-ink-500 focus:border-emerald-500/50'
                    }`}
                  />
                </div>

                {/* Prev / Next & Dropdown */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevSurah}
                    disabled={currentFilteredIndex <= 0}
                    className={`p-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                      isLight 
                        ? 'bg-ink-50 hover:bg-ink-100 border-ink-300 text-ink-950 font-bold shadow-2xs' 
                        : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-300'
                    }`}
                    title="السورة السابقة"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="w-48 sm:w-56">
                    <select
                      value={selectedSurahNum}
                      onChange={(e) => {
                        const num = Number(e.target.value);
                        setSelectedSurahNum(num);
                        setSelectedReaderSurah(num);
                      }}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer border transition-all ${
                        isLight
                          ? 'bg-ink-50 border-ink-300 text-ink-950 focus:bg-white focus:border-[#1A5C5C] shadow-2xs'
                          : 'bg-ink-950 border-ink-800 text-ink-200 focus:border-emerald-500/50'
                      }`}
                    >
                      {filteredList.map((item) => (
                        <option key={item.number} value={item.number} className="font-bold">
                          {item.number}. {item.name} {item.diff.isDifferent ? `(فارق: ${item.diff.ayahs > 0 ? '+' : ''}${item.diff.ayahs})` : '(متطابقة)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleNextSurah}
                    disabled={currentFilteredIndex < 0 || currentFilteredIndex >= filteredList.length - 1}
                    className={`p-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                      isLight 
                        ? 'bg-ink-50 hover:bg-ink-100 border-ink-300 text-ink-950 font-bold shadow-2xs' 
                        : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-300'
                    }`}
                    title="السورة التالية"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: 4-Card Comparative Profile Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-ink-200 dark:border-ink-800/80 text-xs">
              {/* Card 1: Surah Identification */}
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isLight ? 'bg-ink-50/70 border-ink-200' : 'bg-ink-950/40 border-ink-800'
              }`}>
                <div className={`p-1.5 rounded-md font-mono font-bold text-xs ${
                  isLight ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  #{currentComparison.number}
                </div>
                <div>
                  <h4 className={`font-heading font-bold text-sm leading-tight ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
                    {formatSurahName(currentComparison.name)}
                  </h4>
                  <p className={`text-[11px] font-bold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                    {currentComparison.isMeccan ? 'مكية' : 'مدنية'}
                  </p>
                </div>
              </div>

              {/* Card 2: Ayah Count & Divergence */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                isLight ? 'bg-ink-50/70 border-ink-200' : 'bg-ink-950/40 border-ink-800'
              }`}>
                <div>
                  <span className={`text-[11px] block font-bold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                    تعداد الآيات:
                  </span>
                  <div className="font-mono font-black text-xs flex items-center gap-1.5 mt-0.5">
                    <span className={isLight ? 'text-emerald-900' : 'text-emerald-300'}>{currentComparison.kufi.ayahs} كوفي</span>
                    <span>/</span>
                    <span className={isLight ? 'text-emerald-900' : 'text-emerald-300'}>{currentComparison.madani.ayahs} مدني</span>
                  </div>
                </div>
                <div className="text-left">
                  {currentComparison.diff.isDifferent ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${
                      isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      فارق: {currentComparison.diff.ayahs > 0 ? `+${currentComparison.diff.ayahs}` : currentComparison.diff.ayahs}
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      متطابقة
                    </span>
                  )}
                </div>
              </div>

              {/* Card 3: Words & Letters */}
              <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${
                isLight ? 'bg-ink-50/70 border-ink-200' : 'bg-ink-950/40 border-ink-800'
              }`}>
                <span className={`text-[11px] block font-bold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                  الكلمات والحروف:
                </span>
                <div className="text-xs font-mono font-bold flex items-center justify-between mt-0.5">
                  <span className={isLight ? 'text-ink-800' : 'text-ink-300'}>
                    {currentComparison.kufi.words.toLocaleString()} كلمة
                  </span>
                  <span className="text-ink-400">•</span>
                  <span className={isLight ? 'text-ink-800' : 'text-ink-300'}>
                    {currentComparison.kufi.chars.toLocaleString()} حرف
                  </span>
                </div>
              </div>

              {/* Card 4: Total Identified Differences */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                isLight ? 'bg-ink-50/70 border-ink-200' : 'bg-ink-950/40 border-ink-800'
              }`}>
                <div>
                  <span className={`text-[11px] block font-bold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                    مواضع التباين:
                  </span>
                  <div className="font-mono font-black text-xs mt-0.5 flex items-center gap-2">
                    <span className={isLight ? 'text-teal-900' : 'text-teal-300'}>
                      {divergenceAnalysis.divergentAyahNumbers.length} فواصل
                    </span>
                    <span className="text-ink-400">•</span>
                    <span className={isLight ? 'text-rose-900' : 'text-rose-300'}>
                      {divergenceAnalysis.totalWordDifferences} لفظي
                    </span>
                  </div>
                </div>
                {divergenceAnalysis.divergentAyahNumbers.length > 0 && (
                  <button
                    onClick={handleJumpNextDiff}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-white hover:bg-ink-100 text-emerald-950 border-ink-300 shadow-2xs' 
                        : 'bg-ink-900 hover:bg-ink-800 text-emerald-300 border-ink-700'
                    }`}
                    title="القفز لأول موضع خلاف في السورة"
                  >
                    استعراض الخلاف ↓
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. VISUAL SHIFT RIBBON (IN ADVANCED MODE) */}
          {viewMode === 'advanced' ? (
            <MushafShiftRibbon
              analysis={divergenceAnalysis}
              highlightedAyah={highlightedAyah}
              onSelectAyah={handleJumpToAyah}
              onJumpNextDiff={handleJumpNextDiff}
              onJumpPrevDiff={handleJumpPrevDiff}
            />
          ) : (
            <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-900/60'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-bold ${
                  isLight ? 'bg-emerald-100 text-emerald-950' : 'bg-emerald-900 text-emerald-200'
                }`}>
                  النمط الميسر نشط
                </span>
                <span className={isLight ? 'text-ink-800' : 'text-ink-300'}>
                  مقارنة بصرية مباشرة وميسرة بين الروايتين. تم طي شريط التحليل المتعمق لتسريع القراءة والتنقل.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  isLight ? 'bg-white border border-ink-300 text-ink-900' : 'bg-ink-900 border border-ink-700 text-ink-200'
                }`}>
                  مواضع الخلاف: {divergenceAnalysis.divergentAyahNumbers.length}
                </span>
                <button
                  onClick={() => setViewMode('advanced')}
                  className={`text-xs font-bold underline cursor-pointer ${
                    isLight ? 'text-emerald-700 hover:text-emerald-900' : 'text-emerald-400 hover:text-emerald-200'
                  }`}
                >
                  إظهار شريط الزحزحة والإحصاء التفصيلي ←
                </button>
              </div>
            </div>
          )}

          {/* 3. COMPREHENSIVE REORGANIZED PROPERTIES & OPTIONS PANEL */}
          <MushafDifferenceToolbar
            coloringMode={coloringMode}
            setColoringMode={setColoringMode}
            wordDiffDepth={wordDiffDepth}
            setWordDiffDepth={setWordDiffDepth}
            showCrossVerseStops={showCrossVerseStops}
            setShowCrossVerseStops={setShowCrossVerseStops}
            ayahFilter={ayahFilter}
            setAyahFilter={setAyahFilter}
            isRangeActive={isRangeActive}
            setIsRangeActive={setIsRangeActive}
            rangeStartAyah={rangeStartAyah}
            setRangeStartAyah={setRangeStartAyah}
            rangeEndAyah={rangeEndAyah}
            setRangeEndAyah={setRangeEndAyah}
            divergentCount={divergenceAnalysis.divergentAyahNumbers.length}
            wordDiffCount={divergenceAnalysis.totalWordDifferences}
            lexicalDiffCount={divergenceAnalysis.totalLexicalDifferences}
            readingDiffCount={divergenceAnalysis.totalReadingDifferences}
            lexicalDiffAyahsCount={lexicalDiffAyahsCount}
            farshDiffAyahsCount={farshDiffAyahsCount}
            totalVersesCount={totalAyahsInSurah}
            highlightedAyah={highlightedAyah}
            onJumpToAyah={handleJumpToAyah}
            onJumpNextDiff={handleJumpNextDiff}
            onJumpPrevDiff={handleJumpPrevDiff}
            divergentAyahNumbers={divergenceAnalysis.divergentAyahNumbers}
            isSyncLocked={isSyncLocked}
            setIsSyncLocked={setIsSyncLocked}
            fontSize={fontSize}
            setFontSize={setFontSize}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenGlobalSearch={() => setIsGlobalSearchModalOpen(true)}
            onExportCSV={handleExportSurahDiffsCSV}
            onPrint={handlePrintSurahComparison}
          />

          {/* 3. ACTIVE AYAH DETAILED ANALYSIS CARD */}
          {highlightedAyah && activeKufiAyah && (
            <MushafVerseAnalysisCard
              kufiAyahNum={highlightedAyah}
              kufiAyah={activeKufiAyah}
              madaniAyahs={activeMadaniAyahs}
              kufiShiftInfo={activeKufiShiftInfo}
              kufiWordTokens={activeKufiTokens}
              madaniWordTokens={activeMadaniTokens}
              onClose={() => setHighlightedAyah(null)}
              onNextDiff={handleJumpNextDiff}
              onPrevDiff={handleJumpPrevDiff}
              hasDivergences={divergenceAnalysis.divergentAyahNumbers.length > 0}
            />
          )}

          {/* DUAL SYNCHRONIZED SCROLL PANELS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* COLUMN 1: KUFI MUSHAF (HAFS) */}
            <div className={`border rounded-xl flex flex-col shadow-sm transition-colors duration-200 ${
              isLight ? 'bg-white border-ink-300 shadow-ink-100' : 'bg-ink-900 border-ink-800'
            }`}>
              {/* Column Header - Sticky pinned */}
              <div className={`px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-all ${
                isLight ? 'bg-emerald-50/95 border-emerald-300 shadow-2xs' : 'bg-emerald-950/60 border-ink-800 shadow-2xs'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#1A5C5C] shadow-2xs"></span>
                  <h3 className={`text-xs sm:text-sm font-black ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    المصحف الكوفي (رواية حفص عن عاصم)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border hidden sm:inline ${
                    isLight ? 'bg-[#1A5C5C] text-white border-emerald-800 shadow-2xs' : 'bg-emerald-950 text-emerald-400 border-emerald-900'
                  }`}>
                    حفص
                  </span>
                  <span className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded border ${
                    isLight ? 'bg-white text-emerald-950 border-emerald-400 shadow-2xs' : 'bg-ink-900 text-emerald-300 border-emerald-800'
                  }`}>
                    {filteredKufiAyahs.length} آية
                  </span>
                </div>
              </div>

              {/* Synchronized Scroll Container */}
              <div
                ref={kufiScrollRef}
                onScroll={handleKufiScroll}
                className="p-4 space-y-3 overflow-y-auto h-[620px] scroll-smooth pr-2"
              >
                {filteredKufiAyahs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-400">
                    لا توجد آيات تطابق شرط التصفية في هذه السورة
                  </div>
                ) : (
                  filteredKufiAyahs.map((ayah, index) => {
                    const ayahNum = ayah.numberInSurah ?? (index + 1);
                    const isSelected = highlightedAyah === ayahNum;
                    const shiftInfo = divergenceAnalysis.kufiShiftMap.get(ayahNum);

                    // Determine card border and background by coloring mode and shift
                    let cardColorClass = '';
                    if (isSelected) {
                      cardColorClass = isLight 
                        ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-400' 
                        : 'bg-emerald-950/70 border-emerald-500 shadow-xs ring-2 ring-emerald-600/50';
                    } else if (coloringMode === 'all' || coloringMode === 'shift') {
                      if (shiftInfo?.type === 'split') {
                        cardColorClass = isLight 
                          ? 'bg-lime-50 border-lime-300 hover:border-lime-500 hover:bg-lime-100/70 shadow-2xs' 
                          : 'bg-lime-950/30 border-lime-800/80 hover:border-lime-700 hover:bg-lime-950/50';
                      } else if (shiftInfo?.type === 'merged') {
                        cardColorClass = isLight 
                          ? 'bg-teal-50 border-teal-300 hover:border-teal-500 hover:bg-teal-100/70 shadow-2xs' 
                          : 'bg-teal-950/30 border-teal-800/80 hover:border-teal-700 hover:bg-teal-950/50';
                      } else if (shiftInfo?.type === 'shifted') {
                        cardColorClass = isLight 
                          ? 'bg-amber-50 border-amber-300 hover:border-amber-500 hover:bg-amber-100/70 shadow-2xs' 
                          : 'bg-amber-950/30 border-amber-800/80 hover:border-amber-700 hover:bg-amber-950/50';
                      } else if (shiftInfo?.hasWordDiff && coloringMode === 'all') {
                        cardColorClass = isLight 
                          ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400 hover:bg-rose-100/60 shadow-2xs' 
                          : 'bg-rose-950/20 border-rose-900/60 hover:border-rose-800';
                      } else {
                        cardColorClass = isLight
                          ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                          : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                      }
                    } else if (coloringMode === 'lexical') {
                      if (shiftInfo?.hasLexicalDiff) {
                        cardColorClass = isLight 
                          ? 'bg-rose-50/80 border-rose-400 hover:border-rose-500 hover:bg-rose-100/70 shadow-2xs' 
                          : 'bg-rose-950/25 border-rose-900/70 hover:border-rose-800';
                      } else {
                        cardColorClass = isLight
                          ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                          : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                      }
                    } else if (coloringMode === 'farsh') {
                      if (shiftInfo?.hasReadingDiff) {
                        cardColorClass = isLight 
                          ? 'bg-amber-50/80 border-amber-400 hover:border-amber-500 hover:bg-amber-100/70 shadow-2xs' 
                          : 'bg-amber-950/25 border-amber-900/70 hover:border-amber-800';
                      } else {
                        cardColorClass = isLight
                          ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                          : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                      }
                    } else {
                      cardColorClass = isLight
                        ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                        : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                    }

                    return (
                      <div
                        key={`kufi-${ayahNum}-${index}`}
                        id={`kufi-ayah-${ayahNum}`}
                        onClick={() => handleJumpToAyah(ayahNum)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${cardColorClass}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                              isSelected
                                ? isLight ? 'bg-emerald-200 text-emerald-950 border-emerald-400 font-bold' : 'bg-emerald-900 text-emerald-200 border-emerald-700'
                                : isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold' : 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                            }`}>
                              آية {ayahNum}
                            </span>

                            {(coloringMode === 'all' || coloringMode === 'shift') && shiftInfo && (
                              <>
                                {shiftInfo.type === 'split' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                                    isLight ? 'bg-lime-100 text-lime-950 border-lime-300' : 'bg-lime-950 text-lime-300 border-lime-800'
                                  }`} title={shiftInfo.description}>
                                    <Split className="w-3 h-3 text-lime-700 dark:text-lime-400" />
                                    <span>انقسام فاصلة (ورش: {shiftInfo.mappedNumbers.join(', ')})</span>
                                  </span>
                                )}
                                {shiftInfo.type === 'merged' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                                    isLight ? 'bg-teal-100 text-teal-950 border-teal-300' : 'bg-teal-950 text-teal-300 border-teal-800'
                                  }`} title={shiftInfo.description}>
                                    <GitMerge className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                                    <span>دمج فواصل (ورش: {shiftInfo.mappedNumbers.join(', ')})</span>
                                  </span>
                                )}
                                {shiftInfo.type === 'shifted' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                                    isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-800'
                                  }`} title={shiftInfo.description}>
                                    <ArrowRightLeft className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                    <span>زحزحة {shiftInfo.shiftOffset > 0 ? `+${shiftInfo.shiftOffset}` : shiftInfo.shiftOffset} (تقابل ورش {shiftInfo.mappedNumbers[0]})</span>
                                  </span>
                                )}
                              </>
                            )}

                            {(coloringMode === 'all' || coloringMode === 'words') && shiftInfo?.hasWordDiff && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                                isLight ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                              }`} title="يوجد فرق لفظي أو قرائي في هذه الآية">
                                <Sparkles className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                                <span>فروق لفظية ({shiftInfo.wordDiffCount})</span>
                              </span>
                            )}

                            {coloringMode === 'lexical' && shiftInfo?.hasLexicalDiff && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                                isLight ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                              }`} title="يوجد اختلاف في حروف أو رسم الكلمات في هذه الآية">
                                <FileText className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                                <span>اختلاف كلمات ({shiftInfo.lexicalDiffCount})</span>
                              </span>
                            )}

                            {coloringMode === 'farsh' && shiftInfo?.hasReadingDiff && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                                isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`} title="يوجد اختلاف في الفرش أو القراءة في هذه الآية">
                                <BookOpen className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span>اختلاف فرش ({shiftInfo.readingDiffCount})</span>
                              </span>
                            )}
                          </div>

                          <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-ink-950' : 'text-ink-400'}`}>
                            حفص
                          </span>
                        </div>

                        {/* Text with word tokens highlighting */}
                        {renderKufiAyahContent(ayah, ayahNum)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 2: MADANI MUSHAF (WARSH) */}
            <div className={`border rounded-xl flex flex-col shadow-sm transition-colors duration-200 ${
              isLight ? 'bg-white border-ink-300 shadow-ink-100' : 'bg-ink-900 border-ink-800'
            }`}>
              {/* Column Header - Sticky pinned */}
              <div className={`px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-all ${
                isLight ? 'bg-emerald-100/95 border-emerald-300 shadow-2xs' : 'bg-emerald-950/90 border-ink-800 shadow-2xs'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 shadow-2xs"></span>
                  <h3 className={`text-xs sm:text-sm font-black ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                    المصحف المدني (رواية ورش عن نافع)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border hidden sm:inline ${
                    isLight ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs' : 'bg-emerald-950 text-emerald-400 border-emerald-900'
                  }`}>
                    ورش
                  </span>
                  <span className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded border ${
                    isLight ? 'bg-white text-emerald-950 border-emerald-400 shadow-2xs' : 'bg-ink-900 text-emerald-300 border-emerald-800'
                  }`}>
                    {filteredMadaniAyahs.length} آية
                  </span>
                </div>
              </div>

              {/* Synchronized Scroll Container */}
              <div
                ref={madaniScrollRef}
                onScroll={handleMadaniScroll}
                className="p-4 space-y-3 overflow-y-auto h-[620px] scroll-smooth pr-2"
              >
                {filteredMadaniAyahs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-400">
                    لا توجد آيات تطابق شرط التصفية في هذه السورة
                  </div>
                ) : (
                  filteredMadaniAyahs.map((ayah, index) => {
                    const ayahNum = ayah.numberInSurah ?? (index + 1);
                    const isSelected = highlightedAyah === ayahNum || 
                      (highlightedAyah !== null && ayah.numberInHafs?.includes(highlightedAyah));
                    const shiftInfo = divergenceAnalysis.madaniShiftMap.get(ayahNum);

                    let cardColorClass = '';
                    if (isSelected) {
                      cardColorClass = isLight 
                        ? 'bg-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-400' 
                        : 'bg-emerald-950/70 border-emerald-500 shadow-xs ring-2 ring-emerald-600/50';
                    } else if (coloringMode === 'all' || coloringMode === 'shift') {
                      if (shiftInfo?.type === 'split') {
                        cardColorClass = isLight 
                          ? 'bg-lime-50 border-lime-300 hover:border-lime-500 hover:bg-lime-100/70 shadow-2xs' 
                          : 'bg-lime-950/30 border-lime-800/80 hover:border-lime-700 hover:bg-lime-950/50';
                      } else if (shiftInfo?.type === 'merged') {
                        cardColorClass = isLight 
                          ? 'bg-teal-50 border-teal-300 hover:border-teal-500 hover:bg-teal-100/70 shadow-2xs' 
                          : 'bg-teal-950/30 border-teal-800/80 hover:border-teal-700 hover:bg-teal-950/50';
                      } else if (shiftInfo?.type === 'shifted') {
                        cardColorClass = isLight 
                          ? 'bg-amber-50 border-amber-300 hover:border-amber-500 hover:bg-amber-100/70 shadow-2xs' 
                          : 'bg-amber-950/30 border-amber-800/80 hover:border-amber-700 hover:bg-amber-950/50';
                      } else if (shiftInfo?.hasWordDiff && coloringMode === 'all') {
                        cardColorClass = isLight 
                          ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400 hover:bg-rose-100/60 shadow-2xs' 
                          : 'bg-rose-950/20 border-rose-900/60 hover:border-rose-800';
                      } else {
                        cardColorClass = isLight
                          ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                          : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                      }
                    } else if (coloringMode === 'lexical') {
                      if (shiftInfo?.hasLexicalDiff) {
                        cardColorClass = isLight 
                          ? 'bg-rose-50/80 border-rose-400 hover:border-rose-500 hover:bg-rose-100/70 shadow-2xs' 
                          : 'bg-rose-950/25 border-rose-900/70 hover:border-rose-800';
                      } else {
                        cardColorClass = isLight
                          ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                          : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                      }
                    } else if (coloringMode === 'farsh') {
                      if (shiftInfo?.hasReadingDiff) {
                        cardColorClass = isLight 
                          ? 'bg-amber-50/80 border-amber-400 hover:border-amber-500 hover:bg-amber-100/70 shadow-2xs' 
                          : 'bg-amber-950/25 border-amber-900/70 hover:border-amber-800';
                      } else {
                        cardColorClass = isLight
                          ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                          : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                      }
                    } else {
                      cardColorClass = isLight
                        ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                        : 'bg-ink-950/60 border-ink-800/80 hover:border-emerald-800 hover:bg-ink-800';
                    }

                    return (
                      <div
                        key={`madani-${ayahNum}-${index}`}
                        id={`madani-ayah-${ayahNum}`}
                        onClick={() => {
                          const target = (ayah.numberInHafs && ayah.numberInHafs.length > 0) ? ayah.numberInHafs[0] : ayahNum;
                          handleJumpToAyah(target);
                        }}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${cardColorClass}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                              isSelected
                                ? isLight ? 'bg-emerald-200 text-emerald-950 border-emerald-400 font-bold' : 'bg-emerald-900 text-emerald-200 border-emerald-700'
                                : isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold' : 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                            }`}>
                              آية {ayahNum}
                            </span>

                            {ayah.numberInHafs && ayah.numberInHafs.length > 0 && (
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                                isLight ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs' : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              }`} title={`تقابل في عد حفص الآية: ${ayah.numberInHafs.join(', ')}`}>
                                حفص: {ayah.numberInHafs.join(', ')}
                              </span>
                            )}

                            {(coloringMode === 'all' || coloringMode === 'shift') && shiftInfo && (
                              <>
                                {shiftInfo.type === 'split' && (
                                   <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                                    isLight ? 'bg-lime-100 text-lime-950 border-lime-300' : 'bg-lime-950 text-lime-300 border-lime-800'
                                  }`} title={shiftInfo.description}>
                                    <Split className="w-3 h-3 text-lime-700 dark:text-lime-400" />
                                    <span>انقسام فاصلة</span>
                                  </span>
                                )}
                                {shiftInfo.type === 'merged' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${
                                    isLight ? 'bg-teal-100 text-teal-950 border-teal-300' : 'bg-teal-950 text-teal-300 border-teal-800'
                                  }`} title={shiftInfo.description}>
                                    <GitMerge className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                                    <span>دمج فواصل</span>
                                  </span>
                                )}
                              </>
                            )}

                            {(coloringMode === 'all' || coloringMode === 'words') && shiftInfo?.hasWordDiff && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                                isLight ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                              }`} title="يوجد فرق لفظي أو قرائي في هذه الآية">
                                <Sparkles className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                                <span>فروق لفظية ({shiftInfo.wordDiffCount})</span>
                              </span>
                            )}

                            {coloringMode === 'lexical' && shiftInfo?.hasLexicalDiff && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                                isLight ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                              }`} title="يوجد اختلاف في حروف أو رسم الكلمات في هذه الآية">
                                <FileText className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                                <span>اختلاف كلمات ({shiftInfo.lexicalDiffCount})</span>
                              </span>
                            )}

                            {coloringMode === 'farsh' && shiftInfo?.hasReadingDiff && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                                isLight ? 'bg-amber-100 text-amber-950 border-amber-300' : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`} title="يوجد اختلاف في الفرش أو القراءة في هذه الآية">
                                <BookOpen className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span>اختلاف فرش ({shiftInfo.readingDiffCount})</span>
                              </span>
                            )}
                          </div>

                          <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-ink-950' : 'text-ink-400'}`}>
                            ورش
                          </span>
                        </div>

                        {/* Text with word tokens highlighting */}
                        {renderMadaniAyahContent(ayah, ayahNum)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* WORD DIFFERENCE EXPLANATION MODAL POPUP */}
          {activeWordTooltip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className={`max-w-md w-full rounded-xl border p-5 shadow-2xl transition-all ${
                isLight ? 'bg-white border-ink-300 text-ink-900' : 'bg-ink-900 border-ink-700 text-ink-100'
              }`}>
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-ink-200 dark:border-ink-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className={`text-xs font-extrabold font-mono ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>تفصيل الفرق اللفظي والقرائي</span>
                  </div>
                  <button
                    onClick={() => setActiveWordTooltip(null)}
                    className={`p-1 rounded-md border transition-all ${
                      isLight ? 'hover:bg-ink-100 border-ink-300 text-ink-900' : 'hover:bg-ink-800 border-ink-800 text-ink-400'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={`flex items-center justify-around py-3.5 px-3 rounded-xl border-2 mb-3 ${
                  isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-950 border-ink-800'
                }`}>
                  <div className="text-center">
                    <div className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono mb-1.5 font-black ${
                      isLight ? 'bg-[#1A5C5C] text-white shadow-2xs' : 'bg-teal-950 text-teal-200 border border-teal-700'
                    }`}>
                      المصحف الكوفي (حفص)
                    </div>
                    <div className={`text-2xl font-black font-heading ${isLight ? 'text-black' : 'text-teal-300'}`}>
                      {activeWordTooltip.word}
                    </div>
                  </div>

                  <div className={`p-2 rounded-full border shrink-0 ${
                    isLight ? 'bg-amber-100 border-amber-300' : 'bg-ink-900 border-ink-700'
                  }`}>
                    <ArrowRightLeft className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  </div>

                  <div className="text-center">
                    <div className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono mb-1.5 font-black ${
                      isLight ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                    }`}>
                      المصحف المدني (ورش)
                    </div>
                    <div className={`text-2xl font-black font-heading ${isLight ? 'text-black' : 'text-emerald-300'}`}>
                      {activeWordTooltip.partner || '—'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className={`font-extrabold ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>التصنيف: </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${
                      isLight ? 'bg-rose-100 text-rose-950 border-rose-300 shadow-2xs' : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {activeWordTooltip.type}
                    </span>
                  </div>
                  {activeWordTooltip.explanation && (
                    <p className={`leading-relaxed mt-1 p-2.5 rounded-lg border font-semibold ${
                      isLight ? 'text-ink-950 bg-ink-50 border-ink-300' : 'text-ink-300 bg-ink-950/60 border-ink-800/80'
                    }`}>
                      {activeWordTooltip.explanation}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-ink-200 dark:border-ink-800 flex justify-end">
                  <button
                    onClick={() => setActiveWordTooltip(null)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isLight ? 'bg-ink-100 hover:bg-ink-200 border-ink-300 text-ink-800' : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-200'
                    }`}
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: INDEX OF ALL 50 DIFFERING SURAHS */}
      {activeComparisonTab === 'diff-table' && (
        <div 
          className="border rounded-xl p-5 shadow-sm transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <div 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b pb-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div>
              <h3 className="text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <span>فهرس السور الخمسين (50) التي يختلف فيها عدد الآيات</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  isLight ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  50 سورة
                </span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                انقر على زر "مقارنة متزامنة" بجانب أي سورة للانتقال فوراً إليها في اللوح المقابل.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="تصفية السور الخمسين..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full rounded-lg pr-8 pl-3 py-1.5 text-xs border transition-colors outline-none focus:border-[var(--color-primary)]"
                style={{
                  backgroundColor: 'var(--color-input)',
                  borderColor: 'var(--color-input-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr 
                  className="border-b font-semibold text-[11px]"
                  style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <th className="py-2 px-3">رقم</th>
                  <th className="py-2 px-3">السورة</th>
                  <th className="py-2 px-3">النزول</th>
                  <th className="py-2 px-3 text-center text-[#1A5C5C] dark:text-teal-400 font-bold">آيات الكوفي</th>
                  <th className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">آيات المدني</th>
                  <th className="py-2 px-3 text-center text-amber-600 dark:text-amber-400 font-bold">الفارق (مدني - كوفي)</th>
                  <th className="py-2 px-3 text-center">إجراء المقابلة</th>
                </tr>
              </thead>
              <tbody 
                className="divide-y"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                {comparisonList
                  .filter(c => c.diff.isDifferent)
                  .filter(c => !tableSearch.trim() || c.name.includes(tableSearch.trim()) || c.number.toString() === tableSearch.trim())
                  .map((item) => (
                    <tr 
                      key={item.number} 
                      className="transition-colors hover:bg-[var(--color-card-hover)]"
                      style={{
                        backgroundColor: item.number === selectedSurahNum ? 'var(--color-primary-soft)' : 'transparent',
                        borderColor: 'var(--color-border-subtle)'
                      }}
                    >
                      <td className="py-2.5 px-3 font-mono" style={{ color: 'var(--color-text-muted)' }}>{item.number}</td>
                      <td className="py-2.5 px-3 font-bold font-heading text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.name}</td>
                      <td className="py-2.5 px-3" style={{ color: 'var(--color-text-secondary)' }}>{item.isMeccan ? 'مكية' : 'مدنية'}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-[#1A5C5C] dark:text-teal-400">{item.kufi.ayahs}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.madani.ayahs}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded border ${
                          item.diff.ayahs > 0 
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                        }`}>
                          {item.diff.ayahs > 0 ? `+${item.diff.ayahs}` : item.diff.ayahs}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterMode('all');
                            setSelectedSurahNum(item.number);
                            setSelectedReaderSurah(item.number);
                            setHighlightedAyah(1);
                            setActiveComparisonTab('direct-compare');
                            window.scrollTo({ top: 380, behavior: 'smooth' });
                          }}
                          className="px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white border border-[var(--color-border)]"
                        >
                          مقارنة متزامنة ←
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STATISTICAL DIVERGENCE MATRIX */}
      {activeComparisonTab === 'divergence-matrix' && (
        <MushafStatisticalDivergence
          onOpenSurahVerseCompare={(surahNum) => {
            setSearchQuery('');
            setFilterMode('all');
            setSelectedSurahNum(surahNum);
            setSelectedReaderSurah(surahNum);
            setHighlightedAyah(1);
            setActiveComparisonTab('direct-compare');
            window.scrollTo({ top: 380, behavior: 'smooth' });
          }}
        />
      )}

      {/* GLOBAL MUSHAF DIFFS SEARCH MODAL (114 SURAHS) */}
      <MushafGlobalDiffModal
        isOpen={isGlobalSearchModalOpen}
        onClose={() => setIsGlobalSearchModalOpen(false)}
        kufiDataset={kufiDataset}
        madaniDataset={madaniDataset}
        onJumpToSurahAyah={(surahNum, ayahNum) => {
          setSearchQuery('');
          setFilterMode('all');
          setSelectedSurahNum(surahNum);
          setSelectedReaderSurah(surahNum);
          setActiveComparisonTab('direct-compare');
          handleJumpToAyah(ayahNum);
        }}
      />

    </div>
  );
};

export const MushafComparisonLab = React.memo(MushafComparisonLabComponent);

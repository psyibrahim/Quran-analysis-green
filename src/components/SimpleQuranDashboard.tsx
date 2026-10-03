import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  ArrowRightLeft, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  ExternalLink,
  Layers,
  Award,
  Hash,
  FileText,
  AlignLeft,
  PieChart
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { SurahData } from '../types';
import { formatSurahName, cleanQuranicWord } from '../utils/arabic';

interface SimpleQuranDashboardProps {
  onSwitchToAdvanced: () => void;
  onOpenInReader: (surahNumber: number) => void;
  onCompareWith: (surahNumber: number) => void;
  onOpenSurahDetail: (surah: SurahData) => void;
}

export const SimpleQuranDashboard: React.FC<SimpleQuranDashboardProps> = ({
  onSwitchToAdvanced,
  onOpenInReader,
  onCompareWith,
  onOpenSurahDetail
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { surahs, corpus, activeMushaf, activeMeta, setActiveMushaf } = useQuranCorpus();

  // State
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [activeSimpleTab, setActiveSimpleTab] = useState<'rhythm' | 'vocab' | 'compare'>('rhythm');
  
  // For Quick Comparison
  const [compareSurahNumber, setCompareSurahNumber] = useState<number>(2);

  // Active Surah data
  const currentSurah = useMemo(() => {
    return surahs.find(s => s.number === selectedSurahNumber) || surahs[0];
  }, [surahs, selectedSurahNumber]);

  // Comparison Surah data
  const comparisonSurah = useMemo(() => {
    return surahs.find(s => s.number === compareSurahNumber) || surahs[1] || surahs[0];
  }, [surahs, compareSurahNumber]);

  // Filtered surah list for search dropdown
  const filteredSurahs = useMemo(() => {
    return surahs.filter(s => {
      const matchesFilter = filterType === 'all' || s.revelationType === filterType;
      const cleanName = formatSurahName(s.name);
      const matchesSearch = !searchQuery.trim() || 
        cleanName.includes(searchQuery.trim()) || 
        s.number.toString() === searchQuery.trim();
      return matchesFilter && matchesSearch;
    });
  }, [surahs, filterType, searchQuery]);

  // Verses analysis for the active surah
  const verseAnalysis = useMemo(() => {
    const surahCorpus = corpus.find(c => c.number === currentSurah.number);
    if (!surahCorpus || !surahCorpus.ayahs || surahCorpus.ayahs.length === 0) {
      return {
        ayahsList: [],
        longestAyah: null,
        shortestAyah: null,
        lengthBuckets: { short: 0, medium: 0, long: 0, veryLong: 0 },
        totalWords: currentSurah.totalWords
      };
    }

    const ayahsList = surahCorpus.ayahs.map(a => {
      const rawText = a.textSimple || a.textUthmani || '';
      // Accurate word counting by filtering standalone waqf punctuation
      const words = rawText.trim().split(/\s+/).filter(w => !/^[\u06D6-\u06ED\u06DF-\u06E4\u06E9\u06EA\uFD3E\uFD3F]$/.test(w));
      const wordCount = words.length;
      return {
        numberInSurah: a.numberInSurah,
        textSimple: a.textSimple,
        textUthmani: a.textUthmani,
        wordCount,
        charCount: rawText.replace(/\s+/g, '').length
      };
    });

    let longest = ayahsList[0];
    let shortest = ayahsList[0];
    const lengthBuckets = { short: 0, medium: 0, long: 0, veryLong: 0 };

    ayahsList.forEach(a => {
      if (a.wordCount > longest.wordCount) longest = a;
      if (a.wordCount < shortest.wordCount) shortest = a;

      if (a.wordCount <= 5) lengthBuckets.short++;
      else if (a.wordCount <= 15) lengthBuckets.medium++;
      else if (a.wordCount <= 30) lengthBuckets.long++;
      else lengthBuckets.veryLong++;
    });

    return {
      ayahsList,
      longestAyah: longest,
      shortestAyah: shortest,
      lengthBuckets,
      totalWords: currentSurah.totalWords
    };
  }, [corpus, currentSurah]);

  // Vocabulary analysis for the active surah (Top Words + Hapax Legomena)
  const vocabAnalysis = useMemo(() => {
    const surahCorpus = corpus.find(c => c.number === currentSurah.number);
    if (!surahCorpus || !surahCorpus.ayahs) {
      return {
        totalUniqueWords: currentSurah.uniqueWordsCount || 0,
        hapaxCount: 0,
        hapaxSample: [],
        topWords: currentSurah.words?.topWords || []
      };
    }

    const wordFreqMap = new Map<string, number>();
    surahCorpus.ayahs.forEach(a => {
      const tokens = (a.textSimple || '').trim().split(/\s+/);
      tokens.forEach(tok => {
        const clean = cleanQuranicWord(tok);
        if (!clean || clean.length < 2) return;
        wordFreqMap.set(clean, (wordFreqMap.get(clean) || 0) + 1);
      });
    });

    const hapax: string[] = [];
    const sortedWords: { word: string; count: number; percentage: number }[] = [];

    for (const [w, count] of wordFreqMap.entries()) {
      if (count === 1) {
        hapax.push(w);
      }
      sortedWords.push({
        word: w,
        count,
        percentage: Number(((count / (currentSurah.totalWords || 1)) * 100).toFixed(2))
      });
    }

    sortedWords.sort((a, b) => b.count - a.count);

    return {
      totalUniqueWords: wordFreqMap.size,
      hapaxCount: hapax.length,
      hapaxSample: hapax.slice(0, 30),
      topWords: sortedWords.slice(0, 16)
    };
  }, [corpus, currentSurah]);

  // Comparison metrics between currentSurah and comparisonSurah
  const comparisonMetrics = useMemo(() => {
    const sA = currentSurah;
    const sB = comparisonSurah;

    return [
      {
        id: 'totalAyahs',
        label: 'عدد الآيات',
        valA: sA.totalAyahs,
        valB: sB.totalAyahs,
        unit: 'آية',
        note: sA.totalAyahs > sB.totalAyahs ? `${formatSurahName(sA.name)} أطول بـ ${sA.totalAyahs - sB.totalAyahs} آية` : `${formatSurahName(sB.name)} أطول بـ ${sB.totalAyahs - sA.totalAyahs} آية`
      },
      {
        id: 'totalWords',
        label: 'إجمالي الكلمات',
        valA: sA.totalWords,
        valB: sB.totalWords,
        unit: 'كلمة',
        note: `نسبة الكلمات: ${(sA.totalWords / (sB.totalWords || 1)).toFixed(2)}x`
      },
      {
        id: 'avgAyahLength',
        label: 'متوسط طول الآية',
        valA: Number(sA.avgAyahLengthWords.toFixed(1)),
        valB: Number(sB.avgAyahLengthWords.toFixed(1)),
        unit: 'كلمة/آية',
        note: sA.avgAyahLengthWords > sB.avgAyahLengthWords ? `إيقاع ${sA.name} أكثر تفصيلاً وبسطاً` : `إيقاع ${sB.name} أكثر تفصيلاً وبسطاً`
      },
      {
        id: 'ttr',
        label: 'نسبة التنوع المعجمي',
        valA: Number(sA.vocabularyDiversity.toFixed(1)),
        valB: Number(sB.vocabularyDiversity.toFixed(1)),
        unit: '%',
        note: sA.vocabularyDiversity > sB.vocabularyDiversity ? `${sA.name} أغنى بمفردات غير مكررة` : `${sB.name} أغنى بمفردات غير مكررة`
      },
      {
        id: 'totalLetters',
        label: 'إجمالي الحروف',
        valA: sA.totalChars,
        valB: sB.totalChars,
        unit: 'حرف',
        note: `متوسط طول الكلمة: ${(sA.totalChars / (sA.totalWords || 1)).toFixed(2)} حرف`
      }
    ];
  }, [currentSurah, comparisonSurah]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Header Banner & Surah Selector */}
      <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340] shadow-md'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-8 h-8 rounded-lg bg-[#1A5C5C]/15 border border-[#1A5C5C]/30 flex items-center justify-center text-[#1A5C5C] dark:text-[#52C592] font-black text-sm">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                <span>الإحصاء الوصفي البسيط لسور القرآن الكريم</span>
              </h2>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                currentSurah.revelationType === 'Meccan'
                  ? isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border-[#E8DEC8]' : 'bg-[#2A2416] text-[#E0C088] border-[#3D331D]'
                  : isLight ? 'bg-[#EBF5F3] text-[#1A5C5C] border-[#C5DDD8]' : 'bg-[#163330] text-[#52C592] border-[#264340]'
              }`}>
                {currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • سورة #{currentSurah.number}
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'} max-w-3xl leading-relaxed`}>
              تحليل رياضي أكاديمي مباشر يعتمد على الأرقام الحقيقية الملموسة: أطوال الآيات، سرعة الإيقاع، تردد الكلمات، ونسبة التنوع المعجمي دون تعقيدات هندسية.
            </p>
          </div>

          {/* Quick Surah Picker, Mushaf Switcher & Advanced Switch */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Quick Mushaf Switcher in Simple View */}
            <div className={`flex items-center p-0.5 rounded-xl border shadow-2xs ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <button
                type="button"
                onClick={() => setActiveMushaf('kufi')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeMushaf === 'kufi'
                    ? 'bg-[#1A5C5C] text-[#F7F4EA] shadow-xs font-black'
                    : isLight 
                      ? 'bg-[#FBF9F2] text-[#0F1419] border border-[#DED8C9] hover:bg-[#F0EDE1]' 
                      : 'text-[#8FA09C] hover:text-[#E0C088]'
                }`}
                title="المصحف الكوفي (حفص) 6,236 آية"
              >
                <span className={`w-2 h-2 rounded-full ${activeMushaf === 'kufi' ? 'bg-[#F7F4EA]' : 'bg-[#1A5C5C]'}`} />
                <span>الكوفي</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                  activeMushaf === 'kufi' ? 'bg-[#124242] text-[#F7F4EA]' : isLight ? 'bg-[#F0EDE1] text-[#0F1419]' : 'bg-[#163330] text-[#E0C088]'
                }`}>
                  6236
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMushaf('madani')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeMushaf === 'madani'
                    ? 'bg-[#8C6D2D] text-[#FAF6EC] shadow-xs font-black'
                    : isLight 
                      ? 'bg-[#FBF9F2] text-[#0F1419] border border-[#DED8C9] hover:bg-[#F0EDE1]' 
                      : 'text-[#8FA09C] hover:text-[#E0C088]'
                }`}
                title="المصحف المدني (ورش) 6,214 آية"
              >
                <span className={`w-2 h-2 rounded-full ${activeMushaf === 'madani' ? 'bg-[#FAF6EC]' : 'bg-[#8C6D2D]'}`} />
                <span>المدني</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold ${
                  activeMushaf === 'madani' ? 'bg-[#70551E] text-[#FAF6EC]' : isLight ? 'bg-[#F0EDE1] text-[#0F1419]' : 'bg-[#163330] text-[#E0C088]'
                }`}>
                  6214
                </span>
              </button>
            </div>

            {/* Surah Navigation Arrows */}
            <div className={`flex items-center border rounded-xl overflow-hidden shadow-2xs ${
              isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedSurahNumber(prev => Math.max(1, prev - 1))}
                disabled={selectedSurahNumber <= 1}
                className={`p-2 transition-colors ${
                  selectedSurahNumber <= 1 
                    ? 'opacity-40 cursor-not-allowed' 
                    : isLight ? 'hover:bg-[#F0EDE1] text-[#0F1419]' : 'hover:bg-[#163330] text-[#E0C088]'
                }`}
                title="السورة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Dropdown Selector */}
              <select
                value={selectedSurahNumber}
                onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
                className={`px-3 py-1.5 text-xs font-black outline-none border-x transition-colors cursor-pointer ${
                  isLight ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#E0C088]'
                }`}
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {formatSurahName(s.name)} ({s.totalAyahs} آية)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSelectedSurahNumber(prev => Math.min(114, prev + 1))}
                disabled={selectedSurahNumber >= 114}
                className={`p-2 transition-colors ${
                  selectedSurahNumber >= 114 
                    ? 'opacity-40 cursor-not-allowed' 
                    : isLight ? 'hover:bg-[#F0EDE1] text-[#0F1419]' : 'hover:bg-[#163330] text-[#E0C088]'
                }`}
                title="السورة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Switch to Advanced Lab */}
            <button
              type="button"
              onClick={onSwitchToAdvanced}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                isLight 
                  ? 'bg-lime-50 hover:bg-lime-100 border-lime-300 text-lime-900 shadow-2xs' 
                  : 'bg-lime-950/40 hover:bg-lime-900/60 border-lime-700 text-lime-300'
              }`}
              title="الانتقال إلى أدوات المختبر والتحليلات الرياضية المتقدمة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
              <span>المختبر المتقدم</span>
            </button>
          </div>
        </div>

        {/* 2. Top Kicker Metric Cards (6 Clear Core Indicators) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          {/* 1. Verses */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <span className={`text-[11px] font-bold block mb-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>عدد الآيات</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#1A5C5C] dark:text-[#52C592]">
                {currentSurah.totalAyahs}
              </span>
              <span className={`text-[11px] font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>آية</span>
            </div>
            <span className={`text-[10px] block mt-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
              {currentSurah.totalAyahs > 50 ? 'سورة طويلة / متوسطة' : 'سورة قصيرة ومركزة'}
            </span>
          </div>

          {/* 2. Words */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <span className={`text-[11px] font-bold block mb-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>إجمالي الكلمات</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {currentSurah.totalWords.toLocaleString('en-US')}
              </span>
              <span className={`text-[11px] font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>كلمة</span>
            </div>
            <span className={`text-[10px] block mt-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
              {currentSurah.totalChars.toLocaleString('en-US')} حرفاً
            </span>
          </div>

          {/* 3. Average Verse Length */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <span className={`text-[11px] font-bold block mb-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>متوسط طول الآية</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#8C6D2D] dark:text-[#E0C088]">
                {currentSurah.avgAyahLengthWords.toFixed(1)}
              </span>
              <span className={`text-[11px] font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>كلمة/آية</span>
            </div>
            <span className={`text-[10px] block mt-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
              {currentSurah.avgAyahLengthWords > 12 ? 'فواصل طويلة تشريعية' : 'فواصل إيقاعية سريعة'}
            </span>
          </div>

          {/* 4. Lexical Diversity (TTR) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <span className={`text-[11px] font-bold block mb-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>التنوع المعجمي (TTR)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-lime-600 dark:text-lime-400">
                {currentSurah.vocabularyDiversity.toFixed(1)}%
              </span>
            </div>
            <span className={`text-[10px] block mt-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`} title="نسبة الكلمات المختلفة غير المكررة">
              {vocabAnalysis.totalUniqueWords} كلمة مختلفة
            </span>
          </div>

          {/* 5. Unique Words (Hapax) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <span className={`text-[11px] font-bold block mb-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>الورود المنفرد (وحيدة)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                {vocabAnalysis.hapaxCount}
              </span>
              <span className={`text-[11px] font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>مفردة</span>
            </div>
            <span className={`text-[10px] block mt-1 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
              جاءت مرة واحدة فقط بالسورة
            </span>
          </div>

          {/* 6. Quran Reader Jump */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            isLight ? 'bg-[#EBF5F3] border-[#C5DDD8]' : 'bg-[#163330] border-[#264340]'
          }`}>
            <span className="text-[11px] font-bold text-[#1A5C5C] dark:text-[#52C592] block mb-1">القراءة والتحليل</span>
            <div className="flex items-center gap-1.5 mt-auto">
              <button
                type="button"
                onClick={() => onOpenInReader(currentSurah.number)}
                className="flex-1 px-2.5 py-1 rounded-lg text-xs font-black bg-[#1A5C5C] hover:bg-[#154949] text-[#F7F4EA] transition-all shadow-2xs text-center cursor-pointer"
              >
                تلاوة السورة
              </button>
              <button
                type="button"
                onClick={() => onOpenSurahDetail(currentSurah)}
                className={`p-1 rounded-lg border transition-all cursor-pointer ${
                  isLight ? 'bg-[#FBF9F2] hover:bg-[#F0EDE1] border-[#C5DDD8] text-[#1A5C5C]' : 'bg-[#10211F] hover:bg-[#142825] border-[#264340] text-[#52C592]'
                }`}
                title="فتح بطاقة التحليل الكاملة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section Tabs: 1. أطوال الآيات والإيقاع · 2. قاموس الكلمات · 3. مقارنة سريعة */}
      <div className="flex items-center gap-2 border-b pb-2 text-xs font-black">
        <button
          type="button"
          onClick={() => setActiveSimpleTab('rhythm')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeSimpleTab === 'rhythm'
              ? 'bg-[#1A5C5C] text-[#F7F4EA] shadow-2xs'
              : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>أطوال الآيات وإيقاع السورة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSimpleTab('vocab')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeSimpleTab === 'vocab'
              ? 'bg-[#1A5C5C] text-[#F7F4EA] shadow-2xs'
              : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>قاموس الكلمات والمفردات الفريدة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSimpleTab('compare')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
            activeSimpleTab === 'compare'
              ? 'bg-[#1A5C5C] text-[#F7F4EA] shadow-2xs'
              : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>مقارنة سريعة بين سورتين</span>
        </button>
      </div>

      {/* 4. Tab 1: Verse Length & Rhythm (أطوال الآيات وإيقاع السورة) */}
      {activeSimpleTab === 'rhythm' && (
        <div className="space-y-6">
          {/* Longest & Shortest Verses Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Longest Verse */}
            {verseAnalysis.longestAyah && (
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight ? 'bg-[#FBF9F2] border-[#E8DEC8] shadow-2xs' : 'bg-[#142825] border-[#3D331D]'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <h4 className="text-sm font-black text-[#8C6D2D] dark:text-[#E0C088]">
                      أطول آية في {formatSurahName(currentSurah.name)}
                    </h4>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                    isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border border-[#E8DEC8]' : 'bg-[#2A2416] text-[#E0C088] border border-[#3D331D]'
                  }`}>
                    الآية #{verseAnalysis.longestAyah.numberInSurah} • {verseAnalysis.longestAyah.wordCount} كلمة
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 mb-3">
                  <p className="font-quran text-base sm:text-lg leading-relaxed text-right font-medium">
                    {verseAnalysis.longestAyah.textUthmani || verseAnalysis.longestAyah.textSimple}
                  </p>
                </div>
                <div className={`flex items-center justify-between text-xs font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                  <span>عدد الحروف: {verseAnalysis.longestAyah.charCount} حرفاً</span>
                  <span>تشكل {((verseAnalysis.longestAyah.wordCount / (currentSurah.totalWords || 1)) * 100).toFixed(1)}% من كلمات السورة</span>
                </div>
              </div>
            )}

            {/* Shortest Verse */}
            {verseAnalysis.shortestAyah && (
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isLight ? 'bg-[#FBF9F2] border-[#C5DDD8] shadow-2xs' : 'bg-[#142825] border-[#264340]'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C5C] dark:bg-[#52C592]"></span>
                    <h4 className="text-sm font-black text-[#1A5C5C] dark:text-[#52C592]">
                      أقصر آية في {formatSurahName(currentSurah.name)}
                    </h4>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                    isLight ? 'bg-[#EBF5F3] text-[#1A5C5C] border border-[#C5DDD8]' : 'bg-[#163330] text-[#52C592] border border-[#264340]'
                  }`}>
                    الآية #{verseAnalysis.shortestAyah.numberInSurah} • {verseAnalysis.shortestAyah.wordCount} كلمة
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#1A5C5C]/5 border border-[#1A5C5C]/15 dark:bg-[#52C592]/5 dark:border-[#52C592]/15 mb-3">
                  <p className="font-quran text-base sm:text-lg leading-relaxed text-right font-medium">
                    {verseAnalysis.shortestAyah.textUthmani || verseAnalysis.shortestAyah.textSimple}
                  </p>
                </div>
                <div className={`flex items-center justify-between text-xs font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                  <span>عدد الحروف: {verseAnalysis.shortestAyah.charCount} حرفاً</span>
                  <span>متوسط طول الكلمة: {(verseAnalysis.shortestAyah.charCount / (verseAnalysis.shortestAyah.wordCount || 1)).toFixed(1)} حرف</span>
                </div>
              </div>
            )}
          </div>

          {/* Verse Length Distribution (Horizontal Clean Bars) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
          }`}>
            <h4 className="text-sm font-black mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1A5C5C] dark:text-[#52C592]" />
              <span>توزيع آيات السورة حسب فئات الطول (Verse Length Buckets)</span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-ink-600' : 'text-ink-400'} mb-4`}>
              تصنيف آيات السورة الـ {currentSurah.totalAyahs} لمعرفة نمط السرد: هل يغلب عليها الإيجاز الخاطف أم البيان المسهب؟
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category 1: 1-5 words */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#1A5C5C] dark:text-[#52C592]">قصيرة جداً (1-5 كلمات)</span>
                  <span className="font-mono">{verseAnalysis.lengthBuckets.short} آية</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE4D5] dark:bg-[#10211F] overflow-hidden mb-1">
                  <div 
                    className="h-full bg-[#1A5C5C] dark:bg-[#52C592] rounded-full transition-all duration-500" 
                    style={{ width: `${(verseAnalysis.lengthBuckets.short / (currentSurah.totalAyahs || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#7B8885]">
                  {((verseAnalysis.lengthBuckets.short / (currentSurah.totalAyahs || 1)) * 100).toFixed(1)}% من آيات السورة
                </span>
              </div>

              {/* Category 2: 6-15 words */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-emerald-700 dark:text-emerald-400">متوسطة (6-15 كلمة)</span>
                  <span className="font-mono">{verseAnalysis.lengthBuckets.medium} آية</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE4D5] dark:bg-[#10211F] overflow-hidden mb-1">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                    style={{ width: `${(verseAnalysis.lengthBuckets.medium / (currentSurah.totalAyahs || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#7B8885]">
                  {((verseAnalysis.lengthBuckets.medium / (currentSurah.totalAyahs || 1)) * 100).toFixed(1)}% من آيات السورة
                </span>
              </div>

              {/* Category 3: 16-30 words */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#8C6D2D] dark:text-[#E0C088]">طويلة (16-30 كلمة)</span>
                  <span className="font-mono">{verseAnalysis.lengthBuckets.long} آية</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE4D5] dark:bg-[#10211F] overflow-hidden mb-1">
                  <div 
                    className="h-full bg-[#8C6D2D] dark:bg-[#E0C088] rounded-full transition-all duration-500" 
                    style={{ width: `${(verseAnalysis.lengthBuckets.long / (currentSurah.totalAyahs || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#7B8885]">
                  {((verseAnalysis.lengthBuckets.long / (currentSurah.totalAyahs || 1)) * 100).toFixed(1)}% من آيات السورة
                </span>
              </div>

              {/* Category 4: > 30 words */}
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-lime-700 dark:text-lime-400">طويلة جداً (&gt; 30 كلمة)</span>
                  <span className="font-mono">{verseAnalysis.lengthBuckets.veryLong} آية</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE4D5] dark:bg-[#10211F] overflow-hidden mb-1">
                  <div 
                    className="h-full bg-lime-600 rounded-full transition-all duration-500" 
                    style={{ width: `${(verseAnalysis.lengthBuckets.veryLong / (currentSurah.totalAyahs || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#7B8885]">
                  {((verseAnalysis.lengthBuckets.veryLong / (currentSurah.totalAyahs || 1)) * 100).toFixed(1)}% من آيات السورة
                </span>
              </div>
            </div>
          </div>

          {/* Simple Verse Length Sequence Strip */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-emerald-600" />
                  <span>تدرج أطوال الآيات عبر السورة (Verse-by-Verse Length)</span>
                </h4>
                <p className={`text-xs ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                  كل شريط يمثل آية بترتيبها، وارتفاعه يوضح عدد كلماتها لبيان تتابع النَفَس القرآني
                </p>
              </div>
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                1 إلى {verseAnalysis.ayahsList.length} آية
              </span>
            </div>

            <div className="flex items-end gap-1 h-32 overflow-x-auto pt-4 pb-1 scrollbar-thin">
              {verseAnalysis.ayahsList.map((a) => {
                const maxWords = verseAnalysis.longestAyah?.wordCount || 50;
                const heightPct = Math.max(12, Math.min(100, (a.wordCount / maxWords) * 100));
                const isLongest = a.numberInSurah === verseAnalysis.longestAyah?.numberInSurah;
                const isShortest = a.numberInSurah === verseAnalysis.shortestAyah?.numberInSurah;

                return (
                  <div
                    key={a.numberInSurah}
                    className="flex flex-col items-center gap-1 group relative cursor-pointer min-w-[14px] flex-1 max-w-[28px]"
                    title={`الآية #${a.numberInSurah}: ${a.wordCount} كلمة (${a.textSimple.slice(0, 35)}...)`}
                  >
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isLongest 
                          ? 'bg-[#8C6D2D] hover:bg-[#A38035]' 
                          : isShortest 
                            ? 'bg-[#1A5C5C] hover:bg-[#227575]' 
                            : isLight ? 'bg-[#DED8C9] hover:bg-[#1A5C5C]' : 'bg-[#264340] hover:bg-[#52C592]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] font-mono text-[#7B8885] group-hover:text-[#0F1419] dark:group-hover:text-[#E0C088]">
                      {a.numberInSurah}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className={`flex items-center justify-between text-[11px] font-bold border-t pt-2 mt-2 ${isLight ? 'text-[#53605E] border-[#EAE4D5]' : 'text-[#8FA09C] border-[#1C423E]'}`}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#8C6D2D]"></span>
                <span>الأطول بالسورة</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1A5C5C]"></span>
                <span>الأقصر بالسورة</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#DED8C9] dark:bg-[#264340]"></span>
                <span>باقي الآيات</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Vocabulary & Hapax (قاموس الكلمات والمفردات الفريدة) */}
      {activeSimpleTab === 'vocab' && (
        <div className="space-y-6">
          {/* TTR Explanation Card */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#8C6D2D]' : 'bg-[#2A2416] border-[#3D331D] text-[#E0C088]'
          }`}>
            <Info className="w-5 h-5 text-[#8C6D2D] dark:text-[#E0C088] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block text-sm font-black mb-1">ماذا يعني التنوع المعجمي ({currentSurah.vocabularyDiversity.toFixed(1)}%)؟</strong>
              <p>
                يقيس مؤشر التنوع المعجمي (Type-Token Ratio) ثراء قاموس السورة: من بين كل 100 كلمة تقرأها في {formatSurahName(currentSurah.name)}، هناك تقريباً <strong>{Math.round(currentSurah.vocabularyDiversity)} كلمة فريدة وجديدة</strong> لم تتكرر، بينما باقي الكلمات هي مفردات متكررة تؤكد على المحاور الموضوعية الرئيسية للسورة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Words (7 cols) */}
            <div className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border transition-all ${
              isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
            }`}>
              <h4 className="text-sm font-black mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>الكلمات الأكثر تكراراً في {formatSurahName(currentSurah.name)}</span>
              </h4>
              <p className={`text-xs ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'} mb-4`}>
                ترتيب تنازلي لأهم المفردات التي ترتكز عليها المعاني العامة للسورة وتكرارها النسبي
              </p>

              <div className="space-y-2.5">
                {vocabAnalysis.topWords.map((item, idx) => {
                  const maxCount = vocabAnalysis.topWords[0]?.count || 1;
                  const barWidth = (item.count / maxCount) * 100;

                  return (
                    <div 
                      key={item.word}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isLight ? 'bg-[#FBF9F2] border-[#DED8C9] hover:bg-[#F7F4EA]' : 'bg-[#142825] border-[#264340] hover:bg-[#163330]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-[120px]">
                        <span className="w-5 h-5 rounded-full bg-[#EAE4D5] dark:bg-[#10211F] text-[10px] font-mono font-bold flex items-center justify-center text-[#53605E] dark:text-[#8FA09C]">
                          {idx + 1}
                        </span>
                        <span className="font-heading text-base font-bold text-[#0F1419] dark:text-[#E0C088]">
                          {item.word}
                        </span>
                      </div>

                      <div className="flex-1 max-w-xs mx-2 hidden sm:block">
                        <div className="w-full h-2 rounded-full bg-[#EAE4D5] dark:bg-[#10211F] overflow-hidden">
                          <div 
                            className="h-full bg-[#1A5C5C] dark:bg-[#52C592] rounded-full" 
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                        <span className="font-mono text-emerald-700 dark:text-emerald-400">
                          {item.count} مرات
                        </span>
                        <span className="text-[11px] font-mono text-ink-400">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hapax Legomena: Unique Words (5 cols) */}
            <div className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border transition-all ${
              isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-black flex items-center gap-2">
                  <Award className="w-4 h-4 text-rose-600" />
                  <span>مفردات الورود المنفرد (Hapax Legomena)</span>
                </h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  isLight ? 'bg-rose-100 text-rose-950' : 'bg-rose-950 text-rose-300'
                }`}>
                  {vocabAnalysis.hapaxCount} كلمة
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'} mb-4`}>
                مفردات وردت <strong>مرة واحدة فقط</strong> بالسورة؛ تمثل بصمة معجمية خاصة تصنع تفرد السورة
              </p>

              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto p-1">
                {vocabAnalysis.hapaxSample.map(w => (
                  <span
                    key={w}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-default ${
                      isLight 
                        ? 'bg-rose-50/60 border-rose-200 text-rose-950 hover:bg-rose-100' 
                        : 'bg-rose-950/20 border-rose-900/60 text-rose-300 hover:bg-rose-900/40'
                    }`}
                  >
                    {w}
                  </span>
                ))}
              </div>

              {vocabAnalysis.hapaxCount > vocabAnalysis.hapaxSample.length && (
                <p className={`text-[11px] mt-3 border-t pt-2 text-center ${isLight ? 'text-[#53605E] border-[#EAE4D5]' : 'text-[#8FA09C] border-[#1C423E]'}`}>
                  عرض عينة من {vocabAnalysis.hapaxSample.length} كلمة من إجمالي {vocabAnalysis.hapaxCount} كلمة وحيدة الورود بالسورة
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Two-Surah Fast Comparison (مقارنة سريعة بين سورتين) */}
      {activeSimpleTab === 'compare' && (
        <div className="space-y-6">
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-sm font-black flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#1A5C5C] dark:text-[#52C592]" />
                  <span>مقارنة مباشرة بين سورتين (Head-to-Head Comparison)</span>
                </h4>
                <p className={`text-xs ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                  قارن السورة الحالية مع أي سورة أخرى في المصحف الشريف في 5 مؤشرات وصفية مباشرة
                </p>
              </div>

              {/* Second Surah Picker */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>قارن مع:</span>
                <select
                  value={compareSurahNumber}
                  onChange={(e) => setCompareSurahNumber(Number(e.target.value))}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl border outline-none cursor-pointer ${
                    isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#E0C088]'
                  }`}
                >
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {formatSurahName(s.name)} ({s.totalAyahs} آية)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Surah Headers Bar */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3.5 rounded-xl border text-center ${
                isLight ? 'bg-[#EBF5F3] border-[#C5DDD8]' : 'bg-[#163330] border-[#264340]'
              }`}>
                <span className="text-xs font-bold text-[#1A5C5C] dark:text-[#52C592] block mb-0.5">السورة الأولى</span>
                <h3 className="text-lg font-black text-[#1A5C5C] dark:text-[#52C592]">
                  {formatSurahName(currentSurah.name)} (#{currentSurah.number})
                </h3>
                <span className="text-[11px] text-ink-500 font-bold">
                  {currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {currentSurah.totalAyahs} آية
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border text-center ${
                isLight ? 'bg-lime-50 border-lime-200' : 'bg-lime-950/40 border-lime-800'
              }`}>
                <span className="text-xs font-bold text-lime-800 dark:text-lime-300 block mb-0.5">السورة الثانية المقارنة</span>
                <h3 className="text-lg font-black text-lime-950 dark:text-lime-100">
                  {formatSurahName(comparisonSurah.name)} (#{comparisonSurah.number})
                </h3>
                <span className="text-[11px] text-ink-500 font-bold">
                  {comparisonSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {comparisonSurah.totalAyahs} آية
                </span>
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-3">
              {comparisonMetrics.map(m => {
                const total = (Number(m.valA) || 0) + (Number(m.valB) || 0);
                const pctA = total > 0 ? ((Number(m.valA) || 0) / total) * 100 : 50;
                const pctB = total > 0 ? ((Number(m.valB) || 0) / total) * 100 : 50;

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      isLight ? 'bg-[#FAF6EC] border-[#E8DEC8]' : 'bg-[#10211F] border-[#264340]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="font-mono text-[#1A5C5C] dark:text-[#52C592]">
                        {m.valA.toLocaleString('en-US')} {m.unit}
                      </span>
                      <span className="text-[#0F1419] dark:text-[#E0C088] font-black">
                        {m.label}
                      </span>
                      <span className="font-mono text-lime-700 dark:text-lime-400">
                        {m.valB.toLocaleString('en-US')} {m.unit}
                      </span>
                    </div>

                    {/* Dual Ratio Bar */}
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-[#EAE4D5] dark:bg-[#10211F] mb-2">
                      <div 
                        className="bg-[#1A5C5C] dark:bg-[#52C592] transition-all duration-500" 
                        style={{ width: `${pctA}%` }} 
                        title={`${formatSurahName(currentSurah.name)}: ${pctA.toFixed(1)}%`}
                      />
                      <div 
                        className="bg-lime-500 transition-all duration-500" 
                        style={{ width: `${pctB}%` }} 
                        title={`${formatSurahName(comparisonSurah.name)}: ${pctB.toFixed(1)}%`}
                      />
                    </div>

                    <div className="text-[11px] text-ink-500 text-center font-bold">
                      {m.note}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Launch Full Advanced Comparator Button */}
            <div className="mt-6 pt-4 border-t flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                هل ترغب في فحص التباعد الإحصائي وتطابق فواصل الآيات ومصفوفات الحروف بين هاتين السورتين؟
              </span>
              <button
                type="button"
                onClick={() => onCompareWith(comparisonSurah.number)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-lime-600 hover:bg-lime-700 text-white transition-all shadow-xs cursor-pointer"
              >
                <span>فتح المقارنة الموسعة بالمختبر المتقدم</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

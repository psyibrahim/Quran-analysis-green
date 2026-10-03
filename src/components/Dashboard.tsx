import React, { useMemo, useState } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { SurahData, ActiveTab, GlobalLetterStat } from '../types';
import { formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';
import { 
  BarChart3, 
  BookOpen, 
  Compass, 
  Flame, 
  Brain, 
  Music, 
  Scale, 
  Sparkles, 
  Layers, 
  ChevronLeft,
  TrendingUp,
  FileText,
  Hash
} from 'lucide-react';
import { ResearchCard } from './ui/ResearchCard';
import { SectionHeader } from './ui/SectionHeader';
import { ManuscriptCorner } from './ui/ManuscriptCorner';

interface DashboardProps {
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectSurah,
  onOpenInReader,
  onNavigateTab,
}) => {
  const { theme } = useTheme();
  const { 
    surahs, 
    letterStats, 
    macroStats, 
    activeMeta 
  } = useQuranCorpus();

  const [topLettersLimit, setTopLettersLimit] = useState<number>(10);

  // 1. Calculate top frequent letters sorted by occurrences
  const sortedLetters = useMemo(() => {
    if (!letterStats || !letterStats.globalStats) return [];
    const totalAllChars = macroStats.totalQuranChars || 1;

    return (Object.entries(letterStats.globalStats) as [string, GlobalLetterStat][])
      .map(([letter, data]) => {
        const count = data.totalOccurrences || 0;
        const pct = (count / totalAllChars) * 100;
        return {
          letter,
          name: data.name || letterStats.letterNames[letter] || letter,
          count,
          percentage: Number(pct.toFixed(2)),
          maxSurah: data.maxSurah,
          minSurah: data.minSurah,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [letterStats, macroStats.totalQuranChars]);

  const displayedLetters = useMemo(() => {
    return sortedLetters.slice(0, topLettersLimit);
  }, [sortedLetters, topLettersLimit]);

  // 2. Meccan vs Medinan calculations
  const meccanPercentSurahs = Number(((macroStats.meccan.surahsCount / macroStats.totalSurahs) * 100).toFixed(1));
  const medinanPercentSurahs = Number(((macroStats.medinan.surahsCount / macroStats.totalSurahs) * 100).toFixed(1));
  
  const meccanPercentWords = Number(((macroStats.meccan.totalWords / macroStats.totalQuranWords) * 100).toFixed(1));
  const medinanPercentWords = Number(((macroStats.medinan.totalWords / macroStats.totalQuranWords) * 100).toFixed(1));

  // 3. Top longest and shortest surahs
  const longestSurahs = useMemo(() => {
    return [...surahs].sort((a, b) => b.totalWords - a.totalWords).slice(0, 5);
  }, [surahs]);

  const shortestSurahs = useMemo(() => {
    return [...surahs].sort((a, b) => a.totalWords - b.totalWords).slice(0, 5);
  }, [surahs]);

  return (
    <div className="w-full space-y-6 pb-12 select-none">
      
      {/* 1. Scholarly Research Header Banner */}
      <ResearchCard padding="lg" withCorners>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-4 bg-[#1A5C5C] dark:bg-[#2B7470] rounded-xs" />
              <h1 className="text-xl sm:text-2xl font-bold font-sans-arabic tracking-tight text-[#0F1419] dark:text-[#F4F0E7]">
                لوحة المؤشرات الإحصائية العامة للقرآن الكريم
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] border border-[#B8935F]/40 bg-[#F7F2E8] dark:bg-[#262118] text-[#8C6B37] dark:text-[#C5A16A]">
                {activeMeta.canonicalName}
              </span>
              <SectionHelpButton 
                guideId="quran-reader" 
                variant="button" 
                title="دليل المؤشرات الإحصائية الشاملة" 
              />
            </div>
            <p className="text-xs sm:text-sm text-[#53605E] dark:text-[#B7C1BC] leading-relaxed max-w-3xl pr-4">
              تقرير بحثي يربط بين إجمالي الكلمات والحروف، والتوزيع الدقيق للسور المكية والمدنية، والحروف الأكثر تكراراً في التنزيل الحكيم وفق الضبط المعتمد في {activeMeta.name}.
            </p>
          </div>

          {/* Quick jump to Explorer */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('explorer')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-bold bg-[#1A5C5C] hover:bg-[#144848] text-[#F4F0E7] transition-colors cursor-pointer self-start md:self-auto shrink-0 shadow-xs"
            >
              <Compass className="w-4 h-4 text-[#B8935F]" />
              <span>فهرس السور الـ 114</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </ResearchCard>

      {/* 2. Four Quiet Academic Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Words */}
        <ResearchCard padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-[#7B8885] dark:text-[#8B9B96] text-xs">
            <span>إجمالي الكلمات</span>
            <FileText className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {macroStats.totalQuranWords.toLocaleString()}
            </span>
            <span className="text-xs text-[#7B8885]">كلمة</span>
          </div>
          <div className="text-[11px] text-[#53605E] dark:text-[#B7C1BC] pt-1 border-t border-[#DED8C9]/40 dark:border-[#33433F]/50">
            معدل <strong className="font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">{(macroStats.totalQuranWords / macroStats.totalQuranVerses).toFixed(1)}</strong> كلمة لكل آية
          </div>
        </ResearchCard>

        {/* Total Verses */}
        <ResearchCard padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-[#7B8885] dark:text-[#8B9B96] text-xs">
            <span>إجمالي الآيات</span>
            <Hash className="w-4 h-4 text-[#B8935F] dark:text-[#C5A16A]" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {macroStats.totalQuranVerses.toLocaleString()}
            </span>
            <span className="text-xs text-[#7B8885]">آية</span>
          </div>
          <div className="text-[11px] text-[#53605E] dark:text-[#B7C1BC] pt-1 border-t border-[#DED8C9]/40 dark:border-[#33433F]/50">
            وفق عد <strong className="text-[#0F1419] dark:text-[#F4F0E7]">{activeMeta.countSystem}</strong>
          </div>
        </ResearchCard>

        {/* Total Letters */}
        <ResearchCard padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-[#7B8885] dark:text-[#8B9B96] text-xs">
            <span>إجمالي الحروف (الرسم)</span>
            <Flame className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {macroStats.totalQuranChars.toLocaleString()}
            </span>
            <span className="text-xs text-[#7B8885]">حرفاً</span>
          </div>
          <div className="text-[11px] text-[#53605E] dark:text-[#B7C1BC] pt-1 border-t border-[#DED8C9]/40 dark:border-[#33433F]/50">
            معدل <strong className="font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">{(macroStats.totalQuranChars / macroStats.totalQuranWords).toFixed(2)}</strong> أحرف لكل كلمة
          </div>
        </ResearchCard>

        {/* Total Surahs */}
        <ResearchCard padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-[#7B8885] dark:text-[#8B9B96] text-xs">
            <span>إجمالي السور</span>
            <BookOpen className="w-4 h-4 text-[#B8935F] dark:text-[#C5A16A]" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
              {macroStats.totalSurahs}
            </span>
            <span className="text-xs text-[#7B8885]">سورة</span>
          </div>
          <div className="text-[11px] text-[#53605E] dark:text-[#B7C1BC] pt-1 border-t border-[#DED8C9]/40 dark:border-[#33433F]/50 flex items-center gap-1.5">
            <span className="font-bold text-[#1A5C5C] dark:text-[#79A9A0]">86 مكية</span>
            <span>·</span>
            <span className="font-bold text-[#B8935F]">28 مدنية</span>
          </div>
        </ResearchCard>
      </div>

      {/* 3. Main 2-Column Research Section: Meccan/Medinan + Frequent Letters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Section 1: Meccan / Medinan Distribution (5 cols) */}
        <ResearchCard padding="lg" className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#33433F] pb-2.5">
              <h2 className="text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                <span>توزيع السور المكية والمدنية</span>
              </h2>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('meccan-medinan')}
                  className="text-xs font-semibold text-[#1A5C5C] dark:text-[#C5A16A] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>تحليل تفصيلي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-[#53605E] dark:text-[#B7C1BC] leading-relaxed">
              مقارنة كمية بين السور المكية التأسيسية التي تنزلت قبل الهجرة، والسور المدنية التشريعية التي تنزلت بالمدينة المنورة.
            </p>

            {/* Proportion Bar: Surahs */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#1A5C5C] dark:text-[#79A9A0]">المكي: 86 سورة ({meccanPercentSurahs}%)</span>
                <span className="text-[#B8935F]">المدني: 28 سورة ({medinanPercentSurahs}%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#DED8C9]/40 dark:bg-[#33433F]">
                <div 
                  className="h-full bg-[#1A5C5C] dark:bg-[#2B7470]"
                  style={{ width: `${meccanPercentSurahs}%` }}
                />
                <div 
                  className="h-full bg-[#B8935F]"
                  style={{ width: `${medinanPercentSurahs}%` }}
                />
              </div>
            </div>

            {/* Proportion Bar: Words */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#1A5C5C] dark:text-[#79A9A0]">كلمات المكي: {meccanPercentWords}%</span>
                <span className="text-[#B8935F]">كلمات المدني: {medinanPercentWords}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#DED8C9]/40 dark:bg-[#33433F]">
                <div 
                  className="h-full bg-[#1A5C5C] dark:bg-[#2B7470]"
                  style={{ width: `${meccanPercentWords}%` }}
                />
                <div 
                  className="h-full bg-[#B8935F]"
                  style={{ width: `${medinanPercentWords}%` }}
                />
              </div>
            </div>

            {/* Detailed Table */}
            <div className="rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] overflow-hidden text-xs bg-[#F7F4EA] dark:bg-[#121C1B]">
              <div className="grid grid-cols-3 p-2 font-bold border-b border-[#DED8C9] dark:border-[#33433F] text-[#7B8885] dark:text-[#8B9B96]">
                <span>المؤشر</span>
                <span className="text-[#1A5C5C] dark:text-[#79A9A0] text-center">المكي</span>
                <span className="text-[#B8935F] text-center">المدني</span>
              </div>
              <div className="divide-y divide-[#DED8C9]/50 dark:divide-[#33433F]/60 font-mono tabular-nums">
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="text-[#53605E] dark:text-[#B7C1BC] font-sans">عدد السور</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.meccan.surahsCount}</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.medinan.surahsCount}</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="text-[#53605E] dark:text-[#B7C1BC] font-sans">عدد الآيات</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.meccan.totalVerses.toLocaleString()}</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.medinan.totalVerses.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="text-[#53605E] dark:text-[#B7C1BC] font-sans">عدد الكلمات</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.meccan.totalWords.toLocaleString()}</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.medinan.totalWords.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="text-[#53605E] dark:text-[#B7C1BC] font-sans">متوسط طول الآية</span>
                  <span className="text-center font-bold text-[#1A5C5C] dark:text-[#79A9A0]">{macroStats.meccan.avgAyahLengthWords.toFixed(1)} كلمة</span>
                  <span className="text-center font-bold text-[#B8935F]">{macroStats.medinan.avgAyahLengthWords.toFixed(1)} كلمة</span>
                </div>
                <div className="grid grid-cols-3 p-2 items-center">
                  <span className="text-[#53605E] dark:text-[#B7C1BC] font-sans">متوسط آيات السورة</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.meccan.avgVersesPerSurah.toFixed(0)} آية</span>
                  <span className="text-center font-bold text-[#0F1419] dark:text-[#F4F0E7]">{macroStats.medinan.avgVersesPerSurah.toFixed(0)} آية</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-[6px] border border-[#1A5C5C]/30 bg-[#F1ECE0] dark:bg-[#152322] text-[#53605E] dark:text-[#B7C1BC] text-xs leading-relaxed">
            <span className="font-bold text-[#1A5C5C] dark:text-[#79A9A0]">ملاحظة لغوية: </span>
            تتميز السور المكية بالإيجاز وقِصر الآيات وقوة الفواصل الإيقاعية، بينما تمتاز السور المدنية بالتفصيل والتشريع؛ لذا يبلغ متوسط طول الآية في المدني أكثر من ضعف المكي ({macroStats.medinan.avgAyahLengthWords.toFixed(1)} مقابل {macroStats.meccan.avgAyahLengthWords.toFixed(1)} كلمة).
          </div>
        </ResearchCard>

        {/* Section 2: Most Frequent Letters (7 cols) */}
        <ResearchCard padding="lg" className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DED8C9] dark:border-[#33433F] pb-2.5">
              <div>
                <h2 className="text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#B8935F]" />
                  <span>الحروف الأكثر تكراراً في القرآن الكريم</span>
                </h2>
                <p className="text-xs text-[#7B8885] dark:text-[#8B9B96] mt-0.5">
                  توزيع تواتر الحروف الـ 28 وترتيبها التنازلي ونسبتها من إجمالي {macroStats.totalQuranChars.toLocaleString()} حرفاً.
                </p>
              </div>

              {/* Limit switch (Top 10 vs 14 vs All 28) */}
              <div className="inline-flex items-center p-0.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F1ECE0] dark:bg-[#121C1B]">
                {[10, 14, 28].map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setTopLettersLimit(limit)}
                    className={`px-2 py-0.5 rounded-[4px] text-xs font-mono font-medium transition-colors cursor-pointer ${
                      topLettersLimit === limit
                        ? 'bg-[#1A5C5C] text-[#F4F0E7] font-bold'
                        : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419]'
                    }`}
                  >
                    أعلى {limit}
                  </button>
                ))}
              </div>
            </div>

            {/* Letters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {displayedLetters.map((l, idx) => {
                const maxPct = sortedLetters[0]?.percentage || 1;
                const relativeWidth = Math.min(100, Math.max(5, (l.percentage / maxPct) * 100));

                return (
                  <div
                    key={l.letter}
                    className="p-2.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] hover:border-[#1A5C5C]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-heading text-lg font-bold text-[#0F1419] dark:text-[#F4F0E7]">
                          {l.letter}
                        </span>
                        <span className="text-xs text-[#7B8885] dark:text-[#8B9B96] font-sans">
                          ({l.name})
                        </span>
                      </div>

                      <div className="text-left font-mono tabular-nums text-xs">
                        <span className="font-bold text-[#0F1419] dark:text-[#F4F0E7]">{l.count.toLocaleString()}</span>
                        <span className="text-[11px] text-[#7B8885] mr-1">({l.percentage}%)</span>
                      </div>
                    </div>

                    {/* Single-Hue Restrained Progress Bar */}
                    <div className="mt-2 w-full h-1.5 rounded-full bg-[#DED8C9]/40 dark:bg-[#33433F] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#1A5C5C] dark:bg-[#2B7470]"
                        style={{ width: `${relativeWidth}%` }}
                      />
                    </div>

                    {l.maxSurah && (
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#7B8885] dark:text-[#8B9B96] font-sans">
                        <span>أعلى تركيز:</span>
                        <span className="text-[#0F1419] dark:text-[#F4F0E7] font-medium">
                          {formatSurahName(l.maxSurah.name)} ({l.maxSurah.percentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {onNavigateTab && (
            <div className="pt-2 border-t border-[#DED8C9] dark:border-[#33433F] flex items-center justify-between text-xs">
              <span className="text-[#7B8885] dark:text-[#8B9B96]">
                الحروف الأربعة الأولى (ا، ل، ن، م) تستحوذ وحدها على أكثر من 40% من كامل النص القرآني.
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('letters-heatmap')}
                className="text-[#1A5C5C] dark:text-[#C5A16A] hover:underline font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>خريطة الحروف</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </ResearchCard>

      </div>

      {/* 4. Surah Extremes: Longest and Shortest Surahs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Top 5 Longest Surahs */}
        <ResearchCard padding="md" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#DED8C9] dark:border-[#33433F] pb-2">
            <TrendingUp className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
            <h3 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
              أطول 5 سور في القرآن الكريم (حسب الكلمات)
            </h3>
          </div>

          <div className="space-y-1.5">
            {longestSurahs.map((s, idx) => (
              <div 
                key={s.number}
                onClick={() => onSelectSurah ? onSelectSurah(s) : onOpenInReader?.(s.number)}
                className="p-2 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] hover:border-[#1A5C5C] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-heading text-[#0F1419] dark:text-[#F4F0E7]">
                      {formatSurahName(s.name)}
                    </div>
                    <div className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] font-sans">
                      {s.totalAyahs} آية · {s.isMeccan ? 'مكية' : 'مدنية'}
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono tabular-nums">
                  <div className="text-xs font-bold text-[#0F1419] dark:text-[#F4F0E7]">
                    {s.totalWords.toLocaleString()} كلمة
                  </div>
                  <div className="text-[10px] text-[#7B8885]">
                    {s.totalChars.toLocaleString()} حرفاً
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ResearchCard>

        {/* Top 5 Shortest Surahs */}
        <ResearchCard padding="md" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#DED8C9] dark:border-[#33433F] pb-2">
            <Sparkles className="w-4 h-4 text-[#B8935F]" />
            <h3 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
              أوجز 5 سور في القرآن الكريم (حسب الكلمات)
            </h3>
          </div>

          <div className="space-y-1.5">
            {shortestSurahs.map((s, idx) => (
              <div 
                key={s.number}
                onClick={() => onSelectSurah ? onSelectSurah(s) : onOpenInReader?.(s.number)}
                className="p-2 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] hover:border-[#1A5C5C] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-[4px] bg-[#B8935F]/15 text-[#8C6B37] dark:text-[#C5A16A] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold font-heading text-[#0F1419] dark:text-[#F4F0E7]">
                      {formatSurahName(s.name)}
                    </div>
                    <div className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] font-sans">
                      {s.totalAyahs} آيات · {s.isMeccan ? 'مكية' : 'مدنية'}
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono tabular-nums">
                  <div className="text-xs font-bold text-[#0F1419] dark:text-[#F4F0E7]">
                    {s.totalWords.toLocaleString()} كلمة
                  </div>
                  <div className="text-[10px] text-[#7B8885]">
                    {s.totalChars.toLocaleString()} حرفاً
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ResearchCard>

      </div>

      {/* 5. Quick Portals to Specialized Labs */}
      {onNavigateTab && (
        <ResearchCard padding="md" className="space-y-2.5">
          <div className="text-xs font-bold font-sans-arabic text-[#7B8885] dark:text-[#8B9B96] flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#79A9A0]" />
            <span>مختبرات التحليل والبحث المتخصص</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('lexical-richness')}
              className="p-3 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] hover:border-[#1A5C5C] text-right transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[#1A5C5C] dark:text-[#79A9A0] mb-1 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>اللسانيات وقانون زيف</span>
              </div>
              <p className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] line-clamp-2">
                قانون زيف اللغوي والإنتروبيا ومؤشر التنوع (TTR) والتناسب الذهبي.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('verse-endings')}
              className="p-3 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] hover:border-[#1A5C5C] text-right transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[#1A5C5C] dark:text-[#79A9A0] mb-1 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>فواصل الآيات والإيقاع</span>
              </div>
              <p className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] line-clamp-2">
                حروف الروي والتجانس الصوتي ومصفوفة نهايات الآيات.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('openings-families')}
              className="p-3 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] hover:border-[#1A5C5C] text-right transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[#1A5C5C] dark:text-[#79A9A0] mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>عوائل السور والفواتح</span>
              </div>
              <p className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] line-clamp-2">
                الحواميم السبع، المسبحات، الطواسين، وبصمات الحروف المقطعة.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('mushaf-diff-table')}
              className="p-3 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] hover:border-[#1A5C5C] text-right transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-[#B8935F] mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>مقارنة المصاحف (كوفي/مدني)</span>
              </div>
              <p className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] line-clamp-2">
                الفروق الإحصائية والعدود بين مصحف حفص عن عاصم ومصحف ورش.
              </p>
            </button>
          </div>
        </ResearchCard>
      )}

    </div>
  );
};

export default Dashboard;

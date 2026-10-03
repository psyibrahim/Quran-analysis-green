import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { SurahData, QuranAyah, LetterStatsData } from '../types';
import { MuqattaatSurahMeta } from '../utils/surahFamilies';
import { ARABIC_LETTERS, ARABIC_LETTER_NAMES, formatSurahName } from '../utils/arabic';
import { 
  Sparkles, 
  Layers, 
  Grid, 
  BarChart3, 
  TrendingUp, 
  BookOpen, 
  Search, 
  Sliders, 
  Award, 
  CheckCircle2, 
  Info,
  Maximize2,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface MuqattaatVerseHeatmapProps {
  surahData: SurahData;
  muqattaatMeta: MuqattaatSurahMeta;
  ayahs: QuranAyah[];
  letterStats?: LetterStatsData;
  onOpenInReader?: (surahNumber: number, ayahNumber?: number) => void;
}

export interface AyahLetterDistribution {
  ayahNumber: number;
  textUthmani: string;
  textSimple: string;
  totalLetters: number;
  openingLetterCounts: Record<string, number>;
  totalOpeningCount: number;
  densityPct: number;
  hasAllLetters: boolean;
  page?: number;
  juz?: number;
}

/**
 * Counts the 28 standard Arabic letters in an Ayah text
 */
function countAyahLetters(text: string): { counts: Record<string, number>; total: number } {
  const counts: Record<string, number> = {};
  let total = 0;
  if (!text) return { counts, total: 0 };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let letter: string | null = null;

    if (ch === 'ا' || ch === 'أ' || ch === 'إ' || ch === 'آ' || ch === 'ٱ' || ch === '\u0670' || ch === 'ء') {
      letter = 'ا';
    } else if (ch === 'ة' || ch === 'ه') {
      letter = 'ه';
    } else if (ch === 'ى' || ch === 'ي' || ch === 'ئ') {
      letter = 'ي';
    } else if (ch === 'ؤ' || ch === 'و') {
      letter = 'و';
    } else if (ARABIC_LETTERS.includes(ch)) {
      letter = ch;
    }

    if (letter) {
      counts[letter] = (counts[letter] || 0) + 1;
      total++;
    }
  }

  return { counts, total };
}

export const MuqattaatVerseHeatmap: React.FC<MuqattaatVerseHeatmapProps> = ({
  surahData,
  muqattaatMeta,
  ayahs,
  letterStats,
  onOpenInReader
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Selected letter filter: 'all' or one specific letter (e.g. 'ا', 'ل', 'م')
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  // Metric display: 'density' (%) or 'count' (raw occurrences)
  const [metricMode, setMetricMode] = useState<'density' | 'count'>('density');
  // Visual presentation tab: 'grid' | 'quarters' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'quarters' | 'list'>('grid');
  // Active hovered/clicked verse for the inspector drawer
  const [activeAyahNumber, setActiveAyahNumber] = useState<number | null>(null);
  // Search filter for verse list
  const [listSearch, setListSearch] = useState<string>('');
  // Sort order for verse list
  const [listSort, setListSort] = useState<'number' | 'density-desc' | 'density-asc' | 'count-desc'>('number');

  // 1. Overall Surah Letter Rankings for the 28 Arabic letters
  const surahLetterRankings = useMemo(() => {
    const plainCounts = surahData.letters?.plainCounts || {};
    const totalChars = surahData.totalChars || surahData.letters?.totalLettersPlain || 1;

    const allSorted = Object.entries(plainCounts)
      .map(([letter, count]) => ({
        letter,
        name: ARABIC_LETTER_NAMES[letter] || letter,
        count: count as number,
        percentage: Number((((count as number) / totalChars) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count);

    return allSorted.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [surahData]);

  // Combined stats for the opening letters in the entire surah
  const openingLettersOverview = useMemo(() => {
    const totalChars = surahData.totalChars || surahData.letters?.totalLettersPlain || 1;
    let totalOpeningLettersCount = 0;

    const openingDetails = muqattaatMeta.letters.map(letter => {
      const rankInfo = surahLetterRankings.find(r => r.letter === letter);
      const count = rankInfo ? rankInfo.count : 0;
      const rank = rankInfo ? rankInfo.rank : 28;
      const percentage = Number(((count / totalChars) * 100).toFixed(2));
      totalOpeningLettersCount += count;

      return {
        letter,
        name: ARABIC_LETTER_NAMES[letter] || letter,
        count,
        rank,
        percentage,
        isTop3: rank <= 3,
        isTop5: rank <= 5
      };
    });

    const combinedPercentage = Number(((totalOpeningLettersCount / totalChars) * 100).toFixed(2));
    const allInTop5 = openingDetails.every(d => d.isTop5);

    return {
      totalOpeningLettersCount,
      combinedPercentage,
      openingDetails,
      allInTop5,
      surahTotalChars: totalChars
    };
  }, [surahData, muqattaatMeta, surahLetterRankings]);

  // 2. Verse-by-verse calculations
  const versesData: AyahLetterDistribution[] = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];

    return ayahs.map(ayah => {
      const { counts, total } = countAyahLetters(ayah.textUthmani || ayah.textSimple || '');
      const openingCounts: Record<string, number> = {};
      let totalOpening = 0;
      let presentCount = 0;

      muqattaatMeta.letters.forEach(letter => {
        const c = counts[letter] || 0;
        openingCounts[letter] = c;
        totalOpening += c;
        if (c > 0) presentCount++;
      });

      const density = total > 0 ? Number(((totalOpening / total) * 100).toFixed(1)) : 0;
      const hasAll = presentCount === muqattaatMeta.letters.length;

      return {
        ayahNumber: ayah.numberInSurah,
        textUthmani: ayah.textUthmani,
        textSimple: ayah.textSimple,
        totalLetters: total,
        openingLetterCounts: openingCounts,
        totalOpeningCount: totalOpening,
        densityPct: density,
        hasAllLetters: hasAll,
        page: ayah.page,
        juz: ayah.juz
      };
    });
  }, [ayahs, muqattaatMeta]);

  // Active value extractor based on selected letter & metric
  const getValueForAyah = (item: AyahLetterDistribution): number => {
    if (selectedLetter === 'all') {
      return metricMode === 'density' ? item.densityPct : item.totalOpeningCount;
    }
    const count = item.openingLetterCounts[selectedLetter] || 0;
    if (metricMode === 'density') {
      return item.totalLetters > 0 ? Number(((count / item.totalLetters) * 100).toFixed(1)) : 0;
    }
    return count;
  };

  // 3. Peak and summary statistics across verses
  const verseMetricsSummary = useMemo(() => {
    if (versesData.length === 0) {
      return {
        peakAyah: null,
        minAyah: null,
        avgDensity: 0,
        avgCount: 0,
        versesWithAllLetters: 0,
        versesWithAllLettersPct: 0,
        versesWithAnyLetters: 0,
        maxCalculatedValue: 1
      };
    }

    let peakAyah = versesData[0];
    let minAyah = versesData[0];
    let maxVal = -1;
    let minVal = Infinity;
    let sumDensity = 0;
    let sumCount = 0;
    let withAll = 0;
    let withAny = 0;

    versesData.forEach(v => {
      const val = getValueForAyah(v);
      if (val > maxVal) {
        maxVal = val;
        peakAyah = v;
      }
      if (val < minVal) {
        minVal = val;
        minAyah = v;
      }
      sumDensity += v.densityPct;
      sumCount += v.totalOpeningCount;
      if (v.hasAllLetters) withAll++;
      if (v.totalOpeningCount > 0) withAny++;
    });

    const avgDensity = Number((sumDensity / versesData.length).toFixed(1));
    const avgCount = Number((sumCount / versesData.length).toFixed(1));
    const withAllPct = Number(((withAll / versesData.length) * 100).toFixed(1));

    return {
      peakAyah,
      minAyah,
      avgDensity,
      avgCount,
      versesWithAllLetters: withAll,
      versesWithAllLettersPct: withAllPct,
      versesWithAnyLetters: withAny,
      maxCalculatedValue: maxVal > 0 ? maxVal : 1
    };
  }, [versesData, selectedLetter, metricMode]);

  // 4. Surah Quarters breakdown (أرباع السورة الأربعة لبيان التوزيع الهيكلي)
  const quartersDistribution = useMemo(() => {
    if (versesData.length === 0) return [];
    const n = versesData.length;
    const quarterSize = Math.ceil(n / 4);

    const quarters = [
      { id: 1, name: 'الربع الأول (البداية والمطلع)', from: 1, to: Math.min(quarterSize, n) },
      { id: 2, name: 'الربع الثاني (تنامي السياق)', from: quarterSize + 1, to: Math.min(quarterSize * 2, n) },
      { id: 3, name: 'الربع الثالث (عمق السورة)', from: quarterSize * 2 + 1, to: Math.min(quarterSize * 3, n) },
      { id: 4, name: 'الربع الرابع (الخاتمة والفواصل)', from: quarterSize * 3 + 1, to: n }
    ];

    return quarters.map(q => {
      const slice = versesData.slice(q.from - 1, q.to);
      const totalCharsInQ = slice.reduce((acc, v) => acc + v.totalLetters, 0);
      const totalOpeningInQ = slice.reduce((acc, v) => {
        if (selectedLetter === 'all') return acc + v.totalOpeningCount;
        return acc + (v.openingLetterCounts[selectedLetter] || 0);
      }, 0);

      const density = totalCharsInQ > 0 ? Number(((totalOpeningInQ / totalCharsInQ) * 100).toFixed(2)) : 0;
      const avgPerVerse = slice.length > 0 ? Number((totalOpeningInQ / slice.length).toFixed(1)) : 0;

      return {
        ...q,
        verseCount: slice.length,
        totalCharsInQ,
        totalOpeningInQ,
        density,
        avgPerVerse
      };
    });
  }, [versesData, selectedLetter]);

  // Selected ayah for inspector (defaults to peak ayah if none explicitly clicked)
  const inspectedAyah = useMemo(() => {
    if (activeAyahNumber !== null) {
      return versesData.find(v => v.ayahNumber === activeAyahNumber) || versesData[0];
    }
    return verseMetricsSummary.peakAyah || versesData[0];
  }, [versesData, activeAyahNumber, verseMetricsSummary]);

  // Filtered & sorted verse list
  const filteredVerseList = useMemo(() => {
    let list = [...versesData];
    const q = listSearch.trim();
    if (q) {
      list = list.filter(v => 
        v.ayahNumber.toString() === q || 
        (v.textUthmani && v.textUthmani.includes(q)) ||
        (v.textSimple && v.textSimple.includes(q))
      );
    }

    if (listSort === 'number') {
      list.sort((a, b) => a.ayahNumber - b.ayahNumber);
    } else if (listSort === 'density-desc') {
      list.sort((a, b) => getValueForAyah(b) - getValueForAyah(a));
    } else if (listSort === 'density-asc') {
      list.sort((a, b) => getValueForAyah(a) - getValueForAyah(b));
    } else if (listSort === 'count-desc') {
      list.sort((a, b) => b.totalOpeningCount - a.totalOpeningCount);
    }

    return list;
  }, [versesData, listSearch, listSort, selectedLetter, metricMode]);

  // Heatmap cell color generator
  const getCellBgClass = (val: number, maxVal: number) => {
    if (val === 0) {
      return isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800/40 text-ink-600 dark:text-ink-500 border-[var(--color-border)] dark:border-ink-800' : 'bg-[#F1ECE0] text-[#53605E] border-[#DED8C9]';
    }
    const ratio = Math.min(1, val / (maxVal || 1));

    if (ratio < 0.25) {
      return isDark
        ? 'bg-[#10302E] text-[#B9D3CE] border-[#1A5C5C]/60'
        : 'bg-[#EDF5F4] text-[#164B4B] border-[#B9D3CE]';
    } else if (ratio < 0.5) {
      return isDark
        ? 'bg-[#164B4B] text-[#DCE9E5] border-[#2B7470]'
        : 'bg-[#DCE9E5] text-[#134747] border-[#79A9A0]';
    } else if (ratio < 0.75) {
      return isDark
        ? 'bg-[#2B7470] text-white font-bold border-[#4F8D88] shadow-xs'
        : 'bg-[#79A9A0] text-[#0F3838] font-bold border-[#4F8D88] shadow-xs';
    } else {
      return isDark
        ? 'bg-[#358A85] text-white font-extrabold border-[#79A9A0] shadow-sm ring-1 ring-[#79A9A0]/40'
        : 'bg-[#1A5C5C] text-white font-extrabold border-[#134747] shadow-sm';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      'bg-[var(--color-card)] border-[var(--color-border)] shadow-sm'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)] dark:border-ink-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1A5C5C] to-[#2B7470] text-white shadow-md shadow-black/10 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold">
                إحصاءات وخريطة توزع حروف ({muqattaatMeta.openingText}) في آيات {formatSurahName(surahData.name)}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary-soft)] dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-mono font-bold border border-[var(--color-primary)]/40 dark:border-teal-500/20">
                {surahData.totalAyahs} آية
              </span>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-400 mt-1 max-w-2xl leading-relaxed">
              تحليل توزيعي وكثافي دقيق لحروف الفاتحة المقطعة عبر سائر آيات السورة، لقياس مدى هيمنتها ومواقع قممها ونقاط تمركزها الصوتي واللفظي.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[var(--color-surface-secondary)] dark:bg-ink-800/60 p-1 rounded-xl border border-[var(--color-border)] dark:border-ink-700/60 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-black/10'
                : 'text-ink-600 dark:text-ink-400 hover:text-[var(--color-text-primary)] dark:hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            خريطة الآيات
          </button>
          <button
            onClick={() => setViewMode('quarters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'quarters'
                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-black/10'
                : 'text-ink-600 dark:text-ink-400 hover:text-[var(--color-text-primary)] dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            أرباع السورة
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-black/10'
                : 'text-ink-600 dark:text-ink-400 hover:text-[var(--color-text-primary)] dark:hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            جدول الآيات
          </button>
        </div>
      </div>

      {/* 1. Macro KPIs Cards: Full Surah Opening Letter Statistics */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Opening Occurrences */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800/40 border-[var(--color-border)] dark:border-ink-800' : 'bg-ink-50 border-ink-200'}`}>
          <div className="text-[11px] text-ink-600 dark:text-ink-400 flex items-center justify-between">
            <span>مجموع حروف الفاتحة:</span>
            <Sparkles className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-teal-700 dark:text-teal-400">
              {openingLettersOverview.totalOpeningLettersCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-ink-600 dark:text-ink-400">حرفاً</span>
          </div>
          <div className="mt-1 text-[10px] text-ink-600 dark:text-ink-500">
            من إجمالي {openingLettersOverview.surahTotalChars.toLocaleString()} حرف بالسورة
          </div>
        </div>

        {/* Combined Density % */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800/40 border-[var(--color-border)] dark:border-ink-800' : 'bg-ink-50 border-ink-200'}`}>
          <div className="text-[11px] text-ink-600 dark:text-ink-400 flex items-center justify-between">
            <span>كثافة حروف الفاتحة بالسورة:</span>
            <Award className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {openingLettersOverview.combinedPercentage}%
            </span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-500/90 font-medium truncate">
            {openingLettersOverview.combinedPercentage >= 35 ? 'كثافة مهيمنة جداً' : 'كثافة متوازنة'}
          </div>
        </div>

        {/* Verses with ALL Opening Letters */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800/40 border-[var(--color-border)] dark:border-ink-800' : 'bg-ink-50 border-ink-200'}`}>
          <div className="text-[11px] text-ink-600 dark:text-ink-400 flex items-center justify-between">
            <span>الآيات الجامعة لكافة الحروف:</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-teal-700 dark:text-teal-400">
              {verseMetricsSummary.versesWithAllLetters}
            </span>
            <span className="text-[11px] text-ink-600 dark:text-ink-400">آية</span>
          </div>
          <div className="mt-1 text-[10px] text-ink-600 dark:text-ink-500">
            تمثل {verseMetricsSummary.versesWithAllLettersPct}% من آيات السورة
          </div>
        </div>

        {/* Peak Density Verse */}
        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800/40 border-[var(--color-border)] dark:border-ink-800' : 'bg-ink-50 border-ink-200'}`}>
          <div className="text-[11px] text-ink-600 dark:text-ink-400 flex items-center justify-between">
            <span>ذروة الكثافة في آية:</span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-teal-700 dark:text-teal-400">
              {verseMetricsSummary.peakAyah ? `${verseMetricsSummary.peakAyah.densityPct}%` : '—'}
            </span>
            <span className="text-[11px] text-ink-600 dark:text-ink-400">
              (آية {verseMetricsSummary.peakAyah?.ayahNumber})
            </span>
          </div>
          <div className="mt-1 text-[10px] text-ink-600 dark:text-ink-500 truncate">
            متوسط الكثافة: {verseMetricsSummary.avgDensity}% / آية
          </div>
        </div>
      </div>

      {/* 2. Opening Letters Ranking Badges */}
      <div className="mt-3 p-3 rounded-xl bg-[var(--color-surface-secondary)] dark:bg-ink-800/30 border border-[var(--color-border)] dark:border-ink-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">ترتيب حروف الفاتحة بين حروف المعجم الـ 28 في السورة:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {openingLettersOverview.openingDetails.map(d => (
            <div 
              key={d.letter}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                d.isTop3 
                  ? 'bg-[var(--color-primary-soft)] dark:bg-teal-500/15 border-[var(--color-primary)]/40 dark:border-teal-500/40 text-teal-800 dark:text-teal-300 font-bold' 
                  : d.isTop5 
                  ? 'bg-[var(--color-primary-soft)] dark:bg-teal-500/15 border-[var(--color-primary)]/40 dark:border-teal-500/40 text-teal-800 dark:text-teal-300' 
                  : 'bg-[var(--color-surface-secondary)] dark:bg-ink-800 border-[var(--color-border)] dark:border-ink-700 text-ink-700 dark:text-ink-300'
              }`}
            >
              <span className="w-5 h-5 rounded-md bg-[var(--color-surface-secondary)] dark:bg-ink-800 text-center font-mono font-bold leading-5">
                {d.letter}
              </span>
              <span>{d.name}</span>
              <span className="text-[10px] font-mono px-1 rounded bg-black/30">
                الرتبة #{d.rank}
              </span>
              <span className="text-[10px] text-ink-600 dark:text-ink-400">({d.count} مرة)</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Heatmap Controls Toolbar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-secondary)] dark:bg-ink-800/40 border border-[var(--color-border)] dark:border-ink-800">
        {/* Letter Selector Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-ink-600 dark:text-ink-400 ml-1">تحديد الحرف:</span>
          <button
            onClick={() => setSelectedLetter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedLetter === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-sm shadow-black/10'
                : 'bg-[var(--color-surface-secondary)] dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:text-[var(--color-text-primary)] dark:hover:text-white'
            }`}
          >
            كافة حروف الفاتحة ({muqattaatMeta.openingText})
          </button>
          {muqattaatMeta.letters.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                selectedLetter === letter
                  ? 'bg-[var(--color-primary)] text-white shadow-sm shadow-black/10'
                  : 'bg-[var(--color-surface-secondary)] dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:text-[var(--color-text-primary)] dark:hover:text-white'
              }`}
            >
              <span>حرف {letter}</span>
              <span className="text-[10px] opacity-75">({ARABIC_LETTER_NAMES[letter] || letter})</span>
            </button>
          ))}
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-600 dark:text-ink-400">المقياس:</span>
          <div className="flex items-center bg-[var(--color-surface-secondary)] dark:bg-ink-800 rounded-lg p-0.5 border border-[var(--color-border)] dark:border-ink-700">
            <button
              onClick={() => setMetricMode('density')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${
                metricMode === 'density' ? 'bg-[var(--color-primary)] text-white shadow-xs' : 'text-ink-600 dark:text-ink-400 hover:text-[var(--color-text-primary)] dark:hover:text-white'
              }`}
            >
              نسبة الكثافة (%)
            </button>
            <button
              onClick={() => setMetricMode('count')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${
                metricMode === 'count' ? 'bg-[var(--color-primary)] text-white shadow-xs' : 'text-ink-600 dark:text-ink-400 hover:text-[var(--color-text-primary)] dark:hover:text-white'
              }`}
            >
              التكرار المطلق (عدد)
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA ACCORDING TO VIEW MODE */}

      {/* VIEW 1: VERSE HEATMAP GRID */}
      {viewMode === 'grid' && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-ink-600 dark:text-ink-400">
            <div>
              <span>انقر أو مرر الفأرة فوق أي آية للاطلاع على إحصائياتها الدقيقة ونصها الشريف:</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>تدرج الكثافة:</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-secondary)] dark:bg-ink-800 text-ink-600 dark:text-ink-500 text-[10px]">صفر</span>
              <span className="w-3.5 h-3.5 rounded bg-[#EDF5F4] dark:bg-[#10302E] border border-[#B9D3CE] dark:border-[#1A5C5C]"></span>
              <span className="w-3.5 h-3.5 rounded bg-[#DCE9E5] dark:bg-[#164B4B] border border-[#79A9A0] dark:border-[#2B7470]"></span>
              <span className="w-3.5 h-3.5 rounded bg-[#79A9A0] dark:bg-[#2B7470] border border-[#4F8D88]"></span>
              <span className="w-3.5 h-3.5 rounded bg-[#1A5C5C] dark:bg-[#358A85] border border-[#134747]"></span>
              <span className="font-bold text-teal-700 dark:text-teal-400">الأعلى</span>
            </div>
          </div>

          {/* Heatmap Grid Matrix */}
          <div className="p-3 rounded-2xl bg-ink-950/60 border border-[var(--color-border)] dark:border-ink-800 max-h-[360px] overflow-y-auto">
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5">
              {versesData.map(v => {
                const val = getValueForAyah(v);
                const isInspected = inspectedAyah?.ayahNumber === v.ayahNumber;
                const cellBg = getCellBgClass(val, verseMetricsSummary.maxCalculatedValue);

                return (
                  <button
                    key={v.ayahNumber}
                    onClick={() => setActiveAyahNumber(v.ayahNumber)}
                    onMouseEnter={() => setActiveAyahNumber(v.ayahNumber)}
                    className={`h-9 rounded-lg border text-center font-mono text-[11px] transition-all flex flex-col items-center justify-center relative group ${cellBg} ${
                      isInspected ? 'ring-2 ring-[#52C592] scale-105 z-10' : 'hover:scale-105'
                    }`}
                    title={`آية ${v.ayahNumber}: ${val}${metricMode === 'density' ? '%' : ''}`}
                  >
                    <span className="text-[10px] leading-none opacity-80">{v.ayahNumber}</span>
                    <span className="text-[9px] font-bold leading-none mt-0.5">
                      {metricMode === 'density' ? `${Math.round(val)}%` : val}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inspected Ayah Detailed Card */}
          {inspectedAyah && (
            <div className={`p-4 rounded-xl border transition-all ${
              isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800/60 border-[var(--color-border)] dark:border-ink-700' : 'bg-[#F1F7F5] border-[#B9D3CE]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-border)] dark:border-ink-700/50">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 font-mono font-bold text-xs flex items-center justify-center border border-[var(--color-primary)]/40 dark:border-teal-500/30">
                    {inspectedAyah.ayahNumber}
                  </span>
                  <span className="text-sm font-bold text-ink-800 dark:text-ink-200">
                    تفاصيل الآية {inspectedAyah.ayahNumber} من {formatSurahName(surahData.name)}
                  </span>
                  {inspectedAyah.page && (
                    <span className="text-xs text-ink-600 dark:text-ink-400">
                      (صفحة {inspectedAyah.page} - جزء {inspectedAyah.juz})
                    </span>
                  )}
                  {inspectedAyah.hasAllLetters && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-primary-soft)] dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-[var(--color-primary)]/40 dark:border-teal-500/30">
                      جامعة لكافة حروف الفاتحة
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-700 dark:text-ink-300">
                    كثافة حروف الفاتحة:{' '}
                    <span className="font-bold text-teal-700 dark:text-teal-400 font-mono text-sm">
                      {inspectedAyah.densityPct}%
                    </span>
                  </span>
                  {onOpenInReader && (
                    <button
                      onClick={() => onOpenInReader(surahData.number, inspectedAyah.ayahNumber)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--color-surface-secondary)] dark:bg-ink-700 hover:bg-[var(--color-primary)] hover:text-white text-ink-700 dark:text-ink-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      عرض في المصحف
                    </button>
                  )}
                </div>
              </div>

              {/* Ayah Text Display */}
              <div className="mt-3 py-2 px-3 rounded-lg bg-[var(--color-surface)] dark:bg-black/20 border border-[var(--color-border)] font-quran text-lg sm:text-xl text-[var(--color-text-primary)] leading-relaxed text-right">
                {inspectedAyah.textUthmani}
              </div>

              {/* Breakdown of letters in this ayah */}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-ink-600 dark:text-ink-400">تكرار حروف الفاتحة في الآية ({inspectedAyah.totalLetters} حرفاً إجمالياً):</span>
                {muqattaatMeta.letters.map(letter => {
                  const cnt = inspectedAyah.openingLetterCounts[letter] || 0;
                  return (
                    <span 
                      key={letter}
                      className={`px-2 py-0.5 rounded-md font-mono text-xs flex items-center gap-1 ${
                        cnt > 0 
                          ? 'bg-[var(--color-primary-soft)] dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-[var(--color-primary)]/40 dark:border-teal-500/30 font-bold' 
                          : 'bg-[var(--color-surface-secondary)] dark:bg-ink-800 text-ink-600 dark:text-ink-500'
                      }`}
                    >
                      <span>حرف {letter}:</span>
                      <span>{cnt}</span>
                    </span>
                  );
                })}
                <span className="mr-auto font-mono text-xs text-ink-700 dark:text-ink-300">
                  المجموع: <span className="text-teal-700 dark:text-teal-400 font-bold">{inspectedAyah.totalOpeningCount}</span> حرفاً
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: QUARTERS STRUCTURAL DISTRIBUTION */}
      {viewMode === 'quarters' && (
        <div className="mt-4 space-y-4">
          <div className="text-xs text-ink-600 dark:text-ink-400">
            توزيع حروف الفاتحة المقطعة على الأرباع الأربعة المتتالية للسورة (من المطلع وحتى الختام)، لرصد تطور الكثافة والنسيج الصوتي:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {quartersDistribution.map(q => (
              <div 
                key={q.id}
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800/40 border-[var(--color-border)] dark:border-ink-800' : 'bg-ink-50 border-ink-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)] dark:border-ink-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[var(--color-primary-soft)] dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 font-mono text-xs font-bold flex items-center justify-center">
                      Q{q.id}
                    </span>
                    <span className="text-xs font-bold text-ink-800 dark:text-ink-200">{q.name}</span>
                  </div>
                  <span className="text-[11px] text-ink-600 dark:text-ink-400 font-mono">
                    الآيات {q.from} - {q.to} ({q.verseCount} آية)
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-ink-600 dark:text-ink-400 text-[11px]">مجموع حروف الفاتحة:</div>
                    <div className="text-sm font-bold font-mono text-teal-700 dark:text-teal-400 mt-0.5">
                      {q.totalOpeningInQ.toLocaleString()} حرفاً
                    </div>
                  </div>
                  <div>
                    <div className="text-ink-600 dark:text-ink-400 text-[11px]">نسبة الكثافة:</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {q.density}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full h-2 rounded-full bg-[var(--color-surface-secondary)] dark:bg-ink-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#1A5C5C] to-[#2B7470]"
                    style={{ width: `${Math.min(100, q.density * 2)}%` }}
                  ></div>
                </div>

                <div className="mt-2 text-[10px] text-ink-600 dark:text-ink-400 flex justify-between">
                  <span>معدل الحروف لكل آية:</span>
                  <span className="font-mono font-bold text-ink-700 dark:text-ink-300">{q.avgPerVerse} حرف/آية</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: DETAILED VERSE TABLE */}
      {viewMode === 'list' && (
        <div className="mt-4 space-y-3">
          {/* List Search & Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="ابحث برقم الآية أو كلماتها..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className={`w-full px-3 py-1.5 pl-8 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800 border-[var(--color-border)] dark:border-ink-700 text-white' : 'bg-white border-ink-200 text-ink-800'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-ink-600 dark:text-ink-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-600 dark:text-ink-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                ترتيب حسب:
              </span>
              <select
                value={listSort}
                onChange={(e) => setListSort(e.target.value as any)}
                className={`px-2.5 py-1 rounded-lg text-xs border outline-none ${
                  isDark ? 'bg-[var(--color-surface-secondary)] dark:bg-ink-800 border-[var(--color-border)] dark:border-ink-700 text-ink-800 dark:text-ink-200' : 'bg-white border-ink-200 text-ink-800'
                }`}
              >
                <option value="number">رقم الآية (تسلسلي)</option>
                <option value="density-desc">الأعلى كثافة (%)</option>
                <option value="density-asc">الأقل كثافة (%)</option>
                <option value="count-desc">الأعلى تكراراً (حروف)</option>
              </select>
            </div>
          </div>

          {/* Verses Table */}
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-[var(--color-border)] dark:border-ink-800 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="sticky top-0 bg-[var(--color-surface-secondary)] dark:bg-ink-900 border-b border-[var(--color-border)] dark:border-ink-800 text-ink-600 dark:text-ink-400 text-[11px] z-10">
                <tr>
                  <th className="py-2 px-3">رقم الآية</th>
                  <th className="py-2 px-3">نص الآية الشريف</th>
                  <th className="py-2 px-3">إجمالي الحروف</th>
                  <th className="py-2 px-3">تكرار حروف الفاتحة</th>
                  <th className="py-2 px-3">نسبة الكثافة</th>
                  <th className="py-2 px-3 text-center">المصحف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/40 font-mono">
                {filteredVerseList.map(v => {
                  const val = getValueForAyah(v);
                  return (
                    <tr 
                      key={v.ayahNumber}
                      onClick={() => setActiveAyahNumber(v.ayahNumber)}
                      className={`hover:bg-ink-800/50 transition-colors cursor-pointer ${
                        inspectedAyah?.ayahNumber === v.ayahNumber ? 'bg-[var(--color-primary-soft)] dark:bg-teal-500/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-teal-700 dark:text-teal-400">{v.ayahNumber}</td>
                      <td className="py-2.5 px-3 font-serif text-ink-800 dark:text-ink-200 text-sm max-w-md truncate">
                        {v.textUthmani}
                      </td>
                      <td className="py-2.5 px-3 text-ink-600 dark:text-ink-400">{v.totalLetters}</td>
                      <td className="py-2.5 px-3 text-ink-700 dark:text-ink-300 font-bold">{v.totalOpeningCount}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-[var(--color-surface-secondary)] dark:bg-ink-800 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-teal-500"
                              style={{ width: `${Math.min(100, v.densityPct * 2)}%` }}
                            ></div>
                          </div>
                          <span className="text-teal-700 dark:text-teal-400 font-bold">{v.densityPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {onOpenInReader && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInReader(surahData.number, v.ayahNumber);
                            }}
                            className="p-1 rounded bg-[var(--color-surface-secondary)] dark:bg-ink-800 hover:bg-[var(--color-primary)] hover:text-white text-ink-600 dark:text-ink-400 transition-all"
                            title="فتح الآية في المصحف"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

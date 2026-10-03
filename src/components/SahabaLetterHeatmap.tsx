// src/components/SahabaLetterHeatmap.tsx
// خريطة حرارية تفاعلية (Interactive Heatmap) باستخدام Recharts
// توضح كثافة الكلمات وتوزيع الحروف في العناقيد السبعة بناءً على إحصاءات الحروف لتحزيب الصحابة

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { 
  Flame, 
  BarChart3, 
  Activity, 
  Grid,
  Info
} from 'lucide-react';
import { SurahData, LetterStatsData } from '../types';
import { SAHABA_CLUSTERS } from '../data/sahabaClusters';
import { ARABIC_LETTERS } from '../utils/arabic';
import { useTheme } from '../context/ThemeContext';

interface SahabaLetterHeatmapProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
}

// 28 Arabic letters in standard Hijai order
const ALL_LETTERS = ARABIC_LETTERS;

// Predefined letter groups for targeted analysis
const HEATMAP_LETTER_GROUPS: { id: string; label: string; letters: string[] }[] = [
  { id: 'all28', label: 'جميع الحروف الـ 28 كاملة', letters: ALL_LETTERS },
  { id: 'top6', label: 'الستة الكبرى (ا، ل، ن، م، و، ي)', letters: ['ا', 'ل', 'ن', 'م', 'و', 'ي'] },
  { id: 'throat', label: 'حروف الحلق (ء، هـ، ع، ح، غ، خ)', letters: ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'] },
  { id: 'lip', label: 'الحروف الشفوية (ب، م، و، ف)', letters: ['ب', 'م', 'و', 'ف'] },
  { id: 'qalqala', label: 'حروف القلقلة (ق، ط، ب، ج، د)', letters: ['ق', 'ط', 'ب', 'ج', 'د'] },
  { id: 'whispered', label: 'حروف الهمس (ف، ح، ث، هـ، ش، خ، ص، س، ك، ت)', letters: ['ف', 'ح', 'ث', 'ه', 'ش', 'خ', 'ص', 'س', 'ك', 'ت'] },
  { id: 'elevated', label: 'حروف الاستعلاء (خ، ص، ض، غ، ط، ق، ظ)', letters: ['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ'] }
];

// Groups exclusively for BarChart (strictly subsets to avoid squished/unreadable 28 bars per cluster)
const BAR_CHART_LETTER_GROUPS = HEATMAP_LETTER_GROUPS.filter(g => g.id !== 'all28');

type AlphabetSortOrder = 'hijai' | 'abjadi' | 'frequency_desc' | 'frequency_asc' | 'phonetic';

export const SahabaLetterHeatmap: React.FC<SahabaLetterHeatmapProps> = ({
  surahs,
  letterStats,
  onSelectSurah
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // State
  const [selectedHeatmapGroup, setSelectedHeatmapGroup] = useState<string>('all28');
  const [selectedBarGroup, setSelectedBarGroup] = useState<string>('top6');
  const [alphabetSortOrder, setAlphabetSortOrder] = useState<AlphabetSortOrder>('hijai');
  const [activeLetter, setActiveLetter] = useState<string>('ق');
  const [metricMode, setMetricMode] = useState<'density' | 'percentage' | 'rawCount'>('density');
  const [viewType, setViewType] = useState<'grid-heatmap' | 'cluster-bars' | 'letter-profile'>('grid-heatmap');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [sortLetter, setSortLetter] = useState<string | null>(null);

  // Compute sorted 28 letters according to user-selected alphabet order
  const orderedAllLetters = useMemo(() => {
    const base = [...ALL_LETTERS];
    if (alphabetSortOrder === 'hijai') return base;
    if (alphabetSortOrder === 'abjadi') {
      const abjadiOrder = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
      return [...base].sort((a, b) => {
        const iA = abjadiOrder.indexOf(a);
        const iB = abjadiOrder.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
      });
    }
    if (alphabetSortOrder === 'phonetic') {
      const phoneticOrder = ['ع', 'ح', 'ه', 'خ', 'غ', 'ق', 'ك', 'ج', 'ش', 'ي', 'ض', 'ص', 'س', 'ز', 'ط', 'د', 'ت', 'ظ', 'ذ', 'ث', 'ر', 'ل', 'ن', 'ف', 'ب', 'م', 'و', 'ا'];
      return [...base].sort((a, b) => {
        const iA = phoneticOrder.indexOf(a);
        const iB = phoneticOrder.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
      });
    }
    if (alphabetSortOrder === 'frequency_desc') {
      return [...base].sort((a, b) => {
        const cA = letterStats.globalStats?.[a]?.totalOccurrences || 0;
        const cB = letterStats.globalStats?.[b]?.totalOccurrences || 0;
        return cB - cA;
      });
    }
    if (alphabetSortOrder === 'frequency_asc') {
      return [...base].sort((a, b) => {
        const cA = letterStats.globalStats?.[a]?.totalOccurrences || 0;
        const cB = letterStats.globalStats?.[b]?.totalOccurrences || 0;
        return cA - cB;
      });
    }
    return base;
  }, [letterStats.globalStats, alphabetSortOrder]);

  // Active letter set for Heatmap
  const activeHeatmapLetters = useMemo(() => {
    if (selectedHeatmapGroup === 'all28') {
      return orderedAllLetters;
    }
    const group = HEATMAP_LETTER_GROUPS.find(g => g.id === selectedHeatmapGroup);
    if (!group) return orderedAllLetters;
    return orderedAllLetters.filter(l => group.letters.includes(l));
  }, [selectedHeatmapGroup, orderedAllLetters]);

  // Active letter set for Bar Chart (strictly subsets)
  const activeBarLetters = useMemo(() => {
    const group = BAR_CHART_LETTER_GROUPS.find(g => g.id === selectedBarGroup);
    return group ? group.letters : BAR_CHART_LETTER_GROUPS[0].letters;
  }, [selectedBarGroup]);

  // Precompute comprehensive cluster data
  const clustersData = useMemo(() => {
    return SAHABA_CLUSTERS.map(cluster => {
      const clusterSurahs = surahs.filter(s => cluster.surahNumbers.includes(s.number));
      const totalWords = clusterSurahs.reduce((acc, s) => acc + (s.totalWords || 0), 0);
      const totalAyahs = clusterSurahs.reduce((acc, s) => acc + (s.totalAyahs || 0), 0);
      const totalChars = clusterSurahs.reduce((acc, s) => acc + (s.totalChars || 0), 0);

      // Letter sums for cluster
      const letterCounts: Record<string, number> = {};
      ALL_LETTERS.forEach(l => {
        letterCounts[l] = clusterSurahs.reduce((acc, s) => acc + (s.letters?.plainCounts?.[l] || 0), 0);
      });

      // Letter densities per 100 words (words-normalized density)
      const letterDensities: Record<string, number> = {};
      const letterPercentages: Record<string, number> = {};

      ALL_LETTERS.forEach(l => {
        const count = letterCounts[l] || 0;
        letterDensities[l] = totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(1)) : 0;
        letterPercentages[l] = totalChars > 0 ? Number(((count / totalChars) * 100).toFixed(2)) : 0;
      });

      return {
        ...cluster,
        clusterSurahs,
        totalWords,
        totalAyahs,
        totalChars,
        letterCounts,
        letterDensities,
        letterPercentages,
        wordsPerAyah: totalAyahs > 0 ? Number((totalWords / totalAyahs).toFixed(2)) : 0
      };
    });
  }, [surahs]);

  // Sorted clusters list (if user clicks on a letter header to sort clusters by that letter)
  const sortedClustersData = useMemo(() => {
    if (!sortLetter) return clustersData;
    return [...clustersData].sort((a, b) => {
      const valA = metricMode === 'density' 
        ? a.letterDensities[sortLetter] || 0 
        : metricMode === 'percentage' 
        ? a.letterPercentages[sortLetter] || 0 
        : a.letterCounts[sortLetter] || 0;
      const valB = metricMode === 'density' 
        ? b.letterDensities[sortLetter] || 0 
        : metricMode === 'percentage' 
        ? b.letterPercentages[sortLetter] || 0 
        : b.letterCounts[sortLetter] || 0;
      return valB - valA;
    });
  }, [clustersData, sortLetter, metricMode]);

  // Overall min and max across all clusters and letters for color scaling
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    clustersData.forEach(c => {
      activeHeatmapLetters.forEach(l => {
        const val = metricMode === 'density' 
          ? c.letterDensities[l] 
          : metricMode === 'percentage' 
          ? c.letterPercentages[l] 
          : c.letterCounts[l];

        if (val < min) min = val;
        if (val > max) max = val;
      });
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 1;
    return { minVal: min, maxVal: max };
  }, [clustersData, activeHeatmapLetters, metricMode]);

  // Heatmap color interpolation function based on value (similar to LettersLab palette)
  const getCellColor = (value: number) => {
    if (maxVal === minVal) return isLight ? 'rgba(26, 92, 92, 0.2)' : 'rgba(79, 183, 178, 0.2)';
    const ratio = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));

    if (isLight) {
      if (ratio < 0.15) return 'rgba(232, 241, 239, 0.9)'; // ramp
      if (ratio < 0.35) return 'rgba(207, 226, 222, 0.95)'; // ramp
      if (ratio < 0.55) return 'rgba(168, 201, 194, 0.95)'; // ramp
      if (ratio < 0.75) return 'rgba(121, 169, 160, 0.95)'; // ramp
      if (ratio < 0.9) return 'rgba(79, 183, 178, 0.95)'; // ramp
      return 'rgba(26, 92, 92, 0.95)'; // ramp
    } else {
      if (ratio < 0.15) return 'rgba(15, 56, 56, 0.25)'; // ramp
      if (ratio < 0.35) return 'rgba(22, 75, 75, 0.45)'; // ramp
      if (ratio < 0.55) return 'rgba(26, 92, 92, 0.65)'; // ramp
      if (ratio < 0.75) return 'rgba(47, 168, 157, 0.85)'; // ramp
      if (ratio < 0.9) return 'rgba(79, 183, 178, 0.95)'; // ramp
      return 'rgba(245, 158, 11, 0.95)'; // amber-500 hot peak
    }
  };

  // Recharts Bar chart data for cluster comparisons (using activeBarLetters)
  const clusterBarChartData = useMemo(() => {
    return clustersData.map(c => {
      const entry: Record<string, any> = {
        name: c.name,
        traditional: c.traditionalLabel,
        totalWords: c.totalWords,
        clusterId: c.id
      };
      activeBarLetters.forEach(l => {
        entry[`letter_${l}`] = metricMode === 'density' 
          ? c.letterDensities[l] 
          : metricMode === 'percentage' 
          ? c.letterPercentages[l] 
          : c.letterCounts[l];
      });
      return entry;
    });
  }, [clustersData, activeBarLetters, metricMode]);

  // Single letter trend data across all 7 clusters
  const singleLetterChartData = useMemo(() => {
    return clustersData.map(c => ({
      name: c.name,
      traditional: c.traditionalLabel,
      color: c.color,
      value: metricMode === 'density'
        ? c.letterDensities[activeLetter] || 0
        : metricMode === 'percentage'
        ? c.letterPercentages[activeLetter] || 0
        : c.letterCounts[activeLetter] || 0,
      totalWords: c.totalWords,
      wordsPerAyah: c.wordsPerAyah,
      isQafCluster: c.id === 6
    }));
  }, [clustersData, activeLetter, metricMode]);

  // Distinct colors for active letters when shown in BarChart
  const LETTER_PALETTE = [
    '#2FA89D', '#34d399', '#f59e0b', '#B8935F', '#84CC16', '#16A34A',
    '#f97316', '#D3B17B', '#4ade80', '#4F8D88', '#fbbf24', '#f43f5e'
  ];

  return (
    <div className="space-y-3.5">
      {/* Top Header Card */}
      <div className={`p-3 sm:p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isLight ? 'bg-[#1A5C5C]/10 border-[#1A5C5C]/25 text-[#1A5C5C]' : 'bg-[#16534E]/40 border-[#2FA89D]/40 text-emerald-400'
            }`}>
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-sm sm:text-base font-bold font-heading ${isLight ? 'text-[#0F1419]' : 'text-ink-100'}`}>
                  خريطة كثافة الحروف في عناقيد الصحابة السبعة
                </h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                  isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border-[#E8DEC8]' : 'bg-[#16534E]/60 text-emerald-300 border-[#2FA89D]/40'
                }`}>
                  مُعايرة إحصائياً للكلمات
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                توزيع وترددات الحروف عبر تحزيب الصحابة (3، 5، 7، 9، 11، 14 مع ق، والمفصل 64)
              </p>
            </div>
          </div>

          {/* Visualization Mode Selector */}
          <div className={`flex items-center gap-1 p-1 rounded-lg border font-mono text-xs w-full sm:w-auto overflow-x-auto ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-ink-900/90 border-ink-800'
          }`}>
            <button
              onClick={() => setViewType('grid-heatmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'grid-heatmap'
                  ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold border border-[#2FA89D]/50 shadow-xs')
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>مصفوفة الخريطة الحرارية</span>
            </button>
            <button
              onClick={() => setViewType('cluster-bars')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'cluster-bars'
                  ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold border border-[#2FA89D]/50 shadow-xs')
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>أعمدة الكثافة المقارنة</span>
            </button>
            <button
              onClick={() => setViewType('letter-profile')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                viewType === 'letter-profile'
                  ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold border border-[#2FA89D]/50 shadow-xs')
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>منحنى الحرف الفردي</span>
            </button>
          </div>
        </div>

        {/* Global Controls Filter Bar */}
        <div className={`mt-3 pt-3 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs font-mono ${
          isLight ? 'border-[#EAE4D5]' : 'border-ink-700/20'
        }`}>
          
          {/* Group / Letter selector dependent on active ViewType */}
          {viewType === 'grid-heatmap' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Heatmap Groups Filter */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`text-[10px] font-bold ${isLight ? 'text-[#0F1419]' : 'text-emerald-400'}`}>
                  المجموعة:
                </span>
                {HEATMAP_LETTER_GROUPS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedHeatmapGroup(g.id)}
                    className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                      selectedHeatmapGroup === g.id
                        ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] border border-[#2FA89D]/50 font-bold')
                        : isLight 
                        ? 'bg-[#FAF6EC] text-[#53605E] hover:bg-[#F2ECE0] border border-[#E8DEC8]' 
                        : 'bg-ink-900 text-ink-400 hover:bg-ink-800 border border-ink-800'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Order selector for heatmap */}
              <div className={`flex items-center gap-1 border-r pr-2 ${isLight ? 'border-[#EAE4D5]' : 'border-ink-800'}`}>
                <span className={`text-[10px] font-bold ${isLight ? 'text-[#0F1419]' : 'text-ink-400'}`}>الترتيب:</span>
                <select
                  value={alphabetSortOrder}
                  onChange={(e) => setAlphabetSortOrder(e.target.value as AlphabetSortOrder)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono border transition-colors cursor-pointer ${
                    isLight ? 'bg-[#FAF6EC] border-[#DED8C9] text-[#0F1419]' : 'bg-ink-900 border-ink-700 text-ink-200'
                  }`}
                >
                  <option value="hijai">الهجائي (أ، ب، ت...)</option>
                  <option value="abjadi">الأبجدي (أبجد هوز...)</option>
                  <option value="frequency_desc">الأكثر تكراراً</option>
                  <option value="frequency_asc">الأقل تكراراً</option>
                  <option value="phonetic">الصوتي (المخارج)</option>
                </select>
              </div>
            </div>
          )}

          {viewType === 'cluster-bars' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold ${isLight ? 'text-[#0F1419]' : 'text-emerald-400'}`}>
                مجموعة المقارنة:
              </span>
              {/* Strictly limited to subsets (NO ALL 28 LETTERS to prevent illegible clutter) */}
              {BAR_CHART_LETTER_GROUPS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedBarGroup(g.id)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                    selectedBarGroup === g.id
                      ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] border border-[#2FA89D]/50 font-bold')
                      : isLight 
                      ? 'bg-[#FAF6EC] text-[#53605E] hover:bg-[#F2ECE0] border border-[#E8DEC8]' 
                      : 'bg-ink-900 text-ink-400 hover:bg-ink-800 border border-ink-800'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {viewType === 'letter-profile' && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${isLight ? 'text-[#0F1419]' : 'text-emerald-400'}`}>
                الحرف المُحلل:
              </span>
              <span className={`font-heading font-bold text-sm ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`}>
                حرف «{activeLetter}» ({letterStats.letterNames[activeLetter]})
              </span>
            </div>
          )}

          {/* Metric Mode Toggle */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <span className={`text-[10px] font-bold ${isLight ? 'text-[#0F1419]' : 'text-amber-400'}`}>
              المقياس:
            </span>
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-ink-900 border-ink-800'
            }`}>
              <button
                onClick={() => setMetricMode('density')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'density'
                    ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40')
                    : isLight ? 'text-[#53605E]' : 'text-ink-400'
                }`}
                title="كثافة ظهور الحرف لكل 100 كلمة في العنقود (مُعايرة للكتلة النصية)"
              >
                كثافة (لكل 100 كلمة)
              </button>
              <button
                onClick={() => setMetricMode('percentage')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'percentage'
                    ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40'
                    : isLight ? 'text-ink-600' : 'text-ink-400'
                }`}
                title="النسبة المئوية (%) من إجمالي حروف العنقود"
              >
                نسبة مئوية %
              </button>
              <button
                onClick={() => setMetricMode('rawCount')}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                  metricMode === 'rawCount'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : isLight ? 'text-ink-600' : 'text-ink-400'
                }`}
                title="العدد الإجمالي الخام للحرف في العنقود"
              >
                التعداد الخام
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: COMPACT HIGH-DENSITY INTERACTIVE HEATMAP MATRIX (LettersLab style) */}
      {viewType === 'grid-heatmap' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-2.5 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className={`text-xs sm:text-sm font-bold font-heading ${
                isLight ? 'text-[#0F1419]' : 'text-ink-100'
              }`}>
                مصفوفة الكثافة الحرارية ({activeHeatmapLetters.length} حرفاً × 7 عناقيد)
              </h4>
              {sortLetter && (
                <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border-[#E8DEC8]' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  <span>مرتب بحرف: <strong>{sortLetter}</strong></span>
                  <button 
                    onClick={() => setSortLetter(null)}
                    className="cursor-pointer font-bold hover:opacity-75"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] font-mono self-start sm:self-auto">
              <span className={isLight ? 'text-[#53605E]' : 'text-ink-400'}>أدنى كثافة</span>
              <div className={`flex items-center h-2.5 rounded overflow-hidden border ${
                isLight ? 'border-[#DED8C9]' : 'border-ink-700/50'
              }`}>
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal + (maxVal - minVal) * 0.35) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(minVal + (maxVal - minVal) * 0.7) }} />
                <div className="w-4 sm:w-5 h-full" style={{ backgroundColor: getCellColor(maxVal) }} />
              </div>
              <span className={isLight ? 'text-[#53605E]' : 'text-ink-400'}>أعلى كثافة</span>
            </div>
          </div>

          {/* Compact Heatmap Table Grid with Dynamic Flex-grow and Auto Overflow */}
          <div className={`w-full flex-1 flex flex-col overflow-hidden rounded-lg border shadow-inner ${
            isLight ? 'border-[#DED8C9]' : 'border-ink-800/80'
          }`}>
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-700/50">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className={isLight ? 'bg-[#F7F4EA] text-[#0F1419]' : 'bg-[#0B1716] text-emerald-400'}>
                    {/* Sticky Cluster Column */}
                    <th className={`p-2 text-right sticky right-0 z-20 min-w-[110px] sm:min-w-[135px] text-[11px] sm:text-xs font-mono border-l border-b shadow-xs ${
                      isLight ? 'bg-[#F7F4EA] border-[#EAE4D5] text-[#0F1419]' : 'bg-[#0B1716] border-ink-700/40 text-emerald-400'
                    }`}>
                      العنقود
                    </th>
                    {/* Words Column */}
                    <th className={`p-1.5 sm:p-2 text-[10px] sm:text-[11px] font-mono border-l border-b min-w-[65px] sm:min-w-[80px] ${
                      isLight ? 'border-[#EAE4D5]' : 'border-ink-700/40'
                    }`}>
                      الكلمات
                    </th>
                    {/* Letter Columns */}
                    {activeHeatmapLetters.map(letter => (
                      <th 
                        key={letter}
                        onClick={() => {
                          setSortLetter(sortLetter === letter ? null : letter);
                          setActiveLetter(letter);
                        }}
                        className={`p-1 sm:p-1.5 min-w-[34px] sm:min-w-[42px] font-heading font-bold text-xs sm:text-sm cursor-pointer transition-colors border-l border-b ${
                          isLight ? 'border-[#EAE4D5]' : 'border-ink-700/40'
                        } ${
                          sortLetter === letter || activeLetter === letter
                            ? (isLight ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-600' : 'bg-emerald-500/30 text-emerald-200 border-b-2 border-emerald-400')
                            : isLight ? 'text-[#0F1419] hover:bg-[#F2ECE0]' : 'text-ink-300 hover:bg-ink-800'
                        }`}
                        title={`انقر لترتيب العناقيد بحرف «${letter}» (${letterStats.letterNames[letter]})`}
                      >
                        <div className="leading-tight">{letter}</div>
                        <div className={`text-[8.5px] font-mono font-normal leading-none mt-0.5 ${isLight ? 'text-[#7B8885]' : 'text-ink-400'}`}>
                          {letterStats.letterNames[letter]?.slice(0, 3)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs font-mono ${isLight ? 'divide-[#EAE4D5] bg-[#FAF6EC]' : 'divide-ink-800/80 bg-[#10211F]'}`}>
                  {sortedClustersData.map(cluster => (
                    <tr 
                      key={cluster.id}
                      className={`transition-colors ${
                        selectedClusterId === cluster.id 
                          ? (isLight ? 'bg-[#F2ECE0]' : 'bg-[#16534E]/30') 
                          : (isLight ? 'hover:bg-[#F5EFE3]' : 'hover:bg-ink-800/30')
                      }`}
                    >
                      {/* Sticky Cluster Meta */}
                      <td 
                        onClick={() => setSelectedClusterId(selectedClusterId === cluster.id ? null : cluster.id)}
                        className={`p-2 text-right sticky right-0 z-10 border-l cursor-pointer ${
                          isLight ? 'border-[#EAE4D5] bg-[#FAF6EC] shadow-xs' : 'border-ink-700/40 bg-[#10211F]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: cluster.color }} 
                            />
                            <span className={`text-[11px] sm:text-xs font-bold truncate ${isLight ? 'text-[#0F1419]' : 'text-ink-200'}`}>
                              {cluster.name}
                            </span>
                          </div>
                          <span className={`text-[9.5px] px-1 py-0.2 rounded font-mono shrink-0 ${
                            cluster.id === 6 
                              ? (isLight ? 'bg-green-100 text-green-800 border border-green-300 font-bold' : 'bg-green-500/20 text-green-300 border border-green-500/40 font-bold') 
                              : 'opacity-70'
                          }`}>
                            {cluster.traditionalLabel.split(' (')[0].includes('عَشْرَةَ') ? null : cluster.traditionalLabel}
                          </span>
                        </div>
                      </td>

                      {/* Total Words in Cluster */}
                      <td className={`p-1.5 sm:p-2 border-l text-[10px] sm:text-[11px] font-mono text-center font-semibold ${
                        isLight ? 'border-[#EAE4D5] text-[#0F1419]' : 'border-ink-700/40 text-ink-300'
                      }`}>
                        {cluster.totalWords.toLocaleString('en-US')}
                      </td>

                      {/* Letter Cells */}
                      {activeHeatmapLetters.map(letter => {
                        const val = metricMode === 'density'
                          ? cluster.letterDensities[letter]
                          : metricMode === 'percentage'
                          ? cluster.letterPercentages[letter]
                          : cluster.letterCounts[letter];

                        const bgColor = getCellColor(val);
                        const isHighHeat = (val - minVal) / (maxVal - minVal || 1) > 0.65;

                        return (
                          <td
                            key={letter}
                            className={`p-1 sm:p-1.5 min-w-[34px] sm:min-w-[42px] border-l transition-all cursor-pointer hover:opacity-80 ${
                              isLight ? 'border-[#EAE4D5]' : 'border-ink-700/30'
                            }`}
                            style={{ backgroundColor: bgColor }}
                            onClick={() => setActiveLetter(letter)}
                            title={`${cluster.name} (${cluster.traditionalLabel})\nحرف: ${letter} (${letterStats.letterNames[letter]})\nالعدد الكامل: ${cluster.letterCounts[letter]?.toLocaleString('en-US')} مرة\nالنسبة: ${cluster.letterPercentages[letter]}%\nالكثافة: ${cluster.letterDensities[letter]} لكل 100 كلمة`}
                          >
                            <div className={`font-mono text-[9.5px] sm:text-[10.5px] font-bold leading-none ${
                              isLight
                                ? (isHighHeat ? 'text-white' : 'text-ink-900')
                                : (isHighHeat ? 'text-emerald-950 font-black' : 'text-ink-100')
                            }`}>
                              {metricMode === 'rawCount' 
                                ? (val ? val.toLocaleString('en-US') : '0') 
                                : val}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanatory note */}
          <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-mono ${
            isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#264340]' : 'bg-[#10211F] border-[#264340] text-emerald-300'
          }`}>
            <Info className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`} />
            <span>
              <strong>توجيه تصفح:</strong> يمكنك التمرير أفقياً لرؤية جميع الحروف الـ 28. انقر فوق أي حرف في رأس الجدول لترتيب العناقيد حسب كثافته.
            </span>
          </div>
        </div>
      )}

      {/* VIEW 2: RECHARTS BAR CHART (CLUSTER COMPARISON - LIMITED TO READABLE SUBSETS) */}
      {viewType === 'cluster-bars' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-3 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className={`text-sm font-bold font-heading flex items-center gap-2 ${
                isLight ? 'text-[#0F1419]' : 'text-ink-100'
              }`}>
                <BarChart3 className={`w-4 h-4 ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`} />
                <span>رسم بياني مقارن لكثافة الحروف عبر العناقيد السبعة (Bar Chart)</span>
              </h4>
              <p className={`text-[11px] font-mono ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                مقارنة مستويات الحضور للحروف في كل عنقود من عناقيد الصحابة (محددة بمجموعات فرعية لضمان وضوح الرسم)
              </p>
            </div>
          </div>

          <div className="h-[360px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={clusterBarChartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isLight ? '#53605E' : '#8FA09C'} 
                  fontSize={10}
                  fontFamily="sans-serif"
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill={isLight ? '#0F1419' : '#C7CEC9'} fontSize={10} fontWeight={600}>
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis 
                  stroke={isLight ? '#53605E' : '#8FA09C'} 
                  fontSize={10}
                  label={{ 
                    value: metricMode === 'density' ? 'كثافة (لكل 100 كلمة)' : metricMode === 'percentage' ? 'النسبة %' : 'التعداد', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: isLight ? '#53605E' : '#8FA09C',
                    fontSize: 9
                  }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const cData = payload[0]?.payload;
                    return (
                      <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono ${
                        isLight ? 'bg-[#FAF6EC] border-[#DED8C9] text-[#0F1419]' : 'bg-ink-900 border-ink-700 text-ink-100'
                      }`}>
                        <div className="font-bold border-b pb-1 mb-1 flex items-center justify-between gap-3">
                          <span className={isLight ? 'text-[#1A5C5C] font-bold' : 'text-emerald-400'}>{label} ({cData.traditional})</span>
                          <span className={`font-normal ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>{cData.totalWords?.toLocaleString()} كلمة</span>
                        </div>
                        <div className="space-y-1">
                          {payload.map((entry: any) => {
                            const char = entry.name.replace('letter_', '');
                            return (
                              <div key={entry.name} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="font-heading font-bold">حرف {char} ({letterStats.letterNames[char]}):</span>
                                </span>
                                <span className="font-bold">{entry.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32}
                  formatter={(val) => {
                    const char = val.replace('letter_', '');
                    return <span className={`font-heading font-bold text-xs ${isLight ? 'text-[#0F1419]' : ''}`}>حرف {char}</span>;
                  }}
                />
                {activeBarLetters.map((letter, idx) => (
                  <Bar
                    key={letter}
                    dataKey={`letter_${letter}`}
                    fill={LETTER_PALETTE[idx % LETTER_PALETTE.length]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={22}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: SINGLE LETTER PROFILE ACROSS ALL 7 CLUSTERS */}
      {viewType === 'letter-profile' && (
        <div className={`rounded-xl p-3 sm:p-4 border transition-colors space-y-3 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className={`text-sm font-bold font-heading flex items-center gap-2 ${
                isLight ? 'text-[#0F1419]' : 'text-ink-100'
              }`}>
                <Activity className={`w-4 h-4 ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`} />
                <span>تدرج كثافة حرف «{activeLetter}» ({letterStats.letterNames[activeLetter]}) عبر العناقيد السبعة</span>
              </h4>
              <p className={`text-[11px] font-mono ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                تتبع مسار الحرف في خط المصحف وتغير كثافته من الطوال إلى المفصل
              </p>
            </div>

            {/* Letter selector chips */}
            <div className="flex flex-wrap items-center gap-1 max-w-full sm:max-w-md self-start sm:self-auto overflow-x-auto p-0.5">
              {ALL_LETTERS.map(l => (
                <button
                  key={l}
                  onClick={() => setActiveLetter(l)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded font-heading text-xs font-bold transition-all cursor-pointer ${
                    activeLetter === l
                      ? 'bg-[#1A5C5C] text-white shadow-xs scale-110'
                      : isLight ? 'bg-[#FAF6EC] text-[#53605E] border border-[#E8DEC8] hover:bg-[#F2ECE0]' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[320px] sm:h-[340px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={singleLetterChartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isLight ? '#53605E' : '#8FA09C'} 
                  fontSize={10}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill={isLight ? '#0F1419' : '#C7CEC9'} fontSize={10} fontWeight={600}>
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis 
                  stroke={isLight ? '#53605E' : '#8FA09C'} 
                  fontSize={10}
                  label={{ 
                    value: metricMode === 'density' ? 'كثافة (لكل 100 كلمة)' : metricMode === 'percentage' ? 'النسبة %' : 'التعداد', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: isLight ? '#53605E' : '#8FA09C',
                    fontSize: 9
                  }} 
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const cData = payload[0]?.payload;
                    return (
                      <div className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono ${
                        isLight ? 'bg-[#FAF6EC] border-[#DED8C9] text-[#0F1419]' : 'bg-ink-900 border-ink-700 text-ink-100'
                      }`}>
                        <div className="font-bold border-b pb-1 mb-1 flex items-center justify-between gap-3">
                          <span className={isLight ? 'text-[#1A5C5C] font-bold' : 'text-emerald-400'}>{label} ({cData.traditional})</span>
                          {cData.isQafCluster && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              isLight ? 'bg-green-100 text-green-800 border-green-300' : 'bg-green-950/60 text-green-400 border-green-800/40'
                            }`}>
                              يشمل سورة ق
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span>قيمة حرف «{activeLetter}»:</span>
                            <span className={`font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`}>{cData.value}</span>
                          </div>
                          <div className={`flex justify-between gap-4 ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                            <span>إجمالي كلمات العنقود:</span>
                            <span>{cData.totalWords?.toLocaleString()}</span>
                          </div>
                          <div className={`flex justify-between gap-4 ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                            <span>معدل الكلمات للآية:</span>
                            <span>{cData.wordsPerAyah} كلمة/آية</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[5, 5, 0, 0]}
                  maxBarSize={40}
                >
                  {singleLetterChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke={entry.isQafCluster ? (isLight ? '#15803D' : '#16A34A') : undefined}
                      strokeWidth={entry.isQafCluster ? 2 : 0}
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={isLight ? '#1A5C5C' : '#2FA89D'} 
                  strokeWidth={2} 
                  dot={{ r: 3.5, fill: isLight ? '#1A5C5C' : '#2FA89D', strokeWidth: 1.5, stroke: isLight ? '#FAF6EC' : '#10211F' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cluster Details Cards Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
        {clustersData.map(c => (
          <div
            key={c.id}
            onClick={() => setSelectedClusterId(selectedClusterId === c.id ? null : c.id)}
            className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              selectedClusterId === c.id
                ? (isLight ? 'bg-[#FAF6EC] border-[#1A5C5C] ring-1 ring-[#1A5C5C] shadow-xs' : 'bg-emerald-500/10 border-emerald-500 shadow-xs')
                : isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] hover:border-[#DED8C9]' : 'bg-ink-900/60 border-ink-800 hover:border-ink-700'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className={`font-bold truncate text-[11px] ${isLight ? 'text-[#0F1419]' : ''}`}>{c.name}</span>
            </div>
            <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>{c.traditionalLabel.includes('عَشْرَةَ') ? null : c.traditionalLabel}</div>
            <div className={`text-[9px] ${isLight ? 'text-[#7B8885]' : 'text-ink-500'} mt-0.5`}>{c.totalWords.toLocaleString()} كلمة</div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ReferenceArea, 
  Cell 
} from 'recharts';
import { 
  Sparkles, 
  Compass, 
  Search, 
  TrendingUp, 
  BarChart2, 
  Award, 
  Layers, 
  Info, 
  CheckCircle2, 
  ArrowUpRight,
  Filter,
  Eye,
  SlidersHorizontal,
  Flame,
  Scale
} from 'lucide-react';
import { SurahData } from '../types';
import { 
  calculateQuranGoldenRatioStats, 
  SurahGoldenStat, 
  QuranGoldenRatioGlobalStats 
} from '../utils/goldenRatioStats';
import { formatSurahName } from '../utils/arabic';
import { PHI, PHI_INV } from '../utils/goldenRatio';

interface SurahGoldenRatioScatterPlotProps {
  surahs: SurahData[];
  selectedSurahNumber: number;
  onSelectSurah: (surahNumber: number) => void;
  onOpenDetailModal?: (surahNumber: number) => void;
  isDark: boolean;
}

export const SurahGoldenRatioScatterPlot: React.FC<SurahGoldenRatioScatterPlotProps> = ({
  surahs,
  selectedSurahNumber,
  onSelectSurah,
  onOpenDetailModal,
  isDark
}) => {
  const isLight = !isDark;
  // Global Quran Golden Stats
  const globalStats: QuranGoldenRatioGlobalStats = useMemo(() => {
    return calculateQuranGoldenRatioStats(surahs);
  }, [surahs]);

  // Selected surah enriched stat
  const selectedSurahStat = useMemo(() => {
    return globalStats.surahStats.find(s => s.surahNumber === selectedSurahNumber) 
      || globalStats.surahStats[0];
  }, [globalStats, selectedSurahNumber]);

  // Interactive controls state
  const [xAxisKey, setXAxisKey] = useState<'totalWords' | 'surahNumber' | 'totalAyahs' | 'ttr'>('totalWords');
  const [yAxisKey, setYAxisKey] = useState<'ratioToMean' | 'convergencePct' | 'totalWords' | 'avgAyahWords'>('ratioToMean');
  const [revelationFilter, setRevelationFilter] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'phi' | 'phi-inv' | 'high-harmony'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeExemplarTab, setActiveExemplarTab] = useState<'phi' | 'phi-inv' | 'all'>('phi');

  // Filtered scatter points
  const scatterData = useMemo(() => {
    return globalStats.surahStats.filter(item => {
      // Revelation filter
      if (revelationFilter !== 'all' && item.revelationType !== revelationFilter) {
        return false;
      }
      // Tier filter
      if (tierFilter === 'phi') {
        // Within ~25% of Phi factor (1.618)
        if (Math.abs(item.ratioToMean - PHI) / PHI > 0.25) return false;
      } else if (tierFilter === 'phi-inv') {
        // Within ~25% of Inverse Phi factor (0.618)
        if (Math.abs(item.ratioToMean - PHI_INV) / PHI_INV > 0.25) return false;
      } else if (tierFilter === 'high-harmony') {
        if (item.convergencePct < 80) return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.trim();
        const matchName = item.surahName.includes(q);
        const matchEng = item.englishName.toLowerCase().includes(q.toLowerCase());
        const matchNum = item.surahNumber.toString() === q;
        if (!matchName && !matchEng && !matchNum) return false;
      }
      return true;
    });
  }, [globalStats, revelationFilter, tierFilter, searchQuery]);

  // Axis configuration labels
  const xAxisLabel = useMemo(() => {
    switch (xAxisKey) {
      case 'totalWords': return 'عدد كلمات السورة (Word Count W)';
      case 'surahNumber': return 'ترتيب السورة في المصحف (1 - 114)';
      case 'totalAyahs': return 'عدد آيات السورة (Ayahs Count A)';
      case 'ttr': return 'نسبة التنوع المعجمي (TTR %)';
    }
  }, [xAxisKey]);

  const yAxisLabel = useMemo(() => {
    switch (yAxisKey) {
      case 'ratioToMean': return 'النسبة إلى المتوسط القرآني العام (W / W̄)';
      case 'convergencePct': return 'معامل التقارب والتناسق الذهبي (% Convergence)';
      case 'totalWords': return 'عدد كلمات السورة (Word Count W)';
      case 'avgAyahWords': return 'معدل طول الآية بالكلمات (Words / Ayah)';
    }
  }, [yAxisKey]);

  // Tooltip component
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: SurahGoldenStat = payload[0].payload;
    const isSelected = data.surahNumber === selectedSurahNumber;

    return (
      <div className={`p-4 rounded-xl shadow-2xl border text-right max-w-xs transition-all pointer-events-none select-none z-50 ${
        isDark 
          ? 'bg-ink-900/95 backdrop-blur-md border-[#1A5C5C]/40 text-ink-900 dark:text-ink-100 shadow-teal-950/50' 
          : 'bg-white/95 backdrop-blur-md border-[#DED8C9] text-ink-900 shadow-ink-300'
      }`} dir="rtl">
        <div className="flex items-center justify-between gap-3 border-b pb-2 mb-2 border-ink-700/40">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
              {data.surahNumber}
            </span>
            <span className="font-serif font-bold text-base text-amber-800 dark:text-amber-300">
              {formatSurahName(data.surahName)}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            data.isMeccan 
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
              : 'bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30'
          }`}>
            {data.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="text-ink-600 dark:text-ink-400">إجمالي الكلمات:</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
              {data.totalWords.toLocaleString()} كلمة
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-ink-600 dark:text-ink-400">النسبة للمتوسط العام ({globalStats.meanWordsPerSurah}):</span>
            <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
              {data.ratioToMean}×
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-ink-600 dark:text-ink-400">المستوى الذهبي الأقرب:</span>
            <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px]">
              {data.nearestTier.nameArabic}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-ink-600 dark:text-ink-400">الاتساق الذهبي:</span>
            <span className={`font-mono font-bold text-xs ${
              data.convergencePct >= 85 ? 'text-emerald-700 dark:text-emerald-400' : data.convergencePct >= 70 ? 'text-amber-700 dark:text-amber-400' : 'text-ink-700 dark:text-ink-300'
            }`}>
              {data.convergencePct}% ({data.harmonyTier})
            </span>
          </div>

          {/* Convergence Mini Bar */}
          <div className="w-full h-1.5 rounded-full bg-ink-800 overflow-hidden mt-1">
            <div 
              className={`h-full rounded-full transition-all ${
                data.convergencePct >= 85 ? 'bg-emerald-500' : data.convergencePct >= 70 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, data.convergencePct)}%` }}
            />
          </div>

          <div className="pt-2 border-t border-ink-700/40 text-[11px] text-ink-600 dark:text-ink-400 flex items-center justify-between">
            <span>آية القطع الذهبي:</span>
            <span className="font-mono font-bold text-lime-800 dark:text-lime-300">
              الآية ﴿{data.internalGoldenAyah}﴾ من أصل {data.totalAyahs}
            </span>
          </div>

          {isSelected ? (
            <div className="mt-2 text-center text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 py-1 rounded border border-amber-500/20">
              ★ السورة المحددة حالياً في المختبر
            </div>
          ) : (
            <div className="mt-2 text-center text-[10px] text-teal-700 dark:text-teal-400 bg-teal-500/10 py-1 rounded">
              انقر لاختيار السورة وعرض تحليلها الكامل ↵
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 4 Statistical KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Mean Words in Quran */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-ink-900/80 border-ink-800' : 'bg-white border-ink-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-ink-600 dark:text-ink-400 mb-1.5">
            <span className="font-medium">المتوسط القرآني العام (W̄)</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-teal-700 dark:text-teal-400">
              {globalStats.meanWordsPerSurah}
            </span>
            <span className="text-xs text-ink-600 dark:text-ink-400 font-sans">كلمة / سورة</span>
          </div>
          <div className="mt-2 text-[11px] text-ink-500 flex items-center justify-between pt-2 border-t border-ink-800/40">
            <span>إجمالي القرآن: {globalStats.totalWords.toLocaleString()} كلمة</span>
            <span>σ = {globalStats.stdDevWords}</span>
          </div>
        </div>

        {/* Golden Phi Proportionality Benchmark */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-ink-900/80 border-ink-800' : 'bg-white border-ink-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-ink-600 dark:text-ink-400 mb-1.5">
            <span className="font-medium">النسبة الذهبية الكبرى (φ × W̄)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 dark:text-amber-400">
              {globalStats.phiTimesMeanWords}
            </span>
            <span className="text-xs text-ink-600 dark:text-ink-400 font-sans">كلمة (φ = 1.618)</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700/80 dark:text-amber-400/80 flex items-center justify-between pt-2 border-t border-ink-800/40 font-mono">
            <span>سورة الزمر (1,177)</span>
            <span>سورة النمل (1,160)</span>
          </div>
        </div>

        {/* Inverse Phi Proportionality Benchmark */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-ink-900/80 border-ink-800' : 'bg-white border-ink-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-ink-600 dark:text-ink-400 mb-1.5">
            <span className="font-medium">معكوس النسبة الذهبية (1/φ × W̄)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {globalStats.phiInvTimesMeanWords}
            </span>
            <span className="text-xs text-ink-600 dark:text-ink-400 font-sans">كلمة (1/φ = 0.618)</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 flex items-center justify-between pt-2 border-t border-ink-800/40 font-mono">
            <span>سورة الحشر (447)</span>
            <span>سورة الواقعة (379)</span>
          </div>
        </div>

        {/* Global Harmony Alignment Score */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-ink-900/80 border-ink-800' : 'bg-white border-ink-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs text-ink-600 dark:text-ink-400 mb-1.5">
            <span className="font-medium">معدل الاتساق الذهبي القرآني</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {globalStats.globalMeanConvergencePct}%
            </span>
            <span className="text-xs text-ink-600 dark:text-ink-400 font-sans">تطابق رياضي</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 flex items-center justify-between pt-2 border-t border-ink-800/40">
            <span>{globalStats.highConvergenceSurahsCount} سورة باتساق ≥ 80%</span>
            <span>توزيع متزن</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Scatter Plot Container */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-ink-900/80 border-ink-800 shadow-xl' : 'bg-white border-ink-200 shadow-sm'
      }`}>
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-ink-800/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>المخطط المبعثر للتناسب والنسبة الذهبية (Golden Ratio Scatter Plot)</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                114 سورة قرآنية
              </span>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-400 mt-1 max-w-2xl leading-relaxed">
              تحليل التناسب الإحصائي لكلمات كل سورة مقارنة بالمتوسط العام للقرآن (W̄ = {globalStats.meanWordsPerSurah}) وخطوط القطع الذهبي الهندسية (φ = 1.618 و 1/φ = 0.618).
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="ابحث عن سورة أو رقمها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-3 py-1.5 pl-8 rounded-xl text-xs border outline-none transition-all ${
                isLight 
                  ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419] placeholder-[#7C8B89] focus:border-[#1A5C5C]' 
                  : 'bg-[#10211F] border-[#264340] text-[#F4F0E7] placeholder-[#6B8580] focus:border-[#2B7470]'
              }`}
            />
            <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`} />
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-xs">
          {/* Axis Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className={`font-medium ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>المحور الأفقي (X):</span>
              <select
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value as any)}
                aria-label="اختر المحور الأفقي"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border outline-none cursor-pointer transition-colors ${
                  isLight 
                    ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' 
                    : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'
                }`}
              >
                <option value="totalWords">عدد كلمات السورة (Word Count)</option>
                <option value="surahNumber">ترتيب السور في المصحف (1 - 114)</option>
                <option value="totalAyahs">عدد آيات السورة (Ayahs Count)</option>
                <option value="ttr">التنوع المعجمي (TTR %)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`font-medium ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>المحور الرأسي (Y):</span>
              <select
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value as any)}
                aria-label="اختر المحور الرأسي"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border outline-none cursor-pointer transition-colors ${
                  isLight 
                    ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' 
                    : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'
                }`}
              >
                <option value="ratioToMean">النسبة إلى المتوسط العام (W / W̄)</option>
                <option value="convergencePct">معامل التناسب الذهبي (% Convergence)</option>
                <option value="totalWords">عدد كلمات السورة (Word Count)</option>
                <option value="avgAyahWords">معدل طول الآية بالكلمات</option>
              </select>
            </div>
          </div>

          {/* Revelation & Golden Tier Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Revelation Filter */}
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <button
                type="button"
                onClick={() => setRevelationFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  revelationFilter === 'all'
                    ? 'bg-[#1A5C5C] text-white shadow-xs'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
              >
                الكل (114)
              </button>
              <button
                type="button"
                onClick={() => setRevelationFilter('Meccan')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  revelationFilter === 'Meccan'
                    ? isLight ? 'bg-[#C5A16A]/20 text-[#8C6D2D] font-bold' : 'bg-[#C5A16A]/25 text-[#E0C088] font-bold'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
              >
                مكية (86)
              </button>
              <button
                type="button"
                onClick={() => setRevelationFilter('Medinan')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  revelationFilter === 'Medinan'
                    ? isLight ? 'bg-[#1A5C5C]/20 text-[#1A5C5C] font-bold' : 'bg-[#1A5C5C]/30 text-[#4FB7B2] font-bold'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
              >
                مدنية (28)
              </button>
            </div>

            {/* Golden Tier Filter */}
            <div className={`flex items-center p-0.5 rounded-lg border ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <button
                type="button"
                onClick={() => setTierFilter('all')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'all'
                    ? 'bg-[#1A5C5C] text-white shadow-xs'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
              >
                كافة التناسبات
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('phi')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'phi'
                    ? (isDark ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900 shadow-xs')
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
                title="السور القريبة من النسبة الذهبية الكبرى 1.618"
              >
                نطاق φ (1.618)
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('phi-inv')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'phi-inv'
                    ? (isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-900 shadow-xs')
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
                title="السور القريبة من معكوس النسبة الذهبية 0.618"
              >
                نطاق 1/φ (0.618)
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('high-harmony')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  tierFilter === 'high-harmony'
                    ? (isDark ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-900 shadow-xs')
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
                title="السور ذات الاتساق الذهبي العالي ≥ 80%"
              >
                فائقة الاتساق (≥ 80%)
              </button>
            </div>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 text-[11px] font-sans">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-xs shadow-amber-500/50"></span>
              خط النسبة الذهبية (φ = 1.618)
            </span>
            <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-teal-500 inline-block shadow-xs shadow-teal-500/50"></span>
              خط معكوس النسبة (1/φ = 0.618)
            </span>
            <span className="flex items-center gap-1.5 text-lime-700 dark:text-lime-400 font-semibold">
              <span className="w-3 h-0.5 bg-lime-500 border-dashed inline-block"></span>
              المتوسط القرآني (W̄ = {globalStats.meanWordsPerSurah})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              سورة مكية
            </span>
            <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
              سورة مدنية
            </span>
          </div>

          <div className="text-ink-600 dark:text-ink-400 text-[10px]">
            عرض <strong className="text-amber-700 dark:text-amber-400 font-mono">{scatterData.length}</strong> من أصل 114 سورة (انقر على أي نقطة لاختيار السورة)
          </div>
        </div>

        {/* The Recharts Scatter Canvas */}
        <div className="h-[420px] w-full mt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 25, left: 15 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#1B302D' : '#E2DDCF'} 
              />

              <XAxis 
                type="number" 
                dataKey={xAxisKey} 
                name={xAxisLabel}
                stroke={isDark ? '#97A8A3' : '#6F7F7B'} 
                fontSize={11}
                tick={{ fill: isDark ? '#B7C1BC' : '#3A4A47' }}
                label={{ 
                  value: xAxisLabel, 
                  position: 'insideBottom', 
                  offset: -15, 
                  fill: isDark ? '#B7C1BC' : '#3A4A47', 
                  fontSize: 11,
                  fontFamily: 'system-ui'
                }}
              />

              <YAxis 
                type="number" 
                dataKey={yAxisKey} 
                name={yAxisLabel}
                stroke={isDark ? '#97A8A3' : '#6F7F7B'} 
                fontSize={11}
                tick={{ fill: isDark ? '#B7C1BC' : '#3A4A47' }}
                label={{ 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0,
                  fill: isDark ? '#B7C1BC' : '#3A4A47', 
                  fontSize: 11,
                  fontFamily: 'system-ui'
                }}
              />

              <ZAxis type="number" range={[45, 120]} />

              <Tooltip 
                content={<CustomScatterTooltip />} 
                cursor={{ strokeDasharray: '3 3', stroke: isDark ? '#97A8A3' : '#6F7F7B' }}
              />

              {/* Reference Lines when Y-Axis is Ratio to Mean */}
              {yAxisKey === 'ratioToMean' && (
                <>
                  {/* Horizontal Line for Phi^2 (2.618) */}
                  <ReferenceLine 
                    y={2.61803} 
                    stroke={isDark ? '#10b981' : '#047857'} 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{ 
                      value: 'φ² = 2.618 (المربع الذهبي)', 
                      fill: isDark ? '#10b981' : '#047857', 
                      fontSize: 10, 
                      position: 'top'
                    }}
                  />

                  {/* Horizontal Line for Phi (1.618) */}
                  <ReferenceLine 
                    y={1.61803} 
                    stroke={isDark ? '#f59e0b' : '#B45309'} 
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    label={{ 
                      value: 'φ = 1.618 (النسبة الذهبية)', 
                      fill: isDark ? '#f59e0b' : '#B45309', 
                      fontSize: 10, 
                      position: 'top',
                      offset: 5
                    }}
                  />

                  {/* Horizontal Line for Mean Unity (1.000) */}
                  <ReferenceLine 
                    y={1.00000} 
                    stroke={isDark ? '#65A30D' : '#4D7C0F'} 
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{ 
                      value: 'المتوسط القرآني (1.00)', 
                      fill: isDark ? '#65A30D' : '#4D7C0F', 
                      fontSize: 10, 
                      position: 'right'
                    }}
                  />

                  {/* Horizontal Line for Inverse Phi (0.618) */}
                  <ReferenceLine 
                    y={0.61803} 
                    stroke="#1A5C5C" 
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    label={{ 
                      value: '1/φ = 0.618 (معكوس الذهبية)', 
                      fill: '#1A5C5C', 
                      fontSize: 10, 
                      position: 'bottom',
                      offset: 5
                    }}
                  />

                  {/* Horizontal Line for Inverse Phi^2 (0.382) */}
                  <ReferenceLine 
                    y={0.38197} 
                    stroke={isDark ? '#2FA89D' : '#1A5C5C'} 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{ 
                      value: '1/φ² = 0.382 (المعكوس التربيعي)', 
                      fill: isDark ? '#2FA89D' : '#1A5C5C', 
                      fontSize: 10, 
                      position: 'bottom'
                    }}
                  />
                </>
              )}

              {/* Vertical Reference Lines when X-Axis is Total Words */}
              {xAxisKey === 'totalWords' && (
                <>
                  <ReferenceLine 
                    x={globalStats.meanWordsPerSurah} 
                    stroke={isDark ? '#65A30D' : '#4D7C0F'} 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine 
                    x={globalStats.phiTimesMeanWords} 
                    stroke={isDark ? '#f59e0b' : '#B45309'} 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <ReferenceLine 
                    x={globalStats.phiInvTimesMeanWords} 
                    stroke="#1A5C5C" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                </>
              )}

              {/* Scatter Points */}
              <Scatter 
                data={scatterData} 
                onClick={(e: any) => {
                  const sNum = e?.surahNumber || e?.payload?.surahNumber || e?.activePayload?.[0]?.payload?.surahNumber;
                  if (sNum) {
                    onSelectSurah(sNum);
                  }
                }}
                className="cursor-pointer"
              >
                {scatterData.map((entry) => {
                  const isSelected = entry.surahNumber === selectedSurahNumber;
                  // Color determination
                  let pointFill = entry.isMeccan ? '#10b981' : '#2B7470'; // Meccan Emerald vs Medinan Indigo
                  
                  if (isSelected) {
                    pointFill = '#f59e0b'; // Selected Gold
                  } else if (entry.convergencePct >= 90) {
                    pointFill = entry.isMeccan ? '#34d399' : '#4F8D88';
                  }

                  return (
                    <Cell 
                      key={`scatter-cell-${entry.surahNumber}`} 
                      fill={pointFill}
                      stroke={isSelected ? '#ffffff' : (isDark ? '#10211F' : '#ffffff')}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className={isSelected ? 'animate-pulse' : ''}
                      onClick={() => onSelectSurah(entry.surahNumber)}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Surah Golden Analysis Spotlight */}
        <div className={`mt-5 p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-amber-500/10 via-ink-800/60 to-emerald-500/10 border-amber-500/30' 
            : 'bg-gradient-to-r from-amber-50 via-white to-emerald-50 border-amber-200 shadow-xs'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-lg font-mono shadow-md shadow-amber-500/20">
              {selectedSurahStat.surahNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold font-sans">السورة المحددة حالياً:</span>
                <h3 className="text-lg font-bold font-serif text-amber-800 dark:text-amber-300">
                  {formatSurahName(selectedSurahStat.surahName)}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  selectedSurahStat.isMeccan 
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                    : 'bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30'
                }`}>
                  {selectedSurahStat.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                </span>
              </div>
              <div className="text-xs text-ink-700 dark:text-ink-300 mt-1 flex flex-wrap items-center gap-3">
                <span>الكلمات: <strong className="font-mono text-amber-700 dark:text-amber-400">{selectedSurahStat.totalWords}</strong> كلمة</span>
                <span className="opacity-40">•</span>
                <span>النسبة للمتوسط العام: <strong className="font-mono text-teal-700 dark:text-teal-400">{selectedSurahStat.ratioToMean}×</strong> ({selectedSurahStat.differenceFromMean >= 0 ? `+${selectedSurahStat.differenceFromMean}` : selectedSurahStat.differenceFromMean} كلمة)</span>
                <span className="opacity-40">•</span>
                <span>المستوى الذهبي: <strong className="text-amber-800 dark:text-amber-300">{selectedSurahStat.nearestTier.nameArabic}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-left font-mono">
              <div className="text-[10px] text-ink-600 dark:text-ink-400">الاتساق الذهبي:</div>
              <div className={`text-xl font-bold ${
                selectedSurahStat.convergencePct >= 85 ? (isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]') : (isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]')
              }`}>
                {selectedSurahStat.convergencePct}%
              </div>
              <div className={`text-[10px] font-sans ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>({selectedSurahStat.harmonyTier})</div>
            </div>

            <div className={`p-3 rounded-lg border text-right text-xs transition-colors ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>القطع الذهبي الداخلي للسورة:</div>
              <div className={`font-semibold mt-0.5 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>
                الآية ﴿{selectedSurahStat.internalGoldenAyah}﴾ من {selectedSurahStat.totalAyahs} آية
              </div>
              <div className={`text-[10px] ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>
                (نسبة مقطعي الآيات: {selectedSurahStat.internalAyahsPhiRatio} ≈ φ)
              </div>
            </div>

            {onOpenDetailModal && (
              <button
                type="button"
                onClick={() => onOpenDetailModal(selectedSurahStat.surahNumber)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                  isLight 
                    ? 'bg-[#1A5C5C] hover:bg-[#236e6e] text-white border-[#1A5C5C]' 
                    : 'bg-[#1A5C5C]/30 hover:bg-[#1A5C5C]/50 text-[#E0C088] border-[#2B7470]'
                }`}
                title="عرض التحليل المفصل الشامل لهذه السورة في نافذة مستقلة"
              >
                <span>التحليل المفصل للسورة</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Golden Exemplars Section */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>
              <Award className="w-4 h-4 text-[#C5A16A]" />
              <span>أبرز السور المحققة للتناسب والنسبة الذهبية مع المتوسط العام</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              السور التي تتوافق أعداد كلماتها بدقة هندسية استثنائية مع مضاعفات النسبة الذهبية للقرآن الكريم. انقر على أي بطاقة لاختيارها فوراً.
            </p>
          </div>

          {/* Exemplar Tab Switcher */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <button
              onClick={() => setActiveExemplarTab('phi')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeExemplarTab === 'phi'
                  ? 'bg-[#1A5C5C] text-white shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
              }`}
            >
              نطاق φ المباشر (≈ 1,100 كلمة)
            </button>
            <button
              onClick={() => setActiveExemplarTab('phi-inv')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeExemplarTab === 'phi-inv'
                  ? 'bg-[#1A5C5C] text-white shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
              }`}
            >
              نطاق معكوس 1/φ (≈ 420 كلمة)
            </button>
            <button
              onClick={() => setActiveExemplarTab('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeExemplarTab === 'all'
                  ? 'bg-[#1A5C5C] text-white shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
              }`}
            >
              الأعلى اتساقاً عاماً (≥ 90%)
            </button>
          </div>
        </div>

        {/* Exemplars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(activeExemplarTab === 'phi' 
            ? globalStats.topPhiSurahs 
            : activeExemplarTab === 'phi-inv' 
              ? globalStats.topPhiInvSurahs 
              : globalStats.topOverallConvergenceSurahs
          ).map((item) => {
            const isSelected = item.surahNumber === selectedSurahNumber;

            return (
              <div
                key={item.surahNumber}
                onClick={() => onSelectSurah(item.surahNumber)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? isLight 
                      ? 'bg-[#1A5C5C]/15 border-[#1A5C5C] text-[#0F1419] shadow-sm font-bold' 
                      : 'bg-[#1A5C5C]/25 border-[#2B7470] text-[#F4F0E7] shadow-lg'
                    : isLight 
                      ? 'bg-[#F7F4EA] border-[#DED8C9] hover:bg-white hover:border-[#1A5C5C]/40 text-[#0F1419] shadow-xs' 
                      : 'bg-[#10211F] border-[#264340] hover:border-[#2B7470] hover:bg-[#163331] text-[#F4F0E7]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                        isLight ? 'bg-[#EDE8D8] text-[#1A5C5C]' : 'bg-[#183431] text-[#C5A16A]'
                      }`}>
                        {item.surahNumber}
                      </span>
                      <span className="font-serif font-bold text-sm transition-colors">
                        {formatSurahName(item.surahName)}
                      </span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                      item.isMeccan 
                        ? (isLight ? 'bg-[#C5A16A]/15 text-[#8C6D2D] border-[#C5A16A]/30' : 'bg-[#C5A16A]/20 text-[#E0C088] border-[#C5A16A]/30')
                        : (isLight ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border-[#1A5C5C]/20' : 'bg-[#1A5C5C]/20 text-[#4FB7B2] border-[#1A5C5C]/30')
                    }`}>
                      {item.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono mt-2">
                    <span className="text-ink-600 dark:text-ink-400 font-sans text-[11px]">الكلمات:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{item.totalWords} كلمة</span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono mt-1">
                    <span className="text-ink-600 dark:text-ink-400 font-sans text-[11px]">النسبة للمتوسط:</span>
                    <span className={`font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-700 dark:text-emerald-400'}`}>{item.ratioToMean}×</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-ink-700/30 flex items-center justify-between text-[11px]">
                  <span className="text-ink-600 dark:text-ink-400 text-[10px]">{item.nearestTier.nameArabic}</span>
                  <span className={`font-mono font-bold ${
                    item.convergencePct >= 90 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {item.convergencePct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SurahGoldenRatioScatterPlot;

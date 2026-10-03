// src/components/SahabaClustersCharts.tsx
// لوحة تحكم إحصائية متقدمة لعناقيد الصحابة السبعة باستخدام مكتبة Recharts

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  Line,
  Area,
  ComposedChart,
  PieChart,
  Pie
} from 'recharts';
import { 
  BarChart3, 
  TrendingDown, 
  PieChart as PieIcon, 
  Layers, 
  Sparkles, 
  Filter, 
  BookOpen,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { SurahData } from '../types';
import { SAHABA_CLUSTERS, computeClusterStats, ClusterComputedStats, AL_FATIHAH_META } from '../data/sahabaClusters';
import { useTheme } from '../context/ThemeContext';
import { SahabaClusterWordsAnalysis } from './SahabaClusterWordsAnalysis';
import { formatSurahName } from '../utils/arabic';

interface SahabaClustersChartsProps {
  surahs: SurahData[];
  similarityMatrix?: number[][];
  onSelectSurah: (surah: SurahData) => void;
}

export const SahabaClustersCharts: React.FC<SahabaClustersChartsProps> = ({
  surahs,
  similarityMatrix,
  onSelectSurah
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Active chart view mode
  const [activeChartTab, setActiveChartTab] = useState<'rhythm' | 'surahs' | 'volume' | 'cohesion' | 'topWords'>('rhythm');
  const [surahsDisplayMode, setSurahsDisplayMode] = useState<'stacked' | 'grouped'>('stacked');
  const [selectedClusterId, setSelectedClusterId] = useState<number>(6); // Default to cluster 6 (which holds Surah Qaf)
  const [surahMetric, setSurahMetric] = useState<'words' | 'ayahs' | 'avgWords'>('words');

  // Compute stats for all 7 clusters
  const clustersStats = useMemo(() => {
    return SAHABA_CLUSTERS.map(cDef => computeClusterStats(cDef, surahs, similarityMatrix));
  }, [surahs, similarityMatrix]);

  // Fatihah Data
  const fatihahSurah = useMemo(() => {
    return surahs.find(s => s.number === 1) || surahs[0];
  }, [surahs]);

  // Total words & ayahs for percentage calculations
  const totalQuranWords = useMemo(() => surahs.reduce((sum, s) => sum + s.totalWords, 0) || 77797, [surahs]);
  const totalQuranAyahs = useMemo(() => surahs.reduce((sum, s) => sum + s.totalAyahs, 0) || 6236, [surahs]);

  // Data formatted for Recharts
  const chartData = useMemo(() => {
    return clustersStats.map(stat => {
      const c = stat.clusterDef;
      return {
        id: c.id,
        name: c.traditionalLabel,
        clusterName: c.name,
        fullName: `${c.name}: ${c.traditionalLabel}`,
        shortLabel: `${c.id}: ${c.traditionalLabel}`,
        color: c.color,
        // Surahs count & type
        'مكية': stat.meccanCount,
        'مدنية': stat.medinanCount,
        totalSurahs: stat.totalSurahs,
        // Rhythm metrics
        'متوسط كلمات الآية': stat.avgAyahWords,
        'متوسط حروف الآية': stat.avgAyahChars,
        // Text volume shares
        'حصة الكلمات %': stat.percentageOfQuranWords,
        'حصة الآيات %': stat.percentageOfQuranAyahs,
        'إجمالي الكلمات': stat.totalWords,
        'إجمالي الآيات': stat.totalAyahs,
        // Cohesion
        'درجة التجانس %': stat.intraClusterCohesion
      };
    });
  }, [clustersStats]);

  // Pie chart data for Quranic text volume shares
  const pieWordsData = useMemo(() => {
    const list = clustersStats.map(stat => ({
      name: `${stat.clusterDef.name} (${stat.clusterDef.traditionalLabel})`,
      shortName: stat.clusterDef.traditionalLabel,
      value: stat.totalWords,
      percentage: stat.percentageOfQuranWords,
      color: stat.clusterDef.color
    }));
    return list;
  }, [clustersStats]);

  // Selected cluster stats for drill-down
  const selectedClusterStats = useMemo(() => {
    return clustersStats.find(s => s.clusterDef.id === selectedClusterId) || clustersStats[0];
  }, [clustersStats, selectedClusterId]);

  // Surahs inside the selected cluster for the drill-down bar chart
  const drillDownSurahsData = useMemo(() => {
    return selectedClusterStats.surahs.map(s => {
      const avgWords = s.totalAyahs > 0 ? Number((s.totalWords / s.totalAyahs).toFixed(1)) : 0;
      return {
        surah: s,
        number: s.number,
        name: s.name,
        displayName: `${s.number}. ${s.name}`,
        words: s.totalWords,
        ayahs: s.totalAyahs,
        avgWords,
        isMeccan: s.isMeccan,
        isQaf: s.number === 50,
        color: s.number === 50 ? '#0d9488' : (s.isMeccan ? '#B8935F' : '#10b981')
      };
    });
  }, [selectedClusterStats]);

  // Tooltip theme styles
  const tooltipStyle = {
    backgroundColor: isLight ? '#FAF6EC' : '#10211F',
    borderColor: isLight ? '#DED8C9' : '#264340',
    borderRadius: '10px',
    color: isLight ? '#0F1419' : '#E0C088',
    fontSize: '12px',
    fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
    direction: 'rtl' as const,
    boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.06)' : '0 10px 15px -3px rgba(0,0,0,0.5)',
    padding: '8px 12px'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* Top Statistical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className={`rounded-xl p-3 space-y-1 shadow-xs border transition-colors border-t-2 border-t-emerald-500 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <span className={`text-[11px] font-mono block ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>الهيكل العام</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg sm:text-xl font-bold font-mono ${isLight ? 'text-[#0F1419]' : 'text-ink-900 dark:text-ink-100'}`}>7 عناقيد</span>
            <span className="text-[11px] font-sans text-amber-500 font-bold">+ الفاتحة</span>
          </div>
          <p className={`text-[10px] font-mono ${isLight ? 'text-[#7B8885]' : 'text-ink-600 dark:text-ink-400'}`}>114 سورة محصورة بالكامل</p>
        </div>

        {/* Metric 2 */}
        <div className={`rounded-xl p-3 space-y-1 shadow-xs border transition-colors border-t-2 border-t-emerald-500 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <span className={`text-[11px] font-mono block ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>انحدار الإيقاع</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-500">23.8 ← 4.9</span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>كلمة/آية</span>
          </div>
          <p className={`text-[10px] font-mono ${isLight ? 'text-[#7B8885]' : 'text-ink-600 dark:text-ink-400'}`}>انحدار تنازلي مذهل بـ 79%</p>
        </div>

        {/* Metric 3 */}
        <div className={`rounded-xl p-3 space-y-1 shadow-xs border transition-colors border-t-2 border-t-green-500 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <span className={`text-[11px] font-mono block ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>العنقود قبل الأخير</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-green-600 dark:text-green-400">14 سورة</span>
            <span className="text-[10px] font-mono text-green-700 dark:text-green-300 font-bold">(تتضمن ق)</span>
          </div>
          <p className={`text-[10px] font-mono ${isLight ? 'text-[#7B8885]' : 'text-ink-600 dark:text-ink-400'}`}>من الصافات (37) إلى ق (50)</p>
        </div>

        {/* Metric 4 */}
        <div className={`rounded-xl p-3 space-y-1 shadow-xs border transition-colors border-t-2 border-t-lime-500 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <span className={`text-[11px] font-mono block ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>حزب المفصل (العنقود 7)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-lime-600 dark:text-lime-400">64 سورة</span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>(الذاريات-الناس)</span>
          </div>
          <p className={`text-[10px] font-mono ${isLight ? 'text-[#7B8885]' : 'text-ink-600 dark:text-ink-400'}`}>56% من سور القرآن بإيقاع حاسم</p>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className={`rounded-xl p-4 sm:p-5 shadow-xs space-y-4 border transition-colors ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
      }`}>
        
        {/* Chart Navigation Tabs & Controls */}
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-3 ${
          isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isLight ? 'bg-[#1A5C5C]/10 border-[#1A5C5C]/25 text-[#1A5C5C]' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            }`}>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 font-heading ${
                isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'
              }`}>
                <span>لوحة الرسوم البيانية الإحصائية للعناقيد السبعة</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border-[#E8DEC8]' : 'bg-[#16534E]/60 text-emerald-800 dark:text-emerald-300 border-[#2FA89D]/40'
                }`}>
                  Recharts Engine
                </span>
              </h3>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                استكشف المقاييس النظمية والتوزيعات الكمية عبر المخططات البيانية التفاعلية
              </p>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className={`flex flex-wrap items-center gap-1.5 p-1 rounded-lg border self-start lg:self-auto ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <button
              onClick={() => setActiveChartTab('rhythm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                activeChartTab === 'rhythm'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-[#16534E] text-[#5EEAD4] border border-[#2FA89D]/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200')
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>التدرج الإيقاعي</span>
            </button>

            <button
              onClick={() => setActiveChartTab('surahs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                activeChartTab === 'surahs'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-[#16534E] text-[#5EEAD4] border border-[#2FA89D]/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200')
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>توزيع السور (مكي / مدني)</span>
            </button>

            <button
              onClick={() => setActiveChartTab('volume')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                activeChartTab === 'volume'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-[#16534E] text-[#5EEAD4] border border-[#2FA89D]/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200')
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>الكتلة النصية (% الكلمات والآيات)</span>
            </button>

            <button
              onClick={() => setActiveChartTab('cohesion')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                activeChartTab === 'cohesion'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-[#16534E] text-[#5EEAD4] border border-[#2FA89D]/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200')
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>التجانس الداخلي %</span>
            </button>

            <button
              onClick={() => setActiveChartTab('topWords')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                activeChartTab === 'topWords'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-[#16534E] text-[#5EEAD4] border border-[#2FA89D]/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200')
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>أكثر 10 كلمات تكراراً</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CHART 1: RHYTHM GRADIENT (ComposedChart: Area + Line) */}
        {/* ========================================================================= */}
        {activeChartTab === 'rhythm' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C5C]"></span>
                <span className={`font-bold ${isLight ? 'text-[#0F1419]' : 'text-ink-800 dark:text-ink-200'}`}>
                  منحنى الانحدار الإيقاعي: متوسط طول الآيات (كلمات وحروف)
                </span>
              </div>
              <div className={`flex items-center gap-3 ${isLight ? 'text-[#3A4A47]' : 'text-ink-700 dark:text-ink-300'}`}>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-[#1A5C5C] inline-block"></span>
                  <span>متوسط الكلمات/آية (المحور الأيسر)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-[#8A5A12] dark:bg-lime-500 inline-block"></span>
                  <span>متوسط الحروف/آية (المحور الأيمن)</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="rhythmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isLight ? '#1A5C5C' : '#2FA89D'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={isLight ? '#1A5C5C' : '#2FA89D'} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} vertical={false} />
                  <XAxis 
                    dataKey="shortLabel" 
                    stroke={isLight ? '#53605E' : '#8FA09C'}
                    fontSize={11}
                    tick={{ fill: isLight ? '#0F1419' : '#C7CEC9', fontFamily: 'Amiri', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke={isLight ? '#1A5C5C' : '#2FA89D'}
                    fontSize={11}
                    tickFormatter={(v) => `${v} ك`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke={isLight ? '#8A5A12' : '#BEF264'}
                    fontSize={11}
                    tickFormatter={(v) => `${v} ح`}
                  />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) => {
                      if (name === 'متوسط كلمات الآية') return [`${value} كلمة لكل آية`, name];
                      if (name === 'متوسط حروف الآية') return [`${value} حرفاً لكل آية`, name];
                      return [value, name];
                    }}
                    labelFormatter={(label: any) => `العنقود ${label}`}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="متوسط كلمات الآية" 
                    stroke={isLight ? '#1A5C5C' : '#2FA89D'} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#rhythmGradient)" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="متوسط حروف الآية" 
                    stroke={isLight ? '#8A5A12' : '#84CC16'} 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: isLight ? '#8A5A12' : '#84CC16' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 rounded-lg border text-xs leading-relaxed font-mono flex items-start gap-2 bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]">
              <Activity className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <span>
                <strong>الحقائق المستنبطة من البيانات:</strong> ينخفض متوسط طول الآية من{' '}
                <strong className="text-[var(--color-primary)] font-bold">{chartData[0]?.['متوسط كلمات الآية']} كلمة/آية</strong>{' '}
                في {chartData[0]?.clusterName} إلى{' '}
                <strong className="text-[var(--color-primary)] font-bold">{chartData[chartData.length - 1]?.['متوسط كلمات الآية']} كلمة/آية</strong>{' '}
                في {chartData[chartData.length - 1]?.clusterName}، وينخفض متوسط عدد الحروف في الآية من{' '}
                <strong className="text-[var(--color-primary)] font-bold">{chartData[0]?.['متوسط حروف الآية']}</strong> إلى{' '}
                <strong className="text-[var(--color-primary)] font-bold">{chartData[chartData.length - 1]?.['متوسط حروف الآية']}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHART 2: SURAHS DISTRIBUTION (Stacked / Grouped BarChart) */}
        {/* ========================================================================= */}
        {activeChartTab === 'surahs' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className={`font-bold ${isLight ? 'text-[#0F1419]' : 'text-ink-800 dark:text-ink-200'}`}>
                  توزيع عدد السور داخل كل عنقود حسب نوع النزول
                </span>
              </div>

              {/* Toggle Stacked vs Grouped */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 p-1 rounded-md border ${
                  isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-ink-900 border-ink-800'
                }`}>
                  <button
                    onClick={() => setSurahsDisplayMode('stacked')}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                      surahsDisplayMode === 'stacked'
                        ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold border border-[#2FA89D]/40')
                        : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200')
                    }`}
                  >
                    تراكمي (Stacked)
                  </button>
                  <button
                    onClick={() => setSurahsDisplayMode('grouped')}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                      surahsDisplayMode === 'grouped'
                        ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold border border-[#2FA89D]/40')
                        : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200')
                    }`}
                  >
                    مقارن (Grouped)
                  </button>
                </div>
              </div>
            </div>

            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} vertical={false} />
                  <XAxis 
                    dataKey="shortLabel" 
                    stroke={isLight ? '#53605E' : '#8FA09C'}
                    fontSize={11}
                    tick={{ fill: isLight ? '#0F1419' : '#C7CEC9', fontFamily: 'Amiri', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <YAxis stroke={isLight ? '#53605E' : '#8FA09C'} fontSize={11} />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) => [`${value} سورة`, name]}
                    labelFormatter={(label: any) => `العنقود ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }}
                  />
                  <Bar 
                    dataKey="مكية" 
                    fill="#B8935F" 
                    stackId={surahsDisplayMode === 'stacked' ? 'a' : undefined} 
                    radius={surahsDisplayMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="مدنية" 
                    fill="#1A5C5C" 
                    stackId={surahsDisplayMode === 'stacked' ? 'a' : undefined} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={`p-3 rounded-lg border text-xs leading-relaxed font-mono flex items-start gap-2 ${
              isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#264340]' : 'bg-[#10211F] border-[#264340] text-ink-700 dark:text-ink-300'
            }`}>
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>الملاحظة الإحصائية للنزول:</strong> ينقلب التوازن الزمني بصورة جذرية؛ فالعنقود الأول (البقرة، آل عمران، النساء) مدني بنسبة 100%، بينما يتحول العنقود الثالث والرابع والخامس إلى هيمنة مكية شبه كاملة، وصولاً إلى المفصل (64 سورة) الذي يضم 48 سورة مكية و16 سورة مدنية.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHART 3: TEXT VOLUME (Pie + Bar comparison) */}
        {/* ========================================================================= */}
        {activeChartTab === 'volume' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-bold ${isLight ? 'text-[#0F1419]' : 'text-ink-800 dark:text-ink-200'}`}>
                مقارنة الكتلة النصية: نسبة الكلمات مقابل نسبة الآيات من كامل القرآن
              </span>
              <span className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>
                مجموع الكلمات: 77,797 كلمة • مجموع الآيات: 6,236 آية
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Bar comparison on Left */}
              <div className="lg:col-span-8 h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} vertical={false} />
                    <XAxis 
                      dataKey="shortLabel" 
                      stroke={isLight ? '#53605E' : '#8FA09C'}
                      fontSize={11}
                      tick={{ fill: isLight ? '#0F1419' : '#C7CEC9', fontFamily: 'Amiri', fontSize: 12, fontWeight: 'bold' }}
                    />
                    <YAxis stroke={isLight ? '#53605E' : '#8FA09C'} fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      formatter={(val: any, name: any) => [`${val}% من المصحف`, name]}
                      labelFormatter={(label: any) => `العنقود ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }} />
                    <Bar dataKey="حصة الكلمات %" fill="#1A5C5C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="حصة الآيات %" fill="#B8935F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Chart on Right */}
              <div className={`lg:col-span-4 h-72 w-full flex flex-col items-center justify-center p-2 rounded-xl border ${
                isLight ? 'bg-[#FAF6EC] border-[#E8DEC8]' : 'bg-[#0E1A18] border-[#264340]'
              }`} dir="ltr">
                <span className={`text-center text-[11px] font-mono mb-1 font-bold ${
                  isLight ? 'text-[#0F1419]' : 'text-ink-700 dark:text-ink-300'
                }`}>
                  توزيع كلمات المصحف على الختمة الأسبوعية
                </span>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={pieWordsData}
                      dataKey="value"
                      nameKey="shortName"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {pieWordsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={tooltipStyle}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString()} كلمة (${item.payload.percentage}%)`,
                        item.payload.name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <span className={`text-[10px] font-mono ${isLight ? 'text-[#7B8885]' : 'text-ink-500'}`}>
                  انقر على الأقسام لمعاينة التفاصيل
                </span>
              </div>
            </div>

            <div className={`p-3 rounded-lg border text-xs leading-relaxed font-mono ${
              isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#264340]' : 'bg-[#10211F] border-[#264340] text-ink-700 dark:text-ink-300'
            }`}>
              <strong>المفارقة الرقمية العجيبة:</strong> العنقود الأول يضم <strong className="text-[#1A5C5C] dark:text-emerald-400 font-bold">3 سور فقط (2.6% من السور)</strong> لكنها تستحوذ على <strong className="text-emerald-700 dark:text-emerald-300 font-bold">22.4% من كلمات القرآن الكريم!</strong> بينما العنقود السابع (المفصل) يضم <strong className="text-amber-600 dark:text-amber-400 font-bold">64 سورة (56.1% من السور)</strong> لكنها تمثل <strong className="text-amber-700 dark:text-amber-300 font-bold">13.9% فقط من كلمات القرآن!</strong>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHART 4: INTRA-CLUSTER COHESION */}
        {/* ========================================================================= */}
        {activeChartTab === 'cohesion' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-bold ${isLight ? 'text-[#0F1419]' : 'text-ink-800 dark:text-ink-200'}`}>
                معامل التجانس الداخلي للعناقيد (متوسط تشابه جيب التمام للبصمة الحرفية)
              </span>
              <span className="text-emerald-500 font-bold text-[11px]">الحد الأدنى لجميع العناقيد يفوق 93%</span>
            </div>

            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} vertical={false} />
                  <XAxis 
                    dataKey="shortLabel" 
                    stroke={isLight ? '#53605E' : '#8FA09C'}
                    fontSize={11}
                    tick={{ fill: isLight ? '#0F1419' : '#C7CEC9', fontFamily: 'Amiri', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <YAxis stroke={isLight ? '#53605E' : '#8FA09C'} fontSize={11} domain={[85, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val}% نسبة التجانس الداخلي`, 'التجانس']}
                    labelFormatter={(label: any) => `العنقود ${label}`}
                  />
                  <Bar dataKey="درجة التجانس %" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={`p-3 rounded-lg border text-xs leading-relaxed font-mono flex items-start gap-2 ${
              isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#264340]' : 'bg-[#10211F] border-[#264340] text-ink-700 dark:text-ink-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>برهان وحدة النظم:</strong> بالرغم من تباين أطوال السور واختلاف موضوعاتها، فإن درجة التجانس الداخلي (Intra-Cluster Cohesion) لسور كل حزب تتراوح بين <strong className="text-emerald-600 dark:text-emerald-300 font-bold">93.5% و 98.2%</strong>، وهو ما يبرهن رياضياً على تآخي هذه السور وتجانس بصماتها الحرفية.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHART 5: TOP 10 WORDS PER CLUSTER */}
        {/* ========================================================================= */}
        {activeChartTab === 'topWords' && (
          <SahabaClusterWordsAnalysis 
            surahs={surahs}
            onSelectSurah={onSelectSurah}
          />
        )}

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE DRILL-DOWN: EXPLORE SURAHS IN A SELECTED CLUSTER */}
      {/* ========================================================================= */}
      <div className={`rounded-xl p-4 sm:p-5 shadow-xs space-y-4 border transition-colors ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
      }`}>
        
        {/* Drill-down Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
          isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
        }`}>
          <div>
            <h4 className={`text-sm font-bold flex items-center gap-2 font-heading ${
              isLight ? 'text-[#0F1419]' : 'text-ink-900 dark:text-ink-100'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedClusterStats.clusterDef.color }}></span>
              <span>مستكشف سور العنقود التفاعلي: {selectedClusterStats.clusterDef.name} ({selectedClusterStats.clusterDef.traditionalLabel})</span>
            </h4>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}`}>
              {selectedClusterStats.clusterDef.subtitle} • انقر على أي عمود لفتح السورة وتحليلها
            </p>
          </div>

          {/* Cluster Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {clustersStats.map(stat => {
              const c = stat.clusterDef;
              const isSelected = selectedClusterId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClusterId(c.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all border cursor-pointer ${
                    isSelected
                      ? (isLight ? 'bg-[#1A5C5C] text-white border-[#1A5C5C] font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] border-[#2FA89D]/60 font-bold shadow-xs')
                      : (isLight ? 'bg-[#FAF6EC] text-[#53605E] border-[#E8DEC8] hover:text-[#0F1419]' : 'bg-[#10211F] text-ink-600 dark:text-ink-400 border-[#264340] hover:text-ink-800 dark:hover:text-ink-200')
                  }`}
                >
                  <span>{c.id}: {c.traditionalLabel}</span>
                  {c.id === 6 && <span className="text-[9px] text-green-600 dark:text-green-300 ml-1 font-bold">(ق)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metric Selector for Surah Drill-down */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'}>المقياس المعروض:</span>
            <div className={`flex items-center gap-1 p-0.5 rounded-md border ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-ink-900 border-ink-800'
            }`}>
              <button
                onClick={() => setSurahMetric('words')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  surahMetric === 'words'
                    ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold')
                    : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400')
                }`}
              >
                عدد الكلمات
              </button>
              <button
                onClick={() => setSurahMetric('ayahs')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  surahMetric === 'ayahs'
                    ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold')
                    : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400')
                }`}
              >
                عدد الآيات
              </button>
              <button
                onClick={() => setSurahMetric('avgWords')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer ${
                  surahMetric === 'avgWords'
                    ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-xs' : 'bg-[#16534E] text-[#5EEAD4] font-bold')
                    : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-600 dark:text-ink-400')
                }`}
              >
                متوسط الكلمات/آية
              </button>
            </div>
          </div>

          <div className={`flex items-center gap-2 text-[11px] hidden sm:flex ${
            isLight ? 'text-[#53605E]' : 'text-ink-600 dark:text-ink-400'
          }`}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1A5C5C]"></span>
              <span>مكية</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>مدنية</span>
            </span>
            {selectedClusterId === 6 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 ring-1 ring-green-300"></span>
                <span className="text-green-600 dark:text-green-300 font-bold">سورة ق</span>
              </span>
            )}
          </div>
        </div>

        {/* Detailed Surah Bar Chart */}
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={drillDownSurahsData} 
              margin={{ top: 10, right: 10, left: -15, bottom: selectedClusterId === 7 ? 40 : 25 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  const s = e.activePayload[0].payload.surah;
                  if (s) onSelectSurah(s);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} vertical={false} />
              <XAxis 
                dataKey="displayName" 
                stroke={isLight ? '#53605E' : '#8FA09C'}
                fontSize={selectedClusterId === 7 ? 8 : 10}
                interval={selectedClusterId === 7 ? 2 : 0}
                angle={selectedClusterId === 7 ? -45 : 0}
                textAnchor={selectedClusterId === 7 ? 'end' : 'middle'}
                tick={{ fill: isLight ? '#0F1419' : '#C7CEC9', fontFamily: 'Amiri', fontWeight: 'bold' }}
              />
              <YAxis stroke={isLight ? '#53605E' : '#8FA09C'} fontSize={10} />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload;
                  if (surahMetric === 'words') return [`${Number(val).toLocaleString()} كلمة`, 'إجمالي الكلمات'];
                  if (surahMetric === 'ayahs') return [`${val} آية`, 'إجمالي الآيات'];
                  return [`${val} كلمة/آية`, 'متوسط طول الآية'];
                }}
                labelFormatter={(label: any, payload: any) => {
                  if (payload && payload.length > 0) {
                    const p = payload[0].payload;
                    return `${formatSurahName(p.name)} (${p.isMeccan ? 'مكية' : 'مدنية'}) - رقم ${p.number}`;
                  }
                  return label;
                }}
              />
              <Bar 
                dataKey={surahMetric === 'words' ? 'words' : (surahMetric === 'ayahs' ? 'ayahs' : 'avgWords')} 
                radius={[3, 3, 0, 0]}
                cursor="pointer"
              >
                {drillDownSurahsData.map((entry, index) => (
                  <Cell 
                    key={`cell-drill-${index}`} 
                    fill={entry.color} 
                    stroke={entry.isQaf ? (isLight ? '#15803D' : '#ffffff') : undefined}
                    strokeWidth={entry.isQaf ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Cluster Footer Summary */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border text-xs font-mono ${
          isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#264340]' : 'bg-[#10211F] border-[#264340] text-ink-700 dark:text-ink-300'
        }`}>
          <div className="flex items-center gap-3">
            <span><strong>إجمالي السور:</strong> {selectedClusterStats.totalSurahs}</span>
            <span><strong>الآيات:</strong> {selectedClusterStats.totalAyahs.toLocaleString()}</span>
            <span><strong>الكلمات:</strong> {selectedClusterStats.totalWords.toLocaleString()}</span>
          </div>

          <div className={`text-[11px] font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-700 dark:text-emerald-400'}`}>
            انقر على أي سورة في الرسم البياني لمعاينة بصمتها وتحليل حروفها
          </div>
        </div>

      </div>

    </div>
  );
};

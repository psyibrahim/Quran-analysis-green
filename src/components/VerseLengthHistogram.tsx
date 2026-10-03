import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  BarChart2, 
  Waves, 
  Sparkles, 
  Info, 
  Layers, 
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SurahData, QuranAyah } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatSurahName } from '../utils/arabic';
import { ChartMidpointMarker } from './ChartMidpointMarker';

interface VerseLengthHistogramProps {
  surah: SurahData;
  ayahs?: QuranAyah[];
}

interface LengthBin {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export const VerseLengthHistogram: React.FC<VerseLengthHistogramProps> = ({
  surah,
  ayahs = []
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [metricType, setMetricType] = useState<'words' | 'chars'>('words');
  const [viewMode, setViewMode] = useState<'histogram' | 'sequence'>('histogram');

  // Compute lengths array for all ayahs
  const verseLengths = useMemo(() => {
    if (ayahs && ayahs.length > 0) {
      return ayahs.map(a => {
        const words = a.textSimple.trim().split(/\s+/).filter(w => /[\u0621-\u064A\u0671\u0670]/.test(w)).length;
        const chars = a.textSimple.replace(/[\s\u064B-\u0652\u0670\u06D6-\u06ED]/g, '').length;
        return {
          verseNumber: a.numberInSurah,
          words,
          chars,
          textUthmani: a.textUthmani
        };
      });
    }
    // Fallback if ayahs not passed
    return [];
  }, [ayahs]);

  // Statistical calculations
  const stats = useMemo(() => {
    const vals = verseLengths.map(v => metricType === 'words' ? v.words : v.chars);
    if (vals.length === 0) {
      return {
        mean: metricType === 'words' ? surah.avgAyahLengthWords : surah.avgAyahLengthChars,
        median: 0,
        stdDev: surah.verseLengthStdDev,
        cv: 0,
        min: metricType === 'words' ? surah.ayahs.shortestAyah.wordCount : surah.ayahs.shortestAyah.charCount,
        max: metricType === 'words' ? surah.ayahs.longestAyah.wordCount : surah.ayahs.longestAyah.charCount,
        uniformityText: surah.isUniform ? 'إيقاع فائق التماثل والانتظام' : 'إيقاع تعبيري متدرج التنوع'
      };
    }

    const n = vals.length;
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = Number((sum / n).toFixed(2));

    const sorted = [...vals].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));
    const cv = mean > 0 ? Number(((stdDev / mean) * 100).toFixed(1)) : 0;

    let uniformityText = 'إيقاع فائق التماثل والانتظام';
    if (cv > 65) {
      uniformityText = 'تنوع تركيبي ومقاطع ممتدة';
    } else if (cv > 35) {
      uniformityText = 'إيقاع متدرج ومتوازن';
    }

    return {
      mean,
      median,
      stdDev,
      cv,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      uniformityText
    };
  }, [verseLengths, metricType, surah]);

  // Generate dynamic histogram bins based on values
  const binsData = useMemo(() => {
    if (verseLengths.length === 0) {
      // Fallback to surah.ayahs.histogramBins
      return (surah.ayahs?.histogramBins || []).map(b => ({
        ...b,
        percentage: Number(((b.count / Math.max(1, surah.totalAyahs)) * 100).toFixed(1))
      }));
    }

    const vals = verseLengths.map(v => metricType === 'words' ? v.words : v.chars);
    const maxVal = Math.max(...vals);

    let binStep = 5;
    if (metricType === 'words') {
      if (maxVal > 80) binStep = 15;
      else if (maxVal > 40) binStep = 10;
      else if (maxVal > 20) binStep = 5;
      else binStep = 3;
    } else {
      if (maxVal > 400) binStep = 60;
      else if (maxVal > 200) binStep = 30;
      else if (maxVal > 100) binStep = 20;
      else binStep = 10;
    }

    const numBins = Math.min(12, Math.max(4, Math.ceil(maxVal / binStep)));
    const bins: LengthBin[] = [];

    for (let i = 0; i < numBins; i++) {
      const min = i * binStep + 1;
      const max = (i + 1) * binStep;
      const count = vals.filter(v => v >= min && v <= max).length;
      const rangeLabel = i === numBins - 1 && max < maxVal 
        ? `${min}+` 
        : `${min}-${max}`;

      bins.push({
        range: rangeLabel,
        min,
        max,
        count,
        percentage: Number(((count / vals.length) * 100).toFixed(1))
      });
    }

    return bins;
  }, [verseLengths, metricType, surah]);

  return (
    <div className="sci-bg sci-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm transition-colors duration-200">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            <span>المدرج الإحصائي لتوزيع أطوال الآيات (Verse Length Distribution)</span>
          </h3>
          <p className="text-[11px] text-[var(--color-text-secondary)] font-mono">
            تحليل النزعة المركزية والانحراف المعياري لبيان مدى انتظام الإيقاع التركيبي في {formatSurahName(surah.name)}
          </p>
        </div>

        {/* View & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          
          {/* Unit Toggle: Words vs Chars */}
          <div className="flex items-center bg-[var(--color-surface-secondary)] p-0.5 rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setMetricType('words')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                metricType === 'words'
                  ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              طول بالكلمات
            </button>
            <button
              onClick={() => setMetricType('chars')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                metricType === 'chars'
                  ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              طول بالحروف
            </button>
          </div>

          {/* Mode Toggle: Bins vs Sequence */}
          <div className="flex items-center bg-[var(--color-surface-secondary)] p-0.5 rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode('histogram')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                viewMode === 'histogram'
                  ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              مدرج تكراري
            </button>
            {verseLengths.length > 0 && (
              <button
                onClick={() => setViewMode('sequence')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  viewMode === 'sequence'
                    ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)] font-bold'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                المسار الإيقاعي المتسلسل
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Statistical Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
        <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-primary)] uppercase font-bold">المتوسط الحسابي (μ)</div>
          <div className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">
            {stats.mean} {metricType === 'words' ? 'كلمة' : 'حرف'}
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">معدل طول الآية</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-primary)] uppercase font-bold">الوسيط الإحصائي (M)</div>
          <div className="text-base font-bold text-teal-800 dark:text-teal-300 mt-0.5">
            {stats.median} {metricType === 'words' ? 'كلمة' : 'حرف'}
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">القيمة المنصفة للأطوال</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-primary)] uppercase font-bold">الانحراف المعياري (σ)</div>
          <div className="text-base font-bold text-green-800 dark:text-green-300 mt-0.5">
            ± {stats.stdDev}
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">مقياس التشتت حول الوسط</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-primary)] uppercase font-bold">معامل التشتت (CV)</div>
          <div className="text-base font-bold text-amber-800 dark:text-amber-300 mt-0.5">
            {stats.cv}%
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">نسبة الانحراف للمتوسط</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-primary)] uppercase font-bold">المدى (الأدنى ← الأقصى)</div>
          <div className="text-base font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
            {stats.min} ← {stats.max}
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">{metricType === 'words' ? 'كلمة' : 'حرف'}</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-primary)] uppercase font-bold">مؤشر الانتظام</div>
          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mt-0.5 truncate">
            {stats.uniformityText}
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">
            {stats.cv < 35 ? 'تناغم إيقاعي عالي' : 'تنوع تركيبي بلاغي'}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded-xl p-3 sm:p-4">
        
        {viewMode === 'histogram' ? (
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] mb-2">
              <span>الفئات الإحصائية (طول الآية بـ {metricType === 'words' ? 'الكلمات' : 'الحروف'})</span>
              <span className="text-[var(--color-primary)] font-semibold">عدد الآيات الواقعة في كل فئة</span>
            </div>

            <div className="h-60 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={binsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="range" 
                    stroke={isLight ? '#53605E' : '#97A8A3'} 
                    fontSize={10} 
                  />
                  <YAxis 
                    stroke={isLight ? '#53605E' : '#97A8A3'} 
                    fontSize={10} 
                    allowDecimals={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLight ? '#FFFFFF' : '#10211F', 
                      borderColor: isLight ? '#C7CEC9' : '#3A4A47', 
                      borderRadius: '8px', 
                      color: isLight ? '#10211F' : '#F8F6EF',
                      fontSize: '11px',
                      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                      textAlign: 'right',
                      direction: 'rtl',
                      boxShadow: isLight ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} آية (${item.payload.percentage}% من السورة)`,
                      'العدد'
                    ]}
                    labelFormatter={(lbl) => `فئة الطول: ${lbl} ${metricType === 'words' ? 'كلمة' : 'حرف'}`}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {binsData.map((entry, index) => {
                      const isDominant = entry.count === Math.max(...binsData.map(b => b.count));
                      return (
                        <Cell 
                          key={`cell-bin-${index}`} 
                          fill={isDominant ? (isLight ? '#C5A16A' : '#52C592') : entry.count > 0 ? '#1A5C5C' : isLight ? '#DED8C9' : '#1B302D'} 
                        />
                      );
                    })}
                  </Bar>
                  {binsData.length > 0 && (
                    <ChartMidpointMarker 
                      y={Math.round(Math.max(...binsData.map(b => b.count), 1) / 2)}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-text-secondary)] mb-2">
              <span>مسار أطوال الآيات المتسلسل (من الآية 1 إلى {surah.totalAyahs})</span>
              <span className="text-[var(--color-primary)] font-semibold">تغير الطول عبر متن السورة</span>
            </div>

            <div className="h-60 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={verseLengths} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="verseNumber" 
                    stroke={isLight ? '#53605E' : '#97A8A3'} 
                    fontSize={10} 
                    tickFormatter={(v) => `آية ${v}`}
                  />
                  <YAxis 
                    stroke={isLight ? '#53605E' : '#97A8A3'} 
                    fontSize={10} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLight ? '#FFFFFF' : '#10211F', 
                      borderColor: isLight ? '#C7CEC9' : '#3A4A47', 
                      borderRadius: '8px', 
                      color: isLight ? '#10211F' : '#F8F6EF',
                      fontSize: '11px',
                      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                      textAlign: 'right',
                      direction: 'rtl'
                    }}
                    formatter={(val: any) => [
                      `${val} ${metricType === 'words' ? 'كلمة' : 'حرف'}`,
                      'طول الآية'
                    ]}
                    labelFormatter={(v) => `الآية رقم ${v}`}
                  />
                  <ReferenceLine 
                    y={stats.mean} 
                    stroke={isLight ? '#B45309' : '#f59e0b'} 
                    strokeDasharray="3 3" 
                    label={{ 
                       value: `المتوسط μ = ${stats.mean}`, 
                      fill: isLight ? '#B45309' : '#f59e0b', 
                      fontSize: 10,
                      position: 'insideTopLeft' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={metricType === 'words' ? 'words' : 'chars'} 
                    stroke={isLight ? '#1A5C5C' : '#2FA89D'} 
                    fill={isLight ? 'rgba(26, 92, 92, 0.18)' : 'rgba(47, 168, 157, 0.2)'} 
                    strokeWidth={2}
                  />
                  {verseLengths.length > 0 && (
                    <ChartMidpointMarker 
                      y={Math.round((stats.max || 1) / 2)}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="text-[10px] text-[var(--color-text-secondary)] font-mono text-center mt-2 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C5A16A] dark:bg-[#52C592] inline-block"></span>
            الفئة الأكثر شيوعاً في السورة (المنوال)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1A5C5C] inline-block"></span>
            الفئات الفرعية
          </span>
        </div>
      </div>

    </div>
  );
};

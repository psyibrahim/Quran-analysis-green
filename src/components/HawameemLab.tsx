import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  BarChart3, 
  Table, 
  Sparkles, 
  Download, 
  Printer, 
  BookOpen, 
  Eye, 
  Layers, 
  TrendingUp, 
  Quote, 
  Scale, 
  Activity,
  Compass,
  ArrowUpDown
} from 'lucide-react';
import { SurahData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { 
  computeHawameemReport, 
  HAWAMEEM_SURAH_NUMBERS,
  HAWAMEEM_METADATA 
} from '../utils/hawameemData';
import { HawameemHeatmap } from './HawameemHeatmap';
import { HawameemCharts } from './HawameemCharts';
import { HawameemMatrix } from './HawameemMatrix';
import { HawameemOpenings } from './HawameemOpenings';
import { formatSurahName, ARABIC_LETTERS } from '../utils/arabic';

interface HawameemLabProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onCompareWith?: (surahNumber: number) => void;
  view?: HawameemSubTab;
}

export type HawameemSubTab = 'heatmap' | 'charts' | 'matrix' | 'openings';

const HawameemLabComponent: React.FC<HawameemLabProps> = ({
  surahs,
  letterStats,
  onSelectSurah,
  onOpenInReader,
  onCompareWith,
  view = 'heatmap'
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { activeMushaf } = useQuranCorpus();

  const activeSubTab = view;

  // Compute comprehensive aggregate statistics for the 7 Hawameem
  const report = useMemo(() => {
    return computeHawameemReport(surahs, letterStats);
  }, [surahs, letterStats]);

  // CSV Export for Hawameem
  const handleExportCSV = () => {
    const headers = [
      'SurahNumber', 'SurahName', 'Verses', 'Words', 'Chars', 
      'VocabDiversity', 'HaCount', 'HaPct', 'MeemCount', 'MeemPct', 'HaPlusMeemCount', 'HaPlusMeemPct',
      ...ARABIC_LETTERS.map(c => `Letter_${c}`)
    ];

    const rows = report.surahs.map(s => {
      const lStat = report.hawameemLettersStats.find(x => x.surahNumber === s.number);
      const row = [
        s.number,
        `"${s.name}"`,
        s.totalAyahs,
        s.totalWords,
        s.totalChars,
        s.vocabularyDiversity.toFixed(2),
        lStat?.haCount || 0,
        lStat?.haPercentage || 0,
        lStat?.meemCount || 0,
        lStat?.meemPercentage || 0,
        lStat?.haPlusMeemCount || 0,
        lStat?.haPlusMeemPercentage || 0,
        ...ARABIC_LETTERS.map(c => lStat?.letterCounts[c] || 0)
      ];
      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hawameem_statistical_report_${activeMushaf}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner & Identity */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-colors shadow-sm ${
        isLight 
          ? 'bg-white border-ink-200/90' 
          : 'bg-ink-900/90 border-ink-800'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center font-heading text-xl shadow-inner border border-amber-500/30">
                حم
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-900 dark:text-white font-heading">
                مختبر مقارنة سور الحواميم السبع (آل حـم)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                السور 40 — 46
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-400 leading-relaxed max-w-4xl">
              دراسة إحصائية وتحليلية مقارنة للسور السبع المتتالية (غافر، فصلت، الشورى، الزخرف، الدخان، الجاثية، الأحقاف):
              البصمة الحرفية، الخريطة الحرارية، معلم بياني ورسوم إحصائية، والنسق الإيقاعي لفواتح التنزيل.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 border border-ink-200 dark:border-ink-700 flex items-center gap-1.5 cursor-pointer transition-all"
              title="تصدير بيانات الحواميم إلى ملف CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-emerald-400" />
              تصدير CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 border border-ink-200 dark:border-ink-700 flex items-center gap-1.5 cursor-pointer transition-all"
              title="طباعة التقرير"
            >
              <Printer className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-emerald-400" />
              طباعة
            </button>
          </div>
        </div>

        {/* 2. Macro Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-ink-200 dark:border-ink-800/80">
          {/* Card 1 */}
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950/50 border-ink-800'
          }`}>
            <div className={`text-[11px] font-bold mb-1 ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
              السور والموقع
            </div>
            <div className={`text-base font-bold font-mono ${isLight ? 'text-ink-950' : 'text-white'}`}>
              7 سور مكية
            </div>
            <div className={`text-[10px] mt-0.5 ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
              متوالية (40 إلى 46)
            </div>
          </div>

          {/* Card 2 */}
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950/50 border-ink-800'
          }`}>
            <div className={`text-[11px] font-bold mb-1 ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
              مجموع الآيات
            </div>
            <div className={`text-base font-bold font-mono ${isLight ? 'text-ink-950' : 'text-white'}`}>
              {report.totalHawameemVerses.toLocaleString()} آية
            </div>
            <div className={`text-[10px] mt-0.5 ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
              {activeMushaf === 'madani' ? 'بالعد المدني (ورش)' : 'بالعد الكوفي (حفص)'}
            </div>
          </div>

          {/* Card 3 */}
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950/50 border-ink-800'
          }`}>
            <div className={`text-[11px] font-bold mb-1 ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
              الكلمات والحروف
            </div>
            <div className={`text-base font-bold font-mono ${isLight ? 'text-ink-950' : 'text-white'}`}>
              {report.totalHawameemWords.toLocaleString()} كلمة
            </div>
            <div className={`text-[10px] mt-0.5 font-mono ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
              {report.totalHawameemLetters.toLocaleString()} حرفاً
            </div>
          </div>

          {/* Card 4 */}
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/30 border-emerald-900/50'
          }`}>
            <div className={`text-[11px] font-bold mb-1 flex items-center justify-between ${
              isLight ? 'text-emerald-900' : 'text-emerald-400'
            }`}>
              <span>تكرار حرف (ح)</span>
              <span className="font-heading text-sm">ح</span>
            </div>
            <div className={`text-base font-bold font-mono ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
              {report.totalHawameemHa.toLocaleString()}
            </div>
            <div className={`text-[10px] mt-0.5 font-mono ${isLight ? 'text-emerald-800' : 'text-emerald-400/80'}`}>
              {report.avgHawameemHaPct}% (معدل المصحف {report.quranGlobalHaPct}%)
            </div>
          </div>

          {/* Card 5 */}
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/30 border-amber-900/50'
          }`}>
            <div className={`text-[11px] font-bold mb-1 flex items-center justify-between ${
              isLight ? 'text-amber-900' : 'text-amber-400'
            }`}>
              <span>تكرار حرف (م)</span>
              <span className="font-heading text-sm">م</span>
            </div>
            <div className={`text-base font-bold font-mono ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
              {report.totalHawameemMeem.toLocaleString()}
            </div>
            <div className={`text-[10px] mt-0.5 font-mono ${isLight ? 'text-amber-800' : 'text-amber-400/80'}`}>
              {report.avgHawameemMeemPct}% (معدل المصحف {report.quranGlobalMeemPct}%)
            </div>
          </div>

          {/* Card 6 */}
          <div className={`p-3 rounded-xl border ${
            isLight ? 'bg-teal-50 border-teal-300' : 'bg-teal-950/40 border-teal-900/50'
          }`}>
            <div className={`text-[11px] font-bold mb-1 flex items-center justify-between ${
              isLight ? 'text-teal-900' : 'text-teal-400'
            }`}>
              <span>مجموع (ح + م)</span>
              <span className="font-bold text-xs">حم</span>
            </div>
            <div className={`text-base font-extrabold font-mono ${isLight ? 'text-teal-950' : 'text-teal-300'}`}>
              {report.totalHawameemHaPlusMeem.toLocaleString()}
            </div>
            <div className={`text-[10px] mt-0.5 font-mono ${isLight ? 'text-teal-800' : 'text-teal-400/80'}`}>
              تمثل {report.avgHawameemHaPlusMeemPct}% من الحصيلة
            </div>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      <div>
        {activeSubTab === 'heatmap' && (
          <HawameemHeatmap 
            report={report} 
            letterStats={letterStats}
            onSelectSurah={onSelectSurah}
            onOpenInReader={onOpenInReader}
          />
        )}

        {activeSubTab === 'charts' && (
          <HawameemCharts 
            report={report}
            letterStats={letterStats}
          />
        )}

        {activeSubTab === 'matrix' && (
          <HawameemMatrix 
            report={report}
            activeMushaf={activeMushaf}
            onSelectSurah={onSelectSurah}
            onOpenInReader={onOpenInReader}
            onCompareWith={onCompareWith}
          />
        )}

        {activeSubTab === 'openings' && (
          <HawameemOpenings 
            report={report}
            onOpenInReader={onOpenInReader}
            onSelectSurah={onSelectSurah}
          />
        )}
      </div>
    </div>
  );
};

export const HawameemLab = React.memo(HawameemLabComponent);

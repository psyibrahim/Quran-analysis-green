// src/components/SahabaClustersView.tsx
// الواجهة التفاعلية المتطورة لعناقيد تحزيب الصحابة السبعة واستقلال الفاتحة ووضع سورة ق في العنقود قبل الأخير

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  BookOpen, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  TrendingDown, 
  BarChart3, 
  Grid, 
  Table as TableIcon, 
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Search,
  ExternalLink,
  Flame
} from 'lucide-react';
import { SurahData, LetterStatsData } from '../types';
import { SAHABA_CLUSTERS, AL_FATIHAH_META, computeClusterStats, SahabaClusterDef } from '../data/sahabaClusters';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { ClusteringMethodologyExplainer } from './ClusteringMethodologyExplainer';
import { SahabaClustersCharts } from './SahabaClustersCharts';
import { SahabaLetterHeatmap } from './SahabaLetterHeatmap';
import { SahabaClusterWordsAnalysis } from './SahabaClusterWordsAnalysis';
import { formatSurahName } from '../utils/arabic';

interface SahabaClustersViewProps {
  surahs: SurahData[];
  similarityMatrix?: number[][];
  letterStats?: LetterStatsData;
  onSelectSurah: (surah: SurahData) => void;
  onCompare?: (surah1: number, surah2: number) => void;
}

export const SahabaClustersView: React.FC<SahabaClustersViewProps> = ({
  surahs,
  similarityMatrix,
  letterStats: propsLetterStats,
  onSelectSurah,
  onCompare
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { letterStats: ctxLetterStats } = useQuranCorpus();
  const letterStats = propsLetterStats || ctxLetterStats;

  const [viewMode, setViewMode] = useState<'charts' | 'heatmap' | 'words' | 'cards' | 'table'>('charts');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fatihah Surah Data
  const fatihahSurah = useMemo(() => {
    return surahs.find(s => s.number === 1) || surahs[0];
  }, [surahs]);

  // Compute stats for all 7 clusters
  const clustersStats = useMemo(() => {
    return SAHABA_CLUSTERS.map(cDef => computeClusterStats(cDef, surahs, similarityMatrix));
  }, [surahs, similarityMatrix]);

  // Total summary across the 7 clusters
  const totalQuranWords = useMemo(() => surahs.reduce((sum, s) => sum + s.totalWords, 0) || 77797, [surahs]);
  const totalQuranAyahs = useMemo(() => surahs.reduce((sum, s) => sum + s.totalAyahs, 0) || 6236, [surahs]);

  // Filtered surahs when user searches
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    return surahs.filter(s => 
      s.name.includes(q) || 
      s.englishName.toLowerCase().includes(q) || 
      s.number.toString() === q
    );
  }, [surahs, searchQuery]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Top Banner: Concept & Rule Header */}
      <div className={`rounded-xl p-4 sm:p-5 shadow-xs space-y-3 border transition-colors ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 ${
          isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              isLight ? 'bg-[#1A5C5C]/10 border-[#1A5C5C]/30 text-[#1A5C5C]' : 'bg-[#1A5C5C]/25 border-[#1A5C5C]/40 text-[#52C592]'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 font-heading ${
                isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'
              }`}>
                <span>العناقيد السبعة الكبرى (تحزيب الصحابة المأثور)</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border-[#E8DEC8]' : 'bg-[#2A2416] text-[#E0C088] border-[#3D331D]'
                }`}>
                  7 أحزاب قرآنية
                </span>
              </h3>
              <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                توزيع السور الـ 114 وفق هدي الصحابة في تجزئة المصحف (فَمِي بِشَوْقٍ)، مع خصوصية استقلال الفاتحة وضم (ق) للعنقود السادس
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className={`flex flex-wrap items-center gap-1.5 self-start md:self-auto p-1 rounded-lg border ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'charts'
                  ? 'bg-[#1A5C5C] text-[#F7F4EA] font-bold shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>لوحة الرسوم (Recharts)</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'heatmap'
                  ? 'bg-[#1A5C5C] text-[#F7F4EA] font-bold shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>خريطة كثافة الحروف</span>
            </button>
            <button
              onClick={() => setViewMode('words')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'words'
                  ? 'bg-[#1A5C5C] text-[#F7F4EA] font-bold shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>أكثر الكلمات تكراراً (Top 10)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#1A5C5C] text-[#F7F4EA] font-bold shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>بطاقات العناقيد</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1A5C5C] text-[#F7F4EA] font-bold shadow-xs'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088] hover:bg-[#163330]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>الجدول المقارن</span>
            </button>
          </div>
        </div>

        {/* Essential Methodology Note */}
        <div className={`p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 ${
          isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#8C6D2D]' : 'bg-[#2A2416] border-[#3D331D] text-[#E0C088]'
        }`}>
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold font-heading text-[#8C6D2D] dark:text-[#E0C088]">الضوابط المنهجية للعناقيد الحالية:</span>
            <div className={`text-[11px] font-sans space-y-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              <div>1. <strong className={isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}>سورة الفاتحة:</strong> مستقلة تماماً كفاتحة وأم للكتاب، ولا تنتمي للعناقيد السبعة.</div>
              <div>2. <strong className={isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}>سورة (ق):</strong> أُدرجت هنا في <span className="underline font-bold">العنقود السادس (قبل الأخير)</span>، وتضم مجموعته 14 سورة (من الصافات إلى ق).</div>
              <div>3. <strong className={isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}>العنقود السابع (المفصل):</strong> ينطلق من سورة الذاريات (51) وحتى سورة الناس (114) ويضم 64 سورة.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Honored Card: AL-FATIHAH */}
      <div className={`rounded-xl p-4 transition-all duration-200 border-l-4 border-l-amber-500 border shadow-xs ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold font-mono text-sm shrink-0">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`font-bold text-sm sm:text-base font-heading ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                  {fatihahSurah.name} ({fatihahSurah.englishName})
                </h4>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border-[#E8DEC8]' : 'bg-[#2A2416] text-[#E0C088] border-[#3D331D]'
                }`}>
                  أم القرآن • مستقلة عن الأحزاب السبعة
                </span>
              </div>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                {AL_FATIHAH_META.note}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right font-mono text-xs hidden sm:block">
              <span className={isLight ? 'text-[#53605E]' : 'text-ink-400'}>{fatihahSurah.totalAyahs} آيات • {fatihahSurah.totalWords} كلمة • {fatihahSurah.totalChars} حرفاً</span>
            </div>
            <button
              onClick={() => onSelectSurah(fatihahSurah)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? 'bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 border border-amber-600/30'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span>فحص الفاتحة</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RECHARTS STATISTICAL DASHBOARD VIEW */}
      {viewMode === 'charts' && (
        <SahabaClustersCharts
          surahs={surahs}
          similarityMatrix={similarityMatrix}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* HEATMAP VIEW MODE */}
      {viewMode === 'heatmap' && (
        <SahabaLetterHeatmap
          surahs={surahs}
          letterStats={letterStats}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* TOP WORDS STATISTICAL TOOL VIEW */}
      {viewMode === 'words' && (
        <SahabaClusterWordsAnalysis
          surahs={surahs}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* CARDS VIEW MODE */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clustersStats.map(stat => {
              const cDef = stat.clusterDef;
              const isSelected = selectedClusterId === cDef.id;

              return (
                <div
                  key={cDef.id}
                  className={`rounded-xl p-4 space-y-3.5 shadow-xs transition-all duration-200 border-t-4 border relative flex flex-col justify-between ${
                    isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
                  } ${
                    isSelected ? (isLight ? 'ring-2 ring-[#1A5C5C]/40' : 'ring-2 ring-[#52C592]/40') : ''
                  }`}
                  style={{ borderTopColor: cDef.color }}
                >
                  {/* Card Header */}
                  <div>
                    <div className={`flex items-start justify-between gap-2 border-b pb-2.5 ${
                      isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: cDef.color }}
                        ></span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm font-heading ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                              {cDef.name}: {cDef.traditionalLabel}
                            </h4>
                            <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${
                              isLight ? 'bg-[#FAF6EC] text-[#8C6D2D] border-[#E8DEC8]' : 'bg-[#2A2416] text-[#E0C088] border-[#3D331D]'
                            }`}>
                              {stat.totalSurahs} سور
                            </span>
                          </div>
                          <span className={`text-[11px] font-mono block ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                            {cDef.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className={`text-left font-mono text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                        <span className={`font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>{stat.meccanCount}</span> مكية / <span className={`font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>{stat.medinanCount}</span> مدنية
                      </div>
                    </div>

                    {/* Description & Thematic Focus */}
                    <p className={`text-xs leading-relaxed mt-2.5 font-sans ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                      {cDef.description}
                    </p>
                  </div>

                  {/* Quantitative Metrics Ribbon */}
                  <div className={`grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg border text-center font-mono ${
                    isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
                  }`}>
                    <div>
                      <span className={`text-[10px] block ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>إجمالي الآيات</span>
                      <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                        {stat.totalAyahs.toLocaleString()}
                      </span>
                      <span className={`text-[9px] block font-sans ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>
                        ({stat.percentageOfQuranAyahs}%)
                      </span>
                    </div>

                    <div>
                      <span className={`text-[10px] block ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>إجمالي الكلمات</span>
                      <span className={`text-xs sm:text-sm font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                        {stat.totalWords.toLocaleString()}
                      </span>
                      <span className={`text-[9px] block font-sans ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>
                        ({stat.percentageOfQuranWords}%)
                      </span>
                    </div>

                    <div>
                      <span className={`text-[10px] block ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>متوسط طول الآية</span>
                      <span className="text-xs sm:text-sm font-bold text-[#1A5C5C] dark:text-[#52C592]">
                        {stat.avgAyahWords} كلمة
                      </span>
                      <span className={`text-[9px] block font-sans ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>
                        ({stat.avgAyahChars} حرف)
                      </span>
                    </div>
                  </div>

                  {/* Surahs List Chips */}
                  <div className="space-y-1.5">
                    <div className={`flex items-center justify-between text-[11px] font-mono px-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                      <span>سور العنقود ({cDef.countRule}):</span>
                      <span className="text-[10px] text-[#1A5C5C] dark:text-[#52C592]">انقر على السورة لتحليلها</span>
                    </div>

                    <div className={`flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1.5 rounded-lg border scrollbar-thin ${
                      isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
                    }`}>
                      {stat.surahs.map(s => {
                        const isSpecialQaf = s.number === 50;
                        return (
                          <button
                            key={s.number}
                            onClick={() => onSelectSurah(s)}
                            className={`px-2 py-1 rounded text-xs font-heading transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isSpecialQaf
                                ? (isLight ? 'bg-[#FAF6EC] border-[#B8935F] text-[#8C6D2D] font-bold shadow-xs' : 'bg-[#2A2416] border-[#C5A16A] text-[#E0C088] font-bold shadow-xs')
                                : (isLight ? 'bg-[#FBF9F2] hover:bg-[#F0EDE1] border-[#DED8C9] hover:border-[#1A5C5C] text-[#0F1419]' : 'bg-[#142825] hover:bg-[#163330] border-[#264340] hover:border-[#52C592] text-[#E0C088]')
                            }`}
                            title={`${formatSurahName(s.name)} - الآيات: ${s.totalAyahs} (${s.isMeccan ? 'مكية' : 'مدنية'})`}
                          >
                            <span className={`font-mono text-[9px] ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>#{s.number}</span>
                            <span>{formatSurahName(s.name)}</span>
                            <span className={`text-[9px] font-mono ${isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}`}>({s.totalAyahs})</span>
                            {isSpecialQaf && (
                              <span className="text-[8px] bg-[#B8935F]/20 text-[#8C6D2D] dark:text-[#E0C088] px-1 rounded font-mono">سورة ق</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Intra-Cluster Cohesion & Top Letters footer */}
                  <div className={`flex items-center justify-between text-[11px] font-mono border-t pt-2 ${
                    isLight ? 'border-[#EAE4D5] text-[#53605E]' : 'border-[#264340] text-[#8FA09C]'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span>التجانس الداخلي:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{stat.intraClusterCohesion}%</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <span className={isLight ? 'text-[#7B8885]' : 'text-[#7D8C87]'}>الحروف المهيمنة:</span>
                      {stat.dominantLetters.slice(0, 3).map(l => (
                        <span key={l.letter} className={`px-1 py-0.2 rounded border ${
                          isLight ? 'bg-[#F0EDE1] border-[#DED8C9] text-[#0F1419]' : 'bg-[#163330] border-[#264340] text-[#E0C088]'
                        }`}>
                          {l.letter} ({l.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE VIEW MODE: Comprehensive Rhythm & Gradient Comparison */}
      {viewMode === 'table' && (
        <div className={`rounded-xl p-4 overflow-x-auto shadow-xs border transition-colors ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <div className="mb-3">
            <h4 className={`font-bold text-sm font-heading flex items-center gap-2 ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
              <BarChart3 className="w-4 h-4 text-[#1A5C5C] dark:text-[#52C592]" />
              <span>الجدول البانورامي المقارن للأحزاب السبعة (تدرج الإيقاع والآيات)</span>
            </h4>
            <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
              لاحظ التدرج الرياضي الصارم في انخفاض متوسط طول الآية من 23.8 كلمة في العنقود الأول حتى 4.9 كلمات في المفصل!
            </p>
          </div>

          <table className="w-full text-xs font-mono text-right border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold ${
                isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#E0C088]'
              }`}>
                <th className="py-2.5 px-3 font-bold">العنقود</th>
                <th className="py-2.5 px-3 font-bold">المسمى الأثري</th>
                <th className="py-2.5 px-3 font-bold">نطاق السور</th>
                <th className="py-2.5 px-3 font-bold text-center">العدد</th>
                <th className="py-2.5 px-3 font-bold text-center">مكي / مدني</th>
                <th className="py-2.5 px-3 font-bold text-center">إجمالي الآيات</th>
                <th className="py-2.5 px-3 font-bold text-center">إجمالي الكلمات</th>
                <th className="py-2.5 px-3 font-bold text-center text-[#1A5C5C] dark:text-[#52C592]">متوسط طول الآية</th>
                <th className="py-2.5 px-3 font-bold text-center text-emerald-700 dark:text-emerald-400">التجانس الداخلي</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-[#EAE4D5]' : 'divide-[#1C423E]'}`}>
              {/* Al-Fatihah Row */}
              <tr className={isLight ? 'bg-[#FAF6EC] hover:bg-[#F5EEDB] text-[#8C6D2D] font-medium' : 'bg-[#2A2416] hover:bg-[#3D331D] text-[#E0C088] font-medium'}>
                <td className="py-2 px-3 font-bold">الفاتحة</td>
                <td className="py-2 px-3">أم القرآن</td>
                <td className="py-2 px-3 font-heading">سورة الفاتحة (1)</td>
                <td className="py-2 px-3 text-center">1</td>
                <td className="py-2 px-3 text-center">مكية</td>
                <td className="py-2 px-3 text-center">7</td>
                <td className="py-2 px-3 text-center">29</td>
                <td className="py-2 px-3 text-center font-bold">4.14 كلمة</td>
                <td className="py-2 px-3 text-center">100%</td>
              </tr>

              {clustersStats.map((stat, idx) => {
                const cDef = stat.clusterDef;
                return (
                  <tr key={cDef.id} className={isLight ? 'hover:bg-[#F7F4EA] transition-colors' : 'hover:bg-[#163330] transition-colors'}>
                    <td className={`py-2.5 px-3 font-bold flex items-center gap-2 ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cDef.color }}></span>
                      <span>{cDef.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-heading">{cDef.traditionalLabel}</td>
                    <td className={`py-2.5 px-3 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>{cDef.countRule}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{stat.totalSurahs}</td>
                    <td className={`py-2.5 px-3 text-center ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                      {stat.meccanCount} مكي / {stat.medinanCount} مدني
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {stat.totalAyahs.toLocaleString()} ({stat.percentageOfQuranAyahs}%)
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {stat.totalWords.toLocaleString()} ({stat.percentageOfQuranWords}%)
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#1A5C5C] dark:text-[#52C592]">
                      {stat.avgAyahWords} كلمة
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                      {stat.intraClusterCohesion}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Scientific Explainer Methodology for Sahaba 7-Clusters */}
      <ClusteringMethodologyExplainer className="mt-4" />

    </div>
  );
};

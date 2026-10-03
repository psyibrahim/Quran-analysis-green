// src/components/SahabaClusterWordsAnalysis.tsx
// أداة إحصائية متقدمة تعرض الكلمات الأكثر تكراراً في كل عنقود من عناقيد الصحابة السبعة
// مجهزة بكامل خصائص ومعايير تصفية وتصنيف المفردات (LexicalFilterControlPanel) 
// ومطابقة المفردات مع نص المصحف الفعلي لكل عنقود وعرض الآيات المطابقة مع إمكانية فتح السورة أو القارئ.

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Filter, 
  Layers, 
  BarChart3, 
  ChevronRight,
  Info,
  Sliders,
  Type,
  ExternalLink,
  BookMarked
} from 'lucide-react';
import { SurahData, TopWord, QuranSurahCorpus, QuranAyah } from '../types';
import { SAHABA_CLUSTERS, computeClusterStats, SahabaClusterDef } from '../data/sahabaClusters';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { 
  LexicalFilterOptions, 
  DEFAULT_LEXICAL_OPTIONS,
  stripWordPrefixes,
  normalizeOrthography,
  isWordExcluded,
  cleanArabicWord,
  MergedVariantInfo,
  WordFrequencyItem
} from '../utils/lexicalFilters';
import { LexicalFilterControlPanel } from './LexicalFilterControlPanel';
import { WordVersesModal } from './WordVersesModal';

interface SahabaClusterWordsAnalysisProps {
  surahs: SurahData[];
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
}

export interface ClusterTopWord extends WordFrequencyItem {
  clusterId: number;
  percentageInCluster: number;
  surahOccurrenceCount: number; // In how many surahs of the cluster does this word appear
  surahsList: number[];
}

export const SahabaClusterWordsAnalysis: React.FC<SahabaClusterWordsAnalysisProps> = ({
  surahs,
  onSelectSurah,
  onOpenInReader
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { corpus } = useQuranCorpus();

  const [selectedClusterId, setSelectedClusterId] = useState<number>(1);
  const [viewFormat, setViewFormat] = useState<'grid' | 'drilldown' | 'comparison'>('grid');

  // Lexical Filtering and Normalization Criteria State (Same state & controls as Single Surah Analysis)
  const [lexicalOptions, setLexicalOptions] = useState<LexicalFilterOptions>(DEFAULT_LEXICAL_OPTIONS);

  // State for opening matching verses when clicking a word
  const [selectedWordForModal, setSelectedWordForModal] = useState<{
    word: string;
    wordItem?: WordFrequencyItem;
    surahNumber: number;
    surahName: string;
    totalSurahAyahs: number;
    corpusSurah?: QuranSurahCorpus;
  } | null>(null);

  // Pre-tokenize words per surah from the active corpus to ensure high performance
  const surahsRawTokens = useMemo(() => {
    const map = new Map<number, string[]>();
    corpus.forEach(cSurah => {
      const tokens: string[] = [];
      if (cSurah.ayahs) {
        cSurah.ayahs.forEach(ayah => {
          const text = ayah.textSimple || ayah.textUthmani || '';
          const rawTokens = text.split(/\s+/);
          rawTokens.forEach(tok => {
            const cleaned = cleanArabicWord(tok);
            if (cleaned.length > 0) {
              tokens.push(cleaned);
            }
          });
        });
      }
      map.set(cSurah.number, tokens);
    });
    return map;
  }, [corpus]);

  // Compute full filtered lexical statistics for every single cluster
  const clustersAnalysisData = useMemo(() => {
    return SAHABA_CLUSTERS.map(cDef => {
      const clusterSurahs = surahs.filter(s => cDef.surahNumbers.includes(s.number));
      
      let totalOriginalTokens = 0;
      let totalFilteredTokens = 0;
      let excludedTokensCount = 0;

      // Word map: processedWord -> { count, surahsSet: Set<number>, variants: Record<string, number> }
      const filteredWordMap = new Map<string, { 
        count: number; 
        surahsSet: Set<number>; 
        variants: Record<string, number>;
      }>();

      const originalWordSet = new Set<string>();

      clusterSurahs.forEach(s => {
        const rawTokens = surahsRawTokens.get(s.number) || [];
        totalOriginalTokens += rawTokens.length;

        rawTokens.forEach(originalWord => {
          originalWordSet.add(originalWord);

          // 1. Normalization & Prefix Stripping
          let processed = stripWordPrefixes(originalWord, lexicalOptions);
          processed = normalizeOrthography(processed, lexicalOptions);

          // 2. Exclusion Check
          if (isWordExcluded(processed, lexicalOptions)) {
            excludedTokensCount++;
            return;
          }

          // Word passed all filters
          totalFilteredTokens++;
          const existing = filteredWordMap.get(processed);
          if (existing) {
            existing.count += 1;
            existing.surahsSet.add(s.number);
            existing.variants[originalWord] = (existing.variants[originalWord] || 0) + 1;
          } else {
            filteredWordMap.set(processed, {
              count: 1,
              surahsSet: new Set([s.number]),
              variants: { [originalWord]: 1 }
            });
          }
        });
      });

      // TTR Calculations
      const uniqueOriginalWords = originalWordSet.size;
      const rawTTR = totalOriginalTokens > 0 
        ? Number(((uniqueOriginalWords / totalOriginalTokens) * 100).toFixed(2)) 
        : 0;

      const uniqueFilteredWords = filteredWordMap.size;
      const filteredTTR = totalFilteredTokens > 0
        ? Number(((uniqueFilteredWords / totalFilteredTokens) * 100).toFixed(2))
        : 0;

      const activeTTR = lexicalOptions.ttrCalculationMode === 'filtered' ? filteredTTR : rawTTR;
      const displayTotalTokens = lexicalOptions.ttrCalculationMode === 'filtered' ? totalFilteredTokens : totalOriginalTokens;

      // Sort and extract Top Words according to options.sortBy and options.topWordsCount
      const allFilteredEntries: ClusterTopWord[] = Array.from(filteredWordMap.entries()).map(([word, data]) => {
        const variantList: MergedVariantInfo[] = Object.entries(data.variants)
          .map(([variant, count]) => ({ variant, count }))
          .sort((a, b) => b.count - a.count);

        const pct = displayTotalTokens > 0 
          ? Number(((data.count / displayTotalTokens) * 100).toFixed(2)) 
          : 0;

        return {
          word,
          count: data.count,
          percentage: pct,
          clusterId: cDef.id,
          percentageInCluster: pct,
          surahOccurrenceCount: data.surahsSet.size,
          surahsList: Array.from(data.surahsSet),
          mergedVariants: variantList.length > 1 ? variantList : undefined
        };
      });

      if (lexicalOptions.sortBy === 'alphabetical') {
        allFilteredEntries.sort((a, b) => a.word.localeCompare(b.word, 'ar'));
      } else {
        // Frequency descending
        allFilteredEntries.sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.word.localeCompare(b.word, 'ar');
        });
      }

      const topWords = allFilteredEntries.slice(0, lexicalOptions.topWordsCount);

      return {
        clusterDef: cDef,
        clusterSurahs,
        totalSurahs: clusterSurahs.length,
        totalOriginalTokens,
        totalFilteredTokens,
        displayTotalTokens,
        excludedTokensCount,
        uniqueOriginalWords,
        uniqueFilteredWords,
        rawTTR,
        filteredTTR,
        activeTTR,
        topWords,
        totalAvailableUniqueWords: allFilteredEntries.length
      };
    });
  }, [surahs, corpus, surahsRawTokens, lexicalOptions]);

  // Selected cluster top words data
  const activeClusterData = useMemo(() => {
    return clustersAnalysisData.find(c => c.clusterDef.id === selectedClusterId) || clustersAnalysisData[0];
  }, [clustersAnalysisData, selectedClusterId]);

  // Prepare chart data for active cluster
  const chartData = useMemo(() => {
    return activeClusterData.topWords.map(w => ({
      word: w.word,
      count: w.count,
      percentage: w.percentage,
      surahCount: w.surahOccurrenceCount,
      color: activeClusterData.clusterDef.color,
      mergedVariants: w.mergedVariants
    }));
  }, [activeClusterData]);

  // Comparison data across all 7 clusters
  const comparisonData = useMemo(() => {
    return clustersAnalysisData.map(c => ({
      clusterName: c.clusterDef.name,
      traditionalLabel: c.clusterDef.traditionalLabel,
      color: c.clusterDef.color,
      id: c.clusterDef.id,
      totalTokens: c.displayTotalTokens,
      uniqueWords: c.uniqueFilteredWords,
      ttr: c.activeTTR,
      top1: c.topWords[0] ? `${c.topWords[0].word} (${c.topWords[0].count.toLocaleString()})` : '-',
      top2: c.topWords[1] ? `${c.topWords[1].word} (${c.topWords[1].count.toLocaleString()})` : '-',
      top3: c.topWords[2] ? `${c.topWords[2].word} (${c.topWords[2].count.toLocaleString()})` : '-',
      topWords: c.topWords
    }));
  }, [clustersAnalysisData]);

  // Handler for clicking a word to view its verses in context across all surahs in the cluster
  const handleWordClick = (wordObj: ClusterTopWord) => {
    const cluster = clustersAnalysisData.find(c => c.clusterDef.id === wordObj.clusterId) || activeClusterData;
    
    // Combine ayahs from ALL surahs in this cluster
    const clusterAyahs: QuranAyah[] = [];
    let totalClusterAyahs = 0;

    cluster.clusterSurahs.forEach(s => {
      const cSurah = corpus.find(c => c.number === s.number);
      if (cSurah && cSurah.ayahs) {
        totalClusterAyahs += cSurah.ayahs.length;
        cSurah.ayahs.forEach(ayah => {
          clusterAyahs.push({
            ...ayah,
            surahNumber: s.number,
            surahName: s.name
          });
        });
      }
    });

    const compositeCorpusSurah: QuranSurahCorpus = {
      number: cluster.clusterDef.id,
      name: `${cluster.clusterDef.name} (${cluster.clusterDef.traditionalLabel})`,
      englishName: cluster.clusterDef.name,
      englishNameTranslation: cluster.clusterDef.traditionalLabel,
      revelationType: 'Meccan',
      isMeccan: true,
      totalAyahs: totalClusterAyahs,
      hasIndependentBasmalah: false,
      ayahs: clusterAyahs
    };

    setSelectedWordForModal({
      word: wordObj.word,
      wordItem: wordObj,
      surahNumber: cluster.clusterDef.id,
      surahName: `${cluster.clusterDef.name} (${cluster.clusterDef.traditionalLabel})`,
      totalSurahAyahs: totalClusterAyahs,
      corpusSurah: compositeCorpusSurah
    });
  };

  const tooltipStyle = isLight ? {
    backgroundColor: '#FAF6EC',
    borderColor: '#DED8C9',
    color: '#0F1419',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    fontFamily: 'Amiri, monospace',
    fontSize: '12px'
  } : {
    backgroundColor: '#10211F',
    borderColor: '#264340',
    color: '#E0C088',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    fontFamily: 'Amiri, monospace',
    fontSize: '12px'
  };

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 ${
          isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
              isLight ? 'bg-[#1A5C5C]/10 border-[#1A5C5C]/25 text-[#1A5C5C]' : 'bg-ink-900 border-teal-500/30 text-teal-400'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold font-heading flex items-center gap-2 ${
                isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'
              }`}>
                <span>المعجم الإحصائي وبصمة الكلمات لعناقيد الصحابة السبعة</span>
              </h3>
              <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                استكشاف التباين اللغوي، المعجمي، والمفرداتي بين الأحزاب السبعة مع تخصيص وتجريد كامل للسوابق وحروف المعاني
              </p>
            </div>
          </div>

          {/* View Format Selector */}
          <div className={`flex items-center gap-1 p-1 rounded-lg border self-start md:self-auto ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <button
              onClick={() => setViewFormat('grid')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                viewFormat === 'grid'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-400 hover:text-ink-200')
              }`}
            >
              شبكة العناقيد (7 لوحات)
            </button>
            <button
              onClick={() => setViewFormat('drilldown')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                viewFormat === 'drilldown'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-400 hover:text-ink-200')
              }`}
            >
              التحليل المفصل (Recharts)
            </button>
            <button
              onClick={() => setViewFormat('comparison')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                viewFormat === 'comparison'
                  ? (isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold')
                  : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-ink-400 hover:text-ink-200')
              }`}
            >
              الجدول المعجمي المقارن
            </button>
          </div>
        </div>

        {/* Insight note */}
        <div className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-start gap-2 ${
          isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#264340]' : 'bg-[#10211F] border-[#264340] text-ink-300'
        }`}>
          <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>الدلالة البيانية واللغوية:</strong> يُظهر التحليل المعجمي للعناقيد هيمنة اسم الجلالة <strong>(اللَّه)</strong> وكلمات الهداية والإيمان في العناقيد الأولى (الطوال والمئين)، بينما تتصاعد كلمات اليوم الآخر، التذكير، والتعويذات في المفصل (العنقود السابع)، مما يعكس التباين الموضوعي والتدرج النظمي بين العناقيد.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEXICAL FILTER CONTROL PANEL (كامل خصائص ومعايير تصفية وتصنيف المفردات) */}
      {/* ========================================================================= */}
      <LexicalFilterControlPanel
        options={lexicalOptions}
        onChange={setLexicalOptions}
        activeSurahsCount={surahs.length}
      />

      {/* ========================================================================= */}
      {/* MODE 1: GRID VIEW (7 Cards showing Top N words each) */}
      {/* ========================================================================= */}
      {viewFormat === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clustersAnalysisData.map(c => {
            const def = c.clusterDef;
            const isSelected = selectedClusterId === def.id;

            return (
              <div
                key={def.id}
                className={`rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
                } ${isSelected ? (isLight ? 'ring-2 ring-[#1A5C5C]/40' : 'ring-2 ring-[#52C592]/40') : ''}`}
                style={{ borderTop: `3px solid ${def.color}` }}
              >
                <div>
                  {/* Card Header */}
                  <div className={`flex items-start justify-between gap-2 border-b pb-2.5 ${
                    isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: def.color }}
                      ></span>
                      <div>
                        <h4 className={`font-bold text-sm font-heading ${isLight ? 'text-[#0F1419]' : 'text-ink-100'}`}>
                          {def.name}: {def.traditionalLabel}
                        </h4>
                        <span className={`text-[10px] font-mono block ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                          {def.countRule} • {c.displayTotalTokens.toLocaleString()} كلمة • {c.uniqueFilteredWords.toLocaleString()} فريدة (TTR: {c.activeTTR}%)
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedClusterId(def.id);
                        setViewFormat('drilldown');
                      }}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                        isLight ? 'bg-[#FAF6EC] hover:bg-[#F2ECE0] text-[#53605E] border-[#E8DEC8]' : 'bg-ink-800 hover:bg-ink-700 text-ink-300 border-ink-700'
                      }`}
                    >
                      <span>تفصيل</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Top Words Table / List */}
                  <div className="mt-3 space-y-1.5">
                    <div className={`flex items-center justify-between text-[10px] font-mono font-bold px-1 border-b pb-1 ${
                      isLight ? 'text-[#7B8885] border-[#EAE4D5]' : 'text-ink-500 border-ink-800/40'
                    }`}>
                      <span># الكلمة المعجمية</span>
                      <div className="flex items-center gap-4">
                        <span>التكرار</span>
                        <span>النسبة</span>
                      </div>
                    </div>

                    {c.topWords.length === 0 ? (
                      <div className={`p-4 text-center text-xs italic ${isLight ? 'text-[#7B8885]' : 'text-ink-400'}`}>
                        لا توجد كلمات مطابقة للمعايير المحددة في هذا العنقود.
                      </div>
                    ) : (
                      c.topWords.map((wordObj, idx) => {
                        const maxCount = c.topWords[0]?.count || 1;
                        const barWidth = `${Math.max(8, Math.round((wordObj.count / maxCount) * 100))}%`;

                        return (
                          <div
                            key={wordObj.word}
                            onClick={() => handleWordClick(wordObj)}
                            className={`relative overflow-hidden rounded-lg px-2 py-1 flex items-center justify-between text-xs font-mono transition-colors cursor-pointer group ${
                              isLight ? 'bg-white hover:bg-amber-50/60 border border-[#EAE4D5]' : 'bg-ink-900/60 hover:bg-ink-800/80 border border-ink-800/60 hover:border-teal-500/40'
                            }`}
                            title="اضغط لعرض الآيات التي وردت فيها هذه الكلمة"
                          >
                            {/* Background progress bar */}
                            <div 
                              className="absolute top-0 right-0 bottom-0 opacity-15 pointer-events-none transition-all rounded-r"
                              style={{ 
                                width: barWidth, 
                                backgroundColor: def.color 
                              }}
                            ></div>

                            <div className="relative z-10 flex items-center gap-2">
                              <span className={`text-[10px] w-4 font-mono font-bold ${
                                idx === 0 ? 'text-amber-500 font-bold' : (idx === 1 ? (isLight ? 'text-[#53605E]' : 'text-ink-300') : (idx === 2 ? 'text-amber-700' : (isLight ? 'text-[#7B8885]' : 'text-ink-500')))
                              }`}>
                                {idx + 1}.
                              </span>
                              <span className={`font-heading font-bold text-sm ${isLight ? 'text-[#0F1419] group-hover:text-amber-800' : 'text-ink-100 group-hover:text-teal-300'}`}>
                                {wordObj.word}
                              </span>
                              {wordObj.mergedVariants && wordObj.mergedVariants.length > 1 && (
                                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                  isLight ? 'bg-teal-100 text-teal-800' : 'bg-teal-500/20 text-teal-300'
                                }`} title={`مدمج من ${wordObj.mergedVariants.length} صيغ سابقة`}>
                                  +{wordObj.mergedVariants.length - 1}
                                </span>
                              )}
                            </div>

                            <div className="relative z-10 flex items-center gap-3 font-mono text-[11px]">
                              <span className={`font-bold ${isLight ? 'text-[#0F1419]' : 'text-ink-200'}`}>
                                {wordObj.count.toLocaleString()}
                              </span>
                              <span className={`text-[10px] w-12 text-left ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                                {wordObj.percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Insight */}
                <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
                  isLight ? 'border-[#EAE4D5] text-[#53605E]' : 'border-ink-800/60 text-ink-500'
                }`}>
                  <span>الكلمة الأبرز: <strong className={`font-heading ${isLight ? 'text-[#1A5C5C] font-bold' : 'text-teal-400'}`}>{c.topWords[0]?.word || '-'}</strong></span>
                  <span>تغطي {c.topWords.reduce((s, w) => s + w.percentage, 0).toFixed(1)}% من العنقود</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DRILLDOWN RECHARTS VIEW */}
      {/* ========================================================================= */}
      {viewFormat === 'drilldown' && (
        <div className={`p-4 sm:p-5 rounded-xl border transition-colors space-y-4 ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
        }`}>
          {/* Cluster Selector Tabs */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
            isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
          }`}>
            <div>
              <h4 className={`text-sm font-bold flex items-center gap-2 font-heading ${isLight ? 'text-[#0F1419]' : 'text-ink-100'}`}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeClusterData.clusterDef.color }}></span>
                <span>تحليل معجم: {activeClusterData.clusterDef.name} ({activeClusterData.clusterDef.traditionalLabel})</span>
              </h4>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                {activeClusterData.clusterDef.subtitle} • كلمات العنقود: {activeClusterData.displayTotalTokens.toLocaleString()} • المفردات المتمايزة: {activeClusterData.uniqueFilteredWords.toLocaleString()} (TTR: {activeClusterData.activeTTR}%)
              </p>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              {clustersAnalysisData.map(c => {
                const isSelected = selectedClusterId === c.clusterDef.id;
                return (
                  <button
                    key={c.clusterDef.id}
                    onClick={() => setSelectedClusterId(c.clusterDef.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? (isLight ? 'bg-[#1A5C5C] text-white border-[#1A5C5C] font-bold shadow-xs' : 'bg-teal-500/25 text-teal-200 border-teal-500/60 font-bold shadow-xs')
                        : (isLight ? 'bg-[#FAF6EC] text-[#53605E] border-[#E8DEC8] hover:text-[#0F1419]' : 'bg-[#10211F] text-ink-400 border-[#264340] hover:text-ink-200')
                    }`}
                  >
                    <span>{c.clusterDef.id}: {c.clusterDef.traditionalLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#EAE4D5' : '#264340'} vertical={false} />
                <XAxis 
                  dataKey="word" 
                  stroke={isLight ? '#53605E' : '#8FA09C'}
                  tick={{ fill: isLight ? '#0F1419' : '#C7CEC9', fontFamily: 'Amiri', fontWeight: 'bold', fontSize: 13 }}
                />
                <YAxis stroke={isLight ? '#53605E' : '#8FA09C'} fontSize={10} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  formatter={(val: any, name: any, item: any) => {
                    const p = item.payload;
                    const variantsStr = p.mergedVariants ? ` (مدمج من: ${p.mergedVariants.map((v: any) => v.variant).join(', ')})` : '';
                    return [`${Number(val).toLocaleString()} تكرار (${p.percentage}%) في ${p.surahCount} سور${variantsStr}`, `الكلمة: ${p.word}`];
                  }}
                  labelFormatter={(label) => `المفردة المعجمية: ${label}`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={0.85 + (index === 0 ? 0.15 : 0)}
                      className="cursor-pointer hover:opacity-100"
                      onClick={() => {
                        const targetWordObj = activeClusterData.topWords[index];
                        if (targetWordObj) handleWordClick(targetWordObj);
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Word Details Grid */}
          <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t ${
            isLight ? 'border-[#EAE4D5]' : 'border-[#264340]'
          }`}>
            {activeClusterData.topWords.map((w, idx) => (
              <div 
                key={w.word}
                onClick={() => handleWordClick(w)}
                className={`p-2 rounded-lg border text-center font-mono cursor-pointer transition-all hover:scale-105 ${
                  isLight ? 'bg-[#FAF6EC] hover:bg-[#F2ECE0] border-[#E8DEC8]' : 'bg-ink-900/60 hover:bg-ink-800/80 border-ink-800 hover:border-teal-500/40'
                }`}
                title="اضغط لعرض الآيات التي وردت فيها هذه الكلمة"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className={`text-[10px] ${isLight ? 'text-[#7B8885]' : 'text-ink-500'}`}>#{idx + 1}</span>
                  <span className={`font-heading font-bold text-sm ${isLight ? 'text-[#0F1419]' : 'text-ink-100'}`}>
                    {w.word}
                  </span>
                </div>
                <div className={`text-xs font-bold mt-1 ${isLight ? 'text-[#1A5C5C]' : 'text-teal-400'}`}>
                  {w.count.toLocaleString()} تكرار
                </div>
                <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-ink-400'}`}>
                  {w.percentage}% من العنقود
                </div>
                {w.mergedVariants && (
                  <div className="text-[9px] text-amber-600 dark:text-amber-500/80 truncate mt-0.5">
                    {w.mergedVariants.length} صيغ
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: COMPARISON TABLE VIEW */}
      {/* ========================================================================= */}
      {viewFormat === 'comparison' && (
        <div className={`rounded-xl overflow-x-auto border transition-colors ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'
        }`}>
          <table className="w-full text-right text-xs font-mono">
            <thead>
              <tr className={`border-b ${isLight ? 'bg-[#F7F4EA] text-[#0F1419] border-[#DED8C9]' : 'bg-[#10211F] text-ink-300 border-[#264340]'}`}>
                <th className="py-2.5 px-3 font-bold">العنقود</th>
                <th className="py-2.5 px-3 font-bold">المسمى الأثري</th>
                <th className="py-2.5 px-3 font-bold text-center">الكلمات</th>
                <th className="py-2.5 px-3 font-bold text-center">الفريدة</th>
                <th className="py-2.5 px-3 font-bold text-center">TTR %</th>
                <th className="py-2.5 px-3 font-bold text-amber-500">الكلمة الأولى (#1)</th>
                <th className="py-2.5 px-3 font-bold text-teal-600 dark:text-teal-400">الكلمة الثانية (#2)</th>
                <th className="py-2.5 px-3 font-bold text-emerald-500">الكلمة الثالثة (#3)</th>
                <th className="py-2.5 px-3 font-bold">بقية الكلمات الأكثر تكراراً</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-[#EAE4D5]' : 'divide-ink-800/60'}`}>
              {comparisonData.map(c => (
                <tr key={c.id} className={`transition-colors ${isLight ? 'hover:bg-[#FAF6EC]' : 'hover:bg-ink-800/30'}`}>
                  <td className="py-2.5 px-3 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                    <span className={isLight ? 'text-[#0F1419]' : 'text-ink-100'}>{c.clusterName}</span>
                  </td>
                  <td className={`py-2.5 px-3 font-heading ${isLight ? 'text-[#264340]' : 'text-ink-300'}`}>
                    {c.traditionalLabel}
                  </td>
                  <td className={`py-2.5 px-3 text-center ${isLight ? 'text-[#0F1419]' : 'text-ink-200'}`}>
                    {c.totalTokens.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-3 text-center ${isLight ? 'text-teal-700 font-bold' : 'text-teal-400 font-bold'}`}>
                    {c.uniqueWords.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-3 text-center ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold'}`}>
                    {c.ttr}%
                  </td>
                  <td className="py-2.5 px-3 font-heading font-bold text-amber-500">
                    {c.top1}
                  </td>
                  <td className={`py-2.5 px-3 font-heading font-bold ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
                    {c.top2}
                  </td>
                  <td className={`py-2.5 px-3 font-heading font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {c.top3}
                  </td>
                  <td className="py-2.5 px-3 font-heading">
                    <div className="flex flex-wrap gap-1">
                      {c.topWords.slice(3, lexicalOptions.topWordsCount).map((w, idx) => (
                        <button 
                          key={w.word}
                          onClick={() => handleWordClick(w)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-heading transition-colors cursor-pointer ${
                            isLight ? 'bg-[#FAF6EC] hover:bg-[#F2ECE0] text-[#264340] border border-[#E8DEC8]' : 'bg-ink-900 hover:bg-ink-800 text-ink-300'
                          }`}
                          title="اضغط لعرض الآيات"
                        >
                          {w.word} ({w.count.toLocaleString()})
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORD VERSES MODAL FOR CLUSTER WORDS */}
      {/* ========================================================================= */}
      {selectedWordForModal && (
        <WordVersesModal
          isOpen={!!selectedWordForModal}
          onClose={() => setSelectedWordForModal(null)}
          word={selectedWordForModal.word}
          surahName={selectedWordForModal.surahName}
          surahNumber={selectedWordForModal.surahNumber}
          totalSurahAyahs={selectedWordForModal.totalSurahAyahs}
          wordItem={selectedWordForModal.wordItem}
          corpusSurah={selectedWordForModal.corpusSurah}
          lexicalOptions={lexicalOptions}
          onOpenInReader={onOpenInReader}
        />
      )}

    </div>
  );
};

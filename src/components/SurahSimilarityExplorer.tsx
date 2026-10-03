import React, { useState, useMemo } from 'react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  SIMILARITY_CRITERIA, 
  SimilarityCriterionId, 
  getClosestSurahsByCriterion,
  calculateLettersSimilarity,
  calculatePhoneticSimilarity,
  calculateVerseEndingsSimilarity,
  calculateDiacriticsSimilarity,
  calculateCadenceSimilarity,
  calculateVocabularySimilarity
} from '../utils/similarityMetrics';
import { 
  GitCompare, 
  Info, 
  Sparkles, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { MathTooltip } from './MathTooltip';
import { formatSurahName } from '../utils/arabic';

interface SurahSimilarityExplorerProps {
  baseSurah: SurahData;
  allSurahs: SurahData[];
  onSelectSurah: (surah: SurahData) => void;
  onCompareWith: (targetSurahNumber: number) => void;
  titlePrefix?: string;
}

export const SurahSimilarityExplorer: React.FC<SurahSimilarityExplorerProps> = ({
  baseSurah,
  allSurahs,
  onSelectSurah,
  onCompareWith,
  titlePrefix
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedCriterion, setSelectedCriterion] = useState<SimilarityCriterionId>('letters');
  const [filterRevelation, setFilterRevelation] = useState<'all' | 'meccan' | 'medinan'>('all');
  const [displayCount, setDisplayCount] = useState<5 | 10>(5);
  const [expandedSurahNumber, setExpandedSurahNumber] = useState<number | null>(null);

  const activeCriterionDef = useMemo(() => {
    return SIMILARITY_CRITERIA.find(c => c.id === selectedCriterion) || SIMILARITY_CRITERIA[0];
  }, [selectedCriterion]);

  // Query closest surahs using current criterion and filters
  const closestResults = useMemo(() => {
    return getClosestSurahsByCriterion(baseSurah, allSurahs, selectedCriterion, {
      filterRevelation,
      limit: displayCount
    });
  }, [baseSurah, allSurahs, selectedCriterion, filterRevelation, displayCount]);

  // Breakdown metrics for the expanded comparison card
  const getPairwiseBreakdown = (target: SurahData) => {
    const lettersSim = calculateLettersSimilarity(baseSurah, target);
    const phoneticsRes = calculatePhoneticSimilarity(baseSurah, target);
    const endingsRes = calculateVerseEndingsSimilarity(baseSurah, target);
    const diacriticsSim = calculateDiacriticsSimilarity(baseSurah, target);
    const cadenceSim = calculateCadenceSimilarity(baseSurah, target, allSurahs);
    const vocabRes = calculateVocabularySimilarity(baseSurah, target);

    return {
      lettersSim,
      phoneticsSim: phoneticsRes.similarity,
      endingsSim: endingsRes.similarity,
      topEnding: endingsRes.topSharedEnding,
      diacriticsSim,
      cadenceSim,
      vocabSim: vocabRes.similarity,
      sharedWordsCount: vocabRes.sharedTopWordsCount,
      rawTtrBase: vocabRes.rawTtr1,
      rawTtrTarget: vocabRes.rawTtr2,
      guiraudBase: vocabRes.guiraud1,
      guiraudTarget: vocabRes.guiraud2
    };
  };

  return (
    <div className="space-y-4">
      {/* Criteria Selection Header & Badges */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h4 className={`text-xs font-mono font-bold uppercase flex items-center gap-2 ${
              isLight ? 'text-ink-950' : 'text-emerald-400'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{titlePrefix || 'معايير قياس التشابه والعلاقات مع'} «{formatSurahName(baseSurah.name)}»</span>
            </h4>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-ink-800 font-bold' : 'text-ink-400'}`}>
              اختر المعيار الإحصائي أو الأسلوبي لمقارنة وتحديد السور الأقرب شبهاً ونظماً
            </p>
          </div>

          {/* Revelation & Limit Quick Controls */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            {/* Revelation Filter */}
            <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono transition-colors ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <span className={`px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
                isLight ? 'text-[#0F1419]' : 'text-[#A8BCB9]'
              }`}>
                <Filter className="w-3 h-3 text-[#1A5C5C] dark:text-[#C5A16A]" />
                <span>النزول:</span>
              </span>
              {(['all', 'meccan', 'medinan'] as const).map(rev => (
                <button
                  key={rev}
                  onClick={() => setFilterRevelation(rev)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    filterRevelation === rev
                      ? (isLight 
                          ? 'bg-[#1A5C5C] text-white shadow-2xs' 
                          : 'bg-[#2B7470] text-[#F4F0E7]')
                      : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]')
                  }`}
                >
                  {rev === 'all' ? 'الكل' : rev === 'meccan' ? 'مكية' : 'مدنية'}
                </button>
              ))}
            </div>

            {/* Display Count Toggle */}
            <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono transition-colors ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              {([5, 10] as const).map(count => (
                <button
                  key={count}
                  onClick={() => setDisplayCount(count)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    displayCount === count
                      ? (isLight 
                          ? 'bg-[#0F1419] text-[#F4F0E7]' 
                          : 'bg-[#163331] text-[#C5A16A] border border-[#2B7470]/50')
                      : (isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]')
                  }`}
                >
                  أقرب {count}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7 Criteria Selection Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SIMILARITY_CRITERIA.map(criterion => {
            const Icon = criterion.icon;
            const isSelected = selectedCriterion === criterion.id;

            return (
              <button
                key={criterion.id}
                onClick={() => setSelectedCriterion(criterion.id)}
                className={`p-2.5 rounded-lg border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? (isLight 
                        ? 'bg-[#E8F1EF] border-[#1A5C5C] ring-2 ring-[#1A5C5C]/40 shadow-xs' 
                        : `${criterion.color.bg} ${criterion.color.border} ring-2 ${criterion.color.activeRing} shadow-md`)
                    : (isLight 
                        ? 'bg-[#FFFFFF] border-[#DED8C9] hover:border-[#1A5C5C]/40 hover:bg-[#FAF7EF]' 
                        : 'bg-[#142825] border-[#264340] hover:border-[#358A85] hover:bg-[#19332F]')
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`p-1.5 rounded-md ${
                    isSelected
                      ? (isLight ? 'bg-[#1A5C5C]/20 text-[#1A5C5C]' : 'bg-[#10211F] text-[#C5A16A]')
                      : (isLight ? 'bg-[#F1ECE0] text-[#53605E]' : 'bg-[#10211F] text-[#A8BCB9]')
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    isLight ? criterion.color.badgeLight : criterion.color.badgeDark
                  }`}>
                    {criterion.badge}
                  </span>
                </div>

                <div>
                  <div className={`text-xs font-bold font-heading leading-tight ${
                    isSelected
                      ? (isLight ? 'text-[#1A5C5C]' : 'text-white')
                      : (isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]')
                  }`}>
                    {criterion.shortLabel}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 truncate ${
                    isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
                  }`}>
                    {criterion.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Criterion Scientific Methodology Card */}
      <div className={`p-3 rounded-lg border text-xs font-mono transition-colors ${
        isLight 
          ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' 
          : 'bg-[#142825] border-[#264340] text-[#F4F0E7]'
      }`}>
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
            isLight ? 'bg-[#1A5C5C]/15 text-[#1A5C5C]' : 'bg-[#10211F] text-[#C5A16A] border border-[#264340]'
          }`}>
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-bold font-heading text-sm ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                معيار: {activeCriterionDef.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                isLight ? activeCriterionDef.color.badgeLight : activeCriterionDef.color.badgeDark
              }`}>
                {activeCriterionDef.badge}
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              {activeCriterionDef.description}
            </p>
            <div className={`text-[10px] pt-1 border-t flex flex-wrap items-center gap-2 ${
              isLight ? 'border-[#DED8C9] text-[#1A5C5C] font-bold' : 'border-[#264340] text-[#C5A16A]'
            }`}>
              <span><strong>المعادلة:</strong> {activeCriterionDef.formula}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-mono font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
            أقرب {closestResults.length} سور بحسب {activeCriterionDef.shortLabel}:
          </span>
          <span className={`text-[10px] font-mono ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
            السور المفحوصة: {allSurahs.length - 1} سورة
          </span>
        </div>

        <div className={`grid gap-2.5 font-mono ${
          displayCount === 10 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
        }`}>
          {closestResults.map(result => {
            const target = result.surah;
            const isExpanded = expandedSurahNumber === target.number;
            const breakdown = isExpanded ? getPairwiseBreakdown(target) : null;

            // Determine similarity color badge
            let badgeColor = '';
            if (result.similarity >= 95) {
              badgeColor = isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-400' : 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
            } else if (result.similarity >= 85) {
              badgeColor = isLight ? 'bg-[#E8F1EF] text-[#1A5C5C] border-[#1A5C5C]/30' : 'bg-[#163331] text-[#79A9A0] border-[#2B7470]/50';
            } else if (result.similarity >= 70) {
              badgeColor = isLight ? 'bg-[#F7F2E8] text-[#8C6B37] border-[#B8935F]/40' : 'bg-[#24221B] text-[#C5A16A] border-[#B8935F]/40';
            } else {
              badgeColor = isLight ? 'bg-[#F1ECE0] text-[#53605E] border-[#DED8C9]' : 'bg-[#10211F] text-[#A8BCB9] border-[#264340]';
            }

            return (
              <div 
                key={target.number}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all group ${
                  isLight 
                    ? 'bg-[#FFFFFF] border-[#DED8C9] hover:border-[#1A5C5C]/60 shadow-2xs' 
                    : 'bg-[#142825] border-[#264340] hover:border-[#2B7470]'
                } ${isExpanded ? (isLight ? 'ring-2 ring-[#1A5C5C]' : 'ring-2 ring-[#2B7470]') : ''}`}
              >
                <div>
                  {/* Card Header: Rank & Similarity Score */}
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`w-5 h-5 rounded text-[11px] flex items-center justify-center font-bold font-mono ${
                      isLight ? 'bg-[#1A5C5C] text-white' : 'bg-[#10211F] text-[#C5A16A]'
                    }`}>
                      #{result.rank}
                    </span>

                    <MathTooltip metricId="cosineSimilarity" value={`${result.similarity}%`}>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shadow-2xs ${badgeColor}`}>
                        {result.similarity}%
                      </span>
                    </MathTooltip>
                  </div>

                  {/* Similarity Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden mb-2 ${
                    isLight ? 'bg-[#DED8C9]/60' : 'bg-[#264340]'
                  }`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        result.similarity >= 95 
                          ? 'bg-[#1A5C5C]' 
                          : result.similarity >= 85 
                            ? 'bg-[#2B7470]' 
                            : result.similarity >= 70 
                              ? 'bg-[#B8935F]' 
                              : 'bg-[#7B8885]'
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, result.similarity))}%` }}
                    />
                  </div>

                  {/* Surah Name */}
                  <h5 className={`font-heading font-bold text-base transition-colors ${
                    isLight ? 'text-[#0F1419] group-hover:text-[#1A5C5C]' : 'text-[#F4F0E7] group-hover:text-[#C5A16A]'
                  }`}>
                    {formatSurahName(target.name)}
                  </h5>

                  {/* Surah Basic Metadata */}
                  <div className={`text-[10px] mt-1 space-y-0.5 font-mono ${
                    isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`px-1 rounded text-[9px] font-bold ${
                        target.isMeccan
                          ? (isLight ? 'bg-[#B8935F]/15 text-[#8C6B37] border border-[#B8935F]/30' : 'bg-[#24221B] text-[#C5A16A] border border-[#B8935F]/40')
                          : (isLight ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border border-[#1A5C5C]/20' : 'bg-[#163331] text-[#79A9A0] border border-[#2B7470]/40')
                      }`}>
                        {target.isMeccan ? 'مكية' : 'مدنية'}
                      </span>
                      <span>{target.totalAyahs} آية • {target.totalWords} كلمة</span>
                    </div>

                    {/* Criterion-specific Highlight Note */}
                    <div className={`pt-1 border-t text-[10px] mt-1.5 flex items-center justify-between ${
                      isLight ? 'border-[#DED8C9] text-[#1A5C5C] font-semibold' : 'border-[#264340] text-[#C5A16A]'
                    }`}>
                      <span className="truncate" title={result.detailValue}>
                        {result.detailValue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Pairwise Breakdown Panel */}
                {isExpanded && breakdown && (
                  <div className={`my-2 p-2 rounded-md border text-[10px] space-y-1.5 font-mono ${
                    isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'
                  }`}>
                    <div className="font-bold border-b pb-1 text-center font-heading text-xs border-[#DED8C9] dark:border-[#264340]">
                      مقارنة الأبعاد الستة مع «{baseSurah.name}»
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الحروف الـ 28:</span>
                      <strong className="text-[#1A5C5C] dark:text-[#C5A16A]">{breakdown.lettersSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>المخارج والصفات التجويدية:</span>
                      <strong className="text-teal-600 dark:text-teal-400">{breakdown.phoneticsSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>فواصل الآيات:</span>
                      <strong className="text-lime-600 dark:text-lime-400">{breakdown.endingsSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>التشكيل والحركات:</span>
                      <strong className="text-[#1A5C5C] dark:text-[#C5A16A]">{breakdown.diacriticsSim}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>الإيقاع وطول الآيات:</span>
                      <strong className="text-[#8C6B37] dark:text-[#B8935F]">{breakdown.cadenceSim}%</strong>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>تنوع ومعجم الألفاظ (جيراود):</span>
                        <strong className="text-rose-600 dark:text-rose-400">{breakdown.vocabSim}%</strong>
                      </div>
                      <div className={`p-1.5 rounded text-[9px] space-y-0.5 ${
                        isLight ? 'bg-[#FFFFFF] border border-[#DED8C9] text-[#53605E]' : 'bg-[#142825] border border-[#264340] text-[#A8BCB9]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">• مؤشر جيراود المعدّل:</span>
                          <span className="font-bold">{breakdown.guiraudBase} مقابل {breakdown.guiraudTarget}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>• TTR السطحي الكلاسيكي:</span>
                          <span>{breakdown.rawTtrBase}% مقابل {breakdown.rawTtrTarget}%</span>
                        </div>
                        {breakdown.sharedWordsCount > 0 && (
                          <div className="flex items-center justify-between text-[#1A5C5C] dark:text-[#C5A16A]">
                            <span>• ألفاظ مركزية مشتركة:</span>
                            <span>{breakdown.sharedWordsCount} كلمات متطابقة</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {breakdown.topEnding && (
                      <div className="pt-1 border-t text-[9px] text-lime-600 dark:text-lime-300 border-[#DED8C9] dark:border-[#264340]">
                        أبرز فاصلة مشتركة: {breakdown.topEnding}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Card Actions */}
                <div className={`mt-2.5 pt-2 border-t flex items-center gap-1.5 font-mono ${
                  isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
                }`}>
                  <button
                    onClick={() => onSelectSurah(target)}
                    className={`flex-1 py-1 px-1.5 rounded text-[11px] font-bold text-center transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-[#F1ECE0] hover:bg-[#E8E2D4] text-[#0F1419] border border-[#DED8C9]' 
                        : 'bg-[#10211F] hover:bg-[#162C29] text-[#F4F0E7] border border-[#264340]'
                    }`}
                    title="فتح بطاقة السورة وبصمتها الكاملة"
                  >
                    عرض البصمة
                  </button>

                  <button
                    onClick={() => setExpandedSurahNumber(isExpanded ? null : target.number)}
                    className={`p-1 rounded text-xs transition-all cursor-pointer ${
                      isExpanded
                        ? (isLight ? 'bg-[#1A5C5C]/20 text-[#1A5C5C]' : 'bg-[#2B7470]/30 text-[#C5A16A]')
                        : (isLight ? 'bg-[#F1ECE0] hover:bg-[#E8E2D4] text-[#53605E] border border-[#DED8C9]' : 'bg-[#10211F] hover:bg-[#162C29] text-[#A8BCB9] border border-[#264340]')
                    }`}
                    title="تحليل تفصيلي للأبعاد الخمسة"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onCompareWith(target.number)}
                    className={`p-1 rounded text-xs transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-[#E8F1EF] hover:bg-[#D5E6E3] text-[#1A5C5C] border border-[#1A5C5C]/30' 
                        : 'bg-[#163331] hover:bg-[#1C3E3B] text-[#C5A16A] border border-[#2B7470]/40'
                    }`}
                    title="مقارنة مباشرة في معمل المقارنة الثنائية"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

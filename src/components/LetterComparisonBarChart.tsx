import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell 
} from 'recharts';
import { 
  ArrowLeftRight, 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Table, 
  ChevronDown
} from 'lucide-react';
import { SurahData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ARABIC_LETTER_NAMES, formatSurahName } from '../utils/arabic';

interface LetterComparisonBarChartProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  initialSurahA?: number;
  initialSurahB?: number;
}

export type ComparisonMetric = 'percentage' | 'count' | 'difference';
export type ComparisonSort = 'hijai' | 'abjadi' | 'diff_desc' | 'surahA_desc' | 'surahB_desc';

/**
 * Calculates Cosine Similarity between two 28-letter plain percentage vectors
 */
function calculateVectorCosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>,
  letters: string[]
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const letter of letters) {
    const a = vecA[letter] || 0;
    const b = vecB[letter] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return Number((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
}

export const LetterComparisonBarChart: React.FC<LetterComparisonBarChartProps> = ({
  surahs,
  letterStats,
  initialSurahA = 1,
  initialSurahB = 112
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [surahANum, setSurahANum] = useState<number>(initialSurahA);
  const [surahBNum, setSurahBNum] = useState<number>(initialSurahB);
  const [metric, setMetric] = useState<ComparisonMetric>('percentage');
  const [sortOrder, setSortOrder] = useState<ComparisonSort>('hijai');
  const [showTable, setShowTable] = useState<boolean>(true);

  // Theme-coordinated colors for Surah A and Surah B
  const colorA = isLight ? '#1A5C5C' : '#2B7470';
  const colorB = isLight ? '#B8935F' : '#C5A16A';

  // Quick preset pairs
  const PRESET_PAIRS = [
    { label: 'الفاتحة vs الإخلاص', a: 1, b: 112, desc: 'أم الكتاب مع سورة التوحيد الخالص' },
    { label: 'البقرة vs آل عمران', a: 2, b: 3, desc: 'الزهراوان وأطول سور القرآن' },
    { label: 'الفلق vs الناس', a: 113, b: 114, desc: 'المعوذتان' },
    { label: 'يوسف vs الكهف', a: 12, b: 18, desc: 'درر القصص القرآني' },
    { label: 'الرحمن vs الواقعة', a: 55, b: 56, desc: 'سور الإيقاع والجزاء والنعيم' },
    { label: 'القدر vs العلق', a: 97, b: 96, desc: 'نزول الوحي وليلة القدر' }
  ];

  // Resolve Surah objects
  const surahA = useMemo(() => {
    return surahs.find(s => s.number === surahANum) || surahs[0];
  }, [surahs, surahANum]);

  const surahB = useMemo(() => {
    return surahs.find(s => s.number === surahBNum) || surahs[1] || surahs[0];
  }, [surahs, surahBNum]);

  // Swap function
  const handleSwap = () => {
    setSurahANum(surahBNum);
    setSurahBNum(surahANum);
  };

  const letters = letterStats.letters;

  // Cosine Similarity between the two surahs
  const similarityScore = useMemo(() => {
    if (!surahA || !surahB) return 0;
    return calculateVectorCosineSimilarity(
      surahA.letters.plainPercentages,
      surahB.letters.plainPercentages,
      letters
    );
  }, [surahA, surahB, letters]);

  // Comparison items across all 28 letters
  const comparisonData = useMemo(() => {
    if (!surahA || !surahB) return [];

    const items = letters.map(letter => {
      const name = ARABIC_LETTER_NAMES[letter] || letter;
      const countA = surahA.letters.plainCounts[letter] || 0;
      const pctA = Number((surahA.letters.plainPercentages[letter] || 0).toFixed(2));
      const countB = surahB.letters.plainCounts[letter] || 0;
      const pctB = Number((surahB.letters.plainPercentages[letter] || 0).toFixed(2));
      
      const countDiff = countA - countB;
      const pctDiff = Number((pctA - pctB).toFixed(2));
      const absPctDiff = Math.abs(pctDiff);

      return {
        letter,
        letterName: name,
        letterDisplay: `${letter} (${name})`,
        countA,
        pctA,
        countB,
        pctB,
        countDiff,
        pctDiff,
        absPctDiff,
        favorsSurahA: pctDiff > 0,
        favorsSurahB: pctDiff < 0,
        isEqual: pctDiff === 0,
        // Chart values based on current metric
        valA: metric === 'percentage' ? pctA : countA,
        valB: metric === 'percentage' ? pctB : countB,
        valDiff: metric === 'percentage' ? pctDiff : countDiff
      };
    });

    // Apply sorting
    if (sortOrder === 'hijai') {
      return items;
    }
    if (sortOrder === 'abjadi') {
      const abjadiOrder = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
      return [...items].sort((a, b) => {
        const iA = abjadiOrder.indexOf(a.letter);
        const iB = abjadiOrder.indexOf(b.letter);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
      });
    }
    if (sortOrder === 'diff_desc') {
      return [...items].sort((a, b) => b.absPctDiff - a.absPctDiff);
    }
    if (sortOrder === 'surahA_desc') {
      return [...items].sort((a, b) => b.pctA - a.pctA);
    }
    if (sortOrder === 'surahB_desc') {
      return [...items].sort((a, b) => b.pctB - a.pctB);
    }

    return items;
  }, [surahA, surahB, letters, sortOrder, metric]);

  // Statistical extremes
  const statsHighlights = useMemo(() => {
    if (comparisonData.length === 0) return null;

    // Largest deviation favoring Surah A
    const sortedFavorsA = [...comparisonData].sort((a, b) => b.pctDiff - a.pctDiff);
    const topA = sortedFavorsA[0];

    // Largest deviation favoring Surah B
    const sortedFavorsB = [...comparisonData].sort((a, b) => a.pctDiff - b.pctDiff);
    const topB = sortedFavorsB[0];

    // Absent letters in A vs B
    const absentInA = comparisonData.filter(d => d.countA === 0).map(d => d.letter);
    const absentInB = comparisonData.filter(d => d.countB === 0).map(d => d.letter);
    const sharedAbsent = absentInA.filter(l => absentInB.includes(l));

    return {
      topA,
      topB,
      absentInA,
      absentInB,
      sharedAbsent
    };
  }, [comparisonData]);

  // Custom Tooltip for Clustered Bar Chart
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className={`p-3.5 rounded-[8px] border shadow-md text-right min-w-[220px] ${
        isLight 
          ? 'bg-[#FAF8F2] text-[#0F1419] border-[#DED8C9]' 
          : 'bg-[#10211F] text-[#F4F0E7] border-[#264340]'
      }`}>
        <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#264340] pb-2 mb-2">
          <span className="font-bold text-[#8C6B37] dark:text-[#C5A16A] text-sm">
            حرف «{data.letter}» — {data.letterName}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] text-[#7B8885] dark:text-[#8B9B96]">
            مقارنة تكرار
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between gap-3 text-[#1A5C5C] dark:text-[#79A9A0]">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C5C] dark:bg-[#79A9A0]"></span>
              <span>{formatSurahName(surahA.name)} (#{surahA.number}):</span>
            </span>
            <span className="font-bold tabular-nums">
              {metric === 'percentage' ? `${data.pctA}%` : `${data.countA} حرف`}
              <span className="text-[10px] text-[#7B8885] mr-1">
                ({metric === 'percentage' ? `${data.countA} تكرار` : `${data.pctA}%`})
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-[#8C6B37] dark:text-[#C5A16A]">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8935F] dark:bg-[#C5A16A]"></span>
              <span>{formatSurahName(surahB.name)} (#{surahB.number}):</span>
            </span>
            <span className="font-bold tabular-nums">
              {metric === 'percentage' ? `${data.pctB}%` : `${data.countB} حرف`}
              <span className="text-[10px] text-[#7B8885] mr-1">
                ({metric === 'percentage' ? `${data.countB} تكرار` : `${data.pctB}%`})
              </span>
            </span>
          </div>

          <div className="border-t border-[#DED8C9] dark:border-[#264340] pt-1.5 mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-[#7B8885] dark:text-[#8B9B96] font-bold">فارق التباين:</span>
            <span className={`font-bold tabular-nums ${
              data.pctDiff > 0 ? 'text-[#1A5C5C] dark:text-[#79A9A0]' : data.pctDiff < 0 ? 'text-[#8C6B37] dark:text-[#C5A16A]' : 'text-[#7B8885]'
            }`}>
              {data.pctDiff > 0 ? `+${data.pctDiff}% لصالح ${formatSurahName(surahA.name)}` : 
               data.pctDiff < 0 ? `${data.pctDiff}% لصالح ${formatSurahName(surahB.name)}` : 'تطابق تام (0%)'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Surah Selectors & Control Panel */}
      <div className={`p-4 sm:p-5 rounded-[8px] border transition-colors ${
        isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
      }`}>
        {/* Row 1: Surah A and Surah B Dropdowns with Swap Button */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Surah A Box */}
          <div className={`md:col-span-5 p-3 rounded-[6px] border flex flex-col gap-1.5 transition-colors ${
            isLight 
              ? 'bg-[#F7F4EA] border-[#1A5C5C]/40' 
              : 'bg-[#0E201E] border-[#2B7470]/50'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1A5C5C] dark:text-[#79A9A0]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C5C] dark:bg-[#79A9A0]"></span>
                <span>السورة الأولى (أ):</span>
              </span>
              <span className="text-[11px] text-[#7B8885] dark:text-[#8B9B96]">
                {surahA.isMeccan ? 'مكية' : 'مدنية'} • {surahA.totalAyahs} آية • {surahA.totalChars.toLocaleString()} حرف
              </span>
            </div>
            <select
              value={surahANum}
              onChange={(e) => setSurahANum(Number(e.target.value))}
              className={`w-full rounded-[6px] px-3 py-1.5 text-xs sm:text-sm font-bold border transition-colors focus:outline-none focus:border-[#1A5C5C] cursor-pointer ${
                isLight 
                  ? 'bg-white border-[#DED8C9] text-[#0F1419]' 
                  : 'bg-[#0B1716] border-[#264340] text-[#F4F0E7]'
              }`}
            >
              {surahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {formatSurahName(s.name)} ({s.totalAyahs} آية — {s.isMeccan ? 'مكية' : 'مدنية'})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className={`p-2.5 rounded-[8px] border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isLight 
                  ? 'bg-[#EFECE2] hover:bg-[#DED8C9] text-[#1A5C5C] border-[#DED8C9] shadow-2xs' 
                  : 'bg-[#122B2A] hover:bg-[#1A3836] text-[#79A9A0] border-[#264340]'
              }`}
              title="تبديل السورتين (أ ⇄ ب)"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
            </button>
          </div>

          {/* Surah B Box */}
          <div className={`md:col-span-5 p-3 rounded-[6px] border flex flex-col gap-1.5 transition-colors ${
            isLight 
              ? 'bg-[#F7F4EA] border-[#B8935F]/40' 
              : 'bg-[#0E201E] border-[#C5A16A]/50'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#8C6B37] dark:text-[#C5A16A]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8935F] dark:bg-[#C5A16A]"></span>
                <span>السورة الثانية (ب):</span>
              </span>
              <span className="text-[11px] text-[#7B8885] dark:text-[#8B9B96]">
                {surahB.isMeccan ? 'مكية' : 'مدنية'} • {surahB.totalAyahs} آية • {surahB.totalChars.toLocaleString()} حرف
              </span>
            </div>
            <select
              value={surahBNum}
              onChange={(e) => setSurahBNum(Number(e.target.value))}
              className={`w-full rounded-[6px] px-3 py-1.5 text-xs sm:text-sm font-bold border transition-colors focus:outline-none focus:border-[#B8935F] cursor-pointer ${
                isLight 
                  ? 'bg-white border-[#DED8C9] text-[#0F1419]' 
                  : 'bg-[#0B1716] border-[#264340] text-[#F4F0E7]'
              }`}
            >
              {surahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {formatSurahName(s.name)} ({s.totalAyahs} آية — {s.isMeccan ? 'مكية' : 'مدنية'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Preset Quick Pair Buttons */}
        <div className="mt-3 pt-3 border-t border-[#DED8C9] dark:border-[#264340] flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[#7B8885] dark:text-[#8B9B96] font-mono text-[11px] font-bold">مقارنات مقترحة:</span>
          {PRESET_PAIRS.map((pair, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSurahANum(pair.a);
                setSurahBNum(pair.b);
              }}
              className={`px-2.5 py-1 rounded-[4px] text-xs font-mono transition-colors cursor-pointer border ${
                surahANum === pair.a && surahBNum === pair.b
                  ? 'bg-[#1A5C5C] text-white border-[#1A5C5C] font-bold dark:bg-[#2B7470]'
                  : isLight
                  ? 'bg-[#EFECE2] hover:bg-[#DED8C9] text-[#53605E] border-[#DED8C9]'
                  : 'bg-[#122B2A] hover:bg-[#1A3836] text-[#A8BCB9] border-[#264340]'
              }`}
              title={pair.desc}
            >
              {pair.label}
            </button>
          ))}
        </div>

        {/* Row 3: Metric and Sort Controls */}
        <div className="mt-3 pt-3 border-t border-[#DED8C9] dark:border-[#264340] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[#7B8885] dark:text-[#8B9B96] font-mono text-[11px] font-bold">المقياس الإحصائي:</span>
            <div className="inline-flex p-0.5 rounded-[6px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251]">
              <button
                type="button"
                onClick={() => setMetric('percentage')}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-mono font-bold transition-colors cursor-pointer ${
                  metric === 'percentage'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
                title="النسبة المئوية لكل حرف من إجمالي حروف السورة (أدق للمقارنة العلمية بين السور مختلفة الطول)"
              >
                النسبة المئوية (%)
              </button>
              <button
                type="button"
                onClick={() => setMetric('count')}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-mono font-bold transition-colors cursor-pointer ${
                  metric === 'count'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
                title="التعداد الحقيقي الخام للحروف"
              >
                التكرار المطلق (العدد)
              </button>
              <button
                type="button"
                onClick={() => setMetric('difference')}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-mono font-bold transition-colors cursor-pointer ${
                  metric === 'difference'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
                title="فارق التباين المباشر (السورة الأولى - السورة الثانية)"
              >
                فارق التباين (Δ)
              </button>
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[#7B8885] dark:text-[#8B9B96] font-mono text-[11px] font-bold">ترتيب الحروف:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as ComparisonSort)}
              className={`rounded-[6px] px-2.5 py-1 text-xs font-mono font-bold border transition-colors focus:outline-none focus:border-[#1A5C5C] cursor-pointer ${
                isLight 
                  ? 'bg-white border-[#DED8C9] text-[#0F1419]' 
                  : 'bg-[#0B1716] border-[#264340] text-[#F4F0E7]'
              }`}
            >
              <option value="hijai">الترتيب الهجائي القياسي (أ، ب، ت...)</option>
              <option value="abjadi">الترتيب الأبجدي المشرقي (أبجد، هوز...)</option>
              <option value="diff_desc">الأعلى تبايناً واختلافاً (الفرق الأكبر أولاً)</option>
              <option value="surahA_desc">الأكثر تكراراً في {formatSurahName(surahA.name)}</option>
              <option value="surahB_desc">الأكثر تكراراً في {formatSurahName(surahB.name)}</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards: Similarity and Key Extrema */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cosine Similarity Score */}
        <div className={`p-3.5 rounded-[8px] border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <div className="flex items-center justify-between text-xs text-[#7B8885] dark:text-[#8B9B96] font-mono">
            <span>تشابه البصمة الحرفية:</span>
            <Sparkles className="w-3.5 h-3.5 text-[#B8935F]" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">
              {(similarityScore * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] text-[#7B8885] font-mono">جيب التمام</span>
          </div>
          <div className="mt-1 text-[10px] text-[#7B8885] dark:text-[#8B9B96] font-mono truncate">
            {similarityScore > 0.95 ? 'تطابق نسيجي فائق' : similarityScore > 0.85 ? 'تقارب صوتي قوي' : 'تمايز أسلوبي ملحوظ'}
          </div>
        </div>

        {/* Highest Advantage for Surah A */}
        {statsHighlights?.topA && (
          <div className={`p-3.5 rounded-[8px] border flex flex-col justify-between transition-colors ${
            isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className="flex items-center justify-between text-xs text-[#1A5C5C] dark:text-[#79A9A0] font-mono">
              <span className="truncate">أعلى تفوق لـ {formatSurahName(surahA.name)}:</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#79A9A0] shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#1A5C5C] dark:text-[#79A9A0]">
                حرف «{statsHighlights.topA.letter}»
              </span>
              <span className="text-xs font-mono text-[#1A5C5C] dark:text-[#79A9A0] font-bold tabular-nums">
                +{statsHighlights.topA.pctDiff}%
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#7B8885] dark:text-[#8B9B96] font-mono truncate tabular-nums">
              {statsHighlights.topA.pctA}% مقابل {statsHighlights.topA.pctB}%
            </div>
          </div>
        )}

        {/* Highest Advantage for Surah B */}
        {statsHighlights?.topB && (
          <div className={`p-3.5 rounded-[8px] border flex flex-col justify-between transition-colors ${
            isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className="flex items-center justify-between text-xs text-[#8C6B37] dark:text-[#C5A16A] font-mono">
              <span className="truncate">أعلى تفوق لـ {formatSurahName(surahB.name)}:</span>
              <TrendingDown className="w-3.5 h-3.5 text-[#8C6B37] dark:text-[#C5A16A] shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#8C6B37] dark:text-[#C5A16A]">
                حرف «{statsHighlights.topB.letter}»
              </span>
              <span className="text-xs font-mono text-[#8C6B37] dark:text-[#C5A16A] font-bold tabular-nums">
                +{Math.abs(statsHighlights.topB.pctDiff)}%
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#7B8885] dark:text-[#8B9B96] font-mono truncate tabular-nums">
              {statsHighlights.topB.pctB}% مقابل {statsHighlights.topB.pctA}%
            </div>
          </div>
        )}

        {/* Absent Letters Comparison */}
        <div className={`p-3.5 rounded-[8px] border flex flex-col justify-between transition-colors ${
          isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <div className="flex items-center justify-between text-xs text-[#7B8885] dark:text-[#8B9B96] font-mono">
            <span>الحروف الغائبة:</span>
            <Layers className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#79A9A0]" />
          </div>
          <div className="mt-1 flex items-baseline gap-2 text-xs font-mono">
            <span className="text-[#53605E] dark:text-[#A8BCB9]">
              {formatSurahName(surahA.name)}: <strong className="text-[#1A5C5C] dark:text-[#79A9A0] tabular-nums">{statsHighlights?.absentInA.length || 0}</strong>
            </span>
            <span>•</span>
            <span className="text-[#53605E] dark:text-[#A8BCB9]">
              {formatSurahName(surahB.name)}: <strong className="text-[#8C6B37] dark:text-[#C5A16A] tabular-nums">{statsHighlights?.absentInB.length || 0}</strong>
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#7B8885] dark:text-[#8B9B96] font-mono truncate">
            {statsHighlights?.sharedAbsent.length 
              ? `المشتركة غياباً: ${statsHighlights.sharedAbsent.join('، ')}`
              : 'لا توجد حروف غائبة مشتركة'}
          </div>
        </div>
      </div>

      {/* CLUSTERED BAR CHART (المخطط الشريطي المتداخل) */}
      <div className={`p-4 sm:p-5 rounded-[8px] border transition-colors ${
        isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DED8C9] dark:border-[#264340] pb-3 mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2 text-[#0F1419] dark:text-[#F4F0E7]">
              <BarChart3 className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
              <span>المخطط الشريطي المتداخل لتباين تكرار الحروف الـ 28</span>
            </h3>
            <p className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] font-mono mt-0.5">
              مقارنة شريطية متجاورة لكل حرف تبين الحجم النسبي وتكشف الفوارق الإيقاعية واللفظية بين السورتين
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#1A5C5C] dark:bg-[#2B7470]"></span>
              <span className="text-[#1A5C5C] dark:text-[#79A9A0] font-bold">{formatSurahName(surahA.name)} (#{surahA.number})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[#B8935F] dark:bg-[#C5A16A]"></span>
              <span className="text-[#8C6B37] dark:text-[#C5A16A] font-bold">{formatSurahName(surahB.name)} (#{surahB.number})</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-[380px] select-none" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {metric === 'difference' ? (
              // Difference Delta Bar Chart (Positive/Negative Divergence)
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={isLight ? 0.25 : 0.08} stroke={isLight ? '#DED8C9' : '#33433F'} />
                <XAxis 
                  dataKey="letter" 
                  tick={{ fill: isLight ? '#0F1419' : '#D1D5DB', fontSize: 13, fontFamily: 'Amiri, Traditional Arabic, serif', fontWeight: 'bold' }} 
                  dy={5}
                />
                <YAxis 
                  tick={{ fill: isLight ? '#53605E' : '#9CA3AF', fontSize: 11, fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <ReferenceLine y={0} stroke={isLight ? '#B3A897' : '#53605E'} />
                <Bar 
                  dataKey="valDiff" 
                  name="فارق التباين" 
                  radius={[3, 3, 0, 0]}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.valDiff >= 0 ? colorA : colorB} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              // Standard Clustered Bar Chart (Two bars side-by-side per letter)
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
                barGap={2}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" opacity={isLight ? 0.25 : 0.08} stroke={isLight ? '#DED8C9' : '#33433F'} />
                <XAxis 
                  dataKey="letter" 
                  tick={{ fill: isLight ? '#0F1419' : '#D1D5DB', fontSize: 13, fontFamily: 'Amiri, Traditional Arabic, serif', fontWeight: 'bold' }} 
                  dy={5}
                />
                <YAxis 
                  tick={{ fill: isLight ? '#53605E' : '#9CA3AF', fontSize: 11, fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }}
                  tickFormatter={(val) => metric === 'percentage' ? `${val}%` : `${val}`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar 
                  dataKey="valA" 
                  name={formatSurahName(surahA.name)} 
                  fill={colorA} 
                  radius={[3, 3, 0, 0]} 
                />
                <Bar 
                  dataKey="valB" 
                  name={formatSurahName(surahB.name)} 
                  fill={colorB} 
                  radius={[3, 3, 0, 0]} 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED DATA TABLE (قابل للطي) */}
      <div className={`p-4 sm:p-5 rounded-[8px] border transition-colors ${
        isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
      }`}>
        <div 
          onClick={() => setShowTable(!showTable)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
            <h4 className="text-xs sm:text-sm font-bold text-[#0F1419] dark:text-[#F4F0E7]">
              جدول المقارنة الرقمية التفصيلية للحروف الـ 28 (النسب والتكرارات والفروق)
            </h4>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#7B8885] transition-transform duration-200 ${showTable ? 'rotate-180' : ''}`} />
        </div>

        {showTable && (
          <div className={`mt-4 overflow-x-auto max-h-[420px] overflow-y-auto border rounded-[6px] ${
            isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
          }`}>
            <table className="w-full text-right text-xs">
              <thead className={`sticky top-0 border-b text-[11px] z-10 font-mono ${
                isLight ? 'bg-[#FAF8F2] border-[#DED8C9] text-[#7B8885]' : 'bg-[#10211F] border-[#264340] text-[#A8BCB9]'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">الحرف</th>
                  <th className="py-2.5 px-3">الاسم</th>
                  <th className="py-2.5 px-3 text-[#1A5C5C] dark:text-[#79A9A0] font-bold">{formatSurahName(surahA.name)} (تكرار)</th>
                  <th className="py-2.5 px-3 text-[#1A5C5C] dark:text-[#79A9A0] font-bold">{formatSurahName(surahA.name)} (%)</th>
                  <th className="py-2.5 px-3 text-[#8C6B37] dark:text-[#C5A16A] font-bold">{formatSurahName(surahB.name)} (تكرار)</th>
                  <th className="py-2.5 px-3 text-[#8C6B37] dark:text-[#C5A16A] font-bold">{formatSurahName(surahB.name)} (%)</th>
                  <th className="py-2.5 px-3">فارق النسبة (Δ)</th>
                  <th className="py-2.5 px-3">السورة الأرجح</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${isLight ? 'divide-[#DED8C9]/60' : 'divide-[#264340]/60'}`}>
                {comparisonData.map(d => (
                  <tr key={d.letter} className={`transition-colors ${isLight ? 'hover:bg-[#F7F4EA]' : 'hover:bg-[#0E201E]'}`}>
                    <td className={`py-2 px-3 font-serif text-base font-bold ${isLight ? 'text-[#8C6B37]' : 'text-[#C5A16A]'}`}>{d.letter}</td>
                    <td className="py-2 px-3 text-[#7B8885] dark:text-[#8B9B96]">{d.letterName}</td>
                    <td className="py-2 px-3 font-bold tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">{d.countA}</td>
                    <td className="py-2 px-3 font-semibold tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">{d.pctA}%</td>
                    <td className="py-2 px-3 font-bold tabular-nums text-[#8C6B37] dark:text-[#C5A16A]">{d.countB}</td>
                    <td className="py-2 px-3 font-semibold tabular-nums text-[#8C6B37] dark:text-[#C5A16A]">{d.pctB}%</td>
                    <td className={`py-2 px-3 font-bold tabular-nums ${
                      d.pctDiff > 0 ? 'text-[#1A5C5C] dark:text-[#79A9A0]' : d.pctDiff < 0 ? 'text-[#8C6B37] dark:text-[#C5A16A]' : 'text-[#7B8885]'
                    }`}>
                      {d.pctDiff > 0 ? `+${d.pctDiff}%` : `${d.pctDiff}%`}
                    </td>
                    <td className="py-2 px-3">
                      {d.pctDiff > 0 ? (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] border border-[#1A5C5C]/30">
                          {formatSurahName(surahA.name)} (+{d.pctDiff}%)
                        </span>
                      ) : d.pctDiff < 0 ? (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] bg-[#B8935F]/15 text-[#8C6B37] dark:text-[#C5A16A] border border-[#B8935F]/30">
                          {formatSurahName(surahB.name)} (+{Math.abs(d.pctDiff)}%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] bg-[#EFECE2] dark:bg-[#122B2A] text-[#7B8885] dark:text-[#8B9B96]">
                          متطابق
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

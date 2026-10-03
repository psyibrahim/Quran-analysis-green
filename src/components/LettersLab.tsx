import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Table, 
  Sparkles, 
  HelpCircle, 
  ArrowUpDown, 
  Info, 
  Filter, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Search, 
  ExternalLink,
  Hash,
  Percent,
  ListOrdered,
  Award,
  BookOpen,
  Volume2,
  Download,
  BarChart3,
  GitCompare
} from 'lucide-react';
import { SurahData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { LetterRankingModal } from './LetterRankingModal';
import { SectionHelpButton } from './SectionHelpModal';
import { CumulativeLetterDistribution } from './CumulativeLetterDistribution';
import { LettersLabInfoModal } from './LettersLabInfoModal';
import { PhoneticRadarAnalysis } from './PhoneticRadarAnalysis';
import { LetterComparisonBarChart } from './LetterComparisonBarChart';
import { exportLetterMatrixToCSV } from '../utils/exportData';
import { formatSurahName } from '../utils/arabic';

export type AlphabetSortOrder = 
  | 'hijai' 
  | 'abjadi' 
  | 'abjadi_maghrebi' 
  | 'frequency_desc' 
  | 'frequency_asc' 
  | 'phonetic';

export type LettersViewMode = 'heatmap' | 'comparator' | 'alphabet' | 'phonetics' | 'diacritics' | 'cumulative';

interface LettersLabProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  view?: LettersViewMode;
}

const LettersLabComponent: React.FC<LettersLabProps> = ({
  surahs,
  letterStats,
  onSelectSurah,
  onOpenInReader,
  view = 'heatmap'
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const activeSubTab = view;
  const [alphabetSortOrder, setAlphabetSortOrder] = useState<AlphabetSortOrder>('hijai');
  const [selectedLetter, setSelectedLetter] = useState<string | 'all'>('all');
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [heatmapSortLetter, setHeatmapSortLetter] = useState<string | null>(null);
  const [heatmapMetric, setHeatmapMetric] = useState<'percentage' | 'count'>('percentage');
  const [alphabetSearch, setAlphabetSearch] = useState('');
  const [alphabetMetric, setAlphabetMetric] = useState<'count' | 'percentage'>('count');

  const [rankingModalLetter, setRankingModalLetter] = useState<string | null>(null);

  const letters = letterStats.letters;

  // Compute sorted 28 letters according to user-selected alphabet order
  const sortedLetters = useMemo(() => {
    const base = [...letters];
    if (alphabetSortOrder === 'hijai') return base;
    if (alphabetSortOrder === 'abjadi') {
      const abjadiOrder = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'];
      return [...base].sort((a, b) => {
        const iA = abjadiOrder.indexOf(a);
        const iB = abjadiOrder.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
      });
    }
    if (alphabetSortOrder === 'abjadi_maghrebi') {
      const maghrebiOrder = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'ص', 'ع', 'ف', 'ض', 'ق', 'ر', 'س', 'ت', 'ث', 'خ', 'ذ', 'ظ', 'غ', 'ش'];
      return [...base].sort((a, b) => {
        const iA = maghrebiOrder.indexOf(a);
        const iB = maghrebiOrder.indexOf(b);
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
        const cA = letterStats.globalStats[a]?.totalOccurrences || 0;
        const cB = letterStats.globalStats[b]?.totalOccurrences || 0;
        return cB - cA;
      });
    }
    if (alphabetSortOrder === 'frequency_asc') {
      return [...base].sort((a, b) => {
        const cA = letterStats.globalStats[a]?.totalOccurrences || 0;
        const cB = letterStats.globalStats[b]?.totalOccurrences || 0;
        return cA - cB;
      });
    }
    return base;
  }, [letters, letterStats.globalStats, alphabetSortOrder]);

  // Filtered and sorted surahs for heatmap
  const heatmapSurahs = useMemo(() => {
    let list = surahs.filter(s => {
      if (heatmapFilter === 'all') return true;
      return s.revelationType === heatmapFilter;
    });

    if (heatmapSortLetter) {
      list = [...list].sort((a, b) => {
        if (heatmapMetric === 'count') {
          const cB = b.letters.plainCounts[heatmapSortLetter] || 0;
          const cA = a.letters.plainCounts[heatmapSortLetter] || 0;
          return cB - cA;
        } else {
          const pB = b.letters.plainPercentages[heatmapSortLetter] || 0;
          const pA = a.letters.plainPercentages[heatmapSortLetter] || 0;
          return pB - pA;
        }
      });
    } else {
      list = [...list].sort((a, b) => a.number - b.number);
    }

    return list;
  }, [surahs, heatmapFilter, heatmapSortLetter, heatmapMetric]);

  // Dynamic calculation of real count and percentage extremes for each letter (only computed when alphabet subtab is active)
  const dynamicLetterStats = useMemo(() => {
    if (activeSubTab !== 'alphabet') {
      return {} as Record<string, any>;
    }

    const map: Record<string, {
      letter: string;
      name: string;
      totalOccurrences: number;
      maxCountSurah: {
        number: number;
        name: string;
        count: number;
        percentage: number;
      };
      minCountSurah: {
        number: number;
        name: string;
        count: number;
        percentage: number;
        tiedCount: number;
      };
      maxPctSurah: {
        number: number;
        name: string;
        count: number;
        percentage: number;
      };
      minPctSurah: {
        number: number;
        name: string;
        count: number;
        percentage: number;
        tiedCount: number;
      };
      surahsWithZero: Array<{
        number: number;
        name: string;
      }>;
    }> = {};

    letters.forEach(letter => {
      const name = letterStats.letterNames[letter] || letter;
      let totalOccurrences = 0;
      const nonZeroSurahs: Array<{ surah: SurahData; count: number; pct: number }> = [];
      const zeroSurahs: Array<{ number: number; name: string }> = [];

      surahs.forEach(s => {
        const count = s.letters.plainCounts[letter] || 0;
        const pct = s.letters.plainPercentages[letter] || 0;
        totalOccurrences += count;
        if (count > 0) {
          nonZeroSurahs.push({ surah: s, count, pct });
        } else {
          zeroSurahs.push({ number: s.number, name: s.name });
        }
      });

      // 1. By Real Count
      const sortedByCountDesc = [...surahs].sort((a, b) => {
        const diff = (b.letters.plainCounts[letter] || 0) - (a.letters.plainCounts[letter] || 0);
        return diff !== 0 ? diff : a.number - b.number;
      });

      const sortedNonZeroCountAsc = [...nonZeroSurahs].sort((a, b) => {
        const diff = a.count - b.count;
        return diff !== 0 ? diff : a.surah.number - b.surah.number;
      });

      const maxCountItem = sortedByCountDesc[0];
      const minCountItem = sortedNonZeroCountAsc[0];
      const minCountVal = minCountItem?.count ?? 0;
      const minCountTied = sortedNonZeroCountAsc.filter(i => i.count === minCountVal).length;

      // 2. By Percentage
      const sortedByPctDesc = [...surahs].sort((a, b) => {
        const diff = (b.letters.plainPercentages[letter] || 0) - (a.letters.plainPercentages[letter] || 0);
        return diff !== 0 ? diff : a.number - b.number;
      });

      const sortedNonZeroPctAsc = [...nonZeroSurahs].sort((a, b) => {
        const diff = a.pct - b.pct;
        return diff !== 0 ? diff : a.surah.number - b.surah.number;
      });

      const maxPctItem = sortedByPctDesc[0];
      const minPctItem = sortedNonZeroPctAsc[0];
      const minPctVal = minPctItem?.pct ?? 0;
      const minPctTied = sortedNonZeroPctAsc.filter(i => i.pct === minPctVal).length;

      map[letter] = {
        letter,
        name,
        totalOccurrences,
        maxCountSurah: {
          number: maxCountItem ? maxCountItem.number : 1,
          name: maxCountItem ? maxCountItem.name : '',
          count: maxCountItem ? (maxCountItem.letters.plainCounts[letter] || 0) : 0,
          percentage: maxCountItem ? (maxCountItem.letters.plainPercentages[letter] || 0) : 0
        },
        minCountSurah: {
          number: minCountItem ? minCountItem.surah.number : 1,
          name: minCountItem ? minCountItem.surah.name : '',
          count: minCountVal,
          percentage: minCountItem ? minCountItem.pct : 0,
          tiedCount: minCountTied
        },
        maxPctSurah: {
          number: maxPctItem ? maxPctItem.number : 1,
          name: maxPctItem ? maxPctItem.name : '',
          count: maxPctItem ? (maxPctItem.letters.plainCounts[letter] || 0) : 0,
          percentage: maxPctItem ? (maxPctItem.letters.plainPercentages[letter] || 0) : 0
        },
        minPctSurah: {
          number: minPctItem ? minPctItem.surah.number : 1,
          name: minPctItem ? minPctItem.surah.name : '',
          count: minPctItem ? minPctItem.count : 0,
          percentage: minPctVal,
          tiedCount: minPctTied
        },
        surahsWithZero: zeroSurahs
      };
    });

    return map;
  }, [surahs, letters, letterStats.letterNames, activeSubTab]);

  // Single-hue sequential teal scale matching scholarly research instrument guidelines
  const getCellColor = (percentage: number, lightMode: boolean) => {
    if (lightMode) {
      if (percentage === 0) return 'bg-[#F1ECE0] text-[#7B8885] border-[#DED8C9]';
      if (percentage < 2) return 'bg-[#EDF5F4] text-[#1A5C5C]/80 border-[#D8E7E4]';
      if (percentage < 5) return 'bg-[#DCEAE7] text-[#1A5C5C] border-[#CADED9]';
      if (percentage < 8) return 'bg-[#BBD9D2] text-[#164D4D] font-medium border-[#A8CCC4]';
      if (percentage < 12) return 'bg-[#76B0A5] text-[#0A2626] font-semibold border-[#629E92]';
      if (percentage < 16) return 'bg-[#2E756C] text-[#F4F0E7] font-bold border-[#205851]';
      return 'bg-[#1A5C5C] text-[#F4F0E7] font-bold border-[#B8935F]';
    }

    // Dark mode single-hue deep teal scale
    if (percentage === 0) return 'bg-[#131F1E] text-[#556965] border-[#1E2E2C]';
    if (percentage < 2) return 'bg-[#152827] text-[#86A8A4] border-[#1D3A38]';
    if (percentage < 5) return 'bg-[#183937] text-[#A6C9C4] border-[#204947]';
    if (percentage < 8) return 'bg-[#1D4E4A] text-[#C2E3DF] font-medium border-[#245D58]';
    if (percentage < 12) return 'bg-[#23635E] text-[#F4F0E7] font-semibold border-[#2E7A74]';
    if (percentage < 16) return 'bg-[#2B7470] text-[#F4F0E7] font-bold border-[#38918C]';
    return 'bg-[#358A85] text-[#F4F0E7] font-bold border-[#C5A16A]';
  };

  // Diacritics aggregate across Quran (only computed when diacritics subtab is active)
  const totalDiacritics = useMemo(() => {
    const agg = {
      fatha: 0,
      damma: 0,
      kasra: 0,
      sukun: 0,
      tanweenFath: 0,
      tanweenDamm: 0,
      tanweenKasr: 0,
      shaddah: 0,
      maddah: 0,
      total: 0
    };

    if (activeSubTab !== 'diacritics') return agg;

    surahs.forEach(s => {
      agg.fatha += s.diacritics.fatha;
      agg.damma += s.diacritics.damma;
      agg.kasra += s.diacritics.kasra;
      agg.sukun += s.diacritics.sukun;
      agg.tanweenFath += s.diacritics.tanweenFath;
      agg.tanweenDamm += s.diacritics.tanweenDamm;
      agg.tanweenKasr += s.diacritics.tanweenKasr;
      agg.shaddah += s.diacritics.shaddah;
      agg.maddah += s.diacritics.maddah;
      agg.total += s.diacritics.total;
    });

    return agg;
  }, [surahs, activeSubTab]);

  const diacriticsArray = [
    { label: 'الفتحة ( َ )', count: totalDiacritics.fatha, color: '#4FB7B2', desc: 'أكثر الحركات شيوعاً في النص القرآني' },
    { label: 'الكسرة ( ِ )', count: totalDiacritics.kasra, color: '#34D399', desc: 'علامة الجر والتخفيف الصوتي' },
    { label: 'الضمة ( ُ )', count: totalDiacritics.damma, color: '#4F8D88', desc: 'علامة الرفع والضم' },
    { label: 'السكون ( ْ )', count: totalDiacritics.sukun, color: '#97A8A3', desc: 'الوقف والجمود الصوتي' },
    { label: 'الشدة والتضعيف ( ّ )', count: totalDiacritics.shaddah, color: '#F43F5E', desc: 'مؤشر التوكيد الصوتي والإدغام' },
    { label: 'تنوين الفتح ( ً )', count: totalDiacritics.tanweenFath, color: '#FBBF24', desc: 'تنوين النصب والإطلاق' },
    { label: 'تنوين الكسر ( ٍ )', count: totalDiacritics.tanweenKasr, color: '#D97706', desc: 'تنوين الخفض والجر' },
    { label: 'تنوين الضم ( ٌ )', count: totalDiacritics.tanweenDamm, color: '#F59E0B', desc: 'تنوين الرفع والإسناد' },
    { label: 'ألفات خنجرية ومدود', count: totalDiacritics.maddah, color: '#84CC16', desc: 'المد الصوتي وعلامات الضبط' },
  ];

  return (
    <div className="space-y-3">
      
      {/* Tool Header */}
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-[8px] border transition-colors shadow-2xs"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-[6px] border flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--color-primary-soft)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-primary)'
            }}
          >
            {activeSubTab === 'heatmap' && <Flame className="w-4 h-4" />}
            {activeSubTab === 'comparator' && <BarChart3 className="w-4 h-4" />}
            {activeSubTab === 'alphabet' && <Layers className="w-4 h-4" />}
            {activeSubTab === 'phonetics' && <Sparkles className="w-4 h-4" />}
            {activeSubTab === 'diacritics' && <BookOpen className="w-4 h-4" />}
            {activeSubTab === 'cumulative' && <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-base font-bold font-heading flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <span>
                {activeSubTab === 'heatmap' && 'خريطة الحروف — المصفوفة الحرارية (114×28)'}
                {activeSubTab === 'comparator' && 'مقارنة تكرار الحروف — مخطط شريطي متداخل بين سورتين'}
                {activeSubTab === 'alphabet' && 'القيم القصوى للحروف — دليل الـ 28 حرفاً وأعلى وأدنى السور'}
                {activeSubTab === 'phonetics' && 'مخارج وأصوات الحروف — رادار المخارج والصفات الصوتية'}
                {activeSubTab === 'diacritics' && 'حركات التشكيل والضبط — إحصاء الحركات وعلامات الضبط'}
                {activeSubTab === 'cumulative' && 'التوزيع التراكمي للحروف — منحنى التراكم والكثافة'}
              </span>
            </h2>
            <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              {activeSubTab === 'heatmap' && 'تحليل وتوزيع نسب وتكرارات الحروف الـ 28 عبر الـ 114 سورة'}
              {activeSubTab === 'comparator' && 'مقارنة بيانية مباشرة لتباين تكرار ونسب الحروف الـ 28 بين سورتين عبر مخطط شريطي متداخل مع قياسات المسافة والتشابه'}
              {activeSubTab === 'alphabet' && 'السور ذات القيم القصوى والدنيا لكل حرف وترتيب الحروف الهجائي والصوتي'}
              {activeSubTab === 'phonetics' && 'تحليل مخارج الحروف الشفوية والحلقية واللسانية والصفات الجهرية والهمسية'}
              {activeSubTab === 'diacritics' && 'توزيع الفتح والضم والكسر والسكون والشدات والتنوين في الرسم العثماني'}
              {activeSubTab === 'cumulative' && 'المنحنى البياني التراكمي وتدفق الحروف عبر الترتيب المصحفي'}
            </p>
          </div>
        </div>

        {/* Action Controls Container */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            {/* Export Matrix CSV Button */}
            <button
              onClick={() => exportLetterMatrixToCSV(surahs, letterStats)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] text-xs font-mono font-bold transition-all border cursor-pointer shrink-0 bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white border-[var(--color-border)] shadow-2xs"
              title="تصدير مصفوفة الحروف الـ 28 للـ 114 سورة كملف Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
              <span className="hidden md:inline">تصدير المصفوفة (Excel)</span>
              <span className="md:hidden">Excel</span>
            </button>

            {/* Methodology and Statistical Info Modal Button */}
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] text-xs font-mono font-bold transition-all border cursor-pointer shrink-0 bg-[var(--color-gold-soft)] hover:bg-[var(--color-gold)] text-[var(--color-text-primary)] hover:text-white border-[var(--color-border)] shadow-2xs"
              title="المنهجية الرياضية والمصطلحات الإحصائية: شرح الأسس والمعادلات والمصطلحات"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
              <span className="hidden md:inline">المنهجية الرياضية والمصطلحات</span>
              <span className="md:hidden">المنهجية</span>
            </button>

            <div className="h-5 w-px hidden sm:block" style={{ backgroundColor: 'var(--color-border)' }}></div>

            {/* Isolated Corner Help Button */}
            <SectionHelpButton 
              guideId={
                activeSubTab === 'comparator' ? 'letters-lab-matrix' :
                activeSubTab === 'alphabet' ? 'letters-lab-extrema' :
                activeSubTab === 'diacritics' ? 'letters-lab-diacritics' :
                activeSubTab === 'cumulative' ? 'letters-lab-cumulative' : 'letters-lab-matrix'
              }
              variant="icon"
              title="استعلام: شرح هذا القسم، غايته، والمنهجية الحسابية"
            />
          </div>
        </div>

      {/* SUB TAB 1: 114x28 HEATMAP */}
      {activeSubTab === 'heatmap' && (
        <div className="space-y-3">
          
          {/* Heatmap Controls & Legend */}
          <div className={`rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs border transition-colors ${
            isLight ? 'bg-white border-ink-200 shadow-xs' : 'sci-bg sci-border'
          }`}>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Revelation Filter */}
              <div className="flex items-center gap-1">
                <span className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-ink-600' : 'text-emerald-400'}`}>النزول:</span>
                {[
                  { id: 'all', label: 'الكل (114)' },
                  { id: 'Meccan', label: 'مكية (86)' },
                  { id: 'Medinan', label: 'مدنية (28)' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHeatmapFilter(f.id as any)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-all cursor-pointer ${
                      heatmapFilter === f.id
                        ? (isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shadow-2xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold')
                        : (isLight ? 'bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200' : 'bg-ink-900 text-ink-400 hover:bg-ink-800 border border-ink-800')
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Alphabet Sort Order for Heatmap Columns */}
              <div className={`flex items-center gap-1.5 border-r pr-2 mr-1 ${isLight ? 'border-ink-300' : 'border-ink-800'}`}>
                <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>ترتيب الحروف:</span>
                <select
                  value={alphabetSortOrder}
                  onChange={(e) => setAlphabetSortOrder(e.target.value as AlphabetSortOrder)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-mono font-bold border transition-colors focus:outline-none focus:border-emerald-500 cursor-pointer ${
                    isLight ? 'bg-ink-50 border-ink-300 text-ink-900' : 'bg-ink-900 border-ink-700 text-ink-200'
                  }`}
                  title="تغيير نمط ترتيب الأعمدة الأبجدية في الخريطة الحرارية والمختبر"
                >
                  <option value="hijai">الترتيب الهجائي القياسي (أ، ب، ت، ث...)</option>
                  <option value="abjadi">الترتيب الأبجدي المشرقي (أبجد، هوز، حطي...)</option>
                  <option value="abjadi_maghrebi">الترتيب الأبجدي المغربي (أبجد، هوز... صعفض)</option>
                  <option value="frequency_desc">الأكثر شيوعاً في القرآن (تنازلياً)</option>
                  <option value="frequency_asc">الأقل شيوعاً في القرآن (تصاعدياً)</option>
                  <option value="phonetic">الترتيب الصوتي للمخارج (الخليل بن أحمد)</option>
                </select>
              </div>

              {/* Metric Type Selector: Raw Count vs Percentage */}
              <div className={`flex items-center gap-1 border-r pr-2 mr-1 ${isLight ? 'border-ink-300' : 'border-ink-800'}`}>
                <span className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>عرض الأرقام:</span>
                <button
                  type="button"
                  onClick={() => setHeatmapMetric('count')}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-all cursor-pointer ${
                    heatmapMetric === 'count'
                      ? (isLight ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-xs' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm')
                      : (isLight ? 'bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200' : 'bg-ink-900 text-ink-400 hover:bg-ink-800 border border-ink-800')
                  }`}
                  title="عرض التعداد الحقيقي الخام للحروف في كل سورة"
                >
                  التعداد الحقيقي (عدد الحروف)
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapMetric('percentage')}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-all cursor-pointer ${
                    heatmapMetric === 'percentage'
                      ? (isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shadow-xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm')
                      : (isLight ? 'bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200' : 'bg-ink-900 text-ink-400 hover:bg-ink-800 border border-ink-800')
                  }`}
                  title="عرض النسبة المئوية للحرف (%) من إجمالي حروف السورة"
                >
                  النسبة المئوية (%)
                </button>
              </div>

              {heatmapSortLetter && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${
                  isLight 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <span>فرز بحرف: <strong className="font-heading">{heatmapSortLetter}</strong> ({heatmapMetric === 'count' ? 'تعداد' : 'نسبة'})</span>
                  <button 
                    onClick={() => setHeatmapSortLetter(null)}
                    className={`ml-1 cursor-pointer font-bold ${isLight ? 'text-ink-500 hover:text-ink-900' : 'text-ink-400 hover:text-white'}`}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] uppercase font-mono font-bold ${isLight ? 'text-ink-700' : 'text-emerald-400'}`}>
                تدرج التردد:
              </span>
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {isLight ? (
                  <>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#F1ECE0] text-[#7B8885] border border-[#DED8C9]">0٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#EDF5F4] text-[#1A5C5C] border border-[#D8E7E4]">&lt; 2٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#DCEAE7] text-[#1A5C5C] border border-[#CADED9]">2-5٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#BBD9D2] text-[#164D4D] border border-[#A8CCC4]">5-8٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#76B0A5] text-[#0A2626] font-medium border border-[#629E92]">8-12٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#2E756C] text-[#F4F0E7] font-bold border border-[#205851]">12-16٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#1A5C5C] text-[#F4F0E7] font-bold border border-[#B8935F]">&gt; 16٪</span>
                  </>
                ) : (
                  <>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#131F1E] text-[#556965] border border-[#1E2E2C]">0٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#152827] text-[#86A8A4] border border-[#1D3A38]">&lt; 2٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#183937] text-[#A6C9C4] border border-[#204947]">2-5٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#1D4E4A] text-[#C2E3DF] border border-[#245D58]">5-8٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#23635E] text-[#F4F0E7] font-medium border border-[#2E7A74]">8-12٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#2B7470] text-[#F4F0E7] font-bold border border-[#38918C]">12-16٪</span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#358A85] text-[#F4F0E7] font-bold border border-[#C5A16A]">&gt; 16٪</span>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Interactive Heatmap Matrix Grid */}
          <div className={`rounded-xl overflow-hidden shadow-xs border transition-colors ${
            isLight ? 'bg-white border-ink-200' : 'sci-bg sci-border'
          }`}>
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full text-center border-collapse">
                
                {/* Header Row: 28 Letters */}
                <thead className={`sticky top-0 z-20 border-b shadow transition-colors ${
                  isLight ? 'bg-ink-100 text-ink-800 border-ink-200' : 'bg-[#0B1716] text-emerald-400 border-ink-800'
                }`}>
                  <tr>
                    <th className={`p-2 text-right sticky right-0 z-30 min-w-[140px] border-l text-[11px] font-mono transition-colors ${
                      isLight ? 'bg-ink-100 text-ink-800 border-ink-200' : 'bg-[#0B1716] text-emerald-400 border-ink-800'
                    }`}>
                      السورة
                    </th>
                    {sortedLetters.map((letter) => (
                      <th 
                        key={letter}
                        onClick={() => setHeatmapSortLetter(heatmapSortLetter === letter ? null : letter)}
                        className={`p-1.5 min-w-[34px] font-heading font-bold text-sm cursor-pointer transition-all ${
                          heatmapSortLetter === letter 
                            ? (isLight ? 'bg-emerald-200 text-emerald-900 border-b-2 border-emerald-600' : 'bg-emerald-500/30 text-emerald-200 border-b-2 border-emerald-400') 
                            : (isLight ? 'text-ink-700 hover:bg-ink-200' : 'text-ink-300 hover:bg-emerald-500/20')
                        }`}
                        title={`انقر لترتيب السور حسب ${heatmapMetric === 'count' ? 'تعداد' : 'نسبة'} حرف ${letter}`}
                      >
                        <div>{letter}</div>
                        <div className={`text-[8px] font-mono font-normal ${isLight ? 'text-ink-500' : 'text-ink-400'}`}>
                          {letterStats.letterNames[letter]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body Rows: 114 Surahs */}
                <tbody className={`divide-y text-xs transition-colors ${isLight ? 'divide-ink-200 bg-white' : 'divide-ink-800/80'}`}>
                  {heatmapSurahs.map((surah) => (
                    <tr 
                      key={surah.number}
                      className={`transition-colors group ${isLight ? 'hover:bg-emerald-50/60' : 'hover:bg-ink-800/40'}`}
                    >
                      {/* Sticky Surah Name */}
                      <td 
                        onClick={() => onSelectSurah(surah)}
                        className={`p-1.5 text-right sticky right-0 z-10 border-l cursor-pointer transition-colors ${
                          isLight 
                            ? 'bg-white group-hover:bg-emerald-50 border-ink-200' 
                            : 'bg-[#10211F] group-hover:bg-ink-800 border-ink-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-5 text-[10px] font-mono font-semibold ${isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'}`}>{surah.number}</span>
                            <span className={`font-heading font-bold transition-colors text-sm ${
                              isLight ? 'text-ink-900 group-hover:text-emerald-700' : 'text-ink-200 group-hover:text-emerald-300'
                            }`}>
                              {surah.name}
                            </span>
                          </div>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                            surah.isMeccan 
                              ? (isLight ? 'text-amber-800 bg-amber-50 border border-amber-200 font-medium' : 'text-amber-400 bg-amber-950/40 border border-amber-800/50') 
                              : (isLight ? 'text-teal-800 bg-teal-50 border border-teal-200 font-medium' : 'text-teal-400 bg-teal-950/40 border border-teal-800/50')
                          }`}>
                            {surah.isMeccan ? 'مك' : 'مد'}
                          </span>
                        </div>
                      </td>

                      {/* 28 Letter Cells */}
                      {sortedLetters.map((letter) => {
                        const count = surah.letters.plainCounts[letter] || 0;
                        const pct = surah.letters.plainPercentages[letter] || 0;
                        const colorClass = getCellColor(pct, isLight);

                        return (
                          <td 
                            key={letter}
                            className={`p-1 font-mono text-[10px] border transition-colors ${
                              isLight ? 'border-ink-200' : 'border-ink-800/60'
                            } ${colorClass}`}
                            title={`${surah.name} - حرف ${letter} (${letterStats.letterNames[letter]}): ${count.toLocaleString('en-US')} مرة (${pct}%)`}
                          >
                            {heatmapMetric === 'count' 
                              ? (count > 0 ? count.toLocaleString('en-US') : '0')
                              : (pct > 0 ? pct : '0')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB: CLUSTERED BAR CHART COMPARATOR */}
      {activeSubTab === 'comparator' && (
        <LetterComparisonBarChart
          surahs={surahs}
          letterStats={letterStats}
          onSelectSurah={onSelectSurah}
          onOpenInReader={onOpenInReader}
        />
      )}

      {/* SUB TAB 2: 28 LETTERS ALPHABET DIRECTORY & EXTREMES */}
      {activeSubTab === 'alphabet' && (
        <div className="space-y-3">
          
          {/* Controls Bar: Search & Metric Toggle */}
          <div className="sci-bg sci-border rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search input */}
            <div className="relative w-full md:w-72">
              <Search className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`} />
              <input
                type="text"
                value={alphabetSearch}
                onChange={(e) => setAlphabetSearch(e.target.value)}
                placeholder="ابحث بالحرف أو اسمه (مثال: ن، سين)..."
                className={`w-full rounded-lg pr-9 pl-4 py-1.5 text-xs font-sans focus:outline-none focus:border-[#1A5C5C] transition-colors ${
                  isLight 
                    ? 'bg-white border border-ink-300 text-ink-900 placeholder-ink-400' 
                    : 'bg-black/50 border border-ink-700/80 text-ink-100 placeholder-ink-500'
                }`}
              />
            </div>

            {/* Metric Switcher: Real Count vs Percentage */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-mono ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                معيار العرض والقصوى:
              </span>
              <div className={`flex items-center gap-1 p-1 rounded-xl border font-mono transition-colors ${
                isLight ? 'bg-white border-ink-300' : 'bg-black/40 border-ink-800'
              }`}>
                <button
                  onClick={() => setAlphabetMetric('count')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    alphabetMetric === 'count'
                      ? 'bg-[#1A5C5C] text-white font-bold shadow-xs'
                      : isLight 
                        ? 'text-ink-600 hover:text-ink-900' 
                        : 'text-ink-400 hover:text-ink-200'
                  }`}
                  title="عرض وترتيب السور بحسب التعداد الحقيقي (مرات الظهور الفعلية)"
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>التعداد الحقيقي (العدد الخام)</span>
                </button>
                <button
                  onClick={() => setAlphabetMetric('percentage')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    alphabetMetric === 'percentage'
                      ? 'bg-[#1A5C5C] text-white font-bold shadow-xs'
                      : isLight 
                        ? 'text-ink-600 hover:text-ink-900' 
                        : 'text-ink-400 hover:text-ink-200'
                  }`}
                  title="عرض وترتيب السور بحسب النسبة المئوية من حروف السورة"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>النسبة المئوية (%)</span>
                </button>
              </div>

              {/* Alphabet Sort Order Selector */}
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-mono whitespace-nowrap ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                  الترتيب الأبجدي:
                </span>
                <select
                  value={alphabetSortOrder}
                  onChange={(e) => setAlphabetSortOrder(e.target.value as AlphabetSortOrder)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-mono font-bold border transition-colors focus:outline-none focus:border-[#1A5C5C] cursor-pointer ${
                    isLight ? 'bg-white border-ink-300 text-ink-900 shadow-2xs' : 'bg-black/40 border-ink-700 text-ink-100'
                  }`}
                  title="تغيير نمط ترتيب الحروف الـ 28"
                >
                  <option value="hijai">الترتيب الهجائي القياسي (أ، ب، ت، ث...)</option>
                  <option value="abjadi">الترتيب الأبجدي المشرقي (أبجد، هوز، حطي...)</option>
                  <option value="abjadi_maghrebi">الترتيب الأبجدي المغربي (أبجد، هوز... صعفض)</option>
                  <option value="frequency_desc">الأكثر شيوعاً في القرآن (تنازلياً)</option>
                  <option value="frequency_asc">الأقل شيوعاً في القرآن (تصاعدياً)</option>
                  <option value="phonetic">الترتيب الصوتي للمخارج (الخليل بن أحمد)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Quick Letter Navigation Bar */}
          <div className="sci-bg sci-border rounded-xl p-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className={`text-[10px] font-mono whitespace-nowrap pl-1 ${isLight ? 'text-ink-600 font-bold' : 'text-ink-400'}`}>
              ترتيب فوري بحرف:
            </span>
            {sortedLetters.map((l) => (
              <button
                key={l}
                onClick={() => setRankingModalLetter(l)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-heading font-bold text-sm sm:text-base flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer ${
                  isLight 
                    ? 'bg-white hover:bg-[#1A5C5C]/15 hover:text-[#1A5C5C] text-ink-800 border border-ink-300 shadow-xs' 
                    : 'bg-ink-900/90 hover:bg-[#1A5C5C]/30 hover:text-[#52C592] text-ink-300 border border-ink-800'
                }`}
                title={`استعراض ترتيب الـ 114 سورة بحرف «${l}»`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* 28 Letters Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedLetters
              .filter(l => {
                const name = letterStats.letterNames[l] || l;
                return !alphabetSearch || l.includes(alphabetSearch) || name.includes(alphabetSearch);
              })
              .map((letter) => {
                const stat = dynamicLetterStats[letter];
                if (!stat) return null;

                const hasZeros = stat.surahsWithZero.length > 0;

                return (
                  <div 
                    key={letter}
                    className={`rounded-xl p-3 space-y-2.5 shadow-sm transition-all flex flex-col justify-between border ${
                      isLight 
                        ? 'bg-white hover:border-[#1A5C5C]/60 border-ink-200 text-ink-900 shadow-ink-200/50' 
                        : 'sci-bg sci-border hover:border-[#2B7470] text-ink-100'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Letter Header */}
                      <div className={`flex items-center justify-between border-b pb-2 ${
                        isLight ? 'border-ink-200' : 'border-ink-800'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-heading font-bold text-2xl shrink-0 border ${
                            isLight 
                              ? 'bg-[#1A5C5C]/10 border-[#1A5C5C]/30 text-[#1A5C5C]' 
                              : 'bg-[#1A5C5C]/20 border-[#1A5C5C]/40 text-[#52C592]'
                          }`}>
                            {letter}
                          </div>
                          <div>
                            <h3 className={`font-bold text-sm ${isLight ? 'text-ink-900' : 'text-ink-100'}`}>
                              حرف {stat.name}
                            </h3>
                            <span className={`text-[10px] font-mono ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                              {stat.totalOccurrences.toLocaleString('en-US')} تكرار بالقرآن
                            </span>
                          </div>
                        </div>

                        {/* Direct ranking button */}
                        <button
                          onClick={() => setRankingModalLetter(letter)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1 active:scale-95 shrink-0 border cursor-pointer ${
                            isLight 
                              ? 'bg-[#1A5C5C]/10 hover:bg-[#1A5C5C] hover:text-white border-[#1A5C5C]/30 text-[#1A5C5C] font-semibold' 
                              : 'bg-[#1A5C5C]/20 hover:bg-[#1A5C5C] hover:text-white border-[#1A5C5C]/40 text-[#52C592]'
                          }`}
                          title={`استعراض ترتيب الـ 114 سورة بحرف ${letter}`}
                        >
                          <ListOrdered className="w-3 h-3" />
                          <span>ترتيب السور</span>
                        </button>
                      </div>

                      {/* Extremes: Highest & Lowest based on active metric */}
                      <div className="space-y-1.5 text-xs font-mono">
                        
                        {/* 1. Max Surah */}
                        <div className={`p-2 rounded-lg border flex items-center justify-between transition-colors ${
                          isLight 
                            ? 'bg-emerald-50/80 border-emerald-200 text-ink-900' 
                            : 'bg-[#0B1716] border-ink-800 text-ink-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                            <div>
                              <div className={`text-[9px] uppercase font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                                {alphabetMetric === 'count' ? 'الأكثر تكراراً (بالتعداد الفعلي)' : 'الأعلى نسبة مئوية (%)'}
                              </div>
                              <div className={`font-heading font-bold text-xs ${isLight ? 'text-ink-900' : 'text-ink-200'}`}>
                                {formatSurahName(alphabetMetric === 'count' ? stat.maxCountSurah.name : stat.maxPctSurah.name)}
                              </div>
                            </div>
                          </div>
                          <div className="text-left font-mono">
                            <div className={`font-bold text-xs ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                              {alphabetMetric === 'count' 
                                ? `${stat.maxCountSurah.count.toLocaleString('en-US')} مرة`
                                : `${stat.maxPctSurah.percentage}%`}
                            </div>
                            <div className={`text-[9px] ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                              {alphabetMetric === 'count' 
                                ? `(${stat.maxCountSurah.percentage}% من حروفها)`
                                : `(${stat.maxPctSurah.count.toLocaleString('en-US')} مرة)`}
                            </div>
                          </div>
                        </div>

                        {/* 2. Min Surah (Non-zero) */}
                        <div className={`p-2 rounded-lg border flex items-center justify-between transition-colors ${
                          isLight 
                            ? 'bg-[#F4F9F7] border-[#D1E6E1] text-ink-900' 
                            : 'bg-[#0B1716] border-ink-800 text-ink-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <TrendingDown className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`} />
                            <div>
                              <div className={`text-[9px] uppercase font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`}>
                                {alphabetMetric === 'count' ? 'الأقل تكراراً (غير صفرية > 0)' : 'الأدنى نسبة (غير صفرية > 0)'}
                              </div>
                              <div className={`font-heading font-bold text-xs ${isLight ? 'text-ink-900' : 'text-ink-200'}`}>
                                {formatSurahName(alphabetMetric === 'count' ? stat.minCountSurah.name : stat.minPctSurah.name)}
                              </div>
                            </div>
                          </div>
                          <div className="text-left font-mono">
                            <div className={`font-bold text-xs ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`}>
                              {alphabetMetric === 'count' 
                                ? `${stat.minCountSurah.count.toLocaleString('en-US')} مرة`
                                : `${stat.minPctSurah.percentage}%`}
                            </div>
                            <div className={`text-[9px] ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                              {alphabetMetric === 'count' 
                                ? `(${stat.minCountSurah.percentage}% من حروفها)`
                                : `(${stat.minPctSurah.count.toLocaleString('en-US')} مرة)`}
                            </div>
                          </div>
                        </div>

                        {/* Secondary Summary Indicator */}
                        <div className={`px-2 py-1 rounded text-[10px] flex items-center justify-between border ${
                          isLight 
                            ? 'bg-ink-100/90 border-ink-200 text-ink-700' 
                            : 'bg-black/30 border-ink-800/80 text-ink-400'
                        }`}>
                          <span className={`font-mono ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                            {alphabetMetric === 'count' ? 'بالنسبة المئوية:' : 'بالتعداد الفعلي:'}
                          </span>
                          <span className={`font-mono font-medium ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                            {alphabetMetric === 'count' 
                              ? `الأعلى ${stat.maxPctSurah.name} (${stat.maxPctSurah.percentage}%) • الأقل ${stat.minPctSurah.name} (${stat.minPctSurah.percentage}%)`
                              : `الأعلى ${stat.maxCountSurah.name} (${stat.maxCountSurah.count.toLocaleString('en-US')} مرة) • الأقل ${stat.minCountSurah.name} (${stat.minCountSurah.count.toLocaleString('en-US')} مرة)`}
                          </span>
                        </div>

                        {/* Absent Surahs */}
                        <div className={`p-2 rounded-lg border transition-colors ${
                          isLight ? 'bg-ink-50 border-ink-200' : 'bg-[#0B1716] border-ink-800'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] uppercase ${isLight ? 'text-ink-600 font-semibold' : 'text-ink-400'}`}>
                              السور الخالية من الحرف (0):
                            </span>
                            <span className={`font-mono font-bold text-xs ${
                              hasZeros 
                                ? isLight ? 'text-red-600' : 'text-red-400' 
                                : isLight ? 'text-emerald-700' : 'text-emerald-400'
                            }`}>
                              {hasZeros ? `${stat.surahsWithZero.length} سورة` : 'لا توجد (موجود بالكل)'}
                            </span>
                          </div>
                          {hasZeros ? (
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scroll-smooth pr-0.5">
                              {stat.surahsWithZero.map(s => (
                                <span 
                                  key={s.number} 
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-heading border ${
                                    isLight 
                                      ? 'bg-red-50 text-red-700 border-red-200 font-semibold' 
                                      : 'bg-red-950/40 text-red-300 border-red-800/40'
                                  }`}
                                >
                                  {s.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className={`text-[10px] ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}>
                              موجود في جميع سور القرآن الـ 114!
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Card Footer: Full ranking trigger */}
                    <button
                      onClick={() => setRankingModalLetter(letter)}
                      className={`w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-1.5 active:scale-98 border ${
                        isLight 
                          ? 'bg-ink-50 hover:bg-emerald-50 text-ink-700 hover:text-emerald-800 border-ink-300 hover:border-emerald-300 font-semibold' 
                          : 'bg-ink-900 hover:bg-emerald-500/20 border-ink-800 hover:border-emerald-500/40 text-ink-300 hover:text-emerald-200'
                      }`}
                    >
                      <ListOrdered className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                      <span>ترتيب الـ 114 سورة بحرف «{letter}»</span>
                      <ExternalLink className={`w-3 h-3 ${isLight ? 'text-ink-600' : 'text-ink-400'}`} />
                    </button>

                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* SUB TAB 3: DIACRITICS & TASHKEEL LAYER */}
      {activeSubTab === 'diacritics' && (
        <div className="space-y-3">
          
          <div className={`p-3.5 rounded-xl transition-colors ${
            isLight ? 'bg-white border border-[#DED8C9] shadow-xs' : 'sci-bg sci-border'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className={`text-sm font-bold mb-0.5 flex items-center gap-2 ${
                  isLight ? 'text-ink-900' : 'text-ink-100'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-[#1A5C5C]' : 'bg-emerald-400'}`}></span>
                  التوزيع الإحصائي للحركات وعلامات الضبط عبر القرآن الكريم كاملاً
                </h3>
                <p className={`text-xs font-mono ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                  إجمالي الحركات والشدات والتنوين المحصية: <strong className={`font-mono text-sm ${
                    isLight ? 'text-[#1A5C5C]' : 'text-emerald-400'
                  }`}>{totalDiacritics.total.toLocaleString('en-US')}</strong> علامة ضبط
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {diacriticsArray.map((item, idx) => {
                const pct = totalDiacritics.total > 0 ? ((item.count / totalDiacritics.total) * 100).toFixed(2) : '0';
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg space-y-1.5 transition-colors border ${
                      isLight 
                        ? 'bg-[#FAF8F2] border-[#DED8C9] shadow-2xs' 
                        : 'bg-[#0B1716] border-ink-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${isLight ? 'text-ink-900' : 'text-ink-200'}`}>
                        {item.label}
                      </span>
                      <span className={`font-mono font-bold text-xs ${
                        isLight ? 'text-emerald-700' : 'text-emerald-300'
                      }`}>
                        {pct}%
                      </span>
                    </div>
                    <div className={`text-lg font-bold font-mono tabular-nums ${
                      isLight ? 'text-[#1A5C5C]' : 'text-ink-100'
                    }`}>
                      {item.count.toLocaleString('en-US')}
                    </div>
                    <p className={`text-[10px] ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                      {item.desc}
                    </p>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${
                      isLight ? 'bg-ink-200' : 'bg-ink-800'
                    }`}>
                      <div 
                        className="h-full rounded-full transition-all duration-300" 
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB: PHONETIC & ACOUSTIC RADAR ANALYSIS */}
      {activeSubTab === 'phonetics' && (
        <PhoneticRadarAnalysis
          surahs={surahs}
          letterStats={letterStats}
          onSelectSurah={(num) => {
            const target = surahs.find(s => s.number === num);
            if (target) onSelectSurah(target);
          }}
        />
      )}

      {/* SUB TAB 4: RECHARTS CUMULATIVE LETTER DISTRIBUTION */}
      {activeSubTab === 'cumulative' && (
        <CumulativeLetterDistribution
          surahs={surahs}
          letterStats={letterStats}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* LETTER RANKING MODAL */}
      {rankingModalLetter && (
        <LetterRankingModal
          letter={rankingModalLetter}
          onClose={() => setRankingModalLetter(null)}
          surahs={surahs}
          letters={letters}
          letterNames={letterStats.letterNames}
          onSelectSurah={onSelectSurah}
          onOpenInReader={onOpenInReader}
          onSelectLetter={(l) => setRankingModalLetter(l)}
          initialMetric={alphabetMetric}
        />
      )}

      {/* METHODOLOGY & STATISTICAL GLOSSARY INFO MODAL */}
      <LettersLabInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

    </div>
  );
};

export const LettersLab = React.memo(LettersLabComponent);


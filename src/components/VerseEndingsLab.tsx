import React, { useState, useMemo } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { 
  analyzeSurahVerseEndings, 
  SurahVerseEndingsAnalysis, 
  VerseEndingItem 
} from '../utils/verseEndings';
import { formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';
import { 
  Music, 
  Search, 
  Sparkles, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  BarChart3, 
  List, 
  Layers, 
  Info,
  CheckCircle2,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface VerseEndingsLabProps {
  onSelectSurah?: (surahNumber: number) => void;
  onOpenInReader?: (surahNumber: number) => void;
}

const VerseEndingsLabComponent: React.FC<VerseEndingsLabProps> = ({ 
  onSelectSurah, 
  onOpenInReader 
}) => {
  const { corpus, surahs } = useQuranCorpus();
  const { theme } = useTheme();

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<'ribbon' | 'distribution' | 'atlas'>('ribbon');
  const [atlasFilter, setAtlasFilter] = useState<'all' | 'monorhyme' | 'birhyme' | 'multirhyme'>('all');
  const [atlasSearch, setAtlasSearch] = useState<string>('');
  const [atlasSort, setAtlasSort] = useState<'surah' | 'dominant_pct' | 'uniformity' | 'ayahs'>('surah');

  // Selected surah corpus
  const currentSurahCorpus = useMemo(() => {
    return corpus.find(c => c.number === selectedSurahNumber) || corpus[0];
  }, [corpus, selectedSurahNumber]);

  // Current surah endings analysis
  const analysis: SurahVerseEndingsAnalysis = useMemo(() => {
    if (!currentSurahCorpus) {
      return {
        surahNumber: 1,
        surahName: 'الفاتحة',
        totalVerses: 7,
        dominantLetter: 'ن',
        dominantLetterName: 'نون',
        dominantPercentage: 71.4,
        uniformityScore: 65,
        rhymeType: 'birhyme',
        rhymeTypeLabel: 'ثنائية الفاصلة (ن و م)',
        letterFrequencies: [],
        familyFrequencies: [],
        shiftPoints: [],
        verseEndings: []
      };
    }
    return analyzeSurahVerseEndings(currentSurahCorpus);
  }, [currentSurahCorpus]);

  // Global Quran Atlas analysis for all 114 surahs
  const globalAtlas = useMemo(() => {
    return corpus.map(s => analyzeSurahVerseEndings(s));
  }, [corpus]);

  // Atlas global summary stats
  const atlasStats = useMemo(() => {
    const total = globalAtlas.length;
    const monorhymeCount = globalAtlas.filter(s => s.rhymeType === 'monorhyme').length;
    const birhymeCount = globalAtlas.filter(s => s.rhymeType === 'birhyme').length;
    const multirhymeCount = globalAtlas.filter(s => s.rhymeType === 'multirhyme').length;

    const letterCounts: Record<string, number> = {};
    globalAtlas.forEach(s => {
      letterCounts[s.dominantLetter] = (letterCounts[s.dominantLetter] || 0) + 1;
    });
    const sortedDominant = Object.entries(letterCounts).sort((a, b) => b[1] - a[1]);
    const topLetter = sortedDominant[0] ? sortedDominant[0][0] : 'ن';
    const topLetterCount = sortedDominant[0] ? sortedDominant[0][1] : 0;

    return {
      total,
      monorhymeCount,
      birhymeCount,
      multirhymeCount,
      topLetter,
      topLetterCount
    };
  }, [globalAtlas]);

  // Filtered and sorted atlas
  const filteredAtlas = useMemo(() => {
    const list = globalAtlas.filter(item => {
      const matchSearch = atlasSearch.trim() === '' || 
        item.surahName.includes(atlasSearch.trim()) || 
        item.dominantLetter.includes(atlasSearch.trim()) ||
        item.surahNumber.toString() === atlasSearch.trim();
      
      const matchFilter = atlasFilter === 'all' || item.rhymeType === atlasFilter;
      return matchSearch && matchFilter;
    });

    const sorted = [...list];
    if (atlasSort === 'surah') {
      sorted.sort((a, b) => a.surahNumber - b.surahNumber);
    } else if (atlasSort === 'dominant_pct') {
      sorted.sort((a, b) => b.dominantPercentage - a.dominantPercentage);
    } else if (atlasSort === 'uniformity') {
      sorted.sort((a, b) => b.uniformityScore - a.uniformityScore);
    } else if (atlasSort === 'ayahs') {
      sorted.sort((a, b) => b.totalVerses - a.totalVerses);
    }
    return sorted;
  }, [globalAtlas, atlasSearch, atlasFilter, atlasSort]);

  const isDark = theme === 'dark';

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div 
        className="p-5 rounded-2xl border transition-all shadow-sm"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1A5C5C] to-emerald-700 text-white shadow-lg shadow-teal-900/20">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  مختبر فواصل الآيات والإيقاع الصوتي
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  صوتيات ولسانيات
                </span>
                <SectionHelpButton 
                  guideId="verse-endings-lab" 
                  variant="button" 
                  title="استعلام ودليل مختبر الفواصل" 
                />
              </div>
              <p className="text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                دراسة حروف الروي في نهايات الآيات، ونسب تجانس الإيقاع الصوتي، وكشف تحولات الفاصلة الموسيقية مع تبدل المقاصد القرآنية.
              </p>
            </div>
          </div>

          {/* Quick Surah Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>السورة:</label>
            <select
              value={selectedSurahNumber}
              onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
              aria-label="اختر السورة لتحليل فواصل الآيات"
              className="px-3 py-2 rounded-xl text-sm font-semibold border outline-none cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--color-input)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              {surahs.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {formatSurahName(s.name)} ({s.totalAyahs} آية)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top 4 KPI Metric Cards for Current Surah */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {/* Dominant Rhyme */}
          <div 
            className="p-3.5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--color-text-muted)' }}>
              <span>حرف الروي السائد</span>
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {analysis.dominantLetter}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                ({analysis.dominantLetterName})
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                {analysis.dominantPercentage}%
              </span>
            </div>
          </div>

          {/* Uniformity Score */}
          <div 
            className="p-3.5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--color-text-muted)' }}>
              <span>مؤشر التجانس الصوتي</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {analysis.uniformityScore}%
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {analysis.uniformityScore >= 80 ? 'عالي التجانس' : analysis.uniformityScore >= 50 ? 'متوسط' : 'متنوع'}
              </span>
            </div>
          </div>

          {/* Rhyme Cadence Type */}
          <div 
            className="p-3.5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--color-text-muted)' }}>
              <span>طبيعة الفاصلة</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-teal-400" />
            </div>
            <div className="mt-1">
              <div className="text-sm font-bold text-[#1A5C5C] dark:text-teal-400 truncate">
                {analysis.rhymeType === 'monorhyme' ? 'أحادية الروي' : analysis.rhymeType === 'birhyme' ? 'ثنائية الروي' : 'متعددة الإيقاع'}
              </div>
              <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {analysis.rhymeTypeLabel}
              </div>
            </div>
          </div>

          {/* Shift Points */}
          <div 
            className="p-3.5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--color-text-muted)' }}>
              <span>تحولات الفاصلة الموسيقية</span>
              <Layers className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {analysis.shiftPoints.length}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                نقطة تحول سياقية
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#DED8C9] dark:border-[#33433F]">
          <button
            onClick={() => setActiveSubTab('ribbon')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'ribbon'
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            شريط الآيات وحروف الروي ({analysis.totalVerses})
          </button>
          <button
            onClick={() => setActiveSubTab('distribution')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'distribution'
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            توزيع ونسب الفواصل
          </button>
          <button
            onClick={() => setActiveSubTab('atlas')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'atlas'
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            أطلس فواصل القرآن الـ 114
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Ribbon & Verse by Verse Details */}
      {activeSubTab === 'ribbon' && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-ink-900/70 border-ink-800' : 'bg-white border-ink-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>مسار فواصل {formatSurahName(analysis.surahName)}</span>
                <span className="text-xs text-ink-400">({analysis.totalVerses} آية)</span>
              </h2>
              <p className="text-xs text-ink-400 mt-0.5">
                تتبع انسياب حروف الروي في أواخر الآيات وكيفية تناغمها الصوتي.
              </p>
            </div>
            
            {/* Visual Color Legend */}
            <div className="flex items-center gap-2 flex-wrap">
              {analysis.letterFrequencies.slice(0, 5).map(lf => (
                <div key={lf.letter} className={`flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-md border font-mono ${
                  isDark ? 'bg-ink-800/50 border-ink-700/50 text-ink-200' : 'bg-[#FAF7EE] border-[#DED8C9] text-ink-800'
                }`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lf.color }}></span>
                  <span className="font-bold">{lf.letter}</span>
                  <span className="text-xs font-semibold" style={{ color: lf.color }}>{lf.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verse Endings Grid / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
            {analysis.verseEndings.map((ve) => {
              const isDominant = ve.rhymeLetter === analysis.dominantLetter;
              return (
                <div 
                  key={ve.verseNumber}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isDark 
                      ? 'bg-ink-800/40 border-ink-800 hover:border-ink-700' 
                      : 'bg-[#FCFAF5] border-[#DED8C9]/80 hover:bg-[#F4F9F7] hover:border-[#1A5C5C]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-[#1A5C5C]/10 dark:bg-[#1A5C5C]/25 text-[#1A5C5C] dark:text-[#52C592] border border-[#1A5C5C]/20 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {ve.verseNumber}
                    </span>
                    <div className="min-w-0 truncate">
                      <div className="text-sm font-semibold truncate font-serif">
                        ... {ve.lastWord}
                      </div>
                      <div className="text-[10px] text-ink-400 flex items-center gap-1">
                        <span>الضبط: {ve.harakah}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span 
                      className={`px-2 py-1 rounded-md text-xs font-bold font-mono flex items-center justify-center min-w-[28px] ${
                        isDominant 
                          ? (isDark ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60' : 'bg-[#1A5C5C] text-white border border-[#1A5C5C] shadow-2xs font-extrabold')
                          : (isDark ? 'bg-ink-800 text-ink-300 border border-ink-700' : 'bg-[#FAF7EE] text-[#53605E] border border-[#DED8C9]')
                      }`}
                    >
                      {ve.rhymeLetter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shift Points Notification (if any) */}
          {analysis.shiftPoints.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                تحول إيقاع الفاصلة عند الآيات: {analysis.shiftPoints.map(p => `[الآية ${p.verseNumber}: من ${p.fromLetter} إلى ${p.toLetter}]`).join('، ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Distribution & Charts */}
      {activeSubTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-ink-900/70 border-ink-800' : 'bg-white border-ink-200'}`}>
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              تكرار حروف الروي في {formatSurahName(analysis.surahName)}
            </h2>
            <p className="text-xs text-ink-400 mb-4">
              النسب المئوية لكل حرف فاصلة من إجمالي {analysis.totalVerses} آية.
            </p>

            <div className="h-[280px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.letterFrequencies} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="letter" stroke="#6F7F7B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6F7F7B" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#10211F' : '#ffffff', 
                      borderColor: isDark ? '#3A4A47' : '#C7CEC9',
                      borderRadius: '8px',
                      fontSize: '12px',
                      direction: 'rtl'
                    }} 
                    formatter={(val: any) => [`${val} آية`, 'التكرار']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {analysis.letterFrequencies.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Family Groups Breakdown */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-ink-900/70 border-ink-800' : 'bg-white border-ink-200'}`}>
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              العوائل الصوتية لفواصل السورة
            </h2>
            <p className="text-xs text-ink-400 mb-4">
              تصنيف نهايات الآيات حسب المخارج والخصائص الصوتية المعتمدة في الإيقاع القرآني.
            </p>

            <div className="space-y-3">
              {analysis.familyFrequencies.map(f => (
                <div key={f.family} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }}></span>
                      {f.name}
                    </span>
                    <span className="font-mono text-[var(--color-text-secondary)]">{f.count} آية ({f.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${f.percentage}%`, backgroundColor: f.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Academic Footnote */}
            <div className="mt-5 p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs leading-relaxed">
              <span className="text-[var(--color-primary)] font-bold">ملاحظة بلاغية: </span>
              تمثل فواصل المد والتمكين (النون والميم) النمط الأوسع انتشاراً في القرآن الكريم، وتضفي نغمة هادئة مسترسلة تناسب الأحكام والقصص، بينما الفواصل المقلقلة والمشدودة تظهر بكثافة في مشاهد القيامة والإنذار.
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Quran 114 Surahs Atlas */}
      {activeSubTab === 'atlas' && (
        <div className={`p-4 sm:p-5 rounded-[8px] border transition-colors space-y-4 ${
          !isDark ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          {/* Atlas Header & Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DED8C9] dark:border-[#264340] pb-3">
            <div>
              <h2 className="text-xs sm:text-sm font-bold flex items-center gap-2 text-[#0F1419] dark:text-[#F4F0E7]">
                <Sparkles className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                <span>أطلس فواصل القرآن الكريم كاملاً</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] border border-[#1A5C5C]/25">
                  {filteredAtlas.length} سورة
                </span>
              </h2>
              <p className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] font-mono mt-0.5">
                فهرس تحليلي شامل لحروف الروي السائدة ونسب التجانس والأنماط الصوتية لسور القرآن الـ 114
              </p>
            </div>

            {/* Filters Toolbar */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث بسورة أو حرف..."
                  value={atlasSearch}
                  onChange={(e) => setAtlasSearch(e.target.value)}
                  className={`px-3 py-1.5 pl-8 rounded-[6px] text-xs border outline-none font-sans-arabic transition-colors ${
                    !isDark 
                      ? 'bg-white border-[#DED8C9] text-[#0F1419] placeholder-[#7B8885] focus:border-[#1A5C5C]' 
                      : 'bg-[#0B1716] border-[#264340] text-[#F4F0E7] placeholder-[#8B9B96] focus:border-[#79A9A0]'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-[#7B8885] dark:text-[#8B9B96] absolute left-2.5 top-2.5" />
              </div>

              {/* Type filter */}
              <select
                value={atlasFilter}
                onChange={(e) => setAtlasFilter(e.target.value as any)}
                aria-label="تصفية فواصل السور حسب النمط"
                className={`px-2.5 py-1.5 rounded-[6px] text-xs font-bold border outline-none transition-colors cursor-pointer ${
                  !isDark 
                    ? 'bg-white border-[#DED8C9] text-[#0F1419]' 
                    : 'bg-[#0B1716] border-[#264340] text-[#F4F0E7]'
                }`}
              >
                <option value="all">كل الأنماط ({atlasStats.total})</option>
                <option value="monorhyme">أحادية الفاصلة ({atlasStats.monorhymeCount})</option>
                <option value="birhyme">ثنائية الروي ({atlasStats.birhymeCount})</option>
                <option value="multirhyme">متعددة الإيقاع ({atlasStats.multirhymeCount})</option>
              </select>

              {/* Sort selector */}
              <select
                value={atlasSort}
                onChange={(e) => setAtlasSort(e.target.value as any)}
                aria-label="ترتيب جدول الفواصل"
                className={`px-2.5 py-1.5 rounded-[6px] text-xs font-bold border outline-none transition-colors cursor-pointer ${
                  !isDark 
                    ? 'bg-white border-[#DED8C9] text-[#0F1419]' 
                    : 'bg-[#0B1716] border-[#264340] text-[#F4F0E7]'
                }`}
              >
                <option value="surah">الترتيب المصحفي (1 ← 114)</option>
                <option value="dominant_pct">الأعلى نسبة هيمنة</option>
                <option value="uniformity">الأعلى تجانساً صوتياً</option>
                <option value="ayahs">الأكثر آيات</option>
              </select>
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3 rounded-[6px] border flex flex-col justify-between transition-colors ${
              !isDark ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
            }`}>
              <span className="text-[11px] font-mono text-[#7B8885] dark:text-[#8B9B96]">إجمالي السور:</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
                  {atlasStats.total}
                </span>
                <span className="text-[10px] text-[#7B8885] font-mono">سورة</span>
              </div>
            </div>

            <div className={`p-3 rounded-[6px] border flex flex-col justify-between transition-colors ${
              !isDark ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
            }`}>
              <span className="text-[11px] font-mono text-[#1A5C5C] dark:text-[#79A9A0] font-bold">أحادية الفاصلة:</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">
                  {atlasStats.monorhymeCount}
                </span>
                <span className="text-[10px] text-[#1A5C5C] dark:text-[#79A9A0] font-mono">سورة (≥85%)</span>
              </div>
            </div>

            <div className={`p-3 rounded-[6px] border flex flex-col justify-between transition-colors ${
              !isDark ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
            }`}>
              <span className="text-[11px] font-mono text-[#8C6B37] dark:text-[#C5A16A] font-bold">ثنائية الروي:</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono tabular-nums text-[#8C6B37] dark:text-[#C5A16A]">
                  {atlasStats.birhymeCount}
                </span>
                <span className="text-[10px] text-[#8C6B37] dark:text-[#C5A16A] font-mono">سورة</span>
              </div>
            </div>

            <div className={`p-3 rounded-[6px] border flex flex-col justify-between transition-colors ${
              !isDark ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
            }`}>
              <span className="text-[11px] font-mono text-[#7B8885] dark:text-[#8B9B96]">الحرف الأكثر انتشاراً:</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-[#1A5C5C] dark:text-[#79A9A0]">
                  «{atlasStats.topLetter}»
                </span>
                <span className="text-[10px] text-[#7B8885] font-mono tabular-nums">
                  سائد في {atlasStats.topLetterCount} سورة
                </span>
              </div>
            </div>
          </div>

          {/* Surahs Table */}
          <div className={`overflow-x-auto max-h-[500px] overflow-y-auto border rounded-[6px] ${
            !isDark ? 'border-[#DED8C9]' : 'border-[#264340]'
          }`}>
            <table className="w-full text-right text-xs">
              <thead className={`sticky top-0 border-b text-[11px] z-10 font-mono ${
                !isDark ? 'bg-[#FAF8F2] border-[#DED8C9] text-[#7B8885]' : 'bg-[#10211F] border-[#264340] text-[#A8BCB9]'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">السورة</th>
                  <th className="py-2.5 px-3">عدد الآيات</th>
                  <th className="py-2.5 px-3 text-[#1A5C5C] dark:text-[#79A9A0]">حرف الروي السائد</th>
                  <th className="py-2.5 px-3 text-[#1A5C5C] dark:text-[#79A9A0]">نسبة الهيمنة</th>
                  <th className="py-2.5 px-3">مؤشر التجانس الصوتي</th>
                  <th className="py-2.5 px-3">النمط الصوتي</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${!isDark ? 'divide-[#DED8C9]/60' : 'divide-[#264340]/60'}`}>
                {filteredAtlas.map((item) => (
                  <tr 
                    key={item.surahNumber}
                    className={`transition-colors cursor-pointer ${
                      item.surahNumber === selectedSurahNumber
                        ? !isDark ? 'bg-[#1A5C5C]/10 border-r-2 border-r-[#1A5C5C]' : 'bg-[#2B7470]/20 border-r-2 border-r-[#79A9A0]'
                        : !isDark ? 'hover:bg-[#F7F4EA]' : 'hover:bg-[#0E201E]'
                    }`}
                    onClick={() => {
                      setSelectedSurahNumber(item.surahNumber);
                      setActiveSubTab('ribbon');
                    }}
                  >
                    <td className="py-2.5 px-3 text-[#7B8885] dark:text-[#8B9B96] tabular-nums">{item.surahNumber}</td>
                    <td className="py-2.5 px-3 font-serif font-bold text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                      {formatSurahName(item.surahName)}
                    </td>
                    <td className="py-2.5 px-3 text-[#7B8885] dark:text-[#8B9B96] tabular-nums">{item.totalVerses}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] font-bold border border-[#1A5C5C]/25 text-xs font-mono">
                        {item.dominantLetter} ({item.dominantLetterName})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#1A5C5C] dark:text-[#79A9A0] font-bold tabular-nums">
                      {item.dominantPercentage}%
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#DED8C9] dark:bg-[#264340] overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-[#1A5C5C] dark:bg-[#2B7470] transition-all" 
                            style={{ width: `${item.uniformityScore}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7] font-semibold">
                          {item.uniformityScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans-arabic text-xs">
                      {item.rhymeType === 'monorhyme' ? (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] border border-[#1A5C5C]/30 text-[10px] font-bold">
                          أحادية صريحة
                        </span>
                      ) : item.rhymeType === 'birhyme' ? (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#B8935F]/15 text-[#8C6B37] dark:text-[#C5A16A] border border-[#B8935F]/30 text-[10px] font-bold">
                          ثنائية الروي
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] text-[#7B8885] dark:text-[#8B9B96] border border-[#DED8C9] dark:border-[#264340] text-[10px]">
                          متعددة الفواصل
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSurahNumber(item.surahNumber);
                          setActiveSubTab('ribbon');
                        }}
                        className="px-2.5 py-1 rounded-[4px] bg-[#EFECE2] hover:bg-[#1A5C5C] hover:text-white dark:bg-[#122B2A] dark:hover:bg-[#2B7470] text-[#1A5C5C] dark:text-[#79A9A0] border border-[#DED8C9] dark:border-[#264340] text-xs font-bold transition-colors cursor-pointer"
                      >
                        تحليل الفواصل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const VerseEndingsLab = React.memo(VerseEndingsLabComponent);
export default VerseEndingsLab;

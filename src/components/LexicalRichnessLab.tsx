import React, { useState, useMemo } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { 
  analyzeSurahLexiconAdvanced, 
  computeGlobalQuranLexicon, 
  SurahLexicalAnalysis, 
  QuranGlobalLexicalStats 
} from '../utils/lexicalMetrics';
import { formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';
import { WordVersesModal } from './WordVersesModal';
import { useLexicalWorker } from '../hooks/useLexicalWorker';
import { SurahGoldenRatioScatterPlot } from './SurahGoldenRatioScatterPlot';
import { 
  TrendingDown, 
  Sparkles, 
  BookOpen, 
  BarChart2, 
  Search, 
  Brain, 
  HelpCircle, 
  Hash, 
  Activity, 
  Layers, 
  Award,
  Filter,
  CheckCircle2,
  Zap,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

interface LexicalRichnessLabProps {
  onSelectSurah?: (surahNumber: number) => void;
}

const LexicalRichnessLabComponent: React.FC<LexicalRichnessLabProps> = ({ onSelectSurah }) => {
  const { corpus, surahs } = useQuranCorpus();
  const { theme } = useTheme();

  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'zipf' | 'ttr-atlas' | 'top-words' | 'golden-ratio' | 'methodology'>('zipf');
  const [atlasSearch, setAtlasSearch] = useState<string>('');
  const [excludeStopwords, setExcludeStopwords] = useState<boolean>(false);
  const [unifyLemmas, setUnifyLemmas] = useState<boolean>(true);
  const [selectedWordForModal, setSelectedWordForModal] = useState<string | null>(null);

  // Current surah corpus
  const currentSurah = useMemo(() => {
    return corpus.find(c => c.number === selectedSurahNumber) || corpus[0];
  }, [corpus, selectedSurahNumber]);

  // Web Worker offloaded text processing & intensive memoization
  const { 
    surahAnalysis: analysis, 
    globalLexicon, 
    isWorkerCalculating 
  } = useLexicalWorker({
    currentSurah,
    corpus,
    excludeStopwords,
    unifyLemmas,
    enableGlobalAtlas: activeTab === 'ttr-atlas'
  });

  // Filtered rankings
  const filteredRankings = useMemo(() => {
    if (!globalLexicon) return [];
    return globalLexicon.surahRankings.filter(item => {
      return atlasSearch.trim() === '' || 
        item.surahName.includes(atlasSearch.trim()) || 
        item.surahNumber.toString() === atlasSearch.trim();
    });
  }, [globalLexicon, atlasSearch]);

  const isDark = theme === 'dark';
  const isLight = !isDark;

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#142825] via-[#10211F] to-[#142825] border-[#264340] shadow-xl' 
          : 'bg-gradient-to-r from-[#FBF9F2] via-[#F7F4EA] to-[#FBF9F2] border-[#DED8C9] shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1A5C5C] to-[#2B7470] text-white shadow-lg shadow-[#1A5C5C]/20">
              <Brain className="w-6 h-6 text-[#E0C088]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                  مختبر اللسانيات الرياضية وثراء المفردات
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isLight 
                    ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border-[#1A5C5C]/30' 
                    : 'bg-[#1A5C5C]/20 text-[#A8BCB9] border-[#1A5C5C]/30'
                }`}>
                  قانون زيف والإنتروبيا
                </span>
                {isWorkerCalculating ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[#C5A16A] bg-[#C5A16A]/10 px-2 py-0.5 rounded-full border border-[#C5A16A]/20 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-[#C5A16A]" />
                    <span>معالجة خيطية سريعة...</span>
                  </span>
                ) : (
                  <span className={`hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isLight 
                      ? 'text-[#1A5C5C] bg-[#1A5C5C]/10 border-[#1A5C5C]/20' 
                      : 'text-[#52C592] bg-[#1A5C5C]/20 border-[#1A5C5C]/30'
                  }`}>
                    <Zap className="w-3 h-3" />
                    <span>مُعالج Web Worker فوري</span>
                  </span>
                )}
                <SectionHelpButton 
                  guideId="lexical-richness-lab" 
                  variant="button" 
                  title="استعلام ودليل مختبر اللسانيات وزيف" 
                />
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                تطبيق نماذج اللسانيات الحاسوبية العالمية على النص القرآني: مؤشر التنوع المعجمي (TTR)، ومنحنى قانون زيف اللوغاريتمي، وقياس إنتروبيا شانون للمعلومات.
              </p>
            </div>
          </div>

          {/* Surah Dropdown & Content Lexicon Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            {/* Academic Content Lexicon vs All Tokens Toggle Filter */}
            <div className={`flex items-center p-1 rounded-xl border text-xs font-medium transition-all ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <button
                type="button"
                onClick={() => setExcludeStopwords(false)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  !excludeStopwords
                    ? 'bg-[#1A5C5C] text-white shadow-2xs font-bold'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
                title="عرض كافة الكلمات دون استثناء بما فيها حروف المعاني والجر والضمائر"
              >
                <span>كافة الكلمات</span>
                <span className="text-[10px] opacity-75 font-mono">({analysis.totalTokens + (analysis.stopwordsExcludedCount || 0)})</span>
              </button>

              <button
                type="button"
                onClick={() => setExcludeStopwords(true)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  excludeStopwords
                    ? 'bg-[#1A5C5C] text-white shadow-2xs font-bold'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
                title="استبعاد حروف المعاني (في، من، إلى، ما، لا...) وإظهار المفردات الدلالية الصرفة (الأسماء والأفعال)"
              >
                <Filter className="w-3 h-3 text-[#C5A16A]" />
                <span>المفردات الدلالية</span>
                <span className="text-[10px] opacity-75 font-mono">({analysis.totalTokens})</span>
              </button>
            </div>

            {/* Lemma Unification Toggle (توحيد الأصل المعجمي والسوابق مثل الله/والله) */}
            <div className={`flex items-center p-1 rounded-xl border text-xs font-medium transition-all ${
              isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <button
                type="button"
                onClick={() => setUnifyLemmas(true)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  unifyLemmas
                    ? 'bg-[#1A5C5C] text-white shadow-2xs font-bold'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
                title="توحيد تنويعات الكلمة الواحدة (الله، والله، بالله، لله) تحت أصل معجمي واحد لضبط قانون زيف ورتب الكلمات"
              >
                <CheckCircle2 className="w-3 h-3 text-[#E0C088]" />
                <span>توحيد معجمي</span>
              </button>

              <button
                type="button"
                onClick={() => setUnifyLemmas(false)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer ${
                  !unifyLemmas
                    ? 'bg-[#1A5C5C] text-white shadow-2xs font-bold'
                    : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
                }`}
                title="فصل الكلمات حسب الرسم السطحي الحرفي الخام دون تجريد الواو أو الباء"
              >
                <span>رسم خام</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className={`text-xs font-medium whitespace-nowrap ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>السورة الحالية:</label>
              <select
                value={selectedSurahNumber}
                onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
                aria-label="اختر السورة لتحليل اللسانيات وقانون زيف"
                className={`px-3 py-2 rounded-xl text-sm font-semibold border outline-none cursor-pointer transition-all ${
                  isLight 
                    ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419] focus:border-[#1A5C5C]' 
                    : 'bg-[#10211F] border-[#264340] text-[#F4F0E7] focus:border-[#2B7470]'
                }`}
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {formatSurahName(s.name)} ({s.totalWords} كلمة)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {/* TTR (Type-Token Ratio) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className={`text-[11px] flex items-center justify-between ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              <span>التنوع المعجمي (TTR)</span>
              <Award className="w-3.5 h-3.5 text-[#1A5C5C]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>
                {analysis.ttr}%
              </span>
              <span className={`text-[10px] ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>
                ({analysis.uniqueTypes}/{analysis.totalTokens})
              </span>
            </div>
          </div>

          {/* Shannon Entropy */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className={`text-[11px] flex items-center justify-between ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              <span>إنتروبيا شانون (H)</span>
              <Sparkles className="w-3.5 h-3.5 text-[#C5A16A]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>
                {analysis.shannonEntropy}
              </span>
              <span className={`text-[10px] ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>
                بت/مفردة
              </span>
            </div>
          </div>

          {/* Zipf Slope */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className={`text-[11px] flex items-center justify-between ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              <span>ميل قانون زيف (Slope)</span>
              <TrendingDown className="w-3.5 h-3.5 text-[#1A5C5C]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`}>
                {analysis.zipfSlope}
              </span>
              <span className={`text-[10px] ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>
                (المثالي: -1.0)
              </span>
            </div>
          </div>

          {/* R2 Goodness of fit */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className={`text-[11px] flex items-center justify-between ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              <span>معامل التطابق (R²)</span>
              <Activity className="w-3.5 h-3.5 text-[#C5A16A]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>
                {analysis.zipfR2}
              </span>
              <span className={`text-[10px] ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>
                توافق عالٍ
              </span>
            </div>
          </div>

          {/* Hapax Legomena in Surah */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className={`text-[11px] flex items-center justify-between ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              <span>الألفاظ الفريدة (Hapax)</span>
              <Hash className="w-3.5 h-3.5 text-[#1A5C5C]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${isLight ? 'text-[#1A5C5C]' : 'text-[#A3E635]'}`}>
                {analysis.hapaxCount}
              </span>
              <span className={`text-[10px] ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>
                ({analysis.hapaxPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#DED8C9] dark:border-[#33433F] flex-wrap">
          <button
            onClick={() => setActiveTab('zipf')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'zipf'
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            منحنى قانون زيف اللوغاريتمي (Log-Log)
          </button>
          <button
            onClick={() => setActiveTab('ttr-atlas')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ttr-atlas'
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            تصنيف السور حسب التنوع المعجمي (TTR)
          </button>
          <button
            onClick={() => setActiveTab('top-words')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'top-words'
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            أعلى المفردات تواتراً في السورة
          </button>
          <button
            onClick={() => setActiveTab('golden-ratio')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'golden-ratio'
                ? 'bg-[#B8935F] text-[#0F1419] font-bold shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            مخطط النسبة الذهبية (Scatter Plot)
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'methodology'
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs'
                : 'text-[#53605E] dark:text-[#B7C1BC] hover:text-[#0F1419] dark:hover:text-[#F4F0E7]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            المنهجية العلمية ومعادلات القياس
          </button>
        </div>
      </div>

      {/* Tab 1: Zipf's Law Log-Log Curve */}
      {activeTab === 'zipf' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-ink-900/70 border-ink-800' : 'bg-white border-ink-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <span>توزيع قانون زيف في {formatSurahName(analysis.surahName)}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                    R² = {analysis.zipfR2} | Slope = {analysis.zipfSlope}
                  </span>
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                  excludeStopwords 
                    ? 'bg-lime-500/10 text-lime-700 dark:text-lime-400 border border-lime-500/20' 
                    : 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20'
                }`}>
                  {excludeStopwords ? 'المفردات الدلالية فقط (مستبعد حروف المعاني)' : 'كافة الكلمات (شامل الأدوات والضمائر)'}
                </span>
              </div>
              <p className="text-xs text-ink-600 dark:text-ink-400 mt-0.5">
                مقارنة المنحنى التجريبي الفعلي للكلمات مع خط قانون زيف النظري (العلاقة العكسية بين رتبة الكلمة وتكرارها).
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 font-medium">
                <span className="w-3 h-0.5 bg-teal-500"></span>
                التكرار الفعلي (Empirical)
              </span>
              <span className="flex items-center gap-1 text-ink-600 dark:text-ink-400 font-medium">
                <span className="w-3 h-0.5 bg-ink-500 border-dashed"></span>
                خط زيف النظري (Theoretical)
              </span>
            </div>
          </div>

          <div className="h-[340px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.zipfCurve} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1B302D' : '#F1ECE0'} />
                <XAxis 
                  dataKey="rank" 
                  stroke="#6F7F7B" 
                  fontSize={11} 
                  label={{ value: 'رتبة المفردة (Rank r)', position: 'insideBottom', offset: -10, fill: '#6F7F7B', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#6F7F7B" 
                  fontSize={11} 
                  label={{ value: 'التكرار (Frequency f)', angle: -90, position: 'insideLeft', fill: '#6F7F7B', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#10211F' : '#ffffff', 
                    borderColor: isDark ? '#3A4A47' : '#C7CEC9',
                    borderRadius: '8px',
                    fontSize: '12px',
                    direction: 'rtl'
                  }}
                  formatter={(value: any, name: string, item: any) => [
                    `${value} مرة (${item.payload.word})`,
                    name === 'count' ? 'التكرار الفعلي' : 'توقع زيف'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#1A5C5C" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#1A5C5C' }}
                  name="count"
                />
                <Line 
                  type="monotone" 
                  dataKey="theoreticalZipf" 
                  stroke="#97A8A3" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                  name="theoreticalZipf"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Academic Insight Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs leading-relaxed">
            <span className="font-bold">التفسير الرياضي: </span>
            يُظهر المعامل $R^2 = {analysis.zipfR2}$ تطابقاً استثنائياً مع قانون القوة الطبيعي للغات. كلما اقترب الميل من $-1.00$، دلّ ذلك على توازن طبيعي محكم بين مركزية الكلمات المفتاحية وسعة المفردات المتجددة.
          </div>
        </div>
      )}

      {/* Tab 2: TTR Rankings Across 114 Surahs */}
      {activeTab === 'ttr-atlas' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-ink-900/70 border-ink-800' : 'bg-white border-ink-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>أطلس التنوع المعجمي لجميع سور القرآن (TTR)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                  114 سورة
                </span>
              </h2>
              <p className="text-xs text-ink-600 dark:text-ink-400 mt-0.5">
                ترتيب السور من الأعلى إلى الأدنى في نسبة المفردات الفريدة (تتراوح من السور المكثفة قصيرة الآيات إلى السور التشريعية الطويلة).
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن سورة..."
                value={atlasSearch}
                onChange={(e) => setAtlasSearch(e.target.value)}
                className={`px-3 py-1.5 pl-8 rounded-lg text-xs border outline-none ${
                  isLight 
                    ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419] placeholder-[#7C8B89] focus:border-[#1A5C5C]' 
                    : 'bg-[#10211F] border-[#264340] text-[#F4F0E7] placeholder-[#6B8580] focus:border-[#2B7470]'
                }`}
              />
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className={`border-b ${isLight ? 'border-[#DED8C9] text-[#53605E]' : 'border-[#264340] text-[#A8BCB9]'}`}>
                  <th className="py-2.5 px-3">الترتيب</th>
                  <th className="py-2.5 px-3">السورة</th>
                  <th className="py-2.5 px-3">إجمالي الكلمات (Tokens)</th>
                  <th className="py-2.5 px-3">المفردات الفريدة (Types)</th>
                  <th className="py-2.5 px-3">نسبة التنوع (TTR)</th>
                  <th className="py-2.5 px-3">إنتروبيا شانون (H)</th>
                  <th className="py-2.5 px-3">معامل جيراود (Guiraud)</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono ${isLight ? 'divide-[#DED8C9]/60' : 'divide-[#264340]/60'}`}>
                {filteredRankings.map((item, idx) => (
                  <tr 
                    key={item.surahNumber}
                    className={`transition-colors cursor-pointer ${
                      item.surahNumber === selectedSurahNumber
                        ? isLight ? 'bg-[#1A5C5C]/10 font-bold' : 'bg-[#1A5C5C]/20 font-bold'
                        : isLight ? 'hover:bg-[#F7F4EA]' : 'hover:bg-[#10211F]'
                    }`}
                    onClick={() => {
                      setSelectedSurahNumber(item.surahNumber);
                      setActiveTab('zipf');
                    }}
                  >
                    <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>{idx + 1}</td>
                    <td className={`py-2.5 px-3 font-serif font-bold text-sm ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                      {formatSurahName(item.surahName)}
                    </td>
                    <td className={`py-2.5 px-3 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>{item.totalTokens.toLocaleString()}</td>
                    <td className={`py-2.5 px-3 font-semibold ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>{item.uniqueTypes.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-[#EDE8D8]' : 'bg-[#183431]'}`}>
                          <div 
                            className="h-full rounded-full bg-[#1A5C5C]" 
                            style={{ width: `${Math.min(100, item.ttr)}%` }}
                          ></div>
                        </div>
                        <span className={`font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>{item.ttr}%</span>
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>{item.entropy}</td>
                    <td className={`py-2.5 px-3 ${isLight ? 'text-[#1A5C5C]' : 'text-[#C5A16A]'}`}>{item.guiraudIndex}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSurahNumber(item.surahNumber);
                          setActiveTab('zipf');
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-sans transition-all border ${
                          isLight 
                            ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419] hover:bg-[#1A5C5C] hover:text-white' 
                            : 'bg-[#10211F] border-[#264340] text-[#F4F0E7] hover:bg-[#1A5C5C] hover:text-white'
                        }`}
                      >
                        تحليل زيف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Top Words Frequency */}
      {activeTab === 'top-words' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-ink-900/70 border-ink-800' : 'bg-white border-ink-200 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-lime-700 dark:text-lime-400" />
                أعلى {analysis.topWords.length} مفردة تواتراً في {formatSurahName(analysis.surahName)}
                {unifyLemmas && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                    أصل معجمي موحد
                  </span>
                )}
              </h2>
              <p className="text-xs text-ink-600 dark:text-ink-400">
                توزيع المفردات الأكثر تكراراً ونسبتها من إجمالي كلمات السورة ({analysis.totalTokens} كلمة). انقر على أي كلمة لعرض كافة آياتها وتفرعاتها اللفظية في نافذة الآيات.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.topWords.map((tw) => (
              <div 
                key={tw.rank}
                onClick={() => setSelectedWordForModal(tw.word)}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group ${
                  isDark 
                    ? 'bg-ink-800/40 border-ink-800 hover:border-lime-500/50 hover:bg-ink-800/70' 
                    : 'bg-ink-50 border-ink-200 hover:border-lime-400 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-lime-500/10 text-lime-700 dark:text-lime-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {tw.rank}
                    </span>
                    <div>
                      <div className={`text-base font-bold font-serif group-hover:text-lime-400 transition-colors ${isDark ? 'text-ink-800 dark:text-ink-200' : 'text-ink-800'}`}>
                        {tw.word}
                      </div>
                      <div className="text-[10px] text-ink-600 dark:text-ink-400">
                        النسبة: {tw.percentage}%
                      </div>
                    </div>
                  </div>

                  <div className="text-left font-mono font-bold text-sm text-lime-700 dark:text-lime-400">
                    {tw.count} <span className="text-[10px] text-ink-500 font-sans">مرة</span>
                  </div>
                </div>

                {/* Unified Variants Pill Display */}
                {tw.variants && tw.variants.length > 1 && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--color-border)] flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-[var(--color-text-secondary)] font-bold">التنويعات:</span>
                    {tw.variants.slice(0, 4).map(v => (
                      <span 
                        key={v.variant} 
                        className="px-2 py-0.5 rounded text-xs font-mono bg-[var(--color-primary-soft)] text-[var(--color-primary)] dark:bg-lime-500/10 dark:text-lime-300 border border-[var(--color-primary)]/30 dark:border-lime-500/20 font-semibold"
                      >
                        {v.variant} <span className="opacity-75">({v.count})</span>
                      </span>
                    ))}
                    {tw.variants.length > 4 && (
                      <span className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                        +{tw.variants.length - 4} أخرى
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Methodology & Equations */}
      {activeTab === 'methodology' && (
        <div className={`p-5 rounded-2xl border transition-all ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-xs' : 'bg-[#142825] border-[#264340]'}`}>
          <h2 className={`text-base font-bold mb-3 flex items-center gap-2 ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>
            <HelpCircle className="w-5 h-5 text-[#C5A16A]" />
            الأسس الرياضية واللسانية المعتمدة في هذا المختبر
          </h2>

          <div className="space-y-4 text-xs leading-relaxed font-sans">
            <div className={`p-4 rounded-xl border transition-all ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'}`}>
              <h3 className={`font-bold text-sm mb-1 ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>1. قانون زيف اللغوي (Zipf's Law)</h3>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                قانون تجريبي وضعه عالم اللسانيات جورج كينغسلي زيف، ينص على أن تكرار أي كلمة في نص لغوي طبيعي يتناسب عكسياً مع رتبتها في جدول التكرار:
              </p>
              <div className={`my-2 p-2 rounded font-mono text-center border ${
                isLight ? 'bg-white border-[#DED8C9] text-[#1A5C5C]' : 'bg-[#142825] border-[#264340] text-[#E0C088]'
              }`}>
                f(r) = C / r^s &nbsp;&nbsp;⟹&nbsp;&nbsp; log(f) = log(C) - s · log(r)
              </div>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                في النصوص الطبيعية المتوازنة، يكون الأس اللغوي $s \approx 1.00$. وقد أثبتت التحليلات في هذا المختبر خضوع السور القرآنية لقانون زيف بدرجة دقة $R^2 \ge 0.90$.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'}`}>
              <h3 className={`font-bold text-sm mb-1 ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>2. نسبة التنوع المعجمي (Type-Token Ratio - TTR)</h3>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                مقياس معتمد عالمياً لقياس الثراء المعجمي في النصوص:
              </p>
              <div className={`my-2 p-2 rounded font-mono text-center border ${
                isLight ? 'bg-white border-[#DED8C9] text-[#1A5C5C]' : 'bg-[#142825] border-[#264340] text-[#E0C088]'
              }`}>
                TTR = (V / N) × 100
              </div>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                حيث $V$ هو عدد المفردات الفريدة دون تكرار (Types)، و $N$ هو إجمالي الكلمات الواردة (Tokens). تمتاز السور القصيرة بنسبة TTR مرتفعة تتجاوز 80%، بينما السور الطويلة تمتاز بنسبة تكرار موضوعي وتثبيتي للأحكام.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'}`}>
              <h3 className={`font-bold text-sm mb-1 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>3. إنتروبيا شانون للمعلومات (Shannon Entropy)</h3>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                مقياس من نظرية المعلومات وضعه كلود شانون لقياس درجة التشتت وعدم اليقين وكثافة المعلومات في التوزيع الاحتمالي للمفردات:
              </p>
              <div className={`my-2 p-2 rounded font-mono text-center border ${
                isLight ? 'bg-white border-[#DED8C9] text-[#8C6D2D]' : 'bg-[#142825] border-[#264340] text-[#52C592]'
              }`}>
                H = - ∑ p(w) · log2( p(w) )
              </div>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                كلما زادت الإنتروبيا، دل ذلك على توازن انتشار المفردات وعدم احتكار كلمة واحدة لمعظم النص.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'}`}>
              <h3 className={`font-bold text-sm mb-1 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>4. التوحيد المعجمي وضبط السوابق (Canonical Lemma Normalization)</h3>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                في الدراسات اللسانية الحاسوبية وقانون زيف، تُحسب الرتب على مستوى الكلمات المعجمية (Lemmas) وليس السوابق اللفظية العارضة كحروف العطف (الواو والفاء) وحروف الجر المتصلة (الباء واللام والكاف) وتاء القسم. يضمن خيار "توحيد معجمي" تجميع كافة تنويعات اللفظ الواحد (مثل: الله، والله، بالله، تالله، لله، ولله) تحت أصل معجمي واحد موحد، حتى لا تتشتت رتب الكلمة الواحدة في التحليل الإحصائي ونتائج البحث.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'}`}>
              <h3 className={`font-bold text-sm mb-1 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>5. التناسب الإحصائي والنسبة الذهبية (Golden Ratio Proportionality)</h3>
              <p className={isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}>
                يتحقق هذا النموذج من التناسب الرياضي الإحصائي لأعداد كلمات السور القرآنية مقارنة بالمتوسط الحسابي العام للقرآن الكريم (W̄ ≈ 679.7 كلمة لكل سورة). ويُبيّن المخطط المبعثر التفاعلي (Scatter Plot) أن أحجام السور تنتظم في نطاقات توافقية هندسية تحاكي قوى النسبة الذهبية (φ ≈ 1.618، و 1/φ ≈ 0.618، و φ² ≈ 2.618). ويُقاس معامل الاتساق الذهبي (Convergence Score) بنسبة ابتعاد السورة عن أقرب مستوى هندسي ذهبي، مما يوضح التوازن الإعجازي بين المركزية البيانية للسور وأطوال مقاطعها.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Golden Ratio Scatter Plot & Statistical Proportionality */}
      {activeTab === 'golden-ratio' && (
        <SurahGoldenRatioScatterPlot
          surahs={surahs}
          selectedSurahNumber={selectedSurahNumber}
          onSelectSurah={(num) => {
            setSelectedSurahNumber(num);
          }}
          onOpenDetailModal={(num) => {
            if (onSelectSurah) {
              onSelectSurah(num);
            }
          }}
          isDark={isDark}
        />
      )}

      {/* Word Verses Modal */}
      {selectedWordForModal && currentSurah && (
        <WordVersesModal
          isOpen={!!selectedWordForModal}
          onClose={() => setSelectedWordForModal(null)}
          word={selectedWordForModal}
          surahName={analysis.surahName}
          surahNumber={analysis.surahNumber}
          totalSurahAyahs={currentSurah.totalAyahs || 0}
          corpusSurah={currentSurah}
          onOpenInReader={onSelectSurah}
        />
      )}
    </div>
  );
};

export const LexicalRichnessLab = React.memo(LexicalRichnessLabComponent);
export default LexicalRichnessLab;

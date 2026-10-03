import React, { useState } from 'react';
import { 
  Sparkles, 
  Hash, 
  BookOpen, 
  Type, 
  Eye, 
  Layers, 
  Copy, 
  Check, 
  BookMarked,
  Info,
  Maximize2
} from 'lucide-react';
import { SurahData } from '../types';
import { GoldenRatioMetrics } from '../utils/goldenRatio';
import { MathTooltip } from './MathTooltip';
import { formatSurahName, cleanArabicLetters } from '../utils/arabic';

interface HostAyahViewerProps {
  ayahNumber: number;
  tokens: string[];
  targetTokenIndex?: number;
  targetWordText?: string;
  isLight: boolean;
  fontSizeClass: 'sm' | 'md' | 'lg';
  themeColor: 'teal' | 'cyan';
  badgeTitle?: string;
  charAnnotation?: {
    char: string;
    charName: string;
    charIndexInWord: number;
    totalCharsInWord: number;
  };
}

const HostAyahViewer: React.FC<HostAyahViewerProps> = ({
  ayahNumber,
  tokens,
  targetTokenIndex,
  targetWordText,
  isLight,
  fontSizeClass,
  themeColor,
  badgeTitle,
  charAnnotation
}) => {
  let highlightIndex = targetTokenIndex;
  if (highlightIndex === undefined || highlightIndex < 0 || highlightIndex >= tokens.length) {
    if (targetWordText) {
      const cleanTarget = cleanArabicLetters(targetWordText);
      const found = tokens.findIndex(t => cleanArabicLetters(t) === cleanTarget);
      if (found !== -1) {
        highlightIndex = found;
      }
    }
  }

  const fontSizes = {
    sm: 'text-sm sm:text-base leading-[2.2] sm:leading-[2.5]',
    md: 'text-base sm:text-xl leading-[2.3] sm:leading-[2.6]',
    lg: 'text-lg sm:text-2xl leading-[2.4] sm:leading-[2.8]'
  };

  const isCyan = themeColor === 'cyan';

  return (
    <div className="space-y-2.5 w-full max-w-full min-w-0">
      <div 
        className={`quran-ayah-container w-full max-w-full min-w-0 p-3.5 sm:p-6 rounded-xl border text-center font-quran ${fontSizes[fontSizeClass]} shadow-inner select-text ${
          isLight 
            ? 'bg-ink-50 border-ink-200 text-ink-900' 
            : 'bg-black/60 border-ink-800 text-ink-900 dark:text-ink-100'
        }`}
        dir="rtl"
      >
        <span className="opacity-60 select-none">« </span>
        {tokens.map((token, idx) => {
          const isTarget = idx === highlightIndex;
          const isWaqf = cleanArabicLetters(token).length === 0;

          if (isTarget) {
            return (
              <React.Fragment key={idx}>
                {idx > 0 && ' '}
                <span 
                  className={`inline-block px-2 py-0.5 rounded-lg font-bold transition-all shadow-sm ${
                    isCyan
                      ? 'bg-green-500/25 border-2 border-green-400 text-green-800 dark:text-green-300 ring-2 ring-green-400/30 shadow-green-500/20'
                      : 'bg-teal-500/25 border-2 border-teal-400 text-teal-800 dark:text-teal-300 ring-2 ring-teal-400/30 shadow-teal-500/20 animate-pulse'
                  }`}
                  title={badgeTitle || (isCyan ? 'الكلمة الحاضنة للحرف الذهبي' : 'الكلمة الذهبية')}
                >
                  {token}
                </span>
              </React.Fragment>
            );
          }

          if (isWaqf) {
            return (
              <React.Fragment key={idx}>
                {idx > 0 && ' '}
                <span 
                  className="text-amber-500/90 text-sm font-sans mx-0.5 inline-block select-none" 
                  title="علامة وقف"
                >
                  {token}
                </span>
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={idx}>
              {idx > 0 && ' '}
              <span className="transition-colors">{token}</span>
            </React.Fragment>
          );
        })}
        <span className="opacity-60 select-none"> »</span>
        {' '}
        <span className={`inline-block mr-1 font-mono text-sm font-bold select-none ${
          isCyan ? 'text-green-700 dark:text-green-400' : 'text-teal-700 dark:text-teal-400'
        }`}>
          ﴿{ayahNumber}﴾
        </span>
      </div>

      {charAnnotation && (
        <div className={`flex flex-wrap items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-sans ${
          isLight 
            ? 'bg-green-50/80 border-green-200 text-green-950 shadow-xs' 
            : 'bg-green-950/30 border-green-500/30 text-green-900 dark:text-green-200'
        }`}>
          <span className="font-bold">حرف القطع الذهبي في الآية:</span>
          <span className="px-2 py-0.5 rounded bg-green-500/20 border border-green-400 font-heading text-base font-bold text-green-800 dark:text-green-300">
            «{charAnnotation.char}»
          </span>
          <span className="font-semibold">({charAnnotation.charName})</span>
          <span className="opacity-50">•</span>
          <span>
            يقع داخل الكلمة المظللة أعلاه (الحرف رقم <strong className="text-green-700 dark:text-green-400">{charAnnotation.charIndexInWord}</strong> من أصل {charAnnotation.totalCharsInWord} أحرف)
          </span>
        </div>
      )}
    </div>
  );
};

interface SurahGoldenRatioSectionProps {
  surah: SurahData;
  goldenMetrics: GoldenRatioMetrics;
  isLight: boolean;
  onOpenInReader?: (surahNumber: number) => void;
}

export type GoldenCutLevel = 'all' | 'ayah' | 'word' | 'char';

export const SurahGoldenRatioSection: React.FC<SurahGoldenRatioSectionProps> = ({
  surah,
  goldenMetrics,
  isLight,
  onOpenInReader
}) => {
  // User selection: choose between ayah cut, word cut, letter cut, or all together
  const [selectedLevel, setSelectedLevel] = useState<GoldenCutLevel>('all');
  // Script toggle: Uthmani vs Simple
  const [scriptType, setScriptType] = useState<'uthmani' | 'simple'>('uthmani');
  // Font size toggle
  const [fontSizeClass, setFontSizeClass] = useState<'sm' | 'md' | 'lg'>('md');
  // Copied feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const {
    goldenAyahDetail,
    goldenWordDetail,
    goldenCharDetail,
    goldenSectionPercentage,
    harmonicAlignmentScore,
    phi
  } = goldenMetrics;

  const fontSizes = {
    sm: 'text-sm sm:text-base leading-[2.2] sm:leading-[2.5]',
    md: 'text-base sm:text-xl leading-[2.3] sm:leading-[2.6]',
    lg: 'text-lg sm:text-2xl leading-[2.4] sm:leading-[2.8]'
  };

  return (
    <div className="space-y-5 text-right font-sans" dir="rtl">
      
      {/* 1. Header Overview Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isLight 
          ? 'bg-gradient-to-l from-amber-50/70 to-ink-50 border-amber-300/60 shadow-xs' 
          : 'bg-[#0B1716] border-amber-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xl shrink-0 shadow-inner">
              φ
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                تحليل القطوع الذهبية الشاملة (Golden Section φ = 1.618)
              </h4>
              <p className="text-xs text-ink-600 dark:text-ink-400 mt-0.5">
                حساب وتحديد موقع نقطة القطع الذهبي (61.8%) على مستوى الآيات، والكلمات، والحروف في {formatSurahName(surah.name)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
              <span>اتساق الآيات مع φ:</span>
              <span className="font-mono">{goldenMetrics.ayahsPhiConvergencePct}%</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
              <span>التوافق الهارموني العام:</span>
              <span className="font-mono">{harmonicAlignmentScore}%</span>
            </span>
          </div>
        </div>

        {/* Insight Explanation */}
        <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed mt-3 pt-1">
          النسبة الذهبية <span className="text-amber-700 dark:text-amber-400 font-bold">φ ≈ 1.6180339</span> تقسم الكل إلى جزأين؛ بحيث تكون نسبة الكل إلى الجزء الأكبر مساوية لنسبة الجزء الأكبر إلى الأصغر (القطع الذهبي عند <span className="text-amber-800 dark:text-amber-300 font-bold">61.8٪</span>). تتيح لك هذه اللوحة استكشاف آية القطع الذهبي، والكلمة الواقعة في نقطة الاتزان، والحرف الذهبي بدقة فائقة مع إمكانية عرض كل مستوى حسب رغبتك.
        </p>
      </div>

      {/* 2. Interactive Level Selector (كما اختار واريد حسب الحاجة) */}
      <div className={`p-3 sm:p-4 rounded-2xl border ${
        isLight ? 'bg-white border-ink-200 shadow-xs' : 'bg-[#10211F] border-ink-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-xs font-bold text-ink-800 dark:text-ink-200">اختر مستوى عرض نقطة القطع الذهبي:</span>
          </div>

          {/* Script & Font Size Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Script Toggle */}
            <div className={`flex items-center rounded-lg p-0.5 border text-xs ${
              isLight ? 'bg-ink-100 border-ink-300' : 'bg-ink-900 border-ink-800'
            }`}>
              <button
                type="button"
                onClick={() => setScriptType('uthmani')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  scriptType === 'uthmani'
                    ? isLight ? 'bg-white text-ink-900 shadow-xs' : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
              >
                رسم عثماني
              </button>
              <button
                type="button"
                onClick={() => setScriptType('simple')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  scriptType === 'simple'
                    ? isLight ? 'bg-white text-ink-900 shadow-xs' : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
                }`}
              >
                إملائي مبسط
              </button>
            </div>

            {/* Font Size controls */}
            <div className={`flex items-center rounded-lg p-0.5 border text-xs ${
              isLight ? 'bg-ink-100 border-ink-300' : 'bg-ink-900 border-ink-800'
            }`}>
              {(['sm', 'md', 'lg'] as const).map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSizeClass(sz)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    fontSizeClass === sz
                      ? isLight ? 'bg-white text-ink-900 shadow-xs' : 'bg-ink-800 text-teal-700 dark:text-teal-400'
                      : 'text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200'
                  }`}
                  title={`حجم الخط: ${sz}`}
                >
                  {sz === 'sm' ? 'A-' : sz === 'md' ? 'A' : 'A+'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Level Switcher Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Level 1: Ayah */}
          <button
            type="button"
            id="golden-tab-ayah"
            onClick={() => setSelectedLevel('ayah')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
              selectedLevel === 'ayah'
                ? isLight 
                  ? 'bg-amber-500/15 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400/40' 
                  : 'bg-amber-500/20 border-amber-400 text-amber-900 dark:text-amber-200 shadow-md ring-1 ring-amber-400/50'
                : isLight
                  ? 'bg-ink-50 border-ink-200 text-ink-700 hover:bg-amber-50/50'
                  : 'bg-ink-900/60 border-ink-800 text-ink-700 dark:text-ink-300 hover:border-ink-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                آية القطع الذهبي
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono">
                الآيات
              </span>
            </div>
            <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
              الآية #{goldenMetrics.goldenAyahNumber}
            </div>
            <div className="text-[10px] text-ink-600 dark:text-ink-400">
              من أصل {surah.totalAyahs} آية ({goldenSectionPercentage}%)
            </div>
          </button>

          {/* Level 2: Word */}
          <button
            type="button"
            id="golden-tab-word"
            onClick={() => setSelectedLevel('word')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
              selectedLevel === 'word'
                ? isLight 
                  ? 'bg-teal-500/15 border-teal-400 text-teal-950 shadow-xs ring-1 ring-teal-400/40' 
                  : 'bg-teal-500/20 border-teal-400 text-teal-900 dark:text-teal-200 shadow-md ring-1 ring-teal-400/50'
                : isLight
                  ? 'bg-ink-50 border-ink-200 text-ink-700 hover:bg-teal-50/50'
                  : 'bg-ink-900/60 border-ink-800 text-ink-700 dark:text-ink-300 hover:border-ink-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                كلمة القطع الذهبي
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 font-mono">
                الألفاظ
              </span>
            </div>
            <div className="text-sm font-bold text-teal-700 dark:text-teal-400 truncate">
              {goldenWordDetail?.wordTextUthmani ? `«${goldenWordDetail.wordTextUthmani}»` : `الكلمة #${goldenMetrics.goldenWordNumber}`}
            </div>
            <div className="text-[10px] text-ink-600 dark:text-ink-400">
              الكلمة #{goldenMetrics.goldenWordNumber} (في آية {goldenWordDetail?.ayahNumber || '-'})
            </div>
          </button>

          {/* Level 3: Letter / Character */}
          <button
            type="button"
            id="golden-tab-char"
            onClick={() => setSelectedLevel('char')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
              selectedLevel === 'char'
                ? isLight 
                  ? 'bg-green-500/15 border-green-400 text-green-950 shadow-xs ring-1 ring-green-400/40' 
                  : 'bg-green-500/20 border-green-400 text-green-900 dark:text-green-200 shadow-md ring-1 ring-green-400/50'
                : isLight
                  ? 'bg-ink-50 border-ink-200 text-ink-700 hover:bg-green-50/50'
                  : 'bg-ink-900/60 border-ink-800 text-ink-700 dark:text-ink-300 hover:border-ink-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                حرف القطع الذهبي
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 font-mono">
                الحروف
              </span>
            </div>
            <div className="text-sm font-bold text-green-700 dark:text-green-400">
              {goldenCharDetail?.char ? `حرف «${goldenCharDetail.char}» (${goldenCharDetail.charName})` : `الحرف #${goldenMetrics.goldenCharIndex}`}
            </div>
            <div className="text-[10px] text-ink-600 dark:text-ink-400">
              الحرف #{goldenMetrics.goldenCharIndex.toLocaleString()} (في آية {goldenCharDetail?.ayahNumber || '-'})
            </div>
          </button>

          {/* Level 4: All-in-One View */}
          <button
            type="button"
            id="golden-tab-all"
            onClick={() => setSelectedLevel('all')}
            className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
              selectedLevel === 'all'
                ? isLight 
                  ? 'bg-lime-500/15 border-lime-400 text-lime-950 shadow-xs ring-1 ring-lime-400/40' 
                  : 'bg-lime-500/20 border-lime-400 text-lime-900 dark:text-lime-200 shadow-md ring-1 ring-lime-400/50'
                : isLight
                  ? 'bg-ink-50 border-ink-200 text-ink-700 hover:bg-lime-50/50'
                  : 'bg-ink-900/60 border-ink-800 text-ink-700 dark:text-ink-300 hover:border-ink-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-lime-700 dark:text-lime-400" />
                عرض الكل معاً
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-500/10 text-lime-700 dark:text-lime-400 font-mono">
                شامل
              </span>
            </div>
            <div className="text-sm font-bold text-lime-700 dark:text-lime-400">
              المقارنة المتوازية الثلاثية
            </div>
            <div className="text-[10px] text-ink-600 dark:text-ink-400">
              الآية + الكلمة + الحرف معاً
            </div>
          </button>
        </div>
      </div>

      {/* 3. Visual Multi-Track Golden Proportional Timeline */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isLight ? 'bg-white border-ink-200 shadow-xs' : 'bg-[#0B1716] border-ink-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-ink-800 dark:text-ink-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            مسطرة التموضع الذهبي المتعدد (61.8% عبر مسار السورة):
          </span>
          <div className="flex items-center gap-3 text-[11px] text-ink-600 dark:text-ink-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              الآية الذهبية #{goldenMetrics.goldenAyahNumber}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block"></span>
              الكلمة #{goldenMetrics.goldenWordNumber}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
              الحرف #{goldenMetrics.goldenCharIndex}
            </span>
          </div>
        </div>

        {/* The Track Bar */}
        <div className="relative pt-6 pb-2" dir="rtl">
          {/* Base Track */}
          <div className="h-4 w-full rounded-full overflow-hidden flex border border-ink-700/80 p-0.5 bg-ink-950">
            {/* Major Part */}
            <div 
              className="h-full bg-gradient-to-l from-amber-500 via-teal-500 to-emerald-500 rounded-r-full shadow-inner transition-all duration-300"
              style={{ width: `${goldenSectionPercentage}%` }}
            />
            {/* Minor Part */}
            <div 
              className="h-full bg-ink-800/80 rounded-l-full transition-all duration-300"
              style={{ width: `${100 - goldenSectionPercentage}%` }}
            />
          </div>

          {/* Pin Markers */}
          <div 
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center cursor-pointer transition-all hover:scale-110"
            style={{ right: `${goldenSectionPercentage}%` }}
            onClick={() => setSelectedLevel('all')}
            title="نقطة القطع الذهبي المركزية (61.8%)"
          >
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 shadow-xs">
              61.8% (φ)
            </span>
            <div className="w-0.5 h-3 bg-amber-400"></div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-ink-600 dark:text-ink-400 px-1 mt-2">
            <span>البداية (آية 1)</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">القسم الأكبر (61.8%) | القسم المتمم (38.2%)</span>
            <span>الخاتمة (آية {surah.totalAyahs})</span>
          </div>
        </div>
      </div>

      {/* 4. RENDER LEVEL CONTENT BASED ON USER SELECTION */}

      {/* 4.A: THE GOLDEN AYAH (آية القطع الذهبي) */}
      {(selectedLevel === 'ayah' || selectedLevel === 'all') && goldenAyahDetail && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight 
            ? 'bg-amber-50/40 border-amber-300 shadow-sm' 
            : 'bg-[#10211F] border-amber-500/40 shadow-lg shadow-amber-500/5'
        }`}>
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
              <h5 className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                آية القطع الذهبي (الآية رقم {goldenAyahDetail.ayahNumber} من {formatSurahName(surah.name)})
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                الموقع: {goldenAyahDetail.positionPercentage}% من مسار الآيات
              </span>
              <button
                type="button"
                onClick={() => handleCopy(
                  scriptType === 'uthmani' ? goldenAyahDetail.textUthmani : goldenAyahDetail.textSimple, 
                  'ayah'
                )}
                className="p-1.5 rounded-lg border border-ink-700 hover:border-amber-400 text-ink-600 dark:text-ink-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                title="نسخ نص الآية"
              >
                {copiedText === 'ayah' ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {onOpenInReader && (
                <button
                  type="button"
                  onClick={() => onOpenInReader(surah.number)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-ink-950 flex items-center gap-1 transition-colors"
                  title="فتح في المصحف الشريف"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>في المصحف</span>
                </button>
              )}
            </div>
          </div>

          {/* Ayah Text Display */}
          <div className={`quran-ayah-container w-full max-w-full p-4 sm:p-6 rounded-xl border text-center font-quran ${fontSizes[fontSizeClass]} select-text shadow-inner ${
            isLight 
              ? 'bg-amber-50/80 border-amber-200 text-ink-950' 
              : 'bg-black/60 border-amber-500/30 text-amber-100'
          }`} dir="rtl">
            <span className="opacity-60 select-none">« </span>
            {scriptType === 'uthmani' ? goldenAyahDetail.textUthmani : goldenAyahDetail.textSimple}
            <span className="opacity-60 select-none"> »</span>
            {' '}
            <span className="inline-block mr-1 font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
              ﴿{goldenAyahDetail.ayahNumber}﴾
            </span>
          </div>

          {/* Ayah Metrics Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 text-xs">
            <div className="p-2.5 rounded-xl bg-black/20 border border-amber-500/20">
              <span className="text-ink-600 dark:text-ink-400 text-[11px] block">رقم الآية في السورة:</span>
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300">#{goldenAyahDetail.ayahNumber}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/20 border border-amber-500/20">
              <span className="text-ink-600 dark:text-ink-400 text-[11px] block">ترتيبها في المصحف:</span>
              <span className="text-sm font-bold text-ink-800 dark:text-ink-200">#{goldenAyahDetail.numberInQuran}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/20 border border-amber-500/20">
              <span className="text-ink-600 dark:text-ink-400 text-[11px] block">عدد كلمات الآية:</span>
              <span className="text-sm font-bold text-teal-800 dark:text-teal-300">{goldenAyahDetail.wordCount} كلمة</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/20 border border-amber-500/20">
              <span className="text-ink-600 dark:text-ink-400 text-[11px] block">عدد حروفها المجردة:</span>
              <span className="text-sm font-bold text-green-800 dark:text-green-300">{goldenAyahDetail.charCount} حرف</span>
            </div>
          </div>
        </div>
      )}

      {/* 4.B: THE GOLDEN WORD (كلمة القطع الذهبي مع سياقها في الآية) */}
      {(selectedLevel === 'word' || selectedLevel === 'all') && goldenWordDetail && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight 
            ? 'bg-teal-50/40 border-teal-300 shadow-sm' 
            : 'bg-[#10211F] border-teal-500/40 shadow-lg shadow-teal-500/5'
        }`}>
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-teal-500/20 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-teal-400"></span>
              <h5 className="text-sm sm:text-base font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                كلمة القطع الذهبي: الكلمة #{goldenWordDetail.globalWordIndex.toLocaleString()} (في الآية #{goldenWordDetail.ayahNumber})
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                الموقع: {goldenWordDetail.positionPercentage}% من رصيد كلمات السورة
              </span>
              <button
                type="button"
                onClick={() => handleCopy(
                  scriptType === 'uthmani' ? goldenWordDetail.wordTextUthmani : goldenWordDetail.wordTextSimple, 
                  'word'
                )}
                className="p-1.5 rounded-lg border border-ink-700 hover:border-teal-400 text-ink-600 dark:text-ink-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors"
                title="نسخ الكلمة الذهبية"
              >
                {copiedText === 'word' ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Spotlight on the Word */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 mb-3.5">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-400 font-heading text-2xl sm:text-3xl font-bold text-teal-900 dark:text-teal-200 shadow-inner">
                {scriptType === 'uthmani' ? goldenWordDetail.wordTextUthmani : goldenWordDetail.wordTextSimple}
              </div>
              <div>
                <div className="text-xs font-bold text-ink-800 dark:text-ink-200">
                  الكلمة الذهبية الواقعة عند النسبة φ = 1.618
                </div>
                <div className="text-[11px] text-ink-600 dark:text-ink-400">
                  الكلمة رقم {goldenWordDetail.wordIndexInAyah} من أصل {goldenWordDetail.totalWordsInAyah} كلمات في الآية رقم {goldenWordDetail.ayahNumber}
                </div>
              </div>
            </div>

            <div className="text-left text-xs font-mono text-ink-700 dark:text-ink-300">
              <div>الترتيب بين كلمات السورة: <strong>الكلمة #{goldenWordDetail.globalWordIndex.toLocaleString()}</strong> / {goldenWordDetail.totalWords.toLocaleString()} كلمة</div>
              <div className="text-teal-700 dark:text-teal-400 text-[11px]">نسبة التموضع: {((goldenWordDetail.globalWordIndex / goldenWordDetail.totalWords) * 100).toFixed(2)}%</div>
            </div>
          </div>

          {/* Full Host Ayah with Word Highlighted */}
          <div className="space-y-2">
            <div className="text-xs text-ink-600 dark:text-ink-400 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>نص الآية الحاضنة للكلمة الذهبية (الآية {goldenWordDetail.ayahNumber}):</span>
                <span className="text-[10px] text-teal-700 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                  الكلمة الذهبية مميزة داخل النص
                </span>
              </span>
            </div>

            <HostAyahViewer
              ayahNumber={goldenWordDetail.ayahNumber}
              tokens={scriptType === 'uthmani' ? goldenWordDetail.hostAyahWordsUthmani : goldenWordDetail.hostAyahWordsSimple}
              targetTokenIndex={scriptType === 'uthmani' ? goldenWordDetail.uthTokenIndexInAyah : goldenWordDetail.simTokenIndexInAyah}
              targetWordText={scriptType === 'uthmani' ? goldenWordDetail.wordTextUthmani : goldenWordDetail.wordTextSimple}
              isLight={isLight}
              fontSizeClass={fontSizeClass}
              themeColor="teal"
              badgeTitle={`الكلمة الذهبية رقم ${goldenWordDetail.globalWordIndex.toLocaleString()}`}
            />
          </div>
        </div>
      )}

      {/* 4.C: THE GOLDEN LETTER (حرف القطع الذهبي مع سياقه في الكلمة والآية) */}
      {(selectedLevel === 'char' || selectedLevel === 'all') && goldenCharDetail && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLight 
            ? 'bg-green-50/40 border-green-300 shadow-sm' 
            : 'bg-[#10211F] border-green-500/40 shadow-lg shadow-green-500/5'
        }`}>
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-green-500/20 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <h5 className="text-sm sm:text-base font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                <Type className="w-4 h-4" />
                حرف القطع الذهبي: الحرف #{goldenCharDetail.globalCharIndex.toLocaleString()} (في الآية #{goldenCharDetail.ayahNumber})
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-green-500/15 text-green-800 dark:text-green-300 border border-green-500/30">
                الموقع: {goldenCharDetail.positionPercentage}% من إجمالي حروف السورة
              </span>
              <button
                type="button"
                onClick={() => handleCopy(goldenCharDetail.char, 'char')}
                className="p-1.5 rounded-lg border border-ink-700 hover:border-green-400 text-ink-600 dark:text-ink-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                title="نسخ الحرف الذهبي"
              >
                {copiedText === 'char' ? <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Spotlight on the Golden Letter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-3.5">
            <div className="flex items-center gap-3">
              {/* Massive letter glyph */}
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 border-2 border-green-400 flex items-center justify-center font-heading text-3xl sm:text-4xl font-black text-green-900 dark:text-green-200 shadow-inner">
                {goldenCharDetail.char}
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
                  <span>{goldenCharDetail.charName} («{goldenCharDetail.char}»)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-400 text-ink-950 font-bold font-mono">
                    القطع الذهبي φ
                  </span>
                </div>
                <div className="text-xs text-ink-700 dark:text-ink-300 mt-1">
                  يقع داخل كلمة «<strong>{scriptType === 'uthmani' ? goldenCharDetail.wordTextUthmani : goldenCharDetail.wordTextSimple}</strong>» (الحرف رقم {goldenCharDetail.charIndexInWord} من أصل {goldenCharDetail.totalCharsInWord} حروف)
                </div>
              </div>
            </div>

            <div className="text-left text-xs font-mono text-ink-700 dark:text-ink-300">
              <div>الترتيب بين حروف السورة: <strong>الحرف #{goldenCharDetail.globalCharIndex.toLocaleString()}</strong> / {goldenCharDetail.totalChars.toLocaleString()} حرفاً</div>
              <div className="text-green-700 dark:text-green-400 text-[11px]">نسبة التموضع: {((goldenCharDetail.globalCharIndex / goldenCharDetail.totalChars) * 100).toFixed(2)}%</div>
            </div>
          </div>

          {/* Full Host Ayah with Word and Letter Highlighted */}
          <div className="space-y-2">
            <div className="text-xs text-ink-600 dark:text-ink-400 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>نص الآية الحاضنة للحرف الذهبي (الآية {goldenCharDetail.ayahNumber}):</span>
                <span className="text-[10px] text-green-700 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                  الكلمة والحرف الذهبي محدد في مكانه
                </span>
              </span>
            </div>

            <HostAyahViewer
              ayahNumber={goldenCharDetail.ayahNumber}
              tokens={scriptType === 'uthmani' ? goldenCharDetail.hostAyahWordsUthmani : goldenCharDetail.hostAyahWordsSimple}
              targetTokenIndex={scriptType === 'uthmani' ? goldenCharDetail.uthTokenIndexInAyah : goldenCharDetail.simTokenIndexInAyah}
              targetWordText={scriptType === 'uthmani' ? goldenCharDetail.wordTextUthmani : goldenCharDetail.wordTextSimple}
              isLight={isLight}
              fontSizeClass={fontSizeClass}
              themeColor="cyan"
              badgeTitle={`الكلمة الحاضنة للحرف الذهبي «${goldenCharDetail.char}»`}
              charAnnotation={{
                char: goldenCharDetail.char,
                charName: goldenCharDetail.charName,
                charIndexInWord: goldenCharDetail.charIndexInWord,
                totalCharsInWord: goldenCharDetail.totalCharsInWord
              }}
            />
          </div>
        </div>
      )}

      {/* 5. Comprehensive Harmonic Comparison Table */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isLight ? 'bg-white border-ink-200 shadow-xs' : 'bg-[#0B1716] border-ink-800'
      }`}>
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-ink-800 dark:text-ink-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            جدول المقارنة الرياضية المتكاملة للقطوع الذهبية (الآيات vs الكلمات vs الحروف)
          </h5>
          <span className="text-[10px] text-ink-600 dark:text-ink-400 font-mono">
            القيمة المعيارية الذهبية: φ = {phi}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="text-[10px] text-ink-600 dark:text-ink-400 uppercase border-b border-ink-800">
              <tr>
                <th className="p-2.5">المستوى</th>
                <th className="p-2.5">إجمالي العدد</th>
                <th className="p-2.5">نقطة القطع (A)</th>
                <th className="p-2.5">المتمم (B)</th>
                <th className="p-2.5">النسبة (A+B)/A</th>
                <th className="p-2.5">نسبة A/B</th>
                <th className="p-2.5">الانحراف عن φ</th>
                <th className="p-2.5">درجة الاتساق</th>
                <th className="p-2.5">المحتوى القرآني للقطع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/60 text-ink-700 dark:text-ink-300 text-[11px]">
              {/* Ayahs Row */}
              <tr className="hover:bg-amber-500/5 transition-colors">
                <td className="p-2.5 font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  الآيات
                </td>
                <td className="p-2.5">{surah.totalAyahs}</td>
                <td className="p-2.5 font-bold text-ink-900 dark:text-ink-100">آية {goldenMetrics.goldenAyahNumber}</td>
                <td className="p-2.5">{surah.totalAyahs - goldenMetrics.goldenAyahNumber}</td>
                <td className="p-2.5 text-amber-800 dark:text-amber-300 font-bold">{goldenMetrics.ayahRatio}</td>
                <td className="p-2.5 text-ink-800 dark:text-ink-200">{(goldenMetrics.goldenAyahNumber / Math.max(1, surah.totalAyahs - goldenMetrics.goldenAyahNumber)).toFixed(3)}</td>
                <td className="p-2.5 text-emerald-700 dark:text-emerald-400">{goldenMetrics.deltaPhiAyahs}</td>
                <td className="p-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold">
                    {goldenMetrics.ayahsPhiConvergencePct}%
                  </span>
                </td>
                <td className="p-2.5 font-heading text-amber-900 dark:text-amber-200 truncate max-w-[200px]">
                  الآية {goldenMetrics.goldenAyahNumber}
                </td>
              </tr>

              {/* Words Row */}
              <tr className="hover:bg-teal-500/5 transition-colors">
                <td className="p-2.5 font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  الكلمات
                </td>
                <td className="p-2.5">{goldenMetrics.totalWords.toLocaleString('en-US')}</td>
                <td className="p-2.5 font-bold text-ink-900 dark:text-ink-100">كلمة {goldenMetrics.goldenWordNumber.toLocaleString('en-US')}</td>
                <td className="p-2.5">{(goldenMetrics.totalWords - goldenMetrics.goldenWordNumber).toLocaleString('en-US')}</td>
                <td className="p-2.5 text-teal-800 dark:text-teal-300 font-bold">{goldenMetrics.wordRatio}</td>
                <td className="p-2.5 text-ink-800 dark:text-ink-200">{(goldenMetrics.goldenWordNumber / Math.max(1, goldenMetrics.totalWords - goldenMetrics.goldenWordNumber)).toFixed(3)}</td>
                <td className="p-2.5 text-emerald-700 dark:text-emerald-400">{goldenMetrics.deltaPhiWords}</td>
                <td className="p-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-800 dark:text-teal-300 font-bold">
                    {goldenMetrics.wordsPhiConvergencePct}%
                  </span>
                </td>
                <td className="p-2.5 font-heading text-teal-900 dark:text-teal-200">
                  {goldenWordDetail?.wordTextUthmani ? `«${goldenWordDetail.wordTextUthmani}» (آية ${goldenWordDetail.ayahNumber})` : '-'}
                </td>
              </tr>

              {/* Chars Row */}
              <tr className="hover:bg-green-500/5 transition-colors">
                <td className="p-2.5 font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" />
                  الحروف
                </td>
                <td className="p-2.5">{goldenMetrics.totalChars.toLocaleString('en-US')}</td>
                <td className="p-2.5 font-bold text-ink-900 dark:text-ink-100">حرف {goldenMetrics.goldenCharIndex.toLocaleString('en-US')}</td>
                <td className="p-2.5">{(goldenMetrics.totalChars - goldenMetrics.goldenCharIndex).toLocaleString('en-US')}</td>
                <td className="p-2.5 text-green-800 dark:text-green-300 font-bold">{goldenMetrics.charRatio}</td>
                <td className="p-2.5 text-ink-800 dark:text-ink-200">{(goldenMetrics.goldenCharIndex / Math.max(1, goldenMetrics.totalChars - goldenMetrics.goldenCharIndex)).toFixed(3)}</td>
                <td className="p-2.5 text-emerald-700 dark:text-emerald-400">{goldenMetrics.deltaPhiChars}</td>
                <td className="p-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-800 dark:text-green-300 font-bold">
                    {goldenMetrics.charsPhiConvergencePct}%
                  </span>
                </td>
                <td className="p-2.5 font-heading text-green-900 dark:text-green-200">
                  {goldenCharDetail?.char ? `حرف «${goldenCharDetail.char}» في «${goldenCharDetail.wordTextUthmani}» (آية ${goldenCharDetail.ayahNumber})` : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

import React from 'react';
import { 
  ArrowRightLeft, 
  Sparkles, 
  Split, 
  GitMerge, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ChevronLeft,
  BookOpen
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AyahShiftInfo, WordTokenAnalysis } from '../utils/mushafVerseDiff';
import { QuranAyah } from '../types';

// Helper to accurately count Arabic words in verse text (excluding isolated waqf marks)
const countArabicWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => /[\u0621-\u064A\u0671\u0670]/.test(w)).length;
};

// Helper for Arabic word count grammatically formatted
const formatArabicWordCount = (count: number): string => {
  if (count === 1) return 'كلمة واحدة (1)';
  if (count === 2) return 'كلمتان (2)';
  if (count >= 3 && count <= 10) return `${count} كلمات`;
  return `${count} كلمة`;
};

interface MushafVerseAnalysisCardProps {
  kufiAyahNum: number;
  kufiAyah?: QuranAyah;
  madaniAyahs: QuranAyah[];
  kufiShiftInfo?: AyahShiftInfo;
  kufiWordTokens?: WordTokenAnalysis[];
  madaniWordTokens?: WordTokenAnalysis[];
  onClose: () => void;
  onNextDiff: () => void;
  onPrevDiff: () => void;
  hasDivergences: boolean;
}

export const MushafVerseAnalysisCard: React.FC<MushafVerseAnalysisCardProps> = ({
  kufiAyahNum,
  kufiAyah,
  madaniAyahs,
  kufiShiftInfo,
  kufiWordTokens,
  madaniWordTokens,
  onClose,
  onNextDiff,
  onPrevDiff,
  hasDivergences
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!kufiAyah || !kufiShiftInfo) return null;

  // Accurate word count
  const kufiWordsCount = countArabicWords(kufiAyah.textUthmani);
  const madaniWordsCount = madaniAyahs.reduce((sum, a) => sum + countArabicWords(a.textUthmani), 0);

  // Extract distinct word differences
  const wordDiffPairs: { kufi: string; madani: string; type: string; explanation?: string }[] = [];
  if (kufiWordTokens) {
    kufiWordTokens.forEach(t => {
      if (t.type !== 'identical' && (t.type === 'lexical_diff' || t.type === 'reading_diff')) {
        wordDiffPairs.push({
          kufi: t.clean,
          madani: t.partner || '—',
          type: t.type === 'lexical_diff' ? 'اختلاف رسم/حرف' : 'اختلاف قراءة/فرش',
          explanation: t.explanation
        });
      }
    });
  }

  // Type-specific badge styling
  const getTypeBadge = () => {
    switch (kufiShiftInfo.type) {
      case 'split':
        return {
          icon: <Split className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />,
          bg: isLight ? 'bg-lime-50 text-lime-950 border-lime-300 shadow-2xs font-bold' : 'bg-lime-950 text-lime-300 border-lime-800',
          title: `انقسام فاصلة: تقابل آيات مدنية (${kufiShiftInfo.mappedNumbers.join(', ')})`
        };
      case 'merged':
        return {
          icon: <GitMerge className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />,
          bg: isLight ? 'bg-teal-50 text-teal-950 border-teal-300 shadow-2xs font-bold' : 'bg-teal-950 text-teal-300 border-teal-800',
          title: `دمج فواصل: ضمن آية مدنية رقم ${kufiShiftInfo.mappedNumbers.join(', ')}`
        };
      case 'shifted':
        const sign = kufiShiftInfo.shiftOffset > 0 ? `+${kufiShiftInfo.shiftOffset}` : `${kufiShiftInfo.shiftOffset}`;
        return {
          icon: <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          bg: isLight ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-2xs font-bold' : 'bg-amber-950 text-amber-300 border-amber-800',
          title: `زحزحة في الترقيم: ${sign} (تقابل آية ${kufiShiftInfo.mappedNumbers[0]} بالمدني)`
        };
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          bg: isLight ? 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-2xs font-bold' : 'bg-emerald-950 text-emerald-300 border-emerald-800',
          title: 'تطابق تام في الترقيم وفواصل الآي'
        };
    }
  };

  const badge = getTypeBadge();

  return (
    <div className={`rounded-xl border p-4 shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
      isLight ? 'bg-white border-ink-300 shadow-ink-200/80' : 'bg-ink-900 border-ink-700 shadow-black/40'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-ink-200 dark:border-ink-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border flex items-center gap-1.5 ${
            isLight ? 'bg-teal-100 text-teal-950 border-teal-300 shadow-2xs' : 'bg-teal-950 text-teal-200 border-teal-800'
          }`}>
            <BookOpen className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-teal-400" />
            <span>تحليل المقابلة: آية {kufiAyahNum} (الكوفي)</span>
          </span>

          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${badge.bg}`}>
            {badge.icon}
            <span>{badge.title}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {hasDivergences && (
            <>
              <button
                onClick={onPrevDiff}
                className={`p-1.5 rounded-lg border transition-all ${
                  isLight ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-950 font-bold shadow-2xs' : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-300'
                }`}
                title="الفرق السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNextDiff}
                className={`p-1.5 rounded-lg border transition-all ${
                  isLight ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-950 font-bold shadow-2xs' : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-300'
                }`}
                title="الفرق التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-all ${
              isLight ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-950 font-bold' : 'hover:bg-ink-800 border-ink-800 text-ink-400'
            }`}
            title="إغلاق بطاقة التحليل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className={`mt-3 p-3 rounded-lg border text-xs leading-relaxed ${
        isLight ? 'bg-ink-50 border-ink-300 text-ink-950 shadow-2xs' : 'bg-ink-950 border-ink-800 text-ink-300'
      }`}>
        <p className="leading-relaxed">
          <strong className="text-ink-950 dark:text-ink-100 font-extrabold ml-1">التوجيه العددي والفواصل: </strong>
          <span className={`font-semibold ${isLight ? 'text-ink-950' : 'text-ink-300'}`}>{kufiShiftInfo.description}</span>
        </p>
      </div>

      {/* Word-level differences section if any */}
      {wordDiffPairs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-ink-200 dark:border-ink-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border flex items-center justify-center ${
                isLight ? 'bg-rose-100 text-rose-950 border-rose-300 shadow-2xs' : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}>
                <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </span>
              <h5 className={`text-sm font-extrabold ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
                الفروق اللفظية والقرائية في هذه الآية ({wordDiffPairs.length}):
              </h5>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border ${
              isLight ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}>
              مقارنة الكلمات والفرش
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {wordDiffPairs.map((pair, idx) => (
              <div 
                key={`diff-pair-${idx}`}
                className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                  isLight 
                    ? 'bg-white border-rose-300 shadow-xs text-ink-950 hover:border-rose-400' 
                    : 'bg-ink-950/70 border-rose-900/60 text-rose-100 shadow-xs'
                }`}
              >
                {/* Type Badge & Index Header */}
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-rose-200/80 dark:border-rose-900/40">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                    isLight 
                      ? 'bg-rose-100 text-rose-950 border-rose-300' 
                      : 'bg-rose-950 text-rose-200 border-rose-800'
                  }`}>
                    {pair.type}
                  </span>
                  <span className={`text-[11px] font-mono font-extrabold ${
                    isLight ? 'text-ink-950' : 'text-ink-400'
                  }`}>
                    موضع فرق #{idx + 1}
                  </span>
                </div>

                {/* Side-by-side Word Comparison Boxes */}
                <div className="flex items-center gap-2 sm:gap-3 py-1">
                  {/* Hafs Word */}
                  <div className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                    isLight 
                      ? 'bg-white border-[#1A5C5C] shadow-xs' 
                      : 'bg-teal-950/50 border-teal-700'
                  }`}>
                    <div className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black font-mono mb-2 ${
                      isLight ? 'bg-[#1A5C5C] text-white shadow-2xs' : 'bg-teal-900 text-teal-100 border border-teal-700'
                    }`}>
                      حفص (المصحف الكوفي)
                    </div>
                    <div className={`font-quran-hafs text-xl sm:text-2xl font-black ${
                      isLight ? 'text-black' : 'text-teal-100'
                    }`}>
                      <span className="underline decoration-[#1A5C5C] decoration-4 underline-offset-4">
                        {pair.kufi}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className={`p-2.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    isLight 
                      ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs font-bold' 
                      : 'bg-ink-900 border-ink-700 text-ink-200'
                  }`}>
                    <ArrowRightLeft className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  </div>

                  {/* Warsh Word */}
                  <div className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                    isLight 
                      ? 'bg-white border-emerald-500 shadow-xs' 
                      : 'bg-emerald-950/50 border-emerald-700'
                  }`}>
                    <div className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black font-mono mb-2 ${
                      isLight ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-emerald-900 text-emerald-100 border border-emerald-700'
                    }`}>
                      ورش (المصحف المدني)
                    </div>
                    <div className={`font-quran-warsh text-xl sm:text-2xl font-black ${
                      isLight ? 'text-black' : 'text-emerald-100'
                    }`}>
                      <span className="underline decoration-emerald-600 decoration-4 underline-offset-4">
                        {pair.madani}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation Box with High Contrast */}
                {pair.explanation && (
                  <div className={`p-3 rounded-lg border-2 text-xs leading-relaxed ${
                    isLight 
                      ? 'bg-ink-50 border-ink-300 text-ink-950 font-medium' 
                      : 'bg-ink-900 border-ink-800 text-ink-200'
                  }`}>
                    <span className={`font-black ml-1 text-sm ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
                      التوجيه البياني:
                    </span>
                    <span className={`font-bold ${isLight ? 'text-ink-950' : 'text-ink-300'}`}>
                      {pair.explanation}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side texts */}
      <div className="mt-4 pt-4 border-t-2 border-ink-300 dark:border-ink-800 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kufi Ayah */}
        <div className={`rounded-xl border-2 overflow-hidden shadow-sm transition-all ${
          isLight ? 'bg-white border-[#1A5C5C] shadow-teal-100' : 'bg-ink-900 border-teal-700 shadow-black/40'
        }`}>
          {/* Distinct Solid Header Bar */}
          <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
            isLight ? 'bg-[#1A5C5C] text-white border-teal-800' : 'bg-teal-950 text-teal-200 border-teal-850'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white dark:bg-teal-400"></span>
              <span className="font-black text-xs sm:text-sm text-white dark:text-teal-200 tracking-wide">
                المصحف الكوفي (حفص) - آية {kufiAyahNum}
              </span>
            </div>
            <span className={`font-mono text-xs px-2.5 py-0.5 rounded-md border font-black ${
              isLight ? 'bg-teal-950 text-white border-teal-400 shadow-xs' : 'bg-teal-900/90 text-teal-200 border-teal-700'
            }`}>
              {formatArabicWordCount(kufiWordsCount)}
            </span>
          </div>

          {/* Ayah Content */}
          <div className={`p-4 ${isLight ? 'bg-teal-50/25' : 'bg-ink-950/60'}`}>
            <p className={`font-quran-hafs text-xl sm:text-2xl leading-loose font-black select-text ${
              isLight ? 'text-black' : 'text-ink-100'
            }`}>
              {kufiAyah.textUthmani}
            </p>
          </div>
        </div>

        {/* Madani Ayahs */}
        <div className={`rounded-xl border-2 overflow-hidden shadow-sm transition-all ${
          isLight ? 'bg-white border-emerald-600 shadow-emerald-100' : 'bg-ink-900 border-emerald-700 shadow-black/40'
        }`}>
          {/* Distinct Solid Header Bar */}
          <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
            isLight ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-emerald-950 text-emerald-200 border-emerald-800/80'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white dark:bg-emerald-400"></span>
              <span className="font-black text-xs sm:text-sm text-white dark:text-emerald-200 tracking-wide">
                المصحف المدني (ورش) - {madaniAyahs.map(a => `آية ${a.numberInSurah}`).join(' و ')}
              </span>
            </div>
            <span className={`font-mono text-xs px-2.5 py-0.5 rounded-md border font-black ${
              isLight ? 'bg-emerald-950 text-white border-emerald-400 shadow-xs' : 'bg-emerald-900/90 text-emerald-200 border-emerald-700'
            }`}>
              {formatArabicWordCount(madaniWordsCount)}
            </span>
          </div>

          {/* Ayah Content */}
          <div className={`p-4 space-y-3 ${isLight ? 'bg-emerald-50/25' : 'bg-ink-950/60'}`}>
            {madaniAyahs.map((mA, idx) => (
              <p key={`m-ayah-${mA.numberInSurah}-${idx}`} className={`font-quran-warsh text-xl sm:text-2xl leading-loose font-black select-text ${
                isLight ? 'text-black' : 'text-ink-100'
              }`}>
                {madaniAyahs.length > 1 && (
                  <span className={`inline-block ml-2 px-2 py-0.5 rounded-md text-xs font-mono font-black border ${
                    isLight ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs' : 'bg-emerald-900 text-emerald-200 border-emerald-700'
                  }`}>
                    آية {mA.numberInSurah}:
                  </span>
                )}
                {mA.textUthmani}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

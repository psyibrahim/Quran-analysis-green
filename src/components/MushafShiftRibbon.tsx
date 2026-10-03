import React from 'react';
import { 
  ArrowRightLeft, 
  Split, 
  GitMerge, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SurahDivergenceAnalysis, VerseShiftType } from '../utils/mushafVerseDiff';

interface MushafShiftRibbonProps {
  analysis: SurahDivergenceAnalysis;
  highlightedAyah: number | null;
  onSelectAyah: (ayahNum: number) => void;
  onJumpNextDiff: () => void;
  onJumpPrevDiff: () => void;
}

export const MushafShiftRibbon: React.FC<MushafShiftRibbonProps> = ({
  analysis,
  highlightedAyah,
  onSelectAyah,
  onJumpNextDiff,
  onJumpPrevDiff
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const totalVerses = Math.max(analysis.kufiAyahsCount, analysis.madaniAyahsCount);

  // Helper for color coding a verse
  const getVerseColor = (ayahNum: number): { bg: string; border: string; text: string; label: string } => {
    const kufiInfo = analysis.kufiShiftMap.get(ayahNum);
    if (!kufiInfo) {
      return {
        bg: isLight ? 'bg-ink-200' : 'bg-ink-800',
        border: 'border-transparent',
        text: 'text-ink-500',
        label: `آية ${ayahNum}`
      };
    }

    if (kufiInfo.type === 'split') {
      return {
        bg: isLight ? 'bg-lime-500' : 'bg-lime-600',
        border: isLight ? 'border-lime-600' : 'border-lime-400',
        text: 'text-white',
        label: `آية ${ayahNum}: انقسام فاصلة (تقابل آيات مدنية: ${kufiInfo.mappedNumbers.join(', ')})`
      };
    }

    if (kufiInfo.type === 'merged') {
      return {
        bg: isLight ? 'bg-teal-600' : 'bg-teal-500',
        border: isLight ? 'border-teal-700' : 'border-teal-400',
        text: 'text-white',
        label: `آية ${ayahNum}: دمج فواصل (ضمن آية مدنية رقم ${kufiInfo.mappedNumbers.join(', ')})`
      };
    }

    if (kufiInfo.type === 'shifted') {
      const sign = kufiInfo.shiftOffset > 0 ? `+${kufiInfo.shiftOffset}` : `${kufiInfo.shiftOffset}`;
      return {
        bg: isLight ? 'bg-amber-500' : 'bg-amber-600',
        border: isLight ? 'border-amber-600' : 'border-amber-400',
        text: 'text-white',
        label: `آية ${ayahNum}: زحزحة بالترقيم (${sign}) تقابل آية ${kufiInfo.mappedNumbers[0]} بالمدني`
      };
    }

    if (kufiInfo.hasWordDiff) {
      return {
        bg: isLight ? 'bg-rose-500' : 'bg-rose-600',
        border: isLight ? 'border-rose-600' : 'border-rose-400',
        text: 'text-white',
        label: `آية ${ayahNum}: مطابقة بالعد مع وجود اختلاف لفظي/قرائي`
      };
    }

    return {
      bg: isLight ? 'bg-emerald-500' : 'bg-emerald-600',
      border: isLight ? 'border-emerald-600' : 'border-emerald-400',
      text: 'text-white',
      label: `آية ${ayahNum}: مطابقة تامة في العد وفواصل الآي`
    };
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
    }`}>
      {/* 1. Header & Quick Stat Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`p-2 rounded-lg border flex items-center justify-center ${
            isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
          }`}>
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h4 className={`text-sm font-extrabold ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
              خريطة زحزحة وفواصل السورة (المصحفان جنباً إلى جنب)
            </h4>
            <p className={`text-xs ${isLight ? 'text-ink-900 font-bold' : 'text-ink-400 font-medium'} mt-0.5`}>
              شريط مسحي بصري تفاعلي: انقر على أي قطعة للانتقال الفوري إلى الآية في كلا العمودين
            </p>
          </div>
        </div>

        {/* Prev / Next Diff Jumpers */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className={`text-xs font-extrabold hidden md:inline ${isLight ? 'text-ink-950' : 'text-ink-300'}`}>
            التنقل بين الفروق:
          </span>
          <button
            onClick={onJumpPrevDiff}
            disabled={analysis.divergentAyahNumbers.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isLight 
                ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-950 shadow-2xs' 
                : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-200'
            }`}
            title="الانتقال إلى الاختلاف السابق في السورة"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>السابق</span>
          </button>

          <button
            onClick={onJumpNextDiff}
            disabled={analysis.divergentAyahNumbers.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isLight 
                ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-950 shadow-2xs' 
                : 'bg-ink-950 hover:bg-ink-800 border-ink-800 text-ink-200'
            }`}
            title="الانتقال إلى الاختلاف التالي في السورة"
          >
            <span>التالي</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Shift Ribbon (Segments Strip) */}
      <div className="space-y-2 mb-3.5">
        <div className={`p-2 rounded-xl border flex gap-1 overflow-x-auto select-none ${
          isLight ? 'bg-ink-100 border-ink-300 shadow-inner' : 'bg-ink-950 border-ink-800'
        }`}>
          {Array.from({ length: totalVerses }).map((_, i) => {
            const ayahNum = i + 1;
            const isSelected = highlightedAyah === ayahNum;
            const colors = getVerseColor(ayahNum);

            return (
              <button
                key={`ribbon-ayah-${ayahNum}`}
                onClick={() => onSelectAyah(ayahNum)}
                className={`h-6 min-w-[14px] flex-1 rounded-xs transition-all hover:scale-110 hover:z-10 focus:outline-hidden ${
                  colors.bg
                } ${
                  isSelected ? 'ring-2 ring-emerald-500 scale-125 z-20 shadow-md font-bold' : 'opacity-90 hover:opacity-100'
                }`}
                title={colors.label}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs font-mono font-extrabold px-1">
          <span className={`px-2 py-0.5 rounded border ${
            isLight ? 'bg-white border-ink-300 text-ink-950 shadow-2xs' : 'bg-ink-900 border-ink-800 text-ink-300'
          }`}>
            آية 1
          </span>
          <span className={`${isLight ? 'text-ink-950 font-black' : 'text-ink-200'}`}>
            مسار آيات السورة (1 إلى {totalVerses})
          </span>
          <span className={`px-2 py-0.5 rounded border ${
            isLight ? 'bg-white border-ink-300 text-ink-950 shadow-2xs' : 'bg-ink-900 border-ink-800 text-ink-300'
          }`}>
            آية {totalVerses}
          </span>
        </div>
      </div>

      {/* 3. Stat Badges Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-ink-200 dark:border-ink-800/80">
        {/* Exact Match */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-emerald-50/95 border-emerald-600 text-emerald-950 shadow-xs' 
            : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-emerald-950 font-extrabold' : 'text-emerald-300 font-bold'}`}>
              تطابق تام
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-emerald-950' : 'text-emerald-100'}`}>
              {analysis.exactMatchesCount} آية
            </div>
          </div>
        </div>

        {/* Shifted Verses */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-amber-50/95 border-amber-600 text-amber-950 shadow-xs' 
            : 'bg-amber-950/60 border-amber-500/80 text-amber-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-amber-950 font-extrabold' : 'text-amber-300 font-bold'}`}>
              زحزحة في الترقيم
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-amber-950' : 'text-amber-100'}`}>
              {analysis.shiftedVersesCount} آية
            </div>
          </div>
        </div>

        {/* Split Verses */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-lime-50/95 border-lime-600 text-lime-950 shadow-xs' 
            : 'bg-lime-950/60 border-lime-500/80 text-lime-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-lime-600 text-white shadow-2xs' : 'bg-lime-500/20 text-lime-300 border border-lime-500/40'
          }`}>
            <Split className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-lime-950 font-extrabold' : 'text-lime-300 font-bold'}`}>
              انقسام فواصل
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-lime-950' : 'text-lime-100'}`}>
              {analysis.splitVersesCount} موضع
            </div>
          </div>
        </div>

        {/* Merged Verses */}
        <div className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-teal-50/95 border-teal-600 text-teal-950 shadow-xs' 
            : 'bg-teal-950/60 border-teal-500/80 text-teal-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-teal-600 text-white shadow-2xs' : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
          }`}>
            <GitMerge className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-teal-950 font-extrabold' : 'text-teal-300 font-bold'}`}>
              دمج فواصل
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-teal-950' : 'text-teal-100'}`}>
              {analysis.mergedVersesCount} موضع
            </div>
          </div>
        </div>

        {/* Word / Reading differences */}
        <div className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
          isLight 
            ? 'bg-rose-50/95 border-rose-600 text-rose-950 shadow-xs' 
            : 'bg-rose-950/60 border-rose-500/80 text-rose-200'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-rose-600 text-white shadow-2xs' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-black truncate ${isLight ? 'text-rose-950 font-extrabold' : 'text-rose-300 font-bold'}`}>
              فروق الفرش والرسم
            </div>
            <div className={`text-sm sm:text-base font-mono font-black ${isLight ? 'text-rose-950' : 'text-rose-100'}`}>
              {analysis.totalWordDifferences} كلمة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

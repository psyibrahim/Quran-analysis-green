import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Sparkles, 
  Layers
} from 'lucide-react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SectionHelpButton } from './SectionHelpModal';
import { SurahSimilarityExplorer } from './SurahSimilarityExplorer';
import { SahabaClustersView } from './SahabaClustersView';
import { D3SimilarityHeatmap } from './D3SimilarityHeatmap';

export type SimilarityViewMode = 'matrix' | 'closest' | 'clusters-list';

interface SimilarityClustersProps {
  surahs: SurahData[];
  similarityMatrix: number[][];
  onSelectSurah: (surah: SurahData) => void;
  onCompare: (surahA: number, surahB: number) => void;
  view?: SimilarityViewMode;
}

const SimilarityClustersComponent: React.FC<SimilarityClustersProps> = ({
  surahs,
  similarityMatrix,
  onSelectSurah,
  onCompare,
  view = 'matrix'
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const activeSubTab = view;
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);

  const currentSurah = useMemo(() => {
    return surahs.find(s => s.number === selectedSurahId) || surahs[0];
  }, [surahs, selectedSurahId]);

  return (
    <div className="space-y-4">
      {/* Tool Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-ink-200 shadow-xs' : 'sci-bg sci-border'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-[#1A5C5C]' : 'bg-ink-800 border-emerald-500/30 text-emerald-400'
          }`}>
            {activeSubTab === 'matrix' && <Network className="w-4 h-4" />}
            {activeSubTab === 'closest' && <Sparkles className="w-4 h-4" />}
            {activeSubTab === 'clusters-list' && <Layers className="w-4 h-4" />}
          </div>
          <div>
            <h2 className={`text-base font-bold font-heading flex items-center gap-2 ${
              isLight ? 'text-ink-900' : 'text-ink-100'
            }`}>
              <span>
                {activeSubTab === 'matrix' && 'مصفوفة تشابه السور (114×114) — الخريطة التفاعلية الشاملة'}
                {activeSubTab === 'closest' && 'مستكشف أقرب سورة — الجوار الرياضي ونسب التطابق'}
                {activeSubTab === 'clusters-list' && 'عناقيد السور المتشابهة — التحزيب النبوي السباعي'}
              </span>
            </h2>
            <p className={`text-[11px] font-mono ${isLight ? 'text-ink-500' : 'text-ink-400'}`}>
              {activeSubTab === 'matrix' && 'خريطة تفاعلية كاملة لـ 12,996 نقطة تقاطع تقارن كل سورة بجميع السور مع فاحص التقاطعات والتكبير الحر'}
              {activeSubTab === 'closest' && 'تحليل السور الأكثر قرباً وشبهاً بكل سورة قرآنية مختارة'}
              {activeSubTab === 'clusters-list' && 'تجميع السور في عناقيد متجانسة إحصائياً ومقارنتها بالتحزيب النبوي'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <SectionHelpButton 
            guideId={
              activeSubTab === 'matrix' ? 'similarity-matrix-114' :
              activeSubTab === 'closest' ? 'similarity-closest-finder' :
              'similarity-kmeans-groups'
            } 
            variant="icon"
            title={
              activeSubTab === 'matrix' ? 'استعلام: دليل مصفوفة 114×114 وخوارزمية التشابه ومفتاح الألوان' :
              activeSubTab === 'closest' ? 'استعلام: دليل مستكشف أقرب سورة والجوار الرياضي للسور التوأم' :
              'استعلام: دليل مجموعات عناقيد K-Means ومراكز الثقل وتوزيع المكي والمدني'
            } 
          />
        </div>
      </div>

      {/* SUB TAB 1: 114x114 SIMILARITY MATRIX UNIFIED TOOL */}
      {activeSubTab === 'matrix' && (
        <D3SimilarityHeatmap
          surahs={surahs}
          similarityMatrix={similarityMatrix}
          onCompare={onCompare}
          onSelectSurah={onSelectSurah}
        />
      )}

      {/* SUB TAB 2: CLOSEST SURAHS FINDER */}
      {activeSubTab === 'closest' && (
        <div className="sci-bg sci-border rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-ink-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-ink-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>مستكشف أقرب السور المتشابهة</span>
              </h3>
              <p className="text-[11px] text-ink-400 font-mono">
                اختر أي سورة لعرض السور الـ 5 الأكثر قرباً وتطابقاً مع بصمتها الحرفية
              </p>
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedSurahId}
                onChange={(e) => setSelectedSurahId(Number(e.target.value))}
                className="w-full bg-[#0B1716] border border-ink-700/80 rounded-md px-2.5 py-1.5 text-ink-100 font-heading text-sm font-bold focus:outline-none focus:border-emerald-500"
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.totalAyahs} آية)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Surah Focus */}
          <div className={`p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isLight ? 'bg-ink-50 border-ink-300' : 'bg-[#0B1716] border-emerald-500/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-base border ${
                isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {currentSurah.number}
              </div>
              <div>
                <h4 className={`font-heading font-bold text-lg ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>{currentSurah.name}</h4>
                <div className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-ink-800 font-bold' : 'text-ink-400'}`}>
                  {currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {currentSurah.totalAyahs} آية • {currentSurah.totalWords} كلمة • {currentSurah.totalChars} حرف
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectSurah(currentSurah)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer border ${
                isLight 
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300' 
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
              }`}
            >
              عرض البصمة الكاملة
            </button>
          </div>

          {/* Dynamic Multi-Criteria Similarity Explorer */}
          <SurahSimilarityExplorer
            baseSurah={currentSurah}
            allSurahs={surahs}
            onSelectSurah={onSelectSurah}
            onCompareWith={(targetNum) => onCompare(currentSurah.number, targetNum)}
          />

        </div>
      )}

      {/* SUB TAB 3: SAHABA 7-CLUSTERS */}
      {activeSubTab === 'clusters-list' && (
        <SahabaClustersView
          surahs={surahs}
          similarityMatrix={similarityMatrix}
          onSelectSurah={onSelectSurah}
          onCompare={onCompare}
        />
      )}

    </div>
  );
};

export const SimilarityClusters = React.memo(SimilarityClustersComponent);

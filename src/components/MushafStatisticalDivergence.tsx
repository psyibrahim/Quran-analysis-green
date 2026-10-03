import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Scale, 
  ChevronRight, 
  ArrowRightLeft,
  Grid,
  Zap,
  Info,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import {
  LetterRankDivergence,
  SurahDivergenceRecord,
  MacroDivergenceMetrics,
  computeGlobalLetterDivergence,
  computeSurahLetterDivergence,
  computeAllSurahsDivergenceMatrix,
  computeMacroDivergenceMetrics,
  ARABIC_LETTERS
} from '../utils/statisticalDivergence';
import { formatSurahName } from '../utils/arabic';

interface MushafStatisticalDivergenceProps {
  onOpenSurahVerseCompare?: (surahNumber: number) => void;
}

export const MushafStatisticalDivergence: React.FC<MushafStatisticalDivergenceProps> = ({
  onOpenSurahVerseCompare
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const { kufiDataset, madaniDataset, setSelectedReaderSurah } = useQuranCorpus();

  // Active sub-mode of divergence analysis
  const [activeAnalysisView, setActiveAnalysisView] = useState<'letters' | 'surahs' | 'words'>('letters');
  
  // Letter Analysis Scope: Whole Quran (0) or Specific Surah (1..114)
  const [letterScopeSurah, setLetterScopeSurah] = useState<number>(0); // 0 = Full Quran
  const [letterFilter, setLetterFilter] = useState<'all' | 'shifted' | 'higher-madani' | 'higher-kufi'>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('ا');

  // Surahs Matrix Controls
  const [surahFilter, setSurahFilter] = useState<'all' | 'shifts-only' | 'ayah-diff-only' | 'top20'>('all');
  const [surahSortBy, setSurahSortBy] = useState<'number' | 'score' | 'shifts' | 'ayahDiff'>('score');
  const [surahSearch, setSurahSearch] = useState<string>('');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);

  // 1. Calculate All Surahs Divergence Records
  const allSurahsRecords = useMemo(() => {
    return computeAllSurahsDivergenceMatrix(kufiDataset, madaniDataset);
  }, [kufiDataset, madaniDataset]);

  // 2. Macro Global Divergence Metrics
  const macroMetrics: MacroDivergenceMetrics = useMemo(() => {
    return computeMacroDivergenceMetrics(kufiDataset, madaniDataset, allSurahsRecords);
  }, [kufiDataset, madaniDataset, allSurahsRecords]);

  // 3. Letters Divergence Data (Global vs Surah-specific)
  const { letterRecords, currentScopeTitle, currentSurahSpearman, currentSurahEuclidean, currentSurahShifts } = useMemo(() => {
    if (letterScopeSurah === 0) {
      const global = computeGlobalLetterDivergence(kufiDataset, madaniDataset);
      return {
        letterRecords: global,
        currentScopeTitle: 'كامل المصحف الشريف (الكتلة الإجمالية - 114 سورة)',
        currentSurahSpearman: macroMetrics.spearmanRankCorrelation,
        currentSurahEuclidean: macroMetrics.euclideanDistance,
        currentSurahShifts: 0
      };
    } else {
      const res = computeSurahLetterDivergence(letterScopeSurah, kufiDataset, madaniDataset);
      const rawName = kufiDataset.surahs[letterScopeSurah - 1]?.name;
      const sName = rawName ? formatSurahName(rawName) : `السورة رقم ${letterScopeSurah}`;
      return {
        letterRecords: res.divergence,
        currentScopeTitle: `${sName} (السورة رقم ${letterScopeSurah})`,
        currentSurahSpearman: res.spearmanRho,
        currentSurahEuclidean: res.euclideanDistance,
        currentSurahShifts: res.shiftsCount
      };
    }
  }, [letterScopeSurah, kufiDataset, madaniDataset, macroMetrics]);

  // Filtered letters list
  const filteredLetters = useMemo(() => {
    return letterRecords.filter(item => {
      if (letterFilter === 'shifted' && item.rankShift === 0) return false;
      if (letterFilter === 'higher-madani' && item.rankShift <= 0) return false;
      if (letterFilter === 'higher-kufi' && item.rankShift >= 0) return false;
      return true;
    });
  }, [letterRecords, letterFilter]);

  // Active selected letter record
  const currentLetterRecord = useMemo(() => {
    return letterRecords.find(l => l.letter === selectedLetter) || letterRecords[0];
  }, [letterRecords, selectedLetter]);

  // Filtered and sorted Surahs Matrix
  const filteredSurahsMatrix = useMemo(() => {
    let list = [...allSurahsRecords];

    if (surahSearch.trim()) {
      const q = surahSearch.trim().toLowerCase();
      list = list.filter(s => 
        s.surahNumber.toString() === q ||
        s.surahName.includes(q) ||
        s.englishName.toLowerCase().includes(q)
      );
    }

    if (surahFilter === 'shifts-only') {
      list = list.filter(s => s.rankShiftsCount > 0);
    } else if (surahFilter === 'ayah-diff-only') {
      list = list.filter(s => s.ayahDiff !== 0);
    } else if (surahFilter === 'top20') {
      list = [...list].sort((a, b) => b.divergenceScore - a.divergenceScore).slice(0, 20);
      return list;
    }

    // Sort
    if (surahSortBy === 'score') {
      list.sort((a, b) => b.divergenceScore - a.divergenceScore);
    } else if (surahSortBy === 'number') {
      list.sort((a, b) => a.surahNumber - b.surahNumber);
    } else if (surahSortBy === 'shifts') {
      list.sort((a, b) => b.rankShiftsCount - a.rankShiftsCount);
    } else if (surahSortBy === 'ayahDiff') {
      list.sort((a, b) => Math.abs(b.ayahDiff) - Math.abs(a.ayahDiff));
    }

    return list;
  }, [allSurahsRecords, surahFilter, surahSortBy, surahSearch]);

  // Auto sync selectedSurahNumber when filter or search changes if it is not in the filtered list
  useEffect(() => {
    if (filteredSurahsMatrix.length > 0) {
      const isSelectedInList = filteredSurahsMatrix.some(s => s.surahNumber === selectedSurahNumber);
      if (!isSelectedInList) {
        setSelectedSurahNumber(filteredSurahsMatrix[0].surahNumber);
      }
    }
  }, [filteredSurahsMatrix, selectedSurahNumber]);

  // Selected Surah for inspection in the matrix
  const currentInspectedSurah = useMemo(() => {
    return allSurahsRecords.find(s => s.surahNumber === selectedSurahNumber) || allSurahsRecords[0];
  }, [allSurahsRecords, selectedSurahNumber]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* 1. Macro KPI Dashboard: High-Level Mathematical Divergence Metrics */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
      }`}>
        
        {/* KPI 1: Spearman Rank Correlation */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950/80 border-ink-800/80'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold ${isLight ? 'text-ink-800' : 'text-ink-400'}`}>ارتباط الرتب (Spearman)</span>
            <span className={`p-1 rounded-md text-xs border font-mono font-bold ${
              isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              ρ = {macroMetrics.spearmanRankCorrelation}
            </span>
          </div>
          <div className={`text-xl font-bold font-mono ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
            {(macroMetrics.spearmanRankCorrelation * 100).toFixed(2)}%
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
            تطابق ترتيب التكرار على المستوى العام مع انزياح موضعي في {macroMetrics.totalSurahsWithRankShifts} سورة.
          </div>
        </div>

        {/* KPI 2: Cosine Similarity & Distance */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950/80 border-ink-800/80'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold ${isLight ? 'text-ink-800' : 'text-ink-400'}`}>التشابه الجيبي (Cosine)</span>
            <span className={`p-1 rounded-md text-[11px] border font-mono font-bold ${
              isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
            }`}>
              المسافة: {macroMetrics.cosineDistance}
            </span>
          </div>
          <div className={`text-xl font-bold font-mono ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
            {(macroMetrics.cosineSimilarity * 100).toFixed(3)}%
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
            تطابق متجهي فائق النقاء بين التوزيع التكراري لحروف المصحفين.
          </div>
        </div>

        {/* KPI 3: Surahs with Rank Shifts */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950/80 border-ink-800/80'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold ${isLight ? 'text-ink-800' : 'text-ink-400'}`}>انزياح رتب الحروف</span>
            <span className={`p-1 rounded-md text-xs border font-mono font-bold ${
              isLight ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs' : 'bg-amber-950 text-amber-400 border-amber-800'
            }`}>
              {macroMetrics.totalSurahsWithRankShifts} / 114 سورة
            </span>
          </div>
          <div className={`text-xl font-bold font-mono ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
            {((macroMetrics.totalSurahsWithRankShifts / 114) * 100).toFixed(1)}%
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
            أعلى تباعد في: الكوثر (10 رتب)، الشمس (9 رتب)، الفاتحة (9 رتب).
          </div>
        </div>

        {/* KPI 4: Ayah Differences & Word Delta */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950/80 border-ink-800/80'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-bold ${isLight ? 'text-ink-800' : 'text-ink-400'}`}>فوارق الآيات والكلمات</span>
            <span className={`p-1 rounded-md text-xs border font-mono font-bold ${
              isLight ? 'bg-teal-100 text-teal-950 border-teal-300 shadow-2xs' : 'bg-teal-950 text-teal-300 border-teal-800'
            }`}>
              {macroMetrics.totalSurahsWithAyahDiff} سورة تختلف
            </span>
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono flex items-center gap-1.5 flex-wrap ${isLight ? 'text-teal-950' : 'text-teal-300'}`}>
            <span>{macroMetrics.totalAyahDiff} آية</span>
            <span className="text-xs font-normal text-ink-400">|</span>
            <span className="text-sm font-semibold">{macroMetrics.totalWordDiff > 0 ? `+${macroMetrics.totalWordDiff}` : macroMetrics.totalWordDiff} كلمة</span>
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
            فارق الحروف: {macroMetrics.totalCharDiff > 0 ? `+${macroMetrics.totalCharDiff.toLocaleString()}` : macroMetrics.totalCharDiff.toLocaleString()} حرف (الصلة والرسم في ورش).
          </div>
        </div>

      </div>

      {/* 2. Main Tab View Switcher */}
      <div className={`border rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors ${
        isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}>
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <h3 className={`text-sm font-bold font-heading ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
              مختبر مصفوفات التباعد الإحصائي المقارن
            </h3>
            <p className={`text-xs ${isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}`}>
              تحليل رياضي تفاعلي لقياس الفوارق في ترتيب الحروف ونسب الكلمات بين الروايتين
            </p>
          </div>
        </div>

        {/* View Selection Buttons */}
        <div className={`flex items-center p-1 rounded-lg border text-xs ${
          isLight ? 'bg-ink-100 border-ink-300' : 'bg-ink-950 border-ink-800'
        }`}>
          <button
            onClick={() => setActiveAnalysisView('letters')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeAnalysisView === 'letters'
                ? isLight
                  ? 'bg-[#1A5C5C] text-white shadow-xs font-bold'
                  : 'bg-[#2B7470] text-white shadow-xs'
                : isLight
                  ? 'text-ink-700 hover:text-ink-950 font-semibold'
                  : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>مصفوفة تباعد الحروف الـ 28</span>
          </button>

          <button
            onClick={() => setActiveAnalysisView('surahs')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeAnalysisView === 'surahs'
                ? isLight
                  ? 'bg-[#1A5C5C] text-white shadow-xs font-bold'
                  : 'bg-[#2B7470] text-white shadow-xs'
                : isLight
                  ? 'text-ink-700 hover:text-ink-950 font-semibold'
                  : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>مصفوفة تباعد السور الـ 114</span>
          </button>

          <button
            onClick={() => setActiveAnalysisView('words')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeAnalysisView === 'words'
                ? isLight
                  ? 'bg-[#1A5C5C] text-white shadow-xs font-bold'
                  : 'bg-[#2B7470] text-white shadow-xs'
                : isLight
                  ? 'text-ink-700 hover:text-ink-950 font-semibold'
                  : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تباعد الكلمات والمقاييس المعجمية</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: LETTERS RANK & FREQUENCY DIVERGENCE MATRIX         */}
      {/* ========================================================= */}
      {activeAnalysisView === 'letters' && (
        <div className="space-y-5">
          
          {/* Controls Bar for Letter View */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
            isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
          }`}>
            
            {/* Scope Selection: Quran-wide vs Specific Surah */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className={`text-xs font-bold ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                نطاق فحص الحروف:
              </span>
              <select
                value={letterScopeSurah}
                onChange={(e) => setLetterScopeSurah(Number(e.target.value))}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                  isLight ? 'bg-white border-ink-300 text-ink-900 shadow-2xs' : 'bg-ink-950 border-ink-800 text-ink-200'
                }`}
              >
                <option value={0}>كامل المصحف الشريف (الكتلة الشاملة)</option>
                <optgroup label="السور ذات الانزياح في رتب الحروف (28 سورة)">
                  {allSurahsRecords
                    .filter(s => s.rankShiftsCount > 0)
                    .map(s => (
                      <option key={s.surahNumber} value={s.surahNumber}>
                        {formatSurahName(s.surahName)} ({s.rankShiftsCount} رتب متغيرة)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="كافة السور الـ 114">
                  {kufiDataset.surahs.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {formatSurahName(s.name)}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Quick Letter Filters */}
            <div className={`flex flex-wrap items-center gap-1.5 text-xs p-1 rounded-lg border ${
              isLight ? 'bg-ink-100 border-ink-300' : 'bg-ink-950 border-ink-800'
            }`}>
              <button
                onClick={() => setLetterFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  letterFilter === 'all'
                    ? isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-[#2B7470] text-white font-bold'
                    : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                }`}
              >
                كافة الحروف (28)
              </button>
              <button
                onClick={() => setLetterFilter('shifted')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  letterFilter === 'shifted'
                    ? isLight ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-xs font-bold' : 'bg-amber-600 text-white'
                    : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                }`}
              >
                الحروف ذات الرتب المتغيرة ({letterRecords.filter(l => l.rankShift !== 0).length})
              </button>
              <button
                onClick={() => setLetterFilter('higher-madani')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  letterFilter === 'higher-madani'
                    ? isLight ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-xs font-bold' : 'bg-emerald-600 text-white'
                    : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                }`}
              >
                أعلى في المدني (▲)
              </button>
              <button
                onClick={() => setLetterFilter('higher-kufi')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  letterFilter === 'higher-kufi'
                    ? isLight ? 'bg-rose-100 text-rose-950 border border-rose-300 shadow-xs font-bold' : 'bg-rose-600 text-white'
                    : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                }`}
              >
                أعلى في الكوفي (▼)
              </button>
            </div>

          </div>

          {/* Scope Alert Badge if surah selected */}
          {letterScopeSurah !== 0 && (
            <div className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              currentSurahShifts > 0
                ? isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            }`}>
              <div className="flex items-center gap-2">
                {currentSurahShifts > 0 ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                )}
                <span>
                  <strong>{currentScopeTitle}:</strong> {currentSurahShifts > 0 
                    ? `تشهد هذه السورة انزياحاً في ترتيب ${currentSurahShifts} حروف بين العدين (معامل سبيرمان: ${currentSurahSpearman}).`
                    : 'ترتيب الحروف حسب التردد متطابق تماماً في هذه السورة بين الكوفي والمدني.'}
                </span>
              </div>
              <button
                onClick={() => setLetterScopeSurah(0)}
                className={`text-xs px-2.5 py-1 rounded font-medium underline ${
                  isLight ? 'text-ink-700 hover:text-ink-900' : 'text-ink-300 hover:text-white'
                }`}
              >
                العودة للكتلة العامة لكامل المصحف
              </button>
            </div>
          )}

          {/* Visual Matrix Grid of 28 Letters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {filteredLetters.map(item => {
              const isSelected = item.letter === selectedLetter;
              const hasRankShift = item.rankShift !== 0;

              return (
                <div
                  key={item.letter}
                  onClick={() => setSelectedLetter(item.letter)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between ${
                    isSelected
                      ? isLight
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
                        : 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/50'
                      : isLight
                        ? 'bg-white border-ink-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs'
                        : 'bg-ink-900 border-ink-800 hover:border-emerald-800 hover:bg-emerald-950/30'
                  }`}
                >
                  {/* Top Glyph and Name */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-2xl font-bold font-heading leading-none ${
                        isLight ? 'text-ink-950' : 'text-ink-100'
                      }`}>
                        {item.letter}
                      </span>
                      <span className={`block text-[10px] mt-1 font-semibold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                        {item.name}
                      </span>
                    </div>

                    {/* Rank Shift Indicator */}
                    {hasRankShift ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-0.5 border ${
                        item.rankShift > 0
                          ? isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : isLight ? 'bg-rose-100 text-rose-950 border-rose-300 shadow-2xs' : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {item.rankShift > 0 ? (
                          <>
                            <TrendingUp className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                            <span>+{item.rankShift}</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-2.5 h-2.5 text-rose-700 dark:text-rose-400" />
                            <span>{item.rankShift}</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-mono font-bold px-1 rounded border ${
                        isLight ? 'bg-ink-100 text-ink-700 border-ink-300' : 'bg-ink-800 text-ink-400 border-ink-700'
                      }`}>
                        =
                      </span>
                    )}
                  </div>

                  {/* Rank Compare (Kufi vs Madani) */}
                  <div className="mt-3 pt-2 border-t border-ink-200 dark:border-ink-800/60 text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className={`${isLight ? 'text-teal-900 font-bold' : 'text-teal-300'}`}>
                        كوفي: #{item.kufiRank}
                      </span>
                      <span className={`${isLight ? 'text-emerald-950 font-bold' : 'text-emerald-400'}`}>
                        مدني: #{item.madaniRank}
                      </span>
                    </div>

                    {/* Micro Frequency Bar */}
                    <div className="w-full bg-ink-200 dark:bg-ink-800 h-1.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-teal-600 h-full" 
                        style={{ width: `${Math.min(100, (item.kufiPercentage / 18) * 100)}%` }} 
                      />
                      <div 
                        className="bg-emerald-600 h-full opacity-80" 
                        style={{ width: `${Math.min(100, (item.madaniPercentage / 18) * 100)}%` }} 
                      />
                    </div>

                    {/* Count Delta */}
                    <div className="flex items-center justify-between text-[10px] font-mono mt-1.5 font-medium text-ink-600 dark:text-ink-400">
                      <span>الفارق:</span>
                      <span className={`font-bold ${
                        item.countDiff > 0 
                          ? isLight ? 'text-emerald-800' : 'text-emerald-400' 
                          : item.countDiff < 0 
                            ? isLight ? 'text-rose-800' : 'text-rose-400' 
                            : isLight ? 'text-ink-800' : 'text-ink-300'
                      }`}>
                        {item.countDiff > 0 ? `+${item.countDiff.toLocaleString()}` : item.countDiff.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Inspector for Selected Letter */}
          <div className={`p-5 rounded-xl border transition-colors ${
            isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-200 dark:border-ink-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl font-heading font-bold text-2xl flex items-center justify-center border ${
                  isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-950 shadow-2xs' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  {currentLetterRecord.letter}
                </span>
                <div>
                  <h4 className={`text-base font-bold font-heading ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
                    تحليل حرف ({currentLetterRecord.name}) بين المصحفين
                  </h4>
                  <div className={`text-xs font-semibold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                    الرتبة الكوفية: #{currentLetterRecord.kufiRank} • الرتبة المدنية: #{currentLetterRecord.madaniRank}
                  </div>
                </div>
              </div>

              {/* Rank shift pill */}
              <div className="flex items-center gap-2">
                {currentLetterRecord.rankShift !== 0 ? (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 font-mono ${
                    currentLetterRecord.rankShift > 0
                      ? isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : isLight ? 'bg-rose-100 text-rose-950 border-rose-300 shadow-2xs' : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>انزياح الرتبة بمقدار {Math.abs(currentLetterRecord.rankShift)} مركز ({currentLetterRecord.rankShift > 0 ? 'أعلى في المدني' : 'أعلى في الكوفي'})</span>
                  </span>
                ) : (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                    isLight ? 'bg-ink-100 text-ink-800 border-ink-300' : 'bg-ink-800 text-ink-300 border-ink-700'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الرتبة متطابقة في كلا المصحفين (#{currentLetterRecord.kufiRank})</span>
                  </span>
                )}
              </div>
            </div>

            {/* Letter Metrics Comparison Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              
              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>التكرار في الكوفي</div>
                <div className={`text-lg font-bold font-mono ${isLight ? 'text-teal-950' : 'text-teal-400'}`}>
                  {currentLetterRecord.kufiCount.toLocaleString()}
                </div>
                <div className={`text-[11px] font-mono mt-0.5 font-semibold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>{currentLetterRecord.kufiPercentage}%</div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>التكرار في المدني</div>
                <div className={`text-lg font-bold font-mono ${isLight ? 'text-emerald-950' : 'text-emerald-400'}`}>
                  {currentLetterRecord.madaniCount.toLocaleString()}
                </div>
                <div className={`text-[11px] font-mono mt-0.5 font-semibold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>{currentLetterRecord.madaniPercentage}%</div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>الفارق العددي (مدني - كوفي)</div>
                <div className={`text-lg font-bold font-mono ${
                  currentLetterRecord.countDiff > 0 
                    ? isLight ? 'text-emerald-800' : 'text-emerald-400' 
                    : currentLetterRecord.countDiff < 0 
                      ? isLight ? 'text-rose-800' : 'text-rose-400' 
                      : isLight ? 'text-ink-900' : 'text-ink-200'
                }`}>
                  {currentLetterRecord.countDiff > 0 ? `+${currentLetterRecord.countDiff.toLocaleString()}` : currentLetterRecord.countDiff.toLocaleString()}
                </div>
                <div className={`text-[11px] font-mono mt-0.5 font-semibold ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>{currentLetterRecord.percentageDiff > 0 ? `+${currentLetterRecord.percentageDiff}%` : `${currentLetterRecord.percentageDiff}%`}</div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>المساهمة في تباعد المصحف</div>
                <div className={`text-lg font-bold font-mono ${isLight ? 'text-[#1A5C5C]' : 'text-[#79A9A0]'}`}>
                  {currentLetterRecord.divergenceContribution}%
                </div>
                <div className={`text-[11px] mt-0.5 font-medium ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>من إجمالي التباين الإحصائي</div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: 114 SURAHS DIVERGENCE HEATMAP MATRIX              */}
      {/* ========================================================= */}
      {activeAnalysisView === 'surahs' && (
        <div className="space-y-5">
          
          {/* Controls Bar for Surahs Heatmap */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
            isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
          }`}>
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                isLight ? 'text-ink-500' : 'text-ink-500'
              }`} />
              <input
                type="text"
                placeholder="ابحث برقم السورة أو اسمها..."
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                className={`w-full rounded-lg pr-9 pl-4 py-2 text-xs border transition-all font-semibold ${
                  isLight 
                    ? 'bg-ink-50 border-ink-300 text-ink-950 placeholder-ink-500 focus:bg-white focus:border-[#1A5C5C]' 
                    : 'bg-ink-950 border-ink-800 text-ink-200 placeholder-ink-500 focus:border-[#2B7470]'
                }`}
              />
            </div>

            {/* Filter and Sort Pills */}
            <div className="flex flex-wrap items-center gap-2">
              
              <div className={`flex items-center p-1 rounded-lg border text-xs ${
                isLight ? 'bg-ink-100 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <button
                  onClick={() => setSurahFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    surahFilter === 'all'
                      ? isLight ? 'bg-[#1A5C5C] text-white shadow-xs font-bold' : 'bg-[#2B7470] text-white font-bold'
                      : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                  }`}
                >
                  الكل (114)
                </button>
                <button
                  onClick={() => setSurahFilter('shifts-only')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    surahFilter === 'shifts-only'
                      ? isLight ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-xs font-bold' : 'bg-amber-600 text-white'
                      : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                  }`}
                >
                  انزياح رتب الحروف (28)
                </button>
                <button
                  onClick={() => setSurahFilter('ayah-diff-only')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    surahFilter === 'ayah-diff-only'
                      ? isLight ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-xs font-bold' : 'bg-emerald-600 text-white'
                      : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                  }`}
                >
                  فارق الآيات (50)
                </button>
                <button
                  onClick={() => setSurahFilter('top20')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    surahFilter === 'top20'
                      ? isLight ? 'bg-teal-100 text-teal-950 border border-teal-300 shadow-xs font-bold' : 'bg-teal-700 text-white font-bold'
                      : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                  }`}
                >
                  الأعلى تباعداً (Top 20)
                </button>
              </div>

              {/* Sort By Select */}
              <select
                value={surahSortBy}
                onChange={(e) => setSurahSortBy(e.target.value as any)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold cursor-pointer ${
                  isLight ? 'bg-white border-ink-300 text-ink-900 shadow-2xs' : 'bg-ink-900 border-ink-800 text-ink-200'
                }`}
              >
                <option value="score">ترتيب: مؤشر التباعد (الأعلى)</option>
                <option value="number">ترتيب: رقم السورة بالمصحف (1 - 114)</option>
                <option value="shifts">ترتيب: عدد انزياحات رتب الحروف</option>
                <option value="ayahDiff">ترتيب: الفارق في عدد الآيات</option>
              </select>

            </div>

          </div>

          {/* Visual 114-Cell Heatmap Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
            {filteredSurahsMatrix.map(surah => {
              const isSelected = surah.surahNumber === selectedSurahNumber;
              
              // Determine cell color based on divergenceLevel
              let cellBg = isLight ? 'bg-white border-ink-300' : 'bg-ink-950 border-ink-800';
              let badgeBg = isLight ? 'bg-ink-100 text-ink-800 border-ink-300' : 'bg-ink-800 text-ink-400';

              if (surah.divergenceLevel === 'high') {
                cellBg = isLight ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-rose-950/40 border-rose-800/80 text-rose-200';
                badgeBg = isLight ? 'bg-rose-100 text-rose-950 font-bold border border-rose-300' : 'bg-rose-900 text-rose-300';
              } else if (surah.divergenceLevel === 'moderate') {
                cellBg = isLight ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-amber-950/40 border-amber-800/80 text-amber-200';
                badgeBg = isLight ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300' : 'bg-amber-900 text-amber-300';
              } else if (surah.divergenceLevel === 'minimal') {
                cellBg = isLight ? 'bg-teal-50 border-teal-300 text-teal-950' : 'bg-teal-950/40 border-teal-800/80 text-teal-200';
                badgeBg = isLight ? 'bg-teal-100 text-teal-950 font-bold border border-teal-300' : 'bg-teal-900 text-teal-300';
              } else {
                cellBg = isLight ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-emerald-950/30 border-emerald-900/60 text-emerald-200';
                badgeBg = isLight ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300' : 'bg-emerald-950 text-emerald-400';
              }

              return (
                <button
                  key={surah.surahNumber}
                  onClick={() => setSelectedSurahNumber(surah.surahNumber)}
                  className={`p-2 rounded-lg border text-right transition-all flex flex-col justify-between relative shadow-2xs ${cellBg} ${
                    isSelected ? 'ring-2 ring-emerald-500 scale-102 z-10 shadow-md' : 'hover:scale-101'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-bold opacity-80">#{surah.surahNumber}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${badgeBg}`}>
                      {surah.divergenceScore > 0 ? `${surah.divergenceScore}%` : '0%'}
                    </span>
                  </div>

                  <div className="font-heading font-bold text-xs truncate">
                    {surah.surahName}
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono mt-1 opacity-90 font-medium">
                    <span>آيات: {surah.ayahDiff !== 0 ? (surah.ayahDiff > 0 ? `+${surah.ayahDiff}` : surah.ayahDiff) : 'متطابقة'}</span>
                    {surah.rankShiftsCount > 0 && (
                      <span className={`${isLight ? 'text-amber-800' : 'text-amber-400'} font-bold`}>
                        {surah.rankShiftsCount} رتب
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inspected Surah Detailed Divergence Card */}
          <div className={`p-5 rounded-xl border transition-colors ${
            isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-200 dark:border-ink-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-lg font-mono font-bold text-sm flex items-center justify-center border ${
                  isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {currentInspectedSurah.surahNumber}
                </span>
                <div>
                  <h4 className={`text-base font-bold font-heading ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
                    {formatSurahName(currentInspectedSurah.surahName)} ({currentInspectedSurah.englishName})
                  </h4>
                  <div className={`text-xs ${isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}`}>
                    مؤشر التباعد المركب: <strong className={isLight ? 'text-ink-950' : ''}>{currentInspectedSurah.divergenceScore}%</strong> • المستوى: {
                      currentInspectedSurah.divergenceLevel === 'high' ? 'تباعد مرتفع' :
                      currentInspectedSurah.divergenceLevel === 'moderate' ? 'تباعد متوسط' :
                      currentInspectedSurah.divergenceLevel === 'minimal' ? 'تباعد طفيف' : 'تطابق كامل'
                    }
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLetterScopeSurah(currentInspectedSurah.surahNumber);
                    setActiveAnalysisView('letters');
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                    isLight 
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950 shadow-2xs' 
                      : 'bg-emerald-950 hover:bg-emerald-900 border-emerald-800 text-emerald-300'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>فحص حروفها الـ 28</span>
                </button>

                {onOpenSurahVerseCompare && (
                  <button
                    onClick={() => onOpenSurahVerseCompare(currentInspectedSurah.surahNumber)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1A5C5C] hover:bg-[#134747] text-white font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>المقابلة آية بآية</span>
                  </button>
                )}
              </div>
            </div>

            {/* Surah Divergence Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mb-4">
              
              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>فارق الآيات</div>
                <div className={`text-lg font-bold font-mono ${
                  currentInspectedSurah.ayahDiff !== 0 ? isLight ? 'text-amber-800' : 'text-amber-400' : isLight ? 'text-ink-800' : 'text-ink-300'
                }`}>
                  {currentInspectedSurah.ayahDiff > 0 ? `+${currentInspectedSurah.ayahDiff}` : currentInspectedSurah.ayahDiff}
                </div>
                <div className={`text-[10px] font-mono font-medium ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                  {currentInspectedSurah.kufiAyahs} (كوفي) vs {currentInspectedSurah.madaniAyahs} (مدني)
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>الحروف ذات الرتب المتغيرة</div>
                <div className={`text-lg font-bold font-mono ${
                  currentInspectedSurah.rankShiftsCount > 0 ? isLight ? 'text-amber-800' : 'text-amber-400' : isLight ? 'text-emerald-800' : 'text-emerald-400'
                }`}>
                  {currentInspectedSurah.rankShiftsCount} حروف
                </div>
                <div className={`text-[10px] font-mono font-medium ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                  معامل سبيرمان: ρ={currentInspectedSurah.spearmanRho}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>فارق الكلمات</div>
                <div className={`text-lg font-bold font-mono ${
                  currentInspectedSurah.wordDiff !== 0 ? isLight ? 'text-[#1A5C5C]' : 'text-teal-400' : isLight ? 'text-ink-800' : 'text-ink-300'
                }`}>
                  {currentInspectedSurah.wordDiff > 0 ? `+${currentInspectedSurah.wordDiff}` : currentInspectedSurah.wordDiff}
                </div>
                <div className={`text-[10px] font-mono font-medium ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                  {currentInspectedSurah.kufiWords} (كوفي) vs {currentInspectedSurah.madaniWords} (مدني)
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <div className={`text-xs mb-1 font-bold ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>فارق الأحرف الهجائية</div>
                <div className={`text-lg font-bold font-mono ${
                  currentInspectedSurah.charDiff !== 0 ? isLight ? 'text-[#1A5C5C]' : 'text-teal-400' : isLight ? 'text-ink-800' : 'text-ink-300'
                }`}>
                  {currentInspectedSurah.charDiff > 0 ? `+${currentInspectedSurah.charDiff}` : currentInspectedSurah.charDiff}
                </div>
                <div className={`text-[10px] font-mono font-medium ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
                  {currentInspectedSurah.kufiChars} (كوفي) vs {currentInspectedSurah.madaniChars} (مدني)
                </div>
              </div>

            </div>

            {/* Top Shifted Letters in this Surah */}
            {currentInspectedSurah.topShiftedLetters.length > 0 && (
              <div className={`p-3 rounded-lg border text-xs ${
                isLight ? 'bg-ink-50 border-ink-300' : 'bg-ink-950 border-ink-800'
              }`}>
                <span className={`font-bold ml-2 ${isLight ? 'text-ink-900' : 'text-ink-200'}`}>
                  أبرز الحروف التي انزاحت رتبتها في {formatSurahName(currentInspectedSurah.surahName)}:
                </span>
                <div className="inline-flex flex-wrap gap-2 mt-1 sm:mt-0">
                  {currentInspectedSurah.topShiftedLetters.map(l => (
                    <span 
                      key={l.letter}
                      className={`px-2 py-0.5 rounded border font-mono font-semibold ${
                        l.shift > 0 
                          ? isLight ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : isLight ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      حرف ({l.letter}): #{l.kufiRank} ➔ #{l.madaniRank} ({l.shift > 0 ? `+${l.shift}` : l.shift})
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: WORDS & LEXICAL DIVERGENCE ANALYSIS                */}
      {/* ========================================================= */}
      {activeAnalysisView === 'words' && (
        <div className="space-y-5">
          
          <div className={`p-5 rounded-xl border transition-colors ${
            isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
          }`}>
            <h4 className={`text-base font-bold font-heading mb-2 ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>
              المصفوفة المعجمية وفوارق الكلمات والمقاطع بين المصحفين
            </h4>
            <p className={`text-xs max-w-3xl leading-relaxed mb-4 font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
              يتطابق المتن القرآني العظيم في نصوص الآيات وجوهر الكلمات بنسبة 100%. أما الفوارق الإحصائية الطفيفة في عدد الكلمات والحروف، فتعود إلى قواعد التدوين ورسم المصحف العثماني بين مصاحف أهل الكوفة ومصاحف أهل المدينة النبوية.
            </p>

            {/* Side-by-Side Lexical Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className={`border-b font-bold ${
                    isLight ? 'border-ink-300 bg-ink-100 text-ink-900' : 'border-ink-800 bg-ink-950/60 text-ink-400'
                  }`}>
                    <th className="py-2.5 px-3">المعيار الإحصائي المعجمي</th>
                    <th className="py-2.5 px-3 text-center text-teal-800 dark:text-teal-400 font-bold">المصحف الكوفي (حفص)</th>
                    <th className="py-2.5 px-3 text-center text-emerald-800 dark:text-emerald-400 font-bold">المصحف المدني (ورش)</th>
                    <th className="py-2.5 px-3 text-center text-amber-800 dark:text-amber-400 font-bold">الفارق الرياضي (Delta)</th>
                    <th className="py-2.5 px-3">التفسير العلمي المنهجي</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${
                  isLight ? 'divide-ink-200' : 'divide-ink-800/60'
                }`}>
                  
                  <tr className={`${isLight ? 'hover:bg-ink-50' : 'hover:bg-ink-800/40'}`}>
                    <td className={`py-3 px-3 font-sans font-bold ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>إجمالي عدد الكلمات</td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-teal-950' : 'text-teal-300'}`}>
                      {kufiDataset.meta.totalWords.toLocaleString()}
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                      {madaniDataset.meta.totalWords.toLocaleString()}
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                      {macroMetrics.totalWordDiff > 0 ? `+${macroMetrics.totalWordDiff}` : macroMetrics.totalWordDiff} كلمة
                    </td>
                    <td className={`py-3 px-3 font-sans text-[11px] font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
                      اختلاف قواعد فصل ووصل بعض أدوات الاستفهام والموصول (مثل: عمّا وعن ما، ويومئذ، وإلّا).
                    </td>
                  </tr>

                  <tr className={`${isLight ? 'hover:bg-ink-50' : 'hover:bg-ink-800/40'}`}>
                    <td className={`py-3 px-3 font-sans font-bold ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>إجمالي عدد الحروف الهجائية</td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-teal-950' : 'text-teal-300'}`}>
                      {kufiDataset.meta.totalChars.toLocaleString()}
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                      {madaniDataset.meta.totalChars.toLocaleString()}
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                      {macroMetrics.totalCharDiff > 0 ? `+${macroMetrics.totalCharDiff.toLocaleString()}` : macroMetrics.totalCharDiff.toLocaleString()} حرف
                    </td>
                    <td className={`py-3 px-3 font-sans text-[11px] font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
                      إثبات حروف المد المحذوفة رسماً كحروف صريحة في رسم ورش وضبط مصاحف المدينة والمغرب.
                    </td>
                  </tr>

                  <tr className={`${isLight ? 'hover:bg-ink-50' : 'hover:bg-ink-800/40'}`}>
                    <td className={`py-3 px-3 font-sans font-bold ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>إجمالي عدد الآيات</td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-teal-950' : 'text-teal-300'}`}>
                      {kufiDataset.meta.totalVerses.toLocaleString()} آية
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                      {madaniDataset.meta.totalVerses.toLocaleString()} آية
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                      {macroMetrics.totalAyahDiff > 0 ? `+${macroMetrics.totalAyahDiff}` : macroMetrics.totalAyahDiff} آية
                    </td>
                    <td className={`py-3 px-3 font-sans text-[11px] font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
                      العد المدني يعد البسملة جزءاً من الفاتحة، ويدمج بعض مقاطع وفواتح السور كـ (الم، طه، يس).
                    </td>
                  </tr>

                  <tr className={`${isLight ? 'hover:bg-ink-50' : 'hover:bg-ink-800/40'}`}>
                    <td className={`py-3 px-3 font-sans font-bold ${isLight ? 'text-ink-950' : 'text-ink-100'}`}>متوسط طول الآية (بالكلمات)</td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-teal-950' : 'text-teal-300'}`}>
                      {(kufiDataset.meta.totalWords / kufiDataset.meta.totalVerses).toFixed(2)} كلمة/آية
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-emerald-950' : 'text-emerald-300'}`}>
                      {(madaniDataset.meta.totalWords / madaniDataset.meta.totalVerses).toFixed(2)} كلمة/آية
                    </td>
                    <td className={`py-3 px-3 text-center font-bold ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>
                      {(() => {
                        const avgK = kufiDataset.meta.totalWords / kufiDataset.meta.totalVerses;
                        const avgM = madaniDataset.meta.totalWords / madaniDataset.meta.totalVerses;
                        const diff = avgM - avgK;
                        return `${diff > 0 ? '+' : ''}${diff.toFixed(2)} كلمة/آية`;
                      })()}
                    </td>
                    <td className={`py-3 px-3 font-sans text-[11px] font-medium ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
                      نظراً لأن العد المدني يضم 22 آية أقل، فإن متوسط الكلمات لكل آية أطول بنسبة طفيفة جداً.
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

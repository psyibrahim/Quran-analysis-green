import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Layers, 
  Eye, 
  Filter, 
  Info, 
  Check, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  Bookmark,
  FileText,
  BookOpen,
  Lock,
  Unlock,
  Type,
  Search,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Split,
  GitMerge
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ColoringMode = 'all' | 'shift' | 'lexical' | 'farsh' | 'words' | 'none';
export type WordDiffDepth = 'reading_only' | 'all';
export type AyahFilterMode = 'all' | 'diff_only' | 'words_only' | 'lexical_only' | 'farsh_only';

export interface MushafDifferenceToolbarProps {
  // Coloring & Variant Options
  coloringMode: ColoringMode;
  setColoringMode: (mode: ColoringMode) => void;
  wordDiffDepth: WordDiffDepth;
  setWordDiffDepth: (depth: WordDiffDepth) => void;
  showCrossVerseStops: boolean;
  setShowCrossVerseStops: (show: boolean) => void;
  
  // Ayah Filtering & Counts
  ayahFilter: AyahFilterMode;
  setAyahFilter: (filter: AyahFilterMode) => void;
  // Custom Ayah Range Selection
  isRangeActive: boolean;
  setIsRangeActive: (active: boolean) => void;
  rangeStartAyah: number;
  setRangeStartAyah: (start: number) => void;
  rangeEndAyah: number;
  setRangeEndAyah: (end: number) => void;

  divergentCount: number;
  wordDiffCount: number;
  lexicalDiffCount?: number;
  readingDiffCount?: number;
  lexicalDiffAyahsCount?: number;
  farshDiffAyahsCount?: number;
  totalVersesCount: number;

  // Navigation & Jump
  highlightedAyah: number | null;
  onJumpToAyah: (ayahNum: number) => void;
  onJumpNextDiff: () => void;
  onJumpPrevDiff: () => void;
  divergentAyahNumbers: number[];

  // Display & Sync Properties
  isSyncLocked: boolean;
  setIsSyncLocked: (locked: boolean) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  viewMode: 'simplified' | 'advanced';
  setViewMode: (mode: 'simplified' | 'advanced') => void;

  // Utilities & Export
  onOpenGlobalSearch: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
}

export const MushafDifferenceToolbar: React.FC<MushafDifferenceToolbarProps> = ({
  coloringMode,
  setColoringMode,
  wordDiffDepth,
  setWordDiffDepth,
  showCrossVerseStops,
  setShowCrossVerseStops,
  ayahFilter,
  setAyahFilter,
  isRangeActive,
  setIsRangeActive,
  rangeStartAyah,
  setRangeStartAyah,
  rangeEndAyah,
  setRangeEndAyah,
  divergentCount,
  wordDiffCount,
  lexicalDiffCount = 0,
  readingDiffCount = 0,
  lexicalDiffAyahsCount = 0,
  farshDiffAyahsCount = 0,
  totalVersesCount,
  highlightedAyah,
  onJumpToAyah,
  onJumpNextDiff,
  onJumpPrevDiff,
  divergentAyahNumbers,
  isSyncLocked,
  setIsSyncLocked,
  fontSize,
  setFontSize,
  viewMode,
  setViewMode,
  onOpenGlobalSearch,
  onExportCSV,
  onPrint
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  // State for collapsible panels
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Determine current diff index for display
  const currentDiffIndex = highlightedAyah 
    ? divergentAyahNumbers.indexOf(highlightedAyah)
    : -1;

  return (
    <div 
      id="mushaf-properties-panel"
      className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
        isLight ? 'bg-white border-ink-300 shadow-ink-100' : 'bg-ink-900 border-ink-800'
      }`}
    >
      {/* 1. Master Properties Header Bar */}
      <div className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 ${
        isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-950/70 border-ink-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-teal-50 border-teal-200 text-[#1A5C5C]' : 'bg-teal-950 border-teal-800 text-teal-300'
          }`}>
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-extrabold flex items-center gap-2 ${
              isLight ? 'text-ink-900' : 'text-ink-100'
            }`}>
              <span>واجهة خصائص وخيارات المقارنة</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border hidden sm:inline-block ${
                isLight ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-teal-950/70 text-teal-300 border-teal-800'
              }`}>
                3 أقسام وظيفية
              </span>
            </h3>
          </div>
        </div>

        {/* Quick Utilities & Expand/Collapse Toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Global Diffs Search */}
          <button
            onClick={onOpenGlobalSearch}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isLight 
                ? 'bg-teal-50 hover:bg-teal-100 text-teal-950 border-teal-300 shadow-2xs' 
                : 'bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border-teal-800'
            }`}
            title="البحث الشامل في فروق القرآن (114 سورة)"
          >
            <Search className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-teal-400" />
            <span className="hidden md:inline">معجم الفروق</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCSV}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isLight 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 shadow-2xs' 
                : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
            }`}
            title="تصدير فروق هذه السورة كملف Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">تصدير</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={onPrint}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isLight 
                ? 'bg-white hover:bg-ink-100 text-ink-900 border-ink-300 shadow-2xs' 
                : 'bg-ink-900 hover:bg-ink-800 text-ink-200 border-ink-700'
            }`}
            title="طباعة منسقة أو حفظ كـ PDF لتقرير فروق السورة"
          >
            <Printer className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-teal-400" />
            <span className="hidden md:inline">طباعة</span>
          </button>

          {/* Color Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              showLegend
                ? isLight 
                  ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs' 
                  : 'bg-amber-950/80 text-amber-300 border-amber-700'
                : isLight 
                  ? 'bg-white text-ink-800 border-ink-300 hover:bg-ink-100' 
                  : 'bg-ink-900 text-ink-300 border-ink-800 hover:bg-ink-800'
            }`}
            title="مفتاح دلالات الألوان والرموز"
          >
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>دليل الألوان</span>
            {showLegend ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Collapse/Expand Panel */}
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight 
                ? 'bg-white text-ink-700 hover:bg-ink-100 border-ink-300' 
                : 'bg-ink-900 text-ink-300 hover:bg-ink-800 border-ink-800'
            }`}
            title={isPanelCollapsed ? 'توسيع واجهة الخصائص' : 'طي واجهة الخصائص لتوفير مساحة القراءة'}
          >
            {isPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Structured Properties Content (3-Section Cohesive Grid) */}
      {!isPanelCollapsed && (
        <div className="p-4 space-y-3.5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            
            {/* SECTION 1: COLORING & READING VARIANTS */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
              isLight ? 'bg-ink-50/70 border-ink-200' : 'bg-ink-950/40 border-ink-800/80'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Palette className="w-4 h-4 text-[#1A5C5C] dark:text-teal-400" />
                    <span className={isLight ? 'text-ink-900' : 'text-ink-100'}>
                      1. نمط التمييز اللوني والفرش
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isLight ? 'bg-white text-ink-700 border border-ink-200' : 'bg-ink-900 text-ink-400'
                  }`}>
                    {coloringMode === 'all' ? 'شامل' : coloringMode === 'shift' ? 'فواصل' : coloringMode === 'lexical' ? 'كلمات' : coloringMode === 'farsh' ? 'فرش' : 'مجردة'}
                  </span>
                </div>

                {/* Segmented Coloring Mode Buttons */}
                <div className={`grid grid-cols-5 p-1 rounded-lg border text-xs font-bold gap-1 ${
                  isLight ? 'bg-white border-ink-300 shadow-2xs' : 'bg-ink-900 border-ink-800'
                }`}>
                  {/* شامل */}
                  <button
                    onClick={() => setColoringMode('all')}
                    className={`py-1.5 rounded-md transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] font-black cursor-pointer ${
                      coloringMode === 'all'
                        ? isLight ? 'bg-[#1A5C5C] text-white shadow-xs' : 'bg-teal-600 text-white shadow-xs'
                        : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-ink-100' : 'text-ink-400 hover:text-ink-200'
                    }`}
                    title="تلوين شامل للزحزحة والفواصل وفروق الكلمات والفرش معاً"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>شامل</span>
                  </button>

                  {/* فواصل */}
                  <button
                    onClick={() => setColoringMode('shift')}
                    className={`py-1.5 rounded-md transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] font-black cursor-pointer ${
                      coloringMode === 'shift'
                        ? isLight ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-600 text-white shadow-xs'
                        : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-ink-100' : 'text-ink-400 hover:text-ink-200'
                    }`}
                    title="تلوين حدود الآيات وزحزحة الترقيم وفواصل الآي فقط"
                  >
                    <Layers className="w-3 h-3 text-emerald-300" />
                    <span>فواصل</span>
                  </button>

                  {/* كلمات */}
                  <button
                    onClick={() => setColoringMode('lexical')}
                    className={`py-1.5 rounded-md transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] font-black cursor-pointer relative ${
                      coloringMode === 'lexical'
                        ? isLight ? 'bg-rose-700 text-white shadow-xs' : 'bg-rose-600 text-white shadow-xs'
                        : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-ink-100' : 'text-ink-400 hover:text-ink-200'
                    }`}
                    title="تمييز اختلاف رسم الكلمات والحروف أو زيادتها ونقصها فقط (نحو: ووصى/وأوصى، وسارعوا/سارعوا)"
                  >
                    <FileText className="w-3 h-3 text-rose-300" />
                    <span>كلمات</span>
                    {lexicalDiffCount > 0 && (
                      <span className={`text-[9px] px-1 rounded-full font-mono font-bold ${
                        coloringMode === 'lexical' ? 'bg-rose-950 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {lexicalDiffCount}
                      </span>
                    )}
                  </button>

                  {/* فرش */}
                  <button
                    onClick={() => setColoringMode('farsh')}
                    className={`py-1.5 rounded-md transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] font-black cursor-pointer relative ${
                      coloringMode === 'farsh'
                        ? isLight ? 'bg-amber-700 text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs'
                        : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-ink-100' : 'text-ink-400 hover:text-ink-200'
                    }`}
                    title="تمييز فرش الحروف وفروق القراءات والألفات الخنجرية وإبدال الهمز (نحو: مالك/ملك، يخادعون/يخدعون)"
                  >
                    <BookOpen className="w-3 h-3 text-amber-300" />
                    <span>فرش</span>
                    {readingDiffCount > 0 && (
                      <span className={`text-[9px] px-1 rounded-full font-mono font-bold ${
                        coloringMode === 'farsh' ? 'bg-amber-950 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {readingDiffCount}
                      </span>
                    )}
                  </button>

                  {/* مجردة */}
                  <button
                    onClick={() => setColoringMode('none')}
                    className={`py-1.5 rounded-md transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-[11px] font-black cursor-pointer ${
                      coloringMode === 'none'
                        ? isLight ? 'bg-ink-800 text-white shadow-xs' : 'bg-ink-800 text-ink-100 shadow-xs'
                        : isLight ? 'text-ink-700 hover:text-ink-950 hover:bg-ink-100' : 'text-ink-400 hover:text-ink-200'
                    }`}
                    title="عرض النص القرائي بدون ألوان تمييز"
                  >
                    <span>مجردة</span>
                  </button>
                </div>
              </div>

              {/* Sub-options: Cross Verse Stops & Farsh Depth */}
              <div className="space-y-2 pt-2 border-t border-ink-200 dark:border-ink-800/80 text-xs">
                {/* Cross-verse stop toggle */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                    علامة فاصلة المصحف المقابل:
                  </span>
                  <button
                    onClick={() => setShowCrossVerseStops(!showCrossVerseStops)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                      showCrossVerseStops
                        ? isLight 
                          ? 'bg-lime-100 text-lime-950 border-lime-300 font-extrabold shadow-2xs' 
                          : 'bg-lime-950/80 text-lime-200 border-lime-800 shadow-2xs'
                        : isLight 
                          ? 'bg-white text-ink-600 border-ink-300 hover:bg-ink-100' 
                          : 'bg-ink-900 text-ink-400 border-ink-800'
                    }`}
                    title="إظهار علامة رأس آية المصحف المقابل (۝) داخل المتن في مواضع انقسام الآيات"
                  >
                    <span>[ ۝ ] نشطة</span>
                    <span className={`w-2 h-2 rounded-full ${showCrossVerseStops ? 'bg-lime-600' : 'bg-ink-400'}`}></span>
                  </button>
                </div>

                {/* Farsh Depth Toggle (only if applicable) */}
                {(coloringMode === 'all' || coloringMode === 'farsh' || coloringMode === 'words') && (
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                      عمق تمييز الفرش:
                    </span>
                    <div className={`flex items-center p-0.5 rounded-md border text-[10px] font-black ${
                      isLight ? 'bg-white border-ink-300' : 'bg-ink-900 border-ink-800'
                    }`}>
                      <button
                        onClick={() => setWordDiffDepth('reading_only')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          wordDiffDepth === 'reading_only'
                            ? isLight ? 'bg-amber-600 text-white font-black shadow-2xs' : 'bg-amber-700 text-white'
                            : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                        }`}
                        title="فروق القراءات الكبرى فقط (مالك/ملك)"
                      >
                        القراءات الكبرى
                      </button>
                      <button
                        onClick={() => setWordDiffDepth('all')}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          wordDiffDepth === 'all'
                            ? isLight ? 'bg-amber-600 text-white font-black shadow-2xs' : 'bg-amber-700 text-white'
                            : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                        }`}
                        title="شاملة ضبط ورش المغربي ونقط الحروف"
                      >
                        شاملة الضبط
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: AYAH FILTERING & NAVIGATION */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
              isLight ? 'bg-ink-50/70 border-ink-200' : 'bg-ink-950/40 border-ink-800/80'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Filter className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className={isLight ? 'text-ink-900' : 'text-ink-100'}>
                      2. تصفية الآيات والتنقل
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isLight ? 'bg-white text-ink-700 border border-ink-200' : 'bg-ink-900 text-ink-400'
                  }`}>
                    {totalVersesCount} آية
                  </span>
                </div>

                {/* Ayah Filter Select */}
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                    حصر الآيات المعروضة في اللوحين:
                  </label>
                  <select
                    value={ayahFilter}
                    onChange={(e) => setAyahFilter(e.target.value as AyahFilterMode)}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-bold border cursor-pointer transition-all ${
                      isLight 
                        ? 'bg-white border-ink-300 text-ink-900 focus:border-[#1A5C5C] shadow-2xs' 
                        : 'bg-ink-900 border-ink-800 text-ink-200 focus:border-teal-500'
                    }`}
                  >
                    <option value="all">كل آيات السورة بالتتابع ({totalVersesCount} آية)</option>
                    <option value="diff_only">الآيات المزحزحة ومختلفة الفواصل فقط ({divergentCount} آية)</option>
                    <option value="lexical_only">آيات اختلاف رسم الكلمات وحروفها فقط ({lexicalDiffAyahsCount} آية)</option>
                    <option value="farsh_only">آيات اختلاف الفرش والقراءات فقط ({farshDiffAyahsCount} آية)</option>
                    <option value="words_only">جميع الآيات ذات أي فرق لفظي ({wordDiffCount} آية)</option>
                  </select>
                </div>

                {/* Custom Ayah Range Selection (تحديد نطاق معين من الآيات للمقارنة) */}
                <div className={`p-2.5 rounded-lg border text-xs transition-all ${
                  isRangeActive
                    ? isLight ? 'bg-teal-50/80 border-teal-300 shadow-2xs' : 'bg-teal-950/40 border-teal-800'
                    : isLight ? 'bg-ink-100/70 border-ink-200' : 'bg-ink-900/60 border-ink-800/60'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isRangeActive}
                        onChange={(e) => setIsRangeActive(e.target.checked)}
                        className="rounded border-ink-400 text-[#1A5C5C] focus:ring-teal-500 cursor-pointer"
                      />
                      <span className={isLight ? 'text-ink-900' : 'text-ink-200'}>
                        تحديد نطاق مخصص من الآيات
                      </span>
                    </label>
                    {isRangeActive && (
                      <span className="text-[10px] font-mono font-bold text-[#1A5C5C] dark:text-teal-400">
                        {Math.max(0, rangeEndAyah - rangeStartAyah + 1)} آية
                      </span>
                    )}
                  </div>

                  {isRangeActive ? (
                    <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100">
                      <div>
                        <span className="text-[10px] text-ink-500 font-bold block mb-0.5">من الآية:</span>
                        <input
                          type="number"
                          min={1}
                          max={totalVersesCount}
                          value={rangeStartAyah}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(totalVersesCount, parseInt(e.target.value) || 1));
                            setRangeStartAyah(val);
                            if (val > rangeEndAyah) setRangeEndAyah(val);
                          }}
                          className={`w-full px-2 py-1 text-xs font-mono font-bold rounded border ${
                            isLight ? 'bg-white border-ink-300 text-ink-900' : 'bg-ink-900 border-ink-700 text-ink-100'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-500 font-bold block mb-0.5">إلى الآية:</span>
                        <input
                          type="number"
                          min={1}
                          max={totalVersesCount}
                          value={rangeEndAyah}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(totalVersesCount, parseInt(e.target.value) || totalVersesCount));
                            setRangeEndAyah(val);
                            if (val < rangeStartAyah) setRangeStartAyah(val);
                          }}
                          className={`w-full px-2 py-1 text-xs font-mono font-bold rounded border ${
                            isLight ? 'bg-white border-ink-300 text-ink-900' : 'bg-ink-900 border-ink-700 text-ink-100'
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-ink-500 leading-tight">
                      فعّل الخيار لحصر اللوحين في مقطع محدد (مثل: آية 1 إلى 20) لدراسة دقيقة دون تشتيت.
                    </p>
                  )}
                </div>
              </div>

              {/* Fast Jump & Next/Prev Diff Controls */}
              <div className="space-y-2 pt-2 border-t border-ink-200 dark:border-ink-800/80 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-bold ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                      القفز لآية:
                    </span>
                    <select
                      value={highlightedAyah || 1}
                      onChange={(e) => onJumpToAyah(Number(e.target.value))}
                      className={`rounded-md px-2 py-0.5 text-xs font-mono font-bold border cursor-pointer ${
                        isLight ? 'bg-white border-ink-300 text-ink-900 shadow-2xs' : 'bg-ink-900 border-ink-800 text-ink-200'
                      }`}
                    >
                      {Array.from({ length: totalVersesCount }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          آية {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Previous / Next Diff Jump Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={onJumpPrevDiff}
                      disabled={divergentCount === 0}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                        isLight 
                          ? 'bg-white hover:bg-ink-100 text-ink-900 border-ink-300 shadow-2xs' 
                          : 'bg-ink-900 hover:bg-ink-800 text-ink-200 border-ink-800'
                      }`}
                      title="القفز إلى موضع الخلاف السابق"
                    >
                      <ChevronRight className="w-3 h-3" />
                      <span>السابق</span>
                    </button>

                    <button
                      onClick={onJumpNextDiff}
                      disabled={divergentCount === 0}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                        isLight 
                          ? 'bg-white hover:bg-ink-100 text-ink-900 border-ink-300 shadow-2xs' 
                          : 'bg-ink-900 hover:bg-ink-800 text-ink-200 border-ink-800'
                      }`}
                      title="القفز إلى موضع الخلاف التالي"
                    >
                      <span>التالي</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Diff position indicator */}
                <div className={`text-[10px] font-mono flex items-center justify-between ${
                  isLight ? 'text-ink-600' : 'text-ink-400'
                }`}>
                  <span>مواضع الخلاف بالسورة: <strong>{divergentCount}</strong></span>
                  {currentDiffIndex >= 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      موضع نشط ({currentDiffIndex + 1} من {divergentCount})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: DISPLAY, SYNC & VIEW OPTIONS */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
              isLight ? 'bg-ink-50/70 border-ink-200' : 'bg-ink-950/40 border-ink-800/80'
            }`}>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className={isLight ? 'text-ink-900' : 'text-ink-100'}>
                      3. العرض والمزامنة
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isLight ? 'bg-white text-ink-700 border border-ink-200' : 'bg-ink-900 text-ink-400'
                  }`}>
                    {viewMode === 'advanced' ? 'متقدم' : 'ميسر'}
                  </span>
                </div>

                {/* Synchronized Scroll Lock Button */}
                <button
                  onClick={() => setIsSyncLocked(!isSyncLocked)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isSyncLocked
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-2xs font-extrabold'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/80 shadow-2xs font-extrabold'
                      : isLight
                        ? 'bg-white text-ink-700 border-ink-300 hover:bg-ink-100'
                        : 'bg-ink-900 text-ink-400 border-ink-800 hover:bg-ink-800'
                  }`}
                  title={isSyncLocked ? 'التمرير متزامن: تحريك أي عمود يحرك العمود المقابل' : 'التمرير مستقل: انقر للتفعيل'}
                >
                  <div className="flex items-center gap-2">
                    {isSyncLocked ? (
                      <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-ink-500" />
                    )}
                    <span>التمرير المتزامن بين اللوحين</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isSyncLocked
                      ? 'bg-emerald-600 text-white'
                      : 'bg-ink-200 dark:bg-ink-800 text-ink-700 dark:text-ink-400'
                  }`}>
                    {isSyncLocked ? 'مفعل' : 'مستقل'}
                  </span>
                </button>
              </div>

              {/* Font Size & View Mode Controls */}
              <div className="space-y-2 pt-2 border-t border-ink-200 dark:border-ink-800/80 text-xs">
                {/* Font Size Selector */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-ink-500" />
                    <span className={`text-[11px] font-bold ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                      حجم الخط:
                    </span>
                  </div>
                  <div className={`flex items-center p-0.5 rounded-md border text-xs font-bold ${
                    isLight ? 'bg-white border-ink-300' : 'bg-ink-900 border-ink-800'
                  }`}>
                    <button
                      onClick={() => setFontSize('normal')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                        fontSize === 'normal'
                          ? isLight ? 'bg-[#1A5C5C] text-white shadow-2xs' : 'bg-teal-600 text-white'
                          : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                      }`}
                      title="خط عادي"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize('large')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                        fontSize === 'large'
                          ? isLight ? 'bg-[#1A5C5C] text-white shadow-2xs' : 'bg-teal-600 text-white'
                          : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                      }`}
                      title="خط كبير (افتراضي)"
                    >
                      A
                    </button>
                    <button
                      onClick={() => setFontSize('xlarge')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                        fontSize === 'xlarge'
                          ? isLight ? 'bg-[#1A5C5C] text-white shadow-2xs' : 'bg-teal-600 text-white'
                          : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                      }`}
                      title="خط كبير جداً"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                    نمط المعاينة:
                  </span>
                  <div className={`flex items-center p-0.5 rounded-md border text-[11px] font-bold ${
                    isLight ? 'bg-white border-ink-300' : 'bg-ink-900 border-ink-800'
                  }`}>
                    <button
                      onClick={() => setViewMode('simplified')}
                      className={`px-2.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                        viewMode === 'simplified'
                          ? isLight ? 'bg-[#1A5C5C] text-white shadow-2xs font-black' : 'bg-teal-600 text-white'
                          : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                      }`}
                      title="نمط ميسر لتسهيل القراءة وتخفيف العناصر المعقدة"
                    >
                      ميسر
                    </button>
                    <button
                      onClick={() => setViewMode('advanced')}
                      className={`px-2.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                        viewMode === 'advanced'
                          ? isLight ? 'bg-[#1A5C5C] text-white shadow-2xs font-black' : 'bg-teal-600 text-white'
                          : isLight ? 'text-ink-700 hover:text-ink-950' : 'text-ink-400'
                      }`}
                      title="النمط الأكاديمي المتقدم مع شريط الزحزحة والإحصاء"
                    >
                      متقدم
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. Expandable Color & Symbol Legend Accordion */}
      {showLegend && (
        <div className={`p-4 border-t text-xs animate-in fade-in duration-150 ${
          isLight ? 'bg-ink-50 border-ink-200 text-ink-900' : 'bg-ink-950 border-ink-800 text-ink-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-extrabold flex items-center gap-1.5 text-ink-900 dark:text-ink-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>دليل معاني الألوان ورموز المقابلة بين المصحفين:</span>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="text-xs text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 cursor-pointer font-bold"
            >
              إغلاق الدليل ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Emerald: Exact Match */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-ink-900 border-emerald-800/80'
            }`}>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 shrink-0 mt-0.5 shadow-xs"></span>
              <div>
                <strong className={`block font-extrabold ${isLight ? 'text-emerald-950' : 'text-emerald-200'}`}>
                  مطابقة تامة (تطابق الفاصلة والرقم)
                </strong>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${isLight ? 'text-ink-700' : 'text-ink-300'}`}>
                  اتفق مصحفا الكوفة والمدينة على مبدأ الآية وخاتمتها ونفس رقم الترتيب.
                </p>
              </div>
            </div>

            {/* 2. Amber: Shifted Verse Numbering */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-white border-amber-300 shadow-2xs' : 'bg-ink-900 border-amber-800/80'
            }`}>
              <span className="w-3.5 h-3.5 rounded-full bg-amber-600 shrink-0 mt-0.5 shadow-xs"></span>
              <div>
                <strong className={`block font-extrabold ${isLight ? 'text-amber-950' : 'text-amber-200'}`}>
                  زحزحة في الترقيم (±1, ±2...)
                </strong>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${isLight ? 'text-ink-700' : 'text-ink-300'}`}>
                  نص وحدود الآية متطابقة، لكن رقمها مزحزح نتيجة انقسام أو دمج آيات سابقة بالسورة.
                </p>
              </div>
            </div>

            {/* 3. Purple: Split Verse */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-white border-lime-300 shadow-2xs' : 'bg-ink-900 border-lime-800/80'
            }`}>
              <div className="p-1 rounded bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300 shrink-0 mt-0.5">
                <Split className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className={`block font-extrabold ${isLight ? 'text-lime-950' : 'text-lime-200'}`}>
                  انقسام فاصلة (شطر آية)
                </strong>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${isLight ? 'text-ink-700' : 'text-ink-300'}`}>
                  آية واحدة في أحد المصحفين عُدت آيتين أو أكثر في المصحف المقابل (مثل الفاتحة والمائدة).
                </p>
              </div>
            </div>

            {/* 4. Teal: Merged Verse */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-white border-teal-300 shadow-2xs' : 'bg-ink-900 border-teal-800/80'
            }`}>
              <div className="p-1 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 shrink-0 mt-0.5">
                <GitMerge className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className={`block font-extrabold ${isLight ? 'text-teal-950' : 'text-teal-200'}`}>
                  دمج فواصل (جمع آيتين)
                </strong>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${isLight ? 'text-ink-700' : 'text-ink-300'}`}>
                  جمع آيتين كوفيتين في آية مدنية واحدة متصلة (مثل فواتح البقرة وآل عمران).
                </p>
              </div>
            </div>

            {/* 5. Rose: Lexical Word Difference */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-white border-rose-300 shadow-2xs' : 'bg-ink-900 border-rose-800/80'
            }`}>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shrink-0 mt-0.5">
                رَسْم
              </span>
              <div>
                <strong className={`block font-extrabold ${isLight ? 'text-rose-950' : 'text-rose-200'}`}>
                  اختلاف رسم الكلمات (زيادة ونقص الحروف)
                </strong>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${isLight ? 'text-ink-700' : 'text-ink-300'}`}>
                  اختلاف في أصل هجاء الكلمة ورسمها (نحو: ووصى/وأوصى، وسارعوا/سارعوا، تجري تحتها/من تحتها).
                </p>
              </div>
            </div>

            {/* 6. Amber: Farsh & Reading Difference */}
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isLight ? 'bg-white border-amber-300 shadow-2xs' : 'bg-ink-900 border-amber-800/80'
            }`}>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white shrink-0 mt-0.5">
                فَرْش
              </span>
              <div>
                <strong className={`block font-extrabold ${isLight ? 'text-amber-950' : 'text-amber-200'}`}>
                  اختلاف الفرش والقراءات
                </strong>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${isLight ? 'text-ink-700' : 'text-ink-300'}`}>
                  فروق الأداء القرائي في الحركات، الألفات الخنجرية، والهمزات (نحو: مَٰلِكِ/مَلِكِ، يُخَٰدِعُونَ/يَخْدَعُونَ).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  BookOpen, 
  GitCompare, 
  X, 
  RotateCcw,
  BarChart3,
  Compass
} from 'lucide-react';
import { SurahData } from '../types';
import { SectionHelpButton } from './SectionHelpModal';
import { MathTooltip } from './MathTooltip';
import { normalizeArabicText, formatSurahName } from '../utils/arabic';
import { SAHABA_CLUSTERS, getSurahClusterDisplayInfo } from '../data/sahabaClusters';
import { ResearchCard } from './ui/ResearchCard';
import { ResearchButton } from './ui/ResearchButton';
import { SegmentedControl } from './ui/SegmentedControl';

interface SurahExplorerProps {
  surahs: SurahData[];
  onSelectSurah: (surah: SurahData) => void;
  onCompareWith: (surahNumber: number) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onOpenDashboard?: () => void;
}

function normalizeArabic(text: string): string {
  return normalizeArabicText(text);
}

const SurahExplorerComponent: React.FC<SurahExplorerProps> = ({
  surahs,
  onSelectSurah,
  onCompareWith,
  onOpenInReader,
  onOpenDashboard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [lengthFilter, setLengthFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [featureFilter, setFeatureFilter] = useState<'all' | 'absent' | 'complete' | 'uniform' | 'high-diversity'>('all');
  const [filterCluster, setFilterCluster] = useState<number | 'fatihah' | 'all'>('all');
  const [sortBy, setSortBy] = useState<
    'number' | 'ayahs-desc' | 'ayahs-asc' | 'words-desc' | 'diversity-desc' | 'absent-desc' | 'avg-asc' | 'avg-desc'
  >('number');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setLengthFilter('all');
    setFeatureFilter('all');
    setFilterCluster('all');
    setSortBy('number');
  };

  const isAnyFilterActive = 
    searchTerm.trim() !== '' || 
    filterType !== 'all' || 
    lengthFilter !== 'all' || 
    featureFilter !== 'all' || 
    filterCluster !== 'all' ||
    sortBy !== 'number';

  const filteredSurahs = useMemo(() => {
    const rawSearch = searchTerm.trim();
    const normSearch = normalizeArabic(rawSearch);
    const searchNumber = parseInt(normSearch.replace(/[^0-9]/g, ''), 10);

    const isMeccanSearch = normSearch === 'مكي' || normSearch === 'مكيه' || normSearch === 'meccan';
    const isMedinanSearch = normSearch === 'مدني' || normSearch === 'مدنيه' || normSearch === 'medinan';

    return surahs.filter(s => {
      let matchSearch = true;
      if (rawSearch) {
        if (isMeccanSearch) {
          matchSearch = s.isMeccan;
        } else if (isMedinanSearch) {
          matchSearch = !s.isMeccan;
        } else {
          const normSurahName = normalizeArabic(s.name);
          const normEnglish = s.englishName.toLowerCase();
          const matchNumber = !isNaN(searchNumber) && (
            s.number === searchNumber || 
            normSearch === s.number.toString() ||
            normSearch === `#${s.number}` ||
            normSearch === `سوره ${s.number}`
          );
          const matchName = normSurahName.includes(normSearch);
          const matchEnglish = normEnglish.includes(rawSearch.toLowerCase());

          matchSearch = matchNumber || matchName || matchEnglish;
        }
      }

      const matchType = filterType === 'all' || s.revelationType === filterType;

      let matchLength = true;
      if (lengthFilter === 'short') matchLength = s.totalAyahs <= 10;
      else if (lengthFilter === 'medium') matchLength = s.totalAyahs > 10 && s.totalAyahs <= 50;
      else if (lengthFilter === 'long') matchLength = s.totalAyahs > 50;

      let matchFeature = true;
      if (featureFilter === 'absent') matchFeature = s.letters.absentCount > 0;
      else if (featureFilter === 'complete') matchFeature = s.letters.absentCount === 0;
      else if (featureFilter === 'uniform') matchFeature = s.isUniform;
      else if (featureFilter === 'high-diversity') matchFeature = s.vocabularyDiversity >= 75;

      let matchCluster = true;
      if (filterCluster === 'all') {
        matchCluster = true;
      } else if (filterCluster === 'fatihah') {
        matchCluster = s.number === 1;
      } else {
        const clusterDef = SAHABA_CLUSTERS.find(c => c.id === filterCluster);
        matchCluster = clusterDef ? clusterDef.surahNumbers.includes(s.number) : true;
      }

      return matchSearch && matchType && matchLength && matchFeature && matchCluster;
    }).sort((a, b) => {
      if (sortBy === 'number') return a.number - b.number;
      if (sortBy === 'ayahs-desc') return b.totalAyahs - a.totalAyahs;
      if (sortBy === 'ayahs-asc') return a.totalAyahs - b.totalAyahs;
      if (sortBy === 'words-desc') return b.totalWords - a.totalWords;
      if (sortBy === 'diversity-desc') return b.vocabularyDiversity - a.vocabularyDiversity;
      if (sortBy === 'absent-desc') return b.letters.absentCount - a.letters.absentCount;
      if (sortBy === 'avg-asc') return a.avgAyahLengthWords - b.avgAyahLengthWords;
      if (sortBy === 'avg-desc') return b.avgAyahLengthWords - a.avgAyahLengthWords;
      return 0;
    });
  }, [surahs, searchTerm, filterType, lengthFilter, featureFilter, filterCluster, sortBy]);

  const surahTopLettersMap = useMemo(() => {
    const map = new Map<number, [string, number][]>();
    surahs.forEach(s => {
      const top = Object.entries(s.letters.plainPercentages)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3) as [string, number][];
      map.set(s.number, top);
    });
    return map;
  }, [surahs]);

  return (
    <div className="space-y-4 select-none pb-12">
      
      {/* Search & Control Master Panel */}
      <ResearchCard padding="md" className="space-y-3.5">
        
        {/* Main Search Input & Top Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          
          {/* Enhanced Search Input */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="w-4 h-4 text-[#7B8885] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-surah-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم السورة، رقمها، أو نوعها..."
              className="w-full bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9] dark:border-[#33433F] rounded-[6px] pr-9 pl-9 py-2 text-xs sm:text-sm text-[#0F1419] dark:text-[#F4F0E7] placeholder-[#7B8885] focus:outline-none focus:border-[#1A5C5C] transition-colors font-sans-arabic"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="p-1 rounded text-[#7B8885] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Counter, View Toggle, Dashboard Shortcut & Help */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 flex-wrap">
            <div className="text-xs text-[#53605E] dark:text-[#B7C1BC] flex items-center gap-1.5 font-mono">
              <span>النتائج:</span>
              <strong className="text-[#0F1419] dark:text-[#F4F0E7] font-bold px-1.5 py-0.5 rounded border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-xs tabular-nums">
                {filteredSurahs.length}
              </strong>
              <span className="text-[#7B8885]">من 114</span>
            </div>

            {/* View Mode Toggle (Grid / Table) */}
            <SegmentedControl
              size="sm"
              value={viewMode}
              onChange={(val) => setViewMode(val as 'grid' | 'table')}
              options={[
                { value: 'grid', label: 'شبكة', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
                { value: 'table', label: 'جدول', icon: <List className="w-3.5 h-3.5" /> },
              ]}
            />

            {/* Dashboard Quick Switch Button */}
            {onOpenDashboard && (
              <ResearchButton
                variant="secondary"
                size="sm"
                icon={<BarChart3 className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#C5A16A]" />}
                onClick={onOpenDashboard}
                title="لوحة المؤشرات الإحصائية العامة للقرآن"
              >
                <span className="hidden sm:inline">لوحة الإحصاءات</span>
              </ResearchButton>
            )}

            {/* Help Button */}
            <SectionHelpButton 
              guideId="explorer" 
              variant="icon" 
              title="دليل فهرس ومستكشف السور" 
            />
          </div>

        </div>

        {/* Multi-tier Quick Filter Bars */}
        <div className="pt-3 border-t border-[#DED8C9] dark:border-[#33433F] space-y-2.5">
          
          {/* Row 1: Revelation Type & Sorter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Revelation Type Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-sans-arabic text-[#7B8885] dark:text-[#8B9B96] ml-1">النوع:</span>
              {[
                { id: 'all', label: 'الكل (114)' },
                { id: 'Meccan', label: 'مكية (86)' },
                { id: 'Medinan', label: 'مدنية (28)' }
              ].map(type => (
                <button
                  key={type.id}
                  id={`filter-type-${type.id}`}
                  onClick={() => setFilterType(type.id as any)}
                  className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors cursor-pointer ${
                    filterType === type.id
                      ? 'bg-[#1A5C5C] text-[#F4F0E7] font-bold shadow-xs'
                      : 'bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] dark:text-[#B7C1BC] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Sorter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans-arabic text-[#7B8885] dark:text-[#8B9B96] flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-[#B8935F]" />
                الترتيب:
              </span>
              <select
                id="sort-surah-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9] dark:border-[#33433F] rounded-[6px] px-2.5 py-1 text-[#0F1419] dark:text-[#F4F0E7] text-xs focus:outline-none focus:border-[#1A5C5C] font-sans-arabic cursor-pointer"
              >
                <option value="number">الترتيب المصحفي (1 - 114)</option>
                <option value="ayahs-desc">الأكثر آيات (تنازلي)</option>
                <option value="ayahs-asc">الأقل آيات (تصاعدي)</option>
                <option value="words-desc">الأكثر كلمات (تنازلي)</option>
                <option value="diversity-desc">الأعلى تنوعاً معجمياً (TTR)</option>
                <option value="absent-desc">الأكثر غياباً للحروف (صفرية)</option>
                <option value="avg-desc">الأطول آيات في المتوسط</option>
                <option value="avg-asc">الأقصر آيات في المتوسط</option>
              </select>
            </div>

          </div>

          {/* Row 2: Length & Characteristics Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            
            {/* Length Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-sans-arabic text-[#7B8885] dark:text-[#8B9B96] ml-1">طول السورة:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'short', label: 'قصار (≤10)' },
                { id: 'medium', label: 'متوسطة (11-50)' },
                { id: 'long', label: 'طوال (>50)' }
              ].map(len => (
                <button
                  key={len.id}
                  onClick={() => setLengthFilter(len.id as any)}
                  className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer ${
                    lengthFilter === len.id
                      ? 'bg-[#1A5C5C] text-[#F4F0E7] font-bold'
                      : 'bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] dark:text-[#B7C1BC] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3]'
                  }`}
                >
                  {len.label}
                </button>
              ))}
            </div>

            {/* Characteristic Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-sans-arabic text-[#7B8885] dark:text-[#8B9B96] ml-1">الخصائص:</span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'absent', label: 'حروف غائبة' },
                { id: 'complete', label: 'كاملة الحروف (28)' },
                { id: 'uniform', label: 'إيقاع منتظم' },
                { id: 'high-diversity', label: 'تنوع معجمي > 75٪' }
              ].map(feat => (
                <button
                  key={feat.id}
                  onClick={() => setFeatureFilter(feat.id as any)}
                  className={`px-2 py-0.5 rounded-[4px] text-[11px] transition-colors cursor-pointer ${
                    featureFilter === feat.id
                      ? 'bg-[#B8935F] text-[#0F1419] font-bold'
                      : 'bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] dark:text-[#B7C1BC] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3]'
                  }`}
                >
                  {feat.label}
                </button>
              ))}
            </div>

          </div>

          {/* Row 3: Clusters Filter & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-sans-arabic text-[#7B8885] dark:text-[#8B9B96] ml-1">الأحزاب والعناقيد:</span>
              <button
                onClick={() => setFilterCluster('all')}
                className={`px-2 py-0.5 rounded-[4px] text-[11px] font-mono transition-colors cursor-pointer ${
                  filterCluster === 'all'
                    ? 'bg-[#1A5C5C] text-[#F4F0E7] font-bold'
                    : 'bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] dark:text-[#B7C1BC] border border-[#DED8C9] dark:border-[#33433F]'
                }`}
              >
                الكل (114)
              </button>
              <button
                onClick={() => setFilterCluster('fatihah')}
                className={`px-2 py-0.5 rounded-[4px] text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                  filterCluster === 'fatihah'
                    ? 'bg-[#B8935F] text-[#0F1419] font-bold border border-[#B8935F]'
                    : 'bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] dark:text-[#B7C1BC] border border-[#DED8C9] dark:border-[#33433F]'
                }`}
                title="سورة الفاتحة: مستقلة كديباجة وأم للكتاب"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8935F]" />
                <span>الفاتحة (مستقلة)</span>
              </button>
              {SAHABA_CLUSTERS.map(c => {
                const isSelected = filterCluster === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setFilterCluster(c.id)}
                    className={`px-2 py-0.5 rounded-[4px] text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A5C5C] text-[#F4F0E7] font-bold'
                        : 'bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] dark:text-[#B7C1BC] border border-[#DED8C9] dark:border-[#33433F]'
                    }`}
                    title={`${c.name} (${c.traditionalLabel})`}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ backgroundColor: c.color }}
                    />
                    <span>عنقود {c.id} ({c.traditionalLabel})</span>
                  </button>
                );
              })}
            </div>

            {/* Reset All Filters Button */}
            {isAnyFilterActive && (
              <button
                id="reset-filters-btn"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#F7F2E8] dark:bg-[#262118] text-[#8C6B37] dark:text-[#C5A16A] border border-[#B8935F]/40 text-xs font-mono transition-colors cursor-pointer"
                title="إعادة ضبط جميع معايير البحث والتصفية"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط التصفية</span>
              </button>
            )}

          </div>

          {/* Active Cluster Explanatory Callout */}
          {filterCluster !== 'all' && (
            <div className="p-2.5 rounded-[6px] bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9] dark:border-[#33433F] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {filterCluster === 'fatihah' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#B8935F] shrink-0" />
                    <span className="text-[#B8935F] font-bold font-heading">سورة الفاتحة (أم الكتاب):</span>
                    <span className="text-[#53605E] dark:text-[#B7C1BC] text-[11px]">مستقلة عن سائر الأحزاب السبعة؛ ديباجة المصحف ومفتاح سائر سوره.</span>
                  </>
                ) : (() => {
                  const activeDef = SAHABA_CLUSTERS.find(c => c.id === filterCluster);
                  if (!activeDef) return null;
                  return (
                    <>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeDef.color }} />
                      <span className="font-bold text-[#0F1419] dark:text-[#F4F0E7] font-heading">{activeDef.name} ({activeDef.traditionalLabel}):</span>
                      <span className="text-[#53605E] dark:text-[#B7C1BC] text-[11px]">{activeDef.subtitle} · {activeDef.countRule}</span>
                      <span className="text-[#7B8885] dark:text-[#8B9B96] text-[10px] hidden md:inline">({activeDef.thematicFocus})</span>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => setFilterCluster('all')}
                className="text-[10px] font-mono text-[#7B8885] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] underline shrink-0 cursor-pointer"
              >
                إظهار جميع العناقيد
              </button>
            </div>
          )}

        </div>

      </ResearchCard>

      {/* No Results Fallback */}
      {filteredSurahs.length === 0 && (
        <ResearchCard padding="lg" className="text-center space-y-3 py-10">
          <BookOpen className="w-8 h-8 text-[#7B8885] mx-auto opacity-50" />
          <h4 className="text-base font-bold text-[#0F1419] dark:text-[#F4F0E7]">لم يتم العثور على سور مطابقة</h4>
          <p className="text-xs text-[#53605E] dark:text-[#B7C1BC] max-w-md mx-auto">
            لا توجد سور تطابق معايير البحث المحددة. جرب البحث باسم السورة أو رقمها، أو أعد ضبط خيارات التصفية.
          </p>
          <ResearchButton variant="secondary" size="sm" onClick={resetAllFilters}>
            إلغاء خيارات التصفية
          </ResearchButton>
        </ResearchCard>
      )}

      {/* View 1: HIGH DENSITY GRID MODE */}
      {viewMode === 'grid' && filteredSurahs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSurahs.map((surah) => {
            const topLetters = surahTopLettersMap.get(surah.number) || [];

            return (
              <ResearchCard
                key={surah.number}
                id={`surah-card-${surah.number}`}
                hoverable
                padding="md"
                onClick={() => onSelectSurah(surah)}
                className="flex flex-col justify-between space-y-3 group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[4px] bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9] dark:border-[#33433F] flex items-center justify-center text-[#1A5C5C] dark:text-[#79A9A0] font-bold font-mono text-xs group-hover:border-[#1A5C5C] transition-colors">
                        {surah.number}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-[#0F1419] dark:text-[#F4F0E7] group-hover:text-[#1A5C5C] dark:group-hover:text-[#C5A16A] transition-colors">
                          {formatSurahName(surah.name)}
                        </h3>
                        <span className="text-[10px] font-sans text-[#7B8885] dark:text-[#8B9B96]">
                          {surah.englishName}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-sans-arabic text-[#53605E] dark:text-[#B7C1BC]">
                      {surah.isMeccan ? 'مكية' : 'مدنية'}
                    </span>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 my-2 pt-2 border-t border-[#DED8C9]/50 dark:border-[#33433F]/60 text-center">
                    <div className="bg-[#F7F4EA] dark:bg-[#121C1B] p-1.5 rounded-[4px] border border-[#DED8C9]/40 dark:border-[#33433F]/40">
                      <div className="text-[9px] font-sans text-[#7B8885]">الآيات</div>
                      <div className="text-xs font-bold text-[#0F1419] dark:text-[#F4F0E7] mt-0.5 font-mono tabular-nums">{surah.totalAyahs}</div>
                    </div>
                    <div className="bg-[#F7F4EA] dark:bg-[#121C1B] p-1.5 rounded-[4px] border border-[#DED8C9]/40 dark:border-[#33433F]/40">
                      <div className="text-[9px] font-sans text-[#7B8885]">الكلمات</div>
                      <div className="text-xs font-bold text-[#0F1419] dark:text-[#F4F0E7] mt-0.5 font-mono tabular-nums">{surah.totalWords.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#F7F4EA] dark:bg-[#121C1B] p-1.5 rounded-[4px] border border-[#DED8C9]/40 dark:border-[#33433F]/40">
                      <MathTooltip metricId="ttr" value={`${surah.vocabularyDiversity}%`} showUnderline={false}>
                        <div className="text-[9px] font-sans text-[#7B8885]">التنوع</div>
                        <div className="text-xs font-bold text-[#1A5C5C] dark:text-[#79A9A0] mt-0.5 font-mono tabular-nums">{surah.vocabularyDiversity}%</div>
                      </MathTooltip>
                    </div>
                  </div>

                  {/* Top Letters & Absent */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-[#7B8885]">
                      <span>أعلى الحروف:</span>
                      <div className="flex items-center gap-1 font-mono">
                        {topLetters.map(([l, p]) => (
                          <span key={l} className="text-[#0F1419] dark:text-[#F4F0E7] px-1 bg-[#F7F4EA] dark:bg-[#121C1B] border border-[#DED8C9] dark:border-[#33433F] rounded-[3px] text-[10px]">
                            {l}:{p}%
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#7B8885]">
                      <span>الحروف الغائبة:</span>
                      <span className={`font-mono text-[10px] ${
                        surah.letters.absentCount > 0 ? 'text-[#8C6B37] dark:text-[#C5A16A]' : 'text-[#7B8885]'
                      }`}>
                        {surah.letters.absentCount > 0 ? `${surah.letters.absentCount} حروف` : 'كاملة (0)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-[#DED8C9]/50 dark:border-[#33433F]/60 flex items-center justify-between gap-2 text-xs">
                  {(() => {
                    const clusterInfo = getSurahClusterDisplayInfo(surah.number);
                    return (
                      <span 
                        className="text-[10px] font-mono text-[#7B8885] dark:text-[#8B9B96] truncate max-w-[120px]"
                        title={clusterInfo.tooltip}
                      >
                        {clusterInfo.shortLabel}
                      </span>
                    );
                  })()}
                  
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {onOpenInReader && (
                      <button
                        id={`read-quran-btn-${surah.number}`}
                        onClick={() => onOpenInReader(surah.number)}
                        className="p-1 rounded-[4px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] transition-colors cursor-pointer"
                        title="فتح في قراءة المصحف"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      id={`compare-btn-${surah.number}`}
                      onClick={() => onCompareWith(surah.number)}
                      className="p-1 rounded-[4px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] transition-colors cursor-pointer"
                      title="مقارنة مع سورة أخرى"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`view-fingerprint-${surah.number}`}
                      onClick={() => onSelectSurah(surah)}
                      className="px-2 py-0.5 rounded-[4px] border border-[#1A5C5C]/40 bg-[#E8F1EF] dark:bg-[#183130] text-[#1A5C5C] dark:text-[#79A9A0] text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      البصمة
                    </button>
                  </div>
                </div>

              </ResearchCard>
            );
          })}
        </div>
      )}

      {/* View 2: HIGH DENSITY TABLE MODE */}
      {viewMode === 'table' && filteredSurahs.length > 0 && (
        <div className="bg-[#FBF9F2] dark:bg-[#172322] border border-[#DED8C9] dark:border-[#33433F] rounded-[8px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F7F4EA] dark:bg-[#121C1B] text-[#7B8885] dark:text-[#8B9B96] border-b border-[#DED8C9] dark:border-[#33433F] font-sans-arabic text-[11px]">
                <tr>
                  <th className="p-2.5">الرقم</th>
                  <th className="p-2.5">السورة</th>
                  <th className="p-2.5">النزول</th>
                  <th className="p-2.5">العنقود</th>
                  <th className="p-2.5">الآيات</th>
                  <th className="p-2.5">الكلمات</th>
                  <th className="p-2.5">الحروف</th>
                  <th className="p-2.5">
                    <MathTooltip metricId="ttr" showUnderline={true}>
                      <span>تنوع المفردات</span>
                    </MathTooltip>
                  </th>
                  <th className="p-2.5">
                    <MathTooltip metricId="avgAyahLengthWords" showUnderline={true}>
                      <span>متوسط الآية</span>
                    </MathTooltip>
                  </th>
                  <th className="p-2.5">
                    <MathTooltip metricId="absentLetters" showUnderline={true}>
                      <span>الحروف الغائبة</span>
                    </MathTooltip>
                  </th>
                  <th className="p-2.5">الإيقاع</th>
                  <th className="p-2.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED8C9]/50 dark:divide-[#33433F]/60 text-[#0F1419] dark:text-[#F4F0E7] font-mono tabular-nums text-[11px]">
                {filteredSurahs.map((surah) => (
                  <tr 
                    key={surah.number} 
                    className="hover:bg-[#F4F0E4]/60 dark:hover:bg-[#1E2D2C]/60 transition-colors cursor-pointer"
                    onClick={() => onSelectSurah(surah)}
                  >
                    <td className="p-2.5 font-bold text-[#1A5C5C] dark:text-[#79A9A0]">{surah.number}</td>
                    <td className="p-2.5">
                      <div className="font-heading font-bold text-sm text-[#0F1419] dark:text-[#F4F0E7]">{formatSurahName(surah.name)}</div>
                      <div className="text-[10px] text-[#7B8885] font-sans">{surah.englishName}</div>
                    </td>
                    <td className="p-2.5 font-sans">
                      {surah.isMeccan ? 'مكية' : 'مدنية'}
                    </td>
                    <td className="p-2.5">
                      {(() => {
                        const clusterInfo = getSurahClusterDisplayInfo(surah.number);
                        return (
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded border border-[#DED8C9] dark:border-[#33433F] whitespace-nowrap"
                            title={clusterInfo.tooltip}
                          >
                            {clusterInfo.shortLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-2.5">{surah.totalAyahs}</td>
                    <td className="p-2.5">{surah.totalWords.toLocaleString()}</td>
                    <td className="p-2.5">{surah.totalChars.toLocaleString()}</td>
                    <td className="p-2.5 text-[#1A5C5C] dark:text-[#79A9A0] font-semibold">
                      {surah.vocabularyDiversity}%
                    </td>
                    <td className="p-2.5">
                      {surah.avgAyahLengthWords} ك
                    </td>
                    <td className="p-2.5">
                      {surah.letters.absentCount > 0 ? (
                        <span className="text-[#8C6B37] dark:text-[#C5A16A]">
                          {surah.letters.absentCount} حروف
                        </span>
                      ) : (
                        <span className="text-[#7B8885]">كاملة (0)</span>
                      )}
                    </td>
                    <td className="p-2.5 font-sans">
                      {surah.isUniform ? 'منتظم' : 'متذبذب'}
                    </td>
                    <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {onOpenInReader && (
                          <button
                            onClick={() => onOpenInReader(surah.number)}
                            className="p-1 rounded border border-[#DED8C9] dark:border-[#33433F] text-[#53605E] hover:text-[#0F1419] transition-colors cursor-pointer"
                            title="فتح في قراءة المصحف"
                          >
                            <BookOpen className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onCompareWith(surah.number)}
                          className="p-1 rounded border border-[#DED8C9] dark:border-[#33433F] text-[#53605E] hover:text-[#0F1419] transition-colors cursor-pointer"
                          title="مقارنة مع سورة أخرى"
                        >
                          <GitCompare className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onSelectSurah(surah)}
                          className="px-2 py-0.5 rounded border border-[#1A5C5C]/40 text-[#1A5C5C] dark:text-[#79A9A0] text-[10px] font-bold cursor-pointer"
                        >
                          بصمة
                        </button>
                      </div>
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

export const SurahExplorer = React.memo(SurahExplorerComponent);

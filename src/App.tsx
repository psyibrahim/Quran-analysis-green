import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { QuranCorpusProvider, useQuranCorpus } from './context/QuranCorpusContext';
import { QueryDrawerProvider } from './context/QueryDrawerContext';
import { QueryDrawer } from './components/QueryDrawer';
import { Navbar } from './components/Navbar';
import { QuranReader } from './components/QuranReader';
import { SurahExplorer } from './components/SurahExplorer';
import { LettersLab } from './components/LettersLab';
import { SurahComparator } from './components/SurahComparator';
import { SimilarityClusters } from './components/SimilarityClusters';
import { MeccanMedinanLab } from './components/MeccanMedinanLab';
import { MushafComparisonLab } from './components/MushafComparisonLab';
import { HawameemLab } from './components/HawameemLab';
import { VerseEndingsLab } from './components/VerseEndingsLab';
import { LexicalRichnessLab } from './components/LexicalRichnessLab';
import { WordComparatorLab } from './components/WordComparatorLab';
import { OpeningsAndFamiliesLab } from './components/OpeningsAndFamiliesLab';
import { SurahDetailModal } from './components/SurahDetailModal';
import { Dashboard } from './components/Dashboard';
import { ActiveTab, SurahData } from './types';
import { formatSurahName } from './utils/arabic';
import { ArrowRight } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quran-reader');

  // Clear any legacy preference keys from localStorage so the application always starts clean
  useEffect(() => {
    try {
      const keysToRemove = [
        'quran_active_mushaf',
        'quran_fatihah_basmalah',
        'quran_app_active_tab',
        'quran_mushaf_view_mode',
        'quran_letters_subtab',
        'quran_alphabet_sort_mode',
        'quran_letters_heatmap_filter',
        'quran_letters_heatmap_metric',
        'quran_letters_alphabet_metric',
        'quran_cumulative_chart_mode',
        'quran_cumulative_surah_ids',
        'quran_cumulative_metric_mode',
        'quran_cumulative_order_mode',
        'quran_cumulative_letter',
        'quran_preferred_surah_metrics'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {}
  }, []);

  type ToolFamily = 
    | 'dashboard'
    | 'quran-reader' 
    | 'explorer' 
    | 'comparator' 
    | 'letters' 
    | 'verse-endings'
    | 'lexical-richness'
    | 'word-comparator'
    | 'openings-families'
    | 'similarity' 
    | 'meccan-medinan' 
    | 'mushaf';

  function getToolFamily(tab: ActiveTab): ToolFamily {
    if (tab === 'dashboard') return 'dashboard';
    if (tab === 'quran-reader') return 'quran-reader';
    if (tab === 'explorer') return 'explorer';
    if (tab === 'comparator') return 'comparator';
    if (tab === 'meccan-medinan') return 'meccan-medinan';
    if (tab === 'verse-endings') return 'verse-endings';
    if (tab === 'lexical-richness') return 'lexical-richness';
    if (tab === 'word-comparator') return 'word-comparator';
    if (tab === 'openings-families') return 'openings-families';
    if (tab.startsWith('letters-')) return 'letters';
    if (tab.startsWith('similarity-')) return 'similarity';
    if (tab.startsWith('mushaf-')) return 'mushaf';
    return 'quran-reader';
  }


  const [visitedFamilies, setVisitedFamilies] = useState<Set<ToolFamily>>(() => new Set<ToolFamily>(['quran-reader', 'explorer', 'dashboard']));
interface QuickReturnState {
  tab: ActiveTab;
  tabLabel: string;
  scrollY: number;
  readerSurah?: number;
  comparatorSurahs?: number[];
  selectedSurahNumber?: number | null;
}

const TAB_LABELS: Record<ActiveTab, string> = {
  'quran-reader': 'قراءة المصحف',
  'explorer': 'فهرس السور',
  'dashboard': 'لوحة الإحصاءات',
  'comparator': 'مقارنة السور',
  'mushaf-direct': 'مقارنة آيات المصحفين',
  'mushaf-diff-table': 'جدول فوارق المصاحف',
  'mushaf-divergence': 'مصفوفة فوارق المصاحف',
  'meccan-medinan': 'مقارنة المكي والمدني',
  'letters-heatmap': 'خريطة الحروف',
  'letters-comparator': 'مقارنة تكرار الحروف',
  'letters-extremes': 'القيم القصوى للحروف',
  'letters-phonetics': 'مخارج وأصوات الحروف',
  'letters-diacritics': 'حركات التشكيل',
  'letters-cumulative': 'التوزيع التراكمي',
  'verse-endings': 'فواصل الآيات والإيقاع',
  'openings-families': 'عوائل السور وفواتح الحروف',
  'lexical-richness': 'اللسانيات والنسبة الذهبية',
  'word-comparator': 'مقارنة الكلمات',
  'similarity-matrix': 'مصفوفة تشابه السور',
  'similarity-clusters': 'عناقيد وتصنيف السور',
  'similarity-closest': 'أقرب السور'
};

  const [quickReturn, setQuickReturn] = useState<QuickReturnState | null>(null);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);
  const [comparatorSurahs, setComparatorSurahs] = useState<number[]>([1, 2]);
  const { theme } = useTheme();
  
  // Live reactive data from QuranCorpusProvider (respects methodology options)
  const { 
    activeMushaf,
    activeMeta,
    surahs, 
    letterStats, 
    similarityMatrix, 
    macroStats,
    selectedReaderSurah,
    setSelectedReaderSurah
  } = useQuranCorpus();

  // Dynamically resolve the selected surah from the current active mushaf's dataset
  const selectedSurah = useMemo(() => {
    if (!selectedSurahNumber) return null;
    return surahs.find(s => s.number === selectedSurahNumber) || null;
  }, [selectedSurahNumber, surahs]);

  const markFamilyVisited = useCallback((tab: ActiveTab) => {
    const family = getToolFamily(tab);
    setVisitedFamilies(prev => {
      if (prev.has(family)) return prev;
      const next = new Set(prev);
      next.add(family);
      return next;
    });
  }, []);

  const saveQuickReturn = useCallback(() => {
    setQuickReturn({
      tab: activeTab,
      tabLabel: TAB_LABELS[activeTab] || 'الأداة السابقة',
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      readerSurah: selectedReaderSurah,
      comparatorSurahs: [...comparatorSurahs],
      selectedSurahNumber: selectedSurahNumber
    });
  }, [activeTab, selectedReaderSurah, comparatorSurahs, selectedSurahNumber]);

  const handleQuickNavigate = useCallback((targetTab: ActiveTab) => {
    saveQuickReturn();
    setSelectedSurahNumber(null);
    markFamilyVisited(targetTab);
    setActiveTab(targetTab);
  }, [saveQuickReturn, markFamilyVisited]);

  const handleReturnToPrevious = useCallback(() => {
    if (!quickReturn) return;
    const { tab, scrollY, readerSurah, comparatorSurahs: prevComp, selectedSurahNumber: prevSurah } = quickReturn;
    setQuickReturn(null);
    if (readerSurah !== undefined) {
      setSelectedReaderSurah(readerSurah);
    }
    if (prevComp) {
      setComparatorSurahs(prevComp);
    }
    setSelectedSurahNumber(prevSurah ?? null);
    markFamilyVisited(tab);
    setActiveTab(tab);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: scrollY, behavior: 'smooth' });
      }
    }, 50);
  }, [quickReturn, setSelectedReaderSurah, markFamilyVisited]);

  // Jump to Quran Reader for a specific surah
  const handleOpenInReader = useCallback((surahNumber: number) => {
    if (activeTab !== 'quran-reader') {
      saveQuickReturn();
    }
    setSelectedReaderSurah(surahNumber);
    setSelectedSurahNumber(null);
    markFamilyVisited('quran-reader');
    setActiveTab('quran-reader');
  }, [activeTab, saveQuickReturn, setSelectedReaderSurah, markFamilyVisited]);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setQuickReturn(null);
    setSelectedSurahNumber(null);
    markFamilyVisited(tab);
    setActiveTab(tab);
  }, [markFamilyVisited]);

  // Trigger compare from anywhere
  const handleCompareWith = useCallback((surahNumber: number) => {
    if (activeTab !== 'comparator') {
      saveQuickReturn();
    }
    setSelectedSurahNumber(curr => {
      if (curr && curr !== surahNumber) {
        setComparatorSurahs([curr, surahNumber]);
      } else {
        setComparatorSurahs([surahNumber, surahNumber === 1 ? 2 : 1]);
      }
      return null;
    });
    markFamilyVisited('comparator');
    setActiveTab('comparator');
  }, [activeTab, saveQuickReturn, markFamilyVisited]);

  const handleCompareDirect = useCallback((surahA: number, surahB: number) => {
    if (activeTab !== 'comparator') {
      saveQuickReturn();
    }
    setComparatorSurahs([surahA, surahB]);
    setSelectedSurahNumber(null);
    markFamilyVisited('comparator');
    setActiveTab('comparator');
  }, [activeTab, saveQuickReturn, markFamilyVisited]);

  const handleSelectSurah = useCallback((s: SurahData) => {
    setSelectedSurahNumber(s.number);
  }, []);

  const handleSelectSurahNumber = useCallback((surahNumber: number) => {
    setSelectedSurahNumber(surahNumber);
  }, []);

  // Derived active flags and sub-views for consolidated components
  const isLettersActive = activeTab.startsWith('letters-');
  const lettersView = useMemo<'heatmap' | 'comparator' | 'alphabet' | 'phonetics' | 'diacritics' | 'cumulative'>(() => {
    switch (activeTab) {
      case 'letters-comparator': return 'comparator';
      case 'letters-extremes': return 'alphabet';
      case 'letters-phonetics': return 'phonetics';
      case 'letters-diacritics': return 'diacritics';
      case 'letters-cumulative': return 'cumulative';
      default: return 'heatmap';
    }
  }, [activeTab]);

  const isSimilarityActive = activeTab.startsWith('similarity-');
  const similarityView = useMemo<'matrix' | 'closest' | 'clusters-list'>(() => {
    switch (activeTab) {
      case 'similarity-closest': return 'closest';
      case 'similarity-clusters': return 'clusters-list';
      default: return 'matrix';
    }
  }, [activeTab]);

  const isMushafActive = activeTab.startsWith('mushaf-');
  const mushafView = useMemo<'direct-compare' | 'diff-table' | 'divergence-matrix'>(() => {
    switch (activeTab) {
      case 'mushaf-diff-table': return 'diff-table';
      case 'mushaf-divergence': return 'divergence-matrix';
      default: return 'direct-compare';
    }
  }, [activeTab]);

  return (
    <div className={`min-h-screen font-sans-arabic antialiased flex flex-col transition-colors duration-150 w-full max-w-full overflow-x-hidden ${
      theme === 'light' 
        ? 'bg-[#F7F4EA] text-[#0F1419] selection:bg-[#1A5C5C]/20 selection:text-[#1A5C5C]' 
        : 'bg-[#0B1716] text-[#F4F0E7] selection:bg-[#2B7470]/35 selection:text-[#F4F0E7]'
    }`}>
      
      {/* Top App Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
        totalSurahs={macroStats.totalSurahs}
        totalAyahs={macroStats.totalQuranVerses}
        totalWords={macroStats.totalQuranWords}
        selectedSurahName={selectedSurah ? formatSurahName(selectedSurah.name) : undefined}
        onBackFromAnalysis={() => setSelectedSurahNumber(null)}
        quickReturnLabel={quickReturn && activeTab !== quickReturn.tab ? quickReturn.tabLabel : undefined}
        onQuickReturn={handleReturnToPrevious}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 min-w-0 overflow-x-hidden">
        
        {/* Quick Return Bar (appears after fast portal jumps) */}
        {quickReturn && activeTab !== quickReturn.tab && (
          <div className="mb-4 flex items-center justify-between gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-[8px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#1A5C5C]/30 dark:border-[#B8935F]/40 shadow-xs">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#53605E] dark:text-[#A8BCB9]">
              <span className="w-2 h-2 rounded-full bg-[#1A5C5C] dark:bg-[#B8935F] shrink-0"></span>
              <span>انتقلت سريعاً من: <strong className="text-[#0F1419] dark:text-[#F4F0E7]">{quickReturn.tabLabel}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleReturnToPrevious}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold bg-[#1A5C5C] text-white dark:bg-[#2B7470] dark:text-[#F4F0E7] hover:bg-[#134646] dark:hover:bg-[#348884] shadow-xs cursor-pointer transition-colors shrink-0"
              title={`العودة إلى ${quickReturn.tabLabel}`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى {quickReturn.tabLabel}</span>
            </button>
          </div>
        )}

        {/* Full-screen Surah Detailed Analysis View (when opened) */}
        {selectedSurah && (
          <SurahDetailModal 
            surah={selectedSurah}
            onClose={() => setSelectedSurahNumber(null)}
            onBack={() => setSelectedSurahNumber(null)}
            onCompareWith={handleCompareWith}
            onOpenInReader={handleOpenInReader}
            allSurahs={surahs}
            onSelectSurah={(s) => setSelectedSurahNumber(s.number)}
          />
        )}

        {/* Main Labs View: Kept-Alive, Fast-Switching Tab Containers */}
        <div style={{ display: !selectedSurah ? 'block' : 'none' }}>
          {/* 0. لوحة الإحصاءات العامة (Dashboard) */}
          {visitedFamilies.has('dashboard') && (
            <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
              <Dashboard 
                onSelectSurah={handleSelectSurah}
                onOpenInReader={handleOpenInReader}
                onNavigateTab={handleQuickNavigate}
              />
            </div>
          )}

          {/* 1. قراءة المصحف */}
          {visitedFamilies.has('quran-reader') && (
            <div style={{ display: activeTab === 'quran-reader' ? 'block' : 'none' }}>
              <QuranReader 
                onSelectSurahForAnalysis={handleSelectSurahNumber} 
                onNavigateTab={handleQuickNavigate}
                onCompareWith={handleCompareWith}
              />
            </div>
          )}

          {/* 2. فهرس السور */}
          {visitedFamilies.has('explorer') && (
            <div style={{ display: activeTab === 'explorer' ? 'block' : 'none' }}>
              <SurahExplorer 
                surahs={surahs}
                onSelectSurah={handleSelectSurah}
                onCompareWith={handleCompareWith}
                onOpenInReader={handleOpenInReader}
                onOpenDashboard={() => handleQuickNavigate('dashboard')}
              />
            </div>
          )}

          {/* 3. مقارنة السور */}
          {visitedFamilies.has('comparator') && (
            <div style={{ display: activeTab === 'comparator' ? 'block' : 'none' }}>
              <SurahComparator 
                surahs={surahs}
                initialSurahIds={comparatorSurahs}
                onSelectSurah={handleSelectSurah}
                onOpenInReader={handleOpenInReader}
              />
            </div>
          )}

          {/* 4. أدوات الحروف والتشكيل (حاوية واحدة مشتركة تنتقل فورياً 0ms) */}
          {visitedFamilies.has('letters') && (
            <div style={{ display: isLettersActive ? 'block' : 'none' }}>
              <LettersLab 
                view={lettersView}
                surahs={surahs}
                letterStats={letterStats}
                onSelectSurah={handleSelectSurah}
                onOpenInReader={handleOpenInReader}
              />
            </div>
          )}

          {/* 5. مختبر فواصل الآيات والإيقاع الصوتي (جديد) */}
          {visitedFamilies.has('verse-endings') && (
            <div style={{ display: activeTab === 'verse-endings' ? 'block' : 'none' }}>
              <VerseEndingsLab 
                onSelectSurah={handleSelectSurahNumber}
                onOpenInReader={handleOpenInReader}
              />
            </div>
          )}

          {/* 6. مختبر اللسانيات الرياضية وثراء المفردات وقانون زيف (جديد) */}
          {visitedFamilies.has('lexical-richness') && (
            <div style={{ display: activeTab === 'lexical-richness' ? 'block' : 'none' }}>
              <LexicalRichnessLab 
                onSelectSurah={handleSelectSurahNumber}
              />
            </div>
          )}

          {/* 6.2 أداة مقارنة الكلمات البحثية المحايدة */}
          {visitedFamilies.has('word-comparator') && (
            <div style={{ display: activeTab === 'word-comparator' ? 'block' : 'none' }}>
              <WordComparatorLab 
                onOpenInReader={handleOpenInReader}
                onSelectSurah={handleSelectSurahNumber}
              />
            </div>
          )}

          {/* 7. مختبر عوائل السور وفواتح الحروف المقطعة (جديد وشامل) */}
          {visitedFamilies.has('openings-families') && (
            <div style={{ display: activeTab === 'openings-families' ? 'block' : 'none' }}>
              <OpeningsAndFamiliesLab 
                surahs={surahs}
                letterStats={letterStats}
                onSelectSurah={handleSelectSurah}
                onOpenInReader={handleOpenInReader}
                onCompareWith={handleCompareWith}
              />
            </div>
          )}

          {/* 8. أدوات التشابه والعناقيد */}
          {visitedFamilies.has('similarity') && (
            <div style={{ display: isSimilarityActive ? 'block' : 'none' }}>
              <SimilarityClusters 
                view={similarityView}
                surahs={surahs}
                similarityMatrix={similarityMatrix}
                onSelectSurah={handleSelectSurah}
                onCompare={handleCompareDirect}
              />
            </div>
          )}

          {/* 9. مقارنة المكي والمدني */}
          {visitedFamilies.has('meccan-medinan') && (
            <div style={{ display: activeTab === 'meccan-medinan' ? 'block' : 'none' }}>
              <MeccanMedinanLab 
                macroStats={macroStats}
                letterStats={letterStats}
              />
            </div>
          )}

          {/* 10. أدوات مقارنة المصحفين */}
          {visitedFamilies.has('mushaf') && (
            <div style={{ display: isMushafActive ? 'block' : 'none' }}>
              <MushafComparisonLab view={mushafView} />
            </div>
          )}
        </div>

      </main>

      {/* Scholarly Research Footer */}
      <footer className={`h-10 px-4 sm:px-6 text-[11px] flex items-center justify-between border-t font-sans-arabic transition-colors duration-150 ${
        theme === 'light' 
          ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#53605E]' 
          : 'bg-[#10211F] border-[#264340] text-[#B7C1BC]'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 font-bold ${theme === 'light' ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A5C5C] dark:bg-[#2B7470]"></span>
            مختبر بصمة السور · البحث الإحصائي والرياضي
          </span>
          <span className="hidden md:inline text-[#B8935F]">·</span>
          <span className="hidden md:inline text-[11px] font-mono">
            {activeMeta?.canonicalName || 'المصحف العثماني'} ({activeMeta?.totalVerses?.toLocaleString() || '6,236'} آية)
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1 font-bold text-[#1A5C5C] dark:text-[#C5A16A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8935F]"></span>
            {activeMushaf === 'madani' ? 'المصحف المدني (ورش)' : 'المصحف الكوفي (حفص)'}
          </span>
          <span className="hidden sm:inline text-[#7B8885]">· 114 سورة</span>
        </div>
      </footer>

      {/* Centralized Unified Query & Exploration Drawer */}
      <QueryDrawer />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QuranCorpusProvider>
        <QueryDrawerProvider>
          <AppContent />
        </QueryDrawerProvider>
      </QuranCorpusProvider>
    </ThemeProvider>
  );
}

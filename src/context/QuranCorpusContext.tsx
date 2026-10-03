import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  QuranSurahCorpus,
  SurahData,
  LetterStatsData,
  MacroStatsData,
  MushafType,
  MushafMetadata,
  IndependentMushafDataset
} from '../types';

// ==========================================
// 1. KUFI DATASETS (مصحف حفص عن عاصم - العد الكوفي)
// ==========================================
import quranCorpusKufiRaw from '../data/quranCorpus.json';
import surahsPureRaw from '../data/surahs_pure.json';
import letterStatsPureRaw from '../data/letterStats_pure.json';
import similarityMatrixPureRaw from '../data/similarityMatrix_pure.json';
import macroStatsPureRaw from '../data/macroStats_pure.json';

import surahsFatihahRaw from '../data/surahs_fatihah.json';
import letterStatsFatihahRaw from '../data/letterStats_fatihah.json';
import similarityMatrixFatihahRaw from '../data/similarityMatrix_fatihah.json';
import macroStatsFatihahRaw from '../data/macroStats_fatihah.json';

// ==========================================
// 2. MADANI DATASETS (مصحف ورش عن نافع - العد المدني)
// عبر Quranpedia API الرسمية (ID: 4)
// ==========================================
import quranCorpusMadaniRaw from '../data/madani/quranCorpus_madani.json';
import surahsMadaniRaw from '../data/madani/surahs_madani.json';
import letterStatsMadaniRaw from '../data/madani/letterStats_madani.json';
import similarityMatrixMadaniRaw from '../data/madani/similarityMatrix_madani.json';
import macroStatsMadaniRaw from '../data/madani/macroStats_madani.json';
import mushafMetaMadaniRaw from '../data/madani/mushafMeta_madani.json';
import { checkQuranpediaHealth } from '../services/quranpediaService';
import { normalizeArabicText } from '../utils/arabic';

// Helper to pre-compute normalized search text for all ayahs in corpus
function enrichCorpusWithNormalizedText(rawCorpus: any[]): QuranSurahCorpus[] {
  return (rawCorpus as QuranSurahCorpus[]).map(surah => ({
    ...surah,
    ayahs: (surah.ayahs || []).map(ayah => ({
      ...ayah,
      textNormalized: normalizeArabicText(ayah.textUthmani || ayah.textSimple || '')
    }))
  }));
}

interface QuranCorpusContextType {
  // Active Mushaf selection
  activeMushaf: MushafType;
  setActiveMushaf: (val: MushafType) => void;
  toggleActiveMushaf: () => void;
  activeMeta: MushafMetadata;
  isMushafLocked: boolean;
  setMushafLocked: (locked: boolean) => void;

  // Active dataset (100% radical separation based on activeMushaf)
  corpus: QuranSurahCorpus[];
  surahs: SurahData[];
  letterStats: LetterStatsData;
  similarityMatrix: number[][];
  macroStats: MacroStatsData;

  // Explicit independent datasets for direct dual-comparison
  kufiDataset: IndependentMushafDataset;
  madaniDataset: IndependentMushafDataset;

  // Kufi Methodology options
  includeBasmalahInFatihah: boolean;
  setIncludeBasmalahInFatihah: (val: boolean) => void;
  toggleFatihahBasmalah: () => void;

  // Reader state
  selectedReaderSurah: number;
  setSelectedReaderSurah: (num: number) => void;
  readingMode: 'verses' | 'mushaf';
  setReadingMode: (mode: 'verses' | 'mushaf') => void;

  // Basmalah stats diff for Kufi
  statsDiff: {
    wordsDiff: number;
    lettersDiff: number;
    pureTotalWords: number;
    withFatihahTotalWords: number;
  };

  // Quranpedia API status
  quranpediaStatus: {
    online: boolean;
    latencyMs: number;
    statusText: string;
    checkedAt: string;
  };
  refreshQuranpediaStatus: () => Promise<void>;
}

const QuranCorpusContext = createContext<QuranCorpusContextType | undefined>(undefined);

export const QuranCorpusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Active Mushaf state ('kufi' | 'madani')
  const [isMushafLocked, setMushafLocked] = useState<boolean>(false);
  const [activeMushaf, setActiveMushafState] = useState<MushafType>('kufi');

  const setActiveMushaf = (type: MushafType) => {
    setActiveMushafState(type);
  };

  // ربط خط نص القرآن بالرواية النشطة: حفص → KFGQPC Uthmanic Hafs، ورش → KFGQPC Warsh
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-riwaya',
      activeMushaf === 'madani' ? 'warsh' : 'hafs'
    );
  }, [activeMushaf]);

  const toggleActiveMushaf = () => {
    setActiveMushaf(activeMushaf === 'kufi' ? 'madani' : 'kufi');
  };

  // 2. Basmalah in Fatihah permanently included for Kufi Mushaf (العد الكوفي يتضمن البسملة كآية أولى)
  const [includeBasmalahInFatihah, setIncludeBasmalahInFatihah] = useState<boolean>(true);

  const toggleFatihahBasmalah = () => {
    // Kept for interface compatibility; Kufi permanently preserves Basmalah in Fatihah
    setIncludeBasmalahInFatihah(true);
  };

  // 3. Reader state
  const [selectedReaderSurah, setSelectedReaderSurah] = useState<number>(1);
  const [readingMode, setReadingMode] = useState<'verses' | 'mushaf'>('verses');

  // 4. Quranpedia API Connectivity Status
  const [quranpediaStatus, setQuranpediaStatus] = useState<{
    online: boolean;
    latencyMs: number;
    statusText: string;
    checkedAt: string;
  }>({
    online: true,
    latencyMs: 120,
    statusText: 'متصل ومزامن',
    checkedAt: new Date().toLocaleTimeString('ar-EG')
  });

  const refreshQuranpediaStatus = async () => {
    const res = await checkQuranpediaHealth();
    setQuranpediaStatus({
      ...res,
      checkedAt: new Date().toLocaleTimeString('ar-EG')
    });
  };

  useEffect(() => {
    refreshQuranpediaStatus();
  }, []);

  // =========================================================================
  // 5. RADICALLY INDEPENDENT KUFI DATASET
  // =========================================================================
  const kufiDataset: IndependentMushafDataset = useMemo(() => {
    const surahs = (includeBasmalahInFatihah ? surahsFatihahRaw : surahsPureRaw) as unknown as SurahData[];
    const letterStats = (includeBasmalahInFatihah ? letterStatsFatihahRaw : letterStatsPureRaw) as unknown as LetterStatsData;
    const similarityMatrix = (includeBasmalahInFatihah ? similarityMatrixFatihahRaw : similarityMatrixPureRaw) as number[][];
    const macroStats = (includeBasmalahInFatihah ? macroStatsFatihahRaw : macroStatsPureRaw) as unknown as MacroStatsData;
    const corpus = enrichCorpusWithNormalizedText(quranCorpusKufiRaw);

    const meta: MushafMetadata = {
      id: 'kufi',
      type: 'kufi',
      name: 'المصحف الكوفي',
      canonicalName: 'مصحف حفص عن عاصم (العد الكوفي)',
      riwayah: 'رواية حفص عن عاصم',
      countSystem: 'العد الكوفي المعتمد (6,236 آية)',
      totalVerses: 6236,
      totalWords: includeBasmalahInFatihah ? 77797 : 77793,
      totalChars: 330709,
      description: 'المصحف برواية حفص عن عاصم بالعد الكوفي المتواتر. إجمالي آياته 6236 آية متضمنة العد الكوفي للآيات.',
      rawi: 'حفص بن سليمان بن المغيرة الأسدي الكوفي عن عاصم بن أبي النَّجود الكوفي',
      source: 'المصحف المطبوع بمجمع الملك فهد (العد الكوفي)'
    };

    return {
      meta,
      corpus,
      surahs,
      letterStats,
      similarityMatrix,
      macroStats
    };
  }, [includeBasmalahInFatihah]);

  // =========================================================================
  // 6. RADICALLY INDEPENDENT MADANI DATASET (Quranpedia API)
  // =========================================================================
  const madaniDataset: IndependentMushafDataset = useMemo(() => {
    const meta: MushafMetadata = {
      id: mushafMetaMadaniRaw.id || 4,
      type: 'madani',
      name: 'المصحف المدني',
      canonicalName: mushafMetaMadaniRaw.canonicalName || 'مصحف ورش عن نافع بالعد المدني',
      riwayah: mushafMetaMadaniRaw.riwayah || 'رواية ورش عن نافع بالعد المدني',
      countSystem: mushafMetaMadaniRaw.countSystem || 'العد المدني (المدني الأخير: 6,214 آية)',
      totalVerses: mushafMetaMadaniRaw.totalVerses || 6214,
      totalWords: mushafMetaMadaniRaw.totalWords || 77425,
      totalChars: mushafMetaMadaniRaw.totalChars || 335158,
      description: mushafMetaMadaniRaw.description || 'المصحف الشريف برواية ورش عن نافع المدني بالرسم العثماني المعتمد وفق العد المدني الأخير.',
      rawi: mushafMetaMadaniRaw.rawi || 'عثمان بن سعيد (ورش) عن نافع بن عبد الرحمن المدني',
      source: mushafMetaMadaniRaw.source || 'Quranpedia API (https://api.quranpedia.net/v1/mushafs/4)'
    };

    return {
      meta,
      corpus: enrichCorpusWithNormalizedText(quranCorpusMadaniRaw),
      surahs: surahsMadaniRaw as unknown as SurahData[],
      letterStats: letterStatsMadaniRaw as unknown as LetterStatsData,
      similarityMatrix: similarityMatrixMadaniRaw as number[][],
      macroStats: macroStatsMadaniRaw as unknown as MacroStatsData
    };
  }, []);

  // =========================================================================
  // 7. ACTIVE DATASET: Switches completely with ZERO shared calculations!
  // =========================================================================
  const activeDataset = activeMushaf === 'madani' ? madaniDataset : kufiDataset;

  const statsDiff = {
    wordsDiff: 4,
    lettersDiff: 19,
    pureTotalWords: 77793,
    withFatihahTotalWords: 77797
  };

  return (
    <QuranCorpusContext.Provider
      value={{
        activeMushaf,
        setActiveMushaf,
        toggleActiveMushaf,
        isMushafLocked,
        setMushafLocked,
        activeMeta: activeDataset.meta,
        corpus: activeDataset.corpus,
        surahs: activeDataset.surahs,
        letterStats: activeDataset.letterStats,
        similarityMatrix: activeDataset.similarityMatrix,
        macroStats: activeDataset.macroStats,
        kufiDataset,
        madaniDataset,
        includeBasmalahInFatihah,
        setIncludeBasmalahInFatihah,
        toggleFatihahBasmalah,
        selectedReaderSurah,
        setSelectedReaderSurah,
        readingMode,
        setReadingMode,
        statsDiff,
        quranpediaStatus,
        refreshQuranpediaStatus
      }}
    >
      {children}
    </QuranCorpusContext.Provider>
  );
};

export const useQuranCorpus = () => {
  const context = useContext(QuranCorpusContext);
  if (!context) {
    throw new Error('useQuranCorpus must be used within a QuranCorpusProvider');
  }
  return context;
};

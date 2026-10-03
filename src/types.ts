export interface ClosestSurah {
  targetSurahNumber: number;
  targetSurahName: string;
  similarity: number;
  similarityRaw: number;
}

export interface TopWord {
  word: string;
  count: number;
  percentage: number;
}

export interface HistogramBin {
  range: string;
  min: number;
  max: number;
  count: number;
}

export interface VerseEnding {
  pattern: string;
  count: number;
  percentage: number;
}

export interface VerseRecord {
  numberInSurah: number;
  textUthmani: string;
  textPlain: string;
  wordCount: number;
  charCount: number;
  ending?: string;
}

export interface DiacriticsStats {
  fatha: number;
  damma: number;
  kasra: number;
  sukun: number;
  tanweenFath: number;
  tanweenDamm: number;
  tanweenKasr: number;
  shaddah: number;
  maddah: number;
  total: number;
}

export interface LetterFingerprint {
  plainCounts: Record<string, number>;
  plainPercentages: Record<string, number>;
  vocalizedCounts: Record<string, number>;
  vocalizedPercentages: Record<string, number>;
  absentLetters: string[];
  absentCount: number;
  totalLettersPlain: number;
  totalLettersVocalized: number;
}

export interface PcaCoordinate {
  x: number;
  y: number;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation?: string;
  revelationOrder?: number;
  revelationType: 'Meccan' | 'Medinan';
  isMeccan: boolean;
  totalAyahs: number;
  totalWords: number;
  totalChars: number;
  uniqueWordsCount: number;
  vocabularyDiversity: number;
  avgWordLength: number;
  avgAyahLengthWords: number;
  avgAyahLengthChars: number;
  verseLengthStdDev: number;
  isUniform: boolean;
  letters: LetterFingerprint;
  diacritics: DiacriticsStats;
  words: {
    topWords: TopWord[];
  };
  ayahs: {
    shortestAyah: VerseRecord;
    longestAyah: VerseRecord;
    histogramBins: HistogramBin[];
    verseEndings: VerseEnding[];
  };
  closestSurahs: ClosestSurah[];
  cluster: number;
  clusters: {
    k3: number;
    k4: number;
    k5: number;
    k6: number;
  };
  pcaCoordinates: PcaCoordinate;
}

export interface GlobalLetterStat {
  letter: string;
  name: string;
  maxSurah: {
    number: number;
    name: string;
    percentage: number;
    count: number;
  };
  minSurah: {
    number: number;
    name: string;
    percentage: number;
    count: number;
  };
  totalOccurrences: number;
  surahsWithZero: Array<{
    number: number;
    name: string;
  }>;
  surahsWithZeroCount: number;
}

export interface LetterStatsData {
  letters: string[];
  letterNames: Record<string, string>;
  globalStats: Record<string, GlobalLetterStat>;
}

export interface GroupStats {
  label: string;
  surahsCount: number;
  totalVerses: number;
  totalWords: number;
  totalChars: number;
  avgAyahLengthWords: number;
  avgAyahLengthChars: number;
  avgVocabDiversity: number;
  avgWordLength: number;
  avgVersesPerSurah: number;
  letterPercentages: Record<string, number>;
  topRhymes: VerseEnding[];
}

export interface MacroStatsData {
  meccan: GroupStats;
  medinan: GroupStats;
  totalSurahs: number;
  totalQuranVerses: number;
  totalQuranWords: number;
  totalQuranChars: number;
}

export interface QuranAyah {
  numberInSurah: number;
  numberInQuran: number;
  surahNumber?: number;
  surahName?: string;
  textUthmani: string;
  textSimple: string;
  textNormalized?: string;
  juz: number;
  page: number;
  numberInHafs?: number[];
}

export interface QuranSurahCorpus {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  isMeccan: boolean;
  totalAyahs: number;
  hasIndependentBasmalah: boolean;
  ayahs: QuranAyah[];
}

export type MushafType = 'kufi' | 'madani';

export interface MushafMetadata {
  id: number | string;
  type: MushafType;
  name: string;
  canonicalName: string;
  riwayah: string;
  countSystem: string;
  totalVerses: number;
  totalWords: number;
  totalChars: number;
  description: string;
  rawi: string;
  source: string;
}

export interface IndependentMushafDataset {
  meta: MushafMetadata;
  corpus: QuranSurahCorpus[];
  surahs: SurahData[];
  letterStats: LetterStatsData;
  similarityMatrix: number[][];
  macroStats: MacroStatsData;
}

export type ActiveTab = 
  // 1. المصحف والسور
  | 'dashboard'
  | 'quran-reader'
  | 'explorer' 
  | 'comparator'
  // 2. الحروف والصوتيات
  | 'letters-heatmap'
  | 'letters-comparator'
  | 'letters-extremes'
  | 'letters-phonetics'
  | 'letters-diacritics'
  | 'letters-cumulative'
  // 3. اللسانيات والإيقاع القرآني
  | 'verse-endings'
  | 'lexical-richness'
  | 'word-comparator'
  // 4. التشابه والعوائل وفواتح السور
  | 'openings-families'
  | 'similarity-matrix'
  | 'similarity-closest'
  | 'similarity-clusters'
  // 5. المقارنات والمصاحف
  | 'meccan-medinan'
  | 'mushaf-direct'
  | 'mushaf-diff-table'
  | 'mushaf-divergence';

export type WordMatchMode = 'lemma_affixes' | 'exact_plain' | 'exact_vocalized' | 'root_derivatives';

export interface WordFormVariant {
  surfaceClean: string;
  surfaceVocalizedSample: string;
  count: number;
  percentage: number;
  isExcluded?: boolean;
}

export interface WordOccurItem {
  wordIndex: number;
  tokenRaw: string;
  tokenClean: string;
}

export interface WordAyahMatch {
  surahNumber: number;
  surahName: string;
  isMeccan: boolean;
  verseNumber: number;
  juz: number;
  page: number;
  textUthmani: string;
  matchedWords: Record<string, WordOccurItem[]>; // wordQuery -> occurrences
}

export interface WordSingleStats {
  query: string;
  totalOccurrences: number;
  ayahCount: number;
  surahCount: number;
  meccanCount: number;
  medinanCount: number;
  firstOccurrence: { surah: number; surahName: string; ayah: number } | null;
  lastOccurrence: { surah: number; surahName: string; ayah: number } | null;
  variants?: WordFormVariant[];
}

export interface WordPairCooccurrence {
  wordA: string;
  wordB: string;
  sharedAyahCount: number;
  sharedSurahCount: number;
  jaccardSimilarity: number;
  minDistance: number | null;
  avgDistance: number | null;
  adjacentCount: number;
  sharedAyahs: WordAyahMatch[];
}

export interface WordAffixStats {
  query: string;
  totalTokens: number;
  prefixes: {
    bare: number;
    al: number;
    wa: number;
    fa: number;
    bi: number;
    li: number;
    ka: number;
    sa: number;
    compound: number;
    other: number;
  };
  suffixes: {
    bare: number;
    pronounHa: number;
    pronounKa: number;
    pronounYa: number;
    pluralNun: number;
    tanween: number;
    other: number;
  };
}

export interface WordDispersionSurahItem {
  surahNumber: number;
  surahName: string;
  isMeccan: boolean;
  totalAyahs: number;
  wordCounts: Record<string, number>;
  totalMatched: number;
  isShared: boolean;
}

export interface SurahWordBreakdownRow {
  surahNumber: number;
  surahName: string;
  isMeccan: boolean;
  totalAyahs: number;
  totalWords: number;
  counts: Record<string, number>;
  totalMatchedWords: number;
  hasAllWords: boolean;
}

export interface WordComparisonReport {
  words: string[];
  matchMode: WordMatchMode;
  scope: 'all' | 'meccan' | 'medinan';
  singleStats: WordSingleStats[];
  cooccurrences: WordPairCooccurrence[];
  affixStats: WordAffixStats[];
  dispersionSurahs: WordDispersionSurahItem[];
  surahRows: SurahWordBreakdownRow[];
  matchingAyahs: WordAyahMatch[];
}



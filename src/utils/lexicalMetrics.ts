import { QuranSurahCorpus } from '../types';
import { normalizeArabicText, toCanonicalLexicalLemma, cleanQuranicWord } from './arabic';
import { 
  ARABIC_PREPOSITIONS, 
  ARABIC_CONJUNCTIONS, 
  ARABIC_PARTICLES, 
  ARABIC_PRONOUNS_AND_RELATIVES 
} from './lexicalFilters';

export interface ZipfPoint {
  rank: number;
  word: string;
  count: number;
  logRank: number;
  logCount: number;
  theoreticalZipf: number;
}

export interface WordVariantCount {
  variant: string;
  count: number;
}

export interface SurahLexicalAnalysis {
  surahNumber: number;
  surahName: string;
  totalTokens: number; // N (total word occurrences)
  uniqueTypes: number; // V (distinct vocabulary count)
  ttr: number; // Type-Token Ratio (V / N * 100)
  guiraudIndex: number; // V / sqrt(N)
  shannonEntropy: number; // H in bits
  normalizedEntropy: number; // H / log2(V)
  hapaxCount: number; // Words appearing exactly once
  hapaxPercentage: number;
  topWords: { 
    word: string; 
    count: number; 
    percentage: number; 
    rank: number;
    variants?: WordVariantCount[];
  }[];
  zipfCurve: ZipfPoint[];
  zipfSlope: number; // Empirical power-law exponent (ideally near -1.0)
  zipfR2: number; // Coefficient of determination (0 to 1)
  stopwordsExcludedCount?: number;
  unifyLemmas?: boolean;
  rawWordCounts?: Record<string, number>;
  rawWordVariants?: Record<string, Record<string, number>>;
}

export interface QuranGlobalLexicalStats {
  totalTokens: number;
  uniqueTypes: number;
  ttr: number;
  globalEntropy: number;
  topWords: { 
    word: string; 
    count: number; 
    percentage: number; 
    rank: number;
    variants?: WordVariantCount[];
  }[];
  surahRankings: {
    surahNumber: number;
    surahName: string;
    totalTokens: number;
    uniqueTypes: number;
    ttr: number;
    entropy: number;
    guiraudIndex: number;
  }[];
}

// Combined Stopwords / Function Words Set
const ALL_STOPWORDS_SET = new Set<string>([
  ...Array.from(ARABIC_PREPOSITIONS),
  ...Array.from(ARABIC_CONJUNCTIONS),
  ...Array.from(ARABIC_PARTICLES),
  ...Array.from(ARABIC_PRONOUNS_AND_RELATIVES)
]);

export function isArabicFunctionWord(word: string): boolean {
  if (!word) return false;
  const clean = word.trim();
  const normalized = normalizeArabicText(clean);
  const lemma = toCanonicalLexicalLemma(clean);
  return ALL_STOPWORDS_SET.has(clean) || 
         ALL_STOPWORDS_SET.has(normalized) ||
         ALL_STOPWORDS_SET.has(lemma);
}

// Caches for lightning-fast repeated queries and zero-latency toggle transitions
const cleanWordCache = new Map<string, string>();
const lemmaCache = new Map<string, string>();
const surahAnalysisCache = new Map<string, SurahLexicalAnalysis>();
const globalLexiconCache = new Map<string, QuranGlobalLexicalStats>();

function getCachedCleanWord(raw: string): string {
  let res = cleanWordCache.get(raw);
  if (res === undefined) {
    res = cleanQuranicWord(raw);
    cleanWordCache.set(raw, res);
  }
  return res;
}

function getCachedLemma(clean: string, unify: boolean): string {
  if (!unify) {
    return normalizeArabicText(clean);
  }
  let res = lemmaCache.get(clean);
  if (res === undefined) {
    res = toCanonicalLexicalLemma(clean);
    lemmaCache.set(clean, res);
  }
  return res;
}

export function analyzeSurahLexiconAdvanced(
  surah: QuranSurahCorpus, 
  excludeStopwords: boolean = false,
  unifyLemmas: boolean = true
): SurahLexicalAnalysis {
  const ayahs = surah.ayahs || [];
  const cacheKey = `${surah.number}_${excludeStopwords ? 1 : 0}_${unifyLemmas ? 1 : 0}_${ayahs.length}`;
  const cached = surahAnalysisCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const wordCounts: Record<string, number> = {};
  const wordVariants: Record<string, Record<string, number>> = {};
  let totalTokens = 0;
  let stopwordsExcludedCount = 0;

  ayahs.forEach(ayah => {
    const text = ayah.textUthmani || ayah.textSimple || '';
    const rawTokens = text.replace(/[\u06DD\u06DE\uFD3E\uFD3F\d\(\)\[\]«»]/g, ' ').split(/\s+/).filter(Boolean);
    rawTokens.forEach(t => {
      const clean = getCachedCleanWord(t);
      // السماح بالحروف المقطعة الأحادية القرآنية (ص، ق، ن) ككلمات معجمية مستقلة
      if (!clean || (clean.length < 2 && !/[صقن]/.test(clean))) return;

      const lemma = getCachedLemma(clean, unifyLemmas);
      if (!lemma || (lemma.length < 2 && !/[صقن]/.test(lemma))) return;

      if (excludeStopwords && isArabicFunctionWord(lemma)) {
        stopwordsExcludedCount++;
        return;
      }

      wordCounts[lemma] = (wordCounts[lemma] || 0) + 1;
      totalTokens++;

      if (!wordVariants[lemma]) {
        wordVariants[lemma] = {};
      }
      wordVariants[lemma][clean] = (wordVariants[lemma][clean] || 0) + 1;
    });
  });

  const uniqueTypes = Object.keys(wordCounts).length;
  const ttr = totalTokens > 0 ? Number(((uniqueTypes / totalTokens) * 100).toFixed(1)) : 0;
  const guiraudIndex = totalTokens > 0 ? Number((uniqueTypes / Math.sqrt(totalTokens)).toFixed(2)) : 0;

  // Shannon Information Entropy: H = - sum(p * log2(p))
  let shannonEntropy = 0;
  let hapaxCount = 0;
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1]);

  sortedWords.forEach(([_, count]) => {
    if (count === 1) hapaxCount++;
    const p = count / (totalTokens || 1);
    if (p > 0) {
      shannonEntropy += -p * Math.log2(p);
    }
  });

  const normalizedEntropy = uniqueTypes > 1 
    ? Number((shannonEntropy / Math.log2(uniqueTypes)).toFixed(3)) 
    : 1;

  const hapaxPercentage = uniqueTypes > 0 
    ? Number(((hapaxCount / uniqueTypes) * 100).toFixed(1)) 
    : 0;

  // Zipf Curve & Regression calculation
  const maxRank = Math.min(sortedWords.length, 50);
  const f1 = sortedWords[0] ? sortedWords[0][1] : 1;
  const zipfCurve: ZipfPoint[] = [];

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  const nPoints = maxRank;

  sortedWords.slice(0, maxRank).forEach(([word, count], idx) => {
    const rank = idx + 1;
    const logRank = Number(Math.log10(rank).toFixed(3));
    const logCount = Number(Math.log10(count).toFixed(3));
    const theoreticalZipf = Number((f1 / rank).toFixed(1));

    zipfCurve.push({
      rank,
      word,
      count,
      logRank,
      logCount,
      theoreticalZipf
    });

    sumX += logRank;
    sumY += logCount;
    sumXY += logRank * logCount;
    sumX2 += logRank * logRank;
    sumY2 += logCount * logCount;
  });

  // Linear regression slope & R2 for log(rank) vs log(count)
  let zipfSlope = -1.0;
  let zipfR2 = 0.95;
  if (nPoints > 2) {
    const denom = (nPoints * sumX2 - sumX * sumX);
    if (denom !== 0) {
      zipfSlope = Number(((nPoints * sumXY - sumX * sumY) / denom).toFixed(2));
      const numerator = Math.pow(nPoints * sumXY - sumX * sumY, 2);
      const denomR2 = denom * (nPoints * sumY2 - sumY * sumY);
      if (denomR2 > 0) {
        zipfR2 = Number((numerator / denomR2).toFixed(3));
      }
    }
  }

  const topWords = sortedWords.slice(0, 30).map(([word, count], idx) => {
    const vMap = wordVariants[word];
    const variants: WordVariantCount[] | undefined = vMap && Object.keys(vMap).length > 1
      ? Object.entries(vMap)
          .map(([variant, vCount]) => ({ variant, count: vCount }))
          .sort((a, b) => b.count - a.count)
      : undefined;

    return {
      word,
      count,
      percentage: totalTokens > 0 ? Number(((count / totalTokens) * 100).toFixed(2)) : 0,
      rank: idx + 1,
      variants
    };
  });

  const result: SurahLexicalAnalysis = {
    surahNumber: surah.number,
    surahName: surah.name,
    totalTokens,
    uniqueTypes,
    ttr,
    guiraudIndex,
    shannonEntropy: Number(shannonEntropy.toFixed(2)),
    normalizedEntropy,
    hapaxCount,
    hapaxPercentage,
    topWords,
    zipfCurve,
    zipfSlope,
    zipfR2,
    stopwordsExcludedCount,
    unifyLemmas,
    rawWordCounts: wordCounts,
    rawWordVariants: wordVariants
  };

  surahAnalysisCache.set(cacheKey, result);
  return result;
}

export function computeGlobalQuranLexicon(
  corpus: QuranSurahCorpus[],
  excludeStopwords: boolean = false,
  unifyLemmas: boolean = true
): QuranGlobalLexicalStats {
  const globalCacheKey = `${corpus.length}_${excludeStopwords ? 1 : 0}_${unifyLemmas ? 1 : 0}_${corpus[0]?.ayahs?.length || 0}`;
  const cachedGlobal = globalLexiconCache.get(globalCacheKey);
  if (cachedGlobal) {
    return cachedGlobal;
  }

  const globalCounts: Record<string, number> = {};
  const globalVariants: Record<string, Record<string, number>> = {};
  let totalTokens = 0;
  const surahRankings: QuranGlobalLexicalStats['surahRankings'] = [];

  corpus.forEach(surah => {
    const analysis = analyzeSurahLexiconAdvanced(surah, excludeStopwords, unifyLemmas);
    surahRankings.push({
      surahNumber: surah.number,
      surahName: surah.name,
      totalTokens: analysis.totalTokens,
      uniqueTypes: analysis.uniqueTypes,
      ttr: analysis.ttr,
      entropy: analysis.shannonEntropy,
      guiraudIndex: analysis.guiraudIndex
    });

    if (analysis.rawWordCounts) {
      for (const [w, count] of Object.entries(analysis.rawWordCounts)) {
        globalCounts[w] = (globalCounts[w] || 0) + count;
        totalTokens += count;
      }
    }
    if (analysis.rawWordVariants) {
      for (const [lemma, vMap] of Object.entries(analysis.rawWordVariants)) {
        if (!globalVariants[lemma]) {
          globalVariants[lemma] = {};
        }
        for (const [clean, cCount] of Object.entries(vMap)) {
          globalVariants[lemma][clean] = (globalVariants[lemma][clean] || 0) + cCount;
        }
      }
    }
  });

  const uniqueTypes = Object.keys(globalCounts).length;
  const ttr = totalTokens > 0 ? Number(((uniqueTypes / totalTokens) * 100).toFixed(2)) : 0;

  let globalEntropy = 0;
  const sortedGlobal = Object.entries(globalCounts).sort((a, b) => b[1] - a[1]);
  sortedGlobal.forEach(([_, count]) => {
    const p = count / (totalTokens || 1);
    if (p > 0) globalEntropy += -p * Math.log2(p);
  });

  const topWords = sortedGlobal.slice(0, 30).map(([word, count], idx) => {
    const vMap = globalVariants[word];
    const variants: WordVariantCount[] | undefined = vMap && Object.keys(vMap).length > 1
      ? Object.entries(vMap)
          .map(([variant, vCount]) => ({ variant, count: vCount }))
          .sort((a, b) => b.count - a.count)
      : undefined;

    return {
      word,
      count,
      percentage: Number(((count / totalTokens) * 100).toFixed(2)),
      rank: idx + 1,
      variants
    };
  });

  const result: QuranGlobalLexicalStats = {
    totalTokens,
    uniqueTypes,
    ttr,
    globalEntropy: Number(globalEntropy.toFixed(2)),
    topWords,
    surahRankings: surahRankings.sort((a, b) => b.ttr - a.ttr)
  };

  globalLexiconCache.set(globalCacheKey, result);
  return result;
}


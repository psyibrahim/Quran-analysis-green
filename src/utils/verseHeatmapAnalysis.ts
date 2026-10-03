import { QuranAyah } from '../types';

export type HeatmapMetricKey = 
  | 'wordCount' 
  | 'frequencyScore' 
  | 'avgFrequencyScore' 
  | 'topKeywordsCount' 
  | 'charCount'
  | 'lexicalDensity';

export interface VerseWordItem {
  raw: string;
  clean: string;
  countInSurah: number;
  isTopKeyword: boolean;
  isHapax: boolean; // appears only once in the surah
}

export interface VerseHeatmapItem {
  verseNumber: number;
  juz: number;
  page: number;
  textUthmani: string;
  textSimple: string;
  snippet: string;
  words: VerseWordItem[];
  wordCount: number;
  charCount: number;
  lexicalDensity: number; // chars per word
  frequencyScore: number; // sum of surah frequencies of all words in this verse
  avgFrequencyScore: number; // frequencyScore / wordCount (normalized commonality)
  uniqueWordsCount: number;
  topKeywordsCount: number;
  rareWordsCount: number; // words appearing only once
  
  // Normalized values (calculated based on chosen active metric)
  metricValue: number;
  normalizedScore: number; // 0.0 to 1.0
  intensityTier: 'low' | 'moderate' | 'high' | 'peak';
  rankInSurah: number; // 1 = highest intensity
  percentile: number; // 0 to 100%
}

export interface HeatmapAnalysisResult {
  items: VerseHeatmapItem[];
  metricKey: HeatmapMetricKey;
  totalVerses: number;
  totalWords: number;
  uniqueVocabularyCount: number;
  minVal: number;
  maxVal: number;
  avgVal: number;
  stdDev: number;
  peakVerseNumber: number;
  lowestVerseNumber: number;
  topVerses: VerseHeatmapItem[];
  bottomVerses: VerseHeatmapItem[];
  topKeywords: Array<{ clean: string; sampleRaw: string; count: number }>;
}

export function cleanArabicWord(word: string): string {
  if (!word) return '';
  // Strip diacritics / tashkeel and quranic symbols
  let cleaned = word.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '');
  // Strip punctuation and special Quranic stop signs
  cleaned = cleaned.replace(/[.,،:؛!؟"'\(\)«»\-_\/\\\[\]۝۩۞]/g, '');
  // Normalize letters for lemma grouping
  cleaned = cleaned.replace(/[أإآٱ]/g, 'ا');
  cleaned = cleaned.replace(/ة/g, 'ه');
  cleaned = cleaned.replace(/ى/g, 'ي');
  return cleaned.trim();
}

export function analyzeSurahVerseHeatmap(
  ayahs: QuranAyah[],
  metricKey: HeatmapMetricKey = 'wordCount'
): HeatmapAnalysisResult {
  if (!ayahs || ayahs.length === 0) {
    return {
      items: [],
      metricKey,
      totalVerses: 0,
      totalWords: 0,
      uniqueVocabularyCount: 0,
      minVal: 0,
      maxVal: 0,
      avgVal: 0,
      stdDev: 0,
      peakVerseNumber: 1,
      lowestVerseNumber: 1,
      topVerses: [],
      bottomVerses: [],
      topKeywords: []
    };
  }

  // 1. Build Surah-Wide Vocabulary Frequency Map
  const vocabFreq = new Map<string, { count: number; sampleRaw: string }>();

  ayahs.forEach(ayah => {
    const rawTokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/).filter(Boolean);
    const rawWords = rawTokens.filter(rw => /[\u0621-\u064A\u0671\u0670]/.test(rw));
    rawWords.forEach(rw => {
      const clean = cleanArabicWord(rw);
      if (!clean) return;
      const existing = vocabFreq.get(clean);
      if (existing) {
        existing.count++;
      } else {
        vocabFreq.set(clean, { count: 1, sampleRaw: rw });
      }
    });
  });

  // Top 10 Keywords in the Surah
  const sortedKeywords = Array.from(vocabFreq.entries())
    .map(([clean, data]) => ({ clean, sampleRaw: data.sampleRaw, count: data.count }))
    .sort((a, b) => b.count - a.count);

  const top10KeywordsSet = new Set(sortedKeywords.slice(0, 10).map(k => k.clean));

  // 2. Process each Ayah
  let totalSurahWords = 0;

  const rawItems = ayahs.map((ayah) => {
    const rawTokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/).filter(Boolean);
    // استبعاد علامات الوقف والترقيم المعزولة حتى لا تُحسب ككلمات مستقلة
    const rawWords = rawTokens.filter(rw => /[\u0621-\u064A\u0671\u0670]/.test(rw));
    const wordsCount = rawWords.length;
    totalSurahWords += wordsCount;

    // Calculate characters (excluding tashkeel for fair comparison)
    const plainText = (ayah.textSimple || ayah.textUthmani || '').replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '');
    const cleanCharsOnly = plainText.replace(/[^ء-ي]/g, '');
    const charCount = cleanCharsOnly.length;
    const lexicalDensity = wordsCount > 0 ? Number((charCount / wordsCount).toFixed(2)) : 0;

    const verseWordItems: VerseWordItem[] = [];
    let frequencyScore = 0;
    let topKeywordsCount = 0;
    let rareWordsCount = 0;
    const distinctSet = new Set<string>();

    rawWords.forEach(rw => {
      const clean = cleanArabicWord(rw);
      const freq = vocabFreq.get(clean)?.count || 1;
      frequencyScore += freq;
      distinctSet.add(clean);
      const isTopKeyword = top10KeywordsSet.has(clean);
      if (isTopKeyword) topKeywordsCount++;
      if (freq === 1) rareWordsCount++;

      verseWordItems.push({
        raw: rw,
        clean,
        countInSurah: freq,
        isTopKeyword,
        isHapax: freq === 1
      });
    });

    const avgFrequencyScore = wordsCount > 0 ? Number((frequencyScore / wordsCount).toFixed(2)) : 0;
    const snippet = rawWords.slice(0, 8).join(' ') + (rawWords.length > 8 ? '...' : '');

    return {
      verseNumber: ayah.numberInSurah,
      juz: ayah.juz || 1,
      page: ayah.page || 1,
      textUthmani: ayah.textUthmani,
      textSimple: ayah.textSimple,
      snippet,
      words: verseWordItems,
      wordCount: wordsCount,
      charCount,
      lexicalDensity,
      frequencyScore,
      avgFrequencyScore,
      uniqueWordsCount: distinctSet.size,
      topKeywordsCount,
      rareWordsCount,
      metricValue: 0,
      normalizedScore: 0,
      intensityTier: 'low' as const,
      rankInSurah: 0,
      percentile: 0
    };
  });

  // 3. Extract Chosen Metric Values and Compute Statistical Distribution
  const metricValues = rawItems.map(item => {
    switch (metricKey) {
      case 'wordCount': return item.wordCount;
      case 'frequencyScore': return item.frequencyScore;
      case 'avgFrequencyScore': return item.avgFrequencyScore;
      case 'topKeywordsCount': return item.topKeywordsCount;
      case 'charCount': return item.charCount;
      case 'lexicalDensity': return item.lexicalDensity;
      default: return item.wordCount;
    }
  });

  const minVal = Math.min(...metricValues);
  const maxVal = Math.max(...metricValues);
  const sum = metricValues.reduce((acc, v) => acc + v, 0);
  const avgVal = Number((sum / Math.max(1, metricValues.length)).toFixed(2));

  // Variance & Standard Deviation
  const variance = metricValues.reduce((acc, v) => acc + Math.pow(v - avgVal, 2), 0) / Math.max(1, metricValues.length);
  const stdDev = Number(Math.sqrt(variance).toFixed(2));

  const range = maxVal - minVal;

  // 4. Rank items for ordinal ranking
  const sortedIndices = metricValues
    .map((val, idx) => ({ val, idx, verseNum: rawItems[idx].verseNumber }))
    .sort((a, b) => b.val - a.val || a.verseNum - b.verseNum);

  const rankMap = new Map<number, number>();
  sortedIndices.forEach((s, rank) => {
    rankMap.set(s.idx, rank + 1);
  });

  // 5. Finalize normalized items
  const items: VerseHeatmapItem[] = rawItems.map((item, idx) => {
    const val = metricValues[idx];
    const normalizedScore = range > 0 ? Number(((val - minVal) / range).toFixed(3)) : 0.5;
    const rankInSurah = rankMap.get(idx) || (idx + 1);
    const percentile = Number((((rawItems.length - rankInSurah + 1) / rawItems.length) * 100).toFixed(1));

    let intensityTier: 'low' | 'moderate' | 'high' | 'peak' = 'low';
    if (normalizedScore >= 0.85) {
      intensityTier = 'peak';
    } else if (normalizedScore >= 0.60) {
      intensityTier = 'high';
    } else if (normalizedScore >= 0.30) {
      intensityTier = 'moderate';
    } else {
      intensityTier = 'low';
    }

    return {
      ...item,
      metricValue: val,
      normalizedScore,
      intensityTier,
      rankInSurah,
      percentile
    };
  });

  // Hotspots and Lowest items
  const sortedByIntensity = [...items].sort((a, b) => b.metricValue - a.metricValue);
  const topVerses = sortedByIntensity.slice(0, 5);
  const bottomVerses = [...items].sort((a, b) => a.metricValue - b.metricValue).slice(0, 5);
  const peakVerseNumber = topVerses[0]?.verseNumber || 1;
  const lowestVerseNumber = bottomVerses[0]?.verseNumber || 1;

  return {
    items,
    metricKey,
    totalVerses: ayahs.length,
    totalWords: totalSurahWords,
    uniqueVocabularyCount: vocabFreq.size,
    minVal,
    maxVal,
    avgVal,
    stdDev,
    peakVerseNumber,
    lowestVerseNumber,
    topVerses,
    bottomVerses,
    topKeywords: sortedKeywords.slice(0, 10)
  };
}

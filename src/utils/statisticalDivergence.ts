import { IndependentMushafDataset, SurahData } from '../types';

export interface LetterRankDivergence {
  letter: string;
  name: string;
  kufiCount: number;
  kufiPercentage: number;
  kufiRank: number;
  madaniCount: number;
  madaniPercentage: number;
  madaniRank: number;
  rankShift: number; // >0: ranked higher in Madani, <0: ranked higher in Kufi, 0: identical rank
  countDiff: number; // madaniCount - kufiCount
  percentageDiff: number; // madaniPercentage - kufiPercentage
  divergenceContribution: number; // relative contribution percentage (0-100%)
}

export interface SurahDivergenceRecord {
  surahNumber: number;
  surahName: string;
  englishName: string;
  isMeccan: boolean;
  kufiAyahs: number;
  madaniAyahs: number;
  ayahDiff: number;
  kufiWords: number;
  madaniWords: number;
  wordDiff: number;
  kufiChars: number;
  madaniChars: number;
  charDiff: number;
  kufiTTR: number;
  madaniTTR: number;
  ttrDiff: number;
  rankShiftsCount: number;
  spearmanRho: number;
  euclideanDistance: number;
  cosineSimilarity: number;
  divergenceScore: number; // Normalized 0 - 100 score
  divergenceLevel: 'identical' | 'minimal' | 'moderate' | 'high';
  topShiftedLetters: { letter: string; name: string; kufiRank: number; madaniRank: number; shift: number }[];
}

export interface MacroDivergenceMetrics {
  spearmanRankCorrelation: number;
  cosineSimilarity: number;
  cosineDistance: number;
  euclideanDistance: number;
  totalVariationDistance: number;
  jensenShannonDivergence: number;
  totalSurahsWithRankShifts: number;
  totalSurahsWithAyahDiff: number;
  totalSurahsWithWordDiff: number;
  totalAyahDiff: number;
  totalWordDiff: number;
  totalCharDiff: number;
  maxSurahDivergence: {
    surahNumber: number;
    surahName: string;
    divergenceScore: number;
    shifts: number;
  };
}

export const ARABIC_LETTERS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

export const ARABIC_LETTER_NAMES: Record<string, string> = {
  'ا': 'ألف', 'ب': 'باء', 'ت': 'تاء', 'ث': 'ثاء', 'ج': 'جيم', 'ح': 'حاء',
  'خ': 'خاء', 'د': 'دال', 'ذ': 'ذال', 'ر': 'راء', 'ز': 'زاي', 'س': 'سين',
  'ش': 'شين', 'ص': 'صاد', 'ض': 'ضاد', 'ط': 'طاء', 'ظ': 'ظاء', 'ع': 'عين',
  'غ': 'غين', 'ف': 'فاء', 'ق': 'قاف', 'ك': 'كاف', 'ل': 'لام', 'م': 'ميم',
  'ن': 'نون', 'ه': 'هاء', 'و': 'واو', 'ي': 'ياء'
};

/**
 * Calculates global letter rank, frequency, and divergence stats across the whole Quran.
 */
export function computeGlobalLetterDivergence(
  kufiDataset: IndependentMushafDataset,
  madaniDataset: IndependentMushafDataset
): LetterRankDivergence[] {
  const kTotal = kufiDataset.meta.totalChars || 1;
  const mTotal = madaniDataset.meta.totalChars || 1;

  // Build raw list
  const kufiList = ARABIC_LETTERS.map(l => ({
    letter: l,
    count: kufiDataset.letterStats.globalStats[l]?.totalOccurrences || 0
  })).sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));

  const madaniList = ARABIC_LETTERS.map(l => ({
    letter: l,
    count: madaniDataset.letterStats.globalStats[l]?.totalOccurrences || 0
  })).sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));

  const kufiRanks: Record<string, number> = {};
  kufiList.forEach((item, idx) => {
    kufiRanks[item.letter] = idx + 1;
  });

  const madaniRanks: Record<string, number> = {};
  madaniList.forEach((item, idx) => {
    madaniRanks[item.letter] = idx + 1;
  });

  // Calculate total squared diff for divergence contribution
  const diffs = ARABIC_LETTERS.map(l => {
    const kCount = kufiDataset.letterStats.globalStats[l]?.totalOccurrences || 0;
    const mCount = madaniDataset.letterStats.globalStats[l]?.totalOccurrences || 0;
    const kPct = (kCount / kTotal) * 100;
    const mPct = (mCount / mTotal) * 100;
    const absPctDiff = Math.abs(mPct - kPct);
    return { l, absPctDiff };
  });

  const sumAbsPctDiff = diffs.reduce((acc, cur) => acc + cur.absPctDiff, 0) || 1;

  return ARABIC_LETTERS.map(letter => {
    const kCount = kufiDataset.letterStats.globalStats[letter]?.totalOccurrences || 0;
    const mCount = madaniDataset.letterStats.globalStats[letter]?.totalOccurrences || 0;
    const kPct = parseFloat(((kCount / kTotal) * 100).toFixed(4));
    const mPct = parseFloat(((mCount / mTotal) * 100).toFixed(4));
    const kRank = kufiRanks[letter] || 28;
    const mRank = madaniRanks[letter] || 28;
    const rankShift = kRank - mRank; // If positive, Madani rank is smaller (higher priority)
    const countDiff = mCount - kCount;
    const percentageDiff = parseFloat((mPct - kPct).toFixed(4));
    const contribution = parseFloat(((Math.abs(mPct - kPct) / sumAbsPctDiff) * 100).toFixed(2));

    return {
      letter,
      name: ARABIC_LETTER_NAMES[letter] || letter,
      kufiCount: kCount,
      kufiPercentage: kPct,
      kufiRank: kRank,
      madaniCount: mCount,
      madaniPercentage: mPct,
      madaniRank: mRank,
      rankShift,
      countDiff,
      percentageDiff,
      divergenceContribution: contribution
    };
  }).sort((a, b) => a.kufiRank - b.kufiRank);
}

/**
 * Computes letter ranking and frequency shifts for a specific surah.
 */
export function computeSurahLetterDivergence(
  surahNumber: number,
  kufiDataset: IndependentMushafDataset,
  madaniDataset: IndependentMushafDataset
): {
  divergence: LetterRankDivergence[];
  shiftsCount: number;
  spearmanRho: number;
  euclideanDistance: number;
} {
  const kSurah = kufiDataset.surahs[surahNumber - 1];
  const mSurah = madaniDataset.surahs[surahNumber - 1];

  const kTotal = kSurah?.totalChars || 1;
  const mTotal = mSurah?.totalChars || 1;

  const kCounts = ARABIC_LETTERS.map(l => ({
    letter: l,
    count: kSurah?.letters?.plainCounts?.[l] || 0
  })).sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));

  const mCounts = ARABIC_LETTERS.map(l => ({
    letter: l,
    count: mSurah?.letters?.plainCounts?.[l] || 0
  })).sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter));

  const kRanks: Record<string, number> = {};
  kCounts.forEach((x, idx) => {
    kRanks[x.letter] = idx + 1;
  });

  const mRanks: Record<string, number> = {};
  mCounts.forEach((x, idx) => {
    mRanks[x.letter] = idx + 1;
  });

  let shiftsCount = 0;
  let sumSqRankDiff = 0;
  let euclideanSum = 0;

  const diffs = ARABIC_LETTERS.map(l => {
    const kCount = kSurah?.letters?.plainCounts?.[l] || 0;
    const mCount = mSurah?.letters?.plainCounts?.[l] || 0;
    const kPct = (kCount / kTotal) * 100;
    const mPct = (mCount / mTotal) * 100;
    const kRank = kRanks[l];
    const mRank = mRanks[l];
    const diff = kRank - mRank;

    if (diff !== 0) shiftsCount++;
    sumSqRankDiff += diff * diff;

    const pK = kCount / kTotal;
    const pM = mCount / mTotal;
    euclideanSum += (pK - pM) * (pK - pM);

    return { l, absPctDiff: Math.abs(mPct - kPct) };
  });

  const sumAbsPctDiff = diffs.reduce((acc, cur) => acc + cur.absPctDiff, 0) || 1;
  const n = 28;
  const spearmanRho = parseFloat((1 - (6 * sumSqRankDiff) / (n * (n * n - 1))).toFixed(4));
  const euclideanDistance = parseFloat((Math.sqrt(euclideanSum) * 100).toFixed(4));

  const divergence: LetterRankDivergence[] = ARABIC_LETTERS.map(letter => {
    const kCount = kSurah?.letters?.plainCounts?.[letter] || 0;
    const mCount = mSurah?.letters?.plainCounts?.[letter] || 0;
    const kPct = parseFloat(((kCount / kTotal) * 100).toFixed(3));
    const mPct = parseFloat(((mCount / mTotal) * 100).toFixed(3));
    const kRank = kRanks[letter];
    const mRank = mRanks[letter];
    const rankShift = kRank - mRank;
    const countDiff = mCount - kCount;
    const percentageDiff = parseFloat((mPct - kPct).toFixed(3));
    const contribution = parseFloat(((Math.abs(mPct - kPct) / sumAbsPctDiff) * 100).toFixed(2));

    return {
      letter,
      name: ARABIC_LETTER_NAMES[letter] || letter,
      kufiCount: kCount,
      kufiPercentage: kPct,
      kufiRank: kRank,
      madaniCount: mCount,
      madaniPercentage: mPct,
      madaniRank: mRank,
      rankShift,
      countDiff,
      percentageDiff,
      divergenceContribution: contribution
    };
  }).sort((a, b) => a.kufiRank - b.kufiRank);

  return { divergence, shiftsCount, spearmanRho, euclideanDistance };
}

/**
 * Computes the complete 114 Surahs Statistical Divergence Matrix.
 */
export function computeAllSurahsDivergenceMatrix(
  kufiDataset: IndependentMushafDataset,
  madaniDataset: IndependentMushafDataset
): SurahDivergenceRecord[] {
  return kufiDataset.surahs.map((kSurah, idx) => {
    const mSurah = madaniDataset.surahs[idx];
    const surahNumber = kSurah.number;
    const surahName = kSurah.name;
    const englishName = kSurah.englishName;
    const isMeccan = kSurah.isMeccan;

    const ayahDiff = mSurah.totalAyahs - kSurah.totalAyahs;
    const wordDiff = mSurah.totalWords - kSurah.totalWords;
    const charDiff = mSurah.totalChars - kSurah.totalChars;
    const ttrDiff = parseFloat((mSurah.vocabularyDiversity - kSurah.vocabularyDiversity).toFixed(2));

    const { divergence, shiftsCount, spearmanRho, euclideanDistance } = computeSurahLetterDivergence(
      surahNumber,
      kufiDataset,
      madaniDataset
    );

    // Vector cosine similarity between normalized letter distributions
    let dotProduct = 0;
    let normK = 0;
    let normM = 0;
    divergence.forEach(item => {
      dotProduct += item.kufiPercentage * item.madaniPercentage;
      normK += item.kufiPercentage * item.kufiPercentage;
      normM += item.madaniPercentage * item.madaniPercentage;
    });
    const denom = Math.sqrt(normK) * Math.sqrt(normM);
    const cosineSimilarity = denom > 0 ? parseFloat((dotProduct / denom).toFixed(5)) : 1;

    // Composite divergence score (0 to 100)
    // Factors:
    // 1. Ayah difference relative impact (weight: 35%)
    // 2. Letter profile distance (weight: 35%)
    // 3. Letter rank shifts (weight: 20%)
    // 4. Word count relative difference (weight: 10%)
    const ayahFactor = Math.min(100, Math.abs(ayahDiff) * 25);
    const letterFactor = Math.min(100, euclideanDistance * 18);
    const rankShiftFactor = Math.min(100, (shiftsCount / 10) * 100);
    const wordFactor = Math.min(100, (Math.abs(wordDiff) / (kSurah.totalWords || 1)) * 300);

    const rawScore = 0.35 * ayahFactor + 0.35 * letterFactor + 0.20 * rankShiftFactor + 0.10 * wordFactor;
    const divergenceScore = parseFloat(Math.min(100, Math.max(0, rawScore)).toFixed(1));

    let divergenceLevel: 'identical' | 'minimal' | 'moderate' | 'high' = 'identical';
    if (divergenceScore === 0 && ayahDiff === 0 && wordDiff === 0 && shiftsCount === 0) {
      divergenceLevel = 'identical';
    } else if (divergenceScore < 15) {
      divergenceLevel = 'minimal';
    } else if (divergenceScore < 40) {
      divergenceLevel = 'moderate';
    } else {
      divergenceLevel = 'high';
    }

    const topShiftedLetters = divergence
      .filter(d => d.rankShift !== 0)
      .map(d => ({
        letter: d.letter,
        name: d.name,
        kufiRank: d.kufiRank,
        madaniRank: d.madaniRank,
        shift: d.rankShift
      }))
      .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift))
      .slice(0, 4);

    return {
      surahNumber,
      surahName,
      englishName,
      isMeccan,
      kufiAyahs: kSurah.totalAyahs,
      madaniAyahs: mSurah.totalAyahs,
      ayahDiff,
      kufiWords: kSurah.totalWords,
      madaniWords: mSurah.totalWords,
      wordDiff,
      kufiChars: kSurah.totalChars,
      madaniChars: mSurah.totalChars,
      charDiff,
      kufiTTR: kSurah.vocabularyDiversity,
      madaniTTR: mSurah.vocabularyDiversity,
      ttrDiff,
      rankShiftsCount: shiftsCount,
      spearmanRho,
      euclideanDistance,
      cosineSimilarity,
      divergenceScore,
      divergenceLevel,
      topShiftedLetters
    };
  });
}

/**
 * Computes macro statistical divergence metrics across the entire corpus.
 */
export function computeMacroDivergenceMetrics(
  kufiDataset: IndependentMushafDataset,
  madaniDataset: IndependentMushafDataset,
  allSurahsRecords: SurahDivergenceRecord[]
): MacroDivergenceMetrics {
  const globalLetters = computeGlobalLetterDivergence(kufiDataset, madaniDataset);

  let sumSqRankDiff = 0;
  let dotProduct = 0;
  let normK = 0;
  let normM = 0;
  let euclideanSum = 0;
  let tvdSum = 0;
  let jsdSum = 0;

  const n = 28;
  globalLetters.forEach(item => {
    const diff = item.kufiRank - item.madaniRank;
    sumSqRankDiff += diff * diff;

    const pK = item.kufiPercentage / 100;
    const pM = item.madaniPercentage / 100;

    dotProduct += pK * pM;
    normK += pK * pK;
    normM += pM * pM;

    euclideanSum += (pK - pM) * (pK - pM);
    tvdSum += Math.abs(pK - pM);

    // Jensen-Shannon Divergence
    const pAvg = 0.5 * (pK + pM);
    if (pK > 0 && pAvg > 0) jsdSum += 0.5 * pK * Math.log2(pK / pAvg);
    if (pM > 0 && pAvg > 0) jsdSum += 0.5 * pM * Math.log2(pM / pAvg);
  });

  const spearmanRankCorrelation = parseFloat((1 - (6 * sumSqRankDiff) / (n * (n * n - 1))).toFixed(5));
  const denom = Math.sqrt(normK) * Math.sqrt(normM);
  const cosineSimilarity = denom > 0 ? parseFloat((dotProduct / denom).toFixed(6)) : 1;
  const cosineDistance = parseFloat((1 - cosineSimilarity).toExponential(3));
  const euclideanDistance = parseFloat(Math.sqrt(euclideanSum).toFixed(5));
  const totalVariationDistance = parseFloat((0.5 * tvdSum).toFixed(5));
  const jensenShannonDivergence = parseFloat(Math.max(0, jsdSum).toFixed(6));

  const totalSurahsWithRankShifts = allSurahsRecords.filter(s => s.rankShiftsCount > 0).length;
  const totalSurahsWithAyahDiff = allSurahsRecords.filter(s => s.ayahDiff !== 0).length;
  const totalSurahsWithWordDiff = allSurahsRecords.filter(s => s.wordDiff !== 0).length;

  const totalAyahDiff = madaniDataset.meta.totalVerses - kufiDataset.meta.totalVerses;
  const totalWordDiff = madaniDataset.meta.totalWords - kufiDataset.meta.totalWords;
  const totalCharDiff = madaniDataset.meta.totalChars - kufiDataset.meta.totalChars;

  const sortedByScore = [...allSurahsRecords].sort((a, b) => b.divergenceScore - a.divergenceScore);
  const maxSurah = sortedByScore[0] || { surahNumber: 1, surahName: 'الفاتحة', divergenceScore: 0, rankShiftsCount: 0 };

  return {
    spearmanRankCorrelation,
    cosineSimilarity,
    cosineDistance: typeof cosineDistance === 'number' ? cosineDistance : 0,
    euclideanDistance,
    totalVariationDistance,
    jensenShannonDivergence,
    totalSurahsWithRankShifts,
    totalSurahsWithAyahDiff,
    totalSurahsWithWordDiff,
    totalAyahDiff,
    totalWordDiff,
    totalCharDiff,
    maxSurahDivergence: {
      surahNumber: maxSurah.surahNumber,
      surahName: maxSurah.surahName,
      divergenceScore: maxSurah.divergenceScore,
      shifts: maxSurah.rankShiftsCount
    }
  };
}

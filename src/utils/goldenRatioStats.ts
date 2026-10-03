import { SurahData } from '../types';
import { PHI, PHI_INV } from './goldenRatio';

export interface GoldenTargetTier {
  key: 'phi-inv2' | 'phi-inv' | 'unity' | 'phi' | 'phi2' | 'phi3';
  label: string;
  nameArabic: string;
  factor: number;
  expectedWords: number;
  color: string;
}

export interface SurahGoldenStat {
  surahNumber: number;
  surahName: string;
  englishName: string;
  isMeccan: boolean;
  revelationType: 'Meccan' | 'Medinan';
  totalWords: number;
  totalAyahs: number;
  totalChars: number;
  ttr: number; // vocabularyDiversity
  avgAyahWords: number;
  
  // Proportionality relative to Quran mean
  ratioToMean: number; // totalWords / meanWords
  differenceFromMean: number; // totalWords - meanWords
  
  // Nearest Golden Level
  nearestTier: GoldenTargetTier;
  nearestTierFactor: number;
  deviationFromTier: number; // Math.abs(ratioToMean - nearestTierFactor)
  deviationPct: number; // percentage deviation from target
  convergencePct: number; // Math.max(0, 100 - deviationPct)
  
  // Specific Phi distances (compared directly to PHI = 1.618 and PHI_INV = 0.618)
  ratioToPhi: number; // ratioToMean / PHI
  phiConvergencePct: number; // convergence specifically to PHI (1.618)
  phiInvConvergencePct: number; // convergence specifically to 1/PHI (0.618)
  
  // Intra-surah Golden Ratio metrics
  internalGoldenAyah: number;
  internalGoldenWord: number;
  internalAyahsPhiRatio: number;
  internalAyahsPhiConvergence: number;
  
  // Harmony verdict
  harmonyTier: 'فائق الاتساق' | 'اتساق ذهبي مرتفع' | 'تناسب متوازن' | 'تفاوت إحصائي';
}

export interface QuranGoldenRatioGlobalStats {
  totalSurahs: number;
  totalWords: number;
  totalAyahs: number;
  meanWordsPerSurah: number;
  medianWordsPerSurah: number;
  stdDevWords: number;
  meanAyahsPerSurah: number;
  grandWordsToAyahsRatio: number;
  
  // Golden benchmarks for the Quran
  goldenWordsBenchmark: number; // PHI_INV * totalWords
  phiTimesMeanWords: number; // PHI * meanWords (~1099 words)
  phiInvTimesMeanWords: number; // PHI_INV * meanWords (~420 words)
  phi2TimesMeanWords: number; // PHI^2 * meanWords (~1779 words)
  phiInv2TimesMeanWords: number; // PHI^-2 * meanWords (~260 words)
  
  // Tiers definition
  goldenTiers: GoldenTargetTier[];
  
  // Surah list with enriched stats
  surahStats: SurahGoldenStat[];
  
  // Top Exemplars
  topPhiSurahs: SurahGoldenStat[]; // Closest to 1.618 * mean (~1099 words)
  topPhiInvSurahs: SurahGoldenStat[]; // Closest to 0.618 * mean (~420 words)
  topOverallConvergenceSurahs: SurahGoldenStat[]; // Highest convergence across all golden tiers
  
  // Global convergence score
  globalMeanConvergencePct: number;
  highConvergenceSurahsCount: number; // >= 80%
}

export function calculateQuranGoldenRatioStats(surahs: SurahData[]): QuranGoldenRatioGlobalStats {
  const totalSurahs = surahs.length || 114;
  const totalWords = surahs.reduce((acc, s) => acc + s.totalWords, 0);
  const totalAyahs = surahs.reduce((acc, s) => acc + s.totalAyahs, 0);
  
  const meanWordsPerSurah = Number((totalWords / totalSurahs).toFixed(2));
  const meanAyahsPerSurah = Number((totalAyahs / totalSurahs).toFixed(2));
  const grandWordsToAyahsRatio = Number((totalWords / Math.max(1, totalAyahs)).toFixed(2));
  
  // Median calculation
  const sortedWords = [...surahs].map(s => s.totalWords).sort((a, b) => a - b);
  const mid = Math.floor(sortedWords.length / 2);
  const medianWordsPerSurah = sortedWords.length % 2 !== 0
    ? sortedWords[mid]
    : Number(((sortedWords[mid - 1] + sortedWords[mid]) / 2).toFixed(1));
    
  // Standard Deviation
  const variance = surahs.reduce((acc, s) => acc + Math.pow(s.totalWords - meanWordsPerSurah, 2), 0) / totalSurahs;
  const stdDevWords = Number(Math.sqrt(variance).toFixed(2));
  
  // Benchmarks based on PHI
  const goldenWordsBenchmark = Math.round(totalWords * PHI_INV);
  const phiTimesMeanWords = Number((meanWordsPerSurah * PHI).toFixed(1));
  const phiInvTimesMeanWords = Number((meanWordsPerSurah * PHI_INV).toFixed(1));
  const phi2TimesMeanWords = Number((meanWordsPerSurah * (PHI * PHI)).toFixed(1));
  const phiInv2TimesMeanWords = Number((meanWordsPerSurah * (PHI_INV * PHI_INV)).toFixed(1));

  const goldenTiers: GoldenTargetTier[] = [
    {
      key: 'phi-inv2',
      label: '1/φ² (0.382)',
      nameArabic: 'المعكوس الذهبي التربيعي (1/φ²)',
      factor: Number((PHI_INV * PHI_INV).toFixed(4)), // ~0.3820
      expectedWords: phiInv2TimesMeanWords,
      color: '#16A34A' // Cyan
    },
    {
      key: 'phi-inv',
      label: '1/φ (0.618)',
      nameArabic: 'معكوس النسبة الذهبية (1/φ)',
      factor: Number(PHI_INV.toFixed(4)), // ~0.6180
      expectedWords: phiInvTimesMeanWords,
      color: '#2FA89D' // Teal / Brand green
    },
    {
      key: 'unity',
      label: 'φ⁰ (1.000)',
      nameArabic: 'المتوسط المتطابق (1.000)',
      factor: 1.000,
      expectedWords: meanWordsPerSurah,
      color: '#84CC16' // Purple
    },
    {
      key: 'phi',
      label: 'φ (1.618)',
      nameArabic: 'النسبة الذهبية المباشرة (φ)',
      factor: Number(PHI.toFixed(4)), // ~1.6180
      expectedWords: phiTimesMeanWords,
      color: '#f59e0b' // Amber/Gold
    },
    {
      key: 'phi2',
      label: 'φ² (2.618)',
      nameArabic: 'المربع الذهبي (φ²)',
      factor: Number((PHI * PHI).toFixed(4)), // ~2.6180
      expectedWords: phi2TimesMeanWords,
      color: '#10b981' // Emerald
    },
    {
      key: 'phi3',
      label: 'φ³ (4.236)',
      nameArabic: 'المكعب الذهبي (φ³)',
      factor: Number((PHI * PHI * PHI).toFixed(4)), // ~4.2361
      expectedWords: Number((meanWordsPerSurah * Math.pow(PHI, 3)).toFixed(1)),
      color: '#B8935F' // Pink
    }
  ];

  const surahStats: SurahGoldenStat[] = surahs.map((surah) => {
    const ratioToMean = Number((surah.totalWords / meanWordsPerSurah).toFixed(4));
    const differenceFromMean = surah.totalWords - meanWordsPerSurah;
    
    // Find nearest golden tier
    let bestTier = goldenTiers[0];
    let minDeviation = Math.abs(ratioToMean - bestTier.factor);
    
    for (let i = 1; i < goldenTiers.length; i++) {
      const tier = goldenTiers[i];
      const dev = Math.abs(ratioToMean - tier.factor);
      if (dev < minDeviation) {
        minDeviation = dev;
        bestTier = tier;
      }
    }
    
    const deviationFromTier = Number(minDeviation.toFixed(4));
    const deviationPct = Number(((deviationFromTier / bestTier.factor) * 100).toFixed(2));
    const convergencePct = Number(Math.max(0, 100 - deviationPct).toFixed(1));
    
    // Direct convergence to PHI (1.618)
    const phiDev = Math.abs(ratioToMean - PHI);
    const phiConvergencePct = Number(Math.max(0, 100 - (phiDev / PHI) * 100).toFixed(1));
    
    // Direct convergence to 1/PHI (0.618)
    const phiInvDev = Math.abs(ratioToMean - PHI_INV);
    const phiInvConvergencePct = Number(Math.max(0, 100 - (phiInvDev / PHI_INV) * 100).toFixed(1));
    
    // Internal Golden Cut
    const internalGoldenAyah = Math.max(1, Math.min(surah.totalAyahs, Math.round(surah.totalAyahs * PHI_INV)));
    const internalGoldenWord = Math.max(1, Math.min(surah.totalWords, Math.round(surah.totalWords * PHI_INV)));
    const majorAyahs = internalGoldenAyah;
    const minorAyahs = Math.max(1, surah.totalAyahs - internalGoldenAyah);
    const internalAyahsPhiRatio = Number((majorAyahs / minorAyahs).toFixed(4));
    const internalAyahsPhiConvergence = Number(Math.max(0, 100 - (Math.abs(internalAyahsPhiRatio - PHI) / PHI) * 100).toFixed(1));
    
    let harmonyTier: 'فائق الاتساق' | 'اتساق ذهبي مرتفع' | 'تناسب متوازن' | 'تفاوت إحصائي' = 'تفاوت إحصائي';
    if (convergencePct >= 90) {
      harmonyTier = 'فائق الاتساق';
    } else if (convergencePct >= 75) {
      harmonyTier = 'اتساق ذهبي مرتفع';
    } else if (convergencePct >= 60) {
      harmonyTier = 'تناسب متوازن';
    }
    
    return {
      surahNumber: surah.number,
      surahName: surah.name,
      englishName: surah.englishName,
      isMeccan: surah.isMeccan ?? (surah.revelationType === 'Meccan'),
      revelationType: surah.revelationType,
      totalWords: surah.totalWords,
      totalAyahs: surah.totalAyahs,
      totalChars: surah.totalChars,
      ttr: surah.vocabularyDiversity,
      avgAyahWords: Number((surah.totalWords / Math.max(1, surah.totalAyahs)).toFixed(2)),
      ratioToMean,
      differenceFromMean: Math.round(differenceFromMean),
      nearestTier: bestTier,
      nearestTierFactor: bestTier.factor,
      deviationFromTier,
      deviationPct,
      convergencePct,
      ratioToPhi: Number((ratioToMean / PHI).toFixed(3)),
      phiConvergencePct,
      phiInvConvergencePct,
      internalGoldenAyah,
      internalGoldenWord,
      internalAyahsPhiRatio,
      internalAyahsPhiConvergence,
      harmonyTier
    };
  });

  // Top exemplars
  const topPhiSurahs = [...surahStats]
    .sort((a, b) => b.phiConvergencePct - a.phiConvergencePct)
    .slice(0, 8);

  const topPhiInvSurahs = [...surahStats]
    .sort((a, b) => b.phiInvConvergencePct - a.phiInvConvergencePct)
    .slice(0, 8);

  const topOverallConvergenceSurahs = [...surahStats]
    .sort((a, b) => b.convergencePct - a.convergencePct)
    .slice(0, 12);

  const globalMeanConvergencePct = Number((
    surahStats.reduce((acc, s) => acc + s.convergencePct, 0) / surahStats.length
  ).toFixed(1));

  const highConvergenceSurahsCount = surahStats.filter(s => s.convergencePct >= 80).length;

  return {
    totalSurahs,
    totalWords,
    totalAyahs,
    meanWordsPerSurah,
    medianWordsPerSurah,
    stdDevWords,
    meanAyahsPerSurah,
    grandWordsToAyahsRatio,
    goldenWordsBenchmark,
    phiTimesMeanWords,
    phiInvTimesMeanWords,
    phi2TimesMeanWords,
    phiInv2TimesMeanWords,
    goldenTiers,
    surahStats,
    topPhiSurahs,
    topPhiInvSurahs,
    topOverallConvergenceSurahs,
    globalMeanConvergencePct,
    highConvergenceSurahsCount
  };
}

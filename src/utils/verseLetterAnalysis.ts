import { QuranAyah } from '../types';

export interface VerseLetterDensityItem {
  verseNumber: number;
  letterCount: number;
  totalLettersInVerse: number;
  wordCount: number;
  densityPercentage: number;
  textSnippet: string;
  textUthmani: string;
  isPeak: boolean;
}

export interface VerseLetterDistributionResult {
  letter: string; // e.g. 'ا', 'ل', 'م' or 'ALL'
  letterLabel: string;
  items: VerseLetterDensityItem[];
  totalOccurrences: number;
  versesWithLetter: number;
  versesWithoutLetter: number;
  maxOccurrenceInSingleVerse: number;
  peakVerseNumber: number;
  averagePerVerse: number;
}

// Normalize Arabic character for simple plain matching
export function normalizeArabicChar(char: string): string {
  // Strip tashkeel/harakat
  const stripped = char.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '');
  // Normalize Alef variants
  if (['أ', 'إ', 'آ', 'ٱ'].includes(stripped)) return 'ا';
  // Normalize Taa Marbuta / Haa
  if (stripped === 'ة') return 'ه';
  // Normalize Yaa / Alef Maqsura
  if (stripped === 'ى') return 'ي';
  return stripped;
}

export function analyzeVerseLetterDistribution(
  ayahs: QuranAyah[],
  targetLetter: string = 'ALL', // 'ALL' or a specific letter like 'ا', 'ب', etc.
  sortBy: 'verse-order' | 'frequency-desc' | 'frequency-asc' = 'verse-order'
): VerseLetterDistributionResult {
  if (!ayahs || ayahs.length === 0) {
    return {
      letter: targetLetter,
      letterLabel: targetLetter === 'ALL' ? 'كافة الحروف' : `حرف ${targetLetter}`,
      items: [],
      totalOccurrences: 0,
      versesWithLetter: 0,
      versesWithoutLetter: 0,
      maxOccurrenceInSingleVerse: 0,
      peakVerseNumber: 1,
      averagePerVerse: 0
    };
  }

  const normTarget = targetLetter === 'ALL' ? 'ALL' : normalizeArabicChar(targetLetter);

  let totalOccurrences = 0;
  let versesWithLetter = 0;
  let maxOccurrenceInSingleVerse = -1;
  let peakVerseNumber = 1;

  const rawItems: VerseLetterDensityItem[] = ayahs.map((ayah) => {
    const rawText = ayah.textSimple || ayah.textUthmani || '';
    // Clean text to only plain Arabic letters
    const plainText = rawText.replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, '');
    const cleanLettersOnly = plainText.replace(/[^ء-ي]/g, '');
    const totalLetters = cleanLettersOnly.length;
    const words = rawText.trim().split(/\s+/).filter(Boolean);

    let matchCount = 0;
    if (normTarget === 'ALL') {
      matchCount = totalLetters;
    } else {
      for (const ch of cleanLettersOnly) {
        if (normalizeArabicChar(ch) === normTarget) {
          matchCount++;
        }
      }
    }

    if (matchCount > 0) {
      versesWithLetter++;
    }
    if (matchCount > maxOccurrenceInSingleVerse) {
      maxOccurrenceInSingleVerse = matchCount;
      peakVerseNumber = ayah.numberInSurah;
    }
    totalOccurrences += matchCount;

    const densityPercentage = totalLetters > 0 
      ? Number(((matchCount / totalLetters) * 100).toFixed(1)) 
      : 0;

    const snippet = words.slice(0, 7).join(' ') + (words.length > 7 ? '...' : '');

    return {
      verseNumber: ayah.numberInSurah,
      letterCount: matchCount,
      totalLettersInVerse: totalLetters,
      wordCount: words.length,
      densityPercentage,
      textSnippet: snippet,
      textUthmani: ayah.textUthmani,
      isPeak: false
    };
  });

  // Mark peak items
  rawItems.forEach(item => {
    if (item.letterCount === maxOccurrenceInSingleVerse && maxOccurrenceInSingleVerse > 0) {
      item.isPeak = true;
    }
  });

  // Sort items
  const sortedItems = [...rawItems];
  if (sortBy === 'frequency-desc') {
    sortedItems.sort((a, b) => b.letterCount - a.letterCount || a.verseNumber - b.verseNumber);
  } else if (sortBy === 'frequency-asc') {
    sortedItems.sort((a, b) => a.letterCount - b.letterCount || a.verseNumber - b.verseNumber);
  } else {
    sortedItems.sort((a, b) => a.verseNumber - b.verseNumber);
  }

  const versesWithoutLetter = ayahs.length - versesWithLetter;
  const averagePerVerse = Number((totalOccurrences / Math.max(1, ayahs.length)).toFixed(2));

  return {
    letter: targetLetter,
    letterLabel: targetLetter === 'ALL' ? 'كافة الحروف (الكثافة العامة)' : `حرف «${targetLetter}»`,
    items: sortedItems,
    totalOccurrences,
    versesWithLetter,
    versesWithoutLetter,
    maxOccurrenceInSingleVerse,
    peakVerseNumber,
    averagePerVerse
  };
}

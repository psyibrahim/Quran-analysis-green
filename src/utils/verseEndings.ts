import { QuranSurahCorpus, QuranAyah } from '../types';
import { cleanArabicLetters, ARABIC_LETTER_NAMES } from './arabic';

export interface VerseEndingItem {
  verseNumber: number;
  lastWord: string;
  rawLastWord: string;
  rhymeLetter: string;
  rhymeLetterName: string;
  rhymeFamily: 'noon-meem' | 'alif' | 'ha-alif' | 'qalqalah' | 'ha' | 'ra' | 'other';
  harakah: string;
}

export interface RhymeFrequency {
  letter: string;
  letterName: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RhymeFamilyStats {
  family: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RhymeShiftPoint {
  verseNumber: number;
  fromLetter: string;
  toLetter: string;
  fromFamily: string;
  toFamily: string;
}

export interface SurahVerseEndingsAnalysis {
  surahNumber: number;
  surahName: string;
  totalVerses: number;
  dominantLetter: string;
  dominantLetterName: string;
  dominantPercentage: number;
  uniformityScore: number; // 0 to 100
  rhymeType: 'monorhyme' | 'birhyme' | 'multirhyme';
  rhymeTypeLabel: string;
  letterFrequencies: RhymeFrequency[];
  familyFrequencies: RhymeFamilyStats[];
  shiftPoints: RhymeShiftPoint[];
  verseEndings: VerseEndingItem[];
}

// Letter colors for visualization - Aligned with Manuscript Visual Identity
const RHYME_COLORS: Record<string, string> = {
  'ن': '#1A5C5C', // Brand Heritage Teal
  'م': '#2B7470', // Scholarly Jade
  'ا': '#B8935F', // Scholarly Gold Accent
  'ى': '#C5A16A', // Warm Gold
  'ها': '#8C6B37', // Antique Bronze
  'د': '#236B67', // Deep Sea Teal
  'ر': '#3F6B5A', // Moss Green
  'ه': '#A07E4D', // Deep Gold
  'ة': '#997744', // Umber Gold
  'ب': '#206561', // Teal
  'ق': '#134747', // Forest
  'ج': '#3A4A47', // Scholarly Slate
  'ط': '#2E5D53', // Deep Moss
  'ك': '#286B63', // Jade
  'ل': '#5E7570', // Ink Light
  'و': '#B8935F', // Gold
  'ي': '#1A5C5C', // Heritage Teal
  'ت': '#7A4A3A', // Muted Terra Cotta
  'س': '#2B7470', // Jade
  'ص': '#8C6B37', // Bronze
  'ع': '#3F6B5A', // Forest
};

function getLetterColor(letter: string): string {
  return RHYME_COLORS[letter] || '#53605E';
}

function getRhymeFamily(letter: string): 'noon-meem' | 'alif' | 'ha-alif' | 'qalqalah' | 'ha' | 'ra' | 'other' {
  if (letter === 'ن' || letter === 'م') return 'noon-meem';
  if (letter === 'ها') return 'ha-alif';
  if (letter === 'ا' || letter === 'ى' || letter === 'ء') return 'alif';
  if (letter === 'د' || letter === 'ب' || letter === 'ج' || letter === 'ط' || letter === 'ق') return 'qalqalah';
  if (letter === 'ه' || letter === 'ة') return 'ha';
  if (letter === 'ر') return 'ra';
  return 'other';
}

export function extractLastWordAndRhyme(text: string): { lastWord: string; rawLastWord: string; rhymeLetter: string; harakah: string } {
  // Clean end of verse digits, Arabic-Indic numbers, and ornamental brackets
  const cleaned = text
    .replace(/[\u06DD\u06DE\uFD3E\uFD3F0-9\u0660-\u0669\u06F0-\u06F9\(\)\[\]«»]/g, ' ')
    .trim();

  // انتقاء الكلمات العربية الحقيقية فقط واستبعاد أي بقايا رموز
  const words = cleaned.split(/\s+/).filter(w => /[\u0621-\u064A\u0671\u0670]/.test(w));
  if (words.length === 0) {
    return { lastWord: '', rawLastWord: '', rhymeLetter: 'ا', harakah: 'سكون' };
  }

  const rawLastWord = words[words.length - 1];

  // استخراج حركة الفاصلة وحرف الروي بدقة من مؤخرة الكلمة وحرفها الأخير
  let harakah = 'سكون';
  const cleanTail = rawLastWord.replace(/[\u06DD\u06DE\uFD3E\uFD3F\d\(\)\[\]«»ۖۗۚۛۜ۝۩۞]/g, '').trim();
  const endSlice = cleanTail.slice(-5);
  
  if (/[\u064B]/.test(endSlice)) {
    harakah = 'تنوين فتح';
  } else if (/[\u064C]/.test(endSlice)) {
    harakah = 'تنوين ضم';
  } else if (/[\u064D]/.test(endSlice)) {
    harakah = 'تنوين كسر';
  } else {
    for (let i = cleanTail.length - 1; i >= Math.max(0, cleanTail.length - 4); i--) {
      const ch = cleanTail[i];
      if (ch === '\u064E') { harakah = 'فتحة'; break; }
      if (ch === '\u064F') { harakah = 'ضمة'; break; }
      if (ch === '\u0650') { harakah = 'كسرة'; break; }
      if (ch === '\u0652') { harakah = 'سكون'; break; }
    }
  }

  // Strip diacritics to get consonants
  const pureLetters = cleanArabicLetters(rawLastWord);
  if (pureLetters.length === 0) {
    return { lastWord: rawLastWord, rawLastWord, rhymeLetter: 'ا', harakah };
  }

  let rhymeLetter = pureLetters[pureLetters.length - 1];

  // Special Case 1: Pronoun suffix 'ها' (e.g. ضُحَاهَا، تَلاَهَا، جَلاَّهَا، بَنَاهَا in Surat Ash-Shams)
  if (pureLetters.endsWith('ها') && pureLetters.length >= 3) {
    rhymeLetter = 'ها';
  }
  // Special Case 2: Silent Alif with Waw al-Jama'ah (وا) e.g. كَفَرُوا، عَمِلُوا، قَالُوا
  // The phonetic rhyme here is the prolonged Waw 'و'
  else if (pureLetters.endsWith('وا') && pureLetters.length >= 3) {
    rhymeLetter = 'و';
  }
  // Special Case 3: Alif Tanween (e.g. خَبِيرًا -> pure letters ends in 'ا', but phonetic rhyme is 'ر' with alif madd)
  else if (rhymeLetter === 'ا' && pureLetters.length >= 2 && /[\u064B]/.test(rawLastWord)) {
    // If the word ends in tanween fath on the penultimate letter + alif, the base consonant is the penultimate letter
    rhymeLetter = pureLetters[pureLetters.length - 2];
  }
  // Normalize Alif variations
  else if (rhymeLetter === 'أ' || rhymeLetter === 'إ' || rhymeLetter === 'آ' || rhymeLetter === 'ٱ') {
    rhymeLetter = 'ا';
  }

  return {
    lastWord: rawLastWord.replace(/[^\u0621-\u065F\u0670\u0671]/g, ''),
    rawLastWord,
    rhymeLetter,
    harakah
  };
}

export function analyzeSurahVerseEndings(surahCorpus: QuranSurahCorpus): SurahVerseEndingsAnalysis {
  const ayahs = surahCorpus.ayahs || [];
  const totalVerses = ayahs.length;

  const verseEndings: VerseEndingItem[] = [];
  const letterCounts: Record<string, number> = {};
  const familyCounts: Record<string, number> = {
    'noon-meem': 0,
    'ha-alif': 0,
    'alif': 0,
    'qalqalah': 0,
    'ha': 0,
    'ra': 0,
    'other': 0
  };

  ayahs.forEach((ayah, idx) => {
    const text = ayah.textUthmani || ayah.textSimple || '';
    const { lastWord, rawLastWord, rhymeLetter, harakah } = extractLastWordAndRhyme(text);
    const rhymeFamily = getRhymeFamily(rhymeLetter);

    verseEndings.push({
      verseNumber: ayah.numberInSurah || (idx + 1),
      lastWord,
      rawLastWord,
      rhymeLetter,
      rhymeLetterName: ARABIC_LETTER_NAMES[rhymeLetter] || rhymeLetter,
      rhymeFamily,
      harakah
    });

    letterCounts[rhymeLetter] = (letterCounts[rhymeLetter] || 0) + 1;
    familyCounts[rhymeFamily] = (familyCounts[rhymeFamily] || 0) + 1;
  });

  // Calculate frequencies
  const letterFrequencies: RhymeFrequency[] = Object.entries(letterCounts)
    .map(([letter, count]) => ({
      letter,
      letterName: ARABIC_LETTER_NAMES[letter] || letter,
      count,
      percentage: totalVerses > 0 ? Number(((count / totalVerses) * 100).toFixed(1)) : 0,
      color: getLetterColor(letter)
    }))
    .sort((a, b) => b.count - a.count);

  const familyLabels: Record<string, string> = {
    'noon-meem': 'المد والتمكين (النون والميم)',
    'ha-alif': 'فواصل الهاء والألف (ضمير الغيبة ها)',
    'alif': 'فواصل الألف والمد (الألف والياء)',
    'qalqalah': 'حروف القلقلة (قطب جد)',
    'ha': 'الهاء والتاء المربوطة',
    'ra': 'الراء',
    'other': 'حروف أخرى'
  };

  const familyColors: Record<string, string> = {
    'noon-meem': '#1A5C5C',
    'ha-alif': '#8C6B37',
    'alif': '#B8935F',
    'qalqalah': '#2B7470',
    'ha': '#A07E4D',
    'ra': '#3F6B5A',
    'other': '#5E7570'
  };

  const familyFrequencies: RhymeFamilyStats[] = Object.entries(familyCounts)
    .filter(([_, count]) => count > 0)
    .map(([family, count]) => ({
      family,
      name: familyLabels[family] || family,
      count,
      percentage: totalVerses > 0 ? Number(((count / totalVerses) * 100).toFixed(1)) : 0,
      color: familyColors[family] || '#97A8A3'
    }))
    .sort((a, b) => b.count - a.count);

  const dominant = letterFrequencies[0] || { letter: '-', letterName: '-', percentage: 0 };

  // Calculate Uniformity Score (Herfindahl-Hirschman index normalized to 100)
  // Sum of (p_i)^2 where p_i is in [0, 1]
  let sumP2 = 0;
  letterFrequencies.forEach(lf => {
    const p = lf.count / (totalVerses || 1);
    sumP2 += p * p;
  });
  const uniformityScore = Math.min(100, Math.round(sumP2 * 100));

  // Determine rhyme type
  let rhymeType: 'monorhyme' | 'birhyme' | 'multirhyme' = 'multirhyme';
  let rhymeTypeLabel = 'فاصلة متعددة الإيقاع';

  if (dominant.percentage >= 85) {
    rhymeType = 'monorhyme';
    rhymeTypeLabel = 'أحادية الفاصلة والروي (شديدة التجانس)';
  } else if (letterFrequencies.length >= 2 && (letterFrequencies[0].percentage + letterFrequencies[1].percentage) >= 80) {
    rhymeType = 'birhyme';
    rhymeTypeLabel = `ثنائية الفاصلة (${letterFrequencies[0].letter} و ${letterFrequencies[1].letter})`;
  }

  // Detect shift points (where rhyme changes after a run of at least 3 verses)
  const shiftPoints: RhymeShiftPoint[] = [];
  let currentRunLetter = verseEndings[0]?.rhymeLetter || '';
  let currentRunCount = 0;

  verseEndings.forEach((ve, idx) => {
    if (ve.rhymeLetter === currentRunLetter) {
      currentRunCount++;
    } else {
      if (currentRunCount >= 3) {
        shiftPoints.push({
          verseNumber: ve.verseNumber,
          fromLetter: currentRunLetter,
          toLetter: ve.rhymeLetter,
          fromFamily: getRhymeFamily(currentRunLetter),
          toFamily: ve.rhymeFamily
        });
      }
      currentRunLetter = ve.rhymeLetter;
      currentRunCount = 1;
    }
  });

  return {
    surahNumber: surahCorpus.number,
    surahName: surahCorpus.name,
    totalVerses,
    dominantLetter: dominant.letter,
    dominantLetterName: dominant.letterName,
    dominantPercentage: dominant.percentage,
    uniformityScore,
    rhymeType,
    rhymeTypeLabel,
    letterFrequencies,
    familyFrequencies,
    shiftPoints,
    verseEndings
  };
}

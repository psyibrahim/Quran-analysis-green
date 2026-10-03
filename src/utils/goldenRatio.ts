import { SurahData, QuranAyah } from '../types';
import { ARABIC_LETTER_NAMES, cleanArabicLetters } from './arabic';

export interface GoldenAyahDetail {
  ayahNumber: number;
  numberInQuran: number;
  textUthmani: string;
  textSimple: string;
  wordCount: number;
  charCount: number;
  positionPercentage: number;
  juz?: number;
  page?: number;
}

export interface GoldenWordDetail {
  globalWordIndex: number;
  totalWords: number;
  wordIndexInAyah: number;
  uthWordIndexInAyah?: number;
  uthTokenIndexInAyah?: number;
  simTokenIndexInAyah?: number;
  totalWordsInAyah: number;
  ayahNumber: number;
  numberInQuran: number;
  wordTextUthmani: string;
  wordTextSimple: string;
  hostAyahTextUthmani: string;
  hostAyahTextSimple: string;
  hostAyahWordsUthmani: string[];
  hostAyahWordsSimple: string[];
  positionPercentage: number;
}

export interface GoldenCharDetail {
  globalCharIndex: number;
  totalChars: number;
  char: string;
  charName: string;
  charIndexInWord: number;
  totalCharsInWord: number;
  globalWordIndex: number;
  wordIndexInAyah: number;
  uthWordIndexInAyah?: number;
  uthTokenIndexInAyah?: number;
  simTokenIndexInAyah?: number;
  totalWordsInAyah: number;
  ayahNumber: number;
  numberInQuran: number;
  wordTextUthmani: string;
  wordTextSimple: string;
  hostAyahTextUthmani: string;
  hostAyahTextSimple: string;
  hostAyahWordsUthmani: string[];
  hostAyahWordsSimple: string[];
  positionPercentage: number;
}

export interface GoldenRatioMetrics {
  phi: number; // 1.6180339887
  totalAyahs: number;
  totalWords: number;
  totalChars: number;
  goldenSectionPercentage: number;
  harmonicAlignmentScore: number;

  // Verse Golden Cut
  goldenAyahNumber: number;
  majorAyahsCount: number;
  minorAyahsCount: number;
  ayahsMajorMinorRatio: number;
  ayahRatio: number;
  deltaPhiAyahs: number;
  ayahsPhiConvergencePct: number; // 0 - 100%

  // Words Golden Cut
  goldenWordNumber: number;
  goldenWordIndex: number;
  majorWordsCount: number;
  minorWordsCount: number;
  wordsMajorMinorRatio: number;
  wordRatio: number;
  deltaPhiWords: number;
  wordsPhiConvergencePct: number;

  // Chars Golden Cut
  goldenCharIndex: number;
  majorCharsCount: number;
  minorCharsCount: number;
  charRatio: number;
  deltaPhiChars: number;
  charsPhiConvergencePct: number;

  // Scale metrics
  wordsToAyahsRatio: number;
  charsToWordsRatio: number;

  // Rich Details for Ayah, Word, Letter
  goldenAyahDetail?: GoldenAyahDetail;
  goldenWordDetail?: GoldenWordDetail;
  goldenCharDetail?: GoldenCharDetail;

  // Backward compatibility fields
  goldenAyahText?: string;
  goldenAyahTextUthmani?: string;
  goldenAyahTextSimple?: string;
  goldenAyahWordCount?: number;
  goldenAyahCharCount?: number;

  // Harmony verdict
  harmonyLevel: 'فائق الاتساق' | 'اتساق ذهبي مرتفع' | 'اتساق معتدل';
  harmonyDescription: string;
}

export const PHI = 1.618033988749895; // Golden Ratio φ
export const PHI_INV = 0.618033988749895; // 1/φ = φ - 1

export function calculateSurahGoldenRatio(
  surah: SurahData, 
  ayahsList?: QuranAyah[]
): GoldenRatioMetrics {
  const totalAyahs = surah.totalAyahs;
  const totalWords = surah.totalWords;
  const totalChars = surah.totalChars;

  // Golden cut for verses (major part is ~61.8%)
  const goldenAyahNumber = Math.max(1, Math.min(totalAyahs, Math.round(totalAyahs * PHI_INV)));
  const majorAyahsCount = goldenAyahNumber;
  const minorAyahsCount = Math.max(1, totalAyahs - goldenAyahNumber);
  const ayahsMajorMinorRatio = Number((majorAyahsCount / minorAyahsCount).toFixed(4));
  
  // Convergence error for Ayahs
  const ayahsDiff = Math.abs(ayahsMajorMinorRatio - PHI);
  const ayahsPhiConvergencePct = Math.max(
    0, 
    Number((100 - (ayahsDiff / PHI) * 100).toFixed(1))
  );

function normalizeLettersForMatch(text: string): string {
  const clean = cleanArabicLetters(text);
  return clean
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه');
}

function alignSimpleToUthmani(simWords: string[], uthWords: string[]): Record<number, number> {
  if (simWords.length === uthWords.length) {
    const map: Record<number, number> = {};
    for (let i = 0; i < simWords.length; i++) map[i] = i;
    return map;
  }

  const simToUth: Record<number, number> = {};
  let uIdx = 0;
  let currUthLetters = uthWords.length > 0 ? normalizeLettersForMatch(uthWords[0]) : '';

  for (let sIdx = 0; sIdx < simWords.length; sIdx++) {
    const swLetters = normalizeLettersForMatch(simWords[sIdx]);
    while (uIdx < uthWords.length && !currUthLetters) {
      uIdx++;
      if (uIdx < uthWords.length) {
        currUthLetters = normalizeLettersForMatch(uthWords[uIdx]);
      }
    }

    if (uIdx >= uthWords.length) {
      simToUth[sIdx] = Math.max(0, uthWords.length - 1);
      continue;
    }

    simToUth[sIdx] = uIdx;
    if (currUthLetters.startsWith(swLetters)) {
      currUthLetters = currUthLetters.slice(swLetters.length);
    } else {
      if (uIdx + 1 < uthWords.length && normalizeLettersForMatch(uthWords[uIdx + 1]).startsWith(swLetters)) {
        uIdx++;
        currUthLetters = normalizeLettersForMatch(uthWords[uIdx]).slice(swLetters.length);
        simToUth[sIdx] = uIdx;
      } else {
        uIdx++;
        if (uIdx < uthWords.length) {
          currUthLetters = normalizeLettersForMatch(uthWords[uIdx]);
        } else {
          currUthLetters = '';
        }
      }
    }
  }

  return simToUth;
}

  // 1. Build word list and letter list from ayahs if available
  const allWords: Array<{
    globalWordIndex: number;
    wordIndexInAyah: number;
    uthWordIndexInAyah: number;
    uthTokenIndexInAyah: number;
    simTokenIndexInAyah: number;
    totalWordsInAyah: number;
    ayahNumber: number;
    numberInQuran: number;
    wordTextUthmani: string;
    wordTextSimple: string;
    hostAyahTextUthmani: string;
    hostAyahTextSimple: string;
    hostAyahWordsUthmani: string[];
    hostAyahWordsSimple: string[];
    juz?: number;
    page?: number;
  }> = [];

  const allChars: Array<{
    globalCharIndex: number;
    char: string;
    charName: string;
    charIndexInWord: number;
    totalCharsInWord: number;
    globalWordIndex: number;
    wordIndexInAyah: number;
    uthWordIndexInAyah: number;
    uthTokenIndexInAyah: number;
    simTokenIndexInAyah: number;
    totalWordsInAyah: number;
    ayahNumber: number;
    numberInQuran: number;
    wordTextUthmani: string;
    wordTextSimple: string;
    hostAyahTextUthmani: string;
    hostAyahTextSimple: string;
    hostAyahWordsUthmani: string[];
    hostAyahWordsSimple: string[];
  }> = [];

  if (ayahsList && ayahsList.length > 0) {
    let wordCounter = 0;
    let charCounter = 0;

    for (const ayah of ayahsList) {
      // Raw tokens from authentic text (preserving waqf symbols)
      const rawSimTokens = ayah.textSimple.trim().split(/\s+/).filter(Boolean);
      const rawUthTokens = ayah.textUthmani.trim().split(/\s+/).filter(Boolean);

      // Extract valid word tokens and their token indices
      const validSimTokens: Array<{ raw: string; cleanLetters: string; tokenIndex: number }> = [];
      for (let t = 0; t < rawSimTokens.length; t++) {
        const tok = rawSimTokens[t];
        const cleanLetters = cleanArabicLetters(tok);
        if (cleanLetters.length > 0) {
          validSimTokens.push({ raw: tok, cleanLetters, tokenIndex: t });
        }
      }

      const validUthTokens: Array<{ raw: string; cleanLetters: string; tokenIndex: number }> = [];
      for (let t = 0; t < rawUthTokens.length; t++) {
        const tok = rawUthTokens[t];
        const cleanLetters = cleanArabicLetters(tok);
        if (cleanLetters.length > 0) {
          validUthTokens.push({ raw: tok, cleanLetters, tokenIndex: t });
        }
      }

      const wordsCountInAyah = validSimTokens.length;
      const simToUthMap = alignSimpleToUthmani(
        validSimTokens.map(t => t.raw),
        validUthTokens.map(t => t.raw)
      );

      for (let w = 0; w < wordsCountInAyah; w++) {
        wordCounter++;
        const simWordObj = validSimTokens[w];
        const wordSim = simWordObj.raw;
        const uthWordIdx = simToUthMap[w] ?? Math.min(w, Math.max(0, validUthTokens.length - 1));
        const uthWordObj = validUthTokens[uthWordIdx] || { raw: wordSim, tokenIndex: simWordObj.tokenIndex };
        const wordUth = uthWordObj.raw;
        const cleanWordLetters = simWordObj.cleanLetters;

        const wordItem = {
          globalWordIndex: wordCounter,
          wordIndexInAyah: w + 1,
          uthWordIndexInAyah: uthWordIdx + 1,
          uthTokenIndexInAyah: uthWordObj.tokenIndex,
          simTokenIndexInAyah: simWordObj.tokenIndex,
          totalWordsInAyah: wordsCountInAyah,
          ayahNumber: ayah.numberInSurah,
          numberInQuran: ayah.numberInQuran,
          wordTextUthmani: wordUth,
          wordTextSimple: wordSim,
          hostAyahTextUthmani: ayah.textUthmani,
          hostAyahTextSimple: ayah.textSimple,
          hostAyahWordsUthmani: rawUthTokens,
          hostAyahWordsSimple: rawSimTokens,
          juz: ayah.juz,
          page: ayah.page
        };
        allWords.push(wordItem);

        // Extract pure Arabic letters from cleanWordLetters
        for (let c = 0; c < cleanWordLetters.length; c++) {
          charCounter++;
          const ch = cleanWordLetters[c];
          allChars.push({
            globalCharIndex: charCounter,
            char: ch,
            charName: ARABIC_LETTER_NAMES[ch] || `حرف ${ch}`,
            charIndexInWord: c + 1,
            totalCharsInWord: cleanWordLetters.length,
            globalWordIndex: wordCounter,
            wordIndexInAyah: w + 1,
            uthWordIndexInAyah: uthWordIdx + 1,
            uthTokenIndexInAyah: uthWordObj.tokenIndex,
            simTokenIndexInAyah: simWordObj.tokenIndex,
            totalWordsInAyah: wordsCountInAyah,
            ayahNumber: ayah.numberInSurah,
            numberInQuran: ayah.numberInQuran,
            wordTextUthmani: wordUth,
            wordTextSimple: wordSim,
            hostAyahTextUthmani: ayah.textUthmani,
            hostAyahTextSimple: ayah.textSimple,
            hostAyahWordsUthmani: rawUthTokens,
            hostAyahWordsSimple: rawSimTokens
          });
        }
      }
    }
  }

  const effectiveTotalWords = allWords.length > 0 ? allWords.length : totalWords;
  const effectiveTotalChars = allChars.length > 0 ? allChars.length : totalChars;

  // Golden cut for words
  const goldenWordNumber = Math.max(1, Math.min(effectiveTotalWords, Math.round(effectiveTotalWords * PHI_INV)));
  const majorWordsCount = goldenWordNumber;
  const minorWordsCount = Math.max(1, effectiveTotalWords - goldenWordNumber);
  const wordsMajorMinorRatio = Number((majorWordsCount / minorWordsCount).toFixed(4));
  const wordsDiff = Math.abs(wordsMajorMinorRatio - PHI);
  const wordsPhiConvergencePct = Math.max(
    0, 
    Number((100 - (wordsDiff / PHI) * 100).toFixed(1))
  );

  // Golden cut for characters
  const goldenCharIndex = Math.max(1, Math.min(effectiveTotalChars, Math.round(effectiveTotalChars * PHI_INV)));
  const majorCharsCount = goldenCharIndex;
  const minorCharsCount = Math.max(1, effectiveTotalChars - goldenCharIndex);
  const charRatio = Number((majorCharsCount / minorCharsCount).toFixed(4));
  const charsDiff = Math.abs(charRatio - PHI);
  const charsPhiConvergencePct = Math.max(
    0, 
    Number((100 - (charsDiff / PHI) * 100).toFixed(1))
  );

  // Scale ratios
  const wordsToAyahsRatio = Number((effectiveTotalWords / Math.max(1, totalAyahs)).toFixed(2));
  const charsToWordsRatio = Number((effectiveTotalChars / Math.max(1, effectiveTotalWords)).toFixed(2));

  // Find golden ayah, golden word, golden letter details
  let goldenAyahDetail: GoldenAyahDetail | undefined;
  let goldenWordDetail: GoldenWordDetail | undefined;
  let goldenCharDetail: GoldenCharDetail | undefined;

  let goldenAyahTextUthmani: string | undefined;
  let goldenAyahTextSimple: string | undefined;
  let goldenAyahWordCount: number | undefined;
  let goldenAyahCharCount: number | undefined;

  if (ayahsList && ayahsList.length > 0) {
    const targetAyah = ayahsList.find(a => a.numberInSurah === goldenAyahNumber);
    if (targetAyah) {
      goldenAyahTextUthmani = targetAyah.textUthmani;
      goldenAyahTextSimple = targetAyah.textSimple;
      const targetSimTokens = targetAyah.textSimple.trim().split(/\s+/).filter(Boolean);
      let targetAyahWords = 0;
      let targetAyahChars = 0;
      for (const tok of targetSimTokens) {
        const cleanLetters = cleanArabicLetters(tok);
        if (cleanLetters.length > 0) {
          targetAyahWords++;
          targetAyahChars += cleanLetters.length;
        }
      }
      goldenAyahWordCount = targetAyahWords;
      goldenAyahCharCount = targetAyahChars;

      goldenAyahDetail = {
        ayahNumber: targetAyah.numberInSurah,
        numberInQuran: targetAyah.numberInQuran,
        textUthmani: targetAyah.textUthmani,
        textSimple: targetAyah.textSimple,
        wordCount: goldenAyahWordCount,
        charCount: goldenAyahCharCount,
        positionPercentage: Number(((goldenAyahNumber / totalAyahs) * 100).toFixed(1)),
        juz: targetAyah.juz,
        page: targetAyah.page
      };
    }
  }

  if (allWords.length > 0) {
    const targetWord = allWords[goldenWordNumber - 1];
    if (targetWord) {
      goldenWordDetail = {
        globalWordIndex: targetWord.globalWordIndex,
        totalWords: effectiveTotalWords,
        wordIndexInAyah: targetWord.wordIndexInAyah,
        uthWordIndexInAyah: targetWord.uthWordIndexInAyah,
        uthTokenIndexInAyah: targetWord.uthTokenIndexInAyah,
        simTokenIndexInAyah: targetWord.simTokenIndexInAyah,
        totalWordsInAyah: targetWord.totalWordsInAyah,
        ayahNumber: targetWord.ayahNumber,
        numberInQuran: targetWord.numberInQuran,
        wordTextUthmani: targetWord.wordTextUthmani,
        wordTextSimple: targetWord.wordTextSimple,
        hostAyahTextUthmani: targetWord.hostAyahTextUthmani,
        hostAyahTextSimple: targetWord.hostAyahTextSimple,
        hostAyahWordsUthmani: targetWord.hostAyahWordsUthmani,
        hostAyahWordsSimple: targetWord.hostAyahWordsSimple,
        positionPercentage: Number(((targetWord.globalWordIndex / effectiveTotalWords) * 100).toFixed(1))
      };
    }
  }

  if (allChars.length > 0) {
    const targetChar = allChars[goldenCharIndex - 1];
    if (targetChar) {
      goldenCharDetail = {
        globalCharIndex: targetChar.globalCharIndex,
        totalChars: effectiveTotalChars,
        char: targetChar.char,
        charName: targetChar.charName,
        charIndexInWord: targetChar.charIndexInWord,
        totalCharsInWord: targetChar.totalCharsInWord,
        globalWordIndex: targetChar.globalWordIndex,
        wordIndexInAyah: targetChar.wordIndexInAyah,
        uthWordIndexInAyah: targetChar.uthWordIndexInAyah,
        uthTokenIndexInAyah: targetChar.uthTokenIndexInAyah,
        simTokenIndexInAyah: targetChar.simTokenIndexInAyah,
        totalWordsInAyah: targetChar.totalWordsInAyah,
        ayahNumber: targetChar.ayahNumber,
        numberInQuran: targetChar.numberInQuran,
        wordTextUthmani: targetChar.wordTextUthmani,
        wordTextSimple: targetChar.wordTextSimple,
        hostAyahTextUthmani: targetChar.hostAyahTextUthmani,
        hostAyahTextSimple: targetChar.hostAyahTextSimple,
        hostAyahWordsUthmani: targetChar.hostAyahWordsUthmani,
        hostAyahWordsSimple: targetChar.hostAyahWordsSimple,
        positionPercentage: Number(((targetChar.globalCharIndex / effectiveTotalChars) * 100).toFixed(1))
      };
    }
  }

  // Harmonic evaluation
  const harmonicAlignmentScore = Number(((ayahsPhiConvergencePct + wordsPhiConvergencePct + charsPhiConvergencePct) / 3).toFixed(1));
  let harmonyLevel: 'فائق الاتساق' | 'اتساق ذهبي مرتفع' | 'اتساق معتدل' = 'اتساق معتدل';
  let harmonyDescription = '';

  if (harmonicAlignmentScore >= 88) {
    harmonyLevel = 'فائق الاتساق';
    harmonyDescription = 'تتطابق نقطة التقسيم الهندسي للقطع الذهبي الداخلي للسورة بدقة عددية فائقة مع النسبة الذهبية (φ ≈ 1.618) على مستويات الآيات والكلمات والحروف، مع أدنى نسبة تفاوت في التجزئة الرقمية الصحيحة.';
  } else if (harmonicAlignmentScore >= 70) {
    harmonyLevel = 'اتساق ذهبي مرتفع';
    harmonyDescription = 'تُظهر السورة تدرجاً هندسياً متوازناً، حيث تقسم نقطة القطع الذهبي السورة إلى جزء رئيسي وجزء متمم بنسب هندسية تقترب بدرجة عالية من النسبة الذهبية.';
  } else {
    harmonyLevel = 'اتساق معتدل';
    harmonyDescription = 'يتوزع القطع الذهبي للآيات والكلمات بما يتطابق مع التدرج الطبيعي للأعداد الصحيحة في أبعاد السورة.';
  }

  const deltaPhiAyahs = Number(ayahsDiff.toFixed(4));
  const deltaPhiWords = Number(wordsDiff.toFixed(4));
  const deltaPhiChars = Number(charsDiff.toFixed(4));

  return {
    phi: Number(PHI.toFixed(4)),
    totalAyahs,
    totalWords: effectiveTotalWords,
    totalChars: effectiveTotalChars,
    goldenSectionPercentage: 61.8,
    harmonicAlignmentScore,
    // Verse
    goldenAyahNumber,
    majorAyahsCount,
    minorAyahsCount,
    ayahsMajorMinorRatio,
    ayahRatio: ayahsMajorMinorRatio,
    deltaPhiAyahs,
    ayahsPhiConvergencePct,
    // Words
    goldenWordNumber,
    goldenWordIndex: goldenWordNumber,
    majorWordsCount,
    minorWordsCount,
    wordsMajorMinorRatio,
    wordRatio: wordsMajorMinorRatio,
    deltaPhiWords,
    wordsPhiConvergencePct,
    // Chars
    goldenCharIndex,
    majorCharsCount,
    minorCharsCount,
    charRatio,
    deltaPhiChars,
    charsPhiConvergencePct,
    // Scale
    wordsToAyahsRatio,
    charsToWordsRatio,
    // Rich Details
    goldenAyahDetail,
    goldenWordDetail,
    goldenCharDetail,
    // Legacy fields
    goldenAyahText: goldenAyahTextUthmani || goldenAyahTextSimple,
    goldenAyahTextUthmani,
    goldenAyahTextSimple,
    goldenAyahWordCount,
    goldenAyahCharCount,
    harmonyLevel,
    harmonyDescription
  };
}


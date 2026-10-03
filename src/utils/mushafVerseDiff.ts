/**
 * mushafVerseDiff.ts
 * Rigorous mathematical and textual divergence engine comparing Kufi (Hafs) and Madani (Warsh) Mushafs.
 * Provides verse-level shift detection (زحزحة الترقيم وفواصل الآي) and word-level diff analysis (فروق الفرش والرسم).
 */

import { QuranAyah } from '../types';

export type VerseShiftType = 'exact' | 'shifted' | 'split' | 'merged';
export type WordDiffType = 'identical' | 'lexical_diff' | 'reading_diff' | 'orthographic_diff';

export interface CrossVerseBreak {
  wordIndex: number; // 0-indexed word after which counterpart ended
  counterpartAyahNumber: number;
  counterpartMushaf: 'kufi' | 'madani';
  label: string;
}

export interface AyahShiftInfo {
  mushaf: 'kufi' | 'madani';
  surahNumber: number;
  numberInSurah: number;
  type: VerseShiftType;
  shiftOffset: number; // e.g. 0, +1, -1, +2
  mappedNumbers: number[]; // the counterpart ayah numbers
  isSplitPart?: boolean;
  isMergedMulti?: boolean;
  badgeLabel: string;
  description: string;
  crossVerseBreaks: CrossVerseBreak[];
  hasWordDiff: boolean;
  wordDiffCount: number;
  hasLexicalDiff: boolean;
  lexicalDiffCount: number;
  hasReadingDiff: boolean;
  readingDiffCount: number;
}

export interface WordTokenAnalysis {
  raw: string;
  clean: string;
  type: WordDiffType;
  partner?: string;
  partnerType?: WordDiffType;
  explanation?: string;
}

export interface SurahDivergenceAnalysis {
  surahNumber: number;
  kufiAyahsCount: number;
  madaniAyahsCount: number;
  ayahDifference: number; // madani - kufi
  exactMatchesCount: number;
  shiftedVersesCount: number;
  splitVersesCount: number;
  mergedVersesCount: number;
  totalWordDifferences: number;
  totalLexicalDifferences: number;
  totalReadingDifferences: number;
  kufiShiftMap: Map<number, AyahShiftInfo>;
  madaniShiftMap: Map<number, AyahShiftInfo>;
  kufiWordDiffs: Map<number, WordTokenAnalysis[]>;
  madaniWordDiffs: Map<number, WordTokenAnalysis[]>;
  divergentAyahNumbers: number[]; // Kufi ayah numbers that have shift, split, merge, or word diff
}

// Helper: normalize arabic word for phonetic and consonantal comparison
export function stripAllDiacriticsAndStops(word: string): string {
  return word
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF\uFE70-\uFEFF]/g, '')
    .replace(/[ٱإأآء]/g, 'ا')
    .replace(/[يىئ]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ۖۗۚۛۜ۝]/g, '')
    .replace(/[^\u0621-\u064A]/g, '');
}

// Clean Quranic token preserving base letters and core vowels
export function cleanQuranToken(token: string): string {
  return token.replace(/[ۖۗۚۛۜ۝]/g, '').trim();
}

/**
 * Compare two words and classify the divergence type:
 * - identical: Exact string equality
 * - lexical_diff: Different base consonants/letters or added/removed words (e.g. ووصى vs وأوصى, وسارعوا vs سارعوا, تكون vs يكون)
 * - reading_diff: Dagger alifs, reading variants, or significant vowel/hamza changes (e.g. مالك vs ملك, يخادعون vs يخدعون)
 * - orthographic_diff: Standard Maghribi/Warsh vs Hafs orthography (alif wasla dots, tanween variants, etc.)
 */
export function classifyWordDifference(wordK: string, wordM: string): { type: WordDiffType; explanation?: string } {
  if (!wordK || !wordM) {
    return { type: 'lexical_diff', explanation: wordK ? 'واردة في الكوفي دون المدني' : 'واردة في المدني دون الكوفي' };
  }

  const cleanK = cleanQuranToken(wordK);
  const cleanM = cleanQuranToken(wordM);

  if (cleanK === cleanM) {
    return { type: 'identical' };
  }

  const baseK = stripAllDiacriticsAndStops(cleanK);
  const baseM = stripAllDiacriticsAndStops(cleanM);

  // If base consonants differ:
  if (baseK !== baseM) {
    return {
      type: 'lexical_diff',
      explanation: `اختلاف في رسم الكلمة وحروفها: (${cleanK}) في الكوفي مقابل (${cleanM}) في المدني`
    };
  }

  // If dagger alif differs (e.g. مَٰلِكِ vs مَلِكِ, or يُخَٰدِعُونَ vs يَخْدَعُونَ)
  const hasDaggerK = cleanK.includes('\u0670');
  const hasDaggerM = cleanM.includes('\u0670');
  if (hasDaggerK !== hasDaggerM) {
    return {
      type: 'reading_diff',
      explanation: hasDaggerK 
        ? `حفص: (${cleanK}) بإثبات الألف الخنجرية | ورش: (${cleanM}) بالقصر وحذف الألف`
        : `ورش: (${cleanM}) بإثبات الألف الخنجرية | حفص: (${cleanK}) بالقصر وحذف الألف`
    };
  }

  // Check hamza variations (e.g. مومنون vs مؤمنون, يومنون vs يؤمنون)
  const isHamzaDiff = (cleanK.includes('ؤ') && cleanM.includes('و')) ||
                      (cleanK.includes('ئ') && cleanM.includes('ي')) ||
                      (cleanK.includes('أ') && cleanM.includes('ا'));
  if (isHamzaDiff) {
    return {
      type: 'reading_diff',
      explanation: `اختلاف تحقيق الهمز وإبداله: (${cleanK}) عند حفص مقابل (${cleanM}) عند ورش`
    };
  }

  // Diacritic / wasla / regional orthography
  return {
    type: 'orthographic_diff',
    explanation: `اختلاف ضبط ورسم عثماني مغربي: (${cleanK}) ↔ (${cleanM})`
  };
}

/**
 * Align words between a Kufi text segment and a Madani text segment using LCS.
 */
export function alignAndDiffVerseWords(textKufi: string, textMadani: string): {
  tokensKufi: WordTokenAnalysis[];
  tokensMadani: WordTokenAnalysis[];
  diffCount: number;
} {
  const wordsK = textKufi.trim().split(/\s+/).filter(Boolean);
  const wordsM = textMadani.trim().split(/\s+/).filter(Boolean);

  const n = wordsK.length;
  const m = wordsM.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const bK = stripAllDiacriticsAndStops(wordsK[i - 1]);
      const bM = stripAllDiacriticsAndStops(wordsM[j - 1]);
      if (bK === bM && bK.length > 0) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const rawPairs: { k: string; m: string; idxK: number; idxM: number }[] = [];

  while (i > 0 || j > 0) {
    const bK = i > 0 ? stripAllDiacriticsAndStops(wordsK[i - 1]) : '';
    const bM = j > 0 ? stripAllDiacriticsAndStops(wordsM[j - 1]) : '';

    if (i > 0 && j > 0 && bK === bM && bK.length > 0) {
      rawPairs.unshift({ k: wordsK[i - 1], m: wordsM[j - 1], idxK: i - 1, idxM: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawPairs.unshift({ k: '', m: wordsM[j - 1], idxK: -1, idxM: j - 1 });
      j--;
    } else {
      rawPairs.unshift({ k: wordsK[i - 1], m: '', idxK: i - 1, idxM: -1 });
      i--;
    }
  }

  // Consolidate adjacent substitutions
  const tokensKufi: WordTokenAnalysis[] = [];
  const tokensMadani: WordTokenAnalysis[] = [];
  let diffCount = 0;

  let p = 0;
  while (p < rawPairs.length) {
    const pair = rawPairs[p];

    if (pair.k && pair.m) {
      const diff = classifyWordDifference(pair.k, pair.m);
      if (diff.type !== 'identical') diffCount++;

      tokensKufi.push({
        raw: pair.k,
        clean: cleanQuranToken(pair.k),
        type: diff.type,
        partner: pair.m,
        explanation: diff.explanation
      });
      tokensMadani.push({
        raw: pair.m,
        clean: cleanQuranToken(pair.m),
        type: diff.type,
        partner: pair.k,
        explanation: diff.explanation
      });
      p++;
    } else if (pair.k && !pair.m) {
      // Look ahead for replacement
      if (p + 1 < rawPairs.length && !rawPairs[p + 1].k && rawPairs[p + 1].m) {
        const nextM = rawPairs[p + 1].m;
        const diff = classifyWordDifference(pair.k, nextM);
        diffCount++;

        tokensKufi.push({
          raw: pair.k,
          clean: cleanQuranToken(pair.k),
          type: diff.type,
          partner: nextM,
          explanation: diff.explanation
        });
        tokensMadani.push({
          raw: nextM,
          clean: cleanQuranToken(nextM),
          type: diff.type,
          partner: pair.k,
          explanation: diff.explanation
        });
        p += 2;
      } else {
        diffCount++;
        tokensKufi.push({
          raw: pair.k,
          clean: cleanQuranToken(pair.k),
          type: 'lexical_diff',
          partner: '',
          explanation: `كلمة واردة في الكوفي وغير موجودة في هذا الموضع بالمدني`
        });
        p++;
      }
    } else if (!pair.k && pair.m) {
      if (p + 1 < rawPairs.length && rawPairs[p + 1].k && !rawPairs[p + 1].m) {
        const nextK = rawPairs[p + 1].k;
        const diff = classifyWordDifference(nextK, pair.m);
        diffCount++;

        tokensKufi.push({
          raw: nextK,
          clean: cleanQuranToken(nextK),
          type: diff.type,
          partner: pair.m,
          explanation: diff.explanation
        });
        tokensMadani.push({
          raw: pair.m,
          clean: cleanQuranToken(pair.m),
          type: diff.type,
          partner: nextK,
          explanation: diff.explanation
        });
        p += 2;
      } else {
        diffCount++;
        tokensMadani.push({
          raw: pair.m,
          clean: cleanQuranToken(pair.m),
          type: 'lexical_diff',
          partner: '',
          explanation: `كلمة واردة في المدني وغير موجودة في هذا الموضع بالكوفي`
        });
        p++;
      }
    }
  }

  return { tokensKufi, tokensMadani, diffCount };
}

/**
 * Compute the complete divergence analysis for a given Surah.
 */
export function analyzeSurahDivergence(
  surahNumber: number,
  kufiAyahs: QuranAyah[],
  madaniAyahs: QuranAyah[]
): SurahDivergenceAnalysis {
  // 1. Build bidirectional mappings
  const kufiToMadani = new Map<number, number[]>();
  const madaniToKufi = new Map<number, number[]>();

  madaniAyahs.forEach(mA => {
    const mNum = mA.numberInSurah;
    const hNums = mA.numberInHafs || [mNum];
    madaniToKufi.set(mNum, hNums);

    hNums.forEach(hNum => {
      const existing = kufiToMadani.get(hNum) || [];
      if (!existing.includes(mNum)) {
        existing.push(mNum);
        kufiToMadani.set(hNum, existing);
      }
    });
  });

  // Ensure all Kufi ayahs have an entry (fallback to identity if any edge case)
  kufiAyahs.forEach(kA => {
    const kNum = kA.numberInSurah;
    if (!kufiToMadani.has(kNum)) {
      kufiToMadani.set(kNum, [Math.min(kNum, madaniAyahs.length)]);
    }
  });

  const kufiShiftMap = new Map<number, AyahShiftInfo>();
  const madaniShiftMap = new Map<number, AyahShiftInfo>();
  const kufiWordDiffs = new Map<number, WordTokenAnalysis[]>();
  const madaniWordDiffs = new Map<number, WordTokenAnalysis[]>();

  let exactMatchesCount = 0;
  let shiftedVersesCount = 0;
  let splitVersesCount = 0;
  let mergedVersesCount = 0;
  let totalWordDifferences = 0;
  let totalLexicalDifferences = 0;
  let totalReadingDifferences = 0;
  const divergentAyahNumbersSet = new Set<number>();

  // 2. Classify Kufi Ayahs
  kufiAyahs.forEach(kA => {
    const kNum = kA.numberInSurah;
    const mappedM = kufiToMadani.get(kNum) || [kNum];

    let type: VerseShiftType = 'exact';
    let shiftOffset = 0;
    let badgeLabel = 'مطابقة تامة';
    let description = 'متطابقة تماماً في الترقيم وفواصل الآي';
    const crossVerseBreaks: CrossVerseBreak[] = [];

    if (mappedM.length > 1) {
      // 1 Kufi ayah split into multiple Madani ayahs
      type = 'split';
      splitVersesCount++;
      shiftOffset = mappedM[0] - kNum;
      badgeLabel = `انقسام إلى ${mappedM.length} آيات مدنية`;
      description = `عدّها الكوفيون آية واحدة، بينما قسمها أهل المدينة إلى الآيات: (${mappedM.join(', ')})`;
      divergentAyahNumbersSet.add(kNum);

      // Locate cross breaks inside Kufi text where Madani ayahs end
      let cumulativeWordCount = 0;
      for (let pIdx = 0; pIdx < mappedM.length - 1; pIdx++) {
        const mAyahPart = madaniAyahs[mappedM[pIdx] - 1];
        if (mAyahPart) {
          const partWords = mAyahPart.textUthmani.trim().split(/\s+/).filter(Boolean);
          cumulativeWordCount += partWords.length;
          crossVerseBreaks.push({
            wordIndex: cumulativeWordCount - 1,
            counterpartAyahNumber: mappedM[pIdx],
            counterpartMushaf: 'madani',
            label: `فاصلة مدنية: نهاية آية ${mappedM[pIdx]} (ورش)`
          });
        }
      }
    } else {
      const mNum = mappedM[0];
      const reverseK = madaniToKufi.get(mNum) || [mNum];

      if (reverseK.length > 1) {
        // Part of a merged Madani ayah
        type = 'merged';
        mergedVersesCount++;
        shiftOffset = mNum - kNum;
        const partIdx = reverseK.indexOf(kNum) + 1;
        badgeLabel = `مدمجة بالمدني (${partIdx}/${reverseK.length})`;
        description = `جمعها أهل المدينة مع الآيات (${reverseK.join(', ')}) لتشكل معاً الآية المدنية رقم ${mNum}`;
        divergentAyahNumbersSet.add(kNum);
      } else if (mNum !== kNum) {
        // Pure number shift
        type = 'shifted';
        shiftedVersesCount++;
        shiftOffset = mNum - kNum;
        const sign = shiftOffset > 0 ? `+${shiftOffset}` : `${shiftOffset}`;
        badgeLabel = `زحزحة ترقيم: ${sign}`;
        description = `تطابق في حدود الآية مع زحزحة بالترقيم (${sign})؛ تقابل الآية رقم ${mNum} في المدني`;
        divergentAyahNumbersSet.add(kNum);
      } else {
        exactMatchesCount++;
      }
    }

    // Word diff analysis
    // Compare with the text of its counterpart(s)
    const counterpartText = mappedM
      .map(mN => madaniAyahs[mN - 1]?.textUthmani || '')
      .filter(Boolean)
      .join(' ');

    const { tokensKufi, diffCount } = alignAndDiffVerseWords(kA.textUthmani, counterpartText);
    kufiWordDiffs.set(kNum, tokensKufi);
    totalWordDifferences += diffCount;

    const lexCount = tokensKufi.filter(t => t.type === 'lexical_diff').length;
    const readCount = tokensKufi.filter(t => t.type === 'reading_diff' || t.type === 'orthographic_diff').length;
    totalLexicalDifferences += lexCount;
    totalReadingDifferences += readCount;

    if (diffCount > 0) {
      divergentAyahNumbersSet.add(kNum);
    }

    kufiShiftMap.set(kNum, {
      mushaf: 'kufi',
      surahNumber,
      numberInSurah: kNum,
      type,
      shiftOffset,
      mappedNumbers: mappedM,
      badgeLabel,
      description,
      crossVerseBreaks,
      hasWordDiff: diffCount > 0,
      wordDiffCount: diffCount,
      hasLexicalDiff: lexCount > 0,
      lexicalDiffCount: lexCount,
      hasReadingDiff: readCount > 0,
      readingDiffCount: readCount
    });
  });

  // 3. Classify Madani Ayahs
  madaniAyahs.forEach(mA => {
    const mNum = mA.numberInSurah;
    const mappedK = madaniToKufi.get(mNum) || [mNum];

    let type: VerseShiftType = 'exact';
    let shiftOffset = 0;
    let badgeLabel = 'مطابقة تامة';
    let description = 'متطابقة تماماً في الترقيم وفواصل الآي';
    const crossVerseBreaks: CrossVerseBreak[] = [];

    if (mappedK.length > 1) {
      // Merged multiple Kufi ayahs into 1 Madani ayah
      type = 'merged';
      shiftOffset = mNum - mappedK[0];
      badgeLabel = `تضم ${mappedK.length} آيات كوفية`;
      description = `آية مدنية جامعة تضم الآيات الكوفية: (${mappedK.join(', ')})`;

      // Cross breaks inside Madani text where Kufi ayahs ended
      let cumulativeWordCount = 0;
      for (let pIdx = 0; pIdx < mappedK.length - 1; pIdx++) {
        const kAyahPart = kufiAyahs[mappedK[pIdx] - 1];
        if (kAyahPart) {
          const partWords = kAyahPart.textUthmani.trim().split(/\s+/).filter(Boolean);
          cumulativeWordCount += partWords.length;
          crossVerseBreaks.push({
            wordIndex: cumulativeWordCount - 1,
            counterpartAyahNumber: mappedK[pIdx],
            counterpartMushaf: 'kufi',
            label: `فاصلة كوفية: نهاية آية ${mappedK[pIdx]} (حفص)`
          });
        }
      }
    } else {
      const kNum = mappedK[0];
      const reverseM = kufiToMadani.get(kNum) || [kNum];

      if (reverseM.length > 1) {
        type = 'split';
        shiftOffset = mNum - kNum;
        const partIdx = reverseM.indexOf(mNum) + 1;
        badgeLabel = `شطر من آية كوفية (${partIdx}/${reverseM.length})`;
        description = `تمثل الشطر رقم ${partIdx} من الآية الكوفية رقم ${kNum}`;
      } else if (mNum !== kNum) {
        type = 'shifted';
        shiftOffset = mNum - kNum;
        const sign = shiftOffset > 0 ? `+${shiftOffset}` : `${shiftOffset}`;
        badgeLabel = `زحزحة ترقيم: ${sign}`;
        description = `تطابق في حدود الآية مع زحزحة بالترقيم (${sign})؛ تقابل الآية رقم ${kNum} في الكوفي`;
      }
    }

    const counterpartText = mappedK
      .map(kN => kufiAyahs[kN - 1]?.textUthmani || '')
      .filter(Boolean)
      .join(' ');

    const { tokensMadani, diffCount } = alignAndDiffVerseWords(counterpartText, mA.textUthmani);
    madaniWordDiffs.set(mNum, tokensMadani);

    const lexCountM = tokensMadani.filter(t => t.type === 'lexical_diff').length;
    const readCountM = tokensMadani.filter(t => t.type === 'reading_diff' || t.type === 'orthographic_diff').length;

    madaniShiftMap.set(mNum, {
      mushaf: 'madani',
      surahNumber,
      numberInSurah: mNum,
      type,
      shiftOffset,
      mappedNumbers: mappedK,
      badgeLabel,
      description,
      crossVerseBreaks,
      hasWordDiff: diffCount > 0,
      wordDiffCount: diffCount,
      hasLexicalDiff: lexCountM > 0,
      lexicalDiffCount: lexCountM,
      hasReadingDiff: readCountM > 0,
      readingDiffCount: readCountM
    });
  });

  return {
    surahNumber,
    kufiAyahsCount: kufiAyahs.length,
    madaniAyahsCount: madaniAyahs.length,
    ayahDifference: madaniAyahs.length - kufiAyahs.length,
    exactMatchesCount,
    shiftedVersesCount,
    splitVersesCount,
    mergedVersesCount,
    totalWordDifferences,
    totalLexicalDifferences,
    totalReadingDifferences,
    kufiShiftMap,
    madaniShiftMap,
    kufiWordDiffs,
    madaniWordDiffs,
    divergentAyahNumbers: Array.from(divergentAyahNumbersSet).sort((a, b) => a - b)
  };
}

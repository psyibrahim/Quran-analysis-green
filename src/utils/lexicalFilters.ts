/**
 * Quranic Lexical Analysis and Custom Filtering Engine
 * Provides granular user-controlled filtering, normalization, and stopword exclusion
 * for Surah Lexical Comparison and Vocabulary Diversity (TTR).
 */

import { QuranAyah, QuranSurahCorpus, SurahData } from '../types';
import { 
  cleanArabicLetters, 
  cleanQuranicWord, 
  normalizeArabicText, 
  toCanonicalLexicalLemma, 
  isSameLexicalLemma 
} from './arabic';

export interface LexicalFilterOptions {
  // --- 1. أدوات وحروف المعاني (Stopwords & Connectors) ---
  excludePrepositions: boolean;       // حروف الجر: في، على، من، إلى، عن، حتى، لدن...
  excludeConjunctions: boolean;      // حروف العطف والربط: و، فـ، ثم، أو، أم، بل، لكن...
  excludeParticles: boolean;         // أدوات التوكيد والشرط والنفي: إن، أن، ما، لا، إلا، إذا، إذ، لم، لن، قد...
  excludePronounsAndNouns: boolean;   // الضمائر وأسماء الإشارة والموصول: هو، هي، هم، هذا، ذلك، الذي، الذين...

  // --- 2. توحيد السوابق والزوائد (Prefix Normalization) ---
  stripWawPrefix: boolean;           // إلحاق واو العطف: اعتبار "والله" و"الله"، "وقال" و"قال" كلمة واحدة
  stripFaPrefix: boolean;            // إلحاق فاء العطف: اعتبار "فالله" و"الله"، "فقال" و"قال" كلمة واحدة
  stripBaPrefix: boolean;            // إلحاق باء الجر: اعتبار "بالله" و"الله" كلمة واحدة
  stripLamPrefix: boolean;           // إلحاق لام الجر/الابتداء: اعتبار "لله" و"الله" كلمة واحدة
  stripAlPrefix: boolean;            // تجريد "الـ" التعريفية: اعتبار "الكتاب" و"كتاب" كلمة واحدة

  // --- 3. توحيد الرسم الإملائي (Orthographic Normalization) ---
  normalizeAlef: boolean;            // توحيد الألفات (أ، إ، آ، ٱ -> ا)
  normalizeTaaMarbuta: boolean;      // توحيد التاء المربوطة (ة -> ه)
  normalizeYaa: boolean;             // توحيد الياء والألف المقصورة (ى -> ي)

  // --- 4. ضوابط الطول والكمية ---
  minWordLength: number;             // الحد الأدنى لطول الكلمة (عدد الحروف)
  topWordsCount: number;             // عدد الكلمات المعروضة (5, 10, 15, 20)
  sortBy: 'frequency' | 'alphabetical'; // معيار الترتيب: حسب التكرار أو أبجدياً

  // --- 5. استبعاد مخصص (Custom Exclusions) ---
  customExcludedWords: string[];     // كلمات يدخلها المستخدم بنفسه لإقصائها

  // --- 6. نمط حساب مؤشر التنوع المعجمي (TTR Mode) ---
  ttrCalculationMode: 'raw' | 'filtered'; // حساب التنوع على كامل النص الأصلي أو على المفردات المصفاة
}

/**
 * Default options:
 * تم تفعيل توحيد السوابق والزوائد افتراضياً (الواو، الفاء، الباء، اللام) لمنع تشتيت الكلمة الواحدة
 * مثل جمع "الله" و"والله" و"بالله" و"لله" تحت مظلة معجمية موحدة.
 */
export const DEFAULT_LEXICAL_OPTIONS: LexicalFilterOptions = {
  excludePrepositions: false,
  excludeConjunctions: false,
  excludeParticles: false,
  excludePronounsAndNouns: false,

  // توحيد السوابق والزوائد مفعل افتراضياً
  stripWawPrefix: true,
  stripFaPrefix: true,
  stripBaPrefix: true,
  stripLamPrefix: true,
  stripAlPrefix: false,

  normalizeAlef: false,
  normalizeTaaMarbuta: false,
  normalizeYaa: false,

  minWordLength: 1,
  topWordsCount: 10,
  sortBy: 'frequency',

  customExcludedWords: [],
  ttrCalculationMode: 'raw',
};


// ==========================================
// مجموعات الأدوات وحروف المعاني في لغة القرآن
// ==========================================

export const ARABIC_PREPOSITIONS = new Set([
  'في', 'فى', 'من', 'على', 'علي', 'إلى', 'إلي', 'الى', 'الي', 'عن', 'حتى', 'حتي', 'مع', 'منذ', 'مذ', 'خلا', 'عدا', 'حاشا', 
  'رب', 'لدن', 'لدى', 'لدي', 'تالله'
]);

export const ARABIC_CONJUNCTIONS = new Set([
  'و', 'ف', 'ثم', 'أو', 'أم', 'بل', 'لكن', 'لا', 'إما', 'حيث', 'حيثما'
]);

export const ARABIC_PARTICLES = new Set([
  'إن', 'أن', 'ان', 'إنما', 'أنما', 'انما', 'كأن', 'كأنما', 'ليت', 'لعل', 
  'إذا', 'اذا', 'إذ', 'اذ', 'ما', 'لا', 'إلا', 'الا', 'غير', 'سوى', 'سوي', 
  'لم', 'لن', 'لما', 'كي', 'لكيلا', 'إذن', 'اذن', 'لو', 'لولا', 'لوما', 
  'قد', 'سوف', 'هل', 'أ', 'نعم', 'بلى', 'بلي', 'ألا', 'الا', 'أما', 'اما', 'إي', 'اي', 'كلا', 
  'أي', 'اي', 'أيها', 'ايها', 'أيتها', 'ايتها', 'يا', 'إياك', 'اياك', 'إياكم', 'اياكم', 'إيانا', 'ايانا'
]);

export const ARABIC_PRONOUNS_AND_RELATIVES = new Set([
  'هو', 'هي', 'هى', 'هما', 'هم', 'هن', 'أنا', 'انا', 'نحن', 'أنت', 'انت', 'أنتما', 'انتما', 'أنتم', 'انتم', 'أنتن', 'انتن',
  'هذا', 'هذه', 'هذان', 'هاتان', 'هؤلاء', 'ذلك', 'ذلكم', 'ذلكما', 'تلك', 'أولئك', 'اولئك', 'هنا', 'هنالك',
  'الذي', 'الذى', 'التي', 'التى', 'اللذان', 'اللتان', 'الذين', 'اللاتي', 'اللاتى', 'اللواتي', 'اللواتى', 'الأولى', 'الاولى', 'الاولى'
]);

// كلمات أصلية تبدأ بالواو أو الفاء أو الباء أو اللام ويجب الحفاظ عليها من الحذف الخاطئ
const INTRINSIC_WAW_WORDS = new Set([
  'ويل', 'وقت', 'وجه', 'وجوه', 'وحي', 'وحى', 'واد', 'وادي', 'وادى', 'وزن', 'ورق', 'ورد', 'وسط', 'وسع', 
  'وتر', 'وجد', 'واحد', 'واحدة', 'والد', 'والدة', 'ولد', 'ولدا', 'وعد', 'وعيد', 'وقود', 
  'وراء', 'وفاقا', 'وثاق', 'وثقى', 'وثقي', 'وزر', 'وزير', 'وقار', 'وقارا', 'وعظ', 'وعظة', 'وهن', 'وهب', 'وهاب'
]);

const INTRINSIC_FA_WORDS = new Set([
  'في', 'فى', 'فوق', 'فم', 'فمه', 'فلق', 'فوز', 'فائز', 'فاسق', 'فاسقين', 'فرعون', 'فرد', 
  'فردوس', 'فرات', 'فلك', 'فلكا', 'فئة', 'فئه', 'فئتين', 'فوج', 'فصل', 'فضة', 'فضه', 'فضل', 'فجر', 'فتح'
]);

const INTRINSIC_BA_WORDS = new Set([
  'بين', 'بيت', 'بيوت', 'باب', 'أبواب', 'بحر', 'بحار', 'بعث', 'بعض', 'بعد', 'بصر', 
  'بصير', 'بطن', 'بطون', 'بشر', 'بشير', 'بل', 'بلد', 'بلدة', 'بني', 'بنين', 'بنت', 
  'بنات', 'بأس', 'بئر', 'بطل', 'بكر', 'بكرة', 'بر', 'برهان', 'براءة', 'بروج', 'برد', 'بردا', 'برق',
  'بعل', 'بعلا', 'بعلى', 'بعلي', 'بعلها', 'بعولتهن', 'بعيد', 'بعيدا', 'بغتة', 'بغيا', 'بغل', 'بغال', 'بضع', 'بضاعة', 'بخل', 'بخلوا'
]);

const INTRINSIC_LAM_WORDS = new Set([
  'لا', 'لو', 'لم', 'لن', 'لما', 'لولا', 'لوما', 'لدن', 'لكن', 'لكنه', 'ليس', 'ليل', 'ليلة', 'ليلا', 'لوح', 'لوط', 'لحم', 
  'لحية', 'لباس', 'لبن', 'لسان', 'لهب', 'لقمان', 'لؤلؤ', 'لظى',
  'لعل', 'لعلي', 'لعلى', 'لعلهم', 'لعلك', 'لعلكم', 'لعلنا', 'لعله', 'لعلها',
  'لدى', 'لديه', 'لديهم', 'لدينا', 'لماذا', 'لهو', 'لغو', 'لحاف', 'لمزة', 'لمز'
]);

// كلمات مصانة من تجريد "الـ" لأن الألف واللام فيها أصلية من جذر الكلمة أو علم خاص
const PROTECTED_FROM_AL = new Set([
  'الله', 'إله', 'الذي', 'التي', 'الذين', 'اللاتي', 'اللواتي', 'اللوائي', 'الأولى', 'الآن',
  'العلى', 'العلىٰ', 'العليا', 'الأعلى', 'الأعلىٰ', 'الأعلون', 'الأعلين',
  'اليسع', 'إلياس', 'اللات', 'العزى'
]);

/**
 * تنظيف وتحويل الكلمة من الرسم العثماني إلى الإملاء القياسي الحديث الصرف.
 * يعتمد على cleanQuranicWord لمعالجة الألف الخنجرية وهمزة الوصل والواوات العثمانية
 * دون المساس ببنية الكلمة أو جذرها.
 */
export function cleanArabicWord(word: string): string {
  if (!word) return '';
  return cleanQuranicWord(word);
}

/**
 * Normalize orthography (Alef variants, Taa Marbuta, Yaa, and Uthmani orthography mappings)
 */
export function normalizeOrthography(
  word: string, 
  options: Pick<LexicalFilterOptions, 'normalizeAlef' | 'normalizeTaaMarbuta' | 'normalizeYaa'>
): string {
  let result = word;

  // 1. Uthmani Waw-based endings and Open Taa mappings for word matching
  result = result
    .replace(/^الصلوة$/g, 'الصلاة')
    .replace(/^صلوة$/g, 'صلاة')
    .replace(/^الزكوة$/g, 'الزكاة')
    .replace(/^زكوة$/g, 'زكاة')
    .replace(/^الحيوة$/g, 'الحياة')
    .replace(/^حيوة$/g, 'حياة')
    .replace(/^مشكوة$/g, 'مشكاة')
    .replace(/^النجوة$/g, 'النجاة')
    .replace(/^نجوة$/g, 'نجاة')
    .replace(/^الغدوة$/g, 'الغداة')
    .replace(/^منوة$/g, 'مناة')
    .replace(/^الربوا$/g, 'الربا')
    .replace(/^ربوا$/g, 'ربا')
    .replace(/^رحمت$/g, 'رحمة')
    .replace(/^نعمت$/g, 'نعمة')
    .replace(/^امرأت$/g, 'امرأة')
    .replace(/^امرات$/g, 'امرأة')
    .replace(/^سنت$/g, 'سنة')
    .replace(/^لعنت$/g, 'لعنة')
    .replace(/^فطرت$/g, 'فطرة')
    .replace(/^شجرت$/g, 'شجرة')
    .replace(/^قرت$/g, 'قرة')
    .replace(/^جنت$/g, 'جنة')
    .replace(/^معصيت$/g, 'معصية')
    .replace(/^كلمت$/g, 'كلمة')
    .replace(/^ابنت$/g, 'ابنة');

  if (options.normalizeAlef) {
    result = result.replace(/[إأآٱ]/g, 'ا');
  }
  if (options.normalizeTaaMarbuta) {
    result = result.replace(/ة/g, 'ه');
  }
  if (options.normalizeYaa) {
    result = result.replace(/ى/g, 'ي');
  }
  return result;
}

/**
 * Strip conjunctions/prepositions prefixes ('و', 'ف', 'ب', 'ل', 'ال')
 * with special attention to "الله" and "والله" / "بالله" / "لله" / "فالله".
 */
export function stripWordPrefixes(word: string, options: LexicalFilterOptions): string {
  if (!word) return '';
  let current = word;

  // 0. توحيد لفظ الجلالة الشريف وكافة متعلقاته وسوابقه العاطفة وحروف الجر والقسم بصورة جذرية
  const cleanNorm = current.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي');
  if (
    cleanNorm === 'الله' || cleanNorm === 'والله' || cleanNorm === 'بالله' || cleanNorm === 'تالله' ||
    cleanNorm === 'لله' || cleanNorm === 'ولله' || cleanNorm === 'فلله' || cleanNorm === 'فالله' ||
    cleanNorm === 'وبالله' || cleanNorm === 'فبالله' || cleanNorm === 'ابالله' || cleanNorm === 'وتالله'
  ) {
    return 'الله';
  }
  if (cleanNorm === 'اللهم' || cleanNorm === 'واللهم') {
    return 'اللهم';
  }

  // Handle special case of "لله" -> "الله" when stripLamPrefix is active
  if (options.stripLamPrefix && (current === 'لله' || current === 'ولله' || current === 'فلله')) {
    if (current === 'ولله' && options.stripWawPrefix) return 'الله';
    if (current === 'فلله' && options.stripFaPrefix) return 'الله';
    if (current === 'لله') return 'الله';
  }


  // 1. Strip 'و' prefix
  if (options.stripWawPrefix && current.startsWith('و') && current.length >= 3) {
    const candidate = current.slice(1);
    if (!INTRINSIC_WAW_WORDS.has(current)) {
      current = candidate;
    }
  }

  // 2. Strip 'ف' prefix
  if (options.stripFaPrefix && current.startsWith('ف') && current.length >= 3) {
    const candidate = current.slice(1);
    if (!INTRINSIC_FA_WORDS.has(current)) {
      current = candidate;
    }
  }

  // 3. Strip 'ب' prefix
  if (options.stripBaPrefix && current.startsWith('ب') && current.length >= 3) {
    const candidate = current.slice(1);
    if (!INTRINSIC_BA_WORDS.has(current)) {
      current = candidate;
    }
  }

  // 4. Strip 'ل' prefix (مع مراعاة إدغام لام الجر في أل التعريف: مثل للناس -> ناس أو الناس، للنساء -> نساء أو النساء)
  if (options.stripLamPrefix && current.startsWith('لل') && current.length >= 4) {
    if (options.stripAlPrefix) {
      current = current.slice(2);
    } else {
      current = 'ال' + current.slice(2);
    }
  } else if (options.stripLamPrefix && current.startsWith('ل') && current.length >= 3) {
    if (current === 'لله') {
      current = 'الله';
    } else {
      const candidate = current.slice(1);
      if (!INTRINSIC_LAM_WORDS.has(current)) {
        current = candidate;
      }
    }
  }

  // 5. Strip 'ال' prefix
  if (options.stripAlPrefix && current.startsWith('ال') && current.length >= 4) {
    if (!PROTECTED_FROM_AL.has(current)) {
      current = current.slice(2);
    }
  }

  return current;
}

/**
 * Determine whether a processed word should be excluded based on active options
 */
export function isWordExcluded(word: string, options: LexicalFilterOptions): boolean {
  if (!word || word.length < options.minWordLength) {
    return true;
  }

  // Check custom user excluded words
  if (options.customExcludedWords.length > 0) {
    const cleanCustom = options.customExcludedWords.map(w => cleanArabicWord(w).trim());
    if (cleanCustom.includes(word)) {
      return true;
    }
  }

  // Check Prepositions
  if (options.excludePrepositions && ARABIC_PREPOSITIONS.has(word)) {
    return true;
  }

  // Check Conjunctions
  if (options.excludeConjunctions && ARABIC_CONJUNCTIONS.has(word)) {
    return true;
  }

  // Check Particles
  if (options.excludeParticles && ARABIC_PARTICLES.has(word)) {
    return true;
  }

  // Check Pronouns and Relatives
  if (options.excludePronounsAndNouns && ARABIC_PRONOUNS_AND_RELATIVES.has(word)) {
    return true;
  }

  return false;
}

export interface MergedVariantInfo {
  variant: string;
  count: number;
}

export interface WordFrequencyItem {
  word: string;
  count: number;
  percentage: number;
  mergedVariants?: MergedVariantInfo[];
}

export interface LexicalAnalysisResult {
  surahNumber: number;
  totalOriginalTokens: number;
  totalFilteredTokens: number;
  uniqueOriginalWords: number;
  uniqueFilteredWords: number;
  rawTTR: number;
  filteredTTR: number;
  activeTTR: number;
  topWords: WordFrequencyItem[];
  excludedTokensCount: number;
}

/**
 * Analyzes words of a Surah using the provided corpus and customizable options.
 */
export function analyzeSurahLexicon(
  surahNumber: number,
  corpusSurah: QuranSurahCorpus | undefined,
  options: LexicalFilterOptions
): LexicalAnalysisResult {
  if (!corpusSurah || !corpusSurah.ayahs || corpusSurah.ayahs.length === 0) {
    return {
      surahNumber,
      totalOriginalTokens: 0,
      totalFilteredTokens: 0,
      uniqueOriginalWords: 0,
      uniqueFilteredWords: 0,
      rawTTR: 0,
      filteredTTR: 0,
      activeTTR: 0,
      topWords: [],
      excludedTokensCount: 0,
    };
  }

  // Extract all words from the surah's verses
  const rawWords: string[] = [];
  corpusSurah.ayahs.forEach(ayah => {
    const text = (ayah.textUthmani || ayah.textSimple || '').trim();
    if (!text) return;
    const tokens = text.split(/\s+/);
    tokens.forEach(tok => {
      const cleaned = cleanArabicWord(tok);
      if (cleaned.length > 0) {
        rawWords.push(cleaned);
      }
    });
  });

  const totalOriginalTokens = rawWords.length;
  const originalWordCounts: Record<string, number> = {};
  rawWords.forEach(w => {
    originalWordCounts[w] = (originalWordCounts[w] || 0) + 1;
  });
  const uniqueOriginalWords = Object.keys(originalWordCounts).length;
  const rawTTR = totalOriginalTokens > 0 
    ? Number(((uniqueOriginalWords / totalOriginalTokens) * 100).toFixed(2)) 
    : 0;

  // Process words through normalization and filtering pipeline
  const filteredWordMap: Record<string, { count: number; variants: Record<string, number> }> = {};
  let totalFilteredTokens = 0;
  let excludedTokensCount = 0;

  rawWords.forEach(originalWord => {
    // 1. Normalization & Prefix Stripping
    let processed = stripWordPrefixes(originalWord, options);
    processed = normalizeOrthography(processed, options);

    // 2. Exclusion Check
    if (isWordExcluded(processed, options)) {
      excludedTokensCount++;
      return;
    }

    // Word passed all filters!
    totalFilteredTokens++;
    if (!filteredWordMap[processed]) {
      filteredWordMap[processed] = { count: 0, variants: {} };
    }
    filteredWordMap[processed].count += 1;
    filteredWordMap[processed].variants[originalWord] = (filteredWordMap[processed].variants[originalWord] || 0) + 1;
  });

  const uniqueFilteredWords = Object.keys(filteredWordMap).length;
  const filteredTTR = totalFilteredTokens > 0
    ? Number(((uniqueFilteredWords / totalFilteredTokens) * 100).toFixed(2))
    : 0;

  const activeTTR = options.ttrCalculationMode === 'filtered' ? filteredTTR : rawTTR;

  // Sort and extract Top Words
  const allFilteredEntries = Object.entries(filteredWordMap).map(([word, data]) => {
    const variantList: MergedVariantInfo[] = Object.entries(data.variants)
      .map(([variant, count]) => ({ variant, count }))
      .sort((a, b) => b.count - a.count);

    return {
      word,
      count: data.count,
      percentage: totalFilteredTokens > 0 ? Number(((data.count / totalFilteredTokens) * 100).toFixed(2)) : 0,
      mergedVariants: variantList.length > 1 ? variantList : undefined,
    };
  });

  if (options.sortBy === 'alphabetical') {
    allFilteredEntries.sort((a, b) => a.word.localeCompare(b.word, 'ar'));
  } else {
    // Frequency descending
    allFilteredEntries.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.word.localeCompare(b.word, 'ar');
    });
  }

  const topWords = allFilteredEntries.slice(0, options.topWordsCount);

  return {
    surahNumber,
    totalOriginalTokens,
    totalFilteredTokens,
    uniqueOriginalWords,
    uniqueFilteredWords,
    rawTTR,
    filteredTTR,
    activeTTR,
    topWords,
    excludedTokensCount,
  };
}

/**
 * Compute shared / common vocabulary across selected surahs given their analysis results.
 */
export function computeSharedVocabulary(
  surahResults: LexicalAnalysisResult[],
  surahsMeta: SurahData[],
  maxShared = 10
): { word: string; counts: number[]; percentages: number[]; variantsSummary?: string }[] {
  if (surahResults.length < 2) return [];

  const firstTop = surahResults[0].topWords;
  const shared: { word: string; counts: number[]; percentages: number[]; variantsSummary?: string }[] = [];

  firstTop.forEach(item => {
    const targetWord = item.word;
    const presentInAll = surahResults.every(res => 
      res.topWords.some(w => w.word === targetWord)
    );

    if (presentInAll) {
      const counts = surahResults.map(res => {
        const match = res.topWords.find(w => w.word === targetWord);
        return match ? match.count : 0;
      });
      const percentages = surahResults.map(res => {
        const match = res.topWords.find(w => w.word === targetWord);
        return match ? match.percentage : 0;
      });

      // Check if any surah has merged variants
      const allVariants = new Set<string>();
      surahResults.forEach(res => {
        const match = res.topWords.find(w => w.word === targetWord);
        if (match && match.mergedVariants) {
          match.mergedVariants.forEach(v => allVariants.add(v.variant));
        }
      });

      const variantsSummary = allVariants.size > 1 ? Array.from(allVariants).join('، ') : undefined;

      shared.push({
        word: targetWord,
        counts,
        percentages,
        variantsSummary,
      });
    }
  });

  return shared.slice(0, maxShared);
}

export interface MatchedAyahResult {
  ayah: QuranAyah;
  occurrencesCount: number;
  matchedTokenIndices: number[];
}

/**
 * Finds exclusively the verses within a surah containing the target word or its merged variants.
 * Strictly filters out verses that do NOT contain the word.
 */
export function findMatchingAyahsForWord(
  ayahs: QuranAyah[] | undefined,
  targetWord: string,
  options?: LexicalFilterOptions,
  mergedVariants?: MergedVariantInfo[]
): {
  matchingAyahs: MatchedAyahResult[];
  totalOccurrences: number;
} {
  const matchingAyahs: MatchedAyahResult[] = [];
  let totalOccurrences = 0;

  if (!ayahs || ayahs.length === 0 || !targetWord) {
    return { matchingAyahs, totalOccurrences };
  }

  const cleanTarget = cleanArabicWord(targetWord);
  if (!cleanTarget) {
    return { matchingAyahs, totalOccurrences };
  }

  const normTarget = normalizeArabicText(targetWord);

  // Pre-compute lookup sets for surface variants
  const variantSet = new Set<string>();
  
  const addVariants = (w: string) => {
    if (!w) return;
    variantSet.add(w);
    const cleaned = cleanArabicWord(w);
    if (cleaned) {
      variantSet.add(cleaned);
      // Uthmani Dotless Yaa (ى) vs Modern Dotted Yaa (ي) compatibility:
      // In the Uthmani text of the Quran, all final Yaas are written dotless (ى).
      // On standard modern Arabic keyboards, users always type final Yaa with dots (ي).
      // They are the exact same orthographic word and must always be matched bidirectionally.
      variantSet.add(cleaned.replace(/ى/g, 'ي'));
      variantSet.add(cleaned.replace(/ي/g, 'ى'));
      variantSet.add(cleaned.replace(/ى$/g, 'ي'));
      variantSet.add(cleaned.replace(/ي$/g, 'ى'));
      // Alef Hamza variants (إ, أ, آ ↔ ا)
      if (cleaned.startsWith('ا') || cleaned.startsWith('إ') || cleaned.startsWith('أ') || cleaned.startsWith('آ')) {
        const rest = cleaned.slice(1);
        ['ا', 'إ', 'أ', 'آ'].forEach(alef => {
          variantSet.add(alef + rest);
          variantSet.add(alef + rest.replace(/ى/g, 'ي'));
          variantSet.add(alef + rest.replace(/ي/g, 'ى'));
        });
      }
      if (options?.normalizeTaaMarbuta) {
        variantSet.add(cleaned.replace(/ة/g, 'ه'));
        variantSet.add(cleaned.replace(/ه$/g, 'ة'));
      }
    }
  };

  addVariants(targetWord);
  addVariants(cleanTarget);

  // إذا كانت الكلمة المستهدفة هي "الله" أو أي من صيغها، نضيف كافة تصاريفها القرآنية
  const canonTarget = toCanonicalLexicalLemma(cleanTarget);
  if (canonTarget === 'الله') {
    const ALLAH_CANONICAL_VARIANTS = [
      'الله', 'والله', 'بالله', 'تالله', 'لله', 'ولله', 'فلله', 'فالله', 
      'وبالله', 'فبالله', 'ابالله', 'وتالله'
    ];
    ALLAH_CANONICAL_VARIANTS.forEach(v => addVariants(v));
  }

  if (mergedVariants && mergedVariants.length > 0) {

    mergedVariants.forEach(v => {
      addVariants(v.variant);
    });
  }

  // Normalized form of the target according to current lexical options
  const normalizedTarget = options 
    ? normalizeOrthography(stripWordPrefixes(cleanTarget, options), options)
    : cleanTarget;

  ayahs.forEach(ayah => {
    // ALWAYS use the exact same canonical token stream as rendered in the UI
    const tokens = (ayah.textUthmani || ayah.textSimple || '').trim().split(/\s+/);
    const matchedIndices: number[] = [];
    let ayahOccurrences = 0;

    tokens.forEach((rawToken, idx) => {
      if (!rawToken) return;
      const stdWord = cleanArabicWord(rawToken);
      if (!stdWord) return; // Skip punctuation, waqf symbols, or non-letter tokens

      // حماية صارمة لمنع التداخل والخلط بين الكلمات (Strict Tokenization Boundaries):
      // 1. "على" (حرف جر) لا يجوز أبداً أن يطابق "العلى" أو "الأعلى" أو "لعلي/لعلى" أو "عليم" أو "عليهم"
      if (cleanTarget === 'على' || cleanTarget.replace(/ى/g, 'ي') === 'علي') {
        if (
          stdWord === 'العلى' || stdWord === 'العليا' || stdWord === 'الاعلى' || stdWord === 'الأعلى' ||
          stdWord === 'لعلى' || stdWord === 'لعلي' || stdWord.startsWith('لعل') ||
          stdWord.startsWith('عليم') || stdWord.startsWith('عليهم') || stdWord.startsWith('عليكم') ||
          stdWord === 'علانية' || stdWord === 'علوا' || stdWord === 'علو'
        ) {
          return;
        }
      }

      // 2. "نساء" لا يجوز أبداً أن يطابق "الانسان" أو "الإنسان" أو "ينساك" أو "ننسخ"
      if (cleanTarget === 'نساء' || cleanTarget === 'النساء') {
        if (
          stdWord.includes('انسان') || stdWord.includes('إنسان') ||
          stdWord.startsWith('ينس') || stdWord.startsWith('ننس')
        ) {
          return;
        }
      }

      let isMatch = false;

      // 1. If mergedVariants is provided (from analyzeSurahLexicon), match against the known variants
      if (mergedVariants && mergedVariants.length > 0) {
        if (
          variantSet.has(stdWord) ||
          variantSet.has(rawToken) ||
          variantSet.has(stdWord.replace(/ى/g, 'ي')) ||
          variantSet.has(stdWord.replace(/ي/g, 'ى')) ||
          variantSet.has(stdWord.replace(/ى$/g, 'ي')) ||
          variantSet.has(stdWord.replace(/ي$/g, 'ى')) ||
          (options?.normalizeTaaMarbuta && (
            variantSet.has(stdWord.replace(/ة/g, 'ه')) ||
            variantSet.has(stdWord.replace(/ه$/g, 'ة'))
          )) ||
          stdWord === cleanTarget ||
          stdWord === targetWord ||
          stdWord.replace(/ى/g, 'ي') === cleanTarget.replace(/ى/g, 'ي')
        ) {
          isMatch = true;
        }
      } else {
        // Direct or variant match (strict orthography with Uthmani Yaa/Maqsura compatibility and Hamza equivalence)
        if (
          stdWord === cleanTarget ||
          stdWord === targetWord ||
          variantSet.has(stdWord) ||
          variantSet.has(stdWord.replace(/ى/g, 'ي')) ||
          variantSet.has(stdWord.replace(/ي/g, 'ى')) ||
          stdWord.replace(/ى/g, 'ي') === cleanTarget.replace(/ى/g, 'ي') ||
          stdWord.replace(/ي/g, 'ى') === cleanTarget.replace(/ي/g, 'ى') ||
          stdWord.replace(/ى$/g, 'ي') === cleanTarget.replace(/ى$/g, 'ي') ||
          stdWord.replace(/ي$/g, 'ى') === cleanTarget.replace(/ي$/g, 'ى') ||
          stdWord.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي') === cleanTarget.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي') ||
          (options?.normalizeTaaMarbuta && (
            stdWord.replace(/ة/g, 'ه') === cleanTarget.replace(/ة/g, 'ه') ||
            stdWord.replace(/ه$/g, 'ة') === cleanTarget.replace(/ه$/g, 'ة')
          ))
        ) {
          isMatch = true;
        }

        // 2. Normalized pipeline match (prefix stripping + orthography options)
        if (!isMatch && options) {
          const stripped = stripWordPrefixes(stdWord, options);
          const processed = normalizeOrthography(stripped, options);

          if (
            processed === normalizedTarget ||
            processed === cleanTarget ||
            processed.replace(/ى/g, 'ي') === normalizedTarget.replace(/ى/g, 'ي') ||
            processed.replace(/ى/g, 'ي') === cleanTarget.replace(/ى/g, 'ي') ||
            processed.replace(/ى$/g, 'ي') === normalizedTarget.replace(/ى$/g, 'ي') ||
            processed.replace(/ى$/g, 'ي') === cleanTarget.replace(/ى$/g, 'ي') ||
            (options.normalizeTaaMarbuta && (
              processed.replace(/ة/g, 'ه') === normalizedTarget.replace(/ة/g, 'ه')
            ))
          ) {
            isMatch = true;
          } else if (options.normalizeAlef) {
            const alefProcessed = processed.replace(/[إأآٱ]/g, 'ا');
            const alefTarget = normalizedTarget.replace(/[إأآٱ]/g, 'ا');
            if (alefProcessed === alefTarget) {
              isMatch = true;
            }
          }
        }

        // 3. المطابقة المعجمية الجذرية الموحدة (Canonical Lemma Match)
        if (!isMatch && isSameLexicalLemma(stdWord, cleanTarget)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        matchedIndices.push(idx);
        ayahOccurrences++;
      }
    });

    // STRICT CONSTRAINT: Only include this ayah if the word actually appears in it!
    if (ayahOccurrences > 0) {
      matchingAyahs.push({
        ayah,
        occurrencesCount: ayahOccurrences,
        matchedTokenIndices: matchedIndices,
      });
      totalOccurrences += ayahOccurrences;
    }
  });

  return {
    matchingAyahs,
    totalOccurrences,
  };
}

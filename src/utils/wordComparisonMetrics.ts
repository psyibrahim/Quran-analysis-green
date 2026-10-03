/**
 * wordComparisonMetrics.ts
 * محرك الحساب الرياضي والإحصائي الحتمي لمقارنة الكلمات والألفاظ القرآنية.
 * خوارزميات إحصائية محايدة وموضوعية تماماً: أرقام خام، مصفوفات تقاطع، حصر التزامن النصي، مسافات التقارب، وتحليل السوابق واللواحق.
 */

import { 
  QuranSurahCorpus, 
  WordMatchMode, 
  WordSingleStats, 
  WordPairCooccurrence, 
  WordAyahMatch, 
  SurahWordBreakdownRow, 
  WordComparisonReport,
  WordOccurItem,
  WordAffixStats,
  WordDispersionSurahItem,
  WordFormVariant
} from '../types';
import { formatSurahName } from './arabic';
import { isTokenInRoot } from './arabicRoots';

/**
 * تنظيف وتطبيع التوكن القرآني بصورة علمية دقيقة للبحث والمطابقة
 * - لا يحذف الهمزة المفردة (ء) لمنع خلط ماء بـ ما، وشيء بـ شي، وسوء بـ سو
 * - يوحد أشكال الألف (أ إ آ ٱ) إلى (ا)
 * - يوحد الواو العثمانية المنقلبة ذات الألف الخنجرية (الصلوة -> الصلاه)
 * - يوحد التاء المربوطة والمفتوحة في الرسم العثماني (رحمت -> رحمه، نعمت -> نعمه)
 * - يوحد الياء والألف المقصورة (ى -> ي)
 */
/**
 * تنظيف وتطبيع التوكن القرآني بصورة علمية حتمية تربط الرسم العثماني بالإملاء القياسي الحديث
 * - يحافظ على الألفات الخنجرية في وسط الكلمات (شَيَٰطِين -> شياطين، قِيَٰم -> قيام، سُلَيْمَٰن -> سليمان)
 * - يحافظ على الألف المقصورة والياء في أواخر الكلمات (علىٰ -> علي، موسىٰ -> موسي)
 * - يحول الأحرف الملحقة الصغرى إلى أحرف قياسية (داوۥد -> داود/داوود، إبرٰهـۧم -> ابراهيم)
 * - يوحد الواو العثمانية المنقلبة (الصلوة -> الصلاة، الزكوة -> الزكاة، الحيوة -> الحياة)
 * - يوحد أشكال الهمزات والألفات
 */
export function normalizeQuranicToken(s: string): string {
  if (!s) return '';
  let w = s
    .replace(/[\uFEFF\u200B-\u200D]/g, '')
    .replace(/[\u064B-\u065F\u0653]/g, '') // إزالة الحركات والتنوين والمدة
    .replace(/\u0640/g, '') // إزالة الكشيدة/التطويل
    // إزالة علامات الوقف والضبط المصحفي مع استثناء الأحرف الملحقة (الواو الصغيرة 06E5 والياء الصغيرة 06E6)
    .replace(/[\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0610-\u061A]/g, '')
    // صلة هاء الكناية في أواخر الكلمات فقط (لهۥ، بهۦ، عذابهۥ)
    .replace(/([هـ])[\u06E5\u06E6]($|[\s.,/#!$%^&*;:{}=\-_~()؟،؛«»"'\uFD3E\uFD3Fۖۗۚۛۜ۝۩۞])/g, '$1$2')
    // الأحرف العثمانية الملحقة في جذور الكلمات (داوۥد -> داوود، إبرٰهـۧم -> إبراهيم)
    .replace(/\u06E5/g, 'و')
    .replace(/[\u06E6\u06CE\u06CD]/g, 'ي')
    // همزة الوصل
    .replace(/\u0671/g, 'ا')
    // الألف الخنجرية في نهاية الكلمة على الياء أو المقصورة (علىٰ، إلىٰ، موسىٰ)
    .replace(/([ىي])\u0670$/g, '$1')
    // الألف الخنجرية في وسط الكلمة بعد الياء (شَيَٰطِين -> شياطين، قِيَٰم -> قيام، دِيَٰر -> ديار، رِيَٰح -> رياح)
    .replace(/([ىي])\u0670/g, '$1ا')
    // الواو العثمانية المنقلبة ذات الألف الخنجرية (الصلوة -> الصلاة، الزكوة -> الزكاة، الحيوة -> الحياة)
    .replace(/و\u0670/g, 'ا')
    // سائر الألفات الخنجرية في وسط الكلمات (كِتَٰب -> كتاب، عَٰلَمِين -> عالمين، سُلَيْمَٰن -> سليمان)
    .replace(/\u0670/g, 'ا')
    // همزة على السطر متبوعة بألف (ءَاخِرَة -> اخرة، ءادم -> ادم)
    .replace(/[\u0621\u0654]ا/g, 'ا')
    // توحيد سائر أشكال الألف
    .replace(/[إأآٱٲٳ]/g, 'ا')
    // توحيد الياء والألف المقصورة
    .replace(/ى/g, 'ي')
    // توحيد التاء المربوطة بالهاء
    .replace(/ة/g, 'ه')
    // توحيد التاء المفتوحة في الكلمات العثمانية المعروفة
    .replace(/\bرحمت\b/g, 'رحمه')
    .replace(/\bنعمت\b/g, 'نعمه')
    .replace(/\bامرات\b/g, 'امراه')
    .replace(/\bسنت\b/g, 'سنه')
    .replace(/\bلعنت\b/g, 'لعنه')
    .replace(/\bفطرت\b/g, 'فطره')
    .replace(/\bشجرت\b/g, 'شجره')
    .replace(/\bقرت\b/g, 'قره')
    .replace(/\bجنت\b/g, 'جنه')
    .replace(/\bمعصيت\b/g, 'معصيه')
    .replace(/\bكلمت\b/g, 'كلمه')
    .replace(/\bابنت\b/g, 'ابنه')
    // إزالة علامات الترقيم والأقواس
    .replace(/[.,/#!$%^&*;:{}=\-_~()؟،؛«»"'\uFD3E\uFD3Fۖۗۚۛۜ۝۩۞]/g, '');

  return w.trim();
}

/**
 * تنظيف الرسم العثماني المشكول مع الحفاظ على الحركات وإزالة علامات الوقف
 */
export function cleanVocalizedToken(s: string): string {
  if (!s) return '';
  return s
    .replace(/[\uFEFF\u200B-\u200D]/g, '')
    .replace(/[\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0610-\u061A]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_~()؟،؛«»"'\uFD3E\uFD3Fۖۗۚۛۜ۝۩۞]/g, '')
    .trim();
}

// هيكل الآية المفهرسة المخبأة في الذاكرة لتسريع الفحص
interface IndexedToken {
  raw: string;
  vocalizedClean: string;
  norm: string;
}

interface IndexedAyah {
  surahNumber: number;
  surahName: string;
  isMeccan: boolean;
  verseNumber: number;
  juz: number;
  page: number;
  textUthmani: string;
  tokens: IndexedToken[];
}

// تخزين مؤقت للآيات المفهرسة لمنع تكرار معالجة 90 ألف توكن على كل نقرة
const indexedCorpusCache = new WeakMap<QuranSurahCorpus[], IndexedAyah[]>();

export function getOrCreateIndexedCorpus(corpus: QuranSurahCorpus[]): IndexedAyah[] {
  const cached = indexedCorpusCache.get(corpus);
  if (cached) return cached;

  const indexed: IndexedAyah[] = [];
  for (const surah of corpus) {
    const isMeccan = surah.isMeccan;
    const surahName = formatSurahName(surah.name);
    for (const ayah of surah.ayahs) {
      const rawText = ayah.textUthmani || '';
      const rawTokens = rawText.split(/\s+/).filter(Boolean);
      const tokens: IndexedToken[] = rawTokens.map(tok => ({
        raw: tok,
        vocalizedClean: cleanVocalizedToken(tok),
        norm: normalizeQuranicToken(tok)
      }));

      indexed.push({
        surahNumber: surah.number,
        surahName,
        isMeccan,
        verseNumber: ayah.numberInSurah,
        juz: ayah.juz || 1,
        page: ayah.page || 1,
        textUthmani: rawText,
        tokens
      });
    }
  }

  indexedCorpusCache.set(corpus, indexed);
  return indexed;
}

/**
 * جدول المرادفات الإملائية المزدوجة بين الرسم المصحفي والإملاء القياسي الحديث
 */
export const CANONICAL_SPELLING_ALIASES: Record<string, string> = {
  'الرحمان': 'الرحمن',
  'رحمان': 'رحمن',
  'داوود': 'داود',
  'هارون': 'هرون',
  'اسماعيل': 'اسمعيل',
  'ابراهيم': 'ابرهم',
  'إبراهيم': 'ابرهم',
  'اسحاق': 'اسحق',
  'سليمان': 'سليمن',
  'مساكين': 'مسكين',
  'طالوت': 'طلوت',
  'جالوت': 'جلوت',
  'قارون': 'قرون',
  'عمران': 'عمرن',
  'لقمان': 'لقمن',
  'رضوان': 'رضون',
  'سلطان': 'سلطن',
  'الصلوه': 'الصلاه',
  'صلوه': 'صلاه',
  'الزكوه': 'الزكاه',
  'زكوه': 'زكاه',
  'الحيوه': 'الحياه',
  'حيوه': 'حياه'
};

/**
 * قاموس جموع التكسير والأصول المعجمية القرآنية المتطابقة دلالياً
 * يربط المفرد بجموع التكسير القرآنية الثابتة حتى تشمل المطابقة المعجمية صيغ المفرد وجموع التكسير
 */
export const QURANIC_BROKEN_PLURALS: Record<string, string[]> = {
  'نبي': ['انبياء', 'الانبياء'],
  'النبي': ['الانبياء', 'انبياء'],

  'رسول': ['رسل', 'الرسل'],
  'الرسول': ['الرسل', 'رسل'],

  'كتاب': ['كتب', 'الكتب'],
  'الكتاب': ['الكتب', 'كتب'],

  'ملك': ['ملائكه', 'الملائكه'],
  'الملك': ['الملائكه', 'ملائكه'],

  'مسجد': ['مساجد', 'المساجد'],
  'المسجد': ['المساجد', 'مساجد'],

  'عين': ['عيون', 'العيون', 'اعين', 'الاعين'],
  'العين': ['العيون', 'عيون', 'الاعين', 'اعين'],

  'جبل': ['جبال', 'الجبال'],
  'الجبل': ['الجبال', 'جبال'],

  'بحر': ['بحار', 'البحار', 'ابحر'],
  'البحر': ['البحار', 'بحار'],

  'نجم': ['نجوم', 'النجوم'],
  'النجم': ['النجوم', 'نجوم'],

  'صاحب': ['اصحاب', 'الاصحاب'],
  'الصاحب': ['الاصحاب', 'اصحاب'],

  'عبد': ['عباد', 'العباد', 'عبيد'],
  'العبد': ['العباد', 'عباد']
};

/**
 * توليد مصفوفة الكلمات المقبولة مع سوابقها ولواحقها النحوية والضميرية
 * يدعم الأسماء المجردة (مثل: عذاب، شياطين)، والأسماء المعرفة (الشياطين)،
 * والجموع، والتنوين، وكافة الضمائر المتصلة.
 */
export function buildLemmaAffixesTokenSet(queryWord: string): Set<string> {
  const qNorm = normalizeQuranicToken(queryWord);
  const set = new Set<string>();
  if (!qNorm) return set;
  set.add(qNorm);

  // 1. لفظ الجلالة الشريف
  if (qNorm === 'الله') {
    const allahTokens = [
      'الله', 'والله', 'بالله', 'تالله', 'لله', 'ولله', 'فلله', 'فالله', 
      'وبالله', 'فبالله', 'ابالله', 'وتالله', 'اللهم', 'واللهم'
    ];
    allahTokens.forEach(t => set.add(t));
    return set;
  }

  // 2. الأسماء الموصولة وأسماء الإشارة
  if (qNorm === 'الذين') {
    ['الذين', 'والذين', 'فالذين', 'للذين', 'وللذين', 'فللذين', 'وبالذين'].forEach(f => set.add(f));
    return set;
  }
  if (qNorm === 'الذي') {
    ['الذي', 'والذي', 'فالذي', 'للذي', 'وللذي', 'بالذي', 'وبالذي'].forEach(f => set.add(f));
    return set;
  }
  if (qNorm === 'ذلك') {
    ['ذلك', 'وذلك', 'فذلك', 'كذلك', 'وكذلك', 'فكذلك', 'بذلك', 'وبذلك'].forEach(f => set.add(f));
    return set;
  }
  if (qNorm === 'هذا') {
    ['هذا', 'وهذا', 'فهذا', 'كهذا', 'وكهذا', 'بهذا', 'وبهذا', 'لهذا', 'ولهذا'].forEach(f => set.add(f));
    return set;
  }

  // 3. الأسماء المعرفة بـ "الـ" أصلاً (مثل: الآخرة، الدنيا، الرحمن، الساعة، القيامة)
  const isDefinite = qNorm.startsWith('ال') && qNorm.length >= 4;
  if (isDefinite) {
    const base = qNorm.slice(2);
    const defPrefixes = [
      '', 'و', 'ف', 'ب', 'ك',
      'وب', 'فب', 'وك', 'فك',
      'ول', 'فل', 'اف', 'او', 'افب', 'اوب', 'افال', 'اوال',
      'يا', 'ويا', 'فيا'
    ];
    for (const p of defPrefixes) {
      set.add(p + qNorm);
    }
    // لام الجر مع إدغام أل التعريف: للـ / وللـ / فللـ
    set.add('لل' + base);
    set.add('ولل' + base);
    set.add('فلل' + base);
    set.add('افلل' + base);

    // إذا كانت كلمة جمع (مثل الشياطين)، يمكن إضافة اللفظ المجرد وسوابقه البسيطة
    if (qNorm === 'الشياطين') {
      ['شياطين', 'والشياطين', 'فالشياطين', 'للشياطين', 'شياطينهم'].forEach(t => set.add(t));
    }
    if (qNorm === 'النبي') {
      ['نبي', 'والنبي', 'لنبي', 'للنبي', 'نبيهم', 'نبيا', 'ونبيا', 'النبيين', 'والنبيين', 'بالنبيين', 'النبيون', 'والنبيون', 'الانبياء', 'انبياء'].forEach(t => set.add(t));
    }

    // إذا كان للكلمة جموع تكسير مسجلة في القاموس
    if (QURANIC_BROKEN_PLURALS[qNorm]) {
      for (const bp of QURANIC_BROKEN_PLURALS[qNorm]) {
        const bpNorm = normalizeQuranicToken(bp);
        for (const p of defPrefixes) {
          set.add(p + bpNorm);
        }
      }
    }

    return set;
  }

  // 4. بناء الجذوع الأساسية مع المرادفات الإملائية القياسية وجموع التكسير
  const rawStems = new Set<string>([qNorm]);

  // دمج جموع التكسير القرآنية
  if (QURANIC_BROKEN_PLURALS[qNorm]) {
    for (const bp of QURANIC_BROKEN_PLURALS[qNorm]) {
      rawStems.add(normalizeQuranicToken(bp));
    }
  }

  // فحص المرادفات الإملائية المزدوجة (رحمن <-> رحمان، داود <-> داوود، إلخ)
  for (const st of Array.from(rawStems)) {
    for (const [a, b] of Object.entries(CANONICAL_SPELLING_ALIASES)) {
      const normA = normalizeQuranicToken(a);
      const normB = normalizeQuranicToken(b);
      if (st === normA) rawStems.add(normB);
      if (st === normB) rawStems.add(normA);
    }
  }

  // توسيع الجذوع للتعامل مع التاء المربوطة والمقصورة قبل الضمائر
  const expandedStems: string[] = [];
  for (const st of rawStems) {
    expandedStems.push(st);
    // تاء التأنيث المربوطة تتحول إلى تاء مفتوحة قبل الضمائر (رحمة -> رحمتـ)، مع استثناء أفعال ماضية متشابهة
    if (st.endsWith('ه') && st !== 'اخره') {
      expandedStems.push(st.slice(0, -1) + 'ت');
    }
    // فقط إذا كان اللفظ المدخل ينتهي بألف مقصورة صريحة (مثل: هدى، موسى، فتى، مولى)
    if (queryWord.endsWith('ى') && st.endsWith('ي')) {
      expandedStems.push(st.slice(0, -1) + 'ا');
    }
  }

  // سوابق الأسماء القرآنية الشاملة (أحادية، ثنائية، وثلاثية مركبة)
  const nounPrefixes = [
    '', 'و', 'ف', 'ب', 'ل', 'ك', 'س',
    'ال', 'وال', 'فال', 'بال', 'كال', 'لل', 'ولل', 'فلل', 'وبال', 'فبال', 'وكال', 'فكال',
    'ول', 'فل', 'وب', 'فب', 'وك', 'فك',
    'اف', 'او', 'اب', 'افب', 'اوب', 'افال', 'اوال',
    'يا', 'ويا', 'فيا'
  ];

  // لواحق الأسماء: ضمائر الملكية والتنوين وعلامات الجمع
  const nounSuffixes = [
    '', 'ا', 'ان', 'ين', 'ون', 'ات',
    'ه', 'ها', 'هم', 'هن', 'هما',
    'ك', 'كم', 'كن', 'كما',
    'ي', 'نا'
  ];

  for (const st of expandedStems) {
    for (const p of nounPrefixes) {
      for (const s of nounSuffixes) {
        // منع تركيب أل التعريف مع ضمائر الإضافة
        if (p.includes('ال') && ['ه', 'ها', 'هم', 'هن', 'هما', 'ك', 'كم', 'كن', 'كما', 'ي', 'نا'].includes(s)) {
          continue;
        }
        set.add(p + st + s);
      }
    }
  }

  // استبعاد الأفعال الماضية المتشابهة خطاً مع صيغ الأسماء
  const verbalFalsePositives = ['اخرتنا', 'اخرتن', 'اخرتني', 'واخرت', 'فاخرت'];
  verbalFalsePositives.forEach(fp => set.delete(fp));

  return set;
}

/**
 * فحص نوع السابقة واللاحقة للتوكن المطابق إحصائياً
 */
export function extractAffixTypes(tokenRaw: string, queryWord: string): {
  prefix: keyof WordAffixStats['prefixes'];
  suffix: keyof WordAffixStats['suffixes'];
} {
  const normToken = normalizeQuranicToken(tokenRaw);
  const normQuery = normalizeQuranicToken(queryWord);

  // فحص السوابق
  let prefix: keyof WordAffixStats['prefixes'] = 'bare';
  if (normToken === normQuery) {
    prefix = 'bare';
  } else if (/^(وال|فال|بال|كال|ولل|فلل|وبال|وفال|وكال|فكال|افب|اوب|افال|اوال)/.test(normToken)) {
    prefix = 'compound';
  } else if (normToken.startsWith('ال') && !normQuery.startsWith('ال')) {
    prefix = 'al';
  } else if (normToken.startsWith('ول') && !normQuery.startsWith('ول')) {
    prefix = 'compound'; // واو العطف + لام التوكيد
  } else if (normToken.startsWith('فل') && !normQuery.startsWith('فل')) {
    prefix = 'compound';
  } else if (normToken.startsWith('و') && !normQuery.startsWith('و')) {
    prefix = 'wa';
  } else if (normToken.startsWith('ف') && !normQuery.startsWith('ف')) {
    prefix = 'fa';
  } else if (normToken.startsWith('ب') && !normQuery.startsWith('ب')) {
    prefix = 'bi';
  } else if ((normToken.startsWith('لل') || normToken.startsWith('ل')) && !normQuery.startsWith('ل')) {
    prefix = 'li';
  } else if (normToken.startsWith('ك') && !normQuery.startsWith('ك')) {
    prefix = 'ka';
  } else if (normToken.startsWith('س') && !normQuery.startsWith('س')) {
    prefix = 'sa';
  } else if (normToken !== normQuery && normToken.includes(normQuery)) {
    prefix = 'other';
  }

  // فحص اللواحق
  let suffix: keyof WordAffixStats['suffixes'] = 'bare';
  if (/[\u064B\u064C\u064D]/.test(tokenRaw.slice(-2))) {
    suffix = 'tanween';
  } else if (normToken.endsWith('ها') || normToken.endsWith('هم') || normToken.endsWith('هن') || normToken.endsWith('هما') || (normToken.endsWith('ه') && !normQuery.endsWith('ه'))) {
    if (!normQuery.endsWith('ها') && !normQuery.endsWith('هم') && !normQuery.endsWith('هن')) {
      suffix = 'pronounHa';
    }
  } else if (normToken.endsWith('كم') || normToken.endsWith('كما') || normToken.endsWith('كن') || (normToken.endsWith('ك') && !normQuery.endsWith('ك'))) {
    if (!normQuery.endsWith('كم') && !normQuery.endsWith('كن')) {
      suffix = 'pronounKa';
    }
  } else if (normToken.endsWith('نا') || (normToken.endsWith('ي') && !normQuery.endsWith('ي'))) {
    if (!normQuery.endsWith('نا')) {
      suffix = 'pronounYa';
    }
  } else if (normToken.endsWith('ون') || normToken.endsWith('ين') || normToken.endsWith('ات') || normToken.endsWith('ان')) {
    if (!normQuery.endsWith('ون') && !normQuery.endsWith('ين') && !normQuery.endsWith('ات')) {
      suffix = 'pluralNun';
    }
  } else if (normToken.length > normQuery.length && !normToken.startsWith(normQuery)) {
    suffix = 'other';
  }

  return { prefix, suffix };
}

/**
 * بناء مطابِق سريع لكل كلمة بناءً على نمط المطابقة المختار
 */
function createFastWordMatcher(queryWord: string, mode: WordMatchMode) {
  if (mode === 'exact_vocalized') {
    const qVocalized = cleanVocalizedToken(queryWord);
    return {
      query: queryWord,
      test: (token: IndexedToken) => token.vocalizedClean === qVocalized
    };
  } else if (mode === 'exact_plain') {
    const qNorm = normalizeQuranicToken(queryWord);
    return {
      query: queryWord,
      test: (token: IndexedToken) => token.norm === qNorm
    };
  } else if (mode === 'root_derivatives') {
    return {
      query: queryWord,
      test: (token: IndexedToken) => isTokenInRoot(token.norm, queryWord)
    };
  } else {
    // نمط المعجم الموسع مع السوابق واللواحق (الافتراضي الحتمي)
    const tokenSet = buildLemmaAffixesTokenSet(queryWord);
    return {
      query: queryWord,
      test: (token: IndexedToken) => tokenSet.has(token.norm)
    };
  }
}

/**
 * المحرك الأساسي لحساب تقرير مقارنة الكلمات
 */
export function computeWordComparison(
  corpus: QuranSurahCorpus[],
  queries: string[],
  matchMode: WordMatchMode = 'lemma_affixes',
  scope: 'all' | 'meccan' | 'medinan' = 'all',
  excludedVariants: string[] = []
): WordComparisonReport {
  // تنظيف الكلمات وحذف الفراغات والتكرار
  const sanitizedWords = Array.from(
    new Set(queries.map(q => q.trim()).filter(q => q.length > 0))
  );

  if (sanitizedWords.length === 0 || !corpus || corpus.length === 0) {
    return {
      words: [],
      matchMode,
      scope,
      singleStats: [],
      cooccurrences: [],
      affixStats: [],
      dispersionSurahs: [],
      surahRows: [],
      matchingAyahs: []
    };
  }

  // استدعاء الآيات المفهرسة المخبأة في الذاكرة (فحص فائق السرعة ~10ms)
  const indexedAyahs = getOrCreateIndexedCorpus(corpus);

  // مصفوفة الصيغ المستبعدة المعالجة بالتطبيع الإملائي
  const excludedSet = new Set(excludedVariants.map(v => normalizeQuranicToken(v)));

  // تصفية السور حسب النطاق (مكي / مدني / الكل)
  const filteredAyahs = scope === 'all'
    ? indexedAyahs
    : indexedAyahs.filter(ay => (scope === 'meccan' ? ay.isMeccan : !ay.isMeccan));

  // إعداد دوال المطابقة السريعة لكل كلمة
  const matchers = sanitizedWords.map(w => createFastWordMatcher(w, matchMode));

  // هياكل تجميع الإحصاءات الفردية
  const accumulators: Record<string, {
    totalOccurrences: number;
    ayahNumbers: Set<string>;
    surahNumbers: Set<number>;
    meccanCount: number;
    medinanCount: number;
    firstOccurrence: { surah: number; surahName: string; ayah: number } | null;
    lastOccurrence: { surah: number; surahName: string; ayah: number } | null;
    prefixes: Record<string, number>;
    suffixes: Record<string, number>;
    variantMap: Record<string, { count: number; vocalizedSample: string }>;
  }> = {};

  sanitizedWords.forEach(w => {
    accumulators[w] = {
      totalOccurrences: 0,
      ayahNumbers: new Set(),
      surahNumbers: new Set(),
      meccanCount: 0,
      medinanCount: 0,
      firstOccurrence: null,
      lastOccurrence: null,
      prefixes: {
        bare: 0, al: 0, wa: 0, fa: 0, bi: 0, li: 0, ka: 0, sa: 0, compound: 0, other: 0
      },
      suffixes: {
        bare: 0, pronounHa: 0, pronounKa: 0, pronounYa: 0, pluralNun: 0, tanween: 0, other: 0
      },
      variantMap: {}
    };
  });

  // مصفوفة السور: surahNum -> { counts: Record<word, number>, total: number }
  const surahWordCounts: Record<number, { counts: Record<string, number>; total: number }> = {};
  
  // قائمة الآيات المطابقة
  const matchingAyahs: WordAyahMatch[] = [];

  for (const ayah of filteredAyahs) {
    const ayahMatchedWords: Record<string, WordOccurItem[]> = {};

    ayah.tokens.forEach((token, tokIdx) => {
      matchers.forEach(matcher => {
        if (matcher.test(token)) {
          const qWord = matcher.query;
          const acc = accumulators[qWord];

          // تسجيل وتجميع الصيغ السطحية للتفصيل الرياضي دائماً ليراها الباحث
          const vClean = token.norm;
          if (!acc.variantMap[vClean]) {
            acc.variantMap[vClean] = { count: 0, vocalizedSample: token.vocalizedClean };
          }
          acc.variantMap[vClean].count++;

          // إذا تم إقصاء هذه الصيغة من قبل الباحث، يتم استبعادها من الحساب التراكمي وشواهد الآيات
          if (excludedSet.has(vClean)) {
            return;
          }

          if (!ayahMatchedWords[qWord]) {
            ayahMatchedWords[qWord] = [];
          }
          ayahMatchedWords[qWord].push({
            wordIndex: tokIdx,
            tokenRaw: token.raw,
            tokenClean: token.norm
          });

          // تحديث التجميعات الفعالة
          acc.totalOccurrences++;
          acc.ayahNumbers.add(`${ayah.surahNumber}:${ayah.verseNumber}`);
          acc.surahNumbers.add(ayah.surahNumber);

          // تحليل السوابق واللواحق
          const { prefix, suffix } = extractAffixTypes(token.raw, qWord);
          acc.prefixes[prefix] = (acc.prefixes[prefix] || 0) + 1;
          acc.suffixes[suffix] = (acc.suffixes[suffix] || 0) + 1;

          if (ayah.isMeccan) {
            acc.meccanCount++;
          } else {
            acc.medinanCount++;
          }

          const occLocation = {
            surah: ayah.surahNumber,
            surahName: ayah.surahName,
            ayah: ayah.verseNumber
          };

          if (!acc.firstOccurrence) {
            acc.firstOccurrence = occLocation;
          }
          acc.lastOccurrence = occLocation;

          // تحديث تجميعات السورة
          if (!surahWordCounts[ayah.surahNumber]) {
            surahWordCounts[ayah.surahNumber] = { counts: {}, total: 0 };
            sanitizedWords.forEach(w => {
              surahWordCounts[ayah.surahNumber].counts[w] = 0;
            });
          }
          surahWordCounts[ayah.surahNumber].counts[qWord]++;
          surahWordCounts[ayah.surahNumber].total++;
        }
      });
    });

    // إذا كانت الآية تحتوي على الأقل على كلمة واحدة مطابقة
    if (Object.keys(ayahMatchedWords).length > 0) {
      matchingAyahs.push({
        surahNumber: ayah.surahNumber,
        surahName: ayah.surahName,
        isMeccan: ayah.isMeccan,
        verseNumber: ayah.verseNumber,
        juz: ayah.juz,
        page: ayah.page,
        textUthmani: ayah.textUthmani,
        matchedWords: ayahMatchedWords
      });
    }
  }

  // بناء جدول الإحصاءات الفردية لكل كلمة
  const singleStats: WordSingleStats[] = sanitizedWords.map(w => {
    const acc = accumulators[w];
    const variants: WordFormVariant[] = Object.entries(acc.variantMap)
      .map(([surfaceClean, data]) => {
        const isExc = excludedSet.has(surfaceClean);
        return {
          surfaceClean,
          surfaceVocalizedSample: data.vocalizedSample,
          count: data.count,
          percentage: acc.totalOccurrences > 0 && !isExc 
            ? Number(((data.count / acc.totalOccurrences) * 100).toFixed(1)) 
            : 0,
          isExcluded: isExc
        };
      })
      .sort((a, b) => {
        if (Boolean(a.isExcluded) !== Boolean(b.isExcluded)) {
          return a.isExcluded ? 1 : -1; // الصيغ النشطة أولاً ثم المقصاة
        }
        return b.count - a.count;
      });

    return {
      query: w,
      totalOccurrences: acc.totalOccurrences,
      ayahCount: acc.ayahNumbers.size,
      surahCount: acc.surahNumbers.size,
      meccanCount: acc.meccanCount,
      medinanCount: acc.medinanCount,
      firstOccurrence: acc.firstOccurrence,
      lastOccurrence: acc.lastOccurrence,
      variants
    };
  });

  // بناء إحصاءات السوابق واللواحق
  const affixStats: WordAffixStats[] = sanitizedWords.map(w => {
    const acc = accumulators[w];
    return {
      query: w,
      totalTokens: acc.totalOccurrences,
      prefixes: acc.prefixes as any,
      suffixes: acc.suffixes as any
    };
  });

  // بناء مصفوفة التزامن المتقاطع بين أزواج الكلمات وحساب مسافات التقارب
  const cooccurrences: WordPairCooccurrence[] = [];

  for (let i = 0; i < sanitizedWords.length; i++) {
    for (let j = i + 1; j < sanitizedWords.length; j++) {
      const wA = sanitizedWords[i];
      const wB = sanitizedWords[j];

      // الآيات المشتركة: الآيات التي تحتوي على كلتا الكلمتين
      const sharedAyahs = matchingAyahs.filter(
        ay => ay.matchedWords[wA] && ay.matchedWords[wB]
      );

      // السور المشتركة
      const surahsA = accumulators[wA].surahNumbers;
      const surahsB = accumulators[wB].surahNumbers;
      let sharedSurahCount = 0;
      surahsA.forEach(sNum => {
        if (surahsB.has(sNum)) {
          sharedSurahCount++;
        }
      });

      // مؤشر التداخل الحسابي Jaccard على مستوى الآيات:
      const ayahsASize = accumulators[wA].ayahNumbers.size;
      const ayahsBSize = accumulators[wB].ayahNumbers.size;
      const unionAyahs = ayahsASize + ayahsBSize - sharedAyahs.length;
      const jaccard = unionAyahs > 0 ? sharedAyahs.length / unionAyahs : 0;

      // حساب مسافات التقارب بين الكلمتين في الآيات المشتركة
      let minDistance: number | null = null;
      let sumDistance = 0;
      let distanceCount = 0;
      let adjacentCount = 0;

      sharedAyahs.forEach(ay => {
        const occA = ay.matchedWords[wA] || [];
        const occB = ay.matchedWords[wB] || [];

        // حساب أدنى مسافة بالكلمات داخل هذه الآية
        let ayahMinDist: number | null = null;
        for (const itemA of occA) {
          for (const itemB of occB) {
            const dist = Math.abs(itemA.wordIndex - itemB.wordIndex) - 1;
            if (ayahMinDist === null || dist < ayahMinDist) {
              ayahMinDist = dist;
            }
          }
        }

        if (ayahMinDist !== null) {
          if (ayahMinDist === 0) {
            adjacentCount++;
          }
          if (minDistance === null || ayahMinDist < minDistance) {
            minDistance = ayahMinDist;
          }
          sumDistance += ayahMinDist;
          distanceCount++;
        }
      });

      const avgDistance = distanceCount > 0 ? Number((sumDistance / distanceCount).toFixed(1)) : null;

      cooccurrences.push({
        wordA: wA,
        wordB: wB,
        sharedAyahCount: sharedAyahs.length,
        sharedSurahCount,
        jaccardSimilarity: Number(jaccard.toFixed(4)),
        minDistance,
        avgDistance,
        adjacentCount,
        sharedAyahs
      });
    }
  }

  // بناء بيانات التشتت لجميع سور المصحف
  const targetSurahs = scope === 'all'
    ? corpus
    : corpus.filter(s => (scope === 'meccan' ? s.isMeccan : !s.isMeccan));

  const dispersionSurahs: WordDispersionSurahItem[] = targetSurahs.map(surah => {
    const data = surahWordCounts[surah.number];
    const wordCounts: Record<string, number> = {};
    let totalMatched = 0;
    let allPresent = sanitizedWords.length > 0;

    sanitizedWords.forEach(w => {
      const c = data ? (data.counts[w] || 0) : 0;
      wordCounts[w] = c;
      totalMatched += c;
      if (c === 0) allPresent = false;
    });

    return {
      surahNumber: surah.number,
      surahName: formatSurahName(surah.name),
      isMeccan: surah.isMeccan,
      totalAyahs: surah.totalAyahs,
      wordCounts,
      totalMatched,
      isShared: allPresent && totalMatched > 0
    };
  });

  // بناء صفوف السور (Surah Breakdown Rows)
  const surahRows: SurahWordBreakdownRow[] = [];

  for (const surah of targetSurahs) {
    const data = surahWordCounts[surah.number];
    if (data && data.total > 0) {
      const counts: Record<string, number> = {};
      let hasAll = true;

      sanitizedWords.forEach(w => {
        const c = data.counts[w] || 0;
        counts[w] = c;
        if (c === 0) {
          hasAll = false;
        }
      });

      surahRows.push({
        surahNumber: surah.number,
        surahName: formatSurahName(surah.name),
        isMeccan: surah.isMeccan,
        totalAyahs: surah.totalAyahs,
        totalWords: surah.ayahs.reduce((sum, a) => sum + (a.textUthmani.split(/\s+/).length || 0), 0),
        counts,
        totalMatchedWords: data.total,
        hasAllWords: sanitizedWords.length > 1 ? hasAll : true
      });
    }
  }

  // ترتيب صفوف السور حسب رقم السورة افتراضياً
  surahRows.sort((a, b) => a.surahNumber - b.surahNumber);

  return {
    words: sanitizedWords,
    matchMode,
    scope,
    singleStats,
    cooccurrences,
    affixStats,
    dispersionSurahs,
    surahRows,
    matchingAyahs
  };
}

/**
 * توليد ملف CSV أكاديمي كامل بترميز UTF-8 مع BOM
 */
export function exportComparisonReportToCSV(report: WordComparisonReport): string {
  const lines: string[] = [];

  // رأس التقرير
  lines.push(`"تقرير مقارنة الألفاظ القرآنية - منصة التحليل القرآني"`);
  lines.push(`"تاريخ التقرير",${new Date().toISOString().split('T')[0]}`);
  lines.push(`"الألفاظ المقارنة","${report.words.join(' ، ')}"`);
  lines.push(`"نمط المطابقة",${report.matchMode}`);
  lines.push(`"نطاق السور",${report.scope}`);
  lines.push('');

  // 1. الإحصاءات العامة
  lines.push(`"=== 1. المؤشرات الإحصائية العامة للألفاظ ==="`);
  lines.push(`"اللفظ","إجمالي التكرار","عدد الآيات","عدد السور","الورود المكي","الورود المدني","أول موضع","آخر موضع"`);
  report.singleStats.forEach(s => {
    const first = s.firstOccurrence ? `${s.firstOccurrence.surahName} (${s.firstOccurrence.ayah})` : '-';
    const last = s.lastOccurrence ? `${s.lastOccurrence.surahName} (${s.lastOccurrence.ayah})` : '-';
    lines.push(`"${s.query}",${s.totalOccurrences},${s.ayahCount},${s.surahCount},${s.meccanCount},${s.medinanCount},"${first}","${last}"`);
  });
  lines.push('');

  // 2. التزامن ومسافات التقارب
  if (report.cooccurrences.length > 0) {
    lines.push(`"=== 2. مصفوفة التزامن النصي ومسافات التقارب ==="`);
    lines.push(`"الزوج","الآيات المشتركة","السور المشتركة","معامل جاكارد","أدنى مسافة بالكلمات","متوسط المسافة بالكلمات","مرات التجاور المباشر"`);
    report.cooccurrences.forEach(co => {
      lines.push(`"${co.wordA} ⇄ ${co.wordB}",${co.sharedAyahCount},${co.sharedSurahCount},${co.jaccardSimilarity},${co.minDistance ?? '-'},${co.avgDistance ?? '-'},${co.adjacentCount}`);
    });
    lines.push('');
  }

  // 3. تشريح السوابق واللواحق
  if (report.affixStats.length > 0) {
    lines.push(`"=== 3. تشريح السوابق واللواحق الصرفية ==="`);
    lines.push(`"اللفظ","المجردة تماماً","مع (الـ)","مع واو العطف","مع الفاء","مع الباء","مع اللام","مع الكاف","مع السين","مركبة","ضمائر الغيبة (ها/هم)","ضمائر الخطاب (ك)","ضمائر المتكلم (ي/نا)","جمع النون/الين","تنوين"`);
    report.affixStats.forEach(af => {
      const p = af.prefixes;
      const s = af.suffixes;
      lines.push(`"${af.query}",${p.bare},${p.al},${p.wa},${p.fa},${p.bi},${p.li},${p.ka},${p.sa},${p.compound},${s.pronounHa},${s.pronounKa},${s.pronounYa},${s.pluralNun},${s.tanween}`);
    });
    lines.push('');
  }

  // 4. جدول السور
  lines.push(`"=== 4. توزيع التكرار عبر السور ==="`);
  const wordCols = report.words.map(w => `"${w}"`).join(',');
  lines.push(`"رقم السورة","اسم السورة","النزول","عدد الآيات","إجمالي الألفاظ",${wordCols}`);
  report.surahRows.forEach(sr => {
    const countsStr = report.words.map(w => sr.counts[w] || 0).join(',');
    lines.push(`${sr.surahNumber},"${sr.surahName}",${sr.isMeccan ? 'مكية' : 'مدنية'},${sr.totalAyahs},${sr.totalMatchedWords},${countsStr}`);
  });
  lines.push('');

  // 5. شواهد الآيات
  lines.push(`"=== 5. شواهد الآيات القرآنية ==="`);
  lines.push(`"السورة","رقم الآية","الجزء","الصفحة","الألفاظ الحاضرة","نص الآية الكريمة"`);
  report.matchingAyahs.forEach(ay => {
    const present = Object.keys(ay.matchedWords).join(' + ');
    const cleanText = ay.textUthmani.replace(/"/g, '""');
    lines.push(`"${ay.surahName}",${ay.verseNumber},${ay.juz},${ay.page},"${present}","${cleanText}"`);
  });

  // UTF-8 BOM
  return '\uFEFF' + lines.join('\n');
}

/**
 * تنزيل نص التقرير كملف CSV في المتصفح
 */
export function downloadCSVFile(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * نماذج بحثية أكاديمية شائعة للتدقيق والمقارنة السريعة
 */
export const POPULAR_WORD_COMPARISON_PRESETS: Array<{ label: string; words: string[] }> = [
  { label: 'الدنيا والآخرة', words: ['الدنيا', 'الآخرة'] },
  { label: 'الشمس والقمر', words: ['الشمس', 'القمر'] },
  { label: 'الجنة والنار', words: ['الجنة', 'النار'] },
  { label: 'الملائكة والشياطين', words: ['الملائكة', 'الشياطين'] },
  { label: 'الحياة والموت', words: ['الحياة', 'الموت'] },
  { label: 'النور والظلمات', words: ['النور', 'الظلمات'] },
  { label: 'البر والبحر', words: ['البر', 'البحر'] },
  { label: 'السموات والأرض', words: ['السموات', 'الأرض'] }
];

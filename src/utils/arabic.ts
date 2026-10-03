import { WordMatchMode } from '../types';
import { normalizeQuranicToken, cleanVocalizedToken, buildLemmaAffixesTokenSet } from './wordComparisonMetrics';
import { isTokenInRoot } from './arabicRoots';

/**
 * Standard Arabic Letters definitions and common groupings for Quranic analysis.
 */

export const ARABIC_LETTERS: string[] = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
  'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

/**
 * Abjad Hawwaz sequence (أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ)
 */
export const ABJAD_HAWWAZ_LETTERS: string[] = [
  'ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 
  'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر', 
  'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'
];

/**
 * Quranic frequency sequence (ترتيب التواتر والشيوع القرآني العام - من الأكثر تكراراً إلى الأقل)
 * ا ل ن م و ي ه ت ر ب ك ع ف ق س د ذ ح ج خ ش ص ض ز ث ط غ ظ
 */
export const QURANIC_FREQ_LETTERS: string[] = [
  'ا', 'ل', 'ن', 'م', 'و', 'ي', 'ه', 'ت', 'ر', 'ب', 
  'ك', 'ع', 'ف', 'ق', 'س', 'د', 'ذ', 'ح', 'ج', 'خ', 
  'ش', 'ص', 'ض', 'ز', 'ث', 'ط', 'غ', 'ظ'
];

export type ArabicLetterOrderingMode = 'alphabet' | 'abjad' | 'quran-freq';

export const ARABIC_LETTER_NAMES: Record<string, string> = {
  'ا': 'ألف',
  'ب': 'باء',
  'ت': 'تاء',
  'ث': 'ثاء',
  'ج': 'جيم',
  'ح': 'حاء',
  'خ': 'خاء',
  'د': 'دال',
  'ذ': 'ذال',
  'ر': 'راء',
  'ز': 'زاي',
  'س': 'سين',
  'ش': 'شين',
  'ص': 'صاد',
  'ض': 'ضاد',
  'ط': 'طاء',
  'ظ': 'ظاء',
  'ع': 'عين',
  'غ': 'غين',
  'ف': 'فاء',
  'ق': 'قاف',
  'ك': 'كاف',
  'ل': 'لام',
  'م': 'ميم',
  'ن': 'نون',
  'ه': 'هاء',
  'و': 'واو',
  'ي': 'ياء'
};

/**
 * Standardizes Arabic letter extraction by stripping:
 * 1. Quranic annotation signs & waqf marks (\u06D6-\u06ED, \u0610-\u061A...)
 * 2. Tashkeel / diacritics (\u064B-\u065F, \u0670...)
 * 3. Typographic tatweel / kashida (\u0640) which lies numerically inside the [\u0621-\u064A] range!
 * 4. Any non-Arabic glyphs or isolated symbols (like ۞, ۩).
 * Returns only pure, un-elongated standard Arabic letters.
 */
/**
 * تنظيف وتحويل الكلمة من الرسم العثماني القرآني إلى الإملاء القياسي الحديث الصرف (Orthographic Normalization)
 * يعالج الألف الخنجرية، همزة الوصل، الواوات المنقلبة، الياء والألف المقصورة، وكلمات حذف الألف القياسية
 * دون المساس بجذر الكلمة أو بنيتها الصرفية.
 */
export function cleanQuranicWord(raw: string): string {
  if (!raw) return '';
  let w = raw.replace(/[\uFEFF\u200B-\u200D]/g, '');

  // إذا كانت العلامة رمز وقف أو لا تحتوي على حرف عربي أو علامة رسم، يتم إهمالها
  if (!/[\u0621-\u064A\u0671\u0670]/.test(w)) {
    return '';
  }

  // 1. همزة الوصل (ٱ) -> ألف عادية (ا)
  w = w.replace(/\u0671/g, 'ا');

  // 2. الواو المكتوبة بألف خنجرية في الرسم العثماني (الصلوة، الزكوة، الحيوة، الربوا...) -> ألف
  w = w.replace(/و\u0670/g, 'ا');

  // 3. الألف الخنجرية فوق الياء أو الألف المقصورة (علىٰ، إلىٰ، حتّىٰ، موسىٰ، عيسىٰ...)
  // يتم الاحتفاظ بالياء/الألف المقصورة وإزالة الألف الخنجرية لمنع تحولها إلى "علىا" أو "إلىا"
  w = w.replace(/([ىي])\u0670/g, '$1');

  // 3.1 توحيد الهمزة العثمانية المنفصلة على السطر أو الرقبة المتبوعة بألف أو ألف خنجرية (رسم عثماني لـ آ مثل: ءَاخِرَة، ءَالِـَٰٔنَ، ءَابَاء، ءادم) -> ألف
  w = w.replace(/[\u0621\u0654][\u064B-\u065F\u0670]*[\u0627\u0670]/g, 'ا');
  w = w.replace(/ـٔ[\u064B-\u065F\u0670]*[\u0627\u0670]/g, 'ا');

  // 4. كلمات قياسية معروفة تُكتب في الإملاء الحديث بحذف الألف
  // (هذا، هذه، هؤلاء، ذلك، ذلكم، لكن، إله، الرحمن)
  const withoutMarks = w.replace(/[\u064B-\u065F\u06D6-\u06ED\u0610-\u061A\u06DF-\u06E8\u0640]/g, '');
  if (/^هَٰذ[َا|ِهِ|َانِ]/.test(w) || /^هٰذ[ا|ه]/.test(withoutMarks)) {
    w = w.replace(/هَٰذ/g, 'هذ').replace(/هٰذ/g, 'هذ');
  } else if (/^هَٰٓ?ؤُلَا/.test(w) || /^هٰؤُ?لا/.test(withoutMarks)) {
    w = w.replace(/هَٰٓ?ؤُلَا/g, 'هؤلاء').replace(/هٰؤُ?لا/g, 'هؤلاء');
  } else if (/^ذَٰلِك/.test(w) || /^ذٰلك/.test(withoutMarks)) {
    w = w.replace(/ذَٰلِك/g, 'ذلك').replace(/ذٰلك/g, 'ذلك');
  } else if (/^لَٰكِن/.test(w) || /^لٰكن/.test(withoutMarks)) {
    w = w.replace(/لَٰكِن/g, 'لكن').replace(/لٰكن/g, 'لكن');
  } else if (/^إِلَٰه/.test(w) || /^إلٰه/.test(withoutMarks)) {
    w = w.replace(/إِلَٰه/g, 'إله').replace(/إلٰه/g, 'إله');
  } else if (/ٱلرَّحْمَٰنِ?/.test(w) || /الرحمٰن/.test(withoutMarks)) {
    w = w.replace(/ٱلرَّحْمَٰن/g, 'الرحمن').replace(/الرحمٰن/g, 'الرحمن');
  } else {
    // 5. في سائر الكلمات، تمثل الألف الخنجرية حرف ألف صريح (كتاب، صراط، العالمين، قالوا، مالك...)
    w = w.replace(/\u0670/g, 'ا');
  }

  // 6. إزالة الحركات والتنوين وعلامات الضبط المصحفي
  w = w.replace(/[\u06D6-\u06ED\u0610-\u061A\u06DF-\u06E8\u06EA-\u06ED]/g, '');
  w = w.replace(/[\u064B-\u065F]/g, '');
  w = w.replace(/\u0640/g, '');
  w = w.replace(/[^\u0621-\u064A]/g, '');

  // 7. توحيد حرف "في" المنفرد (في الرسم العثماني يُكتب بدون نقط فِى)
  if (w === 'فى') {
    w = 'في';
  }

  return w.trim();
}

/**
 * فحص ما إذا كان التوكن القرآني يمثل كلمة حقيقية ذات أحرف أصلية (وليس مجرد علامة وقف أو ترقيم منفصلة)
 */
export function isGenuineQuranWord(token: string): boolean {
  if (!token) return false;
  // الرموز المعزولة وعلامات الوقف المصحفي ليست كلمات
  return /[\u0621-\u064A\u0671\u0670]/.test(token);
}

/**
 * استخراج الكلمات القرآنية الحقيقية فقط بعد تنقية علامات الوقف والترقيم المعزولة
 */
export function extractGenuineQuranWords(text: string): string[] {
  if (!text) return [];
  return text.trim().split(/\s+/).filter(tok => isGenuineQuranWord(tok));
}

/**
 * دالة مساعدة لتجريد الحروف الصرفة بدون تشكيل
 */
export function cleanArabicLetters(text: string): string {
  return text
    .replace(/[\uFEFF\u200B-\u200D]/g, '')
    .replace(/[\u06D6-\u06ED\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '') // Strips Tatweel (ـ)
    .replace(/[^\u0621-\u064A]/g, '')
    .trim();
}

/**
 * دالة تطبيع وتوحيد النصوص العربية والقرآنية لغايات البحث والمطابقة (Search Normalization)
 * تقوم بتحويل النص العثماني والحديث إلى صيغة قياسية موحدة للمقارنة (Matching Token)
 * مع الإبقاء دائماً على النص الأصلي الكامل بالرسم العثماني للعرض في واجهات المستخدم.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';

  let normalized = text.replace(/[\uFEFF\u200B-\u200D]/g, '');

  // 1. تحويل همزة الوصل (ٱ) إلى ألف (ا)
  normalized = normalized.replace(/\u0671/g, 'ا');

  // 2. إزالة الحركات وعلامات المد
  normalized = normalized.replace(/[\u064B-\u065F\u0653]/g, '');

  // 3. إزالة علامات الوقف والضبط المصحفي مع استثناء الأحرف الملحقة
  normalized = normalized.replace(/[\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0610-\u061A]/g, '');

  // 4. صلة هاء الكناية في أواخر الكلمات فقط
  normalized = normalized.replace(/([هـ])[\u06E5\u06E6]($|[\s.,/#!$%^&*;:{}=\-_~()؟،؛«»"'\uFD3E\uFD3Fۖۗۚۛۜ۝۩۞])/g, '$1$2');

  // 5. الأحرف الملحقة العثمانية في متن الكلمات (داوۥد -> داوود، إبرٰهـۧم -> إبراهيم)
  normalized = normalized.replace(/\u06E5/g, 'و');
  normalized = normalized.replace(/[\u06E6\u06CE\u06CD]/g, 'ي');

  // 6. معالجة الواو ذات الألف الخنجرية في الرسم العثماني (الصلوة -> الصلاة)
  normalized = normalized.replace(/و\u0670/g, 'ا');

  // 7. معالجة الألف الخنجرية فوق الياء أو الألف المقصورة في أواخر الكلمات (علىٰ، إلىٰ، موسىٰ...)
  normalized = normalized.replace(/([ىي])\u0670($|[\s.,/#!$%^&*;:{}=\-_~()؟،؛«»"'\uFD3E\uFD3Fۖۗۚۛۜ۝۩۞])/g, '$1$2');

  // 8. معالجة الألف الخنجرية في وسط الكلمات بعد الياء (شَيَٰطِين -> شياطين، قِيَٰم -> قيام، دِيَٰر -> ديار)
  normalized = normalized.replace(/([ىي])\u0670/g, '$1ا');

  // 9. معالجة الكلمات القياسية محذوفة الألف إملائياً
  normalized = normalized
    .replace(/\bهَٰذ/g, 'هذ').replace(/\bهٰذ/g, 'هذ')
    .replace(/\bهَٰٓ?ؤُلَا/g, 'هؤلاء').replace(/\bهٰؤُ?لا/g, 'هؤلاء')
    .replace(/\bذَٰلِك/g, 'ذلك').replace(/\bذٰلك/g, 'ذلك')
    .replace(/\bلَٰكِن/g, 'لكن').replace(/\bلٰكن/g, 'لكن')
    .replace(/\bإِلَٰه/g, 'إله').replace(/\bإلٰه/g, 'إله')
    .replace(/\bٱلرَّحْمَٰن/g, 'الرحمن').replace(/\bالرحمٰن/g, 'الرحمن');

  // 10. سائر الألفات الخنجرية تصبح ألفاً صريحة (كتاب، صراط، العالمين، قالوا...)
  normalized = normalized.replace(/\u0670/g, 'ا');

  // 7. إزالة التطويل (الكشيدة) وعلامات الترقيم والأقواس
  normalized = normalized.replace(/\u0640/g, '');
  normalized = normalized.replace(/[.,/#!$%^&*;:{}=\-_`~()؟،؛«»"'\uFD3E\uFD3F]/g, ' ');

  // 8. تحويل الأرقام المشرقية (الهندية) إلى أرقام عربية قياسية
  normalized = normalized.replace(/[٠-٩]/g, d => (d.charCodeAt(0) - 1632).toString());

  // 9. معالجة الواوات العثمانية المنقلبة المتبقية
  normalized = normalized
    .replace(/\bالصلوة\b/g, 'الصلاة')
    .replace(/\bصلوة\b/g, 'صلاة')
    .replace(/\bالزكوة\b/g, 'الزكاة')
    .replace(/\bزكوة\b/g, 'زكاة')
    .replace(/\bالحيوة\b/g, 'الحياة')
    .replace(/\bحيوة\b/g, 'حياة')
    .replace(/\bمشكوة\b/g, 'مشكاة')
    .replace(/\bالنجوة\b/g, 'النجاة')
    .replace(/\bنجوة\b/g, 'نجاة')
    .replace(/\bالغدوة\b/g, 'الغداة')
    .replace(/\bمنوة\b/g, 'مناة')
    .replace(/\bالربوا\b/g, 'الربا')
    .replace(/\bربوا\b/g, 'ربا');

  normalized = normalized.replace(/([لمكحنج])وة\b/g, '$1اة');

  // 10. معالجة التاء المفتوحة في الرسم العثماني
  normalized = normalized
    .replace(/\bرحمت\b/g, 'رحمة')
    .replace(/\bنعمت\b/g, 'نعمة')
    .replace(/\bامرأت\b/g, 'امرأة')
    .replace(/\bامرات\b/g, 'امرأة')
    .replace(/\bسنت\b/g, 'سنة')
    .replace(/\bلعنت\b/g, 'لعنة')
    .replace(/\bفطرت\b/g, 'فطرة')
    .replace(/\bشجرت\b/g, 'شجرة')
    .replace(/\bقرت\b/g, 'قرة')
    .replace(/\bجنت\b/g, 'جنة')
    .replace(/\bمعصيت\b/g, 'معصية')
    .replace(/\bكلمت\b/g, 'كلمة')
    .replace(/\bابنت\b/g, 'ابنة');

  // 11. تفكيك أدوات النداء الملتصقة في الرسم العثماني لضمان مطابقة الكلمات
  normalized = normalized
    .replace(/\bيايها\b/g, 'يا ايها')
    .replace(/\bياايها\b/g, 'يا ايها')
    .replace(/\bهاانتم\b/g, 'ها انتم');

  // 12. توحيد جميع أشكال الألف (أ إ آ ٱ ٲ ٳ) إلى ألف مجردة (ا)
  normalized = normalized.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, 'ا');

  // 13. توحيد التاء المربوطة والهاء في أواخر الكلمات (ة -> ه) لمنع التباين الإملائي
  normalized = normalized.replace(/ة\b/g, 'ه');

  // 14. توحيد الياء والألف المقصورة (ى / ي / ۦ) إلى ياء (ي) لضمان مطابقة في/فى وعلى/علي
  normalized = normalized.replace(/[\u0649\u064A\u06D6\u06CD\u06CE]/g, 'ي');

  // 15. توحيد الهمزات المتوسطة والمتطرفة لغرض المطابقة
  normalized = normalized.replace(/[ؤ]/g, 'و'); // مثل: المؤمنون / المومنون
  normalized = normalized.replace(/[ئ]/g, 'ي'); // مثل: سئل / سيل، فئة / فيه
  normalized = normalized.replace(/[ء]/g, '');  // إزالة الهمزة المفردة

  // 16. تنظيف الفراغات المتعددة
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * كلمات أصلية تبدأ بالواو ويجب الحفاظ عليها من الحذف الخاطئ
 */
export const INTRINSIC_WAW_WORDS = new Set([
  'ويل', 'وقت', 'وجه', 'وجوه', 'وحي', 'وحى', 'واد', 'وادي', 'وادى', 'وزن', 'ورق', 'ورد', 'وسط', 'وسع', 
  'وتر', 'وجد', 'واحد', 'واحدة', 'والد', 'والدة', 'ولد', 'ولدا', 'وعد', 'وعيد', 'وقود', 
  'وراء', 'وفاقا', 'وثاق', 'وثقى', 'وثقي', 'وزر', 'وزير', 'وقار', 'وقارا', 'وعظ', 'وعظة', 'وهن', 'وهب', 'وهاب',
  'وحيد', 'وحيدا', 'وثنا', 'وثن', 'اوثان', 'اوثانا', 'وجل', 'وجلت', 'وراءكم', 'وراءهم', 'وراءنا', 'ولدان', 'ولدانا'
]);

/**
 * كلمات أصلية تبدأ بالفاء ويجب الحفاظ عليها من الحذف الخاطئ
 */
export const INTRINSIC_FA_WORDS = new Set([
  'في', 'فى', 'فوق', 'فم', 'فمه', 'فلق', 'فوز', 'فائز', 'فاسق', 'فاسقين', 'فرعون', 'فرد', 
  'فردوس', 'فرات', 'فلك', 'فلكا', 'فئة', 'فئه', 'فئتين', 'فوج', 'فصل', 'فضة', 'فضه', 'فضل', 'فجر', 'فتح',
  'فرش', 'فراش', 'فرح', 'فزع', 'فتى', 'فتيان', 'فتنة'
]);

/**
 * كلمات أصلية تبدأ بالباء ويجب الحفاظ عليها من الحذف الخاطئ
 */
export const INTRINSIC_BA_WORDS = new Set([
  'بين', 'بيت', 'بيوت', 'باب', 'أبواب', 'ابواب', 'بحر', 'بحار', 'بعث', 'بعض', 'بعد', 'بصر', 
  'بصير', 'بطن', 'بطون', 'بشر', 'بشير', 'بل', 'بلد', 'بلدة', 'بني', 'بنين', 'بنت', 
  'بنات', 'بأس', 'باس', 'بئر', 'بطل', 'بكر', 'بكرة', 'بر', 'برهان', 'براءة', 'براءه', 'بروج', 'برد', 'بردا', 'برق',
  'بعل', 'بعلا', 'بعلى', 'بعلي', 'بعلها', 'بعولتهن', 'بعيد', 'بعيدا', 'بغتة', 'بغيا', 'بغل', 'بغال', 'بضع', 'بضاعة', 'بخل', 'بخلوا',
  'بدن', 'بدر', 'بدء', 'بداء'
]);

/**
 * كلمات أصلية تبدأ باللام ويجب الحفاظ عليها من الحذف الخاطئ
 */
export const INTRINSIC_LAM_WORDS = new Set([
  'لا', 'لو', 'لم', 'لن', 'لما', 'لولا', 'لوما', 'لدن', 'لكن', 'لكنه', 'ليس', 'ليل', 'ليلة', 'ليلا', 'لوح', 'لوط', 'لحم', 
  'لحية', 'لباس', 'لبن', 'لسان', 'لهب', 'لقمان', 'لؤلؤ', 'لظى',
  'لعل', 'لعلي', 'لعلى', 'لعلهم', 'لعلك', 'لعلكم', 'لعلنا', 'لعله', 'لعلها',
  'لدى', 'لديه', 'لديهم', 'لدينا', 'لماذا', 'لهو', 'لغو', 'لحاف', 'لمزة', 'لمز'
]);

/**
 * استخراج الأصل المعجمي الموحد للكلمة (Canonical Lexical Lemma)
 * يجمع الكلمات التي تمثل لفظاً واحداً في اللغة العربية تحت أصل معجمي واحد موحد:
 * 1. يوحد كافة تصاريف وسوابق لفظ الجلالة (الله، والله، بالله، تالله، لله، ولله، فلله، فالله، وبالله، فبالله، ابالله، وتالله) تحت "الله"
 * 2. يوحد سوابق العطف (الواو، الفاء) مع صيانة الكلمات الأصيلة
 * 3. يوحد سوابق الجر المتصلة (الباء، اللام، الكاف) وتاء القسم مع مراعاة أل التعريف وإدغام اللام (للناس -> الناس، بالحق -> الحق)
 * 4. يوحد الأسماء الموصولة والضمائر وأسماء الإشارة
 */
export function toCanonicalLexicalLemma(rawWord: string): string {
  if (!rawWord) return '';
  const w = cleanQuranicWord(rawWord);
  if (!w || w.length < 2) return w;

  // توحيد الألف والياء لسهولة المطابقة المعجمية الجذرية
  const wNorm = w.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي');

  // 1. لفظ الجلالة الشريف وكافة متعلقاته وسوابقه العاطفة وحروف الجر والقسم
  if (
    wNorm === 'الله' || wNorm === 'والله' || wNorm === 'بالله' || wNorm === 'تالله' ||
    wNorm === 'لله' || wNorm === 'ولله' || wNorm === 'فلله' || wNorm === 'فالله' ||
    wNorm === 'وبالله' || wNorm === 'فبالله' || wNorm === 'ابالله' || wNorm === 'وتالله'
  ) {
    return 'الله';
  }
  if (wNorm === 'اللهم' || wNorm === 'واللهم') {
    return 'اللهم';
  }

  // 2. الأسماء الموصولة وأسماء الإشارة
  if (wNorm === 'الذين' || wNorm === 'والذين' || wNorm === 'فالذين' || wNorm === 'للذين' || wNorm === 'وللذين') return 'الذين';
  if (wNorm === 'الذي' || wNorm === 'والذي' || wNorm === 'فالذي' || wNorm === 'للذي') return 'الذي';
  if (wNorm === 'التي' || wNorm === 'والتي' || wNorm === 'فالتي' || wNorm === 'للتي') return 'التي';
  if (wNorm === 'ذلك' || wNorm === 'وذلك' || wNorm === 'فذلك' || wNorm === 'كذلك' || wNorm === 'وكذلك' || wNorm === 'فكذلك') return 'ذلك';
  if (wNorm === 'هذا' || wNorm === 'وهذا' || wNorm === 'فهذا' || wNorm === 'بهذا' || wNorm === 'كهذا') return 'هذا';
  if (wNorm === 'هؤلاء' || wNorm === 'وهؤلاء' || wNorm === 'فهؤلاء') return 'هؤلاء';
  if (wNorm === 'اولئك' || wNorm === 'واولئك' || wNorm === 'فاولئك') return 'أولئك';

  // 3. الضمائر
  if (wNorm === 'هو' || wNorm === 'وهو' || wNorm === 'فهو') return 'هو';
  if (wNorm === 'هي' || wNorm === 'وهي' || wNorm === 'فهي') return 'هي';
  if (wNorm === 'هم' || wNorm === 'وهم' || wNorm === 'فهم') return 'هم';
  if (wNorm === 'نحن' || wNorm === 'ونحن' || wNorm === 'فنحن') return 'نحن';

  // 4. الأدوات وحروف المعاني الشائعة
  if (wNorm === 'لا' || wNorm === 'ولا' || wNorm === 'فلا') return 'لا';
  if (wNorm === 'ما' || wNorm === 'وما' || wNorm === 'فما') return 'ما';
  if (wNorm === 'ان' || wNorm === 'وان' || wNorm === 'فان') return 'إن';
  if (wNorm === 'اذا' || wNorm === 'واذا' || wNorm === 'فاذا') return 'إذا';
  if (wNorm === 'اذ' || wNorm === 'واذ' || wNorm === 'فاذ') return 'إذ';
  if (wNorm === 'ثم' || wNorm === 'وثم') return 'ثم';

  // 5. تجريد سوابق العطف (الواو / الفاء)
  let result = w;
  if (result.startsWith('و') && result.length >= 3 && !INTRINSIC_WAW_WORDS.has(result)) {
    result = result.slice(1);
  } else if (result.startsWith('ف') && result.length >= 3 && !INTRINSIC_FA_WORDS.has(result)) {
    result = result.slice(1);
  }

  // 6. تجريد سوابق الجر والتشبيه المتصلة (بالـ / كالـ / للـ / بـ / لـ)
  if (result.startsWith('بال') && result.length >= 5) {
    result = result.slice(1); // بالحق -> الحق
  } else if (result.startsWith('كال') && result.length >= 5) {
    result = result.slice(1); // كالظل -> الظل
  } else if (result.startsWith('لل') && result.length >= 4) {
    result = 'ال' + result.slice(2); // للناس -> الناس
  } else if (result.startsWith('ب') && result.length >= 4 && !INTRINSIC_BA_WORDS.has(result)) {
    const sub = result.slice(1);
    if (!INTRINSIC_BA_WORDS.has(sub)) result = sub;
  } else if (result.startsWith('ل') && result.length >= 4 && !INTRINSIC_LAM_WORDS.has(result)) {
    const sub = result.slice(1);
    if (!INTRINSIC_LAM_WORDS.has(sub)) result = sub;
  }

  return result;
}

/**
 * فحص ما إذا كانت كلمتان متطابقتين تحت الأصل المعجمي الواحد
 */
export function isSameLexicalLemma(w1: string, w2: string): boolean {
  if (!w1 || !w2) return false;
  const l1 = toCanonicalLexicalLemma(w1);
  const l2 = toCanonicalLexicalLemma(w2);
  if (l1 === l2) return true;
  return l1.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي') === l2.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي');
}

/**
 * التحقق من مطابقة توكن قرآني لكلمة بحث استناداً للتمييز الدقيق بين الكلمات (Tokenization)
 * وتوحيد الأصل المعجمي للسوابق واللواحق والاشتقاقات وفق النمط المختار (WordMatchMode):
 * 1. exact_vocalized: تطابق تام مع التشكيل والرسم
 * 2. exact_plain: تطابق تام مجرد من التشكيل
 * 3. lemma_affixes: مجرد الكلمة مع كافة السوابق واللواحق القرآنية المغلقة (الافتراضي الحتمي - 322 لعذاب)
 * 4. root_derivatives: الجذر القرآني وكافة اشتقاقاته الفعلية والاسمية (عذب - 373)
 */
export function isArabicTokenMatch(
  tokenRaw: string, 
  queryWord: string, 
  mode: WordMatchMode = 'lemma_affixes'
): boolean {
  if (!tokenRaw || !queryWord) return false;

  if (mode === 'exact_vocalized') {
    return cleanVocalizedToken(tokenRaw) === cleanVocalizedToken(queryWord);
  }

  const tNorm = normalizeQuranicToken(tokenRaw);
  const qNorm = normalizeQuranicToken(queryWord);
  if (!tNorm || !qNorm) return false;

  if (mode === 'exact_plain') {
    return tNorm === qNorm;
  }

  if (mode === 'root_derivatives') {
    return isTokenInRoot(tNorm, queryWord);
  }

  // نمط مجرد الكلمة مع الزوائد والسوابق (lemma_affixes)
  if (tNorm === qNorm) return true;

  const tokenSet = buildLemmaAffixesTokenSet(queryWord);
  if (tokenSet.has(tNorm)) return true;

  // فحص الأصل المعجمي الموحد للأدوات الخاصة ولفظ الجلالة
  const tClean = cleanQuranicWord(tokenRaw);
  const qClean = cleanQuranicWord(queryWord);
  if (isSameLexicalLemma(tClean, qClean)) {
    return true;
  }

  return false;
}


/**
 * دالة المطابقة المحكمة لنصوص الآيات بالاعتماد على Tokenization دقيق للكلمات
 * تدعم:
 * 1. البحث عن كلمة مفردة مع تمييز التوكن وحماية الكلمات من التداخل الجزئي
 * 2. البحث عن العبارات المركبة (Phrases) بتطابق تسلسل التوكنات المتتالية
 * 3. إعادة فهارس التوكنات المطابقة (matchedIndices) للتظليل البصري الدقيق
 */
export function matchAyahTokens(
  rawAyahText: string, 
  query: string,
  mode: WordMatchMode = 'lemma_affixes'
): { isMatch: boolean; matchedIndices: number[] } {
  if (!rawAyahText || !query || !query.trim()) {
    return { isMatch: true, matchedIndices: [] };
  }

  const rawTokens = rawAyahText.trim().split(/\s+/).filter(Boolean);
  const queryTokens = query.trim().split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) {
    return { isMatch: true, matchedIndices: [] };
  }

  const matchedIndices: number[] = [];

  // حالة البحث عن كلمة واحدة: فحص كل توكن على حدة
  if (queryTokens.length === 1) {
    const qWord = queryTokens[0];
    rawTokens.forEach((tok, idx) => {
      if (isArabicTokenMatch(tok, qWord, mode)) {
        matchedIndices.push(idx);
      }
    });
    return { isMatch: matchedIndices.length > 0, matchedIndices };
  }

  // حالة العبارات المركبة: فحص تسلسل التوكنات المتتالية
  // معالجة حالة كتابة "يا نساء" منفصلة بينما هي في الرسم العثماني "يانساء" متصلة
  const mergedQueryTokens: string[] = [];
  for (let k = 0; k < queryTokens.length; k++) {
    if (queryTokens[k] === 'يا' && k + 1 < queryTokens.length) {
      mergedQueryTokens.push('يا' + queryTokens[k + 1]);
      k++;
    } else {
      mergedQueryTokens.push(queryTokens[k]);
    }
  }

  const tryMatchSequence = (qSeq: string[]): number[] => {
    const matched: number[] = [];
    const n = qSeq.length;
    for (let i = 0; i <= rawTokens.length - n; i++) {
      let allMatch = true;
      for (let j = 0; j < n; j++) {
        if (!isArabicTokenMatch(rawTokens[i + j], qSeq[j], mode)) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        for (let j = 0; j < n; j++) {
          matched.push(i + j);
        }
        i += n - 1; // تخطي التوكنات المتطابقة لمنع التكرار
      }
    }
    return matched;
  };

  const res1 = tryMatchSequence(queryTokens);
  if (res1.length > 0) {
    return { isMatch: true, matchedIndices: res1 };
  }

  if (mergedQueryTokens.length !== queryTokens.length) {
    const res2 = tryMatchSequence(mergedQueryTokens);
    if (res2.length > 0) {
      return { isMatch: true, matchedIndices: res2 };
    }
  }

  return { isMatch: false, matchedIndices: [] };
}

/**
 * دالة مساعدة سريعة للتحقق من تطابق عبارة البحث مع نص الآية أو السورة
 * تعتمد على Tokenization للكلمات عند البحث عن ألفاظ محددة، أو المطابقة النصية الشاملة
 */
export function isArabicTextMatch(
  query: string, 
  rawText: string, 
  precomputedNormalized?: string,
  mode: WordMatchMode = 'lemma_affixes'
): boolean {
  if (!query || !query.trim()) return true;
  const tokenMatch = matchAyahTokens(rawText, query, mode);
  if (tokenMatch.isMatch) return true;

  const normQuery = normalizeArabicText(query);
  if (!normQuery) return true;

  const normTarget = precomputedNormalized || normalizeArabicText(rawText);
  return normTarget.includes(normQuery);
}

/**
 * Strips any leading "سورة" or "سُورَةُ" (with any diacritics/tashkeel/tatweel) from a surah name.
 * e.g., "سُورَةُ ٱلْفَاتِحَةِ" -> "ٱلْفَاتِحَةِ"
 * e.g., "سورة الفاتحة" -> "الفاتحة"
 * e.g., "سورة سورة الفاتحة" -> "الفاتحة"
 */
export function getCleanSurahName(name: string): string {
  if (!name) return '';
  let cleaned = name.trim();
  const surahPrefixRegex = /^سُ?و?رَ?ةُ?\s+/i;
  const diacriticsSurahPrefixRegex = /^س[\u064B-\u065F]*و[\u064B-\u065F\u0670]*ر[\u064B-\u065F]*[ةه][\u064B-\u065F]*\s+/;
  while (diacriticsSurahPrefixRegex.test(cleaned) || surahPrefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(diacriticsSurahPrefixRegex, '').replace(surahPrefixRegex, '').trim();
  }
  return cleaned;
}

/**
 * Returns the surah title with exactly ONE "سورة" prefix.
 * e.g. "سُورَةُ ٱلْفَاتِحَةِ" -> "سورة ٱلْفَاتِحَةِ"
 * e.g. "الفاتحة" -> "سورة الفاتحة"
 * e.g. "سورة سورة الفاتحة" -> "سورة الفاتحة"
 * Guarantees never producing "سورة سورة..." anywhere in the application.
 */
export function formatSurahName(name: string): string {
  if (!name) return '';
  const clean = getCleanSurahName(name);
  if (!clean) return name.trim();
  return `سورة ${clean}`;
}



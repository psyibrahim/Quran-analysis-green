import { SurahData } from '../types';
import { 
  Type, 
  Music, 
  Waves, 
  Ruler, 
  BookOpen, 
  Layers,
  Volume2,
  LucideIcon
} from 'lucide-react';

import { calculatePhoneticStats } from './phonetics';

export type SimilarityCriterionId = 
  | 'letters' 
  | 'phonetics'
  | 'verse_endings' 
  | 'diacritics' 
  | 'cadence' 
  | 'vocabulary' 
  | 'composite';

export interface SimilarityCriterionDef {
  id: SimilarityCriterionId;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  formula: string;
  academicRationale: string;
  icon: LucideIcon;
  color: {
    text: string;
    bg: string;
    border: string;
    activeRing: string;
    badgeLight: string;
    badgeDark: string;
  };
}

export const ARABIC_LETTERS: string[] = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

export const SIMILARITY_CRITERIA: SimilarityCriterionDef[] = [
  {
    id: 'letters',
    label: 'نسب الحروف الهجائية الـ 28',
    shortLabel: 'الحروف الـ 28',
    badge: 'ترددي أبجدي',
    description: 'يقيس التشابه الصوتي والأبجدي بناءً على التوزيع الترددي لنسب حروف الهجاء الـ 28 في السورة.',
    formula: 'تشابه جيب التمام (Cosine Similarity) لمتجه نسب الحروف: (V_A · V_B) / (||V_A|| × ||V_B||)',
    academicRationale: 'يكشف التآلف في النسيج الصوتي العام وتوازن الحروف الهجائية الأساسية دون الالتفات إلى طول السورة.',
    icon: Type,
    color: {
      text: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      activeRing: 'ring-emerald-400',
      badgeLight: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      badgeDark: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    }
  },
  {
    id: 'phonetics',
    label: 'مخارج وصفات الحروف التجويدية',
    shortLabel: 'المخارج والصفات',
    badge: 'صوتي تجويدي',
    description: 'يقيس التماثل في مخارج الحروف (حلق، لسان، شفتان، جوف) وصفات الجهر والهمس والشدة والتفخيم والترقيق.',
    formula: 'جيب التمام للمتجه الصوتي التجويدي المركب (Makharij & Phonetic Traits Vector)',
    academicRationale: 'يكشف التآلف في الجرس اللفظي وطبيعة النبرة (فخامة وقوة كالمكية، أو سلاسة ورقة كالمدنية).',
    icon: Volume2,
    color: {
      text: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/30',
      activeRing: 'ring-teal-400',
      badgeLight: 'bg-teal-100 text-teal-950 border-teal-300',
      badgeDark: 'bg-teal-950/80 text-teal-300 border-teal-800'
    }
  },
  {
    id: 'verse_endings',
    label: 'فواصل الآيات وحروف الروي',
    shortLabel: 'فواصل الآيات',
    badge: 'إيقاع قوافي',
    description: 'يقيس التقارب في قوافي وخواتيم الآيات القرآنية وحروف الروي المهيمنة على نهايات الفواصل.',
    formula: 'جيب التمام لمتجهات أوزان ونسب فواصل رؤوس الآي المشتركة (Verse Endings Distribution)',
    academicRationale: 'يحدد السور التي تشترك في نفس النغم والقفلة الصوتية، مثل تقارب سور المد بالألف، أو سور الياء والنون.',
    icon: Music,
    color: {
      text: 'text-lime-400',
      bg: 'bg-lime-500/10',
      border: 'border-lime-500/30',
      activeRing: 'ring-lime-400',
      badgeLight: 'bg-lime-100 text-lime-950 border-lime-300',
      badgeDark: 'bg-lime-950/80 text-lime-300 border-lime-800'
    }
  },
  {
    id: 'diacritics',
    label: 'الحركات والتشكيل الصوتي',
    shortLabel: 'التشكيل والحركات',
    badge: 'فونولوجي تشكيلي',
    description: 'يقيس التماثل في التوزيع النسبي للحركات الإعرابية (الفتح، الضم، الكسر، السكون، التنوين، الشدة، والمد).',
    formula: 'جيب التمام للمتجه التساعي (9D) لنسب الحركات التشكيلية منسوبة لإجمالي حركات السورة',
    academicRationale: 'يميز بين السور ذات الطابع المفتوح السريع وتلك ذات التراكيب المضمومة أو المكسورة أو المشددة الرصينة.',
    icon: Waves,
    color: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      activeRing: 'ring-emerald-400',
      badgeLight: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      badgeDark: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    }
  },
  {
    id: 'cadence',
    label: 'الإيقاع الهندسي وطول الآيات',
    shortLabel: 'طول وتجانس الآيات',
    badge: 'بنائي هندسي',
    description: 'يقيس التجانس في أطوال الآيات بالكلمات والحروف ومعدل الانحراف المعياري وسرعة التدفق البلاغي.',
    formula: 'مقياس القرب الإقليدي المعياري (Normalized Proximity) لمتوسط طول الآية بالحروف والكلمات والانحراف المعياري',
    academicRationale: 'يجمع السور ذات النمط الإيقاعي المتماثل (مثل السور ذات الآيات القصيرة المتلاحقة كالمفصل، أو الطويلة الاستدلالية).',
    icon: Ruler,
    color: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      activeRing: 'ring-amber-400',
      badgeLight: 'bg-amber-100 text-amber-950 border-amber-300',
      badgeDark: 'bg-amber-950/80 text-amber-300 border-amber-800'
    }
  },
  {
    id: 'vocabulary',
    label: 'المعجم وتنوع المفردات (جيراود المعدّل)',
    shortLabel: 'المعجم وجيراود',
    badge: 'معجمي معدّل',
    description: 'يقيس التماثل المعجمي بعدالة إحصائية عبر تحييد أثر طول السورة بمؤشر جيراود (V/√N) وتطابق الألفاظ المشتركة.',
    formula: '50% تقارب مؤشر جيراود (Guiraud R) + 50% جيب التمام لتوزيع الألفاظ المركزية المشتركة',
    academicRationale: 'يتغلب على انخفاض TTR التلقائي في السور الطويلة (قانون هيبس)، ويقارن السعة المعجمية الحقيقية وتآلف المفردات.',
    icon: BookOpen,
    color: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      activeRing: 'ring-rose-400',
      badgeLight: 'bg-rose-100 text-rose-950 border-rose-300',
      badgeDark: 'bg-rose-950/80 text-rose-300 border-rose-800'
    }
  },
  {
    id: 'composite',
    label: 'المؤشر التكاملي الشامل',
    shortLabel: 'بصمة مركبة شاملة',
    badge: 'مؤشر هجين مركب',
    description: 'مؤشر وزني تركيبي يدمج الأبعاد الستة (الحروف 25%، المخارج والصفات 15%، الفواصل 20%، التشكيل 15%، الإيقاع 15%، المعجم 10%).',
    formula: 'المتوسط المرجح للأبعاد: 0.25L + 0.15P + 0.20E + 0.15D + 0.15C + 0.10V',
    academicRationale: 'يقدم الرؤية الأقرب للواقع الشامل للتشابه الأسلوبي القرآني، مع موازنة التناغم الصوتي والتجويدي والإيقاعي والمعجمي.',
    icon: Layers,
    color: {
      text: 'text-gold-400',
      bg: 'bg-gold-500/10',
      border: 'border-gold-500/30',
      activeRing: 'ring-gold-400',
      badgeLight: 'bg-gold-100 text-gold-950 border-gold-300',
      badgeDark: 'bg-gold-950/80 text-gold-300 border-gold-800'
    }
  }
];

// Helper to compute min/max for cadence normalization
interface CadenceBounds {
  avgAyahLengthWords: { min: number; max: number };
  avgAyahLengthChars: { min: number; max: number };
  verseLengthStdDev: { min: number; max: number };
  avgWordLength: { min: number; max: number };
}

let cachedCadenceBounds: CadenceBounds | null = null;

function getCadenceBounds(allSurahs: SurahData[]): CadenceBounds {
  if (cachedCadenceBounds) return cachedCadenceBounds;
  const words = allSurahs.map(s => s.avgAyahLengthWords || 0);
  const chars = allSurahs.map(s => s.avgAyahLengthChars || 0);
  const std = allSurahs.map(s => s.verseLengthStdDev || 0);
  const wordLen = allSurahs.map(s => s.avgWordLength || 0);

  cachedCadenceBounds = {
    avgAyahLengthWords: { min: Math.min(...words), max: Math.max(...words) },
    avgAyahLengthChars: { min: Math.min(...chars), max: Math.max(...chars) },
    verseLengthStdDev: { min: Math.min(...std), max: Math.max(...std) },
    avgWordLength: { min: Math.min(...wordLen), max: Math.max(...wordLen) },
  };
  return cachedCadenceBounds;
}

// 1. Letters Cosine Similarity
export function calculateLettersSimilarity(s1: SurahData, s2: SurahData): number {
  let dot = 0, norm1 = 0, norm2 = 0;
  for (let i = 0; i < ARABIC_LETTERS.length; i++) {
    const l = ARABIC_LETTERS[i];
    const v1 = s1.letters?.plainPercentages?.[l] ?? 0;
    const v2 = s2.letters?.plainPercentages?.[l] ?? 0;
    dot += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return Number(((dot / (Math.sqrt(norm1) * Math.sqrt(norm2))) * 100).toFixed(1));
}

// 2. Phonetic Articulation & Traits Cosine Similarity
export function calculatePhoneticSimilarity(s1: SurahData, s2: SurahData): {
  similarity: number;
} {
  const p1 = calculatePhoneticStats(s1.letters?.plainCounts || {});
  const p2 = calculatePhoneticStats(s2.letters?.plainCounts || {});

  const v1 = [
    p1.makharij.halq.percentage,
    p1.makharij.lisan.percentage,
    p1.makharij.shafatan.percentage,
    p1.makharij.jawf.percentage,
    p1.voice.hams.percentage,
    p1.voice.jahr.percentage,
    p1.strength.shiddah.percentage,
    p1.strength.bayniyyah.percentage,
    p1.strength.rakhawah.percentage,
    p1.elevation.istiila.percentage,
    p1.elevation.istifal.percentage,
    p1.specialTraits.qalqalah.percentage,
    p1.specialTraits.ghunnah.percentage
  ];

  const v2 = [
    p2.makharij.halq.percentage,
    p2.makharij.lisan.percentage,
    p2.makharij.shafatan.percentage,
    p2.makharij.jawf.percentage,
    p2.voice.hams.percentage,
    p2.voice.jahr.percentage,
    p2.strength.shiddah.percentage,
    p2.strength.bayniyyah.percentage,
    p2.strength.rakhawah.percentage,
    p2.elevation.istiila.percentage,
    p2.elevation.istifal.percentage,
    p2.specialTraits.qalqalah.percentage,
    p2.specialTraits.ghunnah.percentage
  ];

  let dot = 0, norm1 = 0, norm2 = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  if (norm1 === 0 || norm2 === 0) return { similarity: 0 };
  const similarity = Number(((dot / (Math.sqrt(norm1) * Math.sqrt(norm2))) * 100).toFixed(1));
  return { similarity };
}

// 3. Verse Endings Cosine Similarity
export function calculateVerseEndingsSimilarity(s1: SurahData, s2: SurahData): {
  similarity: number;
  topSharedEnding?: string;
} {
  const map1: Record<string, number> = {};
  const map2: Record<string, number> = {};
  
  (s1.ayahs?.verseEndings || []).forEach(e => { map1[e.pattern] = e.percentage; });
  (s2.ayahs?.verseEndings || []).forEach(e => { map2[e.pattern] = e.percentage; });

  const allKeys = Array.from(new Set([...Object.keys(map1), ...Object.keys(map2)]));
  if (allKeys.length === 0) return { similarity: 0 };

  let dot = 0, norm1 = 0, norm2 = 0;
  let maxSharedVal = 0;
  let topShared = '';

  for (let i = 0; i < allKeys.length; i++) {
    const k = allKeys[i];
    const v1 = map1[k] ?? 0;
    const v2 = map2[k] ?? 0;
    dot += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;

    if (v1 > 0 && v2 > 0) {
      const harmonic = (2 * v1 * v2) / (v1 + v2);
      if (harmonic > maxSharedVal) {
        maxSharedVal = harmonic;
        topShared = k;
      }
    }
  }

  if (norm1 === 0 || norm2 === 0) return { similarity: 0 };
  const similarity = Number(((dot / (Math.sqrt(norm1) * Math.sqrt(norm2))) * 100).toFixed(1));
  return { similarity, topSharedEnding: topShared || undefined };
}

// 3. Diacritics Cosine Similarity
export function calculateDiacriticsSimilarity(s1: SurahData, s2: SurahData): number {
  const d1 = s1.diacritics;
  const d2 = s2.diacritics;
  if (!d1 || !d2 || !d1.total || !d2.total) return 0;

  const marks: (keyof typeof d1)[] = [
    'fatha', 'damma', 'kasra', 'sukun', 
    'tanweenFath', 'tanweenDamm', 'tanweenKasr', 
    'shaddah', 'maddah'
  ];

  let dot = 0, norm1 = 0, norm2 = 0;
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const v1 = (d1[m] as number || 0) / d1.total;
    const v2 = (d2[m] as number || 0) / d2.total;
    dot += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return Number(((dot / (Math.sqrt(norm1) * Math.sqrt(norm2))) * 100).toFixed(1));
}

// 4. Cadence & Verse Length Similarity
export function calculateCadenceSimilarity(s1: SurahData, s2: SurahData, allSurahs: SurahData[]): number {
  const bounds = getCadenceBounds(allSurahs);
  const keys: (keyof CadenceBounds)[] = [
    'avgAyahLengthWords', 
    'avgAyahLengthChars', 
    'verseLengthStdDev', 
    'avgWordLength'
  ];

  let sumSq = 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const range = (bounds[k].max - bounds[k].min) || 1;
    const v1 = ((s1[k] || 0) - bounds[k].min) / range;
    const v2 = ((s2[k] || 0) - bounds[k].min) / range;
    sumSq += (v1 - v2) * (v1 - v2);
  }

  const dist = Math.sqrt(sumSq) / Math.sqrt(keys.length);
  return Number((Math.max(0, 1 - dist) * 100).toFixed(1));
}

// 5. Vocabulary & Lexical Diversity Similarity (Guiraud R + Shared Core Vocabulary)
export function calculateVocabularySimilarity(s1: SurahData, s2: SurahData): {
  similarity: number;
  sharedTopWordsCount: number;
  rawTtr1: number;
  rawTtr2: number;
  guiraud1: number;
  guiraud2: number;
} {
  const n1Words = s1.totalWords || 1;
  const n2Words = s2.totalWords || 1;
  const rawTtr1 = s1.vocabularyDiversity || 0;
  const rawTtr2 = s2.vocabularyDiversity || 0;

  const v1 = Math.round((rawTtr1 / 100) * n1Words);
  const v2 = Math.round((rawTtr2 / 100) * n2Words);

  const guiraud1 = Number((v1 / Math.sqrt(n1Words)).toFixed(2));
  const guiraud2 = Number((v2 / Math.sqrt(n2Words)).toFixed(2));

  // Balanced similarity using Guiraud R proximity (Length-Invariant) + Shared Core Words Cosine:
  const guiraudDiff = Math.abs(guiraud1 - guiraud2);
  const maxGuiraud = Math.max(guiraud1, guiraud2, 1);
  const guiraudSim = Math.max(0, (1 - (guiraudDiff / maxGuiraud)) * 100);

  const top1 = s1.words?.topWords || [];
  const top2 = s2.words?.topWords || [];
  const map1: Record<string, number> = {};
  const map2: Record<string, number> = {};

  top1.forEach(w => { map1[w.word] = w.percentage; });
  top2.forEach(w => { map2[w.word] = w.percentage; });

  const commonWords = Object.keys(map1).filter(w => map2[w] !== undefined);
  let dot = 0, sumSq1 = 0, sumSq2 = 0;

  commonWords.forEach(w => {
    dot += map1[w] * map2[w];
  });
  Object.values(map1).forEach(v => { sumSq1 += v * v; });
  Object.values(map2).forEach(v => { sumSq2 += v * v; });

  const wordsCosine = (sumSq1 > 0 && sumSq2 > 0) ? (dot / (Math.sqrt(sumSq1) * Math.sqrt(sumSq2))) * 100 : 0;
  
  // 50% Guiraud Length-Invariant Lexical Richness Proximity + 50% Shared Core Vocabulary Cosine
  const combined = Number((0.50 * guiraudSim + 0.50 * wordsCosine).toFixed(1));

  return {
    similarity: combined,
    sharedTopWordsCount: commonWords.length,
    rawTtr1,
    rawTtr2,
    guiraud1,
    guiraud2
  };
}

// 6. Comprehensive Composite Similarity (6 Dimensions)
export function calculateCompositeSimilarity(s1: SurahData, s2: SurahData, allSurahs: SurahData[]): number {
  const l = calculateLettersSimilarity(s1, s2);
  const p = calculatePhoneticSimilarity(s1, s2).similarity;
  const e = calculateVerseEndingsSimilarity(s1, s2).similarity;
  const d = calculateDiacriticsSimilarity(s1, s2);
  const c = calculateCadenceSimilarity(s1, s2, allSurahs);
  const v = calculateVocabularySimilarity(s1, s2).similarity;

  const score = (0.25 * l) + (0.15 * p) + (0.20 * e) + (0.15 * d) + (0.15 * c) + (0.10 * v);
  return Number(score.toFixed(1));
}

export interface SimilarityResult {
  surah: SurahData;
  similarity: number;
  rank: number;
  detailLabel: string;
  detailValue: string;
  criterion: SimilarityCriterionId;
}

// Master query function to rank all other surahs against a target surah by criterion
export function getClosestSurahsByCriterion(
  targetSurah: SurahData,
  allSurahs: SurahData[],
  criterion: SimilarityCriterionId,
  options?: {
    filterRevelation?: 'all' | 'meccan' | 'medinan';
    limit?: number;
  }
): SimilarityResult[] {
  const { filterRevelation = 'all', limit = 5 } = options || {};

  const candidates = allSurahs.filter(s => {
    if (s.number === targetSurah.number) return false;
    if (filterRevelation === 'meccan' && !s.isMeccan) return false;
    if (filterRevelation === 'medinan' && s.isMeccan) return false;
    return true;
  });

  const scoredList = candidates.map(s => {
    let sim = 0;
    let detailLabel = '';
    let detailValue = '';

    switch (criterion) {
      case 'letters': {
        sim = calculateLettersSimilarity(targetSurah, s);
        detailLabel = 'تشابه تردد الحروف';
        detailValue = `${sim}% تقارب متجهي`;
        break;
      }
      case 'phonetics': {
        const res = calculatePhoneticSimilarity(targetSurah, s);
        sim = res.similarity;
        detailLabel = 'المخارج والصفات التجويدية';
        detailValue = `${sim}% تقارب تجويدي`;
        break;
      }
      case 'verse_endings': {
        const res = calculateVerseEndingsSimilarity(targetSurah, s);
        sim = res.similarity;
        detailLabel = 'تطابق قوافي الآيات';
        detailValue = res.topSharedEnding ? `فاصلة مشتركة: ${res.topSharedEnding}` : 'تطابق فواصلي';
        break;
      }
      case 'diacritics': {
        sim = calculateDiacriticsSimilarity(targetSurah, s);
        detailLabel = 'تشابه التشكيل الصوتي';
        detailValue = `${sim}% تجانس حركات`;
        break;
      }
      case 'cadence': {
        sim = calculateCadenceSimilarity(targetSurah, s, allSurahs);
        detailLabel = 'تجانس طول الآية';
        detailValue = `معدل: ${s.avgAyahLengthWords} كلمة/آية`;
        break;
      }
      case 'vocabulary': {
        const res = calculateVocabularySimilarity(targetSurah, s);
        sim = res.similarity;
        detailLabel = 'المعجم وجيراود المعدّل';
        detailValue = `جيراود R: ${res.guiraud2} • ${res.sharedTopWordsCount} ألفاظ مشتركة`;
        break;
      }
      case 'composite': {
        sim = calculateCompositeSimilarity(targetSurah, s, allSurahs);
        detailLabel = 'المؤشر التكاملي';
        detailValue = 'تكامل سداسي الأبعاد';
        break;
      }
    }

    return {
      surah: s,
      similarity: sim,
      detailLabel,
      detailValue,
      criterion
    };
  });

  // Sort descending by similarity
  scoredList.sort((a, b) => b.similarity - a.similarity);

  // Take top limit and assign rank
  return scoredList.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

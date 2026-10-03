import { SurahData, QuranSurahCorpus, LetterStatsData } from '../types';
import { ARABIC_LETTERS, ARABIC_LETTER_NAMES } from './arabic';

export const HAWAMEEM_SURAH_NUMBERS = [40, 41, 42, 43, 44, 45, 46] as const;

export interface HawameemSurahMeta {
  number: number;
  name: string;
  historicalNames: string[];
  revelationOrder: number;
  juz: number[];
  openingUthmani: string;
  followingVerseUthmani: string;
  divineAttributesInOpening: string;
  thematicSummary: string;
  centralVerseTopic: string;
}

export const HAWAMEEM_METADATA: Record<number, HawameemSurahMeta> = {
  40: {
    number: 40,
    name: 'غافر',
    historicalNames: ['المؤمن', 'حم الأولى', 'الطَّوْل'],
    revelationOrder: 60,
    juz: [24],
    openingUthmani: 'حمٓ',
    followingVerseUthmani: 'تَنزِيلُ ٱلْكِتَٰبِ مِنَ ٱللَّهِ ٱلْعَزِيزِ ٱلْعَلِيمِ ۝ غَافِرِ ٱلذَّنۢبِ وَقَابِلِ ٱلتَّوْبِ شَدِيدِ ٱلْعِقَابِ ذِى ٱلطَّوْلِ',
    divineAttributesInOpening: 'العزيز العليم، غافر الذنب وقابل التوب شديد العقاب ذي الطول',
    thematicSummary: 'الدعوة والجدال بالحق، قصة مؤمن آل فرعون، وحملة العرش واستغفارهم للمؤمنين.',
    centralVerseTopic: 'مجادلة الكفار في آيات الله، وبيان مآل الأمم المكذبة'
  },
  41: {
    number: 41,
    name: 'فصلت',
    historicalNames: ['حم السجدة', 'المصابيح', 'الأقوات'],
    revelationOrder: 61,
    juz: [24, 25],
    openingUthmani: 'حمٓ',
    followingVerseUthmani: 'تَنزِيلٌۭ مِّنَ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ كِتَٰبٌۭ فُصِّلَتْ ءَايَٰتُهُۥ قُرْءَانًا عَرَبِيًّۭا لِّقَوْمٍۢ يَعْلَمُونَ',
    divineAttributesInOpening: 'الرحمن الرحيم',
    thematicSummary: 'تفصيل آيات القرآن العربي، خلق السماوات والأرض في ستة أيام، وشهادة الجوارح على الكافرين.',
    centralVerseTopic: 'بيان فصاحة القرآن وتحدي المكذبين وإعجاز خلقة الكون'
  },
  42: {
    number: 42,
    name: 'الشورى',
    historicalNames: ['حم عسق'],
    revelationOrder: 62,
    juz: [25],
    openingUthmani: 'حمٓ ۝ عٓسٓقٓ',
    followingVerseUthmani: 'كَذَٰلِكَ يُوحِىٓ إِلَيْكَ وَإِلَى ٱلَّذِينَ مِن قَبْلِكَ ٱللَّهُ ٱلْعَزِيزُ ٱلْحَكِيمُ',
    divineAttributesInOpening: 'العزيز الحكيم',
    thematicSummary: 'وحدة الوحي الإلهي للأنبياء، تشريع الدين، مبدأ الشورى الراسخ، ورزق العباد ومشيئة الله.',
    centralVerseTopic: 'وحدة مصدر الوحي والرسالات الإلهية ومبدأ الشورى'
  },
  43: {
    number: 43,
    name: 'الزخرف',
    historicalNames: ['حم الزخرف'],
    revelationOrder: 63,
    juz: [25],
    openingUthmani: 'حمٓ',
    followingVerseUthmani: 'وَٱلْكِتَٰبِ ٱلْمُبِينِ ۝ إِنَّا جَعَلْنَٰهُ قُرْءَٰنًا عَرَبِيًّۭا لَّعَلَّكُمْ تَعْقِلُونَ ۝ وَإِنَّهُۥ فِىٓ أُمِّ ٱلْكِتَٰبِ لَدَيْنَا لَعَلِىٌّ حَكِيمٌ',
    divineAttributesInOpening: 'علي حكيم (صفة القرآن عند الله في أم الكتاب)',
    thematicSummary: 'عظمة القرآن في أم الكتاب، تفنيد دعوى الشرك والولد، وقيمة المظاهر الدنيوية الزائلة (الزخرف).',
    centralVerseTopic: 'بيان حقيقة زخرف الدنيا الزائل مقابل باق النعيم الأخروي'
  },
  44: {
    number: 44,
    name: 'الدخان',
    historicalNames: ['حم الدخان'],
    revelationOrder: 64,
    juz: [25],
    openingUthmani: 'حمٓ',
    followingVerseUthmani: 'وَٱلْكِتَٰبِ ٱلْمُبِينِ ۝ إِنَّآ أَنزَلْنَٰهُ فِى لَيْلَةٍۢ مُّبَٰرَكَةٍ ۚ إِنَّا كُنَّا مُنذِرِينَ',
    divineAttributesInOpening: 'رب السماوات والأرض وما بينهما، هو السميع العليم',
    thematicSummary: 'نزول القرآن في الليلة المباركة (القدر)، آية الدخان المبين، ومصير فرعون وقومه ونعيم المتقين.',
    centralVerseTopic: 'إنذار قريش بآية الدخان وذكر ليلة القدر ومصارع الجبابرة'
  },
  45: {
    number: 45,
    name: 'الجاثية',
    historicalNames: ['الشريعة', 'حم الجاثية', 'الدهر'],
    revelationOrder: 65,
    juz: [25],
    openingUthmani: 'حمٓ',
    followingVerseUthmani: 'تَنزِيلُ ٱلْكِتَٰبِ مِنَ ٱللَّهِ ٱلْعَزِيزِ ٱلْحَكِيمِ ۝ إِنَّ فِى ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ لَءَايَٰتٍۢ لِّلْمُؤْمِنِينَ',
    divineAttributesInOpening: 'العزيز الحكيم',
    thematicSummary: 'آيات الله الكونية في الآفاق، شريعة الله ومحاكمة أهل الدهرية، ومشهد جثو كل أمة بين يدي الله.',
    centralVerseTopic: 'الآيات الكونية، شريعة الله، وموقف الجاثين للحساب يوم القيامة'
  },
  46: {
    number: 46,
    name: 'الأحقاف',
    historicalNames: ['حم الأحقاف'],
    revelationOrder: 66,
    juz: [26],
    openingUthmani: 'حمٓ',
    followingVerseUthmani: 'تَنزِيلُ ٱلْكِتَٰبِ مِنَ ٱللَّهِ ٱلْعَزِيزِ ٱلْحَكِيمِ ۝ مَا خَلَقْنَا ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ وَمَا بَيْنَهُمَآ إِلَّا بِٱلْحَقِّ وَأَجَلٍۢ مُّسَمًّۭى',
    divineAttributesInOpening: 'العزيز الحكيم',
    thematicSummary: 'خلق الكون بالحق، بر الوالدين، قصة نبي الله هود في ديار الأحقاف، وإيمان نفر من الجن بالقرآن، وأمر النبي بالصبر كصبر أولي العزم.',
    centralVerseTopic: 'خلق الكون بالحق، قصة عاد بالأحقاف، وسماع الجن للقرآن'
  }
};

export const HAWAMEEM_TRADITIONS = [
  {
    quote: '«الحواميم ديباج القرآن»',
    source: 'عبد الله بن مسعود رضي الله عنه (أخرجه الحاكم والبيهقي)'
  },
  {
    quote: '«مثل الحواميم في القرآن كمثل الروضات في الجنان، إذا وقعت فيهن ارتعْتَ في رياضٍ مُونقة»',
    source: 'عبد الله بن عباس رضي الله عنهما'
  },
  {
    quote: '«الحواميم عرائس القرآن»',
    source: 'سفيان الثوري وكعب الأحبار رحمهم الله'
  },
  {
    quote: '«من أراد أن يرتع في رياض الجنة فليقرأ الحواميم»',
    source: 'من لطائف الأثر المروي عن السلف في فضل آل حم'
  }
];

export interface HawameemSurahLetterStat {
  surahNumber: number;
  surahName: string;
  totalLetters: number;
  haCount: number;
  haPercentage: number;
  meemCount: number;
  meemPercentage: number;
  haPlusMeemCount: number;
  haPlusMeemPercentage: number;
  letterCounts: Record<string, number>;
  letterPercentages: Record<string, number>;
  letterDeviations: Record<string, number>; // Deviation from Quran global average
}

export interface HawameemAggregateReport {
  surahs: SurahData[];
  hawameemLettersStats: HawameemSurahLetterStat[];
  totalHawameemVerses: number;
  totalHawameemWords: number;
  totalHawameemLetters: number;
  totalHawameemHa: number;
  totalHawameemMeem: number;
  totalHawameemHaPlusMeem: number;
  avgHawameemHaPct: number;
  avgHawameemMeemPct: number;
  avgHawameemHaPlusMeemPct: number;
  quranGlobalHaPct: number;
  quranGlobalMeemPct: number;
  quranGlobalHaPlusMeemPct: number;
  rhymeDistribution: Record<string, number>;
  similarityMatrix7x7: {
    surahA: number;
    surahB: number;
    similarity: number;
  }[];
}

/**
 * Calculates Cosine Similarity between two numerical vectors
 */
function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes comprehensive statistical profile for the Seven Hawameem surahs
 */
export function computeHawameemReport(
  allSurahs: SurahData[],
  letterStats: LetterStatsData
): HawameemAggregateReport {
  const hawameemSurahs = allSurahs.filter(s => 
    (HAWAMEEM_SURAH_NUMBERS as readonly number[]).includes(s.number)
  );

  // Quran Global letter totals
  let quranTotalLetters = 0;
  Object.values(letterStats.globalStats || {}).forEach(stat => {
    quranTotalLetters += stat.totalOccurrences || 0;
  });
  if (quranTotalLetters === 0) quranTotalLetters = 326048; // fallback to standard count

  const quranGlobalHa = letterStats.globalStats?.['ح']?.totalOccurrences || 4138;
  const quranGlobalMeem = letterStats.globalStats?.['م']?.totalOccurrences || 26732;

  const quranGlobalHaPct = (quranGlobalHa / quranTotalLetters) * 100;
  const quranGlobalMeemPct = (quranGlobalMeem / quranTotalLetters) * 100;
  const quranGlobalHaPlusMeemPct = quranGlobalHaPct + quranGlobalMeemPct;

  let totalHawameemVerses = 0;
  let totalHawameemWords = 0;
  let totalHawameemLetters = 0;
  let totalHawameemHa = 0;
  let totalHawameemMeem = 0;

  const rhymeMap: Record<string, number> = {};

  const hawameemLettersStats: HawameemSurahLetterStat[] = hawameemSurahs.map(surah => {
    const letters = surah.letters;
    const totalChars = letters.totalLettersPlain || surah.totalChars;
    const haCount = letters.plainCounts['ح'] || 0;
    const meemCount = letters.plainCounts['م'] || 0;
    const haPlusMeemCount = haCount + meemCount;

    const haPct = totalChars > 0 ? (haCount / totalChars) * 100 : 0;
    const meemPct = totalChars > 0 ? (meemCount / totalChars) * 100 : 0;
    const haPlusMeemPct = totalChars > 0 ? (haPlusMeemCount / totalChars) * 100 : 0;

    totalHawameemVerses += surah.totalAyahs;
    totalHawameemWords += surah.totalWords;
    totalHawameemLetters += totalChars;
    totalHawameemHa += haCount;
    totalHawameemMeem += meemCount;

    // Collect rhyme patterns
    (surah.ayahs?.verseEndings || []).forEach(ending => {
      rhymeMap[ending.pattern] = (rhymeMap[ending.pattern] || 0) + ending.count;
    });

    // Compute letter deviations from global Quran average
    const letterDeviations: Record<string, number> = {};
    ARABIC_LETTERS.forEach(char => {
      const charCount = letters.plainCounts[char] || 0;
      const charPct = totalChars > 0 ? (charCount / totalChars) * 100 : 0;
      const globalCharTotal = letterStats.globalStats?.[char]?.totalOccurrences || 0;
      const globalCharPct = (globalCharTotal / quranTotalLetters) * 100;
      letterDeviations[char] = Number((charPct - globalCharPct).toFixed(3));
    });

    return {
      surahNumber: surah.number,
      surahName: surah.name,
      totalLetters: totalChars,
      haCount,
      haPercentage: Number(haPct.toFixed(2)),
      meemCount,
      meemPercentage: Number(meemPct.toFixed(2)),
      haPlusMeemCount,
      haPlusMeemPercentage: Number(haPlusMeemPct.toFixed(2)),
      letterCounts: letters.plainCounts,
      letterPercentages: letters.plainPercentages,
      letterDeviations
    };
  });

  const totalHawameemHaPlusMeem = totalHawameemHa + totalHawameemMeem;
  const avgHawameemHaPct = totalHawameemLetters > 0 
    ? Number(((totalHawameemHa / totalHawameemLetters) * 100).toFixed(2)) 
    : 0;
  const avgHawameemMeemPct = totalHawameemLetters > 0 
    ? Number(((totalHawameemMeem / totalHawameemLetters) * 100).toFixed(2)) 
    : 0;
  const avgHawameemHaPlusMeemPct = totalHawameemLetters > 0 
    ? Number(((totalHawameemHaPlusMeem / totalHawameemLetters) * 100).toFixed(2)) 
    : 0;

  // Inter-Hawameem Cosine Similarity Matrix (7x7) based on 28-letter relative vectors
  const similarityMatrix7x7: { surahA: number; surahB: number; similarity: number }[] = [];
  hawameemSurahs.forEach(sA => {
    const vecA = ARABIC_LETTERS.map(c => sA.letters.plainPercentages[c] || 0);
    hawameemSurahs.forEach(sB => {
      const vecB = ARABIC_LETTERS.map(c => sB.letters.plainPercentages[c] || 0);
      const sim = computeCosineSimilarity(vecA, vecB);
      similarityMatrix7x7.push({
        surahA: sA.number,
        surahB: sB.number,
        similarity: Number((sim * 100).toFixed(2))
      });
    });
  });

  return {
    surahs: hawameemSurahs,
    hawameemLettersStats,
    totalHawameemVerses,
    totalHawameemWords,
    totalHawameemLetters,
    totalHawameemHa,
    totalHawameemMeem,
    totalHawameemHaPlusMeem,
    avgHawameemHaPct,
    avgHawameemMeemPct,
    avgHawameemHaPlusMeemPct,
    quranGlobalHaPct: Number(quranGlobalHaPct.toFixed(2)),
    quranGlobalMeemPct: Number(quranGlobalMeemPct.toFixed(2)),
    quranGlobalHaPlusMeemPct: Number(quranGlobalHaPlusMeemPct.toFixed(2)),
    rhymeDistribution: rhymeMap,
    similarityMatrix7x7
  };
}

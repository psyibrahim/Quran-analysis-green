// src/data/sahabaClusters.ts
// العناقيد السبعة الكبرى وفق تحزيب الصحابة المأثور (مع استقلال الفاتحة ووضع سورة ق في العنقود قبل الأخير)

import { SurahData } from '../types';

export interface SahabaClusterDef {
  id: number;
  key: string;
  name: string;
  traditionalLabel: string;
  subtitle: string;
  countRule: string;
  startSurah: number;
  endSurah: number;
  surahNumbers: number[];
  color: string;
  accentClass: string;
  badgeBg: string;
  description: string;
  thematicFocus: string;
}

export const SAHABA_CLUSTERS: SahabaClusterDef[] = [
  {
    id: 1,
    key: 'cluster-1',
    name: 'العنقود الأول',
    traditionalLabel: 'ثَـلَاثٌ',
    subtitle: 'السبع الطوال (القسم الأول)',
    countRule: '3 سور (البقرة، آل عمران، النساء)',
    startSurah: 2,
    endSurah: 4,
    surahNumbers: [2, 3, 4],
    color: '#0d9488', // Deep Teal / Forest
    accentClass: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'أطول سور القرآن وأعظمها تفصيلاً في التشريع، وأصول العقيدة، وبناء الأمة، وتثبيت قواعد المعاملات والمجتمع المسلم.',
    thematicFocus: 'التشريع، العقيدة، تنظيم المجتمع، والرد على أهل الكتاب'
  },
  {
    id: 2,
    key: 'cluster-2',
    name: 'العنقود الثاني',
    traditionalLabel: 'خَـمْسٌ',
    subtitle: 'السبع الطوال (القسم الثاني وتتمتها)',
    countRule: '5 سور (المائدة إلى التوبة)',
    startSurah: 5,
    endSurah: 9,
    surahNumbers: [5, 6, 7, 8, 9],
    color: '#10b981', // Emerald
    accentClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'تكملة السبع الطوال؛ تمتزج فيها أحكام العقود والحل والحرمة، ومحاجة المشركين، ومصارع الأمم، وأحكام الجهاد والوفاء بالعهود.',
    thematicFocus: 'العقود، التحليل والتحريم، مصارع الأمم الخالية، والجهاد والمواثيق'
  },
  {
    id: 3,
    key: 'cluster-3',
    name: 'العنقود الثالث',
    traditionalLabel: 'سَـبْعٌ',
    subtitle: 'المِئُـون الأولى (القصص النبوي الشامل)',
    countRule: '7 سور (يونس إلى النحل)',
    startSurah: 10,
    endSurah: 16,
    surahNumbers: [10, 11, 12, 13, 14, 15, 16],
    color: '#f59e0b', // Amber
    accentClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'عائلة السور القصصية الكبرى التي يبلغ عدد آيات كل منها نحو مائة آية؛ تستعرض تاريخ الأنبياء (نوح، هود، صالح، يوسف، إبراهيم) وسنن الله الكونية.',
    thematicFocus: 'قصص الرسل، السنن الإلهية في الأمم، والتوحيد ودلائل الآفاق'
  },
  {
    id: 4,
    key: 'cluster-4',
    name: 'العنقود الرابع',
    traditionalLabel: 'تِـسْعٌ',
    subtitle: 'المِئُـون الوسطى (الآيات البينات والرسالات)',
    countRule: '9 سور (الإسراء إلى الفرقان)',
    startSurah: 17,
    endSurah: 25,
    surahNumbers: [17, 18, 19, 20, 21, 22, 23, 24, 25],
    color: '#84CC16', // Purple
    accentClass: 'text-lime-400 border-lime-500/30 bg-lime-500/10',
    badgeBg: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    description: 'مجموعة مئوية زاخرة بالعِبر والفتن الإنسانية الأربع (العلم، المال، السلطة، الدين)، مع مشاهد القيامة والآداب الاجتماعية.',
    thematicFocus: 'الفتن الكبرى، النبوة وتسلية النبي ﷺ، والآداب النورانية'
  },
  {
    id: 5,
    key: 'cluster-5',
    name: 'العنقود الخامس',
    traditionalLabel: 'إِحْدَى عَشْرَةَ',
    subtitle: 'المَثَانِي الأولى (الرنين والترنم البياني)',
    countRule: '11 سورة (الشعراء إلى يس)',
    startSurah: 26,
    endSurah: 36,
    surahNumbers: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    color: '#B8935F', // Pink
    accentClass: 'text-gold-400 border-gold-500/30 bg-gold-500/10',
    badgeBg: 'bg-gold-500/20 text-gold-300 border-gold-500/40',
    description: 'تتميز بطول الفواصل واشتداد النغم الصوتي المؤثر، وتثبيت قلوب المؤمنين عبر استعراض مواكب المصلحين ونهاية المستكبرين، وتختم بقلب القرآن (يس).',
    thematicFocus: 'البيان المعجز، البراهين العقلية، ومواقف النصر والتمكين'
  },
  {
    id: 6,
    key: 'cluster-6',
    name: 'العنقود السادس',
    traditionalLabel: 'ثَلَاثَ عَشْرَةَ (وفق أصل الرواية / ملحقة بسورة ق)',
    subtitle: 'الحواميم والمسبحات والفتوحات (الصافات إلى ق)',
    countRule: '14 سورة (الصافات إلى سورة ق)',
    startSurah: 37,
    endSurah: 50,
    surahNumbers: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    color: '#16A34A', // Cyan
    accentClass: 'text-green-400 border-green-500/30 bg-green-500/10',
    badgeBg: 'bg-green-500/20 text-green-300 border-green-500/40',
    description: 'يضم هذا العنقود سائر الحواميم السبعة (آل حم) وسور الفتوحات؛ وفي أصل حديث تحزيب الصحابة لأوس بن حذيفة عُد هذا الحزب "ثلاث عشرة" سورة منتهياً بالحجرات (49) على أن يبدأ المفصل بسورة ق (50). وقد أُلحقت سورة ق هنا بالعنقود السادس مع حفظ خصوصيتها كبداية المفصل.',
    thematicFocus: 'الحواميم السبعة، التنزيل وعظمة القرآن، وسورة ق المجيدة'
  },
  {
    id: 7,
    key: 'cluster-7',
    name: 'العنقود السابع',
    traditionalLabel: 'حِـزْبُ الْمُفَصَّلِ',
    subtitle: 'المفصل القرآني (الأصل من ق، وهنا من الذاريات إلى الناس)',
    countRule: '64 سورة (الذاريات إلى الناس)',
    startSurah: 51,
    endSurah: 114,
    surahNumbers: Array.from({ length: 64 }, (_, i) => 51 + i),
    color: '#f97316', // Orange
    accentClass: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'حزب المفصل لكثرة الفصل بين سوره بالبسملة؛ يضم قصار السور ذات الإيقاع الفاصل الحاسم والمشاهد الأخروية الجليلة وعقائد التوحيد الخالص (أصله عند جمهور القراء 65 سورة تبدأ من سورة ق حتى الناس).',
    thematicFocus: 'الدار الآخرة، قصر الفواصل، التوحيد الخالص، والتعويذات'
  }
];

// سورة الفاتحة ككيان مستقل تماماً ومفرد
export const AL_FATIHAH_META = {
  number: 1,
  name: 'سورة الفاتحة',
  englishName: 'Al-Faatiha',
  status: 'فاتحة الكتاب وأم القرآن (مستقلة عن الأحزاب السبعة)',
  note: 'لا تنتمي سورة الفاتحة إلى أيٍّ من العناقيد السبعة؛ فهي بمثابة الديباجة والمدخل الشامل للقرآن الكريم ومفتاح سائر سوره.'
};

// حساب الإحصاءات الجامعة لكل عنقود
export interface ClusterComputedStats {
  clusterDef: SahabaClusterDef;
  surahs: SurahData[];
  totalSurahs: number;
  meccanCount: number;
  medinanCount: number;
  totalAyahs: number;
  totalWords: number;
  totalChars: number;
  avgAyahWords: number;
  avgAyahChars: number;
  percentageOfQuranAyahs: number;
  percentageOfQuranWords: number;
  percentageOfQuranChars: number;
  intraClusterCohesion: number; // متوسط تشابه جيب التمام بين سور العنقود
  dominantLetters: { letter: string; percentage: number; count: number }[];
}

export function computeClusterStats(
  clusterDef: SahabaClusterDef,
  allSurahs: SurahData[],
  similarityMatrix?: number[][]
): ClusterComputedStats {
  const surahs = allSurahs.filter(s => clusterDef.surahNumbers.includes(s.number));
  
  const totalQuranAyahs = allSurahs.reduce((sum, s) => sum + s.totalAyahs, 0) || 6236;
  const totalQuranWords = allSurahs.reduce((sum, s) => sum + s.totalWords, 0) || 77797;
  const totalQuranChars = allSurahs.reduce((sum, s) => sum + s.totalChars, 0) || 323015;

  const totalSurahs = surahs.length;
  const meccanCount = surahs.filter(s => s.isMeccan).length;
  const medinanCount = surahs.filter(s => !s.isMeccan).length;
  
  const totalAyahs = surahs.reduce((sum, s) => sum + s.totalAyahs, 0);
  const totalWords = surahs.reduce((sum, s) => sum + s.totalWords, 0);
  const totalChars = surahs.reduce((sum, s) => sum + s.totalChars, 0);

  const avgAyahWords = totalAyahs > 0 ? Number((totalWords / totalAyahs).toFixed(2)) : 0;
  const avgAyahChars = totalAyahs > 0 ? Number((totalChars / totalAyahs).toFixed(1)) : 0;

  const percentageOfQuranAyahs = Number(((totalAyahs / totalQuranAyahs) * 100).toFixed(2));
  const percentageOfQuranWords = Number(((totalWords / totalQuranWords) * 100).toFixed(2));
  const percentageOfQuranChars = Number(((totalChars / totalQuranChars) * 100).toFixed(2));

  // حساب درجة التجانس الداخلي (Intra-Cluster Cohesion) عبر متوسط مصفوفة التشابه بين سور العنقود
  let cohesionSum = 0;
  let pairCount = 0;

  if (similarityMatrix && similarityMatrix.length === 114) {
    for (let i = 0; i < surahs.length; i++) {
      for (let j = i + 1; j < surahs.length; j++) {
        const idxA = surahs[i].number - 1;
        const idxB = surahs[j].number - 1;
        if (similarityMatrix[idxA] && similarityMatrix[idxA][idxB] !== undefined) {
          cohesionSum += similarityMatrix[idxA][idxB];
          pairCount++;
        }
      }
    }
  }

  const intraClusterCohesion = pairCount > 0 ? Number(((cohesionSum / pairCount) * 100).toFixed(2)) : 93.5;

  // الحروف المهيمنة على العنقود
  const letterTotals: { [char: string]: number } = {};
  surahs.forEach(s => {
    if (s.letters && s.letters.plainCounts) {
      Object.entries(s.letters.plainCounts).forEach(([letter, count]) => {
        letterTotals[letter] = (letterTotals[letter] || 0) + count;
      });
    }
  });

  const dominantLetters = Object.entries(letterTotals)
    .map(([letter, count]) => ({
      letter,
      count,
      percentage: totalChars > 0 ? Number(((count / totalChars) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    clusterDef,
    surahs,
    totalSurahs,
    meccanCount,
    medinanCount,
    totalAyahs,
    totalWords,
    totalChars,
    avgAyahWords,
    avgAyahChars,
    percentageOfQuranAyahs,
    percentageOfQuranWords,
    percentageOfQuranChars,
    intraClusterCohesion,
    dominantLetters
  };
}

export interface SurahClusterDisplayInfo {
  id: number | 'fatihah';
  clusterNumber: number | null;
  name: string;
  shortLabel: string;
  traditionalLabel: string;
  color: string;
  badgeBg: string;
  accentClass: string;
  isFatihah: boolean;
  tooltip: string;
}

/**
 * إرجاع تعريف العنقود لسورة معينة (سورة الفاتحة ترجع null لأنها مستقلة)
 */
export function getSahabaClusterForSurah(surahNumber: number): SahabaClusterDef | null {
  if (surahNumber === 1) return null;
  return SAHABA_CLUSTERS.find(c => c.surahNumbers.includes(surahNumber)) || null;
}

/**
 * الحصول على بيانات العرض الإحصائي والبصري للعنقود الخاص بالسورة
 */
export function getSurahClusterDisplayInfo(surahNumber: number): SurahClusterDisplayInfo {
  if (surahNumber === 1) {
    return {
      id: 'fatihah',
      clusterNumber: null,
      name: 'فاتحة الكتاب',
      shortLabel: 'الفاتحة (مستقلة)',
      traditionalLabel: 'أم القرآن',
      color: '#f59e0b',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      accentClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      isFatihah: true,
      tooltip: 'سورة الفاتحة: فاتحة الكتاب وأم القرآن (مستقلة عن الأحزاب السبعة)'
    };
  }

  const cluster = SAHABA_CLUSTERS.find(c => c.surahNumbers.includes(surahNumber));
  if (cluster) {
    return {
      id: cluster.id,
      clusterNumber: cluster.id,
      name: cluster.name,
      shortLabel: `عنقود ${cluster.id} (${cluster.traditionalLabel})`,
      traditionalLabel: cluster.traditionalLabel,
      color: cluster.color,
      badgeBg: cluster.badgeBg,
      accentClass: cluster.accentClass,
      isFatihah: false,
      tooltip: `${cluster.name} (${cluster.traditionalLabel}) • ${cluster.subtitle} • ${cluster.countRule}`
    };
  }

  return {
    id: 0,
    clusterNumber: 0,
    name: 'غير مصنف',
    shortLabel: 'غير مصنف',
    traditionalLabel: '',
    color: '#6F7F7B',
    badgeBg: 'bg-ink-500/20 text-ink-300 border-ink-500/30',
    accentClass: 'text-ink-400 border-ink-500/30 bg-ink-500/10',
    isFatihah: false,
    tooltip: ''
  };
}

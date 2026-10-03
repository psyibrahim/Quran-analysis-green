export interface MuqattaatSurahMeta {
  surahNumber: number;
  surahName: string;
  openingText: string;
  letters: string[];
  meaningSummary: string;
}

export interface SurahFamilyMeta {
  id: string;
  name: string;
  nameWithPrefix: string;
  description: string;
  surahNumbers: number[];
  category: 'openings' | 'praise' | 'pairs' | 'qalaqel';
}

export const MUQATTAAT_SURAHS: MuqattaatSurahMeta[] = [
  { surahNumber: 2, surahName: 'البقرة', openingText: 'الم', letters: ['ا', 'ل', 'م'], meaningSummary: 'فاتحة ألف لام ميم' },
  { surahNumber: 3, surahName: 'آل عمران', openingText: 'الم', letters: ['ا', 'ل', 'م'], meaningSummary: 'فاتحة ألف لام ميم' },
  { surahNumber: 7, surahName: 'الأعراف', openingText: 'المص', letters: ['ا', 'ل', 'م', 'ص'], meaningSummary: 'فاتحة ألف لام ميم صاد' },
  { surahNumber: 10, surahName: 'يونس', openingText: 'الر', letters: ['ا', 'ل', 'ر'], meaningSummary: 'فاتحة ألف لام راء' },
  { surahNumber: 11, surahName: 'هود', openingText: 'الر', letters: ['ا', 'ل', 'ر'], meaningSummary: 'فاتحة ألف لام راء' },
  { surahNumber: 12, surahName: 'يوسف', openingText: 'الر', letters: ['ا', 'ل', 'ر'], meaningSummary: 'فاتحة ألف لام راء' },
  { surahNumber: 13, surahName: 'الرعد', openingText: 'المر', letters: ['ا', 'ل', 'م', 'ر'], meaningSummary: 'فاتحة ألف لام ميم راء' },
  { surahNumber: 14, surahName: 'إبراهيم', openingText: 'الر', letters: ['ا', 'ل', 'ر'], meaningSummary: 'فاتحة ألف لام راء' },
  { surahNumber: 15, surahName: 'الحجر', openingText: 'الر', letters: ['ا', 'ل', 'ر'], meaningSummary: 'فاتحة ألف لام راء' },
  { surahNumber: 19, surahName: 'مريم', openingText: 'كهيعص', letters: ['ك', 'ه', 'ي', 'ع', 'ص'], meaningSummary: 'فاتحة كاف هاء ياء عين صاد الخماسية' },
  { surahNumber: 20, surahName: 'طه', openingText: 'طه', letters: ['ط', 'ه'], meaningSummary: 'فاتحة طاء هاء' },
  { surahNumber: 26, surahName: 'الشعراء', openingText: 'طسم', letters: ['ط', 'س', 'م'], meaningSummary: 'فاتحة طاء سين ميم' },
  { surahNumber: 27, surahName: 'النمل', openingText: 'طس', letters: ['ط', 'س'], meaningSummary: 'فاتحة طاء سين' },
  { surahNumber: 28, surahName: 'القصص', openingText: 'طسم', letters: ['ط', 'س', 'م'], meaningSummary: 'فاتحة طاء سين ميم' },
  { surahNumber: 29, surahName: 'العنكبوت', openingText: 'الم', letters: ['ا', 'ل', 'م'], meaningSummary: 'فاتحة ألف لام ميم' },
  { surahNumber: 30, surahName: 'الروم', openingText: 'الم', letters: ['ا', 'ل', 'م'], meaningSummary: 'فاتحة ألف لام ميم' },
  { surahNumber: 31, surahName: 'لقمان', openingText: 'الم', letters: ['ا', 'ل', 'م'], meaningSummary: 'فاتحة ألف لام ميم' },
  { surahNumber: 32, surahName: 'السجدة', openingText: 'الم', letters: ['ا', 'ل', 'م'], meaningSummary: 'فاتحة ألف لام ميم' },
  { surahNumber: 36, surahName: 'يس', openingText: 'يس', letters: ['ي', 'س'], meaningSummary: 'فاتحة ياء سين' },
  { surahNumber: 38, surahName: 'ص', openingText: 'ص', letters: ['ص'], meaningSummary: 'فاتحة حرف صاد الأحادي' },
  { surahNumber: 40, surahName: 'غافر', openingText: 'حم', letters: ['ح', 'م'], meaningSummary: 'فاتحة حاميم الأولى' },
  { surahNumber: 41, surahName: 'فصلت', openingText: 'حم', letters: ['ح', 'م'], meaningSummary: 'فاتحة حاميم الثانية' },
  { surahNumber: 42, surahName: 'الشورى', openingText: 'حم عسق', letters: ['ح', 'م', 'ع', 'س', 'ق'], meaningSummary: 'فاتحة حاميم عين سين قاف الخماسية' },
  { surahNumber: 43, surahName: 'الزخرف', openingText: 'حم', letters: ['ح', 'م'], meaningSummary: 'فاتحة حاميم الرابعة' },
  { surahNumber: 44, surahName: 'الدخان', openingText: 'حم', letters: ['ح', 'م'], meaningSummary: 'فاتحة حاميم الخامسة' },
  { surahNumber: 45, surahName: 'الجاثية', openingText: 'حم', letters: ['ح', 'م'], meaningSummary: 'فاتحة حاميم السادسة' },
  { surahNumber: 46, surahName: 'الأحقاف', openingText: 'حم', letters: ['ح', 'م'], meaningSummary: 'فاتحة حاميم السابعة والأخيرة' },
  { surahNumber: 50, surahName: 'ق', openingText: 'ق', letters: ['ق'], meaningSummary: 'فاتحة حرف قاف الأحادي' },
  { surahNumber: 68, surahName: 'القلم', openingText: 'ن', letters: ['ن'], meaningSummary: 'فاتحة حرف نون الأحادي' },
];

export const SURAH_FAMILIES: SurahFamilyMeta[] = [
  {
    id: 'hawameem',
    name: 'الحواميم السبع (آل حم)',
    nameWithPrefix: 'عائلة الحواميم السبع',
    description: 'السور السبع المتتالية المفتتحة بـ (حم) من غافر إلى الأحقاف، الملقبة بعرائس القرآن وديباجه.',
    surahNumbers: [40, 41, 42, 43, 44, 45, 46],
    category: 'openings'
  },
  {
    id: 'musabbihat',
    name: 'المسبّحات السبع',
    nameWithPrefix: 'عائلة المسبحات السبع',
    description: 'السور المفتتحة بصيغ التسبيح (سبّح، يسبّح، سبحان، سبّح اسم ربك الأعلى).',
    surahNumbers: [17, 57, 59, 61, 62, 64, 87],
    category: 'praise'
  },
  {
    id: 'tawaseen',
    name: 'الطواسين الثلاث',
    nameWithPrefix: 'عائلة الطواسين الثلاث',
    description: 'السور المفتتحة بحرفي الطاء والسين (الشعراء طسم، النمل طس، القصص طسم).',
    surahNumbers: [26, 27, 28],
    category: 'openings'
  },
  {
    id: 'alif-lam-meem',
    name: 'ذوات (الم) الست',
    nameWithPrefix: 'عائلة ذوات الم الست',
    description: 'السور الست المفتتحة بالحروف المقطعة (ألف لام ميم): البقرة، آل عمران، العنكبوت، الروم، لقمان، السجدة.',
    surahNumbers: [2, 3, 29, 30, 31, 32],
    category: 'openings'
  },
  {
    id: 'alif-lam-ra',
    name: 'ذوات (الر) الخمس',
    nameWithPrefix: 'عائلة ذوات الر الخمس',
    description: 'السور الخمس المتتالية المفتتحة بالحروف المقطعة (ألف لام راء): يونس، هود، يوسف، إبراهيم، الحجر.',
    surahNumbers: [10, 11, 12, 14, 15],
    category: 'openings'
  },
  {
    id: 'zahrawan',
    name: 'الزهراوان',
    nameWithPrefix: 'الزهراوان (البقرة وآل عمران)',
    description: 'أطول سورتين في القرآن، الملقبتان بالزهراوين، تحويان أركان الشريعة الكبرى.',
    surahNumbers: [2, 3],
    category: 'pairs'
  },
  {
    id: 'qalaqel',
    name: 'القلاقل الأربع والمعوذات',
    nameWithPrefix: 'عائلة القلاقل والمعوذات',
    description: 'السور المفتتحة بفعل الأمر (قُل): الكافرون، الإخلاص، الفلق، الناس.',
    surahNumbers: [109, 112, 113, 114],
    category: 'qalaqel'
  }
];

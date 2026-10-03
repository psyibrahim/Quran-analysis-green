/**
 * phonetics.ts
 * Rigorous phonetic and articulation classification of the 28 Arabic letters according to traditional
 * Tajweed and Arabic phonetic science (علم التجويد ومخارج وصفات الحروف).
 */

export interface LetterPhoneticTraits {
  letter: string;
  name: string;
  // المخارج العامة والخاصة
  generalMakhraj: 'حلق' | 'لسان' | 'شفتان' | 'جوف';
  specificMakhraj: string;
  // الصفات المتضادة
  voice: 'همس' | 'جهر';
  strength: 'شدة' | 'بينية' | 'رخاوة';
  elevation: 'استعلاء' | 'استفال';
  occlusion: 'إطباق' | 'انفتاح';
  // الصفات التي لا ضد لها
  qalqalah: boolean;
  safeer: boolean;
  leen: boolean;
  inheeraf: boolean;
  takreer: boolean;
  tafashshi: boolean;
  istitalah: boolean;
  ghunnah: boolean;
}

// Map of the 28 Arabic letters to their complete phonetic profiles
export const ARABIC_PHONETIC_PROFILES: Record<string, LetterPhoneticTraits> = {
  'ا': {
    letter: 'ا',
    name: 'ألف',
    generalMakhraj: 'جوف',
    specificMakhraj: 'الجوف (تجويف الحلق والفم)',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ب': {
    letter: 'ب',
    name: 'باء',
    generalMakhraj: 'شفتان',
    specificMakhraj: 'بين الشفتين بانطباقهما',
    voice: 'جهر',
    strength: 'شدة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: true,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ت': {
    letter: 'ت',
    name: 'تاء',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع أصول الثنايا العليا',
    voice: 'همس',
    strength: 'شدة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ث': {
    letter: 'ث',
    name: 'ثاء',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع أطراف الثنايا العليا',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ج': {
    letter: 'ج',
    name: 'جيم',
    generalMakhraj: 'لسان',
    specificMakhraj: 'وسط اللسان مع ما يحاذيه من الحنك الأعلى',
    voice: 'جهر',
    strength: 'شدة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: true,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ح': {
    letter: 'ح',
    name: 'حاء',
    generalMakhraj: 'حلق',
    specificMakhraj: 'وسط الحلق',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'خ': {
    letter: 'خ',
    name: 'خاء',
    generalMakhraj: 'حلق',
    specificMakhraj: 'أدنى الحلق',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استعلاء',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'د': {
    letter: 'د',
    name: 'دال',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع أصول الثنايا العليا',
    voice: 'جهر',
    strength: 'شدة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: true,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ذ': {
    letter: 'ذ',
    name: 'ذال',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع أطراف الثنايا العليا',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ر': {
    letter: 'ر',
    name: 'راء',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مائلاً إلى ظهره مع ما يحاذيه من لثة الثنايا العليا',
    voice: 'جهر',
    strength: 'بينية',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: true,
    takreer: true,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ز': {
    letter: 'ز',
    name: 'زاي',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع فويق الثنايا السفلى',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: true,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'س': {
    letter: 'س',
    name: 'سين',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع فويق الثنايا السفلى',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: true,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ش': {
    letter: 'ش',
    name: 'شين',
    generalMakhraj: 'لسان',
    specificMakhraj: 'وسط اللسان مع الحنك الأعلى',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: true,
    istitalah: false,
    ghunnah: false
  },
  'ص': {
    letter: 'ص',
    name: 'صاد',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع فويق الثنايا السفلى',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استعلاء',
    occlusion: 'إطباق',
    qalqalah: false,
    safeer: true,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ض': {
    letter: 'ض',
    name: 'ضاد',
    generalMakhraj: 'لسان',
    specificMakhraj: 'إحدى حافتي اللسان أو كلاهما مع الأضراس العليا',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استعلاء',
    occlusion: 'إطباق',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: true,
    ghunnah: false
  },
  'ط': {
    letter: 'ط',
    name: 'طاء',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع أصول الثنايا العليا',
    voice: 'جهر',
    strength: 'شدة',
    elevation: 'استعلاء',
    occlusion: 'إطباق',
    qalqalah: true,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ظ': {
    letter: 'ظ',
    name: 'ظاء',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع أطراف الثنايا العليا',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استعلاء',
    occlusion: 'إطباق',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ع': {
    letter: 'ع',
    name: 'عين',
    generalMakhraj: 'حلق',
    specificMakhraj: 'وسط الحلق',
    voice: 'جهر',
    strength: 'بينية',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'غ': {
    letter: 'غ',
    name: 'غين',
    generalMakhraj: 'حلق',
    specificMakhraj: 'أدنى الحلق',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استعلاء',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ف': {
    letter: 'ف',
    name: 'فاء',
    generalMakhraj: 'شفتان',
    specificMakhraj: 'بطن الشفة السفلى مع أطراف الثنايا العليا',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ق': {
    letter: 'ق',
    name: 'قاف',
    generalMakhraj: 'لسان',
    specificMakhraj: 'أقصى اللسان مع الحنك الأعلى اللحمي',
    voice: 'جهر',
    strength: 'شدة',
    elevation: 'استعلاء',
    occlusion: 'انفتاح',
    qalqalah: true,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ك': {
    letter: 'ك',
    name: 'كاف',
    generalMakhraj: 'لسان',
    specificMakhraj: 'أقصى اللسان تحت القاف مع الحنك العظمي واللحمي',
    voice: 'همس',
    strength: 'شدة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ل': {
    letter: 'ل',
    name: 'لام',
    generalMakhraj: 'لسان',
    specificMakhraj: 'أدنى حافتي اللسان إلى منتهاها مع لثة الأسنان العليا',
    voice: 'جهر',
    strength: 'بينية',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: true,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'م': {
    letter: 'م',
    name: 'ميم',
    generalMakhraj: 'شفتان',
    specificMakhraj: 'انطباق الشفتين مع غنة من الخيشوم',
    voice: 'جهر',
    strength: 'بينية',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: true
  },
  'ن': {
    letter: 'ن',
    name: 'نون',
    generalMakhraj: 'لسان',
    specificMakhraj: 'طرف اللسان مع لثة الثنايا العليا مع غنة من الخيشوم',
    voice: 'جهر',
    strength: 'بينية',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: true
  },
  'ه': {
    letter: 'ه',
    name: 'هاء',
    generalMakhraj: 'حلق',
    specificMakhraj: 'أقصى الحلق',
    voice: 'همس',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: false,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'و': {
    letter: 'و',
    name: 'واو',
    generalMakhraj: 'شفتان',
    specificMakhraj: 'انضمام الشفتين مع فرجة يسيرة',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: true,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  },
  'ي': {
    letter: 'ي',
    name: 'ياء',
    generalMakhraj: 'لسان',
    specificMakhraj: 'وسط اللسان مع الحنك الأعلى',
    voice: 'جهر',
    strength: 'رخاوة',
    elevation: 'استفال',
    occlusion: 'انفتاح',
    qalqalah: false,
    safeer: false,
    leen: true,
    inheeraf: false,
    takreer: false,
    tafashshi: false,
    istitalah: false,
    ghunnah: false
  }
};

export interface SurahPhoneticStats {
  totalLetters: number;
  // المخارج
  makharij: {
    halq: { count: number; percentage: number }; // حلق
    lisan: { count: number; percentage: number }; // لسان
    shafatan: { count: number; percentage: number }; // شفتان
    jawf: { count: number; percentage: number }; // جوف
  };
  // الصفات المتقابلة
  voice: {
    hams: { count: number; percentage: number }; // همس (فحثه شخص سكت)
    jahr: { count: number; percentage: number }; // جهر
  };
  strength: {
    shiddah: { count: number; percentage: number }; // شدة (أجد قط بكت)
    bayniyyah: { count: number; percentage: number }; // بينية (لن عمر)
    rakhawah: { count: number; percentage: number }; // رخاوة
  };
  elevation: {
    istiila: { count: number; percentage: number }; // استعلاء (تفخيم: خص ضغط قظ)
    istifal: { count: number; percentage: number }; // استفال (ترقيق)
  };
  occlusion: {
    itbaq: { count: number; percentage: number }; // إطباق (ص، ض، ط، ظ)
    infitah: { count: number; percentage: number }; // انفتاح
  };
  // الصفات الخاصة
  specialTraits: {
    qalqalah: { count: number; percentage: number }; // ق، ط، ب، ج، د
    safeer: { count: number; percentage: number }; // ص، ز، س
    leen: { count: number; percentage: number }; // و، ي
    ghunnah: { count: number; percentage: number }; // ن، م
  };
  // مؤشر الطابع الصوتي العام (Acoustic Dominance Profile)
  acousticIndex: {
    firmnessRatio: number; // نسبة الحروف القوية والشديدة (الشدة + الاستعلاء)
    softnessRatio: number; // نسبة الحروف اللينة والرخوة (الرخاوة + الهمس)
    resonantRatio: number; // نسبة الحروف الرنانة والغنة (البينية + الغنة + اللين)
  };
}

/**
 * Calculates complete phonetic distribution for any letter counts dictionary.
 */
export function calculatePhoneticStats(letterCounts: Record<string, number>): SurahPhoneticStats {
  let totalLetters = 0;

  // Counts accumulators
  let halq = 0, lisan = 0, shafatan = 0, jawf = 0;
  let hams = 0, jahr = 0;
  let shiddah = 0, bayniyyah = 0, rakhawah = 0;
  let istiila = 0, istifal = 0;
  let itbaq = 0, infitah = 0;
  let qalqalah = 0, safeer = 0, leen = 0, ghunnah = 0;

  for (const [letter, count] of Object.entries(letterCounts)) {
    const profile = ARABIC_PHONETIC_PROFILES[letter];
    if (!profile) continue;

    totalLetters += count;

    // المخارج
    if (profile.generalMakhraj === 'حلق') halq += count;
    else if (profile.generalMakhraj === 'لسان') lisan += count;
    else if (profile.generalMakhraj === 'شفتان') shafatan += count;
    else if (profile.generalMakhraj === 'جوف') jawf += count;

    // الصفات
    if (profile.voice === 'همس') hams += count;
    else jahr += count;

    if (profile.strength === 'شدة') shiddah += count;
    else if (profile.strength === 'بينية') bayniyyah += count;
    else rakhawah += count;

    if (profile.elevation === 'استعلاء') istiila += count;
    else istifal += count;

    if (profile.occlusion === 'إطباق') itbaq += count;
    else infitah += count;

    if (profile.qalqalah) qalqalah += count;
    if (profile.safeer) safeer += count;
    if (profile.leen) leen += count;
    if (profile.ghunnah) ghunnah += count;
  }

  const pct = (val: number) => (totalLetters > 0 ? (val / totalLetters) * 100 : 0);

  const firmnessRatio = pct(shiddah + istiila);
  const softnessRatio = pct(rakhawah + hams);
  const resonantRatio = pct(bayniyyah + ghunnah);

  return {
    totalLetters,
    makharij: {
      halq: { count: halq, percentage: Number(pct(halq).toFixed(2)) },
      lisan: { count: lisan, percentage: Number(pct(lisan).toFixed(2)) },
      shafatan: { count: shafatan, percentage: Number(pct(shafatan).toFixed(2)) },
      jawf: { count: jawf, percentage: Number(pct(jawf).toFixed(2)) }
    },
    voice: {
      hams: { count: hams, percentage: Number(pct(hams).toFixed(2)) },
      jahr: { count: jahr, percentage: Number(pct(jahr).toFixed(2)) }
    },
    strength: {
      shiddah: { count: shiddah, percentage: Number(pct(shiddah).toFixed(2)) },
      bayniyyah: { count: bayniyyah, percentage: Number(pct(bayniyyah).toFixed(2)) },
      rakhawah: { count: rakhawah, percentage: Number(pct(rakhawah).toFixed(2)) }
    },
    elevation: {
      istiila: { count: istiila, percentage: Number(pct(istiila).toFixed(2)) },
      istifal: { count: istifal, percentage: Number(pct(istifal).toFixed(2)) }
    },
    occlusion: {
      itbaq: { count: itbaq, percentage: Number(pct(itbaq).toFixed(2)) },
      infitah: { count: infitah, percentage: Number(pct(infitah).toFixed(2)) }
    },
    specialTraits: {
      qalqalah: { count: qalqalah, percentage: Number(pct(qalqalah).toFixed(2)) },
      safeer: { count: safeer, percentage: Number(pct(safeer).toFixed(2)) },
      leen: { count: leen, percentage: Number(pct(leen).toFixed(2)) },
      ghunnah: { count: ghunnah, percentage: Number(pct(ghunnah).toFixed(2)) }
    },
    acousticIndex: {
      firmnessRatio: Number(firmnessRatio.toFixed(2)),
      softnessRatio: Number(softnessRatio.toFixed(2)),
      resonantRatio: Number(resonantRatio.toFixed(2))
    }
  };
}

const fs = require('fs');
const path = require('path');

const ARABIC_LETTERS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
  'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

const LETTER_NAMES = {
  'ا': 'ألف', 'ب': 'باء', 'ت': 'تاء', 'ث': 'ثاء', 'ج': 'جيم',
  'ح': 'حاء', 'خ': 'خاء', 'د': 'دال', 'ذ': 'ذال', 'ر': 'راء',
  'ز': 'زاي', 'س': 'سين', 'ش': 'شين', 'ص': 'صاد', 'ض': 'ضاد',
  'ط': 'طاء', 'ظ': 'ظاء', 'ع': 'عين', 'غ': 'غين', 'ف': 'فاء',
  'ق': 'قاف', 'ك': 'كاف', 'ل': 'لام', 'م': 'ميم', 'ن': 'نون',
  'ه': 'هاء', 'و': 'واو', 'ي': 'ياء'
};

// Normalize Arabic character to base letter in 28 alphabet
function normalizeArabicChar(char) {
  if (['ا', 'أ', 'إ', 'آ', 'ٱ', 'ء', 'ئ', 'ؤ', 'ى', 'ٰ'].includes(char)) {
    if (char === 'ى') return 'ي'; // Alif maqsura grouped with Yaa
    if (char === 'ء' || char === 'ئ' || char === 'ؤ') return 'ا'; // Hamza grouped with Alif
    return 'ا';
  }
  if (char === 'ة') return 'ت'; // Taa marbouta grouped with Taa
  if (char === 'ے' || char === 'ۦ') return 'ي'; // Small Warsh Yaa
  if (char === 'ۥ') return 'و'; // Small Warsh Waw
  if (ARABIC_LETTERS.includes(char)) return char;
  return null;
}

// Extract diacritics & Warsh phonetic signs
function extractDiacritics(text) {
  const diacritics = {
    fatha: 0,
    damma: 0,
    kasra: 0,
    sukun: 0,
    tanweenFath: 0,
    tanweenDamm: 0,
    tanweenKasr: 0,
    shaddah: 0,
    maddah: 0,
    warshSigns: 0
  };

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x064E) diacritics.fatha++;
    else if (code === 0x064F) diacritics.damma++;
    else if (code === 0x0650) diacritics.kasra++;
    else if (code === 0x0652) diacritics.sukun++;
    else if (code === 0x064B || code === 0x0657) diacritics.tanweenFath++;
    else if (code === 0x064C || code === 0x065E) diacritics.tanweenDamm++;
    else if (code === 0x064D || code === 0x0656) diacritics.tanweenKasr++;
    else if (code === 0x0651) diacritics.shaddah++;
    else if (code === 0x0653 || code === 0x0654 || code === 0x0655 || code === 0x0670) diacritics.maddah++;
    else if (code === 0x06EC || code === 0x06EA || code === 0x06DF || code === 0x06E2) diacritics.warshSigns++;
  }

  const total = Object.values(diacritics).reduce((a, b) => a + b, 0);
  return { ...diacritics, total };
}

// Convert Warsh Uthmani to simplified readable text
function toSimpleArabic(text) {
  return text
    .replace(/\u0670/g, 'ا')
    .replace(/\u0671/g, 'ا')
    .replace(/[\u064B-\u065F\u06D6-\u06ED\u08F0-\u08FF\u0610-\u061A\u06DF-\u06E8\u200F\uFEFF]/g, '')
    .replace(/ے/g, 'ي')
    .replace(/ۥ/g, 'و')
    .replace(/\s+/g, ' ')
    .trim();
}

// Strip all tashkeel and non-arabic marks for pure plain letter counts
function cleanPlainArabic(text) {
  return text
    .replace(/\u0670/g, 'ا')
    .replace(/\u0671/g, 'ا')
    .replace(/[\u064B-\u065F\u06D6-\u06ED\u08F0-\u08FF\u0610-\u061A\u06DF-\u06E8\u200F\uFEFF]/g, '')
    .replace(/ے/g, 'ي')
    .replace(/ۥ/g, 'و')
    .replace(/[^\u0621-\u064A\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Count letters
function countLetters(text) {
  const counts = {};
  ARABIC_LETTERS.forEach(l => counts[l] = 0);
  let total = 0;

  for (const char of text) {
    const norm = normalizeArabicChar(char);
    if (norm && counts[norm] !== undefined) {
      counts[norm]++;
      total++;
    }
  }

  const percentages = {};
  ARABIC_LETTERS.forEach(l => {
    percentages[l] = total > 0 ? Number(((counts[l] / total) * 100).toFixed(2)) : 0;
  });

  return { counts, total, percentages };
}

// Detect rhyme / ending of an ayah
function extractVerseEnding(cleanText) {
  const words = cleanText.trim().split(/\s+/);
  if (words.length === 0) return 'أخرى';
  const lastWord = words[words.length - 1];
  
  if (lastWord.endsWith('ون') || lastWord.endsWith('ين')) return 'ـون / ـين';
  if (lastWord.endsWith('وم') || lastWord.endsWith('يم')) return 'ـوم / ـيم';
  if (lastWord.endsWith('ان')) return 'ـان';
  if (lastWord.endsWith('ها')) return 'ـها';
  if (lastWord.endsWith('دا')) return 'ـدا';
  if (lastWord.endsWith('لا')) return 'ـلا';
  if (lastWord.endsWith('را')) return 'ـرا';
  if (lastWord.endsWith('ما')) return 'ـما';
  if (lastWord.endsWith('نا')) return 'ـنا';
  if (lastWord.endsWith('تا') || lastWord.endsWith('طا') || lastWord.endsWith('ظا')) return 'ـطا / ـتا';
  if (lastWord.endsWith('قا') || lastWord.endsWith('كا')) return 'ـقا / ـكا';
  if (lastWord.endsWith('با')) return 'ـبا';
  if (lastWord.endsWith('سا') || lastWord.endsWith('شا') || lastWord.endsWith('صا') || lastWord.endsWith('ضا')) return 'ـصا / ـسا';
  if (lastWord.endsWith('يا')) return 'ـيا';
  if (lastWord.endsWith('ة') || lastWord.endsWith('ه')) return 'ـة / ـه';
  if (lastWord.endsWith('د') || lastWord.endsWith('ذ')) return 'ـد / ـذ';
  if (lastWord.endsWith('ق') || lastWord.endsWith('ك')) return 'ـق / ـك';
  if (lastWord.endsWith('ر') || lastWord.endsWith('ز')) return 'ـر';
  if (lastWord.endsWith('ل')) return 'ـل';
  if (lastWord.endsWith('م')) return 'ـم';
  if (lastWord.endsWith('ن')) return 'ـن';
  if (lastWord.endsWith('ب')) return 'ـب';
  
  if (lastWord.length >= 2) return 'ـ' + lastWord.slice(-2);
  return 'ـ' + lastWord.slice(-1);
}

// Cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// PCA 2D reduction for 114 vectors of 28 dimensions
function computePCA2D(vectors) {
  const n = vectors.length;
  const d = vectors[0].length;

  const mean = Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) mean[j] += vectors[i][j];
  }
  for (let j = 0; j < d; j++) mean[j] /= n;

  const centered = vectors.map(v => v.map((val, j) => val - mean[j]));

  const cov = Array(d).fill(0).map(() => Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += centered[k][i] * centered[k][j];
      cov[i][j] = sum / (n - 1);
    }
  }

  function getTopEigenvector(matrix, deflateVec = null) {
    let v = Array(d).fill(0).map(() => Math.random() - 0.5);
    let len = Math.hypot(...v);
    v = v.map(x => x / len);

    for (let iter = 0; iter < 100; iter++) {
      if (deflateVec) {
        const dot = v.reduce((sum, val, idx) => sum + val * deflateVec[idx], 0);
        v = v.map((val, idx) => val - dot * deflateVec[idx]);
      }
      let nextV = Array(d).fill(0);
      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) nextV[i] += matrix[i][j] * v[j];
      }
      const nextLen = Math.hypot(...nextV);
      if (nextLen === 0) break;
      v = nextV.map(x => x / nextLen);
    }
    return v;
  }

  const pc1 = getTopEigenvector(cov);
  const pc2 = getTopEigenvector(cov, pc1);

  return centered.map((vec) => {
    const x = vec.reduce((sum, val, j) => sum + val * pc1[j], 0);
    const y = vec.reduce((sum, val, j) => sum + val * pc2[j], 0);
    return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
  });
}

// K-Means clustering
function runKMeans(vectors, k = 4, iterations = 50) {
  const n = vectors.length;
  const d = vectors[0].length;

  let centroids = [];
  const step = Math.floor(n / k);
  for (let i = 0; i < k; i++) centroids.push([...vectors[i * step]]);

  let assignments = Array(n).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        let dist = 0;
        for (let j = 0; j < d; j++) {
          const diff = vectors[i][j] - centroids[c][j];
          dist += diff * diff;
        }
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    const counts = Array(k).fill(0);
    const newCentroids = Array(k).fill(0).map(() => Array(d).fill(0));
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let j = 0; j < d; j++) newCentroids[c][j] += vectors[i][j];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < d; j++) centroids[c][j] = newCentroids[c][j] / counts[c];
      }
    }
  }

  return assignments;
}

// Canonical revelation types for 114 surahs
const SURAH_META_KORAN = [
  { n: 1, name: 'سورة الفاتحة', en: 'Al-Faatiha', meccan: true },
  { n: 2, name: 'سورة البقرة', en: 'Al-Baqara', meccan: false },
  { n: 3, name: 'سورة آل عمران', en: 'Aal-i-Imraan', meccan: false },
  { n: 4, name: 'سورة النساء', en: 'An-Nisaa', meccan: false },
  { n: 5, name: 'سورة المائدة', en: 'Al-Maaida', meccan: false },
  { n: 6, name: 'سورة الأنعام', en: 'Al-An\'aam', meccan: true },
  { n: 7, name: 'سورة الأعراف', en: 'Al-A\'raaf', meccan: true },
  { n: 8, name: 'سورة الأنفال', en: 'Al-Anfaal', meccan: false },
  { n: 9, name: 'سورة التوبة', en: 'At-Tawba', meccan: false },
  { n: 10, name: 'سورة يونس', en: 'Yunus', meccan: true },
  { n: 11, name: 'سورة هود', en: 'Hud', meccan: true },
  { n: 12, name: 'سورة يوسف', en: 'Yusuf', meccan: true },
  { n: 13, name: 'سورة الرعد', en: 'Ar-Ra\'d', meccan: false },
  { n: 14, name: 'سورة إبراهيم', en: 'Ibrahim', meccan: true },
  { n: 15, name: 'سورة الحجر', en: 'Al-Hijr', meccan: true },
  { n: 16, name: 'سورة النحل', en: 'An-Nahl', meccan: true },
  { n: 17, name: 'سورة الإسراء', en: 'Al-Israa', meccan: true },
  { n: 18, name: 'سورة الكهف', en: 'Al-Kahf', meccan: true },
  { n: 19, name: 'سورة مريم', en: 'Maryam', meccan: true },
  { n: 20, name: 'سورة طه', en: 'Taa-Haa', meccan: true },
  { n: 21, name: 'سورة الأنبياء', en: 'Al-Anbiyaa', meccan: true },
  { n: 22, name: 'سورة الحج', en: 'Al-Hajj', meccan: false },
  { n: 23, name: 'سورة المؤمنون', en: 'Al-Muminoon', meccan: true },
  { n: 24, name: 'سورة النور', en: 'An-Noor', meccan: false },
  { n: 25, name: 'سورة الفرقان', en: 'Al-Furqaan', meccan: true },
  { n: 26, name: 'سورة الشعراء', en: 'Ash-Shu\'araa', meccan: true },
  { n: 27, name: 'سورة النمل', en: 'An-Naml', meccan: true },
  { n: 28, name: 'سورة القصص', en: 'Al-Qasas', meccan: true },
  { n: 29, name: 'سورة العنكبوت', en: 'Al-Ankaboot', meccan: true },
  { n: 30, name: 'سورة الروم', en: 'Ar-Room', meccan: true },
  { n: 31, name: 'سورة لقمان', en: 'Luqman', meccan: true },
  { n: 32, name: 'سورة السجدة', en: 'As-Sajda', meccan: true },
  { n: 33, name: 'سورة الأحزاب', en: 'Al-Ahzaab', meccan: false },
  { n: 34, name: 'سورة سبأ', en: 'Saba', meccan: true },
  { n: 35, name: 'سورة فاطر', en: 'Faatir', meccan: true },
  { n: 36, name: 'سورة يس', en: 'Yaseen', meccan: true },
  { n: 37, name: 'سورة الصافات', en: 'As-Saaffaat', meccan: true },
  { n: 38, name: 'سورة ص', en: 'Saad', meccan: true },
  { n: 39, name: 'سورة الزمر', en: 'Az-Zumar', meccan: true },
  { n: 40, name: 'سورة غافر', en: 'Ghafir', meccan: true },
  { n: 41, name: 'سورة فصلت', en: 'Fussilat', meccan: true },
  { n: 42, name: 'سورة الشورى', en: 'Ash-Shura', meccan: true },
  { n: 43, name: 'سورة الزخرف', en: 'Az-Zukhruf', meccan: true },
  { n: 44, name: 'سورة الدخان', en: 'Ad-Dukhaan', meccan: true },
  { n: 45, name: 'سورة الجاثية', en: 'Al-Jaathiya', meccan: true },
  { n: 46, name: 'سورة الأحقاف', en: 'Al-Ahqaf', meccan: true },
  { n: 47, name: 'سورة محمد', en: 'Muhammad', meccan: false },
  { n: 48, name: 'سورة الفتح', en: 'Al-Fath', meccan: false },
  { n: 49, name: 'سورة الحجرات', en: 'Al-Hujuraat', meccan: false },
  { n: 50, name: 'سورة ق', en: 'Qaaf', meccan: true },
  { n: 51, name: 'سورة الذاريات', en: 'Adh-Dhaariyat', meccan: true },
  { n: 52, name: 'سورة الطور', en: 'At-Toor', meccan: true },
  { n: 53, name: 'سورة النجم', en: 'An-Najm', meccan: true },
  { n: 54, name: 'سورة القمر', en: 'Al-Qamar', meccan: true },
  { n: 55, name: 'سورة الرحمن', en: 'Ar-Rahmaan', meccan: false },
  { n: 56, name: 'سورة الواقعة', en: 'Al-Waaqia', meccan: true },
  { n: 57, name: 'سورة الحديد', en: 'Al-Hadid', meccan: false },
  { n: 58, name: 'سورة المجادلة', en: 'Al-Mujaadila', meccan: false },
  { n: 59, name: 'سورة الحشر', en: 'Al-Hashr', meccan: false },
  { n: 60, name: 'سورة الممتحنة', en: 'Al-Mumtahana', meccan: false },
  { n: 61, name: 'سورة الصف', en: 'As-Saff', meccan: false },
  { n: 62, name: 'سورة الجمعة', en: 'Al-Jumu\'a', meccan: false },
  { n: 63, name: 'سورة المنافقون', en: 'Al-Munaafiqoon', meccan: false },
  { n: 64, name: 'سورة التغابن', en: 'At-Taghaabun', meccan: false },
  { n: 65, name: 'سورة الطلاق', en: 'At-Talaaq', meccan: false },
  { n: 66, name: 'سورة التحريم', en: 'At-Tahrim', meccan: false },
  { n: 67, name: 'سورة الملك', en: 'Al-Mulk', meccan: true },
  { n: 68, name: 'سورة القلم', en: 'Al-Qalam', meccan: true },
  { n: 69, name: 'سورة الحاقة', en: 'Al-Haaqqa', meccan: true },
  { n: 70, name: 'سورة المعارج', en: 'Al-Ma\'aarij', meccan: true },
  { n: 71, name: 'سورة نوح', en: 'Nooh', meccan: true },
  { n: 72, name: 'سورة الجن', en: 'Al-Jinn', meccan: true },
  { n: 73, name: 'سورة المزمل', en: 'Al-Muzzammil', meccan: true },
  { n: 74, name: 'سورة المدثر', en: 'Al-Muddathir', meccan: true },
  { n: 75, name: 'سورة القيامة', en: 'Al-Qiyaama', meccan: true },
  { n: 76, name: 'سورة الإنسان', en: 'Al-Insaan', meccan: false },
  { n: 77, name: 'سورة المرسلات', en: 'Al-Mursalaat', meccan: true },
  { n: 78, name: 'سورة النبأ', en: 'An-Naba', meccan: true },
  { n: 79, name: 'سورة النازعات', en: 'An-Naazi\'aat', meccan: true },
  { n: 80, name: 'سورة عبس', en: 'Abasa', meccan: true },
  { n: 81, name: 'سورة التكوير', en: 'At-Takwir', meccan: true },
  { n: 82, name: 'سورة الانفطار', en: 'Al-Infitaar', meccan: true },
  { n: 83, name: 'سورة المطففين', en: 'Al-Mutaffifin', meccan: true },
  { n: 84, name: 'سورة الانشقاق', en: 'Al-Inshiqaaq', meccan: true },
  { n: 85, name: 'سورة البروج', en: 'Al-Burooj', meccan: true },
  { n: 86, name: 'سورة الطارق', en: 'At-Taariq', meccan: true },
  { n: 87, name: 'سورة الأعلى', en: 'Al-A\'laa', meccan: true },
  { n: 88, name: 'سورة الغاشية', en: 'Al-Ghaashiya', meccan: true },
  { n: 89, name: 'سورة الفجر', en: 'Al-Fajr', meccan: true },
  { n: 90, name: 'سورة البلد', en: 'Al-Balad', meccan: true },
  { n: 91, name: 'سورة الشمس', en: 'Ash-Shams', meccan: true },
  { n: 92, name: 'سورة الليل', en: 'Al-Layl', meccan: true },
  { n: 93, name: 'سورة الضحى', en: 'Ad-Dhuhaa', meccan: true },
  { n: 94, name: 'سورة الشرح', en: 'Ash-Sharh', meccan: true },
  { n: 95, name: 'سورة التين', en: 'At-Teen', meccan: true },
  { n: 96, name: 'سورة العلق', en: 'Al-Alaq', meccan: true },
  { n: 97, name: 'سورة القدر', en: 'Al-Qadr', meccan: true },
  { n: 98, name: 'سورة البينة', en: 'Al-Bayyina', meccan: false },
  { n: 99, name: 'سورة الزلزلة', en: 'Az-Zalzala', meccan: false },
  { n: 100, name: 'سورة العاديات', en: 'Al-Aadiyat', meccan: true },
  { n: 101, name: 'سورة القارعة', en: 'Al-Qaari\'a', meccan: true },
  { n: 102, name: 'سورة التكاثر', en: 'At-Takaathur', meccan: true },
  { n: 103, name: 'سورة العصر', en: 'Al-Asr', meccan: true },
  { n: 104, name: 'سورة الهمزة', en: 'Al-Humaza', meccan: true },
  { n: 105, name: 'سورة الفيل', en: 'Al-Feel', meccan: true },
  { n: 106, name: 'سورة قريش', en: 'Quraish', meccan: true },
  { n: 107, name: 'سورة الماعون', en: 'Al-Maa\'oon', meccan: true },
  { n: 108, name: 'سورة الكوثر', en: 'Al-Kawthar', meccan: true },
  { n: 109, name: 'سورة الكافرون', en: 'Al-Kaafiroon', meccan: true },
  { n: 110, name: 'سورة النصر', en: 'An-Nasr', meccan: false },
  { n: 111, name: 'سورة المسد', en: 'Al-Masad', meccan: true },
  { n: 112, name: 'سورة الإخلاص', en: 'Al-Ikhlaas', meccan: true },
  { n: 113, name: 'سورة الفلق', en: 'Al-Falaq', meccan: true },
  { n: 114, name: 'سورة الناس', en: 'An-Naas', meccan: true }
];

async function main() {
  console.log('Fetching Warsh (Madani Mushaf ID: 4) from Quranpedia API...');
  const res = await fetch('https://api.quranpedia.net/v1/mushafs/4');
  if (!res.ok) {
    throw new Error(`Failed to fetch from Quranpedia: ${res.status} ${res.statusText}`);
  }
  const mushafData = await res.json();

  console.log(`Successfully fetched ${mushafData.name}! Total surahs: ${mushafData.surahs.length}`);

  const rawiName = mushafData.rawi?.full_name || 'عثمان بن سعيد (ورش) عن نافع المدني';
  const mushafMeta = {
    id: mushafData.id,
    name: 'المصحف المدني',
    riwayah: 'رواية ورش عن نافع بالعد المدني',
    canonicalName: mushafData.name,
    description: mushafData.description,
    rawi: rawiName,
    countSystem: 'العد المدني (المدني الأخير)',
    source: 'Quranpedia API (https://api.quranpedia.net/v1/mushafs/4)',
    fetchedAt: new Date().toISOString()
  };

  const corpusMadani = [];
  const processedSurahs = [];
  const letterVectors = [];

  let totalQuranVerses = 0;
  let runningNumberInQuran = 0;

  for (let i = 0; i < 114; i++) {
    const sRaw = mushafData.surahs[i];
    const sMeta = SURAH_META_KORAN[i];
    const surahNumber = i + 1;
    const surahName = sMeta.name;
    const englishName = sMeta.en;
    const isMeccan = sMeta.meccan;
    const revelationType = isMeccan ? 'Meccan' : 'Medinan';
    const totalAyahs = sRaw.ayahs.length;

    totalQuranVerses += totalAyahs;

    const ayahsCorpus = [];
    const ayahsData = [];

    let totalAyahLengthWords = 0;
    let totalAyahLengthChars = 0;
    let shortestAyah = { numberInSurah: 1, textUthmani: '', textPlain: '', wordCount: Infinity, charCount: Infinity };
    let longestAyah = { numberInSurah: 1, textUthmani: '', textPlain: '', wordCount: -1, charCount: -1 };
    const verseEndingsMap = {};

    let fullSurahCleanWords = [];
    let fullSurahUthmaniText = '';

    for (let aIdx = 0; aIdx < totalAyahs; aIdx++) {
      const a = sRaw.ayahs[aIdx];
      runningNumberInQuran++;
      const textUth = a.text.trim();
      const textSim = toSimpleArabic(textUth);
      const cleanAyahPlain = cleanPlainArabic(textUth);
      const words = cleanAyahPlain.split(/\s+/).filter(w => w.length > 0);
      const wCount = words.length;
      const cCount = cleanAyahPlain.replace(/\s+/g, '').length;

      fullSurahCleanWords.push(...words);
      fullSurahUthmaniText += (fullSurahUthmaniText ? ' ' : '') + textUth;

      totalAyahLengthWords += wCount;
      totalAyahLengthChars += cCount;

      if (wCount < shortestAyah.wordCount || (wCount === shortestAyah.wordCount && cCount < shortestAyah.charCount)) {
        shortestAyah = {
          numberInSurah: a.number,
          textUthmani: textUth,
          textPlain: textSim,
          wordCount: wCount,
          charCount: cCount
        };
      }

      if (wCount > longestAyah.wordCount || (wCount === longestAyah.wordCount && cCount > longestAyah.charCount)) {
        longestAyah = {
          numberInSurah: a.number,
          textUthmani: textUth,
          textPlain: textSim,
          wordCount: wCount,
          charCount: cCount
        };
      }

      const ending = extractVerseEnding(cleanAyahPlain);
      verseEndingsMap[ending] = (verseEndingsMap[ending] || 0) + 1;

      ayahsCorpus.push({
        numberInSurah: a.number,
        numberInQuran: runningNumberInQuran,
        textUthmani: textUth,
        textSimple: textSim,
        juz: a.juz || 1,
        page: a.page_number || 1,
        numberInHafs: a.number_in_hafs || [a.number]
      });

      ayahsData.push({
        numberInSurah: a.number,
        textUthmani: textUth,
        textPlain: textSim,
        wordCount: wCount,
        charCount: cCount,
        ending
      });
    }

    corpusMadani.push({
      number: surahNumber,
      name: surahName,
      englishName,
      englishNameTranslation: '',
      revelationType,
      isMeccan,
      totalAyahs,
      hasIndependentBasmalah: false,
      ayahs: ayahsCorpus
    });

    // 1. Letters Analysis (100% computed from Madani text)
    const fullCleanPlain = fullSurahCleanWords.join(' ');
    const plainLetterStats = countLetters(fullCleanPlain);
    const vocalizedLetterStats = countLetters(cleanPlainArabic(fullSurahUthmaniText));
    const diacriticsStats = extractDiacritics(fullSurahUthmaniText);
    const absentLetters = ARABIC_LETTERS.filter(l => plainLetterStats.counts[l] === 0);

    const letterVector = ARABIC_LETTERS.map(l => plainLetterStats.percentages[l]);
    letterVectors.push(letterVector);

    // 2. Words Analysis
    const totalWords = fullSurahCleanWords.length;
    const wordFreqMap = {};
    let totalWordLengthChars = 0;

    fullSurahCleanWords.forEach(w => {
      wordFreqMap[w] = (wordFreqMap[w] || 0) + 1;
      totalWordLengthChars += w.length;
    });

    const uniqueWordsCount = Object.keys(wordFreqMap).length;
    const vocabularyDiversity = totalWords > 0 ? Number(((uniqueWordsCount / totalWords) * 100).toFixed(2)) : 0;
    const avgWordLength = totalWords > 0 ? Number((totalWordLengthChars / totalWords).toFixed(2)) : 0;

    const topWords = Object.entries(wordFreqMap)
      .map(([word, count]) => ({
        word,
        count,
        percentage: Number(((count / totalWords) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // 3. Ayahs stats & Histograms
    const avgAyahLengthWords = totalAyahs > 0 ? Number((totalAyahLengthWords / totalAyahs).toFixed(2)) : 0;
    const avgAyahLengthChars = totalAyahs > 0 ? Number((totalAyahLengthChars / totalAyahs).toFixed(2)) : 0;

    let varianceSum = 0;
    ayahsData.forEach(a => {
      varianceSum += Math.pow(a.wordCount - avgAyahLengthWords, 2);
    });
    const verseLengthStdDev = totalAyahs > 1 ? Number(Math.sqrt(varianceSum / (totalAyahs - 1)).toFixed(2)) : 0;
    const isUniform = verseLengthStdDev <= 3.5;

    const histogramBins = [
      { range: '1-5', min: 1, max: 5, count: 0 },
      { range: '6-10', min: 6, max: 10, count: 0 },
      { range: '11-15', min: 11, max: 15, count: 0 },
      { range: '16-20', min: 16, max: 20, count: 0 },
      { range: '21-30', min: 21, max: 30, count: 0 },
      { range: '31-50', min: 31, max: 50, count: 0 },
      { range: '51+', min: 51, max: 9999, count: 0 }
    ];

    ayahsData.forEach(a => {
      const bin = histogramBins.find(b => a.wordCount >= b.min && a.wordCount <= b.max);
      if (bin) bin.count++;
    });

    const verseEndings = Object.entries(verseEndingsMap)
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: Number(((count / totalAyahs) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count);

    processedSurahs.push({
      number: surahNumber,
      name: surahName,
      englishName,
      revelationType,
      isMeccan,
      totalAyahs,
      totalWords,
      totalChars: plainLetterStats.total,
      uniqueWordsCount,
      vocabularyDiversity,
      avgWordLength,
      avgAyahLengthWords,
      avgAyahLengthChars,
      verseLengthStdDev,
      isUniform,
      letters: {
        plainCounts: plainLetterStats.counts,
        plainPercentages: plainLetterStats.percentages,
        vocalizedCounts: vocalizedLetterStats.counts,
        vocalizedPercentages: vocalizedLetterStats.percentages,
        absentLetters,
        absentCount: absentLetters.length,
        totalLettersPlain: plainLetterStats.total,
        totalLettersVocalized: vocalizedLetterStats.total
      },
      diacritics: diacriticsStats,
      words: {
        topWords
      },
      ayahs: {
        shortestAyah,
        longestAyah,
        histogramBins,
        verseEndings
      }
    });
  }

  // Calculate Global Letter Extremes for Madani Mushaf
  const globalLetterStats = {};
  ARABIC_LETTERS.forEach(letter => {
    let maxSurah = { number: 1, name: '', percentage: -1, count: 0 };
    let minSurah = { number: 1, name: '', percentage: Infinity, count: Infinity };
    let totalOccurrences = 0;
    const surahsWithZero = [];

    processedSurahs.forEach(s => {
      const p = s.letters.plainPercentages[letter];
      const c = s.letters.plainCounts[letter];
      totalOccurrences += c;

      if (p > maxSurah.percentage) {
        maxSurah = { number: s.number, name: s.name, percentage: p, count: c };
      }
      if (p < minSurah.percentage) {
        minSurah = { number: s.number, name: s.name, percentage: p, count: c };
      }
      if (c === 0) {
        surahsWithZero.push({ number: s.number, name: s.name });
      }
    });

    globalLetterStats[letter] = {
      letter,
      name: LETTER_NAMES[letter],
      maxSurah,
      minSurah,
      totalOccurrences,
      surahsWithZero,
      surahsWithZeroCount: surahsWithZero.length
    };
  });

  // Calculate 114x114 Similarity Matrix for Madani Mushaf
  console.log('Computing Madani 114x114 similarity matrix...');
  const similarityMatrix = [];
  const closestSurahsMap = {};

  for (let i = 0; i < 114; i++) {
    const row = [];
    const scores = [];
    for (let j = 0; j < 114; j++) {
      const sim = cosineSimilarity(letterVectors[i], letterVectors[j]);
      const simRounded = Number(sim.toFixed(4));
      row.push(simRounded);
      if (i !== j) {
        scores.push({
          targetSurahNumber: j + 1,
          targetSurahName: processedSurahs[j].name,
          similarity: Number((sim * 100).toFixed(2)),
          similarityRaw: simRounded
        });
      }
    }
    similarityMatrix.push(row);
    scores.sort((a, b) => b.similarityRaw - a.similarityRaw);
    closestSurahsMap[i + 1] = scores.slice(0, 5);
  }

  processedSurahs.forEach(s => {
    s.closestSurahs = closestSurahsMap[s.number];
  });

  // K-Means for Madani
  console.log('Running K-Means for Madani...');
  const clusterResults = {
    k3: runKMeans(letterVectors, 3),
    k4: runKMeans(letterVectors, 4),
    k5: runKMeans(letterVectors, 5),
    k6: runKMeans(letterVectors, 6)
  };

  processedSurahs.forEach((s, idx) => {
    s.cluster = clusterResults.k4[idx];
    s.clusters = {
      k3: clusterResults.k3[idx],
      k4: clusterResults.k4[idx],
      k5: clusterResults.k5[idx],
      k6: clusterResults.k6[idx]
    };
  });

  // PCA 2D for Madani
  console.log('Computing 2D PCA for Madani...');
  const pcaPoints = computePCA2D(letterVectors);
  pcaPoints.forEach((pt, idx) => {
    processedSurahs[idx].pcaCoordinates = pt;
  });

  // Makki vs Madani Macro Stats in Madani Mushaf
  const meccanSurahs = processedSurahs.filter(s => s.isMeccan);
  const medinanSurahs = processedSurahs.filter(s => !s.isMeccan);

  function computeGroupStats(group, label) {
    const count = group.length;
    const totalVerses = group.reduce((sum, s) => sum + s.totalAyahs, 0);
    const totalWords = group.reduce((sum, s) => sum + s.totalWords, 0);
    const totalChars = group.reduce((sum, s) => sum + s.totalChars, 0);

    const avgAyahLengthWords = Number((group.reduce((sum, s) => sum + s.avgAyahLengthWords, 0) / count).toFixed(2));
    const avgAyahLengthChars = Number((group.reduce((sum, s) => sum + s.avgAyahLengthChars, 0) / count).toFixed(2));
    const avgVocabDiversity = Number((group.reduce((sum, s) => sum + s.vocabularyDiversity, 0) / count).toFixed(2));
    const avgWordLength = Number((group.reduce((sum, s) => sum + s.avgWordLength, 0) / count).toFixed(2));

    const letterAgg = {};
    ARABIC_LETTERS.forEach(l => {
      const avgP = group.reduce((sum, s) => sum + s.letters.plainPercentages[l], 0) / count;
      letterAgg[l] = Number(avgP.toFixed(2));
    });

    const rhymeCount = {};
    group.forEach(s => {
      s.ayahs.verseEndings.forEach(e => {
        rhymeCount[e.pattern] = (rhymeCount[e.pattern] || 0) + e.count;
      });
    });
    const topRhymes = Object.entries(rhymeCount)
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: Number(((count / totalVerses) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      label,
      surahsCount: count,
      totalVerses,
      totalWords,
      totalChars,
      avgAyahLengthWords,
      avgAyahLengthChars,
      avgVocabDiversity,
      avgWordLength,
      avgVersesPerSurah: Number((totalVerses / count).toFixed(1)),
      letterPercentages: letterAgg,
      topRhymes
    };
  }

  const meccanStats = computeGroupStats(meccanSurahs, 'مكي');
  const medinanStats = computeGroupStats(medinanSurahs, 'مدني');

  // Output directory
  const outDir = path.join(__dirname, '..', 'src', 'data', 'madani');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  mushafMeta.totalVerses = totalQuranVerses;
  mushafMeta.totalWords = meccanStats.totalWords + medinanStats.totalWords;
  mushafMeta.totalChars = meccanStats.totalChars + medinanStats.totalChars;

  fs.writeFileSync(path.join(outDir, 'mushafMeta_madani.json'), JSON.stringify(mushafMeta, null, 2));
  fs.writeFileSync(path.join(outDir, 'quranCorpus_madani.json'), JSON.stringify(corpusMadani, null, 2));
  fs.writeFileSync(path.join(outDir, 'surahs_madani.json'), JSON.stringify(processedSurahs, null, 2));
  fs.writeFileSync(path.join(outDir, 'letterStats_madani.json'), JSON.stringify({
    letters: ARABIC_LETTERS,
    letterNames: LETTER_NAMES,
    globalStats: globalLetterStats
  }, null, 2));
  fs.writeFileSync(path.join(outDir, 'similarityMatrix_madani.json'), JSON.stringify(similarityMatrix));
  fs.writeFileSync(path.join(outDir, 'macroStats_madani.json'), JSON.stringify({
    meccan: meccanStats,
    medinan: medinanStats,
    totalSurahs: 114,
    totalQuranVerses,
    totalQuranWords: mushafMeta.totalWords,
    totalQuranChars: mushafMeta.totalChars
  }, null, 2));

  console.log('All Madani datasets generated successfully!');
  console.log(`Total Madani Verses: ${totalQuranVerses} (exact canonical Madani count)`);
  console.log(`Total Madani Words: ${mushafMeta.totalWords}`);
  console.log(`Total Madani Chars: ${mushafMeta.totalChars}`);
}

main().catch(err => {
  console.error('Failed to generate Madani datasets:', err);
  process.exit(1);
});

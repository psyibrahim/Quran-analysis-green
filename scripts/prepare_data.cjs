const fs = require('fs');
const path = require('path');

const ARABIC_LETTERS = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
  'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

const LETTER_NAMES = {
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

// Normalize Arabic character to base letter in 28 alphabet
function normalizeArabicChar(char) {
  if (['ا', 'أ', 'إ', 'آ', 'ٱ', 'ء', 'ئ', 'ؤ', 'ى'].includes(char)) {
    if (char === 'ى') return 'ي'; // Alif maqsura grouped with Yaa in standard orthography, or normalized
    if (char === 'ء' || char === 'ئ' || char === 'ؤ') return 'ا'; // Hamza grouped with Alif
    return 'ا';
  }
  if (char === 'ة') return 'ت'; // Taa marbouta grouped with Taa
  if (ARABIC_LETTERS.includes(char)) return char;
  return null;
}

// Extract diacritics
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
    maddah: 0
  };

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x064E) diacritics.fatha++;
    else if (code === 0x064F) diacritics.damma++;
    else if (code === 0x0650) diacritics.kasra++;
    else if (code === 0x0652) diacritics.sukun++;
    else if (code === 0x064B) diacritics.tanweenFath++;
    else if (code === 0x064C) diacritics.tanweenDamm++;
    else if (code === 0x064D) diacritics.tanweenKasr++;
    else if (code === 0x0651) diacritics.shaddah++;
    else if (code === 0x0653 || code === 0x0654 || code === 0x0655 || code === 0x0670) diacritics.maddah++;
  }

  const total = Object.values(diacritics).reduce((a, b) => a + b, 0);
  return { ...diacritics, total };
}

// Strip all tashkeel and non-arabic marks
function cleanPlainArabic(text) {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF]/g, '')
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
  
  // Strip common prefixes from last word if needed or match suffixes
  if (lastWord.endsWith('ون') || lastWord.endsWith('ين')) return 'ـون / ـين';
  if (lastWord.endsWith('وم') || lastWord.endsWith('يم')) return 'ـوم / ـيم';
  if (lastWord.endsWith('ان') || lastWord.endsWith('ين')) return 'ـان';
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
  
  // Return last 2 chars or last char
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

  // Mean center
  const mean = Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      mean[j] += vectors[i][j];
    }
  }
  for (let j = 0; j < d; j++) mean[j] /= n;

  const centered = vectors.map(v => v.map((val, j) => val - mean[j]));

  // Covariance matrix d x d
  const cov = Array(d).fill(0).map(() => Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      cov[i][j] = sum / (n - 1);
    }
  }

  // Power iteration for first 2 principal components
  function getTopEigenvector(matrix, deflateVec = null) {
    let v = Array(d).fill(0).map(() => Math.random() - 0.5);
    let len = Math.hypot(...v);
    v = v.map(x => x / len);

    for (let iter = 0; iter < 100; iter++) {
      if (deflateVec) {
        // Project out deflateVec
        const dot = v.reduce((sum, val, idx) => sum + val * deflateVec[idx], 0);
        v = v.map((val, idx) => val - dot * deflateVec[idx]);
      }
      let nextV = Array(d).fill(0);
      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
          nextV[i] += matrix[i][j] * v[j];
        }
      }
      const nextLen = Math.hypot(...nextV);
      if (nextLen === 0) break;
      v = nextV.map(x => x / nextLen);
    }
    return v;
  }

  const pc1 = getTopEigenvector(cov);
  const pc2 = getTopEigenvector(cov, pc1);

  // Project all points
  const points = centered.map((vec, idx) => {
    const x = vec.reduce((sum, val, j) => sum + val * pc1[j], 0);
    const y = vec.reduce((sum, val, j) => sum + val * pc2[j], 0);
    return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
  });

  return points;
}

// K-Means clustering
function runKMeans(vectors, k = 4, iterations = 50) {
  const n = vectors.length;
  const d = vectors[0].length;

  // Initialize centroids (deterministic spread)
  let centroids = [];
  const step = Math.floor(n / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...vectors[i * step]]);
  }

  let assignments = Array(n).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    // Assign
    let changed = false;
    for (let i = 0; i < n; i++) {
      let bestDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < k; c++) {
        // Euclidean distance
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

    // Update centroids
    const counts = Array(k).fill(0);
    const newCentroids = Array(k).fill(0).map(() => Array(d).fill(0));
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let j = 0; j < d; j++) {
        newCentroids[c][j] += vectors[i][j];
      }
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < d; j++) {
          centroids[c][j] = newCentroids[c][j] / counts[c];
        }
      }
    }
  }

  return assignments;
}

async function main() {
  console.log('Downloading Quran data from official endpoints...');
  const [resUthmani, resSimple] = await Promise.all([
    fetch('https://api.alquran.cloud/v1/quran/quran-uthmani').then(r => r.json()),
    fetch('https://api.alquran.cloud/v1/quran/quran-simple').then(r => r.json())
  ]);

  const uthmaniSurahs = resUthmani.data.surahs;
  const simpleSurahs = resSimple.data.surahs;

  console.log(`Processing ${uthmaniSurahs.length} surahs...`);

  const processedSurahs = [];
  const letterVectors = [];

  for (let i = 0; i < 114; i++) {
    const sUth = uthmaniSurahs[i];
    const sSim = simpleSurahs[i];

    const surahNumber = sUth.number;
    const name = sUth.name;
    const englishName = sUth.englishName;
    const revelationType = sUth.revelationType; // Meccan or Medinan
    const isMeccan = revelationType === 'Meccan';
    const totalAyahs = sUth.ayahs.length;

    // Combine texts
    const fullTextUthmani = sUth.ayahs.map(a => a.text).join(' ');
    const fullTextSimple = sSim.ayahs.map(a => a.text).join(' ');
    const cleanPlainFull = cleanPlainArabic(fullTextSimple);

    // 1. Letters Analysis
    const plainLetterStats = countLetters(cleanPlainFull);
    const vocalizedLetterStats = countLetters(cleanPlainArabic(fullTextUthmani));
    
    // Diacritics
    const diacriticsStats = extractDiacritics(fullTextUthmani);

    // Absent letters
    const absentLetters = ARABIC_LETTERS.filter(l => plainLetterStats.counts[l] === 0);

    // Letter frequency vector for similarity
    const letterVector = ARABIC_LETTERS.map(l => plainLetterStats.percentages[l]);
    letterVectors.push(letterVector);

    // 2. Words Analysis
    const words = cleanPlainFull.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;
    const wordFreqMap = {};
    let totalWordLengthChars = 0;

    words.forEach(w => {
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

    // 3. Ayahs Analysis
    const ayahsData = [];
    let totalAyahLengthWords = 0;
    let totalAyahLengthChars = 0;
    let shortestAyah = { numberInSurah: 1, textUthmani: '', textPlain: '', wordCount: Infinity, charCount: Infinity };
    let longestAyah = { numberInSurah: 1, textUthmani: '', textPlain: '', wordCount: -1, charCount: -1 };

    const verseEndingsMap = {};

    for (let aIdx = 0; aIdx < totalAyahs; aIdx++) {
      const aUth = sUth.ayahs[aIdx];
      const aSim = sSim.ayahs[aIdx];
      const cleanAyahPlain = cleanPlainArabic(aSim.text);
      const ayahWords = cleanAyahPlain.split(/\s+/).filter(w => w.length > 0);
      const wCount = ayahWords.length;
      const cCount = cleanAyahPlain.replace(/\s+/g, '').length;

      totalAyahLengthWords += wCount;
      totalAyahLengthChars += cCount;

      if (wCount < shortestAyah.wordCount || (wCount === shortestAyah.wordCount && cCount < shortestAyah.charCount)) {
        shortestAyah = {
          numberInSurah: aUth.numberInSurah,
          textUthmani: aUth.text,
          textPlain: aSim.text,
          wordCount: wCount,
          charCount: cCount
        };
      }

      if (wCount > longestAyah.wordCount || (wCount === longestAyah.wordCount && cCount > longestAyah.charCount)) {
        longestAyah = {
          numberInSurah: aUth.numberInSurah,
          textUthmani: aUth.text,
          textPlain: aSim.text,
          wordCount: wCount,
          charCount: cCount
        };
      }

      const ending = extractVerseEnding(cleanAyahPlain);
      verseEndingsMap[ending] = (verseEndingsMap[ending] || 0) + 1;

      ayahsData.push({
        numberInSurah: aUth.numberInSurah,
        textUthmani: aUth.text,
        textPlain: aSim.text,
        wordCount: wCount,
        charCount: cCount,
        ending
      });
    }

    const avgAyahLengthWords = totalAyahs > 0 ? Number((totalAyahLengthWords / totalAyahs).toFixed(2)) : 0;
    const avgAyahLengthChars = totalAyahs > 0 ? Number((totalAyahLengthChars / totalAyahs).toFixed(2)) : 0;

    // Standard deviation of verse lengths (uniformity index)
    let varianceSum = 0;
    ayahsData.forEach(a => {
      varianceSum += Math.pow(a.wordCount - avgAyahLengthWords, 2);
    });
    const verseLengthStdDev = totalAyahs > 1 ? Number(Math.sqrt(varianceSum / (totalAyahs - 1)).toFixed(2)) : 0;
    const isUniform = verseLengthStdDev <= 3.5; // low deviation = regular/uniform

    // Verse length histogram distribution (bins: 1-5, 6-10, 11-15, 16-20, 21-30, 31-50, 51+)
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

    // Top verse endings
    const verseEndings = Object.entries(verseEndingsMap)
      .map(([pattern, count]) => ({
        pattern,
        count,
        percentage: Number(((count / totalAyahs) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count);

    processedSurahs.push({
      number: surahNumber,
      name,
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

  // Calculate Global Letter Extremes across all 114 surahs
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

  // Calculate 114x114 Similarity Matrix
  console.log('Computing 114x114 similarity matrix...');
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

    // Top 5 closest
    scores.sort((a, b) => b.similarityRaw - a.similarityRaw);
    closestSurahsMap[i + 1] = scores.slice(0, 5);
  }

  // Attach closest 5 surahs to each surah record
  processedSurahs.forEach(s => {
    s.closestSurahs = closestSurahsMap[s.number];
  });

  // Run K-Means for k=3, k=4, k=5, k=6
  console.log('Running K-Means clustering...');
  const clusterResults = {
    k3: runKMeans(letterVectors, 3),
    k4: runKMeans(letterVectors, 4),
    k5: runKMeans(letterVectors, 5),
    k6: runKMeans(letterVectors, 6)
  };

  // Attach primary cluster (k=4) to each surah
  processedSurahs.forEach((s, idx) => {
    s.cluster = clusterResults.k4[idx];
    s.clusters = {
      k3: clusterResults.k3[idx],
      k4: clusterResults.k4[idx],
      k5: clusterResults.k5[idx],
      k6: clusterResults.k6[idx]
    };
  });

  // Run PCA 2D reduction
  console.log('Computing 2D PCA projection for letter vectors...');
  const pcaPoints = computePCA2D(letterVectors);
  pcaPoints.forEach((pt, idx) => {
    processedSurahs[idx].pcaCoordinates = pt;
  });

  // Aggregate Meccan vs Medinan statistics
  console.log('Computing Meccan vs Medinan statistical comparison...');
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

    // Aggregate letter percentages
    const letterAgg = {};
    ARABIC_LETTERS.forEach(l => {
      const avgP = group.reduce((sum, s) => sum + s.letters.plainPercentages[l], 0) / count;
      letterAgg[l] = Number(avgP.toFixed(2));
    });

    // Top dominant rhymes
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

  // Ensure directories exist
  const outputDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save Quran full processed data
  fs.writeFileSync(
    path.join(outputDir, 'surahs.json'),
    JSON.stringify(processedSurahs, null, 2)
  );

  // Save Global letter stats & alphabet reference
  fs.writeFileSync(
    path.join(outputDir, 'letterStats.json'),
    JSON.stringify({
      letters: ARABIC_LETTERS,
      letterNames: LETTER_NAMES,
      globalStats: globalLetterStats
    }, null, 2)
  );

  // Save Similarity Matrix
  fs.writeFileSync(
    path.join(outputDir, 'similarityMatrix.json'),
    JSON.stringify(similarityMatrix)
  );

  // Save Macro comparison (Makki vs Madani)
  fs.writeFileSync(
    path.join(outputDir, 'macroStats.json'),
    JSON.stringify({
      meccan: meccanStats,
      medinan: medinanStats,
      totalSurahs: 114,
      totalQuranVerses: meccanStats.totalVerses + medinanStats.totalVerses,
      totalQuranWords: meccanStats.totalWords + medinanStats.totalWords,
      totalQuranChars: meccanStats.totalChars + medinanStats.totalChars
    }, null, 2)
  );

  console.log('Successfully generated all precomputed Quran datasets!');
}

main().catch(err => {
  console.error('Error during data generation:', err);
  process.exit(1);
});

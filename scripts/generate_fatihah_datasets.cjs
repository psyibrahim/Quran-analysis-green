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

function normalizeArabicChar(char) {
  if (['ا', 'أ', 'إ', 'آ', 'ٱ', 'ء', 'ئ', 'ؤ', 'ى'].includes(char)) {
    if (char === 'ى') return 'ي';
    if (char === 'ء' || char === 'ئ' || char === 'ؤ') return 'ا';
    return 'ا';
  }
  if (char === 'ة') return 'ت';
  if (ARABIC_LETTERS.includes(char)) return char;
  return null;
}

function cleanPlainArabic(text) {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08FF\uFEFF]/g, '')
    .replace(/[^\u0621-\u064A\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cosineSimilarity(vecA, vecB) {
  const EPSILON = 1e-12;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    const a = vecA[i] || 0;
    const b = vecB[i] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA < EPSILON || normB < EPSILON) return 0;
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < EPSILON) return 0;
  const sim = dotProduct / denom;
  return Math.max(0, Math.min(1, sim));
}

function main() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const surahsBase = JSON.parse(fs.readFileSync(path.join(dataDir, 'surahs.json'), 'utf8'));
  const corpus = JSON.parse(fs.readFileSync(path.join(dataDir, 'quranCorpus.json'), 'utf8'));

  console.log('Building Fatihah datasets with and without Basmalah...');

  // Build Fatihah without Basmalah:
  const fatihahCorpus = corpus[0];
  const withoutBasmalahAyahs = fatihahCorpus.ayahs.slice(1);
  const textWithoutUthmani = withoutBasmalahAyahs.map(a => a.textUthmani).join(' ');
  const textWithoutSimple = withoutBasmalahAyahs.map(a => a.textSimple).join(' ');
  const cleanWithout = cleanPlainArabic(textWithoutSimple);
  const wordsWithout = cleanWithout.split(/\s+/).filter(w => w.length > 0);

  const plainCounts = {};
  ARABIC_LETTERS.forEach(l => plainCounts[l] = 0);
  let totalChars = 0;
  for (const char of cleanWithout) {
    const norm = normalizeArabicChar(char);
    if (norm) {
      plainCounts[norm]++;
      totalChars++;
    }
  }

  const plainPercentages = {};
  ARABIC_LETTERS.forEach(l => {
    plainPercentages[l] = totalChars > 0 ? Number(((plainCounts[l] / totalChars) * 100).toFixed(2)) : 0;
  });

  const wordFreqMap = {};
  let totalWordLen = 0;
  wordsWithout.forEach(w => {
    wordFreqMap[w] = (wordFreqMap[w] || 0) + 1;
    totalWordLen += w.length;
  });
  const uniqueWordsCount = Object.keys(wordFreqMap).length;
  const vocabularyDiversity = Number(((uniqueWordsCount / wordsWithout.length) * 100).toFixed(2));
  const avgWordLength = Number((totalWordLen / wordsWithout.length).toFixed(2));

  const topWords = Object.entries(wordFreqMap)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Number(((count / wordsWithout.length) * 100).toFixed(2))
    }))
    .sort((a, b) => b.count - a.count);

  const baseFatihah = surahsBase[0];

  const fatihahWithoutBasmalah = {
    ...baseFatihah,
    totalWords: wordsWithout.length,
    totalChars: totalChars,
    uniqueWordsCount,
    vocabularyDiversity,
    avgWordLength,
    avgAyahLengthWords: Number((wordsWithout.length / 7).toFixed(2)),
    avgAyahLengthChars: Number((totalChars / 7).toFixed(2)),
    letters: {
      ...baseFatihah.letters,
      plainCounts,
      plainPercentages
    },
    words: {
      ...baseFatihah.words,
      topWords
    }
  };

  // Dataset A: Basmalah excluded from ALL surahs (including Fatihah)
  const surahsAllExcluded = [fatihahWithoutBasmalah, ...surahsBase.slice(1)];

  // Dataset B: Basmalah included in Fatihah ONLY, excluded from all other 113 surahs
  const surahsFatihahOnly = [baseFatihah, ...surahsBase.slice(1)];

  function computeAllStats(surahsList, label) {
    console.log(`Computing full statistics for: ${label}`);
    // Global letters
    const globalLetterCounts = {};
    ARABIC_LETTERS.forEach(l => globalLetterCounts[l] = 0);
    let grandTotalChars = 0;

    surahsList.forEach(s => {
      ARABIC_LETTERS.forEach(l => {
        globalLetterCounts[l] += s.letters.plainCounts[l] || 0;
      });
      grandTotalChars += s.totalChars;
    });

    const globalStats = {};
    ARABIC_LETTERS.forEach(letter => {
      let maxSurah = { number: 0, name: '', percentage: -1, count: 0 };
      let minSurah = { number: 0, name: '', percentage: 9999, count: 0 };
      const surahsWithZero = [];
      let totalOccurrences = 0;

      surahsList.forEach(s => {
        const p = s.letters.plainPercentages[letter] || 0;
        const c = s.letters.plainCounts[letter] || 0;
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

      globalStats[letter] = {
        letter,
        name: LETTER_NAMES[letter],
        maxSurah,
        minSurah,
        totalOccurrences,
        surahsWithZero,
        surahsWithZeroCount: surahsWithZero.length
      };
    });

    // Similarity matrix (raw cosine similarity in [0, 1] rounded to 4 decimals, with 1.0 on diagonal)
    const vectors = surahsList.map(s => ARABIC_LETTERS.map(l => s.letters.plainPercentages[l]));
    const matrix = [];
    for (let i = 0; i < 114; i++) {
      const row = [];
      for (let j = 0; j < 114; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          const sim = cosineSimilarity(vectors[i], vectors[j]);
          row.push(Number(sim.toFixed(4)));
        }
      }
      matrix.push(row);
    }

    // Closest 5 surahs for each surah based on similarity
    for (let i = 0; i < 114; i++) {
      const simRow = matrix[i];
      const candidates = [];
      for (let j = 0; j < 114; j++) {
        if (i !== j) {
          candidates.push({
            targetSurahNumber: surahsList[j].number,
            targetSurahName: surahsList[j].name,
            similarity: Number((simRow[j] * 100).toFixed(2)),
            similarityRaw: simRow[j]
          });
        }
      }
      candidates.sort((a, b) => b.similarityRaw - a.similarityRaw);
      surahsList[i].closestSurahs = candidates.slice(0, 5);
    }

    // -------------------------------------------------------------
    // Exact Jacobi PCA for 2D Projection
    // -------------------------------------------------------------
    const d = 28;
    const n = 114;
    const means = Array(d).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < d; j++) means[j] += vectors[i][j];
    }
    for (let j = 0; j < d; j++) means[j] /= n;

    const X_centered = vectors.map(row => row.map((val, j) => val - means[j]));
    const cov = Array(d).fill(0).map(() => Array(d).fill(0));
    for (let j = 0; j < d; j++) {
      for (let k = 0; k < d; k++) {
        let sum = 0;
        for (let i = 0; i < n; i++) sum += X_centered[i][j] * X_centered[i][k];
        cov[j][k] = sum / (n - 1);
      }
    }

    function jacobi(A, maxIter = 100) {
      const size = A.length;
      let V = Array(size).fill(0).map((_, i) => {
        const row = Array(size).fill(0);
        row[i] = 1;
        return row;
      });
      let D = A.map(r => [...r]);

      for (let iter = 0; iter < maxIter; iter++) {
        let maxVal = 0, p = 0, q = 1;
        for (let i = 0; i < size; i++) {
          for (let j = i + 1; j < size; j++) {
            if (Math.abs(D[i][j]) > maxVal) {
              maxVal = Math.abs(D[i][j]);
              p = i;
              q = j;
            }
          }
        }
        if (maxVal < 1e-9) break;

        const diff = D[q][q] - D[p][p];
        let t;
        if (Math.abs(D[p][q]) < Math.abs(diff) * 1e-15) {
          t = D[p][q] / diff;
        } else {
          const phi = diff / (2 * D[p][q]);
          t = 1 / (Math.abs(phi) + Math.sqrt(phi * phi + 1));
          if (phi < 0) t = -t;
        }
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        const tau = s / (1 + c);

        const temp = D[p][q];
        D[p][q] = 0;
        D[p][p] -= t * temp;
        D[q][q] += t * temp;

        for (let i = 0; i < p; i++) {
          const g = D[i][p], h = D[i][q];
          D[i][p] = g - s * (h + g * tau);
          D[i][q] = h + s * (g - h * tau);
        }
        for (let i = p + 1; i < q; i++) {
          const g = D[p][i], h = D[i][q];
          D[p][i] = g - s * (h + g * tau);
          D[i][q] = h + s * (g - h * tau);
        }
        for (let i = q + 1; i < size; i++) {
          const g = D[p][i], h = D[q][i];
          D[p][i] = g - s * (h + g * tau);
          D[q][i] = h + s * (g - h * tau);
        }
        for (let i = 0; i < size; i++) {
          const g = V[i][p], h = V[i][q];
          V[i][p] = g - s * (h + g * tau);
          V[i][q] = h + s * (g - h * tau);
        }
      }

      const eigenvalues = D.map((r, i) => r[i]);
      const eigenvectors = [];
      for (let j = 0; j < size; j++) {
        const col = [];
        for (let i = 0; i < size; i++) col.push(V[i][j]);
        eigenvectors.push(col);
      }
      return { eigenvalues, eigenvectors };
    }

    const { eigenvalues, eigenvectors } = jacobi(cov);
    const pairs = eigenvalues.map((val, idx) => ({ val, vec: eigenvectors[idx] }));
    pairs.sort((a, b) => b.val - a.val);

    const pc1 = pairs[0].vec;
    const pc2 = pairs[1].vec;

    const rawCoords = X_centered.map(row => {
      let x = 0, y = 0;
      for (let j = 0; j < d; j++) {
        x += row[j] * pc1[j];
        y += row[j] * pc2[j];
      }
      return [x, y];
    });

    const maxCoord = Math.max(...rawCoords.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
    const pcaScale = 8.5 / (maxCoord || 1);

    surahsList.forEach((s, i) => {
      s.pcaCoordinates = {
        x: Number((rawCoords[i][0] * pcaScale).toFixed(4)),
        y: Number((rawCoords[i][1] * pcaScale).toFixed(4))
      };
    });

    // -------------------------------------------------------------
    // Balanced Stylometric K-Means Clustering
    // -------------------------------------------------------------
    const clusterFeatures = surahsList.map((s, i) => {
      const x = s.pcaCoordinates.x;
      const y = s.pcaCoordinates.y;
      const logW = Math.log(s.totalWords || 1);
      const normW = (logW - 5.5) * 2.0;
      return [x, y, normW];
    });

    function balancedKMeans(pts, k, minSize = 4, seed = 500) {
      let s = seed;
      function rand() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
      let bestInertia = Infinity;
      let bestAss = null;
      const fDim = pts[0].length;

      for (let t = 0; t < 150; t++) {
        const centroids = [];
        centroids.push([...pts[Math.floor(rand() * n)]]);
        while (centroids.length < k) {
          const dists = pts.map(v => {
            let minD = Infinity;
            for (const c of centroids) {
              let sumSq = 0;
              for (let j = 0; j < fDim; j++) {
                const diff = v[j] - c[j];
                sumSq += diff * diff;
              }
              if (sumSq < minD) minD = sumSq;
            }
            return minD;
          });
          const sumDist = dists.reduce((a, b) => a + b, 0);
          let r = rand() * sumDist;
          let chosen = 0;
          for (let i = 0; i < n; i++) {
            r -= dists[i];
            if (r <= 0) { chosen = i; break; }
          }
          centroids.push([...pts[chosen]]);
        }

        let ass = Array(n).fill(0);
        for (let iter = 0; iter < 100; iter++) {
          let changed = false;
          for (let i = 0; i < n; i++) {
            let minD = Infinity, bestC = 0;
            for (let c = 0; c < k; c++) {
              let sumSq = 0;
              for (let j = 0; j < fDim; j++) {
                const diff = pts[i][j] - centroids[c][j];
                sumSq += diff * diff;
              }
              if (sumSq < minD) { minD = sumSq; bestC = c; }
            }
            if (ass[i] !== bestC) { ass[i] = bestC; changed = true; }
          }
          if (!changed) break;
          const counts = Array(k).fill(0);
          const newCentroids = Array(k).fill(0).map(() => Array(fDim).fill(0));
          for (let i = 0; i < n; i++) {
            const c = ass[i];
            counts[c]++;
            for (let j = 0; j < fDim; j++) newCentroids[c][j] += pts[i][j];
          }
          for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
              for (let j = 0; j < fDim; j++) centroids[c][j] = newCentroids[c][j] / counts[c];
            }
          }
        }

        const counts = Array(k).fill(0);
        ass.forEach(c => counts[c]++);
        if (Math.min(...counts) < minSize) continue;

        let totalInertia = 0;
        for (let i = 0; i < n; i++) {
          const c = ass[i];
          for (let j = 0; j < fDim; j++) {
            const diff = pts[i][j] - centroids[c][j];
            totalInertia += diff * diff;
          }
        }
        if (totalInertia < bestInertia) {
          bestInertia = totalInertia;
          bestAss = ass;
        }
      }
      return bestAss || Array(n).fill(0);
    }

    const assK3 = balancedKMeans(clusterFeatures, 3, 10, 42);
    const assK4 = balancedKMeans(clusterFeatures, 4, 8, 42);
    const assK5 = balancedKMeans(clusterFeatures, 5, 6, 42);
    const assK6 = balancedKMeans(clusterFeatures, 6, 5, 42);

    surahsList.forEach((s, i) => {
      s.clusters = {
        k3: assK3[i],
        k4: assK4[i],
        k5: assK5[i],
        k6: assK6[i]
      };
      s.cluster = assK4[i];
    });

    // Macro stats
    const meccanSurahs = surahsList.filter(s => s.isMeccan);
    const medinanSurahs = surahsList.filter(s => !s.isMeccan);

    function computeGroup(group, gLabel) {
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

      // Aggregate top rhymes
      const rhymeCount = {};
      group.forEach(s => {
        if (s.ayahs && s.ayahs.verseEndings) {
          s.ayahs.verseEndings.forEach(e => {
            rhymeCount[e.pattern] = (rhymeCount[e.pattern] || 0) + e.count;
          });
        }
      });
      const topRhymes = Object.entries(rhymeCount)
        .map(([pattern, count]) => ({
          pattern,
          count,
          percentage: totalVerses > 0 ? Number(((count / totalVerses) * 100).toFixed(2)) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      return {
        label: gLabel,
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

    const meccan = computeGroup(meccanSurahs, 'مكي');
    const medinan = computeGroup(medinanSurahs, 'مدني');

    return {
      surahs: surahsList,
      letterStats: {
        letters: ARABIC_LETTERS,
        letterNames: LETTER_NAMES,
        globalStats
      },
      similarityMatrix: matrix,
      macroStats: {
        meccan,
        medinan,
        totalSurahs: 114,
        totalQuranVerses: meccan.totalVerses + medinan.totalVerses,
        totalQuranWords: meccan.totalWords + medinan.totalWords,
        totalQuranChars: meccan.totalChars + medinan.totalChars
      }
    };
  }

  const allExcludedBundle = computeAllStats(surahsAllExcluded, 'مستبعدة نهائياً من كل السور (77,793 كلمة)');
  const fatihahAddedBundle = computeAllStats(surahsFatihahOnly, 'مضافة في الفاتحة فقط (77,797 كلمة)');

  // Save all excluded (Baseline where Basmalah is excluded everywhere)
  fs.writeFileSync(path.join(dataDir, 'surahs_pure.json'), JSON.stringify(allExcludedBundle.surahs, null, 2));
  fs.writeFileSync(path.join(dataDir, 'letterStats_pure.json'), JSON.stringify(allExcludedBundle.letterStats, null, 2));
  fs.writeFileSync(path.join(dataDir, 'similarityMatrix_pure.json'), JSON.stringify(allExcludedBundle.similarityMatrix));
  fs.writeFileSync(path.join(dataDir, 'macroStats_pure.json'), JSON.stringify(allExcludedBundle.macroStats, null, 2));

  // Save with Fatihah Basmalah (when user chooses to add it in Fatihah)
  fs.writeFileSync(path.join(dataDir, 'surahs_fatihah.json'), JSON.stringify(fatihahAddedBundle.surahs, null, 2));
  fs.writeFileSync(path.join(dataDir, 'letterStats_fatihah.json'), JSON.stringify(fatihahAddedBundle.letterStats, null, 2));
  fs.writeFileSync(path.join(dataDir, 'similarityMatrix_fatihah.json'), JSON.stringify(fatihahAddedBundle.similarityMatrix));
  fs.writeFileSync(path.join(dataDir, 'macroStats_fatihah.json'), JSON.stringify(fatihahAddedBundle.macroStats, null, 2));

  // Also clean up old files that included Basmalah in all 112 surahs to avoid clutter
  const oldFiles = [
    'surahs_with_basmalah.json',
    'letterStats_with_basmalah.json',
    'similarityMatrix_with_basmalah.json',
    'macroStats_with_basmalah.json'
  ];
  oldFiles.forEach(f => {
    const p = path.join(dataDir, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Deleted obsolete file: ${f}`);
    }
  });

  console.log('Generation completed successfully!');
}

main();

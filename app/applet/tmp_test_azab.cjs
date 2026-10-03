const fs = require('fs');
const corpus = JSON.parse(fs.readFileSync('./src/data/quranCorpus.json', 'utf-8'));

function normalizeQuranicToken(s) {
  if (!s) return '';
  let w = s
    .replace(/[\uFEFF\u200B-\u200D]/g, '')
    .replace(/[\u06D6-\u06ED\u0610-\u061A\u06DF-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/\u0640/g, '');
  w = w.replace(/و\u0670/g, 'ا');
  w = w.replace(/([ىي])\u0670/g, '$1');
  w = w.replace(/\u0670/g, 'ا');
  w = w.replace(/\u0671/g, 'ا');
  w = w.replace(/[\u0621\u0654]ا/g, 'ا');
  w = w.replace(/[إأآٱٲٳ]/g, 'ا');
  w = w.replace(/ى/g, 'ي');
  w = w.replace(/ة/g, 'ه');
  w = w
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
    .replace(/\bابنت\b/g, 'ابنه');
  w = w.replace(/[.,/#!$%^&*;:{}=\-_~()؟،؛«»"'\uFD3E\uFD3Fۖۗۚۛۜ۝۩۞]/g, '');
  return w.trim();
}

function buildLemmaAffixesTokenSet(queryWord) {
  const qNorm = normalizeQuranicToken(queryWord);
  const set = new Set();
  if (!qNorm) return set;
  set.add(qNorm);

  const stems = [qNorm];
  if (qNorm.endsWith('ه')) stems.push(qNorm.slice(0, -1) + 'ت');
  if (qNorm.endsWith('ي')) stems.push(qNorm.slice(0, -1) + 'ا');

  const nounPrefixes = [
    '', 'و', 'ف', 'ب', 'ل', 'ك', 'س',
    'ال', 'وال', 'فال', 'بال', 'كال', 'لل', 'ولل', 'فلل', 'وبال', 'فبال', 'وكال', 'فكال',
    'يا', 'ويا'
  ];

  const nounSuffixes = [
    '', 'ا', 'ان', 'ين', 'ون', 'ات',
    'ه', 'ها', 'هم', 'هن', 'هما',
    'ك', 'كم', 'كن', 'كما',
    'ي', 'نا'
  ];

  for (const st of stems) {
    for (const p of nounPrefixes) {
      for (const s of nounSuffixes) {
        if (p.includes('ال') && ['ه', 'ها', 'هم', 'هن', 'هما', 'ك', 'كم', 'كن', 'كما', 'ي', 'نا'].includes(s)) {
          continue;
        }
        set.add(p + st + s);
      }
    }
  }
  return set;
}

const tokenSet = buildLemmaAffixesTokenSet('عذاب');
let totalOccurrences = 0;
let matchedTokens = {};
let missedTokens = {};

for (const surah of corpus) {
  for (const ayah of surah.ayahs) {
    const rawTokens = (ayah.textUthmani || '').split(/\s+/).filter(Boolean);
    for (const tok of rawTokens) {
      const norm = normalizeQuranicToken(tok);
      if (tokenSet.has(norm)) {
        totalOccurrences++;
        matchedTokens[norm] = (matchedTokens[norm] || 0) + 1;
      } else {
        if (norm.includes('عذاب')) {
          missedTokens[norm] = (missedTokens[norm] || 0) + 1;
        }
      }
    }
  }
}

console.log('Total occurrences for عذاب in current app (lemma_affixes):', totalOccurrences);
console.log('Missed tokens count:', Object.keys(missedTokens).length);
console.log('Missed tokens breakdown:', JSON.stringify(missedTokens, null, 2));

/**
 * Web Worker for Quranic Lexical Analysis & Zipf Power-Law Processing
 * Offloads heavy tokenization, stopword filtering, lemma unification,
 * Shannon Entropy calculation, and Zipf curve regression off the main thread.
 */

import { 
  analyzeSurahLexiconAdvanced, 
  computeGlobalQuranLexicon, 
  SurahLexicalAnalysis, 
  QuranGlobalLexicalStats 
} from '../utils/lexicalMetrics';
import { QuranSurahCorpus } from '../types';

export type LexicalWorkerRequest = 
  | {
      type: 'ANALYZE_SURAH';
      id: string;
      surah: QuranSurahCorpus;
      excludeStopwords: boolean;
      unifyLemmas: boolean;
    }
  | {
      type: 'COMPUTE_GLOBAL';
      id: string;
      corpus: QuranSurahCorpus[];
      excludeStopwords: boolean;
      unifyLemmas: boolean;
    }
  | {
      type: 'PREWARM';
      id: string;
      corpus: QuranSurahCorpus[];
    };

export type LexicalWorkerResponse = 
  | {
      type: 'SURAH_ANALYZED';
      id: string;
      result: SurahLexicalAnalysis;
    }
  | {
      type: 'GLOBAL_COMPUTED';
      id: string;
      result: QuranGlobalLexicalStats;
    }
  | {
      type: 'PREWARM_DONE';
      id: string;
    }
  | {
      type: 'ERROR';
      id: string;
      error: string;
    };

// Dedicated in-worker memory caches
const workerSurahCache = new Map<string, SurahLexicalAnalysis>();
const workerGlobalCache = new Map<string, QuranGlobalLexicalStats>();

self.onmessage = (event: MessageEvent<LexicalWorkerRequest>) => {
  const req = event.data;
  if (!req || !req.type) return;

  try {
    switch (req.type) {
      case 'ANALYZE_SURAH': {
        const { id, surah, excludeStopwords, unifyLemmas } = req;
        const cacheKey = `${surah.number}_${excludeStopwords ? 1 : 0}_${unifyLemmas ? 1 : 0}_${surah.ayahs?.length || 0}`;
        
        let result = workerSurahCache.get(cacheKey);
        if (!result) {
          result = analyzeSurahLexiconAdvanced(surah, excludeStopwords, unifyLemmas);
          workerSurahCache.set(cacheKey, result);
        }

        self.postMessage({
          type: 'SURAH_ANALYZED',
          id,
          result
        } as LexicalWorkerResponse);
        break;
      }

      case 'COMPUTE_GLOBAL': {
        const { id, corpus, excludeStopwords, unifyLemmas } = req;
        const cacheKey = `global_${corpus.length}_${excludeStopwords ? 1 : 0}_${unifyLemmas ? 1 : 0}`;

        let result = workerGlobalCache.get(cacheKey);
        if (!result) {
          result = computeGlobalQuranLexicon(corpus, excludeStopwords, unifyLemmas);
          workerGlobalCache.set(cacheKey, result);
        }

        self.postMessage({
          type: 'GLOBAL_COMPUTED',
          id,
          result
        } as LexicalWorkerResponse);
        break;
      }

      case 'PREWARM': {
        const { id, corpus } = req;
        // Background speculative pre-computation for default configurations
        // Pre-compute global for unifyLemmas=true and false
        const configs = [
          { excludeStopwords: false, unifyLemmas: true },
          { excludeStopwords: true, unifyLemmas: true },
          { excludeStopwords: false, unifyLemmas: false },
          { excludeStopwords: true, unifyLemmas: false },
        ];

        configs.forEach(cfg => {
          const key = `global_${corpus.length}_${cfg.excludeStopwords ? 1 : 0}_${cfg.unifyLemmas ? 1 : 0}`;
          if (!workerGlobalCache.has(key)) {
            const res = computeGlobalQuranLexicon(corpus, cfg.excludeStopwords, cfg.unifyLemmas);
            workerGlobalCache.set(key, res);
          }
        });

        self.postMessage({
          type: 'PREWARM_DONE',
          id
        } as LexicalWorkerResponse);
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    self.postMessage({
      type: 'ERROR',
      id: req.id,
      error: err?.message || String(err)
    } as LexicalWorkerResponse);
  }
};

import { useState, useEffect, useRef, useCallback } from 'react';
import { QuranSurahCorpus } from '../types';
import { 
  SurahLexicalAnalysis, 
  QuranGlobalLexicalStats,
  analyzeSurahLexiconAdvanced,
  computeGlobalQuranLexicon
} from '../utils/lexicalMetrics';
import { LexicalWorkerRequest, LexicalWorkerResponse } from '../workers/lexicalWorker';

// Multi-tier client-side memoization caches
const globalClientSurahCache = new Map<string, SurahLexicalAnalysis>();
const globalClientGlobalCache = new Map<string, QuranGlobalLexicalStats>();

interface UseLexicalWorkerProps {
  currentSurah?: QuranSurahCorpus;
  corpus: QuranSurahCorpus[];
  excludeStopwords: boolean;
  unifyLemmas: boolean;
  enableGlobalAtlas: boolean;
}

export function useLexicalWorker({
  currentSurah,
  corpus,
  excludeStopwords,
  unifyLemmas,
  enableGlobalAtlas
}: UseLexicalWorkerProps) {
  // Surah cache key
  const surahKey = currentSurah 
    ? `${currentSurah.number}_${excludeStopwords ? 1 : 0}_${unifyLemmas ? 1 : 0}_${currentSurah.ayahs?.length || 0}`
    : '';

  // Global cache key
  const globalKey = `global_${corpus.length}_${excludeStopwords ? 1 : 0}_${unifyLemmas ? 1 : 0}`;

  // Initial values from cache if already present (0ms latency!)
  const [surahAnalysis, setSurahAnalysis] = useState<SurahLexicalAnalysis>(() => {
    if (surahKey && globalClientSurahCache.has(surahKey)) {
      return globalClientSurahCache.get(surahKey)!;
    }
    if (currentSurah) {
      const res = analyzeSurahLexiconAdvanced(currentSurah, excludeStopwords, unifyLemmas);
      globalClientSurahCache.set(surahKey, res);
      return res;
    }
    return {
      surahNumber: 1,
      surahName: 'الفاتحة',
      totalTokens: 29,
      uniqueTypes: 21,
      ttr: 72.4,
      guiraudIndex: 3.9,
      shannonEntropy: 4.1,
      normalizedEntropy: 0.93,
      hapaxCount: 16,
      hapaxPercentage: 76.2,
      topWords: [],
      zipfCurve: [],
      zipfSlope: -0.98,
      zipfR2: 0.94
    };
  });

  const [globalLexicon, setGlobalLexicon] = useState<QuranGlobalLexicalStats | null>(() => {
    if (!enableGlobalAtlas) return null;
    if (globalClientGlobalCache.has(globalKey)) {
      return globalClientGlobalCache.get(globalKey)!;
    }
    return null;
  });

  const [isWorkerCalculating, setIsWorkerCalculating] = useState<boolean>(false);
  const workerRef = useRef<Worker | null>(null);
  const requestIdCounter = useRef<number>(0);
  const pendingRequests = useRef<Map<string, (data: any) => void>>(new Map());

  // Initialize Worker
  useEffect(() => {
    if (typeof Worker === 'undefined') return;

    try {
      const worker = new Worker(
        new URL('../workers/lexicalWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<LexicalWorkerResponse>) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === 'SURAH_ANALYZED') {
          globalClientSurahCache.set(msg.id, msg.result);
          const resolver = pendingRequests.current.get(msg.id);
          if (resolver) {
            resolver(msg.result);
            pendingRequests.current.delete(msg.id);
          }
          setIsWorkerCalculating(false);
        } else if (msg.type === 'GLOBAL_COMPUTED') {
          globalClientGlobalCache.set(msg.id, msg.result);
          const resolver = pendingRequests.current.get(msg.id);
          if (resolver) {
            resolver(msg.result);
            pendingRequests.current.delete(msg.id);
          }
          setIsWorkerCalculating(false);
        } else if (msg.type === 'ERROR') {
          pendingRequests.current.delete(msg.id);
          setIsWorkerCalculating(false);
        }
      };

      workerRef.current = worker;

      // Speculative prewarm when idle
      if (corpus && corpus.length > 0) {
        const prewarmId = 'prewarm_' + Date.now();
        worker.postMessage({
          type: 'PREWARM',
          id: prewarmId,
          corpus
        } as LexicalWorkerRequest);
      }

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (e) {
      console.warn('Web Worker initialization fallback to sync execution:', e);
    }
  }, [corpus]);

  // Synchronous or asynchronous Surah Analysis execution
  useEffect(() => {
    if (!currentSurah) return;

    // 1. Instant Cache Hit: Return immediately with 0 delay!
    if (globalClientSurahCache.has(surahKey)) {
      setSurahAnalysis(globalClientSurahCache.get(surahKey)!);
      return;
    }

    // 2. Offload to Web Worker if available
    if (workerRef.current) {
      setIsWorkerCalculating(true);
      const reqId = surahKey;
      pendingRequests.current.set(reqId, (result: SurahLexicalAnalysis) => {
        setSurahAnalysis(result);
      });

      workerRef.current.postMessage({
        type: 'ANALYZE_SURAH',
        id: reqId,
        surah: currentSurah,
        excludeStopwords,
        unifyLemmas
      } as LexicalWorkerRequest);

      // Speculatively precompute remaining 3 toggle states for this surah in background
      const perms = [
        { sw: !excludeStopwords, lem: unifyLemmas },
        { sw: excludeStopwords, lem: !unifyLemmas },
        { sw: !excludeStopwords, lem: !unifyLemmas },
      ];
      perms.forEach(p => {
        const k = `${currentSurah.number}_${p.sw ? 1 : 0}_${p.lem ? 1 : 0}_${currentSurah.ayahs?.length || 0}`;
        if (!globalClientSurahCache.has(k)) {
          workerRef.current?.postMessage({
            type: 'ANALYZE_SURAH',
            id: k,
            surah: currentSurah,
            excludeStopwords: p.sw,
            unifyLemmas: p.lem
          } as LexicalWorkerRequest);
        }
      });
    } else {
      // 3. Fallback to synchronous calculation
      const res = analyzeSurahLexiconAdvanced(currentSurah, excludeStopwords, unifyLemmas);
      globalClientSurahCache.set(surahKey, res);
      setSurahAnalysis(res);
    }
  }, [surahKey, currentSurah, excludeStopwords, unifyLemmas]);

  // Global Quran Atlas Lexicon calculation
  useEffect(() => {
    if (!enableGlobalAtlas) {
      return;
    }

    // 1. Instant Cache Hit
    if (globalClientGlobalCache.has(globalKey)) {
      setGlobalLexicon(globalClientGlobalCache.get(globalKey)!);
      return;
    }

    // 2. Offload to Web Worker
    if (workerRef.current && corpus.length > 0) {
      setIsWorkerCalculating(true);
      const reqId = globalKey;
      pendingRequests.current.set(reqId, (result: QuranGlobalLexicalStats) => {
        setGlobalLexicon(result);
      });

      workerRef.current.postMessage({
        type: 'COMPUTE_GLOBAL',
        id: reqId,
        corpus,
        excludeStopwords,
        unifyLemmas
      } as LexicalWorkerRequest);
    } else if (corpus.length > 0) {
      // 3. Fallback
      const res = computeGlobalQuranLexicon(corpus, excludeStopwords, unifyLemmas);
      globalClientGlobalCache.set(globalKey, res);
      setGlobalLexicon(res);
    }
  }, [enableGlobalAtlas, globalKey, corpus, excludeStopwords, unifyLemmas]);

  return {
    surahAnalysis,
    globalLexicon,
    isWorkerCalculating
  };
}

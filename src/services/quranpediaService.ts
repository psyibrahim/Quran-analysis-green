/**
 * Service to interact with the official Quranpedia API (https://api.quranpedia.net/v1)
 * specifically for Mushaf Warsh (Madani Mushaf ID: 4).
 */

export interface QuranpediaMushafInfo {
  id: number;
  name: string;
  description: string;
  image?: string;
  bismillah?: string;
  rawi?: {
    id: number;
    name: string;
    full_name: string;
    description: string;
  };
  surahs_count?: number;
}

export interface QuranpediaAyah {
  id: number;
  number: number;
  surah: string;
  page_number: number;
  text: string;
  marker?: string;
  juz?: number;
  hizb?: number;
  ruku?: number;
  manzil?: number;
  options?: string[];
  number_in_hafs?: number[];
}

const BASE_URL = 'https://api.quranpedia.net/v1';

export async function checkQuranpediaHealth(): Promise<{ online: boolean; latencyMs: number; statusText: string }> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}/mushafs`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const latencyMs = Math.round(performance.now() - start);
    if (res.ok) {
      return { online: true, latencyMs, statusText: `متصل (${latencyMs}ms)` };
    }
    return { online: false, latencyMs, statusText: `خطأ استجابة (${res.status})` };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const msg = err instanceof Error ? err.message : 'فشل الاتصال';
    return { online: false, latencyMs, statusText: `غير متاح: ${msg}` };
  }
}

export async function fetchLiveWarshSurah(surahNumber: number): Promise<QuranpediaAyah[] | null> {
  try {
    const res = await fetch(`${BASE_URL}/mushafs/4/${surahNumber}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data as QuranpediaAyah[];
  } catch (err) {
    console.warn(`Could not fetch live Surah ${surahNumber} from Quranpedia:`, err);
    return null;
  }
}

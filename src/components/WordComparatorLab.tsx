import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { 
  WordMatchMode, 
  WordComparisonReport, 
  WordAyahMatch
} from '../types';
import { 
  computeWordComparison, 
  exportComparisonReportToCSV, 
  downloadCSVFile, 
  POPULAR_WORD_COMPARISON_PRESETS 
} from '../utils/wordComparisonMetrics';
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  BookOpen, 
  Layers, 
  SlidersHorizontal,
  Table as TableIcon,
  ArrowUpDown,
  Download,
  BarChart3,
  ExternalLink,
  Sparkles,
  GitCompare,
  SplitSquareVertical,
  Filter,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

interface WordComparatorLabProps {
  onOpenInReader?: (surahNumber: number) => void;
  onSelectSurah?: (surahNumber: number) => void;
}

// ألوان تمييز الكلمات المحايدة لتظليل الآيات والشارات متسقة مع الميزانية 60-30-10
const WORD_COLOR_THEMES = [
  {
    key: 'teal',
    badge: 'bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] border-[#1A5C5C]/30',
    highlight: 'bg-[#1A5C5C]/20 text-[#1A5C5C] dark:text-[#79A9A0] border-b-2 border-[#1A5C5C] font-bold px-1 rounded-[2px]',
    dot: 'bg-[#1A5C5C] dark:bg-[#79A9A0]',
    border: 'border-[#1A5C5C]',
    hex: '#1A5C5C',
    darkHex: '#2B7470',
    text: 'text-[#1A5C5C] dark:text-[#79A9A0]'
  },
  {
    key: 'amber',
    badge: 'bg-[#B8935F]/15 text-[#8C6B37] dark:text-[#C5A16A] border-[#B8935F]/40',
    highlight: 'bg-[#B8935F]/25 text-[#8C6B37] dark:text-[#C5A16A] border-b-2 border-[#B8935F] font-bold px-1 rounded-[2px]',
    dot: 'bg-[#B8935F] dark:bg-[#C5A16A]',
    border: 'border-[#B8935F]',
    hex: '#B8935F',
    darkHex: '#C5A16A',
    text: 'text-[#8C6B37] dark:text-[#C5A16A]'
  },
  {
    key: 'slate',
    badge: 'bg-[#3A4A47]/10 text-[#3A4A47] dark:text-[#A8BCB9] border-[#3A4A47]/30',
    highlight: 'bg-[#3A4A47]/20 text-[#0F1419] dark:text-white border-b-2 border-[#3A4A47] font-bold px-1 rounded-[2px]',
    dot: 'bg-[#3A4A47] dark:bg-[#A8BCB9]',
    border: 'border-[#3A4A47]',
    hex: '#3A4A47',
    darkHex: '#465855',
    text: 'text-[#3A4A47] dark:text-[#A8BCB9]'
  },
  {
    key: 'terracotta',
    badge: 'bg-[#7A4A3A]/10 text-[#7A4A3A] dark:text-[#D19E8F] border-[#7A4A3A]/30',
    highlight: 'bg-[#7A4A3A]/20 text-[#7A4A3A] dark:text-[#D19E8F] border-b-2 border-[#7A4A3A] font-bold px-1 rounded-[2px]',
    dot: 'bg-[#7A4A3A] dark:bg-[#D19E8F]',
    border: 'border-[#7A4A3A]',
    hex: '#7A4A3A',
    darkHex: '#A06B5B',
    text: 'text-[#7A4A3A] dark:text-[#D19E8F]'
  },
  {
    key: 'forest',
    badge: 'bg-[#134747]/10 text-[#134747] dark:text-[#6CB09A] border-[#134747]/30',
    highlight: 'bg-[#134747]/20 text-[#134747] dark:text-[#6CB09A] border-b-2 border-[#134747] font-bold px-1 rounded-[2px]',
    dot: 'bg-[#134747] dark:bg-[#6CB09A]',
    border: 'border-[#134747]',
    hex: '#134747',
    darkHex: '#255959',
    text: 'text-[#134747] dark:text-[#6CB09A]'
  }
];

type WordComparatorTab = 'overview' | 'dispersion' | 'affixes' | 'verses';

export const WordComparatorLab: React.FC<WordComparatorLabProps> = ({
  onOpenInReader
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { activeMushaf, kufiDataset, madaniDataset } = useQuranCorpus();

  // الحصول على المتن القرآني المعتمد حالياً
  const activeDataset = activeMushaf === 'madani' ? madaniDataset : kufiDataset;
  const corpus = activeDataset?.corpus || [];

  // التبويب النشط
  const [activeTab, setActiveTab] = useState<WordComparatorTab>('overview');

  // حالة الكلمات المدخلة في الحقول
  const [wordInputs, setWordInputs] = useState<string[]>(['الدنيا', 'الآخرة']);
  const [evaluatedWords, setEvaluatedWords] = useState<string[]>(['الدنيا', 'الآخرة']);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [matchMode, setMatchMode] = useState<WordMatchMode>('lemma_affixes');
  const [scope, setScope] = useState<'all' | 'meccan' | 'medinan'>('all');

  // تصفية وعرض جدول السور
  const [surahTableFilter, setSurahTableFilter] = useState<'all_matched' | 'cooccur_only'>('all_matched');
  const [surahSearchQuery, setSurahSearchQuery] = useState('');
  const [surahSortBy, setSurahSortBy] = useState<'surah_num' | 'total_count'>('surah_num');

  // تصفية شواهد الآيات
  const [verseFilterWord, setVerseFilterWord] = useState<string>('all');
  const [variantFilter, setVariantFilter] = useState<string | null>(null);
  const [excludedVariants, setExcludedVariants] = useState<string[]>([]);
  const [copiedAyahKey, setCopiedAyahKey] = useState<string | null>(null);

  // سياق موضع الانتقال لتوفير زر العودة السريعة
  const [returnContext, setReturnContext] = useState<{
    tab: 'overview' | 'dispersion' | 'affixes';
    anchorId?: string;
    label: string;
  } | null>(null);

  // التحقق من وجود تعديلات مدخلة لم يتم تطبيقها بعد
  const hasPendingChanges = useMemo(() => {
    if (wordInputs.length !== evaluatedWords.length) return true;
    return wordInputs.some((w, idx) => w.trim() !== (evaluatedWords[idx] || '').trim());
  }, [wordInputs, evaluatedWords]);

  // تطبيق الفحص حصراً عند الضغط الصريح على الزر أو الضغط على مفتاح Enter
  const handleImmediateApply = useCallback(() => {
    setIsComputing(true);
    setVariantFilter(null);
    setExcludedVariants([]);
    setTimeout(() => {
      setEvaluatedWords([...wordInputs]);
      setIsComputing(false);
    }, 15);
  }, [wordInputs]);

  // تحديث كلمة
  const handleUpdateWord = (index: number, val: string) => {
    setWordInputs(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // إضافة حقل كلمة جديد
  const handleAddWord = () => {
    if (wordInputs.length < 5) {
      setWordInputs(prev => [...prev, '']);
    }
  };

  // حذف كلمة
  const handleRemoveWord = (index: number) => {
    if (wordInputs.length > 1) {
      const next = wordInputs.filter((_, i) => i !== index);
      setWordInputs(next);
      setEvaluatedWords(next);
      setIsComputing(false);
    }
  };

  // تطبيق قالب بحثي جاهز
  const handleApplyPreset = (presetWords: string[]) => {
    setWordInputs([...presetWords]);
    setEvaluatedWords([...presetWords]);
    setVariantFilter(null);
    setExcludedVariants([]);
    setIsComputing(false);
  };

  // تبديل إقصاء صيغة معينة
  const handleToggleExcludeVariant = useCallback((surfaceClean: string) => {
    setExcludedVariants(prev => {
      if (prev.includes(surfaceClean)) {
        return prev.filter(v => v !== surfaceClean);
      } else {
        return [...prev, surfaceClean];
      }
    });
    // إذا كانت الصيغة المقصاة هي ذاتها المحددة في تصفية الآيات، يتم إلغاء تصفيتها
    setVariantFilter(current => (current === surfaceClean ? null : current));
  }, []);

  // استعادة كافة الصيغ المقصاة
  const handleResetExcludedVariants = useCallback(() => {
    setExcludedVariants([]);
  }, []);

  // الانتقال إلى شواهد الآيات مع تفعيل سياق العودة الفورية
  const handleInspectVariantVerses = useCallback((variantClean: string) => {
    setReturnContext({
      tab: activeTab === 'verses' ? 'overview' : activeTab,
      anchorId: 'form-breakdown-card',
      label: 'التفصيل الرياضي لصيغ اللفظ'
    });
    setVariantFilter(variantClean);
    setActiveTab('verses');
  }, [activeTab]);

  // الانتقال من مصفوفة التزامن النصي
  const handleInspectSharedVerses = useCallback(() => {
    setReturnContext({
      tab: 'overview',
      anchorId: 'cooccurrence-matrix-card',
      label: 'مصفوفة التزامن النصي'
    });
    setVerseFilterWord('shared_only');
    setActiveTab('verses');
  }, []);

  // الرجوع السريع إلى حيث كان الباحث
  const handleReturnToPreviousContext = useCallback(() => {
    if (returnContext) {
      const targetTab = returnContext.tab;
      const targetAnchor = returnContext.anchorId;
      setActiveTab(targetTab);
      setReturnContext(null);
      if (targetAnchor) {
        setTimeout(() => {
          const el = document.getElementById(targetAnchor);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      }
    } else {
      setActiveTab('overview');
      setTimeout(() => {
        const el = document.getElementById('form-breakdown-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }, [returnContext]);

  // تشغيل المحرك الحتمي على الكلمات المعتمدة
  const report: WordComparisonReport = useMemo(() => {
    return computeWordComparison(corpus, evaluatedWords, matchMode, scope, excludedVariants);
  }, [corpus, evaluatedWords, matchMode, scope, excludedVariants]);

  // تعيين الثيم اللوني لكل كلمة
  const wordColorMap = useMemo(() => {
    const map: Record<string, typeof WORD_COLOR_THEMES[0]> = {};
    report.words.forEach((w, idx) => {
      map[w] = WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
    });
    return map;
  }, [report.words]);

  // فرز وتصفية جدول السور
  const filteredSurahRows = useMemo(() => {
    let rows = report.surahRows;

    if (surahTableFilter === 'cooccur_only' && report.words.length > 1) {
      rows = rows.filter(r => r.hasAllWords);
    }

    if (surahSearchQuery.trim()) {
      const q = surahSearchQuery.trim();
      rows = rows.filter(r => 
        r.surahName.includes(q) || 
        r.surahNumber.toString() === q
      );
    }

    const sorted = [...rows];
    if (surahSortBy === 'surah_num') {
      sorted.sort((a, b) => a.surahNumber - b.surahNumber);
    } else {
      sorted.sort((a, b) => b.totalMatchedWords - a.totalMatchedWords);
    }

    return sorted;
  }, [report.surahRows, surahTableFilter, surahSearchQuery, surahSortBy, report.words.length]);

  // تصفية قائمة الآيات والشواهد
  const filteredAyahs = useMemo(() => {
    let list = report.matchingAyahs;
    if (verseFilterWord !== 'all') {
      if (verseFilterWord === 'shared_only') {
        list = list.filter(ay => Object.keys(ay.matchedWords).length > 1);
      } else {
        list = list.filter(ay => Boolean(ay.matchedWords[verseFilterWord]));
      }
    }
    if (variantFilter) {
      list = list.filter(ay => {
        return Object.values(ay.matchedWords).some(items => 
          items.some(it => it.tokenClean === variantFilter || it.tokenRaw.includes(variantFilter))
        );
      });
    }
    return list;
  }, [report.matchingAyahs, verseFilterWord, variantFilter]);

  // نسخ الآية مع التوثيق
  const handleCopyAyah = useCallback((ayah: WordAyahMatch) => {
    const textToCopy = `﴿${ayah.textUthmani}﴾ [${ayah.surahName}: ${ayah.verseNumber}] (الجزء ${ayah.juz}، ص ${ayah.page})`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const key = `${ayah.surahNumber}:${ayah.verseNumber}`;
      setCopiedAyahKey(key);
      setTimeout(() => setCopiedAyahKey(null), 2000);
    });
  }, []);

  // تنزيل التقرير الأكاديمي الشامل
  const handleExportCSV = () => {
    if (report.words.length === 0) return;
    const csvContent = exportComparisonReportToCSV(report);
    const fileName = `مقارنة_الألفاظ_${report.words.join('_')}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSVFile(csvContent, fileName);
  };

  // تجهيز بيانات مخطط التشتت البياني (Dispersion Chart)
  const dispersionChartData = useMemo(() => {
    return report.dispersionSurahs.filter(s => s.totalMatched > 0).map(s => {
      const item: any = {
        name: s.surahName,
        number: s.surahNumber,
        isShared: s.isShared,
        totalMatched: s.totalMatched
      };
      report.words.forEach(w => {
        item[w] = s.wordCounts[w] || 0;
      });
      return item;
    });
  }, [report.dispersionSurahs, report.words]);

  // دالة تظليل التوكنات داخل نص الآية بدقة حتمية
  const renderHighlightedAyah = (ayah: WordAyahMatch) => {
    const tokens = ayah.textUthmani.split(/\s+/).filter(Boolean);

    // خريطة: wordIndex -> wordQuery
    const tokenMatchMap: Record<number, string> = {};
    Object.entries(ayah.matchedWords).forEach(([wordQuery, items]) => {
      items.forEach(it => {
        tokenMatchMap[it.wordIndex] = wordQuery;
      });
    });

    return (
      <p className="font-mushaf text-lg sm:text-xl leading-[2.3] text-[#0F1419] dark:text-[#F4F0E7]">
        {tokens.map((tok, idx) => {
          const matchedQuery = tokenMatchMap[idx];
          if (matchedQuery) {
            const colorTheme = wordColorMap[matchedQuery] || WORD_COLOR_THEMES[0];
            return (
              <React.Fragment key={idx}>
                <mark className={`${colorTheme.highlight} mx-0.5`}>
                  {tok}
                </mark>
                {' '}
              </React.Fragment>
            );
          }
          return <span key={idx}>{tok} </span>;
        })}
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold border border-[#DED8C9] dark:border-[#33433F] text-[#7B8885] dark:text-[#8B9B96] mx-1">
          {ayah.verseNumber}
        </span>
      </p>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <div className={`p-4 sm:p-5 rounded-[8px] border transition-colors ${
        isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C5C] dark:bg-[#79A9A0]"></span>
              <h1 className="text-base sm:text-lg font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
                مقارنة الكلمات · أداة الاستقصاء المعجمي والرياضي
              </h1>
            </div>
            <p className="text-xs text-[#53605E] dark:text-[#A8BCB9] leading-relaxed max-w-4xl">
              منصة حسابية حتمية خالية من الأحكام التقديرية: تُدخل الألفاظ فتستخرج التكرار الدقيق، ومصفوفة التزامن النصي، 
              ومسافات التقارب بين الكلمات، وتشريح السوابق واللواحق، ومخطط التشتت عبر السور الـ 114.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1A5C5C] hover:bg-[#154848] dark:bg-[#2B7470] dark:hover:bg-[#235F5B] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="تصدير تقرير أكاديمي كامل بصيغة CSV مع نصوص الشواهد"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير التقرير (CSV)</span>
            </button>
            <span className="text-[11px] font-mono px-2.5 py-1.5 rounded-[6px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#264340] text-[#7B8885] dark:text-[#8B9B96]">
              {activeDataset.meta.canonicalName} ({activeDataset.meta.totalVerses} آية)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Parameter Control Console */}
      <div className={`p-4 sm:p-5 rounded-[8px] border space-y-4 ${
        isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
      }`}>
        <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#264340] pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
            <h2 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
              مدخلات المقارنة وضوابط الفحص
            </h2>
          </div>

          {/* Quick Benchmark Presets */}
          <div className="hidden lg:flex items-center gap-1 text-[11px]">
            <span className="text-[#7B8885] dark:text-[#8B9B96] ml-1">نماذج متداولة:</span>
            {POPULAR_WORD_COMPARISON_PRESETS.slice(0, 6).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p.words)}
                className="px-2 py-0.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] hover:bg-[#1A5C5C] hover:text-white dark:hover:bg-[#2B7470] text-[#53605E] dark:text-[#A8BCB9] transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Word Inputs Row */}
        <div>
          <label className="block text-xs font-bold text-[#53605E] dark:text-[#A8BCB9] mb-2">
            الألفاظ المطلوب مقارنتها (أدخل كلمتين أو أكثر):
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {wordInputs.map((val, idx) => {
              const colorTheme = WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className={`flex items-center rounded-[6px] border bg-[#F7F4EA] dark:bg-[#0B1716] overflow-hidden focus-within:ring-1 focus-within:ring-[#1A5C5C] ${colorTheme.border}`}>
                    <span className="px-2 py-1.5 text-xs font-mono font-bold text-[#7B8885] dark:text-[#8B9B96] border-l border-[#DED8C9] dark:border-[#33433F] bg-[#EFECE2] dark:bg-[#122B2A]">
                      ك{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleUpdateWord(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleImmediateApply();
                        }
                      }}
                      placeholder={`الكلمة ${idx + 1}...`}
                      className="px-3 py-1.5 text-xs font-bold font-sans-arabic bg-transparent outline-none w-28 sm:w-36 text-[#0F1419] dark:text-[#F4F0E7]"
                    />
                  </div>
                  {wordInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(idx)}
                      title="حذف هذه الكلمة من المقارنة"
                      className="p-1.5 rounded-[4px] text-[#7B8885] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {wordInputs.length < 5 && (
              <button
                type="button"
                onClick={handleAddWord}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-dashed border-[#1A5C5C]/50 text-xs font-bold text-[#1A5C5C] dark:text-[#79A9A0] hover:bg-[#1A5C5C]/10 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة كلمة (ك{wordInputs.length + 1})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleImmediateApply}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                hasPendingChanges
                  ? 'bg-[#1A5C5C] text-white ring-2 ring-[#B8935F] animate-pulse dark:bg-[#2B7470]'
                  : 'bg-[#1A5C5C] text-white hover:bg-[#154848] dark:bg-[#2B7470] dark:hover:bg-[#235F5B]'
              }`}
              title="تطبيق الفحص ومقارنة الكلمات الآن (Enter)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>تحديث الفحص</span>
              {hasPendingChanges && (
                <span className="text-[10px] bg-[#B8935F] text-[#0F1419] px-1.5 py-0.2 rounded font-mono font-bold">
                  Enter
                </span>
              )}
            </button>

            {hasPendingChanges && (
              <span className="text-[11px] font-sans-arabic font-medium text-[#8C6B37] dark:text-[#C5A16A]">
                تعديلات بانتظار الفحص — اضغط على الزر أو (Enter) لبدء الاستقصاء
              </span>
            )}

            {isComputing && (
              <span className="text-[11px] font-mono text-[#1A5C5C] dark:text-[#79A9A0] font-bold animate-pulse">
                جارٍ الحصر الحتمي بالذاكرة...
              </span>
            )}
          </div>
        </div>

        {/* Matching Mode & Scope Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#DED8C9] dark:border-[#264340]">
          {/* Match Mode Segmented Control */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#53605E] dark:text-[#A8BCB9]">
                نمط المطابقة اللفظية الحتمية:
              </label>
              <span className="text-[10px] font-mono text-[#8C6B37] dark:text-[#C5A16A]">
                {matchMode === 'lemma_affixes' && 'حتمي 100% (322 لعذاب)'}
                {matchMode === 'exact_plain' && 'حرفي صريح (150 لعذاب)'}
                {matchMode === 'root_derivatives' && 'جذر واشتقاقات (373 لعذاب)'}
                {matchMode === 'exact_vocalized' && 'مشكول تام'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-[6px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251]">
              <button
                type="button"
                onClick={() => { setMatchMode('lemma_affixes'); setVariantFilter(null); }}
                className={`px-2 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer text-center ${
                  matchMode === 'lemma_affixes'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
                title="مجرد الكلمة مع كافة السوابق واللواحق القرآنية المغلقة (الافتراضي الحتمي - 322 لعذاب)"
              >
                مجرد الكلمة والزوائد
              </button>
              <button
                type="button"
                onClick={() => { setMatchMode('exact_plain'); setVariantFilter(null); }}
                className={`px-2 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer text-center ${
                  matchMode === 'exact_plain'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
                title="اللفظ الحرفي الصريح بدون سوابق أو زوائد"
              >
                اللفظ التام
              </button>
              <button
                type="button"
                onClick={() => { setMatchMode('root_derivatives'); setVariantFilter(null); }}
                className={`px-2 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer text-center ${
                  matchMode === 'root_derivatives'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
                title="الجذر القرآني اللغوي وكافة اشتقاقاته الاسمية والفعلية (373 لعذاب)"
              >
                الجذر والاشتقاقات
              </button>
              <button
                type="button"
                onClick={() => { setMatchMode('exact_vocalized'); setVariantFilter(null); }}
                className={`px-2 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer text-center ${
                  matchMode === 'exact_vocalized'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
                title="مطابقة الرسم العثماني المشكول مع كامل الحركات"
              >
                الرسم المشكول
              </button>
            </div>
            <p className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] mt-1 leading-relaxed">
              {matchMode === 'lemma_affixes' && 'النمط الحتمي: يطابق أصل الكلمة مع كافة السوابق (و، ف، ب، ل، ك، ول، فل، أفب، بال، كال، لل) واللواحق والضمائر (322 مرة للفظ عذاب).'}
              {matchMode === 'exact_plain' && 'يطابق الرسم المجرد بذاته دون أي زيادة قبلية أو بعدية (150 مرة للفظ عذاب).'}
              {matchMode === 'root_derivatives' && 'يستقصي الجذر اللغوي المشترك وكافة تصاريفه في القرآن (373 مرة لجذر ع-ذ-ب يشمل يعذب، معذبين، عذاب...).'}
              {matchMode === 'exact_vocalized' && 'مطابقة تامة للحركات والتشكيل وعلامات الضبط العثماني.'}
            </p>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-[#53605E] dark:text-[#A8BCB9] mb-1.5">
              نطاق البحث بالمصحف:
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-[6px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251]">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-2 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer text-center ${
                  scope === 'all'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
              >
                كامل القرآن (114)
              </button>
              <button
                type="button"
                onClick={() => setScope('meccan')}
                className={`px-2 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer text-center ${
                  scope === 'meccan'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
              >
                السور المكية فقط
              </button>
              <button
                type="button"
                onClick={() => setScope('medinan')}
                className={`px-2 py-1.5 text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer text-center ${
                  scope === 'medinan'
                    ? 'bg-[#1A5C5C] text-white shadow-2xs dark:bg-[#2B7470]'
                    : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419]'
                }`}
              >
                السور المدنية فقط
              </button>
            </div>
            <p className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] mt-1">
              النطاق الحالي يشمل {scope === 'all' ? '114 سورة' : scope === 'meccan' ? 'السور المكية' : 'السور المدنية'}.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Analytical Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[#DED8C9] dark:border-[#264340] pb-1 overflow-x-auto scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-[6px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[#1A5C5C] text-white dark:bg-[#2B7470]'
              : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] hover:bg-[#FAF8F2] dark:hover:bg-[#10211F]'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>المؤشرات ومصفوفة التزامن</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dispersion')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-[6px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'dispersion'
              ? 'bg-[#1A5C5C] text-white dark:bg-[#2B7470]'
              : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] hover:bg-[#FAF8F2] dark:hover:bg-[#10211F]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>مخطط التشتت ومسافة التقارب</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('affixes')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-[6px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'affixes'
              ? 'bg-[#1A5C5C] text-white dark:bg-[#2B7470]'
              : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] hover:bg-[#FAF8F2] dark:hover:bg-[#10211F]'
          }`}
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span>تشريح السوابق واللواحق</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verses')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-[6px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'verses'
              ? 'bg-[#1A5C5C] text-white dark:bg-[#2B7470]'
              : 'text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] hover:bg-[#FAF8F2] dark:hover:bg-[#10211F]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>جدول السور والشواهد ({report.matchingAyahs.length})</span>
        </button>
      </div>

      {/* 4. Tab 1: Overview & Co-occurrence Matrix */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Global Comparative Metrics Table */}
          <div className={`p-4 sm:p-5 rounded-[8px] border space-y-3 ${
            isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#264340] pb-2">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                <h2 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
                  جدول الإحصاءات الإجمالية المقارنة للألفاظ
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#7B8885] dark:text-[#8B9B96]">
                {report.words.length} كلمات قيد الفحص
              </span>
            </div>

            {report.words.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7B8885] dark:text-[#8B9B96]">
                يرجى إدخال كلمة واحدة على الأقل لعرض بياناتها الإحصائية.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs font-sans-arabic border-collapse">
                  <thead>
                    <tr className="border-b border-[#DED8C9] dark:border-[#264340] text-[#7B8885] dark:text-[#8B9B96]">
                      <th className="py-2 px-3 font-bold">اللفظ</th>
                      <th className="py-2 px-3 font-bold text-center font-mono">التكرار الكلي</th>
                      <th className="py-2 px-3 font-bold text-center font-mono">عدد السور</th>
                      <th className="py-2 px-3 font-bold text-center font-mono">عدد الآيات</th>
                      <th className="py-2 px-3 font-bold text-center font-mono">الورود المكي</th>
                      <th className="py-2 px-3 font-bold text-center font-mono">الورود المدني</th>
                      <th className="py-2 px-3 font-bold font-mono">أول موضع</th>
                      <th className="py-2 px-3 font-bold font-mono">آخر موضع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED8C9]/60 dark:divide-[#264340]/60">
                    {report.singleStats.map((st, idx) => {
                      const colorTheme = WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
                      return (
                        <tr key={st.query} className="hover:bg-[#F7F4EA] dark:hover:bg-[#0E201E] transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${colorTheme.dot}`}></span>
                              <span className="font-bold text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                                {st.query}
                              </span>
                              <span className="text-[10px] font-mono text-[#7B8885]">
                                (ك{idx + 1})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-sm tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
                            {st.totalOccurrences.toLocaleString('en-US')}
                            {st.variants?.some(v => v.isExcluded) && (
                              <span className="block text-[10px] font-sans-arabic text-amber-600 dark:text-amber-400 font-normal">
                                (مُستبعد منها صيغ)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-[#53605E] dark:text-[#A8BCB9]">
                            {st.surahCount.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-[#53605E] dark:text-[#A8BCB9]">
                            {st.ayahCount.toLocaleString('en-US')}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-[#53605E] dark:text-[#A8BCB9]">
                            {st.meccanCount.toLocaleString('en-US')}
                            {st.totalOccurrences > 0 && (
                              <span className="text-[10px] text-[#7B8885] mr-1">
                                ({((st.meccanCount / st.totalOccurrences) * 100).toFixed(1)}%)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono tabular-nums text-[#53605E] dark:text-[#A8BCB9]">
                            {st.medinanCount.toLocaleString('en-US')}
                            {st.totalOccurrences > 0 && (
                              <span className="text-[10px] text-[#7B8885] mr-1">
                                ({((st.medinanCount / st.totalOccurrences) * 100).toFixed(1)}%)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#53605E] dark:text-[#A8BCB9]">
                            {st.firstOccurrence ? (
                              <button
                                type="button"
                                onClick={() => onOpenInReader?.(st.firstOccurrence!.surah)}
                                className="hover:text-[#1A5C5C] dark:hover:text-[#79A9A0] underline underline-offset-2 cursor-pointer"
                              >
                                {st.firstOccurrence.surahName}: {st.firstOccurrence.ayah}
                              </button>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#53605E] dark:text-[#A8BCB9]">
                            {st.lastOccurrence ? (
                              <button
                                type="button"
                                onClick={() => onOpenInReader?.(st.lastOccurrence!.surah)}
                                className="hover:text-[#1A5C5C] dark:hover:text-[#79A9A0] underline underline-offset-2 cursor-pointer"
                              >
                                {st.lastOccurrence.surahName}: {st.lastOccurrence.ayah}
                              </button>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form Variant Breakdown Card (التفصيل الرياضي التفاعلي لصيغ الألفاظ والزوائد مع ميزة الإقصاء) */}
          {report.singleStats.some(s => s.variants && s.variants.length > 0) && (
            <div 
              id="form-breakdown-card"
              className={`p-4 sm:p-5 rounded-[8px] border space-y-4 ${
                isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DED8C9] dark:border-[#264340] pb-2.5">
                <div className="flex items-center gap-2">
                  <SplitSquareVertical className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                  <h2 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
                    التفصيل الرياضي التفاعلي لصيغ اللفظ والزوائد (Form Breakdown)
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {excludedVariants.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetExcludedVariants}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-red-600/15 hover:bg-red-600/25 text-red-700 dark:text-red-300 text-[11px] font-bold transition-colors cursor-pointer border border-red-500/20"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة ({excludedVariants.length}) صيغ مقصاة</span>
                    </button>
                  )}
                  {variantFilter && (
                    <button
                      type="button"
                      onClick={() => setVariantFilter(null)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#B8935F]/20 text-[#8C6B37] dark:text-[#C5A16A] text-[11px] font-bold hover:bg-[#B8935F]/30 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>إلغاء التصفية («{variantFilter}»)</span>
                    </button>
                  )}
                  <span className="text-[11px] text-[#7B8885] dark:text-[#8B9B96]">
                    انقر لتصفية الآيات، أو اضغط زر الإقصاء لاستبعاد أي صيغة من النتائج
                  </span>
                </div>
              </div>

              {/* Excluded Variants Banner if any are active */}
              {excludedVariants.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[6px] bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-2 text-[#8C6B37] dark:text-[#C5A16A]">
                    <EyeOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      تم إقصاء <strong className="font-mono font-bold text-amber-700 dark:text-amber-300">{excludedVariants.length}</strong> صيغة من الحساب الرياضي وشواهد الآيات: 
                      <span className="font-bold mr-1"> «{excludedVariants.join('»، «')}»</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetExcludedVariants}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#1A5C5C] hover:bg-[#134444] text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>استعادة كافة الصيغ المقصاة</span>
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {report.singleStats.map((st, idx) => {
                  const colorTheme = WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
                  const variants = st.variants || [];
                  const activeVariants = variants.filter(v => !v.isExcluded);
                  const excludedCountForThisWord = variants.filter(v => v.isExcluded).length;
                  if (variants.length === 0) return null;

                  return (
                    <div 
                      key={st.query}
                      className={`p-3.5 rounded-[6px] border ${
                        isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
                      } space-y-3`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DED8C9]/60 dark:border-[#264340]/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorTheme.dot}`}></span>
                          <span className="font-bold text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                            {st.query}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#1A5C5C] dark:text-[#79A9A0]">
                            المجموع الفعلي: {st.totalOccurrences.toLocaleString('en-US')} تكراراً
                          </span>
                          <span className="text-[11px] text-[#7B8885] dark:text-[#8B9B96]">
                            ({activeVariants.length} صيغة نشطة
                            {excludedCountForThisWord > 0 ? ` · ${excludedCountForThisWord} مقصاة` : ''})
                          </span>
                        </div>
                        {matchMode === 'lemma_affixes' && st.query.includes('عذاب') && st.totalOccurrences === 322 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] text-[11px] font-bold border border-[#1A5C5C]/20">
                            <Check className="w-3 h-3 text-[#1A5C5C] dark:text-[#79A9A0]" />
                            <span>مطابق تماماً لعدد المصاحف والتطبيقات المتخصصة (322)</span>
                          </span>
                        )}
                        {matchMode === 'lemma_affixes' && (st.query === 'الآخرة' || st.query === 'الاخرة') && st.totalOccurrences === 115 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] text-[11px] font-bold border border-[#1A5C5C]/20">
                            <Check className="w-3 h-3 text-[#1A5C5C] dark:text-[#79A9A0]" />
                            <span>مطابق تماماً للإحصاء القرآني المعتمد (115 موضعاً متوازنة مع الدنيا)</span>
                          </span>
                        )}
                        {matchMode === 'lemma_affixes' && st.query === 'الدنيا' && st.totalOccurrences === 115 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A5C5C]/10 text-[#1A5C5C] dark:text-[#79A9A0] text-[11px] font-bold border border-[#1A5C5C]/20">
                            <Check className="w-3 h-3 text-[#1A5C5C] dark:text-[#79A9A0]" />
                            <span>مطابق تماماً للإحصاء القرآني المعتمد (115 موضعاً متوازنة مع الآخرة)</span>
                          </span>
                        )}
                        {matchMode === 'lemma_affixes' && (st.query === 'نبي' || st.query === 'النبي') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#B8935F]/15 text-[#8C6B37] dark:text-[#C5A16A] text-[11px] font-bold border border-[#B8935F]/30">
                            <Check className="w-3 h-3 text-[#B8935F]" />
                            <span>المفرد والجمع السالم (70) + جمع التكسير «الأنبياء» (5) = {st.totalOccurrences} موضعاً</span>
                          </span>
                        )}
                      </div>

                      {/* Cumulative Proportion Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-3 rounded-[3px] overflow-hidden flex bg-[#DED8C9]/40 dark:bg-[#122B2A]">
                          {activeVariants.map((v, vIdx) => {
                            const isFiltered = variantFilter === v.surfaceClean;
                            const barOpacities = ['opacity-100', 'opacity-85', 'opacity-70', 'opacity-60', 'opacity-50'];
                            const opacityClass = barOpacities[vIdx % barOpacities.length];
                            return (
                              <div
                                key={v.surfaceClean}
                                style={{ width: `${Math.max(v.percentage, 1)}%` }}
                                className={`h-full ${colorTheme.dot} ${opacityClass} transition-all cursor-pointer hover:brightness-110 ${
                                  isFiltered ? 'ring-2 ring-[#B8935F] z-10' : ''
                                }`}
                                title={`${v.surfaceClean}: ${v.count} (${v.percentage}%) - انقر للانتقال لشواهدها`}
                                onClick={() => handleInspectVariantVerses(v.surfaceClean)}
                              />
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#7B8885] dark:text-[#8B9B96]">
                          {activeVariants.length > 0 ? (
                            <>
                              <span>أعلى الصيغ النشطة: {activeVariants[0]?.surfaceClean} ({activeVariants[0]?.percentage}%)</span>
                              <span>أدنى الصيغ النشطة: {activeVariants[activeVariants.length - 1]?.surfaceClean} ({activeVariants[activeVariants.length - 1]?.percentage}%)</span>
                            </>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">كافة الصيغ تم إقصاؤها</span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Variant Chips with Exclusion Controls */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {variants.map((v) => {
                          const isFiltered = variantFilter === v.surfaceClean;
                          const isExcluded = Boolean(v.isExcluded);

                          return (
                            <div
                              key={v.surfaceClean}
                              className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-sans-arabic border transition-all ${
                                isExcluded
                                  ? 'opacity-60 bg-red-500/5 dark:bg-red-950/20 border-dashed border-red-300 dark:border-red-900/60'
                                  : isFiltered
                                  ? 'bg-[#1A5C5C] text-white border-[#1A5C5C] shadow-xs dark:bg-[#2B7470]'
                                  : 'bg-[#EFECE2] dark:bg-[#122B2A] text-[#0F1419] dark:text-[#F4F0E7] border-[#DED8C9] dark:border-[#235251] hover:border-[#1A5C5C]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExcluded) return;
                                  if (isFiltered) {
                                    setVariantFilter(null);
                                  } else {
                                    handleInspectVariantVerses(v.surfaceClean);
                                  }
                                }}
                                disabled={isExcluded}
                                className={`flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                                  isExcluded ? 'line-through text-[#7B8885] dark:text-[#8B9B96]' : ''
                                }`}
                                title={isExcluded ? `صيغة مقصاة: ${v.surfaceClean}` : `انقر للانتقال لشواهد (${v.surfaceClean})`}
                              >
                                <span className="font-bold font-heading">{v.surfaceClean}</span>
                                <span className={`text-[11px] font-mono px-1 rounded-[2px] ${
                                  isFiltered ? 'bg-white/20 text-white font-bold' : 'text-[#7B8885] dark:text-[#8B9B96]'
                                }`}>
                                  {v.count}
                                </span>
                                {!isExcluded && (
                                  <span className={`text-[10px] font-mono ${
                                    isFiltered ? 'text-white/80' : 'text-[#7B8885]/80'
                                  }`}>
                                    {v.percentage}%
                                  </span>
                                )}
                              </button>

                              {/* Toggle Exclude Button */}
                              {isExcluded ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExcludeVariant(v.surfaceClean);
                                  }}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold cursor-pointer transition-colors"
                                  title={`إلغاء إقصاء صيغة (${v.surfaceClean}) وإعادتها للحساب`}
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>استرجاع</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExcludeVariant(v.surfaceClean);
                                  }}
                                  className={`p-0.5 rounded-[2px] opacity-70 group-hover:opacity-100 hover:text-red-600 hover:bg-red-500/10 dark:hover:text-red-400 transition-colors cursor-pointer ${
                                    isFiltered ? 'text-white/80 hover:text-white' : 'text-[#7B8885]'
                                  }`}
                                  title={`إقصاء صيغة (${v.surfaceClean}) من النتائج والآيات`}
                                  aria-label={`إقصاء صيغة ${v.surfaceClean}`}
                                >
                                  <EyeOff className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Co-occurrence Matrix & Proximity */}
          {report.cooccurrences.length > 0 && (
            <div 
              id="cooccurrence-matrix-card"
              className={`p-4 sm:p-5 rounded-[8px] border space-y-3 ${
                isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#264340] pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#B8935F]" />
                  <h2 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
                    مصفوفة التزامن النصي ومسافات التقارب (Co-occurrence & Proximity)
                  </h2>
                </div>
                <span className="text-[11px] text-[#7B8885] dark:text-[#8B9B96]">
                  قياس التقاطع ومسافة الكلمات الفاصلة في نفس الآية
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.cooccurrences.map((pair, idx) => {
                  const colorA = wordColorMap[pair.wordA] || WORD_COLOR_THEMES[0];
                  const colorB = wordColorMap[pair.wordB] || WORD_COLOR_THEMES[1];
                  return (
                    <div 
                      key={idx}
                      className={`p-3.5 rounded-[6px] border ${
                        isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#264340] pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className={`px-2 py-0.5 rounded-[4px] border ${colorA.badge}`}>
                            {pair.wordA}
                          </span>
                          <span className="text-[#7B8885]">×</span>
                          <span className={`px-2 py-0.5 rounded-[4px] border ${colorB.badge}`}>
                            {pair.wordB}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleInspectSharedVerses}
                          className="text-xs font-bold text-[#1A5C5C] dark:text-[#79A9A0] hover:underline cursor-pointer"
                        >
                          عرض الشواهد المشتركة ({pair.sharedAyahCount})
                        </button>
                      </div>

                      {/* 4 KPIs for this pair */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A]">
                          <span className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] block">
                            في نفس الآية
                          </span>
                          <strong className="text-sm font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
                            {pair.sharedAyahCount}
                          </strong>
                        </div>

                        <div className="p-2 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A]">
                          <span className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] block">
                            في نفس السورة
                          </span>
                          <strong className="text-sm font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
                            {pair.sharedSurahCount}
                          </strong>
                        </div>

                        <div className="p-2 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A]">
                          <span className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] block" title="مرات الورود متجاورين مباشرة بدون أي كلمة فاصلة بينهما">
                            تجاور مباشر (0 كلمة)
                          </span>
                          <strong className="text-sm font-mono tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">
                            {pair.adjacentCount}
                          </strong>
                        </div>

                        <div className="p-2 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A]">
                          <span className="text-[10px] text-[#7B8885] dark:text-[#8B9B96] block" title="متوسط عدد الكلمات الفاصلة بين اللفظين">
                            متوسط المسافة
                          </span>
                          <strong className="text-sm font-mono tabular-nums text-[#B8935F]">
                            {pair.avgDistance !== null ? `${pair.avgDistance} كلمة` : '—'}
                          </strong>
                        </div>
                      </div>

                      {/* Jaccard Index Bar */}
                      <div className="pt-1 flex items-center justify-between text-xs font-mono text-[#7B8885] dark:text-[#8B9B96]">
                        <span>معامل جاكارد للتداخل الحسابي:</span>
                        <span className="font-bold text-[#1A5C5C] dark:text-[#79A9A0]">{pair.jaccardSimilarity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Dispersion & Proximity Map */}
      {activeTab === 'dispersion' && (
        <div className="space-y-4">
          <div className={`p-4 sm:p-5 rounded-[8px] border space-y-3 ${
            isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DED8C9] dark:border-[#264340] pb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2 text-[#0F1419] dark:text-[#F4F0E7]">
                  <BarChart3 className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                  <span>مخطط التشتت القرآني وكثافة الظهور عبر السور</span>
                </h3>
                <p className="text-[11px] text-[#7B8885] dark:text-[#8B9B96] font-mono mt-0.5">
                  توزيع مواقع ورود الألفاظ عبر السور من الفاتحة (1) إلى الناس (114) وبيان مواضع التقاطع
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-mono">
                {report.words.map((w, idx) => {
                  const themeCol = wordColorMap[w] || WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
                  return (
                    <div key={w} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: isLight ? themeCol.hex : themeCol.darkHex }}></span>
                      <span className="font-bold text-[#0F1419] dark:text-[#F4F0E7]">{w}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {dispersionChartData.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7B8885]">
                لا توجد سور مطابقة لعرض مخطط التشتت.
              </div>
            ) : (
              <div className="w-full h-[360px] select-none" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dispersionChartData}
                    margin={{ top: 20, right: 10, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={isLight ? 0.25 : 0.08} stroke={isLight ? '#DED8C9' : '#33433F'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isLight ? '#0F1419' : '#D1D5DB', fontSize: 11, fontFamily: 'Amiri, serif' }} 
                      dy={5}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fill: isLight ? '#53605E' : '#9CA3AF', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: isLight ? '#FAF8F2' : '#10211F',
                        borderColor: isLight ? '#DED8C9' : '#264340',
                        borderRadius: '6px',
                        fontSize: '12px',
                        direction: 'rtl'
                      }}
                    />
                    {report.words.map((w, idx) => {
                      const themeCol = wordColorMap[w] || WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
                      return (
                        <Bar 
                          key={w} 
                          dataKey={w} 
                          name={w} 
                          fill={isLight ? themeCol.hex : themeCol.darkHex} 
                          radius={[2, 2, 0, 0]} 
                        />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Affixes Breakdown */}
      {activeTab === 'affixes' && (
        <div className="space-y-4">
          <div className={`p-4 sm:p-5 rounded-[8px] border space-y-4 ${
            isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#264340] pb-2">
              <div className="flex items-center gap-2">
                <SplitSquareVertical className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                <h3 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
                  تشريح السوابق واللواحق الصرفية للألفاظ المقارنة
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#7B8885] dark:text-[#8B9B96]">
                تفكيك بنية الحروف والضمائر المتصلة قبل وبعد الجذع
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.affixStats.map((af, idx) => {
                const colorTheme = wordColorMap[af.query] || WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
                const p = af.prefixes;
                const s = af.suffixes;
                const total = af.totalTokens || 1;

                return (
                  <div 
                    key={af.query}
                    className={`p-4 rounded-[6px] border ${
                      isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
                    } space-y-3`}
                  >
                    {/* Word Title */}
                    <div className="flex items-center justify-between border-b border-[#DED8C9] dark:border-[#264340] pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorTheme.dot}`}></span>
                        <h4 className="text-sm font-bold text-[#0F1419] dark:text-[#F4F0E7]">
                          اللفظ: «{af.query}»
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#1A5C5C] dark:text-[#79A9A0] tabular-nums">
                        {af.totalTokens} توكن مطابق
                      </span>
                    </div>

                    {/* Prefixes Section */}
                    <div>
                      <span className="text-[11px] font-bold text-[#7B8885] dark:text-[#8B9B96] block mb-1.5">
                        أولاً: حصر السوابق المتصلة (Prefixes):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-mono">
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">مجردة تماماً:</span>
                          <strong className="tabular-nums">{p.bare}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">مع (الـ):</span>
                          <strong className="tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">{p.al}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">واو العطف (وـ):</span>
                          <strong className="tabular-nums">{p.wa}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">حرف الفاء (فـ):</span>
                          <strong className="tabular-nums">{p.fa}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">حرف الباء (بـ):</span>
                          <strong className="tabular-nums">{p.bi}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">حرف اللام (لـ):</span>
                          <strong className="tabular-nums">{p.li}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">حرف الكاف (كـ):</span>
                          <strong className="tabular-nums">{p.ka}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">حرف السين (سـ):</span>
                          <strong className="tabular-nums">{p.sa}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">سوابق مركبة:</span>
                          <strong className="tabular-nums text-[#B8935F]">{p.compound}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Suffixes Section */}
                    <div className="pt-2 border-t border-[#DED8C9]/60 dark:border-[#264340]/60">
                      <span className="text-[11px] font-bold text-[#7B8885] dark:text-[#8B9B96] block mb-1.5">
                        ثانياً: حصر اللواحق والضمائر (Suffixes):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-mono">
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">بدون لاحقة:</span>
                          <strong className="tabular-nums">{s.bare}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">ضمير غائب (ها/هم):</span>
                          <strong className="tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">{s.pronounHa}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">ضمير مخاطب (ك/كم):</span>
                          <strong className="tabular-nums">{s.pronounKa}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">ضمير متكلم (ي/نا):</span>
                          <strong className="tabular-nums">{s.pronounYa}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">جمع النون/الياء:</span>
                          <strong className="tabular-nums">{s.pluralNun}</strong>
                        </div>
                        <div className="p-1.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] flex items-center justify-between">
                          <span className="text-[#53605E] dark:text-[#A8BCB9]">تنوين (ً / ٌ / ٍ):</span>
                          <strong className="tabular-nums text-[#B8935F]">{s.tanween}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Surah Table & Ayah Citations */}
      {activeTab === 'verses' && (
        <div className="space-y-4">
          {/* Surah-by-Surah Distribution Table */}
          <div className={`p-4 sm:p-5 rounded-[8px] border space-y-3 ${
            isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DED8C9] dark:border-[#264340] pb-3">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                <h3 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
                  جدول التوزيع التفصيلي عبر السور
                </h3>
                <span className="text-[11px] font-mono text-[#7B8885] dark:text-[#8B9B96]">
                  ({filteredSurahRows.length} سورة وردت فيها الألفاظ)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter mode */}
                {report.words.length > 1 && (
                  <div className="inline-flex p-0.5 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251] text-xs">
                    <button
                      type="button"
                      onClick={() => setSurahTableFilter('all_matched')}
                      className={`px-2 py-1 rounded-[3px] transition-colors cursor-pointer ${
                        surahTableFilter === 'all_matched'
                          ? 'bg-[#1A5C5C] text-white font-bold dark:bg-[#2B7470]'
                          : 'text-[#53605E] dark:text-[#A8BCB9]'
                      }`}
                    >
                      أي من الكلمات
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahTableFilter('cooccur_only')}
                      className={`px-2 py-1 rounded-[3px] transition-colors cursor-pointer ${
                        surahTableFilter === 'cooccur_only'
                          ? 'bg-[#1A5C5C] text-white font-bold dark:bg-[#2B7470]'
                          : 'text-[#53605E] dark:text-[#A8BCB9]'
                      }`}
                    >
                      السور المشتركة فقط
                    </button>
                  </div>
                )}

                {/* Sort order */}
                <button
                  type="button"
                  onClick={() => setSurahSortBy(prev => prev === 'surah_num' ? 'total_count' : 'surah_num')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#EFECE2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251] text-xs text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] cursor-pointer"
                >
                  <ArrowUpDown className="w-3 h-3 text-[#B8935F]" />
                  <span>{surahSortBy === 'surah_num' ? 'ترتيب المصحف' : 'أعلى تكرار'}</span>
                </button>

                {/* Surah quick search */}
                <div className="relative">
                  <input
                    type="text"
                    value={surahSearchQuery}
                    onChange={(e) => setSurahSearchQuery(e.target.value)}
                    placeholder="بحث في السور..."
                    className="pr-7 pl-2 py-1 text-xs rounded-[4px] bg-[#F7F4EA] dark:bg-[#0B1716] border border-[#DED8C9] dark:border-[#235251] text-[#0F1419] dark:text-[#F4F0E7] w-28 sm:w-36 outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-[#7B8885] absolute right-2 top-1.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {filteredSurahRows.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#7B8885] dark:text-[#8B9B96]">
                لا توجد سور مطابقة لخيارات الفرز الحالية.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-right text-xs font-sans-arabic border-collapse">
                  <thead className="sticky top-0 bg-[#FAF8F2] dark:bg-[#10211F] z-10 shadow-2xs">
                    <tr className="border-b border-[#DED8C9] dark:border-[#264340] text-[#7B8885] dark:text-[#8B9B96]">
                      <th className="py-2 px-3 font-bold font-mono">#</th>
                      <th className="py-2 px-3 font-bold">اسم السورة</th>
                      <th className="py-2 px-3 font-bold text-center">النوع</th>
                      <th className="py-2 px-3 font-bold text-center font-mono">آياتها</th>
                      {report.words.map((w, idx) => {
                        const colorTheme = WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
                        return (
                          <th key={w} className={`py-2 px-3 font-bold text-center font-mono ${colorTheme.text}`}>
                            {w}
                          </th>
                        );
                      })}
                      <th className="py-2 px-3 font-bold text-center font-mono text-[#0F1419] dark:text-[#F4F0E7]">
                        المجموع
                      </th>
                      <th className="py-2 px-3 font-bold text-center">فحص</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED8C9]/60 dark:divide-[#264340]/60">
                    {filteredSurahRows.map((row) => (
                      <tr 
                        key={row.surahNumber}
                        className="hover:bg-[#F7F4EA] dark:hover:bg-[#0E201E] transition-colors"
                      >
                        <td className="py-2 px-3 font-mono tabular-nums text-[#7B8885]">
                          {row.surahNumber}
                        </td>
                        <td className="py-2 px-3 font-bold font-heading text-[#0F1419] dark:text-[#F4F0E7]">
                          {row.surahName}
                        </td>
                        <td className="py-2 px-3 text-center text-[11px] text-[#7B8885]">
                          {row.isMeccan ? 'مكية' : 'مدنية'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono tabular-nums text-[#7B8885]">
                          {row.totalAyahs}
                        </td>
                        {report.words.map((w) => {
                          const count = row.counts[w] || 0;
                          return (
                            <td 
                              key={w} 
                              className={`py-2 px-3 text-center font-mono tabular-nums ${
                                count > 0 
                                  ? 'font-bold text-[#0F1419] dark:text-[#F4F0E7]' 
                                  : 'text-[#7B8885]/40'
                              }`}
                            >
                              {count > 0 ? count : '—'}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center font-mono font-bold tabular-nums text-[#1A5C5C] dark:text-[#79A9A0]">
                          {row.totalMatchedWords}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenInReader?.(row.surahNumber)}
                            title="فتح السورة في القارئ"
                            className="p-1 rounded-[4px] text-[#53605E] hover:text-[#1A5C5C] dark:text-[#A8BCB9] dark:hover:text-[#79A9A0] cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Verifiable Verse Corpus Inspector */}
          <div className={`p-4 sm:p-5 rounded-[8px] border space-y-4 ${
            isLight ? 'bg-[#FAF8F2] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DED8C9] dark:border-[#264340] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1A5C5C] dark:text-[#79A9A0]" />
                <h3 className="text-xs sm:text-sm font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
                  سجل الآيات والشواهد النصية
                </h3>
                <span className="text-[11px] font-mono text-[#7B8885] dark:text-[#8B9B96]">
                  ({filteredAyahs.length} آية معروضة)
                </span>
              </div>

              {/* زر الرجوع السريع في رأس سجل الآيات */}
              {(returnContext || variantFilter) && (
                <button
                  type="button"
                  onClick={handleReturnToPreviousContext}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#1A5C5C] hover:bg-[#134444] text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  title="الرجوع السريع إلى حيث كنت"
                >
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0" />
                  <span>الرجوع إلى {returnContext?.label || 'التفصيل الرياضي'}</span>
                </button>
              )}
            </div>

              {/* Filter Pills for Ayahs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setVerseFilterWord('all')}
                  className={`px-2.5 py-1 rounded-[4px] border font-bold transition-colors cursor-pointer ${
                    verseFilterWord === 'all'
                      ? 'bg-[#1A5C5C] text-white border-[#1A5C5C] dark:bg-[#2B7470]'
                      : 'bg-[#EFECE2] text-[#53605E] border-[#DED8C9] dark:bg-[#122B2A] dark:text-[#A8BCB9] dark:border-[#235251]'
                  }`}
                >
                  جميع الآيات ({report.matchingAyahs.length})
                </button>

                {report.words.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setVerseFilterWord('shared_only')}
                    className={`px-2.5 py-1 rounded-[4px] border font-bold transition-colors cursor-pointer ${
                      verseFilterWord === 'shared_only'
                        ? 'bg-[#B8935F] text-white border-[#B8935F]'
                        : 'bg-[#EFECE2] text-[#8C6B37] border-[#DED8C9] dark:bg-[#122B2A] dark:text-[#C5A16A] dark:border-[#235251]'
                    }`}
                  >
                    الآيات المشتركة فقط ({report.matchingAyahs.filter(ay => Object.keys(ay.matchedWords).length > 1).length})
                  </button>
                )}

                {report.words.map((w, idx) => {
                  const colorTheme = WORD_COLOR_THEMES[idx % WORD_COLOR_THEMES.length];
                  const countForWord = report.matchingAyahs.filter(ay => Boolean(ay.matchedWords[w])).length;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setVerseFilterWord(w)}
                      className={`px-2.5 py-1 rounded-[4px] border font-bold transition-colors cursor-pointer ${
                        verseFilterWord === w
                          ? `${colorTheme.badge} ring-1 ring-[#1A5C5C]`
                          : 'bg-[#EFECE2] text-[#53605E] border-[#DED8C9] dark:bg-[#122B2A] dark:text-[#A8BCB9] dark:border-[#235251]'
                      }`}
                    >
                      {w} ({countForWord})
                    </button>
                  );
                })}
              </div>

            {/* Active Variant Filter Notification Banner with Return Action */}
            {variantFilter && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[6px] bg-[#B8935F]/15 border border-[#B8935F]/40 text-xs">
                <div className="flex items-center gap-2 text-[#8C6B37] dark:text-[#C5A16A]">
                  <Filter className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    تصفية نشطة حالياً بالصيغة المحددة: <strong className="font-bold underline decoration-[#B8935F]">«{variantFilter}»</strong> ({filteredAyahs.length} آية)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReturnToPreviousContext}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#1A5C5C] hover:bg-[#134444] text-white transition-colors cursor-pointer text-xs font-bold shadow-xs"
                    title="الرجوع فوراً إلى بطاقة التفصيل الرياضي"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0" />
                    <span>الرجوع إلى {returnContext?.label || 'التفصيل الرياضي'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVariantFilter(null)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#B8935F]/20 text-[#8C6B37] dark:text-[#C5A16A] hover:bg-[#B8935F]/30 transition-colors cursor-pointer text-[11px] font-bold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إلغاء التصفية</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Excluded Variants Notice in Verses Tab */}
            {excludedVariants.length > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-2 text-[#8C6B37] dark:text-[#C5A16A]">
                  <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    تم إقصاء <strong className="font-bold">{excludedVariants.length}</strong> صيغة من شواهد الآيات: 
                    <span className="font-bold mr-1">«{excludedVariants.join('»، «')}»</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetExcludedVariants}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1A5C5C] text-white hover:bg-[#134444] transition-colors cursor-pointer text-[11px] font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>استعادة الكل</span>
                </button>
              </div>
            )}

            {/* Ayahs List */}
            {filteredAyahs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7B8885] dark:text-[#8B9B96]">
                لا توجد شواهد نصية تطابق الفلتر المختار.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredAyahs.map((ayah) => {
                  const ayahKey = `${ayah.surahNumber}:${ayah.verseNumber}`;
                  const isCopied = copiedAyahKey === ayahKey;
                  const matchedQueries = Object.keys(ayah.matchedWords);

                  return (
                    <div
                      key={ayahKey}
                      className={`p-3.5 rounded-[6px] border ${
                        isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#0E201E] border-[#264340]'
                      } space-y-2`}
                    >
                      {/* Ayah Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DED8C9]/60 dark:border-[#264340]/60 pb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-heading text-[#0F1419] dark:text-[#F4F0E7]">
                            سورة {ayah.surahName}
                          </span>
                          <span className="text-[11px] font-mono text-[#7B8885]">
                            [الآية {ayah.verseNumber} · جزء {ayah.juz} · ص {ayah.page}]
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[#EFECE2] dark:bg-[#122B2A] text-[#7B8885]">
                            {ayah.isMeccan ? 'مكية' : 'مدنية'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Matched Words Badges */}
                          <div className="flex items-center gap-1">
                            {matchedQueries.map(mq => {
                              const themeCol = wordColorMap[mq] || WORD_COLOR_THEMES[0];
                              const occurCount = ayah.matchedWords[mq]?.length || 0;
                              return (
                                <span 
                                  key={mq}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-[3px] font-bold border ${themeCol.badge}`}
                                >
                                  {mq} ({occurCount})
                                </span>
                              );
                            })}
                          </div>

                          {/* Copy Citation Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyAyah(ayah)}
                            title="نسخ الشاهد القرآني مع التوثيق"
                            className="p-1 rounded-[4px] text-[#7B8885] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Jump to Reader */}
                          <button
                            type="button"
                            onClick={() => onOpenInReader?.(ayah.surahNumber)}
                            title="الانتقال إلى قراءة المصحف"
                            className="p-1 rounded-[4px] text-[#7B8885] hover:text-[#1A5C5C] dark:hover:text-[#79A9A0] cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Highlighted Quranic Ayah Text */}
                      <div className="py-1">
                        {renderHighlightedAyah(ayah)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* الزر العائم للرجوع السريع من شواهد الآيات */}
      {activeTab === 'verses' && (returnContext || variantFilter) && (
        <div className="fixed bottom-6 start-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={handleReturnToPreviousContext}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A5C5C] hover:bg-[#134444] text-white text-xs font-bold shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-white/20 active:scale-95"
            title="الرجوع الفوري إلى حيث كنت"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0" />
            <span>الرجوع إلى {returnContext?.label || 'التفصيل الرياضي'}</span>
            {variantFilter && (
              <span className="font-heading px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">
                «{variantFilter}»
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Sliders, 
  Filter, 
  RotateCcw, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Check, 
  Layers, 
  Tag, 
  Info,
  Type
} from 'lucide-react';
import { LexicalFilterOptions, DEFAULT_LEXICAL_OPTIONS } from '../utils/lexicalFilters';
import { useTheme } from '../context/ThemeContext';

interface LexicalFilterControlPanelProps {
  options: LexicalFilterOptions;
  onChange: (newOptions: LexicalFilterOptions) => void;
  activeSurahsCount?: number;
  totalFilteredWords?: number;
}

export const LexicalFilterControlPanel: React.FC<LexicalFilterControlPanelProps> = ({
  options,
  onChange,
  activeSurahsCount = 2,
  totalFilteredWords,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [customWordInput, setCustomWordInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stopwords' | 'prefixes' | 'custom' | 'display'>('stopwords');

  // Count active non-default criteria
  const activeCriteriaCount = [
    options.excludePrepositions,
    options.excludeConjunctions,
    options.excludeParticles,
    options.excludePronounsAndNouns,
    options.stripWawPrefix,
    options.stripFaPrefix,
    options.stripBaPrefix,
    options.stripLamPrefix,
    options.stripAlPrefix,
    options.normalizeAlef,
    options.normalizeTaaMarbuta,
    options.normalizeYaa,
    options.minWordLength > 1,
    options.customExcludedWords.length > 0,
    options.ttrCalculationMode === 'filtered',
  ].filter(Boolean).length;

  const handleToggle = (key: keyof LexicalFilterOptions) => {
    onChange({
      ...options,
      [key]: !options[key],
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_LEXICAL_OPTIONS });
    setCustomWordInput('');
  };

  const handleAddCustomWord = () => {
    const trimmed = customWordInput.trim();
    if (!trimmed) return;
    if (options.customExcludedWords.includes(trimmed)) {
      setCustomWordInput('');
      return;
    }
    onChange({
      ...options,
      customExcludedWords: [...options.customExcludedWords, trimmed],
    });
    setCustomWordInput('');
  };

  const handleRemoveCustomWord = (word: string) => {
    onChange({
      ...options,
      customExcludedWords: options.customExcludedWords.filter(w => w !== word),
    });
  };

  // Presets
  const applyPresetRaw = () => {
    onChange({ ...DEFAULT_LEXICAL_OPTIONS });
  };

  const applyPresetConnectors = () => {
    onChange({
      ...options,
      excludePrepositions: true,
      excludeConjunctions: true,
      excludeParticles: true,
    });
  };

  const applyPresetPrefixes = () => {
    onChange({
      ...options,
      stripWawPrefix: true,
      stripFaPrefix: true,
      stripBaPrefix: true,
      stripLamPrefix: true,
    });
  };

  const applyPresetFullContent = () => {
    onChange({
      ...options,
      excludePrepositions: true,
      excludeConjunctions: true,
      excludeParticles: true,
      excludePronounsAndNouns: true,
      stripWawPrefix: true,
      stripFaPrefix: true,
      stripBaPrefix: true,
      stripLamPrefix: true,
      stripAlPrefix: true,
      minWordLength: 3,
      ttrCalculationMode: 'filtered',
    });
  };

  // Sample quick words for quick exclusion
  const sampleExclusions = ['قال', 'كان', 'جعل', 'يا', 'آمنوا', 'كفروا'];

  return (
    <div 
      id="lexical-filter-control-panel"
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isDark 
          ? 'bg-ink-900/90 border-ink-800' 
          : 'bg-white border-ink-200 shadow-sm'
      }`}
    >
      {/* HEADER BAR */}
      <div className={`p-4 flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-ink-900/60 border-b border-ink-800' : 'bg-ink-50/80 border-b border-ink-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${
            isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                خصائص ومعايير تصفية وتصنيف المفردات
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                activeCriteriaCount > 0 
                  ? isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  : isDark ? 'bg-ink-800 text-ink-400' : 'bg-ink-100 text-ink-500'
              }`}>
                {activeCriteriaCount > 0 ? `${activeCriteriaCount} معايير نشطة` : 'الوضع الأصلي الكامل (بدون إقصاء)'}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
              أنت تقرر استبعاد حروف الربط والجر أو اعتبار مثل «الله» و«والله» نتيجة واحدة
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          {activeCriteriaCount > 0 && (
            <button
              id="reset-lexical-filters-btn"
              onClick={handleReset}
              className={`px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
                isDark 
                  ? 'bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-white' 
                  : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
              title="إعادة تعيين كافة المعايير للوضع الأصلي"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين</span>
            </button>
          )}

          <button
            id="toggle-lexical-panel-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              isExpanded 
                ? isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white'
                : isDark ? 'bg-ink-800 text-emerald-400 hover:bg-ink-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'إخفاء لوحة المعايير' : 'تخصيص المعايير والفلاتر'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* QUICK PRESETS ROW (ALWAYS VISIBLE OR EXPANDABLE) */}
      <div className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b ${
        isDark ? 'bg-ink-900/40 border-ink-800/80 text-ink-400' : 'bg-white border-ink-100 text-ink-600'
      }`}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-[11px]">نماذج سريعة:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={applyPresetRaw}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              activeCriteriaCount === 0
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isDark ? 'bg-ink-800/80 hover:bg-ink-700 text-ink-300' : 'bg-ink-100 hover:bg-ink-200 text-ink-700'
            }`}
          >
            الوضع الأصلي الخام (كامل)
          </button>

          <button
            onClick={applyPresetConnectors}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              options.excludePrepositions && options.excludeConjunctions
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isDark ? 'bg-ink-800/80 hover:bg-ink-700 text-ink-300' : 'bg-ink-100 hover:bg-ink-200 text-ink-700'
            }`}
          >
            إقصاء حروف الجر والعطف
          </button>

          <button
            onClick={applyPresetPrefixes}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              options.stripWawPrefix && options.stripFaPrefix && options.stripBaPrefix
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isDark ? 'bg-ink-800/80 hover:bg-ink-700 text-ink-300' : 'bg-ink-100 hover:bg-ink-200 text-ink-700'
            }`}
          >
            توحيد السوابق («الله» = «والله» = «بالله»)
          </button>

          <button
            onClick={applyPresetFullContent}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              options.stripAlPrefix && options.excludePronounsAndNouns
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isDark ? 'bg-ink-800/80 hover:bg-ink-700 text-ink-300' : 'bg-ink-100 hover:bg-ink-200 text-ink-700'
            }`}
          >
            تصفية الكلمات الدلالية الموضوعية
          </button>
        </div>
      </div>

      {/* EXPANDABLE DETAILED CONTROLS */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* SUB-TABS NAVIGATION */}
          <div className="flex flex-wrap border-b border-ink-700/50 pb-2 gap-2">
            <button
              onClick={() => setActiveTab('stopwords')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'stopwords'
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'
                  : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>إقصاء حروف وأدوات المعاني</span>
              {(options.excludePrepositions || options.excludeConjunctions || options.excludeParticles || options.excludePronounsAndNouns) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('prefixes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'prefixes'
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'
                  : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>توحيد السوابق والزوائد («الله» و«والله»)</span>
              {(options.stripWawPrefix || options.stripFaPrefix || options.stripBaPrefix || options.stripLamPrefix || options.stripAlPrefix) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'custom'
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'
                  : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>استبعاد كلمات مخصصة يدويًا</span>
              {options.customExcludedWords.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {options.customExcludedWords.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('display')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'display'
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800'
                  : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>الرسم الإملائي وضوابط العرض و TTR</span>
            </button>
          </div>

          {/* TAB 1: STOPWORDS & PARTICLES */}
          {activeTab === 'stopwords' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Prepositions */}
              <label 
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                  options.excludePrepositions
                    ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                    : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                }`}
              >
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.excludePrepositions}
                      onChange={() => handleToggle('excludePrepositions')}
                      className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                      إقصاء حروف الجر
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                    مثل: «في»، «على»، «من»، «إلى»، «عن»، «حتى»، «مع»، «لدن»...
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  options.excludePrepositions 
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    : isDark ? 'text-ink-500' : 'text-ink-400'
                }`}>
                  {options.excludePrepositions ? 'مستبعد' : 'متضمن'}
                </span>
              </label>

              {/* Conjunctions */}
              <label 
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                  options.excludeConjunctions
                    ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                    : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                }`}
              >
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.excludeConjunctions}
                      onChange={() => handleToggle('excludeConjunctions')}
                      className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                      إقصاء حروف العطف والربط
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                    مثل: «و»، «فـ»، «ثم»، «أو»، «أم»، «بل»، «لكن»...
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  options.excludeConjunctions 
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    : isDark ? 'text-ink-500' : 'text-ink-400'
                }`}>
                  {options.excludeConjunctions ? 'مستبعد' : 'متضمن'}
                </span>
              </label>

              {/* Particles & Conditionals */}
              <label 
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                  options.excludeParticles
                    ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                    : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                }`}
              >
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.excludeParticles}
                      onChange={() => handleToggle('excludeParticles')}
                      className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                      إقصاء أدوات التوكيد والشرط والنفي
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                    مثل: «إن»، «أن»، «ما»، «لا»، «إلا»، «إذا»، «إذ»، «لم»، «لن»، «قد»...
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  options.excludeParticles 
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    : isDark ? 'text-ink-500' : 'text-ink-400'
                }`}>
                  {options.excludeParticles ? 'مستبعد' : 'متضمن'}
                </span>
              </label>

              {/* Pronouns & Demonstratives */}
              <label 
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                  options.excludePronounsAndNouns
                    ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                    : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                }`}
              >
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.excludePronounsAndNouns}
                      onChange={() => handleToggle('excludePronounsAndNouns')}
                      className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                      إقصاء الضمائر وأسماء الإشارة والموصول
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                    مثل: «هو»، «هي»، «هم»، «هذا»، «ذلك»، «الذي»، «الذين»، «أولئك»...
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  options.excludePronounsAndNouns 
                    ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    : isDark ? 'text-ink-500' : 'text-ink-400'
                }`}>
                  {options.excludePronounsAndNouns ? 'مستبعد' : 'متضمن'}
                </span>
              </label>
            </div>
          )}

          {/* TAB 2: PREFIX NORMALIZATION ("الله" = "والله") */}
          {activeTab === 'prefixes' && (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                isDark ? 'bg-emerald-950/30 border border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <p>
                  عند تفعيل خيارات دمج السوابق، تُجمع تصريفات الكلمة الواحدة معاً في نتيجة واحدة تلقائياً؛ فمثلاً تحت كلمة «الله» ستُجمع حالات «والله»، «فالله»، «بالله»، و«لله» مع الحفاظ على تفاصيل تكرار كل صيغة عند التمرير.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Strip Waw Prefix */}
                <label 
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    options.stripWawPrefix
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.stripWawPrefix}
                        onChange={() => handleToggle('stripWawPrefix')}
                        className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                        إلحاق واو العطف الزائدة (و)
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                      اعتبار «والله» و«الله»، أو «وقال» و«قال» كلمة واحدة
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    options.stripWawPrefix 
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                      : isDark ? 'text-ink-500' : 'text-ink-400'
                  }`}>
                    {options.stripWawPrefix ? 'مدمج' : 'منفصل'}
                  </span>
                </label>

                {/* Strip Fa Prefix */}
                <label 
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    options.stripFaPrefix
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.stripFaPrefix}
                        onChange={() => handleToggle('stripFaPrefix')}
                        className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                        إلحاق فاء العطف والسببية (فـ)
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                      اعتبار «فالله» و«الله»، أو «فقال» و«قال» كلمة واحدة
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    options.stripFaPrefix 
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                      : isDark ? 'text-ink-500' : 'text-ink-400'
                  }`}>
                    {options.stripFaPrefix ? 'مدمج' : 'منفصل'}
                  </span>
                </label>

                {/* Strip Ba Prefix */}
                <label 
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    options.stripBaPrefix
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.stripBaPrefix}
                        onChange={() => handleToggle('stripBaPrefix')}
                        className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                        إلحاق باء الجر والقسم (بـ)
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                      اعتبار «بالله» و«الله»، أو «بهداهم» و«هداهم» كلمة واحدة
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    options.stripBaPrefix 
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                      : isDark ? 'text-ink-500' : 'text-ink-400'
                  }`}>
                    {options.stripBaPrefix ? 'مدمج' : 'منفصل'}
                  </span>
                </label>

                {/* Strip Lam Prefix */}
                <label 
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    options.stripLamPrefix
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.stripLamPrefix}
                        onChange={() => handleToggle('stripLamPrefix')}
                        className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                        إلحاق لام الجر والابتداء (لـ / لله)
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                      اعتبار «لله» و«الله»، أو «للمؤمنين» و«مؤمنين» كلمة واحدة
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    options.stripLamPrefix 
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                      : isDark ? 'text-ink-500' : 'text-ink-400'
                  }`}>
                    {options.stripLamPrefix ? 'مدمج' : 'منفصل'}
                  </span>
                </label>

                {/* Strip Al- Prefix */}
                <label 
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-colors col-span-1 md:col-span-2 ${
                    options.stripAlPrefix
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700 hover:bg-ink-800/70' : 'bg-ink-50 border-ink-200 hover:bg-ink-100'
                  }`}
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.stripAlPrefix}
                        onChange={() => handleToggle('stripAlPrefix')}
                        className="rounded border-ink-700 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-ink-900'}`}>
                        تجريد أل التعريف (الـ)
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>
                      اعتبار المعرف بال مجرداً مثل: «الكتاب» و«كتاب»، «الأرض» و«أرض» (مع صيانة لفظ الجلالة والأسماء الموصولة)
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    options.stripAlPrefix 
                      ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                      : isDark ? 'text-ink-500' : 'text-ink-400'
                  }`}>
                    {options.stripAlPrefix ? 'مدمج' : 'منفصل'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM EXCLUDED WORDS */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomWord();
                    }
                  }}
                  placeholder="اكتب كلمة تريد إقصاءها من التصنيف واضغط إضافة (مثلاً: قال، كان، يا)..."
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border text-right ${
                    isDark 
                      ? 'bg-ink-800 border-ink-700 text-white placeholder-ink-500 focus:border-emerald-500' 
                      : 'bg-white border-ink-300 text-ink-900 placeholder-ink-400 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomWord}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة للإقصاء</span>
                </button>
              </div>

              {/* Suggestions Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className={`text-[11px] ${isDark ? 'text-ink-400' : 'text-ink-500'}`}>مقترحات سريعة للإقصاء:</span>
                {sampleExclusions.map(word => {
                  const isExcluded = options.customExcludedWords.includes(word);
                  return (
                    <button
                      key={word}
                      onClick={() => {
                        if (isExcluded) {
                          handleRemoveCustomWord(word);
                        } else {
                          onChange({
                            ...options,
                            customExcludedWords: [...options.customExcludedWords, word],
                          });
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                        isExcluded
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : isDark ? 'bg-ink-800 text-ink-300 hover:bg-ink-700' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                      }`}
                    >
                      {isExcluded ? `✕ ${word}` : `+ ${word}`}
                    </button>
                  );
                })}
              </div>

              {/* Active Excluded Words Chips */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-ink-300' : 'text-ink-700'}`}>
                    الكلمات المستبعدة حالياً ({options.customExcludedWords.length}):
                  </span>
                  {options.customExcludedWords.length > 0 && (
                    <button
                      onClick={() => onChange({ ...options, customExcludedWords: [] })}
                      className="text-[11px] text-red-400 hover:text-red-300 underline"
                    >
                      مسح جميع الكلمات المستبعدة
                    </button>
                  )}
                </div>

                {options.customExcludedWords.length === 0 ? (
                  <p className={`text-xs italic p-3 text-center rounded border border-dashed ${
                    isDark ? 'border-ink-800 text-ink-500' : 'border-ink-200 text-ink-400'
                  }`}>
                    لا توجد كلمات مستبعدة يدوياً حالياً. اكتب أي كلمة أعلاه لإقصائها من الترتيب فوراً.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-ink-800/30 border border-ink-800/50">
                    {options.customExcludedWords.map(word => (
                      <span
                        key={word}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60' : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <span>{word}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomWord(word)}
                          className="hover:opacity-75 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ORTHOGRAPHY, LENGTH & TTR */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              {/* Orthography Toggles */}
              <div className="space-y-2">
                <h4 className={`text-xs font-bold ${isDark ? 'text-ink-200' : 'text-ink-800'}`}>
                  توحيد الرسم الإملائي:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer ${
                    options.normalizeAlef
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700' : 'bg-ink-50 border-ink-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.normalizeAlef}
                        onChange={() => handleToggle('normalizeAlef')}
                        className="rounded border-ink-700 text-emerald-500"
                      />
                      <span className="text-xs font-medium">توحيد الألفات (أ / إ / آ / ٱ → ا)</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer ${
                    options.normalizeTaaMarbuta
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700' : 'bg-ink-50 border-ink-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.normalizeTaaMarbuta}
                        onChange={() => handleToggle('normalizeTaaMarbuta')}
                        className="rounded border-ink-700 text-emerald-500"
                      />
                      <span className="text-xs font-medium">توحيد التاء المربوطة (ة → ه)</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer ${
                    options.normalizeYaa
                      ? isDark ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-emerald-50 border-emerald-300'
                      : isDark ? 'bg-ink-800/40 border-ink-700' : 'bg-ink-50 border-ink-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={options.normalizeYaa}
                        onChange={() => handleToggle('normalizeYaa')}
                        className="rounded border-ink-700 text-emerald-500"
                      />
                      <span className="text-xs font-medium">توحيد الياء والمقصورة (ى → ي)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Length and Display Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-ink-700/50">
                {/* Min Word Length */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${isDark ? 'text-ink-300' : 'text-ink-700'}`}>
                    الحد الأدنى لطول الكلمة:
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-ink-700/60 p-0.5 bg-ink-800/30">
                    {[1, 2, 3, 4].map(len => (
                      <button
                        key={len}
                        onClick={() => onChange({ ...options, minWordLength: len })}
                        className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                          options.minWordLength === len
                            ? 'bg-emerald-600 text-white'
                            : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
                        }`}
                      >
                        {len === 1 ? 'الكل' : `${len}+ حروف`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Words Count */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${isDark ? 'text-ink-300' : 'text-ink-700'}`}>
                    عدد الكلمات في القائمة:
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-ink-700/60 p-0.5 bg-ink-800/30">
                    {[5, 10, 15, 20].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => onChange({ ...options, topWordsCount: cnt })}
                        className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                          options.topWordsCount === cnt
                            ? 'bg-emerald-600 text-white'
                            : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TTR Calculation Mode */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${isDark ? 'text-ink-300' : 'text-ink-700'}`}>
                    طريقة حساب التنوع المعجمي (TTR):
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-ink-700/60 p-0.5 bg-ink-800/30">
                    <button
                      onClick={() => onChange({ ...options, ttrCalculationMode: 'raw' })}
                      className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                        options.ttrCalculationMode === 'raw'
                          ? 'bg-emerald-600 text-white'
                          : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
                      }`}
                      title="المفردات الفريدة ÷ إجمالي كلمات السورة الأصلية"
                    >
                      شامل (Raw)
                    </button>
                    <button
                      onClick={() => onChange({ ...options, ttrCalculationMode: 'filtered' })}
                      className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                        options.ttrCalculationMode === 'filtered'
                          ? 'bg-emerald-600 text-white'
                          : isDark ? 'text-ink-400 hover:text-white' : 'text-ink-600 hover:text-ink-900'
                      }`}
                      title="المفردات الفريدة المصفاة ÷ إجمالي الكلمات بعد الفلترة"
                    >
                      مُصفى (Filtered)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

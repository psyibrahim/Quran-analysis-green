import React, { useState, useMemo } from 'react';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useTheme } from '../context/ThemeContext';
import { SurahData, LetterStatsData, GlobalLetterStat } from '../types';
import { 
  MUQATTAAT_SURAHS, 
  SURAH_FAMILIES, 
  SurahFamilyMeta, 
  MuqattaatSurahMeta 
} from '../utils/surahFamilies';
import { HawameemLab } from './HawameemLab';
import { MuqattaatVerseHeatmap } from './MuqattaatVerseHeatmap';
import { 
  Sparkles, 
  Layers, 
  Search, 
  BookOpen, 
  Flame, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Scale,
  Award,
  ChevronLeft
} from 'lucide-react';
import { ARABIC_LETTER_NAMES, formatSurahName } from '../utils/arabic';
import { SectionHelpButton } from './SectionHelpModal';

interface OpeningsAndFamiliesLabProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onCompareWith?: (surahNumber: number) => void;
}

const OpeningsAndFamiliesLabComponent: React.FC<OpeningsAndFamiliesLabProps> = ({
  surahs,
  letterStats,
  onSelectSurah,
  onOpenInReader,
  onCompareWith
}) => {
  const { theme } = useTheme();
  const { corpus } = useQuranCorpus();
  const isDark = theme === 'dark';
  const isLight = !isDark;

  const [activeMainTab, setActiveMainTab] = useState<'muqattaat' | 'hawameem' | 'families'>('muqattaat');
  const [selectedMuqattaatSurah, setSelectedMuqattaatSurah] = useState<number>(2); // Al-Baqarah
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('musabbihat');
  const [muqattaatSearch, setMuqattaatSearch] = useState<string>('');

  // Selected Muqatta'at Surah Metadata
  const currentMuqattaat = useMemo(() => {
    return MUQATTAAT_SURAHS.find(m => m.surahNumber === selectedMuqattaatSurah) || MUQATTAAT_SURAHS[0];
  }, [selectedMuqattaatSurah]);

  // Selected SurahData
  const currentSurahData = useMemo(() => {
    return surahs.find(s => s.number === selectedMuqattaatSurah) || surahs[0];
  }, [surahs, selectedMuqattaatSurah]);

  // Selected SurahCorpus for verse texts and verse-by-verse heatmap
  const currentSurahCorpus = useMemo(() => {
    return corpus.find(c => c.number === selectedMuqattaatSurah);
  }, [corpus, selectedMuqattaatSurah]);

  // Selected Family Metadata
  const currentFamily = useMemo(() => {
    return SURAH_FAMILIES.find(f => f.id === selectedFamilyId) || SURAH_FAMILIES[1];
  }, [selectedFamilyId]);

  // Family aggregate statistics
  const familyStats = useMemo(() => {
    const familySurahs = surahs.filter(s => currentFamily.surahNumbers.includes(s.number));
    const totalAyahs = familySurahs.reduce((acc, s) => acc + (s.totalAyahs || 0), 0);
    const totalWords = familySurahs.reduce((acc, s) => acc + (s.totalWords || 0), 0);
    const totalChars = familySurahs.reduce((acc, s) => acc + (s.totalChars || s.letters?.totalLettersPlain || 0), 0);
    const avgVerseLength = totalAyahs > 0 ? Number((totalWords / totalAyahs).toFixed(1)) : 0;

    return {
      count: familySurahs.length,
      surahs: familySurahs,
      totalAyahs,
      totalWords,
      totalChars,
      avgVerseLength
    };
  }, [surahs, currentFamily]);

  // Muqatta'at letter frequency analysis inside the selected surah
  const openingLettersStats = useMemo(() => {
    if (!currentSurahData || !letterStats || !currentMuqattaat) return [];

    const plainCounts = currentSurahData.letters?.plainCounts || {};
    const plainPercentages = currentSurahData.letters?.plainPercentages || {};
    const globalStats = letterStats.globalStats || {};

    // Total Quran letters across all 28 letters
    const statsList: GlobalLetterStat[] = Object.values(globalStats);
    const totalQuranLetters: number = statsList.reduce((acc: number, stat: GlobalLetterStat) => acc + (stat?.totalOccurrences || 0), 0) || 1;

    return currentMuqattaat.letters.map(letter => {
      const count = plainCounts[letter] || 0;
      const percentageInSurah = plainPercentages[letter] 
        ? Number(plainPercentages[letter].toFixed(2)) 
        : (currentSurahData.totalChars > 0 ? Number(((count / currentSurahData.totalChars) * 100).toFixed(2)) : 0);

      const stat: GlobalLetterStat | undefined = globalStats[letter];
      const quranOccurrences = stat ? stat.totalOccurrences : 0;
      const quranAvg = Number(((quranOccurrences / totalQuranLetters) * 100).toFixed(2));
      const relativeRatio = quranAvg > 0 ? Number((percentageInSurah / quranAvg).toFixed(2)) : 1;

      return {
        letter,
        letterName: ARABIC_LETTER_NAMES[letter] || (stat?.name) || letter,
        count,
        percentageInSurah,
        quranAvg,
        relativeRatio,
        isHigherThanAverage: percentageInSurah >= quranAvg
      };
    });
  }, [currentSurahData, currentMuqattaat, letterStats]);

  // Filtered 29 Muqatta'at Surahs
  const filteredMuqattaat = useMemo(() => {
    return MUQATTAAT_SURAHS.filter(m => {
      const search = muqattaatSearch.trim();
      if (!search) return true;
      return m.surahName.includes(search) || 
        m.openingText.includes(search) || 
        m.surahNumber.toString() === search;
    });
  }, [muqattaatSearch]);

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#142825] via-[#10211F] to-[#142825] border-[#264340] shadow-xl' 
          : 'bg-gradient-to-r from-[#FBF9F2] via-[#F7F4EA] to-[#FBF9F2] border-[#DED8C9] shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1A5C5C] to-[#2B7470] text-white shadow-lg shadow-[#1A5C5C]/20">
              <Sparkles className="w-6 h-6 text-[#E0C088]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                  مختبر عوائل السور وفواتح الحروف المقطعة
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isLight 
                    ? 'bg-[#C5A16A]/15 text-[#8C6D2D] border-[#C5A16A]/30' 
                    : 'bg-[#C5A16A]/15 text-[#E0C088] border-[#C5A16A]/30'
                }`}>
                  29 سورة مقطعة + عوائل القرآن
                </span>
                <SectionHelpButton 
                  guideId="openings-and-families-lab" 
                  variant="button" 
                  title="استعلام ودليل مختبر الفواتح والعوائل" 
                />
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                دراسة إحصائية مجمعة للسور المبدوءة بفواتح الحروف المقطعة (الم، حم، الر، طسم...)، وتحليل عوائل السور القرآنية (الحواميم، المسبحات، الطواسين، الزهراوان).
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
            isLight ? 'bg-[#EDE8D8] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
          }`}>
            <button
              onClick={() => setActiveMainTab('muqattaat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMainTab === 'muqattaat'
                  ? 'bg-[#1A5C5C] text-white shadow-md'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A16A]" />
              فواتح الحروف الـ 29
            </button>
            <button
              onClick={() => setActiveMainTab('hawameem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMainTab === 'hawameem'
                  ? 'bg-[#1A5C5C] text-white shadow-md'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#C5A16A]" />
              عائلة الحواميم السبع (آل حم)
            </button>
            <button
              onClick={() => setActiveMainTab('families')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeMainTab === 'families'
                  ? 'bg-[#1A5C5C] text-white shadow-md'
                  : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#C5A16A]" />
              عوائل السور (المسبحات، الطواسين...)
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab 1: The 29 Muqatta'at Surahs */}
      {activeMainTab === 'muqattaat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: 29 Surahs Directory */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                <span>سور الفواتح المقطعة</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#C5A16A]/15 text-[#8C6D2D] dark:text-[#E0C088] font-mono">
                  29 سورة
                </span>
              </h2>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                placeholder="ابحث بالاسم أو الفاتحة (مثل: الر، حم)..."
                value={muqattaatSearch}
                onChange={(e) => setMuqattaatSearch(e.target.value)}
                className={`w-full px-3 py-1.5 pl-8 rounded-lg text-xs border outline-none ${
                  isLight 
                    ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419] placeholder-[#7C8B89] focus:border-[#1A5C5C]' 
                    : 'bg-[#10211F] border-[#264340] text-[#F4F0E7] placeholder-[#6B8580] focus:border-[#2B7470]'
                }`}
              />
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`} />
            </div>

            <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredMuqattaat.map(m => {
                const isSelected = m.surahNumber === selectedMuqattaatSurah;
                return (
                  <button
                    key={m.surahNumber}
                    onClick={() => setSelectedMuqattaatSurah(m.surahNumber)}
                    className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      isSelected
                        ? isLight 
                          ? 'bg-[#1A5C5C]/10 border-[#1A5C5C] text-[#1A5C5C] font-bold shadow-xs' 
                          : 'bg-[#1A5C5C]/20 border-[#2B7470] text-[#E0C088] font-bold'
                        : isLight
                        ? 'bg-[#F7F4EA] border-[#DED8C9] hover:bg-white text-[#0F1419]'
                        : 'bg-[#10211F] border-[#264340] hover:bg-[#163331] text-[#F4F0E7]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-[#EDE8D8] text-[#53605E]' : 'bg-[#183431] text-[#A8BCB9]'
                      }`}>
                        {m.surahNumber}
                      </span>
                      <div className="min-w-0 truncate">
                        <div className={`text-sm truncate font-serif font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                          {formatSurahName(m.surahName)}
                        </div>
                        <div className={`text-[10px] truncate ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                          {m.meaningSummary}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-left">
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs border ${
                        isLight 
                          ? 'bg-[#C5A16A]/15 text-[#8C6D2D] border-[#C5A16A]/30' 
                          : 'bg-[#C5A16A]/20 text-[#E0C088] border-[#C5A16A]/30'
                      }`}>
                        {m.openingText}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Selected Surah Letter Analysis */}
          <div className="lg:col-span-2 space-y-4">
            {/* Surah Detail Header Card */}
            <div className={`p-5 rounded-2xl border ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'}`}>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
              }`}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className={`text-lg font-bold font-serif ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                      {formatSurahName(currentMuqattaat.surahName)}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-lg font-bold font-serif text-sm border ${
                      isLight 
                        ? 'bg-[#C5A16A]/15 text-[#8C6D2D] border-[#C5A16A]/30' 
                        : 'bg-[#C5A16A]/20 text-[#E0C088] border-[#C5A16A]/30'
                    }`}>
                      {currentMuqattaat.openingText}
                    </span>
                    <span className={`text-xs ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                      ({currentSurahData.totalAyahs} آية | {(currentSurahData.totalChars || currentSurahData.letters?.totalLettersPlain)?.toLocaleString()} حرف)
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                    {currentMuqattaat.meaningSummary} — دراسة كثافة حروف الفاتحة في السورة مقابل متوسط القرآن.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenInReader && (
                    <button
                      onClick={() => onOpenInReader(currentMuqattaat.surahNumber)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                        isLight 
                          ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419] hover:bg-[#1A5C5C] hover:text-white hover:border-[#1A5C5C]' 
                          : 'bg-[#10211F] border-[#264340] text-[#F4F0E7] hover:bg-[#1A5C5C] hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      فتح في المصحف
                    </button>
                  )}
                  {onSelectSurah && (
                    <button
                      onClick={() => onSelectSurah(currentSurahData)}
                      className="px-3 py-1.5 rounded-lg bg-[#1A5C5C] hover:bg-[#236e6e] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A16A]" />
                      التحليل الشامل
                    </button>
                  )}
                </div>
              </div>

              {/* Letter Frequencies Comparison Cards */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {openingLettersStats.map(stat => (
                  <div 
                    key={stat.letter}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg font-bold font-mono text-base flex items-center justify-center ${
                          isLight ? 'bg-[#EDE8D8] text-[#1A5C5C]' : 'bg-[#183431] text-[#C5A16A]'
                        }`}>
                          {stat.letter}
                        </span>
                        <div>
                          <div className={`text-xs font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                            حرف {stat.letterName}
                          </div>
                          <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                            {stat.count} تكرار
                          </div>
                        </div>
                      </div>

                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                        stat.isHigherThanAverage
                          ? isLight 
                            ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border-[#1A5C5C]/30' 
                            : 'bg-[#1A5C5C]/20 text-[#A8BCB9] border-[#1A5C5C]/30'
                          : isLight 
                            ? 'bg-[#EDE8D8] text-[#53605E] border-[#DED8C9]' 
                            : 'bg-[#183431] text-[#6B8580] border-[#264340]'
                      }`}>
                        {stat.relativeRatio}x
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[11px]">
                      <div className={`flex justify-between ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                        <span>نسبته في السورة:</span>
                        <span className={`font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#C5A16A]'}`}>{stat.percentageInSurah}%</span>
                      </div>
                      <div className={`flex justify-between ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>
                        <span>معدله في القرآن:</span>
                        <span className="font-mono">{stat.quranAvg}%</span>
                      </div>
                    </div>

                    <div className={`mt-2 w-full h-1.5 rounded-full overflow-hidden ${
                      isLight ? 'bg-[#EDE8D8]' : 'bg-[#183431]'
                    }`}>
                      <div 
                        className={`h-full rounded-full ${stat.isHigherThanAverage ? 'bg-[#1A5C5C]' : 'bg-[#C5A16A]'}`}
                        style={{ width: `${Math.min(100, stat.relativeRatio * 50)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Academic Scholarly Notes */}
              <div className={`mt-4 p-3.5 rounded-xl border text-xs leading-relaxed ${
                isLight 
                  ? 'bg-[#EDE8D8]/60 border-[#DED8C9] text-[#0F1419]' 
                  : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'
              }`}>
                <span className={`font-bold ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>ملاحظة بحثية: </span>
                تناولت دراسات الإعجاز العددي واللساني (مثل أبحاث د. عبد الرزاق نوفل ود. رشاد خليفة وغيرهما) فرضية أن الحروف المقطعة في فواتح السور تحظى بنسب تردد نوعية داخل سورها. يُظهر هذا الجدول الأرقام الإحصائية المحايدة والدقيقة لاختبار هذه الفرضيات علمياً دون تكلف.
              </div>
            </div>

            {/* Verse-by-verse Heatmap and In-Depth Surah Frequency Analysis */}
            <MuqattaatVerseHeatmap
              surahData={currentSurahData}
              muqattaatMeta={currentMuqattaat}
              ayahs={currentSurahCorpus?.ayahs || []}
              letterStats={letterStats}
              onOpenInReader={onOpenInReader}
            />
          </div>
        </div>
      )}

      {/* Main Tab 2: The 7 Hawameem (Integrated from previous Lab) */}
      {activeMainTab === 'hawameem' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-orange-400" />
            <span>
              عائلة الحواميم السبع (السور 40 إلى 46 المفتتحة بـ حم): تم دمج كافة أدواتها (الخريطة الحرارية 7×28، ورادار الحروف، ومصفوفة التشابه، وفلك الفواتح) في هذه اللوحة الشاملة.
            </span>
          </div>

          <HawameemLab 
            surahs={surahs}
            letterStats={letterStats}
            onSelectSurah={onSelectSurah}
            onOpenInReader={onOpenInReader}
            onCompareWith={onCompareWith}
          />
        </div>
      )}

      {/* Main Tab 3: Other Surah Families (المسبحات، الطواسين، ذوات الم، ذوات الر...) */}
      {activeMainTab === 'families' && (
        <div className="space-y-4">
          {/* Families Selector Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {SURAH_FAMILIES.filter(f => f.id !== 'hawameem').map(family => (
              <button
                key={family.id}
                onClick={() => setSelectedFamilyId(family.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  family.id === selectedFamilyId
                    ? 'bg-[#1A5C5C] text-white border-[#1A5C5C] shadow-md'
                    : isLight
                    ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#53605E] hover:bg-[#F7F4EA] hover:text-[#0F1419]'
                    : 'bg-[#142825] border-[#264340] text-[#A8BCB9] hover:bg-[#1A332F] hover:text-[#F4F0E7]'
                }`}
              >
                {family.name}
              </button>
            ))}
          </div>

          {/* Current Family Header & Stats */}
          <div className={`p-5 rounded-2xl border ${isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className={`text-lg font-bold font-serif ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                  {currentFamily.nameWithPrefix}
                </h2>
                <p className={`text-xs mt-1 max-w-2xl ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                  {currentFamily.description}
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isLight 
                  ? 'bg-[#C5A16A]/15 text-[#8C6D2D] border-[#C5A16A]/30' 
                  : 'bg-[#C5A16A]/20 text-[#E0C088] border-[#C5A16A]/30'
              }`}>
                {familyStats.count} سور قرآنية
              </span>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'}`}>
                <div className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>إجمالي الآيات</div>
                <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>
                  {familyStats.totalAyahs.toLocaleString()}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'}`}>
                <div className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>إجمالي الكلمات</div>
                <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`}>
                  {familyStats.totalWords.toLocaleString()}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'}`}>
                <div className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>إجمالي الحروف</div>
                <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>
                  {familyStats.totalChars.toLocaleString()}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'}`}>
                <div className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>متوسط طول الآية</div>
                <div className={`text-xl font-bold font-mono mt-1 ${isLight ? 'text-[#1A5C5C]' : 'text-[#A3E635]'}`}>
                  {familyStats.avgVerseLength} <span className={`text-[10px] font-sans ${isLight ? 'text-[#7C8B89]' : 'text-[#6B8580]'}`}>كلمة/آية</span>
                </div>
              </div>
            </div>

            {/* Surahs in this family */}
            <div className="mt-5">
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                سور هذه العائلة:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {familyStats.surahs.map(s => (
                  <div 
                    key={s.number}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isLight ? 'bg-[#F7F4EA] border-[#DED8C9] hover:bg-white' : 'bg-[#10211F] border-[#264340] hover:bg-[#163331]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center ${
                        isLight ? 'bg-[#EDE8D8] text-[#1A5C5C]' : 'bg-[#183431] text-[#C5A16A]'
                      }`}>
                        {s.number}
                      </span>
                      <div>
                        <div className={`font-bold font-serif text-sm ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                          {formatSurahName(s.name)}
                        </div>
                        <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                          {s.totalAyahs} آية • {s.isMeccan ? 'مكية' : 'مدنية'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenInReader && (
                        <button
                          onClick={() => onOpenInReader(s.number)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isLight 
                              ? 'bg-[#EDE8D8] text-[#53605E] hover:bg-[#1A5C5C] hover:text-white' 
                              : 'bg-[#183431] text-[#A8BCB9] hover:bg-[#1A5C5C] hover:text-white'
                          }`}
                          title="فتح في المصحف"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onSelectSurah && (
                        <button
                          onClick={() => onSelectSurah(s)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isLight 
                              ? 'bg-[#EDE8D8] text-[#8C6D2D] hover:bg-[#1A5C5C] hover:text-white' 
                              : 'bg-[#183431] text-[#E0C088] hover:bg-[#1A5C5C] hover:text-white'
                          }`}
                          title="التحليل التفصيلي"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OpeningsAndFamiliesLab = React.memo(OpeningsAndFamiliesLabComponent);
export default OpeningsAndFamiliesLab;

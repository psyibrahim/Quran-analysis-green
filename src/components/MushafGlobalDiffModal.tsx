import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Download, 
  Printer, 
  ExternalLink, 
  Sparkles, 
  Split, 
  GitMerge, 
  ArrowRightLeft, 
  Layers,
  ChevronLeft,
  BookOpen
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { QuranSurahCorpus, IndependentMushafDataset } from '../types';
import { formatSurahName } from '../utils/arabic';
import { analyzeSurahDivergence, WordTokenAnalysis, AyahShiftInfo } from '../utils/mushafVerseDiff';
import { exportMushafDiffsToCSV, printFormattedReport, DiffExportRow } from '../utils/exportData';

interface GlobalDiffItem {
  id: string;
  surahNumber: number;
  surahName: string;
  kufiAyahNumber: number;
  madaniAyahNumbers: number[];
  type: 'lexical' | 'reading' | 'shifted' | 'split' | 'merged';
  typeLabel: string;
  kufiSnippet: string;
  madaniSnippet: string;
  kufiFullText: string;
  madaniFullText: string;
  explanation: string;
}

interface MushafGlobalDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  kufiCorpus?: QuranSurahCorpus[];
  madaniCorpus?: QuranSurahCorpus[];
  kufiDataset?: IndependentMushafDataset;
  madaniDataset?: IndependentMushafDataset;
  onSelectSurahAndAyah?: (surahNum: number, ayahNum: number) => void;
  onJumpToSurahAyah?: (surahNum: number, ayahNum: number) => void;
}

export const MushafGlobalDiffModal: React.FC<MushafGlobalDiffModalProps> = ({
  isOpen,
  onClose,
  kufiCorpus,
  madaniCorpus,
  kufiDataset,
  madaniDataset,
  onSelectSurahAndAyah,
  onJumpToSurahAyah
}) => {
  const actualKufiCorpus = kufiCorpus || kufiDataset?.corpus || [];
  const actualMadaniCorpus = madaniCorpus || madaniDataset?.corpus || [];
  const handleSelect = onSelectSurahAndAyah || onJumpToSurahAyah || (() => {});
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSurahFilter, setSelectedSurahFilter] = useState<number | 'all'>('all');

  // Compute all differences across the 114 Surahs (Memoized)
  const allGlobalDiffs = useMemo<GlobalDiffItem[]>(() => {
    if (!actualKufiCorpus || !actualMadaniCorpus || actualKufiCorpus.length === 0) return [];

    const results: GlobalDiffItem[] = [];

    actualKufiCorpus.forEach(kSurah => {
      const mSurah = actualMadaniCorpus.find(s => s.number === kSurah.number);
      if (!mSurah) return;

      const analysis = analyzeSurahDivergence(kSurah.number, kSurah.ayahs, mSurah.ayahs);

      // 1. Process Ayah shift discrepancies (split, merged, shifted)
      analysis.kufiShiftMap.forEach((info, ayahNum) => {
        if (info.type === 'split') {
          const kAyah = kSurah.ayahs[ayahNum - 1];
          const mTexts = info.mappedNumbers.map(n => mSurah.ayahs[n - 1]?.textUthmani || '').join(' ۞ ');
          results.push({
            id: `split-${kSurah.number}-${ayahNum}`,
            surahNumber: kSurah.number,
            surahName: kSurah.name,
            kufiAyahNumber: ayahNum,
            madaniAyahNumbers: info.mappedNumbers,
            type: 'split',
            typeLabel: 'انقسام فاصلة (آية كوفية تقابل آيتين مدنيتين)',
            kufiSnippet: kAyah?.textUthmani || '',
            madaniSnippet: mTexts,
            kufiFullText: kAyah?.textUthmani || '',
            madaniFullText: mTexts,
            explanation: `الآية الكوفية رقم ${ayahNum} قُسمت في مصحف المدينة إلى الآيات (${info.mappedNumbers.join('، ')})`
          });
        } else if (info.type === 'merged') {
          const kAyah = kSurah.ayahs[ayahNum - 1];
          const mText = mSurah.ayahs[info.mappedNumbers[0] - 1]?.textUthmani || '';
          results.push({
            id: `merged-${kSurah.number}-${ayahNum}`,
            surahNumber: kSurah.number,
            surahName: kSurah.name,
            kufiAyahNumber: ayahNum,
            madaniAyahNumbers: info.mappedNumbers,
            type: 'merged',
            typeLabel: 'دمج فواصل (جمع آيات في آية مدنية واحدة)',
            kufiSnippet: kAyah?.textUthmani || '',
            madaniSnippet: mText,
            kufiFullText: kAyah?.textUthmani || '',
            madaniFullText: mText,
            explanation: `الآية الكوفية رقم ${ayahNum} مدمجة ضمن الآية المدنية رقم ${info.mappedNumbers.join('، ')}`
          });
        }
      });

      // 2. Process Word differences (lexical and reading differences)
      analysis.kufiWordDiffs.forEach((tokens, ayahNum) => {
        const diffTokens = tokens.filter(t => t.type !== 'identical');
        if (diffTokens.length > 0) {
          const kAyah = kSurah.ayahs[ayahNum - 1];
          const shift = analysis.kufiShiftMap.get(ayahNum);
          const mAyahNums = shift?.mappedNumbers || [ayahNum];
          const mTexts = mAyahNums.map(n => mSurah.ayahs[n - 1]?.textUthmani || '').join(' ');

          const hasLex = diffTokens.some(t => t.type === 'lexical_diff');
          const kSnippet = diffTokens.map(t => t.raw).join(' | ');
          const mSnippet = diffTokens.map(t => t.partner || '').filter(Boolean).join(' | ');

          results.push({
            id: `word-${kSurah.number}-${ayahNum}`,
            surahNumber: kSurah.number,
            surahName: kSurah.name,
            kufiAyahNumber: ayahNum,
            madaniAyahNumbers: mAyahNums,
            type: hasLex ? 'lexical' : 'reading',
            typeLabel: hasLex ? 'فروق رسم وكلمات (زيادة/نقصان حروف)' : 'فروق فرش وقراءات (حركات، ألفات خنجرية، همزات)',
            kufiSnippet: kSnippet,
            madaniSnippet: mSnippet || mTexts.slice(0, 80),
            kufiFullText: kAyah?.textUthmani || '',
            madaniFullText: mTexts,
            explanation: diffTokens.map(t => t.explanation).filter(Boolean).join(' ؛ ') || 'اختلاف في اللفظ والرسم القرآني'
          });
        }
      });
    });

    return results;
  }, [kufiCorpus, madaniCorpus]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return allGlobalDiffs.filter(item => {
      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }
      // Surah filter
      if (selectedSurahFilter !== 'all' && item.surahNumber !== selectedSurahFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inKufi = item.kufiFullText.toLowerCase().includes(q) || item.kufiSnippet.toLowerCase().includes(q);
        const inMadani = item.madaniFullText.toLowerCase().includes(q) || item.madaniSnippet.toLowerCase().includes(q);
        const inSurah = item.surahName.toLowerCase().includes(q);
        const inExp = item.explanation.toLowerCase().includes(q);
        return inKufi || inMadani || inSurah || inExp;
      }
      return true;
    });
  }, [allGlobalDiffs, selectedType, selectedSurahFilter, searchQuery]);

  if (!isOpen) return null;

  // Handle Export CSV
  const handleExportCSV = () => {
    const exportRows: DiffExportRow[] = filteredItems.map(item => ({
      surahNumber: item.surahNumber,
      surahName: item.surahName,
      ayahNumber: item.kufiAyahNumber,
      diffType: item.typeLabel,
      kufiText: item.kufiSnippet || item.kufiFullText,
      madaniText: item.madaniSnippet || item.madaniFullText,
      details: item.explanation
    }));
    exportMushafDiffsToCSV(exportRows, `Mushaf_Global_Differences_${filteredItems.length}_records.csv`);
  };

  // Handle Printable PDF Report
  const handlePrintReport = () => {
    const tableRowsHtml = filteredItems.slice(0, 300).map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${formatSurahName(item.surahName)}</strong> (آية ${item.kufiAyahNumber})</td>
        <td><span class="badge" style="background:#DCE9E5;color:#164B4B;">${item.typeLabel}</span></td>
        <td class="font-quran-hafs" style="color:#10211F;">${item.kufiSnippet || item.kufiFullText}</td>
        <td class="font-quran-warsh" style="color:#047857;">${item.madaniSnippet || item.madaniFullText}</td>
        <td style="font-size:11px;color:#53605E;">${item.explanation}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="margin-bottom:15px;padding:10px;background:#F8F6EF;border-radius:8px;border:1px solid #E2DDCF;font-size:13px;">
        <strong>ملخص البحث والاستخراج:</strong>
        تم العثور على <strong>${filteredItems.length}</strong> موضع اختلاف بين مصحف الكوفة (حفص) ومصحف المدينة (ورش) عبر القرآن الكريم.
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th style="width:140px;">السورة والآية</th>
            <th style="width:150px;">نوع الخلاف</th>
            <th>مصحف الكوفة (حفص)</th>
            <th>مصحف المدينة (ورش)</th>
            <th style="width:180px;">البيان والإيضاح</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
      ${filteredItems.length > 300 ? '<p style="margin-top:10px;color:#b91c1c;font-size:11px;">* تم عرض أول 300 موضع لضمان جودة وتناسق ملف الطباعة.</p>' : ''}
    `;

    printFormattedReport(
      'معجم فروق المصاحف الشامل (حفص عن عاصم - ورش عن نافع)',
      `إجمالي النتائج: ${filteredItems.length} موضع في القرآن الكريم`,
      htmlContent
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419]' : 'bg-[#142825] border-[#264340] text-[#E0C088]'
      }`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
              isLight ? 'bg-[#F0EDE1] border-[#DED8C9] text-[#1A5C5C]' : 'bg-[#163330] border-[#264340] text-[#52C592]'
            }`}>
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>معجم البحث الشامل في فروق الفرش والرسم والفواصل</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                  isLight ? 'bg-[#F0EDE1] text-[#1A5C5C] border border-[#DED8C9]' : 'bg-[#163330] text-[#52C592] border border-[#264340]'
                }`}>
                  {filteredItems.length} موضع
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'} mt-0.5`}>
                استعراض وبحث فوري لكافة مواضع اختلاف الرسم والقراءات وزحزحة الآي بين روايتي حفص وورش عبر الـ 114 سورة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isLight ? 'bg-[#FBF9F2] hover:bg-[#F0EDE1] border-[#DED8C9] text-[#0F1419]' : 'bg-[#163330] hover:bg-[#1C423E] border-[#264340] text-[#E0C088]'
              }`}
              title="تصدير النتائج إلى ملف Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={handlePrintReport}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isLight ? 'bg-[#FBF9F2] hover:bg-[#F0EDE1] border-[#DED8C9] text-[#0F1419]' : 'bg-[#163330] hover:bg-[#1C423E] border-[#264340] text-[#E0C088]'
              }`}
              title="طباعة منسقة أو حفظ كـ PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#52C592]" />
              <span>طباعة / PDF</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isLight ? 'hover:bg-[#F0EDE1] text-[#53605E]' : 'hover:bg-[#163330] text-[#8FA09C]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className={`p-3 sm:p-4 border-b flex flex-col md:flex-row gap-3 items-center justify-between ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8885]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بكلمة أو جزء آية (مثل: سارعوا، ملك، ووصى)..."
              className={`w-full pr-9 pl-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                isLight 
                  ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419] placeholder-[#7B8885] focus:border-[#1A5C5C] shadow-2xs' 
                  : 'bg-[#163330] border-[#264340] text-[#E0C088] placeholder-[#7B8885] focus:border-[#52C592]'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filters & Surah Dropdown */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Pills */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-bold ${
              isLight ? 'bg-[#FBF9F2] border-[#DED8C9] shadow-2xs' : 'bg-[#10211F] border-[#264340]'
            }`}>
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedType === 'all'
                    ? 'bg-[#1A5C5C] text-[#F7F4EA] font-black'
                    : isLight ? 'text-[#53605E] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088]'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSelectedType('lexical')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedType === 'lexical'
                    ? isLight ? 'bg-rose-700 text-white font-black' : 'bg-rose-600 text-white font-black'
                    : isLight ? 'text-[#53605E] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088]'
                }`}
              >
                فروق الرسم
              </button>
              <button
                onClick={() => setSelectedType('reading')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedType === 'reading'
                    ? isLight ? 'bg-amber-700 text-white font-black' : 'bg-amber-600 text-white font-black'
                    : isLight ? 'text-[#53605E] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088]'
                }`}
              >
                فروق القراءات
              </button>
              <button
                onClick={() => setSelectedType('split')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedType === 'split'
                    ? isLight ? 'bg-lime-700 text-white font-black' : 'bg-lime-600 text-white font-black'
                    : isLight ? 'text-[#53605E] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088]'
                }`}
              >
                انقسام فواصل
              </button>
              <button
                onClick={() => setSelectedType('merged')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedType === 'merged'
                    ? isLight ? 'bg-teal-700 text-white font-black' : 'bg-teal-600 text-white font-black'
                    : isLight ? 'text-[#53605E] hover:bg-[#F0EDE1]' : 'text-[#8FA09C] hover:text-[#E0C088]'
                }`}
              >
                دمج فواصل
              </button>
            </div>

            {/* Surah Filter Selector */}
            <select
              value={selectedSurahFilter}
              onChange={(e) => setSelectedSurahFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border ${
                isLight ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419]' : 'bg-[#163330] border-[#264340] text-[#E0C088]'
              }`}
            >
              <option value="all">جميع السور (114)</option>
              {kufiCorpus.map(s => (
                <option key={s.number} value={s.number}>
                  {s.number}. {formatSurahName(s.name)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="w-12 h-12 mx-auto text-ink-400 opacity-40 mb-3" />
              <p className="text-base font-bold text-ink-500">لا توجد نتائج تطابق معايير البحث الحالية.</p>
              <p className="text-xs text-ink-400 mt-1">جرب تغيير كلمة البحث أو فلاتر نوع الخلاف والسورة.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSplit = item.type === 'split';
              const isMerged = item.type === 'merged';
              const isLexical = item.type === 'lexical';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all hover:shadow-md ${
                    isLight ? 'bg-[#FBF9F2] border-[#DED8C9] hover:border-[#1A5C5C]' : 'bg-[#10211F] border-[#264340] hover:border-[#52C592]'
                  }`}
                >
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b ${
                    isLight ? 'border-[#EAE4D5]' : 'border-[#1C423E]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold ${
                        isLight ? 'bg-[#F0EDE1] text-[#0F1419] border border-[#DED8C9]' : 'bg-[#163330] text-[#E0C088] border border-[#264340]'
                      }`}>
                        {formatSurahName(item.surahName)} ({item.surahNumber})
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${
                        isLight ? 'bg-[#EBF5F3] text-[#1A5C5C] border border-[#C5DDD8]' : 'bg-[#163330] text-[#52C592] border border-[#264340]'
                      }`}>
                        آية {item.kufiAyahNumber} (حفص) ⟵ آية {item.madaniAyahNumbers.join(', ')} (ورش)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        isLexical
                          ? isLight ? 'bg-rose-100 text-rose-950 border border-rose-300' : 'bg-rose-950/70 text-rose-300'
                          : isSplit
                          ? isLight ? 'bg-lime-100 text-lime-950 border border-lime-300' : 'bg-lime-950/70 text-lime-300'
                          : isMerged
                          ? isLight ? 'bg-teal-100 text-teal-950 border border-teal-300' : 'bg-teal-950/70 text-teal-300'
                          : isLight ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-amber-950/70 text-amber-300'
                      }`}>
                        {item.typeLabel}
                      </span>

                      <button
                        onClick={() => {
                          handleSelect(item.surahNumber, item.kufiAyahNumber);
                          onClose();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                          isLight 
                            ? 'bg-[#1A5C5C] hover:bg-[#134747] text-white shadow-xs' 
                            : 'bg-[#2B7470] hover:bg-[#358A85] text-white'
                        }`}
                        title="انتقال فوري لهذه الآية في شاشة المقارنة"
                      >
                        <span>انتقال</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Texts Comparison Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2.5">
                    {/* Kufi Side */}
                    <div className={`p-2.5 rounded-lg border ${
                      isLight ? 'bg-teal-50/70 border-teal-200' : 'bg-teal-950/30 border-teal-900/60'
                    }`}>
                      <div className="text-[11px] font-bold text-teal-800 dark:text-teal-300 mb-1 flex items-center justify-between">
                        <span>مصحف الكوفة (رواية حفص عن عاصم):</span>
                        <span className="font-mono">آية {item.kufiAyahNumber}</span>
                      </div>
                      <p className="font-quran-hafs text-base sm:text-lg leading-relaxed text-right font-bold text-ink-950 dark:text-ink-100">
                        {item.kufiFullText}
                      </p>
                    </div>

                    {/* Madani Side */}
                    <div className={`p-2.5 rounded-lg border ${
                      isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-900/60'
                    }`}>
                      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center justify-between">
                        <span>مصحف المدينة (رواية ورش عن نافع):</span>
                        <span className="font-mono">آية {item.madaniAyahNumbers.join(', ')}</span>
                      </div>
                      <p className="font-quran-warsh text-base sm:text-lg leading-relaxed text-right font-bold text-ink-950 dark:text-ink-100">
                        {item.madaniFullText}
                      </p>
                    </div>
                  </div>

                  {/* Explanation note */}
                  {item.explanation && (
                    <div className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                      isLight ? 'bg-[#FAF6EC] border-[#E8DEC8] text-[#264340]' : 'bg-[#10211F] border-[#264340] text-ink-300'
                    }`}>
                      <strong>الملاحظة العلمية:</strong> {item.explanation}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 sm:p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#53605E]' : 'bg-[#10211F] border-[#264340] text-[#8FA09C]'
        }`}>
          <div>
            عرض <strong className="font-mono text-[#1A5C5C] dark:text-[#52C592]">{filteredItems.length}</strong> من إجمالي مواضع الخلاف في القرآن الكريم.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                isLight ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419]' : 'bg-[#163330] border-[#264340] text-[#E0C088]'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isLight ? 'bg-[#EAE4D5] hover:bg-[#DED8C9] text-[#0F1419]' : 'bg-[#163330] hover:bg-[#1C423E] text-[#E0C088]'
              }`}
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  Type, 
  ArrowUpDown, 
  Sparkles, 
  Flame, 
  Filter, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { QuranAyah } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  analyzeVerseLetterDistribution, 
  VerseLetterDensityItem 
} from '../utils/verseLetterAnalysis';
import { formatSurahName } from '../utils/arabic';

interface SurahVerseLetterDistributionProps {
  ayahs: QuranAyah[];
  surahName: string;
  surahNumber: number;
}

const ARABIC_LETTERS = [
  'ALL',
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
  'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
];

export const SurahVerseLetterDistribution: React.FC<SurahVerseLetterDistributionProps> = ({
  ayahs,
  surahName,
  surahNumber
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'verse-order' | 'frequency-desc' | 'frequency-asc'>('verse-order');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [selectedVerseDetail, setSelectedVerseDetail] = useState<VerseLetterDensityItem | null>(null);

  // Analyze distribution
  const analysis = useMemo(() => {
    return analyzeVerseLetterDistribution(ayahs, selectedLetter, sortBy);
  }, [ayahs, selectedLetter, sortBy]);

  // Determine segmenting for long surahs (if ayahs > 60, break into chunks of 50 for crystal clear bar reading)
  const pageSize = 50;
  const isSegmented = ayahs.length > 60 && sortBy === 'verse-order';
  const totalSegments = isSegmented ? Math.ceil(analysis.items.length / pageSize) : 1;

  const displayedItems = useMemo(() => {
    if (!isSegmented) return analysis.items;
    const start = activeSegmentIndex * pageSize;
    return analysis.items.slice(start, start + pageSize);
  }, [analysis.items, isSegmented, activeSegmentIndex]);

  return (
    <div className={`rounded-xl p-4 sm:p-5 space-y-4 shadow-xs transition-colors duration-200 border ${
      isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
    }`}>
      
      {/* Header & Description */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 ${
        isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded border flex items-center justify-center ${
            isLight ? 'bg-[#EDE8D8] border-[#DED8C9] text-[#1A5C5C]' : 'bg-[#183431] border-[#264340] text-[#C5A16A]'
          }`}>
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
              <span>توزيع الحروف عبر آيات السورة (مدرج الكثافة النصية)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                isLight 
                  ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border-[#1A5C5C]/30' 
                  : 'bg-[#1A5C5C]/20 text-[#A8BCB9] border-[#1A5C5C]/30'
              }`}>
                {analysis.letterLabel}
              </span>
            </h3>
            <p className={`text-[11px] font-mono ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              تتبع تدفق وكثافة تكرار الحروف آية بآية من بداية {formatSurahName(surahName)} إلى ختامها، مع إمكانية الفرز والتحليل المجهري
            </p>
          </div>
        </div>

        {/* Sorting Controls */}
        <div className={`flex items-center gap-1.5 text-xs font-mono p-1 rounded-lg border ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <span className={`text-[10px] px-1.5 flex items-center gap-1 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
            <ArrowUpDown className="w-3 h-3" />
            الفرز:
          </span>
          <button
            onClick={() => setSortBy('verse-order')}
            className={`px-2.5 py-1 rounded transition-all text-xs ${
              sortBy === 'verse-order'
                ? 'bg-[#1A5C5C] text-white font-bold shadow-2xs'
                : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
            }`}
            title="تسلسل الآيات من البداية إلى النهاية"
          >
            تسلسل الآيات
          </button>
          <button
            onClick={() => setSortBy('frequency-desc')}
            className={`px-2.5 py-1 rounded transition-all text-xs ${
              sortBy === 'frequency-desc'
                ? 'bg-[#1A5C5C] text-white font-bold shadow-2xs'
                : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
            }`}
            title="فرز من الآيات الأكثر احتواءً على الحرف إلى الأقل"
          >
            الأعلى تكراراً ↓
          </button>
          <button
            onClick={() => setSortBy('frequency-asc')}
            className={`px-2.5 py-1 rounded transition-all text-xs ${
              sortBy === 'frequency-asc'
                ? 'bg-[#1A5C5C] text-white font-bold shadow-2xs'
                : isLight ? 'text-[#53605E] hover:text-[#0F1419]' : 'text-[#A8BCB9] hover:text-[#F4F0E7]'
            }`}
            title="فرز من الآيات الأقل احتواءً على الحرف إلى الأكثر"
          >
            الأدنى تكراراً ↑
          </button>
        </div>
      </div>

      {/* Letter Selector Chips Bar */}
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between text-[11px] font-mono ${
          isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
        }`}>
          <span className="flex items-center gap-1">
            <Filter className={`w-3 h-3 ${isLight ? 'text-[#1A5C5C]' : 'text-[#C5A16A]'}`} />
            اختر الحرف المراد تتبع مساره عبر الآيات:
          </span>
          <span className={`font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#C5A16A]'}`}>
            {selectedLetter === 'ALL' ? 'إجمالي الحروف في كل آية' : `تكرار حرف «${selectedLetter}» عبر الآيات`}
          </span>
        </div>

        <div className={`flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-lg border scrollbar-thin ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          {ARABIC_LETTERS.map(char => {
            const isAll = char === 'ALL';
            const active = selectedLetter === char;
            return (
              <button
                key={char}
                onClick={() => {
                  setSelectedLetter(char);
                  setSelectedVerseDetail(null);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1A5C5C] text-white font-bold shadow-xs'
                    : isLight
                    ? 'bg-white text-[#0F1419] hover:bg-[#EDE8D8] border border-[#DED8C9]'
                    : 'bg-[#142825] text-[#F4F0E7] hover:bg-[#1A332F] border border-[#264340]'
                }`}
              >
                {isAll ? 'الكل (كثافة الآية)' : char}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className={`p-2.5 rounded-lg border ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>إجمالي التكرار</div>
          <div className={`text-lg font-bold mt-0.5 ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
            {analysis.totalOccurrences.toLocaleString('en-US')}
          </div>
          <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>مرة في مجموع السورة</div>
        </div>

        <div className={`p-2.5 rounded-lg border ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`}>الآيات الحاوية للحرف</div>
          <div className={`text-lg font-bold mt-0.5 ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`}>
            {analysis.versesWithLetter.toLocaleString('en-US')} / {ayahs.length}
          </div>
          <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
            ({((analysis.versesWithLetter / Math.max(1, ayahs.length)) * 100).toFixed(1)}% من الآيات)
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>ذروة الكثافة بالآية</div>
          <div className={`text-lg font-bold mt-0.5 flex items-center gap-1 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>
            <Flame className="w-4 h-4 text-[#C5A16A]" />
            <span>{analysis.maxOccurrenceInSingleVerse} مرة</span>
          </div>
          <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
            في الآية رقم {analysis.peakVerseNumber}
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>معدل التكرار لكل آية</div>
          <div className={`text-lg font-bold mt-0.5 ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
            {analysis.averagePerVerse}
          </div>
          <div className={`text-[10px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>حرف / آية واحدة</div>
        </div>
      </div>

      {/* Segment Pagination Controls (for long surahs) */}
      {isSegmented && (
        <div className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono ${
          isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
        }`}>
          <span className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
            عرض المقطع: الآيات {activeSegmentIndex * pageSize + 1} إلى {Math.min(ayahs.length, (activeSegmentIndex + 1) * pageSize)} من إجمالي {ayahs.length} آية
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSegmentIndex(p => Math.max(0, p - 1))}
              disabled={activeSegmentIndex === 0}
              className={`p-1 rounded transition-colors disabled:opacity-30 ${
                isLight ? 'bg-white hover:bg-[#EDE8D8] text-[#0F1419] border border-[#DED8C9]' : 'bg-[#142825] hover:bg-[#1A332F] text-[#F4F0E7] border border-[#264340]'
              }`}
              title="المقطع السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className={`px-2 font-bold ${isLight ? 'text-[#1A5C5C]' : 'text-[#C5A16A]'}`}>
              {activeSegmentIndex + 1} / {totalSegments}
            </span>
            <button
              onClick={() => setActiveSegmentIndex(p => Math.min(totalSegments - 1, p + 1))}
              disabled={activeSegmentIndex === totalSegments - 1}
              className={`p-1 rounded transition-colors disabled:opacity-30 ${
                isLight ? 'bg-white hover:bg-[#EDE8D8] text-[#0F1419] border border-[#DED8C9]' : 'bg-[#142825] hover:bg-[#1A332F] text-[#F4F0E7] border border-[#264340]'
              }`}
              title="المقطع التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Bar Chart Container */}
      <div className={`border rounded-xl p-3 sm:p-4 ${
        isLight ? 'bg-white border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
      }`}>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={displayedItems} 
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  setSelectedVerseDetail(e.activePayload[0].payload as VerseLetterDensityItem);
                }
              }}
            >
              <XAxis 
                dataKey="verseNumber" 
                stroke={isLight ? '#7C8B89' : '#6B8580'} 
                fontSize={10}
                tickFormatter={(num) => `آية ${num}`}
                interval={displayedItems.length > 30 ? Math.ceil(displayedItems.length / 15) : 0}
              />
              <YAxis 
                stroke={isLight ? '#7C8B89' : '#6B8580'} 
                fontSize={10} 
                allowDecimals={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#FBF9F2' : '#142825', 
                  borderColor: isLight ? '#DED8C9' : '#264340', 
                  borderRadius: '8px', 
                  color: isLight ? '#0F1419' : '#F4F0E7',
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                  textAlign: 'right',
                  direction: 'rtl',
                  boxShadow: isLight ? '0 4px 6px -1px rgba(0,0,0,0.06)' : 'none'
                }}
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload as VerseLetterDensityItem;
                  return [
                    `${val} مرة (${p.densityPercentage}% من حروف الآية)`,
                    selectedLetter === 'ALL' ? 'إجمالي الحروف' : `تكرار حرف ${selectedLetter}`
                  ];
                }}
                labelFormatter={(v) => `الآية رقم ${v}`}
              />
              <ReferenceLine 
                y={analysis.averagePerVerse} 
                stroke="#C5A16A" 
                strokeDasharray="3 3" 
                label={{ 
                  value: `المتوسط: ${analysis.averagePerVerse}`, 
                  fill: '#C5A16A', 
                  fontSize: 10,
                  position: 'insideTopLeft' 
                }} 
              />
              <Bar 
                dataKey="letterCount" 
                radius={[2, 2, 0, 0]}
                cursor="pointer"
              >
                {displayedItems.map((entry, index) => {
                  let fillColor = isLight ? '#1A5C5C' : '#2B7470';
                  if (entry.isPeak) {
                    fillColor = '#C5A16A'; // Gold peak
                  } else if (entry.letterCount === 0) {
                    fillColor = isLight ? '#EDE8D8' : '#183431';
                  } else if (entry.densityPercentage > 20) {
                    fillColor = isLight ? '#2B7470' : '#4FB7B2';
                  }
                  return <Cell key={`cell-verse-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`text-[10px] font-mono text-center mt-2 flex items-center justify-center gap-3 flex-wrap ${
          isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
        }`}>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C5A16A] inline-block"></span>
            الذهب: أعلى آية تكراراً (الذروة)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2B7470] inline-block"></span>
            الزمردي الفاتح: كثافة مرتفعة
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1A5C5C] inline-block"></span>
            الزمردي: كثافة اعتيادية
          </span>
          <span className={`font-semibold cursor-pointer hidden sm:inline ${
            isLight ? 'text-[#1A5C5C]' : 'text-[#C5A16A]'
          }`}>
            • انقر على أي عمود لمعاينة نص الآية
          </span>
        </div>
      </div>

      {/* Selected Verse Preview Drawer / Box */}
      {selectedVerseDetail && (
        <div className={`p-3.5 sm:p-4 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
          isLight 
            ? 'bg-[#F7F4EA] border-[#C5A16A]/40 text-[#0F1419] shadow-xs' 
            : 'bg-[#10211F] border-[#C5A16A]/30 text-[#F4F0E7]'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`font-bold flex items-center gap-1.5 ${
              isLight ? 'text-[#1A5C5C]' : 'text-[#C5A16A]'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-[#1A5C5C]" />
              معاينة الآية رقم {selectedVerseDetail.verseNumber}:
            </span>
            <span className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              {selectedVerseDetail.letterCount} مرة • {selectedVerseDetail.densityPercentage}% من حروف الآية • {selectedVerseDetail.wordCount} كلمات
            </span>
          </div>
          <div 
            className={`quran-ayah-container p-3 sm:p-4 rounded-lg border font-quran text-base sm:text-lg leading-[2.2] sm:leading-[2.5] text-right shadow-inner select-text ${
              isLight 
                ? 'bg-white border-[#DED8C9] text-[#0F1419]' 
                : 'bg-[#142825] border-[#264340] text-[#F4F0E7]'
            }`}
            dir="rtl"
          >
            <span className="opacity-60 select-none">« </span>
            {selectedVerseDetail.textUthmani}
            <span className="opacity-60 select-none"> »</span>
            {' '}
            <span className="inline-block mr-1 text-[#C5A16A] text-sm font-mono font-bold select-none" dir="ltr">
              ﴿{selectedVerseDetail.verseNumber}﴾
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

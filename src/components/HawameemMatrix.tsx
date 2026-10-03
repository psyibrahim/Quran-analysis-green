import React from 'react';
import { 
  Table, 
  BookOpen, 
  Eye, 
  GitCompare, 
  TrendingUp, 
  Check, 
  Info,
  Scale
} from 'lucide-react';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { formatSurahName } from '../utils/arabic';
import { 
  HawameemAggregateReport, 
  HAWAMEEM_METADATA 
} from '../utils/hawameemData';

interface HawameemMatrixProps {
  report: HawameemAggregateReport;
  activeMushaf: 'kufi' | 'madani';
  onSelectSurah?: (surah: SurahData) => void;
  onOpenInReader?: (surahNumber: number) => void;
  onCompareWith?: (surahNumber: number) => void;
}

export const HawameemMatrix: React.FC<HawameemMatrixProps> = ({
  report,
  activeMushaf,
  onSelectSurah,
  onOpenInReader,
  onCompareWith
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-ink-200 shadow-xs' : 'sci-bg sci-border shadow-md'
      }`}>
        <div>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-ink-900' : 'text-white'}`}>
            <Table className="w-5 h-5 text-[#1A5C5C] dark:text-[#52C592]" />
            المصفوفة الإحصائية المقارنة الشاملة لسور الحواميم السبع
          </h3>
          <p className={`text-xs mt-1 ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
            جدول قياسي مفصل يقارن السور السبع في 12 بعداً إحصائياً دقيقاً، مع إبراز فوارق العد بين المصحفين الكوفي والمدني.
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
          <Scale className="w-4 h-4 text-[#1A5C5C] dark:text-[#52C592]" />
          المصحف النشط:
          <span className={`px-2 py-0.5 rounded border ${
            isLight ? 'bg-[#EBF5F3] text-[#1A5C5C] border-[#C5DDD8] font-bold' : 'bg-[#163330] text-[#52C592] border-[#264340] font-bold'
          }`}>
            {activeMushaf === 'madani' ? 'المدني (ورش)' : 'الكوفي (حفص)'}
          </span>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden shadow-xs transition-colors ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[1000px]">
            <thead>
              <tr className={`border-b text-xs font-bold ${
                isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#E0C088]'
              }`}>
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">السورة والاسم المشهور</th>
                <th className="px-3 py-3 text-center">ترتيب النزول</th>
                <th className="px-3 py-3 text-center">الآيات</th>
                <th className="px-3 py-3 text-center">الكلمات</th>
                <th className="px-3 py-3 text-center">الحروف</th>
                <th className="px-3 py-3 text-center">التنوع المعجمي</th>
                <th className="px-3 py-3 text-center">طول الآية (كلمة)</th>
                <th className={`px-3 py-3 text-center ${isLight ? 'bg-[#EBF5F3] text-[#1A5C5C]' : 'bg-[#163330] text-[#52C592]'}`}>
                  حرف (ح)
                </th>
                <th className={`px-3 py-3 text-center ${isLight ? 'bg-[#FAF6EC] text-[#8C6D2D]' : 'bg-[#2A2416] text-[#E0C088]'}`}>
                  حرف (م)
                </th>
                <th className={`px-3 py-3 text-center ${isLight ? 'bg-[#EBF5F3] text-[#1A5C5C]' : 'bg-[#163330] text-[#52C592]'}`}>
                  مجموع (ح+م)
                </th>
                <th className="px-3 py-3 text-center">القافية الغالبة</th>
                <th className="px-4 py-3 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className={`divide-y text-xs ${isLight ? 'divide-[#EAE4D5]' : 'divide-[#1C423E]'}`}>
              {report.surahs.map(surah => {
                const meta = HAWAMEEM_METADATA[surah.number];
                const lStat = report.hawameemLettersStats.find(s => s.surahNumber === surah.number);
                const topRhyme = surah.ayahs?.verseEndings?.[0];

                return (
                  <tr 
                    key={surah.number}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-[#F7F4EA]' : 'hover:bg-[#163330]'
                    }`}
                  >
                    {/* Index */}
                    <td className={`px-4 py-3 text-center font-mono font-bold ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                      {surah.number}
                    </td>

                    {/* Surah Name & Metadata */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-heading text-base font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                          {formatSurahName(surah.name)}
                        </span>
                        {meta?.historicalNames[0] && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            isLight ? 'bg-[#F0EDE1] border-[#DED8C9] text-[#53605E]' : 'bg-[#163330] border-[#264340] text-[#8FA09C]'
                          }`}>
                            {meta.historicalNames[0]}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                        الجزء: {meta?.juz.join('، ')} • مكية
                      </div>
                    </td>

                    {/* Revelation Order */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                      {meta?.revelationOrder}
                    </td>

                    {/* Verses Count */}
                    <td className={`px-3 py-3 text-center font-mono font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                      {surah.totalAyahs}
                    </td>

                    {/* Words Count */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                      {surah.totalWords.toLocaleString()}
                    </td>

                    {/* Chars Count */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                      {surah.totalChars.toLocaleString()}
                    </td>

                    {/* Vocabulary Diversity */}
                    <td className={`px-3 py-3 text-center font-mono font-semibold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                      {surah.vocabularyDiversity.toFixed(1)}%
                    </td>

                    {/* Average Verse Length in words */}
                    <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                      {surah.avgAyahLengthWords.toFixed(1)}
                    </td>

                    {/* Ha Count & Pct */}
                    <td className={`px-3 py-3 text-center font-mono font-bold ${
                      isLight ? 'bg-[#EBF5F3] text-[#1A5C5C]' : 'bg-[#163330] text-[#52C592]'
                    }`}>
                      <div>{lStat?.haCount}</div>
                      <div className="text-[10px] opacity-80">{lStat?.haPercentage}%</div>
                    </td>

                    {/* Meem Count & Pct */}
                    <td className={`px-3 py-3 text-center font-mono font-bold ${
                      isLight ? 'bg-[#FAF6EC] text-[#8C6D2D]' : 'bg-[#2A2416] text-[#E0C088]'
                    }`}>
                      <div>{lStat?.meemCount}</div>
                      <div className="text-[10px] opacity-80">{lStat?.meemPercentage}%</div>
                    </td>

                    {/* Ha+Meem Total & Pct */}
                    <td className={`px-3 py-3 text-center font-mono font-extrabold ${
                      isLight ? 'bg-[#EBF5F3] text-[#1A5C5C]' : 'bg-[#163330] text-[#52C592]'
                    }`}>
                      <div>{lStat?.haPlusMeemCount}</div>
                      <div className="text-[10px] opacity-85">{lStat?.haPlusMeemPercentage}%</div>
                    </td>

                    {/* Dominant Rhyme */}
                    <td className="px-3 py-3 text-center">
                      {topRhyme ? (
                        <span className={`font-mono text-xs font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#E0C088]'}`}>
                          {topRhyme.pattern} ({topRhyme.percentage}%)
                        </span>
                      ) : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenInReader && (
                          <button
                            type="button"
                            onClick={() => onOpenInReader(surah.number)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight 
                                ? 'border-[#DED8C9] text-[#53605E] hover:text-[#1A5C5C] hover:border-[#1A5C5C] hover:bg-[#F0EDE1]' 
                                : 'border-[#264340] text-[#8FA09C] hover:text-[#52C592] hover:border-[#52C592] hover:bg-[#163330]'
                            }`}
                            title="قراءة في المصحف"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onSelectSurah && (
                          <button
                            type="button"
                            onClick={() => onSelectSurah(surah)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight 
                                ? 'border-[#DED8C9] text-[#53605E] hover:text-[#1A5C5C] hover:border-[#1A5C5C] hover:bg-[#F0EDE1]' 
                                : 'border-[#264340] text-[#8FA09C] hover:text-[#52C592] hover:border-[#52C592] hover:bg-[#163330]'
                            }`}
                            title="التحليل المفصل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onCompareWith && (
                          <button
                            type="button"
                            onClick={() => onCompareWith(surah.number)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLight 
                                ? 'border-[#DED8C9] text-[#53605E] hover:text-[#1A5C5C] hover:border-[#1A5C5C] hover:bg-[#F0EDE1]' 
                                : 'border-[#264340] text-[#8FA09C] hover:text-[#52C592] hover:border-[#52C592] hover:bg-[#163330]'
                            }`}
                            title="مقارنة في معمل السور"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Footer */}
            <tfoot>
              <tr className={`border-t-2 font-bold text-xs ${
                isLight ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' : 'bg-[#10211F] border-[#264340] text-[#E0C088]'
              }`}>
                <td colSpan={3} className="px-4 py-3 text-right font-extrabold">
                  مجموع الحواميم السبع (آل حـم)
                </td>
                <td className={`px-3 py-3 text-center font-mono font-extrabold ${isLight ? 'text-[#1A5C5C]' : 'text-[#52C592]'}`}>
                  {report.totalHawameemVerses}
                </td>
                <td className="px-3 py-3 text-center font-mono">
                  {report.totalHawameemWords.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-center font-mono">
                  {report.totalHawameemLetters.toLocaleString()}
                </td>
                <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                  -
                </td>
                <td className={`px-3 py-3 text-center font-mono ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                  -
                </td>
                <td className={`px-3 py-3 text-center font-mono font-extrabold ${
                  isLight ? 'text-[#1A5C5C] bg-[#EBF5F3]' : 'text-[#52C592] bg-[#163330]'
                }`}>
                  <div>{report.totalHawameemHa}</div>
                  <div className="text-[10px]">{report.avgHawameemHaPct}%</div>
                </td>
                <td className={`px-3 py-3 text-center font-mono font-extrabold ${
                  isLight ? 'text-[#8C6D2D] bg-[#FAF6EC]' : 'text-[#E0C088] bg-[#2A2416]'
                }`}>
                  <div>{report.totalHawameemMeem}</div>
                  <div className="text-[10px]">{report.avgHawameemMeemPct}%</div>
                </td>
                <td className={`px-3 py-3 text-center font-mono font-black ${
                  isLight ? 'text-[#1A5C5C] bg-[#EBF5F3]' : 'text-[#52C592] bg-[#163330]'
                }`}>
                  <div>{report.totalHawameemHaPlusMeem}</div>
                  <div className="text-[10px]">{report.avgHawameemHaPlusMeemPct}%</div>
                </td>
                <td colSpan={2} className={`px-3 py-3 text-center font-normal ${isLight ? 'text-[#53605E]' : 'text-[#8FA09C]'}`}>
                  سلسلة متصلة من سورة 40 حتى 46
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

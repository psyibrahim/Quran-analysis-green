import React from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Activity, 
  Type, 
  TrendingUp,
  Percent
} from 'lucide-react';
import { MacroStatsData, LetterStatsData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SectionHelpButton } from './SectionHelpModal';
import { MathTooltip } from './MathTooltip';
import { ChartMidpointMarker } from './ChartMidpointMarker';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell 
} from 'recharts';

interface MeccanMedinanLabProps {
  macroStats: MacroStatsData;
  letterStats: LetterStatsData;
}

const MeccanMedinanLabComponent: React.FC<MeccanMedinanLabProps> = ({
  macroStats,
  letterStats
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { meccan, medinan } = macroStats;

  // Prepare letter difference comparison data
  const lettersComparisonData = letterStats.letters.map(letter => {
    const pMec = meccan.letterPercentages[letter] || 0;
    const pMed = medinan.letterPercentages[letter] || 0;
    const diff = Number((pMec - pMed).toFixed(2));
    return {
      letter,
      name: letterStats.letterNames[letter],
      'القرآن المكي': pMec,
      'القرآن المدني': pMed,
      diff
    };
  });

  const macroMetrics = [
    {
      title: 'عدد السور',
      meccanVal: `${meccan.surahsCount} سورة`,
      medinanVal: `${medinan.surahsCount} سورة`,
      desc: '75.4٪ من سور المصحف مكية'
    },
    {
      title: 'إجمالي الآيات',
      meccanVal: `${meccan.totalVerses.toLocaleString('en-US')} آية`,
      medinanVal: `${medinan.totalVerses.toLocaleString('en-US')} آية`,
      desc: 'متوسط عدد الآيات بالسورة المكية 55 مقابل 52 للمدنية'
    },
    {
      title: 'إجمالي الكلمات',
      meccanVal: meccan.totalWords.toLocaleString('en-US'),
      medinanVal: medinan.totalWords.toLocaleString('en-US'),
      desc: 'المفردات المنطوقة والمكتوبة'
    },
    {
      title: 'متوسط طول الآية (بالكلمات)',
      metricId: 'avgAyahLengthWords',
      meccanVal: `${meccan.avgAyahLengthWords} كلمة`,
      medinanVal: `${medinan.avgAyahLengthWords} كلمة`,
      desc: 'الآيات المدنية أطول بمرتين ونصف في المتوسط من المكية!'
    },
    {
      title: 'متوسط طول الآية (بالحروف)',
      metricId: 'avgWordLength',
      meccanVal: `${meccan.avgAyahLengthChars} حرف`,
      medinanVal: `${medinan.avgAyahLengthChars} حرف`,
      desc: 'الكثافة الحرفية لكل آية'
    },
    {
      title: 'مؤشر تنوع المفردات (TTR)',
      metricId: 'ttr',
      meccanVal: `${meccan.avgVocabDiversity}%`,
      medinanVal: `${medinan.avgVocabDiversity}%`,
      desc: 'نسبة الكلمات الفريدة إلى إجمالي الكلمات'
    },
  ];

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between transition-colors ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded border flex items-center justify-center ${
            isLight ? 'bg-[#EDE8D8] border-[#DED8C9] text-[#1A5C5C]' : 'bg-[#183431] border-[#264340] text-[#C5A16A]'
          }`}>
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-base font-bold font-heading flex items-center gap-2 ${
              isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'
            }`}>
              <span>المختبر الإحصائي الكلي: المقارنة بين المكي والمدني</span>
            </h2>
            <p className={`text-[11px] font-mono ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              تحليل رياضي ومقارنة إحصائية جماعية بين الـ 86 سورة مكية والـ 28 سورة مدنية
            </p>
          </div>
        </div>

        <SectionHelpButton 
          guideId="meccan-medinan" 
          variant="icon" 
          title="استعلام: شرح المختبر الإحصائي للمكي والمدني والمنهجية الرياضية" 
        />
      </div>

      {/* Macro Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {macroMetrics.map((item, idx) => (
          <div key={idx} className={`rounded-xl p-3 space-y-2 border transition-all ${
            isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
          }`}>
            <div className="flex items-center justify-between">
              {item.metricId ? (
                <MathTooltip metricId={item.metricId} showUnderline={true}>
                  <h3 className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
                    isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'
                  }`}>{item.title}</h3>
                </MathTooltip>
              ) : (
                <h3 className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
                  isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'
                }`}>{item.title}</h3>
              )}
            </div>
            
            <div className={`grid grid-cols-2 gap-2 text-center pt-1 border-t font-mono ${
              isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
            }`}>
              <div className={`p-2 rounded-lg border ${
                isLight ? 'bg-[#F7F4EA] border-[#1A5C5C]/30' : 'bg-[#10211F] border-[#1A5C5C]/40'
              }`}>
                <div className={`text-[10px] font-semibold mb-0.5 ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>المكي (86)</div>
                {item.metricId ? (
                  <MathTooltip metricId={item.metricId} value={item.meccanVal} showUnderline={false}>
                    <div className={`font-bold text-xs ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>{item.meccanVal}</div>
                  </MathTooltip>
                ) : (
                  <div className={`font-bold text-xs ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>{item.meccanVal}</div>
                )}
              </div>
              
              <div className={`p-2 rounded-lg border ${
                isLight ? 'bg-[#F7F4EA] border-[#C5A16A]/30' : 'bg-[#10211F] border-[#C5A16A]/40'
              }`}>
                <div className={`text-[10px] font-semibold mb-0.5 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>المدني (28)</div>
                {item.metricId ? (
                  <MathTooltip metricId={item.metricId} value={item.medinanVal} showUnderline={false}>
                    <div className={`font-bold text-xs ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>{item.medinanVal}</div>
                  </MathTooltip>
                ) : (
                  <div className={`font-bold text-xs ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>{item.medinanVal}</div>
                )}
              </div>
            </div>

            <p className={`text-[10px] text-center font-mono ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Rhyme & Ending Structure Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Meccan Rhymes */}
        <div className={`rounded-xl p-3.5 space-y-3 border ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2 ${
            isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A5C5C] inline-block"></span>
              <h3 className={`font-bold text-xs font-mono ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                القوافي وفواصل الآيات في القرآن المكي
              </h3>
            </div>
            <span className={`text-[10px] font-mono ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>تنوع صوتي وإيقاعي غني</span>
          </div>

          <div className="space-y-1.5 font-mono">
            {(meccan.topRhymes || []).map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
              }`}>
                <span className={`font-heading font-bold text-sm px-2 py-0.5 rounded border ${
                  isLight 
                    ? 'text-[#1A5C5C] bg-[#1A5C5C]/10 border-[#1A5C5C]/30' 
                    : 'text-[#4FB7B2] bg-[#1A5C5C]/20 border-[#1A5C5C]/40'
                }`}>
                  {r.pattern}
                </span>
                <span className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                  {r.count.toLocaleString('en-US')} آية ({r.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Medinan Rhymes */}
        <div className={`rounded-xl p-3.5 space-y-3 border ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2 ${
            isLight ? 'border-[#DED8C9]' : 'border-[#264340]'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A16A] inline-block"></span>
              <h3 className={`font-bold text-xs font-mono ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                القوافي وفواصل الآيات في القرآن المدني
              </h3>
            </div>
            <span className={`text-[10px] font-mono ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>هيمنة لفاصلة «ـون / ـين»</span>
          </div>

          <div className="space-y-1.5 font-mono">
            {(medinan.topRhymes || []).map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                isLight ? 'bg-[#F7F4EA] border-[#DED8C9]' : 'bg-[#10211F] border-[#264340]'
              }`}>
                <span className={`font-heading font-bold text-sm px-2 py-0.5 rounded border ${
                  isLight 
                    ? 'text-[#8C6D2D] bg-[#C5A16A]/15 border-[#C5A16A]/30' 
                    : 'text-[#E0C088] bg-[#C5A16A]/20 border-[#C5A16A]/40'
                }`}>
                  {r.pattern}
                </span>
                <span className={`text-[11px] ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                  {r.count.toLocaleString('en-US')} آية ({r.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 28 Letters Distribution: Meccan vs Medinan */}
      <div className={`rounded-xl p-4 shadow-xs space-y-3 border ${
        isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A5C5C]"></span>
              مقارنة تردد الحروف الـ 28: المكي مقابل المدني
            </h3>
            <p className={`text-[11px] font-mono ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
              متوسط النسبة المئوية لتكرار كل حرف في المجموعة المكية مقابل المجموعة المدنية
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className={`flex items-center gap-1.5 ${isLight ? 'text-[#1A5C5C]' : 'text-[#4FB7B2]'}`}>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1A5C5C] inline-block"></span>
              <span>المكي</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isLight ? 'text-[#8C6D2D]' : 'text-[#E0C088]'}`}>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C5A16A] inline-block"></span>
              <span>المدني</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lettersComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis 
                dataKey="letter" 
                stroke={isLight ? '#7C8B89' : '#6B8580'} 
                fontSize={11} 
                tick={{ fill: isLight ? '#0F1419' : '#F4F0E7', fontFamily: 'Amiri', fontSize: 13, fontWeight: 'bold' }} 
              />
              <YAxis stroke={isLight ? '#7C8B89' : '#6B8580'} fontSize={10} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#FBF9F2' : '#142825', 
                  borderColor: isLight ? '#DED8C9' : '#264340', 
                  borderRadius: '8px', 
                  color: isLight ? '#0F1419' : '#F4F0E7',
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                  direction: 'rtl',
                  boxShadow: isLight ? '0 4px 6px -1px rgba(0,0,0,0.06)' : 'none'
                }}
                formatter={(val: any, name: any) => [`${val}%`, name]}
              />
              <Bar dataKey="القرآن المكي" fill="#1A5C5C" radius={[2, 2, 0, 0]} />
              <Bar dataKey="القرآن المدني" fill="#C5A16A" radius={[2, 2, 0, 0]} />
              {lettersComparisonData.length > 0 && (
                <ChartMidpointMarker 
                  y={Number((Math.max(...lettersComparisonData.map(d => Math.max(Number(d['القرآن المكي']) || 0, Number(d['القرآن المدني']) || 0)), 1) / 2).toFixed(1))}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export const MeccanMedinanLab = React.memo(MeccanMedinanLabComponent);

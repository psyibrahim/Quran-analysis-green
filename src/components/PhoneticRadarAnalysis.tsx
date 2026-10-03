import React, { useState, useMemo } from 'react';
import { 
  Volume2, 
  Sparkles, 
  Wind, 
  Activity, 
  Layers, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Download,
  Filter,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { SurahData, LetterStatsData } from '../types';
import { calculatePhoneticStats, SurahPhoneticStats } from '../utils/phonetics';
import { downloadFile } from '../utils/exportData';
import { formatSurahName, getCleanSurahName } from '../utils/arabic';

interface PhoneticRadarAnalysisProps {
  surahs: SurahData[];
  letterStats: LetterStatsData;
  selectedSurahNumber?: number;
  onSelectSurah?: (surahNum: number) => void;
}

export const PhoneticRadarAnalysis: React.FC<PhoneticRadarAnalysisProps> = ({
  surahs,
  letterStats,
  selectedSurahNumber = 1,
  onSelectSurah
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeSurahNum, setActiveSurahNum] = useState<number>(selectedSurahNumber);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Sync state if prop changes
  React.useEffect(() => {
    if (selectedSurahNumber && selectedSurahNumber !== activeSurahNum) {
      setActiveSurahNum(selectedSurahNumber);
    }
  }, [selectedSurahNumber]);

  const currentSurah = useMemo(() => {
    return surahs.find(s => s.number === activeSurahNum) || surahs[0];
  }, [surahs, activeSurahNum]);

  // Calculate phonetic stats for selected surah
  const surahPhonetics = useMemo<SurahPhoneticStats>(() => {
    const counts = currentSurah?.letters?.plainCounts || {};
    return calculatePhoneticStats(counts);
  }, [currentSurah]);

  // Calculate phonetic stats for the entire Quran (Average baseline)
  const quranPhonetics = useMemo<SurahPhoneticStats>(() => {
    const totalCounts: Record<string, number> = {};
    if (letterStats?.globalStats) {
      Object.keys(letterStats.globalStats).forEach(letter => {
        totalCounts[letter] = Number(letterStats.globalStats[letter]?.totalOccurrences || 0);
      });
    } else if (surahs && surahs.length > 0) {
      surahs.forEach(s => {
        const sCounts = s.letters?.plainCounts || {};
        Object.keys(sCounts).forEach(letter => {
          totalCounts[letter] = (totalCounts[letter] || 0) + Number(sCounts[letter] || 0);
        });
      });
    }
    return calculatePhoneticStats(totalCounts);
  }, [letterStats, surahs]);

  // Radar Chart Data comparing Selected Surah vs Quran Average
  const radarData = useMemo(() => {
    return [
      {
        trait: 'الشدة',
        subtrait: '(أجد قط بكت)',
        fullLabel: 'الشدة (أجد قط بكت)',
        surahVal: surahPhonetics.strength.shiddah.percentage,
        quranVal: quranPhonetics.strength.shiddah.percentage,
        fullMark: 40
      },
      {
        trait: 'الرخاوة',
        subtrait: '(جريان الصوت)',
        fullLabel: 'الرخاوة (الصوت الجاري)',
        surahVal: surahPhonetics.strength.rakhawah.percentage,
        quranVal: quranPhonetics.strength.rakhawah.percentage,
        fullMark: 60
      },
      {
        trait: 'الهمس',
        subtrait: '(فحثه شخص سكت)',
        fullLabel: 'الهمس (فحثه شخص سكت)',
        surahVal: surahPhonetics.voice.hams.percentage,
        quranVal: quranPhonetics.voice.hams.percentage,
        fullMark: 50
      },
      {
        trait: 'الجهر',
        subtrait: '(انحباس النفس)',
        fullLabel: 'الجهر (انحباس النفس)',
        surahVal: surahPhonetics.voice.jahr.percentage,
        quranVal: quranPhonetics.voice.jahr.percentage,
        fullMark: 80
      },
      {
        trait: 'الاستعلاء',
        subtrait: '(خص ضغط قظ)',
        fullLabel: 'الاستعلاء (التفخيم)',
        surahVal: surahPhonetics.elevation.istiila.percentage,
        quranVal: quranPhonetics.elevation.istiila.percentage,
        fullMark: 30
      },
      {
        trait: 'الإطباق',
        subtrait: '(ص ض ط ظ)',
        fullLabel: 'الإطباق (ص ض ط ظ)',
        surahVal: surahPhonetics.occlusion.itbaq.percentage,
        quranVal: quranPhonetics.occlusion.itbaq.percentage,
        fullMark: 20
      },
      {
        trait: 'القلقلة',
        subtrait: '(قطب جد)',
        fullLabel: 'القلقلة (قطب جد)',
        surahVal: surahPhonetics.specialTraits.qalqalah.percentage,
        quranVal: quranPhonetics.specialTraits.qalqalah.percentage,
        fullMark: 25
      },
      {
        trait: 'الغنة والصفير',
        subtrait: '(ن م / ص س ز)',
        fullLabel: 'الغنة والصفير (ن، م / ص، س، ز)',
        surahVal: Number((surahPhonetics.specialTraits.ghunnah.percentage + surahPhonetics.specialTraits.safeer.percentage).toFixed(2)),
        quranVal: Number((quranPhonetics.specialTraits.ghunnah.percentage + quranPhonetics.specialTraits.safeer.percentage).toFixed(2)),
        fullMark: 40
      }
    ];
  }, [surahPhonetics, quranPhonetics]);

  // Makharij Bar Chart Data
  const makharijData = useMemo(() => {
    return [
      {
        name: 'اللسان (18 حرفاً)',
        نسبة: surahPhonetics.makharij.lisan.percentage,
        تكرار: surahPhonetics.makharij.lisan.count,
        fill: '#1A5C5C'
      },
      {
        name: 'الجوف (حروف المد)',
        نسبة: surahPhonetics.makharij.jawf.percentage,
        تكرار: surahPhonetics.makharij.jawf.count,
        fill: '#10b981'
      },
      {
        name: 'الشفتان (ف ب م و)',
        نسبة: surahPhonetics.makharij.shafatan.percentage,
        تكرار: surahPhonetics.makharij.shafatan.count,
        fill: '#f59e0b'
      },
      {
        name: 'الحلق (6 حروف)',
        نسبة: surahPhonetics.makharij.halq.percentage,
        تكرار: surahPhonetics.makharij.halq.count,
        fill: '#65A30D'
      }
    ];
  }, [surahPhonetics]);

  // Export Phonetics Data to CSV
  const handleExportCSV = () => {
    const rows = [
      ['الصفة / المخرج', 'التكرار بالسورة', 'النسبة بالسورة (%)', 'المتوسط العام بالقرآن (%)'],
      ['حروف الشدة (أجد قط بكت)', surahPhonetics.strength.shiddah.count, `${surahPhonetics.strength.shiddah.percentage}%`, `${quranPhonetics.strength.shiddah.percentage}%`],
      ['حروف التوسط (لن عمر)', surahPhonetics.strength.bayniyyah.count, `${surahPhonetics.strength.bayniyyah.percentage}%`, `${quranPhonetics.strength.bayniyyah.percentage}%`],
      ['حروف الرخاوة', surahPhonetics.strength.rakhawah.count, `${surahPhonetics.strength.rakhawah.percentage}%`, `${quranPhonetics.strength.rakhawah.percentage}%`],
      ['حروف الهمس (فحثه شخص سكت)', surahPhonetics.voice.hams.count, `${surahPhonetics.voice.hams.percentage}%`, `${quranPhonetics.voice.hams.percentage}%`],
      ['حروف الجهر', surahPhonetics.voice.jahr.count, `${surahPhonetics.voice.jahr.percentage}%`, `${quranPhonetics.voice.jahr.percentage}%`],
      ['حروف الاستعلاء (خص ضغط قظ)', surahPhonetics.elevation.istiila.count, `${surahPhonetics.elevation.istiila.percentage}%`, `${quranPhonetics.elevation.istiila.percentage}%`],
      ['حروف الاستفال (الترقيق)', surahPhonetics.elevation.istifal.count, `${surahPhonetics.elevation.istifal.percentage}%`, `${quranPhonetics.elevation.istifal.percentage}%`],
      ['حروف الإطباق (ص ض ط ظ)', surahPhonetics.occlusion.itbaq.count, `${surahPhonetics.occlusion.itbaq.percentage}%`, `${quranPhonetics.occlusion.itbaq.percentage}%`],
      ['حروف القلقلة (قطب جد)', surahPhonetics.specialTraits.qalqalah.count, `${surahPhonetics.specialTraits.qalqalah.percentage}%`, `${quranPhonetics.specialTraits.qalqalah.percentage}%`],
      ['حروف الغنة (ن، م)', surahPhonetics.specialTraits.ghunnah.count, `${surahPhonetics.specialTraits.ghunnah.percentage}%`, `${quranPhonetics.specialTraits.ghunnah.percentage}%`],
      ['مخرج اللسان', surahPhonetics.makharij.lisan.count, `${surahPhonetics.makharij.lisan.percentage}%`, `${quranPhonetics.makharij.lisan.percentage}%`],
      ['مخرج الجوف', surahPhonetics.makharij.jawf.count, `${surahPhonetics.makharij.jawf.percentage}%`, `${quranPhonetics.makharij.jawf.percentage}%`],
      ['مخرج الشفتين', surahPhonetics.makharij.shafatan.count, `${surahPhonetics.makharij.shafatan.percentage}%`, `${quranPhonetics.makharij.shafatan.percentage}%`],
      ['مخرج الحلق', surahPhonetics.makharij.halq.count, `${surahPhonetics.makharij.halq.percentage}%`, `${quranPhonetics.makharij.halq.percentage}%`]
    ];

    const content = rows.map(r => r.join(',')).join('\r\n');
    downloadFile(`Phonetic_Analysis_Surah_${currentSurah.number}_${currentSurah.name}.csv`, content);
  };

  // Custom Tick Component: Strictly horizontal badge with guaranteed zero overlap between Arabic trait text and percentage
  const renderPolarAngleAxisTick = (props: any) => {
    const { x, y, cx, cy, payload, index } = props;
    const item = radarData[payload?.index ?? index] || radarData.find(d => d.trait === payload?.value);
    const traitName = payload?.value || item?.trait || '';
    const surahValFormatted = item ? `${Number(item.surahVal.toFixed(1))}%` : '';

    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    // Radial offset outward: extra space so badges comfortably float outside radar vertices
    const radialOffset = 22 + Math.abs(ux) * 16;

    const targetX = cx + ux * (dist + radialOffset);
    const targetY = cy + uy * (dist + radialOffset);

    // Guaranteed wide badge with dedicated zones for Arabic text and percentage pill
    const textLen = traitName.length;
    const badgeWidth = Math.max(124, textLen * 9 + 64);
    const badgeHeight = 28;

    return (
      <g className="recharts-polar-angle-axis-tick select-none cursor-pointer">
        {/* Visual Spoke Extension Line connecting chart vertex to label */}
        <line
          x1={x}
          y1={y}
          x2={cx + ux * (dist + 5)}
          y2={cy + uy * (dist + 5)}
          stroke={isLight ? '#97A8A3' : '#53605E'}
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />
        {/* Spoke Tip Anchor Dot */}
        <circle
          cx={cx + ux * (dist + 5)}
          cy={cy + uy * (dist + 5)}
          r={2.5}
          fill={isLight ? '#4D7C0F' : '#A3E635'}
        />

        {/* Strictly Horizontal Label Badge (no rotation, flexbox layout prevents text and percentage overlap) */}
        <g transform={`translate(${targetX}, ${targetY})`}>
          <foreignObject
            x={-badgeWidth / 2}
            y={-badgeHeight / 2}
            width={badgeWidth}
            height={badgeHeight}
            className="overflow-visible"
          >
            <div 
              dir="rtl"
              style={{
                width: `${badgeWidth}px`,
                height: `${badgeHeight}px`,
                boxSizing: 'border-box'
              }}
              className={`flex items-center justify-between gap-2 px-2.5 rounded-lg border shadow-sm transition-all ${
                isLight 
                  ? 'bg-white border-ink-300 text-ink-900 shadow-ink-200/80' 
                  : 'bg-ink-900 border-ink-700 text-ink-100 shadow-black/60'
              }`}
            >
              {/* Trait Name in Arabic */}
              <span className="font-bold text-xs truncate leading-none min-w-0">
                {traitName}
              </span>

              {/* Percentage Pill */}
              <span 
                dir="ltr"
                className={`font-mono text-[10.5px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 leading-none ${
                  isLight 
                    ? 'bg-lime-50 border-lime-200 text-lime-700' 
                    : 'bg-lime-950/70 border-lime-800 text-lime-300'
                }`}
              >
                {surahValFormatted}
              </span>
            </div>
          </foreignObject>
        </g>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${
              isLight ? 'bg-lime-100 border-lime-300 text-lime-950' : 'bg-lime-950/60 border-lime-800 text-lime-300'
            }`}>
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>البصمة الصوتية والمخارج (Phonetic & Acoustic Radar)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  currentSurah.revelationType === 'Meccan'
                    ? isLight ? 'bg-amber-100 text-amber-950' : 'bg-amber-950 text-amber-300'
                    : isLight ? 'bg-emerald-100 text-emerald-950' : 'bg-emerald-950 text-emerald-300'
                }`}>
                  {currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-ink-600 font-bold' : 'text-ink-400'} mt-0.5`}>
                تحليل رياضي لصوتيات السورة: الشدة، الرخاوة، الاستعلاء، الإطباق ومخارج النطق مقارنة بمتوسط القرآن
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Surah Selector - Changes radar in-place */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className={isLight ? 'text-ink-900' : 'text-ink-300'}>السورة:</span>
              <select
                value={activeSurahNum}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setActiveSurahNum(val);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  isLight 
                    ? 'bg-white border-ink-300 text-ink-950 shadow-2xs focus:border-lime-500' 
                    : 'bg-ink-950 border-ink-700 text-ink-200 focus:border-lime-500'
                }`}
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {formatSurahName(s.name)} ({s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional explicit button to view full surah card only when clicked */}
            {onSelectSurah && (
              <button
                type="button"
                onClick={() => onSelectSurah(activeSurahNum)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-lime-50 hover:bg-lime-100 border-lime-300 text-lime-900 shadow-2xs' 
                    : 'bg-lime-950/40 hover:bg-lime-900/60 border-lime-700/60 text-lime-200'
                }`}
                title="فتح بطاقة التحليل المفصلة والشاملة لهذه السورة"
              >
                <ExternalLink className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
                <span>بطاقة السورة</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                isLight 
                  ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-950 shadow-2xs' 
                  : 'bg-ink-950 hover:bg-ink-800 border-ink-700 text-ink-200'
              }`}
              title="تصدير بيانات الصوتيات كملف Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير CSV</span>
            </button>

            {/* Explainer Toggle */}
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                showExplanation
                  ? isLight ? 'bg-lime-700 text-white' : 'bg-lime-600 text-white'
                  : isLight ? 'bg-white hover:bg-ink-100 border-ink-300 text-ink-950' : 'bg-ink-950 border-ink-700 text-ink-300'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>شرح علم التجويد والمصطلحات</span>
              {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Tajweed Explanation */}
        {showExplanation && (
          <div className={`mt-4 pt-4 border-t text-xs leading-relaxed space-y-2.5 ${
            isLight ? 'border-ink-200 text-ink-800' : 'border-ink-800 text-ink-300'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-950 border-ink-800'}`}>
                <strong className="text-lime-700 dark:text-lime-300 block mb-1">الشدة والرخاوة:</strong>
                <p><strong>الشدة (8 حروف):</strong> انحباس جريان الصوت لقوة الاعتماد على المخرج (أجد قط بكت). <strong>الرخاوة:</strong> جريان الصوت التام. <strong>البينية (5 حروف):</strong> جريان جزئي (لن عمر).</p>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-950 border-ink-800'}`}>
                <strong className="text-lime-700 dark:text-lime-300 block mb-1">الهمس والجهر:</strong>
                <p><strong>الهمس (10 حروف):</strong> جريان النفس عند النطق لضعف الاعتماد على المخرج (فحثه شخص سكت). <strong>الجهر (18 حرفاً):</strong> انحباس النفس لقوة المخرج.</p>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-950 border-ink-800'}`}>
                <strong className="text-lime-700 dark:text-lime-300 block mb-1">الاستعلاء والإطباق:</strong>
                <p><strong>الاستعلاء (7 حروف):</strong> تصعد أقصى اللسان إلى الحنك الأعلى والتفخيم (خص ضغط قظ). <strong>الإطباق (4 حروف):</strong> تلاصق جملة اللسان بالحنك (ص، ض، ط، ظ).</p>
              </div>
              <div className={`p-3 rounded-xl border ${isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-950 border-ink-800'}`}>
                <strong className="text-lime-700 dark:text-lime-300 block mb-1">المخارج العامة الخمسة:</strong>
                <p>الجوف (حروف المد)، الحلق (حروف الإظهار)، اللسان (أكبر المخارج 18 حرفاً)، الشفتان (4 حروف)، والخيشوم (الغنة).</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Primary Visualizations: Radar & Makharij Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radar Chart (7 cols) */}
        <div className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
        }`}>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h4 className="text-sm font-black flex items-center gap-2">
                <Wind className="w-4 h-4 text-lime-600" />
                <span>مخطط الرادار الصوتي: {formatSurahName(currentSurah.name)} مقابل متوسط القرآن الكريم</span>
              </h4>
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-lime-700 dark:text-lime-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-600"></span>
                  <span>السورة ({getCleanSurahName(currentSurah.name)})</span>
                </span>
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-ink-400"></span>
                  <span>المتوسط القرآني العام</span>
                </span>
              </div>
            </div>
            <p className={`text-xs ${isLight ? 'text-ink-600' : 'text-ink-400'} mb-3`}>
              يبرز التمدد الهندسي مدى هيمنة صفات القوة والقرع (الشدة، القلقلة، الاستعلاء) أو صفات الرنين والرخاوة في السورة.
            </p>
          </div>

          <div className="w-full h-[400px] sm:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="55%">
                <PolarGrid stroke={isLight ? '#E2DDCF' : '#3A4A47'} />
                <PolarAngleAxis 
                  dataKey="trait" 
                  tick={renderPolarAngleAxisTick} 
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'auto']} 
                  axisLine={false}
                  tick={{ fill: isLight ? '#97A8A3' : '#6F7F7B', fontSize: 9, fontWeight: 600 }}
                  tickFormatter={(val: number) => `${val}%`}
                />
                <Tooltip 
                  formatter={(val: number) => [`${val}%`, '']}
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#10211F',
                    borderColor: isLight ? '#C7CEC9' : '#3A4A47',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isLight ? '#10211F' : '#F8F6EF',
                    textAlign: 'right'
                  }}
                />
                <Radar 
                  name={formatSurahName(currentSurah.name)} 
                  dataKey="surahVal" 
                  stroke="#4D7C0F" 
                  fill="#65A30D" 
                  fillOpacity={0.45} 
                  strokeWidth={2.5}
                />
                <Radar 
                  name="المتوسط القرآني العام" 
                  dataKey="quranVal" 
                  stroke="#6F7F7B" 
                  fill="#97A8A3" 
                  fillOpacity={0.2} 
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Makharij Bar Chart & Quick Metrics (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Makharij Breakdown */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
          }`}>
            <h4 className="text-sm font-black mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>توزيع مخارج الحروف العامة بالسورة</span>
            </h4>
            <p className={`text-xs ${isLight ? 'text-ink-600' : 'text-ink-400'} mb-3`}>
              نسبة تكرار الحروف المنبعثة من المخارج الرئيسية الأربعة
            </p>

            <div className="w-full h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={makharijData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} width={90} />
                  <Tooltip 
                    formatter={(val: number, name, item) => [`${val}% (${item.payload.تكرار} حرفاً)`, 'النسبة']}
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#10211F',
                      borderColor: isLight ? '#C7CEC9' : '#3A4A47',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Bar dataKey="نسبة" radius={[0, 6, 6, 0]}>
                    {makharijData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acoustic Balance Gauge */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-ink-300 shadow-xs' : 'bg-ink-900 border-ink-800'
          }`}>
            <h4 className="text-sm font-black mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>مؤشرات الطابع الصوتي للسورة (Acoustic Index)</span>
            </h4>

            <div className="space-y-3 text-xs">
              {/* Firmness / Power */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-amber-700 dark:text-amber-400">مؤشر الصلابة والقرع (الشدة + الاستعلاء):</span>
                  <span className="font-mono">{surahPhonetics.acousticIndex.firmnessRatio}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(surahPhonetics.acousticIndex.firmnessRatio * 2, 100)}%` }}
                  />
                </div>
              </div>

              {/* Softness / Flow */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-teal-700 dark:text-teal-400">مؤشر الجريان والرخاوة (الرخاوة + الهمس):</span>
                  <span className="font-mono">{surahPhonetics.acousticIndex.softnessRatio}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(surahPhonetics.acousticIndex.softnessRatio, 100)}%` }}
                  />
                </div>
              </div>

              {/* Resonance */}
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-emerald-700 dark:text-emerald-400">مؤشر الرنين والترتيل (البينية + الغنة):</span>
                  <span className="font-mono">{surahPhonetics.acousticIndex.resonantRatio}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ink-200 dark:bg-ink-800 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(surahPhonetics.acousticIndex.resonantRatio * 1.5, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Detailed Acoustic Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: الشدة */}
        <div className={`p-3 rounded-xl border-2 transition-all min-w-0 ${
          isLight ? 'bg-amber-50/90 border-amber-500 text-amber-950 shadow-2xs' : 'bg-amber-950/40 border-amber-700 text-amber-200'
        }`}>
          <div className="text-[11px] font-black truncate">الشدة (أجد قط بكت)</div>
          <div className="text-lg font-mono font-black mt-0.5 truncate">{surahPhonetics.strength.shiddah.percentage}%</div>
          <div className="text-[10px] opacity-80 mt-0.5 truncate">{surahPhonetics.strength.shiddah.count.toLocaleString()} حرفاً</div>
        </div>

        {/* Card 2: الرخاوة */}
        <div className={`p-3 rounded-xl border-2 transition-all min-w-0 ${
          isLight ? 'bg-teal-50/90 border-teal-500 text-teal-950 shadow-2xs' : 'bg-teal-950/40 border-teal-700 text-teal-200'
        }`}>
          <div className="text-[11px] font-black truncate">الرخاوة (الصوت الجاري)</div>
          <div className="text-lg font-mono font-black mt-0.5 truncate">{surahPhonetics.strength.rakhawah.percentage}%</div>
          <div className="text-[10px] opacity-80 mt-0.5 truncate">{surahPhonetics.strength.rakhawah.count.toLocaleString()} حرفاً</div>
        </div>

        {/* Card 3: الهمس */}
        <div className={`p-3 rounded-xl border-2 transition-all min-w-0 ${
          isLight ? 'bg-lime-50/90 border-lime-500 text-lime-950 shadow-2xs' : 'bg-lime-950/40 border-lime-700 text-lime-200'
        }`}>
          <div className="text-[11px] font-black truncate">الهمس (جريان النفس)</div>
          <div className="text-lg font-mono font-black mt-0.5 truncate">{surahPhonetics.voice.hams.percentage}%</div>
          <div className="text-[10px] opacity-80 mt-0.5 truncate">{surahPhonetics.voice.hams.count.toLocaleString()} حرفاً</div>
        </div>

        {/* Card 4: الاستعلاء */}
        <div className={`p-3 rounded-xl border-2 transition-all min-w-0 ${
          isLight ? 'bg-rose-50/90 border-rose-500 text-rose-950 shadow-2xs' : 'bg-rose-950/40 border-rose-700 text-rose-200'
        }`}>
          <div className="text-[11px] font-black truncate">الاستعلاء (خص ضغط قظ)</div>
          <div className="text-lg font-mono font-black mt-0.5 truncate">{surahPhonetics.elevation.istiila.percentage}%</div>
          <div className="text-[10px] opacity-80 mt-0.5 truncate">{surahPhonetics.elevation.istiila.count.toLocaleString()} حرفاً</div>
        </div>

        {/* Card 5: الإطباق */}
        <div className={`p-3 rounded-xl border-2 transition-all min-w-0 ${
          isLight ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-2xs' : 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
        }`}>
          <div className="text-[11px] font-black truncate">الإطباق (ص ض ط ظ)</div>
          <div className="text-lg font-mono font-black mt-0.5 truncate">{surahPhonetics.occlusion.itbaq.percentage}%</div>
          <div className="text-[10px] opacity-80 mt-0.5 truncate">{surahPhonetics.occlusion.itbaq.count.toLocaleString()} حرفاً</div>
        </div>

        {/* Card 6: القلقلة */}
        <div className={`p-3 rounded-xl border-2 transition-all min-w-0 ${
          isLight ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-2xs' : 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
        }`}>
          <div className="text-[11px] font-black truncate">القلقلة (قطب جد)</div>
          <div className="text-lg font-mono font-black mt-0.5 truncate">{surahPhonetics.specialTraits.qalqalah.percentage}%</div>
          <div className="text-[10px] opacity-80 mt-0.5 truncate">{surahPhonetics.specialTraits.qalqalah.count.toLocaleString()} حرفاً</div>
        </div>
      </div>

    </div>
  );
};

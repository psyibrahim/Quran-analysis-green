import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  BookOpen, 
  Search, 
  Cpu, 
  Sigma, 
  HelpCircle, 
  Layers, 
  Sparkles, 
  Check, 
  Copy, 
  Activity, 
  Compass, 
  BarChart2, 
  GitBranch, 
  Info,
  Scale
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LettersLabInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LettersLabInfoModal: React.FC<LettersLabInfoModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'methodology' | 'glossary' | 'formulas' | 'mushaf'>('methodology');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflowY = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Glossary items
  const glossaryItems = [
    {
      id: 'surah-fingerprint',
      term: 'بصمة السورة اللسانية (Surah Phonetic Fingerprint)',
      category: 'بنية المتجهات',
      definition: 'المتجه الترددي النسبي المكون من 28 قيمة عددية تُمثّل نسبة ظهور كل حرف هجائي في متن السورة. هذه البصمة فريدة لكل سورة في القرآن، وتعتبر توقيعاً أسلوبياً وصوتياً مستقلاً عن طول السورة.',
      example: 'سورة الكوثر تتميز ببصمة صوتية استثنائية بارتفاع غير معتاد لحرفي الراء والألف مقارنة بمتوسط القرآن العام.'
    },
    {
      id: 'vector-space',
      term: 'الفضاء المتجهي ذو الـ 28 بعداً (28-D Vector Space)',
      category: 'النمذجة الرياضية',
      definition: 'نموذج جبري يُعامل كل سورة كنقطة أو متجه في فضاء إقليدي يتألف من 28 محوراً مستقلاً (أ، ب، ت... ي). حيث يمثل كل محور نسبة الورود المئوية للحرف، ومجموع إحداثيات المتجه يساوي دائماً 100%.',
      example: 'يمكّن هذا الفضاء من حساب المسافات الزاوية، والتشابه، والإنتروبيا، والتجميع العنقودي بموضوعية رياضية بحتة.'
    },
    {
      id: 'cosine-similarity',
      term: 'مقياس تشابه جيب التمام (Cosine Similarity Metric)',
      category: 'الإحصاء المقارن',
      definition: 'مقياس إحصائي يقيس جيب تمام الزاوية بين متجهي سورتين في الفضاء 28-D. تتراوح قيمته بين 0 (تباين تام) و 1 (تطابق تام بنسبة 100%). يتميز بأنه "مستقل تماماً عن طول السورة" (Length-Invariant).',
      example: 'يقارن بنية سورة البقرة (6,144 كلمة) بسورة الفاتحة (29 كلمة) دون أن يؤثر حجم البقرة الضخم على دقة قياس التجانس الصوتي.'
    },
    {
      id: 'pareto-curve',
      term: 'منحنى باريتو التراكمي للحروف (Pareto Cumulative Distribution)',
      category: 'التوزيع التراكمي',
      definition: 'ترتيب الحروف في كل سورة تنازلياً وفق تكرارها الذاتي، ثم جمع نسبها تراكمياً من الرتبة #1 إلى الرتبة #28. يكشف هذا المنحنى عن درجة تركز المتن اللغوي وسرعة وصول السورة لاحتواء غالبية نصها بحروف قليلة.',
      example: 'المنحنى يبدأ بأكثر الحروف وروداً (غالباً الألف واللام) وينتهي عند الرتبة 28 بمجموع إجمالي يبلغ 100.00% جبرياً ورياضياً.'
    },
    {
      id: 'p50-index',
      term: 'مؤشر P50 - النصفية التراكمية (Median Density Rank)',
      category: 'مؤشرات التركز',
      definition: 'الحد الأدنى من الحروف الهجائية الأكثر تكراراً التي تستأثر بمفردها على 50% أو أكثر من كامل حروف السورة. في متن القرآن الكريم، يتراوح هذا الرقم غالباً بين 3 إلى 5 أحرف فقط.',
      example: 'في سورة البقرة: أحرف (ا، ل، ن، م) الأربعة تشكل وحدها أكثر من 50% من مجموع حروف السورة البالغة 25,613 حرفاً.'
    },
    {
      id: 'p80-index',
      term: 'مؤشر P80 - الهيمنة الصوتية التراكمية (80% Dominance Cutoff)',
      category: 'مؤشرات التركز',
      definition: 'عدد الحروف الهجائية الحاكمة التي تغطي مجتمعة 80% من متن السورة (تطبيقاً لمبدأ باريتو 80/20). يتراوح عادة بين 9 إلى 12 حرفاً، بينما تتوزع الـ 20% المتبقية على باقي الحروف الـ 16.',
      example: 'السور ذات الإيقاع الفاصل الحاد (مثل النجم والقمر والنازعات) تمتلك P80 أقل، مما يدل على تركيز صوتي أعلى في أحرف القافية والمد.'
    },
    {
      id: 'shannon-entropy',
      term: 'إنتروبيا شانون الصوتية (Shannon Information Entropy)',
      category: 'نظرية المعلومات',
      definition: 'مقياس لمدى التشتت والعدالة الإحصائية في توزيع الحروف الـ 28 داخل السورة. تُحسب بالبت (bits). الإنتروبيا العليا تعني توزيعاً متزناً ومتنوعاً بين الأصوات، بينما الإنتروبيا المنخفضة تعني تركزاً لغوياً في أحرف قليلة محددة.',
      example: 'السور الطويلة تقترب من الإنتروبيا التوازنية (~4.10 bits)، بينما تظهر قصار السور تفاوتاً ملحوظاً يعكس طابعها البياني المكثف.'
    },
    {
      id: 'orthographic-norm',
      term: 'التجريد الصامت المعياري (Orthographic Normalization)',
      category: 'المعالجة اللغوية',
      definition: 'فصل الهيكل الصامت للكلمة القرآنية عن علامات التشكيل، مع توحيد صور الحرف الواحد وفق القواعد المعجمية (مثل إدراج الألفات المهموزة أ، إ، آ والهمزة المفردة تحت الأصل الصوتي المعتمد)، لمنع تشويه الترددات الصرفية.',
      example: 'يضمن إحصاء حرف الألف بكافة أشكاله الرسمية في المصحف، دون خلطه بحركات الهمزة أو حروف العلة الأخرى.'
    },
    {
      id: 'diacritics-ratio',
      term: 'نسبة التشكيل إلى الصوامت (Diacritics-to-Consonants Ratio)',
      category: 'الإيقاع الصوتي',
      definition: 'المعدل الحسابي لعدد الحركات الإعرابية وعلامات الضبط (فتحة، ضمة، كسرة، سكون، شدة، تنوين، مد) المرافقة لكل حرف صامت. يُعد مؤشراً على الكثافة الإعرابية والإيقاع الحركي للنص.',
      example: 'القرآن الكريم يمتاز بكثافة تشكيل تفوق 1.25 حركة لكل حرف صامت، نتيجة وفرة حركات الإعراب والتضعيف والمدود.'
    },
    {
      id: 'corpus-accumulation',
      term: 'التراكم المصحفي التصاعدي (Corpus-Wide Progressive Curve)',
      category: 'التوزيع التراكمي',
      definition: 'متابعة النمو التراكمي لتكرارات حرف معين عبر ترتيب السور المصحفي من سورة الفاتحة (1) وصولاً إلى سورة الناس (114). يكشف المنحنى عن خطوط الميل، ومناطق القفزات الكبرى، ومعدل التدفق الصوتي للحرف.',
      example: 'منحنى تراكم حرف (ق) يُظهر استقراراً نسبياً مع قفزات ملحوظة في السور المكية ذات الطابع القارئ مثل سورة (ق) والواقعة.'
    },
    {
      id: 'kufi-vs-madani',
      term: 'المنهجية المزدوجة المستقلة: العد الكوفي مقابل العد المدني',
      category: 'علم التراجم والعد',
      definition: 'الفصل الصارم بين الروايات القرآنية في قاعدة البيانات؛ فالعد الكوفي (رواية حفص عن عاصم: 6,236 آية، البسملة آية رقم 1 في الفاتحة)، والعد المدني (رواية ورش عن نافع: 6,214 آية عبر Quranpedia API، البسملة ليست آية معدودة في الفاتحة وتُعد الآية الأخيرة آيتين).',
      example: 'يوفر التطبيق التبديل الفوري بين المصحفين مع إعادة احتساب جميع المتجهات، والمصفوفات، والمعدلات الإحصائية دون أي خلط منهجي.'
    },
    {
      id: 'jensen-shannon',
      term: 'تباعد ينسن-شانون التوزيعي (Jensen-Shannon Divergence - JSD)',
      category: 'نظرية الاحتمالات والمعلومات',
      definition: 'مقياس رياضي متماثل يقيس التباعد والتفاوت الاحتمالي بين توزيعين تردديين (مثل توزيع الحروف بين سورتين أو بين نسختي مصحف). يمتاز بكونه متناظراً، وتتراوح قيمته بدقة بين 0 (تطابق تام في التوزيع) و 1 (تباين قطعي).',
      example: 'يُستخدم لقياس التباعد النسبي الدقيق للحروف بين السور المكية والمدنية وبين العدين الكوفي والمدني.'
    },
    {
      id: 'spearman-rho',
      term: 'معامل ارتباط الرتب لسبيرمان (Spearman Rank Correlation - ρ)',
      category: 'الإحصاء اللا معلمي',
      definition: 'يقيس قوة واتجاه العلاقة الرتبية بين تسلسلين. يحسب مدى تطابق رتب الحروف الـ 28 بين سورتين بعد فرزها من الأكثر للأقل تكراراً، دون التأثر بالقيم الشاذة أو الفروق الهائلة في طول السور.',
      example: 'إذا تشابهت السورتان في أن الألف ثم اللام ثم النون هي الحروف الأولى، فإن معامل سبيرمان يقترب من +1.00.'
    },
    {
      id: 'ttr-diversity',
      term: 'معيار التنوع المعجمي (Type-Token Ratio - TTR)',
      category: 'اللسانيات الحاسوبية',
      definition: 'النسبة بين عدد المفردات الفريدة (Types) وإجمالي الكلمات المستخدمة في السورة (Tokens). يعكس درجة الثراء اللغوي وغزارة القاموس المفرداتي وعدم تكرار الألفاظ ذاتها داخل السورة.',
      example: 'قصار السور المكية تسجل قيماً عليا لـ TTR (تقترب من 80-90%) حيث تكاد كل كلمة تكون فريدة وجديدة في السياق.'
    },
    {
      id: 'verse-stddev',
      term: 'الانحراف المعياري لطول الآيات (Verse Length Std Dev - σ)',
      category: 'الإحصاء الوصفي',
      definition: 'مقياس إحصائي لمدى تشتت أطوال الآيات في السورة حول متوسطها الحسابي. الانحراف المنخفض يدل على سورة متجانسة الإيقاع ومتقاربة الفواصل (Uniform)، بينما الانحراف المرتفع يعكس تنوعاً ملحمياً في أطوال المقاطع.',
      example: 'سورة القمر وسورة الرحمن تمتازان بانحراف معياري منخفض جداً لتطابق أطوال الآيات والفواصل الموسيقية.'
    },
    {
      id: 'pca-projection',
      term: 'تحليل المركبات الرئيسية وإسقاط الفضاء (PCA 2D Projection)',
      category: 'الجبر الخطي والبيانات الضخمة',
      definition: 'تقنية لتقليص الأبعاد من الفضاء متعدد الأبعاد (28-D) إلى مستوٍ ثنائي الأبعاد (X, Y) مع الحفاظ على أكبر قدر ممكن من التباين الإحصائي، مما يسمح بتمثيل السور الـ 114 كنقاط بصرية واستكشاف تجمعاتها الفطرية.',
      example: 'تظهر السور المكية القصيرة مجمعة في منطقة خاصة تعكس كثافتها الصوتية المميزة مقارنة بسور الأحكام والتشريعات المدنية الطويلة.'
    },
    {
      id: 'kmeans-clustering',
      term: 'التجميع العنقودي غير الموجه (K-Means Clustering)',
      category: 'التعلم الآلي والإحصاء الرياضي',
      definition: 'خوارزمية تقسيمية تفصل السور الـ 114 إلى عناقيد متجانسة رياضياً (من k=3 إلى k=6) بالاعتماد على مصفوفة تشابه جيب التمام، لاستكشاف الأنماط الإيقاعية الدفينة في المتن القرآني دون تدخل بشري.',
      example: 'تجمع الخوارزمية تلقائياً بين السور التي تتقاسم إيقاع فواصل مشترك وتوزيعاً حرفياً متماثلاً (مثل السور المفتتحة بالحروف المقطعة).'
    }
  ];

  // Filtered glossary
  const filteredGlossary = useMemo(() => {
    if (!searchQuery.trim()) return glossaryItems;
    const q = searchQuery.toLowerCase().trim();
    return glossaryItems.filter(item => 
      item.term.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      item.example.toLowerCase().includes(q)
    );
  }, [searchQuery, glossaryItems]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] isolate flex items-center justify-center p-3 sm:p-4 md:p-6" dir="rtl">
      {/* 1. Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Dialog Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="letters-lab-info-modal-title"
        className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 animate-in zoom-in-95 ${
          isLight 
            ? 'bg-white border-ink-200 text-ink-900 shadow-ink-900/30' 
            : 'bg-[#0B1716] border-ink-800 text-ink-100 shadow-black/90'
        }`}
      >
        {/* Header */}
        <header className={`p-4 sm:p-5 border-b shrink-0 flex items-start justify-between gap-3 ${
          isLight 
            ? 'bg-gradient-to-r from-teal-50/50 via-ink-50 to-white border-ink-200' 
            : 'bg-gradient-to-r from-teal-950/30 via-ink-900 to-[#0B1716] border-ink-800'
        }`}>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                isLight 
                  ? 'bg-teal-50 text-[#1A5C5C] border-teal-200' 
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
              }`}>
                <Sigma className="w-3.5 h-3.5 text-teal-400" />
                <span>المنهجية الرياضية ونمذجة الفضاء المتجهي</span>
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                isLight ? 'bg-ink-100 border-ink-200 text-ink-600' : 'bg-ink-800 border-ink-700 text-ink-400'
              }`}>
                إصدار التحليل الإحصائي المتقدم
              </span>
            </div>

            <h2 
              id="letters-lab-info-modal-title"
              className={`text-lg sm:text-xl font-bold font-heading flex items-center gap-2 pt-1 ${
                isLight ? 'text-ink-900' : 'text-ink-100'
              }`}
            >
              <span>دليل المنهجية الرياضية والمعجم الإحصائي لبصمات السور</span>
            </h2>
            <p className={`text-xs font-mono ${isLight ? 'text-ink-500' : 'text-ink-400'}`}>
              توثيق شامل للأسس الرياضية، مقاييس التشابه الزاوي، وتوزيع باريتو المعتمد في استخراج البصمة الصوتية لكل سورة
            </p>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              isLight 
                ? 'bg-ink-100 border-ink-200 text-ink-500 hover:bg-ink-200 hover:text-ink-900' 
                : 'bg-ink-800/80 border-ink-700 text-ink-400 hover:bg-ink-700 hover:text-white'
            }`}
            title="إغلاق النافذة (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Navigation Tabs & Search */}
        <div className={`px-4 sm:px-5 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 ${
          isLight ? 'bg-ink-50 border-ink-200' : 'bg-black/30 border-ink-800'
        }`}>
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
            {[
              { id: 'methodology', label: 'المنهجية الرياضية', icon: Cpu },
              { id: 'glossary', label: 'المعجم الإحصائي', icon: BookOpen },
              { id: 'formulas', label: 'المعادلات والصيغ', icon: Sigma },
              { id: 'mushaf', label: 'ضوابط المصاحف والروايات', icon: Scale }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#1A5C5C] text-white shadow-xs'
                      : isLight 
                        ? 'text-ink-600 hover:bg-ink-200 hover:text-ink-900' 
                        : 'text-ink-400 hover:bg-ink-800 hover:text-ink-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          {activeTab === 'glossary' && (
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث في المصطلحات والمفاهيم..."
                className={`w-full pr-8 pl-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  isLight 
                    ? 'bg-white border-ink-300 text-ink-900 focus:border-[#1A5C5C]' 
                    : 'bg-ink-900 border-ink-700 text-ink-200 focus:border-teal-500'
                }`}
              />
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm leading-relaxed">
          
          {/* TAB 1: MATHEMATICAL METHODOLOGY */}
          {activeTab === 'methodology' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-teal-50/80 border-teal-200 text-teal-950' : 'bg-teal-950/30 border-teal-900/60 text-teal-200'
              }`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 mb-1.5 ${
                  isLight ? 'text-[#1A5C5C]' : 'text-teal-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                  <span>فلسفة النمذجة الرياضية للنص القرآني</span>
                </h3>
                <p className="text-xs leading-relaxed font-mono">
                  يقوم هذا التطبيق على نمذجة رياضية صارمة مستعارة من علوم اللسانيات الحاسوبية (Computational Linguistics) ونظرية معالجة الإشارات، حيث لا يُعامل النص القرآني كمجرد كلمات معجمية مجردة، بل كـ <strong>حقول ترددية صوتية وبصمات لسانية رقمية</strong> تتألف من 28 وحدة بنائية أولية (الحروف الهجائية الثمانية والعشرون).
                </p>
              </div>

              {/* Four Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Pillar 1 */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-white border-ink-200 shadow-xs' : 'bg-ink-900/70 border-ink-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center font-mono font-bold text-xs">
                      1
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm">الفضاء المتجهي متعدد الأبعاد (28-D Vector Space)</h4>
                  </div>
                  <p className="text-xs text-ink-600 dark:text-ink-400 leading-normal">
                    تُمثّل كل سورة بنقطة فريدة في فضاء ذي 28 بُعداً:
                    <span className="block my-1.5 p-2 rounded bg-ink-100 dark:bg-ink-800 text-center font-mono text-xs text-ink-800 dark:text-ink-200 dir-ltr" dir="ltr">
                      {'S = [p_1, p_2, ..., p_28]^T, where ∑ p_i = 100%'}
                    </span>
                    حيث p_i هي النسبة المئوية الدقيقة للحرف i بالنسبة لمجموع حروف تلك السورة. هذا التجنيس الرياضي يلغي تماماً أثر تفاوت الأحجام بين السور.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-white border-ink-200 shadow-xs' : 'bg-ink-900/70 border-ink-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                      2
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm">مقياس تشابه جيب التمام (Cosine Similarity)</h4>
                  </div>
                  <p className="text-xs text-ink-600 dark:text-ink-400 leading-normal">
                    لمقارنة التوافق الصوتي بين سورتين، نستخدم جيب تمام الزاوية بين متجهيهما بدلاً من المسافة الإقليدية:
                    <span className="block my-1.5 p-2 rounded bg-ink-100 dark:bg-ink-800 text-center font-mono text-xs text-ink-800 dark:text-ink-200 dir-ltr" dir="ltr">
                      {'Similarity(A, B) = cos(θ) = (A · B) / (||A|| × ||B||)'}
                    </span>
                    لأن المسافة الإقليدية تتأثر بالحجم، بينما زاوية جيب التمام تقيس <strong>تطابق البنية والنسب النغمية المجردة</strong>، مما يتيح مقارنة سورة الإخلاص بسورة البقرة دون تحيز لحجم السورة.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-white border-ink-200 shadow-xs' : 'bg-ink-900/70 border-ink-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold text-xs">
                      3
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm">توزيع باريتو وحساب التراكم الذاتي</h4>
                  </div>
                  <p className="text-xs text-ink-600 dark:text-ink-400 leading-normal">
                    من خلال فرز الحروف تنازلياً وفق تكرارها داخل كل سورة، نستخرج منحنى باريتو التراكمي. يُظهر المنحنى كيف تتكدس الحروف الحاكمة:
                    <span className="block my-1.5 p-2 rounded bg-ink-100 dark:bg-ink-800 text-center font-mono text-xs text-ink-800 dark:text-ink-200 dir-ltr" dir="ltr">
                      {'Cum_k = ∑ (Count_i / N_total) × 100%'}
                    </span>
                    ويتم الاعتماد على الأعداد الصحيحة الخام لتلافي أخطاء الفاصلة العائمة وضمان وصول المنحنى إلى 100.00% جبرياً عند الحرف الـ 28.
                  </p>
                </div>

                {/* Pillar 4 */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-white border-ink-200 shadow-xs' : 'bg-ink-900/70 border-ink-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-lime-500/20 text-lime-400 flex items-center justify-center font-mono font-bold text-xs">
                      4
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm">الإنتروبيا والتنوع اللساني لشعبور (Entropy)</h4>
                  </div>
                  <p className="text-xs text-ink-600 dark:text-ink-400 leading-normal">
                    نستخدم إنتروبيا شانون لقياس توازن وتنوع مخارج الحروف:
                    <span className="block my-1.5 p-2 rounded bg-ink-100 dark:bg-ink-800 text-center font-mono text-xs text-ink-800 dark:text-ink-200 dir-ltr" dir="ltr">
                      {'H(S) = - ∑ p_i × log2(p_i)'}
                    </span>
                    الإنتروبيا المرتفعة تعني توزيعاً غنياً ومتساوياً لجميع الحروف، بينما الإنتروبيا المنخفضة تعكس تركيزاً صوتياً استثنائياً يخدم غرض السورة ومقصدها البلاغي.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: STATISTICAL GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-ink-500 font-mono">
                <span>عرض {filteredGlossary.length} مصطلحاً إحصائياً دقيقاً:</span>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    إلغاء التصفية
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {filteredGlossary.map((item) => {
                  const isCopied = copiedId === item.id;
                  return (
                    <div 
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isLight 
                          ? 'bg-white border-ink-200 hover:border-teal-300 shadow-xs' 
                          : 'bg-ink-900/70 border-ink-800 hover:border-teal-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-[#1A5C5C] dark:text-teal-400">
                              {item.term}
                            </h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              isLight ? 'bg-ink-100 border-ink-200 text-ink-600' : 'bg-ink-800 border-ink-700 text-ink-400'
                            }`}>
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopy(item.id, `${item.term}\n\nالتعريف: ${item.definition}\n\nمثال تطبيقي: ${item.example}`)}
                          className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer shrink-0 ${
                            isCopied 
                              ? 'bg-emerald-500 text-white border-emerald-500' 
                              : isLight 
                                ? 'bg-ink-50 border-ink-200 text-ink-500 hover:bg-ink-100 hover:text-ink-800' 
                                : 'bg-ink-800 border-ink-700 text-ink-400 hover:bg-ink-700 hover:text-white'
                          }`}
                          title="نسخ تعريف المصطلح"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed mb-2 font-mono">
                        {item.definition}
                      </p>

                      <div className={`p-2.5 rounded-lg border text-[11px] font-mono ${
                        isLight ? 'bg-ink-50 border-ink-200 text-ink-600' : 'bg-black/40 border-ink-800 text-ink-400'
                      }`}>
                        <strong className="text-[#1A5C5C] dark:text-teal-400">مثال وتطبيق عملي: </strong>
                        <span>{item.example}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FORMULAS & EQUATIONS */}
          {activeTab === 'formulas' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-900/60 border-ink-800'
              }`}>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2 text-[#1A5C5C] dark:text-teal-400">
                  <Sigma className="w-4 h-4" />
                  <span>الصياغة الرياضية للمعادلات المستخدمة في المنظومة</span>
                </h3>
                <p className="text-xs text-ink-500 font-mono">
                  جميع العمليات الحسابية داخل التطبيق مبنية على خوارزميات تنفيذية مباشرة خالية من أي تقريب عشوائي أو نماذج تخمينية:
                </p>
              </div>

              {/* Equation Cards */}
              <div className="space-y-3 font-mono text-xs">
                
                {/* Eq 1 */}
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-white border-ink-200' : 'bg-ink-900/80 border-ink-800'
                }`}>
                  <div className="font-bold text-[#1A5C5C] dark:text-teal-400 mb-1">1. معادلة التردد النسبي للحرف (Letter Percentage)</div>
                  <div className={`p-3 rounded-lg border my-2 font-bold text-center text-xs sm:text-sm ${
                    isLight ? 'bg-teal-50/50 border-teal-200 text-teal-900' : 'bg-black/60 border-ink-800 text-teal-300'
                  }`} dir="ltr">
                    p(L_i, S) = ( Count(L_i, S) / TotalLetters(S) ) × 100%
                  </div>
                  <div className="text-[11px] text-ink-500">
                    {'حيث TotalLetters(S) = ∑ Count(L_j, S)، لضمان أن مجموع النسب الـ 28 لكل سورة يساوي 100.00% دوماً.'}
                  </div>
                </div>

                {/* Eq 2 */}
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-white border-ink-200' : 'bg-ink-900/80 border-ink-800'
                }`}>
                  <div className="font-bold text-[#1A5C5C] dark:text-teal-400 mb-1">2. معادلة تشابه جيب التمام الزاوي (Cosine Similarity)</div>
                  <div className={`p-3 rounded-lg border my-2 font-bold text-center text-xs sm:text-sm ${
                    isLight ? 'bg-teal-50/50 border-teal-200 text-teal-900' : 'bg-black/60 border-ink-800 text-teal-300'
                  }`} dir="ltr">
                    cos(θ) = ( A • B ) / ( ||A|| × ||B|| ) = [ ∑(a_i × b_i) ] / [ √(∑ a_i²) × √(∑ b_i²) ]
                  </div>
                  <div className="text-[11px] text-ink-500">
                    حيث يتراوح الناتج بين $0.000$ (تعامد تام وانعدام تشابه) إلى $1.000$ (تطابق تام بنسبة 100% في التوزيع النسبي للحروف).
                  </div>
                </div>

                {/* Eq 3 */}
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-white border-ink-200' : 'bg-ink-900/80 border-ink-800'
                }`}>
                  <div className="font-bold text-[#1A5C5C] dark:text-teal-400 mb-1">3. معادلة إنتروبيا شانون الصوتية (Shannon Entropy)</div>
                  <div className={`p-3 rounded-lg border my-2 font-bold text-center text-xs sm:text-sm ${
                    isLight ? 'bg-teal-50/50 border-teal-200 text-teal-900' : 'bg-black/60 border-ink-800 text-teal-300'
                  }`} dir="ltr">
                    H(S) = - ∑ [ p_i × log₂(p_i) ]  for all i where p_i &gt; 0
                  </div>
                  <div className="text-[11px] text-ink-500">
                    تقيس الإنتروبيا كمية المعلومات والتوزيع المتوازن للحروف بالبت (bits). الحد النظري الأقصى لتوزيع متساوٍ بين 28 حرفاً هو $\log_2(28) \approx 4.807$ بت.
                  </div>
                </div>

                {/* Eq 4 */}
                <div className={`p-4 rounded-xl border ${
                  isLight ? 'bg-white border-ink-200' : 'bg-ink-900/80 border-ink-800'
                }`}>
                  <div className="font-bold text-[#1A5C5C] dark:text-teal-400 mb-1">4. معادلة التراكم الرياضي الصارم (Exact Integer Accumulation)</div>
                  <div className={`p-3 rounded-lg border my-2 font-bold text-center text-xs sm:text-sm ${
                    isLight ? 'bg-teal-50/50 border-teal-200 text-teal-900' : 'bg-black/60 border-ink-800 text-teal-300'
                  }`} dir="ltr">
                    {'CumCount(k) = ∑ (i=1 to k) Count_i  ==>  CumPct(k) = ( CumCount(k) / TotalCount ) × 100%'}
                  </div>
                  <div className="text-[11px] text-ink-500">
                    تعتمد الخوارزمية جمع الأعداد الصحيحة الخام أولاً لمنع تراكم أخطاء الفاصلة العائمة (Rounding Drift)، مما يضمن رياضياً أن $CumPct(28) \equiv 100.00\%$.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: MUSHAF & CORPUS RULES */}
          {activeTab === 'mushaf' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-900/60 border-ink-800'
              }`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${
                  isLight ? 'text-[#1A5C5C]' : 'text-teal-400'
                }`}>
                  <Scale className="w-4 h-4" />
                  <span>الاستقلال المنهجي بين العد الكوفي والعد المدني</span>
                </h3>
                <p className="text-xs text-ink-500 font-mono">
                  حرصاً على الأمانة العلمية والتوثيق التراثي المتقن، يحتوي التطبيق على بنيتين منفصلتين 100% لكل رواية وعد، دون أي تلفيق أو دمج عشوائي:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kufi Card */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-white border-ink-200' : 'bg-ink-900/70 border-ink-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold text-sm ${isLight ? 'text-[#1A5C5C]' : 'text-teal-400'}`}>المصحف الكوفي (حفص عن عاصم)</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      6,236 آية
                    </span>
                  </div>
                  <ul className="text-xs text-ink-600 dark:text-ink-400 space-y-1.5 list-disc list-inside font-mono">
                    <li><strong>مصدر المتن:</strong> مجمع الملك فهد لطباعة المصحف الشريف.</li>
                    <li><strong>منهجية الفاتحة:</strong> البسملة آية معدودة برقم (1) تماشياً مع العد الكوفي المتواتر.</li>
                    <li><strong>إجمالي الكلمات:</strong> 77,797 كلمة.</li>
                    <li><strong>إجمالي الحروف:</strong> 330,709 حرفاً.</li>
                    <li><strong>مصفوفة التشابه:</strong> مصفوفة متماثلة 114×114 محسوبة بالكامل من المتن الكوفي.</li>
                  </ul>
                </div>

                {/* Madani Card */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-white border-ink-200' : 'bg-ink-900/70 border-ink-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-emerald-500">المصحف المدني (ورش عن نافع)</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      6,214 آية (المدني الأخير)
                    </span>
                  </div>
                  <ul className="text-xs text-ink-600 dark:text-ink-400 space-y-1.5 list-disc list-inside font-mono">
                    <li><strong>مصدر المتن:</strong> موثق عبر بوابة Quranpedia الرسمية (API ID: 4).</li>
                    <li><strong>منهجية الفاتحة:</strong> البسملة ليست آية معدودة في الفاتحة؛ الآية الأولى تبدأ بـ «الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ»، وتُعد الآية الأخيرة آيتين لاكتمال الآيات السبع.</li>
                    <li><strong>إجمالي الكلمات:</strong> 77,429 كلمة.</li>
                    <li><strong>إجمالي الحروف:</strong> 327,877 حرفاً.</li>
                    <li><strong>مصفوفة التشابه:</strong> مصفوفة مستقلة بالكامل مبنية على العد والنص المدني.</li>
                  </ul>
                </div>
              </div>

              {/* Normalization Note */}
              <div className={`p-3.5 rounded-xl border text-xs font-mono ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
              }`}>
                <strong>قاعدة المعالجة الصامتة الموحدة: </strong>
                <span>
                  يتم استخراج ترددات الحروف بعد توحيد رسم الألفات المهموزة والألف المقصورة إلى أصولها اللغوية الصامتة لضمان توافق التحليل الصرفي، مع عزل طبقة التشكيل (الحركات، الشدات، التناوين) في محلل منفصل لضمان أعلى درجات النقاء الإحصائي.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-between text-xs font-mono ${
          isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-900/60 border-ink-800'
        }`}>
          <div className="flex items-center gap-1.5 text-ink-500">
            <Info className="w-4 h-4 text-teal-500" />
            <span>كافة النماذج والمعادلات مُصممة وفق المعايير الرياضية للإحصاء اللغوي</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1A5C5C] text-white font-bold hover:bg-[#134747] transition-colors cursor-pointer shadow-xs"
          >
            إغلاق الدليل
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  HelpCircle, 
  X, 
  Compass, 
  Target, 
  Cpu, 
  CheckCircle2, 
  Info, 
  Sparkles,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { SECTION_GUIDES, SectionGuide } from '../data/sectionGuides';
import { useTheme } from '../context/ThemeContext';
import { useQueryDrawer } from '../context/QueryDrawerContext';

interface SectionHelpModalProps {
  guide: SectionGuide;
  isOpen: boolean;
  onClose: () => void;
}

export const SectionHelpModal: React.FC<SectionHelpModalProps> = ({ guide, isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflowY = originalOverflowY;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !guide) return null;

  const handleCopySummary = () => {
    const summary = `${guide.title}\n(${guide.subtitle})\n\n1. ما هو هذا المكان بالضبط:\n${guide.whatIsIt}\n\n2. في ماذا أحتاجه:\n${guide.whyDoINeedIt}\n\n3. كيف حُسبت النتائج والأرقام:\n${guide.howAreResultsCalculated}${
      guide.keyInsights?.length ? `\n\n4. إرشادات عملية:\n${guide.keyInsights.map((ins, i) => `• ${ins}`).join('\n')}` : ''
    }${guide.exampleNote ? `\n\n5. مثال:\n${guide.exampleNote}` : ''}`;
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Portal directly to document.body so it is 100% immune to parent modal/container clipping
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] isolate"
      dir="rtl"
    >
      {/* 1. Uniform Darkened Backdrop Overlay covering the full viewport */}
      <div 
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Side Drawer docked cleanly to the Left Edge (acting as an inspector in RTL layout) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 h-full h-[100dvh] max-h-screen w-full sm:w-[500px] md:w-[560px] max-w-[96vw] flex flex-col shadow-2xl border-r transition-transform duration-300 ease-out animate-in slide-in-from-left ${
          isLight 
            ? 'bg-[#FAF8F2] border-[#DED8C9] text-[#0F1419] shadow-xl' 
            : 'bg-[#0E201E] border-[#264340] text-[#F4F0E7] shadow-black/90'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`help-drawer-title-${guide.id}`}
      >
        {/* Sticky Header: Never clipped, always clearly visible at the top */}
        <header className={`p-4 sm:p-5 border-b shrink-0 flex items-start justify-between gap-3 ${
          isLight 
            ? 'bg-[#FBF9F2] border-[#DED8C9]' 
            : 'bg-[#142825] border-[#264340]'
        }`}>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                isLight
                  ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border-[#1A5C5C]/25'
                  : 'bg-[#1A5C5C]/25 text-[#A8BCB9] border-[#1A5C5C]/35'
              }`}>
                <HelpCircle className="w-3.5 h-3.5 text-[#C5A16A]" />
                <span>دليل واستعلامات: {guide.badge}</span>
              </span>
            </div>
            
            <h2 
              id={`help-drawer-title-${guide.id}`}
              className={`text-base sm:text-lg font-bold font-sans-arabic leading-snug ${
                isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'
              }`}
            >
              {guide.title}
            </h2>
            
            <p className={`text-xs font-sans-arabic leading-relaxed ${
              isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
            }`}>
              {guide.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                isLight 
                  ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F7F4EA] border-[#DED8C9]' 
                  : 'text-[#A8BCB9] hover:text-[#F4F0E7] hover:bg-[#10211F] border-[#264340]'
              }`}
              title="نسخ ملخص هذا الدليل إلى الحافظة"
              aria-label="نسخ الملخص"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                isLight 
                  ? 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#F7F4EA] border-[#DED8C9]' 
                  : 'text-[#A8BCB9] hover:text-[#F4F0E7] hover:bg-[#10211F] border-[#264340]'
              }`}
              title="إغلاق درج الاستعلامات (Esc)"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Body: Fully visible text, never clipped, generous bottom padding */}
        <div className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans-arabic text-sm leading-relaxed scrollbar-thin ${
          isLight ? 'bg-[#FAF8F2]' : 'bg-[#0E201E]'
        }`}>
          
          {/* Card 1: ما هو هذا المكان؟ */}
          <section className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight 
              ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419] shadow-2xs' 
              : 'bg-[#142825] border-[#264340] text-[#F4F0E7]'
          }`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl border shrink-0 ${
                isLight 
                  ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border-[#1A5C5C]/20' 
                  : 'bg-[#1A5C5C]/20 text-[#A8BCB9] border-[#1A5C5C]/30'
              }`}>
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                  ما هو هذا المكان بالضبط؟ (التعريف والمفهوم الأساسي)
                </h3>
                <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                  توصيف وظيفي لما تحتويه هذه الواجهة من أدوات ومخرجات
                </span>
              </div>
            </div>
            <p className={`whitespace-pre-line text-xs sm:text-sm leading-6 pr-1 font-sans-arabic ${
              isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
            }`}>
              {guide.whatIsIt}
            </p>
          </section>

          {/* Card 2: في ماذا أحتاجه؟ */}
          <section className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight 
              ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419] shadow-2xs' 
              : 'bg-[#142825] border-[#264340] text-[#F4F0E7]'
          }`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl border shrink-0 ${
                isLight 
                  ? 'bg-[#1A5C5C]/10 text-[#1A5C5C] border-[#1A5C5C]/20' 
                  : 'bg-[#1A5C5C]/20 text-[#A8BCB9] border-[#1A5C5C]/30'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                  في ماذا أحتاجه؟ (الغاية والفوائد العملية والبحثية)
                </h3>
                <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                  كيف توظف هذه المخرجات في التدبر، المقارنة، والبحث البياني
                </span>
              </div>
            </div>
            <p className={`whitespace-pre-line text-xs sm:text-sm leading-6 pr-1 font-sans-arabic ${
              isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
            }`}>
              {guide.whyDoINeedIt}
            </p>
          </section>

          {/* Card 3: كيف حُسبت النتائج والأرقام؟ */}
          <section className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight 
              ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419] shadow-2xs' 
              : 'bg-[#142825] border-[#264340] text-[#F4F0E7]'
          }`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl border shrink-0 ${
                isLight 
                  ? 'bg-[#C5A16A]/15 text-[#8C6D2D] border-[#C5A16A]/30' 
                  : 'bg-[#C5A16A]/20 text-[#E0C088] border-[#C5A16A]/30'
              }`}>
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                  كيف حُسبت النتائج والأرقام؟ (المنهجية الرياضية والحسابية)
                </h3>
                <span className={`text-[11px] block mt-0.5 ${isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'}`}>
                  الخوارزميات والمعايير البرمجية المتبعة في العد والاستخراج
                </span>
              </div>
            </div>
            
            <div className={`p-3.5 rounded-xl border text-xs sm:text-sm leading-6 font-sans-arabic whitespace-pre-line ${
              isLight 
                ? 'bg-[#F7F4EA] border-[#DED8C9] text-[#0F1419]' 
                : 'bg-[#10211F] border-[#264340] text-[#F4F0E7]'
            }`}>
              {guide.howAreResultsCalculated}
            </div>
          </section>

          {/* Card 4: إرشادات وأمثلة */}
          {guide.keyInsights && guide.keyInsights.length > 0 && (
            <section className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A16A]" />
                <h3 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-[#0F1419]' : 'text-[#F4F0E7]'}`}>
                  إرشادات عملية لفهم النتائج واستثمارها:
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {guide.keyInsights.map((insight, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                      isLight 
                        ? 'bg-[#FBF9F2] border-[#DED8C9] text-[#0F1419] shadow-2xs' 
                        : 'bg-[#142825] border-[#264340] text-[#F4F0E7]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-5">{insight}</span>
                  </div>
                ))}
              </div>

              {guide.exampleNote && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isLight
                    ? 'bg-[#C5A16A]/10 border-[#C5A16A]/30 text-[#8C6D2D]'
                    : 'bg-[#C5A16A]/15 border-[#C5A16A]/30 text-[#E0C088]'
                }`}>
                  <Info className="w-4 h-4 text-[#C5A16A] shrink-0 mt-0.5" />
                  <span className="leading-5 font-sans-arabic">{guide.exampleNote}</span>
                </div>
              )}
            </section>
          )}

          {/* Safe bottom spacer to ensure the bottom text is never cut off or crowded */}
          <div className="h-10 shrink-0" />
        </div>

        {/* Sticky Footer: Always accessible at bottom, never cut off */}
        <footer className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-[#FBF9F2] border-[#DED8C9]' : 'bg-[#142825] border-[#264340]'
        }`}>
          <span className={`font-mono text-[11px] hidden sm:inline-block ${
            isLight ? 'text-[#53605E]' : 'text-[#A8BCB9]'
          }`}>
            بصمة السور • الدليل التفاعلي
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`px-3 py-2 rounded-xl text-xs font-sans-arabic font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? 'bg-[#F7F4EA] hover:bg-white border-[#DED8C9] text-[#0F1419]'
                  : 'bg-[#10211F] hover:bg-[#163331] border-[#264340] text-[#F4F0E7]'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الخلاصة'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#1A5C5C] hover:bg-[#236e6e] text-white font-bold font-sans-arabic transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>إغلاق (Esc)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body
  );
};

interface SectionHelpButtonProps {
  guideId: string;
  label?: string;
  variant?: 'icon' | 'compact' | 'pill' | 'button';
  className?: string;
  title?: string;
}

export const SectionHelpButton: React.FC<SectionHelpButtonProps> = ({
  guideId,
  label = 'استعلام وشرح',
  variant = 'icon', // Isolated tiny corner icon by default
  className = '',
  title = 'استعلام وشرح هذا المكان (المفهوم، الغاية، والمنهجية الرياضية)'
}) => {
  const { openQuery } = useQueryDrawer();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const guide = SECTION_GUIDES[guideId];
  if (!guide) return null;

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => openQuery(guideId)}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs ${
            isLight
              ? 'bg-[#FBF9F2] hover:bg-[#F4F0E4] text-[#53605E] hover:text-[#1A5C5C] border border-[#DED8C9] hover:border-[#1A5C5C]/40'
              : 'bg-[#172322] hover:bg-[#1F2F2C] text-[#B7C1BC] hover:text-[#F4F0E7] border border-[#33433F] hover:border-[#B8935F]/40'
          } ${className}`}
          title={title}
          aria-label={title}
        >
          <HelpCircle className="w-4 h-4 text-[#B8935F]" />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => openQuery(guideId)}
          className={`flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] font-mono font-medium transition-all duration-150 cursor-pointer shrink-0 ${
            isLight
              ? 'bg-[#FBF9F2] hover:bg-[#F4F0E4] text-[#53605E] hover:text-[#1A5C5C] border border-[#DED8C9]'
              : 'bg-[#172322] hover:bg-[#1F2F2C] text-[#B7C1BC] hover:text-[#F4F0E7] border border-[#33433F]'
          } ${className}`}
          title={title}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#B8935F] shrink-0" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openQuery(guideId)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-sans-arabic font-medium transition-all duration-150 cursor-pointer shadow-2xs shrink-0 ${
            isLight
              ? 'bg-[#FBF9F2] hover:bg-[#F4F0E4] text-[#1A5C5C] border border-[#DED8C9] hover:border-[#1A5C5C]/40'
              : 'bg-[#172322] hover:bg-[#1F2F2C] text-[#F4F0E7] border border-[#33433F] hover:border-[#B8935F]/40'
          } ${className}`}
          title={title}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#B8935F] shrink-0" />
          <span>{label}</span>
        </button>
      )}
    </>
  );
};

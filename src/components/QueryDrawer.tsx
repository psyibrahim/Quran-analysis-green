import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  HelpCircle, 
  X, 
  Compass, 
  Target, 
  Cpu, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Search,
  BookOpen
} from 'lucide-react';
import { useQueryDrawer } from '../context/QueryDrawerContext';
import { useTheme } from '../context/ThemeContext';

export const QueryDrawer: React.FC = () => {
  const { 
    isOpen, 
    activeGuide, 
    activeGuideId, 
    closeQuery, 
    selectGuide, 
    allGuides 
  } = useQueryDrawer();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeQuery();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflowY = originalOverflowY;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeQuery]);

  // Filtered guides based on local search
  const filteredGuides = useMemo(() => {
    if (!localSearch.trim()) return allGuides;
    const q = localSearch.trim().toLowerCase();
    return allGuides.filter(g => 
      g.title.toLowerCase().includes(q) ||
      g.badge.toLowerCase().includes(q) ||
      g.subtitle.toLowerCase().includes(q) ||
      g.whatIsIt.toLowerCase().includes(q) ||
      g.whyDoINeedIt.toLowerCase().includes(q)
    );
  }, [allGuides, localSearch]);

  if (!isOpen || !activeGuide) return null;

  const handleCopySummary = () => {
    const summary = `${activeGuide.title}\n(${activeGuide.subtitle})\n\n1. ما هو هذا المكان بالضبط:\n${activeGuide.whatIsIt}\n\n2. في ماذا أحتاجه:\n${activeGuide.whyDoINeedIt}\n\n3. كيف حُسبت النتائج والأرقام:\n${activeGuide.howAreResultsCalculated}${
      activeGuide.keyInsights?.length ? `\n\n4. إرشادات عملية:\n${activeGuide.keyInsights.map((ins) => `• ${ins}`).join('\n')}` : ''
    }${activeGuide.exampleNote ? `\n\n5. مثال:\n${activeGuide.exampleNote}` : ''}`;
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] isolate"
      dir="rtl"
    >
      {/* 1. Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={closeQuery}
        aria-hidden="true"
      />

      {/* 2. Scholarly Reference Side Drawer (docked to Left in RTL) */}
      <aside 
        className="fixed top-0 bottom-0 left-0 h-full h-[100dvh] max-h-screen w-full sm:w-[540px] md:w-[620px] max-w-full flex flex-col shadow-2xl border-r border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] text-[#0F1419] dark:text-[#F4F0E7] transition-all duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="query-drawer-title"
      >
        {/* Header: Deep scholarly teal header matching visual spec */}
        <header className="p-4 sm:p-5 bg-[#173F3E] text-[#F4F0E7] border-b border-[#235251] shrink-0 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium border border-[#B8935F]/40 bg-[#122B2A] text-[#C5A16A]">
                <HelpCircle className="w-3.5 h-3.5 text-[#B8935F]" />
                <span>دليل ومنهجية: {activeGuide.badge}</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] border border-[#235251] bg-[#122B2A] text-[#A8BCB9]">
                مرجع بحثي محكّم
              </span>
            </div>
            <h3 
              id="query-drawer-title"
              className="text-base sm:text-lg font-bold font-sans-arabic leading-snug truncate text-[#F4F0E7]"
            >
              {activeGuide.title}
            </h3>
            <p className="text-xs text-[#A8BCB9] leading-relaxed line-clamp-2">
              {activeGuide.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-1.5 rounded-[6px] border border-[#235251] bg-[#122B2A] hover:bg-[#1A3837] text-xs font-mono text-[#F4F0E7] transition-colors flex items-center gap-1 cursor-pointer"
              title="نسخ ملخص الاستعلام إلى الحافظة"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#C5A16A]" />
                  <span className="hidden sm:inline text-[#C5A16A]">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#A8BCB9]" />
                  <span className="hidden sm:inline">نسخ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={closeQuery}
              className="p-1.5 rounded-[6px] border border-[#235251] bg-[#122B2A] hover:bg-[#1A3837] text-[#A8BCB9] hover:text-[#F4F0E7] transition-colors cursor-pointer"
              title="إغلاق لوحة المنهجية (Esc)"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Quick Search & Topic Switcher Bar */}
        <div className="p-3 border-b border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] flex flex-col gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8885]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="ابحث في أدلة واستعلامات التطبيق (PCA، K-Means، المقارنة، الفاتحة...)..."
              className="w-full pr-8.5 pl-3 py-1.5 rounded-[6px] text-xs border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] text-[#0F1419] dark:text-[#F4F0E7] focus:outline-none focus:border-[#1A5C5C] transition-colors"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7B8885] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-mono scrollbar-thin">
            <span className="shrink-0 text-[#7B8885] dark:text-[#8B9B96]">أدلة سريعة:</span>
            {allGuides.slice(0, 7).map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGuide(g.id)}
                className={`px-2 py-0.5 rounded-[4px] whitespace-nowrap transition-colors cursor-pointer ${
                  activeGuideId === g.id
                    ? 'bg-[#1A5C5C] text-[#F4F0E7] font-bold dark:bg-[#2B7470]'
                    : 'bg-[#FBF9F2] dark:bg-[#172322] text-[#53605E] dark:text-[#B7C1BC] border border-[#DED8C9] dark:border-[#33433F] hover:bg-[#F3EFE3]'
                }`}
              >
                {g.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans-arabic text-sm leading-relaxed">
          
          {/* Section 1: What is it? */}
          <section className="p-4 rounded-[8px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#1A5C5C] dark:bg-[#2B7470] rounded-xs" />
              <div className="w-6 h-6 rounded-[4px] bg-[#1A5C5C]/10 border border-[#1A5C5C]/30 flex items-center justify-center text-[#1A5C5C] dark:text-[#79A9A0] shrink-0">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                1. ما هو هذا المكان بالضبط؟ (التعريف والمفهوم العلمي)
              </h4>
            </div>
            <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line text-[#53605E] dark:text-[#B7C1BC] pr-3">
              {activeGuide.whatIsIt}
            </p>
          </section>

          {/* Section 2: Why do I need it? */}
          <section className="p-4 rounded-[8px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#B8935F] rounded-xs" />
              <div className="w-6 h-6 rounded-[4px] bg-[#B8935F]/15 border border-[#B8935F]/30 flex items-center justify-center text-[#8C6B37] dark:text-[#C5A16A] shrink-0">
                <Target className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                2. في ماذا أحتاجه؟ (الغاية والجدوى التحليلية والتدبرية)
              </h4>
            </div>
            <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line text-[#53605E] dark:text-[#B7C1BC] pr-3">
              {activeGuide.whyDoINeedIt}
            </p>
          </section>

          {/* Section 3: How are results calculated? */}
          <section className="p-4 rounded-[8px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#1A5C5C] dark:bg-[#2B7470] rounded-xs" />
              <div className="w-6 h-6 rounded-[4px] bg-[#1A5C5C]/10 border border-[#1A5C5C]/30 flex items-center justify-center text-[#1A5C5C] dark:text-[#79A9A0] shrink-0">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                3. كيف حُسبت الأرقام والنتائج؟ (المنهجية والمعادلات الرياضية)
              </h4>
            </div>
            <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line text-[#53605E] dark:text-[#B7C1BC] pr-3 font-mono">
              {activeGuide.howAreResultsCalculated}
            </p>
          </section>

          {/* Section 4: Key Insights */}
          {activeGuide.keyInsights && activeGuide.keyInsights.length > 0 && (
            <section className="p-4 rounded-[8px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#1A5C5C] dark:bg-[#2B7470] rounded-xs" />
                <div className="w-6 h-6 rounded-[4px] bg-[#1A5C5C]/10 border border-[#1A5C5C]/30 flex items-center justify-center text-[#1A5C5C] dark:text-[#79A9A0] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                  4. إرشادات وتطبيقات عملية (كيف توظف هذه المخرجات):
                </h4>
              </div>
              <ul className="space-y-1.5 pr-3">
                {activeGuide.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] leading-relaxed text-[#53605E] dark:text-[#B7C1BC]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A5C5C] dark:bg-[#2B7470] mt-1.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Section 5: Example note */}
          {activeGuide.exampleNote && (
            <section className="p-4 rounded-[8px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#B8935F] rounded-xs" />
                <div className="w-6 h-6 rounded-[4px] bg-[#B8935F]/15 border border-[#B8935F]/30 flex items-center justify-center text-[#8C6B37] dark:text-[#C5A16A] shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-[#0F1419] dark:text-[#F4F0E7]">
                  5. مثال تطبيقي توضيحي:
                </h4>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-[#53605E] dark:text-[#B7C1BC] pr-3">
                {activeGuide.exampleNote}
              </p>
            </section>
          )}

          {/* Related Guides Switcher */}
          <section className="p-3.5 rounded-[8px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] space-y-2">
            <span className="text-xs font-bold text-[#0F1419] dark:text-[#F4F0E7] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#B8935F]" />
              تصفح استعلامات وأدلة أخرى:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {filteredGuides
                .filter(g => g.id !== activeGuide.id)
                .slice(0, 6)
                .map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => selectGuide(g.id)}
                    className="text-right p-2 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#FBF9F2] dark:bg-[#172322] hover:border-[#1A5C5C] text-xs transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pl-2">
                      <div className="font-bold truncate text-[11px] text-[#0F1419] dark:text-[#F4F0E7] group-hover:text-[#1A5C5C] dark:group-hover:text-[#C5A16A]">
                        {g.title}
                      </div>
                      <div className="text-[10px] text-[#7B8885] truncate font-mono">
                        {g.badge}
                      </div>
                    </div>
                    <ArrowLeft className="w-3 h-3 text-[#7B8885] group-hover:text-[#1A5C5C] dark:group-hover:text-[#C5A16A] shrink-0" />
                  </button>
                ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="p-3 px-5 border-t border-[#DED8C9] dark:border-[#33433F] bg-[#F7F4EA] dark:bg-[#121C1B] shrink-0 flex items-center justify-between text-xs font-mono text-[#7B8885] dark:text-[#8B9B96]">
          <span>مختبر بصمة السور · التوثيق والرياضيات</span>
          <button
            type="button"
            onClick={closeQuery}
            className="hover:text-[#0F1419] dark:hover:text-[#F4F0E7] cursor-pointer"
          >
            إغلاق (Esc)
          </button>
        </footer>

      </aside>
    </div>,
    document.body
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  HelpCircle, 
  X, 
  BookOpen, 
  Layers, 
  Scale, 
  Sparkles,
  Info
} from 'lucide-react';
import { MATH_METRICS, MathMetricInfo } from '../data/mathExplanations';
import { useTheme } from '../context/ThemeContext';

export interface MathTooltipProps {
  metricId?: keyof typeof MATH_METRICS | string;
  customInfo?: Partial<MathMetricInfo>;
  value?: string | number;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  showUnderline?: boolean;
  className?: string;
  wrapperClassName?: string;
  as?: 'span' | 'div';
}

export const MathTooltip: React.FC<MathTooltipProps> = ({
  metricId,
  customInfo,
  value,
  children,
  position = 'top',
  showUnderline = true,
  className = '',
  wrapperClassName = '',
  as
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    arrowLeft: number;
    placement: 'top' | 'bottom';
    width: number;
  } | null>(null);

  const isBlock = as === 'div' || wrapperClassName.includes('w-full') || wrapperClassName.includes('block');
  const Component = as || (isBlock ? 'div' : 'span');

  const metric: MathMetricInfo | undefined = (metricId && MATH_METRICS[metricId]) 
    ? { ...MATH_METRICS[metricId], ...customInfo } 
    : (customInfo as MathMetricInfo | undefined);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Tooltip width responsive to viewport but clamped
    const width = Math.min(360, Math.max(260, viewportWidth - 24));
    const halfWidth = width / 2;
    const targetCenterX = rect.left + rect.width / 2;

    // Strict clamping within viewport bounds so it never spills horizontally
    let left = targetCenterX - halfWidth;
    if (left < 12) {
      left = 12;
    } else if (left + width > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - 12 - width);
    }

    // Arrow offset inside tooltip box pointing to trigger center
    const arrowLeft = Math.max(18, Math.min(width - 18, targetCenterX - left));

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const estimatedHeight = 320;

    let placement: 'top' | 'bottom' = position === 'bottom' ? 'bottom' : 'top';
    let top = 0;

    if (position === 'bottom') {
      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        placement = 'top';
        top = rect.top - 8;
      } else {
        placement = 'bottom';
        top = rect.bottom + 8;
      }
    } else {
      if (spaceAbove < estimatedHeight && spaceBelow > spaceAbove) {
        placement = 'bottom';
        top = rect.bottom + 8;
      } else {
        placement = 'top';
        top = rect.top - 8;
      }
    }

    setCoords({ top, left, arrowLeft, placement, width });
  };

  // Close on outside click (especially on mobile/desktop) and on Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        isOpen && 
        containerRef.current && 
        !containerRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Update position on open, window resize, and window scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, position]);

  if (!metric) {
    return <>{children}</>;
  }

  return (
    <Component 
      ref={containerRef as any}
      className={`relative ${isBlock ? 'block w-full min-w-0' : 'inline-flex items-center'} ${wrapperClassName}`}
    >
      {/* Target Wrapped Child - Clickable on demand */}
      <span 
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => {
            const next = !prev;
            if (next) {
              requestAnimationFrame(() => updatePosition());
            }
            return next;
          });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(prev => {
              const next = !prev;
              if (next) {
                requestAnimationFrame(() => updatePosition());
              }
              return next;
            });
          }
        }}
        className={`cursor-pointer transition-all ${isBlock ? 'block w-full min-w-0' : 'inline-flex items-center gap-0.5'} select-none ${
          showUnderline 
            ? (isLight 
                ? 'border-b border-dashed border-[#1A5C5C]/60 hover:border-[#1A5C5C] hover:text-[#1A5C5C]' 
                : 'border-b border-dashed border-teal-400/50 hover:border-teal-300 hover:text-teal-300') 
            : ''
        } ${className}`}
        aria-label={`عرض كيفية حساب الرقم: ${metric.name}`}
      >
        {children}
      </span>

      {/* Floating Smart Academic Tooltip Card rendered in Portal to prevent DOM layout shift */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && coords && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, y: coords.placement === 'top' ? 6 : -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.placement === 'top' ? 4 : -4, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`fixed z-[999999] text-right pointer-events-auto shadow-2xl rounded-xl p-3.5 space-y-2.5 backdrop-blur-xl border ${
                isLight 
                  ? 'bg-white/98 text-ink-800 border-teal-200 shadow-teal-950/10' 
                  : 'bg-[#0E1515]/98 text-ink-100 border-teal-500/30 shadow-black/80'
              }`}
              style={{
                width: `${coords.width}px`,
                maxWidth: 'calc(100% - 24px)',
                left: `${coords.left}px`,
                ...(coords.placement === 'top' 
                  ? { bottom: `${Math.max(8, window.innerHeight - coords.top)}px` } 
                  : { top: `${Math.max(8, coords.top)}px` }
                )
              }}
            >
              {/* Header: Title, Symbol, Close Button */}
              <div className="flex items-start justify-between gap-2 border-b border-ink-700/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isLight ? 'bg-teal-50 text-[#1A5C5C]' : 'bg-teal-950/80 text-teal-400 border border-teal-500/30'
                  }`}>
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold flex items-center gap-1.5 font-heading ${
                      isLight ? 'text-[#1A5C5C]' : 'text-teal-400'
                    }`}>
                      <span>{metric.name}</span>
                      {metric.symbol && (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                          {metric.symbol}
                        </span>
                      )}
                    </h4>
                    {metric.englishName && (
                      <p className="text-[10px] text-ink-400 font-mono tracking-tight">
                        {metric.englishName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {metric.range && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-ink-800/80 text-ink-300 border border-ink-700/60 hidden sm:inline-block">
                      {metric.range}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="p-1 rounded hover:bg-ink-800 text-ink-400 hover:text-ink-200 transition-colors"
                    title="إغلاق التلميح"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Prominent Current Value Display if present */}
              {value !== undefined && (
                <div className={`p-2 rounded-lg flex items-center justify-between border ${
                  isLight ? 'bg-teal-50/80 border-teal-200' : 'bg-teal-950/30 border-teal-500/30'
                }`}>
                  <span className="text-[11px] font-mono text-ink-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    <span>القيمة المسجلة الحالية:</span>
                  </span>
                  <span className={`font-mono font-bold text-sm ${isLight ? 'text-[#1A5C5C]' : 'text-teal-300'}`}>
                    {value}
                  </span>
                </div>
              )}

              {/* Formula Monospace Box */}
              {metric.formula && (
                <div className="space-y-1">
                  <span className="text-[10px] text-ink-400 font-mono block">
                    الصيغة والمعادلة الرياضية:
                  </span>
                  <div className={`p-2 rounded-lg border font-mono text-[11px] dir-ltr text-center select-all overflow-x-auto ${
                    isLight 
                      ? 'bg-ink-100 text-ink-900 border-ink-300' 
                      : 'bg-black/70 text-emerald-300 border-ink-800 shadow-inner'
                  }`}>
                    {metric.formula}
                  </div>
                </div>
              )}

              {/* Methodology Text */}
              <div className="space-y-1 text-xs">
                <span className={`text-[10px] font-bold font-mono flex items-center gap-1 ${
                  isLight ? 'text-[#1A5C5C]' : 'text-teal-400'
                }`}>
                  <BookOpen className="w-3 h-3 text-teal-400" />
                  <span>المنهجية وطريقة الحساب الأكاديمية:</span>
                </span>
                <p className="text-[11px] leading-relaxed text-ink-300">
                  {metric.methodology}
                </p>
              </div>

              {/* Variables Breakdown (if available) */}
              {metric.variables && metric.variables.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-ink-800/60">
                  <span className="text-[10px] text-ink-400 font-mono block">
                    دلالة متغيرات المعادلة:
                  </span>
                  <div className="grid grid-cols-1 gap-1 text-[10px] font-mono">
                    {metric.variables.map((v, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-ink-300">
                        <strong className="text-teal-300 shrink-0 font-bold">{v.symbol}:</strong>
                        <span className="text-ink-400 leading-snug">{v.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interpretation */}
              <div className={`p-2 rounded-lg border text-[11px] leading-relaxed ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/25 border-amber-500/30 text-amber-200/90'
              }`}>
                <strong className="font-bold block mb-0.5 text-[10px] uppercase font-mono text-amber-400 flex items-center gap-1">
                  <Scale className="w-3 h-3" />
                  <span>الدلالة والتفسير الإحصائي:</span>
                </strong>
                {metric.interpretation}
              </div>

              {/* Footer Academic Transparency Badge */}
              <div className="pt-1 text-[9px] text-ink-400 font-mono flex items-center justify-between border-t border-ink-800/60">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>بيانات محوسبة بنزاهة وتجريد رياضي</span>
                </span>
                <span>نظام التوثيق الأكاديمي</span>
              </div>

              {/* Tiny arrow triangle pointing to target */}
              <div 
                className={`absolute w-2.5 h-2.5 rotate-45 border pointer-events-none ${
                  coords.placement === 'top' 
                    ? 'top-full -mt-1.5 border-b border-r border-ink-700/60' 
                    : 'bottom-full -mb-1.5 border-t border-l border-ink-700/60'
                } ${isLight ? 'bg-white' : 'bg-[#0B1716]'}`}
                style={{ 
                  left: `${coords.arrowLeft}px`,
                  transform: 'translateX(-50%) rotate(45deg)' 
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </Component>
  );
};

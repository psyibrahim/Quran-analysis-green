import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#DED8C9] dark:border-[#33433F] ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-[#1A5C5C] dark:bg-[#2B7470] rounded-xs" />
          <h2 className="text-base sm:text-lg font-bold font-sans-arabic text-[#0F1419] dark:text-[#F4F0E7]">
            {title}
          </h2>
          {badge && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] border border-[#B8935F]/40 dark:border-[#C5A16A]/40 text-[#8C6B37] dark:text-[#C5A16A] bg-[#F7F2E8] dark:bg-[#262118]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-[#53605E] dark:text-[#B7C1BC] font-sans-arabic pr-3.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};

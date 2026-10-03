import React from 'react';

interface StatChipProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: 'neutral' | 'teal' | 'gold';
  className?: string;
}

export const StatChip: React.FC<StatChipProps> = ({
  label,
  value,
  unit,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'border-[#DED8C9] dark:border-[#33433F] text-[#53605E] dark:text-[#B7C1BC]',
    teal: 'border-[#1A5C5C]/30 dark:border-[#2B7470]/40 text-[#1A5C5C] dark:text-[#79A9A0]',
    gold: 'border-[#B8935F]/40 dark:border-[#C5A16A]/40 text-[#8C6B37] dark:text-[#C5A16A]',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border bg-[#FBF9F2] dark:bg-[#172322] text-xs font-sans-arabic ${variantStyles[variant]} ${className}`}
    >
      <span className="text-[#7B8885] dark:text-[#8B9B96] text-[11px]">{label}:</span>
      <span className="font-bold font-mono tabular-nums text-[#0F1419] dark:text-[#F4F0E7]">
        {value}
      </span>
      {unit && <span className="text-[10px] text-[#7B8885] dark:text-[#8B9B96]">{unit}</span>}
    </div>
  );
};

import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-[6px] border border-[#DED8C9] dark:border-[#33433F] bg-[#F1ECE0] dark:bg-[#121C1B] ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 font-sans-arabic rounded-[4px] font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer ${
              isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
            } ${
              isSelected
                ? 'bg-[#1A5C5C] text-[#F4F0E7] shadow-xs dark:bg-[#2B7470]'
                : 'text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7]'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] font-mono tabular-nums px-1 py-0.2 rounded ${
                  isSelected
                    ? 'bg-black/20 text-[#F4F0E7]'
                    : 'bg-[#DED8C9]/50 dark:bg-[#33433F]/60 text-[#53605E] dark:text-[#B7C1BC]'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

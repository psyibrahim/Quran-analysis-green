import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
  placeholder?: string;
  className?: string;
  sizeVariant?: 'sm' | 'md';
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeValue,
  placeholder = 'بحث...',
  className = '',
  sizeVariant = 'md',
  ...props
}) => {
  const isSm = sizeVariant === 'sm';

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className={`absolute right-2.5 text-[#7B8885] dark:text-[#7D8C87] pointer-events-none ${
          isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full pr-8.5 pl-7 bg-[#FBF9F2] dark:bg-[#172322] border border-[#DED8C9] dark:border-[#33433F] text-[#0F1419] dark:text-[#F4F0E7] placeholder:text-[#7B8885] dark:placeholder:text-[#6E7E7A] rounded-[6px] font-sans-arabic focus:outline-none focus:border-[#1A5C5C] dark:focus:border-[#2B7470] transition-colors ${
          isSm ? 'py-1 text-xs' : 'py-1.5 text-xs sm:text-sm'
        }`}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChangeValue('')}
          className="absolute left-2 text-[#7B8885] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] p-0.5 rounded cursor-pointer"
          title="مسح البحث"
        >
          <X className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </button>
      )}
    </div>
  );
};

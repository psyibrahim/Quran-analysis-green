import React from 'react';

interface VerseNumberMedallionProps {
  number: number;
  className?: string;
  isHovered?: boolean;
}

export const VerseNumberMedallion: React.FC<VerseNumberMedallionProps> = ({
  number,
  className = '',
  isHovered = false,
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center relative select-none font-mono tabular-nums transition-colors duration-150 ${className}`}
      style={{ minWidth: '28px', height: '28px' }}
      title={`الآية ${number}`}
    >
      <svg
        className={`w-7 h-7 transition-colors duration-150 ${
          isHovered ? 'text-[#1A5C5C] dark:text-[#2B7470]' : 'text-[#B8935F] dark:text-[#C5A16A]'
        }`}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer 8-point geometric rosette */}
        <rect
          x="6"
          y="6"
          width="24"
          height="24"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <rect
          x="6"
          y="6"
          width="24"
          height="24"
          rx="3"
          transform="rotate(45 18 18)"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeOpacity="0.8"
        />
        <circle
          cx="18"
          cy="18"
          r="10"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="1.5 1.5"
          fill="none"
          strokeOpacity="0.6"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#0F1419] dark:text-[#F4F0E7]">
        {number}
      </span>
    </span>
  );
};

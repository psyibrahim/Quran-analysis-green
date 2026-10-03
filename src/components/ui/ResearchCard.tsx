import React from 'react';
import { ManuscriptCorner } from './ManuscriptCorner';

interface ResearchCardProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  withCorners?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const ResearchCard: React.FC<ResearchCardProps> = ({
  id,
  children,
  className = '',
  withCorners = false,
  onClick,
  hoverable = false,
  padding = 'md',
  style,
}) => {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-7',
  };

  return (
    <div
      id={id}
      style={style}
      onClick={onClick}
      className={`relative bg-[#FBF9F2] dark:bg-[#172322] border border-[#DED8C9] dark:border-[#33433F] rounded-[8px] transition-colors duration-150 ${paddingMap[padding]} ${
        hoverable ? 'hover:border-[#1A5C5C]/50 dark:hover:border-[#2B7470]/60 cursor-pointer' : ''
      } ${className}`}
    >
      {withCorners && (
        <>
          <ManuscriptCorner position="top-right" />
          <ManuscriptCorner position="top-left" />
          <ManuscriptCorner position="bottom-right" />
          <ManuscriptCorner position="bottom-left" />
        </>
      )}
      {children}
    </div>
  );
};

import React from 'react';

export const ManuscriptCorner: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}> = ({ position, className = '' }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-1.5 right-1.5 border-t border-r';
      case 'top-left':
        return 'top-1.5 left-1.5 border-t border-l';
      case 'bottom-right':
        return 'bottom-1.5 right-1.5 border-b border-r';
      case 'bottom-left':
        return 'bottom-1.5 left-1.5 border-b border-l';
    }
  };

  return (
    <div
      className={`absolute w-3 h-3 pointer-events-none border-[#B8935F]/40 dark:border-[#C5A16A]/40 ${getPositionClasses()} ${className}`}
      aria-hidden="true"
    />
  );
};

import React from 'react';

interface ResearchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'gold' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const ResearchButton: React.FC<ResearchButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeMap = {
    sm: 'text-xs py-1.5 px-2.5 gap-1.5 min-h-[30px]',
    md: 'text-xs sm:text-sm py-2 px-3.5 gap-2 min-h-[36px]',
    lg: 'text-sm sm:text-base py-2.5 px-4 gap-2.5 min-h-[42px]',
  };

  const variantMap = {
    primary:
      'bg-[#1A5C5C] hover:bg-[#144848] text-[#F4F0E7] border border-[#144848] dark:bg-[#2B7470] dark:hover:bg-[#358A85] dark:border-[#24615E]',
    secondary:
      'bg-[#FBF9F2] hover:bg-[#F3EFE3] text-[#0F1419] border border-[#DED8C9] dark:bg-[#172322] dark:hover:bg-[#1E2D2C] dark:text-[#F4F0E7] dark:border-[#33433F]',
    quiet:
      'bg-transparent hover:bg-[#DED8C9]/30 text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] dark:hover:bg-[#33433F]/40 border border-transparent',
    gold:
      'bg-[#B8935F] hover:bg-[#A07E4D] text-[#0F1419] font-medium border border-[#A07E4D] dark:bg-[#C5A16A] dark:hover:bg-[#D3B17B] dark:border-[#B38F58]',
    icon:
      'p-1.5 text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] hover:bg-[#DED8C9]/30 dark:hover:bg-[#33433F]/40 border border-[#DED8C9] dark:border-[#33433F] rounded-[6px]',
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-sans-arabic font-medium rounded-[6px] transition-colors duration-150 whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none ${
        variant === 'icon' ? 'min-h-[32px] min-w-[32px]' : sizeMap[size]
      } ${variantMap[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

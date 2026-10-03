import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Compass, 
  BarChart3, 
  GitCompare, 
  Scale, 
  Table, 
  Flame, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  Music, 
  Brain, 
  Network, 
  Share2, 
  Sun, 
  Moon, 
  HelpCircle, 
  ChevronDown, 
  Menu, 
  X,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useQuranCorpus } from '../context/QuranCorpusContext';
import { useQueryDrawer } from '../context/QueryDrawerContext';
import { formatSurahName } from '../utils/arabic';

export interface NavGroup {
  id: string;
  label: string;
  shortLabel: string;
  items: {
    id: ActiveTab;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalSurahs: number;
  totalAyahs: number;
  totalWords: number;
  selectedSurahName?: string;
  onBackFromAnalysis?: () => void;
  quickReturnLabel?: string;
  onQuickReturn?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalSurahs,
  totalAyahs,
  totalWords,
  selectedSurahName,
  onBackFromAnalysis,
  quickReturnLabel,
  onQuickReturn,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { activeMushaf, toggleActiveMushaf, setActiveMushaf, activeMeta } = useQuranCorpus();
  const { openQuery } = useQueryDrawer();

  const [openGroupDropdown, setOpenGroupDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Grouped Navigation Architecture matching user brief
  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        id: 'quran',
        label: 'المصحف والسور',
        shortLabel: 'السور',
        items: [
          {
            id: 'quran-reader',
            label: 'قراءة المصحف',
            desc: 'المتن القرآني الكامل مع التدبر والعد الآياتي',
            icon: BookOpen,
          },
          {
            id: 'explorer',
            label: 'فهرس السور',
            desc: 'فهرس وبحث سور القرآن الـ 114 وبياناتها الوصفية',
            icon: Compass,
          },
          {
            id: 'dashboard',
            label: 'لوحة الإحصاءات',
            desc: 'المؤشرات العامة والموازين الكلية للسور والآيات',
            icon: BarChart3,
          },
        ],
      },
      {
        id: 'mushaf',
        label: 'المصاحف والمقارنات',
        shortLabel: 'المصاحف',
        items: [
          {
            id: 'mushaf-direct',
            label: 'مقارنة آيات المصحفين',
            desc: 'مقابلة نصية متزامنة بين المتن الكوفي والمتن المدني آية بآية',
            icon: Scale,
          },
          {
            id: 'mushaf-diff-table',
            label: 'جدول فوارق المصاحف',
            desc: 'فهرس وحصر فوارق العدين ورؤوس الآي بين الروايتين',
            icon: Table,
          },
          {
            id: 'meccan-medinan',
            label: 'مقارنة المكي والمدني',
            desc: 'التحليل المقارن بين خصائص السور المكية والمدنية',
            icon: BarChart3,
          },
          {
            id: 'comparator',
            label: 'مقارنة السور',
            desc: 'مقارنة إحصائية مباشرة بين سورتين مختارتين',
            icon: GitCompare,
          },
          {
            id: 'word-comparator',
            label: 'مقارنة الكلمات',
            desc: 'المقارنة الإحصائية الخام للكلمات والألفاظ والتزامن النصي',
            icon: ArrowRightLeft,
          },
          {
            id: 'letters-comparator',
            label: 'مقارنة تكرار الحروف',
            desc: 'مخطط شريطي متداخل لتباين الحروف بين سورتين',
            icon: BarChart3,
          },
        ],
      },
      {
        id: 'letters',
        label: 'الحروف والتشكيل',
        shortLabel: 'الحروف',
        items: [
          {
            id: 'letters-heatmap',
            label: 'خريطة الحروف',
            desc: 'مصفوفة التردد الحسابي للحروف الـ 28 عبر كل السور',
            icon: Flame,
          },
          {
            id: 'letters-extremes',
            label: 'القيم القصوى للحروف',
            desc: 'أعلى وأدنى تكرار ونسب لكل حرف من حروف المعجم',
            icon: Layers,
          },
          {
            id: 'letters-phonetics',
            label: 'مخارج وأصوات الحروف',
            desc: 'رادار المخارج والصفات الصوتية والتجانس الصوتي',
            icon: Sparkles,
          },
          {
            id: 'letters-diacritics',
            label: 'حركات التشكيل',
            desc: 'إحصاء الحركات والتنوين والسكون والشدات',
            icon: BookOpen,
          },
          {
            id: 'letters-cumulative',
            label: 'التوزيع التراكمي',
            desc: 'المنحنى التراكمي الرياضي لتدفق الحروف عبر القرآن',
            icon: TrendingUp,
          },
        ],
      },
      {
        id: 'linguistics',
        label: 'اللسانيات والإيقاع',
        shortLabel: 'اللسانيات',
        items: [
          {
            id: 'verse-endings',
            label: 'فواصل الآيات والإيقاع',
            desc: 'حروف الروي وتجانس الفواصل الصوتية والإيقاع',
            icon: Music,
          },
          {
            id: 'openings-families',
            label: 'عوائل السور وفواتح الحروف',
            desc: 'الفواتح الـ 29 وعوائل آل حم والمسبحات والطواسين',
            icon: Sparkles,
          },
          {
            id: 'lexical-richness',
            label: 'اللسانيات والنسبة الذهبية',
            desc: 'قانون زيف اللساني، التنوع المفرداتي، والتناسب الذهبي',
            icon: Brain,
          },
        ],
      },
      {
        id: 'similarity',
        label: 'التشابه والتنقيب',
        shortLabel: 'التشابه',
        items: [
          {
            id: 'similarity-matrix',
            label: 'مصفوفة تشابه السور',
            desc: 'مصفوفة ومستكشف التشابه الصرفي والإحصائي 114×114',
            icon: Network,
          },
          {
            id: 'similarity-clusters',
            label: 'عناقيد وتصنيف السور',
            desc: 'عناقيد K-Means متعددة الأبعاد وتحزيب الصحابة',
            icon: Share2,
          },
        ],
      },
    ],
    []
  );

  // Identify active group and active item
  const activeGroup = useMemo(() => {
    return navGroups.find((g) => g.items.some((i) => i.id === activeTab)) || navGroups[0];
  }, [navGroups, activeTab]);

  const activeItem = useMemo(() => {
    for (const g of navGroups) {
      const match = g.items.find((i) => i.id === activeTab);
      if (match) return match;
    }
    return navGroups[0].items[0];
  }, [navGroups, activeTab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenGroupDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setOpenGroupDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F2] dark:bg-[#0E201E] text-[#0F1419] dark:text-[#F4F0E7] border-b border-[#DED8C9] dark:border-[#1F3835] shadow-xs select-none transition-colors duration-150">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6">
        
        {/* Tier 1: Main Brand & Scholarly Control Bar */}
        <div className="flex items-center justify-between h-[64px] sm:h-[76px] gap-2 sm:gap-3">
          
          {/* Right Zone (RTL start): Brand Identity & Rosette */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            {/* Islamic Geometric Rosette Brand Mark */}
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-[7px] sm:rounded-[8px] bg-[#EFECE2] dark:bg-[#162E2B] border border-[#DED8C9] dark:border-[#B8935F]/40 flex items-center justify-center shrink-0 shadow-2xs">
              <svg
                className="w-5 h-5 sm:w-7 sm:h-7 text-[#1A5C5C] dark:text-[#B8935F]"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="18" cy="18" r="4" fill="currentColor" fillOpacity="0.8" />
                <path
                  d="M18 2L20.5 8L26.5 6L24.5 12L30.5 14L26.5 18L30.5 22L24.5 24L26.5 30L20.5 28L18 34L15.5 28L9.5 30L11.5 24L5.5 22L9.5 18L5.5 14L11.5 12L9.5 6L15.5 8L18 2Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="13.5"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeDasharray="1.5 2"
                  fill="none"
                  strokeOpacity="0.6"
                />
              </svg>
            </div>

            {/* Brand Title and Scholarly Institution Text */}
            <div className="flex flex-col min-w-0 justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-lg font-bold font-sans-arabic tracking-tight text-[#0F1419] dark:text-[#F4F0E7] whitespace-nowrap">
                  مختبر بصمة السور
                </span>
                <span className="hidden md:inline-block text-[11px] font-mono px-2 py-0.5 rounded-[4px] border border-[#DED8C9] dark:border-[#B8935F]/30 bg-[#EFECE2] dark:bg-[#122B2A]/80 text-[#1A5C5C] dark:text-[#C5A16A]">
                  المتن والرياضيات
                </span>
              </div>
              <div className="text-[9px] sm:text-[11px] text-[#53605E] dark:text-[#A8BCB9] font-sans tracking-tight">
                <span className="hidden sm:inline">Surah Fingerprint Lab · Scholarly Research Instrument</span>
                <span className="sm:hidden flex flex-col leading-tight max-w-[190px] truncate">
                  <span className="font-semibold text-[8.5px] text-[#384644] dark:text-[#CBD8D5] truncate">Surah Fingerprint Lab</span>
                  <span className="text-[7.5px] text-[#7B8885] dark:text-[#8D9E9B] truncate">Scholarly Research Instrument</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center Zone: Active Section Breadcrumb & Research Context (Desktop) */}
          <div className="hidden xl:flex items-center gap-3 px-3.5 py-1.5 rounded-[6px] bg-[#EFECE2]/70 dark:bg-[#122B2A]/70 border border-[#DED8C9] dark:border-[#235251]">
            <span className="text-xs text-[#53605E] dark:text-[#A8BCB9]">{activeGroup.label}</span>
            <span className="text-[#B8935F] text-xs">/</span>
            <span className="text-xs font-bold text-[#0F1419] dark:text-[#F4F0E7] flex items-center gap-1.5">
              <activeItem.icon className="w-3.5 h-3.5 text-[#1A5C5C] dark:text-[#B8935F]" />
              {activeItem.label}
            </span>
          </div>

          {/* Left Zone (RTL end): Mushaf Selector, Utility Controls, Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Contextual Back Button if inside deep surah analysis */}
            {selectedSurahName && onBackFromAnalysis && (
              <button
                type="button"
                id="navbar-analysis-back-btn"
                onClick={onBackFromAnalysis}
                title="الرجوع إلى القائمة السابقة"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#EFECE2] dark:bg-[#1F4A49] text-[#0F1419] dark:text-[#F4F0E7] border border-[#DED8C9] dark:border-[#B8935F]/40 hover:bg-[#E5DFCE] dark:hover:bg-[#255755] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>العودة من {formatSurahName(selectedSurahName)}</span>
              </button>
            )}

            {/* Quick Return Button from Quick Portal Navigation */}
            {quickReturnLabel && onQuickReturn && (
              <button
                type="button"
                id="navbar-quick-return-btn"
                onClick={onQuickReturn}
                title={`العودة إلى ${quickReturnLabel}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold bg-[#1A5C5C] text-white dark:bg-[#2B7470] dark:text-[#F4F0E7] hover:bg-[#134646] dark:hover:bg-[#348884] shadow-xs cursor-pointer transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة إلى {quickReturnLabel}</span>
              </button>
            )}

            {/* Scientific Documentation / Query Drawer Button */}
            <button
              type="button"
              onClick={() => {
                const guideMapping: Record<string, string> = {
                  'dashboard': 'quran-reader',
                  'quran-reader': 'quran-reader',
                  'explorer': 'explorer',
                  'comparator': 'comparator-split-view',
                  'letters-heatmap': 'letters-lab-extrema',
                  'letters-comparator': 'letters-lab-extrema',
                  'letters-extremes': 'letters-lab-extrema',
                  'letters-phonetics': 'letters-lab-extrema',
                  'letters-diacritics': 'letters-lab-extrema',
                  'letters-cumulative': 'letters-lab-cumulative',
                  'verse-endings': 'verse-endings-lab',
                  'lexical-richness': 'lexical-richness-lab',
                  'word-comparator': 'lexical-richness-lab',
                  'openings-families': 'openings-and-families-lab',
                  'similarity-matrix': 'similarity-matrix-114',
                  'similarity-clusters': 'similarity-clusters',
                  'meccan-medinan': 'meccan-medinan-lab',
                  'mushaf-direct': 'mushaf-comparison',
                  'mushaf-diff-table': 'mushaf-comparison'
                };
                openQuery(guideMapping[activeTab] || 'quran-reader');
              }}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-[6px] text-xs font-medium bg-[#FAF8F2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251] text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] hover:border-[#1A5C5C]/50 dark:hover:border-[#B8935F]/50 transition-colors cursor-pointer"
              title="فتح دليل الأقسام والاستعلامات المنهجية لجميع أدوات التطبيق"
              aria-label="دليل الأقسام ودرج المساعدة"
            >
              <HelpCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#B8935F]" />
              <span className="hidden sm:inline">المنهجية</span>
            </button>

            {/* Mushaf Switcher Button (Placed directly beside Theme Toggle) */}
            <button
              type="button"
              onClick={toggleActiveMushaf}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[#FAF8F2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251] text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] hover:border-[#1A5C5C]/50 dark:hover:border-[#B8935F]/50 transition-colors cursor-pointer text-xs font-bold"
              title={activeMushaf === 'kufi' ? 'المصحف الحالي: الكوفي (حفص) - انقر للتحويل إلى المدني (ورش)' : 'المصحف الحالي: المدني (ورش) - انقر للتحويل إلى الكوفي (حفص)'}
              aria-label="التبديل بين المصحف الكوفي والمدني"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#B8935F]" />
              <span className="font-sans-arabic text-[#1A5C5C] dark:text-[#C5A16A]">
                {activeMushaf === 'kufi' ? 'الكوفي' : 'المدني'}
              </span>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-[6px] bg-[#FAF8F2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251] text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] hover:border-[#1A5C5C]/50 dark:hover:border-[#B8935F]/50 transition-colors cursor-pointer"
              title={theme === 'light' ? 'التحويل للوضع الليلي' : 'التحويل للوضع النهاري'}
              aria-label={theme === 'light' ? 'التحويل للوضع الليلي' : 'التحويل للوضع النهاري'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#1A5C5C]" />
              ) : (
                <Sun className="w-4 h-4 text-[#C5A16A]" />
              )}
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-[6px] bg-[#FAF8F2] dark:bg-[#122B2A] border border-[#DED8C9] dark:border-[#235251] text-[#0F1419] dark:text-[#F4F0E7] cursor-pointer"
              title="قائمة الأدوات"
              aria-label="قائمة الأدوات"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>

        </div>

        {/* Tier 2: Primary Hierarchical Navigation Bar (Desktop) */}
        <nav
          ref={dropdownRef}
          className="hidden lg:flex items-center justify-between border-t border-[#DED8C9] dark:border-[#1F3835] py-2 relative"
        >
          {/* Main 5 Primary Research Categories */}
          <div className="flex items-center gap-1.5">
            {navGroups.map((group) => {
              const isGroupActive = activeGroup.id === group.id;
              const isDropdownOpen = openGroupDropdown === group.id;

              return (
                <div key={group.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDropdownOpen) {
                        setOpenGroupDropdown(null);
                      } else {
                        setOpenGroupDropdown(group.id);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
                      isGroupActive
                        ? 'bg-[#EFECE2] text-[#0F1419] border border-[#1A5C5C]/40 dark:bg-[#122B2A] dark:text-[#F4F0E7] dark:border-[#B8935F]/40'
                        : 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#EFECE2]/60 dark:text-[#A8BCB9] dark:hover:text-[#F4F0E7] dark:hover:bg-[#122B2A]/50 border border-transparent'
                    }`}
                  >
                    <span>{group.label}</span>
                    <span className="text-[10px] font-mono tabular-nums opacity-60">
                      ({group.items.length})
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#B8935F] transition-transform duration-150 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu for Category Tools */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#FFFFFF] dark:bg-[#172322] border border-[#DED8C9] dark:border-[#33433F] rounded-[8px] shadow-xl p-1.5 z-50 divide-y divide-[#EFECE2] dark:divide-[#23302D]">
                      <div className="px-2.5 py-1.5 mb-1 text-[11px] font-bold text-[#1A5C5C] dark:text-[#B8935F]">
                        {group.label}
                      </div>
                      <div className="py-1 space-y-0.5">
                        {group.items.map((item) => {
                          const isItemActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-full flex items-start gap-2.5 p-2 rounded-[6px] text-right transition-colors cursor-pointer ${
                                isItemActive
                                  ? 'bg-[#1A5C5C] text-white dark:bg-[#2B7470] dark:text-[#F4F0E7]'
                                  : 'hover:bg-[#F4F0E4] text-[#53605E] hover:text-[#0F1419] dark:text-[#B7C1BC] dark:hover:text-[#F4F0E7] dark:hover:bg-[#1F2E2D]'
                              }`}
                            >
                              <item.icon
                                className={`w-4 h-4 mt-0.5 shrink-0 ${
                                  isItemActive ? 'text-[#C5A16A]' : 'text-[#7B8885] dark:text-[#7D8C87]'
                                }`}
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold font-sans-arabic">
                                  {item.label}
                                </span>
                                <span className="text-[10px] text-[#7B8885] dark:text-[#7D8C87] line-clamp-1">
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Shortcuts to Primary Active Tools */}
          <div className="flex items-center gap-1 pl-1">
            {activeGroup.items.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A5C5C] text-white font-bold dark:bg-[#2B7470] dark:text-[#F4F0E7]'
                      : 'text-[#53605E] hover:text-[#0F1419] hover:bg-[#EFECE2] dark:text-[#A8BCB9] dark:hover:text-[#F4F0E7] dark:hover:bg-[#122B2A]/40'
                  }`}
                >
                  <item.icon className="w-3 h-3 text-[#B8935F]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Navigation Drawer / Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#DED8C9] dark:border-[#1F3835] bg-[#FAF8F2] dark:bg-[#0E201E] py-3 px-1 space-y-4 max-h-[75vh] overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#1A5C5C] dark:text-[#B8935F] px-2 flex items-center justify-between">
                  <span>{group.label}</span>
                  <span className="font-mono opacity-60">({group.items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-1">
                  {group.items.map((item) => {
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTab(item.id)}
                        className={`flex items-center gap-2 p-2 rounded-[6px] text-xs font-sans-arabic text-right transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1A5C5C] text-white font-bold dark:bg-[#2B7470] dark:text-[#F4F0E7]'
                            : 'bg-[#EFECE2] dark:bg-[#122B2A]/60 text-[#53605E] dark:text-[#A8BCB9] hover:text-[#0F1419] dark:hover:text-[#F4F0E7] hover:bg-[#E5DFCE] dark:hover:bg-[#122B2A]'
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5 text-[#B8935F] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </header>
  );
};

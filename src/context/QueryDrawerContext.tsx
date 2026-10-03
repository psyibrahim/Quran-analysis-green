import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { SECTION_GUIDES, SectionGuide } from '../data/sectionGuides';

interface QueryDrawerContextType {
  isOpen: boolean;
  activeGuideId: string | null;
  activeGuide: SectionGuide | null;
  openQuery: (guideId?: string) => void;
  closeQuery: () => void;
  selectGuide: (guideId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allGuides: SectionGuide[];
}

const QueryDrawerContext = createContext<QueryDrawerContextType | undefined>(undefined);

export const QueryDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const allGuides = useMemo(() => {
    return Object.values(SECTION_GUIDES);
  }, []);

  const activeGuide = useMemo(() => {
    if (!activeGuideId) return null;
    return SECTION_GUIDES[activeGuideId] || null;
  }, [activeGuideId]);

  const openQuery = useCallback((guideId?: string) => {
    if (guideId) {
      setActiveGuideId(guideId);
    } else if (!activeGuideId) {
      const firstId = Object.keys(SECTION_GUIDES)[0] || null;
      setActiveGuideId(firstId);
    }
    setIsOpen(true);
  }, [activeGuideId]);

  const closeQuery = useCallback(() => {
    setIsOpen(false);
  }, []);

  const selectGuide = useCallback((guideId: string) => {
    if (SECTION_GUIDES[guideId]) {
      setActiveGuideId(guideId);
    }
  }, []);

  return (
    <QueryDrawerContext.Provider
      value={{
        isOpen,
        activeGuideId,
        activeGuide,
        openQuery,
        closeQuery,
        selectGuide,
        searchTerm,
        setSearchTerm,
        allGuides
      }}
    >
      {children}
    </QueryDrawerContext.Provider>
  );
};

export const useQueryDrawer = () => {
  const context = useContext(QueryDrawerContext);
  if (!context) {
    throw new Error('useQueryDrawer must be used within a QueryDrawerProvider');
  }
  return context;
};

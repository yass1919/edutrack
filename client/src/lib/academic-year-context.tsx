import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AcademicYearContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
  setAvailableYears: (years: string[]) => void;
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<string>('2024-2025');
  const [availableYears, setAvailableYears] = useState<string[]>(['2024-2025']);

  // Sauvegarder l'année sélectionnée dans localStorage
  useEffect(() => {
    const savedYear = localStorage.getItem('selectedAcademicYear');
    if (savedYear && availableYears.includes(savedYear)) {
      setSelectedYear(savedYear);
    }
  }, [availableYears]);

  // Sauvegarder quand l'année change
  useEffect(() => {
    localStorage.setItem('selectedAcademicYear', selectedYear);
  }, [selectedYear]);

  return (
    <AcademicYearContext.Provider value={{ 
      selectedYear, 
      setSelectedYear, 
      availableYears, 
      setAvailableYears 
    }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
}
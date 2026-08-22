import React, { createContext, useContext, useState } from 'react';

interface CampusContextType {
  isCampusMode: boolean;
  selectedCampus: string | null;
  setCampusMode: (active: boolean, campus: string | null) => void;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

export const CampusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCampusMode, setIsCampusMode] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);

  const setCampusMode = (active: boolean, campus: string | null) => {
    setIsCampusMode(active);
    setSelectedCampus(campus);
  };

  return (
    <CampusContext.Provider value={{ isCampusMode, selectedCampus, setCampusMode }}>
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => {
  const context = useContext(CampusContext);
  if (context === undefined) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return context;
};

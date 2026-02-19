
import React, { createContext, useContext, ReactNode } from 'react';
import { useLabels } from '../hooks/useLabels';
import { Label } from '../types';

// Definir o tipo de retorno do useLabels para termos IntelliSense completo
type UseLabelsReturnType = ReturnType<typeof useLabels>;

// O contexto terá o mesmo tipo do retorno do hook
const LabelsContext = createContext<UseLabelsReturnType | undefined>(undefined);

export function LabelsProvider({ children }: { children: ReactNode }) {
  const labelsHook = useLabels();

  return (
    <LabelsContext.Provider value={labelsHook}>
      {children}
    </LabelsContext.Provider>
  );
}

export function useLabelsContext() {
  const context = useContext(LabelsContext);
  if (!context) {
    throw new Error('useLabelsContext deve ser usado dentro de LabelsProvider');
  }
  return context;
}

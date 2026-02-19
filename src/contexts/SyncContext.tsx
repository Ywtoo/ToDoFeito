import React, { createContext, useContext, ReactNode } from 'react';
import { useDriveSync } from '../hooks/useDriveSync';

type UseDriveSyncReturn = ReturnType<typeof useDriveSync>;

const SyncContext = createContext<UseDriveSyncReturn | undefined>(undefined);

export function SyncProvider({ 
  children, 
  value 
}: { 
  children: ReactNode;
  value: UseDriveSyncReturn;
}) {
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext deve ser usado dentro de SyncProvider');
  }
  return context;
}

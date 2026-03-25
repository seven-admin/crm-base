import { createContext, useContext, useState, type ReactNode } from 'react';

interface PortalIncorporadorFilterContextType {
  empreendimentoIdFiltro: string | null;
  setEmpreendimentoIdFiltro: (id: string | null) => void;
}

const PortalIncorporadorFilterContext = createContext<PortalIncorporadorFilterContextType | undefined>(undefined);

export function PortalIncorporadorFilterProvider({ children }: { children: ReactNode }) {
  const [empreendimentoIdFiltro, setEmpreendimentoIdFiltro] = useState<string | null>(null);

  return (
    <PortalIncorporadorFilterContext.Provider value={{ empreendimentoIdFiltro, setEmpreendimentoIdFiltro }}>
      {children}
    </PortalIncorporadorFilterContext.Provider>
  );
}

export function usePortalIncorporadorFilter() {
  const ctx = useContext(PortalIncorporadorFilterContext);
  if (!ctx) throw new Error('usePortalIncorporadorFilter must be used within PortalIncorporadorFilterProvider');
  return ctx;
}

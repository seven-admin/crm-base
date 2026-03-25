import { useMemo } from 'react';
import { useIncorporadorEmpreendimentos } from '@/hooks/useIncorporadorEmpreendimentos';
import { usePortalIncorporadorFilter } from '@/contexts/PortalIncorporadorFilterContext';

export function useFilteredEmpreendimentoIds() {
  const { empreendimentoIds, empreendimentos, isLoading, isIncorporador } = useIncorporadorEmpreendimentos();
  const { empreendimentoIdFiltro } = usePortalIncorporadorFilter();

  const filteredIds = useMemo(() => {
    if (empreendimentoIdFiltro) {
      return empreendimentoIds.includes(empreendimentoIdFiltro) ? [empreendimentoIdFiltro] : [];
    }
    return empreendimentoIds;
  }, [empreendimentoIds, empreendimentoIdFiltro]);

  const filteredEmpreendimentos = useMemo(() => {
    if (empreendimentoIdFiltro) {
      return empreendimentos.filter(e => e.id === empreendimentoIdFiltro);
    }
    return empreendimentos;
  }, [empreendimentos, empreendimentoIdFiltro]);

  return {
    empreendimentoIds: filteredIds,
    empreendimentos: filteredEmpreendimentos,
    isLoading,
    isIncorporador,
  };
}

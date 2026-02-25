import { useMemo } from 'react';
import { useConfiguracoesSistema } from '@/hooks/useConfiguracoesSistema';

export const DEFAULT_SIDEBAR_COLORS: Record<string, string> = {
  'Planejamento': '#10B981',
  'Empreendimentos': '#10B981',
  'Clientes': '#8B5CF6',
  'Comercial': '#F5941E',
  'Diário de Bordo': '#F5941E',
  'Contratos': '#60A5FA',
  'Financeiro': '#F59E0B',
  'Parceiros': '#EC4899',
  'Marketing': '#EC4899',
  'Eventos': '#06B6D4',
  'Sistema': '#94A3B8',
};

const CHAVE_TO_LABEL: Record<string, string> = {
  sidebar_cor_planejamento: 'Planejamento',
  sidebar_cor_empreendimentos: 'Empreendimentos',
  sidebar_cor_clientes: 'Clientes',
  sidebar_cor_comercial: 'Comercial',
  sidebar_cor_diario_de_bordo: 'Diário de Bordo',
  sidebar_cor_contratos: 'Contratos',
  sidebar_cor_financeiro: 'Financeiro',
  sidebar_cor_parceiros: 'Parceiros',
  sidebar_cor_marketing: 'Marketing',
  sidebar_cor_eventos: 'Eventos',
  sidebar_cor_sistema: 'Sistema',
};

export const LABEL_TO_CHAVE: Record<string, string> = Object.fromEntries(
  Object.entries(CHAVE_TO_LABEL).map(([k, v]) => [v, k])
);

export function useSidebarColors() {
  const { data: configs, isLoading } = useConfiguracoesSistema('sidebar');

  const colors = useMemo(() => {
    const result = { ...DEFAULT_SIDEBAR_COLORS };
    if (configs) {
      for (const config of configs) {
        const label = CHAVE_TO_LABEL[config.chave];
        if (label) {
          result[label] = config.valor;
        }
      }
    }
    return result;
  }, [configs]);

  return { colors, isLoading };
}

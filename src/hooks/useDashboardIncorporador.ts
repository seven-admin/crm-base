import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardIncorporador() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-incorporador', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar empreendimentos associados ao usuário
      const { data: userEmpreendimentos } = await supabase
        .from('user_empreendimentos')
        .select('empreendimento_id')
        .eq('user_id', user.id);

      const empreendimentoIds = userEmpreendimentos?.map((e) => e.empreendimento_id) || [];

      // Se não tiver empreendimentos vinculados, retorna dados vazios
      if (empreendimentoIds.length === 0) {
        return {
          empreendimentos: [],
          totalUnidades: 0,
          unidadesDisponiveis: 0,
          unidadesVendidas: 0,
          reservasAtivas: 0,
          briefingsPendentes: 0,
          contratosEmAndamento: 0,
          valorTotalVendido: 0,
        };
      }

      // Buscar dados dos empreendimentos
      const { data: empreendimentos } = await supabase
        .from('empreendimentos')
        .select('id, nome, status, endereco_cidade')
        .in('id', empreendimentoIds)
        .eq('is_active', true);

      // Buscar unidades
      const { data: unidades } = await supabase
        .from('unidades')
        .select('id, status, valor')
        .in('empreendimento_id', empreendimentoIds)
        .eq('is_active', true);

      // Reservas temporárias foram desativadas - a tabela foi removida
      const reservasAtivas = 0;

      // Buscar briefings pendentes
      const { data: briefings } = await supabase
        .from('briefings')
        .select('id')
        .in('empreendimento_id', empreendimentoIds)
        .in('status', ['pendente', 'triado', 'em_producao'])
        .eq('is_active', true);

      // Buscar contratos em andamento
      const { data: contratos } = await supabase
        .from('contratos')
        .select('id')
        .in('empreendimento_id', empreendimentoIds)
        .in('status', ['em_geracao', 'enviado_incorporador', 'enviado_assinatura'])
        .eq('is_active', true);

      // Calcular estatísticas
      const totalUnidades = unidades?.length || 0;
      const unidadesDisponiveis = unidades?.filter((u) => u.status === 'disponivel').length || 0;
      const unidadesVendidas = unidades?.filter((u) => u.status === 'vendida').length || 0;
      const valorTotalVendido = unidades
        ?.filter((u) => u.status === 'vendida')
        .reduce((acc, u) => acc + (u.valor || 0), 0) || 0;

      return {
        empreendimentos: empreendimentos || [],
        totalUnidades,
        unidadesDisponiveis,
        unidadesVendidas,
        reservasAtivas,
        briefingsPendentes: briefings?.length || 0,
        contratosEmAndamento: contratos?.length || 0,
        valorTotalVendido,
      };
    },
    enabled: !!user,
  });
}

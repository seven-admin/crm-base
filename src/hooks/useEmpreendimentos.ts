import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Empreendimento, 
  EmpreendimentoWithStats, 
  EmpreendimentoFormData,
  EmpreendimentoFilters 
} from '@/types/empreendimentos.types';

export function useEmpreendimentos(filters?: EmpreendimentoFilters) {
  return useQuery({
    queryKey: ['empreendimentos', filters],
    queryFn: async (): Promise<EmpreendimentoWithStats[]> => {
      let query = supabase
        .from('empreendimentos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.cidade) {
        query = query.eq('endereco_cidade', filters.cidade);
      }
      if (filters?.search) {
        query = query.ilike('nome', `%${filters.search}%`);
      }

      const { data: empreendimentos, error } = await query;

      if (error) throw error;

      // Fetch stats for each empreendimento
      const empreendimentosWithStats = await Promise.all(
        (empreendimentos || []).map(async (emp) => {
          // Get unit stats
          const { data: unidades } = await supabase
            .from('unidades')
            .select('status, valor')
            .eq('empreendimento_id', emp.id)
            .eq('is_active', true);

          // Get cover image
          const { data: capa } = await supabase
            .from('empreendimento_midias')
            .select('url')
            .eq('empreendimento_id', emp.id)
            .eq('is_capa', true)
            .maybeSingle();

          const stats = {
            unidades_disponiveis: 0,
            unidades_reservadas: 0,
            unidades_vendidas: 0,
            unidades_bloqueadas: 0,
            unidades_negociacao: 0,
            valor_total: 0,
            valor_vendido: 0,
          };

          (unidades || []).forEach((u) => {
            const valor = Number(u.valor) || 0;
            stats.valor_total += valor;
            
            switch (u.status) {
              case 'disponivel':
                stats.unidades_disponiveis++;
                break;
              case 'reservada':
                stats.unidades_reservadas++;
                break;
              case 'vendida':
                stats.unidades_vendidas++;
                stats.valor_vendido += valor;
                break;
              case 'bloqueada':
                stats.unidades_bloqueadas++;
                break;
              case 'negociacao':
                stats.unidades_negociacao++;
                break;
            }
          });

          return {
            ...emp,
            ...stats,
            capa_url: capa?.url,
          } as EmpreendimentoWithStats;
        })
      );

      return empreendimentosWithStats;
    },
  });
}

export function useEmpreendimento(id: string | undefined) {
  return useQuery({
    queryKey: ['empreendimento', id],
    queryFn: async (): Promise<EmpreendimentoWithStats | null> => {
      if (!id) return null;

      const { data: emp, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!emp) return null;

      // Get unit stats
      const { data: unidades } = await supabase
        .from('unidades')
        .select('status, valor')
        .eq('empreendimento_id', id)
        .eq('is_active', true);

      // Get cover image
      const { data: capa } = await supabase
        .from('empreendimento_midias')
        .select('url')
        .eq('empreendimento_id', id)
        .eq('is_capa', true)
        .maybeSingle();

      const stats = {
        unidades_disponiveis: 0,
        unidades_reservadas: 0,
        unidades_vendidas: 0,
        unidades_bloqueadas: 0,
        unidades_negociacao: 0,
        valor_total: 0,
        valor_vendido: 0,
      };

      (unidades || []).forEach((u) => {
        const valor = Number(u.valor) || 0;
        stats.valor_total += valor;
        
        switch (u.status) {
          case 'disponivel':
            stats.unidades_disponiveis++;
            break;
          case 'reservada':
            stats.unidades_reservadas++;
            break;
          case 'vendida':
            stats.unidades_vendidas++;
            stats.valor_vendido += valor;
            break;
          case 'bloqueada':
            stats.unidades_bloqueadas++;
            break;
          case 'negociacao':
            stats.unidades_negociacao++;
            break;
        }
      });

      return {
        ...emp,
        ...stats,
        capa_url: capa?.url,
      } as EmpreendimentoWithStats;
    },
    enabled: !!id,
  });
}

export function useCreateEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EmpreendimentoFormData) => {
      const { data: result, error } = await supabase
        .from('empreendimentos')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Empreendimento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar empreendimento:', error);
      toast.error('Erro ao criar empreendimento');
    },
  });
}

export function useUpdateEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmpreendimentoFormData> }) => {
      const { data: result, error } = await supabase
        .from('empreendimentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', id] });
      toast.success('Empreendimento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar empreendimento:', error);
      toast.error('Erro ao atualizar empreendimento');
    },
  });
}

export function useDeleteEmpreendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empreendimentos')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Empreendimento removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover empreendimento:', error);
      toast.error('Erro ao remover empreendimento');
    },
  });
}

export function useToggleAutoVincularCorretor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, auto_vincular_corretor }: { id: string; auto_vincular_corretor: boolean }) => {
      const { error } = await supabase
        .from('empreendimentos')
        .update({ auto_vincular_corretor } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { auto_vincular_corretor }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success(
        auto_vincular_corretor
          ? 'Empreendimento será vinculado automaticamente a novos corretores'
          : 'Empreendimento não será mais vinculado automaticamente'
      );
    },
    onError: (error) => {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    },
  });
}

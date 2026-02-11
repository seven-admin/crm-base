import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Briefing, BriefingFormData, BriefingFilters, BriefingStatus } from '@/types/briefings.types';

export function useBriefings(filters?: BriefingFilters) {
  return useQuery({
    queryKey: ['briefings', filters],
    queryFn: async () => {
      let query = supabase
        .from('briefings')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.cliente) {
        query = query.ilike('cliente', `%${filters.cliente}%`);
      }
      if (filters?.empreendimento_id) {
        query = query.eq('empreendimento_id', filters.empreendimento_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Briefing[];
    },
  });
}

export function useBriefing(id: string | null) {
  return useQuery({
    queryKey: ['briefing', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('briefings')
        .select(`
          *,
          empreendimento:empreendimentos(id, nome)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Briefing;
    },
    enabled: !!id,
  });
}

export function useCreateBriefing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BriefingFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const insertData = {
        cliente: data.cliente,
        tema: data.tema,
        objetivo: data.objetivo || null,
        empreendimento_id: data.empreendimento_id || null,
        formato_peca: data.formato_peca || null,
        composicao: data.composicao || null,
        head_titulo: data.head_titulo || null,
        sub_complemento: data.sub_complemento || null,
        mensagem_chave: data.mensagem_chave || null,
        tom_comunicacao: data.tom_comunicacao || null,
        estilo_visual: data.estilo_visual || null,
        diretrizes_visuais: data.diretrizes_visuais || null,
        referencia: data.referencia || null,
        referencia_imagem_url: data.referencia_imagem_url || null,
        importante: data.importante || null,
        observacoes: data.observacoes || null,
        criado_por: userData.user.id,
      };

      const { data: briefing, error } = await supabase
        .from('briefings')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return briefing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefings'] });
      toast.success('Briefing criado com sucesso');
    },
    onError: (error) => {
      console.error('Error creating briefing:', error);
      toast.error('Erro ao criar briefing');
    },
  });
}

export function useUpdateBriefing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BriefingFormData> }) => {
      const { data: briefing, error } = await supabase
        .from('briefings')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return briefing;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['briefings'] });
      queryClient.invalidateQueries({ queryKey: ['briefing', variables.id] });
      toast.success('Briefing atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating briefing:', error);
      toast.error('Erro ao atualizar briefing');
    },
  });
}

export function useTriarBriefing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      data_entrega,
      observacoes 
    }: { 
      id: string; 
      status: BriefingStatus;
      data_entrega?: string;
      observacoes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const updateData: Record<string, unknown> = {
        status,
        triado_por: userData.user.id,
        data_triagem: new Date().toISOString(),
      };

      if (data_entrega) {
        updateData.data_entrega = data_entrega;
      }
      if (observacoes !== undefined) {
        updateData.observacoes = observacoes;
      }

      const { data: briefing, error } = await supabase
        .from('briefings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return briefing;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['briefings'] });
      queryClient.invalidateQueries({ queryKey: ['briefing', variables.id] });
      toast.success('Briefing triado com sucesso');
    },
    onError: (error) => {
      console.error('Error triaging briefing:', error);
      toast.error('Erro ao triar briefing');
    },
  });
}

export function useDeleteBriefing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('briefings')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefings'] });
      toast.success('Briefing excluído com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting briefing:', error);
      toast.error('Erro ao excluir briefing');
    },
  });
}

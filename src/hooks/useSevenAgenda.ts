import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface SevenAtividade {
  id: string;
  titulo: string;
  data_hora: string;
  local: string | null;
  observacoes: string | null;
  responsavel_id: string | null;
  created_by: string | null;
  criador?: { full_name: string | null } | null;
  responsavel?: { full_name: string | null } | null;
}

export function useSevenAtividadesCalendario({ from, to }: { from: string; to: string }) {
  return useQuery({
    queryKey: ['seven', 'atividades', 'calendario', from, to],
    queryFn: async (): Promise<SevenAtividade[]> => {
      const { data, error } = await supabase
        .from('seven_atividades' as any)
        .select('*, criador:profiles!seven_atividades_created_by_fkey(full_name), responsavel:profiles!seven_atividades_responsavel_id_fkey(full_name)')
        .eq('is_active', true)
        .gte('data_hora', from)
        .lte('data_hora', to)
        .order('data_hora');
      if (error) throw error;
      return (data ?? []) as unknown as SevenAtividade[];
    },
  });
}

export interface NovaSevenAtividade {
  titulo: string;
  dataHora: string; // ISO
  local?: string;
  observacoes?: string;
  responsavelId?: string | null;
}

export function useCriarSevenAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NovaSevenAtividade) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('seven_atividades' as any).insert({
        titulo: payload.titulo,
        data_hora: payload.dataHora,
        local: payload.local || null,
        observacoes: payload.observacoes || null,
        responsavel_id: payload.responsavelId || null,
        created_by: userId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seven', 'atividades'] });
      toast.success('Atividade Seven criada');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao criar atividade'),
  });
}

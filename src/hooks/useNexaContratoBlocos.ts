import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContratoBloco {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  conteudo_html: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useContratoBlocos() {
  return useQuery({
    queryKey: ['nexa', 'contrato-blocos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nexa_contrato_blocos' as any)
        .select('*')
        .order('categoria')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as ContratoBloco[];
    },
  });
}

export function useSaveContratoBloco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: Partial<ContratoBloco> & { nome: string; conteudo_html: string }) => {
      const payload: any = {
        nome: b.nome,
        categoria: b.categoria || 'geral',
        descricao: b.descricao ?? null,
        conteudo_html: b.conteudo_html,
        is_active: b.is_active ?? true,
      };
      if (b.id) {
        const { error } = await supabase.from('nexa_contrato_blocos' as any).update(payload).eq('id', b.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        payload.created_by = u.user?.id ?? null;
        const { error } = await supabase.from('nexa_contrato_blocos' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contrato-blocos'] });
      toast.success('Bloco salvo');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar bloco'),
  });
}

export function useDeleteContratoBloco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexa_contrato_blocos' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contrato-blocos'] });
      toast.success('Bloco removido');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao remover bloco'),
  });
}

export const CATEGORIAS_BLOCO = [
  'geral',
  'preambulo',
  'objeto',
  'pagamento',
  'entrega',
  'garantia',
  'rescisao',
  'multas',
  'foro',
  'assinaturas',
] as const;

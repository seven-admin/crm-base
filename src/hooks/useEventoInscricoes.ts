import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dispararWebhook } from '@/lib/webhookUtils';

interface EventoInscricao {
  id: string;
  evento_id: string;
  corretor_id: string | null;
  user_id: string;
  nome_corretor: string;
  telefone: string | null;
  email: string | null;
  imobiliaria_nome: string | null;
  status: string;
  created_at: string;
}

export function useEventoInscricoes(userId?: string) {
  const queryClient = useQueryClient();

  const { data: minhasInscricoes, isLoading: loadingInscricoes } = useQuery({
    queryKey: ['evento-inscricoes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_inscricoes')
        .select('*')
        .eq('user_id', userId!)
        .eq('status', 'confirmada');

      if (error) throw error;
      return data as EventoInscricao[];
    },
    enabled: !!userId,
  });

  const { data: contagemInscricoes } = useQuery({
    queryKey: ['evento-inscricoes-contagem'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_inscricoes')
        .select('evento_id')
        .eq('status', 'confirmada');

      if (error) throw error;

      const contagem: Record<string, number> = {};
      for (const row of data) {
        contagem[row.evento_id] = (contagem[row.evento_id] || 0) + 1;
      }
      return contagem;
    },
  });

  const inscrever = useMutation({
    mutationFn: async (params: {
      evento_id: string;
      corretor_id?: string;
      user_id: string;
      nome_corretor: string;
      telefone?: string;
      email?: string;
      imobiliaria_nome?: string;
      evento_nome: string;
      evento_data: string;
    }) => {
      const { evento_nome, evento_data, ...insertData } = params;

      const { error } = await supabase
        .from('evento_inscricoes')
        .insert({
          evento_id: insertData.evento_id,
          corretor_id: insertData.corretor_id || null,
          user_id: insertData.user_id,
          nome_corretor: insertData.nome_corretor,
          telefone: insertData.telefone || null,
          email: insertData.email || null,
          imobiliaria_nome: insertData.imobiliaria_nome || null,
        });

      if (error) throw error;

      // Webhook silencioso
      await dispararWebhook('evento_inscricao_corretor', {
        evento_id: insertData.evento_id,
        evento_nome,
        evento_data,
        corretor_nome: insertData.nome_corretor,
        corretor_telefone: insertData.telefone,
        corretor_email: insertData.email,
        imobiliaria: insertData.imobiliaria_nome,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['evento-inscricoes-contagem'] });
      toast.success('Inscrição confirmada!');
    },
    onError: (err: Error) => {
      if (err.message?.includes('duplicate')) {
        toast.error('Você já está inscrito neste evento.');
      } else {
        toast.error('Erro ao se inscrever: ' + err.message);
      }
    },
  });

  const cancelar = useMutation({
    mutationFn: async (params: { evento_id: string; user_id: string }) => {
      const { error } = await supabase
        .from('evento_inscricoes')
        .update({ status: 'cancelada' })
        .eq('evento_id', params.evento_id)
        .eq('user_id', params.user_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-inscricoes'] });
      queryClient.invalidateQueries({ queryKey: ['evento-inscricoes-contagem'] });
      toast.success('Inscrição cancelada.');
    },
    onError: (err: Error) => {
      toast.error('Erro ao cancelar: ' + err.message);
    },
  });

  return {
    minhasInscricoes,
    loadingInscricoes,
    contagemInscricoes,
    inscrever,
    cancelar,
  };
}

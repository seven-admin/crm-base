import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmpreendimentoMidia, MidiaTipo } from '@/types/empreendimentos.types';

export function useEmpreendimentoMidias(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['empreendimento-midias', empreendimentoId],
    queryFn: async (): Promise<EmpreendimentoMidia[]> => {
      if (!empreendimentoId) return [];

      const { data, error } = await supabase
        .from('empreendimento_midias')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!empreendimentoId,
  });
}

export function useUploadMidia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      empreendimentoId, 
      file, 
      tipo, 
      nome,
      isCapa = false 
    }: { 
      empreendimentoId: string; 
      file: File; 
      tipo: MidiaTipo;
      nome?: string;
      isCapa?: boolean;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${empreendimentoId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('empreendimentos-midias')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('empreendimentos-midias')
        .getPublicUrl(fileName);

      // If setting as cover, unset other covers first
      if (isCapa) {
        await supabase
          .from('empreendimento_midias')
          .update({ is_capa: false })
          .eq('empreendimento_id', empreendimentoId)
          .eq('is_capa', true);
      }

      // Insert record
      const { data: result, error } = await supabase
        .from('empreendimento_midias')
        .insert({
          empreendimento_id: empreendimentoId,
          tipo,
          nome: nome || file.name,
          url: publicUrl,
          is_capa: isCapa,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-midias', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Mídia enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar mídia:', error);
      toast.error('Erro ao enviar mídia');
    },
  });
}

export function useSetMidiaCapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId }: { id: string; empreendimentoId: string }) => {
      // Unset other covers
      await supabase
        .from('empreendimento_midias')
        .update({ is_capa: false })
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_capa', true);

      // Set this as cover
      const { data: result, error } = await supabase
        .from('empreendimento_midias')
        .update({ is_capa: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-midias', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Imagem de capa atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao definir capa:', error);
      toast.error('Erro ao definir capa');
    },
  });
}

export function useDeleteMidia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, url, tipo }: { id: string; empreendimentoId: string; url: string; tipo?: string }) => {
      // Links não têm arquivo no storage
      if (tipo !== 'link') {
        const urlParts = url.split('/empreendimentos-midias/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage
            .from('empreendimentos-midias')
            .remove([filePath]);
        }
      }

      // Delete record
      const { error } = await supabase
        .from('empreendimento_midias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-midias', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimento', empreendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      toast.success('Mídia removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover mídia:', error);
      toast.error('Erro ao remover mídia');
    },
  });
}

export function useAddMidiaLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empreendimentoId, nome, url }: { 
      empreendimentoId: string; 
      nome: string; 
      url: string 
    }) => {
      const { data, error } = await supabase
        .from('empreendimento_midias')
        .insert({
          empreendimento_id: empreendimentoId,
          tipo: 'link',
          nome,
          url,
          is_capa: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-midias', empreendimentoId] });
      toast.success('Link adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar link:', error);
      toast.error('Erro ao adicionar link');
    },
  });
}

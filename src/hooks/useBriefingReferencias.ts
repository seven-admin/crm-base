import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BriefingReferencia } from '@/types/briefings.types';

export function useBriefingReferencias(briefingId: string | undefined) {
  return useQuery({
    queryKey: ['briefing-referencias', briefingId],
    queryFn: async () => {
      if (!briefingId) return [];
      const { data, error } = await supabase
        .from('briefing_referencias')
        .select('*')
        .eq('briefing_id', briefingId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as BriefingReferencia[];
    },
    enabled: !!briefingId,
  });
}

export function useAddBriefingReferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      briefingId: string;
      tipo: 'imagem' | 'link';
      file?: File;
      url?: string;
      titulo?: string;
    }) => {
      let finalUrl = params.url || '';

      if (params.tipo === 'imagem' && params.file) {
        const ext = params.file.name.split('.').pop();
        const path = `${params.briefingId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('briefing-referencias')
          .upload(path, params.file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('briefing-referencias')
          .getPublicUrl(path);
        finalUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('briefing_referencias')
        .insert({
          briefing_id: params.briefingId,
          tipo: params.tipo,
          url: finalUrl,
          titulo: params.titulo || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['briefing-referencias', vars.briefingId] });
      toast.success(vars.tipo === 'imagem' ? 'Imagem enviada' : 'Link adicionado');
    },
    onError: () => {
      toast.error('Erro ao adicionar referência');
    },
  });
}

export function useDeleteBriefingReferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ref: BriefingReferencia) => {
      // If it's an image stored in our bucket, delete from storage
      if (ref.tipo === 'imagem' && ref.url.includes('briefing-referencias')) {
        const urlParts = ref.url.split('/briefing-referencias/');
        if (urlParts[1]) {
          await supabase.storage.from('briefing-referencias').remove([urlParts[1]]);
        }
      }

      const { error } = await supabase
        .from('briefing_referencias')
        .delete()
        .eq('id', ref.id);
      if (error) throw error;
    },
    onSuccess: (_, ref) => {
      queryClient.invalidateQueries({ queryKey: ['briefing-referencias', ref.briefing_id] });
      toast.success('Referência removida');
    },
    onError: () => {
      toast.error('Erro ao remover referência');
    },
  });
}

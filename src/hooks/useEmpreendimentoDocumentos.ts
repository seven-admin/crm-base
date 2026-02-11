import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmpreendimentoDocumento, DocumentoTipo } from '@/types/empreendimentos.types';

export function useEmpreendimentoDocumentos(empreendimentoId: string | undefined) {
  return useQuery({
    queryKey: ['empreendimento-documentos', empreendimentoId],
    queryFn: async (): Promise<EmpreendimentoDocumento[]> => {
      if (!empreendimentoId) return [];

      const { data, error } = await supabase
        .from('empreendimento_documentos')
        .select('*')
        .eq('empreendimento_id', empreendimentoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!empreendimentoId,
  });
}

export function useUploadDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      empreendimentoId, 
      file, 
      tipo,
      nome,
      descricao 
    }: { 
      empreendimentoId: string; 
      file: File; 
      tipo: DocumentoTipo;
      nome: string;
      descricao?: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${empreendimentoId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('empreendimentos-documentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get URL (signed URL for private bucket)
      const { data: { signedUrl } } = await supabase.storage
        .from('empreendimentos-documentos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      // Insert record
      const { data: result, error } = await supabase
        .from('empreendimento_documentos')
        .insert({
          empreendimento_id: empreendimentoId,
          tipo,
          nome,
          descricao,
          arquivo_url: signedUrl || fileName,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-documentos', empreendimentoId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar documento:', error);
      toast.error('Erro ao enviar documento');
    },
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, empreendimentoId, arquivoUrl }: { id: string; empreendimentoId: string; arquivoUrl: string }) => {
      // Try to extract file path and delete from storage
      const urlParts = arquivoUrl.split('/empreendimentos-documentos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0]; // Remove query params
        await supabase.storage
          .from('empreendimentos-documentos')
          .remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from('empreendimento_documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId }) => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-documentos', empreendimentoId] });
      toast.success('Documento removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover documento:', error);
      toast.error('Erro ao remover documento');
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContratoTemplateImagem {
  id: string;
  template_id: string;
  nome: string;
  arquivo_url: string;
  largura?: number;
  altura?: number;
  created_at: string;
}

export function useTemplateImagens(templateId: string | undefined) {
  return useQuery({
    queryKey: ['template-imagens', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('contrato_template_imagens')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContratoTemplateImagem[];
    },
    enabled: !!templateId,
  });
}

export function useUploadTemplateImagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      templateId, 
      file, 
      nome,
      largura,
      altura
    }: { 
      templateId: string; 
      file: File; 
      nome: string;
      largura?: number;
      altura?: number;
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${templateId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('contratos-documentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contratos-documentos')
        .getPublicUrl(fileName);

      // Save record
      const { error: insertError } = await supabase
        .from('contrato_template_imagens')
        .insert({
          template_id: templateId,
          nome,
          arquivo_url: publicUrl,
          largura,
          altura,
        });

      if (insertError) throw insertError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-imagens'] });
      toast.success('Imagem adicionada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
    },
  });
}

export function useDeleteTemplateImagem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contrato_template_imagens')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-imagens'] });
      toast.success('Imagem removida');
    },
    onError: (error) => {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    },
  });
}

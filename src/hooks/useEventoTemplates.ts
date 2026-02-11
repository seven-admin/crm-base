import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventoTemplateTarefa {
  id: string;
  template_id: string;
  titulo: string;
  descricao?: string;
  dias_antes_evento: number;
  duracao_horas: number;
  ordem: number;
  created_at: string;
}

export interface EventoTemplate {
  id: string;
  nome: string;
  descricao?: string;
  duracao_dias: number;
  orcamento_padrao?: number;
  local_padrao?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tarefas?: EventoTemplateTarefa[];
}

export function useEventoTemplates() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['evento-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_templates')
        .select(`
          *,
          tarefas:evento_template_tarefas(*)
        `)
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data as EventoTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: {
      nome: string;
      descricao?: string;
      duracao_dias?: number;
      orcamento_padrao?: number;
      local_padrao?: string;
      tarefas?: Omit<EventoTemplateTarefa, 'id' | 'template_id' | 'created_at'>[];
    }) => {
      const { tarefas, ...templateData } = template;
      
      const { data: newTemplate, error: templateError } = await supabase
        .from('evento_templates')
        .insert(templateData)
        .select()
        .single();

      if (templateError) throw templateError;

      if (tarefas && tarefas.length > 0) {
        const tarefasComTemplateId = tarefas.map((t) => ({
          ...t,
          template_id: newTemplate.id,
        }));

        const { error: tarefasError } = await supabase
          .from('evento_template_tarefas')
          .insert(tarefasComTemplateId);

        if (tarefasError) throw tarefasError;
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar template: ' + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<EventoTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('evento_templates')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-templates'] });
      toast.success('Template atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('evento_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-templates'] });
      toast.success('Template removido!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  // CRUD para tarefas do template
  const addTarefa = useMutation({
    mutationFn: async (tarefa: Omit<EventoTemplateTarefa, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('evento_template_tarefas')
        .insert(tarefa);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-templates'] });
    },
  });

  const updateTarefa = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<EventoTemplateTarefa> & { id: string }) => {
      const { error } = await supabase
        .from('evento_template_tarefas')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-templates'] });
    },
  });

  const deleteTarefa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('evento_template_tarefas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-templates'] });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addTarefa,
    updateTarefa,
    deleteTarefa,
  };
}

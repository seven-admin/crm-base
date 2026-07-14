import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============ Variáveis ============
export interface ContratoVariavel {
  id: string;
  chave: string;
  label: string;
  descricao: string | null;
  tipo: 'texto' | 'numero' | 'data' | 'moeda';
  fonte_sugerida: string | null;
  is_sistema: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useContratoVariaveis() {
  return useQuery({
    queryKey: ['nexa', 'contrato-variaveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nexa_contrato_variaveis' as any)
        .select('*')
        .order('is_sistema', { ascending: false })
        .order('label');
      if (error) throw error;
      return (data ?? []) as unknown as ContratoVariavel[];
    },
  });
}

export function useSaveContratoVariavel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Partial<ContratoVariavel> & { chave: string; label: string }) => {
      if (v.id) {
        const { error } = await supabase.from('nexa_contrato_variaveis' as any).update(v as any).eq('id', v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nexa_contrato_variaveis' as any).insert(v as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contrato-variaveis'] });
      toast.success('Variável salva');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar'),
  });
}

export function useDeleteContratoVariavel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexa_contrato_variaveis' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contrato-variaveis'] });
      toast.success('Variável removida');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao remover'),
  });
}

// ============ Templates ============
export interface ContratoTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  conteudo_html: string;
  variaveis: string[];
  empreendimento_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  empreendimento?: { id: string; nome: string } | null;
}

export function useContratoTemplates() {
  return useQuery({
    queryKey: ['nexa', 'contrato-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nexa_contrato_templates' as any)
        .select('*, empreendimento:seven_empreendimentos(id, nome)')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as ContratoTemplate[];
    },
  });
}

export function useContratoTemplate(id?: string) {
  return useQuery({
    queryKey: ['nexa', 'contrato-template', id],
    enabled: !!id && id !== 'novo',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nexa_contrato_templates' as any)
        .select('*, empreendimento:seven_empreendimentos(id, nome)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ContratoTemplate | null;
    },
  });
}

export function useSaveContratoTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Partial<ContratoTemplate> & { nome: string; conteudo_html: string }) => {
      const payload: any = {
        nome: t.nome,
        descricao: t.descricao ?? null,
        conteudo_html: t.conteudo_html,
        variaveis: t.variaveis ?? [],
        empreendimento_id: t.empreendimento_id || null,
        is_active: t.is_active ?? true,
      };
      if (t.id) {
        const { error } = await supabase.from('nexa_contrato_templates' as any).update(payload).eq('id', t.id);
        if (error) throw error;
        return t.id;
      } else {
        const { data: u } = await supabase.auth.getUser();
        payload.created_by = u.user?.id ?? null;
        const { data, error } = await supabase.from('nexa_contrato_templates' as any).insert(payload).select('id').single();
        if (error) throw error;
        return (data as any).id as string;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contrato-templates'] });
      toast.success('Modelo salvo');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar modelo'),
  });
}

export function useDeleteContratoTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexa_contrato_templates' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contrato-templates'] });
      toast.success('Modelo removido');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao remover'),
  });
}

// ============ Contratos ============
export interface Contrato {
  id: string;
  numero: string | null;
  template_id: string | null;
  cliente_id: string | null;
  empreendimento_id: string | null;
  unidade_id: string | null;
  visita_id: string | null;
  status: string;
  conteudo_html: string | null;
  variaveis_valores: Record<string, string>;
  pdf_url: string | null;
  valor_contrato: number | null;
  valor: number | null;
  observacoes: string | null;
  data_geracao: string | null;
  data_assinatura: string | null;
  created_at: string;
  cliente?: { id: string; nome: string } | null;
  empreendimento?: { id: string; nome: string } | null;
  template?: { id: string; nome: string } | null;
}

export function useContratos() {
  return useQuery({
    queryKey: ['nexa', 'contratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nexa_contratos' as any)
        .select(`
          *,
          cliente:seven_clientes(id, nome),
          empreendimento:seven_empreendimentos(id, nome),
          template:nexa_contrato_templates(id, nome)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Contrato[];
    },
  });
}

export function useSaveContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Contrato>) => {
      const { data: u } = await supabase.auth.getUser();
      const payload: any = { ...c };
      if (!c.id) {
        payload.created_by = u.user?.id ?? null;
        payload.data_geracao = new Date().toISOString();
        if (!payload.numero) {
          const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
          payload.numero = `CT-${Date.now().toString(36).toUpperCase()}-${rand}`;
        }
        if (!payload.status) payload.status = 'em_geracao';
        const { data, error } = await supabase.from('nexa_contratos' as any).insert(payload).select('id').single();
        if (error) throw error;
        return (data as any).id as string;
      } else {
        const { error } = await supabase.from('nexa_contratos' as any).update(payload).eq('id', c.id);
        if (error) throw error;
        return c.id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contratos'] });
      toast.success('Contrato salvo');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar contrato'),
  });
}

export function useUploadContratoPdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratoId, blob }: { contratoId: string; blob: Blob }) => {
      const path = `${contratoId}/${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from('nexa-contratos-pdf').upload(path, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (upErr) throw upErr;
      const { error } = await supabase.from('nexa_contratos' as any).update({ pdf_url: path } as any).eq('id', contratoId);
      if (error) throw error;
      return path;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contratos'] });
    },
  });
}

export async function downloadContratoPdf(path: string) {
  const { data, error } = await supabase.storage.from('nexa-contratos-pdf').createSignedUrl(path, 60);
  if (error) throw error;
  window.open(data.signedUrl, '_blank');
}

export function useUpdateContratoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const payload: any = { status };
      if (status === 'assinado') payload.data_assinatura = new Date().toISOString();
      const { error } = await supabase.from('nexa_contratos' as any).update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contratos'] });
      toast.success('Status do contrato atualizado');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao atualizar status'),
  });
}

export function useDeleteContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nexa_contratos' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nexa', 'contratos'] });
      toast.success('Contrato removido');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao remover contrato'),
  });
}

/** Quantos contratos já usam um modelo — usado para bloquear exclusão de modelos em uso. */
export async function contarContratosPorTemplate(templateId: string): Promise<number> {
  const { count, error } = await supabase
    .from('nexa_contratos' as any)
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Marca a unidade como "em contrato" ao gerar um contrato para ela, evitando que
 * duas pessoas gerem contratos para a mesma unidade sem aviso. Só aplica a mudança
 * se a unidade ainda estiver disponível/reservada (update condicional, sem lock).
 * Retorna false se houve conflito (outro usuário já moveu a unidade adiante).
 */
export async function marcarUnidadeEmContrato(unidadeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('seven_unidades')
    .update({ status: 'contrato' as any })
    .eq('id', unidadeId)
    .in('status', ['disponivel', 'reservada'])
    .select('id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

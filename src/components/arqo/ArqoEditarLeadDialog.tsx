import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useArqoEtapas, useArqoGrupos, useArqoSources, useArqoTemperaturas } from '@/hooks/useArqo';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageAssignment?: boolean;
}

interface EditableLead {
  etapa_id: string;
  source_id: string | null;
  temperatura_id: string | null;
  grupo_id: string | null;
  consultor_id: string | null;
  closer_id: string | null;
  empreendimento_id: string | null;
  valor_estimado: number | null;
  observacoes: string | null;
  telefones_adicionais: string[];
  cliente: {
    nome: string;
    cpf: string | null;
    telefone: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null;
}

const NONE = '__none__';
const emptyForm = {
  nome: '', cpf: '', telefone: '', whatsapp: '', email: '', sourceId: NONE,
  etapaId: '', temperaturaId: NONE, grupoId: NONE, consultorId: NONE,
  closerId: NONE, empreendimentoId: NONE, valorEstimado: '', observacoes: '',
};

function parseMoney(value: string) {
  if (!value.trim()) return null;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function ArqoEditarLeadDialog({ leadId, open, onOpenChange, canManageAssignment = true }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [additionalPhones, setAdditionalPhones] = useState(['', '', '', '']);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { data: etapas = [] } = useArqoEtapas();
  const { data: sources = [] } = useArqoSources();
  const { data: temperaturas = [] } = useArqoTemperaturas();
  const { data: grupos = [] } = useArqoGrupos();
  const { data: empreendimentos = [] } = useEmpreendimentosSelect({ enabled: open });

  const { data: responsaveis = [] } = useQuery({
    queryKey: ['arqo', 'responsaveis-edicao'],
    enabled: open && canManageAssignment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('empresa', 'arqo')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: lead, isLoading } = useQuery({
    queryKey: ['arqo', 'lead-admin-edit', leadId],
    enabled: open && !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arqo_leads')
        .select(`
          id, etapa_id, source_id, temperatura_id, grupo_id, consultor_id, closer_id, telefones_adicionais,
          empreendimento_id, valor_estimado, observacoes,
          cliente:seven_clientes!arqo_leads_cliente_id_fkey(id, nome, cpf, telefone, whatsapp, email)
        `)
        .eq('id', leadId!)
        .single();
      if (error) throw error;
      return data as unknown as EditableLead;
    },
  });

  useEffect(() => {
    if (!lead) return;
    const cliente = Array.isArray(lead.cliente) ? lead.cliente[0] : lead.cliente;
    setForm({
      nome: cliente?.nome ?? '',
      cpf: cliente?.cpf ?? '',
      telefone: cliente?.telefone ?? '',
      whatsapp: cliente?.whatsapp ?? '',
      email: cliente?.email ?? '',
      sourceId: lead.source_id ?? NONE,
      etapaId: lead.etapa_id ?? '',
      temperaturaId: lead.temperatura_id ?? NONE,
      grupoId: lead.grupo_id ?? NONE,
      consultorId: lead.consultor_id ?? NONE,
      closerId: lead.closer_id ?? NONE,
      empreendimentoId: lead.empreendimento_id ?? NONE,
      valorEstimado: lead.valor_estimado == null ? '' : String(lead.valor_estimado),
      observacoes: lead.observacoes ?? '',
    });
    setAdditionalPhones(Array.from({ length: 4 }, (_, index) => lead.telefones_adicionais?.[index] ?? ''));
  }, [lead]);

  const etapasDisponiveis = useMemo(() => etapas.filter((etapa) => etapa.is_active), [etapas]);
  const update = (field: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const optionalId = (value: string) => value === NONE ? undefined : value;

  const close = () => {
    if (isSaving) return;
    setForm(emptyForm);
    setAdditionalPhones(['', '', '', '']);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!leadId || !form.nome.trim()) {
      toast.error('Informe o nome do lead');
      return;
    }
    const phones = additionalPhones.map((phone) => phone.trim()).filter(Boolean);
    if (!form.telefone.trim() && !form.whatsapp.trim() && !form.email.trim() && phones.length === 0) {
      toast.error('Informe ao menos um telefone, WhatsApp ou e-mail');
      return;
    }
    if (!form.etapaId) {
      toast.error('Selecione a etapa');
      return;
    }
    const valor = parseMoney(form.valorEstimado);
    if (Number.isNaN(valor)) {
      toast.error('Informe um valor estimado válido');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.rpc('arqo_editar_lead_manual', {
      p_lead_id: leadId,
      p_nome: form.nome.trim(),
      p_etapa_id: form.etapaId,
      p_cpf: form.cpf.trim() || undefined,
      p_telefone: form.telefone.trim() || undefined,
      p_whatsapp: form.whatsapp.trim() || undefined,
      p_email: form.email.trim() || undefined,
      p_source_id: optionalId(form.sourceId),
      p_temperatura_id: optionalId(form.temperaturaId),
      p_grupo_id: optionalId(form.grupoId),
      p_consultor_id: optionalId(form.consultorId),
      p_closer_id: optionalId(form.closerId),
      p_empreendimento_id: optionalId(form.empreendimentoId),
      p_valor_estimado: valor ?? undefined,
      p_observacoes: form.observacoes.trim() || undefined,
      p_telefones_adicionais: phones,
    });
    setIsSaving(false);

    if (error) {
      toast.error(error.message || 'Não foi possível atualizar o lead');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['arqo'] });
    toast.success('Lead atualizado com sucesso');
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-primary" />Editar lead</DialogTitle>
          <DialogDescription>
            {canManageAssignment
              ? 'Atualize o cadastro do contato e a organização comercial do lead.'
              : 'Atualize os dados do contato e da oportunidade da sua carteira.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => update('nome', e.target.value)} autoFocus /></div>
            <div className="space-y-1.5"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => update('cpf', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => update('telefone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
            <div className="space-y-3 rounded-2xl border border-black/[.07] bg-muted/25 p-4 sm:col-span-2 lg:col-span-3">
              <div>
                <Label>Telefones adicionais</Label>
                <p className="mt-1 text-xs text-muted-foreground">Até quatro números alternativos para contato e ligação.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {additionalPhones.map((phone, index) => (
                  <Input
                    key={index}
                    aria-label={`Telefone adicional ${index + 1}`}
                    value={phone}
                    onChange={(event) => setAdditionalPhones((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    placeholder={`Adicional ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Origem</Label><Select value={form.sourceId} onValueChange={(v) => update('sourceId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Não informada</SelectItem>{sources.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Etapa *</Label><Select value={form.etapaId} onValueChange={(v) => update('etapaId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{etapasDisponiveis.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Temperatura</Label><Select value={form.temperaturaId} onValueChange={(v) => update('temperaturaId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Não definida</SelectItem>{temperaturas.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
            {canManageAssignment && (
              <>
                <div className="space-y-1.5"><Label>Grupo / fila</Label><Select value={form.grupoId} onValueChange={(v) => update('grupoId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Sem grupo</SelectItem>{grupos.filter((item) => item.is_active).map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Consultor</Label><Select value={form.consultorId} onValueChange={(v) => update('consultorId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Sem consultor</SelectItem>{responsaveis.map((item) => <SelectItem key={item.id} value={item.id}>{item.full_name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Closer</Label><Select value={form.closerId} onValueChange={(v) => update('closerId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Sem closer</SelectItem>{responsaveis.map((item) => <SelectItem key={item.id} value={item.id}>{item.full_name}</SelectItem>)}</SelectContent></Select></div>
              </>
            )}
            <div className="space-y-1.5 sm:col-span-2"><Label>Empreendimento</Label><Select value={form.empreendimentoId} onValueChange={(v) => update('empreendimentoId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Não informado</SelectItem>{empreendimentos.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Valor estimado</Label><Input inputMode="decimal" value={form.valorEstimado} onChange={(e) => update('valorEstimado', e.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3"><Label>Observações</Label><Textarea rows={3} value={form.observacoes} onChange={(e) => update('observacoes', e.target.value)} /></div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

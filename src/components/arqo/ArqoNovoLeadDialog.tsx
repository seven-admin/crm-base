import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = '__none__';

const initialForm = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  sourceId: NONE,
  etapaId: '',
  temperaturaId: NONE,
  grupoId: NONE,
  empreendimentoId: NONE,
  valorEstimado: '',
  observacoes: '',
};

function parseMoney(value: string) {
  if (!value.trim()) return null;
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function ArqoNovoLeadDialog({ open, onOpenChange }: Props) {
  const [form, setForm] = useState(initialForm);
  const [additionalPhones, setAdditionalPhones] = useState(['', '', '', '']);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { data: etapas = [] } = useArqoEtapas();
  const { data: sources = [] } = useArqoSources();
  const { data: temperaturas = [] } = useArqoTemperaturas();
  const { data: grupos = [] } = useArqoGrupos();
  const { data: empreendimentos = [] } = useEmpreendimentosSelect({ enabled: open });

  const etapasAtivas = useMemo(
    () => etapas.filter((etapa) => etapa.categoria === 'ativa'),
    [etapas],
  );

  useEffect(() => {
    if (open && !form.etapaId && etapasAtivas[0]?.id) {
      setForm((current) => ({ ...current, etapaId: etapasAtivas[0].id }));
    }
  }, [open, form.etapaId, etapasAtivas]);

  const update = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const close = () => {
    if (isSaving) return;
    setForm(initialForm);
    setAdditionalPhones(['', '', '', '']);
    onOpenChange(false);
  };

  const handleSave = async () => {
    const nome = form.nome.trim();
    if (!nome) {
      toast.error('Informe o nome do lead');
      return;
    }
    const phones = additionalPhones.map((phone) => phone.trim()).filter(Boolean);
    if (!form.telefone.trim() && !form.email.trim() && phones.length === 0) {
      toast.error('Informe ao menos um telefone ou e-mail');
      return;
    }
    if (!form.etapaId) {
      toast.error('Selecione a etapa inicial');
      return;
    }

    const valor = parseMoney(form.valorEstimado);
    if (Number.isNaN(valor)) {
      toast.error('Informe um valor estimado válido');
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase.rpc('arqo_criar_lead_manual', {
      p_nome: nome,
      p_etapa_id: form.etapaId,
      p_cpf: form.cpf.trim() || undefined,
      p_telefone: form.telefone.trim() || undefined,
      p_email: form.email.trim() || undefined,
      p_source_id: form.sourceId === NONE ? undefined : form.sourceId,
      p_temperatura_id: form.temperaturaId === NONE ? undefined : form.temperaturaId,
      p_grupo_id: form.grupoId === NONE ? undefined : form.grupoId,
      p_empreendimento_id: form.empreendimentoId === NONE ? undefined : form.empreendimentoId,
      p_valor_estimado: valor ?? undefined,
      p_observacoes: form.observacoes.trim() || undefined,
      p_telefones_adicionais: phones,
    });
    setIsSaving(false);

    if (error) {
      toast.error(error.message || 'Não foi possível cadastrar o lead');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['arqo'] });
    toast.success('Lead cadastrado com sucesso');
    setForm(initialForm);
    setAdditionalPhones(['', '', '', '']);
    onOpenChange(false);
    return data;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar novo lead
          </DialogTitle>
          <DialogDescription>
            O contato será reaproveitado se CPF, telefone ou e-mail já estiver cadastrado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lead-nome">Nome *</Label>
            <Input id="lead-nome" value={form.nome} onChange={(event) => update('nome', event.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-telefone">Telefone</Label>
            <Input id="lead-telefone" value={form.telefone} onChange={(event) => update('telefone', event.target.value)} placeholder="(67) 99999-9999" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">E-mail</Label>
            <Input id="lead-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="nome@empresa.com" />
          </div>
          <div className="space-y-3 rounded-2xl border border-black/[.07] bg-muted/25 p-4 sm:col-span-2">
            <div>
              <Label>Telefones adicionais</Label>
              <p className="mt-1 text-xs text-muted-foreground">Você pode informar até quatro outros números específicos deste lead.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {additionalPhones.map((phone, index) => (
                <Input
                  key={index}
                  aria-label={`Telefone adicional ${index + 1}`}
                  value={phone}
                  onChange={(event) => setAdditionalPhones((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                  placeholder={`Telefone adicional ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-cpf">CPF</Label>
            <Input id="lead-cpf" value={form.cpf} onChange={(event) => update('cpf', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select value={form.sourceId} onValueChange={(value) => update('sourceId', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Não informada</SelectItem>
                {sources.map((source) => <SelectItem key={source.id} value={source.id}>{source.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Etapa inicial *</Label>
            <Select value={form.etapaId} onValueChange={(value) => update('etapaId', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
              <SelectContent>
                {etapasAtivas.map((etapa) => <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Temperatura</Label>
            <Select value={form.temperaturaId} onValueChange={(value) => update('temperaturaId', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Não definida</SelectItem>
                {temperaturas.map((temperatura) => <SelectItem key={temperatura.id} value={temperatura.id}>{temperatura.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Grupo / fila</Label>
            <Select value={form.grupoId} onValueChange={(value) => update('grupoId', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem grupo</SelectItem>
                {grupos.filter((grupo) => grupo.is_active).map((grupo) => <SelectItem key={grupo.id} value={grupo.id}>{grupo.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Empreendimento</Label>
            <Select value={form.empreendimentoId} onValueChange={(value) => update('empreendimentoId', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Não informado</SelectItem>
                {empreendimentos.map((empreendimento) => <SelectItem key={empreendimento.id} value={empreendimento.id}>{empreendimento.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-valor">Valor estimado</Label>
            <Input id="lead-valor" inputMode="decimal" value={form.valorEstimado} onChange={(event) => update('valorEstimado', event.target.value)} placeholder="500.000,00" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lead-observacoes">Observações</Label>
            <Textarea id="lead-observacoes" value={form.observacoes} onChange={(event) => update('observacoes', event.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Cadastrar lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

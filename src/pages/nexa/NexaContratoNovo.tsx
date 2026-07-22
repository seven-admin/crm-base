import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { ArrowLeft, ArrowRight, FileDown, Loader2 } from 'lucide-react';
import { useContratoTemplates, useContratoVariaveis, useSaveContrato, useUploadContratoPdf, marcarUnidadeEmContrato } from '@/hooks/useNexaContratos';
import { useClientesSelect } from '@/hooks/useClientesSelect';
import { useEmpreendimentosAtivos, useUnidadesDisponiveis } from '@/hooks/useNexa';
import { extrairVariaveis, resolverValoresAutomaticos, resolveVariaveis, gerarPdfDeHtml } from '@/lib/contratoVariaveis';
import { toast } from 'sonner';

export default function NexaContratoNovo() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { data: clientes } = useClientesSelect(undefined, true);
  const { data: emps } = useEmpreendimentosAtivos();
  const { data: templates } = useContratoTemplates();
  const { data: variaveisCat } = useContratoVariaveis();
  const saveContrato = useSaveContrato();
  const uploadPdf = useUploadContratoPdf();

  const [step, setStep] = useState(0);
  const [clienteId, setClienteId] = useState<string>(params.get('cliente') || '');
  const [empId, setEmpId] = useState<string>(params.get('empreendimento') || '');
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [obs, setObs] = useState<string>('');
  const [valores, setValores] = useState<Record<string, string>>({});
  const [gerando, setGerando] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: unidades } = useUnidadesDisponiveis(empId || undefined, ['disponivel', 'reservada']);
  const template = templates?.find((t) => t.id === templateId);
  const varsUsadas = useMemo(() => (template ? extrairVariaveis(template.conteudo_html) : []), [template]);

  // resolver valores auto sempre que dados mudam
  const selecaoAnteriorRef = useRef<string>('');
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!templateId) return;
      const auto = await resolverValoresAutomaticos({
        clienteId: clienteId || null,
        empreendimentoId: empId || null,
        unidadeId: unidadeId || null,
        valorContrato: valor ? Number(valor) : null,
      });
      if (cancel) return;
      // Se cliente/empreendimento/unidade mudaram, os valores auto atuais (nome,
      // cpf, endereço etc.) substituem os anteriores — senão o merge manteria os
      // dados da seleção antiga (ex: nome do cliente errado no contrato).
      const chaveSelecao = `${clienteId}|${empId}|${unidadeId}`;
      const selecaoMudou = chaveSelecao !== selecaoAnteriorRef.current;
      selecaoAnteriorRef.current = chaveSelecao;
      setValores((prev) => (selecaoMudou ? { ...prev, ...auto } : { ...auto, ...prev }));
    })();
    return () => { cancel = true; };
  }, [templateId, clienteId, empId, unidadeId, valor]);

  const previewHtml = useMemo(() => (template ? resolveVariaveis(template.conteudo_html, valores) : ''), [template, valores]);

  const gerar = async () => {
    if (!template || !previewRef.current) return;
    setGerando(true);
    try {
      const contratoId = await saveContrato.mutateAsync({
        template_id: templateId,
        cliente_id: clienteId || null,
        empreendimento_id: empId || null,
        unidade_id: unidadeId || null,
        valor_contrato: valor ? Number(valor) : null,
        conteudo_html: previewHtml,
        variaveis_valores: valores,
        observacoes: obs || null,
        status: 'em_geracao',
      });
      if (!contratoId) return;
      const blob = await gerarPdfDeHtml(previewRef.current, `contrato-${contratoId}.pdf`);
      await uploadPdf.mutateAsync({ contratoId, blob });
      if (unidadeId) {
        const travada = await marcarUnidadeEmContrato(unidadeId);
        if (!travada) {
          toast.warning('Contrato gerado, mas a unidade já não estava mais disponível/reservada — confira o status dela.');
        }
      }
      toast.success('Contrato gerado com sucesso');
      nav('/nexa/contratos');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar contrato');
    } finally {
      setGerando(false);
    }
  };

  const canNext = [
    () => !!clienteId && !!empId,
    () => !!templateId,
    () => true,
  ][step]?.();

  return (
    <MainLayout
      title="Novo contrato"
      actions={<Button variant="outline" onClick={() => nav('/nexa/contratos')}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid grid-cols-3 overflow-hidden rounded-full border border-border/70 bg-card p-1 text-sm shadow-card">
          {['Dados', 'Modelo', 'Preview & Gerar'].map((label, i) => (
            <div key={i} className={`flex min-w-0 items-center justify-center gap-2 rounded-full px-3 py-2.5 ${i === step ? 'bg-primary font-semibold text-primary-foreground' : 'text-muted-foreground'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${i <= step ? 'bg-[#201a17] text-white' : 'bg-muted'}`}>{i + 1}</span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>

        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cliente *</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {clientes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Empreendimento *</Label>
                    <Select value={empId} onValueChange={setEmpId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {emps?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Unidade (opcional)</Label>
                    <Select value={unidadeId || 'none'} onValueChange={(v) => setUnidadeId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {unidades?.map((u: any) => (
                          <SelectItem key={u.unidade_id} value={u.unidade_id}>
                            {u.bloco ? `Bl.${u.bloco} · ` : ''}Und.{u.unidade}{u.tipologia ? ` · ${u.tipologia}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor do contrato (R$)</Label>
                    <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Modelo de contrato *</Label>
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                    <SelectContent>
                      {templates?.filter((t) => t.is_active && (!t.empreendimento_id || t.empreendimento_id === empId)).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {template && (
                  <>
                    <div className="text-sm text-muted-foreground">Variáveis usadas: {varsUsadas.length}</div>
                    <div className="max-h-96 space-y-2 overflow-y-auto rounded-[1.25rem] border border-border/70 bg-muted/20 p-3">
                      {varsUsadas.map((chave) => {
                        const meta = variaveisCat?.find((v) => v.chave === chave);
                        return (
                          <div key={chave} className="grid grid-cols-[200px_1fr] gap-3 items-center">
                            <Label className="font-mono text-xs">{meta?.label || chave}</Label>
                            <Input
                              value={valores[chave] || ''}
                              onChange={(e) => setValores({ ...valores, [chave]: e.target.value })}
                              placeholder={`[${chave}]`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Confira o conteúdo antes de gerar o PDF.</div>
                <div ref={previewRef} className="prose max-w-none rounded-[1.25rem] border border-border/70 bg-white p-8 shadow-sm" style={{ minHeight: 400 }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />Anterior
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>Próximo<ArrowRight className="h-4 w-4 ml-2" /></Button>
          ) : (
            <Button onClick={gerar} disabled={gerando || !template}>
              {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Gerar PDF
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

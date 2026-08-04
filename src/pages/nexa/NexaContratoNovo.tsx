import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { ArrowLeft, ArrowRight, FileDown, FileText, Loader2 } from 'lucide-react';
import { useContratoTemplates, useContratoVariaveis, useSaveContrato, useUploadContratoPdf, marcarUnidadeEmContrato } from '@/hooks/useNexaContratos';
import { usePropostasNexa, buscarPropostaPorCodigo, type PropostaListItem } from '@/hooks/useNexaPropostas';
import { useEmpreendimentosAtivos } from '@/hooks/useNexa';
import { extrairVariaveis, resolverValoresAutomaticos, resolveVariaveis, gerarPdfDeHtml, gerarDocDeHtml, normalizarQuebras, resolverCondicionais } from '@/lib/contratoVariaveis';
import { extrairBlocos, prepararConteudo } from '@/lib/contratoNumeracao';
import { propostaParaVariaveis } from '@/lib/propostaParaVariaveis';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function NexaContratoNovo() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { data: emps } = useEmpreendimentosAtivos();
  const { data: templates } = useContratoTemplates();
  const { data: variaveisCat } = useContratoVariaveis();
  const saveContrato = useSaveContrato();
  const uploadPdf = useUploadContratoPdf();

  // Duas frentes: "proposta" (a partir de uma proposta da NEXA) e "zero" (do zero, só modelo).
  const origem: 'proposta' | 'zero' = params.get('origem') === 'proposta' ? 'proposta' : 'zero';

  const [step, setStep] = useState(0);
  const [empId, setEmpId] = useState<string>(params.get('empreendimento') || '');
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [obs, setObs] = useState<string>('');
  const [valores, setValores] = useState<Record<string, string>>({});
  const [clienteNome, setClienteNome] = useState<string>('');
  const [propostaCodigo, setPropostaCodigo] = useState<string>('');
  const [blocosExcluidos, setBlocosExcluidos] = useState<Set<number>>(new Set());
  const [gerando, setGerando] = useState(false);
  const [carregandoProposta, setCarregandoProposta] = useState(false);
  const [buscaProposta, setBuscaProposta] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // Front "proposta": a lista de clientes vem das propostas cadastradas na NEXA.
  const { data: propostas, isLoading: propostasLoading } = usePropostasNexa(origem === 'proposta');
  const propostasFiltradas = useMemo(() => {
    const q = buscaProposta.trim().toLowerCase();
    if (!q) return propostas ?? [];
    return (propostas ?? []).filter((p) =>
      [p.buyer_name, p.unit_number, p.project_name, p.proposal_code].some((v) => (v ?? '').toLowerCase().includes(q)),
    );
  }, [propostas, buscaProposta]);

  // Ao escolher uma proposta: busca completa, mapeia para as variáveis e resolve a
  // unidade/empreendimento no nosso banco pelo UID compartilhado.
  const selecionarProposta = async (p: PropostaListItem) => {
    setCarregandoProposta(true);
    try {
      const full = await buscarPropostaPorCodigo(p.proposal_code);
      if (!full?.found) { toast.error('Proposta não encontrada.'); return; }
      const vals = propostaParaVariaveis(full.data);
      setPropostaCodigo(p.proposal_code);
      setClienteNome(p.buyer_name || '');
      setUnidadeId(p.external_unit_id || '');
      let empReal = '';
      if (p.external_unit_id) {
        const { data: u } = await supabase.from('seven_unidades').select('empreendimento_id').eq('id', p.external_unit_id).maybeSingle();
        empReal = (u as any)?.empreendimento_id || '';
        setEmpId(empReal);
      }
      const auto = await resolverValoresAutomaticos({ empreendimentoId: empReal || null, unidadeId: p.external_unit_id || null, valorContrato: null });
      setValores({ ...auto, ...vals }); // proposta vence; herda data_atual do auto
      toast.success(`Proposta ${p.proposal_code} carregada (${Object.keys(vals).length} campos).`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar proposta');
    } finally {
      setCarregandoProposta(false);
    }
  };

  const template = templates?.find((t) => t.id === templateId);
  const varsUsadas = useMemo(() => (template ? extrairVariaveis(template.conteudo_html) : []), [template]);
  const blocosDetectados = useMemo(() => (template ? extrairBlocos(template.conteudo_html) : []), [template]);

  // Ao trocar de modelo, volta todos os blocos a "incluídos".
  useEffect(() => { setBlocosExcluidos(new Set()); }, [templateId]);

  // Auto-resolver só no front "do zero" (o front "proposta" já traz tudo da proposta).
  const selecaoAnteriorRef = useRef<string>('');
  useEffect(() => {
    if (origem !== 'zero') return;
    let cancel = false;
    (async () => {
      if (!templateId) return;
      const auto = await resolverValoresAutomaticos({
        empreendimentoId: empId || null,
        valorContrato: valor ? Number(valor) : null,
      });
      if (cancel) return;
      const chaveSelecao = `${empId}`;
      const selecaoMudou = chaveSelecao !== selecaoAnteriorRef.current;
      selecaoAnteriorRef.current = chaveSelecao;
      setValores((prev) => (selecaoMudou ? { ...prev, ...auto } : { ...auto, ...prev }));
    })();
    return () => { cancel = true; };
  }, [origem, templateId, empId, valor]);

  const previewHtml = useMemo(
    () => (template ? normalizarQuebras(resolveVariaveis(prepararConteudo(resolverCondicionais(template.conteudo_html, valores), blocosExcluidos), valores)) : ''),
    [template, valores, blocosExcluidos],
  );

  const baixarWord = async () => {
    if (!template || !previewHtml) return;
    const nomeArq = `contrato-${(clienteNome || template.nome || 'nexa').replace(/[^\w-]+/g, '_').toLowerCase()}`;
    try {
      await gerarDocDeHtml(previewHtml, nomeArq, {
        titulo: template.nome,
        fundoUrl: template.marca_dagua_fundo ? template.marca_dagua_url ?? undefined : undefined,
      });
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar Word');
    }
  };

  const gerar = async () => {
    if (!template || !previewRef.current) return;
    setGerando(true);
    try {
      const contratoId = await saveContrato.mutateAsync({
        template_id: templateId,
        cliente_id: null,
        cliente_nome: clienteNome || valores.nome_cliente || null,
        empreendimento_id: empId || null,
        unidade_id: unidadeId || null,
        valor_contrato: valor ? Number(valor) : null,
        conteudo_html: previewHtml,
        variaveis_valores: valores,
        observacoes: obs || null,
        status: 'em_geracao',
      });
      if (!contratoId) return;

      // Planta e garagem da unidade viram páginas finais do contrato.
      let imagensFinais: string[] = [];
      if (unidadeId) {
        const { data: u } = await supabase
          .from('seven_unidades')
          .select('imagem_planta_url, imagem_garagem_url')
          .eq('id', unidadeId)
          .maybeSingle();
        imagensFinais = [(u as any)?.imagem_planta_url, (u as any)?.imagem_garagem_url].filter(Boolean) as string[];
      }
      const usarFundo = !!template.marca_dagua_url && template.marca_dagua_fundo;
      const marcaDagua = template.marca_dagua_url && !template.marca_dagua_fundo
        ? { url: template.marca_dagua_url, opacidade: template.marca_dagua_opacidade ?? 0.08 }
        : undefined;

      const blob = await gerarPdfDeHtml(previewRef.current, `contrato-${contratoId}.pdf`, {
        margens: {
          topo: template.margem_topo ?? 20,
          direita: template.margem_direita ?? 20,
          baixo: template.margem_baixo ?? 20,
          esquerda: template.margem_esquerda ?? 20,
        },
        cabecalho: template.cabecalho_texto ? resolveVariaveis(template.cabecalho_texto, valores) : undefined,
        rodape: template.rodape_texto ? resolveVariaveis(template.rodape_texto, valores) : undefined,
        numerarPaginas: template.numerar_paginas ?? false,
        marcaDagua,
        fundoPagina: usarFundo ? template.marca_dagua_url! : undefined,
        imagensFinais,
      });
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
    () => (origem === 'proposta' ? !!propostaCodigo : true),
    () => !!templateId,
    () => true,
  ][step]?.();

  return (
    <MainLayout
      title={origem === 'proposta' ? 'Novo contrato — a partir de proposta' : 'Novo contrato — do zero'}
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
            {step === 0 && origem === 'proposta' && (
              <div className="space-y-3">
                <div>
                  <Label>Cliente (proposta NEXA) *</Label>
                  <Input value={buscaProposta} onChange={(e) => setBuscaProposta(e.target.value)} placeholder="Buscar por nome, unidade, empreendimento ou código…" />
                </div>
                {propostasLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando propostas…</div>
                ) : (
                  <div className="max-h-96 space-y-1 overflow-y-auto rounded-[1.25rem] border border-border/70 bg-muted/20 p-2">
                    {propostasFiltradas.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhuma proposta encontrada.</p>}
                    {propostasFiltradas.map((p) => {
                      const sel = p.proposal_code === propostaCodigo;
                      return (
                        <button
                          key={p.proposal_code}
                          type="button"
                          disabled={carregandoProposta}
                          onClick={() => selecionarProposta(p)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${sel ? 'border-primary bg-primary-soft/40' : 'border-border/70 hover:bg-muted/50'}`}
                        >
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.buyer_name || '—'}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {p.project_name} · Und. {p.unit_number} · <span className="font-mono">{p.proposal_code}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px] uppercase">{p.status}</Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
                {propostaCodigo && (
                  <div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-3 text-sm">
                    <span className="text-muted-foreground">Selecionada: </span>
                    <strong>{clienteNome}</strong> — proposta {propostaCodigo}
                    {carregandoProposta && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
                  </div>
                )}
                <div>
                  <Label>Observações</Label>
                  <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
                </div>
              </div>
            )}

            {step === 0 && origem === 'zero' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Contrato do zero: escolha o modelo e preencha as variáveis manualmente na próxima etapa.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Empreendimento (opcional)</Label>
                    <Select value={empId || 'none'} onValueChange={(v) => setEmpId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Global (todos)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Global (todos)</SelectItem>
                        {emps?.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
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
                {template && blocosDetectados.length > 0 && (
                  <div className="space-y-2 rounded-[1.25rem] border border-border/70 bg-muted/20 p-3">
                    <div className="text-sm font-medium">Blocos opcionais</div>
                    <p className="text-xs text-muted-foreground">Desmarque para não incluir; a numeração das cláusulas se ajusta sozinha.</p>
                    {blocosDetectados.map((b) => (
                      <label key={b.index} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={!blocosExcluidos.has(b.index)}
                          onCheckedChange={(c) => setBlocosExcluidos((prev) => {
                            const next = new Set(prev);
                            if (c) next.delete(b.index); else next.add(b.index);
                            return next;
                          })}
                        />
                        {b.nome}
                      </label>
                    ))}
                  </div>
                )}
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={baixarWord} disabled={!template}>
                <FileText className="h-4 w-4 mr-2" />Baixar .docx
              </Button>
              <Button onClick={gerar} disabled={gerando || !template}>
                {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Gerar PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

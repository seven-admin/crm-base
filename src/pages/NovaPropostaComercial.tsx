import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Save, FileText, Loader2 } from 'lucide-react';
import { ClienteSelectorCard } from '@/components/propostas/ClienteSelectorCard';
import { UnidadeSelectorCard } from '@/components/propostas/UnidadeSelectorCard';
import { ResponsaveisCard } from '@/components/propostas/ResponsaveisCard';
import { ResumoPropostaCards } from '@/components/propostas/ResumoPropostaCards';
import { ApresentacaoDialog } from '@/components/propostas/ApresentacaoDialog';
import { LocalCondicoesPagamentoEditor, LocalCondicao } from '@/components/negociacoes/LocalCondicoesPagamentoEditor';
import { useCreateNegociacao, useUpdateNegociacao, useNegociacao } from '@/hooks/useNegociacoes';
import { useNegociacaoCondicoesPagamento } from '@/hooks/useNegociacaoCondicoesPagamento';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { toast } from 'sonner';
import { toCents, fromCents } from '@/lib/formatters';

interface UnidadeSelecionada {
  id: string;
  codigo: string;
  bloco?: string;
  valor: number;
}

export default function NovaPropostaComercial() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  
  const createNegociacao = useCreateNegociacao();
  const updateNegociacao = useUpdateNegociacao();
  const { data: etapas = [] } = useEtapasPadraoAtivas();
  
  // Load existing data in edit mode
  const { data: negociacaoExistente, isLoading: loadingNegociacao } = useNegociacao(editId);
  const { data: condicoesExistentes = [] } = useNegociacaoCondicoesPagamento(editId);
  
  // Form state
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState<string>('');
  const [empreendimentoId, setEmpreendimentoId] = useState<string | null>(null);
  const [empreendimentoNome, setEmpreendimentoNome] = useState<string>('');
  const [unidades, setUnidades] = useState<UnidadeSelecionada[]>([]);
  const [corretorId, setCorretorId] = useState<string | null>(null);
  const [imobiliariaId, setImobiliariaId] = useState<string | null>(null);
  const [condicoes, setCondicoes] = useState<LocalCondicao[]>([]);
  const [apresentacaoOpen, setApresentacaoOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Populate form when editing existing negotiation
  useEffect(() => {
    if (isEditMode && negociacaoExistente && !dataLoaded) {
      setClienteId(negociacaoExistente.cliente_id || null);
      setClienteNome(negociacaoExistente.cliente?.nome || '');
      setEmpreendimentoId(negociacaoExistente.empreendimento_id || null);
      setEmpreendimentoNome(negociacaoExistente.empreendimento?.nome || '');
      setCorretorId(negociacaoExistente.corretor_id || null);
      setImobiliariaId(negociacaoExistente.imobiliaria_id || null);
      
      // Map unidades
      if (negociacaoExistente.unidades?.length) {
        setUnidades(negociacaoExistente.unidades.map((nu: any) => ({
          id: nu.unidade_id,
          codigo: nu.unidade?.numero || '',
          bloco: nu.unidade?.bloco?.nome || '',
          valor: nu.valor_unidade || nu.unidade?.valor || 0,
        })));
      }
      
      setDataLoaded(true);
    }
  }, [isEditMode, negociacaoExistente, dataLoaded]);

  // Populate conditions when editing
  useEffect(() => {
    if (isEditMode && condicoesExistentes.length > 0 && dataLoaded && condicoes.length === 0) {
      setCondicoes(condicoesExistentes.map((c: any, index: number) => ({
        _localId: `existing-${index}-${Date.now()}`,
        tipo_parcela_codigo: c.tipo_parcela_codigo,
        quantidade: c.quantidade,
        valor: c.valor,
        valor_tipo: c.valor_tipo || 'fixo',
        forma_quitacao: c.forma_quitacao || 'dinheiro',
        forma_pagamento: c.forma_pagamento || 'boleto',
        intervalo_dias: c.intervalo_dias || 30,
        com_correcao: c.com_correcao || false,
        indice_correcao: c.indice_correcao || 'INCC',
        parcelas_sem_correcao: c.parcelas_sem_correcao || 0,
        descricao: c.descricao,
        observacao_texto: c.observacao_texto,
        data_vencimento: c.data_vencimento,
        evento_vencimento: c.evento_vencimento,
      })));
    }
  }, [isEditMode, condicoesExistentes, dataLoaded, condicoes.length]);
  
  // Derived values
  const valorTotal = useMemo(() => 
    unidades.reduce((acc, u) => acc + (u.valor || 0), 0), 
    [unidades]
  );
  
  // Calculate summary from conditions
  const resumo = useMemo(() => {
    let totalCents = 0;
    let entradaCents = 0;
    let primeiraParcela = 0;
    let baloesCents = 0;
    
    condicoes.forEach(c => {
      const valorCents = toCents(c.valor || 0);
      const total = c.quantidade * valorCents;
      totalCents += total;
      
      if (c.tipo_parcela_codigo === 'entrada') {
        entradaCents += total;
      } else if (c.tipo_parcela_codigo === 'mensal_serie' || c.tipo_parcela_codigo === 'mensal_fixa') {
        if (primeiraParcela === 0) primeiraParcela = c.valor || 0;
      } else if (c.tipo_parcela_codigo === 'intermediaria') {
        baloesCents += total;
      }
    });
    
    return {
      valorEntrada: fromCents(entradaCents),
      valorPrimeiraParcela: primeiraParcela,
      valorBaloes: fromCents(baloesCents),
      custoTotal: fromCents(totalCents),
    };
  }, [condicoes]);
  
  // Validation
  const percentualConfigurado = useMemo(() => {
    if (valorTotal <= 0) return 0;
    const totalCents = condicoes.reduce((acc, c) => acc + toCents(c.valor || 0) * c.quantidade, 0);
    return Math.min((totalCents / toCents(valorTotal)) * 100, 100);
  }, [condicoes, valorTotal]);
  
  const canSave = clienteId && empreendimentoId && unidades.length > 0 && percentualConfigurado >= 99.9;
  
  const handleSave = async () => {
    if (!clienteId || !empreendimentoId || unidades.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (percentualConfigurado < 99.9) {
      toast.error('Configure as condições de pagamento para totalizar 100% do valor');
      return;
    }
    
    try {
      if (isEditMode && editId) {
        // Update existing negotiation
        await updateNegociacao.mutateAsync({
          id: editId,
          data: {
            cliente_id: clienteId,
            empreendimento_id: empreendimentoId,
            corretor_id: corretorId || undefined,
            imobiliaria_id: imobiliariaId || undefined,
            valor_negociacao: valorTotal,
            unidade_ids: unidades.map(u => u.id),
          },
        });
        
        // Update payment conditions: delete old, insert new
        const db = (await import('@/integrations/supabase/client')).supabase as any;
        await db.from('negociacao_condicoes_pagamento')
          .delete()
          .eq('negociacao_id', editId);
        
        if (condicoes.length > 0) {
          const condicoesData = condicoes.map((c, index) => ({
            negociacao_id: editId,
            ordem: index,
            tipo_parcela_codigo: c.tipo_parcela_codigo,
            quantidade: c.quantidade,
            valor: c.valor,
            valor_tipo: c.valor_tipo || 'fixo',
            forma_quitacao: c.forma_quitacao || 'dinheiro',
            forma_pagamento: c.forma_pagamento || 'boleto',
            intervalo_dias: c.intervalo_dias || 30,
            com_correcao: c.com_correcao || false,
            indice_correcao: c.indice_correcao || 'INCC',
            parcelas_sem_correcao: c.parcelas_sem_correcao || 0,
            descricao: c.descricao,
            observacao_texto: c.observacao_texto,
            data_vencimento: c.data_vencimento,
            evento_vencimento: c.evento_vencimento,
          }));
          await db.from('negociacao_condicoes_pagamento').insert(condicoesData);
        }
        
        toast.success('Proposta atualizada com sucesso!');
        navigate('/negociacoes');
      } else {
        // Create new negotiation
        const etapaInicial = etapas.find(e => e.is_inicial) || etapas[0];
        
        if (!etapaInicial) {
          toast.error('Configure as etapas do funil antes de criar propostas');
          return;
        }
        
        await createNegociacao.mutateAsync({
          cliente_id: clienteId,
          empreendimento_id: empreendimentoId,
          corretor_id: corretorId || undefined,
          imobiliaria_id: imobiliariaId || undefined,
          funil_etapa_id: etapaInicial.id,
          valor_negociacao: valorTotal,
          unidade_ids: unidades.map(u => u.id),
          condicoes_pagamento: condicoes.map((c, index) => ({
            ...c,
            ordem: index,
          })),
        });
        
        navigate('/negociacoes');
      }
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
    }
  };

  const isPending = createNegociacao.isPending || updateNegociacao.isPending;
  
  if (isEditMode && loadingNegociacao) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/negociacoes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditMode ? 'Editar Proposta Comercial' : 'Nova Proposta Comercial'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditMode 
                ? `Editando ${negociacaoExistente?.codigo || ''}`
                : 'Configure a proposta visualmente'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setApresentacaoOpen(true)}
            disabled={!clienteId || unidades.length === 0}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Apresentar
          </Button>
          <Button variant="outline" disabled={!canSave}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditMode ? 'Atualizar Proposta' : 'Salvar Proposta'}
          </Button>
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 40% */}
        <div className="lg:col-span-2 space-y-4">
          <ClienteSelectorCard
            clienteId={clienteId}
            clienteNome={clienteNome}
            onClienteChange={(id, nome) => {
              setClienteId(id);
              setClienteNome(nome || '');
            }}
          />
          
          <UnidadeSelectorCard
            empreendimentoId={empreendimentoId}
            empreendimentoNome={empreendimentoNome}
            unidades={unidades}
            onEmpreendimentoChange={(id, nome) => {
              setEmpreendimentoId(id);
              setEmpreendimentoNome(nome || '');
              if (!isEditMode) setUnidades([]);
            }}
            onUnidadesChange={setUnidades}
          />
          
          <ResponsaveisCard
            corretorId={corretorId}
            imobiliariaId={imobiliariaId}
            onCorretorChange={setCorretorId}
            onImobiliariaChange={setImobiliariaId}
          />
        </div>
        
        {/* Right Column - 60% */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Condições de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <LocalCondicoesPagamentoEditor
                valorReferencia={valorTotal}
                condicoes={condicoes}
                onChange={setCondicoes}
              />
            </CardContent>
          </Card>
          
          <ResumoPropostaCards
            valorEntrada={resumo.valorEntrada}
            valorPrimeiraParcela={resumo.valorPrimeiraParcela}
            valorBaloes={resumo.valorBaloes}
            custoTotal={resumo.custoTotal}
          />
        </div>
      </div>
      
      {/* Apresentação Dialog */}
      <ApresentacaoDialog
        open={apresentacaoOpen}
        onOpenChange={setApresentacaoOpen}
        clienteNome={clienteNome}
        empreendimentoNome={empreendimentoNome}
        unidades={unidades}
        valorTotal={valorTotal}
        resumo={resumo}
        condicoes={condicoes}
      />
    </MainLayout>
  );
}

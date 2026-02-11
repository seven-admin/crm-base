import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useUnidades } from '@/hooks/useUnidades';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { useClientes } from '@/hooks/useClientes';
import { useCreateNegociacao, useUpdateNegociacao } from '@/hooks/useNegociacoes';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { Negociacao, NegociacaoFormData, NegociacaoCondicaoLocal } from '@/types/negociacoes.types';
import { User, Home, DollarSign, Users, FileText, ChevronLeft, ChevronRight, Check, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocalCondicoesPagamentoEditor, LocalCondicao } from './LocalCondicoesPagamentoEditor';
import { NegociacaoCondicoesPagamentoInlineEditor } from './NegociacaoCondicoesPagamentoInlineEditor';

// Função auxiliar para formatação de moeda
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface NegociacaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negociacao?: Negociacao | null;
}

const STEPS = [
  { id: 1, title: 'Cliente', icon: User },
  { id: 2, title: 'Imóvel', icon: Home },
  { id: 3, title: 'Valores', icon: DollarSign },
  { id: 4, title: 'Responsáveis', icon: Users },
  { id: 5, title: 'Observações', icon: FileText },
];

export function NegociacaoForm({ open, onOpenChange, negociacao }: NegociacaoFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clienteTab, setClienteTab] = useState<'existente' | 'novo'>('existente');
  const [formData, setFormData] = useState<NegociacaoFormData>({
    empreendimento_id: '',
    unidade_ids: [],
    condicoes_pagamento: []
  });
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [filtroBloco, setFiltroBloco] = useState<string>('todos');

  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: unidades = [] } = useUnidades(formData.empreendimento_id || undefined);
  const { corretores = [] } = useCorretores();
  const { imobiliarias = [] } = useImobiliarias();
  const { data: clientes = [] } = useClientes();
  const { data: etapas = [] } = useEtapasPadraoAtivas();

  const createMutation = useCreateNegociacao();
  const updateMutation = useUpdateNegociacao();

  const etapaInicial = etapas.find(e => e.is_inicial) || etapas[0];
  const etapasDisponiveis = etapas.filter(e => !e.is_final_sucesso && !e.is_final_perda);

  // Ref para evitar sincronização repetida
  const valorSincronizadoRef = useRef<number>(0);

  // Calcular valor total das unidades selecionadas - estabilizado
  const valorTotalUnidades = useMemo(() => {
    if (selectedUnidades.length === 0) return 0;
    const total = selectedUnidades.reduce((sum, unidadeId) => {
      const unidade = unidades.find(u => u.id === unidadeId);
      return sum + (unidade?.valor || 0);
    }, 0);
    return Math.round(total * 100) / 100;
  }, [selectedUnidades, unidades]);

  // Atualizar valor quando unidades mudam - com guard robusto para evitar loops infinitos
  useEffect(() => {
    if (valorTotalUnidades === 0 || negociacao) return;
    if (valorSincronizadoRef.current === valorTotalUnidades) return;
    
    valorSincronizadoRef.current = valorTotalUnidades;
    setFormData(prev => ({
      ...prev, 
      valor_negociacao: valorTotalUnidades 
    }));
  }, [valorTotalUnidades, negociacao]);

  useEffect(() => {
    setCurrentStep(1);
    if (negociacao) {
      setFormData({
        cliente_id: negociacao.cliente_id,
        empreendimento_id: negociacao.empreendimento_id,
        corretor_id: negociacao.corretor_id,
        imobiliaria_id: negociacao.imobiliaria_id,
        funil_etapa_id: negociacao.funil_etapa_id,
        valor_negociacao: negociacao.valor_negociacao,
        valor_entrada: negociacao.valor_entrada,
        condicao_pagamento: negociacao.condicao_pagamento,
        observacoes: negociacao.observacoes,
        data_previsao_fechamento: negociacao.data_previsao_fechamento,
        unidade_ids: negociacao.unidades?.map(u => u.unidade_id) || []
      });
      setSelectedUnidades(negociacao.unidades?.map(u => u.unidade_id) || []);
      setClienteTab('existente');
    } else {
      setFormData({
        empreendimento_id: '',
        funil_etapa_id: etapaInicial?.id,
        unidade_ids: [],
        condicoes_pagamento: []
      });
      setSelectedUnidades([]);
    }
  }, [negociacao, open, etapaInicial?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sempre derivar valor da soma das unidades
    const submitData: NegociacaoFormData = {
      ...formData,
      unidade_ids: selectedUnidades,
      valor_negociacao: valorTotalUnidades
    };

    if (negociacao) {
      await updateMutation.mutateAsync({
        id: negociacao.id,
        data: submitData
      });
    } else {
      await createMutation.mutateAsync(submitData);
    }

    onOpenChange(false);
  };

  const unidadesDisponiveis = unidades.filter(u => 
    u.status === 'disponivel' || selectedUnidades.includes(u.id)
  );

  // Extrair blocos únicos para filtro
  const blocosUnicos = useMemo(() => {
    const blocos = unidadesDisponiveis
      .map(u => u.bloco?.nome)
      .filter(Boolean) as string[];
    return [...new Set(blocos)].sort();
  }, [unidadesDisponiveis]);

  // Filtrar unidades por bloco
  const unidadesFiltradas = useMemo(() => {
    if (filtroBloco === 'todos') return unidadesDisponiveis;
    return unidadesDisponiveis.filter(u => u.bloco?.nome === filtroBloco);
  }, [unidadesDisponiveis, filtroBloco]);

  const handleUnidadeToggle = (unidadeId: string) => {
    setSelectedUnidades(prev => 
      prev.includes(unidadeId)
        ? prev.filter(id => id !== unidadeId)
        : [...prev, unidadeId]
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const currentEtapa = negociacao?.funil_etapa || etapas.find(e => e.id === negociacao?.funil_etapa_id);

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{negociacao ? 'Editar Ficha de Proposta' : 'Nova Ficha de Proposta'}</DialogTitle>
          <DialogDescription>
            {negociacao ? `Editando ${negociacao.codigo}` : 'Preencha os dados da ficha de proposta'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 group transition-all",
                      isActive || isCompleted ? "cursor-pointer" : "cursor-pointer opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      isCompleted && "bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground group-hover:bg-muted/80"
                    )}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      "text-xs font-medium transition-colors hidden sm:block",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </button>
                  
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2 min-h-[300px]">
            {/* Step 1: Cliente */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {!negociacao && (
                  <Tabs value={clienteTab} onValueChange={(v) => setClienteTab(v as 'existente' | 'novo')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existente">Cliente Existente</TabsTrigger>
                      <TabsTrigger value="novo">Novo Cliente</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="existente" className="space-y-3 mt-4">
                      <Select
                        value={formData.cliente_id || ''}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, cliente_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nome} {cliente.cpf && `(${cliente.cpf})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TabsContent>
                    
                    <TabsContent value="novo" className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label htmlFor="cliente_nome">Nome *</Label>
                          <Input
                            id="cliente_nome"
                            value={formData.cliente_nome || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                            placeholder="Nome do cliente"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cliente_email">Email</Label>
                          <Input
                            id="cliente_email"
                            type="email"
                            value={formData.cliente_email || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cliente_telefone">Telefone</Label>
                          <Input
                            id="cliente_telefone"
                            value={formData.cliente_telefone || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {negociacao && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{negociacao.cliente?.nome}</p>
                    <p className="text-sm text-muted-foreground">{negociacao.cliente?.email}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Imóvel */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="empreendimento_id">Empreendimento *</Label>
                  <Select
                    value={formData.empreendimento_id}
                    onValueChange={(v) => {
                      setFormData(prev => ({ ...prev, empreendimento_id: v }));
                      setSelectedUnidades([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o empreendimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {empreendimentos.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.empreendimento_id && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Unidades Disponíveis</Label>
                      {blocosUnicos.length > 1 && (
                        <Select value={filtroBloco} onValueChange={setFiltroBloco}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por bloco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os blocos</SelectItem>
                            {blocosUnicos.map(bloco => (
                              <SelectItem key={bloco} value={bloco}>{bloco}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {unidadesFiltradas.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3">Nenhuma unidade disponível</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Bloco</TableHead>
                              <TableHead>Unidade</TableHead>
                              <TableHead>Tipologia</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unidadesFiltradas.map((unidade) => (
                              <TableRow 
                                key={unidade.id} 
                                className={cn(
                                  "cursor-pointer",
                                  selectedUnidades.includes(unidade.id) && "bg-primary/10"
                                )}
                                onClick={() => handleUnidadeToggle(unidade.id)}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedUnidades.includes(unidade.id)}
                                    onCheckedChange={() => handleUnidadeToggle(unidade.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{unidade.bloco?.nome || '-'}</TableCell>
                                <TableCell>{unidade.numero}</TableCell>
                                <TableCell>{unidade.tipologia?.nome || '-'}</TableCell>
                                <TableCell className="text-right">{formatCurrency(unidade.valor || 0)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                    {selectedUnidades.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedUnidades.length} unidade(s) selecionada(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Valores */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Valor derivado das unidades (sem campo editável) */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Valor Total da Proposta</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {valorTotalUnidades.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedUnidades.length > 0 
                      ? `Calculado a partir de ${selectedUnidades.length} unidade(s) selecionada(s)`
                      : 'Selecione unidade(s) no passo anterior para definir o valor'
                    }
                  </p>
                </div>

                {/* Editor de Condições de Pagamento */}
                <div className="space-y-3 pt-2">
                  <Label className="text-base font-semibold">Condições de Pagamento</Label>
                  
                  {negociacao?.id ? (
                    // Para edição, usa o editor que salva direto no banco
                    <NegociacaoCondicoesPagamentoInlineEditor
                      negociacaoId={negociacao.id}
                      empreendimentoId={formData.empreendimento_id}
                      valorReferencia={valorTotalUnidades}
                    />
                  ) : (
                    // Para criação, usa o editor local
                    <LocalCondicoesPagamentoEditor
                      valorReferencia={valorTotalUnidades}
                      condicoes={(formData.condicoes_pagamento as LocalCondicao[]) || []}
                      onChange={(condicoes) => setFormData(prev => ({
                        ...prev,
                        condicoes_pagamento: condicoes as NegociacaoCondicaoLocal[]
                      }))}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Responsáveis */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="corretor_id">Corretor</Label>
                    <Select
                      value={formData.corretor_id || ''}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, corretor_id: v || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {corretores.map((corretor) => (
                          <SelectItem key={corretor.id} value={corretor.id}>
                            {corretor.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imobiliaria_id">Imobiliária</Label>
                    <Select
                      value={formData.imobiliaria_id || ''}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, imobiliaria_id: v || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {imobiliarias.map((imob) => (
                          <SelectItem key={imob.id} value={imob.id}>
                            {imob.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {!negociacao && (
                    <div>
                      <Label htmlFor="funil_etapa_id">Etapa Inicial</Label>
                      <Select
                        value={formData.funil_etapa_id || ''}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, funil_etapa_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a etapa" />
                        </SelectTrigger>
                        <SelectContent>
                          {etapasDisponiveis.map((etapa) => (
                            <SelectItem key={etapa.id} value={etapa.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: etapa.cor }}
                                />
                                {etapa.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {negociacao && (
                    <div>
                      <Label>Etapa Atual</Label>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: currentEtapa?.cor }}
                        />
                        <span className="text-sm font-medium">{currentEtapa?.nome || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                  <div className={!negociacao ? '' : 'col-span-2'}>
                    <Label htmlFor="data_previsao_fechamento">Previsão de Fechamento</Label>
                    <Input
                      id="data_previsao_fechamento"
                      type="date"
                      value={formData.data_previsao_fechamento || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_previsao_fechamento: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Observações */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Informações adicionais sobre a negociação..."
                    rows={6}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
            </div>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : negociacao ? 'Salvar' : 'Criar Ficha'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

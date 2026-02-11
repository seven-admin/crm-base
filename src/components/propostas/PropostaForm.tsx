import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useUnidades } from '@/hooks/useUnidades';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { useClientes, useCreateCliente } from '@/hooks/useClientes';
import { useCreateProposta, useUpdateProposta, useProposta } from '@/hooks/usePropostas';
import { supabase } from '@/integrations/supabase/client';
import { Proposta } from '@/types/propostas.types';
import { useQuery } from '@tanstack/react-query';
import { PropostaFormData } from '@/types/propostas.types';
import { 
  User, 
  Home, 
  DollarSign, 
  Users, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calculator,
  Loader2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';

interface PropostaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposta?: Proposta | null; // Para modo de edição
}

const STEPS = [
  { id: 1, title: 'Cliente', icon: User },
  { id: 2, title: 'Imóvel', icon: Home },
  { id: 3, title: 'Valores', icon: DollarSign },
  { id: 4, title: 'Responsáveis', icon: Users },
  { id: 5, title: 'Finalizar', icon: FileText },
];

export function PropostaForm({ open, onOpenChange, proposta }: PropostaFormProps) {
  const isEditing = !!proposta;
  const [currentStep, setCurrentStep] = useState(1);
  const [clienteTab, setClienteTab] = useState<'existente' | 'novo'>('existente');
  
  const [formData, setFormData] = useState<PropostaFormData>({
    cliente_id: '',
    empreendimento_id: '',
    data_validade: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    unidades: [],
  });
  
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
  });
  
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [filtroBloco, setFiltroBloco] = useState<string>('todos');

  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: unidades = [] } = useUnidades(formData.empreendimento_id || undefined);
  const { corretores = [] } = useCorretores();
  const { imobiliarias = [] } = useImobiliarias();
  const { data: clientes = [] } = useClientes();
  
  // Buscar dados completos da proposta para edição
  const { data: propostaCompleta } = useProposta(proposta?.id);
  
  // Fetch gestores inline
  const { data: gestores = [] } = useQuery({
    queryKey: ['gestores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const createProposta = useCreateProposta();
  const updateProposta = useUpdateProposta();
  const createCliente = useCreateCliente();

  // Criar Map estável de unidades por ID para evitar recálculos desnecessários
  const unidadesMap = useMemo(() => {
    const map = new Map<string, number>();
    unidades.forEach(u => {
      map.set(u.id, u.valor || 0);
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(unidades.map(u => ({ id: u.id, valor: u.valor })))]);

  // Calcular valor total das unidades selecionadas (apenas para exibição)
  const valorTotalUnidades = useMemo(() => {
    const total = selectedUnidades.reduce((sum, unidadeId) => {
      return sum + (unidadesMap.get(unidadeId) || 0);
    }, 0);
    return Math.round(total * 100) / 100;
  }, [selectedUnidades, unidadesMap]);

  // Reset ou preencher form quando dialog abre
  useEffect(() => {
    if (open) {
      if (isEditing && propostaCompleta) {
        // Modo edição: preencher com dados da proposta
        setFormData({
          cliente_id: propostaCompleta.cliente_id,
          empreendimento_id: propostaCompleta.empreendimento_id,
          corretor_id: propostaCompleta.corretor_id,
          imobiliaria_id: propostaCompleta.imobiliaria_id,
          gestor_id: propostaCompleta.gestor_id,
          valor_tabela: propostaCompleta.valor_tabela ?? undefined,
          valor_proposta: propostaCompleta.valor_proposta ?? undefined,
          data_validade: propostaCompleta.data_validade,
          observacoes: propostaCompleta.observacoes,
          unidades: propostaCompleta.unidades?.map(u => ({
            unidade_id: u.unidade_id,
            valor_tabela: u.valor_tabela ?? undefined,
            valor_proposta: u.valor_proposta ?? undefined,
          })) || [],
        });
        setSelectedUnidades(propostaCompleta.unidades?.map(u => u.unidade_id) || []);
        setClienteTab('existente');
        setCurrentStep(1);
      } else if (!isEditing) {
        // Modo criação: resetar form
        setCurrentStep(1);
        setFormData({
          cliente_id: '',
          empreendimento_id: '',
          data_validade: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          unidades: [],
        });
        setNovoCliente({ nome: '', email: '', telefone: '', cpf: '' });
        setSelectedUnidades([]);
        setClienteTab('existente');
      }
    }
  }, [open, isEditing, propostaCompleta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let clienteId = formData.cliente_id;

      // Criar cliente se necessário (apenas no modo criação)
      if (!isEditing && clienteTab === 'novo' && novoCliente.nome) {
        const novoClienteData = await createCliente.mutateAsync({
          nome: novoCliente.nome,
          email: novoCliente.email || null,
          telefone: novoCliente.telefone || null,
          cpf: novoCliente.cpf || null,
        });
        clienteId = novoClienteData.id;
      }

      if (!clienteId) {
        toast.error('Selecione ou cadastre um cliente');
        return;
      }

      if (!formData.empreendimento_id) {
        toast.error('Selecione um empreendimento');
        return;
      }

      if (selectedUnidades.length === 0) {
        toast.error('Selecione pelo menos uma unidade');
        return;
      }

      const submitData: PropostaFormData = {
        ...formData,
        cliente_id: clienteId,
        unidades: selectedUnidades.map(id => {
          const unidade = unidades.find(u => u.id === id);
          return {
            unidade_id: id,
            valor_tabela: unidade?.valor,
            valor_proposta: unidade?.valor,
          };
        }),
      };

      if (isEditing && proposta) {
        await updateProposta.mutateAsync({ id: proposta.id, data: submitData });
        toast.success('Proposta atualizada com sucesso!');
      } else {
        await createProposta.mutateAsync(submitData);
        toast.success('Proposta criada com sucesso!');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
      toast.error(isEditing ? 'Erro ao atualizar proposta' : 'Erro ao criar proposta');
    }
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

  // Handler simples para toggle de unidade (apenas altera selectedUnidades)
  const toggleUnidade = useCallback((unidadeId: string) => {
    setSelectedUnidades(prev => 
      prev.includes(unidadeId)
        ? prev.filter(id => id !== unidadeId)
        : [...prev, unidadeId]
    );
  }, []);

  // Sincronizar formData quando selectedUnidades mudar - useEffect separado
  useEffect(() => {
    if (selectedUnidades.length === 0) {
      // Resetar valores quando não há unidades selecionadas
      setFormData(prev => {
        if (prev.valor_tabela === undefined || prev.valor_tabela === null) {
          return prev;
        }
        return { ...prev, valor_tabela: undefined, valor_proposta: undefined };
      });
      return;
    }
    
    const novoTotal = selectedUnidades.reduce((sum, id) => {
      return sum + (unidadesMap.get(id) || 0);
    }, 0);
    const totalNormalizado = Math.round(novoTotal * 100) / 100;
    
    setFormData(prev => {
      const prevValorTabela = Math.round((prev.valor_tabela || 0) * 100) / 100;
      // Só atualiza se valor realmente mudou
      if (prevValorTabela === totalNormalizado) {
        return prev; // Retorna o mesmo objeto para evitar re-render
      }
      return {
        ...prev,
        valor_tabela: totalNormalizado,
        valor_proposta: prev.valor_proposta && prev.valor_proposta > 0
          ? prev.valor_proposta
          : totalNormalizado,
      };
    });
  }, [selectedUnidades, unidadesMap]);

  const isLoading = createProposta.isPending || updateProposta.isPending || createCliente.isPending;

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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const descontoPercentual = formData.valor_tabela && formData.valor_proposta && formData.valor_proposta < formData.valor_tabela
    ? ((1 - formData.valor_proposta / formData.valor_tabela) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Editando proposta ${proposta?.numero}`
              : 'Preencha os dados para criar uma nova proposta comercial'}
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
          <div className="flex-1 overflow-y-auto px-1 min-h-[300px]">
            {/* Step 1: Cliente */}
            {currentStep === 1 && (
              <div className="space-y-4">
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
                          value={novoCliente.nome}
                          onChange={(e) => setNovoCliente(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cliente_cpf">CPF</Label>
                        <Input
                          id="cliente_cpf"
                          value={novoCliente.cpf}
                          onChange={(e) => setNovoCliente(prev => ({ ...prev, cpf: e.target.value }))}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cliente_telefone">Telefone</Label>
                        <Input
                          id="cliente_telefone"
                          value={novoCliente.telefone}
                          onChange={(e) => setNovoCliente(prev => ({ ...prev, telefone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="cliente_email">Email</Label>
                        <Input
                          id="cliente_email"
                          type="email"
                          value={novoCliente.email}
                          onChange={(e) => setNovoCliente(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
                      <Label>Unidades Disponíveis *</Label>
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
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
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
                                onClick={() => toggleUnidade(unidade.id)}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedUnidades.includes(unidade.id)}
                                    onCheckedChange={() => toggleUnidade(unidade.id)}
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
                {/* Valor calculado das unidades */}
                {selectedUnidades.length > 0 && valorTotalUnidades > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Valor das unidades selecionadas</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(valorTotalUnidades)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedUnidades.length} unidade(s)
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="valor_tabela">Valor de Tabela</Label>
                    <CurrencyInput
                      id="valor_tabela"
                      value={formData.valor_tabela}
                      onChange={(value) => setFormData(prev => ({ ...prev, valor_tabela: value }))}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor_proposta">Valor da Proposta</Label>
                    <CurrencyInput
                      id="valor_proposta"
                      value={formData.valor_proposta}
                      onChange={(value) => setFormData(prev => ({ ...prev, valor_proposta: value }))}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {descontoPercentual > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Desconto: </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency((formData.valor_tabela || 0) - (formData.valor_proposta || 0))} ({descontoPercentual.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="data_validade">Validade da Proposta *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="data_validade"
                      type="date"
                      value={formData.data_validade}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_validade: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
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
                      onValueChange={(v) => setFormData(prev => ({ ...prev, corretor_id: v || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o corretor" />
                      </SelectTrigger>
                      <SelectContent>
                        {corretores.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imobiliaria_id">Imobiliária</Label>
                    <Select
                      value={formData.imobiliaria_id || ''}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, imobiliaria_id: v || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a imobiliária" />
                      </SelectTrigger>
                      <SelectContent>
                        {imobiliarias.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="gestor_id">Gestor Responsável</Label>
                  <Select
                    value={formData.gestor_id || ''}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, gestor_id: v || null }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gestor" />
                    </SelectTrigger>
                    <SelectContent>
                      {gestores.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: Finalizar */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais sobre a proposta..."
                    rows={4}
                  />
                </div>

                {/* Resumo */}
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold">Resumo da Proposta</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <p className="font-medium">
                        {clienteTab === 'novo' 
                          ? novoCliente.nome || '-'
                          : clientes.find(c => c.id === formData.cliente_id)?.nome || '-'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Empreendimento:</span>
                      <p className="font-medium">
                        {empreendimentos.find(e => e.id === formData.empreendimento_id)?.nome || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Unidades:</span>
                      <p className="font-medium">{selectedUnidades.length} selecionada(s)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor da Proposta:</span>
                      <p className="font-medium text-primary">
                        {formatCurrency(formData.valor_proposta || 0)}
                      </p>
                    </div>
                    {formData.corretor_id && (
                      <div>
                        <span className="text-muted-foreground">Corretor:</span>
                        <p className="font-medium">
                          {corretores.find(c => c.id === formData.corretor_id)?.nome_completo || '-'}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Validade:</span>
                      <p className="font-medium">{formData.data_validade}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <DialogFooter className="mt-4 gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Proposta'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

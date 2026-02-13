import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Trophy,
  Target,
  Calculator,
  DollarSign,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  useBonificacoes, 
  useCreateBonificacao,
  useCalcularBonificacao,
  useRegistrarPagamentoBonificacao,
  useLancarBonificacaoNoFinanceiro
} from '@/hooks/useBonificacoes';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useFuncionariosSeven } from '@/hooks/useFuncionariosSeven';
import type { BonificacaoFormData, TipoBonificacao } from '@/types/financeiro.types';
import { 
  TIPO_BONIFICACAO_LABELS, 
  STATUS_BONIFICACAO_LABELS,
  STATUS_BONIFICACAO_COLORS
} from '@/types/financeiro.types';

export default function Bonificacoes() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [selectedBonificacao, setSelectedBonificacao] = useState<string | null>(null);
  const [formData, setFormData] = useState<BonificacaoFormData>({
    empreendimento_id: '',
    user_id: '',
    tipo: 'meta_6_meses',
    periodo_inicio: '',
    periodo_fim: ''
  });
  const [pagamentoData, setPagamentoData] = useState({
    data_pagamento: format(new Date(), 'yyyy-MM-dd'),
    nf_numero: ''
  });

  const { data: bonificacoes = [], isLoading } = useBonificacoes();
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { data: funcionarios = [] } = useFuncionariosSeven();
  const createBonificacao = useCreateBonificacao();
  const calcularBonificacao = useCalcularBonificacao();
  const registrarPagamento = useRegistrarPagamentoBonificacao();
  const lancarNoFinanceiro = useLancarBonificacaoNoFinanceiro();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalPendente = bonificacoes
    .filter(b => b.status === 'calculado')
    .reduce((acc, b) => acc + b.valor_bonificacao, 0);

  const totalPago = bonificacoes
    .filter(b => b.status === 'pago')
    .reduce((acc, b) => acc + b.valor_bonificacao, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBonificacao.mutate(formData, {
      onSuccess: () => {
        setFormOpen(false);
        setFormData({
          empreendimento_id: '',
          user_id: '',
          tipo: 'meta_6_meses',
          periodo_inicio: '',
          periodo_fim: ''
        });
      }
    });
  };

  const handleCalcular = (id: string) => {
    calcularBonificacao.mutate(id);
  };

  const handleRegistrarPagamento = () => {
    if (selectedBonificacao) {
      registrarPagamento.mutate({
        id: selectedBonificacao,
        ...pagamentoData
      }, {
        onSuccess: () => {
          setPagamentoOpen(false);
          setSelectedBonificacao(null);
        }
      });
    }
  };

  const openPagamento = (id: string) => {
    setSelectedBonificacao(id);
    setPagamentoOpen(true);
  };

  return (
    <MainLayout 
      title="Bonificações" 
      subtitle="Gestão de bonificações por metas"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Total de Bonificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bonificacoes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Pendente de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalPendente)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPago)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Bonificação
          </Button>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {bonificacoes.map((bonificacao) => (
            <Card key={bonificacao.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{bonificacao.empreendimento?.nome || '-'}</p>
                  <p className="text-sm text-muted-foreground">{bonificacao.user?.full_name || '-'}</p>
                </div>
                <Badge className={STATUS_BONIFICACAO_COLORS[bonificacao.status]}>
                  {STATUS_BONIFICACAO_LABELS[bonificacao.status]}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant="outline">{TIPO_BONIFICACAO_LABELS[bonificacao.tipo]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span>{format(new Date(bonificacao.periodo_inicio), 'dd/MM/yy')} - {format(new Date(bonificacao.periodo_fim), 'dd/MM/yy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Atingimento:</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.min(bonificacao.percentual_atingimento, 100)} 
                      className="w-16"
                    />
                    <span>{bonificacao.percentual_atingimento.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-green-600">{formatCurrency(bonificacao.valor_bonificacao)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t">
                {bonificacao.status === 'pendente' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleCalcular(bonificacao.id)}
                    disabled={calcularBonificacao.isPending}
                    className="flex-1"
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Calcular
                  </Button>
                )}
                {bonificacao.status === 'calculado' && bonificacao.percentual_atingimento >= 100 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => lancarNoFinanceiro.mutate(bonificacao.id)}
                    disabled={lancarNoFinanceiro.isPending}
                    className="flex-1"
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    Lançar
                  </Button>
                )}
                {bonificacao.status === 'calculado' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openPagamento(bonificacao.id)}
                    className="flex-1"
                  >
                    Pagar
                  </Button>
                )}
                {bonificacao.status === 'lancado' && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => navigate('/financeiro')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {bonificacoes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma bonificação cadastrada
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Período</TableHead>
                  <TableHead>Atingimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonificacoes.map((bonificacao) => (
                  <TableRow key={bonificacao.id}>
                    <TableCell className="font-medium">
                      {bonificacao.empreendimento?.nome || '-'}
                    </TableCell>
                    <TableCell>{bonificacao.user?.full_name || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">
                        {TIPO_BONIFICACAO_LABELS[bonificacao.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(bonificacao.periodo_inicio), 'dd/MM/yy')} -{' '}
                      {format(new Date(bonificacao.periodo_fim), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(bonificacao.percentual_atingimento, 100)} 
                          className="w-20"
                        />
                        <span className="text-sm">
                          {bonificacao.percentual_atingimento.toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {bonificacao.unidades_vendidas}/{bonificacao.meta_unidades || '-'} unidades
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(bonificacao.valor_bonificacao)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BONIFICACAO_COLORS[bonificacao.status]}>
                        {STATUS_BONIFICACAO_LABELS[bonificacao.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {bonificacao.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleCalcular(bonificacao.id)}
                            disabled={calcularBonificacao.isPending}
                            title="Calcular"
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                        )}
                        {bonificacao.status === 'calculado' && bonificacao.percentual_atingimento >= 100 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => lancarNoFinanceiro.mutate(bonificacao.id)}
                            disabled={lancarNoFinanceiro.isPending}
                            title="Lançar no Fluxo de Caixa"
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                        )}
                        {bonificacao.status === 'calculado' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openPagamento(bonificacao.id)}
                            title="Registrar Pagamento"
                          >
                            Pagar
                          </Button>
                        )}
                        {bonificacao.status === 'lancado' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => navigate('/financeiro')}
                            title="Ver no Financeiro"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {bonificacoes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma bonificação cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
      </div>

      {/* Modal de nova bonificação */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Bonificação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Empreendimento</Label>
              <Select
                value={formData.empreendimento_id}
                onValueChange={value => setFormData(prev => ({ ...prev, empreendimento_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Funcionário Seven</Label>
              <Select
                value={formData.user_id}
                onValueChange={value => setFormData(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map(func => (
                    <SelectItem key={func.id} value={func.id}>{func.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={value => setFormData(prev => ({ ...prev, tipo: value as TipoBonificacao }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta_6_meses">Meta 6 Meses</SelectItem>
                  <SelectItem value="meta_12_meses">Meta 12 Meses</SelectItem>
                  <SelectItem value="venda_mensal">Venda Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Período Início</Label>
                <Input
                  type="date"
                  value={formData.periodo_inicio}
                  onChange={e => setFormData(prev => ({ ...prev, periodo_inicio: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Período Fim</Label>
                <Input
                  type="date"
                  value={formData.periodo_fim}
                  onChange={e => setFormData(prev => ({ ...prev, periodo_fim: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta de Unidades</Label>
                <Input
                  type="number"
                  value={formData.meta_unidades || ''}
                  onChange={e => setFormData(prev => ({ ...prev, meta_unidades: parseInt(e.target.value) }))}
                  placeholder="Usar meta do empreendimento"
                />
              </div>
              <div>
                <Label>Valor da Bonificação</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_bonificacao || ''}
                  onChange={e => setFormData(prev => ({ ...prev, valor_bonificacao: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createBonificacao.isPending}>
                {createBonificacao.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de pagamento */}
      <Dialog open={pagamentoOpen} onOpenChange={setPagamentoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={pagamentoData.data_pagamento}
                onChange={e => setPagamentoData(prev => ({ ...prev, data_pagamento: e.target.value }))}
              />
            </div>

            <div>
              <Label>Número da NF</Label>
              <Input
                value={pagamentoData.nf_numero}
                onChange={e => setPagamentoData(prev => ({ ...prev, nf_numero: e.target.value }))}
                placeholder="Opcional"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPagamentoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarPagamento} disabled={registrarPagamento.isPending}>
                {registrarPagamento.isPending ? 'Registrando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
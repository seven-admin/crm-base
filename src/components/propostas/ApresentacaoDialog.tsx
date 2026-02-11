import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, User, Home, Banknote, CreditCard, Calendar, Wallet } from 'lucide-react';
import { LocalCondicao } from '@/components/negociacoes/LocalCondicoesPagamentoEditor';
import { TIPO_PARCELA_LABELS } from '@/types/condicoesPagamento.types';
import logoSeven from '@/assets/logo.png';

interface UnidadeSelecionada {
  id: string;
  codigo: string;
  bloco?: string;
  valor: number;
}

interface Resumo {
  valorEntrada: number;
  valorPrimeiraParcela: number;
  valorBaloes: number;
  custoTotal: number;
}

interface ApresentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteNome: string;
  empreendimentoNome: string;
  unidades: UnidadeSelecionada[];
  valorTotal: number;
  resumo: Resumo;
  condicoes: LocalCondicao[];
}

export function ApresentacaoDialog({
  open,
  onOpenChange,
  clienteNome,
  empreendimentoNome,
  unidades,
  valorTotal,
  resumo,
  condicoes,
}: ApresentacaoDialogProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-8 bg-gradient-to-br from-background to-muted/30">
          {/* Header with Logo */}
          <div className="flex items-center justify-between mb-8">
            <img src={logoSeven} alt="Logo" className="h-12 object-contain" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Proposta Comercial</p>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          {/* Client & Property Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="text-xl font-bold">{clienteNome || 'Não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Empreendimento</p>
                    <p className="text-xl font-bold">{empreendimentoNome || 'Não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Units */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Unidades Selecionadas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {unidades.map(unidade => (
                  <div 
                    key={unidade.id}
                    className="p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{unidade.codigo}</p>
                        {unidade.bloco && (
                          <Badge variant="outline">{unidade.bloco}</Badge>
                        )}
                      </div>
                      <p className="font-mono text-lg font-semibold text-primary">
                        {formatCurrency(unidade.valor)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(valorTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-400">Entrada</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {resumo.valorEntrada > 0 ? formatCurrency(resumo.valorEntrada) : '-'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">1ª Parcela</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {resumo.valorPrimeiraParcela > 0 ? formatCurrency(resumo.valorPrimeiraParcela) : '-'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">Balões</p>
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {resumo.valorBaloes > 0 ? formatCurrency(resumo.valorBaloes) : '-'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <p className="text-sm text-primary/80">Total</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(resumo.custoTotal)}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Conditions Table */}
          {condicoes.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Condições de Pagamento</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tipo</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Qtd</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Valor Unit.</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {condicoes.map((cond, index) => {
                        const total = (cond.quantidade || 0) * (cond.valor || 0);
                        return (
                          <tr key={cond._localId || index} className="border-b last:border-0">
                            <td className="py-3 px-2">
                              <Badge variant="secondary">
                                {TIPO_PARCELA_LABELS[cond.tipo_parcela_codigo as keyof typeof TIPO_PARCELA_LABELS] || cond.tipo_parcela_codigo}
                              </Badge>
                            </td>
                            <td className="text-center py-3 px-2 font-mono">{cond.quantidade}</td>
                            <td className="text-right py-3 px-2 font-mono">{formatCurrency(cond.valor || 0)}</td>
                            <td className="text-right py-3 px-2 font-mono font-semibold">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

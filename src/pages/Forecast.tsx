import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, Handshake, FileCheck, ClipboardList } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CategoriaCard } from '@/components/forecast/CategoriaCard';
import { useResumoAtividadesPorCategoria } from '@/hooks/useResumoAtividadesPorCategoria';
import { useForecastFinanceiro } from '@/hooks/useForecastFinanceiro';
import { ATIVIDADE_CATEGORIA_LABELS, TIPOS_NEGOCIACAO, TIPOS_DIARIO, type AtividadeCategoria } from '@/types/atividades.types';
import { Building2, Users, Briefcase, UserCheck } from 'lucide-react';
import { useGestoresProduto } from '@/hooks/useGestores';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarMoeda } from '@/lib/formatters';

const CATEGORIA_CONFIG: Record<AtividadeCategoria, { icon: typeof Building2; iconColor: string; bgColor: string }> = {
  seven: { icon: Briefcase, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
  incorporadora: { icon: Building2, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
  imobiliaria: { icon: Users, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
  cliente: { icon: UserCheck, iconColor: 'text-chart-4', bgColor: 'bg-chart-4/10' },
};

const CATEGORIAS: AtividadeCategoria[] = ['seven', 'incorporadora', 'imobiliaria', 'cliente'];

export default function Forecast() {
  const [gestorId, setGestorId] = useState<string | undefined>(undefined);
  const [competencia, setCompetencia] = useState(new Date());
  const { data: gestores } = useGestoresProduto();

  const dataInicio = useMemo(() => startOfMonth(competencia), [competencia]);
  const dataFim = useMemo(() => endOfMonth(competencia), [competencia]);

  const { data: resumoNegociacoes, isLoading: loadingNegociacoes } = useResumoAtividadesPorCategoria(gestorId, dataInicio, dataFim, undefined, TIPOS_NEGOCIACAO);
  const { data: resumoAtividades, isLoading: loadingAtividades } = useResumoAtividadesPorCategoria(gestorId, dataInicio, dataFim, undefined, TIPOS_DIARIO);
  const { data: financeiro, isLoading: loadingFinanceiro } = useForecastFinanceiro(gestorId, dataInicio, dataFim);

  const renderCategoriaCards = (dados: typeof resumoNegociacoes, loading: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)
      ) : (
        CATEGORIAS.map((cat) => {
          const cfg = CATEGORIA_CONFIG[cat];
          return (
            <CategoriaCard
              key={cat}
              nome={ATIVIDADE_CATEGORIA_LABELS[cat]}
              icon={cfg.icon}
              iconColor={cfg.iconColor}
              bgColor={cfg.bgColor}
              dados={dados?.[cat]}
            />
          );
        })
      )}
    </div>
  );

  const renderFinanceiroKPIs = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loadingFinanceiro ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <DollarSign className="h-5 w-5 text-chart-2" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Valor em Vendas</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.valorVendas || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Comissões</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.totalComissoes || 0)}</p>
                  {(financeiro?.comissoesPorGestor?.length || 0) > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {financeiro!.comissoesPorGestor.slice(0, 3).map((g) => (
                        <p key={g.gestor_id} className="text-[11px] text-muted-foreground truncate">
                          {g.gestor_nome}: {formatarMoeda(g.valor)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-3/10">
                  <Handshake className="h-5 w-5 text-chart-3" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Negociações Ativas</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.valorNegociacoes || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <FileCheck className="h-5 w-5 text-chart-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Propostas Aceitas</p>
                  <p className="text-lg font-bold text-foreground truncate">{formatarMoeda(financeiro?.valorPropostasAceitas || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Forecast</h1>
            <p className="text-muted-foreground">Previsão de vendas e indicadores comerciais</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompetencia(subMonths(competencia, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center font-medium text-sm capitalize">
                {format(competencia, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompetencia(addMonths(competencia, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant={format(competencia, 'yyyy-MM') === format(new Date(), 'yyyy-MM') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompetencia(new Date())}
              >
                Este mês
              </Button>
              <Button
                variant={format(competencia, 'yyyy-MM') === format(subMonths(new Date(), 1), 'yyyy-MM') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompetencia(subMonths(new Date(), 1))}
              >
                Mês anterior
              </Button>
            </div>
            <Select value={gestorId || 'all'} onValueChange={(v) => setGestorId(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Todos os Gestores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Gestores</SelectItem>
                {(gestores || []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs: Negociações / Atividades */}
        <Tabs defaultValue="negociacoes">
          <TabsList>
          <TabsTrigger value="negociacoes" className="gap-2 data-[state=active]:text-[#F5941E] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#F5941E]">
              <Handshake className="h-4 w-4" />
              Negociações
            </TabsTrigger>
            <TabsTrigger value="atividades" className="gap-2 data-[state=active]:text-[#06B6D4] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#06B6D4]">
              <ClipboardList className="h-4 w-4" />
              Atividades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="negociacoes" className="space-y-6">
            {renderFinanceiroKPIs()}
            {renderCategoriaCards(resumoNegociacoes, loadingNegociacoes)}
          </TabsContent>

          <TabsContent value="atividades" className="space-y-6">
            {renderCategoriaCards(resumoAtividades, loadingAtividades)}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

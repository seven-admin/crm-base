import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Handshake, ClipboardList } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoriaCard } from '@/components/forecast/CategoriaCard';
import { ForecastBatchStatusDialog } from '@/components/forecast/ForecastBatchStatusDialog';
import { useResumoAtividadesPorCategoria } from '@/hooks/useResumoAtividadesPorCategoria';
import { usePessoasTreinadas } from '@/hooks/usePessoasTreinadas';
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
  const [batchDialog, setBatchDialog] = useState<{ open: boolean; categoria: AtividadeCategoria; statusGroup: string; tipos: typeof TIPOS_NEGOCIACAO }>({ open: false, categoria: 'seven', statusGroup: 'abertas', tipos: TIPOS_NEGOCIACAO });
  const { data: gestores } = useGestoresProduto();

  const dataInicio = useMemo(() => startOfMonth(competencia), [competencia]);
  const dataFim = useMemo(() => endOfMonth(competencia), [competencia]);

  const { data: resumoNegociacoes, isLoading: loadingNegociacoes } = useResumoAtividadesPorCategoria(gestorId, dataInicio, dataFim, undefined, TIPOS_NEGOCIACAO);
  const { data: resumoAtividades, isLoading: loadingAtividades } = useResumoAtividadesPorCategoria(gestorId, dataInicio, dataFim, undefined, TIPOS_DIARIO);
  
  const { data: treinamento, isLoading: loadingTreinamento } = usePessoasTreinadas(gestorId, dataInicio, dataFim);

  const renderCategoriaCards = (dados: typeof resumoNegociacoes, loading: boolean, tipos: typeof TIPOS_NEGOCIACAO, showTreinamento = false) => (
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
              onBadgeClick={(statusGroup) => setBatchDialog({ open: true, categoria: cat, statusGroup, tipos })}
              pessoasTreinadas={showTreinamento ? treinamento?.[cat]?.totalPessoas : undefined}
            />
          );
        })
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resumo</h1>
            <p className="text-muted-foreground">Resumo de vendas e indicadores comerciais</p>
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

        {/* Atendimentos */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-[#F5941E]" />
            <h2 className="text-xl font-semibold text-foreground">Atendimentos</h2>
          </div>
          {renderCategoriaCards(resumoNegociacoes, loadingNegociacoes, TIPOS_NEGOCIACAO)}
        </section>

        {/* Atividades */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#F5941E]" />
            <h2 className="text-xl font-semibold text-foreground">Atividades</h2>
          </div>
          {renderCategoriaCards(resumoAtividades, loadingAtividades || loadingTreinamento, TIPOS_DIARIO, true)}
        </section>
      </div>

      <ForecastBatchStatusDialog
        open={batchDialog.open}
        onOpenChange={(open) => setBatchDialog(prev => ({ ...prev, open }))}
        categoria={batchDialog.categoria}
        statusGroup={batchDialog.statusGroup}
        tiposFilter={batchDialog.tipos}
        gestorId={gestorId}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />
    </MainLayout>
  );
}

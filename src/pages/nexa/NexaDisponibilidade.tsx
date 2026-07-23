import { useMemo, useState } from 'react';
import { FileDown, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEmpreendimentosAtivos, useUnidadesDisponiveis, useUpdateUnidadeStatus } from '@/hooks/useNexa';
import { useQuery } from '@tanstack/react-query';
import { useEmpresaAccess } from '@/hooks/useEmpresaAccess';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { exportUnidadesDisponiveisPdf } from '@/lib/exportUnidadesDisponiveisPdf';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { UnidadeStatus } from '@/types/empreendimentos.types';
import { cn } from '@/lib/utils';

type NexaUnidadeDisponivel = Database['public']['Functions']['get_unidades_disponiveis']['Returns'][number];

const formatBRL = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: 'disponivel', label: 'Disponível', dot: 'bg-emerald-500' },
  { value: 'reservada',  label: 'Reservada',  dot: 'bg-amber-500' },
  { value: 'negociacao', label: 'Negociação', dot: 'bg-blue-500' },
  { value: 'contrato',   label: 'Contrato',   dot: 'bg-indigo-500' },
  { value: 'vendida',    label: 'Vendida',    dot: 'bg-rose-500' },
  { value: 'bloqueada',  label: 'Bloqueada',  dot: 'bg-slate-400' },
];
const ALL_STATUSES = STATUS_OPTIONS.map((s) => s.value);
const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));
const STATUS_CARD_COLORS: Record<string, string> = {
  disponivel: 'border-emerald-500/30 bg-emerald-500/10',
  reservada: 'border-yellow-500/30 bg-yellow-500/10',
  negociacao: 'border-blue-500/30 bg-blue-500/10',
  contrato: 'border-purple-500/30 bg-purple-500/10',
  vendida: 'border-red-500/30 bg-red-500/10',
  bloqueada: 'border-gray-500/30 bg-gray-500/10',
};
const TIPOLOGIA_COLORS = [
  'bg-indigo-400', 'bg-pink-400', 'bg-teal-400', 'bg-orange-400',
  'bg-cyan-400', 'bg-rose-400', 'bg-lime-400', 'bg-violet-400',
];

export default function NexaDisponibilidade() {
  const { data: emps } = useEmpreendimentosAtivos();
  const [empId, setEmpId] = useState<string | undefined>();
  const { isNexa } = useEmpresaAccess();
  const { isAdmin, isSuperAdmin, canAccessModule } = usePermissions();
  const { role } = useAuth();
  const canEdit = isSuperAdmin() || isAdmin() || (isNexa && role === 'nexa_gestor' && canAccessModule('nexa_disponibilidade', 'edit'));
  const { data: unidades, isLoading, refetch, isFetching } = useUnidadesDisponiveis(
    empId,
    canEdit ? ALL_STATUSES : ['disponivel']
  );
  const updateStatus = useUpdateUnidadeStatus();
  const [isExporting, setIsExporting] = useState(false);

  const { data: boxesVinculados } = useQuery({
    queryKey: ['nexa', 'boxes-vinculados', empId],
    enabled: !!empId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seven_boxes')
        .select('numero, unidade_id, tipo, coberto')
        .eq('empreendimento_id', empId!)
        .not('unidade_id', 'is', null)
        .eq('is_active', true)
        .order('numero');
      if (error) throw error;
      return data ?? [];
    },
  });

  const boxesPorUnidade = (boxesVinculados ?? []).reduce<Record<string, string[]>>((acc, b) => {
    if (!b.unidade_id) return acc;
    (acc[b.unidade_id] ||= []).push(String(b.numero));
    return acc;
  }, {});

  const unidadesAgrupadas = useMemo(() => {
    const grupos = new Map<string, Map<number, NexaUnidadeDisponivel[]>>();
    ((unidades ?? []) as NexaUnidadeDisponivel[]).forEach((unidade) => {
      const bloco = unidade.bloco || 'Sem bloco';
      const andar = unidade.andar ?? 0;
      if (!grupos.has(bloco)) grupos.set(bloco, new Map());
      const andares = grupos.get(bloco)!;
      if (!andares.has(andar)) andares.set(andar, []);
      andares.get(andar)!.push(unidade);
    });

    return Array.from(grupos.entries())
      .sort(([blocoA], [blocoB]) => blocoA.localeCompare(blocoB, 'pt-BR', { numeric: true }))
      .map(([bloco, andares]) => ({
        bloco,
        andares: Array.from(andares.entries())
          .sort(([andarA], [andarB]) => andarA - andarB)
          .map(([andar, items]) => ({
            andar,
            items: items.sort((a, b) => String(a.unidade).localeCompare(String(b.unidade), 'pt-BR', { numeric: true })),
          })),
      }));
  }, [unidades]);

  const tipologiaColorMap = useMemo(() => {
    const nomes = Array.from(new Set(((unidades ?? []) as NexaUnidadeDisponivel[]).map((unidade) => unidade.tipologia).filter(Boolean)));
    return new Map(nomes.map((nome, index) => [nome, TIPOLOGIA_COLORS[index % TIPOLOGIA_COLORS.length]]));
  }, [unidades]);

  const handleExportPdf = async () => {
    if (!empId) return;
    setIsExporting(true);
    try {
      const { data: emp, error: empErr } = await supabase
        .from('seven_empreendimentos')
        .select('nome, tipo, texto_rodape_relatorio')
        .eq('id', empId)
        .maybeSingle();
      if (empErr) throw empErr;
      if (!emp) {
        toast.error('Empreendimento não encontrado.');
        return;
      }

      const { data: unis, error: uniErr } = await supabase
        .from('seven_unidades')
        .select('id, numero, andar, area_privativa, valor, status, bloco:seven_blocos(nome), tipologia:seven_tipologias(nome)')
        .eq('empreendimento_id', empId)
        .eq('status', 'disponivel')
        .eq('is_active', true);
      if (uniErr) throw uniErr;

      const isLoteamento = emp.tipo === 'loteamento' || emp.tipo === 'condominio';
      await exportUnidadesDisponiveisPdf({
        empreendimento: {
          nome: emp.nome,
          texto_rodape_relatorio: emp.texto_rodape_relatorio ?? null,
        },
        unidades: (unis ?? []).map((u) => ({
          id: u.id,
          numero: u.numero,
          andar: u.andar,
          area_privativa: u.area_privativa,
          valor: u.valor,
          status: u.status as UnidadeStatus,
          bloco: u.bloco ? { nome: u.bloco.nome } : null,
          tipologia: u.tipologia ? { nome: u.tipologia.nome } : null,
        })),
        isLoteamento,
        escopo: 'disponiveis',
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout
      title="Unidades disponíveis"
      subtitle={canEdit ? 'Clique no status para alterá-lo.' : 'Consulta em tempo real do banco.'}
    >
      <div className="space-y-6">
      <div className="page-toolbar flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 max-w-md">
          <label className="text-sm font-medium mb-1 block">Empreendimento</label>
          <Select value={empId} onValueChange={setEmpId}>
            <SelectTrigger><SelectValue placeholder="Selecione um empreendimento" /></SelectTrigger>
            <SelectContent>
              {emps?.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={!empId || isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        <Button variant="outline" onClick={handleExportPdf} disabled={!empId || isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Exportar PDF
        </Button>
      </div>


      {!empId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecione um empreendimento acima.</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-64" />
      ) : !unidades?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma unidade encontrada.</CardContent></Card>
      ) : (
        <Card className="border-border/70 bg-card shadow-card">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/70 pb-4">
              <span className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Status</span>
              {STATUS_OPTIONS.filter((status) => canEdit || status.value === 'disponivel').map((status) => (
                <span key={status.value} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} /> {status.label}
                </span>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">{unidades.length} unidades</span>
            </div>

            <div className="space-y-7">
              {unidadesAgrupadas.map(({ bloco, andares }) => (
                <section key={bloco}>
                  <h3 className="mb-4 text-base font-semibold tracking-[-0.02em] text-foreground">{bloco}</h3>
                  <div className="ml-0 space-y-5 sm:ml-4">
                    {andares.map(({ andar, items }) => (
                      <div key={andar}>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Andar {andar || 'Térreo'}</h4>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                          {items.map((unidade) => {
                            const tipologia = unidade.tipologia || 'Sem tipologia';
                            const card = (
                              <button
                                type="button"
                                disabled={!canEdit || updateStatus.isPending}
                                className={cn(
                                  'relative flex min-h-[4.75rem] min-w-0 flex-col items-center justify-center rounded-lg border p-2 text-center text-slate-800 transition-all',
                                  STATUS_CARD_COLORS[unidade.status] || 'border-gray-300 bg-gray-100',
                                  canEdit ? 'cursor-pointer ring-primary ring-offset-2 hover:ring-2' : 'cursor-default',
                                )}
                                title={`${unidade.unidade} · ${STATUS_MAP[unidade.status]?.label ?? unidade.status} · ${tipologia} · ${unidade.area_privativa ? `${unidade.area_privativa} m²` : 'área não informada'} · ${formatBRL(unidade.valor)}${boxesPorUnidade[unidade.unidade_id]?.length ? ` · Box(es): ${boxesPorUnidade[unidade.unidade_id].join(', ')}` : ''}`}
                              >
                                <span className={cn('absolute right-1.5 top-1.5 h-2 w-2 rounded-full', tipologiaColorMap.get(unidade.tipologia) ?? 'bg-slate-300')} />
                                <span className="max-w-full truncate text-xs font-semibold leading-tight">
                                  {unidade.unidade}{andar ? ` | ${andar}º` : ''}
                                </span>
                                <span className="mt-1 max-w-full truncate text-[10px] uppercase leading-tight text-slate-600">{tipologia}</span>
                              </button>
                            );

                            if (!canEdit) return <div key={unidade.unidade_id}>{card}</div>;

                            return (
                              <Popover key={unidade.unidade_id}>
                                <PopoverTrigger asChild>{card}</PopoverTrigger>
                                <PopoverContent className="w-48 p-1" align="start">
                                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Alterar status</p>
                                  {STATUS_OPTIONS.map((status) => (
                                    <button
                                      key={status.value}
                                      type="button"
                                      onClick={() => updateStatus.mutate({ unidadeId: unidade.unidade_id, status: status.value })}
                                      className={cn(
                                        'flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-xs transition-colors hover:bg-muted',
                                        unidade.status === status.value && 'bg-muted font-medium',
                                      )}
                                    >
                                      <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                                      {status.label}
                                    </button>
                                  ))}
                                </PopoverContent>
                              </Popover>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </MainLayout>
  );
}

import { useState } from 'react';
import { RefreshCw, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Andar</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Box(es)</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(unidades as NexaUnidadeDisponivel[]).map((u) => (
                  <TableRow key={u.unidade_id}>
                    <TableCell>{u.bloco || '—'}</TableCell>
                    <TableCell>{u.andar ?? '—'}</TableCell>
                    <TableCell className="font-medium">{u.unidade}</TableCell>
                    <TableCell>{u.tipologia || '—'}</TableCell>
                    <TableCell>{u.area_privativa ? `${u.area_privativa} m²` : '—'}</TableCell>
                    <TableCell>{boxesPorUnidade[u.unidade_id]?.join(', ') || '—'}</TableCell>
                    <TableCell>{formatBRL(u.valor)}</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              disabled={updateStatus.isPending}
                              className="inline-flex items-center gap-2 h-7 px-2 -mx-2 rounded-md text-xs text-foreground/80 hover:bg-muted/60 transition-colors disabled:opacity-50"
                            >
                              <span className={`h-2 w-2 rounded-full ${STATUS_MAP[u.status]?.dot ?? 'bg-muted-foreground'}`} />
                              <span>{STATUS_MAP[u.status]?.label ?? u.status}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-44 p-1" align="start">
                            <div className="flex flex-col">
                              {STATUS_OPTIONS.map((s) => (
                                <button
                                  key={s.value}
                                  type="button"
                                  onClick={() => updateStatus.mutate({ unidadeId: u.unidade_id, status: s.value })}
                                  className={`flex items-center gap-2 h-8 px-2 rounded-md text-xs text-left hover:bg-muted transition-colors ${u.status === s.value ? 'bg-muted font-medium' : ''}`}
                                >
                                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                                  <span>{s.label}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs text-foreground/80">
                          <span className={`h-2 w-2 rounded-full ${STATUS_MAP[u.status]?.dot ?? 'bg-muted-foreground'}`} />
                          {STATUS_MAP[u.status]?.label ?? u.status}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      </div>
    </MainLayout>
  );
}

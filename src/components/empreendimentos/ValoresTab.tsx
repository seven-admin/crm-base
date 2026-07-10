import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnidades, useUpdateUnidadesBulk } from '@/hooks/useUnidades';
import { useBlocos } from '@/hooks/useBlocos';
import { useTipologias } from '@/hooks/useTipologias';
import { Save, RotateCcw, Percent, Ruler, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ValoresTabProps {
  empreendimentoId: string;
}

const STATUS_OPTIONS = ['disponivel', 'reservada', 'proposta', 'vendida', 'bloqueada', 'permuta'];

function formatBRL(v: number | null | undefined) {
  if (v == null || isNaN(Number(v))) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));
}

function parseNumberInput(s: string): number | null {
  if (!s || !s.trim()) return null;
  const cleaned = s.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

export function ValoresTab({ empreendimentoId }: ValoresTabProps) {
  const { data: unidades, isLoading } = useUnidades(empreendimentoId);
  const { data: blocos } = useBlocos(empreendimentoId);
  const { data: tipologias } = useTipologias(empreendimentoId);
  const updateBulk = useUpdateUnidadesBulk();

  const [novosValores, setNovosValores] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState('');
  const [filtroBloco, setFiltroBloco] = useState<string>('all');
  const [filtroTipologia, setFiltroTipologia] = useState<string>('all');
  const [filtroStatus, setFiltroStatus] = useState<string>('all');
  const [busca, setBusca] = useState('');

  // Ações em massa
  const [percentual, setPercentual] = useState('');
  const [valorM2, setValorM2] = useState('');

  const unidadesFiltradas = useMemo(() => {
    const list = (unidades ?? []).slice().sort((a, b) => {
      const bA = a.bloco?.nome || '';
      const bB = b.bloco?.nome || '';
      if (bA !== bB) return bA.localeCompare(bB);
      return (a.numero || '').localeCompare(b.numero || '', 'pt-BR', { numeric: true });
    });
    return list.filter((u) => {
      if (filtroBloco !== 'all' && u.bloco_id !== filtroBloco) return false;
      if (filtroTipologia !== 'all' && u.tipologia_id !== filtroTipologia) return false;
      if (filtroStatus !== 'all' && u.status !== filtroStatus) return false;
      if (busca && !String(u.numero || '').toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [unidades, filtroBloco, filtroTipologia, filtroStatus, busca]);

  const alteracoesPendentes = useMemo(() => {
    return Object.entries(novosValores).filter(([id, v]) => {
      const u = unidades?.find((x) => x.id === id);
      if (!u) return false;
      const parsed = parseNumberInput(v);
      return parsed != null && parsed !== u.valor;
    }).length;
  }, [novosValores, unidades]);

  const setValorLinha = (id: string, valor: string) => {
    setNovosValores((prev) => ({ ...prev, [id]: valor }));
  };

  const aplicarPercentual = () => {
    const p = parseNumberInput(percentual);
    if (p == null) {
      toast.error('Informe um percentual válido');
      return;
    }
    const novos: Record<string, string> = { ...novosValores };
    unidadesFiltradas.forEach((u) => {
      const base = u.valor ?? 0;
      const novo = base * (1 + p / 100);
      novos[u.id] = novo.toFixed(2);
    });
    setNovosValores(novos);
    toast.success(`Aplicado ${p}% em ${unidadesFiltradas.length} unidade(s)`);
  };

  const aplicarValorM2 = () => {
    const vm2 = parseNumberInput(valorM2);
    if (vm2 == null) {
      toast.error('Informe R$/m² válido');
      return;
    }
    const novos: Record<string, string> = { ...novosValores };
    let ok = 0;
    unidadesFiltradas.forEach((u) => {
      if (!u.area_privativa) return;
      novos[u.id] = (Number(u.area_privativa) * vm2).toFixed(2);
      ok++;
    });
    setNovosValores(novos);
    toast.success(`Aplicado R$/m² em ${ok} unidade(s)`);
  };

  const copiarValorBaseTipologia = () => {
    const novos: Record<string, string> = { ...novosValores };
    let ok = 0;
    unidadesFiltradas.forEach((u) => {
      const t = tipologias?.find((x) => x.id === u.tipologia_id);
      if (t?.valor_base) {
        novos[u.id] = Number(t.valor_base).toFixed(2);
        ok++;
      }
    });
    setNovosValores(novos);
    toast.success(`Copiado valor base em ${ok} unidade(s)`);
  };

  const descartar = () => setNovosValores({});

  const salvar = async () => {
    const updates: Array<{ id: string; valor: number }> = [];
    Object.entries(novosValores).forEach(([id, v]) => {
      const u = unidades?.find((x) => x.id === id);
      if (!u) return;
      const parsed = parseNumberInput(v);
      if (parsed != null && parsed !== u.valor) {
        updates.push({ id, valor: parsed });
      }
    });
    if (updates.length === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }
    try {
      await updateBulk.mutateAsync({ empreendimentoId, updates, motivo: motivo || undefined });
      setNovosValores({});
      setMotivo('');
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Bloco</Label>
            <Select value={filtroBloco} onValueChange={setFiltroBloco}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {blocos?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipologia</Label>
            <Select value={filtroTipologia} onValueChange={setFiltroTipologia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {tipologias?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Buscar por número</Label>
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: 101" />
          </div>
        </CardContent>
      </Card>

      {/* Ações em massa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações em massa (aplica às linhas filtradas)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Reajuste percentual (%)</Label>
              <Input
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="Ex.: 5 ou -3,5"
              />
            </div>
            <Button variant="outline" onClick={aplicarPercentual} className="gap-1">
              <Percent className="h-4 w-4" />Aplicar
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Valor por m² (R$)</Label>
              <Input
                value={valorM2}
                onChange={(e) => setValorM2(e.target.value)}
                placeholder="Ex.: 12000"
              />
            </div>
            <Button variant="outline" onClick={aplicarValorM2} className="gap-1">
              <Ruler className="h-4 w-4" />Aplicar
            </Button>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={copiarValorBaseTipologia} className="gap-1 w-full">
              <Copy className="h-4 w-4" />Copiar valor base da tipologia
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Unidades — {unidadesFiltradas.length}
            {alteracoesPendentes > 0 && (
              <Badge variant="secondary" className="ml-2">
                {alteracoesPendentes} alteração(ões) pendente(s)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Nº</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Área (m²)</TableHead>
                  <TableHead className="text-right">Valor atual</TableHead>
                  <TableHead className="text-right">Novo valor (R$)</TableHead>
                  <TableHead className="text-right">R$/m² (novo)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidadesFiltradas.map((u) => {
                  const t = tipologias?.find((x) => x.id === u.tipologia_id);
                  const novoRaw = novosValores[u.id];
                  const novo = novoRaw != null ? parseNumberInput(novoRaw) : null;
                  const alterada = novo != null && novo !== u.valor;
                  const rm2 = novo != null && u.area_privativa ? novo / Number(u.area_privativa) : null;
                  return (
                    <TableRow key={u.id} className={alterada ? 'bg-primary/5' : ''}>
                      <TableCell>{u.bloco?.nome || '—'}</TableCell>
                      <TableCell className="font-medium">{u.numero}</TableCell>
                      <TableCell>{t?.nome || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{u.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{u.area_privativa ?? '—'}</TableCell>
                      <TableCell className="text-right">{formatBRL(u.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right"
                          value={novoRaw ?? ''}
                          onChange={(e) => setValorLinha(u.id, e.target.value)}
                          placeholder={u.valor ? String(u.valor) : '0,00'}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {rm2 != null ? formatBRL(rm2) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {unidadesFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma unidade encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Barra de salvar */}
      {alteracoesPendentes > 0 && (
        <div className="sticky bottom-4 z-10">
          <Card className="border-primary shadow-lg">
            <CardContent className="py-3 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs">Motivo (opcional — registrado no histórico)</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Reajuste anual" />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={descartar} disabled={updateBulk.isPending} className="gap-1">
                  <RotateCcw className="h-4 w-4" />Descartar
                </Button>
                <Button onClick={salvar} disabled={updateBulk.isPending} className="gap-1">
                  <Save className="h-4 w-4" />
                  Salvar {alteracoesPendentes} alteração(ões)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

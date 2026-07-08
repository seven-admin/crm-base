import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmpreendimentoForm } from '@/components/empreendimentos/EmpreendimentoForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Search, Loader2, Building2, ChevronDown } from 'lucide-react';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import type { EmpreendimentoFilters, EmpreendimentoTipo, EmpreendimentoStatus, EmpreendimentoWithStats } from '@/types/empreendimentos.types';
import {
  EMPREENDIMENTO_TIPO_LABELS,
  EMPREENDIMENTO_STATUS_LABELS,
  EMPREENDIMENTO_STATUS_COLORS,
} from '@/types/empreendimentos.types';
import { cn } from '@/lib/utils';

const UF_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value || 0);

function EmpreendimentoRow({ emp }: { emp: EmpreendimentoWithStats }) {
  const navigate = useNavigate();
  const goto = () => navigate(`/empreendimentos/${emp.id}`);

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={goto}
    >
      <TableCell className="w-14">
        {emp.capa_url ? (
          <img
            src={emp.capa_url}
            alt={emp.nome}
            className="h-10 w-10 rounded-md object-cover border border-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium text-foreground">{emp.nome}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-normal">
          {EMPREENDIMENTO_TIPO_LABELS[emp.tipo]}
        </Badge>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
            EMPREENDIMENTO_STATUS_COLORS[emp.status]
          )}
        >
          {EMPREENDIMENTO_STATUS_LABELS[emp.status]}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {emp.endereco_cidade ? `${emp.endereco_cidade}${emp.endereco_uf ? `/${emp.endereco_uf}` : ''}` : '—'}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {emp.unidades_disponiveis > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
              {emp.unidades_disponiveis} disp
            </span>
          )}
          {emp.unidades_reservadas > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
              {emp.unidades_reservadas} res
            </span>
          )}
          {emp.unidades_negociacao > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
              {emp.unidades_negociacao} neg
            </span>
          )}
          {emp.unidades_vendidas > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600">
              {emp.unidades_vendidas} vend
            </span>
          )}
          {emp.unidades_bloqueadas > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500">
              {emp.unidades_bloqueadas} bloq
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm">{formatCurrency(emp.valor_total)}</TableCell>
      <TableCell className="text-right tabular-nums text-sm">{formatCurrency(emp.valor_vendido)}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            goto();
          }}
        >
          Abrir
        </Button>
      </TableCell>
    </TableRow>
  );
}

const Empreendimentos = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<EmpreendimentoFilters>({});
  const [searchInput, setSearchInput] = useState('');

  const { data: empreendimentos, isLoading } = useEmpreendimentos(filters);

  const groupedByUF = useMemo(() => {
    if (!empreendimentos) return {} as Record<string, EmpreendimentoWithStats[]>;
    const groups: Record<string, EmpreendimentoWithStats[]> = {};
    for (const emp of empreendimentos) {
      const uf = emp.endereco_uf || '__sem_uf';
      (groups[uf] ??= []).push(emp);
    }
    const sorted: Record<string, EmpreendimentoWithStats[]> = {};
    const keys = Object.keys(groups).sort((a, b) => {
      if (a === '__sem_uf') return 1;
      if (b === '__sem_uf') return -1;
      return (UF_NAMES[a] || a).localeCompare(UF_NAMES[b] || b);
    });
    for (const k of keys) sorted[k] = groups[k];
    return sorted;
  }, [empreendimentos]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <MainLayout
      title="Empreendimentos"
      subtitle="Gerencie seus empreendimentos imobiliários"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empreendimento..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSearch}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.tipo || 'all'}
            onValueChange={(value) => setFilters(prev => ({
              ...prev,
              tipo: value === 'all' ? undefined : value as EmpreendimentoTipo
            }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(EMPREENDIMENTO_TIPO_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters(prev => ({
              ...prev,
              status: value === 'all' ? undefined : value as EmpreendimentoStatus
            }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(EMPREENDIMENTO_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Empreendimento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : empreendimentos && empreendimentos.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedByUF).map(([uf, items]) => (
            <Collapsible key={uf} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group py-2">
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {uf === '__sem_uf' ? 'Sem estado definido' : `${UF_NAMES[uf] || uf} (${uf})`}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? 'empreendimento' : 'empreendimentos'}
                </span>
                <div className="flex-1 border-t border-border ml-2" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="rounded-lg border border-border bg-card overflow-hidden mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cidade/UF</TableHead>
                        <TableHead>Unidades</TableHead>
                        <TableHead className="text-right">VGV</TableHead>
                        <TableHead className="text-right">Vendido</TableHead>
                        <TableHead className="text-right w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((emp) => (
                        <EmpreendimentoRow key={emp.id} emp={emp} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            Nenhum empreendimento encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.tipo || filters.status
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro empreendimento'}
          </p>
          {!filters.search && !filters.tipo && !filters.status && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Empreendimento
            </Button>
          )}
        </div>
      )}

      <EmpreendimentoForm open={formOpen} onOpenChange={setFormOpen} />
    </MainLayout>
  );
};

export default Empreendimentos;

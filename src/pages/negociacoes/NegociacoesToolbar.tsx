import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useCorretores } from '@/hooks/useCorretores';
import { useGestoresProduto } from '@/hooks/useGestores';
import { useEtapasPadraoAtivas } from '@/hooks/useFunis';
import { STATUS_PROPOSTA_LABELS, StatusProposta } from '@/types/negociacoes.types';
import type { ClienteTemperatura } from '@/types/clientes.types';

const TEMPERATURA_OPTIONS: { value: ClienteTemperatura; label: string }[] = [
  { value: 'frio', label: '❄️ Frio' },
  { value: 'morno', label: '🌤️ Morno' },
  { value: 'quente', label: '🔥 Quente' },
];

export interface NegociacoesFilters {
  search?: string;
  empreendimento_id?: string;
  corretor_id?: string;
  gestor_id?: string;
  status_proposta?: string;
  funil_etapa_id?: string;
  temperatura?: ClienteTemperatura;
}

interface NegociacoesToolbarProps {
  filters: NegociacoesFilters;
  onFiltersChange: (filters: NegociacoesFilters) => void;
}

export function NegociacoesToolbar({ filters, onFiltersChange }: NegociacoesToolbarProps) {
  const { data: empreendimentos = [] } = useEmpreendimentos();
  const { corretores = [] } = useCorretores();
  const { data: gestores = [] } = useGestoresProduto();
  const { data: etapas = [] } = useEtapasPadraoAtivas();

  const updateFilter = (key: keyof NegociacoesFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.empreendimento_id || 'all'}
          onValueChange={(v) => updateFilter('empreendimento_id', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Empreendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Empreend.</SelectItem>
            {empreendimentos.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.corretor_id || 'all'}
          onValueChange={(v) => updateFilter('corretor_id', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Corretor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Corretores</SelectItem>
            {corretores.map((cor) => (
              <SelectItem key={cor.id} value={cor.id}>{cor.nome_completo}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.gestor_id || 'all'}
          onValueChange={(v) => updateFilter('gestor_id', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Gestor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Gestores</SelectItem>
            {gestores.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status_proposta || 'all'}
          onValueChange={(v) => updateFilter('status_proposta', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status Proposta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {(Object.entries(STATUS_PROPOSTA_LABELS) as [StatusProposta, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.funil_etapa_id || 'all'}
          onValueChange={(v) => updateFilter('funil_etapa_id', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Etapas</SelectItem>
            {etapas.map((etapa) => (
              <SelectItem key={etapa.id} value={etapa.id}>{etapa.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.temperatura || 'all'}
          onValueChange={(v) => updateFilter('temperatura', v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Temperaturas</SelectItem>
            {TEMPERATURA_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmpreendimentoCard } from '@/components/empreendimentos/EmpreendimentoCard';
import { EmpreendimentoForm } from '@/components/empreendimentos/EmpreendimentoForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import type { EmpreendimentoFilters, EmpreendimentoTipo, EmpreendimentoStatus } from '@/types/empreendimentos.types';
import { EMPREENDIMENTO_TIPO_LABELS, EMPREENDIMENTO_STATUS_LABELS } from '@/types/empreendimentos.types';

const Empreendimentos = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [filters, setFilters] = useState<EmpreendimentoFilters>({});
  const [searchInput, setSearchInput] = useState('');

  const { data: empreendimentos, isLoading } = useEmpreendimentos(filters);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {empreendimentos.map((empreendimento) => (
            <EmpreendimentoCard
              key={empreendimento.id}
              empreendimento={empreendimento}
            />
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

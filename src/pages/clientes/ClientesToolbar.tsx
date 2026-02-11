import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Edit, Plus, Search } from 'lucide-react';

type GestorOption = {
  id: string;
  full_name: string;
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onNew: () => void;
  selectedCount: number;
  onOpenAcaoEmLote: () => void;
  gestorId: string;
  onGestorChange: (value: string) => void;
  gestores: GestorOption[];
};

export function ClientesToolbar({ 
  search, 
  onSearchChange, 
  onNew,
  selectedCount,
  onOpenAcaoEmLote,
  gestorId,
  onGestorChange,
  gestores,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={gestorId} onValueChange={onGestorChange}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue placeholder="Gestor de Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os gestores</SelectItem>
            {gestores.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        {selectedCount > 0 && (
          <Button 
            variant="outline" 
            onClick={onOpenAcaoEmLote}
            className="border-primary/30 text-primary"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar {selectedCount} selecionado(s)
          </Button>
        )}
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
    </div>
  );
}

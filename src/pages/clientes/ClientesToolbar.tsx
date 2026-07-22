import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Loader2, Plus, Search, Trash2 } from 'lucide-react';

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
  onDeleteSelecionados?: () => void;
  isDeletingLote?: boolean;
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
  onDeleteSelecionados,
  isDeletingLote,
  gestorId,
  onGestorChange,
  gestores,
}: Props) {
  return (
    <div className="page-toolbar mb-6">
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <div className="relative min-w-52 flex-1 sm:w-72 sm:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={gestorId} onValueChange={onGestorChange}>
          <SelectTrigger className="w-full sm:w-52">
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
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
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
        {selectedCount > 0 && onDeleteSelecionados && (
          <Button
            variant="destructive"
            onClick={onDeleteSelecionados}
            disabled={isDeletingLote}
          >
            {isDeletingLote ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Excluir {selectedCount}
          </Button>
        )}
        <Button onClick={onNew} className="ml-auto sm:ml-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Users } from 'lucide-react';
import { usePlanejamentoItemResponsaveis, PlanejamentoItemResponsavel } from '@/hooks/usePlanejamentoItemResponsaveis';
import { cn } from '@/lib/utils';

interface Props {
  itemId: string;
  funcionarios: { id: string; full_name: string }[];
  readOnly?: boolean;
  compact?: boolean;
}

export function ResponsaveisEditor({ itemId, funcionarios, readOnly = false, compact = false }: Props) {
  const { responsaveis, isLoading, addResponsavel, removeResponsavel } = usePlanejamentoItemResponsaveis(itemId);
  const [open, setOpen] = useState(false);

  const responsaveisIds = new Set(responsaveis?.map(r => r.user_id) || []);
  const availableFuncionarios = funcionarios.filter(f => !responsaveisIds.has(f.id));

  const handleAdd = (userId: string) => {
    addResponsavel.mutate({ itemId, userId });
  };

  const handleRemove = (id: string) => {
    removeResponsavel.mutate({ id, itemId });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (readOnly) {
    return (
      <div className="flex items-center gap-1">
        {responsaveis?.length === 0 && <span className="text-muted-foreground text-sm">-</span>}
        {responsaveis?.map(r => (
          <Badge key={r.id} variant="secondary" className="text-xs">
            {r.user?.full_name?.split(' ')[0] || 'N/A'}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 justify-start gap-1 font-normal",
            !responsaveis?.length && "text-muted-foreground"
          )}
        >
          {responsaveis?.length === 0 ? (
            <>
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">Atribuir</span>
            </>
          ) : (
            <div className="flex items-center -space-x-1">
              {responsaveis?.slice(0, 3).map(r => (
                <Avatar key={r.id} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-primary/10">
                    {getInitials(r.user?.full_name || 'N')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {(responsaveis?.length || 0) > 3 && (
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-muted">
                    +{(responsaveis?.length || 0) - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Responsáveis</div>
          
          {/* Lista de responsáveis atuais */}
          {responsaveis && responsaveis.length > 0 ? (
            <div className="space-y-1.5">
              {responsaveis.map(r => (
                <div 
                  key={r.id} 
                  className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(r.user?.full_name || 'N')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[140px]">
                      {r.user?.full_name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(r.id)}
                    disabled={removeResponsavel.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum responsável atribuído
            </p>
          )}

          {/* Adicionar novo */}
          {availableFuncionarios.length > 0 && (
            <Select onValueChange={handleAdd} disabled={addResponsavel.isPending}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Adicionar responsável..." />
              </SelectTrigger>
              <SelectContent>
                {availableFuncionarios.map(func => (
                  <SelectItem key={func.id} value={func.id}>
                    {func.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

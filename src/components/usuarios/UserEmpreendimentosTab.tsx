import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Building2, MapPin, RotateCcw, Info } from 'lucide-react';
import { 
  useEmpreendimentosWithLinks, 
  useToggleUserEmpreendimento,
  useClearUserEmpreendimentos
} from '@/hooks/useUserEmpreendimentos';

interface UserEmpreendimentosTabProps {
  userId: string;
  userScope?: 'global' | 'empreendimento' | 'proprio';
}

export function UserEmpreendimentosTab({ userId, userScope }: UserEmpreendimentosTabProps) {
  const [search, setSearch] = useState('');
  const { data: empreendimentos, isLoading } = useEmpreendimentosWithLinks(userId);
  const toggleLink = useToggleUserEmpreendimento();
  const clearLinks = useClearUserEmpreendimentos();

  const linkedCount = empreendimentos?.filter(e => e.is_linked).length || 0;

  const filteredEmpreendimentos = empreendimentos?.filter(emp =>
    emp.nome.toLowerCase().includes(search.toLowerCase()) ||
    emp.cidade?.toLowerCase().includes(search.toLowerCase()) ||
    emp.uf?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleToggle = (empreendimentoId: string, currentlyLinked: boolean) => {
    toggleLink.mutate({ userId, empreendimentoId, link: !currentlyLinked });
  };

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja remover todos os vínculos? O usuário perderá acesso a todos os empreendimentos.')) {
      clearLinks.mutate(userId);
    }
  };

  const isPending = toggleLink.isPending || clearLinks.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {userScope === 'global' ? (
            <span>Este usuário tem <strong>acesso global</strong>. Os vínculos abaixo não afetam o acesso.</span>
          ) : userScope === 'proprio' ? (
            <span>Este usuário só vê <strong>registros próprios</strong>. Vínculos são opcionais.</span>
          ) : (
            <span>Configure quais empreendimentos o usuário pode acessar. Usuários com escopo "Por Empreendimento" só verão dados dos empreendimentos vinculados.</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Header with search and actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empreendimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {linkedCount} vinculado{linkedCount !== 1 ? 's' : ''}
          </Badge>
          
          {linkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Empreendimentos List */}
      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-2">
          {filteredEmpreendimentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum empreendimento encontrado</p>
            </div>
          ) : (
            filteredEmpreendimentos.map((emp) => (
              <div 
                key={emp.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                  emp.is_linked ? 'border-primary/50 bg-primary/5' : 'border-border'
                }`}
                onClick={() => !isPending && handleToggle(emp.id, emp.is_linked)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={emp.is_linked}
                    disabled={isPending}
                    onCheckedChange={() => handleToggle(emp.id, emp.is_linked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{emp.nome}</p>
                      <span className={`text-xs ${emp.unidades_count === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                        ({emp.unidades_count} unidade{emp.unidades_count !== 1 ? 's' : ''})
                        {emp.unidades_count === 0 && ' ⚠️'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {emp.cidade && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {emp.cidade}{emp.uf ? `/${emp.uf}` : ''}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {emp.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {emp.is_linked && (
                  <Badge variant="default" className="text-xs">
                    Vinculado
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Home, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useEmpreendimentosSelect } from '@/hooks/useEmpreendimentosSelect';
import { useUnidades } from '@/hooks/useUnidades';
import { cn } from '@/lib/utils';
import { groupUnidadesByBloco } from '@/lib/mapaUtils';

interface UnidadeSelecionada {
  id: string;
  codigo: string;
  bloco?: string;
  valor: number;
}

interface UnidadeSelectorCardProps {
  empreendimentoId: string | null;
  empreendimentoNome: string;
  unidades: UnidadeSelecionada[];
  onEmpreendimentoChange: (id: string | null, nome: string | null) => void;
  onUnidadesChange: (unidades: UnidadeSelecionada[]) => void;
}

export function UnidadeSelectorCard({
  empreendimentoId,
  empreendimentoNome,
  unidades,
  onEmpreendimentoChange,
  onUnidadesChange,
}: UnidadeSelectorCardProps) {
  const [expanded, setExpanded] = useState(true);
  
  const { data: empreendimentos = [], isLoading: loadingEmpreendimentos } = useEmpreendimentosSelect();
  const { data: unidadesDisponiveis = [], isLoading: loadingUnidades } = useUnidades(
    empreendimentoId || undefined
  );
  
  const unidadesFiltradas = useMemo(() => 
    unidadesDisponiveis.filter(u => u.status === 'disponivel'),
    [unidadesDisponiveis]
  );
  
  // Group units by block with natural sorting
  const unidadesAgrupadas = useMemo(() => 
    groupUnidadesByBloco(unidadesFiltradas),
    [unidadesFiltradas]
  );
  
  const valorTotal = useMemo(() => 
    unidades.reduce((acc, u) => acc + (u.valor || 0), 0),
    [unidades]
  );
  
  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const handleSelectUnidade = (unidade: typeof unidadesDisponiveis[0]) => {
    const alreadySelected = unidades.some(u => u.id === unidade.id);
    
    if (alreadySelected) {
      onUnidadesChange(unidades.filter(u => u.id !== unidade.id));
    } else {
      onUnidadesChange([
        ...unidades,
        {
          id: unidade.id,
          codigo: unidade.numero || '',
          bloco: unidade.bloco?.nome,
          valor: unidade.valor || 0,
        }
      ]);
    }
  };
  
  const handleRemoveUnidade = (id: string) => {
    onUnidadesChange(unidades.filter(u => u.id !== id));
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Imóvel
          </div>
          {unidades.length > 0 && (
            <Badge variant="secondary" className="font-mono">
              {formatCurrency(valorTotal)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Empreendimento Selector */}
        <Select
          value={empreendimentoId || ''}
          onValueChange={(value) => {
            const emp = empreendimentos.find(e => e.id === value);
            onEmpreendimentoChange(value, emp?.nome || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o empreendimento" />
          </SelectTrigger>
          <SelectContent>
            {loadingEmpreendimentos ? (
              <div className="p-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              empreendimentos.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.nome}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        
        {/* Selected Units */}
        {unidades.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unidades Selecionadas ({unidades.length})</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {expanded && (
              <div className="space-y-1">
                {unidades.map(unidade => (
                  <div 
                    key={unidade.id}
                    className="flex items-center justify-between p-2 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="font-medium">{unidade.codigo}</span>
                      {unidade.bloco && (
                        <Badge variant="outline" className="text-xs">
                          {unidade.bloco}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatCurrency(unidade.valor)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleRemoveUnidade(unidade.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Available Units Grid - Grouped by Block */}
        {empreendimentoId && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Unidades Disponíveis
            </span>
            
            {loadingUnidades ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando unidades...</p>
              </div>
            ) : unidadesFiltradas.length === 0 ? (
              <div className="p-8 text-center border rounded-lg bg-muted/20">
                <Home className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma unidade disponível
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Array.from(unidadesAgrupadas.entries()).map(([blocoNome, unidadesDoBloco]) => (
                  <Collapsible key={blocoNome} defaultOpen className="border rounded-lg">
                    <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                      <span className="font-medium text-sm">{blocoNome}</span>
                      <Badge variant="outline" className="text-xs">
                        {unidadesDoBloco.length} {unidadesDoBloco.length === 1 ? 'unidade' : 'unidades'}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-3 pt-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {unidadesDoBloco.map(unidade => {
                          const isSelected = unidades.some(u => u.id === unidade.id);
                          const codigo = unidade.numero || 'S/N';
                          const valor = unidade.valor || 0;
                          
                          return (
                            <button
                              key={unidade.id}
                              type="button"
                              onClick={() => handleSelectUnidade(unidade)}
                              className={cn(
                                "p-2 rounded-lg border text-left transition-all",
                                "hover:border-primary/50 hover:bg-primary/5",
                                isSelected && "border-primary bg-primary/10 ring-1 ring-primary"
                              )}
                            >
                              <div className="font-medium text-sm">{codigo}</div>
                              {unidade.andar != null && (
                                <div className="text-xs text-muted-foreground">{unidade.andar}º andar</div>
                              )}
                              <div className="text-xs font-mono mt-1">
                                {formatCurrency(valor)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

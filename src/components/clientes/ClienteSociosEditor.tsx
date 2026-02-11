import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useClientesSelect } from '@/hooks/useClientesSelect';
import { useClienteSocios, useAddClienteSocio, useRemoveClienteSocio } from '@/hooks/useClienteSocios';
import { Plus, X, Loader2, Check, ChevronsUpDown, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClienteSociosEditorProps {
  clienteId: string;
}

export function ClienteSociosEditor({ clienteId }: ClienteSociosEditorProps) {
  const [open, setOpen] = useState(false);
  const [selectedSocioId, setSelectedSocioId] = useState<string>('');
  const [percentual, setPercentual] = useState<string>('');

  const { data: socios, isLoading } = useClienteSocios(clienteId);
  // Lazy loading: só busca clientes quando o dropdown abre
  const { data: clientes = [], isLoading: isLoadingClientes } = useClientesSelect(clienteId, open);
  const addSocio = useAddClienteSocio();
  const removeSocio = useRemoveClienteSocio();

  // Filtrar clientes disponíveis (excluir os já adicionados como sócios)
  const socioIds = socios?.map(s => s.socio_id) || [];
  const clientesDisponiveis = clientes.filter(c => !socioIds.includes(c.id));

  const handleAddSocio = async () => {
    if (!selectedSocioId) return;

    await addSocio.mutateAsync({
      cliente_id: clienteId,
      socio_id: selectedSocioId,
      percentual_participacao: percentual ? parseFloat(percentual) : undefined,
    });

    setSelectedSocioId('');
    setPercentual('');
    setOpen(false);
  };

  const handleRemoveSocio = async (id: string) => {
    await removeSocio.mutateAsync({ id, clienteId });
  };

  const selectedCliente = clientesDisponiveis.find(c => c.id === selectedSocioId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando sócios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de sócios */}
      {socios && socios.length > 0 ? (
        <div className="space-y-2">
          {socios.map((socio) => (
            <div 
              key={socio.id} 
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {socio.socio?.nome?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{socio.socio?.nome || 'Sócio'}</p>
                  {socio.socio?.cpf && (
                    <p className="text-xs text-muted-foreground">{socio.socio.cpf}</p>
                  )}
                </div>
                {socio.percentual_participacao && (
                  <Badge variant="secondary" className="ml-2">
                    <Percent className="h-3 w-3 mr-1" />
                    {socio.percentual_participacao}%
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveSocio(socio.id)}
                disabled={removeSocio.isPending}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Nenhum sócio cadastrado.
        </p>
      )}

      {/* Adicionar novo sócio */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedCliente 
                ? selectedCliente.nome 
                : "Selecionar cliente como sócio..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar cliente..." />
              <CommandList>
                {isLoadingClientes ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clientesDisponiveis.map((cliente) => (
                        <CommandItem
                          key={cliente.id}
                          value={cliente.nome}
                          onSelect={() => {
                            setSelectedSocioId(cliente.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSocioId === cliente.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{cliente.nome}</span>
                            {cliente.cpf && (
                              <span className="text-xs text-muted-foreground">{cliente.cpf}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex gap-2">
          <div className="w-24">
            <Input
              type="number"
              placeholder="%"
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              min={0}
              max={100}
              step={0.01}
            />
          </div>
          <Button
            type="button"
            onClick={handleAddSocio}
            disabled={!selectedSocioId || addSocio.isPending}
            size="icon"
          >
            {addSocio.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        O campo de percentual é opcional e representa a participação societária.
      </p>
    </div>
  );
}

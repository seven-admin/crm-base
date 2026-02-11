import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';
import { Check, ChevronsUpDown, X, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClienteConjugeSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  excludeId?: string; // ID do cliente atual para excluir da lista
  disabled?: boolean;
}

export function ClienteConjugeSelect({ 
  value, 
  onChange, 
  excludeId,
  disabled 
}: ClienteConjugeSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedClienteNome, setSelectedClienteNome] = useState<string | null>(null);
  
  // Query só executa quando o dropdown abre (lazy loading)
  const { data: clientes = [], isLoading } = useClientesSelect(excludeId, open);

  // Buscar nome do cliente selecionado individualmente (quando dropdown fechado)
  useEffect(() => {
    if (value && !open) {
      supabase
        .from('clientes')
        .select('nome')
        .eq('id', value)
        .maybeSingle()
        .then(({ data }) => {
          setSelectedClienteNome(data?.nome || null);
        });
    } else if (!value) {
      setSelectedClienteNome(null);
    }
  }, [value, open]);

  // Quando o dropdown abre e carrega, atualizar o nome da lista
  useEffect(() => {
    if (open && clientes.length > 0 && value) {
      const found = clientes.find(c => c.id === value);
      if (found) setSelectedClienteNome(found.nome);
    }
  }, [open, clientes, value]);

  const handleSelect = (clienteId: string) => {
    if (clienteId === value) {
      onChange(undefined);
      setSelectedClienteNome(null);
    } else {
      const cliente = clientes.find(c => c.id === clienteId);
      onChange(clienteId);
      setSelectedClienteNome(cliente?.nome || null);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSelectedClienteNome(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            {value && selectedClienteNome ? (
              <>
                <Heart className="h-4 w-4 text-pink-500 shrink-0" />
                <span className="truncate">{selectedClienteNome}</span>
              </>
            ) : (
              <span className="text-muted-foreground">
                Selecionar cônjuge...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <div
                role="button"
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup>
                  {clientes.map((cliente) => (
                    <CommandItem
                      key={cliente.id}
                      value={cliente.nome}
                      onSelect={() => handleSelect(cliente.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === cliente.id ? "opacity-100" : "opacity-0"
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
  );
}

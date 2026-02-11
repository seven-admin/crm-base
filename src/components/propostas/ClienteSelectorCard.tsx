import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, X, Plus, Loader2 } from 'lucide-react';
import { useClientes, useCreateCliente } from '@/hooks/useClientes';
import { cn } from '@/lib/utils';

interface ClienteSelectorCardProps {
  clienteId: string | null;
  clienteNome: string;
  onClienteChange: (id: string | null, nome: string | null) => void;
}

export function ClienteSelectorCard({
  clienteId,
  clienteNome,
  onClienteChange,
}: ClienteSelectorCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  
  const { data: clientes = [], isLoading } = useClientes({ 
    search: searchTerm.length >= 2 ? searchTerm : undefined 
  });
  const createCliente = useCreateCliente();
  
  const filteredClientes = clientes.slice(0, 8);
  
  const handleSelect = (cliente: { id: string; nome: string }) => {
    onClienteChange(cliente.id, cliente.nome);
    setSearchTerm('');
    setShowResults(false);
  };
  
  const handleClear = () => {
    onClienteChange(null, null);
    setSearchTerm('');
  };
  
  const handleCreateCliente = async () => {
    if (!novoNome.trim()) return;
    
    try {
      const result = await createCliente.mutateAsync({
        nome: novoNome,
        telefone: novoTelefone || undefined,
      });
      onClienteChange(result.id, result.nome);
      setIsCreating(false);
      setNovoNome('');
      setNovoTelefone('');
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
    }
  };
  
  if (clienteId) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{clienteNome}</p>
                <Badge variant="secondary" className="text-xs">Selecionado</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Cliente
          </div>
          {!isCreating && (
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCreating ? (
          <div className="space-y-3">
            <Input
              placeholder="Nome do cliente"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="Telefone (opcional)"
              value={novoTelefone}
              onChange={(e) => setNovoTelefone(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleCreateCliente}
                disabled={!novoNome.trim() || createCliente.isPending}
              >
                {createCliente.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Cliente
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(e.target.value.length >= 2);
                }}
                onFocus={() => setShowResults(searchTerm.length >= 2)}
                className="pl-9"
              />
            </div>
            
            {showResults && (
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Buscando...
                  </div>
                ) : filteredClientes.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  filteredClientes.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      className={cn(
                        "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                        "flex items-center gap-3"
                      )}
                      onClick={() => handleSelect(cliente)}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{cliente.nome}</p>
                        {cliente.telefone && (
                          <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

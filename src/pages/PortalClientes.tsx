import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useClientes, useCreateCliente, useUpdateCliente } from '@/hooks/useClientes';
import { useAuth } from '@/contexts/AuthContext';
import { ClienteForm } from '@/components/clientes/ClienteForm';
import { formatarTelefone } from '@/lib/documentUtils';
import { Plus, Search, User, Phone, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useMeuCorretor } from '@/hooks/useMeuCorretor';
import { useUserImobiliaria } from '@/hooks/useUserImobiliaria';
import { toast } from 'sonner';


export default function PortalClientes() {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  
  const isGestor = role === 'gestor_imobiliaria';
  
  // Corretor: buscar pelo hook de corretor
  const { data: meuCorretor, isLoading: isLoadingCorretor } = useMeuCorretor();
  // Gestor: buscar imobiliária vinculada
  const { imobiliariaId, isLoading: isLoadingImob } = useUserImobiliaria();
  
  const { data: clientes = [], isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  // Filtrar clientes por busca
  const filteredClientes = clientes.filter((cliente) => {
    const searchLower = search.toLowerCase();
    return (
      cliente.nome?.toLowerCase().includes(searchLower) ||
      cliente.telefone?.includes(search) ||
      cliente.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (data: any) => {
    if (isGestor) {
      if (!imobiliariaId) {
        toast.error('Sua imobiliária não foi encontrada. Contate o administrador.');
        return;
      }
      const payload = {
        ...data,
        imobiliaria_id: data.imobiliaria_id || imobiliariaId,
      };
      try {
        if (editingCliente) {
          await updateCliente.mutateAsync({ id: editingCliente.id, ...payload });
        } else {
          await createCliente.mutateAsync(payload);
        }
        setFormOpen(false);
        setEditingCliente(null);
      } catch (error: any) {
        console.error('Erro ao salvar cliente:', error);
        toast.error(error.message || 'Erro ao salvar cliente');
      }
    } else {
      // Corretor
      if (!meuCorretor?.id) {
        toast.error('Seu usuário não está vinculado a um corretor no sistema. Contate o administrador.');
        return;
      }
      const payload = {
        ...data,
        corretor_id: meuCorretor.id,
        imobiliaria_id: data.imobiliaria_id || meuCorretor.imobiliaria_id,
      };
      try {
        if (editingCliente) {
          await updateCliente.mutateAsync({ id: editingCliente.id, ...payload });
        } else {
          await createCliente.mutateAsync(payload);
        }
        setFormOpen(false);
        setEditingCliente(null);
      } catch (error: any) {
        console.error('Erro ao salvar cliente:', error);
        toast.error(error.message || 'Erro ao salvar cliente');
      }
    }
  };

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCliente(null);
  };

  const loadingState = isLoading || (isGestor ? isLoadingImob : isLoadingCorretor);

  if (loadingState) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Verificar vínculo apenas para corretores (gestores usam imobiliariaId)
  if (!isGestor && !meuCorretor) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Corretor não vinculado</h3>
          <p className="text-muted-foreground">
            Seu usuário não está vinculado a um corretor no sistema.<br />
            Entre em contato com o administrador para realizar a vinculação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Lista de Clientes */}
      {filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            {search ? (
              <p>Nenhum cliente encontrado para "{search}"</p>
            ) : (
              <>
                <p>Você ainda não possui nenhum cliente cadastrado.</p>
                <p className="text-sm mt-2">Clique em "Novo Cliente" para adicionar seu primeiro cliente.</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClientes.map((cliente) => (
            <Card 
              key={cliente.id} 
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => handleEdit(cliente)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{cliente.nome}</h3>
                    </div>
                    
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{formatarTelefone(cliente.telefone)}</span>
                      </div>
                    )}
                    
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}

                    {cliente.interesse && cliente.interesse.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cliente.interesse.slice(0, 2).map((item: string) => (
                          <Badge key={item} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {cliente.interesse.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{cliente.interesse.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={formOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingCliente ? 'Atualize os dados do cliente.' : 'Preencha os dados do novo cliente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <ClienteForm
              initialData={editingCliente || undefined}
              onSubmit={handleSubmit}
              isLoading={createCliente.isPending || updateCliente.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from 'react';
import { Plus, Trash2, Phone, MessageCircle, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useClienteTelefones,
  useCreateClienteTelefone,
  useUpdateClienteTelefone,
  useDeleteClienteTelefone,
  type ClienteTelefone,
} from '@/hooks/useClienteTelefones';
import { formatarTelefone } from '@/lib/documentUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClienteTelefonesEditorProps {
  clienteId: string;
  readonly?: boolean;
}

export function ClienteTelefonesEditor({ clienteId, readonly = false }: ClienteTelefonesEditorProps) {
  const { data: telefones = [], isLoading } = useClienteTelefones(clienteId);
  const createTelefone = useCreateClienteTelefone();
  const updateTelefone = useUpdateClienteTelefone();
  const deleteTelefone = useDeleteClienteTelefone();

  const [novoNumero, setNovoNumero] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoIsWhatsapp, setNovoIsWhatsapp] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [telefoneToDelete, setTelefoneToDelete] = useState<string | null>(null);

  const handleAddTelefone = () => {
    if (!novoNumero.trim()) {
      toast.error('Digite um número de telefone');
      return;
    }

    const isPrimeiro = telefones.length === 0;

    createTelefone.mutate({
      clienteId,
      data: {
        numero: novoNumero,
        descricao: novaDescricao || undefined,
        is_whatsapp: novoIsWhatsapp,
        principal: isPrimeiro,
      },
    }, {
      onSuccess: () => {
        setNovoNumero('');
        setNovaDescricao('');
        setNovoIsWhatsapp(false);
        toast.success('Telefone adicionado');
      },
    });
  };

  const handleToggleWhatsapp = (telefone: ClienteTelefone) => {
    updateTelefone.mutate({
      id: telefone.id,
      clienteId,
      data: { is_whatsapp: !telefone.is_whatsapp },
    });
  };

  const handleSetPrincipal = (telefone: ClienteTelefone) => {
    updateTelefone.mutate({
      id: telefone.id,
      clienteId,
      data: { principal: true },
    }, {
      onSuccess: () => toast.success('Telefone principal alterado'),
    });
  };

  const handleDelete = (id: string) => {
    setTelefoneToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (telefoneToDelete) {
      deleteTelefone.mutate({ id: telefoneToDelete, clienteId }, {
        onSuccess: () => toast.success('Telefone removido'),
      });
      setTelefoneToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando telefones...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Lista de telefones */}
      {telefones.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-center w-[100px]">WhatsApp</TableHead>
              <TableHead className="text-center w-[100px]">Principal</TableHead>
              {!readonly && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {telefones.map((telefone) => (
              <TableRow key={telefone.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {telefone.numero}
                    {telefone.is_whatsapp && (
                      <MessageCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {telefone.descricao || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {readonly ? (
                    telefone.is_whatsapp ? (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Sim
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleWhatsapp(telefone)}
                      className={cn(
                        telefone.is_whatsapp && 'text-green-600 hover:text-green-700'
                      )}
                    >
                      <MessageCircle className={cn(
                        "h-4 w-4",
                        telefone.is_whatsapp ? 'fill-green-500' : ''
                      )} />
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {readonly ? (
                    telefone.principal ? (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                        Principal
                      </Badge>
                    ) : null
                  ) : telefone.principal ? (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                      Principal
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrincipal(telefone)}
                      title="Definir como principal"
                    >
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </TableCell>
                {!readonly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(telefone.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {telefones.length === 0 && (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum telefone cadastrado</p>
        </div>
      )}

      {/* Formulário para adicionar novo telefone */}
      {!readonly && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <Label className="text-sm font-medium">Adicionar Telefone</Label>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="(00) 00000-0000"
                value={novoNumero}
                onChange={(e) => setNovoNumero(formatarTelefone(e.target.value))}
                maxLength={15}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="whatsapp"
                  checked={novoIsWhatsapp}
                  onCheckedChange={setNovoIsWhatsapp}
                />
                <Label htmlFor="whatsapp" className="text-sm flex items-center gap-1 cursor-pointer">
                  <MessageCircle className={cn(
                    "h-4 w-4",
                    novoIsWhatsapp ? 'text-green-500' : 'text-muted-foreground'
                  )} />
                  WhatsApp
                </Label>
              </div>
              <Button
                onClick={handleAddTelefone}
                disabled={createTelefone.isPending}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover telefone?</AlertDialogTitle>
            <AlertDialogDescription>
              Este telefone será removido do cadastro do cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

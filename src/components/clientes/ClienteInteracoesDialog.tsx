import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Mail, MessageSquare, MapPin, Users, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useClienteInteracoes } from '@/hooks/useClienteInteracoes';
import { Cliente, INTERACAO_TIPOS } from '@/types/clientes.types';

interface ClienteInteracoesDialogProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTERACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Ligação': Phone,
  'Email': Mail,
  'WhatsApp': MessageSquare,
  'Visita': MapPin,
  'Reunião': Users,
  'Outro': FileText,
};

export function ClienteInteracoesDialog({ 
  cliente, 
  open, 
  onOpenChange 
}: ClienteInteracoesDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  
  const { interacoes, isLoading, create, isCreating } = useClienteInteracoes(cliente?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !tipo) return;
    
    create({
      cliente_id: cliente.id,
      tipo,
      descricao: descricao || undefined
    }, {
      onSuccess: () => {
        setTipo('');
        setDescricao('');
        setShowForm(false);
      }
    });
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Interações - {cliente.nome}</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {cliente.email && <p>{cliente.email}</p>}
              {cliente.telefone && <p>{cliente.telefone}</p>}
            </div>
            <Button 
              variant={showForm ? 'outline' : 'default'} 
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancelar' : '+ Nova Interação'}
            </Button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Tipo de Interação</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERACAO_TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva a interação..."
                  rows={3}
                />
              </div>
            </div>
            <Button type="submit" disabled={!tipo || isCreating} className="w-full">
              {isCreating ? 'Salvando...' : 'Registrar Interação'}
            </Button>
          </form>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : interacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma interação registrada
            </div>
          ) : (
            <div className="space-y-4">
              {interacoes.map((interacao) => {
                const IconComponent = INTERACTION_ICONS[interacao.tipo] || FileText;
                return (
                  <div 
                    key={interacao.id} 
                    className="flex gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {interacao.tipo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      {interacao.descricao && (
                        <p className="text-sm text-muted-foreground">{interacao.descricao}</p>
                      )}
                      {interacao.user?.full_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Por: {interacao.user.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

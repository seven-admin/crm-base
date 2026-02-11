import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface EventoEquipeTabProps {
  eventoId: string;
  responsavelId?: string;
}

interface Membro {
  id: string;
  evento_id: string;
  user_id: string;
  papel: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

const PAPEIS = [
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'organizador', label: 'Organizador' },
  { value: 'apoio', label: 'Apoio' },
  { value: 'membro', label: 'Membro' },
];

export function EventoEquipeTab({ eventoId, responsavelId }: EventoEquipeTabProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPapel, setSelectedPapel] = useState('membro');

  // Buscar membros do evento
  const { data: membros, isLoading } = useQuery({
    queryKey: ['evento-membros', eventoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evento_membros')
        .select(`
          *,
          user:user_id(id, full_name, avatar_url)
        `)
        .eq('evento_id', eventoId)
        .order('created_at');

      if (error) throw error;
      return data as unknown as Membro[];
    },
  });

  // Buscar todos os usuários para adicionar
  const { data: usuarios } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Adicionar membro
  const addMembro = useMutation({
    mutationFn: async ({ userId, papel }: { userId: string; papel: string }) => {
      const { error } = await supabase
        .from('evento_membros')
        .insert({
          evento_id: eventoId,
          user_id: userId,
          papel,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-membros', eventoId] });
      toast.success('Membro adicionado!');
      setShowAddDialog(false);
      setSelectedUserId('');
      setSelectedPapel('membro');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este usuário já faz parte da equipe');
      } else {
        toast.error('Erro ao adicionar membro');
      }
    },
  });

  // Remover membro
  const removeMembro = useMutation({
    mutationFn: async (membroId: string) => {
      const { error } = await supabase
        .from('evento_membros')
        .delete()
        .eq('id', membroId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-membros', eventoId] });
      toast.success('Membro removido');
    },
  });

  // Atualizar papel
  const updatePapel = useMutation({
    mutationFn: async ({ membroId, papel }: { membroId: string; papel: string }) => {
      const { error } = await supabase
        .from('evento_membros')
        .update({ papel })
        .eq('id', membroId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento-membros', eventoId] });
    },
  });

  // Usuários disponíveis (não estão na equipe)
  const usuariosDisponiveis = usuarios?.filter(
    (u) => !membros?.some((m) => m.user_id === u.id)
  );

  const handleAddMembro = () => {
    if (!selectedUserId) {
      toast.error('Selecione um usuário');
      return;
    }
    addMembro.mutate({ userId: selectedUserId, papel: selectedPapel });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Equipe do Evento</h3>
          <p className="text-sm text-muted-foreground">
            {membros?.length || 0} membros atribuídos
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {/* Lista de membros */}
      <div className="grid gap-3">
        {(!membros || membros.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum membro na equipe.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeiro membro
            </Button>
          </Card>
        )}

        {membros?.map((membro) => (
          <Card key={membro.id} className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {membro.user?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {membro.user?.full_name || 'Usuário'}
                  </p>
                  {membro.user_id === responsavelId && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {membro.user_id === responsavelId ? 'Responsável' : ''}
                </p>
              </div>

              <Select
                value={membro.papel}
                onValueChange={(value) => updatePapel.mutate({ membroId: membro.id, papel: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((papel) => (
                    <SelectItem key={papel.value} value={papel.value}>
                      {papel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm('Remover este membro da equipe?')) {
                    removeMembro.mutate(membro.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog adicionar membro */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar usuário" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosDisponiveis?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Papel na Equipe</Label>
              <Select value={selectedPapel} onValueChange={setSelectedPapel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((papel) => (
                    <SelectItem key={papel.value} value={papel.value}>
                      {papel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMembro} disabled={addMembro.isPending}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

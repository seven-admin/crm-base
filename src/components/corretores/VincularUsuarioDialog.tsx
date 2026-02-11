import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface VincularUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  corretorId: string;
  corretorNome: string;
}

export function VincularUsuarioDialog({
  open,
  onOpenChange,
  corretorId,
  corretorNome,
}: VincularUsuarioDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const queryClient = useQueryClient();

  // Buscar todos os usuários disponíveis (que não estão vinculados a nenhum corretor)
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios-disponiveis'],
    queryFn: async () => {
      // Buscar usuários que não estão vinculados a nenhum corretor
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;

      // Buscar corretores que já têm user_id
      const { data: corretores } = await supabase
        .from('corretores')
        .select('user_id')
        .not('user_id', 'is', null);

      const linkedUserIds = corretores?.map(c => c.user_id) || [];

      // Retornar apenas usuários não vinculados
      return (profiles || []).filter(p => !linkedUserIds.includes(p.id));
    },
    enabled: open,
  });

  const filteredUsuarios = useMemo(() => {
    if (!searchTerm) return usuarios;
    const term = searchTerm.toLowerCase();
    return usuarios.filter(
      u =>
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  const handleVincular = async () => {
    if (!selectedUserId) {
      toast.error('Selecione um usuário');
      return;
    }

    setIsLinking(true);
    try {
      const { error } = await supabase
        .from('corretores')
        .update({ user_id: selectedUserId })
        .eq('id', corretorId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['corretores'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-disponiveis'] });

      toast.success(`Usuário vinculado ao corretor ${corretorNome}`);
      onOpenChange(false);
      setSelectedUserId('');
      setSearchTerm('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao vincular usuário');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular Usuário Existente
          </DialogTitle>
          <DialogDescription>
            Vincule um usuário do sistema ao corretor{' '}
            <strong>{corretorNome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Buscar Usuário</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Usuário</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="__loading__" disabled>
                    Carregando...
                  </SelectItem>
                ) : filteredUsuarios.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    Nenhum usuário disponível
                  </SelectItem>
                ) : (
                  filteredUsuarios.map(usuario => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      <div className="flex flex-col">
                        <span>{usuario.full_name || 'Sem nome'}</span>
                        <span className="text-xs text-muted-foreground">
                          {usuario.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <p className="text-sm text-muted-foreground">
              O usuário selecionado poderá acessar o sistema como corretor.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleVincular}
            disabled={!selectedUserId || isLinking}
          >
            {isLinking ? 'Vinculando...' : 'Vincular Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

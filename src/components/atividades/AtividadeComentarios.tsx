import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAtividadeComentarios } from '@/hooks/useAtividadeComentarios';
import { cn } from '@/lib/utils';

interface AtividadeComentariosProps {
  atividadeId: string;
}

export function AtividadeComentarios({ atividadeId }: AtividadeComentariosProps) {
  const [novoComentario, setNovoComentario] = useState('');
  const { comentarios, isLoading, createComentario } = useAtividadeComentarios(atividadeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    
    await createComentario.mutateAsync(novoComentario);
    setNovoComentario('');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isSystemMessage = (texto: string) => {
    return texto.startsWith('[ALTERAÇÃO DE STATUS]') || texto.startsWith('[SISTEMA]');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">Interações</span>
        {comentarios.length > 0 && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {comentarios.length}
          </span>
        )}
      </div>

      {/* Formulário de novo comentário */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={novoComentario}
          onChange={(e) => setNovoComentario(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="min-h-[60px] resize-none text-sm"
          disabled={createComentario.isPending}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!novoComentario.trim() || createComentario.isPending}
          className="shrink-0"
        >
          {createComentario.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Lista de comentários */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comentarios.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma interação ainda.
        </p>
      ) : (
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-4 pr-4">
            {comentarios.map((comentario) => (
              <div 
                key={comentario.id} 
                className={cn(
                  "flex gap-3",
                  isSystemMessage(comentario.comentario) && "opacity-75"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comentario.user?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(comentario.user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {comentario.user?.full_name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comentario.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm mt-1 whitespace-pre-wrap break-words",
                    isSystemMessage(comentario.comentario) 
                      ? "text-muted-foreground italic text-xs" 
                      : "text-foreground"
                  )}>
                    {comentario.comentario}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

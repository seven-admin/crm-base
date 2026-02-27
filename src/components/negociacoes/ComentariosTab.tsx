import { useState } from 'react';
import { useNegociacaoComentarios, useAddNegociacaoComentario } from '@/hooks/useNegociacaoComentarios';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ComentariosTabProps {
  negociacaoId: string;
}

export function ComentariosTab({ negociacaoId }: ComentariosTabProps) {
  const [novoComentario, setNovoComentario] = useState('');
  const { data: comentarios, isLoading } = useNegociacaoComentarios(negociacaoId);
  const addComentario = useAddNegociacaoComentario();

  const handleEnviar = async () => {
    if (!novoComentario.trim()) return;
    await addComentario.mutateAsync({
      negociacaoId,
      comentario: novoComentario.trim(),
    });
    setNovoComentario('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleEnviar();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px]">
      {/* Input de resposta */}
      <div className="p-3 border-b space-y-2">
        <Textarea
          value={novoComentario}
          onChange={(e) => setNovoComentario(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva um comentário... (Ctrl+Enter para enviar)"
          className="min-h-[60px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleEnviar}
            disabled={!novoComentario.trim() || addComentario.isPending}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Enviar
          </Button>
        </div>
      </div>

      {/* Lista de comentários */}
      <ScrollArea className="flex-1">
        {!comentarios?.length ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhum comentário ainda</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {comentarios.map((c) => {
              const initials = c.user?.full_name
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || '?';

              return (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium truncate">
                        {c.user?.full_name || 'Usuário'}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(c.created_at), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-0.5">
                      {c.comentario}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

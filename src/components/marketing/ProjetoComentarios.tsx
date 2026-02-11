import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useComentariosProjeto } from '@/hooks/useProjetosMarketing';

interface ProjetoComentariosProps {
  projetoId: string;
}

export function ProjetoComentarios({ projetoId }: ProjetoComentariosProps) {
  const { comentarios, isLoading, createComentario } = useComentariosProjeto(projetoId);
  const [novoComentario, setNovoComentario] = useState('');

  const handleAddComentario = () => {
    if (novoComentario.trim()) {
      createComentario.mutate({ comentario: novoComentario.trim() });
      setNovoComentario('');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comentários</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="space-y-2">
          <Textarea
            placeholder="Escreva um comentário..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleAddComentario} 
              disabled={!novoComentario.trim() || createComentario.isPending}
              className="gap-2"
            >
              {createComentario.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comentarios?.map((comentario) => (
            <div key={comentario.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comentario.user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {comentario.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comentario.user?.full_name || 'Usuário'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comentario.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {comentario.comentario}
                </p>
              </div>
            </div>
          ))}

          {(!comentarios || comentarios.length === 0) && (
            <p className="text-center text-muted-foreground py-4">
              Nenhum comentário ainda
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

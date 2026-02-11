import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TIPO_ICONS: Record<string, string> = {
  nova_atividade: '📋',
  atividade_atribuida: '👤',
  info: 'ℹ️',
};

const REFERENCIA_ROUTES: Record<string, string> = {
  atividade: '/atividades',
  negociacao: '/negociacoes',
  marketing: '/marketing',
};

export function NotificacaoBell() {
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes();
  const navigate = useNavigate();

  const handleNotificacaoClick = (notificacao: typeof notificacoes[0]) => {
    if (!notificacao.lida) {
      marcarComoLida.mutate(notificacao.id);
    }
    if (notificacao.referencia_tipo && REFERENCIA_ROUTES[notificacao.referencia_tipo]) {
      navigate(REFERENCIA_ROUTES[notificacao.referencia_tipo]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] bg-destructive text-destructive-foreground border-2 border-background"
            >
              {naoLidas.length > 99 ? '99+' : naoLidas.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {naoLidas.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 gap-1"
              onClick={() => marcarTodasComoLidas.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notificacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.slice(0, 20).map((notif) => (
                <button
                  key={notif.id}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !notif.lida && "bg-primary/5"
                  )}
                  onClick={() => handleNotificacaoClick(notif)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{TIPO_ICONS[notif.tipo] || 'ℹ️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-xs truncate",
                          !notif.lida ? "font-semibold" : "font-medium text-muted-foreground"
                        )}>
                          {notif.titulo}
                        </p>
                        {!notif.lida && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.mensagem}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {notif.referencia_tipo && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground mt-1 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, QrCode, RefreshCw, Trash2, Unplug } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createArqoCallSession,
  deleteArqoCallSession,
  getArqoCallSession,
  logoutArqoCallSession,
  pairArqoCallSession,
  subscribeArqoCallEvents,
  type ArqoCallSession,
} from '@/lib/arqoCalls';

function formattedJid(jid: string | null) {
  if (!jid) return 'Número conectado';
  const number = jid.split('@')[0];
  return number.startsWith('55') ? `+${number}` : number;
}

export function ArqoCallSessionCard() {
  const [session, setSession] = useState<ArqoCallSession | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState<'create' | 'pair' | 'logout' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionExternalId = session?.external_session_id;

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSession(await getArqoCallSession());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível consultar o serviço de chamadas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadSession(); }, [loadSession]);

  useEffect(() => {
    if (!sessionExternalId) return undefined;
    return subscribeArqoCallEvents((event) => {
      if (event.type === 'session-qr' && event.sessionId === sessionExternalId && event.qr) {
        setQr(event.qr);
        setSession((current) => current ? { ...current, state: 'qr', paired: false } : current);
      }
      if (event.type === 'auth-state' && event.sessionId === sessionExternalId) {
        setSession((current) => current ? {
          ...current,
          state: event.state ?? current.state,
          paired: event.paired ?? current.paired,
        } : current);
        if (event.qr) setQr(event.qr);
        if (event.paired) {
          setQr(null);
          toast.success('WhatsApp conectado ao CRM');
          void loadSession();
        }
      }
      if (event.type === 'session-list') {
        const remote = event.sessions?.find((item) => item.id === sessionExternalId);
        if (remote) {
          setSession((current) => current ? {
            ...current,
            display_name: remote.name,
            whatsapp_jid: remote.jid || current.whatsapp_jid,
            state: remote.state,
            paired: remote.paired,
          } : current);
        }
      }
    });
  }, [loadSession, sessionExternalId]);

  const createSession = async () => {
    setAction('create');
    setError(null);
    try {
      const result = await createArqoCallSession();
      setSession(result.session);
      setQr(result.qr);
      if (!result.qr) toast.info('Sessão criada. Se o QR não aparecer, clique em gerar novamente.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível criar a sessão.');
    } finally {
      setAction(null);
    }
  };

  const pairSession = async () => {
    setAction('pair');
    setError(null);
    try {
      const result = await pairArqoCallSession();
      setSession(result.session);
      setQr(result.qr);
      if (!result.qr) toast.info('Aguardando um novo QR Code.');
    } catch (pairError) {
      setError(pairError instanceof Error ? pairError.message : 'Não foi possível gerar o QR Code.');
    } finally {
      setAction(null);
    }
  };

  const logoutSession = async () => {
    setAction('logout');
    try {
      await logoutArqoCallSession();
      setQr(null);
      setSession((current) => current ? { ...current, state: 'logged_out', paired: false, whatsapp_jid: null } : current);
      toast.success('Conta desconectada');
    } catch (logoutError) {
      toast.error(logoutError instanceof Error ? logoutError.message : 'Erro ao desconectar');
    } finally {
      setAction(null);
    }
  };

  const deleteSession = async () => {
    if (!window.confirm('Remover definitivamente o vínculo desta conta com o CRM?')) return;
    setAction('delete');
    try {
      await deleteArqoCallSession();
      setSession(null);
      setQr(null);
      toast.success('Vínculo removido');
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Erro ao remover o vínculo');
    } finally {
      setAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> WhatsApp para ligações
            </CardTitle>
            <CardDescription className="mt-1">
              Vincule sua própria conta para ligar diretamente durante os atendimentos da Arqo.
            </CardDescription>
          </div>
          {session?.paired && session.state === 'open' && (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex min-h-28 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Consultando conexão...
          </div>
        ) : !session ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-5">
            <p className="text-sm font-medium">Nenhuma conta vinculada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              O WhatsApp mostrará esta conexão em Aparelhos conectados. A conta permanece individual e não é compartilhada com outros usuários.
            </p>
            <Button className="mt-4" onClick={createSession} disabled={action !== null}>
              {action === 'create' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
              Vincular meu WhatsApp
            </Button>
          </div>
        ) : session.paired && session.state === 'open' ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-900">{formattedJid(session.whatsapp_jid)}</p>
              <p className="mt-1 text-xs text-emerald-800/70">Pronto para realizar ligações no atendimento.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={logoutSession} disabled={action !== null}>
                {action === 'logout' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                Desconectar
              </Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={deleteSession} disabled={action !== null}>
                <Trash2 className="mr-2 h-4 w-4" /> Remover vínculo
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border bg-white p-4">
              {qr ? (
                <QRCodeSVG value={qr} size={244} marginSize={1} />
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  {action === 'pair' ? <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" /> : <QrCode className="mx-auto mb-3 h-8 w-8 opacity-40" />}
                  Aguardando QR Code
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold">Escaneie pelo seu celular</p>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>1. Abra o WhatsApp no celular.</li>
                <li>2. Acesse Configurações → Aparelhos conectados.</li>
                <li>3. Toque em Conectar um aparelho e escaneie o código.</li>
              </ol>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" onClick={pairSession} disabled={action !== null}>
                  {action === 'pair' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Gerar novo QR
                </Button>
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={deleteSession} disabled={action !== null}>
                  <Trash2 className="mr-2 h-4 w-4" /> Cancelar vínculo
                </Button>
              </div>
            </div>
          </div>
        )}
        {error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

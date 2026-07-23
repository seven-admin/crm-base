import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  endArqoCall,
  getArqoCallSession,
  openArqoCall,
  subscribeArqoCallEvents,
  type ArqoCallSession,
  type ArqoCallStatus,
  type OpenArqoCall,
} from '@/lib/arqoCalls';
import type { ArqoLeadWithRelations } from '@/types/arqo.types';
import { arqoLeadPhoneOptions } from '@/lib/arqoPhones';

type UiStatus = 'idle' | ArqoCallStatus | 'ending';

const STATUS_LABELS: Record<UiStatus, string> = {
  idle: 'Pronto para ligar',
  starting: 'Preparando microfone...',
  ringing: 'Chamando...',
  connected: 'Em chamada',
  ending: 'Encerrando...',
  ended: 'Chamada encerrada',
  failed: 'Falha na chamada',
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

export function ArqoCallDialog({ lead }: { lead: ArqoLeadWithRelations }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<ArqoCallSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [status, setStatus] = useState<UiStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const phoneOptions = useMemo(() => arqoLeadPhoneOptions(lead), [lead]);
  const [selectedPhone, setSelectedPhone] = useState(phoneOptions[0]?.value ?? '');
  const callRef = useRef<OpenArqoCall | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionExternalId = session?.external_session_id;

  const active = ['starting', 'ringing', 'connected', 'ending'].includes(status);

  useEffect(() => {
    if (!open) return;
    setSelectedPhone((current) => phoneOptions.some((phone) => phone.value === current) ? current : phoneOptions[0]?.value ?? '');
    setIsLoadingSession(true);
    setError(null);
    void getArqoCallSession()
      .then(setSession)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Serviço de chamadas indisponível.'))
      .finally(() => setIsLoadingSession(false));
  }, [open, phoneOptions]);

  useEffect(() => {
    if (!open || !sessionExternalId) return undefined;
    return subscribeArqoCallEvents((event) => {
      const current = callRef.current;
      if (!current || event.id !== current.callId) return;
      if (event.type === 'call-status' && event.status) {
        setStatus(event.status);
        if (event.status === 'connected') setConnectedAt((value) => value ?? Date.now());
      }
      if (event.type === 'call-ended') {
        current.closeLocal();
        callRef.current = null;
        setStatus('ended');
        setConnectedAt(null);
      }
    });
  }, [open, sessionExternalId]);

  useEffect(() => {
    if (!connectedAt) {
      setDuration(0);
      return undefined;
    }
    const update = () => setDuration(Math.floor((Date.now() - connectedAt) / 1000));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [connectedAt]);

  useEffect(() => () => {
    const call = callRef.current;
    if (!call) return;
    call.closeLocal();
    void endArqoCall(call.callId).catch(() => undefined);
    callRef.current = null;
  }, []);

  const startCall = async () => {
    setStatus('starting');
    setError(null);
    setMuted(false);
    setDuration(0);
    try {
      const call = await openArqoCall(lead.id, selectedPhone);
      callRef.current = call;
      setStatus('ringing');
      if (audioRef.current) {
        audioRef.current.srcObject = call.remoteStream;
        await audioRef.current.play().catch(() => undefined);
      }
      call.pc.onconnectionstatechange = () => {
        if (call.pc.connectionState === 'failed') {
          call.closeLocal();
          callRef.current = null;
          void endArqoCall(call.callId).catch(() => undefined);
          setStatus('failed');
          setError('Não foi possível estabelecer o canal de áudio.');
        }
      };
    } catch (callError) {
      const message = callError instanceof DOMException && callError.name === 'NotAllowedError'
        ? 'Permita o acesso ao microfone para realizar a ligação.'
        : callError instanceof Error ? callError.message : 'Não foi possível iniciar a ligação.';
      setError(message);
      setStatus('failed');
    }
  };

  const endCall = async () => {
    const call = callRef.current;
    if (!call) return;
    setStatus('ending');
    try {
      await endArqoCall(call.callId);
    } catch (endError) {
      setError(endError instanceof Error ? endError.message : 'O servidor não confirmou o encerramento.');
    } finally {
      call.closeLocal();
      callRef.current = null;
      setStatus('ended');
      setConnectedAt(null);
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const call = callRef.current;
    if (!call) return;
    const nextMuted = !muted;
    call.micStream.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && active) return;
    setOpen(nextOpen);
    if (nextOpen) {
      setStatus('idle');
      setError(null);
    }
  };

  const connected = session?.paired && session.state === 'open';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-[#ff7417] text-[#21150d] hover:bg-[#ff8a39]"
          disabled={phoneOptions.length === 0}
          title={phoneOptions.length > 0 ? 'Ligar pelo WhatsApp' : 'Lead sem telefone cadastrado'}
        >
          <PhoneCall className="mr-2 h-4 w-4" /> Ligar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ligação pelo WhatsApp</DialogTitle>
          <DialogDescription>A chamada usa a conta vinculada ao seu perfil.</DialogDescription>
        </DialogHeader>

        <div className="rounded-[1.5rem] bg-[#201a17] px-6 py-8 text-center text-white">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/10">
            <PhoneCall className="h-7 w-7 text-[#ff8a39]" />
          </div>
          <p className="mt-4 text-lg font-semibold">{lead.cliente?.nome ?? 'Lead'}</p>
          <p className="mt-1 text-sm text-white/50">{selectedPhone || 'Telefone não informado'}</p>
          <p className="mt-5 text-sm font-medium text-[#ffb17d]">
            {isLoadingSession ? 'Verificando sua conta...' : STATUS_LABELS[status]}
          </p>
          {status === 'connected' && <p className="mt-1 font-mono text-2xl tabular-nums">{formatDuration(duration)}</p>}

          <div className="mt-7 flex items-center justify-center gap-3">
            {!active && status !== 'connected' && (
              <Button
                className="h-14 rounded-full bg-emerald-500 px-7 text-white hover:bg-emerald-600"
                onClick={startCall}
                disabled={isLoadingSession || !connected}
              >
                <PhoneCall className="mr-2 h-5 w-5" /> {status === 'ended' || status === 'failed' ? 'Ligar novamente' : 'Iniciar ligação'}
              </Button>
            )}
            {(status === 'ringing' || status === 'connected') && (
              <>
                <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full" onClick={toggleMute} disabled={status !== 'connected'}>
                  {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button size="icon" variant="destructive" className="h-14 w-14 rounded-full" onClick={endCall}>
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </>
            )}
            {(status === 'starting' || status === 'ending') && <Loader2 className="h-7 w-7 animate-spin text-[#ff8a39]" />}
          </div>
        </div>

        {phoneOptions.length > 1 && !active && (
          <div className="space-y-2">
            <Label>Número para ligação</Label>
            <Select value={selectedPhone} onValueChange={setSelectedPhone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {phoneOptions.map((phone) => (
                  <SelectItem key={phone.value} value={phone.value}>{phone.label} · {phone.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isLoadingSession && !connected && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Sua conta AstraCalls ainda não está conectada. Solicite ao administrador que informe o webhook da sua conta no cadastro de usuários.
          </div>
        )}
        {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <audio ref={audioRef} autoPlay className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

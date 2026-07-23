import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
  starting: 'Preparando...',
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

/**
 * Controles compactos de chamada. O nome legado foi mantido para não alterar
 * os consumidores, mas o componente não abre mais Dialog nem bloqueia a tela.
 */
export function ArqoCallDialog({ lead }: { lead: ArqoLeadWithRelations }) {
  const [session, setSession] = useState<ArqoCallSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [status, setStatus] = useState<UiStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const phoneOptions = useMemo(() => arqoLeadPhoneOptions(lead), [lead]);
  const [selectedPhone, setSelectedPhone] = useState(phoneOptions[0]?.value ?? '');
  const callRef = useRef<OpenArqoCall | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasConnectedRef = useRef(false);
  const sessionExternalId = session?.external_session_id;
  const active = ['starting', 'ringing', 'connected', 'ending'].includes(status);
  const connected = session?.paired && session.state === 'open';

  useEffect(() => {
    setSelectedPhone((current) => (
      phoneOptions.some((phone) => phone.value === current)
        ? current
        : phoneOptions[0]?.value ?? ''
    ));
  }, [phoneOptions]);

  useEffect(() => {
    let activeRequest = true;
    setIsLoadingSession(true);
    void getArqoCallSession()
      .then((value) => { if (activeRequest) setSession(value); })
      .catch(() => { if (activeRequest) setSession(null); })
      .finally(() => { if (activeRequest) setIsLoadingSession(false); });
    return () => { activeRequest = false; };
  }, []);

  useEffect(() => {
    if (!sessionExternalId) return undefined;
    return subscribeArqoCallEvents((event) => {
      const current = callRef.current;
      if (!current || event.id !== current.callId) return;
      if (event.type === 'call-status' && event.status) {
        setStatus(event.status);
        if (event.status === 'connected') {
          wasConnectedRef.current = true;
          setConnectedAt((value) => value ?? Date.now());
        }
      }
      if (event.type === 'call-ended') {
        current.closeLocal();
        callRef.current = null;
        setStatus('ended');
        setConnectedAt(null);
        setMuted(false);
        if (!wasConnectedRef.current) {
          toast.info('Ligação não completada. Confirme se o número possui WhatsApp.');
        }
        wasConnectedRef.current = false;
      }
    });
  }, [sessionExternalId]);

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
    if (!connected) {
      toast.info('Conta não conectada.');
      return;
    }
    setStatus('starting');
    setMuted(false);
    setDuration(0);
    wasConnectedRef.current = false;
    try {
      const call = await openArqoCall(lead.id, selectedPhone);
      callRef.current = call;
      setStatus('ringing');
      if (audioRef.current) {
        audioRef.current.srcObject = call.remoteStream;
        await audioRef.current.play().catch(() => undefined);
      }
      call.pc.onconnectionstatechange = () => {
        if (call.pc.connectionState !== 'failed') return;
        call.closeLocal();
        callRef.current = null;
        void endArqoCall(call.callId).catch(() => undefined);
        setStatus('failed');
        toast.error('Não foi possível estabelecer o canal de áudio.');
      };
    } catch (callError) {
      const message = callError instanceof DOMException && callError.name === 'NotAllowedError'
        ? 'Permita o acesso ao microfone para realizar a ligação.'
        : callError instanceof Error ? callError.message : 'Não foi possível iniciar a ligação.';
      setStatus('failed');
      toast.error(message);
    }
  };

  const endCall = async () => {
    const call = callRef.current;
    if (!call) return;
    setStatus('ending');
    try {
      await endArqoCall(call.callId);
    } catch {
      toast.error('O servidor não confirmou o encerramento da chamada.');
    } finally {
      call.closeLocal();
      callRef.current = null;
      setStatus('ended');
      setConnectedAt(null);
      setMuted(false);
      wasConnectedRef.current = false;
    }
  };

  const toggleMute = () => {
    const call = callRef.current;
    if (!call) return;
    const nextMuted = !muted;
    call.micStream.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {phoneOptions.length > 1 && !active && (
        <Select value={selectedPhone} onValueChange={setSelectedPhone}>
          <SelectTrigger className="h-9 w-[11.5rem] border-white/15 bg-white/[.07] text-xs text-white hover:bg-white/[.12]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {phoneOptions.map((phone) => (
              <SelectItem key={phone.value} value={phone.value}>{phone.label} · {phone.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!active && (
        <Button
          size="sm"
          className="bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
          disabled={phoneOptions.length === 0 || isLoadingSession || !connected}
          title={!connected && !isLoadingSession ? 'Conta não conectada' : 'Ligar pelo WhatsApp'}
          onClick={startCall}
        >
          {isLoadingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneCall className="mr-2 h-4 w-4" />}
          {isLoadingSession
            ? 'Verificando...'
            : !connected
              ? 'Conta não conectada'
              : status === 'ended' || status === 'failed'
                ? 'Ligar novamente'
                : 'Ligar'}
        </Button>
      )}

      {active && (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] py-1 pl-3 pr-1">
          <span className="flex items-center gap-2 text-xs font-medium text-white">
            {(status === 'starting' || status === 'ending') && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />}
            {status === 'ringing' && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
            {status === 'connected' && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />}
            {STATUS_LABELS[status]}
            {status === 'connected' && <span className="font-mono tabular-nums text-white/65">{formatDuration(duration)}</span>}
          </span>
          {(status === 'ringing' || status === 'connected') && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
                onClick={toggleMute}
                disabled={status !== 'connected'}
                title={muted ? 'Ativar microfone' : 'Silenciar microfone'}
              >
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={endCall} title="Encerrar ligação">
                <PhoneOff className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  );
}

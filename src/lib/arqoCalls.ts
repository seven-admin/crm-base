import { supabase } from '@/integrations/supabase/client';

export type ArqoCallSessionState = 'connecting' | 'qr' | 'open' | 'logged_out';
export type ArqoCallStatus = 'starting' | 'ringing' | 'connected' | 'ended' | 'failed';

export interface ArqoCallSession {
  id: string;
  external_session_id: string;
  chatwoot_webhook_url: string | null;
  display_name: string;
  whatsapp_jid: string | null;
  state: ArqoCallSessionState;
  paired: boolean;
}

export interface ArqoCallSessionBinding {
  user_id: string;
  chatwoot_webhook_url: string | null;
}

export interface ArqoCallsEvent {
  type: 'session-list' | 'session-qr' | 'auth-state' | 'call-list' | 'call-status' | 'call-ended' | 'incoming' | 'incoming-claimed';
  sessionId?: string;
  id?: string;
  status?: ArqoCallStatus;
  state?: ArqoCallSessionState;
  paired?: boolean;
  qr?: string;
  reason?: string;
  sessions?: Array<{ id: string; name: string; jid: string; state: ArqoCallSessionState; paired: boolean }>;
}

export interface OpenArqoCall {
  callId: string;
  logId: string;
  phone: string;
  pc: RTCPeerConnection;
  micStream: MediaStream;
  remoteStream: MediaStream;
  closeLocal: () => void;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const gatewayUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/arqo-calls`;

async function accessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Sua sessão expirou. Entre novamente no CRM.');
  return data.session.access_token;
}

async function gateway<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${gatewayUrl}${path}`, { ...init, headers });
  } catch {
    throw new Error('Não foi possível acessar o serviço de chamadas. Verifique a configuração do AstraCalls.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Serviço de chamadas: erro ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function getArqoCallSession(): Promise<ArqoCallSession | null> {
  const result = await gateway<{ session: ArqoCallSession | null }>('/session');
  return result.session;
}

export function configureArqoCallSessionForUser(userId: string, webhookUrl: string): Promise<{ session: ArqoCallSession | null }> {
  return gateway<{ session: ArqoCallSession | null }>('/admin/session', {
    method: 'POST',
    body: JSON.stringify({ userId, webhookUrl: webhookUrl.trim() }),
  });
}

export async function getArqoCallSessionBindings(): Promise<ArqoCallSessionBinding[]> {
  const result = await gateway<{ sessions: ArqoCallSessionBinding[] }>('/admin/sessions');
  return result.sessions;
}

export function subscribeArqoCallEvents(onEvent: (event: ArqoCallsEvent) => void): () => void {
  const abort = new AbortController();

  void (async () => {
    while (!abort.signal.aborted) {
      try {
        const token = await accessToken();
        const response = await fetch(`${gatewayUrl}/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          },
          signal: abort.signal,
        });
        if (!response.ok || !response.body) throw new Error(`Eventos indisponíveis (${response.status})`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!abort.signal.aborted) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() || '';
          blocks.forEach((block) => {
            const data = block
              .split(/\r?\n/)
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trimStart())
              .join('\n');
            if (!data) return;
            try { onEvent(JSON.parse(data) as ArqoCallsEvent); } catch { /* evento inválido */ }
          });
        }
      } catch (error) {
        if (abort.signal.aborted) break;
        console.warn('Canal de eventos de chamadas desconectado:', error);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
  })();

  return () => abort.abort();
}

function waitForIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', handleChange);
      reject(new Error('Tempo excedido ao preparar o áudio da chamada.'));
    }, 15_000);
    const handleChange = () => {
      if (pc.iceGatheringState !== 'complete') return;
      window.clearTimeout(timeout);
      pc.removeEventListener('icegatheringstatechange', handleChange);
      resolve();
    };
    pc.addEventListener('icegatheringstatechange', handleChange);
  });
}

export async function openArqoCall(leadId: string): Promise<OpenArqoCall> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Este navegador não oferece suporte a chamadas de áudio.');
  }

  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  let callId: string | null = null;
  const pc = new RTCPeerConnection({ iceServers: [] });
  const remoteStream = new MediaStream();

  try {
    micStream.getAudioTracks().forEach((track) => pc.addTrack(track, micStream));
    pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) stream.getTracks().forEach((track) => remoteStream.addTrack(track));
      else remoteStream.addTrack(event.track);
    };

    const started = await gateway<{ callId: string; logId: string; phone: string }>('/calls', {
      method: 'POST',
      body: JSON.stringify({ leadId }),
    });
    callId = started.callId;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIce(pc);
    const answer = await gateway<{ sdp_answer: string }>(`/calls/${encodeURIComponent(callId)}/webrtc`, {
      method: 'POST',
      body: JSON.stringify({ sdp_offer: pc.localDescription?.sdp }),
    });
    await pc.setRemoteDescription({ type: 'answer', sdp: answer.sdp_answer });

    return {
      ...started,
      pc,
      micStream,
      remoteStream,
      closeLocal: () => {
        micStream.getTracks().forEach((track) => track.stop());
        pc.close();
      },
    };
  } catch (error) {
    micStream.getTracks().forEach((track) => track.stop());
    pc.close();
    if (callId) await endArqoCall(callId).catch(() => undefined);
    throw error;
  }
}

export function endArqoCall(callId: string): Promise<void> {
  return gateway<void>(`/calls/${encodeURIComponent(callId)}`, { method: 'DELETE' });
}

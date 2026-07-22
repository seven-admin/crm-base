import { createClient, type User } from "npm:@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;
type SessionState = "connecting" | "qr" | "open" | "logged_out";

interface CallSessionRow {
  id: string;
  user_id: string;
  external_session_id: string;
  chatwoot_webhook_url: string | null;
  display_name: string;
  whatsapp_jid: string | null;
  state: SessionState;
  paired: boolean;
}

interface AstraSession {
  id: string;
  name: string;
  jid: string;
  state: SessionState;
  paired: boolean;
}

const ASTRA_URL = (Deno.env.get("ASTRACALLS_URL") || "https://call.sevengroup360sys.com.br").replace(/\/$/, "");
const ASTRA_KEY = Deno.env.get("ASTRACALLS_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function corsHeaders(_req: Request): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

function json(req: Request, value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function authenticatedUser(req: Request): Promise<User> {
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Sessão do CRM não informada");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Sessão do CRM inválida");
  return data.user;
}

async function astraFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!ASTRA_KEY) throw new HttpError(503, "ASTRACALLS_API_KEY não configurada no Supabase");
  const headers = new Headers(init.headers);
  headers.set("X-API-Key", ASTRA_KEY);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${ASTRA_URL}${path}`, { ...init, headers });
  } catch {
    throw new HttpError(503, "Serviço de chamadas indisponível");
  }
  return response;
}

async function astraJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await astraFetch(path, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new HttpError(response.status, `AstraCalls: ${body || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

async function callSession(userId: string): Promise<CallSessionRow | null> {
  const { data, error } = await admin
    .from("arqo_call_sessions")
    .select("id, user_id, external_session_id, chatwoot_webhook_url, display_name, whatsapp_jid, state, paired")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as CallSessionRow | null;
}

async function listAstraSessions(): Promise<AstraSession[]> {
  const result = await astraJson<{ sessions?: AstraSession[] }>("/api/sessions");
  return result.sessions ?? [];
}

async function syncSession(row: CallSessionRow): Promise<CallSessionRow | null> {
  const remote = (await listAstraSessions()).find((item) => item.id === row.external_session_id);
  if (!remote) {
    await admin.from("arqo_call_sessions").delete().eq("id", row.id);
    return null;
  }
  const updates = {
    display_name: remote.name || row.display_name,
    whatsapp_jid: remote.jid || null,
    state: remote.state,
    paired: remote.paired,
    last_seen_at: new Date().toISOString(),
  };
  const { data, error } = await admin
    .from("arqo_call_sessions")
    .update(updates)
    .eq("id", row.id)
    .select("id, user_id, external_session_id, chatwoot_webhook_url, display_name, whatsapp_jid, state, paired")
    .single();
  if (error) throw error;
  return data as CallSessionRow;
}

function parseSseBlock(block: string): JsonRecord | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return null;
  try {
    return JSON.parse(data) as JsonRecord;
  } catch {
    return null;
  }
}

async function openAstraEvents(clientId: string, signal?: AbortSignal): Promise<Response> {
  const url = new URL(`${ASTRA_URL}/api/events`);
  url.searchParams.set("clientId", clientId);
  return await astraFetch(`${url.pathname}${url.search}`, { signal });
}

function filteredEvent(event: JsonRecord, sessionId: string): JsonRecord | null {
  if (event.type === "session-list" && Array.isArray(event.sessions)) {
    return { ...event, sessions: event.sessions.filter((item) => (
      typeof item === "object" && item !== null && (item as JsonRecord).id === sessionId
    )) };
  }
  if (event.type === "call-list" && Array.isArray(event.calls)) {
    return { ...event, calls: event.calls.filter((item) => (
      typeof item === "object" && item !== null && (item as JsonRecord).sessionId === sessionId
    )) };
  }
  return event.sessionId === sessionId ? event : null;
}

async function persistCallEvent(event: JsonRecord, userId: string): Promise<void> {
  if (typeof event.id !== "string") return;
  if (event.type === "call-status" && typeof event.status === "string") {
    const update: JsonRecord = { status: event.status };
    if (event.status === "connected") update.connected_at = new Date().toISOString();
    await admin.from("arqo_calls").update(update).eq("user_id", userId).eq("external_call_id", event.id);
  }
  if (event.type === "call-ended") {
    await admin.from("arqo_calls").update({
      status: "ended",
      ended_at: typeof event.endedAt === "number" ? new Date(event.endedAt).toISOString() : new Date().toISOString(),
      end_reason: typeof event.reason === "string" ? event.reason : null,
    }).eq("user_id", userId).eq("external_call_id", event.id);
  }
}

async function eventsResponse(req: Request, user: User, row: CallSessionRow): Promise<Response> {
  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort(), { once: true });
  const upstream = await openAstraEvents(`crm-${user.id}-${crypto.randomUUID()}`, abort.signal);
  if (!upstream.ok || !upstream.body) throw new HttpError(503, "Canal de eventos indisponível");
  const reader = upstream.body.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (!abort.signal.aborted) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() || "";
          for (const block of blocks) {
            if (block.startsWith(":")) {
              controller.enqueue(encoder.encode(": ping\n\n"));
              continue;
            }
            const event = parseSseBlock(block);
            if (!event) continue;
            const safeEvent = filteredEvent(event, row.external_session_id);
            if (!safeEvent) continue;
            await persistCallEvent(safeEvent, user.id);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(safeEvent)}\n\n`));
          }
        }
      } catch (error) {
        if (!abort.signal.aborted) controller.error(error);
      } finally {
        abort.abort();
        await reader.cancel().catch(() => undefined);
        try { controller.close(); } catch { /* já encerrado */ }
      }
    },
    cancel() {
      abort.abort();
      return reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(req),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

function normalizedBrazilianPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 15) throw new HttpError(400, "Telefone do lead inválido para ligação");
  return digits;
}

async function authorizedLeadPhone(userId: string, leadId: string): Promise<string> {
  const { data, error } = await admin
    .from("arqo_leads")
    .select("id, consultor_id, closer_id, cliente:cliente_id(telefone)")
    .eq("id", leadId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Lead não encontrado");
  if (data.consultor_id !== userId && data.closer_id !== userId) {
    throw new HttpError(403, "Este lead não está atribuído a você");
  }
  const cliente = data.cliente as { telefone?: string | null } | null;
  if (!cliente?.telefone) throw new HttpError(400, "O lead não possui telefone cadastrado");
  return normalizedBrazilianPhone(cliente.telefone);
}

async function assertAdmin(userId: string): Promise<void> {
  const { data, error } = await admin
    .from("user_roles")
    .select("roles!inner(name)")
    .eq("user_id", userId);
  if (error) throw error;
  const allowed = (data ?? []).some((item) => {
    const role = item.roles as unknown as { name?: string } | null;
    return role?.name === "admin" || role?.name === "super_admin";
  });
  if (!allowed) throw new HttpError(403, "Somente administradores podem configurar contas do AstraCalls");
}

function sessionIdFromChatwootWebhook(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, "Webhook do AstraCalls inválido");
  }
  if (url.protocol !== "https:") throw new HttpError(400, "O webhook do AstraCalls deve usar HTTPS");
  const match = url.pathname.match(/^\/api\/sessions\/([^/]+)\/chatwoot\/webhook\/?$/);
  if (!match) throw new HttpError(400, "Use o webhook /api/sessions/{sessão}/chatwoot/webhook do AstraCalls");
  const sessionId = decodeURIComponent(match[1]);
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) throw new HttpError(400, "Identificador da sessão AstraCalls inválido");
  return sessionId;
}

async function configureUserSession(targetUserId: string, webhookUrl: string): Promise<CallSessionRow | null> {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", targetUserId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new HttpError(404, "Usuário não encontrado");

  if (!webhookUrl) {
    const { error } = await admin.from("arqo_call_sessions").delete().eq("user_id", targetUserId);
    if (error) throw error;
    return null;
  }

  const externalSessionId = sessionIdFromChatwootWebhook(webhookUrl);
  const existing = await callSession(targetUserId);
  const displayName = `CRM · ${profile.full_name || profile.email || targetUserId}`;
  const values = {
    user_id: targetUserId,
    external_session_id: externalSessionId,
    chatwoot_webhook_url: webhookUrl,
    display_name: displayName,
    ...(existing?.external_session_id === externalSessionId
      ? {}
      : { whatsapp_jid: null, state: "connecting" as SessionState, paired: false }),
  };
  const query = existing
    ? admin.from("arqo_call_sessions").update(values).eq("id", existing.id)
    : admin.from("arqo_call_sessions").insert(values);
  const { data, error } = await query
    .select("id, user_id, external_session_id, chatwoot_webhook_url, display_name, whatsapp_jid, state, paired")
    .single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "Esta conta do AstraCalls já está vinculada a outro usuário");
    throw error;
  }
  return data as CallSessionRow;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    const user = await authenticatedUser(req);
    const parts = new URL(req.url).pathname.split("/").filter(Boolean);
    const functionIndex = parts.lastIndexOf("arqo-calls");
    const route = parts.slice(functionIndex + 1);
    let row = await callSession(user.id);

    if (req.method === "POST" && route.join("/") === "admin/session") {
      await assertAdmin(user.id);
      const body = await req.json() as { userId?: string; webhookUrl?: string };
      if (!body.userId) throw new HttpError(400, "userId obrigatório");
      const session = await configureUserSession(body.userId, body.webhookUrl?.trim() || "");
      return json(req, { session });
    }

    if (req.method === "GET" && route.join("/") === "admin/sessions") {
      await assertAdmin(user.id);
      const { data, error } = await admin
        .from("arqo_call_sessions")
        .select("user_id, chatwoot_webhook_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(req, { sessions: data ?? [] });
    }

    if (req.method === "GET" && route.join("/") === "session") {
      if (row) row = await syncSession(row);
      return json(req, { session: row });
    }

    if (!row) throw new HttpError(409, "A conta AstraCalls deste usuário ainda não foi configurada pelo administrador");

    if (req.method === "GET" && route.join("/") === "events") {
      return await eventsResponse(req, user, row);
    }

    if (req.method === "POST" && route.join("/") === "calls") {
      row = await syncSession(row);
      if (!row?.paired || row.state !== "open") throw new HttpError(409, "Sua conta do WhatsApp não está conectada");
      const body = await req.json() as { leadId?: string };
      if (!body.leadId) throw new HttpError(400, "leadId obrigatório");
      const phone = await authorizedLeadPhone(user.id, body.leadId);
      const result = await astraJson<{ call: { callId: string } }>(
        `/api/sessions/${encodeURIComponent(row.external_session_id)}/calls`,
        { method: "POST", headers: { "X-Client-Id": user.id }, body: JSON.stringify({ phone, duration_ms: 300_000, record: false }) },
      );
      const { data: log, error } = await admin.from("arqo_calls").insert({
        user_id: user.id,
        lead_id: body.leadId,
        external_session_id: row.external_session_id,
        external_call_id: result.call.callId,
        phone,
        direction: "outbound",
        status: "starting",
      }).select("id").single();
      if (error) {
        await astraFetch(`/api/sessions/${encodeURIComponent(row.external_session_id)}/calls/${encodeURIComponent(result.call.callId)}`, { method: "DELETE" }).catch(() => undefined);
        throw error;
      }
      return json(req, { callId: result.call.callId, logId: log.id, phone });
    }

    const callId = route.length === 2 && route[0] === "calls" ? route[1] : null;
    const webRtcCallId = route.length === 3 && route[0] === "calls" && route[2] === "webrtc" ? route[1] : null;
    const targetCallId = callId || webRtcCallId;
    if (targetCallId) {
      const { data: callLog } = await admin.from("arqo_calls").select("id").eq("user_id", user.id).eq("external_call_id", targetCallId).maybeSingle();
      if (!callLog) throw new HttpError(404, "Chamada não encontrada");
    }

    if (req.method === "POST" && webRtcCallId) {
      const body = await req.json() as { sdp_offer?: string };
      if (!body.sdp_offer) throw new HttpError(400, "sdp_offer obrigatório");
      const result = await astraJson<{ sdp_answer: string }>(
        `/api/sessions/${encodeURIComponent(row.external_session_id)}/calls/${encodeURIComponent(webRtcCallId)}/webrtc`,
        { method: "POST", headers: { "X-Client-Id": user.id }, body: JSON.stringify({ sdp_offer: body.sdp_offer }) },
      );
      return json(req, result);
    }

    if (req.method === "DELETE" && callId) {
      await astraJson<void>(`/api/sessions/${encodeURIComponent(row.external_session_id)}/calls/${encodeURIComponent(callId)}`, {
        method: "DELETE",
        headers: { "X-Client-Id": user.id },
      });
      await admin.from("arqo_calls").update({ status: "ended", ended_at: new Date().toISOString(), end_reason: "client_hangup" })
        .eq("user_id", user.id).eq("external_call_id", callId);
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }

    throw new HttpError(404, "Rota não encontrada");
  } catch (error) {
    console.error("arqo-calls", error);
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return json(req, { error: message }, status);
  }
});

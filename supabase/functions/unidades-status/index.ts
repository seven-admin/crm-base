import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Payload {
  status?: string;
  unidade_ids?: string[];
  reserved_until?: string;
  motivo?: string;
  atomico?: boolean;
}

const STATUS_VALIDOS = ["disponivel", "reservada", "vendida", "desistida"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Método não permitido. Use POST." }, 405);

  // Autenticação por segredo compartilhado (a function tem verify_jwt=false).
  const expected = Deno.env.get("INTEGRACAO_API_KEY");
  const provided = req.headers.get("x-api-key") ?? (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) return json({ error: "Não autorizado" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Idempotência: mesma chave devolve a resposta anterior sem reprocessar.
  const idemKey = req.headers.get("idempotency-key");
  if (idemKey) {
    const { data: prev } = await supabase
      .from("integracao_idempotencia").select("resposta").eq("chave", idemKey).maybeSingle();
    if (prev) return json(prev.resposta);
  }

  let body: Payload;
  try { body = (await req.json()) as Payload; } catch { return json({ error: "JSON inválido" }, 400); }

  const status = (body.status ?? "").toLowerCase();
  const ids = body.unidade_ids ?? [];
  if (!STATUS_VALIDOS.includes(status)) return json({ error: `status deve ser: ${STATUS_VALIDOS.join(" | ")}` }, 400);
  if (!Array.isArray(ids) || ids.length === 0) return json({ error: "unidade_ids é obrigatório (array não vazio)" }, 400);

  const { data, error } = await supabase.rpc("set_unidades_status", {
    p_status: status,
    p_unidade_ids: ids,
    p_reserved_until: body.reserved_until ?? null,
    p_motivo: body.motivo ?? null,
    p_atomico: body.atomico ?? true,
  });
  if (error) return json({ error: error.message }, 500);

  const resposta = data as Record<string, unknown>;
  const ok = resposta?.ok !== false;

  // Guarda idempotência apenas quando houve mutação (permite reenvio após conflito).
  if (idemKey && ok) {
    await supabase.from("integracao_idempotencia").insert({ chave: idemKey, endpoint: "unidades-status", resposta });
  }
  return json(resposta, ok ? 200 : 409);
});

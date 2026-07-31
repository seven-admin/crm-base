// Integração ao vivo com o sistema de propostas (NEXA), que roda em OUTRO projeto
// Supabase. Busca a proposta da unidade pelo UID compartilhado (data.unit.externalUnitId
// = seven_unidades.id no nosso banco) e devolve a proposta bruta para o CRM mapear.
//
// Secrets necessários (setar em Edge Functions → Secrets deste projeto):
//   NEXA_PROPOSTAS_URL  -> https://<ref-do-outro-projeto>.supabase.co
//   NEXA_PROPOSTAS_KEY  -> key do outro projeto (service_role, ou anon se houver
//                          policy de leitura em proposals)
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Payload { externalUnitId?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Método não permitido. Use POST." }, 405);

  const url = Deno.env.get("NEXA_PROPOSTAS_URL");
  const key = Deno.env.get("NEXA_PROPOSTAS_KEY");
  if (!url || !key) return json({ error: "Integração de propostas não configurada (defina NEXA_PROPOSTAS_URL e NEXA_PROPOSTAS_KEY)." }, 500);

  let body: Payload;
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const externalUnitId = body.externalUnitId?.trim();
  if (!externalUnitId) return json({ error: "externalUnitId é obrigatório" }, 400);

  // PostgREST do outro projeto, filtrando pelo UID dentro do jsonb.
  const q = new URL(`${url.replace(/\/$/, "")}/rest/v1/proposals`);
  q.searchParams.set("select", "proposal_code,status,data,created_at");
  q.searchParams.set("data->unit->>externalUnitId", `eq.${externalUnitId}`);
  q.searchParams.set("order", "created_at.desc");
  q.searchParams.set("limit", "5");

  let rows: Array<{ proposal_code: string; status: string; data: unknown; created_at: string }>;
  try {
    const resp = await fetch(q.toString(), { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!resp.ok) return json({ error: `Falha ao consultar propostas (${resp.status})`, detalhe: await resp.text() }, 502);
    rows = await resp.json();
  } catch (e) {
    return json({ error: "Erro de rede ao consultar propostas", detalhe: String(e) }, 502);
  }

  if (!rows?.length) return json({ found: false });

  // Prioriza a proposta enviada; senão a mais recente que não foi retirada.
  const escolhida =
    rows.find((r) => r.status === "submitted") ??
    rows.find((r) => r.status !== "withdrawn") ??
    rows[0];

  return json({ found: true, proposal_code: escolhida.proposal_code, status: escolhida.status, data: escolhida.data });
});

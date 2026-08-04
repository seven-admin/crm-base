// Integração ao vivo com o sistema de propostas (NEXA), que roda em OUTRO projeto
// Supabase. O UID da unidade é compartilhado (data.unit.externalUnitId = seven_unidades.id).
//
// Modos (POST body):
//   { list: true, search? }        -> lista compacta de propostas (a "lista de clientes")
//   { proposalCode: "NEXA-..." }   -> proposta completa por código
//   { externalUnitId: "<uuid>" }   -> proposta escolhida da unidade (prioriza submitted)
//
// Secrets necessários neste projeto (Edge Functions → Secrets):
//   NEXA_PROPOSTAS_URL, NEXA_PROPOSTAS_KEY
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Payload { list?: boolean; search?: string; proposalCode?: string; externalUnitId?: string }

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

  const base = url.replace(/\/$/, "");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const rest = async (q: URL) => {
    const resp = await fetch(q.toString(), { headers });
    if (!resp.ok) throw new Error(`PostgREST ${resp.status}: ${await resp.text()}`);
    return resp.json();
  };

  try {
    // --- Lista compacta (a "lista de clientes" vem das propostas da NEXA) ---
    if (body.list) {
      const q = new URL(`${base}/rest/v1/proposals`);
      q.searchParams.set("select", [
        "proposal_code", "status", "created_at",
        "buyer_name:data->buyer->>name",
        "buyer_cpf:data->buyer->>cpf",
        "unit_number:data->unit->>unitNumber",
        "project_name:data->broker->>projectName",
        "external_unit_id:data->unit->>externalUnitId",
        "modality:data->payment->>modality",
      ].join(","));
      q.searchParams.set("order", "created_at.desc");
      q.searchParams.set("limit", "500");
      const s = body.search?.trim();
      if (s) q.searchParams.set("data->buyer->>name", `ilike.*${s}*`);
      return json({ items: await rest(q) });
    }

    // --- Proposta completa por código ---
    if (body.proposalCode) {
      const q = new URL(`${base}/rest/v1/proposals`);
      q.searchParams.set("select", "proposal_code,status,data");
      q.searchParams.set("proposal_code", `eq.${body.proposalCode}`);
      q.searchParams.set("limit", "1");
      const rows = await rest(q);
      if (!rows?.length) return json({ found: false });
      return json({ found: true, proposal_code: rows[0].proposal_code, status: rows[0].status, data: rows[0].data });
    }

    // --- Proposta escolhida da unidade ---
    if (body.externalUnitId) {
      const q = new URL(`${base}/rest/v1/proposals`);
      q.searchParams.set("select", "proposal_code,status,data,created_at");
      q.searchParams.set("data->unit->>externalUnitId", `eq.${body.externalUnitId}`);
      q.searchParams.set("order", "created_at.desc");
      q.searchParams.set("limit", "5");
      const rows = await rest(q);
      if (!rows?.length) return json({ found: false });
      const escolhida = rows.find((r: any) => r.status === "submitted") ?? rows.find((r: any) => r.status !== "withdrawn") ?? rows[0];
      return json({ found: true, proposal_code: escolhida.proposal_code, status: escolhida.status, data: escolhida.data });
    }

    return json({ error: "Informe list, proposalCode ou externalUnitId." }, 400);
  } catch (e) {
    return json({ error: "Erro ao consultar propostas", detalhe: String(e) }, 502);
  }
});

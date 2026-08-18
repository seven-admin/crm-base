// Integração ao vivo com o sistema de propostas (NEXA), que roda em OUTRO projeto
// Supabase. O UID da unidade é compartilhado (data.unit.externalUnitId = seven_unidades.id).
//
// Modos (POST body):
//   { list: true, search? }        -> lista compacta de propostas (a "lista de clientes")
//   { dashboard: true, from, to }  -> propostas ativas do período + e-mail do criador
//   { proposalCode: "NEXA-..." }   -> proposta completa por código
//   { externalUnitId: "<uuid>" }   -> proposta escolhida da unidade (prioriza submitted)
//
// Secrets necessários neste projeto (Edge Functions → Secrets):
//   NEXA_PROPOSTAS_URL, NEXA_PROPOSTAS_KEY
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Payload {
  list?: boolean;
  dashboard?: boolean;
  from?: string;
  to?: string;
  search?: string;
  proposalCode?: string;
  externalUnitId?: string;
}

interface ProposalRow extends Record<string, unknown> {
  proposal_code: string;
  status: string;
  data?: Record<string, unknown>;
  created_by?: string | null;
}

const compactSelect = (includeCreator = false) => [
  "proposal_code", "status", "created_at",
  ...(includeCreator ? ["created_by"] : []),
  "buyer_name:data->buyer->>name",
  "buyer_cpf:data->buyer->>cpf",
  "unit_number:data->unit->>unitNumber",
  "project_name:data->broker->>projectName",
  "external_unit_id:data->unit->>externalUnitId",
  "modality:data->payment->>modality",
  "broker_name:data->broker->>brokerName",
  "broker_type:data->broker->>brokerType",
  "real_estate_team:data->broker->>realEstateTeam",
].join(",");

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
  const rest = async <T = Record<string, unknown>[]>(q: URL): Promise<T> => {
    const resp = await fetch(q.toString(), { headers });
    if (!resp.ok) throw new Error(`PostgREST ${resp.status}: ${await resp.text()}`);
    return await resp.json() as T;
  };

  const restPaged = async (q: URL) => {
    const pageSize = 1000;
    const rows: ProposalRow[] = [];
    for (let offset = 0; ; offset += pageSize) {
      q.searchParams.set("limit", String(pageSize));
      q.searchParams.set("offset", String(offset));
      const page = await rest<ProposalRow[]>(q);
      rows.push(...page);
      if (page.length < pageSize) break;
    }
    return rows;
  };

  try {
    // --- Lista compacta (a "lista de clientes" vem das propostas da NEXA) ---
    if (body.list) {
      const q = new URL(`${base}/rest/v1/proposals`);
      q.searchParams.set("select", compactSelect());
      q.searchParams.set("order", "created_at.desc");
      q.searchParams.set("limit", "500");
      const s = body.search?.trim();
      if (s) q.searchParams.set("data->buyer->>name", `ilike.*${s}*`);
      return json({ items: await rest(q) });
    }

    // --- Dashboard: todas as propostas ativas do período, sem o corte de 500 linhas. ---
    // O e-mail não fica em data.broker: ele pertence ao usuário que criou a proposta
    // (created_by) e é resolvido em app_user_profiles no projeto NEXA.
    if (body.dashboard) {
      const from = body.from?.trim();
      const to = body.to?.trim();
      const fromTime = from ? Date.parse(from) : Number.NaN;
      const toTime = to ? Date.parse(to) : Number.NaN;
      if (!from || !to || !Number.isFinite(fromTime) || !Number.isFinite(toTime) || fromTime >= toTime) {
        return json({ error: "Informe from/to válidos para o dashboard." }, 400);
      }

      const q = new URL(`${base}/rest/v1/proposals`);
      q.searchParams.set("select", compactSelect(true));
      q.searchParams.set("status", "in.(submitted,reserved,sold)");
      q.searchParams.set("created_at", `gte.${from}`);
      q.searchParams.append("created_at", `lt.${to}`);
      q.searchParams.set("order", "created_at.desc");
      const proposals = await restPaged(q);

      const creatorIds = [...new Set(proposals.map((p) => p.created_by).filter(Boolean))] as string[];
      const emailByCreator = new Map<string, string>();
      const chunkSize = 200;
      for (let i = 0; i < creatorIds.length; i += chunkSize) {
        const ids = creatorIds.slice(i, i + chunkSize);
        const usersUrl = new URL(`${base}/rest/v1/app_user_profiles`);
        usersUrl.searchParams.set("select", "id,email");
        usersUrl.searchParams.set("id", `in.(${ids.join(",")})`);
        usersUrl.searchParams.set("limit", String(ids.length));
        const users = await rest<Array<{ id: string; email: string | null }>>(usersUrl);
        for (const user of users) {
          if (user.email) emailByCreator.set(user.id, user.email);
        }
      }

      return json({
        items: proposals.map(({ created_by, ...proposal }) => ({
          ...proposal,
          broker_email: created_by ? emailByCreator.get(created_by) ?? null : null,
        })),
      });
    }

    // --- Proposta completa por código ---
    if (body.proposalCode) {
      const q = new URL(`${base}/rest/v1/proposals`);
      q.searchParams.set("select", "proposal_code,status,data");
      q.searchParams.set("proposal_code", `eq.${body.proposalCode}`);
      q.searchParams.set("limit", "1");
      const rows = await rest<ProposalRow[]>(q);
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
      const rows = await rest<ProposalRow[]>(q);
      if (!rows?.length) return json({ found: false });
      const escolhida = rows.find((r) => r.status === "submitted") ?? rows.find((r) => r.status !== "withdrawn") ?? rows[0];
      return json({ found: true, proposal_code: escolhida.proposal_code, status: escolhida.status, data: escolhida.data });
    }

    return json({ error: "Informe list, dashboard, proposalCode ou externalUnitId." }, 400);
  } catch (e) {
    return json({ error: "Erro ao consultar propostas", detalhe: String(e) }, 502);
  }
});

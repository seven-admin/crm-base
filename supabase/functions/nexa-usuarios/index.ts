// Leitura read-only do cadastro de usuários/corretores da NEXA (app_user_profiles),
// que vive em OUTRO Supabase, para análise/integração com o CRM (seven_corretores).
//
// Restrita a admin/super_admin/nexa_admin/nexa_gestor do CRM.
// Só GET, só tabelas da whitelist. Usa os secrets já existentes:
//   NEXA_PROPOSTAS_URL, NEXA_PROPOSTAS_KEY
//
// Modos (POST body):
//   { probe: true }                       -> colunas (de 1 linha), amostra (3) e total
//   { table?, select?, params?, limit? }  -> SELECT passthrough (read-only, whitelist)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHITELIST = new Set(['app_user_profiles']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  // --- Autoriza o chamador pelo CRM (admin/nexa gestor) ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autorizado' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !user) return json({ error: 'Não autorizado' }, 401);

  const { data: roles } = await admin
    .from('user_roles')
    .select('roles:roles(name)')
    .eq('user_id', user.id);
  const roleNames = new Set((roles ?? []).map((r: any) => r.roles?.name).filter(Boolean));
  const allowed = ['super_admin', 'admin', 'nexa_admin', 'nexa_gestor'].some((r) => roleNames.has(r));
  if (!allowed) return json({ error: 'Sem permissão' }, 403);

  // --- Conexão com a NEXA (outro Supabase) ---
  const url = Deno.env.get('NEXA_PROPOSTAS_URL');
  const key = Deno.env.get('NEXA_PROPOSTAS_KEY');
  if (!url || !key) return json({ error: 'Integração NEXA não configurada (NEXA_PROPOSTAS_URL/KEY).' }, 500);
  const base = url.replace(/\/$/, '');
  const nexaHeaders: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}` };

  let body: { probe?: boolean; table?: string; select?: string; params?: Record<string, string>; limit?: number };
  try { body = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  const table = body.table ?? 'app_user_profiles';
  if (!WHITELIST.has(table)) return json({ error: `Tabela não permitida: ${table}` }, 400);

  try {
    if (body.probe) {
      // total via count exato
      const countUrl = new URL(`${base}/rest/v1/${table}`);
      countUrl.searchParams.set('select', 'id');
      countUrl.searchParams.set('limit', '1');
      const countResp = await fetch(countUrl.toString(), { headers: { ...nexaHeaders, Prefer: 'count=exact', Range: '0-0' } });
      const contentRange = countResp.headers.get('content-range'); // ex: 0-0/1234
      const total = contentRange ? Number(contentRange.split('/')[1]) : null;

      const sampleUrl = new URL(`${base}/rest/v1/${table}`);
      sampleUrl.searchParams.set('select', '*');
      sampleUrl.searchParams.set('limit', '3');
      const sampleResp = await fetch(sampleUrl.toString(), { headers: nexaHeaders });
      if (!sampleResp.ok) throw new Error(`PostgREST ${sampleResp.status}: ${await sampleResp.text()}`);
      const sample = await sampleResp.json();
      const columns = Array.isArray(sample) && sample[0] ? Object.keys(sample[0]) : [];
      return json({ table, total, columns, sample });
    }

    // SELECT passthrough (read-only)
    const q = new URL(`${base}/rest/v1/${table}`);
    q.searchParams.set('select', body.select ?? '*');
    for (const [k, v] of Object.entries(body.params ?? {})) q.searchParams.set(k, v);
    q.searchParams.set('limit', String(Math.min(body.limit ?? 100, 2000)));
    const resp = await fetch(q.toString(), { headers: nexaHeaders });
    if (!resp.ok) throw new Error(`PostgREST ${resp.status}: ${await resp.text()}`);
    return json({ table, rows: await resp.json() });
  } catch (e) {
    return json({ error: 'Erro ao consultar NEXA', detalhe: String(e) }, 502);
  }
});

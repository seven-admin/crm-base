import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface IngestPayload {
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  origem?: string;
  source_nome?: string;
  empreendimento_id?: string;
  valor_estimado?: number;
  observacoes?: string;
  grupo_id?: string;
  temperatura_nome?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as IngestPayload;
    if (!body || (!body.nome && !body.telefone && !body.email && !body.cpf)) {
      return new Response(JSON.stringify({ error: "Informe ao menos nome, telefone, email ou cpf" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Dedup / cria cliente
    const { data: clienteId, error: pessoaErr } = await supabase.rpc("get_or_create_pessoa", {
      p_nome: body.nome ?? "LEAD SEM NOME",
      p_cpf: body.cpf ?? null,
      p_telefone: body.telefone ?? null,
      p_email: body.email ?? null,
      p_origem: body.origem ?? body.source_nome ?? null,
    });
    if (pessoaErr) throw pessoaErr;

    // 2) Resolve etapa inicial
    const { data: etapa } = await supabase
      .from("arqo_funil_etapas")
      .select("id")
      .eq("categoria", "ativa")
      .order("ordem", { ascending: true })
      .limit(1)
      .single();
    if (!etapa) throw new Error("Nenhuma etapa ativa configurada");

    // 3) Source
    let sourceId: string | null = null;
    if (body.source_nome) {
      const { data: s } = await supabase.from("arqo_lead_sources").select("id").eq("nome", body.source_nome).maybeSingle();
      sourceId = s?.id ?? null;
    }

    // 4) Temperatura
    let temperaturaId: string | null = null;
    if (body.temperatura_nome) {
      const { data: t } = await supabase.from("arqo_temperaturas").select("id").eq("nome", body.temperatura_nome).maybeSingle();
      temperaturaId = t?.id ?? null;
    }

    // 5) Cria lead
    const { data: lead, error: leadErr } = await supabase
      .from("arqo_leads")
      .insert({
        cliente_id: clienteId,
        source_id: sourceId,
        etapa_id: etapa.id,
        temperatura_id: temperaturaId,
        empreendimento_id: body.empreendimento_id ?? null,
        valor_estimado: body.valor_estimado ?? null,
        observacoes: body.observacoes ?? null,
        grupo_id: body.grupo_id ?? null,
      })
      .select("id")
      .single();
    if (leadErr) throw leadErr;

    // 6) Leads com grupo entram na fila; a atribuição acontece quando um consultor puxa na roleta.

    return new Response(
      JSON.stringify({ ok: true, lead_id: lead.id, cliente_id: clienteId, consultor_id: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

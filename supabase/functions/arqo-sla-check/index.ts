import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: leads } = await supabase
      .from("arqo_leads")
      .select("id, etapa_id, temperatura_id, updated_at, consultor_id, grupo_id")
      .is("optout_em", null)
      .is("fechado_em", null)
      .eq("is_active", true);

    if (!leads || leads.length === 0) return new Response(JSON.stringify({ ok: true, processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: regras } = await supabase.from("arqo_sla_regras").select("etapa_id, temperatura_id, horas_max, acao_expiracao").eq("is_active", true);
    let acted = 0;
    const now = Date.now();

    for (const lead of leads) {
      const regra = regras?.find(r => r.etapa_id === lead.etapa_id && (r.temperatura_id === lead.temperatura_id || r.temperatura_id === null));
      if (!regra) continue;
      const ageH = (now - new Date(lead.updated_at as string).getTime()) / 3600000;
      if (ageH < regra.horas_max) continue;

      await supabase.from("arqo_lead_events").insert({
        lead_id: lead.id,
        tipo: "sla_expirado",
        payload: { horas_max: regra.horas_max, acao: regra.acao_expiracao, age_h: Math.round(ageH) },
      });

      if (regra.acao_expiracao === "reatribuir" && lead.grupo_id) {
        await supabase.from("arqo_leads").update({ consultor_id: null }).eq("id", lead.id);
        await supabase.rpc("arqo_atribuir_lead_roleta", { p_grupo_id: lead.grupo_id, p_lead_id: lead.id, p_tipo_atribuicao: "sla_reatribuicao" });
      }
      acted++;
    }

    return new Response(JSON.stringify({ ok: true, processed: acted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

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

    // Já disparou sla_expirado desde a última atividade do lead? Evita reinserir a cada tick do cron.
    const { data: jaExpirados } = await supabase
      .from("arqo_lead_events")
      .select("lead_id, created_at")
      .eq("tipo", "sla_expirado")
      .in("lead_id", leads.map(l => l.id));
    const ultimoExpirado = new Map<string, number>();
    for (const ev of jaExpirados ?? []) {
      const t = new Date(ev.created_at as string).getTime();
      if (t > (ultimoExpirado.get(ev.lead_id as string) ?? 0)) ultimoExpirado.set(ev.lead_id as string, t);
    }

    let acted = 0;
    const now = Date.now();

    for (const lead of leads) {
      const regra = regras?.find(r => r.etapa_id === lead.etapa_id && (r.temperatura_id === lead.temperatura_id || r.temperatura_id === null));
      if (!regra) continue;
      const updatedAt = new Date(lead.updated_at as string).getTime();
      const ageH = (now - updatedAt) / 3600000;
      if (ageH < regra.horas_max) continue;
      if ((ultimoExpirado.get(lead.id as string) ?? 0) >= updatedAt) continue; // já expirou nesta janela

      await supabase.from("arqo_lead_events").insert({
        lead_id: lead.id,
        tipo: "sla_expirado",
        payload: { horas_max: regra.horas_max, acao: regra.acao_expiracao, age_h: Math.round(ageH) },
      });

      if (regra.acao_expiracao === "reatribuir" && lead.grupo_id) {
        await supabase.from("arqo_leads").update({ consultor_id: null }).eq("id", lead.id);
        await supabase.from("arqo_lead_events").insert({
          lead_id: lead.id,
          tipo: "liberacao_consultor",
          payload: { motivo: "sla_reatribuicao", grupo_id: lead.grupo_id },
        });
      }
      acted++;
    }

    return new Response(JSON.stringify({ ok: true, processed: acted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

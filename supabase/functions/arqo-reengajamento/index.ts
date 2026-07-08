import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: regras } = await supabase.from("arqo_regua_reengajamento").select("*").eq("is_active", true).order("ordem");
    if (!regras || regras.length === 0) return new Response(JSON.stringify({ ok: true, processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let acted = 0;
    const now = Date.now();
    const { data: leads } = await supabase
      .from("arqo_leads")
      .select("id, ultimo_contato_em, created_at")
      .is("optout_em", null)
      .is("fechado_em", null)
      .eq("is_active", true);

    for (const lead of leads ?? []) {
      const base = new Date((lead.ultimo_contato_em ?? lead.created_at) as string).getTime();
      const days = Math.floor((now - base) / 86400000);
      for (const r of regras) {
        if (days === r.dias_apos_ultimo_contato) {
          await supabase.from("arqo_lead_events").insert({
            lead_id: lead.id,
            tipo: "reengajamento_disparado",
            payload: { regua_id: r.id, canal: r.canal, dias: days, mensagem: r.mensagem_template },
          });
          acted++;
        }
      }
    }
    return new Response(JSON.stringify({ ok: true, processed: acted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

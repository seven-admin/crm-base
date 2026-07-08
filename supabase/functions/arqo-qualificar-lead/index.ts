import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { lead_id } = await req.json();
    if (!lead_id) return new Response(JSON.stringify({ error: "lead_id obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: lead } = await supabase
      .from("arqo_leads")
      .select("id, observacoes, valor_estimado, clientes:cliente_id(nome, telefone, email, profissao, renda_mensal, origem, interesse), empreendimentos:empreendimento_id(nome, endereco_cidade)")
      .eq("id", lead_id)
      .single();
    if (!lead) throw new Error("Lead não encontrado");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const prompt = `Você é um analista comercial imobiliário. Avalie a qualificação deste lead de 0 a 100 e gere um resumo curto (máx 2 frases) sobre potencial de compra.

Dados:
${JSON.stringify(lead, null, 2)}

Responda APENAS em JSON válido: {"score": number, "resumo": string, "temperatura_sugerida": "Frio"|"Morno"|"Quente"|"Cliente"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`AI gateway: ${res.status} ${await res.text()}`);
    const ai = await res.json();
    const content: string = ai.choices?.[0]?.message?.content ?? "{}";
    const jsonStr = content.replace(/```json\n?|```/g, "").trim();
    let parsed: { score: number; resumo: string; temperatura_sugerida?: string };
    try { parsed = JSON.parse(jsonStr); } catch { parsed = { score: 0, resumo: content.slice(0, 400) }; }

    let temperaturaId: string | null = null;
    if (parsed.temperatura_sugerida) {
      const { data: t } = await supabase.from("arqo_temperaturas").select("id").eq("nome", parsed.temperatura_sugerida).maybeSingle();
      temperaturaId = t?.id ?? null;
    }

    await supabase.from("arqo_leads").update({
      qualificacao_score: parsed.score,
      qualificacao_resumo: parsed.resumo,
      qualificacao_atualizada_em: new Date().toISOString(),
      ...(temperaturaId ? { temperatura_id: temperaturaId } : {}),
    }).eq("id", lead_id);

    await supabase.from("arqo_lead_events").insert({
      lead_id,
      tipo: "qualificacao_ia",
      payload: parsed,
    });

    return new Response(JSON.stringify({ ok: true, ...parsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

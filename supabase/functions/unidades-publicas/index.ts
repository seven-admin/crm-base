import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Endpoint público (verify_jwt=false): dado o slug do empreendimento, devolve os
// campos seguros das unidades disponíveis + config de venda, para gerar a tabela
// de vendas fora do login. Não expõe dados sensíveis.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const url = new URL(req.url);
  let slug = url.searchParams.get("slug") ?? "";
  if (!slug && req.method === "POST") {
    try { slug = ((await req.json()) as { slug?: string })?.slug ?? ""; } catch { /* ignora */ }
  }
  if (!slug) return json({ error: "slug é obrigatório" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: emp } = await supabase
    .from("seven_empreendimentos")
    .select("id, nome, tipo, config_venda, registro_incorporacao, matricula_mae")
    .eq("slug_publico", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!emp) return json({ error: "Empreendimento não encontrado" }, 404);

  const { data: unidades } = await supabase
    .from("seven_unidades")
    .select("id, numero, andar, area_privativa, valor, status, bloco:seven_blocos(nome), tipologia:seven_tipologias(nome)")
    .eq("empreendimento_id", emp.id)
    .eq("status", "disponivel")
    .eq("is_active", true);

  const ids = (unidades ?? []).map((u) => u.id);
  const { data: boxes } = ids.length
    ? await supabase.from("seven_boxes").select("numero, unidade_id").in("unidade_id", ids).eq("is_active", true)
    : { data: [] as { numero: string; unidade_id: string }[] };

  return json({
    empreendimento: {
      nome: emp.nome,
      tipo: emp.tipo,
      config_venda: emp.config_venda,
      registro_incorporacao: emp.registro_incorporacao,
      matricula_mae: emp.matricula_mae,
    },
    unidades: unidades ?? [],
    boxes: boxes ?? [],
  });
});

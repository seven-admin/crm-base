import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_SEQUENCES = [
  "negociacao_codigo_seq",
  "negociacao_proposta_seq",
  "proposta_numero_seq",
  "briefing_codigo_seq",
  "projeto_codigo_seq",
  "contrato_numero_seq",
  "comissao_numero_seq",
  "evento_codigo_seq",
  "reserva_protocolo_seq",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check super_admin using service_role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role, role_id, roles:role_id(name)")
      .eq("user_id", userId);

    const isSuperAdmin = (roleData || []).some(
      (r: any) =>
        r.role === "super_admin" ||
        r.roles?.name === "super_admin"
    );

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const { sequence_name, restart_value } = await req.json();

    if (!ALLOWED_SEQUENCES.includes(sequence_name)) {
      return new Response(
        JSON.stringify({ error: "Sequence não permitida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const numValue = Number(restart_value);
    if (!Number.isInteger(numValue) || numValue < 1) {
      return new Response(
        JSON.stringify({ error: "Valor deve ser um inteiro >= 1" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute ALTER SEQUENCE using service_role via raw SQL (rpc)
    const { error: execError } = await supabaseAdmin.rpc("execute_alter_sequence", {
      seq_name: sequence_name,
      new_value: numValue,
    });

    // If RPC doesn't exist, fall back — but we'll create it. For now let's use a direct approach.
    // Actually we need a DB function for this. Let's call it directly.
    // We'll use the postgrest approach with a dedicated function.

    if (execError) {
      // Fallback: try using the pg function we should have
      return new Response(
        JSON.stringify({ error: execError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sequence: sequence_name, restarted_to: numValue }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

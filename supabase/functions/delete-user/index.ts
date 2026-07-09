import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for role check and user deletion
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Use admin client to check role (bypasses RLS)
    const { data: userRoleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles!inner(name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error('Error checking user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRoleName = (userRoleData?.roles as any)?.name;
    const allowedRoles = ['admin', 'super_admin'];
    if (!userRoleName || !allowedRoles.includes(userRoleName)) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem excluir usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const rawIds: string[] = Array.isArray(body?.user_ids)
      ? body.user_ids
      : body?.user_id
        ? [body.user_id]
        : [];
    const ids = rawIds.filter((id) => typeof id === 'string' && id.length > 0 && id !== user.id);

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum ID de usuário válido informado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Array<{ user_id: string; success: boolean; error?: string }> = [];
    for (const id of ids) {
      try {
        // Limpeza preventiva de referências antes de excluir
        await supabaseAdmin.from('seven_lancamentos_financeiros').update({ beneficiario_id: null }).eq('beneficiario_id', id);
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (delErr) throw delErr;
        results.push({ user_id: id, success: true });
      } catch (err: any) {
        console.error('Erro ao excluir', id, err);
        results.push({ user_id: id, success: false, error: err?.message ?? 'erro' });
      }
    }

    const okCount = results.filter(r => r.success).length;
    return new Response(
      JSON.stringify({
        success: okCount === ids.length,
        message: `${okCount}/${ids.length} usuário(s) excluído(s)`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

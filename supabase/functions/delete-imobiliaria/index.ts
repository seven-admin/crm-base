import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DeleteImobiliariaBody = {
  imobiliaria_id?: string;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with the user's token (for auth + role check)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only admin/super_admin can delete imobiliarias
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Error checking user role:', roleError);
      return new Response(JSON.stringify({ error: 'Erro ao verificar permissões' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedRoles = ['admin', 'super_admin'];
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem excluir imobiliárias' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => ({}))) as DeleteImobiliariaBody;
    const imobiliaria_id = body?.imobiliaria_id;

    if (!imobiliaria_id) {
      return new Response(JSON.stringify({ error: 'ID da imobiliária é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1) Desvincular negociações (mantém histórico, remove FK)
    const { error: desvincularNegociacoesError, data: negociacoesAtualizadas } = await supabaseAdmin
      .from('negociacoes')
      .update({ imobiliaria_id: null })
      .eq('imobiliaria_id', imobiliaria_id)
      .select('id');

    if (desvincularNegociacoesError) {
      console.error('Error unlinking negociacoes:', desvincularNegociacoesError);
      return new Response(JSON.stringify({ error: 'Erro ao desvincular negociações' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Desvincular corretores (o UX já avisava isso; mantém consistência)
    const { error: desvincularCorretoresError, data: corretoresAtualizados } = await supabaseAdmin
      .from('corretores')
      .update({ imobiliaria_id: null })
      .eq('imobiliaria_id', imobiliaria_id)
      .select('id');

    if (desvincularCorretoresError) {
      console.error('Error unlinking corretores:', desvincularCorretoresError);
      return new Response(JSON.stringify({ error: 'Erro ao desvincular corretores' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Excluir imobiliária
    const { error: deleteError } = await supabaseAdmin.from('imobiliarias').delete().eq('id', imobiliaria_id);

    if (deleteError) {
      console.error('Error deleting imobiliaria:', deleteError);
      return new Response(JSON.stringify({ error: deleteError.message || 'Erro ao excluir imobiliária' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Imobiliária excluída com sucesso',
        desvinculadas: {
          negociacoes: negociacoesAtualizadas?.length ?? 0,
          corretores: corretoresAtualizados?.length ?? 0,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

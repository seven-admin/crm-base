import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Limpeza preventiva de todas as referências ao usuário antes do delete no auth.
// Cada etapa loga o erro mas segue adiante — o delete final vai reportar se algo
// ainda estiver bloqueando.
async function cleanupReferences(admin: ReturnType<typeof createClient>, userId: string) {
  const steps: Array<{ label: string; run: () => Promise<any> }> = [
    // Nullify em tabelas de dados operacionais
    { label: 'seven_lancamentos_financeiros.beneficiario_id',
      run: () => admin.from('seven_lancamentos_financeiros').update({ beneficiario_id: null }).eq('beneficiario_id', userId) },
    { label: 'seven_clientes.gestor_id',
      run: () => admin.from('seven_clientes').update({ gestor_id: null }).eq('gestor_id', userId) },
    { label: 'seven_clientes.created_by',
      run: () => admin.from('seven_clientes').update({ created_by: null }).eq('created_by', userId) },
    { label: 'arqo_leads.consultor_id',
      run: () => admin.from('arqo_leads').update({ consultor_id: null }).eq('consultor_id', userId) },
    { label: 'arqo_leads.closer_id',
      run: () => admin.from('arqo_leads').update({ closer_id: null }).eq('closer_id', userId) },
    { label: 'arqo_leads.created_by',
      run: () => admin.from('arqo_leads').update({ created_by: null }).eq('created_by', userId) },
    { label: 'arqo_lead_events.usuario_id',
      run: () => admin.from('arqo_lead_events').update({ usuario_id: null }).eq('usuario_id', userId) },
    { label: 'nexa_visitas.corretor_id',
      run: () => admin.from('nexa_visitas').update({ corretor_id: null }).eq('corretor_id', userId) },
    { label: 'nexa_visitas.criado_por',
      run: () => admin.from('nexa_visitas').update({ criado_por: null }).eq('criado_por', userId) },
    { label: 'sistema_notificacoes',
      run: () => admin.from('sistema_notificacoes').delete().eq('user_id', userId) },

    // Nullify em referências que bloqueiam a exclusão (FKs sem SET NULL)
    { label: 'seven_empreendimentos.responsavel_comercial_id',
      run: () => admin.from('seven_empreendimentos').update({ responsavel_comercial_id: null }).eq('responsavel_comercial_id', userId) },
    { label: 'seven_empreendimento_documentos.created_by',
      run: () => admin.from('seven_empreendimento_documentos').update({ created_by: null }).eq('created_by', userId) },
    { label: 'seven_empreendimento_corretores.autorizado_por',
      run: () => admin.from('seven_empreendimento_corretores').update({ autorizado_por: null }).eq('autorizado_por', userId) },
    { label: 'seven_empreendimento_imobiliarias.autorizado_por',
      run: () => admin.from('seven_empreendimento_imobiliarias').update({ autorizado_por: null }).eq('autorizado_por', userId) },
    { label: 'seven_lancamentos_financeiros.created_by',
      run: () => admin.from('seven_lancamentos_financeiros').update({ created_by: null }).eq('created_by', userId) },
    { label: 'seven_lancamentos_financeiros.conferido_por',
      run: () => admin.from('seven_lancamentos_financeiros').update({ conferido_por: null }).eq('conferido_por', userId) },
    { label: 'seven_saldos_mensais.created_by',
      run: () => admin.from('seven_saldos_mensais').update({ created_by: null }).eq('created_by', userId) },
    { label: 'arqo_agendamentos.responsavel_id',
      run: () => admin.from('arqo_agendamentos').update({ responsavel_id: null }).eq('responsavel_id', userId) },
    { label: 'nexa_visitas_eventos.usuario_id',
      run: () => admin.from('nexa_visitas_eventos').update({ usuario_id: null }).eq('usuario_id', userId) },

    // Delete em tabelas de vínculo
    { label: 'sistema_user_empreendimentos',
      run: () => admin.from('sistema_user_empreendimentos').delete().eq('user_id', userId) },
    { label: 'sistema_user_module_permissions',
      run: () => admin.from('sistema_user_module_permissions').delete().eq('user_id', userId) },
    { label: 'arqo_grupo_membros',
      run: () => admin.from('arqo_grupo_membros').delete().eq('user_id', userId) },
    { label: 'arqo_oportunidade_responsaveis',
      run: () => admin.from('arqo_oportunidade_responsaveis').delete().eq('user_id', userId) },
    { label: 'seven_empreendimento_corretores.user_id',
      run: () => admin.from('seven_empreendimento_corretores').delete().eq('user_id', userId) },

    // Desvincula corretor/imobiliária do usuário (sem apagar o cadastro)
    { label: 'seven_corretores.user_id',
      run: () => admin.from('seven_corretores').update({ user_id: null }).eq('user_id', userId) },
    { label: 'seven_imobiliarias.user_id',
      run: () => admin.from('seven_imobiliarias').update({ user_id: null }).eq('user_id', userId) },

    // Roles (por último, antes do delete no auth)
    { label: 'user_roles',
      run: () => admin.from('user_roles').delete().eq('user_id', userId) },
  ];

  const warnings: string[] = [];
  for (const step of steps) {
    try {
      const { error } = await step.run();
      if (error && !/does not exist|column .* does not exist/i.test(error.message)) {
        warnings.push(`${step.label}: ${error.message}`);
        console.warn(`[cleanup] ${step.label}:`, error.message);
      }
    } catch (e: any) {
      warnings.push(`${step.label}: ${e?.message ?? 'erro'}`);
      console.warn(`[cleanup] ${step.label}:`, e);
    }
  }
  return warnings;
}

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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

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

    const results: Array<{ user_id: string; success: boolean; error?: string; warnings?: string[] }> = [];
    for (const id of ids) {
      try {
        const warnings = await cleanupReferences(supabaseAdmin, id);
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (delErr) throw delErr;
        results.push({ user_id: id, success: true, warnings });
      } catch (err: any) {
        console.error('Erro ao excluir', id, err);
        results.push({ user_id: id, success: false, error: err?.message ?? 'erro' });
      }
    }

    const okCount = results.filter(r => r.success).length;
    const firstError = results.find(r => !r.success)?.error;
    return new Response(
      JSON.stringify({
        success: okCount === ids.length,
        message: `${okCount}/${ids.length} usuário(s) excluído(s)` + (firstError ? ` — ${firstError}` : ''),
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

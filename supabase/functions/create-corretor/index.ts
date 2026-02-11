import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get caller user
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is admin or gestor_imobiliaria
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles:roles(name)')
      .eq('user_id', callerUser.id);

    const callerRoleNames = (callerRoles || []).map((r: any) => r.roles?.name).filter(Boolean);
    const isAdmin = callerRoleNames.includes('super_admin') || callerRoleNames.includes('admin');
    const isGestorImobiliaria = callerRoleNames.includes('gestor_imobiliaria');

    if (!isAdmin && !isGestorImobiliaria) {
      return new Response(
        JSON.stringify({ error: 'Sem permissão para cadastrar corretores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      email, 
      password,
      nome_completo, 
      cpf, 
      creci, 
      telefone,
      whatsapp,
      imobiliaria_id 
    } = await req.json();

    // Determine imobiliaria_id
    let finalImobiliariaId = imobiliaria_id;

    if (isGestorImobiliaria && !isAdmin) {
      // Gestor can only create for their own imobiliaria
      const { data: gestorImob } = await supabaseAdmin
        .from('imobiliarias')
        .select('id')
        .eq('user_id', callerUser.id)
        .maybeSingle();

      if (!gestorImob) {
        return new Response(
          JSON.stringify({ error: 'Imobiliária do gestor não encontrada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      finalImobiliariaId = gestorImob.id;
    }

    // Validations
    if (!email || !nome_completo || !finalImobiliariaId) {
      return new Response(
        JSON.stringify({ error: 'Email, nome e imobiliária são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null;
    if (cpfLimpo && !validarCPF(cpfLimpo)) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check duplicates
    if (cpfLimpo) {
      const { data: existingCpf } = await supabaseAdmin
        .from('corretores')
        .select('id')
        .eq('cpf', cpfLimpo)
        .maybeSingle();
      if (existingCpf) {
        return new Response(
          JSON.stringify({ error: 'CPF já cadastrado no sistema' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: existingEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'Email já cadastrado no sistema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (creci) {
      const { data: existingCreci } = await supabaseAdmin
        .from('corretores')
        .select('id')
        .eq('creci', creci.trim().toUpperCase())
        .maybeSingle();
      if (existingCreci) {
        return new Response(
          JSON.stringify({ error: 'CRECI já cadastrado no sistema' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use provided password or generate default
    const finalPassword = password || 'Seven@1234';

    // 1. Create auth user (active immediately)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: finalPassword,
      email_confirm: true,
      user_metadata: { full_name: nome_completo.toUpperCase() }
    });

    if (createError) {
      if (createError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw createError;
    }

    const userId = authData.user.id;

    // 2. Activate profile immediately
    await supabaseAdmin
      .from('profiles')
      .update({ is_active: true })
      .eq('id', userId);

    // 3. Assign corretor role
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'corretor')
      .single();

    if (roleData) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleData.id });
    }

    // 4. Create corretor record
    const { error: corretorError } = await supabaseAdmin
      .from('corretores')
      .insert({
        nome_completo: nome_completo.toUpperCase(),
        cpf: cpfLimpo || null,
        creci: creci ? creci.trim().toUpperCase() : null,
        telefone: telefone?.replace(/\D/g, '') || null,
        whatsapp: whatsapp?.replace(/\D/g, '') || null,
        email: email.toLowerCase(),
        user_id: userId,
        imobiliaria_id: finalImobiliariaId,
        is_active: true
      });

    if (corretorError) {
      console.error('Corretor insert error:', corretorError);
    }

    // 5. Inherit empreendimentos from imobiliaria
    const { data: empLinks } = await supabaseAdmin
      .from('empreendimento_imobiliarias')
      .select('empreendimento_id')
      .eq('imobiliaria_id', finalImobiliariaId);

    if (empLinks && empLinks.length > 0) {
      const userEmpLinks = empLinks.map(el => ({
        user_id: userId,
        empreendimento_id: el.empreendimento_id
      }));

      await supabaseAdmin
        .from('user_empreendimentos')
        .insert(userEmpLinks);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: 'Corretor cadastrado com acesso imediato ao sistema.',
        senha_padrao: !password ? 'Seven@1234' : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Create corretor error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao cadastrar corretor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

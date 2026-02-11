import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Validação de CPF
function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { 
      email, 
      password, 
      nome_completo, 
      cpf, 
      creci, 
      cidade, 
      uf, 
      telefone 
    } = await req.json();

    // Validações básicas
    if (!email || !password || !nome_completo || !cpf || !creci || !cidade || !uf) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios não preenchidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar senha
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    // Validar CPF
    if (!validarCPF(cpfLimpo)) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se CPF já existe em corretores
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

    // Verificar se email já existe
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

    // Verificar se CRECI já existe
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

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: nome_completo.toUpperCase() }
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Profile é criado automaticamente pelo trigger handle_new_user
    // O trigger já define is_active = false para novos usuários

    // 3. Buscar role_id do corretor
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'corretor')
      .single();

    if (roleError || !roleData) {
      console.error('Role error:', roleError);
      // Se não encontrar o role, ainda assim cria o usuário
      // mas sem role assignment
    } else {
      // Inserir user_role
      const { error: userRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role_id: roleData.id 
        });

      if (userRoleError) {
        console.error('User role insert error:', userRoleError);
      }
    }

    // 4. Criar registro em corretores
    const { error: corretorError } = await supabaseAdmin
      .from('corretores')
      .insert({
        nome_completo: nome_completo.toUpperCase(),
        cpf: cpfLimpo,
        creci: creci.trim().toUpperCase(),
        telefone: telefone?.replace(/\D/g, '') || null,
        email: email.toLowerCase(),
        user_id: userId,
        cidade: cidade.toUpperCase(),
        uf: uf.toUpperCase(),
        is_active: true // Corretor ativo na tabela corretores, mas profile inativo
      });

    if (corretorError) {
      console.error('Corretor insert error:', corretorError);
      // Não vamos falhar por causa disso, o usuário foi criado
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cadastro realizado com sucesso! Seu acesso está aguardando ativação por um administrador.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar cadastro' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

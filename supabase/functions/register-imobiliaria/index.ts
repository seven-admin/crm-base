import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function validarCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(cnpj[i]) * pesos1[i];
  let resto = soma % 11;
  if ((resto < 2 ? 0 : 11 - resto) !== parseInt(cnpj[12])) return false;
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(cnpj[i]) * pesos2[i];
  resto = soma % 11;
  if ((resto < 2 ? 0 : 11 - resto) !== parseInt(cnpj[13])) return false;
  return true;
}

function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[10])) return false;
  return true;
}

function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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

    const { 
      tipo_pessoa = 'juridica',
      nome_imobiliaria, 
      cnpj, 
      cpf,
      cidade, 
      uf, 
      telefone, 
      whatsapp,
      gestor_nome, 
      email, 
      senha 
    } = await req.json();

    // Validações obrigatórias
    if (!nome_imobiliaria || !email || !senha || !gestor_nome) {
      return errorResponse('Campos obrigatórios não preenchidos (nome, nome do gestor, email e senha)');
    }

    // Validar documento conforme tipo de pessoa
    if (tipo_pessoa === 'juridica') {
      if (!cnpj) return errorResponse('CNPJ é obrigatório para pessoa jurídica');
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      if (!validarCNPJ(cnpjLimpo)) return errorResponse('CNPJ inválido. Verifique os dígitos e tente novamente.');
    } else if (tipo_pessoa === 'fisica') {
      if (!cpf) return errorResponse('CPF é obrigatório para pessoa física');
      const cpfLimpo = cpf.replace(/\D/g, '');
      if (!validarCPF(cpfLimpo)) return errorResponse('CPF inválido. Verifique os dígitos e tente novamente.');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return errorResponse('Email inválido');

    // Validar senha
    if (senha.length < 6) return errorResponse('Senha deve ter no mínimo 6 caracteres');

    // Verificar se email já existe
    const { data: existingEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingEmail) return errorResponse('Email já cadastrado no sistema');

    // Verificar documento duplicado
    const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : null;
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null;

    if (tipo_pessoa === 'juridica' && cnpjLimpo) {
      const { data: existingCnpj } = await supabaseAdmin
        .from('imobiliarias')
        .select('id')
        .eq('cnpj', cnpjLimpo)
        .maybeSingle();
      if (existingCnpj) return errorResponse('CNPJ já cadastrado no sistema');
    } else if (tipo_pessoa === 'fisica' && cpfLimpo) {
      const { data: existingCpf } = await supabaseAdmin
        .from('imobiliarias')
        .select('id')
        .eq('cpf', cpfLimpo)
        .maybeSingle();
      if (existingCpf) return errorResponse('CPF já cadastrado no sistema');
    }

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: senha,
      email_confirm: true,
      user_metadata: { full_name: gestor_nome.toUpperCase() }
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already been registered')) {
        return errorResponse('Email já cadastrado');
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Ativar profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: true })
      .eq('id', userId);

    if (profileError) console.error('Profile activation error:', profileError);

    // 3. Buscar role_id de gestor_imobiliaria
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'gestor_imobiliaria')
      .single();

    if (roleError || !roleData) {
      console.error('Role error:', roleError);
    } else {
      const { error: userRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleData.id });
      if (userRoleError) console.error('User role insert error:', userRoleError);
    }

    // 4. Criar registro na tabela imobiliarias
    const { error: imobiliariaError } = await supabaseAdmin
      .from('imobiliarias')
      .insert({
        nome: nome_imobiliaria.toUpperCase(),
        tipo_pessoa: tipo_pessoa || 'juridica',
        cnpj: cnpjLimpo || null,
        cpf: cpfLimpo || null,
        endereco_cidade: cidade ? cidade.toUpperCase() : null,
        endereco_uf: uf ? uf.toUpperCase() : null,
        telefone: telefone?.replace(/\D/g, '') || null,
        whatsapp: whatsapp?.replace(/\D/g, '') || null,
        gestor_nome: gestor_nome.toUpperCase(),
        gestor_email: email.toLowerCase(),
        user_id: userId,
        is_active: true
      });

    if (imobiliariaError) console.error('Imobiliaria insert error:', imobiliariaError);

    // 5. Auto-vincular empreendimentos com auto_vincular_corretor = true
    const { data: imobCreated } = await supabaseAdmin
      .from('imobiliarias')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (imobCreated) {
      const { data: empsAuto } = await supabaseAdmin
        .from('empreendimentos')
        .select('id')
        .eq('auto_vincular_corretor', true);

      if (empsAuto && empsAuto.length > 0) {
        const links = empsAuto.map(e => ({
          empreendimento_id: e.id,
          imobiliaria_id: imobCreated.id,
        }));
        await supabaseAdmin
          .from('empreendimento_imobiliarias')
          .upsert(links, { onConflict: 'empreendimento_id,imobiliaria_id' });

        const userEmpLinks = empsAuto.map(e => ({
          user_id: userId,
          empreendimento_id: e.id,
        }));
        await supabaseAdmin
          .from('user_empreendimentos')
          .upsert(userEmpLinks, { onConflict: 'user_id,empreendimento_id' });
      }
    }

    // Disparar webhook imobiliaria_cadastrada
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-dispatcher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          evento: 'imobiliaria_cadastrada',
          dados: {
            nome: nome_imobiliaria,
            tipo_pessoa,
            cnpj: cnpjLimpo,
            cpf: cpfLimpo,
            cidade, uf, telefone, whatsapp,
            gestor_nome, gestor_email: email
          }
        })
      });
    } catch (e) {
      console.warn('[register-imobiliaria] Webhook falhou:', e);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cadastro realizado com sucesso! Você já pode fazer login.' 
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

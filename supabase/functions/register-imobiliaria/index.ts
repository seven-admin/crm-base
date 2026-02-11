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
      nome_imobiliaria, 
      cnpj, 
      cidade, 
      uf, 
      telefone, 
      whatsapp,
      gestor_nome, 
      email, 
      senha 
    } = await req.json();

    // Validações obrigatórias (CNPJ agora é obrigatório)
    if (!nome_imobiliaria || !email || !senha || !gestor_nome || !cnpj) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios não preenchidos (nome da imobiliária, CNPJ, nome do gestor, email e senha)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar CNPJ com algoritmo oficial
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (!validarCNPJ(cnpjLimpo)) {
      return new Response(
        JSON.stringify({ error: 'CNPJ inválido. Verifique os dígitos e tente novamente.' }),
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
    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }),
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

    // Verificar CNPJ duplicado
    const { data: existingCnpj } = await supabaseAdmin
      .from('imobiliarias')
      .select('id')
      .eq('cnpj', cnpjLimpo)
      .maybeSingle();

    if (existingCnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ já cadastrado no sistema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        return new Response(
          JSON.stringify({ error: 'Email já cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Ativar profile (trigger handle_new_user cria como is_active=false)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: true })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile activation error:', profileError);
    }

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
        .insert({ 
          user_id: userId, 
          role_id: roleData.id 
        });

      if (userRoleError) {
        console.error('User role insert error:', userRoleError);
      }
    }

    // 4. Criar registro na tabela imobiliarias (já ativa)
    const { error: imobiliariaError } = await supabaseAdmin
      .from('imobiliarias')
      .insert({
        nome: nome_imobiliaria.toUpperCase(),
        cnpj: cnpjLimpo,
        endereco_cidade: cidade ? cidade.toUpperCase() : null,
        endereco_uf: uf ? uf.toUpperCase() : null,
        telefone: telefone?.replace(/\D/g, '') || null,
        whatsapp: whatsapp?.replace(/\D/g, '') || null,
        gestor_nome: gestor_nome.toUpperCase(),
        gestor_email: email.toLowerCase(),
        user_id: userId,
        is_active: true
      });

    if (imobiliariaError) {
      console.error('Imobiliaria insert error:', imobiliariaError);
    }

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

        // Also give the gestor user individual access
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
            cnpj: cnpjLimpo,
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

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

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

    const { email, password, nome_completo, cpf, creci, cidade, uf, telefone, imobiliaria_id } = await req.json();

    // Validações básicas
    if (!email || !password || !nome_completo || !cpf || !creci || !cidade || !uf) {
      return jsonResponse({ error: 'Campos obrigatórios não preenchidos' }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Email inválido' }, 400);
    }

    if (password.length < 6) {
      return jsonResponse({ error: 'Senha deve ter no mínimo 6 caracteres' }, 400);
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!validarCPF(cpfLimpo)) {
      return jsonResponse({ error: 'CPF inválido' }, 400);
    }

    // Verificar duplicatas
    const { data: existingCpf } = await supabaseAdmin.from('corretores').select('id').eq('cpf', cpfLimpo).maybeSingle();
    if (existingCpf) return jsonResponse({ error: 'CPF já cadastrado no sistema' }, 400);

    const { data: existingEmail } = await supabaseAdmin.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existingEmail) return jsonResponse({ error: 'Email já cadastrado no sistema' }, 400);

    const { data: existingCreci } = await supabaseAdmin.from('corretores').select('id').eq('creci', creci.trim().toUpperCase()).maybeSingle();
    if (existingCreci) return jsonResponse({ error: 'CRECI já cadastrado no sistema' }, 400);

    // Se vinculado, verificar se imobiliária existe
    if (imobiliaria_id) {
      const { data: imob } = await supabaseAdmin.from('imobiliarias').select('id').eq('id', imobiliaria_id).eq('is_active', true).maybeSingle();
      if (!imob) return jsonResponse({ error: 'Imobiliária não encontrada ou inativa' }, 400);
    }

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: nome_completo.toUpperCase() }
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already been registered')) {
        return jsonResponse({ error: 'Email já cadastrado' }, 400);
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Buscar e atribuir role de corretor
    const { data: roleData } = await supabaseAdmin.from('roles').select('id').eq('name', 'corretor').single();
    if (roleData) {
      await supabaseAdmin.from('user_roles').insert({ user_id: userId, role_id: roleData.id });
    }

    // Criar registro em corretores
    const statusVinculo = imobiliaria_id ? 'pendente' : 'ativo';
    await supabaseAdmin.from('corretores').insert({
      nome_completo: nome_completo.toUpperCase(),
      cpf: cpfLimpo,
      creci: creci.trim().toUpperCase(),
      telefone: telefone?.replace(/\D/g, '') || null,
      email: email.toLowerCase(),
      user_id: userId,
      cidade: cidade.toUpperCase(),
      uf: uf.toUpperCase(),
      imobiliaria_id: imobiliaria_id || null,
      is_active: true,
      status_vinculo: statusVinculo,
    });

    // Disparar webhook (fire-and-forget)
    supabaseAdmin.functions.invoke('webhook-dispatcher', {
      body: {
        evento: 'corretor_cadastrado',
        dados: {
          user_id: userId,
          nome_completo: nome_completo.toUpperCase(),
          email: email.toLowerCase(),
          cpf: cpfLimpo,
          creci: creci.trim().toUpperCase(),
          telefone: telefone?.replace(/\D/g, '') || null,
          cidade: cidade.toUpperCase(),
          uf: uf.toUpperCase(),
          imobiliaria_id: imobiliaria_id || null,
          status_vinculo: statusVinculo,
        },
      },
    }).catch(err => console.warn('Webhook corretor_cadastrado falhou:', err));

    const message = imobiliaria_id
      ? 'Cadastro realizado! Seu acesso está aguardando aprovação do gestor da imobiliária.'
      : 'Cadastro realizado com sucesso! Seu acesso está aguardando ativação por um administrador.';

    return jsonResponse({ success: true, message });

  } catch (error: any) {
    console.error('Registration error:', error);
    return jsonResponse({ error: error.message || 'Erro ao processar cadastro' }, 500);
  }
});

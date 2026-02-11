import { supabase } from '@/integrations/supabase/client';

/**
 * Dispara um webhook de forma silenciosa (sem impactar UX).
 * Encapsula a chamada ao edge function webhook-dispatcher.
 */
export async function dispararWebhook(
  evento: string,
  dados: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('webhook-dispatcher', {
      body: { evento, dados },
    });

    if (error) {
      console.warn(`[webhook] Erro ao disparar evento "${evento}":`, error);
    }
  } catch (err) {
    console.warn(`[webhook] Falha ao disparar evento "${evento}":`, err);
  }
}

/**
 * Busca o perfil do usuário logado (id + nome).
 */
export async function getUsuarioLogado(): Promise<{ id: string; nome: string; telefone: string | null } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    nome: profile?.full_name || 'Usuário',
    telefone: profile?.phone || null,
  };
}

/**
 * Verifica se o usuário logado é super_admin.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .maybeSingle();

  return !!data;
}

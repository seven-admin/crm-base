import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { simpleHash } from '@/lib/hash';
import { useAuth } from '@/contexts/AuthContext';

export type TipoTermo = 'termos_uso' | 'politica_privacidade';

interface TermoAceite {
  id: string;
  user_id: string;
  tipo: TipoTermo;
  versao_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface TermoVersao {
  id: string;
  tipo: TipoTermo;
  conteudo: string;
  versao_hash: string;
  criado_por: string | null;
  created_at: string;
}

// Buscar hash atual dos termos
async function getHashAtual(tipo: TipoTermo): Promise<string> {
  const { data } = await supabase
    .from('configuracoes_sistema')
    .select('valor')
    .eq('chave', tipo)
    .single();
  
  return simpleHash(data?.valor || '');
}

// Hook para verificar se usuário precisa aceitar termos
export function useVerificarAceite() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['termos-pendentes', user?.id],
    queryFn: async () => {
      if (!user?.id) return { termosUso: false, politicaPrivacidade: false };
      
      // Buscar hashes atuais
      const [hashTermos, hashPolitica] = await Promise.all([
        getHashAtual('termos_uso'),
        getHashAtual('politica_privacidade')
      ]);
      
      // Verificar aceites existentes
      const { data: aceites } = await supabase
        .from('termos_aceites')
        .select('tipo, versao_hash')
        .eq('user_id', user.id)
        .in('versao_hash', [hashTermos, hashPolitica]);
      
      const aceiteTermos = aceites?.find(
        a => a.tipo === 'termos_uso' && a.versao_hash === hashTermos
      );
      const aceitePolitica = aceites?.find(
        a => a.tipo === 'politica_privacidade' && a.versao_hash === hashPolitica
      );
      
      return {
        termosUso: !aceiteTermos,
        politicaPrivacidade: !aceitePolitica,
        precisaAceitar: !aceiteTermos || !aceitePolitica
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para registrar aceite
export function useRegistrarAceite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tipos: TipoTermo[]) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const aceites = await Promise.all(
        tipos.map(async (tipo) => {
          const hash = await getHashAtual(tipo);
          
          return {
            user_id: user.id,
            tipo,
            versao_hash: hash,
            ip_address: null, // Será preenchido pelo backend se necessário
            user_agent: navigator.userAgent
          };
        })
      );
      
      const { error } = await supabase
        .from('termos_aceites')
        .insert(aceites);
      
      if (error) throw error;
      
      return aceites;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termos-pendentes'] });
    }
  });
}

// Hook para buscar histórico de aceites (admin)
export function useHistoricoAceites() {
  return useQuery({
    queryKey: ['termos-aceites-historico'],
    queryFn: async () => {
      // Buscar aceites
      const { data: aceites, error } = await supabase
        .from('termos_aceites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      if (!aceites?.length) return [];
      
      // Buscar profiles dos usuários
      const userIds = [...new Set(aceites.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return aceites.map(aceite => ({
        ...aceite,
        tipo: aceite.tipo as TipoTermo,
        profiles: profilesMap.get(aceite.user_id) || null
      }));
    }
  });
}

// Hook para buscar versões dos termos
export function useVersoesTermos(tipo?: TipoTermo) {
  return useQuery({
    queryKey: ['termos-versoes', tipo],
    queryFn: async () => {
      let query = supabase
        .from('termos_versoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tipo) {
        query = query.eq('tipo', tipo);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data as TermoVersao[];
    }
  });
}

// Hook para salvar nova versão dos termos
export function useSalvarVersaoTermos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tipo, conteudo }: { tipo: TipoTermo; conteudo: string }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const versaoHash = simpleHash(conteudo);
      
      // Verificar se já existe esta versão
      const { data: existente } = await supabase
        .from('termos_versoes')
        .select('id')
        .eq('tipo', tipo)
        .eq('versao_hash', versaoHash)
        .single();
      
      if (existente) {
        // Versão já existe, não precisa salvar
        return null;
      }
      
      const { data, error } = await supabase
        .from('termos_versoes')
        .insert({
          tipo,
          conteudo,
          versao_hash: versaoHash,
          criado_por: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['termos-versoes'] });
    }
  });
}

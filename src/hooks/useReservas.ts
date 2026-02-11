import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  ReservaTemporaria, 
  ReservaDocumento, 
  ReservaFormData, 
  ReservaFilters,
  ReservaStatus
} from '@/types/reservas.types';

// =====================================================
// RESERVAS HOOKS - Funcionalidade desativada
// A tabela reservas_temporarias foi removida.
// Esses hooks agora retornam dados vazios para manter
// compatibilidade com componentes existentes.
// =====================================================

export function useReservas(filters?: ReservaFilters) {
  return useQuery({
    queryKey: ['reservas', filters],
    queryFn: async () => {
      // Tabela removida - retorna array vazio
      return [] as ReservaTemporaria[];
    },
  });
}

export function useMinhasReservas() {
  return useQuery({
    queryKey: ['minhas_reservas'],
    queryFn: async () => {
      // Tabela removida - retorna array vazio
      return [] as ReservaTemporaria[];
    },
  });
}

export function useReserva(id: string | null) {
  return useQuery({
    queryKey: ['reserva', id],
    queryFn: async () => {
      // Tabela removida - retorna null
      return null;
    },
    enabled: !!id,
  });
}

export function useCreateReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ReservaFormData) => {
      // Funcionalidade desativada
      throw new Error('Funcionalidade de reservas temporárias foi desativada');
    },
    onError: (error) => {
      console.error('Erro ao criar reserva:', error);
      toast.error('Funcionalidade de reservas desativada');
    },
  });
}

export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Funcionalidade desativada
      throw new Error('Funcionalidade de reservas temporárias foi desativada');
    },
    onError: (error) => {
      console.error('Erro ao cancelar reserva:', error);
      toast.error('Funcionalidade de reservas desativada');
    },
  });
}

// =====================================================
// RESERVA DOCUMENTOS HOOKS
// =====================================================

export function useReservaDocumentos(reservaId: string | null) {
  return useQuery({
    queryKey: ['reserva_documentos', reservaId],
    queryFn: async () => {
      if (!reservaId) return [];
      const { data, error } = await supabase
        .from('reserva_documentos')
        .select('*')
        .eq('reserva_id', reservaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReservaDocumento[];
    },
    enabled: !!reservaId,
  });
}

export function useUploadReservaDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservaId, file, tipo }: { reservaId: string; file: File; tipo: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reservaId}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('contratos-documentos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contratos-documentos')
        .getPublicUrl(fileName);

      // Save document record
      const { error: dbError } = await supabase
        .from('reserva_documentos')
        .insert({
          reserva_id: reservaId,
          tipo,
          nome: file.name,
          arquivo_url: publicUrl,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reserva_documentos'] });
      toast.success('Documento anexado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao anexar documento:', error);
      toast.error('Erro ao anexar documento');
    },
  });
}

// =====================================================
// STATISTICS HOOKS
// =====================================================

export function useReservaStats() {
  return useQuery({
    queryKey: ['reserva_stats'],
    queryFn: async () => {
      // Tabela removida - retorna estatísticas zeradas
      return {
        total: 0,
        ativas: 0,
        expiradas: 0,
        convertidas: 0,
        canceladas: 0,
      };
    },
  });
}

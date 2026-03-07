import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleCalendarEmbed {
  id: string;
  user_id: string;
  nome: string;
  embed_url: string;
  is_active: boolean;
  created_at: string;
}

export function useGoogleCalendarEmbeds() {
  const queryClient = useQueryClient();

  const { data: embeds, isLoading } = useQuery({
    queryKey: ['google-calendar-embeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_calendar_embeds')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return data as GoogleCalendarEmbed[];
    }
  });

  const createEmbed = useMutation({
    mutationFn: async (embed: { nome: string; embed_url: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('google_calendar_embeds')
        .insert({ ...embed, user_id: userData.user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-embeds'] });
      toast.success('Google Calendar adicionado');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar: ' + error.message);
    }
  });

  const deleteEmbed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('google_calendar_embeds')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-embeds'] });
      toast.success('Google Calendar removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    }
  });

  return { embeds, isLoading, createEmbed, deleteEmbed };
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleCalendarEmbeds } from './useGoogleCalendarEmbeds';

export interface GoogleCalendarEvent {
  summary: string;
  dtstart: string;
  dtend: string | null;
  allDay: boolean;
  calendarName: string;
}

export function useGoogleCalendarEvents(month: number, year: number) {
  const { embeds } = useGoogleCalendarEmbeds();

  return useQuery({
    queryKey: ['google-calendar-events', month, year, embeds?.map(e => e.id)],
    queryFn: async () => {
      if (!embeds || embeds.length === 0) return [] as GoogleCalendarEvent[];

      const allEvents: GoogleCalendarEvent[] = [];

      for (const embed of embeds) {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-google-calendar', {
            body: { calendar_url: embed.embed_url, month, year },
          });

          if (error) {
            console.error(`Error fetching calendar ${embed.nome}:`, error);
            continue;
          }

          if (data?.events) {
            for (const evt of data.events) {
              allEvents.push({ ...evt, calendarName: embed.nome });
            }
          }
        } catch (err) {
          console.error(`Error fetching calendar ${embed.nome}:`, err);
        }
      }

      return allEvents;
    },
    enabled: !!embeds && embeds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

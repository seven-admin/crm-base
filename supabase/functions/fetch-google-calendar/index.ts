const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function emailToIcalUrl(input: string): string {
  // If already a full iCal URL, return as-is
  if (input.includes('.ics')) return input;
  // If it's an embed URL, extract the src parameter
  if (input.includes('/embed')) {
    const url = new URL(input);
    const src = url.searchParams.get('src');
    if (src) return `https://calendar.google.com/calendar/ical/${encodeURIComponent(src)}/public/basic.ics`;
  }
  // Assume it's an email
  return `https://calendar.google.com/calendar/ical/${encodeURIComponent(input)}/public/basic.ics`;
}

interface CalendarEvent {
  summary: string;
  dtstart: string;
  dtend: string | null;
  allDay: boolean;
}

function parseIcal(icsText: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const blocks = icsText.split('BEGIN:VEVENT');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const lines = unfoldLines(block);

    let summary = '';
    let dtstart = '';
    let dtend = '';
    let allDay = false;

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8).trim();
      } else if (line.startsWith('DTSTART;') || line.startsWith('DTSTART:')) {
        const val = extractValue(line);
        if (line.includes('VALUE=DATE:') || (val.length === 8 && !val.includes('T'))) {
          allDay = true;
          dtstart = formatDateOnly(val);
        } else {
          dtstart = formatDateTime(val);
        }
      } else if (line.startsWith('DTEND;') || line.startsWith('DTEND:')) {
        const val = extractValue(line);
        if (line.includes('VALUE=DATE:') || (val.length === 8 && !val.includes('T'))) {
          dtend = formatDateOnly(val);
        } else {
          dtend = formatDateTime(val);
        }
      }
    }

    if (summary && dtstart) {
      events.push({ summary, dtstart, dtend: dtend || null, allDay });
    }
  }

  return events;
}

function unfoldLines(text: string): string[] {
  // iCal long lines are folded with CRLF + space/tab
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  return unfolded.split(/\r?\n/).filter(l => l.trim());
}

function extractValue(line: string): string {
  const colonIdx = line.indexOf(':');
  return colonIdx >= 0 ? line.substring(colonIdx + 1).trim() : '';
}

function formatDateOnly(val: string): string {
  // 20260315 -> 2026-03-15
  const clean = val.replace(/[^0-9]/g, '');
  if (clean.length < 8) return val;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

function formatDateTime(val: string): string {
  // 20260315T120000Z -> 2026-03-15
  const clean = val.replace(/[^0-9T]/g, '');
  if (clean.length < 8) return val;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calendar_url, month, year } = await req.json();

    if (!calendar_url) {
      return new Response(JSON.stringify({ error: 'calendar_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const icalUrl = emailToIcalUrl(calendar_url);

    const response = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Seven-Calendar/1.0' },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch calendar: ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const icsText = await response.text();
    let events = parseIcal(icsText);

    // Filter by month/year if provided
    if (month && year) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      events = events.filter(e => {
        const start = e.dtstart;
        const end = e.dtend || e.dtstart;
        // Check if event overlaps with the month
        const monthStart = `${prefix}-01`;
        const monthEnd = `${prefix}-31`;
        return start <= monthEnd && end >= monthStart;
      });
    }

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

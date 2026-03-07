

# Plano: Exibir eventos do Google Calendar inline no calendário

## Problema
O iframe embed exibe o calendário do Google em separado, não misturado com os dados internos. Para exibir eventos do Google nas mesmas células do calendário, precisamos **buscar os dados reais** dos eventos e renderizá-los junto com as tarefas do planejamento.

## Solução

Criar uma **Edge Function** que busca o feed iCal público do Google Calendar, parseia os eventos e retorna JSON. O frontend mescla esses eventos com as tarefas internas nas células do calendário.

### Como funciona

O Google Calendar disponibiliza calendários públicos via feed iCal:
```
https://calendar.google.com/calendar/ical/{EMAIL}/public/basic.ics
```

A Edge Function:
1. Recebe a URL do calendário (email ou URL completa)
2. Converte para URL do feed iCal público
3. Faz fetch do `.ics`
4. Parseia os eventos (VEVENT) extraindo: título, data início, data fim
5. Retorna JSON filtrado pelo mês solicitado

**Requisito**: O calendário do Google precisa estar com compartilhamento público ativado (Configurações → Permissões de acesso → Disponibilizar para o público).

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/fetch-google-calendar/index.ts` | Nova Edge Function — fetch + parse iCal |
| `src/hooks/useGoogleCalendarEvents.ts` | Novo hook — chama a Edge Function e retorna eventos por mês |
| `src/components/planejamento/PlanejamentoCalendario.tsx` | Mesclar eventos do Google nas células do calendário (cor diferenciada, ex: cinza/roxo) |
| `src/components/planejamento/ConfigurarGoogleCalendarDialog.tsx` | Ajustar instrução: pedir email do calendário (ou URL iCal) em vez de URL embed |
| `src/components/planejamento/GoogleCalendarEmbed.tsx` | Remover (não será mais usado) |
| Tabela `google_calendar_embeds` | Reutilizar — campo `embed_url` armazena o email ou URL iCal |

### Fluxo visual

Os eventos do Google Calendar aparecem nas células do dia com estilo visual distinto (ex: fundo cinza claro, ícone de calendário) para diferenciar dos itens internos do planejamento. No painel lateral do dia, aparecem em seção separada "Google Calendar" como somente leitura.

### Edge Function (parse iCal)

A função parseia o formato iCal básico sem dependência externa — extrai `SUMMARY`, `DTSTART`, `DTEND` dos blocos `VEVENT`. Não precisa de API key nem OAuth, apenas que o calendário esteja público.

### Limitações
- Calendário precisa estar público no Google
- Somente leitura (não cria/edita eventos no Google)
- Cache de 5 minutos na Edge Function para performance




# Eventos no Portal do Corretor — Inscrições em Eventos

## Resumo
Criar uma aba "Eventos" no portal do corretor onde os corretores podem visualizar eventos cadastrados e se inscrever. O sistema precisa de controle de abertura/fechamento de inscrições, limite de vagas e disparo de webhook na confirmação.

## 1. Alterações no Banco de Dados

### Novos campos na tabela `eventos`
- `inscricoes_abertas` (boolean, default false) — controla se o evento aceita inscrições
- `limite_inscricoes` (integer, nullable) — limite de vagas (null = sem limite)

### Nova tabela `evento_inscricoes`
```text
evento_inscricoes
├── id (uuid, PK)
├── evento_id (FK → eventos)
├── corretor_id (FK → corretores)
├── user_id (FK → profiles) 
├── nome_corretor (text)
├── telefone (text, nullable)
├── email (text, nullable)
├── imobiliaria_nome (text, nullable)
├── status ('confirmada' | 'cancelada')
├── created_at (timestamptz)
└── UNIQUE(evento_id, user_id)
```

RLS: corretores/gestores podem INSERT e SELECT suas próprias inscrições. Admins/Seven team podem ver tudo.

## 2. Alterações no Frontend

### `PortalLayout.tsx`
- Adicionar item "Eventos" (ícone `CalendarDays`) no `baseMenuItems` apontando para `/portal-corretor/eventos`
- Adicionar título/subtítulo no `routeTitles`

### `App.tsx`
- Adicionar rota `eventos` dentro do layout do portal

### Nova página `src/pages/portal/PortalEventos.tsx`
- Lista cards dos eventos ativos com `inscricoes_abertas = true` ou todos (com badge indicando status)
- Cada card mostra: nome, data, local, empreendimento, vagas restantes
- Botão "Inscrever-se" (desabilitado se fechado ou lotado)
- Botão "Cancelar inscrição" se já inscrito
- Ao inscrever, dispara `dispararWebhook('evento_inscricao', { ... })` com dados do corretor e evento

### Novo hook `src/hooks/useEventoInscricoes.ts`
- Query para listar inscrições do usuário logado
- Query para contar inscrições por evento
- Mutation para inscrever (INSERT + webhook)
- Mutation para cancelar (UPDATE status → 'cancelada')

## 3. Webhook
Usa o sistema existente `dispararWebhook()` com evento `evento_inscricao_corretor`, enviando dados do corretor e do evento.

## Arquivos afetados
- **Banco**: migração (nova tabela + novos campos)
- `src/components/portal/PortalLayout.tsx` — nova aba
- `src/App.tsx` — nova rota
- `src/pages/portal/PortalEventos.tsx` — nova página (criar)
- `src/hooks/useEventoInscricoes.ts` — novo hook (criar)


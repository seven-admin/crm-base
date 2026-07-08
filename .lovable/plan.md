
# Plano — Módulo Nexa

Sistema de gestão de visitas a empreendimentos, integrado com o cadastro de `clientes` e `unidades` do mesmo banco, com placeholder para contratos e Google Calendar.

## 1. Banco de dados (migration única)

### Enum e roles
- `CREATE TYPE nexa_visita_status AS ENUM ('agendada','confirmada','realizada','no_show','cancelada')`
- Inserir em `public.roles`: `nexa_admin`, `nexa_gestor`, `nexa_corretor` (is_active=true).

### Tabela `nexa_visitas`
Campos: `id`, `cliente_id` (FK → `clientes(id)` nullable), `visitante_nome` (text nullable), `visitante_telefone` (text nullable), `empreendimento_id` (FK → `empreendimentos`), `imobiliaria_parceira_id` (FK → `imobiliarias` nullable), `corretor_id` (FK → `corretores` nullable), `data_hora` (timestamptz), `status` (default `agendada`), `arqo_lead_id` (FK → `arqo_leads` nullable), `google_event_id` (text nullable), `observacoes` (text), `created_by` (uuid → profiles), `created_at`, `updated_at`.

Constraint CHECK: `(cliente_id IS NOT NULL) OR (visitante_nome IS NOT NULL AND visitante_telefone IS NOT NULL)`.

### Tabela `nexa_visitas_eventos` (append-only)
`id`, `visita_id` (FK), `tipo_evento` (text: `criada`, `confirmada`, `realizada`, `no_show`, `cancelada`, `reserva_sucesso`, `reserva_conflito`, `venda_sucesso`, `venda_conflito`, `bloqueio_sucesso`, `bloqueio_conflito`, `unidade_liberada`), `unidade_id` (nullable), `payload` (jsonb), `usuario_id` (uuid → profiles), `created_at`. Trigger bloqueia UPDATE/DELETE.

### Tabela `nexa_contratos` (placeholder)
`id`, `visita_id`, `unidade_id`, `valor` (numeric), `status` (text default 'rascunho'), `created_at`, `updated_at`. Sem UI funcional agora.

### GRANTs + RLS
Padrão do projeto: `GRANT ... TO authenticated`, `GRANT ALL ... TO service_role`. Policies:
- Admins e roles `nexa_*` podem SELECT/INSERT/UPDATE em `nexa_visitas` e `nexa_contratos`.
- `nexa_visitas_eventos`: SELECT para admins + nexa_*; INSERT idem; UPDATE/DELETE bloqueados via trigger.

### Concorrência (conforme resposta do usuário)
UPDATE direto em `unidades.status`. Detecção de conflito no frontend/hook: refetch imediato antes do UPDATE e checagem `status = 'disponivel'` na cláusula WHERE. Se `rowCount = 0`, retornar erro de conflito, registrar evento `*_conflito` e mostrar toast claro. Boxes selecionados: UPDATE com WHERE `status = 'disponivel'` do mesmo modo.

## 2. Frontend

### Estrutura de arquivos
```text
src/
  pages/nexa/
    NexaAgenda.tsx           (lista + calendário simples)
    NexaVisitaDetalhe.tsx    (detalhe, ações reservar/vender/bloquear)
    NexaDisponibilidade.tsx  (unidades disponíveis em tempo real)
    NexaContratos.tsx        (placeholder "em desenvolvimento")
  components/nexa/
    NexaProtectedRoute.tsx
    NovaVisitaDialog.tsx     (form com toggle "já é lead do grupo?")
    UnidadeAcaoDialog.tsx    (seleção unidade + boxes + ação)
    VisitaTimeline.tsx
  hooks/
    useNexa.ts               (visitas, eventos, mutators com detecção de conflito)
```

### Fluxos-chave
- **Nova visita**: toggle "Já é lead do grupo?"
  - Sim → autocomplete busca em `clientes` por telefone/nome; se não achar, chama RPC `get_or_create_pessoa` já existente → grava `cliente_id`.
  - Não → grava `visitante_nome` + `visitante_telefone` (não cria em `clientes`).
- **Detalhe da visita**: timeline de eventos + botão "Registrar interesse" abrindo `UnidadeAcaoDialog` que lista unidades disponíveis do empreendimento (JOIN direto, sem cache) + boxes disponíveis, com ações Reservar/Vender/Bloquear.
- **Conflito**: toast destacado "Unidade já foi reservada/vendida por outro usuário", refetch automático, evento `*_conflito` gravado.
- **Disponibilidade**: query com `staleTime: 0` e refetch on focus; filtro por empreendimento.

### Roles e navegação
- `NexaProtectedRoute` libera para `isAdmin()` ou role em `['nexa_admin','nexa_gestor','nexa_corretor']`.
- Novo grupo "Nexa" na `Sidebar.tsx` e `AppTopbar.tsx` (mesmo padrão do Arqo), com ícones `CalendarDays`, `MapPin`, `FileText`.
- `filterItems` do Sidebar: `if (item.moduleName === 'nexa') return isAdmin() || (role && NEXA_ROLES.includes(role))`.
- Rotas em `App.tsx`: `/nexa/agenda`, `/nexa/visitas/:id`, `/nexa/disponibilidade`, `/nexa/contratos`.

## 3. Fora de escopo (declarado)
- Integração Google Calendar: apenas o campo `google_event_id` fica no schema.
- Tela funcional de contratos: apenas placeholder + schema.
- Nenhuma edge function ou webhook — tudo no mesmo banco via Supabase JS client.

## Detalhes técnicos
- Migration única com CREATE TABLE → GRANT → ALTER ENABLE RLS → CREATE POLICY (ordem obrigatória).
- Tipos gerados de `src/integrations/supabase/types.ts` são regenerados após aprovar migration; hooks vêm depois.
- Uso de `react-query` seguindo padrão dos hooks existentes; sem realtime nesta etapa.

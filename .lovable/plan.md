

# Plano: 3 alterações no EventoDetalhe + gestor_telefone no payload

## Alterações em `src/pages/EventoDetalhe.tsx`

1. **Remover alerta "Evento é hoje!"** — Remover o bloco `progressoMetadata` que exibe "Evento é hoje!", "X dias restantes" e "Evento já ocorreu" (linhas 88-96). Manter apenas a barra de progresso de tarefas.

2. **Reordenar abas** — Mover "Inscritos" para ser a primeira aba e definir `defaultValue="inscritos"`:
   - Inscritos → Tarefas → Cronograma → Equipe

## Alterações para gestor_telefone no payload

### `src/components/eventos/EventoInscritosTab.tsx`
- Expandir join do corretor para incluir imobiliária: `.select('*, corretor:corretor_id(telefone, whatsapp, imobiliaria:imobiliaria_id(gestor_telefone))')`
- Na query auxiliar por `user_id`, também buscar `imobiliaria_id` e fazer select na tabela `imobiliarias` para pegar `gestor_telefone`
- Enriquecer cada inscrição com `_gestor_telefone`
- Adicionar `gestor_telefone` no payload do `dispararWebhook`

### `src/hooks/useEventoInscricoes.ts`
- Adicionar parâmetro `gestor_telefone?: string` no `inscrever.mutate`
- Incluir no payload do webhook

### `src/pages/portal/PortalEventos.tsx`
- Expandir query do corretor para incluir `gestor_telefone` da imobiliária: `.select('id, telefone, whatsapp, imobiliaria:imobiliaria_id(nome, gestor_telefone)')`
- Passar `gestor_telefone` ao chamar `inscrever.mutate`

## Arquivos alterados
- `src/pages/EventoDetalhe.tsx`
- `src/components/eventos/EventoInscritosTab.tsx`
- `src/hooks/useEventoInscricoes.ts`
- `src/pages/portal/PortalEventos.tsx`


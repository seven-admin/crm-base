

# Corrigir lentidão na inscrição e remover contador

## Problemas identificados

### 1. Botões compartilham estado de loading
`inscrever.isPending` e `cancelar.isPending` são estados globais da mutation. Quando o corretor clica "Inscrever-se" em um evento, **todos** os outros botões ficam desabilitados/com spinner — inclusive os de eventos encerrados. Isso causa a impressão de lentidão e comportamento errado.

### 2. Webhook síncrono causa lentidão real
Na mutation `inscrever`, o `await dispararWebhook(...)` é chamado de forma síncrona. O usuário fica esperando o webhook completar antes de ver o toast de sucesso. Isso adiciona latência desnecessária.

### 3. Contador de inscritos visível no portal
Os cards mostram "X inscritos" ou "X/Y inscritos" com ícone de Users. O pedido é remover essa informação do portal do corretor/imobiliária.

## Solução

### `src/hooks/useEventoInscricoes.ts`
- Remover o `await` do `dispararWebhook` — torná-lo fire-and-forget (`.catch(() => {})`)
- Remover a query `contagemInscricoes` (não será mais usada no portal)

### `src/pages/portal/PortalEventos.tsx`
- Adicionar estado local `inscrevendoEventoId` para rastrear qual evento está em processo de inscrição/cancelamento
- Usar esse estado para desabilitar/mostrar spinner apenas no botão correto
- Remover o bloco de contagem de inscritos (linhas 154-166: ícone Users + texto "X inscritos" + badge Lotado)
- Remover `contagemInscricoes` e `vagasRestantes` do componente
- Ajustar lógica de `lotado`/`podeInscrever` — sem limite visível, apenas verificar `inscricoes_abertas`

### Arquivos modificados
- `src/hooks/useEventoInscricoes.ts`
- `src/pages/portal/PortalEventos.tsx`


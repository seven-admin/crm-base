

# Botão "Reenviar Webhook" na lista de inscritos

## Mudança

Adicionar um botão de ação em cada linha da tabela de inscritos para reenviar o webhook `evento_inscricao_corretor` com os dados daquela inscrição.

### `src/components/eventos/EventoInscritosTab.tsx`

1. **Receber dados do evento** — o componente precisa do nome e data do evento para compor o payload do webhook. Alterar a prop para incluir `eventoNome` e `eventoData`.

2. **Adicionar mutation de reenvio** — usar `dispararWebhook('evento_inscricao_corretor', {...})` com os dados do inscrito (nome, telefone, email, imobiliária) e do evento.

3. **Adicionar botão na coluna de ações** — ícone `Send` (lucide) ao lado de editar/excluir, com tooltip ou title "Reenviar mensagem". Mostrar loading enquanto envia.

### `src/pages/EventoDetalhe.tsx`

Passar `eventoNome={evento.nome}` e `eventoData={evento.data_evento}` para o `EventoInscritosTab`.

### Detalhes técnicos

- O reenvio usa a mesma função `dispararWebhook` já existente
- Payload idêntico ao da inscrição original
- Toast de sucesso/erro após o disparo
- Botão desabilitado durante o envio para evitar cliques duplicados


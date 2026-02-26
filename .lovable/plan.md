
# Adicionar funcao de des-selecionar temperatura no TemperaturaSelector

## O que sera feito

Alterar o componente `TemperaturaSelector` para permitir que o usuario clique em uma temperatura ja selecionada para limpa-la (voltar para `null`). Atualmente, clicar na temperatura ativa nao faz nada (linha 29: `if (!isActive) onValueChange(temp.value)`).

## Alteracao

### Arquivo: `src/components/atividades/TemperaturaSelector.tsx`

1. Mudar o tipo do `onValueChange` para aceitar `null`: `onValueChange: (temp: ClienteTemperatura | null) => void`
2. Na linha 29, trocar a logica do click: se ja esta ativo, chamar `onValueChange(null)`; senao, chamar `onValueChange(temp.value)`

```typescript
onClick={(e) => {
  e.stopPropagation();
  onValueChange(isActive ? null : temp.value);
}}
```

### Arquivos que chamam `onValueChange` com temperatura

Os handlers que recebem o valor precisam aceitar `null`. Verificar e ajustar:

- `AtividadeDetalheDialog.tsx` - `handleTemperaturaChange`
- `AtividadeKanbanCard.tsx` - `handleTemperaturaChange`
- `AtividadeCard.tsx` - handler de temperatura
- `Atividades.tsx` - handler na tabela
- `ConcluirAtividadeDialog.tsx` - handler de conclusao

Em cada um, o tipo do parametro muda de `ClienteTemperatura` para `ClienteTemperatura | null` e o mutation envia `temperatura_cliente: temp` (que agora pode ser `null`).

## Resumo

| Arquivo | Acao |
|---|---|
| `TemperaturaSelector.tsx` | Permitir toggle (clique no ativo = null) |
| Componentes que usam o seletor | Ajustar tipo do handler para aceitar null |

Alteracao simples e localizada, sem mudancas no banco ou na API.

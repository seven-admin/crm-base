

# Adicionar configurações de inscrições no EventoEditDialog

## Problema
O formulário de edição de eventos (`EventoEditDialog.tsx`) não possui campos para `inscricoes_abertas` e `limite_inscricoes`, impossibilitando o admin de controlar inscrições pelo painel.

## Solução

### `src/components/eventos/EventoEditDialog.tsx`
Adicionar dois campos ao formulário:

1. **Switch "Inscrições Abertas"** — campo booleano `inscricoes_abertas` (usando componente `Switch`)
2. **Input "Limite de Inscrições"** — campo numérico `limite_inscricoes` (null = sem limite)

Ambos ficam em uma seção "Configurações de Inscrições" antes do botão de salvar.

Alterações:
- Adicionar `inscricoes_abertas` (boolean) e `limite_inscricoes` (number optional) ao schema Zod
- Adicionar defaults no `useForm` e no `useEffect` reset
- Adicionar os dois `FormField` no JSX
- Incluir os campos no `onSubmit`

### Arquivo afetado
- `src/components/eventos/EventoEditDialog.tsx`


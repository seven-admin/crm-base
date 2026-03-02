

# Correcao do bug de categoria e reversao dos dados

## Problema confirmado

7 atividades tiveram a categoria alterada de **imobiliaria** para **cliente** automaticamente em 02/03/2026, sem intencao dos usuarios (Tania Moraes, Carla Paglia, Lucas). A causa e o `useEffect` na linha 183-191 de `AtividadeForm.tsx` que sobrescreve a categoria sempre que o tipo pertence a `TIPOS_CATEGORIA_CLIENTE`, inclusive durante edicao.

IDs afetados (confirmados via `atividade_historico`):
- `d4595310-376c-4325-8710-d098e7bfa2e4`
- `a4c286d8-a326-4a28-9008-b0f5beb01c42`
- `aab4c256-82ee-42f3-aa17-21b99abfdaaa`
- `a5b5bc77-9298-4901-995e-45b6b407fd5c`
- `7e084075-5316-4d7d-932f-1ea72b50f454`
- `1d8960b2-c3c0-47c3-a23b-b01693caf1a2`
- `bc2af93c-33ef-49fb-b0e1-297a8fdae27f`

## Plano

### 1. Corrigir o bug no formulario
**Arquivo:** `src/components/atividades/AtividadeForm.tsx` (linhas 183-191)

Alterar o `useEffect` para que o auto-set de categoria "cliente" so ocorra na **criacao** (quando nao ha `initialData`):

```typescript
useEffect(() => {
  if (!TIPOS_COM_SUBTIPO.includes(tipoAtual)) {
    form.setValue('subtipo', undefined);
  }
  // Auto-set categoria "cliente" APENAS na criacao, nao na edicao
  if (!initialData && TIPOS_CATEGORIA_CLIENTE.includes(tipoAtual)) {
    form.setValue('categoria', 'cliente');
  }
}, [tipoAtual, form, initialData]);
```

### 2. Reverter as 7 atividades no banco (migration SQL)

```sql
UPDATE atividades
SET categoria = 'imobiliaria'
WHERE id IN (
  'd4595310-376c-4325-8710-d098e7bfa2e4',
  'a4c286d8-a326-4a28-9008-b0f5beb01c42',
  'aab4c256-82ee-42f3-aa17-21b99abfdaaa',
  'a5b5bc77-9298-4901-995e-45b6b407fd5c',
  '7e084075-5316-4d7d-932f-1ea72b50f454',
  '1d8960b2-c3c0-47c3-a23b-b01693caf1a2',
  'bc2af93c-33ef-49fb-b0e1-297a8fdae27f'
);
```

### Resultado esperado
- Bug corrigido: editar uma atividade existente nao sobrescreve mais a categoria
- Dados restaurados: as 7 atividades voltam a ter categoria "imobiliaria"


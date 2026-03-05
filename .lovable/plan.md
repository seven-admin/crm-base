

# Plano Completo: 3 Frentes

## 1. Migração SQL — `send_campanha` default + `cod_sorteio` com geração automática

Uma única migração contendo:

- `ALTER TABLE corretores ALTER COLUMN send_campanha SET DEFAULT '1'`
- `ADD COLUMN cod_sorteio text UNIQUE`
- Função `generate_cod_sorteio()` — formato `0000-X0X0-XXXX` (D=dígito, X=letra maiúscula)
- Trigger `BEFORE INSERT` (`set_cod_sorteio`) para gerar automaticamente
- Backfill: `UPDATE corretores SET cod_sorteio = generate_cod_sorteio() WHERE cod_sorteio IS NULL`

Exatamente conforme o plano já aprovado anteriormente.

## 2. Corrigir `useNegociacoesKanban` — campos faltantes (inclui `created_at`)

**Arquivo**: `src/hooks/useNegociacoes.ts` (linhas 163-177)

O select atual não inclui `created_at`, `corretor_id`, `corretor`, `imobiliaria`, nem outros campos que o `NegociacaoDetalheDialog` precisa. Adicionar:

```
created_at,
corretor_id,
corretor:corretores(id, nome_completo),
imobiliaria_id,
imobiliaria:imobiliarias(id, nome),
valor_entrada,
data_previsao_fechamento,
observacoes
```

E expandir o join de `cliente` para incluir `email, telefone, cpf`.

## 3. Campo `qtd_corretores` para atividades de ligação (imobiliária/corretor)

### a) Migração SQL
```sql
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS qtd_corretores integer;
```

### b) Formulário (`AtividadeForm.tsx`)
- Adicionar `qtd_corretores` ao schema Zod (`.coerce.number().int().min(1).optional()`)
- Exibir campo "Qtd. Corretores informados" quando `tipo === 'ligacao'` e `categoria` é `'imobiliaria'` (ligação para imobiliárias/corretores)
- No `handleSubmit`, incluir `qtd_corretores` no payload quando aplicável

### c) Detalhe (`AtividadeDetalheDialog.tsx`)
- Exibir o valor de `qtd_corretores` no dialog de detalhe quando presente

## Arquivos afetados

| Arquivo | Alteração |
|---|---|
| Migração SQL | `send_campanha` default, `cod_sorteio` (função + trigger + backfill), `qtd_corretores` na tabela atividades |
| `src/hooks/useNegociacoes.ts` | Expandir select do `useNegociacoesKanban` |
| `src/components/atividades/AtividadeForm.tsx` | Campo `qtd_corretores` para ligações |
| `src/components/atividades/AtividadeDetalheDialog.tsx` | Exibir `qtd_corretores` |
| `src/types/atividades.types.ts` | Adicionar `qtd_corretores` às interfaces |


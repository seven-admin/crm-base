
# Plano Completo — Implementado ✅

## 1. Migração SQL ✅
- `send_campanha` default `'1'` em `corretores`
- Coluna `cod_sorteio` (text, unique) com função `generate_cod_sorteio()` formato `0000-X0X0-XXXX`
- Trigger `BEFORE INSERT` para geração automática
- Backfill para corretores existentes
- Coluna `qtd_corretores` (integer) em `atividades`

## 2. Kanban de Negociações — `created_at` e campos faltantes ✅
- `useNegociacoesKanban` expandido com `created_at`, `corretor`, `imobiliaria`, `valor_entrada`, `observacoes`, etc.

## 3. Campo `qtd_corretores` para ligações ✅
- Formulário: campo visível quando `tipo=ligacao` + `categoria=imobiliaria`
- Detalhe: exibição no dialog
- Tipos: `Atividade` e `AtividadeFormData` atualizados


# Corrigir Filtro de Comprador Historico e Ajustar Fluxo de Contrato

## Problema 1: Comprador Historico ainda aparece nas listagens de clientes

O filtro em `useClientes.ts` usa `.neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')` -- sem acentos. Porem o banco armazena com acentos: `COMPRADOR HISTÓRICO (PRÉ-SISTEMA)`. Por isso o filtro nao funciona.

O mesmo problema existe em `useClientesSelect.ts` que usa `.not('nome', 'ilike', 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)')` -- esse funciona porque usa `ilike` com os acentos corretos.

### Solucao

**Arquivo: `src/hooks/useClientes.ts`**

Substituir todos os `.neq('nome', 'COMPRADOR HISTORICO (PRE-SISTEMA)')` por `.not('nome', 'ilike', '%COMPRADOR HISTÓRICO%')` nas seguintes queries:
- `useClientes` (linhas 69, 89)
- `useClientesPaginated` (linhas 126, 151, 172)

Sao 5 ocorrencias no total, todas com o mesmo problema: texto sem acentos.

## Problema 2: Remover auto-criacao de contrato e permitir geracao manual

O usuario solicitou que ao ganhar a proposta, o contrato NAO seja criado automaticamente. Em vez disso, a negociacao deve ficar "apta" para o usuario clicar em "Gerar Contrato" manualmente (o que ja importa as condicoes de pagamento).

### Situacao atual

- Ja existe `useConverterPropostaEmContrato` (linha 790 do useNegociacoes.ts) que faz tudo correto: cria contrato, copia unidades, copia condicoes de pagamento da negociacao, busca template, atualiza status para "convertida".
- Ja existe o botao "Gerar Contrato" no `KanbanCard.tsx` (linha 178) e no `PropostaDialog.tsx` (linha 406), mas so aparece quando `status_proposta === 'aceita'`.
- O problema: quando o incorporador aprova, o status vai para `aprovada_incorporador`, nao `aceita`. Entao o botao nunca aparece E o contrato e auto-criado.

### Solucao

1. **Arquivo: `src/hooks/useNegociacoes.ts`**
   - `useAprovarPropostaIncorporador` (linhas 452-479): Remover todo o bloco de auto-criacao de contrato.
   - `useMoverNegociacao` (linhas 1220-1260): Remover todo o bloco de auto-criacao de contrato.
   - No `MoverNegociacaoDialog.tsx`, remover o aviso "Um contrato sera criado automaticamente" e substituir por "Apos confirmar, voce podera gerar o contrato manualmente."

2. **Arquivo: `src/components/negociacoes/KanbanCard.tsx`**
   - Alterar a condicao do botao "Gerar Contrato" (linha 178) de `status_proposta === 'aceita'` para incluir tambem `aprovada_incorporador`:
   ```text
   {['aceita', 'aprovada_incorporador'].includes(negociacao.status_proposta || '') && onGerarContrato && !negociacao.contrato_id && (
   ```

3. **Arquivo: `src/components/negociacoes/PropostaDialog.tsx`**
   - Atualizar a condicao `isAceita` para incluir `aprovada_incorporador`:
   ```text
   const isAceita = negociacao?.status_proposta === 'aceita' || negociacao?.status_proposta === 'aprovada_incorporador';
   ```

Dessa forma, quando uma proposta for aprovada pelo incorporador (status = `aprovada_incorporador`), o botao "Gerar Contrato" aparece no card e no dialog. Ao clicar, o `useConverterPropostaEmContrato` existente executa toda a logica de criacao com importacao de condicoes de pagamento.

## Resumo de arquivos modificados

1. `src/hooks/useClientes.ts` -- corrigir filtro de acentos (5 ocorrencias)
2. `src/hooks/useNegociacoes.ts` -- remover auto-criacao de contrato em 2 hooks
3. `src/components/negociacoes/MoverNegociacaoDialog.tsx` -- atualizar mensagem informativa
4. `src/components/negociacoes/KanbanCard.tsx` -- expandir condicao do botao "Gerar Contrato"
5. `src/components/negociacoes/PropostaDialog.tsx` -- expandir condicao `isAceita`

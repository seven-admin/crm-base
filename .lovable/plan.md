

# Correção: Erro RLS ao Salvar Solicitação de Reserva (Corretor)

## Diagnóstico

O erro "Você não tem permissão para esta ação" (RLS) ocorre no fluxo de criação de solicitação de reserva. A causa raiz:

1. O hook `useCriarSolicitacao` insere um **cliente** e uma **negociação** usando `.select().single()` (INSERT + SELECT na mesma operação)
2. A política de SELECT da tabela `clientes` exige `corretor_id IN (get_corretor_ids_by_user(auth.uid()))` -- se `corretor_id` for NULL, o SELECT falha
3. Mesma lógica na tabela `negociacoes` -- o SELECT exige que `corretor_id` corresponda ao corretor do usuário logado
4. O `SolicitarReservaDialog` passa `corretorId: meuCorretor?.id` -- se o hook `useMeuCorretor()` ainda não carregou ou o corretor não tem `user_id` vinculado, o valor é `undefined`, gerando `NULL` no banco

Evidência: existem corretores ativos com `user_id = NULL` na tabela `corretores` (ex: TANIA MORAES), o que faz `useMeuCorretor()` não encontrar o registro.

## Correções

### 1. `src/components/portal/SolicitarReservaDialog.tsx`
- Desabilitar botão "Enviar" enquanto `meuCorretor` não estiver carregado
- Exibir mensagem de erro clara se `meuCorretor` for null (corretor não vinculado ao usuário)

### 2. `src/hooks/useSolicitacoes.ts`
- Adicionar validação no `mutationFn`: se `corretorId` estiver ausente, lançar erro amigável ("Seu usuário não está vinculado a um cadastro de corretor") em vez de deixar o RLS bloquear silenciosamente
- Remover `.select().single()` do INSERT de `negociacao_unidades` e `negociacao_historico` (não precisam retornar dados)

### 3. `src/components/portal/PainelSolicitacaoPortal.tsx`
- Arquivo não está sendo importado em nenhum lugar (componente órfão), mas por segurança: adicionar `corretorId` e `imobiliariaId` via `useMeuCorretor` caso volte a ser utilizado

### Resultado
- Corretor com cadastro vinculado: fluxo funciona normalmente
- Corretor sem cadastro vinculado: mensagem clara "Seu cadastro de corretor não está vinculado. Contate o administrador." em vez de erro genérico de permissão


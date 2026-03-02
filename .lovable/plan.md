

# Permitir Gestores de Produto reabrir atividades

## Problema

Atualmente, apenas usuarios com role `super_admin` podem acessar o botao "Alterar Status da Atividade" no dialog de detalhes. Gestores de produto (`gestor_produto`) precisam tambem ter essa permissao.

## Solucao

Alterar a condicao `canAlterStatus` no arquivo `AtividadeDetalheDialog.tsx` para incluir o role `gestor_produto`.

**Arquivo:** `src/components/atividades/AtividadeDetalheDialog.tsx`

- Linha 105: Mudar de:
  ```typescript
  const canAlterStatus = role === 'super_admin';
  ```
  Para:
  ```typescript
  const canAlterStatus = role === 'super_admin' || role === 'gestor_produto';
  ```

- Atualizar o label da secao de "Acoes de Administrador" para "Acoes de Gestao" (mais adequado ao novo publico)

Isso eh suficiente pois o `AlterarStatusAtividadeDialog` ja oferece todas as opcoes de status (pendente, concluida, cancelada) exceto o atual, e o hook `useAlterarStatusAtividade` nao tem restricao de role no frontend. A alteracao fica registrada no historico automaticamente via trigger no banco.

## Resumo

- **1 arquivo**: `src/components/atividades/AtividadeDetalheDialog.tsx`
  - Incluir `gestor_produto` na condicao `canAlterStatus`
  - Ajustar label da secao


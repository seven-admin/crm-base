

# Permitir super_admins aprovarem solicitações de vínculo

## Situação atual
- Apenas o **gestor da imobiliária** pode aprovar/rejeitar corretores pendentes (no portal `PortalCorretoresGestao.tsx`)
- A página admin `/corretores` mostra badges de status (Pendente, Vinculado, Rejeitado, Autônomo) mas **não tem botões de ação**
- Super admins e usuários do sistema não conseguem aprovar solicitações

## Solução

### `src/pages/Corretores.tsx`
Na coluna "Vínculo" da tabela, quando `status_vinculo === 'pendente'`:
- Adicionar botões **Aprovar** (CheckCircle) e **Rejeitar** (XCircle) ao lado do badge
- Ao aprovar: `UPDATE corretores SET status_vinculo = 'ativo', is_active = true WHERE id = ?` + ativar profile
- Ao rejeitar: `UPDATE corretores SET status_vinculo = 'rejeitado' WHERE id = ?`
- Visível para super_admin e usuários com permissão de edição no módulo corretores (`canAccessModule('corretores', 'edit')`)

### Arquivos a modificar
- `src/pages/Corretores.tsx` — adicionar botões aprovar/rejeitar para pendentes na tabela admin

Nenhuma migration necessária — as colunas e permissões já existem.


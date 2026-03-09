

# Implementar CRUD completo na aba Inscritos

## Problema
O arquivo `EventoInscritosTab.tsx` contém apenas a listagem read-only. O CRUD (adicionar, editar, excluir, alternar status) não foi aplicado.

## Solução

Reescrever `src/components/eventos/EventoInscritosTab.tsx` com:

1. **Botão "Adicionar Inscrito"** no header — abre Dialog com formulário (nome, telefone, email, imobiliária)
2. **Botão Editar** por linha — abre Dialog de edição com os mesmos campos
3. **Botão Excluir** por linha — AlertDialog de confirmação, executa DELETE
4. **Botão Alternar Status** por linha — toggle entre "confirmada" e "cancelada" via UPDATE
5. Todas as mutations invalidam `['evento-inscricoes-admin', eventoId]`

### Componentes usados
- `Dialog` para formulário de adicionar/editar
- `AlertDialog` para confirmar exclusão
- `useMutation` do React Query para cada operação
- `Input`, `Button`, `Badge`, `Table` já existentes no projeto

### Arquivo afetado
- `src/components/eventos/EventoInscritosTab.tsx` — reescrever com CRUD completo


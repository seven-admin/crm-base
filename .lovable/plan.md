## Ajustes Arqo e Nexa

### 1. Arqo — Membros do grupo de atendimento
Arquivo: `src/components/arqo/ArqoGrupoMembros.tsx`

Hoje o select "Usuário" usa `useAllProfiles()`, que traz todos os perfis ativos (incluindo corretores, seven, etc.).

Mudança:
- Filtrar apenas perfis com `empresa = 'arqo'` (consultores/executivos da Arqo).
- Criar um novo hook `useProfilesByEmpresa(empresa)` em `src/hooks/useFuncionariosSeven.ts` (ou arquivo dedicado) e utilizá-lo no componente.
- Query: `profiles` where `empresa = 'arqo'` and `is_active = true`.

### 2. Nexa — Unidades disponíveis com status editável
Arquivo: `src/pages/nexa/NexaDisponibilidade.tsx` + `src/hooks/useNexa.ts`

Hoje a página lista somente unidades com `status = 'disponivel'` (via RPC `get_unidades_disponiveis` com filtro `['disponivel']`) e mostra o status como Badge estático.

Mudança:
- Trazer todos os status (remover o filtro `p_status: ['disponivel']` ou passar todos: `['disponivel','reservada','negociacao','contrato','vendida','bloqueada']`) para que o admin visualize o mapa completo.
- Substituir o `<Badge>` da coluna Status por um `<Select>` inline com as opções: disponível, reservada, negociação, contrato, vendida, bloqueada. Manter Badge (não editável) para usuários não-admin.
- Permissão de edição: usuários com `empresa = 'nexa'` E role admin/super_admin (usar `useEmpresaAccess` + `isAdmin` já disponível no `AuthContext`/hooks).
- Criar mutation `useUpdateUnidadeStatus` em `useNexa.ts` que faz `update` em `seven_unidades` e registra um evento (opcional, sem visita associada — apenas invalida caches de disponibilidade).
- Após alterar, invalidar `['nexa', 'unidades-disp']` para refletir imediatamente.

### Observações
- Manter o comportamento existente do fluxo de reservar/vender via `UnidadeAcaoDialog` (dentro de visita) intacto — esta é uma edição direta administrativa, paralela.
- Sem mudanças de schema: `seven_unidades.status` já aceita todos os valores.

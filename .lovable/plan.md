# Plano de modificações

## 1. Clientes — exclusão (super admin) e em lote
- Em `src/pages/Clientes.tsx` (tabela): adicionar coluna de checkbox por linha + checkbox "selecionar todos" no header, visível apenas para super admin (`useIsSuperAdmin`).
- Barra de ações flutuante quando houver seleção: "Excluir selecionados (N)" com confirmação (AlertDialog).
- Hook `useDeleteClientesBulk`: chama `supabase.from('seven_clientes').delete().in('id', ids)` em blocos de 100.
- Botão de exclusão individual (ícone lixeira) na linha, também restrito a super admin.
- RLS: verificar se já existe policy DELETE para super admin em `seven_clientes`; se não, adicionar via migration.

## 2. Selects/formulários — remover destaque laranja residual
- Auditar `src/components/ui/select.tsx`, `command.tsx`, `dropdown-menu.tsx`, `toggle.tsx`, `radio-group.tsx`, `checkbox.tsx` procurando classes `accent`, `orange`, `[hsl(...)]` hardcoded.
- Substituir estados `data-[state=checked]`, `data-[highlighted]`, `focus:` por tokens `primary`/`ring` (azul institucional #198EF4) — o accent laranja fica reservado só para CTAs.
- Varrer formulários grandes (Cliente, Empreendimento, Arqo, Nexa) por `bg-accent`, `text-accent`, `border-accent` indevidos em selects/inputs.

## 3. Rotas 404: `/imobiliarias` e `/corretores`
- Menu Seven aponta para `/n` (placeholder). Criar as páginas e rotas:
  - `src/pages/Imobiliarias.tsx` — listagem em tabela de `seven_imobiliarias` (nome, cidade/UF, gestor, corretores vinculados, ativo) + CRUD via dialog.
  - `src/pages/Corretores.tsx` — listagem de `seven_corretores` (nome, CRECI, imobiliária, cidade, status) + CRUD via dialog e vínculo com imobiliária.
- Registrar rotas em `src/App.tsx`:
  ```
  <Route path="/imobiliarias" element={<ProtectedRoute moduleName="imobiliarias"><Imobiliarias /></ProtectedRoute>} />
  <Route path="/corretores" element={<ProtectedRoute moduleName="corretores"><Corretores /></ProtectedRoute>} />
  ```
- Atualizar `AppTopbar.tsx` (mega-menu Seven) trocando `path: '/n'` pelas rotas reais.

## 4. Sistema de Roleta Arqo (completo)
Hoje existe a página `/arqo/roleta` (puxar próximo lead) e a RPC `arqo_atribuir_lead_roleta`, mas falta a gestão de grupos/membros/regras. Entregar:

### 4a. Gestão de grupos e membros (frontend `/arqo/config` aba Grupos)
- Substituir o placeholder "membros gerenciados via SQL" por CRUD real de `arqo_grupo_membros`:
  - Adicionar/remover membros (select de usuários com role Arqo).
  - Definir `papel` (consultor/supervisor), `ordem_roleta` (drag & drop) e `is_active`.
- Regras por grupo: modo de distribuição (`roleta` | `manual`), horário de atendimento (janela), SLA de primeira resposta em minutos.

### 4b. Importação de leads em lote (falta atualmente)
- Aba nova "Importar" em `/arqo/config` (ou botão em `/arqo/leads`): upload CSV com colunas nome, telefone, email, origem, empreendimento, valor_estimado.
- Preview + validação + insert em massa em `arqo_leads` com atribuição automática via roleta se um grupo for escolhido.

### 4c. Motor de distribuição
- RPC/edge function `arqo_distribuir_lead_automatico(lead_id)`: aplica a RPC existente respeitando janela de atendimento e SLA; log em `arqo_lead_events`.
- Trigger opcional em `arqo_leads` (AFTER INSERT) para chamar a distribuição quando o lead vier com `grupo_id`.

### 4d. Página `/arqo/roleta` (melhorias)
- Painel do supervisor (quem tem papel supervisor no grupo): ver todos os leads ativos do grupo, reatribuir, forçar liberação.
- Contador de SLA por lead (tempo desde `atribuido_em`) com alerta visual quando estourar.
- Histórico curto do lead atual (últimos eventos de `arqo_lead_events`).

## 5. Reestruturar controle de Usuários
- Em `src/pages/Usuarios.tsx`:
  - Listagem em tabela com colunas: nome, email, roles (badges), último login, ativo/inativo.
  - Seleção em lote (checkbox) com ação "Excluir selecionados" (super admin).
  - Ação "Criar novo usuário": dialog com nome, email, roles, empreendimentos vinculados; chama edge function admin (usa `service_role`) para `auth.admin.createUser` + insert em `profiles`/`user_roles`.
  - Ação "Excluir usuário": edge function `admin-delete-user` que remove de `auth.users` e limpa referências (`profiles`, `user_roles`, `sistema_user_empreendimentos`, etc.).
  - Ação "Redefinir senha" já existente permanece.
- Novas edge functions:
  - `admin-create-user` (verify_jwt=false, valida super admin no código via JWT).
  - `admin-delete-user` (idem).
  - `admin-delete-users-bulk` (recebe array de ids).

## Detalhes técnicos

- Todas as ações destrutivas em lote validam super admin no backend (edge function) além do frontend.
- Migrations necessárias:
  - Policies DELETE para super admin em `seven_clientes` (se ausente).
  - Coluna `sla_primeira_resposta_min` e `janela_atendimento` (jsonb) em `arqo_grupos_atendimento` (se ausentes).
- Nenhum novo secret é necessário — as edge functions admin usam `SUPABASE_SERVICE_ROLE_KEY` já configurado.

## Ordem de execução sugerida
1. Migration (RLS + colunas de grupo).
2. Edge functions admin (create/delete/bulk user + import leads).
3. Rotas e páginas Imobiliárias/Corretores.
4. Refactor de Usuários e Clientes (exclusão em lote).
5. Roleta Arqo (gestão de grupos, importação, painel supervisor).
6. Sweep visual dos selects para remover laranja residual.

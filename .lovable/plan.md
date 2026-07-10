## Reestruturação da Roleta Arqo + Kanban por usuário + nova página Admin

### 1. Nova página: `/arqo/admin` (visão gerencial)

Nova rota `ArqoAdmin.tsx` — dashboard consolidado para super_admin / arqo_admin / arqo_gestor:

- KPIs no topo: total de leads ativos, leads sem atribuição, leads em atendimento, ganhos/perdidos no mês, tempo médio de atendimento.
- Tabela por grupo: nome, membros ativos, leads na fila, leads em atendimento, ganhos/perdidos.
- Tabela por consultor: nome, lead ativo atual, total atendidos, taxa de conversão, última atividade.
- Distribuição por etapa (mini funil) e por temperatura.
- Reutiliza `useArqoLeads`, `useArqoGrupos`, `useArqoEtapas`; sem novos endpoints.
- Registrada em `App.tsx` e no menu Arqo do `AppTopbar`, com gate por role/empresa.

### 2. Refatorar `/arqo/roleta` (visão operacional do consultor)

Página passa a mostrar SÓ o que é do próprio usuário:

- **Topo — mini dash de grupos do usuário**: cards horizontais, um por grupo do qual ele é membro ativo, mostrando `nome do grupo` + `nº de leads aguardando atendimento` (leads sem consultor no grupo). Sem listar os leads da fila.
- Em cada card, botão **"Puxar próximo lead"** (chama `arqo_atribuir_lead_roleta` daquele grupo). Botão desabilitado se o usuário já tem lead ativo.
- **Painel de atendimento** (só aparece quando `meuLeadAtivo` existe): dados do lead + ações — Sem resposta, mover etapa, Ganho, Perder, Liberar. 
- **Novo campo obrigatório**: textarea **"Observação do atendimento"** acompanha cada ação (sem resposta / transição / ganho / perda / liberar). Enviado como `p_comentario` para as RPCs `arqo_registrar_tentativa` e `arqo_transicionar_status`, e como novo parâmetro em `arqo_liberar_consultor`.
- Remove por completo o painel lateral "Fila do grupo" com os leads listados.
- Remove o `<Select>` de grupo global — a interação passa a ser por card de grupo.

**Sobre o botão "Liberar"**: hoje ele chama a RPC `arqo_liberar_consultor` que zera `consultor_id` do lead (devolvendo-o à fila do grupo) e registra evento `liberacao_consultor`. O lead NÃO muda de etapa nem é encerrado — volta a ficar disponível para outro consultor puxar. Vou manter o comportamento e apenas passar a exigir observação.

### 3. Kanban `/arqo/leads` filtrado por usuário

- `useArqoLeads` já aceita `consultorId`. Em `ArqoLeadsKanban.tsx`, ler o usuário atual + suas roles:
  - super_admin / admin / arqo_admin / arqo_gestor → sem filtro (vê todos).
  - demais usuários → passa `consultorId = user.id`.
- Botão "Importar CSV" continua visível só para perfis com permissão de criação.

### Detalhes técnicos

- Ajuste na RPC `arqo_liberar_consultor` (migration): aceitar `p_comentario text default null` e gravá-lo no evento.
- Ajustes nos hooks `useLiberarConsultor` para receber `{ leadId, comentario }`.
- Roles verificadas via `useAuth` + `useEmpresaAccess` já existentes.
- Membros do grupo do usuário: query em `arqo_grupo_membros` filtrando `user_id = auth.uid()` + `is_active`.

### Arquivos afetados

```text
NOVO  src/pages/arqo/ArqoAdmin.tsx
EDIT  src/pages/arqo/ArqoRoleta.tsx        (reescrita)
EDIT  src/pages/arqo/ArqoLeadsKanban.tsx   (filtro por consultor)
EDIT  src/hooks/useArqo.ts                 (useLiberarConsultor + hook meus grupos)
EDIT  src/App.tsx                          (rota /arqo/admin)
EDIT  src/components/layout/AppTopbar.tsx  (item de menu Admin Arqo)
SQL   arqo_liberar_consultor com p_comentario
```

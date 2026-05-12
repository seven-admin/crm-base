# SISTEMA_PROMPTS.md — Guia de recriação modular do CRM Imobiliário

> Este documento contém uma sequência de prompts otimizados para o **Lovable** recriar este sistema do zero, módulo por módulo. Cada prompt depende do anterior. Cole-os **um de cada vez** e valide o critério de aceite antes de seguir.

---

## 1. Visão geral do sistema

**O que é:** CRM imobiliário B2B usado por incorporadoras para gerir o ciclo completo de venda de unidades — do atendimento (atividade comercial) até a assinatura do contrato — com módulos auxiliares de Marketing, Financeiro, Comissões, Eventos, Planejamento e Portais externos (Imobiliárias e Incorporador).

**Stack obrigatória:**
- React 18 + Vite + TypeScript
- Tailwind CSS v3 + shadcn/ui (tokens HSL semânticos no `index.css`)
- React Router v6 (lazy routes)
- TanStack React Query v5
- Lovable Cloud (Supabase) — Auth, Postgres, Storage, Edge Functions
- date-fns + zod + react-hook-form

**Multi-tenant lógico:** quase toda tabela operacional carrega `empreendimento_id` (uuid). Filtros de RLS, dashboards e seletores giram em torno disso.

**Tamanho final esperado:** ~60 páginas, ~110 hooks, ~95 tabelas, ~12 edge functions.

---

## 2. Convenções globais (anexar a TODO prompt)

Cole este bloco no fim de **cada** prompt da seção 3:

> **Convenções obrigatórias do projeto:**
> - Toda comunicação, labels, mensagens de erro e nomes de páginas em **português do Brasil**.
> - Datas: filtros no banco usam string `'yyyy-MM-dd'`. No frontend, use o utilitário `parseDateLocal` (criar em `src/utils/date.ts`) para evitar problemas de fuso. Nunca use `new Date('yyyy-MM-dd')` diretamente.
> - Toda FK que aponta para um usuário deve referenciar `public.profiles(id)`, **nunca** `auth.users`.
> - Roles ficam em tabela separada `public.user_roles` com enum `app_role`. Use a função `public.has_role(uuid, app_role)` SECURITY DEFINER nas políticas de RLS.
> - **Nunca** envie objetos aninhados de JOIN ao Supabase em `update` / `insert` — remova chaves relacionadas antes de submeter.
> - Cores **sempre** via tokens semânticos HSL no `index.css` + `tailwind.config.ts`. Proibido usar classes como `text-white`, `bg-black` direto em componentes.
> - RLS habilitado em **todas** as tabelas públicas.
> - Strings vazias em FKs devem virar `null` antes de gravar (evita erro de RLS).
> - Toasts: usar `sonner` para feedback. Erros de banco devem passar por um sanitizador antes de exibir ao usuário.
> - Hooks de dados em `src/hooks/use*.ts`, sempre com React Query (`useQuery`, `useMutation`).
> - Páginas em `src/pages/<Nome>.tsx`. Layout principal: `<MainLayout>` com sidebar lateral.

---

## 3. Sequência de prompts

Cada prompt segue o template:

```
### Prompt N — <Nome>
Depende de: ...
Entrega: ...
Prompt:
> <texto pronto para colar>
Critério de aceite: ...
```

---

### Prompt 1 — Fundação (Auth, Design System, Sidebar, Roles)

**Depende de:** nada.
**Entrega:** Lovable Cloud habilitado; tabelas `profiles`, `roles`, `user_roles`, `role_permissions`, `modules`; páginas `Auth`, `Index`, `SemAcesso`, `ResetPassword`; layout com sidebar lateral; tema light/dark com tokens semânticos.

**Prompt para o Lovable:**

> Quero iniciar um CRM imobiliário multi-empreendimento. Habilite o Lovable Cloud e configure:
>
> 1. **Design system** em `src/index.css` e `tailwind.config.ts`:
>    - Tokens HSL: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`.
>    - Paleta principal: laranja `#F26F21` como `--primary` (em HSL).
>    - Modo claro e escuro com bom contraste.
>    - Inclua `--gradient-primary`, `--shadow-elegant`, `--radius`.
>
> 2. **Auth com Lovable Cloud:** página `/auth` com login por email/senha (sem confirmação de email), página `/reset-password`, fluxo "Esqueci minha senha" via `supabase.auth.updateUser`.
>
> 3. **Banco de dados:**
>    - `profiles(id uuid pk = auth.users.id, nome text, email text, telefone text, avatar_url text, ativo bool default true, created_at, updated_at)` com trigger `handle_new_user` que insere o profile no signup.
>    - Enum `app_role` com valores: `super_admin`, `gestor_produto`, `gerente_comercial`, `corretor_interno`, `marketing`, `financeiro`, `incorporador`, `corretor_externo`.
>    - `user_roles(id, user_id → profiles, role app_role, unique(user_id, role))`.
>    - Função `public.has_role(_user_id uuid, _role app_role)` SECURITY DEFINER STABLE retornando bool.
>    - `roles` (catálogo customizável de papéis), `modules` (módulos do sistema), `role_permissions(role_id, module_id, can_view, can_edit, can_delete)`.
>    - RLS em todas as tabelas. `profiles` legível por usuários autenticados.
>
> 4. **Layout:**
>    - `MainLayout` com sidebar colapsável (shadcn `sidebar`) à esquerda, header superior com bell de notificações e avatar.
>    - `ProtectedRoute` que valida sessão e role.
>    - Rota `/` redireciona conforme role; rota `/sem-acesso` para usuários sem permissão.
>    - Lazy-load de todas as páginas via `React.lazy + Suspense`.
>
> 5. **React Query:** `QueryClient` com `staleTime: 2min`, `gcTime: 10min`, `refetchOnWindowFocus: false`, `retry: 1`.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** consigo me cadastrar, logar, ver a sidebar vazia e a tela `/sem-acesso` quando não tenho role.

---

### Prompt 2 — Cadastros básicos (Incorporadoras, Imobiliárias, Corretores)

**Depende de:** 1.
**Entrega:** páginas `/incorporadoras`, `/imobiliarias`, `/corretores`; tabelas `incorporadoras`, `imobiliarias`, `corretores`; edges `register-imobiliaria`, `register-corretor`, `create-corretor`, `delete-imobiliaria`.

**Prompt para o Lovable:**

> Adicione os cadastros básicos do CRM imobiliário:
>
> 1. **`incorporadoras`**: razao_social, nome_fantasia, cnpj (único, validado), logo_url, cores primária/secundária, endereço completo, telefone, email, ativo.
> 2. **`imobiliarias`**: razao_social, nome_fantasia, cnpj, creci, responsavel_id → profiles, endereço, telefone, email, comissao_padrao numeric, ativo.
> 3. **`corretores`**: nome_completo, cpf, creci, telefone, email, cidade, estado, tipo (`autonomo` | `vinculado`), imobiliaria_id (nullable), user_id → profiles (nullable, criado quando ativam acesso ao portal), ativo, foto_url.
>    - Regras de validação rigorosas: nome com pelo menos sobrenome, CPF formatado, CRECI obrigatório.
>    - RPC `herdar_cidade_imobiliaria` para autopreencher cidade quando vincular a uma imobiliária.
>    - Super admin pode criar autônomo sem imobiliária; demais usuários não.
> 4. **Páginas:** listagem com busca, filtros, paginação; modal de criar/editar; ação de inativar (soft delete via `ativo=false`).
> 5. **Edge functions:**
>    - `register-imobiliaria` (público, sem JWT) — cadastro externo de imobiliária.
>    - `register-corretor` (público) — autocadastro de corretor; dispara webhook ao n8n.
>    - `create-corretor` (autenticada) — cria corretor + opcionalmente convida user.
>    - `delete-imobiliaria` (autenticada) — exclui em cascata.
> 6. **RLS:** super_admin tudo; gerentes leem todos; corretor lê o próprio registro.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** consigo criar uma incorporadora, uma imobiliária vinculada, e um corretor vinculado àquela imobiliária.

---

### Prompt 3 — Empreendimentos e estrutura física

**Depende de:** 1, 2.
**Entrega:** páginas `/empreendimentos`, `/empreendimentos/:id` (detalhe com abas), `/empreendimentos/:id/mapa`; tabelas `empreendimentos`, `blocos`, `tipologias`, `unidades`, `boxes`, `fachadas`, `mapa_empreendimento`, `unidade_historico_precos`, `empreendimento_corretores`, `empreendimento_imobiliarias`, `empreendimento_midias`, `empreendimento_documentos`.

**Prompt para o Lovable:**

> Adicione o módulo de Empreendimentos.
>
> 1. **`empreendimentos`**: nome, slug, incorporadora_id, tipo (`predio` | `loteamento`), endereco, cidade, estado, status_obra, data_lancamento, previsao_entrega, descricao, capa_url, cor_primaria, cor_secundaria, gestor_id → profiles, rt_id → profiles (responsável técnico), ativo bool (default true — quando false oculta de listagens globais), rodape_relatorios text (texto exibido no PDF de disponibilidade).
> 2. **`blocos`** (nome, ordem, empreendimento_id), **`tipologias`** (nome, area_privativa, area_total, num_quartos, num_suites, num_vagas, planta_url), **`unidades`** (numero, andar, bloco_id, tipologia_id, area, valor_tabela, valor_atual, status enum: `disponivel|reservada|vendida|bloqueada|permuta`, posicao_x, posicao_y, observacoes). **Hard delete** em unidades (não inativa).
>    - Trigger `trg_set_data_venda` que preenche `data_venda` quando status muda para `vendida`.
>    - `unidade_historico_precos` registra mudanças de valor.
> 3. **`boxes`** (vagas de garagem), **`fachadas`** (orientação solar de cada unidade), **`mapa_empreendimento`** (SVG/posicionamento visual).
> 4. **Junções:** `empreendimento_corretores`, `empreendimento_imobiliarias` (quem pode vender), `empreendimento_midias` (galeria), `empreendimento_documentos`.
> 5. **Página detalhe** com abas: Visão Geral, Unidades (tabela + filtros), Mapa (visualização SVG drag/drop por super_admin), Mídias, Documentos, Equipe, Configurações.
> 6. **Mapa de Unidades** (`/empreendimentos/:id/mapa`): grade ou planta editável; cores por status; export PDF com `rodape_relatorios`. Adapta UI para `loteamento` (lotes) vs `predio` (andares).
> 7. **Sincronização visual:** utilitário `EmpreendimentoColors` aplica `cor_primaria` como tema dinâmico ao navegar.
> 8. **RLS:** leitura para qualquer usuário com vínculo via `user_empreendimentos` (criada no próximo prompt) ou role super_admin.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** crio empreendimento, adiciono blocos/tipologias, gero unidades em massa, vejo o mapa colorido.

---

### Prompt 4 — Usuários, vínculos e permissões granulares

**Depende de:** 1, 3.
**Entrega:** página `/usuarios`; tabelas `user_empreendimentos`, `user_module_permissions`; edges `create-user`, `delete-user`, `reset-user-password`.

**Prompt para o Lovable:**

> Adicione gestão de usuários:
>
> 1. **`user_empreendimentos`**: user_id → profiles, empreendimento_id → empreendimentos. Define quais empreendimentos cada usuário enxerga.
> 2. **`user_module_permissions`**: user_id, module_id, can_view, can_edit, can_delete — sobrescreve a role.
> 3. **Página `/usuarios`** (apenas super_admin / gerente):
>    - Listagem com role, status, último login.
>    - Modal "Editar usuário" com abas: Dados, Roles, Empreendimentos vinculados, Permissões por módulo.
>    - Botões: criar usuário, resetar senha (via edge), inativar.
> 4. **Edge functions** (todas com JWT do super_admin):
>    - `create-user` — cria em `auth.users` + `profiles` + atribui role e vínculos.
>    - `delete-user` — remove em cascata.
>    - `reset-user-password` — envia link de reset (admin externo).
> 5. Hook `useFuncionariosSeven` filtra usuários internos (oculta corretores externos) para selectors de responsáveis/gestores.
> 6. Super admin pode alterar gestor_id e rt_id de empreendimentos com bypass de triggers de auditoria.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** crio usuário com role gerente_comercial vinculado a 2 empreendimentos; ele só vê esses 2 ao logar.

---

### Prompt 5 — Clientes (PF e PJ)

**Depende de:** 1, 2.
**Entrega:** página `/clientes`; tabelas `clientes`, `cliente_telefones`, `cliente_socios`, `cliente_interacoes`.

**Prompt para o Lovable:**

> Adicione módulo de Clientes:
>
> 1. **`clientes`**: tipo_pessoa (`PF` | `PJ`), nome (PF) / razao_social (PJ), nome_fantasia, cpf (PF), passaporte (PF estrangeiro), nacionalidade, cnpj (PJ), data_nascimento, estado_civil, profissao, email, endereco completo, renda, observacoes, corretor_id, gestor_id, empreendimento_id (vínculo principal), origem_atendimento, ativo, is_placeholder bool (clientes gerados automaticamente para preservar Kanban), is_historico bool (placeholder "Comprador Histórico" para vendas legadas).
>    - Listagens **excluem** `is_historico=true`.
>    - Validação: CPF *xor* Passaporte conforme nacionalidade.
>    - Validação de email duplicado **desativada** (permitir múltiplos cadastros com mesmo email).
> 2. **`cliente_telefones`** (múltiplos números), **`cliente_socios`** (PJ: lista de sócios PF), **`cliente_interacoes`** (timeline manual de contatos).
> 3. **Página:** lista com busca por nome/CPF/CNPJ/email, filtros por empreendimento/corretor/origem, badge PF vs PJ. Modal full-page de criar/editar com abas (Dados, Telefones, Sócios, Interações, Negociações vinculadas).
> 4. **RLS:** corretor lê/cria seus próprios clientes; gerente lê todos do seu empreendimento; INSERT direto liberado para corretores e gestores.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** cadastro cliente PF e PJ, vinculo telefone e sócio, vejo na lista com badge correto.

---

### Prompt 6 — Atividades, Forecast e Diário de Bordo

**Depende de:** 3, 4, 5.
**Entrega:** páginas `/atividades`, `/forecast`, `/diario-bordo`; tabelas `atividades`, `atividade_etapas`, `atividade_responsaveis`, `atividade_comentarios`, `atividade_historico`, `funis`, `funil_etapas`, `tipos_atendimento_config`.

**Prompt para o Lovable:**

> Adicione o coração comercial do CRM: Atividades, Forecast e Diário de Bordo.
>
> **Conceito:**
> - **Atividade** = qualquer atendimento/tarefa (comercial ou operacional). Categorias: `comercial` (gera negociação), `marketing`, `rotina`.
> - **Forecast** = quadro Kanban + pipeline somente-leitura das atividades comerciais. Toda gestão (criar/editar/mover) é feita em `/atividades`.
> - **Diário de Bordo** = dashboard das atividades de rotina/operacional, com abas Resumo (KPIs e volume) e Atividades (lista).
> - **Resumo** ≠ Forecast: "Resumo" = KPIs e volume; "Forecast" = Kanban e pipeline. Use os termos com precisão.
>
> 1. **`funis`** + **`funil_etapas`** (ordem, cor, is_final_sucesso bool, is_visivel_portal bool).
> 2. **`tipos_atendimento_config`** — tipos de atendimento configuráveis por empreendimento.
> 3. **`atividades`**: titulo, descricao, categoria, tipo_atendimento, funil_id, etapa_id, cliente_id (nullable, gera placeholder se necessário), empreendimento_id (**obrigatório**), gestor_id, data_inicio (date), data_fim (date), valor_estimado, origem, destaque bool (estrela visual), prioridade, status (`aberta|concluida|cancelada|recusada`), created_by.
> 4. **`atividade_etapas`** — histórico de movimentações no Kanban.
> 5. **`atividade_responsaveis`** — junção N:N (múltiplos responsáveis).
> 6. **`atividade_comentarios`**, **`atividade_historico`** (audit).
> 7. **Página `/atividades`:**
>    - Tabs: Resumo (mês de competência baseado em `data_inicio`), Lista, Kanban.
>    - Filtro de mês rígido por `data_inicio`. `parseDateLocal` no front.
>    - **Formulário wizard em 3 etapas** (Cliente → Detalhes → Confirmação). Recusar auto-submit no Enter.
>    - Vencimento: avalia `data_fim` em string `yyyy-MM-dd` sem fuso.
>    - Conversão para Proposta exige 13 campos obrigatórios do cliente preenchidos.
> 8. **Página `/forecast`:**
>    - Quadro Kanban somente-leitura por etapa do funil.
>    - Super admin pode alterar status em lote e excluir em lote (Development Gate exige seleção de empreendimento).
>    - Optimistic updates com `onSettled` para evitar flickering.
> 9. **Página `/diario-bordo`:** abas Resumo + Atividades; mesmo dataset filtrado por categoria != comercial.
> 10. **Filtro de responsáveis/gestores:** apenas usuários internos (via `useFuncionariosSeven`).
> 11. **Cálculo de Vendas do Mês (KPI):** filtra por etapas com `is_final_sucesso = true`.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** crio atividade comercial → aparece no Forecast no Kanban; movo entre etapas; converto em proposta (próximo módulo).

---

### Prompt 7 — Negociações, Propostas e Contratos

**Depende de:** 6.
**Entrega:** páginas `/negociacoes`, `/propostas`, `/propostas/nova`, `/contratos`, `/assinar/:token`, `/configuracao-negociacoes`; tabelas `negociacoes`, `negociacao_clientes`, `negociacao_unidades`, `negociacao_condicoes_pagamento`, `negociacao_dacao_anexos`, `negociacao_comentarios`, `negociacao_historico`, `propostas`, `proposta_unidades`, `proposta_condicoes_pagamento`, `modalidades_pagamento`, `modalidade_componentes`, `tipos_parcela`, `template_condicoes_pagamento`, `condicoes_pagamento`, `contratos`, `contrato_unidades`, `contrato_condicoes_pagamento`, `contrato_signatarios`, `contrato_aprovacoes`, `contrato_pendencias`, `contrato_documentos`, `contrato_templates`, `contrato_template_imagens`, `contrato_versoes`, `contrato_variaveis`, `fluxo_aprovacao_config`; edge `webhook-assinatura`.

**Prompt para o Lovable:**

> Adicione o pipeline pós-atendimento: Negociação → Proposta → Contrato → Assinatura.
>
> **Fluxo:**
> Atividade comercial gera **Negociação** (deduplicada por cliente+empreendimento). Negociação tem N propostas; uma é "ativa". Proposta aprovada gera Contrato. Contrato vai para assinatura digital.
>
> 1. **`negociacoes`**: cliente_id, empreendimento_id, corretor_id, gestor_id, etapa_id, valor_total, data_negocio (data técnica para ordenação), status, destaque, created_by, updated_by (auditoria explícita ao gravar).
>    - Sempre `LEFT JOIN cliente` (preserva órfãos).
>    - Filtro de mês usa `data_negocio`.
>    - Movimento no Kanban: exige proposta ativada **exceto** para retornos (etapa de retorno).
> 2. **`negociacao_unidades`**, **`negociacao_clientes`** (PJ pode ter múltiplos compradores), **`negociacao_condicoes_pagamento`**, **`negociacao_dacao_anexos`** (bucket Storage exclusivo `dacao-anexos` para fotos/docs de bens dados em pagamento), **`negociacao_comentarios`**, **`negociacao_historico`**.
> 3. **Propostas (`/propostas/nova` full page, sem modal):** wizard com Unidades, Condições de Pagamento, Resumo. Permite salvar com progresso < 100% (valor de pagamento pendente).
>    - Campo `forma_pagamento` é **bloqueado** quando há dação no método.
>    - `modalidades_pagamento` + `modalidade_componentes` + `tipos_parcela` + `template_condicoes_pagamento` modelam parcelamentos reutilizáveis.
> 4. **Contratos:**
>    - Geração manual permitida em status específicos da proposta.
>    - `contrato_templates` (HTML/Handlebars) + `contrato_variaveis` (catálogo) + `contrato_template_imagens` + `contrato_versoes`.
>    - `fluxo_aprovacao_config` define etapas de aprovação por empreendimento.
>    - `contrato_signatarios` + página pública `/assinar/:token` com edge `webhook-assinatura` que notifica n8n.
> 5. **Página `/configuracao-negociacoes`:** CRUD de funis de venda, modalidades, templates de contrato.
> 6. **Visibilidade no Portal Incorporador:** apenas etapas com `is_visivel_portal=true`.
> 7. **Update/Insert no Supabase:** remover chaves de relacionamento aninhado antes de submeter (TypeScript `RejectExcessProperties`).
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** converto atividade em negociação, crio proposta com 2 unidades + parcelamento misto, gero contrato pelo template, envio para assinatura.

---

### Prompt 8 — Comissões, Bonificações e Metas

**Depende de:** 2, 7.
**Entrega:** páginas `/comissoes`, `/bonificacoes`, `/metas-comerciais`, `/tipos-parcela`; tabelas `configuracao_comissoes`, `comissoes`, `comissao_parcelas`, `bonificacoes`, `usuario_empreendimento_bonus`, `metas_comerciais`, `tipos_parcela`.

**Prompt para o Lovable:**

> Adicione cálculo de comissões e metas:
>
> 1. **`configuracao_comissoes`**: regras por empreendimento (% gerente, % corretor, % imobiliária, % RT, faixas por valor).
> 2. **`comissoes`**: gerada automaticamente quando contrato é assinado; vinculada à negociação; status (`pendente|aprovada|paga|estornada`); valor_bruto, valor_liquido.
> 3. **`comissao_parcelas`**: cronograma de pagamento conforme `tipos_parcela`.
> 4. **`bonificacoes`**: regras de bônus extra (ex: meta atingida, primeira venda do mês).
> 5. **`usuario_empreendimento_bonus`**: bônus específicos por usuário+empreendimento.
> 6. **`metas_comerciais`**: meta mensal por usuário+empreendimento (volume, qtd. unidades, ticket médio).
> 7. **Páginas:** dashboards com cards de KPI, tabelas filtráveis por mês/empreendimento/corretor, ações de aprovar/pagar lote, geração de relatórios.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** ao assinar contrato do prompt 7, comissão aparece em `/comissoes` com parcelas calculadas.

---

### Prompt 9 — Financeiro e DRE

**Depende de:** 3.
**Entrega:** páginas `/financeiro`, `/dre`; tabelas `plano_contas`, `categorias_fluxo`, `centros_custo`, `centro_custo_empreendimentos`, `lancamentos_financeiros`, `saldos_mensais`.

**Prompt para o Lovable:**

> Adicione módulo Financeiro:
>
> 1. **`plano_contas`** (hierarquia receitas/despesas), **`categorias_fluxo`**, **`centros_custo`** + junção N:N com empreendimentos.
> 2. **`lancamentos_financeiros`**: tipo (entrada/saida), valor, data_vencimento, data_pagamento, status, conta_id, centro_custo_id, empreendimento_id, descricao, anexo_url, recorrencia (mensal/anual/único), recorrencia_grupo_id.
>    - **Exclusão recorrente:** ao excluir um lançamento recorrente, oferecer opções de excluir só este, este e futuros (usa `data_vencimento`), ou todos.
>    - **Relatório de Ressarcimento:** filtrar lançamentos por categoria + status + período.
> 3. **`saldos_mensais`**: snapshot por mês/centro de custo.
> 4. **DRE:** demonstrativo agrupado por categoria, comparativo mensal, gráficos.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** crio lançamento recorrente mensal, excluo "este e futuros" e veja DRE atualizado.

---

### Prompt 10 — Marketing, Briefings e Eventos

**Depende de:** 3, 4.
**Entrega:** páginas `/marketing`, `/marketing/calendario`, `/marketing/:id`, `/equipe-marketing`, `/dashboard-marketing`, `/etapas-tickets`, `/briefings`, `/eventos`, `/eventos/:id`, `/eventos-templates`, `/eventos-calendario`; tabelas `projetos_marketing`, `tarefas_projeto`, `projeto_responsaveis`, `projeto_comentarios`, `projeto_historico`, `ticket_etapas`, `ticket_criativos`, `briefings`, `briefing_referencias`, `eventos`, `evento_inscricoes`, `evento_membros`, `evento_tarefas`, `evento_template_tarefas`, `evento_templates`.

**Prompt para o Lovable:**

> Adicione módulos de Marketing e Eventos:
>
> 1. **Projetos de Marketing**: campanhas/criativos com tarefas, responsáveis múltiplos, comentários, histórico, tickets criativos por etapa configurável.
> 2. **Calendário de Marketing**: visão mensal de entregas/postagens.
> 3. **Briefings**: formulário rico + galeria de referências (`briefing_referencias` em Storage).
> 4. **Equipe de Marketing**: atribuição de carga.
> 5. **Eventos** (lançamentos, plantões, ações):
>    - `evento_templates` + `evento_template_tarefas` para clonar setup recorrente.
>    - `evento_inscricoes` (leads do evento), `evento_membros` (equipe), `evento_tarefas` (checklist).
>    - Geração de PDF do evento; portal público com flag de privacidade.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** crio projeto de marketing com 5 tarefas, gero briefing com 3 imagens de referência, crio evento a partir de template.

---

### Prompt 11 — Planejamento global e integração Google Calendar

**Depende de:** 3, 4, 6.
**Entrega:** páginas `/planejamento`, `/planejamento/configuracoes`; tabelas `planejamento_itens`, `planejamento_fases`, `planejamento_status`, `planejamento_item_responsaveis`, `planejamento_historico`, `google_calendar_embeds`; edge `fetch-google-calendar`.

**Prompt para o Lovable:**

> Adicione módulo Planejamento global:
>
> 1. **`planejamento_fases`**: mix de fases globais (sem `empreendimento_id`) e fases por empreendimento.
> 2. **`planejamento_status`** (configurável), **`planejamento_itens`** (titulo, fase, status, data_inicio, data_fim, empreendimento_id nullable, responsaveis múltiplos), **`planejamento_historico`**.
> 3. **Página `/planejamento`:**
>    - Visão global (todos os empreendimentos) com filtros.
>    - Calendário dinâmico por fase.
>    - Popover rápido de criação.
>    - **Conversão para Atividade:** botão converte item de planejamento em atividade de Marketing, Forecast ou Rotina.
> 4. **`google_calendar_embeds`** + edge `fetch-google-calendar` (extrai iCal de URL pública e popula calendário).
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** crio fase global + 5 itens, converto um em atividade comercial, importo iCal público do Google.

---

### Prompt 12 — Portal do Corretor / Imobiliária

**Depende de:** 2, 3, 5, 6, 7, 10.
**Entrega:** rotas `/portal/*`; layout `PortalLayout`.

**Prompt para o Lovable:**

> Adicione o **Portal do Corretor** (acesso externo para corretores/imobiliárias parceiras):
>
> 1. Layout próprio `PortalLayout` (cores neutras, sem sidebar admin).
> 2. **Páginas:**
>    - `/portal/dashboard` — KPIs do corretor (atendimentos, propostas, contratos).
>    - `/portal/empreendimentos` — só os empreendimentos onde a imobiliária do corretor está vinculada.
>    - `/portal/empreendimentos/:id` — detalhes + tabela de unidades disponíveis.
>    - `/portal/clientes` — clientes do próprio corretor.
>    - `/portal/solicitacoes` — reservas/propostas do corretor.
>    - `/portal/eventos` — eventos abertos para inscrição.
>    - `/portal/imobiliaria` (responsável) — gestão da própria imobiliária.
>    - `/portal/corretores` (responsável) — gestão dos corretores vinculados.
> 3. **Reservas:** corretor só pode ver/atuar em reservas de empreendimentos onde está vinculado.
> 4. **Mapa de Unidades:** somente leitura no portal (renomear visualmente para "Disponibilidade").
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** corretor externo loga, vê só os empreendimentos da sua imobiliária, faz uma reserva de unidade.

---

### Prompt 13 — Portal do Incorporador (executivo, read-only)

**Depende de:** 6, 7, 9, 10, 11.
**Entrega:** rotas `/portal-incorporador/*`; layout próprio; contexto global de filtro.

**Prompt para o Lovable:**

> Adicione o **Portal do Incorporador** — visão executiva read-only para o cliente final (incorporadora).
>
> 1. Layout `PortalIncorporadorLayout` com filtro global de empreendimento (Context API `PortalIncorporadorFilterContext`) presente em **todas** as páginas.
> 2. **Páginas:**
>    - `/portal-incorporador/dashboard` — KPIs principais (Vendas do Mês via `is_final_sucesso`).
>    - `/portal-incorporador/executivo` — resumo financeiro/comercial.
>    - `/portal-incorporador/forecast` — Kanban consolidado; aba "Forecast" reflete volume **total**, não só comercial.
>    - `/portal-incorporador/marketing` — KPIs de marketing.
>    - `/portal-incorporador/planejamento` — visão de fases.
>    - `/portal-incorporador/disponibilidade` — mapa de unidades read-only; UI adapta se for `loteamento` (lotes) ou `predio` (andares).
>    - `/portal-incorporador/propostas` — abas tabuladas por status (precedência: Aprovada > Em análise > Rascunho).
> 3. Etapas de negociação só aparecem se `funil_etapas.is_visivel_portal=true`.
> 4. Tudo read-only.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** incorporador loga, troca empreendimento no filtro global, todas as abas refletem o filtro.

---

### Prompt 14 — Dashboards executivos, Relatórios, Auditoria

**Depende de:** 6, 7, 9.
**Entrega:** páginas `/dashboard-executivo`, `/relatorios`, `/auditoria`, `/solicitacoes`; tabelas `audit_logs`, `notificacoes`.

**Prompt para o Lovable:**

> Adicione camada analítica:
>
> 1. **`audit_logs`**: tabela genérica preenchida por triggers nas principais entidades (negociações, propostas, contratos, unidades, comissões).
> 2. **`notificacoes`**: notificações in-app (bell no header), com `lida_em`, `link`.
> 3. **Dashboard Executivo:** consolidado da operação (vendas, conversão por etapa, ticket médio, ranking de corretores).
> 4. **Relatórios:** geração de PDFs/CSVs configuráveis (vendas por período, comissões, disponibilidade).
> 5. **Auditoria:** consulta de `audit_logs` com filtros por entidade/usuário/período.
> 6. **Solicitações:** caixa de entrada de pedidos internos (mudanças de preço, aprovações, etc).
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** vejo dashboard executivo populado pelos dados criados nos módulos anteriores.

---

### Prompt 15 — Webhooks e integração com n8n

**Depende de:** 6, 7.
**Entrega:** aba "Webhooks" em `/configuracoes`; tabelas `webhooks`, `webhook_logs`, `webhook_variaveis_disponiveis`; edges `webhook-dispatcher`, `webhook-assinatura`, `cleanup-webhook-logs`.

**Prompt para o Lovable:**

> Adicione integração de webhooks com n8n.
>
> 1. **`webhooks`**: nome, evento (enum: `negociacao_etapa_alterada`, `proposta_aprovada`, `comentario_proposta_criado`, `corretor_cadastrado`, `contrato_assinado`, ...), url_destino, headers, ativo, secret.
> 2. **`webhook_variaveis_disponiveis`**: catálogo de variáveis enriquecidas por evento.
> 3. **`webhook_logs`**: payload, response, status, duracao_ms; cleanup automático via cron + edge `cleanup-webhook-logs`.
> 4. **Edge `webhook-dispatcher`**: triggers de banco enfileiram eventos; edge dispara HTTP POST com payload enriquecido (evento "Negociação Universal" e "Comentário em Proposta" devem trazer payload completo com cliente, unidades, etc).
> 5. **Edge `webhook-assinatura`**: callback público de assinatura digital.
> 6. **Aba `/configuracoes/webhooks`**: CRUD + visualização de logs.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** ao mover negociação de etapa, vejo POST chegar em endpoint do n8n com payload completo.

---

### Prompt 16 — Configurações gerais e Termos

**Depende de:** 1.
**Entrega:** página `/configuracoes` (multi-tab); páginas `/termos-uso`, `/politica-privacidade`; tabelas `configuracoes_sistema`, `configuracao_comercial`, `termos_versoes`, `termos_aceites`, `fluxo_aprovacao_config`.

**Prompt para o Lovable:**

> Finalize com configurações:
>
> 1. **`configuracoes_sistema`**: chaves globais (logo do sistema, cor primária override, smtp_from, etc).
> 2. **`configuracao_comercial`**: regras transversais (limite de desconto, dias para vencimento de proposta).
> 3. **`termos_versoes`** + **`termos_aceites`**: versionamento e log de aceites de Termos de Uso e Política de Privacidade.
> 4. **Páginas públicas** `/termos-uso` e `/politica-privacidade` consumindo a versão atual.
> 5. **Página `/configuracoes`** com abas: Geral, Comercial, Roles & Permissões, Cores da Sidebar, Webhooks (do prompt 15), Logs, Reset de Sequências, Termos.
>
> [colar bloco "Convenções obrigatórias"]

**Critério de aceite:** edito termos, novo aceite é registrado em `termos_aceites` no próximo login.

---

## 4. Glossário de termos de negócio

| Termo | Definição |
|-------|-----------|
| **Atividade** | Atendimento ou tarefa registrada por um corretor/gestor. Pode ser comercial, marketing ou rotina. |
| **Negociação** | Processo de venda entre cliente e empreendimento. Deduplicada por cliente+empreendimento. |
| **Proposta** | Oferta formal dentro de uma negociação, com unidades e condições de pagamento. |
| **Contrato** | Documento jurídico gerado a partir de uma proposta aprovada, sujeito a assinatura digital. |
| **Forecast** | Quadro Kanban + pipeline (somente leitura) de atividades comerciais. |
| **Resumo** | KPIs de volume — não confundir com Forecast. |
| **Diário de Bordo** | Dashboard das atividades operacionais/rotina. |
| **Empreendimento** | Projeto imobiliário (prédio ou loteamento). Unidade central do multi-tenant lógico. |
| **Unidade** | Apartamento, lote, casa — item vendável. Hard delete. |
| **Bloco / Tipologia / Box / Fachada** | Subdivisões físicas e atributos da unidade. |
| **Bonificação** | Bônus extra fora da comissão padrão. |
| **Comissão (RT)** | Comissão do Responsável Técnico do empreendimento. |
| **Gestor (de Produto)** | Usuário interno que gerencia um empreendimento. |
| **Corretor autônomo** | Sem vínculo com imobiliária. Só super_admin pode criar. |
| **Corretor vinculado** | Vinculado a uma imobiliária (`corretores.imobiliaria_id`). |
| **Placeholder de cliente** | Cliente fictício gerado automaticamente para preservar Kanban quando atividade não tem cliente real. |
| **Comprador Histórico** | Cliente placeholder usado em vendas legadas; sempre excluído de listagens. |
| **Dação** | Bem físico dado em pagamento; quando presente, bloqueia campo `forma_pagamento`. |

---

## 5. Checklist de migração de dados (opcional)

Se for importar dados de um sistema legado, siga esta ordem para evitar violar FKs:

1. `incorporadoras` → `imobiliarias` → `profiles` → `user_roles`
2. `empreendimentos` → `blocos` → `tipologias` → `unidades` → `boxes`
3. `corretores` (vincular `user_id` se já existirem profiles)
4. `user_empreendimentos`
5. `clientes` → `cliente_telefones` / `cliente_socios`
6. `funis` → `funil_etapas` → `tipos_atendimento_config`
7. `atividades` → `atividade_responsaveis` → `atividade_etapas`
8. `negociacoes` → `negociacao_unidades` → `negociacao_clientes` → `negociacao_condicoes_pagamento`
9. `propostas` → `proposta_*`
10. `contratos` → `contrato_*`
11. `comissoes` → `comissao_parcelas`
12. `lancamentos_financeiros`
13. `projetos_marketing`, `eventos`, `planejamento_itens`
14. `webhooks` (apenas após validar URLs em ambiente de homologação)

> **Dica:** popule sempre `empreendimento_id`. Atividades sem empreendimento somem dos dashboards.

---

## 6. Como usar este documento

1. Copie **um prompt por vez**, sempre **anexando o bloco "Convenções obrigatórias" da seção 2**.
2. Aguarde o Lovable terminar e valide o **critério de aceite**.
3. Só avance para o próximo prompt quando o anterior estiver verde.
4. Os prompts 12 e 13 (Portais) podem ser entregues em paralelo após o prompt 7.
5. Os prompts 14, 15 e 16 podem ser feitos em qualquer ordem entre si.

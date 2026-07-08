
# Reestruturação: Comercial → Funil Arqo

Plano em 3 fases. Nada é executado até você aprovar. Cada fase termina em um estado utilizável do sistema.

---

## Fase 0 — Fundação e limpeza

### 0.1 Remover módulo Comercial

**Tabelas removidas (DROP CASCADE):**
- Negociação: `negociacoes`, `negociacao_clientes`, `negociacao_unidades`, `negociacao_condicoes_pagamento`, `negociacao_comentarios`, `negociacao_historico`, `negociacao_dacao_anexos`
- Proposta: `propostas`, `proposta_unidades`, `proposta_condicoes_pagamento`, `template_condicoes_pagamento`
- Contrato: `contratos`, `contrato_unidades`, `contrato_condicoes_pagamento`, `contrato_signatarios`, `contrato_documentos`, `contrato_pendencias`, `contrato_aprovacoes`, `contrato_versoes`, `contrato_templates`, `contrato_template_imagens`, `contrato_variaveis`
- Comissão: `comissoes`, `comissao_parcelas`, `configuracao_comissoes`, `bonificacoes`, `usuario_empreendimento_bonus`
- Atividades/Funil: `atividades`, `atividade_etapas`, `atividade_comentarios`, `atividade_historico`, `atividade_responsaveis`, `funis`, `funil_etapas`, `metas_comerciais`, `tipos_atendimento_config`, `categorias_fluxo`, `fluxo_aprovacao_config`
- Reserva: `reserva_documentos` (se restar isolada)
- Webhooks/misc: `webhooks`, `webhook_logs`, `webhook_variaveis_disponiveis`, `termos_aceites`, `termos_versoes`

**Sequences removidas:** `negociacao_codigo_seq`, `negociacao_proposta_seq`, `proposta_numero_seq`, `contrato_numero_seq`, `comissao_numero_seq`, `reserva_protocolo_seq`.

**Funções DB removidas:** todas as `*_negociacao*`, `*_proposta*`, `*_contrato*`, `*_comissao*`, `verificar_ficha_proposta_completa`, `atualizar_ficha_completa`, `check_*_expiracao`, `manage_*_unidades_status`, `liberar_unidades_negociacao_cancelada`, `aprovar_solicitacao_negociacao`, `rejeitar_solicitacao_negociacao`, `can_view_negociacao_condicoes`, `set_data_venda`, `generate_*_numero`, `generate_*_codigo`, `generate_negociacao_codigo`, `log_atividade_*`, `set_atividade_created_by`, `auto_set_gestor_id_atividades`.

**Storage:** apagar buckets `contratos-documentos`, `negociacao-dacao` (mantém `empreendimentos-*`, `briefing-referencias`, `projetos-arquivos`).

**Código frontend removido:** rotas, páginas, componentes, hooks, edge functions, tipos e imports de: negociações, propostas, contratos, comissões, atividades, funis, metas, bonificações, forecast antigo, diário de bordo, planejamento (se ligado a atividades comerciais), reservas comerciais, webhooks. Sidebar e topbar limpos das entradas correspondentes.

**Mantido intacto:** `clientes` (+ satélites), `empreendimentos` (+ blocos/tipologias/unidades/mídias/documentos/mapa/fachadas/boxes/imobiliárias vinculadas), `corretores`, `imobiliarias`, `incorporadoras`, `profiles`, `user_roles`, `roles`, `modules`, `role_permissions`, `user_module_permissions`, `user_empreendimentos`, financeiro (lançamentos, plano_contas, centros_custo, saldos_mensais), `notificacoes`, `configuracoes_sistema`, `audit_logs`, `unidade_historico_precos`.

### 0.2 Remodelar cadastro de clientes (progressivo)

**Sem drop de coluna** (preserva dados). Trabalhamos em duas dimensões:

1. **Nível de completude** — nova coluna `clientes.nivel_cadastro` enum: `lead` (só nome + contato), `qualificado` (+ doc + interesse), `comprador` (dados completos PF/PJ).
2. **Validação por nível** — trigger valida obrigatoriedade conforme `nivel_cadastro` (ex.: sócios/cônjuge/endereço só exigidos em `comprador`).

**Formulário de cliente reescrito** em wizard progressivo:
- Etapa 1 (lead): nome, telefone principal, email, origem.
- Etapa 2 (qualificado): CPF/CNPJ/passaporte, empreendimento/unidade de interesse.
- Etapa 3 (comprador): endereço, estado civil, cônjuge, sócios, profissão, etc. — só aparece quando promovido.

Botão "Promover a comprador" na ficha muda `nivel_cadastro` e libera etapa 3.

### 0.3 Roles Arqo

Novas roles em `public.roles`: `arqo_admin`, `arqo_gestor`, `arqo_consultor`, `arqo_closer`. Permissões nos módulos novos via `role_permissions`. Roles Seven continuam existindo (admin, super_admin, gestor_produto, etc.).

---

## Fase 1 — Núcleo do funil Arqo (backend)

Todas as tabelas com prefixo `arqo_`, FKs reais para `clientes`, `empreendimentos`, `unidades`, `incorporadoras`, `profiles`.

### 1.1 Configuração

- `arqo_lead_sources` (nome, ativo) — CRUD.
- `arqo_temperaturas` (nome, probabilidade 0-1) — seed: quente/morno/frio.
- `arqo_funil_etapas` (status enum, peso_probabilidade 0-1, ordem) — seed com todos os status.
- `arqo_sla_regras` (status_aplicavel, tempo_limite_minutos, ativo).
- `arqo_grupos_atendimento` (usuario_id → profiles, incorporadora_id → incorporadoras, disponivel bool, limite_leads_simultaneos int, lead_atual_id nullable).
- `arqo_regua_reengajamento` (status_aplicavel, motivo_perda, dias_para_reengajar, acao).

### 1.2 Leads e eventos

- **`arqo_leads`**: `id`, `cliente_id` (FK clientes), `source_id`, `status_atual` (enum), `qualificacao_id` (FK arqo_temperaturas), `empreendimento_id`, `unidade_id`, `consultor_atual_id`, `proxima_acao` (enum), `data_follow_up`, `prazo_atendimento`, `tentativas_contato` (default 0), `motivo_perda` (enum), `motivo_perda_observacao`, `optout_em`, `atendimento_final_pelo_gestor` (bool), `criado_em`, `atualizado_em`.
- **`arqo_lead_events`** (append-only, sem UPDATE via policy): `id`, `lead_id`, `tipo_evento` (enum amplo), `operador_origem_id`, `operador_destino_id`, `payload` jsonb, `criado_em`.
- **`arqo_oportunidade_responsaveis`**: lead_id, papel enum (`prospeccao`/`atendimento`/`fechamento`), usuario_id, atribuido_em.
- **`arqo_agendamentos`**: lead_id, tipo (`visita`/`reuniao`), data_hora, status, google_event_id nullable.

### 1.3 RPCs (única porta de entrada de escrita)

- `get_or_create_pessoa(telefone, nome, email, cpf)` — retorna `cliente_id`, dedupe por CPF > telefone > email. Cria em `nivel_cadastro = 'lead'`.
- `transicionar_status(lead_id, novo_status, operador_id, payload)` — única função autorizada a mexer em `status_atual`. Grava evento correspondente. Valida transições permitidas.
- `atribuir_lead_roleta(lead_id, tipo_atribuicao)` — escolhe consultor elegível (mesma incorporadora do empreendimento, disponível, abaixo do limite, `lead_atual_id IS NULL`), seta `consultor_atual_id`, `prazo_atendimento`, grava evento `atribuido_roleta` com `tipo_atribuicao` no payload.
- `registrar_tentativa_sem_resposta(lead_id)` — incrementa `tentativas_contato`; ≥3 → `DESCARTADO` + libera consultor.
- `liberar_consultor(lead_id)` — zera `lead_atual_id` do consultor quando lead sai da fila ativa.

Todas SECURITY DEFINER, com validação de role.

### 1.4 View de forecast

`arqo_vw_forecast_ponderado`:
```
lead + JOIN unidades (unidades.valor AS vgv)
     + JOIN empreendimentos (para agrupamento)
     + JOIN configuracao_comissoes (para percentual → vgc estimado)
     + JOIN arqo_temperaturas + arqo_funil_etapas
     → vgv_ponderado = valor * probabilidade * peso_etapa
```
Nada armazenado; recalculado a cada consulta.

### 1.5 Edge Functions

- `POST /arqo-lead-ingest` — recebe payload externo (n8n/Meta/WhatsApp), chama `get_or_create_pessoa`, cria lead, dispara pré-qualificação IA, chama `atribuir_lead_roleta`.
- `POST /arqo-lead-import-csv` — mesmo fluxo em lote.
- `POST /arqo-qualificacao-ia` — chama Lovable AI Gateway (Claude via `LOVABLE_API_KEY`), retorna qualificou/motivo, grava evento.
- Cron `arqo-sla-check` (a cada 5 min): busca leads com `prazo_atendimento` vencido sem `primeiro_contato_registrado`, grava `devolvido_roleta_sla_estourado`, redistribui excluindo o consultor que perdeu.
- Cron `arqo-reengajamento` (diário): dispara régua para `PERDIDO` elegíveis (ignora `OPT_OUT`).

Endpoint pronto, integrações reais ficam para depois — só estrutura.

---

## Fase 2 — Interface Arqo

- **Sidebar:** novo grupo "Arqo" com Roleta, Leads, Agenda, Forecast, Indicadores, Configurações Arqo.
- **Tela Roleta (consultor):** mostra **um único lead** (ou "sem leads"); botões: Registrar contato, Sem resposta, Agendar, Qualificar, Perder, Opt-out. Bloqueia próximo até desfecho.
- **Kanban de leads (gestor/closer):** colunas = status; drag chama `transicionar_status`.
- **Ficha do lead:** dados do `cliente` (com CTA "Promover a comprador"), timeline de `arqo_lead_events`, próxima ação, follow-up, responsáveis por etapa, agendamentos.
- **Forecast:** consome `arqo_vw_forecast_ponderado` — totais de VGV pipeline, VGC ponderado, quebras por empreendimento e temperatura.
- **Indicadores:** duas colunas separadas — volume real (`count(distinct lead_id)`) e carga por consultor (roleta_inicial × redistribuicao_sla, nunca somados). Além de atendidos no prazo, perdidos por SLA, tempo médio de primeiro contato.
- **Configurações Arqo:** CRUD de sources, temperaturas, pesos de etapa, SLA, grupos de atendimento, régua de reengajamento.

---

## Detalhes técnicos importantes

- **Mapeamento de nomes reais no schema atual:** `incorporadoras` (não `incorporadores`), `unidades.valor` (não `preco`), comissão vem de `configuracao_comissoes` (não `empreendimentos.percentual_comissao`). O plano usa esses nomes reais.
- **Append-only em `arqo_lead_events`:** policy só permite INSERT; UPDATE/DELETE bloqueados até para service_role via revoke explícito (só super_admin via console SQL corrige).
- **Optout permanente:** cron de reengajamento SEMPRE filtra `optout_em IS NULL`.
- **Segurança:** todas as RPCs validam role. Consultor só vê leads onde `consultor_atual_id = auth.uid()` OR está em `arqo_oportunidade_responsaveis`. Gestor/admin veem tudo da sua incorporadora.
- **Auditoria:** `audit_logs` cobre `arqo_leads`, `arqo_grupos_atendimento`, `arqo_sla_regras`.
- **Financeiro/empreendimentos/clientes:** intocados exceto a coluna nova em `clientes` e a reforma do formulário.

---

## Ordem de execução sugerida

1. Fase 0.1 (drop comercial) — migration única + limpeza de código.
2. Fase 0.2 (nivel_cadastro + wizard cliente).
3. Fase 0.3 (roles arqo_*).
4. Fase 1.1 → 1.2 → 1.3 → 1.4 → 1.5 (backend Arqo completo antes de qualquer tela).
5. Fase 2 (UI, começando por Roleta + Ficha, depois Kanban, depois Forecast/Indicadores).

Cada fase pode ser aprovada e executada independentemente. Confirma que seguimos por aqui (ou ajusta antes)?

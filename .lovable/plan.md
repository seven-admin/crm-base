
## 1. Arqo — Gestão administrativa de leads

Nova aba **"Gerenciar Leads"** em `/arqo/admin` (`src/pages/arqo/ArqoAdmin.tsx`).

- Tabela paginada de `arqo_leads` com JOIN em `seven_clientes`, `arqo_funil_etapas`, `arqo_lead_sources` e consultor (`profiles`).
- Filtros: origem (source), etapa, consultor, período de importação (data_criação), busca por nome/telefone/email.
- Colunas: checkbox seleção, cliente, telefone, origem, etapa, consultor, criado em, ações.
- Sele​ção múltipla (com "selecionar todos da página" e "selecionar todos do filtro").
- Botão **"Excluir selecionados"** → confirmação (typing "EXCLUIR") → hard delete em cascata:
  1. `arqo_lead_events` (WHERE lead_id IN ...)
  2. `arqo_agendamentos`
  3. `arqo_oportunidade_responsaveis`
  4. `arqo_leads`
  - O cliente em `seven_clientes` só é removido se nível=`lead` e sem outras referências (checkbox opcional "excluir também o cliente lead").
- Restrição: apenas super_admin e admin Arqo veem a aba.

## 2. Nexa — Aprimoramento de Contratos

### 2.1 Biblioteca de blocos de texto reutilizáveis
Nova tabela `nexa_contrato_blocos`:
- `nome`, `categoria` (ex: rescisão, garantia, foro, pagamento), `descricao`, `conteudo_html`, `is_active`, timestamps.
- GRANT + RLS: leitura para authenticated Nexa; escrita para admin Nexa/super_admin.

Nova página `/nexa/contratos/blocos` (`src/pages/nexa/NexaContratosBlocos.tsx`) — CRUD com editor rich text, filtros por categoria.

### 2.2 Editor TipTap avançado (`src/components/nexa/contratos/TipTapEditor.tsx`)
Adicionar extensões:
- `@tiptap/extension-table` (+ row/cell/header) — inserção de tabelas.
- `@tiptap/extension-text-align` — alinhamento.
- `@tiptap/extension-underline`, `@tiptap/extension-text-style`, `@tiptap/extension-color`.
- `@tiptap/extension-link` — links.
- Barra de ferramentas expandida: alinhamento, sublinhado, cor de texto, tabela, link, quebra de página (marca CSS `page-break-before: always`).

Novos menus laterais no editor de contratos/templates:
- **Menu "Variáveis"**: lista variáveis do sistema + botão para inserir `{{chave}}` no cursor.
- **Menu "Blocos"**: lista blocos da biblioteca por categoria + botão "Inserir bloco" (injeta o HTML do bloco no cursor).

### 2.3 Melhorias de fluxo (mantidos como está por ora)
Escopo desta rodada foca em biblioteca + editor. Status/versionamento já existem em `nexa_contratos` e permanecem inalterados.

## 3. Login com Google (domínios corporativos)

### Configuração
- Habilitar provider Google no Supabase Auth dashboard (usuário faz manualmente — instruções fornecidas ao final).
- Domínios permitidos: `sevengroup360.com.br`, `nexaresolve.com.br`, `arqoimob.com.br` (extensível via tabela).

### Nova tabela `sistema_dominios_google_permitidos`
- `dominio` (unique), `empresa_default` (seven|arqo|nexa|incorporador), `is_active`.
- Seed com os 3 domínios iniciais mapeados: sevengroup360→seven, nexaresolve→nexa, arqoimob→arqo.

### Página de administração
`/configuracoes/dominios-google` (super_admin) — CRUD simples para adicionar/remover domínios.

### Frontend
- `LoginForm.tsx`: adicionar botão **"Entrar com Google"** acima do formulário de email.
- `AuthContext.tsx`: nova função `signInWithGoogle()` chamando `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }})`.

### Validação de domínio + provisionamento
Edge function `google-auth-callback` (verify_jwt=true) chamada após login OAuth:
1. Valida se o email do usuário tem domínio na tabela `sistema_dominios_google_permitidos`.
2. Se não: `supabase.auth.admin.signOut(user.id)` + retorna erro (frontend mostra toast e desloga).
3. Se sim: atualiza `profiles.empresa` conforme mapeamento (apenas na primeira vez) e ativa `is_active=true`.

Trigger `handle_new_user` existente já cria profile — apenas complementamos com a empresa baseada no domínio.

## Ordem de execução

1. Migration única com: nova tabela `nexa_contrato_blocos`, nova tabela `sistema_dominios_google_permitidos` (com seed), GRANTs, RLS.
2. Instalar deps TipTap: `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-text-align`, `@tiptap/extension-underline`, `@tiptap/extension-text-style`, `@tiptap/extension-color`, `@tiptap/extension-link`.
3. Refatorar `TipTapEditor.tsx` + criar painel lateral de inserção.
4. Criar `NexaContratosBlocos.tsx` + hook `useNexaContratoBlocos.ts` + rotas.
5. Adicionar aba "Gerenciar Leads" em `ArqoAdmin.tsx` + hook `useArqoLeadsAdmin.ts`.
6. Edge function `google-auth-callback` + página `DominiosGoogleAdmin.tsx` + botão Google em `LoginForm.tsx` + `signInWithGoogle` em `AuthContext.tsx`.
7. Instruções ao usuário sobre configurar OAuth Client no Google Cloud e habilitar provider no Supabase.

## Detalhes técnicos

- Hard delete em Arqo executado via RPC `arqo_delete_leads_bulk(lead_ids uuid[])` como SECURITY DEFINER, verificando `is_admin(auth.uid()) OR is_super_admin(auth.uid())`.
- Blocos: `conteudo_html` armazenado como HTML puro; inserção via `editor.chain().focus().insertContent(html).run()`.
- Google OAuth redirect URL: `https://pizerpoxuqopekmbvohh.supabase.co/auth/v1/callback` (informado ao usuário).
- Domínios: match case-insensitive via `lower(split_part(email,'@',2))`.

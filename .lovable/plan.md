## 1. Fix: Agendamento de Visitas Nexa (bug)

**Causa raiz:** em `src/hooks/useNexa.ts`, a constante `SELECT_VISITA` faz join com nomes antigos das tabelas (`clientes`, `empreendimentos`, `imobiliarias`, `corretores`). Após o rename para `seven_*`, o SELECT falha silenciosamente e a lista fica vazia — apesar do INSERT funcionar (o toast "Visita agendada" aparece).

**Correção:**
- Atualizar `SELECT_VISITA` para usar `seven_clientes`, `seven_empreendimentos`, `seven_imobiliarias`, `seven_corretores`.
- Ajustar o hint da FK `imobiliaria:...` para o nome real da constraint (validar via `read_query` em `information_schema`).
- Verificar que `useCreateVisita` está inserindo em `nexa_visitas` corretamente (já está) e que RLS permite SELECT ao criador.

---

## 2. Feature: Módulo Contratos Nexa

Já existem os tipos em `src/types/contratos.types.ts` e a página placeholder `NexaContratos.tsx`. Vamos implementar 3 partes:

### 2.1 Banco de dados (migration)
Criar tabelas com prefixo `nexa_`:

- `nexa_contrato_variaveis` — catálogo global de variáveis reutilizáveis
  - `id`, `chave` (unique, ex: `nome_cliente`), `label`, `descricao`, `tipo` (texto|numero|data|moeda), `fonte_sugerida` (ex: `cliente.nome`, `unidade.numero`), `is_active`, timestamps
- `nexa_contrato_templates` — modelos de contrato
  - `id`, `nome`, `descricao`, `conteudo_html` (rich text), `variaveis` (jsonb array de chaves usadas), `empreendimento_id` (nullable — modelo global se null), `is_active`, `created_by`, timestamps
- Estender `nexa_contratos` existente:
  - `template_id` (fk → templates), `conteudo_html` (snapshot no momento da geração), `variaveis_valores` (jsonb com valores resolvidos), `pdf_url` (storage), `numero` (auto), `valor_contrato`, `data_geracao`, `data_assinatura`

GRANTs + RLS: leitura/escrita para usuários com empresa `nexa` + admins.

Bucket de storage `nexa-contratos-pdf` (privado) para os PDFs gerados.

### 2.2 Frontend — Gerenciador de Modelos
Rota `/nexa/contratos/modelos`:
- Lista de templates (tabela): nome, empreendimento, ativo, ações
- Editor de template (dialog full-screen ou página `/nexa/contratos/modelos/:id`):
  - Campos: nome, descrição, empreendimento (opcional)
  - **Editor de texto rich text** usando **TipTap** (`@tiptap/react` + `@tiptap/starter-kit`) — leve, headless, React-first. Permite inserir variáveis como chips não-editáveis via extension custom.
  - Painel lateral com lista de variáveis cadastradas → clique insere `{{chave}}` no cursor.
  - Preview em aba separada substituindo variáveis por valores de exemplo.

### 2.3 Frontend — Configurador de Variáveis
Rota `/nexa/contratos/variaveis`:
- CRUD simples de `nexa_contrato_variaveis`.
- Campos: chave (slug validado), label, tipo, fonte sugerida (dropdown com paths conhecidos: `cliente.nome`, `cliente.cpf`, `cliente.endereco_completo`, `empreendimento.nome`, `unidade.numero`, `unidade.valor`, `data_atual`, etc), descrição.
- Variáveis "de sistema" (pré-populadas via seed) marcadas como read-only.

### 2.4 Frontend — Geração de Contrato
Rota `/nexa/contratos/novo` (e continuar de `/nexa/contratos`):
- Wizard 3 passos:
  1. Selecionar cliente + empreendimento + unidade(s) (opcionalmente vindo de uma visita realizada)
  2. Escolher template → sistema resolve variáveis automaticamente puxando dados do banco; campos não resolvidos ficam editáveis manualmente
  3. Preview final + botão "Gerar PDF"
- **Geração de PDF** com `jspdf` + `html2canvas` (renderiza o HTML final resolvido em canvas → PDF).
  - Alternativa mais fiel: `html2pdf.js` (wrapper).
  - Escolha: `jspdf` + `html2canvas` (conforme pedido).
- PDF salvo em `nexa-contratos-pdf` bucket; URL salva em `nexa_contratos.pdf_url`.
- Lista principal `/nexa/contratos` mostra contratos gerados com download do PDF, status editável, e ações (regenerar, cancelar).

### 2.5 Navegação
Adicionar submenu Nexa → Contratos com links:
- Contratos (lista)
- Modelos
- Variáveis

---

## Detalhes técnicos

**Dependências novas:**
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder` — editor rich text
- `jspdf`, `html2canvas` — geração de PDF client-side

**Substituição de variáveis:** função utilitária `resolveVariaveis(html, valores)` que faz replace de `{{chave}}` por `valores[chave]`. Rodada tanto no preview quanto antes da geração do PDF.

**Resolvedor automático:** função `resolverVariaveisContrato(contratoData)` que, dado cliente/empreendimento/unidade, monta o objeto `valores` usando `fonte_sugerida` de cada variável.

**Ordem de implementação sugerida:**
1. Fix do bug de agendamento (rápido, 1 arquivo)
2. Migration + seed de variáveis
3. CRUD de variáveis
4. CRUD de templates com editor TipTap
5. Geração de contrato + PDF
6. Navegação e polish

---

## Perguntas antes de implementar

1. **Escopo desta rodada:** implemento tudo (fix + contratos completos) ou prefere que eu entregue em partes (ex: só o fix + estrutura de banco + CRUD de variáveis primeiro, e o editor/PDF na próxima rodada)?
2. **Editor rich text:** OK com TipTap? (é o padrão moderno para React; alternativa seria Quill ou Lexical)
3. **PDF:** confirma `jspdf` + `html2canvas`? Isso gera PDF baseado em imagem do HTML — fiel visualmente mas texto não é selecionável. Se precisar de texto selecionável/pesquisável, uso `jspdf` com `html()` (usa html2canvas internamente também) ou parto para `pdfmake`.
4. **Variáveis:** quer que eu pré-popule as variáveis padrão (nome_cliente, cpf, empreendimento, unidade, valor, data_atual, etc) via seed na migration?
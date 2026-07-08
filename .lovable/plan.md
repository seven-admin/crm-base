
## 1. Bug: Novo SLA quebra a tela

**Causa:** em `src/pages/arqo/ArqoConfig.tsx` linha 17, `tempOptions` inclui `{ value: '', label: '— Todas —' }`. O Radix `<Select.Item>` proíbe `value=""` — por isso o formulário de SLA (que usa esse campo em `Temperatura (opcional)`) explode ao abrir.

**Correção:**
- Trocar o sentinel de `''` para `'__none__'` em `tempOptions`.
- No `ArqoConfigCrud`, ao gravar, converter `'__none__'` → `null` para `temperatura_id` (campo nullable no banco).
- Ao carregar item existente sem `temperatura_id`, exibir `'__none__'` no Select.

## 2. Importação de listas de leads (apenas planejamento — não implementar agora)

Local proposto: dentro do módulo Arqo, nova rota `/arqo/leads/importar` acessível por um botão "Importar" no topo da tela **Arqo → Leads** (kanban/lista). Fluxo previsto para quando implementarmos:
1. Upload de CSV/XLSX.
2. Mapeamento de colunas → `nome`, `telefone`, `email`, `cpf`, `origem`, `temperatura`, `grupo`.
3. Prévia com validação (duplicados por telefone/email/CPF, usando `get_or_create_pessoa`).
4. Escolha de `lead_source_id`, `grupo_id` e etapa inicial.
5. Insert em lote via edge function `arqo-import-leads` (para respeitar RLS e roleta).
6. Relatório final (criados / atualizados / ignorados).

Marcador visual: adicionar botão "Importar (em breve)" desabilitado na tela de Leads para o usuário já saber onde vai ficar.

## 3. Novo menu "Seven" (mega-menu)

Reorganização da topbar em grupos: **Seven**, **Comercial**, **Arqo**, **Nexa**, **Financeiro**, **Sistema**.

**Grupo Seven** substitui a exposição avulsa desses itens e agrupa por categoria:

```text
┌─ Seven ▾ ────────────────────────────────────────────────────┐
│  PORTFÓLIO          PESSOAS            PARCEIROS             │
│  • Empreendimentos  • Clientes         • Imobiliárias        │
│  • Blocos/Unidades  • Compradores      • Corretores          │
│  • Tipologias       • Leads históricos • Incorporadoras      │
└──────────────────────────────────────────────────────────────┘
```

**Interação (mega-menu):**
- Ao clicar em "Seven" na topbar, abre um `Popover` largo (`w-[640px]`), ancorado à esquerda do botão.
- Layout em **3 colunas** com títulos de categoria (`text-xs uppercase tracking-wide text-muted-foreground`) e itens abaixo (ícone lucide + label + descrição curta opcional).
- Hover destaca o item; clique navega e fecha o popover.
- Em mobile (< md), o mesmo grupo vira uma seção expansível dentro do `Sheet` já existente, com as 3 categorias como subtítulos empilhados.

Componente novo: `src/components/layout/SevenMegaMenu.tsx`. `AppTopbar.tsx` passa a renderizar o grupo "Seven" via esse componente em vez do `DropdownMenu` padrão, mantendo os demais grupos como estão.

## 4. Layout geral

**Fundo:**
- `body` recebe `background: linear-gradient(180deg, #FFFFFF 0%, #E1E1E1 100%)` fixo (via token semântico em `index.css`, ex.: `--app-bg-gradient`, aplicado em `body` e no `<main>` do `MainLayout`).
- Topbar mantém a cor atual (sem alteração).
- Cards continuam com `bg-card` (branco) para contraste.

**Tabelas (globais — shadcn `Table` e listas atuais):**
- Inverter zebra: linha "destacada" (hoje escura) passa a `bg-white`; linha alterna fica levemente cinza (`bg-muted/40`).
- Hover: `hover:bg-muted/60`.
- **Ícones nas linhas:** hoje ficam invisíveis por herdar cor sobre fundo escuro. Ajustar para `text-foreground/70` com `hover:text-foreground`, garantindo contraste tanto na linha branca quanto na cinza.
- Alterações centralizadas em `src/components/ui/table.tsx` e nos utilitários de linha usados em `TableRow` (mudança de classes em `data-state=selected` / zebra utility) para propagar a todas as telas.

## Detalhes técnicos

- Arquivos alterados:
  - `src/pages/arqo/ArqoConfig.tsx` (sentinel `__none__`).
  - `src/components/arqo/ArqoConfigCrud.tsx` (normalização `__none__` ↔ `null` no save/load).
  - `src/index.css` (token `--app-bg-gradient`, ajustes de zebra/hover de tabela).
  - `src/components/ui/table.tsx` (classes de `TableRow`).
  - `src/components/layout/MainLayout.tsx` (aplicar fundo em `<main>`).
  - `src/components/layout/AppTopbar.tsx` (integrar `SevenMegaMenu`, reordenar grupos).
  - `src/components/layout/SevenMegaMenu.tsx` (novo).
  - `src/pages/arqo/ArqoLeads.tsx` (botão "Importar (em breve)" apenas visual).
- Sem alterações de schema no Supabase.
- Verificação: build + abrir `Arqo → Configurações → SLA → Novo` sem crash; abrir menu Seven em desktop e mobile; conferir contraste das tabelas em `/clientes`, `/empreendimentos`, `/arqo/leads`, `/nexa/agenda`.

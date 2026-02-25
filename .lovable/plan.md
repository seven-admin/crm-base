
# Configuracoes de Etapas + Correcao de Titulos/Rotas

## 1. Correcao de Titulos vs Rotas

Existem inconsistencias entre rotas e titulos de paginas:

| Rota | Titulo Atual | Titulo Correto |
|---|---|---|
| `/negociacoes` | "Propostas" | "Negociacoes" |
| `/negociacoes` subtitle | "Gerencie suas propostas e atividades comerciais" | "Gerencie suas negociacoes e atividades comerciais" |
| `/negociacoes` tab "Propostas" | "Propostas" | "Propostas" (manter, pois e uma sub-aba) |
| `/negociacoes/nova` | verificar | "Nova Ficha de Proposta" (manter) |
| `/configuracoes/negociacoes` | "Configuracao de Negociacoes" | OK |

**Arquivos:** `src/pages/Negociacoes.tsx` - atualizar title do MainLayout de "Propostas" para "Negociacoes" e subtitle.

---

## 2. Configuracao de Etapas de Atividades (nova funcionalidade)

Atualmente o Kanban de atividades usa colunas fixas por status (Pendente, Concluida, Cancelada). Para permitir configuracao de etapas customizaveis:

### 2.1 Nova tabela no banco de dados

```sql
CREATE TABLE atividade_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  cor_bg TEXT NOT NULL DEFAULT '#dbeafe',
  ordem INT NOT NULL DEFAULT 0,
  is_inicial BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE atividade_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica" ON atividade_etapas FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam" ON atividade_etapas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

### 2.2 Componente de configuracao

Criar `src/components/atividades/AtividadeEtapasEditor.tsx` - Reutilizar o mesmo padrao visual do `TicketEtapasEditor` (drag-and-drop, cores, flags inicial/final).

### 2.3 Hook de dados

Criar `src/hooks/useAtividadeEtapas.ts` com:
- `useAtividadeEtapas()` - listar etapas ativas
- `useCreateAtividadeEtapa()`
- `useUpdateAtividadeEtapa()`
- `useDeleteAtividadeEtapa()`
- `useReorderAtividadeEtapas()`

---

## 3. Pagina de Configuracoes Unificada

Atualmente `Configurar Negociacoes` (`/configuracoes/negociacoes`) gerencia apenas pipelines de propostas.

### Opcao: Expandir a pagina existente com Tabs

Adicionar abas na pagina `/configuracoes/negociacoes`:

- **Propostas** (atual): Pipelines e etapas das propostas (conteudo existente)
- **Atividades** (nova): Editor de etapas de atividades

**Arquivo:** `src/pages/ConfiguracaoNegociacoes.tsx`
- Envolver o conteudo existente em `TabsContent value="propostas"`
- Adicionar `TabsContent value="atividades"` com o `AtividadeEtapasEditor`
- Atualizar titulo para "Configuracoes Comerciais"

**Sidebar:** Renomear "Configurar Negociacoes" para "Configuracoes Comerciais" em `Sidebar.tsx`.

---

## 4. Integrar Etapas no Kanban de Atividades

**Arquivo:** `src/components/atividades/AtividadeKanbanBoard.tsx`

Atualmente usa colunas fixas por status. Atualizar para:
- Carregar etapas de `atividade_etapas` via `useAtividadeEtapas()`
- Se existirem etapas configuradas, usar como colunas do Kanban
- Se nao existirem, manter fallback para colunas de status (Pendente/Concluida/Cancelada)
- Adicionar campo `atividade_etapa_id` na tabela `atividades` (migration adicional)

### Migration adicional

```sql
ALTER TABLE atividades ADD COLUMN atividade_etapa_id UUID REFERENCES atividade_etapas(id);
```

---

## Resumo de Arquivos

### Modificar
| Arquivo | Alteracao |
|---|---|
| `src/pages/Negociacoes.tsx` | Titulo "Propostas" -> "Negociacoes" |
| `src/pages/ConfiguracaoNegociacoes.tsx` | Adicionar Tabs (Propostas/Atividades), titulo "Configuracoes Comerciais" |
| `src/components/layout/Sidebar.tsx` | Renomear "Configurar Negociacoes" -> "Configuracoes Comerciais" |
| `src/components/atividades/AtividadeKanbanBoard.tsx` | Usar etapas configuradas como colunas |

### Criar
| Arquivo | Descricao |
|---|---|
| `src/hooks/useAtividadeEtapas.ts` | CRUD de etapas de atividades |
| `src/components/atividades/AtividadeEtapasEditor.tsx` | Editor visual de etapas (mesmo padrao do TicketEtapasEditor) |

### Migrations
1. Criar tabela `atividade_etapas`
2. Adicionar coluna `atividade_etapa_id` em `atividades`

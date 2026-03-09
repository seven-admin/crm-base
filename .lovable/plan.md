

# Relatório de Inscritos no Evento + Validação do Cadastro de Corretor

## Parte 1 — Aba "Inscritos" na página de detalhe do evento (`/eventos/:id`)

### Alteração em `src/pages/EventoDetalhe.tsx`
- Adicionar uma nova aba "Inscritos" no `TabsList` (ao lado de Tarefas, Cronograma, Equipe)
- Renderizar um novo componente `EventoInscritosTab`

### Novo componente `src/components/eventos/EventoInscritosTab.tsx`
- Recebe `eventoId` como prop
- Query na tabela `evento_inscricoes` filtrando pelo evento, com todos os campos (nome, telefone, email, imobiliária, status, data de inscrição)
- Exibe tabela com colunas: Nome, Telefone, Email, Imobiliária, Status, Data
- Badge de status (confirmada/cancelada)
- Contador total de inscritos no topo
- Estado vazio quando não há inscritos

### RLS
A tabela `evento_inscricoes` já existe. Verificar se há política de SELECT para admins/seven team. Se não houver, criar via migração.

### Exportar componente
Atualizar `src/components/eventos/index.ts` para exportar o novo componente.

---

## Parte 2 — Validação robusta no cadastro de corretor

### Alteração em `src/components/auth/CorretorRegisterForm.tsx`

Melhorias no schema Zod e formulário:

1. **Nome completo**: exigir nome e sobrenome (mínimo 2 palavras), apenas letras e espaços
2. **CPF**: já valida (manter)
3. **CRECI**: validar formato mais rigoroso (ex: mínimo 3 caracteres alfanuméricos)
4. **Email**: já valida (manter)
5. **Telefone (WhatsApp)**: já exige mínimo 14 chars (manter), mas renomear label para "WhatsApp" e adicionar campo separado "Telefone de Contato" (opcional mas com validação de formato quando preenchido)

Validações adicionais:
- Nome: `z.string().min(3).refine(val => val.trim().split(/\s+/).length >= 2, 'Informe nome e sobrenome')`
- Telefone WhatsApp: exigir formato completo `(XX) XXXXX-XXXX` (15 chars formatado = celular)
- Adicionar campo `telefone_contato` opcional com mesma formatação

### Alteração na edge function `register-corretor`
- Receber o campo `telefone_contato` adicional (se adicionado)
- Já tem validações server-side adequadas

---

## Arquivos afetados
- `src/pages/EventoDetalhe.tsx` — nova aba
- `src/components/eventos/EventoInscritosTab.tsx` — novo componente
- `src/components/eventos/index.ts` — exportar novo componente
- `src/components/auth/CorretorRegisterForm.tsx` — validações mais rigorosas
- Migração SQL (se RLS de SELECT para admins faltar na `evento_inscricoes`)


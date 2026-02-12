
# Reorganizar layout do modal de Detalhes da Atividade

## Mudanca

**Arquivo:** `src/components/atividades/AtividadeDetalheDialog.tsx`

Mover a secao de **Observacoes** (linhas 231-242) para logo abaixo do titulo e badges (linha 141), antes do Separator e das informacoes principais.

### Novo fluxo do conteudo:

1. Titulo + Badges (tipo, subtipo, status)
2. **Observacoes** (movido para ca, exibido direto sem condicional de existencia -- se vazio, mostra texto "Sem observacoes")
3. Separator
4. Informacoes principais (Cliente, Corretor, Empreendimento, Gestor)
5. Separator
6. Datas (inicio, fim)
7. Prazo (deadline)
8. Resultado / Motivo cancelamento
9. Temperatura / Follow-up
10. Comentarios
11. Acoes admin

### Detalhes

- Remover o bloco de observacoes da posicao atual (linhas 231-242)
- Inserir logo apos os badges (linha 141), antes do primeiro `<Separator />`
- Exibir sempre (sem condicional `{atividade.observacoes && ...}`), mostrando "Sem observacoes" em texto muted quando vazio
- Manter o mesmo estilo visual (fundo `bg-muted/50`, `rounded-lg`, `whitespace-pre-wrap`)

**Arquivos alterados:** 1 (`src/components/atividades/AtividadeDetalheDialog.tsx`)

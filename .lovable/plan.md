

# Exibir comentarios do incorporador no sistema interno

## Resumo

Os comentarios do incorporador atualmente aparecem apenas no Portal do Incorporador. Vamos adiciona-los em dois lugares no sistema interno:

1. **PropostaDialog** (Kanban) - Seção de comentários abaixo dos dados da proposta
2. **KanbanCard** - Indicador visual de que há comentários do incorporador

## Implementação

### 1. Adicionar seção de comentários no PropostaDialog

No arquivo `src/components/negociacoes/PropostaDialog.tsx`:
- Importar `useNegociacaoComentarios` e `useAddNegociacaoComentario`
- Adicionar uma nova aba "Comentários" no TabsList (passando de 2 para 3 colunas)
- Na aba, exibir a lista de comentários com autor e data, e um campo para o time interno responder
- Reutilizar o mesmo padrão visual do `ComentariosSection` do portal

### 2. Indicador visual no KanbanCard

No arquivo `src/components/negociacoes/KanbanCard.tsx`:
- Adicionar um ícone de balão de mensagem com contador quando existem comentários do incorporador
- Usar `useNegociacaoComentarios` para buscar a contagem (ou receber via prop para evitar queries excessivas)

### 3. RLS - SELECT para time interno

Verificar se já existe policy de SELECT em `negociacao_comentarios` para usuários internos (super_admin, gestor_produto, etc). Se não houver, criar migration adicionando policy que permita leitura para `is_seven_team(auth.uid())` ou `is_admin(auth.uid())`.

Criar também policy de INSERT para que o time interno possa responder aos comentários.

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/components/negociacoes/PropostaDialog.tsx` | Nova aba "Comentários" com listagem e campo de resposta |
| `src/components/negociacoes/KanbanCard.tsx` | Indicador visual de comentários pendentes |
| Migration SQL (se necessário) | RLS SELECT/INSERT para time interno na tabela negociacao_comentarios |

## Detalhes técnicos

- A aba de comentários no PropostaDialog terá scroll limitado (max-h) para não dominar o dialog
- Comentários serão exibidos em ordem cronológica reversa (mais recente primeiro)
- O campo de resposta permite que gestores e corretores respondam diretamente ao incorporador
- Os comentários são compartilhados: tanto incorporador quanto time interno veem todos os comentários da negociação

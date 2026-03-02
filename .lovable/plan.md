

# Reestruturar Dashboard de Metas + Corrigir Edicao + Exibir Todos os Campos

## 1. Remover Ranking de Corretores do Dashboard

Remover o card "Ranking de Corretores" (linhas 494-537) e fazer o grafico historico ocupar largura total (remover grid `lg:grid-cols-3`, usar largura total).

**Arquivo:** `src/pages/MetasComerciais.tsx`

## 2. Criar cards separados por tipo de meta (Comercial e Atividades)

Substituir o card unico "Meta do Mes" por dois cards:

- **Card "Meta Comercial"**: VGV (meta_valor), unidades (meta_unidades), propostas (meta_propostas)
- **Card "Meta de Atividades"**: visitas (meta_visitas), atendimentos (meta_atendimentos), treinamentos (meta_treinamentos)

Cada card mostra "Sem meta definida" se nao houver valores para aquele tipo.

## 3. Refatorar `useMetasPorMes` para retornar dados separados por tipo

Modificar o hook para retornar:
- `comercial`: soma apenas das metas tipo "comercial"
- `atividades`: soma apenas das metas tipo "atividades"  
- `consolidado`: soma de tudo (para calculo de atingimento geral)

**Arquivo:** `src/hooks/useMetasComerciais.ts`

## 4. Corrigir dialog de edicao para carregar dados do banco

Atualmente, ao clicar "Editar" na tabela, o tipo de meta NAO e exibido porque o seletor de tipo esta escondido com `{!editingMeta && ...}` (linha 749). 

Correcao: mostrar o tipo de meta tambem ao editar (modo leitura ou editavel), para que os campos corretos aparecam e o usuario veja/altere os valores.

**Arquivo:** `src/pages/MetasComerciais.tsx` - remover a condicao `!editingMeta` do bloco de selecao de tipo (linha 749)

## 5. Exibir todos os campos na tabela de Gerenciar Metas

A tabela ja exibe: Visitas, Atendimentos, Treinamentos, Propostas. O banco de dados NAO possui coluna "ligacoes" (`meta_ligacoes`). Se o usuario deseja rastrear ligacoes, sera necessario criar essa coluna no banco.

Alternativa (sem migration): verificar se o campo que o usuario chama de "ligacoes" ja existe com outro nome. Caso nao, sera adicionada uma nova coluna `meta_ligacoes` ao banco e ao formulario/tabela.

## 6. Ajustar layout dos KPIs do dashboard

Grid passara para 5 cards: Meta Comercial, Meta Atividades, Vendas Realizadas, Atingimento, Forecast Ponderado.

Layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-5`

## Resumo das alteracoes

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useMetasComerciais.ts` | Retornar dados separados por tipo (comercial/atividades/consolidado) |
| `src/pages/MetasComerciais.tsx` | Remover ranking, criar 2 cards de meta, corrigir dialog de edicao, ajustar grid |
| Migration SQL (se necessario) | Adicionar coluna `meta_ligacoes` caso o usuario confirme |

## Ponto de atencao

O banco nao tem coluna `meta_ligacoes`. Se "ligacoes" for um campo desejado, precisaremos de uma migration para adiciona-lo. Caso o usuario esteja se referindo a um campo existente (como atendimentos ou propostas), nenhuma alteracao no banco sera necessaria.


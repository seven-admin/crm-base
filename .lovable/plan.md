
# Mover aba Atividades de Negociações para Diário de Bordo

## O que sera feito

1. Remover a aba "Atividades" e o componente `AtividadesMetricsAndBoard` da pagina `/negociacoes` (`src/pages/Negociacoes.tsx`)
2. Adicionar uma estrutura de abas no Diario de Bordo (`src/pages/DiarioBordo.tsx`) com duas abas: "Resumo" (conteudo atual) e "Atividades" (kanban de atividades comerciais movido de Negociacoes)
3. Mover a funcao `AtividadesMetricsAndBoard` para o Diario de Bordo (ou extrair para componente separado)

## Detalhes tecnicos

### `src/pages/Negociacoes.tsx`
- Remover a aba "Atividades" do `TabsList` principal (linhas 107-112)
- Remover o `TabsContent value="atividades"` (linhas 244-246)
- Remover o componente `AtividadesMetricsAndBoard` (linhas 251-343)
- Remover estado `mainTab` e simplificar -- a pagina deixa de ter abas principais (fica so Propostas)
- Remover imports nao utilizados: `AtividadeKanbanBoard`, `TemperaturaSelector`, `useAtividades`, `useAtividadeEtapas`, `TIPOS_NEGOCIACAO`, `isSameMonth`

### `src/pages/DiarioBordo.tsx`
- Adicionar `Tabs` com duas abas: "Resumo" (conteudo atual: cards de categoria + visitas) e "Atividades" (kanban comercial)
- Importar e incluir o componente `AtividadesMetricsAndBoard` (movido de Negociacoes) na aba "Atividades"
- Adicionar imports necessarios: `Tabs, TabsList, TabsTrigger, TabsContent`, `AtividadeKanbanBoard`, `TemperaturaSelector`, `useAtividades`, `useAtividadeEtapas`, `TIPOS_NEGOCIACAO`, `Card`, `isSameMonth`

### Estrutura final do Diario de Bordo

```text
+------------------------------------------+
| Diario de Bordo          [filtros/acoes]  |
+------------------------------------------+
| [Resumo]  [Atividades]                    |
+------------------------------------------+
| (conteudo da aba selecionada)             |
+------------------------------------------+
```

- **Aba Resumo**: Cards por categoria + Visitas por Empreendimento (conteudo atual)
- **Aba Atividades**: Navegador de mes + filtro temperatura + metricas + Kanban de atividades comerciais (movido de Negociacoes)

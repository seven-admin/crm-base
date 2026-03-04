

# Adicionar Cards de Categoria no Dashboard do Forecast (Portal Incorporador)

## Problema
A aba **Dashboard** em `/portal-incorporador/forecast` exibe apenas o card "Previsões e Negócios" (negociações). Os cards de categoria (Seven, Incorporadora, Imobiliária, Cliente) com resumo de atividades do tipo forecast (atendimento, negociação, contra_proposta_atividade) só aparecem na aba "Atividades".

## Solução

**Arquivo:** `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

1. **Importar `TIPOS_FORECAST`** (ou `TIPOS_NEGOCIACAO`) de `@/types/atividades.types` para filtrar apenas atividades do pipeline comercial.

2. **Adicionar filtro de tipos** na chamada existente de `useResumoAtividadesPorCategoria` (linha 120-122), passando `TIPOS_FORECAST` como último parâmetro — assim como o Forecast principal faz.

3. **Inserir os 4 CategoriaCards na aba Dashboard** (antes do card "Previsões e Negócios", linha ~217), reutilizando o mesmo bloco de grid que já existe na aba "Atividades" (linhas 371-386).

O resultado: a aba Dashboard mostrará primeiro os 4 cards de categoria com breakdown por tipo de atividade (atendimento, fechamento, assinatura, negociação) e logo abaixo o card de negociações com gráficos e lista.


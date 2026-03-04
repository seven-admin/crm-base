

# Adicionar Card "Pessoas Treinadas" no Resumo

## Objetivo
Criar um card KPI na página de Resumo (Forecast) que exiba o total de pessoas treinadas no período, somando `qtd_participantes` das atividades de tipo `treinamento`.

## Alterações

### 1. Novo hook `usePessoasTreinadas` (em `useForecast.ts`)
- Query na tabela `atividades` filtrando `tipo = 'treinamento'` e `status != 'cancelada'` no período
- Somar `qtd_participantes` de todos os registros
- Retornar: `{ totalPessoas, totalTreinamentos }`

### 2. Card na página `Forecast.tsx`
- Adicionar um card acima ou junto aos cards de categoria na aba **Atividades**
- Ícone: `GraduationCap` (já usado no projeto para treinamento)
- Exibir o total de pessoas treinadas como valor principal e total de treinamentos como subtexto
- Seguir o mesmo estilo dos KPIs financeiros já existentes (ícone + label + valor)

### Posicionamento
O card será renderizado na aba "Atividades", antes dos cards de categoria, como um KPI de destaque.


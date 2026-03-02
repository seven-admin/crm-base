
# Adicionar temperatura "Morto" nas atividades

## O que muda

Adicionar a opcao "Morto" (💀) como uma quarta temperatura, representando clientes/negociacoes sem perspectiva. A cor sera cinza escuro para diferenciar visualmente.

## Arquivos a alterar

### 1. `src/types/clientes.types.ts`
- Adicionar `'morto'` ao type `ClienteTemperatura`
- Adicionar label em `CLIENTE_TEMPERATURA_LABELS`: `morto: 'Morto'`
- Adicionar cor em `CLIENTE_TEMPERATURA_COLORS`: `morto: 'bg-gray-100 text-gray-800 border-gray-200'`

### 2. `src/components/atividades/TemperaturaSelector.tsx`
- Adicionar item no array `TEMPERATURAS`: `{ value: 'morto', label: 'Morto', emoji: '💀', activeClass: 'bg-gray-700 text-white border-gray-700', inactiveClass: 'border-gray-400 text-gray-600 hover:bg-gray-50' }`

### 3. `src/components/forecast/FunilTemperatura.tsx`
- Adicionar cor no `CORES_TEMPERATURA`: `morto: 'hsl(var(--chart-4))'`

### 4. `src/components/clientes/ClienteForm.tsx`
- Adicionar cor no `colorMap` local: `morto: 'border-gray-400 bg-gray-50 text-gray-700'`

## Detalhes tecnicos

- O campo `temperatura_cliente` no banco de dados eh do tipo `TEXT` (sem constraint de enum), entao nao precisa de migracao SQL
- O type `ClienteTemperatura` eh a unica fonte de verdade e propaga automaticamente para todos os componentes que usam `Record<ClienteTemperatura, ...>`
- O TypeScript vai apontar erros em qualquer `Record` incompleto, garantindo que nenhum arquivo fique de fora

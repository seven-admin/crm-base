Plano para revisar e corrigir a contabilização em `/forecast`

## Diagnóstico encontrado

A tela `/forecast` atual não lê a tabela `negociacoes` para os cards de volume. Ela conta registros da tabela `atividades`, separados assim:

- Aba **Negociações**: `atendimento`, `negociacao`, `contra_proposta_atividade`
- Aba **Atividades**: `ligacao`, `meeting`, `reuniao`, `acompanhamento`, `treinamento`, `visita`, `administrativa`

Na competência atual analisada, a soma por tipo fecha no banco:

- 163 atividades não canceladas no mês
- 23 entram na aba Negociações
- 140 entram na aba Atividades
- 2 canceladas ficam fora

Mas existem problemas reais que explicam a desconfiança:

1. **O modal aberto ao clicar nos badges não usa o filtro da aba**
   - O card da aba Negociações mostra só tipos de negociação.
   - O card da aba Atividades mostra só tipos operacionais.
   - Porém o `ForecastBatchStatusDialog` busca por categoria/status sem filtrar o tipo.
   - Exemplo: em Cliente/Fechadas, o card de Negociações pode mostrar 9, o card de Atividades 135, mas o modal retorna 144 porque mistura as duas abas.

2. **A classificação de status do card e do modal diverge**
   - O card usa uma regra de competência: mês atual = hoje; mês passado/futuro = fim do mês selecionado.
   - O modal usa sempre a data real de hoje.
   - O modal também classifica “abertas” como `data_fim >= hoje`, então pode incluir atividades futuras que o card separa como “futuras”.

3. **Há ambiguidade de nomenclatura**
   - A aba “Negociações” está contando atividades de negociação, não fichas/propostas da tabela `negociacoes`.
   - No banco, no mesmo período, há diferença entre os dois conceitos: atividades de negociação e negociações reais não necessariamente têm a mesma quantidade.

4. **Há constantes antigas conflitantes**
   - Existe `TIPOS_FORECAST = ['atendimento', 'fechamento', 'assinatura']`, mas `/forecast` usa `TIPOS_NEGOCIACAO = ['atendimento', 'negociacao', 'contra_proposta_atividade']`.
   - Isso precisa ficar explícito para evitar novas contagens inconsistentes.

## Correção proposta

### 1. Centralizar a regra de classificação
Criar uma função compartilhada para classificar atividades como:

```text
concluida  -> fechadas
pendente + data_fim < referência -> atrasadas
pendente + data_inicio > referência -> futuras
pendente + data_inicio <= referência <= data_fim -> abertas
cancelada -> fora
```

A data de referência será a mesma dos cards:

```text
mês atual: hoje
outros meses: último dia da competência selecionada
```

### 2. Aplicar a mesma regra nos cards e no modal
Atualizar:

- `useResumoAtividadesPorCategoria`
- `ForecastBatchStatusDialog`

para usarem a mesma regra de datas/status.

### 3. Fazer o modal respeitar a aba selecionada
Adicionar ao estado do clique do badge qual conjunto de tipos está ativo:

- Clique na aba **Negociações** envia `TIPOS_NEGOCIACAO`
- Clique na aba **Atividades** envia `TIPOS_DIARIO`

O modal passará a filtrar por `tipo IN (...)`, evitando misturar atividades comerciais e operacionais.

### 4. Ajustar também o Diário de Bordo
Como o mesmo modal é usado no Diário de Bordo, passar explicitamente `TIPOS_DIARIO` ali também para manter consistência.

### 5. Manter o conceito atual sem trocar a fonte de dados
Neste ajuste, não vou trocar a aba “Negociações” para a tabela `negociacoes`; vou corrigir a contagem das **atividades de negociação**, que é o que a tela hoje se propõe a mostrar.

Se depois você quiser, podemos fazer uma segunda mudança separada para exibir também “negociações reais/fichas de proposta” vindas da tabela `negociacoes`.

## Validação após implementar

Vou validar com consultas diretas no Supabase:

- Total por aba e por categoria no período selecionado
- Abertas/fechadas/futuras/atrasadas usando a mesma regra do frontend
- Conferência de que o modal retorna exatamente os mesmos registros que formam o número clicado no card
- Verificação específica para mês atual e mês anterior
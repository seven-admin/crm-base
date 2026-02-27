
Objetivo
- Remover definitivamente as “vendas históricas” (cliente COMPRADOR HISTÓRICO) de todas as contagens e somatórios de valor exibidos em /metas-comerciais.

Diagnóstico do que está acontecendo hoje
- A tela de Metas Comerciais consome os hooks de `src/hooks/useMetasComerciais.ts`.
- Nesse arquivo, os cálculos de valor e vendas vêm de queries em `contratos` sem exclusão de `cliente_id` histórico.
- Foram encontrados 4 pontos críticos sem filtro:
  1) `useVendasRealizadasMes` (card “Vendas Realizadas”, atingimento valor/unidades)
  2) `useRankingCorretoresMes` (ranking por valor e unidades)
  3) `useHistoricoMetas` (gráfico “Realizado vs Meta - últimos 6 meses”)
  4) `useMetasVsRealizadoPorEmpreendimento` (gráfico comparativo por empreendimento)
- Resultado: mesmo com correções em outros dashboards, em Metas Comerciais os contratos históricos continuam entrando no realizado.

Implementação proposta
1) Padronizar filtro de histórico dentro de `useMetasComerciais.ts`
- Importar `getClientesHistoricosIds` de `@/lib/contratoFilters`.
- Em cada hook que consulta `contratos`, buscar IDs históricos no início da `queryFn`.
- Aplicar exclusão via SQL quando houver IDs:
  - `.not('cliente_id', 'in', \`(${historicosIds.join(',')})\`)`
- Se não houver IDs, manter query normal (evita filtro inválido com lista vazia).

2) Ajustar cada query de contratos usada em métricas de valor
- `useVendasRealizadasMes`:
  - Excluir cliente histórico antes de calcular `totalValor` e `totalUnidades`.
- `useRankingCorretoresMes`:
  - Excluir cliente histórico antes de agregar `valor` e `unidades` por corretor.
- `useHistoricoMetas`:
  - Excluir cliente histórico na bulk query de contratos para que `realizado` mensal não infle.
- `useMetasVsRealizadoPorEmpreendimento`:
  - Excluir cliente histórico na query `todasVendas` para corrigir barras de “Realizado”.

3) Garantir consistência com o padrão já adotado no projeto
- Reutilizar o helper já existente (`getClientesHistoricosIds`) e o mesmo critério semântico global.
- Não alterar comportamento de metas cadastradas; apenas remover histórico das vendas consideradas no realizado.

4) Validação após implementação
- Em `/metas-comerciais`, validar para o mesmo mês/empreendimento:
  - Card “Vendas Realizadas” reduzindo para o valor sem histórico.
  - Atingimento (%) recalculado corretamente.
  - Ranking de corretores sem vendas do cliente histórico.
  - Histórico de 6 meses sem picos artificiais do legado.
  - “Meta vs Realizado por Empreendimento” sem realizado inflado.
- Conferir também com filtro “Todos os empreendimentos” e com empreendimento específico.

Riscos e cuidados
- O filtro `in (...)` precisa ser aplicado apenas quando houver IDs (lista vazia quebraria a condição).
- Todas as queries de contratos no arquivo devem manter o mesmo critério para evitar divergência entre cards e gráficos.
- Manter `queryKey` atual (sem breaking change), pois a invalidação já ocorre nos pontos corretos.

Arquivos impactados
- `src/hooks/useMetasComerciais.ts` (único arquivo necessário para esta correção específica em Metas Comerciais).

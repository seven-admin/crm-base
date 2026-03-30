
Objetivo: corrigir de forma definitiva o problema em `/atividades` em que registros recém-criados “não aparecem”, além do caso específico do Pedro com a atividade de “SELEIDO DE ARAUJO OLIVEIRA”.

Diagnóstico confirmado
1. A atividade foi salva no banco com sucesso:
   - `id = de16e458-7c47-43b7-9c74-10f219c09878`
   - `titulo = LIGAÇÃO PARA SELEIDO DE ARAUJO OLIVEIRA`
   - `created_by = Pedro`
   - `gestor_id = Pedro`
2. Portanto, não é mais um problema principal de RLS.
3. O registro foi salvo sem vínculo:
   - `cliente_id = null`
   - `empreendimento_id = null`
4. Na listagem, o hook `useAtividades` ordena apenas por `data_inicio desc`.
   - Como Pedro criou muitas atividades no mesmo dia, itens novos ficam misturados no meio da página.
   - Isso gera a impressão de que “sumiu” e que só aparece após F5.
5. O sistema hoje não tem assinatura realtime para `atividades`, então a tela depende só de invalidação/refetch do React Query.
6. No cadastro via histórico do cliente, existe forte indício de falha de vínculo no formulário:
   - o dialog passa `defaultClienteId` e `lockCliente`
   - mas a atividade do caso “SELEIDO...” foi gravada com `cliente_id null`
   - então precisamos blindar esse fluxo no frontend, não só confiar no valor inicial do form.

O que implementar

1. Corrigir a ordenação das atividades recém-criadas
- Em `src/hooks/useAtividades.ts`, mudar a ordenação principal da listagem para:
  - `data_inicio desc`
  - `created_at desc` como critério secundário
- Se necessário, usar `updated_at desc`/`created_at desc` como desempate final.
Resultado esperado:
- atividades novas sobem imediatamente para o topo da lista do dia, sem parecer “sumidas”.

2. Garantir vínculo obrigatório quando a atividade nasce do histórico do cliente
- Em `src/components/clientes/ClienteHistoricoAtividadesDialog.tsx`:
  - reforçar o `cliente.id` no submit antes de chamar a mutation
  - não depender apenas do `defaultClienteId` no formulário
- Em `src/components/atividades/AtividadeForm.tsx`:
  - blindar o submit para preservar `defaultClienteId` quando `lockCliente = true`
  - evitar que `cliente_id` saia como `undefined` nesse cenário
Resultado esperado:
- ao abrir “Nova Atividade” dentro do cliente, o `cliente_id` sempre vai preenchido no insert.

3. Melhorar atualização imediata sem F5
- Em `src/hooks/useAtividades.ts`:
  - após criar atividade, fazer atualização otimista simples ou invalidar/refetch explícito das queries ativas de lista/agenda
- Adicionar um subscription realtime para `atividades`:
  - escutar `INSERT/UPDATE`
  - invalidar `['atividades']`, `['agenda']`, `['forecast']` quando houver mudança
Resultado esperado:
- novos registros aparecem automaticamente sem reload manual.

4. Revisar filtros para não esconder registros do usuário
- Conferir a inicialização da página `/atividades` para garantir que não exista filtro residual mascarando os dados recém-criados.
- Manter a paginação, mas com a nova ordenação para não esconder os itens atuais na página 2+.
Resultado esperado:
- o usuário encontra a atividade recém-cadastrada na primeira página.

5. Correção complementar de UX/debug
- Melhorar a mensagem de erro/sucesso do create para incluir contexto quando houver falha de vínculo.
- Opcionalmente exibir badge “Sem cliente”/“Sem empreendimento” de forma mais evidente, para facilitar suporte.

Arquivos previstos
- `src/hooks/useAtividades.ts`
- `src/components/atividades/AtividadeForm.tsx`
- `src/components/clientes/ClienteHistoricoAtividadesDialog.tsx`

Detalhes técnicos
```text
Problema real = combinação de 3 fatores:
1) insert funciona
2) vínculo do cliente pode se perder no form do histórico
3) lista ordena por data_inicio apenas, então registros do mesmo dia ficam “embaralhados”
4) sem realtime, a UI nem sempre reflete de imediato
```

Validação pós-implementação
1. Criar atividade dentro do histórico de um cliente e confirmar:
   - `cliente_id` preenchido
   - item aparece imediatamente no histórico
2. Criar atividade em `/atividades` com o usuário Pedro:
   - sem F5
   - item deve aparecer no topo da lista
3. Criar várias atividades no mesmo dia:
   - a mais recente deve ficar primeiro
4. Testar edição/conclusão:
   - lista e agenda atualizam sem reload

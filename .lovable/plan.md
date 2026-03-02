
# Corrigir auto-criacao de negociacao para atividades sem empreendimento

## Problema

Atividades comerciais (atendimento, negociacao, contra_proposta) criadas por gestores de produto frequentemente nao tem `empreendimento_id` preenchido diretamente. Porem, o gestor tem um empreendimento vinculado via tabela `user_empreendimentos`. Exemplo real:

- Gestor `f5beb78c` tem vinculo com "RESERVA DO LAGO" (`13fc62b0`)
- Atividades criadas por ele nao tem `empreendimento_id`
- A tabela `negociacoes` exige `empreendimento_id` (NOT NULL)
- O insert falha silenciosamente e a negociacao nunca aparece no Kanban

## Solucao

**Arquivo:** `src/hooks/useAtividades.ts`

Nos dois blocos de auto-criacao de negociacao (create na linha ~225 e update na linha ~367):

1. Quando `empreendimento_id` for `null`, buscar o empreendimento do gestor via `user_empreendimentos`:
   - Usar o `gestor_id` da atividade
   - Query: `user_empreendimentos` filtrado pelo `user_id = gestor_id`, pegando o primeiro empreendimento ativo

2. Se encontrar empreendimento, usar esse valor para criar a negociacao

3. Se nao encontrar nem no gestor, nao criar negociacao (sem empreendimento nao faz sentido no Kanban)

4. Corrigir a query de deduplicacao que usa `.eq('empreendimento_id', '')` — deve usar o empreendimento resolvido

### Logica a ser adicionada (antes do insert)

```text
let empreendimentoIdFinal = empreendimentoId;

if (!empreendimentoIdFinal && gestorId) {
  // Buscar empreendimento vinculado ao gestor
  const { data: link } = await supabase
    .from('user_empreendimentos')
    .select('empreendimento_id')
    .eq('user_id', gestorId)
    .limit(1)
    .maybeSingle();
  
  if (link) empreendimentoIdFinal = link.empreendimento_id;
}

if (!empreendimentoIdFinal) return; // sem empreendimento, nao cria
```

### Pontos de alteracao

| Bloco | Linhas aprox. | Descricao |
|-------|--------------|-----------|
| useCreateAtividade | 225-262 | Adicionar fallback para buscar empreendimento do gestor |
| useUpdateAtividade | 367-407 | Mesma logica de fallback |

## Resultado esperado

Todas as atividades comerciais com gestor vinculado a um empreendimento vao gerar automaticamente uma negociacao no Kanban na etapa "Atendimento", mesmo quando o campo `empreendimento_id` da atividade estiver vazio.

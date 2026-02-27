
# Duas alteracoes na tela de Atividades

## 1. Temperatura na tabela: exibir apenas o label selecionado (ou "-")

### Problema atual
Na listagem (tabela), a coluna "Temperatura" usa o `TemperaturaSelector` com 3 botoes (Frio, Morno, Quente) sempre visiveis, ocupando espaco e poluindo a tabela.

### Solucao
Substituir o `TemperaturaSelector` na tabela por um display simples:
- Se a atividade tem temperatura selecionada: exibir apenas o badge correspondente (ex: "Quente" com cor vermelha) como um botao clicavel que abre um pequeno popover/dropdown para alterar
- Se nao tem temperatura: exibir apenas "-"

**Alternativa mais simples**: manter o `TemperaturaSelector` mas adicionar uma prop `displayMode` que, quando ativa, mostra apenas o label selecionado (clicavel para expandir os 3 botoes) ou "-" quando vazio.

### Arquivo alterado
- `src/components/atividades/TemperaturaSelector.tsx` -- adicionar prop `displayOnly` ou criar modo compacto que mostra so o valor selecionado
- `src/pages/Atividades.tsx` (linha ~847) -- usar o novo modo

### Comportamento
- Sem selecao: renderiza `<span>-</span>`
- Com selecao: renderiza apenas o badge ativo (ex: "Quente" em vermelho), clicavel para abrir os 3 botoes e permitir troca

---

## 2. Cliente obrigatorio para atividades de negociacao

### Problema atual
O campo `cliente_id` no formulario de atividades e opcional (`z.string().optional()`). Para atividades do tipo negociacao (`TIPOS_NEGOCIACAO`: atendimento, negociacao, contra_proposta_atividade), o cliente deveria ser obrigatorio.

### Solucao
Adicionar validacao condicional no schema Zod (dentro do `superRefine` existente na linha 82) que verifica:
- Se o tipo pertence a `TIPOS_NEGOCIACAO`, entao `cliente_id` deve estar preenchido
- Caso contrario, permanece opcional

Alem disso, exibir indicacao visual no label do campo Cliente (asterisco "*") quando o tipo for de negociacao.

### Arquivos alterados
- `src/components/atividades/AtividadeForm.tsx`:
  - Adicionar validacao no `superRefine` do schema Zod para exigir `cliente_id` quando tipo esta em `TIPOS_NEGOCIACAO`
  - Adicionar asterisco no label "Cliente" quando tipo for de negociacao
  - O botao "+ Novo Cliente" ja existe e continuara disponivel

### Detalhes tecnicos

No `superRefine`:
```typescript
if (TIPOS_NEGOCIACAO.includes(values.tipo) && !values.cliente_id) {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['cliente_id'],
    message: 'Cliente é obrigatório para atividades de negociação',
  });
}
```

Como o schema e definido fora do componente, sera necessario mover a validacao condicional para o `handleNextStep` / `handleSubmit` ou usar `superRefine` que ja tem acesso a todos os campos.

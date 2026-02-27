
# Auto-definir categoria "Cliente" para atividades de Atendimento

## Problema
Quando o tipo da atividade e "Atendimento" (e possivelmente os demais tipos do fluxo comercial como fechamento, assinatura, negociacao, contra_proposta_atividade), a unica categoria possivel e "Cliente". Nao faz sentido exibir os 4 botoes de categoria nesse caso.

## Solucao

### Arquivo: `src/components/atividades/AtividadeForm.tsx`

1. **Definir quais tipos sao exclusivamente de cliente**: Criar uma constante local (ou importar `TIPOS_FORECAST` + `TIPOS_NEGOCIACAO`) para identificar os tipos que sao obrigatoriamente categoria "cliente". Tipos candidatos: `atendimento`, `fechamento`, `assinatura`, `negociacao`, `contra_proposta_atividade`.

2. **Auto-setar categoria ao selecionar o tipo**: No `useEffect` ou no handler de selecao de tipo, quando o tipo selecionado pertence a essa lista, chamar `form.setValue('categoria', 'cliente')` automaticamente.

3. **Esconder o bloco de Categoria**: Envolver o `FormField` de categoria (linhas 408-440) em uma condicional que so renderiza se o tipo **nao** pertence a lista de tipos exclusivos de cliente.

4. **Validacao**: No `handleNextStep`, pular a validacao de categoria quando ela ja foi auto-definida (o campo tera valor "cliente", entao a validacao do zod passa normalmente).

### Resultado
- Ao selecionar "Atendimento", "Fechamento", "Assinatura", "Negociacao" ou "Contra Proposta": categoria e automaticamente definida como "Cliente" e o seletor de categoria desaparece do formulario.
- Para os demais tipos (Ligacao, Meeting, Reuniao, Visita, etc.): o seletor de categoria continua aparecendo normalmente com as 4 opcoes.

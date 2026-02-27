
# Reiniciar contadores (sequences) do sistema

## O que sera feito

Criar uma edge function `reset-sequence` que permite reiniciar qualquer sequencia do banco para um valor especifico, e adicionar uma interface na pagina de Configuracoes para gerenciar isso.

## Sequences disponiveis

| Sequencia | Prefixo | Valor atual |
|-----------|---------|-------------|
| negociacao_codigo_seq | NEG- | 24 |
| negociacao_proposta_seq | PROP- | 7 |
| proposta_numero_seq | (ano-) | 1 |
| briefing_codigo_seq | BRF- | 62 |
| projeto_codigo_seq | MKT- | 62 |
| contrato_numero_seq | CONT- | 32 |
| comissao_numero_seq | COM- | 3 |
| evento_codigo_seq | EVT- | 2 |
| reserva_protocolo_seq | RES- | 1 |

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/reset-sequence/index.ts` | Nova edge function que executa `ALTER SEQUENCE ... RESTART WITH` usando service_role |
| `src/components/configuracoes/SequencesResetSection.tsx` | Novo componente com lista de sequences, valor atual e botao para reiniciar cada uma |
| `src/hooks/useSequences.ts` | Hook com query para buscar valores atuais e mutation para chamar a edge function |
| `src/pages/Configuracoes.tsx` | Adicionar nova aba "Contadores" (visivel apenas para super_admin) |
| `supabase/config.toml` | Registrar `reset-sequence` com `verify_jwt = false` |

## Detalhes tecnicos

### Edge function reset-sequence

- Recebe POST com `{ sequence_name: string, restart_value: number }`
- Valida que `sequence_name` esta numa whitelist fixa das 9 sequences permitidas (previne SQL injection)
- Executa via Supabase Admin client: `ALTER SEQUENCE {name} RESTART WITH {value}`
- Requer autenticacao -- valida o JWT do usuario e verifica se e super_admin

### Hook useSequences

- `useSequenceValues()`: query que chama uma database function `get_all_sequence_values()` para retornar os valores atuais
- `useResetSequence()`: mutation que invoca a edge function

### Migration SQL

- Criar funcao `get_all_sequence_values()` que retorna uma tabela com (seq_name, last_value) para as 9 sequences, chamavel via RPC

### Componente SequencesResetSection

- Tabela com colunas: Nome do contador, Prefixo, Valor atual, Campo para novo valor, Botao reiniciar
- Confirmacao via AlertDialog antes de executar
- Apenas super_admin tem acesso (mesma logica das outras abas)

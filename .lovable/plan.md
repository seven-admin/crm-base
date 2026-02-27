

# Cronometro de Tempo para Atividades

## Objetivo
Adicionar um cronometro (timer) nas atividades de tipo **atendimento**, **visita** e **negociacao** que permite iniciar e parar a contagem de tempo durante a execucao da atividade, registrando a duracao real.

## Alteracoes no Banco de Dados

Adicionar 3 colunas na tabela `atividades`:
- `cronometro_inicio` (timestamptz, nullable) -- momento em que o cronometro foi iniciado
- `cronometro_fim` (timestamptz, nullable) -- momento em que o cronometro foi parado
- `duracao_minutos` (integer, nullable) -- duracao total em minutos (calculada ao parar)

## Novo Componente: `AtividadeCronometro`

Componente React que exibe um cronometro interativo:

- **Estado parado (sem inicio)**: Botao "Iniciar Cronometro" (icone Play)
- **Estado rodando**: Display do tempo decorrido (HH:MM:SS) atualizado a cada segundo + Botao "Parar" (icone Square)
- **Estado finalizado**: Display do tempo total com label "Duracao: Xh Ym"

Logica:
- Ao clicar "Iniciar", grava `cronometro_inicio = now()` no banco via `useUpdateAtividade`
- Enquanto rodando, calcula `agora - cronometro_inicio` a cada segundo com `setInterval`
- Ao clicar "Parar", grava `cronometro_fim = now()` e `duracao_minutos = diff em minutos`
- Se a pagina for recarregada com `cronometro_inicio` preenchido e `cronometro_fim` nulo, retoma a contagem automaticamente

Arquivo: `src/components/atividades/AtividadeCronometro.tsx`

## Integracao

### 1. Tipos (`src/types/atividades.types.ts`)
Adicionar campos `cronometro_inicio`, `cronometro_fim`, `duracao_minutos` na interface `Atividade`.

### 2. Dialog de Detalhe (`AtividadeDetalheDialog.tsx`)
Renderizar `<AtividadeCronometro>` para atividades pendentes do tipo atendimento, visita ou negociacao. Exibir duracao para atividades concluidas que tenham `duracao_minutos`.

### 3. Hook `useAtividades.ts`
Garantir que o `useUpdateAtividade` ja suporta atualizar campos arbitrarios (ja suporta via `Partial<AtividadeFormData>` + spread). Adicionar os novos campos ao select das queries.

### 4. Tabela de Atividades (`Atividades.tsx`)
Adicionar coluna "Duracao" na tabela (apos a coluna de horario), exibindo `duracao_minutos` formatado quando preenchido, ou um indicador de "Em andamento" quando `cronometro_inicio` esta preenchido sem `cronometro_fim`.

## Tipos que exibem o cronometro

Apenas: `atendimento`, `visita`, `negociacao`

Definir constante:
```typescript
const TIPOS_COM_CRONOMETRO: AtividadeTipo[] = ['atendimento', 'visita', 'negociacao'];
```

## Arquivos a criar/alterar

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar 3 colunas na tabela atividades |
| `src/components/atividades/AtividadeCronometro.tsx` | **Criar** - componente do cronometro |
| `src/types/atividades.types.ts` | Adicionar campos na interface Atividade |
| `src/components/atividades/AtividadeDetalheDialog.tsx` | Integrar cronometro |
| `src/pages/Atividades.tsx` | Coluna "Duracao" na tabela |
| `src/hooks/useAtividades.ts` | Garantir select dos novos campos |

## UX do Cronometro

```text
+-------------------------------------------+
|  [>] Iniciar Cronometro                    |   (estado inicial)
+-------------------------------------------+

+-------------------------------------------+
|  00:12:34          [■] Parar               |   (rodando)
+-------------------------------------------+

+-------------------------------------------+
|  Duracao: 45 min                           |   (finalizado)
+-------------------------------------------+
```

O cronometro aparece dentro do dialog de detalhe e so e interativo quando a atividade esta pendente.

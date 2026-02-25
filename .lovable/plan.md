
# Renomear Botoes do Modal e Criar Tipos de Atendimento Configuraveis

## 1. Renomear botoes do modal "Nova Atividade"

No `AtividadeForm.tsx` (linhas 253-286):
- Botao "Negociacao" -> "Atendimento" (manter icone Handshake)
- Botao "Atividade" -> "Atividades Diarias" (manter icone ClipboardList)
- Remover as descricoes abaixo dos nomes ("Atendimento, Assinatura" e "Ligacao, Reuniao, Visita...")

## 2. Novos tipos de atendimento comercial

Atualmente `TIPOS_NEGOCIACAO = ['atendimento', 'assinatura']`. Precisa incluir novos tipos vinculados ao kanban de negociacoes:

- **Atendimento** (ja existe)
- **Negociacao** (novo tipo - `negociacao`)
- **Contra Proposta** (novo tipo - `contra_proposta_atividade`)

### Alteracoes em `src/types/atividades.types.ts`:
- Adicionar `'negociacao'` e `'contra_proposta_atividade'` ao type `AtividadeTipo`
- Adicionar labels e icones correspondentes
- Atualizar `TIPOS_NEGOCIACAO` para incluir os novos tipos

### Alteracoes em `src/components/atividades/AtividadeForm.tsx`:
- Adicionar icones para os novos tipos
- Quando modo = 'negociacao' (agora chamado 'Atendimento'), mostrar os 3 tipos: Atendimento, Negociacao, Contra Proposta

## 3. Configuracao dos tipos de atendimento no painel comercial

Adicionar uma nova aba "Tipos de Atendimento" na pagina `ConfiguracaoNegociacoes.tsx` (ou incorporar na aba "Atividades" existente) onde o admin pode:
- Ver os tipos de atendimento vinculados ao kanban de negociacoes
- Ativar/desativar tipos
- Definir quais tipos aparecem no modo "Atendimento" do formulario

Para isso sera necessario:
- Criar tabela `tipos_atendimento_config` no banco (id, nome, tipo_atividade, ativo, ordem, created_at)
- Criar hook `useTiposAtendimento` para CRUD
- Criar componente `TiposAtendimentoEditor` no painel de configuracoes

**Alternativa simples (recomendada)**: Usar a aba "Atividades" ja existente em Configuracoes Comerciais para adicionar uma secao de "Tipos de Atendimento" que configura quais tipos de atividade pertencem ao modo Atendimento vs Atividades Diarias.

## 4. Mover "Configuracoes Comerciais" para o menu Comercial

No `Sidebar.tsx`:
- Remover `{ icon: GitBranch, label: 'Configuracoes Comerciais', path: '/configuracoes/negociacoes', moduleName: 'negociacoes_config' }` do grupo "Sistema" (linha 156)
- Adicionar ao grupo "Comercial" (apos Metas, linha 98):
  `{ icon: GitBranch, label: 'Configuracoes Comerciais', path: '/configuracoes/negociacoes', moduleName: 'negociacoes_config', adminOnly: true }`

## Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/types/atividades.types.ts` | Adicionar novos tipos de atividade |
| `src/components/atividades/AtividadeForm.tsx` | Renomear botoes e remover descricoes |
| `src/components/atividades/AtividadeKanbanCard.tsx` | Adicionar icones dos novos tipos |
| `src/components/layout/Sidebar.tsx` | Mover Config Comerciais para grupo Comercial |
| `src/pages/ConfiguracaoNegociacoes.tsx` | Adicionar secao de tipos de atendimento |
| Migration SQL | Tabela de configuracao de tipos de atendimento |
| `src/hooks/useTiposAtendimento.ts` | Novo hook para gerenciar tipos |
| `src/components/negociacoes/TiposAtendimentoEditor.tsx` | Novo editor de tipos |

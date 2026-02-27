
# Reorganizar formulario de atividades: Observacoes + 3a etapa

## Resumo
Mover o campo "Observacoes" para fora do Collapsible (exibindo diretamente na Etapa 2), e transformar o conteudo atual de "Mais opcoes" (Corretor e Imobiliaria) em uma terceira etapa do wizard.

## Alteracoes no arquivo `src/components/atividades/AtividadeForm.tsx`

### 1. Atualizar o state de step para suportar 3 etapas
- Mudar `useState<1 | 2>(1)` para `useState<1 | 2 | 3>(1)`
- Atualizar o step indicator para exibir 3 circulos (Configuracao, Detalhes, Responsaveis)

### 2. Mover Observacoes para antes do bloco "Mais opcoes"
- Extrair o FormField de `observacoes` (linhas 887-904) de dentro do `CollapsibleContent`
- Posiciona-lo na Etapa 2, logo apos a secao de Temperatura do Cliente (linha ~824) e antes do Follow-up

### 3. Remover o Collapsible inteiro
- Eliminar o `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` (linhas 826-906)
- Os campos Corretor e Imobiliaria serao movidos para a Etapa 3

### 4. Criar a Etapa 3 - Responsaveis
- Novo bloco `{step === 3 && (...)}` contendo:
  - Corretor (select)
  - Imobiliaria (select)
  - Botoes "Voltar" (volta para step 2) e "Salvar" (submit)

### 5. Ajustar navegacao
- Etapa 2: botao "Proximo" agora vai para step 3 (em vez de submit direto). Botao "Voltar" volta para step 1.
- Etapa 3: botao "Voltar" volta para step 2. Botao "Salvar" faz o submit.
- Na Etapa 2, o botao submit atual sera substituido por "Proximo" para ir a Etapa 3.

### 6. Step indicator visual
Atualizar o indicador de etapas para mostrar 3 passos:

```text
(1) Configuracao --- (2) Detalhes --- (3) Responsaveis
```

## Estrutura final das etapas

| Etapa | Conteudo |
|---|---|
| 1 - Configuracao | Tipo, Subtipo, Categoria, Gestores (super admin) |
| 2 - Detalhes | Titulo, Datas, Horarios, Prazo, Cliente, Empreendimento, Temperatura, **Observacoes**, Follow-up |
| 3 - Responsaveis | Corretor, Imobiliaria |


# Renomear "Imobiliária" e adicionar opcao "Cliente Direto" no formulario de atividades

## Contexto

O formulario de atividades (`AtividadeForm.tsx`) tem 3 etapas no wizard:
1. Configuracao (tipo, categoria, subtipo)
2. Detalhes (titulo, cliente, datas, observacoes)
3. Responsaveis (corretor e imobiliaria)

O usuario quer:
- Renomear "Imobiliaria" para "Imobiliarias e Corretores" (solicitacao anterior)
- Adicionar uma opcao "Cliente Direto" que, quando ativada, pula a etapa 3 e submete direto da etapa 2

## Implementacao

### Arquivo: `src/components/atividades/AtividadeForm.tsx`

**1. Renomear label e placeholder do campo imobiliaria (etapa 3)**
- Label: `Imobiliária (opcional)` → `Imobiliárias e Corretores (opcional)`
- Placeholder: `Selecione a imobiliária` → `Selecione`

**2. Adicionar estado `clienteDirecto`**
- Novo estado: `const [clienteDireto, setClienteDireto] = useState(false)`
- Ao editar atividade existente (`initialData`), inicializar como `true` se `corretor_id` e `imobiliaria_id` forem ambos nulos

**3. Adicionar toggle "Cliente Direto" no final da etapa 2**
- Um `Switch` com label "Cliente Direto (sem imobiliaria/corretor)"
- Quando ativado, limpa `corretor_id` e `imobiliaria_id` do formulario

**4. Alterar navegacao da etapa 2**
- Se `clienteDireto` estiver ativo, o botao "Proximo" vira "Salvar" e submete o formulario diretamente (pulando etapa 3)
- Se `clienteDireto` estiver desativado, navega normalmente para etapa 3

**5. Ocultar etapa 3 no indicador de passos**
- Quando `clienteDireto` estiver ativo, esconder o indicador do passo 3 (circulo "3 - Responsaveis") para refletir que o wizard tem apenas 2 etapas

**6. Limpar campos ao ativar "Cliente Direto"**
- Ao marcar o switch, executar `form.setValue('corretor_id', undefined)` e `form.setValue('imobiliaria_id', undefined)`

## Resumo de mudancas

- **1 arquivo**: `src/components/atividades/AtividadeForm.tsx`
  - Renomear label/placeholder do campo imobiliaria
  - Adicionar estado `clienteDireto` + switch na etapa 2
  - Condicionar navegacao (pular etapa 3 ou submeter direto)
  - Esconder indicador da etapa 3 quando cliente direto ativo

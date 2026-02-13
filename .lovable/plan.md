
# Converter formulario de Atividade em etapas + botoes para Classificacao

## Resumo

Substituir o SelectBox de "Classificacao" (subtipo) por dois botoes inline ("Primeiro Atendimento" / "Retorno"), seguindo o mesmo padrao visual ja usado em Tipo e Categoria. Alem disso, dividir o formulario em 2 etapas (steps) para reduzir o tamanho do modal.

## Estrutura das etapas

### Etapa 1 - Configuracao
- Tipo de Atividade (grid de botoes com icones - ja existe)
- Classificacao / Subtipo (dois botoes inline - substituir o Select atual)
- Categoria (grid de botoes - ja existe)
- Atribuicao para Gestores (card com switch - apenas super_admin, apenas criacao)

### Etapa 2 - Detalhes
- Titulo
- Datas (inicio, fim) e horarios
- Prazo (deadline)
- Cliente
- Empreendimento
- Temperatura do cliente (condicional)
- Secao "Mais opcoes" (corretor, imobiliaria, observacoes)
- Follow-up (switch + data)
- Botao de submit

## Alteracoes tecnicas

### Arquivo: `src/components/atividades/AtividadeForm.tsx`

1. **Adicionar estado `step`** (`useState<1 | 2>(1)`) para controlar a etapa atual.

2. **Substituir o Select de subtipo** (linhas 267-290) por botoes inline:
```text
<div className="grid grid-cols-2 gap-2">
  <button "Primeiro Atendimento" />
  <button "Retorno" />
</div>
```
Mesmo estilo dos botoes de Categoria (border, bg-primary/10 quando selecionado).

3. **Etapa 1**: Renderizar Tipo + Classificacao (condicional) + Categoria + Atribuicao Gestores. Mostrar botao "Proximo" que valida tipo/categoria antes de avancar.

4. **Etapa 2**: Renderizar todos os campos restantes (titulo, datas, cliente, empreendimento, etc.) + botao "Voltar" e botao "Criar/Atualizar".

5. **Indicador de etapa**: Adicionar um indicador simples no topo (ex: "Etapa 1 de 2" / "Etapa 2 de 2" com dots ou barra de progresso).

6. **Ao editar** (`initialData` presente): comecar direto na etapa 1 normalmente, permitindo navegar entre etapas.

## Observacoes
- O formulario continuara dentro do mesmo `<Form>` do react-hook-form, apenas controlando visibilidade das secoes com CSS/condicional.
- Nenhuma alteracao de banco de dados necessaria.
- Nenhum outro arquivo precisa ser alterado.

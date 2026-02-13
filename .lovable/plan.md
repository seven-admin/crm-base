
# Adicionar classificacao de temperatura (Frio/Morno/Quente) aos clientes

## Resumo
O campo `temperatura` ja existe no banco de dados e nos tipos TypeScript, mas nao esta sendo exibido/editavel em todos os pontos necessarios. As alteracoes sao puramente de frontend.

## Alteracoes

### 1. Formulario de cadastro/edicao do cliente (`src/components/clientes/ClienteForm.tsx`)
- Adicionar um campo de selecao de temperatura na **Etapa 4 (Origem)**, ao lado do campo "Origem".
- Usar botoes inline (Frio / Morno / Quente) com cores visuais (azul, laranja, vermelho), similar ao padrao ja usado em outros formularios do sistema.

### 2. Tabela de clientes - select inline (`src/pages/clientes/ClientesTable.tsx`)
- Adicionar uma nova coluna "Temperatura" na tabela.
- Renderizar um `<Select>` compacto (sem label) diretamente na celula, permitindo alterar a temperatura com um clique.
- Ao alterar, chamar `useUpdateCliente` para salvar imediatamente no banco.
- Estilizar o select com as cores correspondentes (azul=frio, laranja=morno, vermelho=quente).

### 3. Cards mobile - select inline (`src/pages/clientes/ClientesMobileCards.tsx`)
- Substituir o badge estático de temperatura por um `<Select>` compacto clicavel, permitindo alteracao rapida.
- Mesma logica de salvamento imediato via `useUpdateCliente`.

### 4. Formulario de atividade - atualizar cliente (`src/components/atividades/AtividadeForm.tsx`)
- O campo `temperatura_cliente` ja existe no form de atividade.
- Adicionar logica para que, ao concluir/salvar a atividade com uma temperatura selecionada, o sistema tambem atualize a temperatura do cliente vinculado no banco (usando `useUpdateCliente` ou chamada direta ao Supabase).

## Detalhes tecnicos

### Componentes envolvidos:
- `src/components/clientes/ClienteForm.tsx` - adicionar campo visual de temperatura
- `src/pages/clientes/ClientesTable.tsx` - nova coluna com select inline + prop `onUpdateTemperatura`
- `src/pages/clientes/ClientesMobileCards.tsx` - select inline no lugar do badge + prop `onUpdateTemperatura`
- `src/pages/Clientes.tsx` - passar callback `onUpdateTemperatura` que chama `updateMutation`
- `src/components/atividades/AtividadeForm.tsx` - propagar temperatura para o cliente ao salvar

### Nenhuma alteracao de banco de dados necessaria
O campo `temperatura` ja existe na tabela `clientes` e aceita valores `frio`, `morno`, `quente` ou `null`.

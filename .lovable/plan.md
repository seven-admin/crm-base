
# Plano: Reabrir Atividades em Lote (Forecast) + Cadastro Rapido de Cliente + Config CPF

## 1. Reabrir atividades em lote no Forecast/Diario de Bordo

O `ForecastBatchStatusDialog` ja suporta alteracao de status em lote (pendente, concluida, cancelada) via `useAlterarStatusEmLote`. Quando o usuario seleciona "Pendente" como novo status, isso efetivamente reabre a atividade -- porem nao limpa os campos `resultado` e `motivo_cancelamento` como faz o `useReabrirAtividadesEmLote`.

**Alteracao**: No `ForecastBatchStatusDialog`, quando o novo status for `pendente`, usar a logica de reabertura (limpar resultado e motivo_cancelamento) em vez do simples `useAlterarStatusEmLote`.

### Arquivo: `src/components/forecast/ForecastBatchStatusDialog.tsx`
- Importar `useReabrirAtividadesEmLote` de `useAtividades`
- No `handleConfirm`, se `novoStatus === 'pendente'`, chamar `reabrirEmLote.mutate(ids)` (que faz update com `status: pendente, resultado: null, motivo_cancelamento: null`)
- Caso contrario, manter o fluxo atual com `alterarStatus`

## 2. Cadastrar novo cliente pelo modal de atividade

Atualmente o select de cliente no `AtividadeForm` mostra apenas clientes existentes. Adicionar um botao "Novo Cliente" que abre um dialog inline para cadastro rapido (apenas nome, telefone, email).

### Arquivo: `src/components/atividades/AtividadeForm.tsx`
- Adicionar estado para controlar dialog de novo cliente
- Abaixo do Select de cliente, adicionar botao "+ Novo Cliente"
- Criar um mini-dialog com campos: nome (obrigatorio), telefone, email
- Ao salvar, usar `useCreateCliente` para criar o cliente e automaticamente setar o `cliente_id` no formulario

### Arquivo: novo `src/components/atividades/NovoClienteRapidoDialog.tsx`
- Dialog simples com formulario de nome, telefone, email
- Callback `onClienteCriado(id: string)` para retornar o ID do novo cliente

## 3. Configuracao de validacao de CPF no sistema

Criar uma configuracao no sistema (`configuracoes_sistema`) que controla se a validacao de CPF esta ativa ou nao. Isso permite ativar/desativar sem alterar codigo.

### Banco de dados (migracao)
- Inserir registro: `INSERT INTO configuracoes_sistema (chave, valor, categoria) VALUES ('validar_cpf_clientes', 'true', 'cadastro')`

### Arquivo: `src/pages/Configuracoes.tsx`
- Adicionar nova aba "Cadastro" (ou secao dentro de aba existente) com um Switch "Validar CPF no cadastro de clientes"
- Usar `useConfiguracao('validar_cpf_clientes')` para ler e `useUpdateConfiguracao` para salvar

### Arquivo: `src/components/clientes/ClienteForm.tsx`
- Importar `useConfiguracao('validar_cpf_clientes')`
- No `superRefine`, condicionar a validacao de CPF ao valor da configuracao: se `valor === 'false'`, pular validacao

### Hook: `src/hooks/useConfiguracoesSistema.ts`
- Ja possui `useConfiguracao(chave)` -- nenhuma alteracao necessaria

## Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `ForecastBatchStatusDialog.tsx` | Usar `useReabrirAtividadesEmLote` quando status = pendente |
| `AtividadeForm.tsx` | Adicionar botao "+ Novo Cliente" com dialog rapido |
| `NovoClienteRapidoDialog.tsx` | Novo componente: dialog de cadastro rapido de cliente |
| `Configuracoes.tsx` | Adicionar aba/secao "Cadastro" com switch de validacao CPF |
| `ClienteForm.tsx` | Condicionar validacao CPF a configuracao do sistema |
| Migracao SQL | Inserir config `validar_cpf_clientes` na tabela `configuracoes_sistema` |

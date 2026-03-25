

# Tratamento de Erros Seguro -- Ocultar Dados Sensíveis do Banco

## Problema

Atualmente, **27+ arquivos** expõem `error.message` diretamente em `toast.error()`, o que pode mostrar ao usuário mensagens como:
- `"new row violates row-level security policy for table 'clientes'"`
- `"duplicate key value violates unique constraint 'corretores_email_key'"`
- `"null value in column 'imobiliaria_id' of relation 'clientes'"`

Isso vaza nomes de tabelas, colunas e detalhes internos do banco.

## Solução

### 1. Criar utilitário `src/lib/errorHandler.ts`

Função `sanitizeErrorMessage(error, contexto)` que:
- Recebe o erro bruto e um contexto amigável (ex: `"cadastrar cliente"`)
- Gera um código de erro curto (timestamp + hash parcial, ex: `ERR-1711234567-a3f2`)
- Faz `console.error` com todos os detalhes técnicos (tabela, mensagem original, stack)
- Retorna uma mensagem amigável: `"Não foi possível cadastrar cliente. (Código: ERR-1711234567-a3f2)"`
- Detecta padrões conhecidos para mensagens um pouco mais úteis:
  - `"row-level security"` → `"Você não tem permissão para esta ação"`
  - `"duplicate key"` / `"unique constraint"` → `"Registro duplicado. Verifique os dados informados"`
  - `"foreign key"` → `"Registro vinculado não encontrado"`
  - `"not null"` → `"Campos obrigatórios não preenchidos"`
  - Qualquer outro → `"Não foi possível {contexto}"`

### 2. Atualizar todos os hooks e componentes

Substituir todos os padrões:

```typescript
// ANTES (expõe dados internos)
toast.error('Erro ao cadastrar cliente: ' + error.message);
toast.error(error.message || 'Erro ao salvar');

// DEPOIS (seguro)
toast.error(sanitizeErrorMessage(error, 'cadastrar cliente'));
```

**Arquivos afetados** (lista dos principais):
- `src/hooks/useClientes.ts` (8 ocorrências)
- `src/hooks/useProjetosMarketing.ts` (4)
- `src/hooks/useCorretoresUsuarios.ts` (2)
- `src/hooks/useContratos.ts` (1)
- `src/hooks/useUnidades.ts` (1)
- `src/hooks/useActivateCorretor.ts` (1)
- `src/hooks/useClienteSocios.ts` (3)
- `src/hooks/usePlanejamentoStatus.ts` (3)
- `src/hooks/useEventos.ts` (2)
- `src/hooks/useVendaHistorica.ts` (1)
- `src/pages/Usuarios.tsx` (3)
- `src/pages/PortalClientes.tsx` (2)
- `src/components/eventos/EventoInscritosTab.tsx` (4)
- `src/components/planejamento/ConverterTarefaDialog.tsx` (2)
- `src/components/corretores/VincularUsuarioDialog.tsx` (1)
- `src/components/usuarios/CorretoresUsuariosTab.tsx` (1)

### 3. Sem alterações no banco

O fix é 100% no frontend. Os logs detalhados ficam no `console.error` do navegador, acessíveis apenas por quem tem acesso ao DevTools.

### Resultado

- Usuários veem: `"Não foi possível cadastrar cliente. (Código: ERR-1711234567-a3f2)"`
- Admins/devs consultam o console do navegador pelo código para ver o erro original
- Nenhum nome de tabela, coluna ou policy vaza na interface


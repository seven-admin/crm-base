

# Correção: RLS no INSERT de Clientes + Esclarecimento data_venda

## 1. Esclarecimento sobre `data_venda`

A coluna `data_venda` foi criada e **retroativamente preenchida com `updated_at`** para todas as unidades já marcadas como `vendida`. Isso significa que unidades 18 e 20 do BELVEDERE (que foram apenas editadas em março) ganharam `data_venda` em março erroneamente.

A unidade da NEG-00192 (unidade 17, BELVEDERE) está com status `reservada`, então `data_venda` é NULL. Como a venda ainda não foi efetivada no status da unidade (apenas no funil como GANHO), ela não tem `data_venda`.

**Ação manual recomendada**: Corrigir via SQL as datas das unidades 18 e 20 do BELVEDERE se não foram vendidas em março (setar `data_venda = NULL` ou para a data real). A lógica de negociações GANHO no hook já cobre a venda da NEG-00192 independentemente.

## 2. Bug de RLS no cadastro de clientes

**Causa raiz**: O `ClienteForm` inicializa `corretor_id: ''` (string vazia). Quando o gestor de imobiliária salva, o payload vai com `corretor_id: ''` que no PostgreSQL **não é NULL**. A policy de INSERT verifica `corretor_id IS NULL`, que retorna FALSE para string vazia, causando a violação de RLS.

Para corretores, o `PortalClientes` sobrescreve o `corretor_id` com `meuCorretor.id`, mas outros contextos (como `NovoClienteRapidoDialog` ou cenários onde o corretor não é encontrado) podem ter o mesmo problema.

### Correção

**Arquivo: `src/hooks/useClientes.ts`** -- Atualizar `normalizeClienteForSave` para converter strings vazias em `null` nos campos de FK (corretor_id, imobiliaria_id, gestor_id, empreendimento_id, conjuge_id):

```typescript
function normalizeClienteForSave<T extends Partial<ClienteFormData>>(data: T): T {
  const result = { ...data };
  const fkFields = ['corretor_id', 'imobiliaria_id', 'gestor_id', 'empreendimento_id', 'conjuge_id'];
  for (const field of fkFields) {
    if (field in result && !(result as any)[field]) {
      (result as any)[field] = null;
    }
  }
  return result;
}
```

Isso garante que campos UUID vazios sejam enviados como `null`, satisfazendo a policy `corretor_id IS NULL`.

### Arquivos alterados
- `src/hooks/useClientes.ts` -- normalizeClienteForSave


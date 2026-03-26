

# Correção: Submissão Prematura do Formulário + Contador de Clientes no Portal

## Problema 1: Formulário de cliente pula a última etapa

O formulário em `ClienteForm.tsx` tem 4 etapas. Ao clicar "Próximo" na etapa 3, o `currentStep` muda para 4 e o botão muda de `type="button"` para `type="submit"`. Um duplo-clique (ou clique rápido) aciona o submit antes do usuário ver a etapa 4.

A proteção `if (currentStep < STEPS.length)` no `onSubmit` não funciona porque `currentStep` já é 4 após o primeiro clique.

### Correção em `src/components/clientes/ClienteForm.tsx`

Adicionar um `useRef` (`justNavigatedRef`) que é ativado ao avançar de etapa e desativado após 300ms. O `onSubmit` verifica essa flag e bloqueia submissões imediatas:

```typescript
const justNavigatedRef = useRef(false);

const nextStep = () => {
  if (currentStep < STEPS.length) {
    justNavigatedRef.current = true;
    setCurrentStep(currentStep + 1);
    setTimeout(() => { justNavigatedRef.current = false; }, 300);
  }
};

// No onSubmit do form:
onSubmit={(e) => {
  if (currentStep < STEPS.length || justNavigatedRef.current) {
    e.preventDefault();
    return;
  }
  form.handleSubmit(handleSubmit)(e);
}}
```

---

## Problema 2: Contador de clientes no dashboard mostra total do sistema

O `PortalDashboard.tsx` (linha 69) exibe `{clientes.length}` usando `useClientes()` sem filtros. Esse hook depende da RLS para filtrar, mas se a RLS estiver retornando clientes de outras origens (ex: políticas amplas para admins), o contador pode estar inflado.

**Análise da RLS:** A policy SELECT para corretores filtra por `corretor_id IN (get_corretor_ids_by_user(auth.uid()))`. Isso deveria funcionar corretamente. Se o corretor está vendo clientes de outros, o problema pode ser:
- Clientes cadastrados sem `corretor_id` (ficam `NULL`) e alguma outra policy os inclui
- O usuário tem múltiplas roles

### Verificação necessária

O hook `useClientes()` já depende de RLS. Se a RLS está correta, o contador já deveria estar correto. Mas para garantir segurança adicional no frontend (caso o usuário tenha role dupla), podemos filtrar explicitamente no dashboard:

### Correção em `src/pages/PortalDashboard.tsx`

Importar `useMeuCorretor` e filtrar clientes pelo `corretor_id` do corretor logado (ou `imobiliaria_id` para gestores de imobiliária):

```typescript
const { data: meuCorretor } = useMeuCorretor();
const { imobiliariaId } = useUserImobiliaria();
const { role } = useAuth();

// Filtrar clientes que pertencem ao corretor/imobiliária
const meusClientes = useMemo(() => {
  if (role === 'gestor_imobiliaria' && imobiliariaId) {
    return clientes.filter(c => c.imobiliaria_id === imobiliariaId);
  }
  if (meuCorretor?.id) {
    return clientes.filter(c => c.corretor_id === meuCorretor.id);
  }
  return clientes;
}, [clientes, meuCorretor, imobiliariaId, role]);
```

E usar `meusClientes.length` no contador em vez de `clientes.length`.

### Arquivos alterados
1. `src/components/clientes/ClienteForm.tsx` -- adicionar `justNavigatedRef` para impedir submissão prematura
2. `src/pages/PortalDashboard.tsx` -- filtrar contador de clientes pelo corretor/imobiliária logado


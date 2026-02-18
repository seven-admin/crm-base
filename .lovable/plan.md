
# Adicionar Modal de Detalhe ao Clicar em Atendimento

## Problema atual

Na aba **Atividades** do Forecast do Incorporador, o card "Lista de Atendimentos" renderiza cada atendimento como uma `div` com `hover:bg-muted/50`, mas sem nenhum `onClick` — clicar não faz nada.

## Solução

Modificar apenas `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`:

### 1. Adicionar imports

```ts
import { useAtividade } from '@/hooks/useAtividades';
import { AtividadeDetalheDialog } from '@/components/atividades/AtividadeDetalheDialog';
```

Esses dois já existem no projeto e são usados em `AtividadesListaPortal.tsx` da mesma forma.

### 2. Adicionar estado para o ID da atividade selecionada

```ts
const [detalheAtividadeId, setDetalheAtividadeId] = useState<string | null>(null);
```

### 3. Buscar a atividade completa quando selecionada

```ts
const { data: atividadeSelecionada, isLoading: loadingDetalhe } = useAtividade(detalheAtividadeId || undefined);
```

O hook `useAtividade` busca todos os campos completos da atividade (cliente, corretor, empreendimento, gestor, observações, resultado, etc.) necessários para o modal.

### 4. Adicionar `cursor-pointer` e `onClick` em cada item da lista

```tsx
<div
  key={at.id}
  onClick={() => setDetalheAtividadeId(at.id)}
  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
>
```

### 5. Renderizar o `AtividadeDetalheDialog` fora das tabs

```tsx
<AtividadeDetalheDialog
  atividade={atividadeSelecionada || null}
  loading={loadingDetalhe}
  open={!!detalheAtividadeId}
  onOpenChange={(open) => !open && setDetalheAtividadeId(null)}
/>
```

## Resumo

| O que muda | Detalhe |
|---|---|
| Arquivo modificado | `PortalIncorporadorForecast.tsx` somente |
| Novos imports | `useAtividade` e `AtividadeDetalheDialog` |
| Novo estado | `detalheAtividadeId: string \| null` |
| Nova query | `useAtividade(detalheAtividadeId)` — carrega só quando necessário |
| Cada item da lista | Recebe `cursor-pointer` + `onClick` |
| Modal | `AtividadeDetalheDialog` renderizado ao final do componente |

Nenhum arquivo novo — alteração pontual em um único arquivo.

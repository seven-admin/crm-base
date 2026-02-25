

# Reorganizar Sidebar: Mover "Diario de Bordo" para dentro de "Comercial"

## O que sera feito

Eliminar o grupo "Diario de Bordo" como grupo pai separado e mover seu item ("Atividades") para dentro do grupo "Comercial", renomeando-o para "Diario de Bordo". A ordem final do grupo Comercial sera:

1. Diario de Bordo (antes: Atividades, path `/atividades`)
2. Forecast
3. Negociacoes
4. Solicitacao de Reserva
5. Metas

## Alteracao unica

### Arquivo: `src/components/layout/Sidebar.tsx` (linhas 90-106)

**Remover** o grupo "Diario de Bordo" (linhas 100-106) e **adicionar** o item como primeiro do grupo "Comercial":

```text
Antes:
  Comercial -> [Forecast, Negociacoes, Solicitacao de Reserva, Metas]
  Diario de Bordo -> [Atividades]

Depois:
  Comercial -> [Diario de Bordo, Forecast, Negociacoes, Solicitacao de Reserva, Metas]
```

Concretamente, o grupo Comercial ficara:

```typescript
{
  label: 'Comercial',
  icon: Target,
  items: [
    { icon: BookOpen, label: 'Diário de Bordo', path: '/atividades', moduleName: 'atividades' },
    { icon: TrendingUp, label: 'Forecast', path: '/forecast', moduleName: 'forecast' },
    { icon: Handshake, label: 'Negociações', path: '/negociacoes', moduleName: 'negociacoes' },
    { icon: ClipboardCheck, label: 'Solicitação de Reserva', path: '/solicitacoes', moduleName: 'solicitacoes', adminOnly: true },
    { icon: Target, label: 'Metas', path: '/metas-comerciais', moduleName: 'forecast' },
  ],
},
```

E o bloco do grupo "Diario de Bordo" (linhas 100-106) sera removido completamente.

### Verificacao de cores do sidebar

O hook `useSidebarColors` mapeia cores por label de grupo. A cor que estava em "Diario de Bordo" nao sera mais usada. O item herdara a cor do grupo "Comercial" automaticamente.

## Arquivos modificados

| Arquivo | Acao |
|---|---|
| `src/components/layout/Sidebar.tsx` | Mover item e remover grupo |

Nenhuma outra alteracao necessaria (rotas, paginas e permissoes permanecem iguais).


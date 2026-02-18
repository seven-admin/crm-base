
## Problema

O arquivo editado anteriormente foi `PlanejamentoCalendario.tsx` (visão global), mas o usuário está na tela de **Calendário por Empreendimento**, cujo componente é `PlanejamentoCalendarioEmpreendimento.tsx`.

Neste arquivo, nas linhas 170–174, existe o mesmo `Badge` numérico no canto superior direito de cada célula do dia:

```tsx
{hasItems && (
  <Badge variant="secondary" className="text-xs h-5 px-1.5">
    {dayItems.length}
  </Badge>
)}
```

## Solução

Remover o bloco acima (linhas 170–174) do arquivo `src/components/planejamento/PlanejamentoCalendarioEmpreendimento.tsx`.

Após a remoção, cada célula do dia exibirá apenas o número do dia no canto superior esquerdo. A contagem de tarefas continuará sendo informada pelo texto `+N mais` já existente na base da célula.

### Arquivo modificado

- `src/components/planejamento/PlanejamentoCalendarioEmpreendimento.tsx` — remover linhas 170–174 (o bloco `{hasItems && <Badge>...</Badge>}`)

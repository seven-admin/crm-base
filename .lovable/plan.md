
# Adicionar TemperaturaSelector na lista de atividades

## O que sera feito

Adicionar uma coluna "Temperatura" na tabela de atividades em `/atividades`, com o componente `TemperaturaSelector` inline (mesmo usado no Kanban e nos cards), permitindo alterar a temperatura diretamente na listagem.

## Alteracoes

### Arquivo: `src/pages/Atividades.tsx`

1. **Importar** `TemperaturaSelector` e `useUpdateAtividade` (ja importado), e `ClienteTemperatura`
2. **Adicionar coluna no header**: Novo `<TableHead>Temp.</TableHead>` entre "Cliente" e "Corretor"
3. **Adicionar celula no body**: Novo `<TableCell>` com o `TemperaturaSelector` compacto, usando `atividade.temperatura_cliente` como valor e chamando `useUpdateAtividade` ao alterar
4. **Ajustar colSpan** da celula "Nenhuma atividade encontrada" de 10 para 11

### Detalhes tecnicos

```text
<TableCell onClick={(e) => e.stopPropagation()}>
  <TemperaturaSelector
    value={atividade.temperatura_cliente}
    onValueChange={(temp) => updateAtividade.mutate({ 
      id: atividade.id, 
      data: { temperatura_cliente: temp } 
    })}
    compact
  />
</TableCell>
```

O `e.stopPropagation()` na celula evita que o clique no seletor abra o detalhe da atividade. O trigger de historico no banco registra a mudanca automaticamente.

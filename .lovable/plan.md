
# Corrigir desalinhamento dos botoes de acoes na tabela de Atividades

## Problema

Na coluna de acoes da tabela, o numero de botoes varia por linha:
- **Pendente + tipo negociacao**: 5 botoes (Concluir, Cancelar, Editar, Converter, Excluir)
- **Pendente + outros tipos**: 4 botoes (Concluir, Cancelar, Editar, Excluir)
- **Concluida/Cancelada**: 1 botao (Excluir)

Isso faz com que o botao Excluir (e os outros) fiquem desalinhados entre linhas, como mostra a imagem.

## Solucao

Fixar a largura da celula de acoes e reservar espaco para todos os 5 botoes possiveis, usando placeholders invisiveis quando o botao nao se aplica.

### Arquivo: `src/pages/Atividades.tsx`

1. No `TableHead` da coluna de acoes, adicionar largura fixa: `className="w-[200px]"`

2. No bloco de acoes (linhas 882-969), reestruturar para sempre renderizar 5 slots:
   - Slots 1-3 (Concluir, Cancelar, Editar): renderizar botoes se `status === 'pendente'`, senao renderizar `<div className="w-10" />` para cada slot vazio
   - Slot 4 (Converter): renderizar botao se `TIPOS_NEGOCIACAO.includes(tipo)`, senao renderizar `<div className="w-10" />`
   - Slot 5 (Excluir): sempre presente

Isso garante que cada linha ocupe o mesmo espaco horizontal e os botoes fiquem perfeitamente alinhados.

### Resultado visual

```text
| Pendente  | [v] [x] [ed] [conv] [del] |
| Pendente  | [v] [x] [ed]  ---   [del] |
| Concluida | ---  --- ---   ---   [del] |
```

Todos os botoes ficam nas mesmas colunas independente do tipo/status.

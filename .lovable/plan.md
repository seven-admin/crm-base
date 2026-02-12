

# Compactar Espaçamento das Tabelas

## O que sera feito

Reduzir o padding e altura das celulas no componente base de tabela (`src/components/ui/table.tsx`), afetando **todas as tabelas do sistema** de uma so vez.

## Mudancas

Apenas o arquivo `src/components/ui/table.tsx` sera alterado:

| Elemento | Atual | Novo |
|----------|-------|------|
| TableHead (altura) | `h-10` (40px) | `h-8` (32px) |
| TableHead (padding) | `px-3` (12px) | `px-2` (8px) |
| TableCell (padding) | `p-3` (12px) | `px-2 py-1.5` (8px horizontal, 6px vertical) |

Isso reduz cada linha em aproximadamente **12px de altura**, o que em uma tabela com 10 linhas significa ganhar cerca de **120px** de espaco vertical -- praticamente 2 a 3 linhas extras visiveis sem scroll.

## O que NAO muda

- Fonte, cores e bordas continuam identicas
- Nenhum componente individual precisa ser ajustado -- a mudanca e global no componente base

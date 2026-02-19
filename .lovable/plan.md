
# Corrigir espaçamento do separador nos labels das unidades

## Problema
Os labels das unidades estão exibindo "401|3Q" sem espaços ao redor do separador "|". O correto é "401 | 3Q".

## Alteração
Arquivo: `src/lib/mapaUtils.ts`, linha 120

Trocar:
```
return parts.join('|');
```
Por:
```
return parts.join(' | ');
```

Alteração simples de 1 linha que afeta todos os labels de unidades no sistema.

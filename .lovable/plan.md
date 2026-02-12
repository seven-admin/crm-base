
# Mudar cor principal dos botoes para azul

## O que sera feito

Alterar a variavel CSS `--primary` de laranja para azul, conforme a referencia da imagem (um azul medio, similar a `hsl(213 58% 45%)`).

## Arquivo: `src/index.css`

### Tema claro (`:root`)
- `--primary: 30 91% 54%` -> `--primary: 213 58% 45%`
- `--gradient-primary` atualizar para usar o novo azul

### Tema escuro (`.dark`)
- `--primary: 30 91% 60%` -> `--primary: 213 58% 50%`
- `--sidebar-primary: 30 91% 60%` -> `--sidebar-primary: 213 58% 50%`

Isso afetara automaticamente todos os botoes, links e elementos que usam a cor `primary` no sistema inteiro, sem precisar alterar nenhum componente individualmente.



# Remover destaque laranja do link ativo no Sidebar

## O que sera feito

Remover a `border-left` laranja do item ativo no sidebar -- aquela borda lateral que parece um parentese `(` ao lado do link.

## Mudanca

Arquivo: `src/index.css`

Na classe `.sidebar-nav-item-active`, remover a linha:

```
border-left: 2px solid hsl(30 91% 54%);
```

O item ativo continuara com o fundo sutil e o texto laranja claro para indicar que esta selecionado, apenas sem a borda lateral.


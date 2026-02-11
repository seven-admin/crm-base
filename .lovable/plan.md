

## Correcao: Permissoes do Gestor de Produto no Financeiro

### Problema

A migracaoo anterior adicionou permissoes de `financeiro_fluxo`, `financeiro_dre` e `bonificacoes` para o `gestor_produto`, mas ele so deve ter acesso a **Comissoes**.

### Correcao

Uma nova migracao SQL para remover as permissoes incorretas:

```text
Remover do gestor_produto:
- financeiro_fluxo (Fluxo de Caixa)
- financeiro_dre (DRE)
- bonificacoes (Bonificacoes)

Manter:
- comissoes (ja existia com view)
```

### Resultado esperado no sidebar para gestor_produto

| Grupo | Itens visiveis |
|-------|---------------|
| Empreendimentos | Listagem |
| Clientes | Cadastro de Clientes |
| Forecast | Dashboard, Atividades, Metas Comerciais |
| Financeiro | Comissoes (somente) |
| Parceiros | Incorporadoras, Imobiliarias, Corretores |

### Arquivo envolvido

| Arquivo | Acao |
|---------|------|
| Nova migracao SQL | DELETE das permissoes `financeiro_fluxo`, `financeiro_dre`, `bonificacoes` para o role `gestor_produto` |


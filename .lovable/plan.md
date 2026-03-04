

# Converter Visitas do Michel (Fev/2026) em Atendimento — Lista Revisada

Removidos os itens 1, 2, 4, 5, 9, 10, 16 e 17 conforme solicitado. Restam **9 atividades** para conversão:

| # | Título | Data | Subtipo | Categoria |
|---|--------|------|---------|-----------|
| 3 | VISITA - CORRETOR LUCAS - CLIENTE MARCOS | 05/02 | 1º | imobiliaria |
| 6 | VISITA CORRETORA JOSIANE - CLIENTE ELTON E JANAINA | 10/02 | 1º | imobiliaria |
| 7 | RETORNO - CLIENTE GLECE - CORRETORA FRANTIESCA | 11/02 | Ret. | cliente |
| 8 | VISITA CORRETOR DIEGO - CLIENTE CAROLINE | 12/02 | 1º | imobiliaria |
| 11 | RETORNO CLIENTE ELTON - COM GESTOR LUCAS | 18/02 | Ret. | imobiliaria |
| 12 | VISITA - CORRETOR DÉVERSON - COM CLIENTE GABRIEL | 19/02 | 1º | imobiliaria |
| 13 | VISITA CORRETOR ALEX | 21/02 | 1º | imobiliaria |
| 14 | VISITA DO CORRETOR RODRIGO COM CLIENTE LOURDES | 21/02 | 1º | imobiliaria |
| 15 | VISITA - CORRETOR CLEITON - COM CLIENTE GISELE | 23/02 | 1º | imobiliaria |

## Plano

Executar um UPDATE filtrando pelos **IDs específicos** dessas 9 atividades (em vez de filtrar por data genérica, para não afetar as 8 removidas da lista).

Será necessário buscar os IDs exatos via query e então executar:

```sql
UPDATE atividades
SET tipo = 'atendimento', updated_at = now()
WHERE id IN ( /* os 9 IDs específicos */ );
```

Os subtipos (`primeiro_atendimento` / `retorno`) e categorias serão preservados.


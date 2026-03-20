

# Tornar empreendimentos visíveis para todos os corretores e imobiliárias

## Problema
A função RLS `user_has_empreendimento_access` exige vínculo explícito nas tabelas `empreendimento_corretores` / `empreendimento_imobiliarias` para que corretores e imobiliárias vejam um empreendimento. Esse vínculo manual na aba "Equipe" não faz sentido como pré-requisito de visibilidade — todo corretor/imobiliária ativo deveria ver todos os empreendimentos ativos.

## Solução

### 1. Migration SQL — atualizar `user_has_empreendimento_access`

Adicionar duas cláusulas à função para que:
- Qualquer usuário com role `corretor` veja empreendimentos ativos
- Qualquer usuário com role `gestor_imobiliaria` veja empreendimentos ativos

```sql
OR public.has_role(_user_id, 'corretor')
OR public.is_gestor_imobiliaria(_user_id)
```

Isso elimina a necessidade de vínculo manual para **visualização**. Os vínculos nas tabelas de junção continuam úteis para controle de comissão e autorização de propostas.

### 2. Frontend — `src/pages/PortalEmpreendimentos.tsx`

Remover o filtro extra por `empreendimento_imobiliarias` que o gestor_imobiliaria aplica no frontend (linhas 22-37). Com a RLS liberada, o `useEmpreendimentos()` já retornará todos os empreendimentos ativos — o filtro adicional é redundante e causava ocultação.

### Arquivos a modificar
- Migration SQL (função `user_has_empreendimento_access`)
- `src/pages/PortalEmpreendimentos.tsx` (remover query e filtro de vínculos)


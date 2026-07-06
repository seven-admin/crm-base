## Objetivo

Alterar a função `public.get_unidades_disponiveis` para que o filtro de status seja opcional. Quando nenhum status for informado, a função retornará unidades de **todos os status** (disponível, reservada, negociação, contrato, vendida, bloqueada).

## Mudanças

### 1. Migração SQL — recriar a função

- Adicionar novo parâmetro opcional `p_status text[] DEFAULT NULL`
- Manter os parâmetros existentes `p_incorporadora_id` e `p_empreendimento_id`
- Remover o filtro fixo `AND u.status = 'disponivel'`
- Substituir por: `AND (p_status IS NULL OR u.status::text = ANY(p_status))`
- Manter os demais filtros (`e.is_active`, `u.is_active`) e o `ORDER BY` atuais
- Manter `SECURITY DEFINER` e `search_path = public`

Comportamento resultante:
- Chamada sem parâmetro de status → retorna todas as unidades ativas de todos os status
- Chamada com `p_status => ARRAY['disponivel']` → mantém compatibilidade com o uso atual (relatório de disponíveis)
- Chamada com múltiplos, ex. `ARRAY['disponivel','reservada']` → filtra por essa lista

### 2. Sem alterações no frontend nesta etapa

Os pontos que hoje chamam a RPC continuam funcionando exatamente como antes (não passam `p_status`, então continuam recebendo — atenção: com a nova assinatura, chamadas sem `p_status` passam a retornar **todos** os status). 

Portanto, para preservar o comportamento atual do relatório "Exportar Disponíveis", será necessário ajustar a chamada existente para passar explicitamente `p_status: ['disponivel']`. Isso será feito no mesmo passo:

- Localizar as chamadas de `rpc('get_unidades_disponiveis', ...)` no código
- Nas chamadas cujo objetivo é apenas disponíveis (ex.: exportação de disponíveis do empreendimento), adicionar `p_status: ['disponivel']`
- Deixar sem `p_status` os usos que queiram trazer tudo

## Detalhes técnicos

SQL previsto (resumo):

```text
CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis(
  p_incorporadora_id uuid DEFAULT NULL,
  p_empreendimento_id uuid DEFAULT NULL,
  p_status text[] DEFAULT NULL
)
RETURNS TABLE (...mesmas colunas de hoje...)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ...
  FROM public.unidades u
  JOIN public.empreendimentos e ON e.id = u.empreendimento_id
  LEFT JOIN public.incorporadoras i ON i.id = e.incorporadora_id
  LEFT JOIN public.blocos b ON b.id = u.bloco_id
  LEFT JOIN public.tipologias t ON t.id = u.tipologia_id
  WHERE e.is_active = true
    AND u.is_active = true
    AND (p_status IS NULL OR u.status::text = ANY(p_status))
    AND (p_incorporadora_id IS NULL OR e.incorporadora_id = p_incorporadora_id)
    AND (p_empreendimento_id IS NULL OR e.id = p_empreendimento_id)
  ORDER BY e.nome, b.nome, u.andar, u.numero;
$$;
```

Confirma que posso seguir com essa alteração?

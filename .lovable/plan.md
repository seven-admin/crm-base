## Diagnóstico

A RPC `get_unidades_disponiveis(p_incorporadora_id uuid)` filtra por `empreendimentos.incorporadora_id`. Só retorna dados quando o UUID é de fato de uma **incorporadora**. As UUIDs que retornavam vazio eram de **empreendimentos** — por isso não funcionaram.

## Plano

Ampliar a RPC para aceitar qualquer um dos dois filtros (ou ambos), tornando o n8n mais flexível:

```sql
CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis(
  p_incorporadora_id uuid DEFAULT NULL,
  p_empreendimento_id uuid DEFAULT NULL
) RETURNS TABLE (...mesmas colunas atuais...)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ...
  FROM public.unidades u
  JOIN public.empreendimentos e ON e.id = u.empreendimento_id
  LEFT JOIN public.incorporadoras i ON i.id = e.incorporadora_id
  LEFT JOIN public.blocos b ON b.id = u.bloco_id
  LEFT JOIN public.tipologias t ON t.id = u.tipologia_id
  WHERE e.is_active AND u.is_active AND u.status = 'disponivel'
    AND (p_incorporadora_id IS NULL OR e.incorporadora_id  = p_incorporadora_id)
    AND (p_empreendimento_id IS NULL OR e.id = p_empreendimento_id)
  ORDER BY e.nome, b.nome, u.andar, u.numero;
$$;
```

Uso no n8n (POST `/rest/v1/rpc/get_unidades_disponiveis`):
- Por incorporadora: `{ "p_incorporadora_id": "<uuid>" }`
- Por empreendimento: `{ "p_empreendimento_id": "<uuid>" }`
- Ambos = filtra pelos dois; nenhum = retorna todos os disponíveis.

---

## Referência de UUIDs

### Incorporadoras (para `p_incorporadora_id`)

| Nome | UUID | Disponíveis |
|---|---|---|
| BK INCORPORADORA | `a682aefc-7d06-4c86-a150-200fb8583b0b` | 98 |
| CERRO INCORPORADORA | `6342f5bf-cc50-4cf4-99f6-70ff4b949656` | 30 |
| ESSENCE - CERRO | `28aa1628-89cf-40d8-8410-1cb4781ac3c1` | 98 |
| KRAFT | `748a3fd9-223d-4a5b-9d07-8e9d3c00c3ca` | 76 |
| INCORPORADOR TESTE | `4fb4f078-c099-48d1-8b44-93bfa06e6ab5` | 0 |
| MANTENA | `d104b80f-11d0-478d-87a5-424eaeaed8b8` | 0 |

### Empreendimentos (para `p_empreendimento_id`)

**BK INCORPORADORA**
- AXIS — `176bc0f0-09b5-4d24-a785-7ea23d7d19cf`
- COMPRA CERTA BK — `f0e0d331-b0d8-4257-a5ac-d73f01c3db63`
- LIVTY — `156f9324-f8eb-41ef-b77b-b11887942ee1`

**CERRO INCORPORADORA**
- JD. IGUATEMI — `42157c74-d09a-4382-a6f1-4c9d288ba9a5`

**ESSENCE - CERRO**
- BELVEDERE — `5b01d2c4-7b29-4981-ada9-fa6e0dc0f158`
- VIVENDAS DO BOSQUE — `ce11707d-fe6a-4c14-9b8b-4390678b6510`

**KRAFT**
- VITHORIA DO SOL — `f2208f56-edd6-4c98-b82a-9657606376cf`

**Sem incorporadora vinculada**
- SEVEN — `b2b80e27-f936-4cf6-8f3a-35677212d453`

Confirma que aplico a migration?

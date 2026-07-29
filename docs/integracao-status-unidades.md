# Integração — Status de Unidades e Disponibilidade Pública

Base URL das funções: `https://pizerpoxuqopekmbvohh.supabase.co/functions/v1`

---

## 1. Alterar status de unidades (em lote)

`POST /unidades-status`

Altera o status de uma ou várias unidades de forma **atômica** (tudo ou nada).

### Headers
| Header | Obrigatório | Descrição |
|---|---|---|
| `Content-Type: application/json` | sim | |
| `apikey` | sim | ANON key do Supabase (gateway). |
| `x-api-key` | sim | Segredo da integração (`INTEGRACAO_API_KEY`). |
| `Idempotency-Key` | não | Chave única por operação. Reenvio com a mesma chave devolve a resposta anterior sem reprocessar. |

### Body
```json
{
  "status": "reservada",
  "unidade_ids": ["<uuid>", "<uuid>"],
  "reserved_until": "2026-08-01T12:00:00Z",
  "motivo": "reserva via portal X",
  "atomico": true
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `status` | sim | `disponivel` \| `reservada` \| `vendida` \| `desistida`. `desistida` volta a unidade para `disponivel`. |
| `unidade_ids` | sim | Array de UUIDs (não vazio). |
| `reserved_until` | não | ISO 8601. Só para `reservada`. Se omitido, assume **agora + 24h**. |
| `motivo` | não | Texto livre (registro). |
| `atomico` | não (default `true`) | `true`: se qualquer unidade estiver indisponível/inexistente, **nada** é alterado (retorna `409`). |

### Regras
- Ao **reservar**, só entram unidades atualmente `disponivel`. As demais são conflito.
- Reservas **expiram automaticamente**: uma rotina a cada 15 min devolve para `disponivel` toda unidade cujo `reserved_until` já passou.
- `reserved_until` fica gravado na unidade e volta nas respostas/consultas.

### Respostas
**200 — sucesso**
```json
{
  "ok": true,
  "status_aplicado": "reservada",
  "reserved_until": "2026-08-01T12:00:00Z",
  "atualizadas": [{ "id": "<uuid>", "status": "reservada", "reserved_until": "2026-08-01T12:00:00Z" }],
  "ignoradas": [],
  "motivo": "reserva via portal X"
}
```
**409 — conflito (nada alterado, quando `atomico:true`)**
```json
{
  "ok": false,
  "conflitos": [{ "id": "<uuid>", "motivo": "indisponivel", "status_atual": "vendida" }]
}
```
Motivos de conflito: `nao_encontrada`, `indisponivel` (com `status_atual`).

**401** — `x-api-key` ausente/incorreto. **400** — payload inválido.

### Exemplo (curl)
```bash
curl -X POST "https://pizerpoxuqopekmbvohh.supabase.co/functions/v1/unidades-status" \
  -H "apikey: <ANON_KEY>" \
  -H "x-api-key: <INTEGRACAO_API_KEY>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 6f1a...uuid" \
  -d '{"status":"reservada","unidade_ids":["<uuid1>","<uuid2>"]}'
```

---

## 2. Disponibilidade pública (sem login)

Cada empreendimento tem um `slug_publico` não-enumerável.

### Página (gera o PDF Tabela de Vendas no navegador)
```
https://<dominio-do-app>/p/disponibilidade/<slug_publico>
```
No CRM: menu de unidades → **Copiar link público (sem login)**.

### API de dados (para outro domínio/página)
`POST /unidades-publicas`  ·  body `{ "slug": "<slug_publico>" }`

Retorna o empreendimento (nome, tipo, `config_venda`, registro/matrícula), as **unidades disponíveis** (campos não sensíveis) e os boxes. CORS liberado.

```json
{
  "empreendimento": { "nome": "AXIS", "tipo": "predio", "config_venda": { ... } },
  "unidades": [{ "id": "...", "numero": "401", "andar": 4, "area_privativa": 74.9, "valor": 719520.47, "status": "disponivel", "bloco": null, "tipologia": { "nome": "..." } }],
  "boxes": [{ "numero": "86", "unidade_id": "..." }]
}
```

---

## Configuração

- Segredo `INTEGRACAO_API_KEY` definido nos secrets das edge functions (header `x-api-key`).
- Enum de status interno: `disponivel, reservada, vendida, bloqueada, negociacao, contrato` (`desistida` não é armazenado — mapeia para `disponivel`).

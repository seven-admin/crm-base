
## Objetivo
Criar uma Edge Function simples que recebe filtros estruturados (principalmente `empreendimento_id`) e devolve um PDF com a tabela de unidades. Sem IA, sem n8n — basta um POST.

## Como vai funcionar

```
Quem chamar (n8n, Postman, outro sistema)
   POST /functions/v1/export-unidades-pdf
   Headers: x-api-token: <token compartilhado>
   Body: { "empreendimento_id": "uuid", "telefone_corretor": "5599...", ...filtros opcionais }
   ↓
Edge Function:
   1. Valida x-api-token
   2. Valida que o telefone pertence a um corretor ativo
   3. Consulta unidades do empreendimento (filtros opcionais)
   4. Gera PDF
   5. Faz upload no Storage e devolve URL assinada (1h)
   ↓
Resposta: { "url": "https://...pdf", "total": 42, "empreendimento": "AXIS" }
```

## Entrada (JSON)

Obrigatório:
- `empreendimento_id` (uuid)
- `telefone_corretor` (string, só dígitos)

Opcionais (filtros adicionais):
- `status`: `disponivel` | `reservada` | `vendida` (default: `disponivel`)
- `bloco_id` (uuid)
- `quartos` (number)
- `valor_min`, `valor_max` (number)

## Saída do PDF

Cabeçalho com nome do empreendimento + data de geração.
Tabela com colunas: **Bloco · Andar · Unidade · Tipologia · Quartos · Suítes · Vagas · Área (m²) · Valor (R$) · Status**
Rodapé com total de unidades e o texto configurado em `empreendimentos.relatorio_rodape` (já existe).

## Segurança

1. **`N8N_API_TOKEN`** (novo secret) — token compartilhado obrigatório no header `x-api-token`. Sem ele, 401.
2. **Validação do corretor** — função busca em `corretores` por `telefone` (normalizado) e `is_active = true`. Se não achar, 403.
3. **Empreendimento acessível** — verifica se o corretor tem acesso (via `user_has_empreendimento_access` ou regra equivalente — corretor padrão vê todos ativos, conforme política já existente).
4. **`verify_jwt = false`** — autenticação é pelo token compartilhado, não por JWT (chamada server-to-server).

## Storage

- Reusar bucket existente ou criar bucket privado `relatorios-exportacao` (TTL manual; arquivos com nome `unidades/{empreendimento_id}/{timestamp}.pdf`).
- Resposta usa `createSignedUrl(path, 3600)`.

## Detalhes técnicos

**Arquivo único:** `supabase/functions/export-unidades-pdf/index.ts`

Stack:
- `npm:@supabase/supabase-js@2` — cliente com service role para consultas e storage
- `npm:pdf-lib` — geração do PDF (sem dependência nativa, roda em Deno)
- Zod para validar o body

Query base (reaproveita a lógica de `get_unidades_disponiveis_bk`, adaptada com filtro por empreendimento):
```sql
SELECT u.*, b.nome bloco, t.nome tipologia, t.quartos, t.suites, t.vagas
FROM unidades u
JOIN empreendimentos e ON e.id = u.empreendimento_id
LEFT JOIN blocos b ON b.id = u.bloco_id
LEFT JOIN tipologias t ON t.id = u.tipologia_id
WHERE u.empreendimento_id = $1
  AND u.is_active = true
  AND (filtros opcionais...)
ORDER BY b.nome, u.andar, u.numero
```

`supabase/config.toml`:
```toml
[functions.export-unidades-pdf]
verify_jwt = false
```

## O que NÃO entra agora
- Integração com Evolution API (envio do PDF pelo WhatsApp) — fica para depois.
- Interpretação de texto livre por IA — vai-se mandar `empreendimento_id` direto.
- Formato Excel/JSON — só PDF nesta primeira versão.

## Passos para implementação (após aprovação)
1. Pedir o secret `N8N_API_TOKEN` via `add_secret`.
2. Criar bucket `relatorios-exportacao` (privado) se ainda não existir.
3. Escrever `supabase/functions/export-unidades-pdf/index.ts`.
4. Atualizar `supabase/config.toml` com `verify_jwt = false`.
5. Testar via `curl_edge_functions` passando um `empreendimento_id` e telefone real de corretor.

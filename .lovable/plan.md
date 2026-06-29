## Plano

### 1. Cabeçalho do PDF
Substituir apenas a **linha 1** do cabeçalho esquerdo:
- Antes: `CRM 360 – Seven Group 360`
- Depois: `CRM - {nome da Incorporadora}` (fallback `CRM` se não houver incorporadora vinculada)

A **linha 2** (`Plataforma de Gestão Integrada`) é mantida como está.

Buscar o nome via join em `empreendimentos.incorporadora_id → incorporadoras.nome`.

### 2. Renomear a edge function
Renomear `export-unidades-pdf` → **`exportar-tabela-disponiveis`**.

Como edge functions não têm "rename" nativo, o procedimento é:
1. Criar a nova function `supabase/functions/exportar-tabela-disponiveis/index.ts` com o código atualizado (cabeçalho novo + nome da incorporadora).
2. Manter o mesmo contrato: header `x-api-token`, body `{ "empreendimento_id": "<uuid>" }`, resposta `{ url, path, total, empreendimento, status, expira_em }`.
3. Reutiliza o mesmo secret `N8N_API_TOKEN` e o mesmo bucket `empreendimentos-documentos`.
4. Excluir a antiga `export-unidades-pdf` para evitar duplicidade.

### 3. Sobre "uma function por empreendimento"
**Não é necessário.** A function é genérica — basta variar o `empreendimento_id` no body. Uma única function atende todos os empreendimentos.

### Ação no n8n
Atualizar a URL chamada pelo workflow do n8n de:
```
.../functions/v1/export-unidades-pdf
```
para:
```
.../functions/v1/exportar-tabela-disponiveis
```
(o body e o header continuam idênticos).

### Arquivos
- **Criar:** `supabase/functions/exportar-tabela-disponiveis/index.ts` (cópia + ajuste do cabeçalho + join com incorporadora)
- **Excluir:** `supabase/functions/export-unidades-pdf/`
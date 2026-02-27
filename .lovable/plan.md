
# Exibir dados completos da proposta no Portal do Incorporador

## Problemas identificados

### 1. Cliente aparece como null (RLS)
O campo `cliente` retorna `null` na resposta da API porque a policy de `clientes` para incorporador exige que o `gestor_id` do cliente esteja vinculado ao empreendimento. O cliente "CLIENTE TESTE CRM SEVEN" tem `gestor_id = NULL`, logo a policy nao faz match.

**Solucao**: Criar nova policy SELECT em `clientes` que permita incorporador ver clientes vinculados a negociacoes dos seus empreendimentos.

### 2. Condicoes de pagamento inacessiveis (RLS)
A policy de SELECT em `negociacao_condicoes_pagamento` so permite admin, gestor_produto e corretor. Incorporador nao consegue ler.

**Solucao**: Adicionar policy SELECT para incorporador na tabela `negociacao_condicoes_pagamento`.

### 3. UI do card incompleta
O card atual so mostra: codigo, status, cliente, empreendimento, valor tabela, valor proposta, corretor. Faltam dados importantes para decisao do incorporador.

**Solucao**: Refatorar o card para exibir:

```text
+--------------------------------------------------+
| PROP-00001 | NEG-00024        [Badge: Em Analise] |
+--------------------------------------------------+
| Cliente: CLIENTE TESTE CRM SEVEN                 |
| CPF: xxx.xxx.xxx-xx | Email | Telefone           |
| Empreendimento: EMPREENDIMENTO TESTE              |
| Corretor: ...                                     |
+--------------------------------------------------+
| UNIDADES                                          |
| Bloco 01 - Unidade 101 | R$ 500.000,00           |
+--------------------------------------------------+
| VALORES                                           |
| Valor Tabela: R$ 500.000  Valor Proposta: R$ ... |
| Desconto: -X%                                     |
+--------------------------------------------------+
| CONDICOES DE PAGAMENTO                            |
| 1x Mensal Serie - R$ 500.000,00 (Boleto)         |
+--------------------------------------------------+
| [Contra Proposta]            [Aprovar]            |
+--------------------------------------------------+
```

---

## Plano de implementacao

### Migration SQL (2 novas policies)

**Policy 1** - Incorporador pode ver clientes que estao em negociacoes dos seus empreendimentos:
```sql
CREATE POLICY "Incorporadores can view clientes from negociacoes"
ON public.clientes FOR SELECT TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND id IN (
    SELECT n.cliente_id FROM public.negociacoes n
    WHERE public.user_has_empreendimento_access(auth.uid(), n.empreendimento_id)
  )
);
```

**Policy 2** - Incorporador pode ver condicoes de pagamento das negociacoes acessiveis:
```sql
CREATE POLICY "Incorporadores can view negociacao_condicoes_pagamento"
ON public.negociacao_condicoes_pagamento FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.negociacoes n
    WHERE n.id = negociacao_condicoes_pagamento.negociacao_id
      AND public.is_incorporador(auth.uid())
      AND public.user_has_empreendimento_access(auth.uid(), n.empreendimento_id)
  )
);
```

### Frontend - PortalIncorporadorPropostas.tsx

1. Adicionar hook `useNegociacaoCondicoesPagamento` ou buscar condicoes inline
2. Expandir o card com secoes:
   - **Dados do cliente**: nome, CPF, email, telefone
   - **Unidades**: bloco + numero + valor de cada unidade vinculada
   - **Valores**: valor tabela, valor proposta, desconto
   - **Condicoes de pagamento**: tipo parcela, quantidade, valor, forma de pagamento
3. Usar `formatarMoeda` do `@/lib/formatters` para consistencia
4. Buscar condicoes de pagamento junto com os dados da negociacao (query adicional ou hook dedicado)

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | 2 novas policies RLS (clientes + negociacao_condicoes_pagamento) |
| `PortalIncorporadorPropostas.tsx` | Card expandido com todos os dados da proposta |

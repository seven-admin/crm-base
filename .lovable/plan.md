
# Correção definitiva: Portal do Incorporador /propostas continua vazio

## Diagnóstico confirmado (com evidência)

Eu validei o fluxo atual e encontrei a causa raiz real do “continua sem exibir”:

1. A tela `/portal-incorporador/propostas` está renderizando normalmente (não é erro de UI).
2. A requisição da página para `negociacoes` está sendo feita e retorna **200 com array vazio**:
   - `GET /rest/v1/negociacoes?...`
   - `Response Body: []`
3. No banco, a negociação existe e está correta:
   - `NEG-00024`
   - `status_proposta = em_analise`
   - `funil_etapa_id = ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35`
   - `is_active = true`
4. O usuário logado é `incorporador` e está vinculado ao empreendimento da negociação em `user_empreendimentos`.

Conclusão: o problema agora **não é status/filtro frontend**, e sim **RLS de leitura em `negociacoes`** para incorporador.

---

## Causa raiz técnica

As policies atuais de `SELECT` em `public.negociacoes` permitem leitura para:
- admin
- gestor_produto
- corretor dono da negociação

Mas **não existe policy explícita de SELECT para incorporador** com vínculo de empreendimento.  
Resultado: a query retorna `[]` mesmo havendo registro válido.

Também há um segundo ponto preventivo:
- `negociacao_unidades` também não tem `SELECT` adequado para incorporador.
- Isso pode quebrar efeitos colaterais no fluxo de aprovação (ex.: não carregar unidades da proposta para marcar status corretamente).

---

## Plano de implementação

## 1) Migration SQL: liberar leitura de negociações para incorporador vinculado ao empreendimento
Criar nova policy de `SELECT` em `public.negociacoes` baseada em acesso ao empreendimento.

Proposta:
```sql
create policy "Incorporadores can view negociacoes from linked empreendimentos"
on public.negociacoes
for select
to authenticated
using (
  is_incorporador(auth.uid())
  and user_has_empreendimento_access(auth.uid(), empreendimento_id)
);
```

Observação:
- Mantém segurança por vínculo (`user_has_empreendimento_access`).
- Não abre acesso público.
- Aproveita função já usada em outras partes do sistema.

## 2) Migration SQL: liberar leitura de itens (negociacao_unidades) para incorporador
Criar policy de `SELECT` em `public.negociacao_unidades` para permitir embed/uso da relação quando a negociação for acessível.

Proposta:
```sql
create policy "Incorporadores can view negociacao_unidades from linked empreendimentos"
on public.negociacao_unidades
for select
to authenticated
using (
  exists (
    select 1
    from public.negociacoes n
    where n.id = negociacao_unidades.negociacao_id
      and is_incorporador(auth.uid())
      and user_has_empreendimento_access(auth.uid(), n.empreendimento_id)
  )
);
```

## 3) Frontend: manter filtro resiliente já implementado
No `PortalIncorporadorPropostas.tsx`, o filtro atual já está correto e resiliente:
- `status_proposta = 'em_analise'`
- fallback por `funil_etapa_id = etapa de análise` quando status ausente

Não precisa nova mudança funcional aqui para este bug específico, apenas validar após ajuste de RLS.

## 4) Verificação ponta a ponta (obrigatória)
Após aplicar policies:
1. Recarregar `/portal-incorporador/propostas`
2. Confirmar que `GET /negociacoes` retorna `NEG-00024`
3. Confirmar card em “Propostas Aguardando Aprovação”
4. Testar ação **Aprovar** e **Contra Proposta**
5. Validar efeitos:
   - transição de etapa/status
   - atualização de unidades (quando aplicável)
   - proposta sai de “Aguardando” e vai para “Recentes”

---

## Arquivos/recursos impactados

- **Banco (migration SQL)**:
  - `public.negociacoes` (nova policy SELECT para incorporador)
  - `public.negociacao_unidades` (nova policy SELECT para incorporador)
- **Frontend**:
  - sem alteração obrigatória para esta causa raiz (filtro já está correto no arquivo de propostas)

---

## Riscos e cuidados

- Evitar policy ampla demais (`true`) para não vazar negociações.
- Reutilizar `user_has_empreendimento_access` para manter padrão de autorização do projeto.
- Conferir nomes das policies para não duplicar com nome já existente.
- Caso exista conflito de policy legada, ajustar com `drop policy if exists ...` antes de criar.

---

## Resultado esperado após implementação

- O incorporador passa a visualizar as propostas pendentes corretamente em `/portal-incorporador/propostas`.
- `NEG-00024` aparece imediatamente.
- O fluxo de aprovação/contra proposta funciona com os dados completos necessários.

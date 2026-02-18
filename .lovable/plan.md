
# Plano: Corrigir Lista de Tickets e Adicionar Modal de Detalhe — Marketing Portal do Incorporador

## Arquivo: `src/pages/portal-incorporador/PortalIncorporadorMarketing.tsx`

---

## Problema 1 — Contador divergente (10 exibe, 2 na lista)

### Causa raiz

O campo `allTickets` retornado pela query é filtrado para **excluir tickets em etapas finais**:

```ts
allTickets: allTickets.filter(t =>
  !['concluido', 'arquivado'].includes(t.status)
  && !(t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id))
)
```

O problema: quando um ticket usa o Kanban dinâmico (com `ticket_etapa_id`), o campo `status` no banco é um status interno de controle, mas a maioria dos tickets tem `ticket_etapa_id` preenchido. Se qualquer etapa tiver `is_final = true`, todos os tickets nessa etapa são excluídos da lista — mesmo que ainda estejam "ativos" do ponto de vista do incorporador.

### Correção

Passar **todos os tickets** para a lista (sem o filtro de etapa final), e deixar o filtro de status (`concluido` / `arquivado`) como único critério de exclusão. Renomear para "Todos os Tickets" sem a palavra "Ativos" para não gerar confusão.

```ts
// Antes (muito restritivo):
allTickets: allTickets.filter(t =>
  !['concluido', 'arquivado'].includes(t.status)
  && !(t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id))
)

// Depois (inclui tickets em qualquer etapa, exceto arquivados):
allTickets: allTickets.filter(t => t.status !== 'arquivado')
```

Isso garante que todos os tickets relevantes aparecem na lista, inclusive os em etapas finais do Kanban que ainda não foram marcados como `arquivado`.

---

## Problema 2 — Modal ao clicar no ticket

### Estratégia

Usar o hook `useTicket` interno do `useTickets.ts`. Porém esse hook está dentro de uma função que retorna um objeto de funções — para acessá-lo de forma simples, criar uma query direta com o mesmo padrão, usando `useQuery` diretamente no componente (sem depender da estrutura interna do hook).

### Mudanças necessárias

**1. Adicionar estado e query:**
```ts
const [detalheTicketId, setDetalheTicketId] = useState<string | null>(null);

const { data: ticketDetalhe, isLoading: loadingDetalhe } = useQuery({
  queryKey: ['ticket-portal', detalheTicketId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('projetos_marketing')
      .select(`
        *,
        cliente:cliente_id(id, full_name, email),
        supervisor:supervisor_id(id, full_name),
        empreendimento:empreendimento_id(id, nome),
        briefing:briefing_id(id, codigo, cliente, tema, objetivo, formato_peca, composicao, head_titulo, sub_complemento, mensagem_chave, tom_comunicacao, estilo_visual, diretrizes_visuais, referencia, importante, observacoes, status)
      `)
      .eq('id', detalheTicketId!)
      .single();
    if (error) throw error;
    return data;
  },
  enabled: !!detalheTicketId,
});
```

**2. Adicionar `cursor-pointer` e `onClick` em cada item da lista:**
```tsx
<div
  key={ticket.id}
  onClick={() => setDetalheTicketId(ticket.id)}
  className={`... cursor-pointer`}
>
```

**3. Criar um Dialog de detalhe simples** (já que não existe `AtividadeDetalheDialog` para tickets de marketing), exibindo:
- Código + Título
- Categoria + Status + Prioridade (badges)
- Empreendimento
- Data de previsão / entrega
- Briefing (se houver)
- Descrição

```tsx
<Dialog open={!!detalheTicketId} onOpenChange={(open) => !open && setDetalheTicketId(null)}>
  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">{ticketDetalhe?.codigo}</span>
        {ticketDetalhe?.titulo}
      </DialogTitle>
    </DialogHeader>
    {loadingDetalhe ? <Skeleton ... /> : <conteúdo dos campos>}
  </DialogContent>
</Dialog>
```

---

## Resumo das mudanças

| O que muda | Detalhe |
|---|---|
| Filtro `allTickets` | Remove exclusão por `etapas finais` — exibe todos os tickets não arquivados |
| Estado `detalheTicketId` | Controla qual ticket está aberto no modal |
| Query `ticket-portal` | Busca os dados completos do ticket selecionado via `projetos_marketing` |
| Items da lista | Recebem `cursor-pointer` + `onClick` |
| Dialog de detalhe | Novo Dialog inline com código, título, badges, briefing e descrição |

Apenas o arquivo `PortalIncorporadorMarketing.tsx` é modificado — sem criar novos arquivos.

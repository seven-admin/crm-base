## CRUD completo de Visitas Nexa

### Objetivo
Transformar `/nexa` (agenda) em uma listagem gerenciável com criar, editar, excluir e visualizar visitas, com hard delete restrito a `super_admin`.

### Mudanças

**1. Listagem em tabela — `src/pages/nexa/NexaAgenda.tsx`**
- Substituir grid de cards por tabela com colunas: Data/Hora, Visitante, Empreendimento, Imobiliária, Corretor, Status, Ações.
- Ações por linha: Ver detalhes, Editar, Excluir (excluir só aparece para `super_admin`).
- Manter botão "Nova visita" no topo.
- Filtros rápidos por status e empreendimento acima da tabela.

**2. Dialog de edição — novo `src/components/nexa/VisitaFormDialog.tsx`**
- Reaproveitar campos do `NovaVisitaDialog` (nome, telefone, email, empreendimento, imobiliária, data/hora, observações, status).
- Modo criar e modo editar (recebe `visita?` como prop).
- Refatorar `NovaVisitaDialog` para usar este componente compartilhado (ou substituí-lo).

**3. Hard delete — hook + RLS**
- Adicionar `useDeleteVisita` em `src/hooks/useNexa.ts` que apaga `nexa_visitas_eventos` da visita e depois `nexa_visitas`.
- Migration para políticas RLS:
  - `nexa_visitas` DELETE: apenas `super_admin`.
  - `nexa_visitas_eventos` DELETE: apenas `super_admin` (a trigger `nexa_eventos_readonly` bloqueia hoje — desabilitar temporariamente na função do hook via RPC, ou criar RPC `nexa_delete_visita(p_id uuid)` security definer que desabilita a trigger, apaga eventos e visita, e reabilita).
- Preferido: criar RPC `nexa_delete_visita` (padrão semelhante a `arqo_delete_leads_bulk`), verificando `is_super_admin(auth.uid())` internamente.

**4. Confirmação de exclusão**
- `AlertDialog` com aviso de que a ação é irreversível e apaga todos os eventos da visita.

**5. Limpeza de timeline (bônus do plano anterior)**
- `src/components/nexa/VisitaTimeline.tsx`: remover `<pre>{JSON.stringify(payload)}</pre>`, exibir apenas label da ação, data e (se disponível) nome do usuário.
- Mesma limpeza em `src/components/empreendimentos/HistoricoEmpreendimentoTab.tsx`.

### Detalhes técnicos
- RPC sugerida:
  ```sql
  CREATE FUNCTION public.nexa_delete_visita(p_id uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    IF NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Somente super_admin pode excluir visitas';
    END IF;
    ALTER TABLE public.nexa_visitas_eventos DISABLE TRIGGER trg_nexa_eventos_readonly;
    DELETE FROM public.nexa_visitas_eventos WHERE visita_id = p_id;
    ALTER TABLE public.nexa_visitas_eventos ENABLE TRIGGER trg_nexa_eventos_readonly;
    DELETE FROM public.nexa_visitas WHERE id = p_id;
  END; $$;
  ```
- Botão de exclusão visível via `useAuth`/`isSuperAdmin` já existente no projeto.

# Plano (revisado)

Escopo reduzido: **sem mexer em tabelas**. Só ajustes na exclusão de usuários e desacoplamento visual/lógico entre corretores e imobiliárias.

## 1. Exclusão de gestores de produto (edge function `delete-user`)
Hoje só limpa `seven_lancamentos_financeiros.beneficiario_id`. Ampliar a limpeza preventiva (sem alterar schema) antes do `auth.admin.deleteUser`:

- `sistema_user_empreendimentos` → delete linhas do usuário
- `sistema_user_module_permissions` → delete linhas do usuário
- `arqo_grupo_membros` → delete linhas do usuário
- `seven_clientes.gestor_id` → null
- `arqo_leads.consultor_id`, `arqo_leads.closer_id`, `arqo_leads.created_by` → null
- `arqo_lead_events.usuario_id` → null
- `nexa_visitas.corretor_id`, `nexa_visitas.criado_por` → null (se colunas existirem)
- `user_roles` → delete linhas do usuário (por último, antes do delete no auth)

A função continua reportando por linha qual usuário falhou e com qual mensagem, para o frontend exibir o motivo real quando ainda houver alguma FK residual.

## 2. Corretores × Imobiliárias — sem vínculo (apenas frontend)
A coluna `seven_corretores.imobiliaria_id` continua no banco (não vou mexer), mas o app deixa de usá-la em qualquer lugar:

- `src/components/mercado/CorretorForm.tsx`: remover campo "Imobiliária" e validação relacionada; no submit, sempre gravar `imobiliaria_id: null`.
- `src/pages/Corretores.tsx`: remover filtro por imobiliária e a coluna "Imobiliária" da tabela.
- `src/hooks/useCorretores.ts`: remover parâmetro `imobiliariaId`, remover o join `imobiliaria:seven_imobiliarias(...)` em todas as queries, e retirar as `invalidateQueries(['imobiliarias'])` de create/update/delete.
- `src/pages/portal/PortalMinhaImobiliaria.tsx` e `src/pages/portal/PortalCorretoresGestao.tsx`: remover as seções que listam corretores da imobiliária do usuário (ficam só os dados da própria imobiliária / gestão de usuários dela).
- `src/pages/Imobiliarias.tsx`: se houver contagem ou link para corretores vinculados, remover.
- `src/hooks/useGestorCorretores.ts` e `src/hooks/useCorretoresUsuarios.ts`: revisar e remover qualquer filtro por `imobiliaria_id`.

Impacto colateral: `EquipeTab` do empreendimento e o portal do incorporador continuam funcionando — usam `seven_empreendimento_corretores` (vínculo direto empreendimento↔corretor, independente de imobiliária).

## Ordem de execução
1. Ampliar `supabase/functions/delete-user/index.ts`.
2. Refactor de frontend nos arquivos listados acima para eliminar o uso de `imobiliaria_id` em corretores.

Confirme para eu executar.

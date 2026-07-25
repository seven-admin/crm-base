## Plano: corrigir ação “Puxar próximo lead” da roleta Arqo

### Diagnóstico confirmado
- A tela `/arqo/roleta` desabilita o botão quando o usuário tem qualquer lead ativo bloqueante.
- No banco, os membros dos grupos atuais já possuem 1 lead ativo bloqueante cada, então o botão fica travado para eles.
- A RPC atual já atribui ao usuário que clicou, mas a experiência ainda depende de o frontend escolher um lead e de a regra de bloqueio estar rígida demais para o fluxo esperado.

### O que vou ajustar
1. **Centralizar a escolha do próximo lead no banco**
   - Alterar a RPC `arqo_atribuir_lead_roleta` para ela própria buscar o próximo lead disponível do grupo.
   - O frontend deixará de enviar um `leadId` escolhido localmente.
   - Isso evita inconsistência quando vários consultores visualizam a mesma fila.

2. **Liberar o botão para todos os membros do grupo com leads disponíveis**
   - Remover o bloqueio visual global que trava o botão apenas porque o usuário já tem um lead ativo.
   - O clique passará a chamar a RPC; se houver impedimento real, a própria RPC retorna uma mensagem clara.

3. **Ajustar a regra de bloqueio na RPC para o comportamento desejado**
   - Manter validação de usuário autenticado e membro ativo do grupo.
   - Validar apenas o que realmente deve impedir puxar novo lead.
   - Como você indicou que “não deve travar somente no primeiro”, a função não vai usar `ordem_roleta` para decidir quem pode puxar; qualquer membro ativo do grupo poderá puxar o próximo lead da fila.

4. **Melhorar feedback da interface**
   - Mostrar loading apenas no card/grupo clicado, não travar todos os botões da tela.
   - Atualizar imediatamente a lista de leads após puxar.
   - Mensagens de erro mais específicas: sem lead disponível, usuário fora do grupo, lead já capturado, etc.

### Arquivos e banco envolvidos
- `src/pages/arqo/ArqoRoleta.tsx`
- `src/hooks/useArqo.ts`
- Migration Supabase para atualizar `public.arqo_atribuir_lead_roleta`

### Resultado esperado
- Todos os consultores ativos de um grupo enxergam o botão habilitado quando há leads na fila.
- Ao clicar, o lead é atribuído ao consultor que clicou.
- A fila não fica presa ao primeiro membro da ordem.
- Concorrência entre usuários fica segura, pois a seleção do próximo lead acontece dentro da RPC no banco.
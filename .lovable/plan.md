

# Botão de Destaque não visível no Planejamento

## Problema
O botão de destaque está **escondido dentro do menu dropdown** (três pontinhos), que só aparece no hover. O usuário espera um botão de estrela **visível diretamente no card**, sem precisar abrir o menu.

## Solução
Adicionar um botão de estrela sempre visível em cada card de tarefa no painel lateral (`CalendarioDiaDetalhe.tsx`), ao lado do nome ou na área de ações. O toggle no dropdown será mantido como opção secundária.

### Alteração em `CalendarioDiaDetalhe.tsx`
- Adicionar um `Button` com ícone `Star` visível diretamente no card, entre o nome da tarefa e o menu dropdown
- Estrela preenchida (amarela) quando `destaque === true`, outline quando `false`
- Click chama `onUpdate(item.id, { destaque: !item.destaque })`
- Sempre visível (sem opacity-0/hover)

### Arquivo afetado
- `src/components/planejamento/CalendarioDiaDetalhe.tsx`


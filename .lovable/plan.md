

# Corrigir celulares no payload e exibir na tabela de inscritos

## Problemas identificados

1. **Join funciona**, mas muitos `corretor_id` são NULL (inscrições manuais) e mesmo quando existem, `corretores.telefone` pode estar vazio para aquele corretor específico
2. A tabela só mostra `evento_inscricoes.telefone` (campo da inscrição), que está NULL na maioria dos registros
3. O payload do webhook já envia `corretor_celular` corretamente quando existe — o problema é que os dados de origem estão vazios

## Solução

### `src/components/eventos/EventoInscritosTab.tsx`

1. **Expandir a query** para buscar o telefone do corretor por duas vias:
   - Via `corretor_id` (FK direta): `corretor:corretor_id(telefone, whatsapp)`  — já está implementado
   - Via `user_id` buscando na tabela `corretores`: fazer uma query separada para buscar corretores por `user_id` dos inscritos que não têm `corretor_id`

   **Abordagem simplificada**: Manter o join atual via `corretor_id` e adicionar um segundo select para buscar os phones via `user_id` dos corretores. Montar um mapa `user_id → telefone` para fallback.

2. **Adicionar coluna "Celular Corretor"** na tabela, exibindo:
   - `corretor.telefone` ou `corretor.whatsapp` (da tabela corretores, via join)
   - Fallback para o `telefone` da inscrição

3. **Payload do webhook reenvio**: usar a mesma lógica de fallback para garantir que `corretor_celular` nunca fique vazio quando existe dado disponível

### Detalhes da implementação

```typescript
// Query principal mantém o join
.select('*, corretor:corretor_id(telefone, whatsapp)')

// Query auxiliar: buscar telefones dos corretores por user_id
const userIds = data.filter(d => !d.corretor_id).map(d => d.user_id);
const { data: corretoresByUser } = await supabase
  .from('corretores')
  .select('user_id, telefone, whatsapp')
  .in('user_id', userIds);

// Montar mapa e enriquecer os dados
```

Na tabela:
- Coluna "Telefone" → telefone da inscrição (profile)
- Nova coluna "Celular" → telefone do cadastro de corretor (prioridade: whatsapp > telefone)

No payload do webhook:
```typescript
corretor_celular: insc.corretor?.whatsapp || insc.corretor?.telefone 
  || corretorMap[insc.user_id]?.whatsapp || corretorMap[insc.user_id]?.telefone 
  || insc.telefone || null
```

### Arquivos alterados
- `src/components/eventos/EventoInscritosTab.tsx`


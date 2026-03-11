

# Plano: Modal de corretores na imobiliária + celular obrigatório

## 1. Modal com lista de corretores ao clicar no contador

**Arquivo: `src/pages/Imobiliarias.tsx`**
- Adicionar estado para controlar o modal e a imobiliária selecionada
- Tornar o contador de corretores clicável (botão/link)
- Ao clicar, abrir um Dialog que busca os corretores da imobiliária via `supabase.from('corretores').select('id, nome_completo, creci, telefone').eq('imobiliaria_id', id)`
- Exibir lista com nome, CRECI e telefone de cada corretor

## 2. Celular obrigatório nos formulários de corretor

Três formulários precisam ser alterados:

### `src/components/mercado/CorretorForm.tsx` (admin)
- Alterar `telefone` no schema zod de `.optional()` para `.min(1, 'Celular é obrigatório')`

### `src/pages/portal/PortalCorretoresGestao.tsx` (gestor imobiliária)
- Adicionar `required` no campo Telefone do `NovoCorretorDialog`

### `src/components/auth/CorretorRegisterForm.tsx` (auto-cadastro)
- Já exige WhatsApp obrigatório — manter como está

## Arquivos alterados
- `src/pages/Imobiliarias.tsx`
- `src/components/mercado/CorretorForm.tsx`
- `src/pages/portal/PortalCorretoresGestao.tsx`


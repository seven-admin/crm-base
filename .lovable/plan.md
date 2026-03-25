

# Separar Atendimentos e Negociações no Portal do Incorporador

## Contexto

Atualmente, a seção "Atendimentos e Negociações em Andamento" lista todas as negociações juntas. O funil tem etapas claras:
- **Atendimento** (etapa inicial, id: `174893f5...`)
- **Negociação** (id: `8e7df233...`)
- **Retorno do incorporador** (id: `0ce3c47e...`)
- **Proposta completa** (id: `ed1b1eb4...`)

## Plano

Separar a seção única em **duas sub-seções colapsáveis** dentro da página `PortalIncorporadorPropostas.tsx`:

1. **"Atendimentos em Andamento"** - negociações na etapa inicial (`is_inicial = true`)
2. **"Negociações em Andamento"** - negociações nas demais etapas visíveis (Negociação, Retorno do incorporador, Proposta completa), excluindo as que já têm status de proposta resolvida

### Alterações

**Arquivo: `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`**

- Buscar `funil_etapas` com o campo `is_inicial` incluso na query de etapas visíveis (já disponível via `funil_etapa` join nas negociações)
- Dividir o array `negociacoesEmAndamento` em dois:
  - `atendimentosEmAndamento`: onde `funil_etapa.is_inicial === true`
  - `negociacoesEfetivas`: onde `funil_etapa.is_inicial === false`
- Renderizar duas `CollapsibleSection` separadas com ícones distintos (ex: `Headphones` para atendimentos, `Handshake` para negociações)
- Cada seção com seu próprio contador

### Detalhes técnicos

A informação de `funil_etapa` já vem no join da query de negociações (`funil_etapa:funil_etapas(id, nome, cor, cor_bg, is_inicial, ...)`), então não é necessária nenhuma query adicional. Basta filtrar pelo campo `funil_etapa.is_inicial` do objeto `Negociacao`.




# Correções no Portal do Incorporador

## 1. Negociações não aparecem — Causa raiz

Dados do banco confirmam:
- 105 negociações na etapa **Atendimento** (vinculadas aos empreendimentos do incorporador Kraft)
- Etapa "Atendimento" tem `visivel_incorporador = false`
- Apenas "Negociação" (1 registro) e "Retorno do incorporador" (1 registro) estão marcadas como visíveis
- O fallback "mostrar tudo se nenhuma etapa configurada" não dispara porque 2 etapas já estão configuradas

**Solução**: Marcar "Atendimento" como `visivel_incorporador = true` via migration. O incorporador precisa ver todas as negociações dos seus empreendimentos desde o início do funil.

```sql
UPDATE public.funil_etapas SET visivel_incorporador = true WHERE nome = 'Atendimento';
```

Adicionalmente, marcar "Proposta completa" como visível também (faz sentido para o incorporador acompanhar).

## 2. Refatoração do layout da Home

Problemas atuais:
- KPIs aparecem **depois** dos cards de navegação (deveria ser antes)
- Cards de navegação em 2 colunas ocupam muito espaço vertical
- UX pesada

**Solução**:

```text
┌──────────────────────────────────────────────────────────────┐
│  KPIs (faixa compacta, 4 cols)                               │
├──────────────────────────────────────────────────────────────┤
│  6 cards de navegação em UMA LINHA (6 colunas)               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │Exec. │ │Forec.│ │Disp. │ │Prop. │ │Mktg. │ │Plan. │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
└──────────────────────────────────────────────────────────────┘
```

Cards em formato compacto/vertical (ícone em cima, título embaixo) para caber 6 em uma linha. No mobile: 3 colunas (2 linhas).

### Arquivos alterados

- **Migration**: `UPDATE funil_etapas SET visivel_incorporador = true WHERE nome IN ('Atendimento', 'Proposta completa')`
- `src/components/portal-incorporador/PortalIncorporadorLayout.tsx` — grid 6 colunas, cards compactos verticais, KPIs antes dos cards
- `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx` — sem mudanças estruturais (já está compacto)


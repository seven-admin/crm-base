
# Aplicar Cores dos Modulos nas Tabs

## Contexto

A sidebar define cores por modulo:
- **Comercial**: Laranja `#F5941E`
- **Diario de Bordo**: Ciano `#06B6D4`

As tabs de "Negociacoes/Propostas" e "Atividades" nas paginas Forecast e Negociacoes usam o estilo padrao (sem cor diferenciada). O objetivo e aplicar as cores corretas para manter a identidade visual dos modulos.

## Alteracoes

### 1. `src/pages/Forecast.tsx`

Aplicar cor nos TabsTrigger:
- **Negociacoes**: icone e texto ativo em laranja `#F5941E`
- **Atividades**: icone e texto ativo em ciano `#06B6D4`

Usar `data-[state=active]` do Radix para colorir a tab ativa, e aplicar cor no icone via style inline.

### 2. `src/pages/Negociacoes.tsx`

Mesma logica para as tabs "Propostas" e "Atividades":
- **Propostas**: cor laranja `#F5941E` (pertence ao modulo Comercial)
- **Atividades**: cor ciano `#06B6D4` (pertence ao modulo Diario de Bordo)

### Abordagem tecnica

Adicionar classes inline nos TabsTrigger para colorir o estado ativo com a cor do modulo. Exemplo:

```text
<TabsTrigger
  value="negociacoes"
  className="gap-2 data-[state=active]:text-[#F5941E] data-[state=active]:border-[#F5941E]"
>
```

E no icone, manter a cor fixa do modulo para que funcione como indicador visual mesmo quando inativo (com opacidade reduzida no estado inativo).

### Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `src/pages/Forecast.tsx` | Colorir tabs Negociacoes (laranja) e Atividades (ciano) |
| `src/pages/Negociacoes.tsx` | Colorir tabs Propostas (laranja) e Atividades (ciano) |

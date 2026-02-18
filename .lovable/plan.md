
## Remover Cards de Alerta do Dashboard de Planejamento

### Alteração

Remover o bloco condicional que exibe os dois cards de aviso em `src/components/planejamento/PlanejamentoDashboard.tsx`:

- Card "X tarefa(s) sem responsável / Atribua um responsável técnico"
- Card "X tarefa(s) sem data / Defina datas de início e fim"

### Localização exata

**Arquivo**: `src/components/planejamento/PlanejamentoDashboard.tsx` — linhas 153 a 178

```tsx
{(metrics.semResponsavel > 0 || metrics.semData > 0) && (
  <div className="grid gap-4 md:grid-cols-2">
    {metrics.semResponsavel > 0 && (
      <Card className="border-amber-500/50 bg-amber-500/5">
        ...
      </Card>
    )}
    {metrics.semData > 0 && (
      <Card className="border-amber-500/50 bg-amber-500/5">
        ...
      </Card>
    )}
  </div>
)}
```

Todo esse bloco será removido. Os imports de `UserX` e `Calendar` que ficarem sem uso também serão removidos do topo do arquivo.

### Impacto

Apenas o `PlanejamentoDashboard.tsx` é afetado. Nenhuma outra página ou componente usa esses alertas.

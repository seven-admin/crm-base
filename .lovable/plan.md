
# Separacao Completa: Formulario Filtrado + Forecast na aba Comercial

## Resumo

Tres alteracoes principais:

1. **Filtrar tipos no formulario** -- cada tela so mostra os tipos que lhe pertencem
2. **Mover Forecast para dentro do grupo Comercial** no menu lateral
3. **Diario de Bordo fica como grupo proprio** no menu lateral

## Alteracoes detalhadas

### 1. Filtrar tipos no AtividadeForm

**Arquivo:** `src/components/atividades/AtividadeForm.tsx`

- Adicionar prop `tiposPermitidos?: AtividadeTipo[]` na interface `AtividadeFormProps`
- No grid de tipos (linha ~294), em vez de iterar `Object.keys(ATIVIDADE_TIPO_LABELS)`, iterar apenas os tipos permitidos (quando informados)
- Ajustar `defaultValues.tipo` para usar o primeiro tipo da lista filtrada

### 2. Passar filtro nas paginas

**Arquivo:** `src/pages/Forecast.tsx`
- Passar `tiposPermitidos={TIPOS_FORECAST}` ao `AtividadeForm` no dialog de nova atividade
- Remover `VisitasPorEmpreendimento` (visita e tipo do Diario)

**Arquivo:** `src/pages/DiarioBordo.tsx`
- Passar `tiposPermitidos={TIPOS_DIARIO}` ao `AtividadeForm` no dialog de nova atividade

**Arquivo da pagina /atividades** -- continua sem filtro, mostrando todos os tipos

### 3. Reorganizar menu lateral (Sidebar)

**Arquivo:** `src/components/layout/Sidebar.tsx`

O grupo "Forecast" atual sera desmembrado. A nova estrutura:

```text
Comercial (cor laranja, icone Target)
  |-- Fichas de Proposta     /negociacoes
  |-- Solicitacoes           /solicitacoes  (adminOnly)
  |-- Forecast               /forecast
  |-- Metas Comerciais       /metas-comerciais

Diario de Bordo (grupo proprio, cor cyan, icone BookOpen)
  |-- Dashboard              /diario-bordo
  |-- Atividades             /atividades
```

Ou seja:
- O grupo "Forecast" deixa de existir como grupo separado
- "Forecast" e "Metas Comerciais" sao movidos para dentro do grupo "Comercial"
- "Diario de Bordo" vira um grupo proprio com o item de Atividades

## Arquivos afetados

| Arquivo | Alteracao |
|---|---|
| `src/components/atividades/AtividadeForm.tsx` | Nova prop `tiposPermitidos`, filtra grid de tipos |
| `src/pages/Forecast.tsx` | Passa `TIPOS_FORECAST`, remove VisitasPorEmpreendimento |
| `src/pages/DiarioBordo.tsx` | Passa `TIPOS_DIARIO` |
| `src/components/layout/Sidebar.tsx` | Reorganiza menu: Forecast vai para Comercial, Diario de Bordo vira grupo proprio |

## Nenhuma alteracao no banco

Tudo e frontend. Sem migrations.

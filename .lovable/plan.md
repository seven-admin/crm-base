

# Alterar Labels de Tipos e Adicionar Status nos Cards de Categoria

## Resumo

Duas mudancas:
1. Renomear labels de tipo de atividade: "Ligacao" vira "Ligacao/WhatsApp" e "Adm. Seven" vira "Staff Seven"
2. Adicionar contadores de status (Abertas, Fechadas, Futuras, Atrasadas) em cada card de categoria

## Mudancas

### 1. Alterar labels em `src/types/atividades.types.ts`

Linhas 10 e 19:
- `ligacao: 'Ligacao'` para `ligacao: 'Ligacao/WhatsApp'`
- `administrativa: 'Adm. Seven'` para `administrativa: 'Staff Seven'`

Isso reflete automaticamente em todos os componentes que usam `ATIVIDADE_TIPO_LABELS`.

### 2. Atualizar hook `src/hooks/useResumoAtividadesPorCategoria.ts`

Passar a buscar tambem `status` e `data_inicio` de cada atividade para classificar em:
- **Abertas**: status = `pendente` e `data_inicio <= hoje`
- **Fechadas**: status = `concluida`
- **Futuras**: status = `pendente` e `data_inicio > hoje`
- **Atrasadas**: status = `pendente` e `deadline_date < hoje` (ou `data_fim < hoje` se nao tiver deadline)

O tipo `CategoriaResumo` ganha campos: `abertas`, `fechadas`, `futuras`, `atrasadas`.

### 3. Atualizar componente `src/components/forecast/CategoriaCard.tsx`

Adicionar abaixo da lista de tipos uma secao com 4 mini-badges coloridos mostrando:

```text
+---------------------+
| SEVEN               |
|                     |
| Ligacao/WhatsApp  5 |
| Reuniao           1 |
| Staff Seven       1 |
|                     |
| Abertas: 3  Fechadas: 2 |
| Futuras: 1  Atrasadas: 1 |
|                     |
| Total: 7            |
+---------------------+
```

Cada contador tera uma cor associada:
- Abertas: azul
- Fechadas: verde
- Futuras: cinza
- Atrasadas: vermelho/laranja

## Secao Tecnica

- A query do hook precisa incluir `status, data_inicio, data_fim, deadline_date` alem de `categoria, tipo`
- Classificacao de "atrasada": atividade pendente onde `deadline_date` (ou `data_fim` como fallback) e anterior a hoje
- Classificacao de "futura": atividade pendente onde `data_inicio` e posterior a hoje
- Classificacao de "aberta": atividade pendente onde `data_inicio <= hoje` e nao esta atrasada
- Nenhuma mudanca de schema no banco necessaria
- Arquivos alterados: 3 (`atividades.types.ts`, `useResumoAtividadesPorCategoria.ts`, `CategoriaCard.tsx`)


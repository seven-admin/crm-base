

# Configuracao de Cores do Sidebar

## Resumo

Criar uma secao dentro da tab "Personalização" em `/configuracoes` que permita ao administrador selecionar a cor de cada grupo do sidebar. As cores serao salvas na tabela `configuracoes_sistema` e lidas dinamicamente pelo Sidebar.

## Como vai funcionar

Na aba "Personalizacao", abaixo dos campos existentes, aparecera uma secao "Cores do Menu Lateral" com uma lista de todos os 11 grupos do sidebar. Cada grupo tera um campo de selecao de cor (color picker nativo do HTML via `<input type="color">`) ao lado do nome do grupo e seu icone. O administrador altera as cores e clica "Salvar Alteracoes" normalmente.

## Alteracoes

### 1. Banco de dados: inserir configuracoes iniciais

Criar registros na tabela `configuracoes_sistema` para cada grupo do sidebar com as cores padrao atuais:

| Chave | Valor | Categoria |
|---|---|---|
| `sidebar_cor_planejamento` | `#10B981` | `sidebar` |
| `sidebar_cor_empreendimentos` | `#10B981` | `sidebar` |
| `sidebar_cor_clientes` | `#8B5CF6` | `sidebar` |
| `sidebar_cor_comercial` | `#F5941E` | `sidebar` |
| `sidebar_cor_diario_de_bordo` | `#F5941E` | `sidebar` |
| `sidebar_cor_contratos` | `#60A5FA` | `sidebar` |
| `sidebar_cor_financeiro` | `#F59E0B` | `sidebar` |
| `sidebar_cor_parceiros` | `#EC4899` | `sidebar` |
| `sidebar_cor_marketing` | `#EC4899` | `sidebar` |
| `sidebar_cor_eventos` | `#06B6D4` | `sidebar` |
| `sidebar_cor_sistema` | `#94A3B8` | `sidebar` |

### 2. Hook: `useSidebarColors`

Novo hook em `src/hooks/useSidebarColors.ts` que:
- Busca as configuracoes com categoria `sidebar` usando `useConfiguracoesSistema('sidebar')`
- Retorna um mapa `{ [grupoLabel]: corHex }` com fallback para as cores padrao hardcoded
- Exporta as cores padrao como constante para uso no formulario

### 3. Componente: `SidebarColorsConfig`

Novo componente em `src/components/configuracoes/SidebarColorsConfig.tsx`:
- Lista os 11 grupos com icone, nome e um `<input type="color">` ao lado
- Mostra uma preview da cor selecionada
- Botao "Restaurar Padrao" para voltar as cores originais
- Integra com o botao "Salvar" existente da tab personalizacao

### 4. Pagina Configuracoes (`src/pages/Configuracoes.tsx`)

- Importar e renderizar `SidebarColorsConfig` dentro da tab "personalizacao", abaixo da secao de copyright
- Passar as funcoes de estado e salvar ja existentes

### 5. Sidebar (`src/components/layout/Sidebar.tsx`)

- Importar `useSidebarColors`
- Substituir as cores hardcoded no array `menuGroups` pelas cores dinamicas retornadas pelo hook
- Manter as cores atuais como fallback caso a configuracao ainda nao exista

### Detalhes tecnicos

```text
Fluxo:
  configuracoes_sistema (DB)
        |
        v
  useSidebarColors (hook) --> Sidebar (aplica cores)
        |
        v
  SidebarColorsConfig (form) --> Salva via useUpdateConfiguracoes
```

- O `menuGroups` deixa de ser `const` estatico e passa a ser gerado via `useMemo` dentro do componente `Sidebar`, mesclando a estrutura fixa com as cores do banco
- O color picker usa `<input type="color" />` nativo, sem dependencias extras
- As cores padrao ficam em uma constante exportada para reutilizacao


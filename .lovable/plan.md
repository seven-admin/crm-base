## Objetivo
Aplicar um padrão visual único no menu superior, remover busca/notificações do topo e atualizar o tema com a paleta azul-acinzentada fornecida.

## Escopo
- `src/components/layout/AppTopbar.tsx`
- `src/index.css`
- (opcional, se necessário) `tailwind.config.ts` — apenas se novos tokens precisarem ser expostos

## Fora de escopo
- Não alterar a estrutura de rotas ou funcionalidades.
- Não remover a logo.
- Não alterar a sidebar (mantém cores configuráveis por grupo), salvo se o padrão do topbar exigir consistência visual.

## Tarefas

### 1. Padronizar cores do menu superior (`AppTopbar.tsx`)
- Remover o campo `colorVar` de cada `MenuGroup`.
- Remover o uso de `hsl(var(--nav-...))` nos triggers, itens de dropdown e menu mobile.
- Usar uma única cor padrão para todos os grupos:
  - Itens inativos: `text-muted-foreground` / `hover:text-foreground`.
  - Item/grupo ativo: `text-foreground` com indicador `box-shadow` na cor do `ring`/`accent` (laranja da logo, se mantido) ou na cor primária da nova paleta.
  - Ícones dos itens de dropdown usam a mesma cor padrão (`text-foreground`/`muted-foreground`).
- Garantir que o estado ativo ainda seja visível sem depender de cor por grupo.

### 2. Remover busca e notificações do topo (`AppTopbar.tsx`)
- Remover o bloco do input de busca (ícone `Search`, input e wrapper).
- Remover a importação e o uso do componente `NotificacaoBell`.
- Limpar imports não utilizados (`Search`, `Bell`, `NotificacaoBell`) após a remoção.
- Ajustar o alinhamento dos itens restantes (logo, nav desktop, user menu, mobile trigger) para manter layout equilibrado.

### 3. Aplicar nova paleta de cores (`index.css`)
Mapear a paleta fornecida para os tokens semânticos existentes:

| Hex | RGB | Uso proposto |
|-----|-----|--------------|
| `#343d46` | (52,61,70) | `--foreground` principal e `--primary` |
| `#4f5b66` | (79,91,102) | `--secondary`, hover e fundos de destaque suaves |
| `#65737e` | (101,115,126) | `--muted`, `--accent` e estados de foco |
| `#a7adba` | (167,173,186) | `--border`, `--input`, `--muted-foreground` |
| `#c0c5ce` | (192,197,206) | `--background`, superfícies de fundo |

- Atualizar `:root` e `.dark` para refletir a nova paleta.
- Manter o laranja da logo (`#F5941E`) apenas como `--ring` e `--accent` de destaque, se o usuário quiser preservar o destaque da marca. Caso contrário, substituir por `#65737e`.
- Ajustar tokens da sidebar para harmonizar com a nova paleta (`--sidebar-background`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-border`).
- Atualizar `--nav-*` para uma cor única (padrão) ou remover se não forem mais usadas.

### 4. Verificar e ajustar componentes afetados
- Verificar se `NotificacaoBell` é referenciado em outros lugares; se não for, manter o arquivo inalterado (apenas remover o uso no topbar).
- Verificar se há hardcodes de laranja/preto que conflitem com a nova paleta e ajustar se necessário.

## Critérios de aceitação
- [ ] Menu superior exibe todos os grupos com a mesma cor padrão.
- [ ] Input de busca e sino de notificações não aparecem mais no topo.
- [ ] A nova paleta azul-acinzentada está aplicada globalmente via tokens CSS.
- [ ] O build continua passando sem erros de lint/type.
- [ ] A logo permanece inalterada.

## Riscos / Decisões pendentes
- **Destaque da marca:** manter o laranja da logo como cor de acento/ring ou usar `#65737e` como destaque único?
- **Dark mode:** a paleta fornecida é clara; para o dark mode, usarei tons mais escuros derivados da mesma família azul-acinzentada.
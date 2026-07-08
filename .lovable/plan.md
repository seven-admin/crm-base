
## Objetivo

Três ajustes visuais/estruturais:

1. Converter a listagem de `/empreendimentos` de cards para tabela.
2. Substituir o esquema de destaque laranja por uma paleta neutra (preto/cinza/branco) com amarelo `#FFDF6C` como acento, mantendo a logo atual.
3. Remover a logo de fundo da página inicial (`Index.tsx`).

---

## 1. Listagem `/empreendimentos` em formato tabela

Arquivo: `src/pages/Empreendimentos.tsx`

- Substituir o grid de `EmpreendimentoCard` por uma tabela (`@/components/ui/table`) mantendo:
  - Agrupamento por UF via `Collapsible` (linhas de cabeçalho de grupo em `<tbody>` separados ou uma linha "section header" dentro da tabela).
  - Toolbar de busca e filtros (Tipo/Status) inalterada.
- Colunas propostas:
  1. **Capa** (thumbnail 40x40 arredondado, fallback ícone)
  2. **Nome** (com código/registro pequeno abaixo, se existir)
  3. **Tipo** (badge)
  4. **Status** (badge)
  5. **Cidade / UF**
  6. **Unidades** (mini contadores: disp / res / neg / vend / bloq — mesmos chips atuais em versão inline compacta)
  7. **VGV** (`valor_total`) e **Vendido** (`valor_vendido`) formatados
  8. **Ações** (botão "Abrir" navegando para o detalhe — mesma rota que o card usa hoje)
- Linha inteira clicável (cursor pointer) redirecionando para o detalhe, mantendo o botão explícito nas ações.
- Empty state e loading permanecem, apenas ajustados ao contexto tabular.
- `EmpreendimentoCard.tsx` **não será removido** nesta fase (ainda usado em outros lugares como Portal). Apenas deixa de ser importado por `Empreendimentos.tsx`.

---

## 2. Nova paleta de destaques (remover laranja)

Paleta baseada no upload do usuário:

- `#202020` preto principal
- `#3F3F3F` grafite
- `#707070` cinza médio
- `#FFDF6C` amarelo (acento)
- `#FFFFFF` branco

Arquivo: `src/index.css` — atualizar tokens do `:root` e `.dark`:

- `--primary`: `#202020` (HSL `0 0% 13%`), `--primary-foreground`: `#FFDF6C` para dar contraste na logo/botões chave. Alternativamente, manter `--primary` neutro escuro e usar amarelo apenas via `--accent`. **Decisão adotada:** `--primary = #202020`, `--accent = #FFDF6C` (`48 100% 71%`), `--ring = #FFDF6C`.
- `--primary-soft`: cinza claro `#EDEDED`.
- `--accent`: `#FFDF6C`; `--accent-foreground`: `#202020`.
- `--secondary`: `#F3F3F3` neutro (remover tom slate azulado).
- `--muted` / `--muted-foreground`: cinzas neutros (`0 0%`).
- `--border` / `--input`: cinza neutro `#E5E5E5`.
- `--background`: manter neutro (`0 0% 96%`) para retirar o tom atual.
- `--ring`: amarelo.
- `--gradient-primary`: gradiente cinza escuro → preto (sem laranja).
- Sidebar tokens (`--sidebar-primary`, `--sidebar-ring`): trocar para `#FFDF6C`.
- Chart palette (`--chart-1..5`): substituir `--chart-1` laranja por amarelo `#FFDF6C`; ajustar demais para tons harmônicos (verde/azul/roxo/vermelho neutros mantidos).
- Nav group colors: trocar `--nav-comercial` e `--nav-diario` (hoje laranja `27 91% 53%`) para o amarelo/grafite; demais grupos permanecem.
- `.dark`: mesma lógica com preto/grafite invertidos e amarelo mantido como acento.

Classe utilitária:
- `.sidebar-nav-item-active` (linhas 396-400) — remover o `hsl(30 91% 54%...)` hard-coded e usar tokens `--sidebar-primary` / `--sidebar-accent`.

**A logo (`logo-full.png` / topbar) permanece inalterada** — só os tokens de UI mudam.

Nenhuma refatoração ampla de componentes: como já usamos `bg-primary`, `text-primary`, `ring-ring`, etc., os tokens propagam. Vou apenas fazer uma varredura rápida (`rg`) para caçar valores laranja hard-coded (`#F47F19`, `27 91%`, `orange-`) e substituí-los por tokens.

---

## 3. Home sem logo de fundo

Arquivo: `src/pages/Index.tsx`

- Remover o `<img>` da logo (linha 29) e o import.
- Deixar o container central vazio ou com uma mensagem discreta de boas-vindas curta (ex.: "Bem-vindo" em `text-muted-foreground`), mantendo o `MainLayout`.

---

## Fora de escopo

- Remoção do `EmpreendimentoCard` (segue vivo em outras telas).
- Ajustes em portais externos.
- Mudanças de tipografia ou layout global além dos tokens de cor.

## Riscos

- Algum componente pode ter cor laranja hard-coded (`bg-orange-*`, `#F47F19`); será tratado na varredura, mas pequenas telas podem precisar de follow-up se algo escapar.
- Contraste do amarelo sobre branco em textos pequenos: usaremos amarelo apenas como fundo/acento com foreground escuro, nunca como cor de texto sobre branco.

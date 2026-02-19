

# Substituir logo "S" pela logo real do sistema

## O que muda

Na barra de navegacao da pagina `/design-test`, o circulo laranja com a letra "S" e o texto "Starter" serao substituidos pela logo oficial do sistema (`logo-full.png`).

## Alteracao

**Arquivo**: `src/pages/DesignTest.tsx`

- Importar a logo: `import logo from '@/assets/logo-full.png'`
- Remover o circulo laranja com "S" e o texto "Starter"
- Substituir por uma tag `<img>` usando a logo-full, com altura de aproximadamente 28px, filtro `brightness-0` para exibir em preto (consistente com o portal do incorporador que usa fundo claro)

O restante da barra de navegacao (links, busca, icones, avatar) permanece inalterado.


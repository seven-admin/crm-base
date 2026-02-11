# Guia de Deploy - EasyPanel com Nixpacks

## Requisitos
- Node.js 20.x (configurado automaticamente via nixpacks.toml)

## Configuração no EasyPanel

### Opção 1: Usando nixpacks.toml (Recomendado)
1. Copie o arquivo `nixpacks.toml` para a raiz do projeto
2. O EasyPanel detectará automaticamente a configuração

### Opção 2: Variável de Ambiente
Adicione nas configurações do serviço:
- `NIXPACKS_NODE_VERSION=20`

### Opção 3: Pacote Nix Específico
Altere o pacote de `nodejs` para `nodejs_20`

## Comandos de Build
- Install: `npm ci`
- Build: `npm run build`
- Start: `npx serve dist -s -l 3000`

## Portas
- Aplicação: 3000

## Troubleshooting

### Erro EBADENGINE
Se aparecer erro de versão do Node.js, verifique se o `nixpacks.toml` está na raiz do projeto ou se a variável `NIXPACKS_NODE_VERSION=20` está configurada.

### Porta já em uso
Altere a porta no comando start se necessário: `npx serve dist -s -l PORTA`

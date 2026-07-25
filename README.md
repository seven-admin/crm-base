# SVN CRM

CRM de gestão integrada do Seven Group 360 — clientes, empreendimentos, mercado
(corretores, imobiliárias, incorporadoras) e os módulos **Arqo** (atendimento e
roleta de leads) e **Nexa** (visitas e atividades de WhatsApp).

## Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix)
- **TanStack Query** para dados
- **Supabase** (Postgres, Auth, Edge Functions) como backend

## Requisitos

- Node.js `>= 20`
- npm (o build de produção/Docker usa `npm` + `package-lock.json`)

## Desenvolvimento

```bash
npm install
npm run dev
```

O app sobe em `http://localhost:8080`.

### Variáveis de ambiente

Crie um arquivo `.env` na raiz (não versionado) com as chaves do Supabase:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 8080) |
| `npm run build` | Build de produção em `dist/` |
| `npm run build:dev` | Build em modo development |
| `npm run lint` | ESLint |
| `npm run preview` | Servir o build localmente |

## Banco de dados

As migrations ficam em `supabase/migrations/` e as Edge Functions em
`supabase/functions/`. Projeto Supabase: `pizerpoxuqopekmbvohh`.

## Deploy

Imagem Docker multi-stage (build com Node + servida por Nginx):

```bash
docker build -t svn-crm .
```

Veja `Dockerfile` e `nginx.conf` para detalhes.

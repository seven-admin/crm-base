# AstraCalls no EasyPanel

Esta integração mantém o AstraCalls como serviço separado do CRM. O navegador nunca recebe a API key do serviço: todas as rotas HTTP e o SSE passam pela Edge Function `arqo-calls`, autenticada pelo Supabase.

## 1. Serviço AstraCalls

Crie um serviço no EasyPanel para o domínio:

```text
calls.sevengroup360sys.com.br
```

Use a imagem publicada pelo projeto AstraCalls ou faça o build do repositório `AstraOnlineWeb/AstraCalls`. Para produção, fixe a imagem por versão/digest depois da homologação; não mantenha uma tag flutuante sem controle.

Configuração mínima do container:

- HTTP interno: `8080/tcp`.
- Mídia WebRTC: `50000/tcp` e `50000/udp` publicados diretamente na VPS.
- HTTPS obrigatório no domínio.
- O serviço de mídia precisa enxergar o IP público real. Prefira rede de host; se o EasyPanel não permitir, publique explicitamente TCP/UDP e informe o IP público da VPS.

Variáveis do AstraCalls:

```dotenv
WACALLS_PG_URL=postgres://USUARIO:SENHA@HOST:5432/postgres?sslmode=disable
WACALLS_PG_NAMESPACE=seven_calls
WACALLS_API_KEY=CHAVE_LONGA_E_ALEATORIA
WACALLS_PUBLIC_IP=IP_PUBLICO_DA_VPS
WACALLS_UDP_PORT=50000
WACALLS_MAX_CALLS=1
```

O usuário PostgreSQL informado em `WACALLS_PG_URL` precisa poder criar bancos. O AstraCalls cria um banco principal e um banco isolado por sessão WhatsApp.

Regras de firewall da VPS:

```text
443/tcp     HTTPS
50000/tcp   ICE-TCP
50000/udp   WebRTC/ICE
```

Não publique o PostgreSQL. Não execute o AstraCalls sem `WACALLS_API_KEY`.

## 2. Segredos da Edge Function

Cadastre no projeto Supabase:

```dotenv
ASTRACALLS_URL=https://calls.sevengroup360sys.com.br
ASTRACALLS_API_KEY=A_MESMA_CHAVE_DO_EASYPANEL
CRM_ALLOWED_ORIGINS=https://crm.sevengroup360sys.com.br,http://localhost:8080
```

Depois publique a função:

```bash
npx supabase functions deploy arqo-calls
```

## 3. Banco do CRM

Aplique a migration `20260722222000_arqo_calls_integration.sql`. Ela cria:

- `arqo_call_sessions`: vínculo exclusivo entre usuário e sessão WhatsApp.
- `arqo_calls`: histórico das chamadas associado ao usuário e ao lead.

As tabelas usam RLS. Usuários consultam apenas a própria sessão e as próprias chamadas; todas as gravações são feitas pelo gateway com `service_role`.

## 4. Homologação

1. Abra **Meu perfil → WhatsApp para ligações**.
2. Clique em **Vincular meu WhatsApp** e escaneie o QR Code.
3. Confirme que o estado muda para **Conectado**.
4. Puxe um lead da roleta e abra o atendimento.
5. Clique em **Ligar** e permita o microfone.
6. Valide áudio nos dois sentidos usando primeiro uma máquina externa à rede da VPS.
7. Encerre a chamada e confira o registro em `arqo_calls`.

Gravação de chamadas permanece desabilitada (`record: false`).

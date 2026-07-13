
## Diagnóstico

O 403 aparece na tela `accounts.google.com` **antes** de escolher a conta. Isso significa que o Google está bloqueando o app na **OAuth Consent Screen** — não é bug no código nem no Supabase. As causas típicas:

1. App em **Testing** sem a conta que está tentando entrar cadastrada em "Test users".
2. App em **Internal** mas a conta usada não pertence ao Google Workspace do projeto.
3. Tela de consentimento incompleta (falta escopo, domínio autorizado, etc.).

Além disso, você confirmou que **não configurou o Supabase** — sem Client ID/Secret e Redirect URLs, mesmo depois de resolver o 403, o fluxo não completa.

## Passos (nenhum é alteração de código)

### 1. Google Cloud — OAuth Consent Screen
- Ir em **APIs & Services → OAuth consent screen**.
- Se **User Type = External** e **Publishing status = Testing**:
  - Rolar até **Test users** → **+ Add users** → adicionar cada e-mail que precisa logar (incluindo o seu).
  - OU clicar **Publish app** para deixar público (aí qualquer e-mail dos domínios permitidos funciona; para produção o Google pode pedir verificação).
- Se **User Type = Internal**: só funciona com contas do Workspace do projeto. Se quiser abrir para outros domínios (nexaresolve, arqoimob), mudar para **External** e publicar.
- Confirmar em **Authorized domains** que está `supabase.co` (e o domínio do app, se houver).
- Confirmar **Scopes**: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.

### 2. Google Cloud — OAuth Client (revisão)
Você disse que o redirect URI do Supabase já está lá. Reconfirmar:
- `https://pizerpoxuqopekmbvohh.supabase.co/auth/v1/callback` em **Authorized redirect URIs**.
- `https://87ecc2ad-4d1d-4690-84b1-2e174b2dfefb.lovableproject.com` em **Authorized JavaScript origins**.
- Copiar **Client ID** e **Client Secret** para o próximo passo.

### 3. Supabase — habilitar provider
- Dashboard → **Authentication → Providers → Google** → toggle **Enabled**.
- Colar **Client ID** e **Client Secret** copiados acima → **Save**.

### 4. Supabase — URL Configuration
- Dashboard → **Authentication → URL Configuration**:
  - **Site URL**: `https://87ecc2ad-4d1d-4690-84b1-2e174b2dfefb.lovableproject.com`
  - **Redirect URLs** (adicionar todas):
    - `https://87ecc2ad-4d1d-4690-84b1-2e174b2dfefb.lovableproject.com/**`
    - `https://id-preview--87ecc2ad-4d1d-4690-84b1-2e174b2dfefb.lovable.app/**`
    - `http://localhost:8080/**` (se testar local)
    - a URL do seu domínio publicado quando tiver

### 5. Popular domínios permitidos no banco
Depois do login funcionar, garantir que a tabela `sistema_dominios_google_permitidos` tem as linhas:
- `sevengroup360.com.br` → empresa_default `seven`
- `nexaresolve.com.br` → `nexa`
- `arqoimob.com.br` → `arqo`

Sem isso, mesmo com Google ok, o `AuthContext.validateGoogleDomain` desloga o usuário.

### 6. Testar
- Limpar cache/aba anônima.
- Clicar "Entrar com Google" → escolher conta autorizada → deve redirecionar de volta autenticado.

## Se ainda der 403 depois disso
Enviar screenshot da tela de erro do Google (mostra código exato tipo `Error 403: access_denied` ou `disallowed_useragent`) para diagnóstico mais preciso.

## Nada a alterar no código
O código atual (`signInWithGoogle` + `validateGoogleDomain`) está correto. Todo o resto é configuração externa.

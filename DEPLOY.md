# Deploy — www.patotina.com.br (Firebase)

Como o projeto Firebase do Patotina foi montado e como publicar site, painel
e o app de gestão.

**Estado em 12/09/2026:** tudo no ar em https://patotina.web.app — projeto
`patotina`, Auth (e-mail/senha), Firestore e Storage em southamerica-east1,
regras publicadas, conteúdo inicial e o primeiro Master criados. O papel
cross-service do Storage (seção "Se o upload de logo falhar") já foi
concedido. **12/09/2026 (tarde):** o app de gestão foi publicado em
https://patotina-gestao.web.app (site `patotina-gestao` criado, domínios
`patotina-gestao.web.app` e `app.patotina.com.br` autorizados no Auth pela
API — ver passo 6). Faltam os domínios (passo 7): `www.patotina.com.br` e
`app.patotina.com.br` dependem do DNS.
A chave de conta de serviço foi gerada com `gcloud iam service-accounts keys
create` e está em `patotina-service-account.json` (ignorada pelo git).

## Arquitetura

```
Firebase Hosting — site "patotina" (target `site`, dist/)
├── /            → site público (site/), HTML/CSS/JS puro
│                  lê o Firestore sem login (só o que está visível)
├── /app         → painel do site (app/), Vite + React + TS
│                  Auth (e-mail/senha) + papéis em usuarios/{uid}
└── /admin       → redireciona para /app
Firebase Hosting — site "patotina-gestao" (target `gestao`, dist-gestao/)
├── /            → app de gestão (gestao/), PWA; app.patotina.com.br
│                  mesma Auth e os mesmos usuarios/{uid} (papéis Gestor/Professor)
└── /familia     → área da família (responsaveis/{uid}), mesmo app

Firestore   + alunos, turmas, chamadas, cobrancas, pre_matriculas, eventos,
            avisos, configuracoes/escolinha, responsaveis (ver docs/gestao.md)
Storage     + gestao/alunos/*.webp (fotos dos alunos)

Firestore   site_turmas, site_destaques, site_titulos, site_historia,
            site_parceiros, site_config/textos, usuarios
Storage     site/parceiros/*.webp (logos)
```

Sem Cloud Functions nesta fase: criar conta de outra pessoa roda no cliente
(um segundo app Firebase, ver `usuariosRepository.ts`), e o site lê o
Firestore direto. Quando o app de gestão precisar de Functions, o plano Blaze
já estará ativo (passo 2).

## Passo 1 — Criar o projeto

No [console](https://console.firebase.google.com): **Adicionar projeto** →
nome `Patotina` → id sugerido `patotina` (se estiver tomado, `patotina-ec`).
Google Analytics pode ficar desligado.

Ou pelo terminal:

```bash
firebase projects:create patotina --display-name "Patotina"
```

## Passo 2 — Plano Blaze

Projetos novos exigem o plano **Blaze** para usar o Storage (e, depois, as
Functions). O custo continua zero dentro das cotas gratuitas — mas precisa de
um cartão cadastrado. Console → engrenagem → **Uso e faturamento** → Modificar
plano. Defina um **alerta de orçamento** (R$ 20) por segurança.

## Passo 3 — Ativar os serviços (região southamerica-east1)

1. **Authentication** → Começar → provedor **E-mail/senha** → ativar.
   Em *Configurações* → *Ações do usuário*, deixe **"Criar (inscrição)"
   ligado** — é o que o painel usa para cadastrar novas contas. Quem se
   inscrever por fora não consegue nada: sem documento em `usuarios/`, as
   regras negam tudo.
2. **Firestore Database** → Criar banco de dados → **modo de produção** →
   local **southamerica-east1 (São Paulo)**. As regras vêm do repositório no
   deploy.
3. **Storage** → Começar → **southamerica-east1**. Idem para as regras.
4. **Hosting** → Começar (só para habilitar; o resto é pelo terminal).

## Passo 4 — Config do painel

Console → engrenagem → **Configurações do projeto** → *Seus apps* → **Web**
(ícone `</>`) → apelido `painel` → registrar. Copie os valores para
`.env.production` (a partir de `.env.example`):

```bash
cp .env.example .env.production
# preencha VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID, VITE_FIREBASE_MESSAGING_SENDER_ID
# e confira PROJECT_ID / AUTH_DOMAIN / STORAGE_BUCKET
```

O site público não precisa disso: no ar, ele lê a config em
`/__/firebase/init.json`, que o próprio Hosting entrega.

Aponte o CLI para o projeto:

```bash
firebase use --add   # escolha patotina, apelido "prod"
```

## Passo 5 — Regras, conteúdo e primeiro acesso

```bash
firebase deploy --only firestore:rules,storage
```

Para gravar o conteúdo inicial e criar o primeiro administrador, os scripts
usam o Admin SDK e precisam de uma **chave de conta de serviço** (já gerada —
se precisar de outra, pelo console ou `gcloud iam service-accounts keys create
patotina-service-account.json --iam-account firebase-adminsdk-fbsvc@patotina.iam.gserviceaccount.com`;
a conta precisa dos papéis *Firebase Admin SDK Administrator Service Agent* e
*Cloud Datastore Owner*, que o console dá sozinho e o gcloud não):
Console → Configurações do projeto → **Contas de serviço** → *Gerar nova chave
privada*. Salve como `patotina-service-account.json` na raiz (o `.gitignore`
já ignora `*service-account*.json`) e:

```bash
npm run seed -- --projeto patotina --chave patotina-service-account.json
npm run criar-acesso -- --projeto patotina --chave patotina-service-account.json \
  --nome "Maiton Lima" --email seu@email.com --senha "SenhaForte123" --papel master
```

Depois disso, as outras contas nascem pela aba **Contas** do painel. Guarde a
chave em lugar seguro ou apague-a: com ela se faz qualquer coisa no projeto.

## Passo 6 — Publicar

```bash
firebase deploy
```

O `predeploy` roda `npm run build` (site copiado para `dist/`, painel em
`dist/app/`, app de gestão em `dist-gestao/`). Saem também as regras. Ao
fim, o site responde em `patotina.web.app`. Confira `/app` (login) e o site
com o conteúdo do banco.

### O segundo site (app de gestão)

O `firebase.json` publica dois sites do Hosting. O segundo precisa existir no
projeto antes do primeiro deploy — uma vez só:

```bash
firebase hosting:sites:create patotina-gestao
```

O `.firebaserc` já liga o target `gestao` a esse site. Ele responde em
`patotina-gestao.web.app`; o domínio `app.patotina.com.br` entra no passo 7.
Como o app de gestão faz login por e-mail/senha num domínio diferente do
`authDomain`, acrescente `patotina-gestao.web.app` e `app.patotina.com.br` em
Console → **Authentication** → *Settings* → *Authorized domains*. Sem
console, pela API (o gcloud precisa do projeto de cota no cabeçalho):

```bash
TOKEN=$(gcloud auth print-access-token)
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: patotina"   -H "Content-Type: application/json"   "https://identitytoolkit.googleapis.com/admin/v2/projects/patotina/config?updateMask=authorizedDomains"   -d '{"authorizedDomains":["localhost","patotina.firebaseapp.com","patotina.web.app","www.patotina.com.br","patotina.com.br","patotina-gestao.web.app","app.patotina.com.br"]}'
```

> No Windows, o emulador de Hosting **não aplica redirects nem headers**
> (bug do `glob-slasher`, que troca `/admin` por `\admin`). Em produção
> funcionam. Para testar `/admin` e os cabeçalhos, use um canal de
> pré-visualização: `firebase hosting:channel:deploy teste`.

## Passo 7 — Domínio www.patotina.com.br

Hoje o domínio aponta para o GitHub Pages (repo `patotina-site`, CNAME). A
troca:

1. Console → **Hosting** → *Adicionar domínio personalizado* →
   `www.patotina.com.br` (marque para redirecionar `patotina.com.br` → www).
2. O Firebase mostra os registros. No Registro.br (ou onde estiver o DNS):
   - apague o CNAME atual de `www` (que aponta para `*.github.io`);
   - crie os registros que o Firebase pedir (TXT de verificação + A/AAAA
     ou CNAME, conforme ele indicar).
3. Espere a verificação e o certificado (minutos a algumas horas).
4. Depois que o domínio responder pelo Firebase, desative o GitHub Pages no
   repositório antigo — este repositório não publica mais lá (os arquivos do
   site agora vivem em `site/`, e o `CNAME` saiu).

Para o app de gestão, o mesmo caminho no site `patotina-gestao`:
*Adicionar domínio personalizado* → `app.patotina.com.br`, e o CNAME/A que
o Firebase pedir no DNS.

## Se o upload de logo falhar em produção

As regras do Storage consultam o Firestore (`firestore.get`) para saber se
quem envia é Editor/Master. Se o console acusar *permission denied* mesmo
com uma conta certa, é a propagação de IAM cross-service (viu-se isso no
OnTrac). Saída: Console do Google Cloud → IAM → conta de serviço
`service-<número>@gcp-sa-firebasestorage.iam.gserviceaccount.com` → papel
**Firebase Rules Firestore Service Agent**. Depois `firebase deploy --only storage`.

## Atualizações do dia a dia

```bash
git pull
firebase deploy                        # site + painel + gestão + regras
firebase deploy --only hosting         # só arquivos, mais rápido
firebase deploy --only hosting:gestao  # só o app de gestão
```

Conteúdo (turmas, destaques, títulos, parceiros, textos) **não passa por
deploy**: é editado no painel e vale na hora.

# Patotina — site da escolinha + painel

Site do **Patotina Esporte Clube** (Matutina/MG), com foco na Escolinha de
Futebol, e o painel em que a escolinha edita todo o conteúdo do site. O app de
gestão da escolinha (matrícula, chamada, mensalidade) é um app próprio no
mesmo repositório e no mesmo Firebase — desenho em [docs/gestao.md](docs/gestao.md).

Stack: **padrão OnTrac** — Vite + React + TypeScript + Firebase (Auth,
Firestore, Storage, Hosting). O site público continua HTML/CSS/JS puro e lê o
conteúdo do Firestore.

```
site/            ← site público (www.patotina.com.br), sem build
  js/conteudo.js ← lê o Firestore e troca o miolo das seções
app/             ← painel do site (/app): Vite + React + TS, padrão OnTrac
  src/app/       ← rotas e layout do painel
  src/modules/   ← site (conteúdo)
gestao/          ← app de gestão (app.patotina.com.br): segundo app Vite, PWA
  src/app/       ← rotas, layout (sidebar + barra inferior)
  src/modules/   ← inicio (e os módulos de docs/gestao.md conforme entram)
shared/          ← o que os dois apps usam: auth (login, papéis), contas,
                   firebase, componentes de UI, tema (estilos/tema.css)
scripts/         ← seed do conteúdo, criação de acesso, montagem do dist/
firestore.rules  ← quem lê e escreve o quê
storage.rules    ← logos dos parceiros
firebase.json    ← Hosting (site "patotina": raiz + /app; site "patotina-gestao") e emuladores
docs/gestao.md   ← desenho do app de gestão (gestao/, app.patotina.com.br)
PAINEL.md        ← manual do painel, escrito para a escolinha
DEPLOY.md        ← como criar o projeto Firebase e publicar
```

## Rodar na sua máquina

Precisa de Node 20+ e Java 21+ (para os emuladores; `JAVA_HOME` apontando
para ele basta).

```bash
npm install
npm run emulators          # Auth, Firestore, Storage e Hosting locais (UI em http://localhost:4000)
npm run seed -- --emulador # grava o conteúdo atual do site no Firestore local
npm run criar-acesso -- --emulador --nome "Seu Nome" --email voce@exemplo.com --senha "SenhaForte123" --papel master
npm run dev                # site em http://localhost:5173/ e painel em http://localhost:5173/app/
npm run dev:gestao         # app de gestão em http://localhost:5174/
```

`--papel` aceita `master`, `editor`, `gestor` e `professor`; a conta é a
mesma nos dois apps, o papel diz em qual ela entra.

Os dados dos emuladores ficam em `.emulator-data` (não versionado) e
sobrevivem a reinícios.

## Publicar

`npm run build` monta `dist/` (site + painel) e `dist-gestao/` (app de
gestão); `firebase deploy` publica os dois sites.
O passo a passo — criar o projeto, Blaze, regras, primeiro acesso, domínio —
está em [DEPLOY.md](DEPLOY.md).

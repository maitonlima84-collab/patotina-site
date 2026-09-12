# Patotina — site da escolinha + painel

Site do **Patotina Esporte Clube** (Matutina/MG), com foco na Escolinha de
Futebol, e o painel em que a escolinha edita todo o conteúdo do site. É a base
do app de gestão da escolinha (matrícula, mensalidade, presença), que entra
como módulos neste mesmo projeto.

Stack: **padrão OnTrac** — Vite + React + TypeScript + Firebase (Auth,
Firestore, Storage, Hosting). O site público continua HTML/CSS/JS puro e lê o
conteúdo do Firestore.

```
site/            ← site público (www.patotina.com.br), sem build
  js/conteudo.js ← lê o Firestore e troca o miolo das seções
app/             ← painel (/app): Vite + React + TS, padrão OnTrac
  src/app/       ← providers (Auth), rotas, layout, login
  src/modules/   ← site (conteúdo) e contas (quem entra)
  src/shared/    ← firebase, componentes de UI, utilidades
scripts/         ← seed do conteúdo, criação de acesso, montagem do dist/
firestore.rules  ← quem lê e escreve o quê
storage.rules    ← logos dos parceiros
firebase.json    ← Hosting (site na raiz, painel em /app) e emuladores
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
```

Os dados dos emuladores ficam em `.emulator-data` (não versionado) e
sobrevivem a reinícios.

## Publicar

`npm run build` monta `dist/` (site + painel) e `firebase deploy` publica.
O passo a passo — criar o projeto, Blaze, regras, primeiro acesso, domínio —
está em [DEPLOY.md](DEPLOY.md).

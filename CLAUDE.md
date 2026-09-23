# Patotina — notas para quem mexe no código

Site + painel da Escolinha de Futebol Patotina (Matutina/MG), base do futuro
app de gestão da escolinha. Leia o README para a estrutura e o DEPLOY.md para
publicar.

## Decisões que não se reabrem sem motivo

- **Stack: padrão OnTrac (Vite + React + TS + Firebase)**, decidida em
  11/09/2026 porque o produto principal é o app de gestão, não o site. O Bluec
  (`C:\Dev\BluecFC`) usa Cloudflare Worker + D1 — serve de referência de UX do
  painel, não de arquitetura.
- O site público é **HTML/CSS/JS puro** em `site/` e lê o Firestore no
  navegador (`site/js/conteudo.js`). O HTML traz o conteúdo inicial escrito, e
  é o que o visitante vê se o banco não responder — nunca uma página vazia.
- **Painel mora no endereço da gestão**: `app.patotina.com.br/painel/`
  (build em `dist-gestao/painel/`), decidido em 23/09/2026 — o Firebase
  guarda a sessão por endereço, e com o painel em www quem trocava de app
  tinha de entrar de novo. `www.patotina.com.br/app` e `/admin`
  redirecionam. Links entre os dois apps abrem na mesma aba (no app
  instalado do iPhone, aba nova = Safari, sem sessão). O SW da gestão não
  responde por `/painel` (`navigateFallbackDenylist`).
- **O painel é só do site.** A gestão da escolinha é um app próprio,
  decidido em 12/09/2026: pasta `gestao/`, mesmo projeto Firebase (uma conta,
  mesmos `usuarios`/papéis), publicado como segundo site do Hosting em
  app.patotina.com.br, Web/PWA. O desenho completo (módulos, telas, modelo
  de dados, regras, fases) está em `docs/gestao.md` — ler antes de criar
  qualquer módulo de gestão.
- Papéis em `usuarios/{uid}.papeis` (lista): `Master` cuida das contas e
  passa em tudo, `Editor` edita o site, `Gestor` administra a escolinha,
  `Professor` faz chamada. Master é gravado com `Editor` e `Gestor` junto.
  As regras do Firestore são a autoridade; o `RequireRole`/`AuthGate` da
  tela só esconde. Uma conta, dois apps: o `AuthGate` de cada um diz quem
  entra (`isEditor` no painel, `isProfessor` na gestão).
- **Venda para outras escolinhas é low cost** (R$ 39/mês gestão, R$ 59
  site + gestão), um projeto Firebase por escolinha, sem prometer cobrança
  automática. Decidido em 12/09/2026; raciocínio em `docs/comercial.md`.

## Convenções

- Português em nomes, comentários e mensagens (como no OnTrac). Comentário
  explica o *porquê*, não o *o quê*.
- Camadas por módulo: `pages → hooks → services → repositories`. Tela não fala
  com o Firestore; repositório não decide regra de negócio.
- `shared/` (raiz) é o que painel e gestão têm em comum: auth, contas,
  firebase, UI, tema. Importa-se como `@shared/...`; `@/` é o `src` do app
  em questão. `shared/` nunca importa de `app/` nem de `gestao/`.
- Coleções do site têm prefixo `site_` e todo item tem `visivel` (boolean) —
  a regra de leitura pública depende disso. Listas ordenáveis têm `ordem`
  (múltiplos de 10).
- Acrescentar um campo a uma seção = `modules/site/colecoes.ts` (campo +
  validação) + `types.ts` + `site/js/conteudo.js` (como o site mostra) +
  `scripts/seed-site.mts` (valor inicial).
- Coleções da gestão (sem prefixo, nunca públicas, salvo `eventos` com
  `visivelNoSite` e a criação de `pre_matriculas` pelo site): `alunos`
  (+`historico`), `turmas`, `chamadas` (`turmaId_data`), `cobrancas`
  (`alunoId_AAAA-MM`), `pre_matriculas`, `eventos`, `avisos`,
  `configuracoes/escolinha`, `responsaveis`. Ids compostos são a garantia
  de idempotência (chamada e cobrança nunca duplicam). Nada de gestão se
  apaga: situação/cancelamento é o caminho, e o histórico do aluno só cresce.
- Módulo novo na gestão: `gestao/src/modules/<nome>/` com `routes.tsx`, entra
  em `router.tsx` e em `abas.ts`; regra no `firestore.rules`; se o
  responsável precisa ler, liberar por `ehResponsavelDe`/`ehResponsavel`.
- Convenções de texto do conteúdo: `|` marca a parte dourada de um título;
  `*asteriscos*` viram negrito; selo do topo começando com `*` é dourado;
  treinos são `DIA | HORÁRIO | LOCAL`, um por linha.

## Rodar

`npm run emulators` (Java 21 via `JAVA_HOME`), `npm run seed -- --emulador`,
`npm run criar-acesso -- --emulador ...`, `npm run dev` (site em 5173, e
o Vite do painel) e `npm run dev:gestao` (gestão em 5174; o painel se usa
por `localhost:5174/painel/`, que repassa à 5173 e divide o login).
`npm run seed:gestao -- --emulador` cria as contas de teste e dados de demonstração da gestão (turmas, alunos,
chamadas, cobranças, agenda…). Contas de teste locais, senha
`patotina123`, só em `.emulator-data`: `maiton@patotina.dev` (master),
`lucas@patotina.dev` (editor), `gestora@patotina.dev` (gestor),
`professor@patotina.dev` (professor), `familia@patotina.dev` (família).

O guia visual da gestão (`gestao/public/ajuda/`, servido em `/ajuda/`) é
gerado: `npm run ajuda:capturar` tira as screenshots com o Chrome da máquina
e grava a posição dos elementos apontados em `cenas.json`. Mudou uma tela
da gestão, rode de novo (cenas em `scripts/capturar-ajuda.mts`, texto em
`public/ajuda/index.html`).

O emulador de Hosting no Windows não aplica redirects/headers (bug do
`glob-slasher`); em produção funcionam.

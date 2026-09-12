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
- Um Hosting só: site na raiz, painel em `/app`, `/admin` redireciona.
- Papéis em `usuarios/{uid}.papeis` (lista): `Master` cuida das contas,
  `Editor` edita conteúdo; Master sempre tem `Editor` junto. As regras do
  Firestore são a autoridade; o `RequireRole` da tela só esconde.

## Convenções

- Português em nomes, comentários e mensagens (como no OnTrac). Comentário
  explica o *porquê*, não o *o quê*.
- Camadas por módulo: `pages → hooks → services → repositories`. Tela não fala
  com o Firestore; repositório não decide regra de negócio.
- Coleções do site têm prefixo `site_` e todo item tem `visivel` (boolean) —
  a regra de leitura pública depende disso. Listas ordenáveis têm `ordem`
  (múltiplos de 10).
- Acrescentar um campo a uma seção = `modules/site/colecoes.ts` (campo +
  validação) + `types.ts` + `site/js/conteudo.js` (como o site mostra) +
  `scripts/seed-site.mts` (valor inicial).
- Convenções de texto do conteúdo: `|` marca a parte dourada de um título;
  `*asteriscos*` viram negrito; selo do topo começando com `*` é dourado;
  treinos são `DIA | HORÁRIO | LOCAL`, um por linha.

## Rodar

`npm run emulators` (Java 21 via `JAVA_HOME`), `npm run seed -- --emulador`,
`npm run criar-acesso -- --emulador ...`, `npm run dev`. Contas de teste
locais: `maiton@patotina.dev` (master) e `lucas@patotina.dev` (editor), senha
`patotina123` — só existem em `.emulator-data`.

O emulador de Hosting no Windows não aplica redirects/headers (bug do
`glob-slasher`); em produção funcionam.

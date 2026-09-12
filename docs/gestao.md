# App de gestão da escolinha — desenho

Decidido em 12/09/2026. O painel em `/app` continua sendo **só do site**. A
gestão da escolinha é um **app próprio**: pasta `gestao/` neste repositório,
mesmo projeto Firebase (Auth, Firestore, Storage), publicado como segundo site
do Hosting em **app.patotina.com.br**. Web/PWA instalável — abre no navegador
e vira ícone no celular; funciona offline para a chamada.

Este documento é o mapa: o que o app faz, para quem, com que dados. Cada
módulo ganha o próprio `docs/gestao/<modulo>.md` quando começar a ser feito.

---

## 1. Para quem

| Papel | O que faz | Onde |
|---|---|---|
| **Master** | tudo, em qualquer app; cuida das contas | já existe |
| **Editor** | conteúdo do site | já existe, só no painel do site |
| **Gestor** | alunos, turmas, matrículas, mensalidades, agenda, avisos, configurações | novo |
| **Professor** | chamada e lista de alunos das turmas dele; não vê financeiro | novo |
| **Responsável** | vê o próprio filho: presença, mensalidades, avisos, agenda | fase 5, área própria |

Regras do OnTrac que valem aqui: **Master acessa tudo**; a regra do Firestore
é a autoridade, a tela só esconde. Os papéis moram em `usuarios/{uid}.papeis`
(a mesma coleção do painel do site — uma conta, dois apps).

Realidade assumida: escolinha de cidade pequena — dezenas a poucas centenas
de alunos, 1–3 professores, cobrança por Pix/dinheiro, comunicação por
WhatsApp. O desenho evita infraestrutura que essa escala não pede (sem Cloud
Functions na v1, sem gateway de pagamento, sem busca externa).

---

## 2. Módulos e telas

### 2.1 Início
Uma tela: alunos ativos (por turma), pré-matrículas novas, mensalidades em
aberto e atrasadas, presença da semana, próximos eventos, **aniversariantes do
mês**, alunos com 3 faltas seguidas. Cada número é link para a lista filtrada.
Professor vê só a parte dele (turmas, chamada de hoje, aniversariantes).

### 2.2 Alunos
- **Lista**: busca por nome ou responsável; filtro por turma e situação
  (`pre_matricula`, `ativo`, `trancado`, `desligado`). A lista é pequena:
  carrega todos os não-desligados e filtra no navegador.
- **Ficha** em abas:
  - *Dados*: nome, apelido, nascimento, foto, escola, endereço, uniforme
    (tamanho de camisa/calção).
  - *Responsáveis*: 1..n — nome, parentesco, telefone (vira botão WhatsApp),
    CPF (opcional), quem é o principal e quem paga.
  - *Saúde*: alergias, medicamentos, restrições, plano de saúde, contato de
    emergência. É o que o professor precisa ver no campo.
  - *Autorizações*: uso de imagem (site/Instagram), transporte para jogos,
    quem pode buscar a criança.
  - *Turma e histórico*: turma atual + linha do tempo automática (entrou,
    mudou de turma, trancou, voltou, saiu — data e quem fez).
  - *Presença*: frequência por mês, faltas recentes.
  - *Financeiro*: plano (valor, vencimento, desconto, isenção) e cobranças.
    Escondido do Professor.
- **Matrícula** = fluxo em passos: dados → responsável → turma → plano.
  Cria o aluno com situação `ativo` e o primeiro registro do histórico.
- **Importação** por CSV na primeira carga (a lista de hoje, seja planilha
  ou caderno digitado).

### 2.3 Turmas
Turma real, diferente do card do site: nome, professor (uid), horários
estruturados (`dia`, `inicio`, `fim`, `local`), capacidade, faixa etária,
temporada, ativa. Tela mostra os alunos da turma, vagas e o próximo treino.

`site_turmas` continua sendo o card de vitrine; a turma de gestão pode
apontar para ele (`cardSiteId`) para o painel do site mostrar "X alunos" um
dia. Unificar exporia dados de gestão na leitura pública e amarraria o site
à estrutura interna — não vale.

### 2.4 Chamada
Tela de celular do professor. Abre na turma cujo horário é hoje, lista os
alunos ativos com foto; toque alterna **presente → falta → justificada**.
Um documento por treino (`chamadas/{turmaId}_{AAAA-MM-DD}`): barato, e o
Firestore offline segura sem sinal no campo.

Frequência por aluno e por turma no mês, calculada no navegador a partir das
chamadas do período (~100 docs/turma/ano, cabe). Alerta de 3 faltas seguidas
no Início — é o momento de ligar para o responsável antes de perder o aluno.

### 2.5 Mensalidades
- **Valor por aluno.** O valor varia conforme a situação da família, então a
  fonte é o plano de cada aluno: `valor`, `vencimentoDia`, `desconto` com
  `motivo` obrigatório (irmão, bolsa, acordo…), `isento`. A matrícula sugere
  o valor da turma (`turmas.mensalidade`) ou o padrão de Configurações; quem
  matricula ajusta. Nenhuma regra de desconto é automática na v1 — o motivo
  escrito é o que preserva a história quando a condição mudar.
- **Gerar cobranças do mês**: botão do Gestor, idempotente (id
  `{alunoId}_{AAAA-MM}`), a partir do plano de cada aluno ativo. Sem função
  agendada na v1 — o botão é transparente para quem usa e não dá surpresa.
- Lista por competência com situação `aberta`, `paga`, `atrasada` (aberta e
  vencida — calculada, não gravada), `isenta`, `cancelada`.
- **Registrar pagamento**: data, forma (`pix`, `dinheiro`, `transferencia`),
  valor, observação; recibo numerado (`configuracoes.proximoRecibo`).
- **Inadimplência**: quem deve, quanto, há quantos meses; botão que abre o
  WhatsApp com o lembrete pronto (texto em Configurações).
- v2: QR Pix estático por cobrança (chave em Configurações), sem gateway.

### 2.6 Pré-matrículas
Hoje o formulário do site só monta a mensagem do WhatsApp. Passa a fazer os
dois: **grava** em `pre_matriculas` e abre o WhatsApp. Se o banco falhar, o
WhatsApp abre do mesmo jeito — o visitante nunca perde o contato.

No app: caixa de entrada com situação `nova → em_contato → matriculada |
recusada`, e "converter em aluno" que abre a matrícula já preenchida.

### 2.7 Agenda
Eventos: `jogo`, `festival`, `viagem`, `reuniao`, `sem_treino` (feriado,
chuva). Por turma, com data/hora/local, convocados (lista de alunos) e
checklist de autorização de viagem. Marcar `visivelNoSite` publica em
"próximos eventos" (o site ganha essa seção quando o módulo existir).

### 2.8 Avisos
Sem app dos pais, aviso = WhatsApp. A tela filtra (turma, inadimplentes,
convocados de um evento) e entrega a lista de telefones + mensagem pronta
para lista de transmissão. Guarda o aviso enviado (`avisos`) para quando a
área do responsável existir mostrá-lo lá também.

### 2.9 Configurações
Nome e dados da escolinha, temporada/ano letivo, mensalidade padrão, dia de
vencimento, chave Pix, locais de treino, textos padrão dos WhatsApps
(lembrete de mensalidade, convocação), próximo número de recibo.

### 2.10 Área do responsável (fase 5)
Login por link no e-mail ou por telefone (SMS custa; decidir na hora). Vê os
filhos vinculados: presença, mensalidades com Pix, avisos, agenda; atualiza
telefone e endereço. `responsaveis/{uid}` liga a conta aos `alunoIds`.

### Mais tarde, se houver dor
Avaliação de desenvolvimento (observações do professor, medidas, avaliação
periódica), pedidos de uniforme, caixa geral (entradas/saídas além da
mensalidade), Cloud Function para gerar cobranças e lembretes sozinha.

---

## 3. Navegação

Sidebar em grupos no computador; no celular, barra inferior com **Início,
Alunos, Chamada, Mensalidades** e um "mais" com o resto.

- **Escolinha**: Início · Alunos · Turmas · Chamada · Mensalidades ·
  Pré-matrículas · Agenda · Avisos
- **Administração**: Configurações · Contas (Master) · Site ↗ (link para
  `/app` de www.patotina.com.br)

Professor vê Início, Alunos (só das turmas dele, sem aba Financeiro) e
Chamada. Ordem das abas em `gestao/src/app/routes/abas.ts`, como no painel.

---

## 4. Modelo de dados (Firestore)

Coleções novas, sem prefixo `site_` (nada disso é público). `criadoEm`,
`atualizadoEm`, `criadoPor` em todas.

```
alunos/{id}
  nome, apelido?, nascimento (AAAA-MM-DD), foto?, sexo?
  situacao: 'pre_matricula' | 'ativo' | 'trancado' | 'desligado'
  turmaId?, entrouEm?, saiuEm?
  escola?, endereco?: { rua, numero, bairro, cidade }
  uniforme?: { camisa, calcao }
  responsaveis: [{ nome, parentesco, telefone, cpf?, principal: bool, pagador: bool }]
  saude: { alergias?, medicamentos?, restricoes?, plano?, emergencia?: { nome, telefone } }
  autorizacoes: { imagem: bool, transporte: bool, buscam?: string }
  plano: { valor, vencimentoDia, desconto?: { valor, motivo }, isento: bool, motivoIsencao? }
  observacoes?
  nomeBusca: string   // nome + responsáveis, minúsculo, sem acento — filtro no navegador
alunos/{id}/historico/{id}
  tipo: 'matricula' | 'mudanca_turma' | 'trancamento' | 'retorno' | 'desligamento' | 'observacao'
  data, de?, para?, texto?, por (uid)

turmas/{id}
  nome, professorUid?, horarios: [{ dia: 0..6, inicio: 'HH:mm', fim: 'HH:mm', local }]
  capacidade?, idadeMin?, idadeMax?, mensalidade?, temporada, ativa: bool, cardSiteId?

chamadas/{turmaId}_{AAAA-MM-DD}
  turmaId, data, registradoPor, observacao?
  presencas: { [alunoId]: 'P' | 'F' | 'J' }

cobrancas/{alunoId}_{AAAA-MM}
  alunoId, competencia: 'AAAA-MM', valor, desconto, vencimento (AAAA-MM-DD)
  situacao: 'aberta' | 'paga' | 'isenta' | 'cancelada'
  pagamento?: { em, forma: 'pix' | 'dinheiro' | 'transferencia', valor, recibo, por }
  observacao?

pre_matriculas/{id}
  crianca, idade, turmaSugerida?, responsavel, telefone?, observacao?
  situacao: 'nova' | 'em_contato' | 'matriculada' | 'recusada'
  alunoId?   // preenchido ao converter
  origem: 'site'

eventos/{id}
  tipo, titulo, data, hora?, local?, descricao?
  turmaIds: [], convocados: [alunoId], autorizacoes?: { [alunoId]: bool }
  visivelNoSite: bool

avisos/{id}
  titulo, texto, destinatarios: { turmaIds?, alunoIds? }, enviadoEm, por

configuracoes/escolinha
  nome, temporada, mensalidadePadrao, vencimentoDia, chavePix?, locais: []
  textos: { lembreteMensalidade, convocacao }, proximoRecibo

usuarios/{uid}.papeis  += 'Gestor' | 'Professor'
responsaveis/{uid}     (fase 5) alunoIds: []
```

Sem agregados incrementais na v1: tudo que é contagem (frequência, em
aberto, alunos por turma) se calcula no navegador a partir das listas, que
são pequenas. Se um dia pesar, entra agregado com o par soma/subtração
fechado (lição do OnTrac).

---

## 5. Regras do Firestore (esboço)

```
isGestor()    = isMaster() || temPapel('Gestor')
isProfessor() = isGestor() || temPapel('Professor')

alunos              read: isProfessor()   write: isGestor()
alunos/*/historico  read: isProfessor()   create: isGestor()   update/delete: false
turmas              read: isProfessor()   write: isGestor()
chamadas            read: isProfessor()   write: isProfessor() (turmaId, data e presencas válidos)
cobrancas           read/write: isGestor()
pre_matriculas      create: público, só com os campos do formulário e situacao == 'nova'
                    read/update: isGestor()   delete: false
eventos             read: isProfessor() || resource.data.visivelNoSite == true   write: isGestor()
avisos              read: isProfessor()   write: isGestor()
configuracoes       read: isProfessor()   write: isGestor()
```

O Professor lê todos os alunos (o Firestore não filtra campos): o app
esconde o financeiro, mas os dados de saúde ele precisa ver mesmo. Se isso
incomodar, `cobrancas` já está separado — o que o Professor nunca alcança.

---

## 6. Arquitetura

```
gestao/                 ← segundo app Vite (root), mesma stack do painel
  index.html
  public/               ← manifest.webmanifest, ícones (PWA)
  src/app/              ← providers, rotas, layout (sidebar + barra inferior), login
  src/modules/          ← inicio, alunos, turmas, chamada, mensalidades,
                           prematriculas, agenda, avisos, configuracoes
  src/shared/           ← o que é só da gestão
shared/                 ← sai de app/src/shared: firebase, ui, utils, senha,
                           imagem — os dois apps importam de '@shared/*'
```

- **Camadas por módulo** iguais ao painel: `pages → hooks → services →
  repositories`. Tela não fala com o Firestore; repositório não decide regra.
- **Build**: `vite.config.ts` (painel, `/app/`, `dist/app`) e
  `vite.gestao.config.ts` (root `gestao`, base `/`, `dist-gestao/`).
  `firebase.json` passa a ter dois sites com targets `site` e `gestao`;
  `app.patotina.com.br` aponta para o segundo. `npm run dev:gestao` na
  porta 5174.
- **PWA**: `vite-plugin-pwa` com service worker só para o shell; os dados
  ficam com a persistência offline do próprio Firestore. A chamada é o caso
  que precisa disso.
- **Login**: o mesmo `AuthProvider` do painel (conta única). Quem entra sem
  `Gestor`/`Professor`/`Master` vê "sem acesso a este app".
- **Auth com dois domínios**: `authDomain` continua o do projeto; só
  acrescentar `app.patotina.com.br` aos domínios autorizados.

---

## 7. Fases (cada uma é útil sozinha)

1. **Cadastro** — estrutura do app (`gestao/`, shared, Hosting, PWA), papéis
   Gestor/Professor, Alunos (lista, ficha, matrícula, histórico), Turmas,
   Início simples, importação CSV. *Sai do papel.*
2. **Chamada** — tela do professor, frequência, alerta de faltas.
3. **Mensalidades** — plano, gerar cobranças, pagamento, recibo, inadimplência
   com WhatsApp.
4. **Site ↔ gestão** — pré-matrícula gravando no banco e caixa de entrada;
   Agenda; Avisos; "próximos eventos" no site.
5. **Área do responsável** — login, filhos vinculados, Pix por cobrança.

Respostas de 12/09/2026 que fecharam o desenho:
- Tamanho da escolinha e origem da lista: **desconhecidos**. Por isso a fase 1
  já traz o papel Professor e a importação CSV é opcional — sem planilha,
  cadastra-se na tela.
- Mensalidade: **varia por condições da família** → valor no plano do aluno,
  desconto com motivo, sem regra automática (2.5).
- O formulário do site **pode gravar** a pré-matrícula no banco (2.6).

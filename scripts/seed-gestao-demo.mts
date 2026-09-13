// Dados de demonstração do app de gestão, só para os emuladores: contas de
// teste, turmas, alunos com histórico, chamadas das últimas semanas,
// cobranças (pagas, em aberto e atrasadas), pré-matrículas, agenda, avisos,
// configurações e uma conta de família. Serve para testar e para tirar as
// screenshots do guia (gestao/public/ajuda/) com as telas cheias.
//
//   npm run emulators
//   npm run seed:gestao -- --emulador
//
// Pode rodar de novo: os ids são fixos, então sobrescreve em vez de duplicar.
// Nunca aponta para o projeto real — os nomes são inventados.
import { conectar, temFlag } from './_admin.mts'

if (!temFlag('emulador')) {
  console.error('Este seed é só de demonstração: use --emulador.')
  process.exit(1)
}

const { auth, db } = conectar()
const agora = new Date()

// ---------- utilidades de data ----------
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const diasAtras = (n: number) => {
  const d = new Date(agora)
  d.setDate(d.getDate() - n)
  return d
}
const mesRelativo = (n: number) => {
  const d = new Date(agora.getFullYear(), agora.getMonth() + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
// Nascimento que dá a idade pedida hoje, num mês escolhido (para ter
// aniversariante no mês corrente).
const nascimento = (idade: number, mes = 3, dia = 15) => {
  let ano = agora.getFullYear() - idade
  if (mes > agora.getMonth() + 1 || (mes === agora.getMonth() + 1 && dia > agora.getDate())) ano -= 1
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}
const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// ---------- contas ----------
const PAPEIS = {
  master: ['Master', 'Editor', 'Gestor'],
  editor: ['Editor'],
  gestor: ['Gestor'],
  professor: ['Professor'],
} as const

async function conta(nome: string, email: string, papel: keyof typeof PAPEIS) {
  const existente = await auth.getUserByEmail(email).catch(() => null)
  const user = existente
    ? await auth.updateUser(existente.uid, { password: 'patotina123', disabled: false })
    : await auth.createUser({ email, password: 'patotina123', emailVerified: true, displayName: nome })
  await db.doc(`usuarios/${user.uid}`).set({ nome, email, ativo: true, papeis: [...PAPEIS[papel]], criadoEm: agora }, { merge: true })
  return user.uid
}

const uidMaiton = await conta('Maiton Lima', 'maiton@patotina.dev', 'master')
await conta('Lucas Santos', 'lucas@patotina.dev', 'editor')
const uidGestora = await conta('Ana Paula Ferreira', 'gestora@patotina.dev', 'gestor')
const uidProfessor = await conta('Lucas Henrique', 'professor@patotina.dev', 'professor')
console.log('Contas: maiton (master), lucas (editor), gestora (gestor), professor (professor) — senha patotina123')

const por = { por: uidGestora, porNome: 'Ana Paula Ferreira' }

// ---------- configurações ----------
await db.doc('configuracoes/escolinha').set(
  {
    nome: 'Escolinha de Futebol Patotina',
    temporada: String(agora.getFullYear()),
    mensalidadePadrao: 80,
    vencimentoDia: 10,
    chavePix: '34988658518',
    titularPix: 'Patotina Esporte Clube',
    locais: ['Campo do Clube', 'Quadra da Escola Municipal'],
    textos: {
      lembreteMensalidade:
        'Olá, {responsavel}! Passando para lembrar da mensalidade de {competencia} do(a) {aluno} na Escolinha Patotina: {valor}, vencimento dia {vencimento}. Pix: {pix}. Qualquer dúvida é só chamar. 💙🤍❤️',
      convocacao: 'Olá, {responsavel}! O(a) {aluno} está convocado(a) para {evento}, dia {data} às {hora}, em {local}. Confirma presença? 💙🤍❤️',
      recibo: 'Recibo nº {numero} — Escolinha Patotina\nRecebemos de {responsavel} o valor de {valor}, referente à mensalidade de {competencia} do(a) aluno(a) {aluno}.\n{data} · {forma}',
    },
    proximoRecibo: 14,
    atualizadoEm: agora,
  },
  { merge: true },
)

// ---------- turmas ----------
// A Sub-9 treina também no dia da semana de hoje, para o Início sempre ter
// "treino de hoje" e a Chamada abrir numa turma.
const hojeDia = agora.getDay()
const TURMAS = [
  {
    id: 'sub7',
    nome: 'Sub-7',
    professorUid: uidProfessor,
    horarios: [
      { dia: 2, inicio: '17:00', fim: '18:00', local: 'Campo do Clube' },
      { dia: 4, inicio: '17:00', fim: '18:00', local: 'Campo do Clube' },
    ],
    capacidade: 20,
    idadeMin: 4,
    idadeMax: 6,
    mensalidade: 70,
  },
  {
    id: 'sub9',
    nome: 'Sub-9',
    professorUid: uidProfessor,
    horarios: [
      { dia: 2, inicio: '18:00', fim: '19:00', local: 'Campo do Clube' },
      { dia: 4, inicio: '18:00', fim: '19:00', local: 'Campo do Clube' },
      ...(hojeDia !== 2 && hojeDia !== 4 ? [{ dia: hojeDia, inicio: '09:00', fim: '10:00', local: 'Campo do Clube' }] : []),
    ],
    capacidade: 20,
    idadeMin: 7,
    idadeMax: 9,
    mensalidade: 80,
  },
  {
    id: 'sub12',
    nome: 'Sub-12',
    professorUid: uidProfessor,
    horarios: [
      { dia: 3, inicio: '18:00', fim: '19:30', local: 'Campo do Clube' },
      { dia: 5, inicio: '18:00', fim: '19:30', local: 'Campo do Clube' },
    ],
    capacidade: 24,
    idadeMin: 10,
    idadeMax: 12,
    mensalidade: 90,
  },
]
for (const { id, ...t } of TURMAS) {
  await db.doc(`turmas/${id}`).set({ ...t, temporada: String(agora.getFullYear()), ativa: true, cardSiteId: '', criadoEm: agora, atualizadoEm: agora })
}

// ---------- alunos ----------
interface AlunoDemo {
  id: string
  nome: string
  apelido?: string
  nascimento: string
  sexo: 'M' | 'F'
  turmaId: string
  situacao?: 'ativo' | 'trancado' | 'desligado'
  responsavel: { nome: string; parentesco: string; telefone: string }
  valor: number
  desconto?: { valor: number; motivo: string }
  escola?: string
  saude?: Partial<{ alergias: string; medicamentos: string; restricoes: string; plano: string }>
}
const mesAtual = agora.getMonth() + 1
const ALUNOS: AlunoDemo[] = [
  { id: 'a01', nome: 'Pedro Henrique Souza', apelido: 'Pedrinho', nascimento: nascimento(8, mesAtual, Math.min(agora.getDate() + 3, 28)), sexo: 'M', turmaId: 'sub9', responsavel: { nome: 'Juliana Souza', parentesco: 'Mãe', telefone: '(34) 99911-2233' }, valor: 80, escola: 'E. M. Coronel Antônio Marques', saude: { alergias: 'Amendoim', plano: 'Unimed' } },
  { id: 'a02', nome: 'Miguel Oliveira Lima', nascimento: nascimento(7, 5, 2), sexo: 'M', turmaId: 'sub9', responsavel: { nome: 'Carlos Oliveira', parentesco: 'Pai', telefone: '(34) 99822-3344' }, valor: 80, desconto: { valor: 20, motivo: 'Irmão do Arthur' } },
  { id: 'a03', nome: 'Arthur Oliveira Lima', nascimento: nascimento(11, 8, 20), sexo: 'M', turmaId: 'sub12', responsavel: { nome: 'Carlos Oliveira', parentesco: 'Pai', telefone: '(34) 99822-3344' }, valor: 90 },
  { id: 'a04', nome: 'Laura Martins Rocha', nascimento: nascimento(9, 1, 30), sexo: 'F', turmaId: 'sub9', responsavel: { nome: 'Fernanda Rocha', parentesco: 'Mãe', telefone: '(34) 99733-4455' }, valor: 80 },
  { id: 'a05', nome: 'Davi Lucca Pereira', apelido: 'Davi', nascimento: nascimento(5, 11, 12), sexo: 'M', turmaId: 'sub7', responsavel: { nome: 'Patrícia Pereira', parentesco: 'Mãe', telefone: '(34) 99644-5566' }, valor: 70 },
  { id: 'a06', nome: 'Gabriel Almeida Costa', nascimento: nascimento(6, mesAtual, 4), sexo: 'M', turmaId: 'sub7', responsavel: { nome: 'Rodrigo Costa', parentesco: 'Pai', telefone: '(34) 99555-6677' }, valor: 70 },
  { id: 'a07', nome: 'Heitor Nunes Barbosa', nascimento: nascimento(12, 2, 8), sexo: 'M', turmaId: 'sub12', responsavel: { nome: 'Simone Nunes', parentesco: 'Mãe', telefone: '(34) 99466-7788' }, valor: 90 },
  { id: 'a08', nome: 'Isabela Freitas Dias', apelido: 'Isa', nascimento: nascimento(10, 7, 25), sexo: 'F', turmaId: 'sub12', responsavel: { nome: 'Marcos Freitas', parentesco: 'Pai', telefone: '(34) 99377-8899' }, valor: 90 },
  { id: 'a09', nome: 'Lorenzo Cardoso Silva', nascimento: nascimento(8, 4, 17), sexo: 'M', turmaId: 'sub9', responsavel: { nome: 'Renata Cardoso', parentesco: 'Mãe', telefone: '(34) 99288-9900' }, valor: 80 },
  { id: 'a10', nome: 'Bernardo Teixeira Ramos', nascimento: nascimento(5, 9, 3), sexo: 'M', turmaId: 'sub7', responsavel: { nome: 'Cláudia Teixeira', parentesco: 'Mãe', telefone: '(34) 99199-0011' }, valor: 70 },
  { id: 'a11', nome: 'Rafael Moreira Gomes', nascimento: nascimento(11, 12, 1), sexo: 'M', turmaId: 'sub12', responsavel: { nome: 'André Gomes', parentesco: 'Pai', telefone: '(34) 99100-1122' }, valor: 90 },
  { id: 'a12', nome: 'Sophia Ribeiro Castro', nascimento: nascimento(7, 6, 9), sexo: 'F', turmaId: 'sub9', responsavel: { nome: 'Camila Castro', parentesco: 'Mãe', telefone: '(34) 99011-2233' }, valor: 80 },
  { id: 'a13', nome: 'Enzo Gabriel Faria', nascimento: nascimento(6, 10, 22), sexo: 'M', turmaId: 'sub7', situacao: 'trancado', responsavel: { nome: 'Luciana Faria', parentesco: 'Mãe', telefone: '(34) 98922-3344' }, valor: 70 },
  { id: 'a14', nome: 'Théo Mendes Correia', nascimento: nascimento(9, 3, 27), sexo: 'M', turmaId: '', responsavel: { nome: 'Vanessa Mendes', parentesco: 'Mãe', telefone: '(34) 98833-4455' }, valor: 80 },
]

for (const a of ALUNOS) {
  const situacao = a.situacao ?? 'ativo'
  const responsaveis = [{ ...a.responsavel, cpf: '', principal: true, pagador: true }]
  const dados = {
    nome: a.nome,
    apelido: a.apelido ?? '',
    nascimento: a.nascimento,
    sexo: a.sexo,
    foto: { caminho: '', url: '' },
    situacao,
    turmaId: a.turmaId,
    entrouEm: iso(diasAtras(120)),
    saiuEm: '',
    escola: a.escola ?? 'E. M. Coronel Antônio Marques',
    endereco: { rua: '', numero: '', bairro: 'Centro', cidade: 'Matutina' },
    uniforme: { camisa: '', calcao: '' },
    responsaveis,
    saude: { alergias: '', medicamentos: '', restricoes: '', plano: '', ...a.saude, emergencia: { nome: a.responsavel.nome, telefone: a.responsavel.telefone } },
    autorizacoes: { imagem: true, transporte: true, buscam: '' },
    plano: { valor: a.valor, vencimentoDia: 10, desconto: a.desconto ?? { valor: 0, motivo: '' }, isento: false, motivoIsencao: '' },
    observacoes: '',
    nomeBusca: normalizar([a.nome, a.apelido ?? '', a.responsavel.nome].join(' ')),
    criadoEm: agora,
    criadoPor: uidGestora,
    atualizadoEm: agora,
  }
  const ref = db.doc(`alunos/${a.id}`)
  await ref.set(dados)
  // Histórico recomeça a cada seed, para não acumular linhas.
  const antigos = await ref.collection('historico').get()
  for (const h of antigos.docs) await h.ref.delete()
  // Mesmo formato do alunosService: `para` é o id da turma, o texto é curto.
  await ref.collection('historico').add({ tipo: 'matricula', data: iso(diasAtras(120)), de: '', para: a.turmaId, texto: 'Matrícula', ...por, criadoEm: diasAtras(120) })
  if (a.id === 'a01') {
    await ref.collection('historico').add({ tipo: 'mudanca_turma', data: iso(diasAtras(40)), de: 'sub7', para: 'sub9', texto: '', ...por, criadoEm: diasAtras(40) })
  }
  if (situacao === 'trancado') {
    await ref.collection('historico').add({ tipo: 'trancamento', data: iso(diasAtras(15)), de: 'ativo', para: 'trancado', texto: 'Viagem da família até novembro', ...por, criadoEm: diasAtras(15) })
  }
}

// ---------- chamadas (últimas 5 semanas) ----------
// Lorenzo (a09) falta nos três últimos treinos → acende "Faltando seguido".
const ativosPorTurma = (turmaId: string) => ALUNOS.filter((a) => a.turmaId === turmaId && (a.situacao ?? 'ativo') === 'ativo')
let chamadasFeitas = 0
for (let n = 35; n >= 1; n--) {
  const d = diasAtras(n)
  for (const t of TURMAS) {
    if (!t.horarios.some((h) => h.dia === d.getDay())) continue
    // Deixa um treino sem chamada, para a grade mostrar como fica.
    if (n === 8) continue
    const presencas: Record<string, 'P' | 'F' | 'J'> = {}
    for (const a of ativosPorTurma(t.id)) {
      const semente = (a.id.charCodeAt(2) * 7 + n * 3) % 10
      presencas[a.id] = semente === 0 ? 'F' : semente === 1 ? 'J' : 'P'
      if (a.id === 'a09' && n <= 12) presencas[a.id] = 'F'
    }
    await db.doc(`chamadas/${t.id}_${iso(d)}`).set({ turmaId: t.id, data: iso(d), registradoPor: uidProfessor, registradoPorNome: 'Lucas Henrique', observacao: n === 3 ? 'Treino de finalização. Campo molhado, encerramos 10 min antes.' : '', presencas, atualizadoEm: d })
    chamadasFeitas++
  }
}

// ---------- cobranças (mês passado, retrasado e atual) ----------
const antigasCobrancas = await db.collection('cobrancas').get()
for (const c of antigasCobrancas.docs) await c.ref.delete()
let recibo = 1
for (const n of [-2, -1, 0]) {
  const competencia = mesRelativo(n)
  const vencimento = `${competencia}-10`
  for (const a of ALUNOS) {
    if ((a.situacao ?? 'ativo') !== 'ativo') continue
    // Sophia (a12) fica sem cobrança no mês atual: é o que faz aparecer o
    // botão "Gerar para 1 sem cobrança".
    if (n === 0 && a.id === 'a12') continue
    const desconto = a.desconto?.valor ?? 0
    // No mês atual, metade pagou; nos anteriores, quase todos — Heitor (a07)
    // e Bernardo (a10) devem dois meses, para a inadimplência ter conteúdo.
    const devedor = a.id === 'a07' || a.id === 'a10'
    const pago = n === 0 ? !devedor && Number(a.id.slice(1)) % 2 === 0 : !devedor
    const pagamento = pago
      ? { em: `${competencia}-${String(5 + (Number(a.id.slice(1)) % 8)).padStart(2, '0')}`, forma: Number(a.id.slice(1)) % 3 === 0 ? 'dinheiro' : 'pix', valor: a.valor - desconto, recibo: recibo++, por: uidGestora, porNome: 'Ana Paula Ferreira' }
      : null
    await db.doc(`cobrancas/${a.id}_${competencia}`).set({ alunoId: a.id, alunoNome: a.nome, competencia, valor: a.valor, desconto, vencimento, situacao: pago ? 'paga' : 'aberta', pagamento, observacao: '', criadoEm: agora, criadoPor: uidGestora, atualizadoEm: agora })
  }
}

// ---------- pré-matrículas ----------
const PRES = [
  { id: 'pre1', crianca: 'Valentina Araújo', idade: 6, turmaSugerida: 'Sub-7', responsavel: 'Priscila Araújo', telefone: '(34) 98744-5566', observacao: 'Ela já treinou um ano em Patos.', situacao: 'nova', dias: 1 },
  { id: 'pre2', crianca: 'João Pedro Vieira', idade: 9, turmaSugerida: 'Sub-9', responsavel: 'Roberto Vieira', telefone: '(34) 98655-6677', observacao: '', situacao: 'nova', dias: 2 },
  { id: 'pre3', crianca: 'Nicolas Santana', idade: 11, turmaSugerida: 'Sub-12', responsavel: 'Adriana Santana', telefone: '(34) 98566-7788', observacao: 'Pode começar em outubro?', situacao: 'em_contato', dias: 6 },
]
for (const p of PRES) {
  const { id, dias, ...dados } = p
  await db.doc(`pre_matriculas/${id}`).set({ ...dados, origem: 'site', criadoEm: diasAtras(dias) })
}

// ---------- agenda ----------
const emDias = (n: number) => iso(diasAtras(-n))
const EVENTOS = [
  { id: 'ev1', tipo: 'jogo', titulo: 'Amistoso contra São Gotardo', data: emDias(6), hora: '09:00', local: 'Campo do Clube', descricao: 'Chegar 30 min antes, uniforme completo.', turmaIds: ['sub9', 'sub12'], convocados: ['a01', 'a02', 'a04', 'a09', 'a03', 'a07', 'a08'], autorizacoes: {}, visivelNoSite: true },
  { id: 'ev2', tipo: 'viagem', titulo: 'Festival em Patos de Minas', data: emDias(20), hora: '07:00', local: 'Saída do Clube', descricao: 'Ônibus fretado. Levar lanche e autorização assinada.', turmaIds: ['sub12'], convocados: ['a03', 'a07', 'a08', 'a11'], autorizacoes: { a03: true, a08: true }, visivelNoSite: false },
  { id: 'ev3', tipo: 'reuniao', titulo: 'Reunião com as famílias', data: emDias(12), hora: '19:00', local: 'Sede do Clube', descricao: 'Calendário do fim de ano e uniforme novo.', turmaIds: [], convocados: [], autorizacoes: {}, visivelNoSite: true },
  { id: 'ev4', tipo: 'sem_treino', titulo: 'Feriado — sem treino', data: emDias(30), hora: '', local: '', descricao: '', turmaIds: [], convocados: [], autorizacoes: {}, visivelNoSite: false },
]
for (const { id, ...dados } of EVENTOS) {
  await db.doc(`eventos/${id}`).set({ ...dados, criadoEm: agora, criadoPor: uidGestora, atualizadoEm: agora })
}

// ---------- avisos ----------
const AVISOS = [
  { id: 'av1', titulo: 'Amistoso no sábado', texto: 'Sábado tem amistoso contra São Gotardo às 9h no Campo do Clube. Convocados chegam 8h30 com uniforme completo. 💙🤍❤️', filtro: 'Convocados: Amistoso contra São Gotardo', quantidade: 7, enviadoEm: iso(diasAtras(1)), porNome: 'Ana Paula Ferreira' },
  { id: 'av2', titulo: 'Mensalidade de setembro', texto: 'Lembrando que a mensalidade vence dia 10. Pix no nome do Patotina Esporte Clube. Qualquer dificuldade, fale com a gente.', filtro: 'Todas as famílias', quantidade: 13, enviadoEm: iso(diasAtras(9)), porNome: 'Ana Paula Ferreira' },
]
for (const av of AVISOS) {
  const { id, ...dados } = av
  await db.doc(`avisos/${id}`).set({ ...dados, por: uidGestora, criadoEm: agora })
}

// ---------- conta de família ----------
const uidFamilia = await (async () => {
  const email = 'familia@patotina.dev'
  const existente = await auth.getUserByEmail(email).catch(() => null)
  const user = existente
    ? await auth.updateUser(existente.uid, { password: 'patotina123', disabled: false })
    : await auth.createUser({ email, password: 'patotina123', emailVerified: true, displayName: 'Carlos Oliveira' })
  await db.doc(`responsaveis/${user.uid}`).set({ nome: 'Carlos Oliveira', email, telefone: '(34) 99822-3344', alunoIds: ['a02', 'a03'], ativo: true, criadoEm: agora, criadoPor: uidGestora })
  return user.uid
})()

console.log(`Turmas: ${TURMAS.length} · Alunos: ${ALUNOS.length} · Chamadas: ${chamadasFeitas} · Cobranças: ${antigasCobrancas.size ? 'refeitas' : 'criadas'} · Pré-matrículas: ${PRES.length} · Eventos: ${EVENTOS.length} · Avisos: ${AVISOS.length}`)
console.log(`Família: familia@patotina.dev (Carlos Oliveira, pai do Miguel e do Arthur) — uid ${uidFamilia}`)
console.log(`Master: uid ${uidMaiton}`)
process.exit(0)

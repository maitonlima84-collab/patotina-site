// Grava no Firestore o conteúdo que hoje está escrito em site/index.html.
// A partir daí, quem manda nesses textos é o painel (/app).
//
//   npm run seed -- --emulador
//   npm run seed -- --projeto patotina --chave conta-de-servico.json
//
// Não sobrescreve: uma coleção que já tem algum documento é deixada em paz,
// e nos textos só entram as chaves que ainda não existem. Pode rodar de novo.
import { conectar } from './_admin.mts'

const { db } = conectar()

const TURMAS = [
  {
    nome: 'Fut Baby', faixa: '4 a 6', idadeMin: 4, idadeMax: 6,
    descricao: 'Primeiro contato com a bola. Coordenação, brincadeira e muita risada.',
    horarios: 'SEX | 18h00 – 18h50 | Campo do Clube',
    mensagem: 'Olá, Lucas! Quero informações sobre a turma Fut Baby (4 a 6 anos).',
    destaque: false,
  },
  {
    nome: 'Iniciação', faixa: '7 a 9', idadeMin: 7, idadeMax: 9,
    descricao: 'Fundamentos de verdade: passe, domínio, posição. Três treinos por semana.',
    horarios: 'SEG | 8h40 – 9h40 | Quadra da Escola Amélia Maria Franco\nSEG | 14h00 – 15h00 | Quadra da Escola Amélia Maria Franco\nSEX | 18h00 – 20h00 | Campo do Clube',
    mensagem: 'Olá, Lucas! Quero informações sobre a turma de 7 a 9 anos.',
    destaque: true,
  },
  {
    nome: 'Formação', faixa: '10+', idadeMin: 10, idadeMax: 14,
    descricao: 'De 10 a 14 anos. Tática, competição e a porta de entrada para as peneiras.',
    horarios: 'TER | 17h30 | Campo Raimundão\nSEX | 18h00 | Campo Raimundão',
    mensagem: 'Olá, Lucas! Quero informações sobre a turma de 10 anos ou mais.',
    destaque: false,
  },
]

const DESTAQUES = [
  {
    titulo: 'Aluno da escolinha é selecionado pelo Cruzeiro',
    texto: 'Aos 12 anos, *João Miguel* foi aprovado na peneira do *Cruzeiro Esporte Clube* realizada em Matutina. Talento, disciplina e vontade de evoluir a cada treino — e o primeiro passo de uma caminhada que a Família Patotina inteira acompanha.',
    citacao: 'O primeiro passo foi dado. Que venham muitos outros!',
    link: '', publicadoEm: '2026-08-04', principal: true,
  },
  {
    titulo: 'Olheiro do Cruzeiro em Matutina',
    texto: 'Um profissional do clube acompanhou de perto o desempenho, o talento e a evolução dos nossos atletas em atividade de avaliação.',
    citacao: '', link: '', publicadoEm: '2026-07-30', principal: false,
  },
  {
    titulo: '5 anos de escolinha 🎂',
    texto: 'Cinco anos de muito amor, aprendizado e momentos inesquecíveis. Obrigado a todas as famílias, crianças e profissionais.',
    citacao: '', link: '', publicadoEm: '2026-08-01', principal: false,
  },
]

const TITULOS = [
  { ano: '2026', nome: '1ª COPA PATOTINA DE FUTEBOL', descricao: 'Campeões em casa. Um verdadeiro show de raça, dedicação e espírito esportivo.', icone: '🏆', destaque: true },
  { ano: '2025', nome: 'COPA SOCCER', descricao: 'Bicampeões. O título veio de novo.', icone: '🏆', destaque: true },
  { ano: '2024', nome: 'COPA SOCCER', descricao: 'O primeiro grito de campeão da escolinha.', icone: '🏆', destaque: true },
  { ano: '2024', nome: 'LAGOA CUP', descricao: 'Vice-campeões.', icone: '🥈', destaque: false },
  { ano: '2024', nome: 'PATOS CUP', descricao: 'Vice-campeões.', icone: '🥈', destaque: false },
]

const HISTORIA = [
  { ano: '2013', titulo: 'Nasce o Patotina 💙🤍❤️', texto: 'Em 7 de setembro, a ideia de *Lucas Ferreira de Souza* vira time. O nome junta as duas cidades da turma: *Pat*os de Minas e Matu*tina*.', link: '', linkTexto: '', destaque: false },
  { ano: '2015', titulo: 'A primeira estrela ⭐', texto: 'Título do *2º Encontro de Amigos de Matutina* e do *Campeonato Municipal*. A primeira estrela sobe para o escudo.', link: '', linkTexto: '', destaque: false },
  { ano: '2020', titulo: 'Novo escudo, novas cores, Patolino 🦆', texto: 'Sem jogos na pandemia, o clube se reinventa: escudo redesenhado, uniforme novo, o mascote *Patolino* e a chegada ao Instagram.', link: '', linkTexto: '', destaque: false },
  { ano: '2021', titulo: 'Nasce a escolinha ⚽', texto: 'O clube cria a *Escolinha de Futebol Patotina*. Cinco anos depois: três turmas, cinco troféus e um aluno aprovado na peneira do Cruzeiro.', link: '', linkTexto: '', destaque: true },
  { ano: '2022', titulo: 'Campeão da Copa União 🏆 e nasce a APEC', texto: '*3×0 no BON TFC* na final em Carmo do Paranaíba (gols de Felipe, Henrique e Vinícius). No mesmo ano nasce a *Associação Patotina Esporte Clube*.', link: '', linkTexto: '', destaque: false },
  { ano: '2026', titulo: 'Estreia com vitória 🔥', texto: 'O time adulto começa mais uma temporada vencendo. "Vamos por mais 🏆"', link: 'https://www.instagram.com/patotinaoficial/', linkTexto: '@patotinaoficial ↗', destaque: false },
]

const PARCEIROS = [
  ['SICOOB |CREDITIROS', 'PARCEIRO MASTER', true],
  ['GRUPO |NUTRILEITE', 'PARCEIRO MASTER', true],
  ['PREFEITURA |DE MATUTINA', 'APOIO INSTITUCIONAL', false],
  ['CÂMARA |MUNICIPAL', 'APOIO INSTITUCIONAL', false],
  ['CLÍNICA |MARUKI PEREIRA', 'PARCEIRO 2026', false],
  ['MERCEARIA |LETÍCIA', 'PARCEIRO 2026', false],
  ['CÃES E GATOS |VET E PET STORE', 'PARCEIRO 2026', false],
  ['POSTO |LISBOA', 'PARCEIRO', false],
  ['CONSTRUNEVES', 'PARCEIRO', false],
  ['JR |MENSURE', 'PARCEIRO', false],
  ['GOLDNET |TELECOM', 'PARCEIRO', false],
  ['AGRODRONE', 'PARCEIRO', false],
  ['OLIVEIRA |CONSTRUÇÕES', 'PARCEIRO', false],
  ['PLANALTO |TINTAS', 'PARCEIRO', false],
  ['SERRALHERIA |MARTINS', 'PARCEIRO', false],
  ['VIDRONEW', 'PARCEIRO', false],
].map(([nome, rotulo, master]) => ({ nome, rotulo, master, logo: '', logoUrl: '', site: '' }))

const TEXTOS = {
  whatsapp: '34988658518',
  anosEscolinha: '5',
  heroEyebrow: '» MATUTINA · MINAS GERAIS · ESCOLINHA DESDE 2021',
  heroTag: '💙🤍❤️ Futebol, amizade e desenvolvimento para crianças de *4 a 14 anos*',
  heroChips: '🏆 Copa Soccer 2024\n🏆 Copa Soccer 2025\n🏆 1ª Copa Patotina 2026\n*⭐ Aluno aprovado na peneira do Cruzeiro',
  turmasTag: '» TREINOS SEMANAIS',
  turmasTitulo: 'TURMAS E |HORÁRIOS',
  turmasSub: 'Cada criança na turma certa para a idade dela. Chegou, treinou, fez amigo. 💙',
  turmasNota: '📍 Matutina/MG · Contato de inscrição: *(34) 98865-8518 — Lucas*',
  destaquesTag: '» DAQUI PRA FRENTE',
  destaquesTitulo: 'UM SONHO QUE COMEÇA A GANHAR |NOVOS CAMINHOS',
  titulosTag: '» SALA DE TROFÉUS DA BASE',
  titulosTitulo: 'NOSSAS |CONQUISTAS',
  professorNome: 'Lucas Eduardo',
  professorDesc: 'Licenciatura e Bacharelado em Educação Física · *CREF 046342-G/MG*. Responsável pelas três turmas e pelo contato com as famílias.',
  professorInstagram: 'https://www.instagram.com/lucas_eduardo_mgf/',
  parceirosTag: '» JUNTOS EM PROL DO ESPORTE',
  parceirosTitulo: 'NOSSOS |PARCEIROS',
}

async function semear(colecao: string, itens: Record<string, unknown>[], ordenavel = true) {
  const existentes = await db.collection(colecao).limit(1).get()
  if (!existentes.empty) {
    console.log(`${colecao}: já tem conteúdo, deixei como está.`)
    return
  }
  const lote = db.batch()
  itens.forEach((item, i) => {
    lote.set(db.collection(colecao).doc(), {
      ...item,
      ...(ordenavel ? { ordem: (i + 1) * 10 } : {}),
      visivel: true,
      atualizadoEm: new Date(),
    })
  })
  await lote.commit()
  console.log(`${colecao}: ${itens.length} itens gravados.`)
}

await semear('site_turmas', TURMAS)
await semear('site_destaques', DESTAQUES, false)
await semear('site_titulos', TITULOS)
await semear('site_historia', HISTORIA)
await semear('site_parceiros', PARCEIROS)

const ref = db.doc('site_config/textos')
const atual = (await ref.get()).data() ?? {}
const faltando = Object.fromEntries(Object.entries(TEXTOS).filter(([k]) => !(k in atual)))
if (Object.keys(faltando).length) {
  await ref.set({ ...faltando, atualizadoEm: new Date() }, { merge: true })
  console.log(`site_config/textos: ${Object.keys(faltando).length} textos gravados.`)
} else {
  console.log('site_config/textos: já completo.')
}

console.log('Pronto 💙🤍❤️')
process.exit(0)

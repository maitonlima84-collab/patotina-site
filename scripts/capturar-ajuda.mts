// Tira as screenshots do guia visual da gestão (gestao/public/ajuda/) e
// anota onde está cada elemento apontado — os marcadores numerados e as
// setas da página são desenhados a partir do cenas.json que sai daqui, então
// nunca ficam fora do lugar quando uma tela muda.
//
//   npm run emulators
//   npm run seed:gestao -- --emulador      (dados de demonstração)
//   npm run dev:gestao                     (em outro terminal)
//   npm run ajuda:capturar
//
// Usa o Chrome (ou Edge) instalado na máquina, sem baixar navegador. As
// contas são as do seed de demonstração; nada aqui fala com a nuvem.
/// <reference lib="dom" />
// (o código dentro de page.evaluate roda no navegador)
import fs from 'node:fs'
import path from 'node:path'
import puppeteer, { type Browser, type BrowserContext, type ElementHandle, type Page } from 'puppeteer-core'

const BASE = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1]! : 'http://localhost:5174'
const SAIDA = path.resolve('gestao/public/ajuda')
const IMG = path.join(SAIDA, 'img')
const SENHA = 'patotina123'

const NAVEGADORES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].filter((p): p is string => !!p && fs.existsSync(p))

const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 2 }
const CELULAR = { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

interface Caixa {
  x: number
  y: number
  w: number
  h: number
}
interface Cena {
  nome: string
  conta: 'gestora' | 'maiton' | 'familia'
  url: string
  viewport?: typeof DESKTOP | typeof CELULAR
  // Texto que precisa estar na tela antes da foto (os dados vêm do Firestore).
  esperar: string
  // Interações antes da foto: abrir um diálogo, avançar um passo…
  preparar?: (page: Page) => Promise<void>
  // Elementos apontados: nome → seletor do Puppeteer (css, ::-p-text, ::-p-aria, ::-p-xpath).
  alvos: Record<string, string>
}

// Datas usadas nas cenas: a última quinta-feira (a Sub-9 treina e já tem
// chamada feita pelo seed) e o mês atual.
const hoje = new Date()
const ultimaQuinta = (() => {
  const d = new Date(hoje)
  d.setDate(d.getDate() - 1)
  while (d.getDay() !== 4) d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

const texto = (t: string) => `::-p-text(${t})`
const aria = (t: string) => `::-p-aria(${t})`
const xpath = (x: string) => `::-p-xpath(${x})`

const CENAS: Cena[] = [
  {
    nome: 'login',
    conta: 'gestora',
    url: '/sair',
    esperar: 'Gestão',
    alvos: { email: 'input[type=email]', senha: 'input[type=password]', entrar: 'button[type=submit]', esqueci: texto('Esqueci minha senha') },
  },
  {
    nome: 'inicio',
    conta: 'gestora',
    url: '/inicio',
    esperar: 'Faltando seguido',
    alvos: {
      menu: 'aside nav',
      numeros: 'main .grid.grid-cols-2',
      treinos: xpath("//section[h3[contains(., 'Treinos de hoje')]]"),
      faltando: xpath("//section[h3[contains(., 'Faltando seguido')]]"),
      eventos: xpath("//section[h3[contains(., 'Próximos eventos')]]"),
      aniversarios: xpath("//section[h3[contains(., 'Aniversariantes')]]"),
      conta: xpath("//button[contains(., 'Minha conta')]"),
    },
  },
  {
    nome: 'alunos',
    conta: 'gestora',
    url: '/alunos',
    esperar: 'Laura Martins',
    alvos: {
      busca: 'input[placeholder*="Nome da criança"]',
      turma: aria('Turma'),
      situacao: aria('Situação'),
      matricular: 'a[href="/alunos/novo"]',
      importar: 'a[href="/alunos/importar"]',
      linha: xpath("//main//a[contains(., 'Laura Martins')]"),
    },
  },
  {
    nome: 'matricula-1',
    conta: 'gestora',
    url: '/alunos/novo',
    esperar: 'Nome completo',
    alvos: { passos: xpath("//main//nav | //main//ol"), nome: '#a-nome', nascimento: '#a-nasc', continuar: texto('Continuar'), cancelar: xpath("//main//button[contains(., 'Cancelar')]") },
  },
  {
    nome: 'matricula-4',
    conta: 'gestora',
    url: '/alunos/novo',
    esperar: 'Nome completo',
    preparar: async (page) => {
      await page.type('#a-nome', 'Valentina Araújo')
      await page.type('#a-nasc', '10032018')
      await page.click(texto('Continuar'))
      await page.type('input[name="responsaveis.0.nome"]', 'Priscila Araújo')
      await page.type('input[name="responsaveis.0.parentesco"]', 'Mãe')
      await page.type('input[name="responsaveis.0.telefone"]', '34987445566')
      await page.click(texto('Continuar'))
      await page.click(texto('Continuar'))
      await page.waitForSelector(texto('sugerida pela idade'))
      // Toca na turma sugerida: é o que preenche a mensalidade.
      await page.click(xpath("//main//button[.//*[contains(., 'sugerida pela idade')]]"))
    },
    alvos: {
      turma: xpath("//main//button[.//*[contains(., 'sugerida pela idade')]]"),
      sugerida: texto('sugerida pela idade'),
      valor: '#a-valor',
      desconto: '#a-desc',
      motivo: '#a-descMotivo',
      matricular: xpath("//main//button[normalize-space(.)='Matricular']"),
    },
  },
  {
    nome: 'ficha',
    conta: 'gestora',
    url: '/alunos/a01',
    viewport: { ...DESKTOP, height: 1000 },
    esperar: 'Responsáveis',
    alvos: {
      editar: 'a[href="/alunos/a01/editar"]',
      abas: 'nav[aria-label="Seções da ficha"]',
      ligar: aria('Ligar'),
      whatsapp: aria('WhatsApp'),
      selo: xpath("//header//span[contains(@class,'rounded-full')][1]"),
      familia: xpath("//h3[contains(., 'Acesso da família')]/ancestor::section[1]"),
    },
  },
  {
    nome: 'historico',
    conta: 'gestora',
    url: '/alunos/a01?aba=historico',
    esperar: 'Mudar de turma',
    alvos: {
      mudar: texto('Mudar de turma'),
      trancar: xpath("//main//button[normalize-space(.)='Trancar']"),
      desligar: xpath("//main//button[normalize-space(.)='Desligar']"),
      anotar: xpath("//main//button[normalize-space(.)='Anotar']"),
      linha: xpath("//main//ol | //main//ul[.//li[contains(., 'Matrícula')]]"),
    },
  },
  {
    nome: 'chamada',
    conta: 'gestora',
    url: `/chamada?turma=sub9&data=${ultimaQuinta}`,
    esperar: 'Todos presentes',
    alvos: {
      data: aria('Data'),
      turmas: xpath("//main//button[normalize-space(.)='Sub-9']/.."),
      todos: texto('Todos presentes'),
      limpar: xpath("//main//button[contains(., 'Limpar')]"),
      contagem: xpath("//main//span[contains(., 'sem marcar')]"),
      aluno: 'main ul li:first-child button',
      marca: 'main ul li:first-child button > span:last-child',
      observacao: 'main textarea',
      frequencia: 'a[href^="/chamada/frequencia"]',
    },
  },
  {
    nome: 'chamada-celular',
    conta: 'gestora',
    url: `/chamada?turma=sub9&data=${ultimaQuinta}`,
    viewport: CELULAR,
    esperar: 'Todos presentes',
    alvos: {
      aluno: 'main ul li:nth-child(2) button',
      marca: 'main ul li:nth-child(2) button > span:last-child',
      barra: 'nav.fixed',
      mais: xpath("//nav[contains(@class,'fixed')]//button[contains(., 'Mais')]"),
      menu: aria('Menu'),
    },
  },
  {
    nome: 'frequencia',
    conta: 'gestora',
    url: '/chamada/frequencia?turma=sub9',
    esperar: 'Pedrinho',
    alvos: {
      mes: xpath("//main//button[@aria-label='Mês anterior']/.."),
      grade: 'main table',
      percentual: 'main table tbody tr:first-child td:last-child',
      semChamada: xpath("(//main//th[@title='Sem chamada'])[1]"),
      turmas: aria('Turma'),
    },
  },
  {
    nome: 'mensalidades',
    conta: 'gestora',
    url: '/mensalidades',
    esperar: 'Previsto',
    alvos: {
      mes: xpath("//main//button[@aria-label='Mês anterior']/.."),
      gerar: xpath("//main//button[contains(., 'Gerar')]"),
      resumo: xpath("//main//div[contains(@class,'grid-cols-2')]"),
      filtro: aria('Filtro'),
      pagar: xpath("(//main//button[normalize-space(.)='Pagar'])[1]"),
      lembrete: xpath("(//main//a[@title='Lembrete no WhatsApp'])[1]"),
      mais: xpath("(//main//button[@aria-label='Mais'])[1]"),
      recibo: xpath("(//main//button[@aria-label='Recibo'])[1]"),
      inadimplencia: 'a[href="/mensalidades/inadimplencia"]',
    },
  },
  {
    nome: 'pagamento',
    conta: 'gestora',
    url: '/mensalidades?f=aberta',
    // Tela estreita: a janela ocupa a foto inteira e o texto fica legível.
    viewport: { ...DESKTOP, width: 720, height: 640 },
    esperar: 'Previsto',
    preparar: async (page) => {
      await page.waitForSelector(xpath("(//main//button[normalize-space(.)='Pagar'])[1]"))
      await page.click(xpath("(//main//button[normalize-space(.)='Pagar'])[1]"))
      await page.waitForSelector('dialog[open]')
    },
    alvos: {
      janela: 'dialog[open] > *',
      data: 'dialog[open] input[type=date]',
      forma: 'dialog[open] select',
      valor: 'dialog[open] input[type=number]',
      confirmar: xpath("//dialog[@open]//button[contains(., 'Confirmar') or contains(., 'Pagar') or contains(., 'Registrar')]"),
    },
  },
  {
    nome: 'inadimplencia',
    conta: 'gestora',
    url: '/mensalidades/inadimplencia',
    esperar: 'Heitor',
    alvos: {
      linha: xpath("(//main//a[contains(., 'Heitor')])[1]/ancestor::div[2]"),
      whatsapp: xpath("(//main//a[contains(@href,'wa.me')])[1]"),
      meses: xpath("(//main//ul[.//button[@title='Registrar pagamento']])[1]"),
    },
  },
  {
    nome: 'prematriculas',
    conta: 'gestora',
    url: '/pre-matriculas',
    esperar: 'Valentina',
    alvos: {
      situacao: aria('Situação'),
      whatsapp: xpath("(//main//a[contains(., 'Chamar no WhatsApp')])[1]"),
      contato: xpath("(//main//button[normalize-space(.)='Em contato'])[1]"),
      matricular: xpath("(//main//a[normalize-space(.)='Matricular'])[1]"),
      recusar: xpath("(//main//button[normalize-space(.)='Recusar'])[1]"),
    },
  },
  {
    nome: 'turmas',
    conta: 'gestora',
    url: '/turmas',
    esperar: 'Sub-12',
    alvos: {
      nova: texto('+ Nova turma'),
      card: xpath("(//main//a[contains(., 'Sub-9')])[1]"),
    },
  },
  {
    nome: 'agenda',
    conta: 'gestora',
    url: '/agenda',
    esperar: 'Amistoso',
    alvos: {
      novo: xpath("//main//button[contains(., 'Novo evento') or contains(., 'Novo')]"),
      evento: xpath("(//main//a[contains(., 'Amistoso')])[1]"),
      site: xpath("(//main//*[@aria-label='No site'])[1]"),
    },
  },
  {
    nome: 'evento',
    conta: 'gestora',
    url: '/agenda/ev1',
    viewport: { ...DESKTOP, height: 900 },
    esperar: 'Convocados',
    alvos: {
      editar: xpath("//main//button[contains(., 'Editar')]"),
      convocarTodos: texto('Convocar todos'),
      verTodos: xpath("//main//button[contains(., 'Ver todos') or contains(., 'Só convocados')]"),
      telefones: xpath("//main//button[contains(., 'Telefones')]"),
      convocado: xpath("(//main//li)[1]"),
      whatsapp: xpath("(//main//li//a[contains(@href,'wa.me')])[1]"),
    },
  },
  {
    nome: 'avisos',
    conta: 'gestora',
    url: '/avisos',
    viewport: { ...DESKTOP, height: 900 },
    esperar: 'Registrar envio',
    alvos: {
      publico: 'main select',
      assunto: '#av-titulo',
      mensagem: '#av-texto',
      copiar: xpath("//main//button[contains(., 'Copiar')]"),
      registrar: texto('Registrar envio'),
      destinatarios: xpath("//main//section[.//h3[contains(., 'família')]]"),
      whatsapp: xpath("(//main//a[@aria-label='WhatsApp'])[1]"),
    },
  },
  {
    nome: 'configuracoes',
    conta: 'gestora',
    url: '/configuracoes',
    viewport: { ...DESKTOP, height: 1100 },
    esperar: 'Chave Pix',
    alvos: {
      pix: xpath("//main//label[contains(., 'Chave Pix')]/following::input[1]"),
      vencimento: xpath("//main//label[contains(., 'vencimento')]/following::input[1]"),
      mensalidade: xpath("//main//label[contains(., 'Mensalidade padrão')]/following::input[1]"),
      locais: xpath("//main//label[contains(., 'Locais')]/following::textarea[1]"),
      textos: xpath("//main//label[contains(., 'Lembrete')]/following::textarea[1]"),
      salvar: xpath("//main//button[contains(., 'Salvar')]"),
    },
  },
  {
    nome: 'contas',
    conta: 'maiton',
    url: '/contas',
    esperar: 'Ana Paula',
    alvos: {
      nova: texto('+ Adicionar pessoa'),
      linha: xpath("(//main//*[contains(., 'Lucas Henrique')][self::li or self::a or self::div[contains(@class,'rounded')]])[last()]"),
    },
  },
  {
    nome: 'familia',
    conta: 'familia',
    url: '/familia',
    viewport: { ...CELULAR, height: 1100 },
    esperar: 'Mensalidades',
    alvos: {
      filho: xpath("//main//h2[contains(., 'Miguel')]/ancestor::section[1]/div[1]"),
      presenca: xpath("(//main//h3[contains(., 'Presença')])[1]/following-sibling::p[1]"),
      mensalidades: xpath("(//main//h3[contains(., 'Mensalidades')])[2]/following-sibling::div[1]"),
      pix: xpath("(//main//button[contains(., 'Copiar Pix')])[1]"),
      agenda: xpath("//main//h3[contains(., 'Agenda')]/parent::section"),
      avisos: xpath("//main//h3[contains(., 'Avisos')]/parent::section"),
    },
  },
]

const CONTAS = { gestora: 'gestora@patotina.dev', maiton: 'maiton@patotina.dev', familia: 'familia@patotina.dev' }

async function entrar(page: Page, conta: keyof typeof CONTAS) {
  await page.goto(`${BASE}/${conta === 'familia' ? 'familia' : ''}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('input[type=email]', { timeout: 20000 })
  await page.type('input[type=email]', CONTAS[conta])
  await page.type('input[type=password]', SENHA)
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => null), page.click('button[type=submit]')])
  await page.waitForSelector('aside, nav.fixed, main h2', { timeout: 20000 })
}

async function caixa(el: ElementHandle, viewport: { width: number; height: number }): Promise<Caixa | null> {
  const r = await el.evaluate((e) => {
    const b = (e as HTMLElement).getBoundingClientRect()
    return { x: b.left, y: b.top, w: b.width, h: b.height }
  })
  if (r.w === 0 || r.h === 0) return null
  const pct = (v: number, total: number) => Math.round((v / total) * 10000) / 100
  return { x: pct(r.x, viewport.width), y: pct(r.y, viewport.height), w: pct(r.w, viewport.width), h: pct(r.h, viewport.height) }
}

// Um contexto (cookies, IndexedDB) por conta: entrar uma vez vale para todas
// as cenas daquela conta, e trocar de conta é só trocar de contexto.
const contextos = new Map<string, BrowserContext>()
async function paginaDe(browser: Browser, conta: Cena['conta'] | 'ninguem') {
  let ctx = contextos.get(conta)
  const novo = !ctx
  if (!ctx) {
    ctx = await browser.createBrowserContext()
    contextos.set(conta, ctx)
  }
  const page = await ctx.newPage()
  if (novo && conta !== 'ninguem') await entrar(page, conta)
  return page
}

async function capturar(browser: Browser, cena: Cena) {
  const page = await paginaDe(browser, cena.url === '/sair' ? 'ninguem' : cena.conta)
  const viewport = cena.viewport ?? DESKTOP
  await page.setViewport(viewport)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

  await page.goto(`${BASE}${cena.url === '/sair' ? '/' : cena.url}`, { waitUntil: 'domcontentloaded' })

  // textContent, não innerText: o innerText já vem com o text-transform
  // (caixa alta) aplicado e o texto esperado não bate.
  await page.waitForFunction((t: string) => (document.body.textContent ?? '').includes(t), { timeout: 20000 }, cena.esperar)
  await page.evaluate(() => document.fonts.ready)
  if (cena.preparar) await cena.preparar(page)
  // Um respiro para o Firestore terminar de pintar listas e para o foco sumir.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.())
  await new Promise((r) => setTimeout(r, 600))

  const alvos: Record<string, Caixa> = {}
  for (const [nome, seletor] of Object.entries(cena.alvos)) {
    const el = await page.$(seletor).catch(() => null)
    const c = el ? await caixa(el, viewport) : null
    if (c) alvos[nome] = c
    else console.warn(`  ! ${cena.nome}: alvo "${nome}" não encontrado (${seletor})`)
  }

  const arquivo = path.join(IMG, `${cena.nome}.png`)
  await page.screenshot({ path: arquivo as `${string}.png`, type: 'png' })
  await page.close()
  console.log(`✓ ${cena.nome} (${Object.keys(alvos).length}/${Object.keys(cena.alvos).length} alvos)`)
  return { largura: viewport.width, altura: viewport.height, celular: !!('isMobile' in viewport && viewport.isMobile), alvos }
}

const so = process.argv.includes('--so') ? process.argv[process.argv.indexOf('--so') + 1]?.split(',') : null
const navegador = NAVEGADORES[0]
if (!navegador) {
  console.error('Chrome ou Edge não encontrado. Aponte com CHROME_PATH=<caminho do executável>.')
  process.exit(1)
}
fs.mkdirSync(IMG, { recursive: true })
const arquivoCenas = path.join(SAIDA, 'cenas.json')
const cenas: Record<string, Awaited<ReturnType<typeof capturar>>> = fs.existsSync(arquivoCenas) ? JSON.parse(fs.readFileSync(arquivoCenas, 'utf-8')) : {}

const browser = await puppeteer.launch({ executablePath: navegador, headless: true, args: ['--lang=pt-BR', '--force-color-profile=srgb', '--font-render-hinting=none'] })
try {
  for (const cena of CENAS) {
    if (so && !so.includes(cena.nome)) continue
    try {
      cenas[cena.nome] = await capturar(browser, cena)
    } catch (e) {
      console.error(`✗ ${cena.nome}:`, (e as Error).message)
    }
  }
} finally {
  await browser.close()
}
fs.writeFileSync(arquivoCenas, JSON.stringify(cenas, null, 2) + '\n')
console.log(`Cenas gravadas em ${path.relative(process.cwd(), arquivoCenas)}`)

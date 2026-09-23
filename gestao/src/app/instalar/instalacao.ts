import { useSyncExternalStore } from 'react'

// Pôr o app na tela inicial do celular (PWA). Os dois sistemas não se
// parecem, então são dois caminhos:
// - Android (Chrome, Edge, Samsung): o navegador avisa que dá para instalar
//   com o evento beforeinstallprompt, e o app mostra o próprio botão. O
//   evento pode chegar antes de qualquer tela montar — por isso o ouvinte
//   fica aqui, no carregamento do módulo, guardando o evento para depois.
// - iPhone: o Safari não tem evento nem botão programável; só dá para
//   ensinar o caminho pelo Compartilhar.
// Android sem o evento (Firefox, navegador de dentro do WhatsApp…) cai no
// passo a passo pelo menu ⋮.

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type Plataforma = 'android' | 'ios' | 'outra'

function detectarPlataforma(): Plataforma {
  // Em dev, ?plataforma=ios deixa ver o passo a passo do iPhone no computador.
  const forcada = import.meta.env.DEV ? new URLSearchParams(location.search).get('plataforma') : null
  if (forcada === 'android' || forcada === 'ios') return forcada
  const ua = navigator.userAgent
  // O iPad se apresenta como Mac desde o iPadOS 13; a tela de toque denuncia.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'outra'
}

export const PLATAFORMA = detectarPlataforma()

// Aberto pelo ícone da tela inicial, não há o que convidar.
const rodandoComoApp = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

interface Estado {
  evento: EventoInstalacao | null
  aberto: boolean
  instalado: boolean
}

let estado: Estado = { evento: null, aberto: false, instalado: rodandoComoApp() }
const ouvintes = new Set<() => void>()

function mudar(parte: Partial<Estado>) {
  estado = { ...estado, ...parte }
  ouvintes.forEach((ouvir) => ouvir())
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Sem isto o Chrome põe a faixa dele no rodapé, por cima da barra do app.
  e.preventDefault()
  mudar({ evento: e as EventoInstalacao })
})
window.addEventListener('appinstalled', () => mudar({ evento: null, instalado: true, aberto: false }))

// "Agora não" vale por uma semana: o professor que dispensou não precisa
// ver o convite toda vez que abre a chamada. O botão do menu continua lá.
const CHAVE_DISPENSA = 'patotina.instalar.dispensado'
const PAUSA_MS = 7 * 24 * 60 * 60 * 1000

function dispensadoHaPouco() {
  try {
    const quando = Number(localStorage.getItem(CHAVE_DISPENSA))
    return quando > 0 && Date.now() - quando < PAUSA_MS
  } catch {
    return false
  }
}

function lembrarDispensa() {
  try {
    localStorage.setItem(CHAVE_DISPENSA, String(Date.now()))
  } catch {
    // Sem armazenamento (aba anônima): o convite volta na próxima visita.
  }
}

function assinar(ouvir: () => void) {
  ouvintes.add(ouvir)
  return () => ouvintes.delete(ouvir)
}

export function useInstalacao() {
  const atual = useSyncExternalStore(assinar, () => estado)
  // Só no celular e só se ainda não é app: é o que decide se o botão aparece.
  return { ...atual, disponivel: PLATAFORMA !== 'outra' && !atual.instalado }
}

export const abrirConvite = () => mudar({ aberto: true })

export function fecharConvite() {
  lembrarDispensa()
  mudar({ aberto: false })
}

// O convite abre sozinho uma vez por visita, e a casca do app (gestão ou
// família) é quem pede — as duas montam o convite, só uma pode abrir.
let convidouNestaVisita = false

export function podeConvidarSozinho() {
  return !convidouNestaVisita && PLATAFORMA !== 'outra' && !estado.instalado && !estado.aberto && !dispensadoHaPouco()
}

export function convidarSozinho() {
  if (!podeConvidarSozinho()) return
  convidouNestaVisita = true
  abrirConvite()
}

/** Abre o diálogo do Android. Resolve `true` se a pessoa instalou. */
export async function instalar(): Promise<boolean> {
  const evento = estado.evento
  if (!evento) return false
  // A folha sai antes, para não ficar atrás do diálogo do sistema. O evento
  // só serve uma vez, mas some depois: se sumisse já, a folha trocaria o
  // botão pelo passo a passo enquanto sobe.
  mudar({ aberto: false })
  await evento.prompt()
  const { outcome } = await evento.userChoice
  mudar({ evento: null })
  if (outcome === 'dismissed') lembrarDispensa()
  return outcome === 'accepted'
}

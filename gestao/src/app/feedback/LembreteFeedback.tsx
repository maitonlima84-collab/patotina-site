import { MessageSquareText, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { abrirFeedback } from '@shared/lib/feedback'
import { jaConvidouNestaVisita } from '@/app/instalar/instalacao'

// Lembrete flutuante de feedback: aparece no máximo uma vez por semana, para
// quem já usa a gestão há uma semana (antes disso não há opinião formada). O
// item "Sugestão ou problema" do menu continua lá o tempo todo; isto só lembra
// que ele existe.
// - Espera um minuto de uso: quem abre para uma coisa rápida não é interrompido.
// - Nunca na chamada: o professor está no campo, com a turma na frente.
// - Não na mesma visita em que o convite de instalar desceu — um pedido por vez.
// A semana conta de quando o lembrete apareceu, respondido ou não.
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000
const ESPERA_MS = 60 * 1000

const chave = (uid: string, qual: 'desde' | 'mostrado') => `patotina.feedback.${qual}.${uid}`

function ler(k: string) {
  try {
    return Number(localStorage.getItem(k)) || 0
  } catch {
    return 0
  }
}

function gravar(k: string, valor: number) {
  try {
    localStorage.setItem(k, String(valor))
  } catch {
    // Sem armazenamento (aba anônima): o lembrete simplesmente não aparece.
  }
}

/** Marca o primeiro uso e diz se o lembrete desta semana já pode aparecer. */
function estaNaVez(uid: string) {
  const agora = Date.now()
  const desde = ler(chave(uid, 'desde'))
  if (!desde) {
    gravar(chave(uid, 'desde'), agora)
    return false
  }
  return agora - desde >= SEMANA_MS && agora - ler(chave(uid, 'mostrado')) >= SEMANA_MS
}

export function LembreteFeedback() {
  const { user, usuarioDoc } = useAuth()
  const uid = user?.uid
  const { pathname } = useLocation()
  const [naVez, setNaVez] = useState(false)
  const [esperou, setEsperou] = useState(false)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    // Em dev, ?lembrete=agora mostra na hora, sem esperar a semana nem o minuto.
    if (import.meta.env.DEV && new URLSearchParams(location.search).get('lembrete') === 'agora') return setVisivel(true)
    if (!uid || !estaNaVez(uid)) return
    setNaVez(true)
    const t = window.setTimeout(() => setEsperou(true), ESPERA_MS)
    return () => window.clearTimeout(t)
  }, [uid])

  const naChamada = pathname.startsWith('/chamada')
  useEffect(() => {
    if (!uid || !naVez || !esperou || naChamada || jaConvidouNestaVisita()) return
    gravar(chave(uid, 'mostrado'), Date.now())
    setNaVez(false)
    setVisivel(true)
  }, [uid, naVez, esperou, naChamada])

  if (!visivel) return null

  const abrir = () => {
    setVisivel(false)
    abrirFeedback('gestao', uid, usuarioDoc).catch((e: Error) => alert(e.message))
  }

  return (
    <div
      role="status"
      className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-gold/40 bg-navy-2 p-1 shadow-[0_8px_24px_rgba(0,0,0,.35)] transition duration-300 starting:translate-y-3 starting:opacity-0 md:right-6 md:bottom-6"
    >
      <button type="button" onClick={abrir} className="flex min-w-0 items-center gap-2.5 rounded-full py-1.5 pr-2 pl-1.5 text-left hover:bg-navy-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-navy">
          <MessageSquareText size={16} />
        </span>
        <span className="min-w-0 text-[0.88rem] leading-tight text-cream">
          Alguma sugestão para a gestão?
          <span className="block text-[0.78rem] text-gold">Contar em 1 minuto</span>
        </span>
      </button>
      <button type="button" onClick={() => setVisivel(false)} aria-label="Agora não" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray hover:bg-navy-3 hover:text-cream">
        <X size={17} />
      </button>
    </div>
  )
}

// Botão "Enviar sugestão ou problema": abre o formulário de feedback da
// Horizonte Tech (quem desenvolve o sistema). Os envios caem no painel da HT
// (horizontetech.com.br/gestao/feedbacks), não no Firestore da escolinha.
// O script só é baixado no primeiro clique — nada pesa na abertura do app.
import type { UsuarioDoc } from '@shared/auth/AuthProvider'

const ORIGEM = import.meta.env.DEV ? 'http://localhost:3000' : 'https://horizontetech.com.br'

interface HTFeedback {
  abrir: (opcoes?: { tipo?: 'problema' | 'sugestao' | 'duvida' | 'elogio' }) => void
  configurar: (c: { usuario?: { id?: string; nome?: string; email?: string; papel?: string } | null; area?: string }) => void
}

declare global {
  interface Window {
    HTFeedback?: HTFeedback
  }
}

let carregando: Promise<HTFeedback> | null = null

function carregar(): Promise<HTFeedback> {
  if (window.HTFeedback) return Promise.resolve(window.HTFeedback)
  carregando ??= new Promise<HTFeedback>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `${ORIGEM}/feedback.js`
    s.async = true
    s.dataset.produto = 'patotina'
    s.dataset.botao = 'false'
    s.dataset.tema = 'escuro'
    s.dataset.cor = '#e8b018'
    s.onload = () => (window.HTFeedback ? resolve(window.HTFeedback) : reject(new Error('feedback indisponível')))
    s.onerror = () => {
      carregando = null
      s.remove()
      reject(new Error('Sem conexão para abrir o feedback agora.'))
    }
    document.head.appendChild(s)
  })
  return carregando
}

/** Abre o formulário já identificando quem está logado. */
export async function abrirFeedback(area: 'gestao' | 'painel', uid: string | undefined, usuario: UsuarioDoc | null) {
  const fb = await carregar()
  fb.configurar({
    area,
    usuario: usuario ? { id: uid, nome: usuario.nome, email: usuario.email, papel: usuario.papeis.join(', ') } : null,
  })
  fb.abrir()
}

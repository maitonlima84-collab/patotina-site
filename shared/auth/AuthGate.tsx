import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { LoginPage, type DadosDoLogin } from '@shared/auth/LoginPage'
import { Botao } from '@shared/components/ui/Botao'

// Um único portão de entrada para o app inteiro, antes de qualquer rota de
// módulo: sem sessão mostra o login; com sessão mas sem acesso a ESTE app,
// explica em vez de deixar a tela vazia. Cada app diz o que é "ter acesso"
// (`liberado`): o painel do site aceita qualquer papel; a gestão só
// Gestor/Professor. A conta é a mesma — o que muda é a porta.
export function AuthGate({
  login,
  liberado,
  redirecionar,
  outraPorta,
  nomeDoApp,
  children,
}: {
  login: DadosDoLogin
  liberado: (auth: ReturnType<typeof useAuth>) => boolean
  // Quem entrou pela porta errada vai para a certa (família ↔ gestão) em
  // vez de ver "sem acesso".
  redirecionar?: (auth: ReturnType<typeof useAuth>) => string | null
  // Conta válida, mas do OUTRO app (professor no painel do site, editor na
  // gestão): em vez de "peça ao administrador", mostra o caminho certo.
  outraPorta?: (auth: ReturnType<typeof useAuth>) => { url: string; nome: string } | null
  nomeDoApp: string
  children: ReactNode
}) {
  const auth = useAuth()
  const { user, loading, falhaNoCadastro, signOut } = auth

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-[0.9rem] text-gray">Carregando…</div>
  }

  if (!user) return <LoginPage {...login} />

  const destino = redirecionar?.(auth)
  if (destino) return <Navigate to={destino} replace />

  if (!liberado(auth)) {
    const porta = falhaNoCadastro ? null : outraPorta?.(auth)
    if (porta) {
      return (
        <main className="grid min-h-dvh place-items-center p-6">
          <div className="w-full max-w-[420px] rounded-[20px] border border-line bg-navy-2 p-8 text-center">
            <h1 className="titulo-anton text-[1.4rem]">Sua porta é outra</h1>
            <p className="mt-3 text-[0.95rem] text-gray">
              Você entrou como {user.email}. Esta conta não mexe {nomeDoApp}, mas entra no {porta.nome} — é lá que você trabalha.
            </p>
            <Botao variante="principal" className="mt-6" onClick={() => window.location.assign(porta.url)}>
              Ir para o {porta.nome}
            </Botao>
            <button type="button" onClick={() => void signOut()} className="mt-4 block w-full text-center text-[0.85rem] text-gray hover:text-gold">
              Sair e entrar com outra conta
            </button>
          </div>
        </main>
      )
    }
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="w-full max-w-[420px] rounded-[20px] border border-line bg-navy-2 p-8 text-center">
          <h1 className="titulo-anton text-[1.4rem]">
            {falhaNoCadastro ? 'Não deu para conferir seu acesso' : 'Acesso ainda não liberado'}
          </h1>
          <p className="mt-3 text-[0.95rem] text-gray">
            {falhaNoCadastro
              ? 'Confira a internet e tente de novo em instantes.'
              : `Você entrou como ${user.email}, mas esta conta não tem acesso ${nomeDoApp}. Peça a um administrador para liberar.`}
          </p>
          <Botao className="mt-6" onClick={() => void signOut()}>
            Sair
          </Botao>
        </div>
      </main>
    )
  }

  return children
}

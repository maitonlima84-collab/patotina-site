import type { ReactNode } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoginPage } from '@/app/pages/LoginPage'
import { Botao } from '@/shared/components/ui/Botao'

// Um único portão de entrada para o painel inteiro, antes de qualquer rota de
// módulo: sem sessão mostra o login; com sessão mas sem cadastro liberado,
// explica em vez de deixar a tela vazia.
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, acessoLiberado, falhaNoCadastro, signOut } = useAuth()

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-[0.9rem] text-gray">Carregando…</div>
  }

  if (!user) return <LoginPage />

  if (!acessoLiberado) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="w-full max-w-[420px] rounded-[20px] border border-line bg-navy-2 p-8 text-center">
          <h1 className="titulo-anton text-[1.4rem]">
            {falhaNoCadastro ? 'Não deu para conferir seu acesso' : 'Acesso ainda não liberado'}
          </h1>
          <p className="mt-3 text-[0.95rem] text-gray">
            {falhaNoCadastro
              ? 'Confira a internet e tente de novo em instantes.'
              : `Você entrou como ${user.email}, mas esta conta não tem acesso ao painel. Peça a um administrador para liberar.`}
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

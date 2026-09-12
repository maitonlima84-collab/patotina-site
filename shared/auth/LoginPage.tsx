import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { auth } from '@shared/lib/firebase'
import { mensagemDeErro } from '@shared/lib/erros'
import { Botao } from '@shared/components/ui/Botao'
import { Entrada, Recado, Rotulo } from '@shared/components/ui/Campos'

// O que muda de um app para o outro na tela de entrada.
export interface DadosDoLogin {
  titulo: string
  descricao: string
}

export function LoginPage({ titulo, descricao }: DadosDoLogin) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setInfo(null)
    setOcupado(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha)
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setOcupado(false)
    }
  }

  async function esqueci() {
    setErro(null)
    setInfo(null)
    if (!email.trim()) {
      setErro('Digite seu e-mail para receber o link de nova senha.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setInfo('Enviamos um link para criar uma senha nova. Confira o e-mail (e a caixa de spam).')
    } catch (err) {
      setErro(mensagemDeErro(err))
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={entrar} className="w-full max-w-[400px] rounded-[20px] border border-line bg-navy-2 p-8">
        <img src="/img/escudo.webp" alt="" width={72} height={72} className="mx-auto mb-3" />
        <h1 className="titulo-anton text-center text-[1.7rem]">
          {titulo} <span className="text-gold">Patotina</span>
        </h1>
        <p className="mt-1 text-center text-[0.9rem] text-gray">{descricao}</p>

        <Rotulo htmlFor="email" className="mt-5">
          E-mail
        </Rotulo>
        <Entrada
          id="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          placeholder="voce@exemplo.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Rotulo htmlFor="senha" className="mt-4">
          Senha
        </Rotulo>
        <Entrada
          id="senha"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <Recado tipo="erro">{erro}</Recado>
        <Recado tipo="info">{info}</Recado>

        <Botao variante="principal" type="submit" disabled={ocupado} className="mt-6 w-full py-3.5">
          {ocupado ? 'Entrando…' : 'Entrar'}
        </Botao>
        <button type="button" onClick={esqueci} className="mt-4 w-full text-center text-[0.85rem] text-gray hover:text-gold">
          Esqueci minha senha
        </button>
      </form>
    </main>
  )
}

import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { mensagemDeErro } from '@shared/lib/erros'
import { senhaFraca } from '@shared/lib/senha'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { Dica, Entrada, Recado, Rotulo } from '@shared/components/ui/Campos'
import { Janela } from '@shared/components/ui/Janela'

export function MinhaSenhaDialog({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const { user, usuarioDoc } = useAuth()
  const avisar = useAviso()
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  function fechar() {
    setAtual('')
    setNova('')
    setErro(null)
    onFechar()
  }

  async function salvar() {
    if (!user?.email) return
    const fraca = senhaFraca(nova)
    if (fraca) return setErro(fraca)
    setOcupado(true)
    setErro(null)
    try {
      // O Firebase exige login recente para trocar senha; reautenticar com a
      // senha atual resolve isso e ainda confere que é a própria pessoa.
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, atual))
      await updatePassword(user, nova)
      fechar()
      avisar('Senha trocada.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Janela
      aberta={aberta}
      titulo="Minha senha"
      onFechar={fechar}
      rodape={
        <>
          <span className="flex-1" />
          <Botao onClick={fechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={() => void salvar()} disabled={ocupado}>
            Salvar
          </Botao>
        </>
      }
    >
      <p className="mt-4 text-[0.9rem] text-gray">
        Conectado como {usuarioDoc?.nome} ({user?.email}).
      </p>
      <Rotulo htmlFor="senha-atual" className="mt-4">
        Senha atual
      </Rotulo>
      <Entrada id="senha-atual" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} />
      <Rotulo htmlFor="senha-nova" className="mt-4">
        Nova senha
      </Rotulo>
      <Entrada id="senha-nova" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} />
      <Dica>Mínimo 8 caracteres, com letra e número.</Dica>
      <Recado>{erro}</Recado>
    </Janela>
  )
}

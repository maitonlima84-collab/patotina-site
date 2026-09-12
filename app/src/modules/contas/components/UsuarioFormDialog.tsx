import { useEffect, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useAviso } from '@/shared/components/Aviso'
import { Botao } from '@/shared/components/ui/Botao'
import { Dica, Entrada, LinhaSim, Recado, Rotulo } from '@/shared/components/ui/Campos'
import { Janela } from '@/shared/components/ui/Janela'
import { mensagemDeErro } from '@/shared/lib/erros'
import { senhaFraca } from '@/shared/lib/senha'
import type { Usuario } from '../types'
import { criarUsuario, editarUsuario } from '../repositories/usuariosRepository'

export function UsuarioFormDialog({
  item,
  aberta,
  onFechar,
  onLinkDeSenha,
}: {
  item: Usuario | null
  aberta: boolean
  onFechar: () => void
  onLinkDeSenha: (u: Usuario) => void
}) {
  const { user } = useAuth()
  const avisar = useAviso()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [master, setMaster] = useState(false)
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!aberta) return
    setNome(item?.nome ?? '')
    setEmail(item?.email ?? '')
    setSenha('')
    setMaster(item?.papeis.includes('Master') ?? false)
    setAtivo(item?.ativo ?? true)
    setErro(null)
  }, [aberta, item])

  const souEu = item !== null && item.id === user?.uid

  async function salvar() {
    setErro(null)
    const nomeLimpo = nome.trim().slice(0, 60)
    if (!nomeLimpo) return setErro('Informe o nome da pessoa.')
    // Editor edita o site; Master faz isso e ainda cuida das contas.
    const papeis = master ? ['Master', 'Editor'] : ['Editor']

    setOcupado(true)
    try {
      if (item) {
        await editarUsuario(item.id, { nome: nomeLimpo, papeis, ativo })
      } else {
        const emailLimpo = email.trim().toLowerCase()
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailLimpo)) return setErro('E-mail inválido.')
        const fraca = senhaFraca(senha)
        if (fraca) return setErro(fraca)
        await criarUsuario({ nome: nomeLimpo, email: emailLimpo, senha, papeis, ativo })
      }
      onFechar()
      avisar(item ? 'Conta atualizada.' : 'Acesso criado.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Janela
      aberta={aberta}
      titulo={item ? 'Editar pessoa' : 'Nova pessoa'}
      onFechar={onFechar}
      rodape={
        <>
          {item && (
            <Botao variante="fantasma" onClick={() => onLinkDeSenha(item)}>
              Enviar link de nova senha
            </Botao>
          )}
          <span className="flex-1" />
          <Botao onClick={onFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={() => void salvar()} disabled={ocupado}>
            Salvar
          </Botao>
        </>
      }
    >
      <div className="mt-4">
        <Rotulo htmlFor="u-nome">Nome</Rotulo>
        <Entrada id="u-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="mt-4">
        <Rotulo htmlFor="u-email">E-mail</Rotulo>
        <Entrada id="u-email" type="email" value={email} disabled={item !== null} onChange={(e) => setEmail(e.target.value)} />
        <Dica>É com ele que a pessoa entra. Não muda depois de criada a conta.</Dica>
      </div>
      {!item && (
        <div className="mt-4">
          <Rotulo htmlFor="u-senha">Senha inicial</Rotulo>
          <Entrada id="u-senha" type="text" autoComplete="off" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <Dica>Mínimo 8 caracteres, com letra e número. Passe para a pessoa; ela troca em "Minha conta".</Dica>
        </div>
      )}
      <LinhaSim id="u-master" rotulo="Pode criar e remover contas (administrador)" className="mt-5" checked={master} disabled={souEu} onChange={(e) => setMaster(e.target.checked)} />
      <LinhaSim id="u-ativo" rotulo="Acesso liberado" className="mt-4" checked={ativo} disabled={souEu} onChange={(e) => setAtivo(e.target.checked)} />
      {souEu && <Dica>Você não pode tirar o próprio acesso de administrador.</Dica>}
      <Recado>{erro}</Recado>
    </Janela>
  )
}

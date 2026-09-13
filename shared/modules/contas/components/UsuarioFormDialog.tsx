import { useEffect, useState } from 'react'
import { DESCRICAO_PAPEL, useAuth, type Papel } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { Dica, Entrada, LinhaEscolha, LinhaSim, Recado, Rotulo } from '@shared/components/ui/Campos'
import { Janela } from '@shared/components/ui/Janela'
import { mensagemDeErro } from '@shared/lib/erros'
import { senhaFraca } from '@shared/lib/senha'
import type { Usuario } from '../types'
import { criarUsuario, editarUsuario } from '../repositories/usuariosRepository'

type Nivel = 'Master' | 'Gestor' | 'Professor' | 'nenhum'

// Do maior para o menor: é a ordem em que a pessoa pensa ("quem manda mais").
const NIVEIS: [Nivel, string, string][] = [
  ['Master', 'Administrador', DESCRICAO_PAPEL.Master],
  ['Gestor', 'Gestor', DESCRICAO_PAPEL.Gestor],
  ['Professor', 'Professor', DESCRICAO_PAPEL.Professor],
  ['nenhum', 'Nenhum', 'só o site'],
]

function nivelDosPapeis(papeis: string[]): Nivel {
  if (papeis.includes('Master')) return 'Master'
  if (papeis.includes('Gestor')) return 'Gestor'
  if (papeis.includes('Professor')) return 'Professor'
  return 'nenhum'
}

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
  // Os papéis da gestão são uma escada (Master > Gestor > Professor), então
  // na tela é UMA escolha; o site é um extra que qualquer degrau pode ter.
  const [nivel, setNivel] = useState<Nivel>('nenhum')
  const [editor, setEditor] = useState(false)
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!aberta) return
    setNome(item?.nome ?? '')
    setEmail(item?.email ?? '')
    setSenha('')
    // Conta nova nasce sem nada marcado: quem cria escolhe a porta.
    setNivel(nivelDosPapeis(item?.papeis ?? []))
    setEditor(item?.papeis.includes('Editor') ?? false)
    setAtivo(item?.ativo ?? true)
    setErro(null)
  }, [aberta, item])

  const souEu = item !== null && item.id === user?.uid

  async function salvar() {
    setErro(null)
    const nomeLimpo = nome.trim().slice(0, 60)
    if (!nomeLimpo) return setErro('Informe o nome da pessoa.')
    // Master leva Editor e Gestor junto: as regras já deixam o Master passar
    // em tudo, mas gravar explícito mantém a lista legível para quem olha o
    // banco. Professor é o degrau menor — quem é Gestor não precisa dele.
    const papeis: Papel[] =
      nivel === 'Master'
        ? ['Master', 'Editor', 'Gestor']
        : ([nivel !== 'nenhum' && nivel, editor && 'Editor'].filter(Boolean) as Papel[])
    if (papeis.length === 0) return setErro('Escolha um nível na escolinha ou marque o site — senão a pessoa não entra em nada.')

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
      <Rotulo className="mt-5">Nível na escolinha</Rotulo>
      {NIVEIS.map(([valor, rotulo, descricao]) => (
        <LinhaEscolha
          key={valor}
          id={`u-nivel-${valor}`}
          name="u-nivel"
          rotulo={rotulo}
          descricao={descricao}
          className="mt-2"
          checked={nivel === valor}
          disabled={souEu}
          onChange={() => setNivel(valor)}
        />
      ))}
      {souEu && <Dica>Você não pode tirar o próprio acesso de administrador.</Dica>}

      <Rotulo className="mt-5">Site</Rotulo>
      <LinhaSim
        id="u-editor"
        rotulo={
          <>
            Edita o site <span className="text-gray">— entra no painel</span>
          </>
        }
        className="mt-2"
        checked={nivel === 'Master' || editor}
        disabled={nivel === 'Master'}
        onChange={(e) => setEditor(e.target.checked)}
      />
      {nivel === 'Master' && <Dica>Administrador sempre edita o site.</Dica>}

      <Rotulo className="mt-5">Conta</Rotulo>
      <LinhaSim
        id="u-ativo"
        rotulo={
          <>
            Ativa <span className="text-gray">— a pessoa consegue entrar</span>
          </>
        }
        className="mt-2"
        checked={ativo}
        disabled={souEu}
        onChange={(e) => setAtivo(e.target.checked)}
      />
      {!ativo && <Dica>Desligada, a conta não entra em nada, mas os papéis ficam guardados para religar.</Dica>}
      <Recado>{erro}</Recado>
    </Janela>
  )
}

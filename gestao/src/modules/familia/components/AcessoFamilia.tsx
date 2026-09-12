import { useEffect, useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { Dica, Entrada, Recado, Rotulo } from '@shared/components/ui/Campos'
import { Janela } from '@shared/components/ui/Janela'
import { mensagemDeErro } from '@shared/lib/erros'
import { senhaFraca } from '@shared/lib/senha'
import { enviarLinkDeSenha } from '@shared/modules/contas/repositories/usuariosRepository'
import type { Aluno } from '@/modules/alunos/types'
import { responsavelPrincipal } from '@/modules/alunos/services/alunosService'
import {
  ativarResponsavel,
  buscarResponsavelPorEmail,
  criarAcessoFamilia,
  desvincularAluno,
  subscribeResponsaveisDoAluno,
  vincularAluno,
  type Responsavel,
} from '../repositories/responsaveisRepository'

// Bloco da ficha (Gestor): quem da família entra na área dela. Criar é
// e-mail + senha inicial; se a família já tem conta (outro filho), só
// vincula.
export function AcessoFamilia({ aluno }: { aluno: Aluno }) {
  const { user } = useAuth()
  const avisar = useAviso()
  const [contas, setContas] = useState<Responsavel[]>([])
  const [aberta, setAberta] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [existente, setExistente] = useState<Responsavel | null | undefined>(undefined)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => subscribeResponsaveisDoAluno(aluno.id, setContas), [aluno.id])

  function abrir() {
    const r = responsavelPrincipal(aluno)
    setNome(r?.nome ?? '')
    setEmail('')
    setTelefone(r?.telefone ?? '')
    setSenha('')
    setExistente(undefined)
    setErro(null)
    setAberta(true)
  }

  async function conferirEmail() {
    const e = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return setErro('E-mail inválido.')
    setErro(null)
    setExistente(await buscarResponsavelPorEmail(e))
  }

  async function confirmar() {
    setErro(null)
    setOcupado(true)
    try {
      if (existente) {
        await vincularAluno(existente.id, aluno.id)
        avisar(`${aluno.apelido || aluno.nome} vinculado à conta de ${existente.nome}.`)
      } else {
        if (!nome.trim()) return setErro('Nome de quem vai entrar.')
        const fraca = senhaFraca(senha)
        if (fraca) return setErro(fraca)
        await criarAcessoFamilia({ nome: nome.trim(), email: email.trim().toLowerCase(), telefone: telefone.trim(), senha, alunoId: aluno.id }, user?.uid ?? '')
        avisar('Acesso da família criado. Passe o e-mail e a senha para a pessoa.')
      }
      setAberta(false)
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section className="mb-4 rounded-xl border border-line bg-navy-2 p-4 md:col-span-2">
      <div className="mb-2 flex items-center">
        <h3 className="rotulo">Acesso da família (app.patotina.com.br/familia)</h3>
        <Botao className="ml-auto px-4 py-2 text-[0.75rem]" onClick={abrir}>
          + Criar ou vincular
        </Botao>
      </div>
      {contas.length === 0 ? (
        <p className="text-[0.9rem] text-gray">Ninguém da família tem acesso ainda. Com o acesso, o responsável vê presença, mensalidades (com Pix), agenda e avisos.</p>
      ) : (
        contas.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2 py-1.5 text-[0.95rem]">
            <span className={c.ativo ? '' : 'text-gray line-through'}>
              {c.nome} <span className="text-gray">· {c.email}</span>
              {c.alunoIds.length > 1 && <span className="text-gray"> · {c.alunoIds.length} filhos</span>}
            </span>
            <span className="flex-1" />
            <Botao variante="fantasma" className="px-3 py-1.5 text-[0.7rem]" onClick={() => void enviarLinkDeSenha(c.email).then(() => avisar('Link de senha enviado.')).catch((e) => avisar(mensagemDeErro(e), true))}>
              Link de senha
            </Botao>
            <Botao variante="fantasma" className="px-3 py-1.5 text-[0.7rem]" onClick={() => void ativarResponsavel(c.id, !c.ativo).catch((e) => avisar(mensagemDeErro(e), true))}>
              {c.ativo ? 'Desligar' : 'Religar'}
            </Botao>
            <Botao variante="fantasma" className="px-3 py-1.5 text-[0.7rem]" onClick={() => confirm('Tirar este aluno da conta?') && void desvincularAluno(c.id, aluno.id).catch((e) => avisar(mensagemDeErro(e), true))}>
              Desvincular
            </Botao>
          </div>
        ))
      )}

      <Janela
        aberta={aberta}
        titulo="Acesso da família"
        onFechar={() => setAberta(false)}
        rodape={
          <>
            <span className="flex-1" />
            <Botao onClick={() => setAberta(false)}>Cancelar</Botao>
            {existente === undefined ? (
              <Botao variante="principal" onClick={() => void conferirEmail()}>
                Continuar
              </Botao>
            ) : (
              <Botao variante="principal" onClick={() => void confirmar()} disabled={ocupado}>
                {existente ? 'Vincular' : 'Criar acesso'}
              </Botao>
            )}
          </>
        }
      >
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Rotulo htmlFor="f-email">E-mail de quem vai entrar</Rotulo>
            <Entrada id="f-email" type="email" value={email} disabled={existente !== undefined} onChange={(e) => setEmail(e.target.value)} />
            <Dica>Se a família já tem conta (outro filho), o aluno é vinculado a ela.</Dica>
          </div>
          {existente && (
            <Recado tipo="info">
              Já existe a conta de <b>{existente.nome}</b> com este e-mail. Vincular {aluno.apelido || aluno.nome} a ela?
            </Recado>
          )}
          {existente === null && (
            <>
              <div>
                <Rotulo htmlFor="f-nome">Nome</Rotulo>
                <Entrada id="f-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <Rotulo htmlFor="f-tel">Telefone</Rotulo>
                <Entrada id="f-tel" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div>
                <Rotulo htmlFor="f-senha">Senha inicial</Rotulo>
                <Entrada id="f-senha" type="text" autoComplete="off" value={senha} onChange={(e) => setSenha(e.target.value)} />
                <Dica>Mínimo 8 caracteres, com letra e número. A pessoa troca depois em "Minha conta".</Dica>
              </div>
            </>
          )}
          <Recado>{erro}</Recado>
        </div>
      </Janela>
    </section>
  )
}

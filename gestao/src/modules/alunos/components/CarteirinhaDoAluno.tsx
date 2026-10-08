import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Copy, ExternalLink, IdCard, Printer, RefreshCw, TriangleAlert } from 'lucide-react'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn, dataBr } from '@shared/lib/utils'
import type { Turma } from '@/modules/turmas/types'
import type { Aluno, CarteirinhaPublica } from '../types'
import { ESTADOS, emitirCarteirinha, estadoDaCarteirinha, fimDoAno, renovarCarteirinha, urlValidacao } from '../services/carteirinhaService'
import { CartaoFrente, CartaoVerso } from './Carteirinha'

// Aba "Carteirinha" da ficha: o cartão como vai sair, frente e verso, e o
// que o Gestor faz com ele — emitir, imprimir, renovar, segunda via.
export function CarteirinhaDoAluno({
  aluno,
  turma,
  professor,
  publica,
}: {
  aluno: Aluno
  turma?: Turma
  professor?: string
  publica: CarteirinhaPublica | null
}) {
  const { isGestor } = useAuth()
  const avisar = useAviso()
  const [ocupado, setOcupado] = useState(false)
  const c = aluno.carteirinha

  const agir = async (acao: () => Promise<unknown>, ok: string) => {
    setOcupado(true)
    try {
      await acao()
      avisar(ok)
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    } finally {
      setOcupado(false)
    }
  }

  if (!c) {
    return (
      <section className="rounded-xl border border-dashed border-line p-6 text-center">
        <IdCard size={36} className="mx-auto mb-2 text-gold" />
        <p className="font-cond text-[1.15rem] font-bold tracking-wide">Carteirinha ainda não emitida</p>
        <p className="mx-auto mt-1 max-w-[46ch] text-[0.9rem] text-gray">
          Ao emitir, {aluno.nome.split(' ')[0]} ganha número de matrícula e um QR que confere a carteirinha no site. A família passa a ver a carteirinha no
          celular, e você pode imprimir.
        </p>
        {!aluno.foto?.url && <p className="mt-2 text-[0.85rem] text-gold">Dica: cadastre a foto antes — ela vai no cartão.</p>}
        {isGestor && (
          <Botao
            variante="principal"
            className="mt-4"
            disabled={ocupado}
            onClick={() => void agir(() => emitirCarteirinha(aluno, turma?.nome ?? ''), 'Carteirinha emitida.')}
          >
            <IdCard size={16} /> Emitir carteirinha
          </Botao>
        )}
      </section>
    )
  }

  const estado = estadoDaCarteirinha({ situacao: publica?.situacao ?? 'ativa', alunoSituacao: aluno.situacao, validade: c.validade })
  const valida = estado === 'valida'
  const podeRenovar = c.validade < fimDoAno()
  const dados = { aluno, carteirinha: c, turma, professor }
  const link = urlValidacao(c.codigo)

  return (
    <>
      <div
        className={cn('mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3', valida ? 'border-green/40 bg-green/10' : 'border-red-2/50 bg-red-2/10')}
      >
        {valida ? <CheckCircle2 size={22} className="text-green" /> : <TriangleAlert size={22} className="text-red-300" />}
        <div className="min-w-0 flex-1">
          <div className="font-cond text-[1.05rem] font-bold tracking-wide">{ESTADOS[estado].titulo}</div>
          <div className="text-[0.85rem] text-gray">
            Matrícula {c.matricula} · válida até {dataBr(c.validade)} · emitida em {dataBr(c.emitidaEm)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <figure className="m-0">
          <CartaoFrente dados={dados} />
          <figcaption className="rotulo mt-1.5 text-center">Frente</figcaption>
        </figure>
        <figure className="m-0">
          <CartaoVerso dados={dados} />
          <figcaption className="rotulo mt-1.5 text-center">Verso</figcaption>
        </figure>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {isGestor && (
          <Link
            to={`/imprimir/carteirinhas?ids=${aluno.id}`}
            className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-5 py-2.5 text-[0.85rem] text-navy hover:bg-gold-2"
          >
            <Printer size={16} /> Imprimir
          </Link>
        )}
        {isGestor && podeRenovar && (
          <Botao
            disabled={ocupado}
            onClick={() =>
              void agir(() => renovarCarteirinha(aluno, turma?.nome ?? ''), `Renovada até ${dataBr(fimDoAno())}. Imprima de novo para a data do cartão bater.`)
            }
          >
            <RefreshCw size={16} /> Renovar até {dataBr(fimDoAno())}
          </Botao>
        )}
        <Botao variante="fantasma" onClick={() => void navigator.clipboard?.writeText(link).then(() => avisar('Link de validação copiado.'))}>
          <Copy size={16} /> Copiar link
        </Botao>
        <a
          href={link}
          target="_blank"
          rel="noopener"
          className="cond-maiusc inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.85rem] text-gray hover:bg-navy-3 hover:text-gold"
        >
          <ExternalLink size={16} /> Ver validação
        </a>
        {isGestor && (
          <Botao
            variante="perigo"
            className="ml-auto"
            disabled={ocupado}
            onClick={() =>
              confirm('Emitir segunda via? O QR da carteirinha atual deixa de valer (aparece como "substituída"). A matrícula continua a mesma.') &&
              void agir(() => emitirCarteirinha(aluno, turma?.nome ?? ''), 'Segunda via emitida. Imprima a nova carteirinha.')
            }
          >
            Segunda via (perda)
          </Botao>
        )}
      </div>
      <p className="mt-3 text-[0.8rem] text-gray">
        A família vê a carteirinha no celular, na área da família. O QR leva ao site, que mostra só nome, foto, turma, matrícula e se ela vale.
      </p>
    </>
  )
}

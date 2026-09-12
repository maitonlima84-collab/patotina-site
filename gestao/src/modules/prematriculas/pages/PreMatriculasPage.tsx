import { MessageCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { Selecao } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn, linkWhatsApp, telefoneBonito } from '@shared/lib/utils'
import { SITUACOES_PRE, type PreMatricula, type SituacaoPre } from '../types'
import { dataDaPre, usePreMatriculas } from '../hooks/usePreMatriculas'
import { atualizarPreMatricula } from '../repositories/preMatriculasRepository'

const COR: Record<SituacaoPre, string> = {
  nova: 'bg-gold/20 text-gold',
  em_contato: 'bg-navy-3 text-cream',
  matriculada: 'bg-green/20 text-green',
  recusada: 'bg-gray/20 text-gray',
}

// A caixa de entrada do formulário do site (docs/gestao.md, §2.6): nova →
// em contato → matriculada ou recusada. "Matricular" leva para a matrícula
// já preenchida; ao salvar, esta linha vira "matriculada" sozinha.
export function PreMatriculasPage() {
  const { rows, loading, erro } = usePreMatriculas()
  const avisar = useAviso()
  const [params, setParams] = useSearchParams()
  const filtro = (params.get('situacao') ?? 'abertas') as SituacaoPre | 'abertas' | ''
  const filtradas = rows.filter((p) => (filtro === 'abertas' ? p.situacao === 'nova' || p.situacao === 'em_contato' : !filtro || p.situacao === filtro))

  async function mudar(p: PreMatricula, situacao: SituacaoPre) {
    try {
      await atualizarPreMatricula(p.id, { situacao })
      avisar('Atualizado.')
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  const mensagem = (p: PreMatricula) =>
    `Olá, ${p.responsavel.split(' ')[0]}! Aqui é da Escolinha Patotina. Recebemos a pré-matrícula do(a) ${p.crianca}${p.turmaSugerida ? ` para a turma ${p.turmaSugerida.split(' (')[0]}` : ''}. Vamos combinar a aula experimental? 💙🤍❤️`

  return (
    <>
      <PageHeader titulo="Pré-matrículas" ajuda="O que chega pelo formulário do site. Quem já falou com a família marca 'em contato'; matriculou, a linha fecha sozinha." />

      <div className="mb-4">
        <Selecao className="w-auto py-2" value={filtro} onChange={(e) => setParams(e.target.value ? { situacao: e.target.value } : {}, { replace: true })} aria-label="Situação">
          <option value="abertas">Abertas ({rows.filter((p) => p.situacao === 'nova' || p.situacao === 'em_contato').length})</option>
          {Object.entries(SITUACOES_PRE).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({rows.filter((p) => p.situacao === k).length})
            </option>
          ))}
          <option value="">Todas ({rows.length})</option>
        </Selecao>
      </div>

      {erro && <p className="mb-4 text-red-200">{erro}</p>}
      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : filtradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Nada por aqui.</p>
      ) : (
        filtradas.map((p) => (
          <div key={p.id} className={cn('mb-2 rounded-[14px] border border-line bg-navy-2 p-3', (p.situacao === 'recusada' || p.situacao === 'matriculada') && 'opacity-70')}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-cond text-[1.1rem] font-bold tracking-wide">{p.crianca}</span>
              <span className="text-gray">{p.idade ? `${p.idade} anos` : ''}</span>
              <span className={cn('cond-maiusc rounded-full px-2 py-0.5 text-[0.62rem]', COR[p.situacao])}>{SITUACOES_PRE[p.situacao]}</span>
              <span className="ml-auto text-[0.8rem] text-gray">{dataDaPre(p)}</span>
            </div>
            <div className="mt-1 text-[0.9rem] text-gray">
              {p.responsavel}
              {p.telefone && ` · ${telefoneBonito(p.telefone)}`}
              {p.turmaSugerida && ` · sugestão: ${p.turmaSugerida}`}
            </div>
            {p.observacao && <p className="mt-1 text-[0.9rem]">“{p.observacao}”</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {p.telefone && (p.situacao === 'nova' || p.situacao === 'em_contato') && (
                <a
                  href={linkWhatsApp(p.telefone, mensagem(p))}
                  target="_blank"
                  rel="noopener"
                  onClick={() => p.situacao === 'nova' && void mudar(p, 'em_contato')}
                  className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-green px-4 py-2 text-[0.75rem] text-green hover:bg-green/10"
                >
                  <MessageCircle size={15} /> Chamar no WhatsApp
                </a>
              )}
              {p.situacao === 'nova' && (
                <Botao className="px-4 py-2 text-[0.75rem]" onClick={() => void mudar(p, 'em_contato')}>
                  Em contato
                </Botao>
              )}
              {(p.situacao === 'nova' || p.situacao === 'em_contato') && (
                <>
                  <Link to={`/alunos/novo?pre=${p.id}`} className="cond-maiusc inline-flex items-center rounded-full border border-gold bg-gold px-4 py-2 text-[0.75rem] text-navy hover:bg-gold-2">
                    Matricular
                  </Link>
                  <Botao variante="fantasma" className="px-4 py-2 text-[0.75rem]" onClick={() => confirm('Marcar como recusada?') && void mudar(p, 'recusada')}>
                    Recusar
                  </Botao>
                </>
              )}
              {p.situacao === 'matriculada' && p.alunoId && (
                <Link to={`/alunos/${p.alunoId}`} className="text-[0.85rem] text-gold hover:underline">
                  Ver ficha do aluno
                </Link>
              )}
              {p.situacao === 'recusada' && (
                <Botao variante="fantasma" className="px-4 py-2 text-[0.75rem]" onClick={() => void mudar(p, 'nova')}>
                  Reabrir
                </Botao>
              )}
            </div>
          </div>
        ))
      )}
    </>
  )
}

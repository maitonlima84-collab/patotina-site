import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, IdCard, Printer } from 'lucide-react'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { Selecao } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn } from '@shared/lib/utils'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import type { Aluno, Carteirinha } from '../types'
import { useAlunos } from '../hooks/useAlunos'
import { useNomesDosProfessores } from '../hooks/useCarteirinha'
import { emitirCarteirinha } from '../services/carteirinhaService'
import { CartaoFrente, CartaoVerso, type DadosCartao } from '../components/Carteirinha'

type Modo = 'dobrar' | 'duplex' | 'pvc'

const MODOS: Record<Modo, { titulo: string; dica: string; porFolha: number; pagina: string }> = {
  dobrar: {
    titulo: 'Dobrar e plastificar (A4)',
    dica: 'Frente e verso lado a lado, 5 por folha. Recorte a tira, dobre na linha do meio e plastifique — serve em qualquer impressora.',
    porFolha: 5,
    pagina: '@page { size: A4; margin: 8mm }',
  },
  duplex: {
    titulo: 'Impressora frente e verso (A4)',
    dica: 'Uma folha de frentes, a seguinte de versos, 10 por folha. Imprima em frente e verso virando pela borda longa, depois recorte.',
    porFolha: 10,
    pagina: '@page { size: A4; margin: 8mm }',
  },
  pvc: {
    titulo: 'Impressora de cartão PVC',
    dica: 'Uma página por lado, no tamanho exato do cartão (85,6 × 54 mm). Também é o arquivo para mandar à gráfica.',
    porFolha: 1,
    pagina: '@page { size: 85.6mm 54mm; margin: 0 }',
  },
}

// Impressão das carteirinhas: de um aluno (vindo da ficha, ?ids=) ou de uma
// turma inteira. Fica fora do layout do app para a folha sair limpa — a
// barra de cima some na impressão.
export function ImprimirCarteirinhasPage() {
  const [params] = useSearchParams()
  const ids = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean), [params])
  const [turmaId, setTurmaId] = useState(params.get('turma') ?? '')
  const [modo, setModo] = useState<Modo>('dobrar')
  const [emitindo, setEmitindo] = useState<string | null>(null)
  const avisar = useAviso()
  const { rows: alunos, loading } = useAlunos()
  const { rows: turmas, porId: turmasPorId } = useTurmas()
  const professores = useNomesDosProfessores(true)

  const escolhidos = ids.length ? alunos.filter((a) => ids.includes(a.id)) : alunos.filter((a) => a.situacao === 'ativo' && (!turmaId || a.turmaId === turmaId))
  const faltam = escolhidos.filter((a) => !a.carteirinha)
  const cartoes: DadosCartao[] = escolhidos
    .filter((a): a is Aluno & { carteirinha: Carteirinha } => !!a.carteirinha)
    .map((a) => {
      const turma = turmasPorId.get(a.turmaId)
      return { aluno: a, carteirinha: a.carteirinha, turma, professor: professores.get(turma?.professorUid ?? '') }
    })

  // Um por vez: cada emissão pega o próximo número de matrícula numa
  // transação, e em fila ninguém disputa o contador.
  const emitirFaltantes = async () => {
    try {
      for (const [i, a] of faltam.entries()) {
        setEmitindo(`${i + 1} de ${faltam.length}`)
        await emitirCarteirinha(a, turmasPorId.get(a.turmaId)?.nome ?? '')
      }
      avisar(`${faltam.length} carteirinha(s) emitida(s).`)
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    } finally {
      setEmitindo(null)
    }
  }

  const m = MODOS[modo]
  const voltar = ids.length === 1 ? `/alunos/${ids[0]}?aba=carteirinha` : '/alunos'

  return (
    <div className="min-h-dvh">
      <style>{`${m.pagina}
        @media print {
          /* O app é escuro (color-scheme: dark), e o Chrome pinta a margem
             da página com essa cor — sairia uma moldura preta de tinta. */
          html { color-scheme: light !important; }
          html, body { background: #fff !important; }
          .nao-imprime { display: none !important; }
          .folhas { padding: 0 !important; gap: 0 !important; background: none !important; }
          .folha { box-shadow: none !important; margin: 0 !important; padding: 0 !important; min-height: 0 !important; }
          .folha:last-child { break-after: auto !important; }
        }`}</style>

      <header className="nao-imprime sticky top-0 z-10 border-b border-line bg-navy/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1000px] flex-wrap items-center gap-3">
          <Link to={voltar} className="inline-flex items-center gap-1 text-[0.85rem] text-gray hover:text-gold">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 className="titulo-anton text-[1.2rem]">Imprimir carteirinhas</h1>
          <span className="flex-1" />
          {!ids.length && (
            <Selecao aria-label="Turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="w-auto py-2">
              <option value="">Todas as turmas (ativos)</option>
              {turmas
                .filter((t) => t.ativa)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
            </Selecao>
          )}
          <Selecao aria-label="Jeito de imprimir" value={modo} onChange={(e) => setModo(e.target.value as Modo)} className="w-auto py-2">
            {(Object.keys(MODOS) as Modo[]).map((k) => (
              <option key={k} value={k}>
                {MODOS[k].titulo}
              </option>
            ))}
          </Selecao>
          <Botao variante="principal" disabled={!cartoes.length} onClick={() => window.print()}>
            <Printer size={16} /> Imprimir {cartoes.length > 1 && `(${cartoes.length})`}
          </Botao>
        </div>
        <div className="mx-auto mt-2 max-w-[1000px] text-[0.85rem] text-gray">
          {m.dica} Na janela de impressão, deixe a escala em 100% (ou "tamanho real") e marque "gráficos de fundo".
        </div>
        {faltam.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-[1000px] flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-[0.9rem]">
            <IdCard size={18} className="text-gold" />
            <span className="min-w-0 flex-1">
              {faltam.length} aluno(s) ainda sem carteirinha: {faltam.map((a) => a.apelido || a.nome.split(' ')[0]).join(', ')}.
            </span>
            <Botao disabled={!!emitindo} onClick={() => void emitirFaltantes()}>
              {emitindo ? `Emitindo ${emitindo}…` : `Emitir ${faltam.length === 1 ? 'a que falta' : `as ${faltam.length} que faltam`}`}
            </Botao>
          </div>
        )}
      </header>

      {loading ? (
        <p className="nao-imprime py-10 text-center text-gray">Carregando…</p>
      ) : cartoes.length === 0 ? (
        <p className="nao-imprime py-10 text-center text-gray">Nenhuma carteirinha emitida para imprimir.</p>
      ) : (
        <div className="folhas flex flex-col items-center gap-6 bg-navy-3/40 py-8">
          {modo === 'dobrar' &&
            lotes(cartoes, m.porFolha).map((lote, i) => (
              <Folha key={i} a4>
                <div className="flex flex-col items-center" style={{ gap: '2mm' }}>
                  {lote.map((d) => (
                    <div key={d.aluno.id} className="flex">
                      <Cartao>
                        <CartaoFrente dados={d} />
                      </Cartao>
                      {/* A linha da dobra: tracejada só por fora do cartão. */}
                      <div style={{ width: 0, borderLeft: '0.2mm dashed #9fb3bb' }} />
                      <Cartao>
                        <CartaoVerso dados={d} />
                      </Cartao>
                    </div>
                  ))}
                </div>
              </Folha>
            ))}

          {modo === 'duplex' &&
            lotes(cartoes, m.porFolha).flatMap((lote, i) => [
              <Folha key={`f${i}`} a4>
                <Grade>
                  {lote.map((d) => (
                    <Cartao key={d.aluno.id}>
                      <CartaoFrente dados={d} />
                    </Cartao>
                  ))}
                </Grade>
              </Folha>,
              // Virando a folha pela borda longa, a coluna da esquerda vai
              // para a direita: o verso de cada linha sai trocado de lado.
              <Folha key={`v${i}`} a4>
                <Grade>
                  {pares(lote).flatMap(([a, b]) => [
                    b ? (
                      <Cartao key={`${b.aluno.id}v`}>
                        <CartaoVerso dados={b} />
                      </Cartao>
                    ) : (
                      <div key={`${a.aluno.id}vazio`} />
                    ),
                    <Cartao key={`${a.aluno.id}v`}>
                      <CartaoVerso dados={a} />
                    </Cartao>,
                  ])}
                </Grade>
              </Folha>,
            ])}

          {modo === 'pvc' &&
            cartoes.flatMap((d) => [
              <Folha key={`${d.aluno.id}f`}>
                <Cartao>
                  <CartaoFrente dados={d} />
                </Cartao>
              </Folha>,
              <Folha key={`${d.aluno.id}v`}>
                <Cartao>
                  <CartaoVerso dados={d} />
                </Cartao>
              </Folha>,
            ])}
        </div>
      )}
    </div>
  )
}

function lotes<T>(itens: T[], tamanho: number): T[][] {
  const r: T[][] = []
  for (let i = 0; i < itens.length; i += tamanho) r.push(itens.slice(i, i + tamanho))
  return r
}

function pares<T>(itens: T[]): [T, T | undefined][] {
  const r: [T, T | undefined][] = []
  for (let i = 0; i < itens.length; i += 2) r.push([itens[i]!, itens[i + 1]])
  return r
}

// Uma folha de papel: na tela, um A4 branco (ou o cartão sozinho, no PVC);
// na impressão, uma página.
function Folha({ a4, children }: { a4?: boolean; children: ReactNode }) {
  return (
    <section
      className={cn('folha bg-white shadow-xl', a4 && 'box-border')}
      style={{ breakAfter: 'page', ...(a4 ? { width: '210mm', minHeight: '297mm', padding: '8mm' } : { width: '85.6mm', height: '54mm', overflow: 'hidden' }) }}
    >
      {children}
    </section>
  )
}

function Grade({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 85.6mm)', gap: '2mm', justifyContent: 'center' }}>{children}</div>
}

// O cartão no tamanho real, 85,6 × 54 mm.
function Cartao({ children }: { children: ReactNode }) {
  return <div style={{ width: '85.6mm', height: '54mm', flexShrink: 0 }}>{children}</div>
}

import { Copy, KeyRound, LogOut, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { MinhaSenhaDialog } from '@shared/auth/MinhaSenhaDialog'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { cn, dataBr, hojeIso, moeda } from '@shared/lib/utils'
import { Avatar } from '@/modules/alunos/components/AlunoLinha'
import { idade } from '@/modules/alunos/services/alunosService'
import { useEventos } from '@/modules/agenda/hooks/useEventos'
import { TIPOS_EVENTO } from '@/modules/agenda/types'
import { subscribeAvisos, type Aviso } from '@/modules/avisos/repositories/avisosRepository'
import { useChamadasEntre } from '@/modules/chamada/hooks/useChamada'
import { frequenciaDoAluno, nomeDoMes, primeiroDiaDoMes, somarMeses } from '@/modules/chamada/services/chamadaService'
import { useConfiguracoes } from '@/modules/configuracoes/hooks/useConfiguracoes'
import { atrasada } from '@/modules/mensalidades/services/mensalidadesService'
import { valorDevido, type Cobranca } from '@/modules/mensalidades/types'
import { descreverHorario } from '@/modules/turmas/services/turmasService'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { useCobrancasDosFilhos, useFilhos } from '../hooks/useFamilia'
import { pixCopiaECola } from '../services/pix'
import { ConviteInstalar } from '@/app/instalar/ConviteInstalar'
import { abrirConvite, useInstalacao } from '@/app/instalar/instalacao'

// A área da família (docs/gestao.md, §2.10): um filho por bloco — turma e
// treinos, presença dos últimos meses, mensalidades com Pix pronto — mais
// a agenda e os avisos da escolinha. Só leitura; o que muda é pelo WhatsApp.
export function FamiliaPage() {
  const { responsavelDoc, signOut } = useAuth()
  const avisar = useAviso()
  const alunoIds = useMemo(() => responsavelDoc?.alunoIds ?? [], [responsavelDoc])
  const filhos = useFilhos(alunoIds)
  const cobrancas = useCobrancasDosFilhos(alunoIds)
  const { porId: turmas } = useTurmas()
  const { config } = useConfiguracoes()
  const { rows: eventos } = useEventos()
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const instalacao = useInstalacao()
  useEffect(() => subscribeAvisos(setAvisos), [])

  const hoje = hojeIso()
  const de = primeiroDiaDoMes(somarMeses(hoje.slice(0, 7), -2))
  const { chamadas } = useChamadasEntre(de, hoje)
  const proximos = eventos.filter((e) => e.data >= hoje).slice(0, 6)

  const copiarPix = (c: Cobranca, aluno: { nome: string }) => {
    const codigo = pixCopiaECola({ chave: config.chavePix, nome: config.titularPix || config.nome, cidade: 'Matutina', valor: valorDevido(c), txid: `PAT${c.competencia.replace('-', '')}` })
    if (!codigo) return avisar('A escolinha ainda não cadastrou a chave Pix.', true)
    void navigator.clipboard?.writeText(codigo).then(() => avisar(`Pix de ${aluno.nome.split(' ')[0]} copiado. Cole no app do banco.`))
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-navy/95 px-4 py-3 backdrop-blur">
        <img src="/img/escudo.webp" alt="" width={28} height={28} />
        <h1 className="font-anton text-[1rem] tracking-wide">
          FAMÍLIA <span className="text-gold">PATOTINA</span>
        </h1>
        <span className="flex-1" />
        {instalacao.disponivel && (
          <button type="button" onClick={abrirConvite} className="rounded-md p-2 text-gold hover:text-gold-2" aria-label="Instalar no celular" title="Instalar no celular">
            <Smartphone size={20} />
          </button>
        )}
        <button type="button" onClick={() => setTrocandoSenha(true)} className="rounded-md p-2 text-gray hover:text-cream" aria-label="Minha senha" title="Minha senha">
          <KeyRound size={20} />
        </button>
        <button type="button" onClick={() => void signOut()} className="rounded-md p-2 text-gray hover:text-cream" aria-label="Sair" title="Sair">
          <LogOut size={20} />
        </button>
      </header>

      <main className="mx-auto max-w-[760px] p-[clamp(1rem,4vw,2rem)]">
        <p className="mb-5 text-gray">Olá, {responsavelDoc?.nome.split(' ')[0]}! 💙🤍❤️</p>

        {filhos.length === 0 && <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Nenhum aluno vinculado a esta conta. Fale com a escolinha.</p>}

        {filhos.map((a) => {
          const turma = turmas.get(a.turmaId)
          const freq = frequenciaDoAluno(a.id, chamadas)
          const abertas = (cobrancas[a.id] ?? []).filter((c) => c.situacao === 'aberta').sort((x, y) => x.competencia.localeCompare(y.competencia))
          const pagas = (cobrancas[a.id] ?? []).filter((c) => c.situacao === 'paga').sort((x, y) => y.competencia.localeCompare(x.competencia)).slice(0, 3)
          return (
            <section key={a.id} className="mb-5 rounded-2xl border border-line bg-navy-2 p-4">
              <div className="flex items-center gap-3">
                <Avatar aluno={a} tamanho="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <h2 className="titulo-anton text-[1.3rem] leading-tight">{a.nome}</h2>
                  <p className="text-[0.9rem] text-gray">
                    {[idade(a) != null && `${idade(a)} anos`, turma?.nome, a.situacao !== 'ativo' && `matrícula ${a.situacao === 'trancado' ? 'trancada' : a.situacao}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              {turma && (
                <p className="mt-2 text-[0.9rem]">
                  <span className="text-gray">Treinos: </span>
                  {turma.horarios.map(descreverHorario).join(' · ')}
                </p>
              )}

              <h3 className="rotulo mt-4 mb-1">Presença desde {nomeDoMes(de.slice(0, 7)).split(' ')[0]}</h3>
              {freq.total === 0 ? (
                <p className="text-[0.9rem] text-gray">Ainda sem chamadas registradas.</p>
              ) : (
                <p className="text-[0.95rem]">
                  <b className={cn(freq.percentual != null && freq.percentual < 75 ? 'text-red-200' : 'text-green')}>{freq.percentual}%</b> de presença · {freq.presentes} presenças, {freq.faltas} faltas
                  {freq.justificadas > 0 && `, ${freq.justificadas} justificadas`} em {freq.total} treinos
                </p>
              )}

              <h3 className="rotulo mt-4 mb-1">Mensalidades</h3>
              {a.plano?.isento ? (
                <p className="text-[0.9rem] text-gray">Isento de mensalidade.</p>
              ) : abertas.length === 0 ? (
                <p className="text-[0.9rem] text-green">Tudo em dia. 💙</p>
              ) : (
                abertas.map((c) => (
                  <div key={c.id} className={cn('mb-2 flex flex-wrap items-center gap-2 rounded-xl border p-3', atrasada(c) ? 'border-red-2/50 bg-red-2/10' : 'border-line bg-navy')}>
                    <div className="min-w-0 flex-1">
                      <div className="font-cond text-[1.05rem] font-bold tracking-wide">
                        {nomeDoMes(c.competencia)} · {moeda(valorDevido(c))}
                      </div>
                      <div className="text-[0.85rem] text-gray">
                        {atrasada(c) ? 'Venceu' : 'Vence'} em {dataBr(c.vencimento)}
                        {config.chavePix && ` · Pix: ${config.chavePix}`}
                      </div>
                    </div>
                    <Botao variante="principal" className="px-4 py-2 text-[0.75rem]" onClick={() => copiarPix(c, a)}>
                      <Copy size={14} /> Copiar Pix
                    </Botao>
                  </div>
                ))
              )}
              {pagas.length > 0 && (
                <p className="text-[0.8rem] text-gray">
                  Pagas: {pagas.map((c) => `${nomeDoMes(c.competencia).split(' ')[0]} (recibo ${c.pagamento?.recibo})`).join(', ')}
                </p>
              )}
              {abertas.length > 0 && <p className="mt-1 text-[0.8rem] text-gray">Depois de pagar, mande o comprovante no WhatsApp da escolinha para dar baixa.</p>}
            </section>
          )
        })}

        <section className="mb-5 rounded-2xl border border-line bg-navy-2 p-4">
          <h3 className="rotulo mb-2">Agenda</h3>
          {proximos.length === 0 ? (
            <p className="text-[0.9rem] text-gray">Nada marcado por enquanto.</p>
          ) : (
            proximos.map((e) => {
              const convocado = filhos.filter((a) => e.convocados.includes(a.id))
              return (
                <div key={e.id} className="flex items-start gap-3 border-b border-line py-2 last:border-0">
                  <span className="text-xl">{TIPOS_EVENTO[e.tipo]?.icone}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-cond text-[1.05rem] font-bold tracking-wide">{e.titulo}</div>
                    <div className="text-[0.85rem] text-gray">{[dataBr(e.data), e.hora, e.local].filter(Boolean).join(' · ')}</div>
                    {convocado.length > 0 && <div className="text-[0.85rem] text-gold">Convocado(a): {convocado.map((a) => a.apelido || a.nome.split(' ')[0]).join(', ')}</div>}
                    {e.descricao && <p className="mt-1 whitespace-pre-wrap text-[0.9rem]">{e.descricao}</p>}
                  </div>
                </div>
              )
            })
          )}
        </section>

        {avisos.length > 0 && (
          <section className="mb-5 rounded-2xl border border-line bg-navy-2 p-4">
            <h3 className="rotulo mb-2">Avisos da escolinha</h3>
            {avisos.slice(0, 5).map((av) => (
              <div key={av.id} className="border-b border-line py-2 last:border-0">
                <div className="text-[0.8rem] text-gray">{dataBr(av.enviadoEm)}</div>
                <div className="font-cond text-[1.05rem] font-bold tracking-wide">{av.titulo}</div>
                <p className="whitespace-pre-wrap text-[0.9rem]">{av.texto.replace(/\{responsavel\}/g, responsavelDoc?.nome.split(' ')[0] ?? '')}</p>
              </div>
            ))}
          </section>
        )}
      </main>

      <MinhaSenhaDialog aberta={trocandoSenha} onFechar={() => setTrocandoSenha(false)} />
      <ConviteInstalar descricao="Presença, mensalidades e avisos dos seus filhos a um toque, como um app." />
    </div>
  )
}

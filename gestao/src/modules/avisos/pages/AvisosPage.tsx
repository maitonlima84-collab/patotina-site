import { Copy, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { AreaTexto, Dica, Entrada, Rotulo, Selecao } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { dataBr, hojeIso, linkWhatsApp, telefoneBonito } from '@shared/lib/utils'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { responsavelPrincipal } from '@/modules/alunos/services/alunosService'
import { useEventos } from '@/modules/agenda/hooks/useEventos'
import { passado } from '@/modules/agenda/services/eventosService'
import { useCobrancasAbertas } from '@/modules/mensalidades/hooks/useCobrancas'
import { atrasada } from '@/modules/mensalidades/services/mensalidadesService'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { registrarAviso, subscribeAvisos, type Aviso } from '../repositories/avisosRepository'

// Sem app dos pais, aviso é WhatsApp (docs/gestao.md, §2.8): escolhe-se
// quem recebe, escreve-se o texto, e a tela entrega os telefones e o link
// de cada família. "Registrar envio" guarda o histórico.
export function AvisosPage() {
  const { user, usuarioDoc } = useAuth()
  const avisar = useAviso()
  const { rows: alunos } = useAlunos()
  const { rows: turmas } = useTurmas()
  const { rows: eventos } = useEventos()
  const { rows: abertas } = useCobrancasAbertas()
  const [filtro, setFiltro] = useState('todos')
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [historico, setHistorico] = useState<Aviso[]>([])
  useEffect(() => subscribeAvisos(setHistorico), [])

  const proximos = eventos.filter((e) => !passado(e))
  const devedores = useMemo(() => new Set(abertas.filter((c) => atrasada(c)).map((c) => c.alunoId)), [abertas])

  const destinatarios = useMemo(() => {
    const ativos = alunos.filter((a) => a.situacao === 'ativo')
    let lista = ativos
    if (filtro.startsWith('turma:')) lista = ativos.filter((a) => a.turmaId === filtro.slice(6))
    if (filtro === 'inadimplentes') lista = ativos.filter((a) => devedores.has(a.id))
    if (filtro.startsWith('evento:')) {
      const ev = eventos.find((e) => e.id === filtro.slice(7))
      lista = ativos.filter((a) => ev?.convocados.includes(a.id))
    }
    // Uma família com dois filhos recebe uma vez só. Quem está sem telefone
    // continua na lista, marcado: sumir com a família faria a tela parecer
    // errada (a Inadimplência mostra, Avisos não) e esconderia o cadastro
    // incompleto, que é o que precisa ser corrigido.
    const vistos = new Set<string>()
    return lista
      .map((a) => ({ aluno: a, r: responsavelPrincipal(a), digitos: responsavelPrincipal(a)?.telefone.replace(/\D/g, '') ?? '' }))
      .filter(({ digitos }) => {
        if (!digitos) return true
        if (vistos.has(digitos)) return false
        vistos.add(digitos)
        return true
      })
  }, [alunos, filtro, devedores, eventos])
  const comTelefone = destinatarios.filter(({ digitos }) => digitos)
  const semTelefone = destinatarios.length - comTelefone.length

  const nomeDoFiltro = () => {
    if (filtro === 'todos') return 'Todas as famílias'
    if (filtro === 'inadimplentes') return 'Famílias com mensalidade atrasada'
    if (filtro.startsWith('turma:')) return `Turma ${turmas.find((t) => t.id === filtro.slice(6))?.nome ?? ''}`
    if (filtro.startsWith('evento:')) return `Convocados: ${eventos.find((e) => e.id === filtro.slice(7))?.titulo ?? ''}`
    return filtro
  }

  async function registrar() {
    if (!texto.trim()) return avisar('Escreva o aviso.', true)
    try {
      await registrarAviso({ titulo: titulo.trim() || texto.trim().slice(0, 40), texto: texto.trim(), filtro: nomeDoFiltro(), quantidade: destinatarios.length, enviadoEm: hojeIso(), porNome: usuarioDoc?.nome ?? '' }, user?.uid ?? '')
      avisar('Registrado no histórico.')
      setTitulo('')
      setTexto('')
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  const telefones = comTelefone.map(({ r }) => telefoneBonito(r!.telefone)).join('\n')

  return (
    <>
      <PageHeader titulo="Avisos" ajuda="Escolha quem recebe, escreva, e mande pelo WhatsApp — um a um pelo botão de cada família, ou copie os telefones para uma lista de transmissão." />

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-line bg-navy-2 p-4">
          <Rotulo htmlFor="av-para">Para</Rotulo>
          <Selecao id="av-para" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todas as famílias</option>
            {turmas.filter((t) => t.ativa).map((t) => (
              <option key={t.id} value={`turma:${t.id}`}>
                Turma {t.nome}
              </option>
            ))}
            <option value="inadimplentes">Mensalidade atrasada</option>
            {proximos.map((e) => (
              <option key={e.id} value={`evento:${e.id}`}>
                Convocados: {e.titulo} ({dataBr(e.data)})
              </option>
            ))}
          </Selecao>
          <Rotulo htmlFor="av-titulo" className="mt-3">
            Assunto (para o histórico)
          </Rotulo>
          <Entrada id="av-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Treino cancelado pela chuva" />
          <Rotulo htmlFor="av-texto" className="mt-3">
            Mensagem
          </Rotulo>
          <AreaTexto id="av-texto" rows={6} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Olá! Aviso da Escolinha Patotina: …" />
          <Dica>O nome do responsável entra sozinho no início se você escrever {'{responsavel}'}.</Dica>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao onClick={() => void navigator.clipboard?.writeText(telefones).then(() => avisar('Telefones copiados.'))} disabled={comTelefone.length === 0}>
              <Copy size={15} /> Copiar {comTelefone.length} telefone(s)
            </Botao>
            <Botao variante="principal" onClick={() => void registrar()} disabled={!texto.trim()}>
              Registrar envio
            </Botao>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-navy-2 p-4">
          <h3 className="rotulo mb-2">
            {destinatarios.length} família(s) · {nomeDoFiltro()}
          </h3>
          {semTelefone > 0 && (
            <p className="mb-2 text-[0.85rem] text-gold">
              {semTelefone} família(s) sem telefone no cadastro — abra a ficha do aluno e complete o responsável.
            </p>
          )}
          {destinatarios.length === 0 ? (
            <p className="text-gray">Ninguém nesse filtro.</p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {destinatarios.map(({ aluno, r, digitos }) => (
                <li key={aluno.id} className="flex items-center gap-2 border-b border-line py-1.5 last:border-0">
                  <span className="min-w-0 flex-1 truncate text-[0.9rem]">
                    {r?.nome || <span className="text-gray">(sem responsável)</span>} <span className="text-gray">· {aluno.apelido || aluno.nome}</span>
                  </span>
                  {digitos ? (
                    <>
                      <span className="text-[0.8rem] text-gray">{telefoneBonito(r!.telefone)}</span>
                      <a
                        href={linkWhatsApp(r!.telefone, texto.replace(/\{responsavel\}/g, r!.nome.split(' ')[0] ?? ''))}
                        target="_blank"
                        rel="noopener"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-green hover:border-green"
                        aria-label="WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </a>
                    </>
                  ) : (
                    <Link to={`/alunos/${aluno.id}`} className="text-[0.8rem] text-gold hover:underline">
                      sem telefone
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {historico.length > 0 && (
        <section className="mt-6">
          <h3 className="rotulo mb-2">Avisos enviados</h3>
          {historico.slice(0, 20).map((a) => (
            <div key={a.id} className="mb-2 rounded-xl border border-line bg-navy-2 p-3">
              <div className="flex flex-wrap gap-2 text-[0.8rem] text-gray">
                <span>{dataBr(a.enviadoEm)}</span>
                <span>· {a.filtro}</span>
                <span>· {a.quantidade} família(s)</span>
                {a.porNome && <span>· {a.porNome}</span>}
              </div>
              <div className="font-cond text-[1.05rem] font-bold tracking-wide">{a.titulo}</div>
              <p className="whitespace-pre-wrap text-[0.9rem]">{a.texto}</p>
            </div>
          ))}
        </section>
      )}
    </>
  )
}

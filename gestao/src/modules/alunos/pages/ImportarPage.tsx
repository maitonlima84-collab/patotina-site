import { ArrowLeft } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { AreaTexto, Dica, Recado, Selecao } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { dataBr } from '@shared/lib/utils'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { matricular } from '../services/alunosService'
import { lerCsv, montarAlunos, reconhecerColuna, type Coluna } from '../services/importacao'

const NOMES_COLUNA: Record<Coluna, string> = {
  '': '— ignorar —',
  nome: 'Nome da criança',
  nascimento: 'Nascimento',
  responsavel: 'Responsável',
  parentesco: 'Parentesco',
  telefone: 'Telefone',
  turma: 'Turma',
  escola: 'Escola',
  mensalidade: 'Mensalidade',
  observacoes: 'Observações',
}

// Cola-se o conteúdo da planilha (ou abre-se o CSV), confere-se o que cada
// coluna é, e cada linha vira uma matrícula — situação ativa, com a linha de
// histórico. Faltas viram avisos, não bloqueio: completa-se na ficha.
export function ImportarPage() {
  const { user, usuarioDoc } = useAuth()
  const { rows: turmas } = useTurmas()
  const avisar = useAviso()
  const navegar = useNavigate()
  const arquivoRef = useRef<HTMLInputElement>(null)
  const [texto, setTexto] = useState('')
  const [colunas, setColunas] = useState<Coluna[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [progresso, setProgresso] = useState<string | null>(null)

  const linhas = useMemo(() => lerCsv(texto), [texto])
  const cabecalho = linhas[0] ?? []
  const colunasEfetivas = colunas ?? cabecalho.map(reconhecerColuna)
  const itens = useMemo(() => (linhas.length > 1 ? montarAlunos(linhas.slice(1), colunasEfetivas, turmas) : []), [linhas, colunasEfetivas, turmas])
  const temNome = colunasEfetivas.includes('nome')

  function mudarColuna(i: number, c: Coluna) {
    const novas = colunasEfetivas.slice()
    novas[i] = c
    setColunas(novas)
  }

  async function abrirArquivo(f: File | undefined) {
    if (!f) return
    setTexto(await f.text())
    setColunas(null)
  }

  async function importar() {
    setErro(null)
    if (!temNome) return setErro('Marque qual coluna é o nome da criança.')
    if (!confirm(`Importar ${itens.length} aluno(s)? Cada um entra como matrícula ativa.`)) return
    const por = { uid: user?.uid ?? '', nome: usuarioDoc?.nome ?? '' }
    let feitos = 0
    try {
      for (const item of itens) {
        setProgresso(`Importando ${feitos + 1} de ${itens.length}…`)
        await matricular(item.valores, por)
        feitos++
      }
      avisar(`${feitos} aluno(s) importado(s).`)
      navegar('/alunos')
    } catch (e) {
      setErro(`${mensagemDeErro(e)} (${feitos} de ${itens.length} importados — os que entraram não se repetem se você importar de novo só o resto.)`)
    } finally {
      setProgresso(null)
    }
  }

  return (
    <>
      <Link to="/alunos" className="mb-3 inline-flex items-center gap-1 text-[0.85rem] text-gray hover:text-gold">
        <ArrowLeft size={16} /> Alunos
      </Link>
      <PageHeader titulo="Importar planilha" ajuda="Primeira linha com os títulos das colunas. Serve o CSV exportado do Excel ou do Google Planilhas, ou o conteúdo copiado e colado." />

      <div className="mb-4 flex flex-wrap gap-2">
        <Botao onClick={() => arquivoRef.current?.click()}>Abrir arquivo CSV</Botao>
        <input ref={arquivoRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => void abrirArquivo(e.target.files?.[0])} />
      </div>
      <AreaTexto
        rows={6}
        placeholder={'nome;nascimento;responsavel;telefone;turma\nJoão Miguel;10/03/2019;Maria Silva;34999990000;Fut Baby'}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          setColunas(null)
        }}
        className="font-mono text-[0.85rem]"
      />
      <Dica>Colunas reconhecidas: nome, nascimento, responsável, parentesco, telefone, turma, escola, mensalidade, observações. O resto é ignorado.</Dica>

      {cabecalho.length > 0 && (
        <>
          <h3 className="rotulo mt-6 mb-2">O que é cada coluna</h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {cabecalho.map((titulo, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-navy-2 p-2">
                <span className="min-w-0 flex-1 truncate text-[0.85rem]" title={titulo}>
                  {titulo || `(coluna ${i + 1})`}
                </span>
                <Selecao className="w-[160px] py-1.5" value={colunasEfetivas[i] ?? ''} onChange={(e) => mudarColuna(i, e.target.value as Coluna)}>
                  {Object.entries(NOMES_COLUNA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Selecao>
              </div>
            ))}
          </div>

          <h3 className="rotulo mt-6 mb-2">{itens.length} aluno(s) para importar</h3>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-[0.85rem]">
              <thead className="bg-navy-2 text-left text-gray">
                <tr>
                  <th className="p-2">Nome</th>
                  <th className="p-2">Nascimento</th>
                  <th className="p-2">Responsável</th>
                  <th className="p-2">Turma</th>
                  <th className="p-2">Avisos</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((it, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="p-2">{it.valores.nome}</td>
                    <td className="p-2">{dataBr(it.valores.nascimento ?? '')}</td>
                    <td className="p-2">
                      {it.valores.responsaveis[0]?.nome} {it.valores.responsaveis[0]?.telefone}
                    </td>
                    <td className="p-2">{turmas.find((t) => t.id === it.valores.turmaId)?.nome ?? '—'}</td>
                    <td className="p-2 text-gold">{it.avisos.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Recado>{erro}</Recado>
      <Recado tipo="info">{progresso}</Recado>
      <div className="mt-5 flex gap-2">
        <span className="flex-1" />
        <Botao variante="principal" disabled={itens.length === 0 || progresso !== null} onClick={() => void importar()}>
          Importar {itens.length > 0 && itens.length}
        </Botao>
      </div>
    </>
  )
}

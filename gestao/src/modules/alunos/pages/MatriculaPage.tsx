import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { db } from '@shared/lib/firebase'
import { normalizar } from '@shared/lib/utils'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import type { PreMatricula } from '@/modules/prematriculas/types'
import { atualizarPreMatricula } from '@/modules/prematriculas/repositories/preMatriculasRepository'
import { AlunoForm } from '../components/AlunoForm'
import { matricular, responsavelVazio, type AlunoForm as Valores } from '../services/alunosService'

export function MatriculaPage() {
  const { user, usuarioDoc } = useAuth()
  const avisar = useAviso()
  const navegar = useNavigate()
  const { rows: turmas, porId, loading } = useTurmas()
  const [params] = useSearchParams()
  // Vindo da tela de uma turma, ela já vem escolhida.
  const turmaSugerida = porId.get(params.get('turma') ?? '')
  // Vindo de uma pré-matrícula do site, o que a família escreveu já entra.
  const preId = params.get('pre')
  const [pre, setPre] = useState<PreMatricula | null | undefined>(preId ? undefined : null)

  useEffect(() => {
    if (!preId) return
    getDoc(doc(db, 'pre_matriculas', preId))
      .then((s) => setPre(s.exists() ? ({ id: s.id, ...s.data() } as PreMatricula) : null))
      .catch(() => setPre(null))
  }, [preId])

  if (pre === undefined || loading) return <p className="py-10 text-center text-gray">Carregando…</p>

  let inicial: Partial<Valores> | undefined
  if (pre) {
    const nomeTurma = normalizar(pre.turmaSugerida.split(' (')[0] ?? '')
    const turma = nomeTurma ? turmas.find((t) => t.ativa && normalizar(t.nome) === nomeTurma) : undefined
    inicial = {
      nome: pre.crianca,
      responsaveis: [{ ...responsavelVazio(true), nome: pre.responsavel, telefone: pre.telefone }],
      observacoes: pre.observacao ? `Pré-matrícula pelo site: ${pre.observacao}` : '',
      turmaId: turma?.id ?? '',
    }
  }

  return (
    <>
      <PageHeader titulo="Matrícula" ajuda={pre ? `A partir da pré-matrícula de ${pre.crianca} pelo site.` : 'Quatro passos. Dá para salvar sem turma e definir depois.'} />
      <AlunoForm
        aluno={null}
        turmas={turmas}
        turmaSugerida={turmaSugerida}
        inicial={inicial}
        rotuloFinal="Matricular"
        onCancelar={() => navegar(-1)}
        onSalvar={async (valores) => {
          const id = await matricular(valores, { uid: user?.uid ?? '', nome: usuarioDoc?.nome ?? '' })
          if (pre) await atualizarPreMatricula(pre.id, { situacao: 'matriculada', alunoId: id }).catch(() => undefined)
          avisar('Matriculado!')
          navegar(`/alunos/${id}`, { replace: true })
        }}
      />
    </>
  )
}

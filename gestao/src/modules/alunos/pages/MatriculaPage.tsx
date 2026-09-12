import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { AlunoForm } from '../components/AlunoForm'
import { matricular } from '../services/alunosService'

export function MatriculaPage() {
  const { user, usuarioDoc } = useAuth()
  const avisar = useAviso()
  const navegar = useNavigate()
  const { rows: turmas, porId } = useTurmas()
  const [params] = useSearchParams()
  // Vindo da tela de uma turma, ela já vem escolhida.
  const turmaSugerida = porId.get(params.get('turma') ?? '')

  return (
    <>
      <PageHeader titulo="Matrícula" ajuda="Quatro passos. Dá para salvar sem turma e definir depois." />
      <AlunoForm
        aluno={null}
        turmas={turmas}
        turmaSugerida={turmaSugerida}
        rotuloFinal="Matricular"
        onCancelar={() => navegar(-1)}
        onSalvar={async (valores) => {
          const id = await matricular(valores, { uid: user?.uid ?? '', nome: usuarioDoc?.nome ?? '' })
          avisar('Matriculado!')
          navegar(`/alunos/${id}`, { replace: true })
        }}
      />
    </>
  )
}

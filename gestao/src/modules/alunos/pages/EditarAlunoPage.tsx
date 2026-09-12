import { useNavigate, useParams } from 'react-router-dom'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { AlunoForm } from '../components/AlunoForm'
import { useAluno } from '../hooks/useAluno'
import { salvarFicha } from '../services/alunosService'

export function EditarAlunoPage() {
  const { id } = useParams()
  const { aluno, loading } = useAluno(id)
  const { rows: turmas } = useTurmas()
  const avisar = useAviso()
  const navegar = useNavigate()

  if (loading || !aluno) return <p className="py-10 text-center text-gray">{loading ? 'Carregando…' : 'Aluno não encontrado.'}</p>

  return (
    <>
      <PageHeader titulo={aluno.apelido || aluno.nome} ajuda="Editar ficha" />
      <AlunoForm
        aluno={aluno}
        turmas={turmas}
        rotuloFinal="Salvar"
        onCancelar={() => navegar(`/alunos/${aluno.id}`)}
        onSalvar={async (valores) => {
          await salvarFicha(aluno, valores)
          avisar('Ficha salva.')
          navegar(`/alunos/${aluno.id}`)
        }}
      />
    </>
  )
}

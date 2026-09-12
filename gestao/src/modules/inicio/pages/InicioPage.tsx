import { useAuth } from '@shared/auth/AuthProvider'
import { PageHeader } from '@shared/components/PageHeader'

// Por enquanto só recebe a pessoa. Os números do dia (alunos por turma,
// aniversariantes, mensalidades em aberto) entram conforme os módulos
// nascem — docs/gestao.md, §2.1.
export function InicioPage() {
  const { usuarioDoc, isGestor } = useAuth()
  const primeiroNome = usuarioDoc?.nome.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader titulo={`Olá, ${primeiroNome}`} ajuda={isGestor ? 'Gestão da escolinha.' : 'Chamada e alunos das suas turmas.'} />
      <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">
        Os cadastros de alunos e turmas são as próximas telas a entrar aqui.
      </p>
    </>
  )
}

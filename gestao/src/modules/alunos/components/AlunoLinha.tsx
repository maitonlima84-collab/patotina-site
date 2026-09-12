import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@shared/lib/utils'
import type { Aluno } from '../types'
import { SituacaoSelo } from './SituacaoSelo'

export function Avatar({ aluno, tamanho = 'h-12 w-12' }: { aluno: Pick<Aluno, 'nome' | 'foto'>; tamanho?: string }) {
  const iniciais = aluno.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return aluno.foto?.url ? (
    <img src={aluno.foto.url} alt="" loading="lazy" className={cn('shrink-0 rounded-full object-cover', tamanho)} />
  ) : (
    <div className={cn('grid shrink-0 place-items-center rounded-full bg-navy-3 font-cond font-bold text-gray', tamanho)}>{iniciais}</div>
  )
}

// Uma linha da lista de alunos: foto, nome, o que importa ao lado e a seta
// para a ficha. Quem não está ativo aparece apagado.
export function AlunoLinha({ aluno, resumo }: { aluno: Aluno; resumo: string }) {
  return (
    <Link
      to={`/alunos/${aluno.id}`}
      className={cn('mb-2 flex items-center gap-3.5 rounded-[14px] border border-line bg-navy-2 p-3 transition hover:border-gray', aluno.situacao !== 'ativo' && 'opacity-60')}
    >
      <Avatar aluno={aluno} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 truncate font-cond text-[1.1rem] font-bold tracking-wide">
          {aluno.apelido || aluno.nome}
          {aluno.situacao !== 'ativo' && <SituacaoSelo situacao={aluno.situacao} />}
        </div>
        <div className="truncate text-[0.85rem] text-gray max-sm:whitespace-normal">{resumo}</div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-gray" />
    </Link>
  )
}

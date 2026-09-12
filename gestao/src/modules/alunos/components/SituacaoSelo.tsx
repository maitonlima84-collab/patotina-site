import { cn } from '@shared/lib/utils'
import { SITUACOES, type Situacao } from '../types'

const COR: Record<Situacao, string> = {
  ativo: 'bg-green/20 text-green',
  pre_matricula: 'bg-gold/20 text-gold',
  trancado: 'bg-gray/20 text-gray',
  desligado: 'bg-red-2/20 text-red-200',
}

export function SituacaoSelo({ situacao, className }: { situacao: Situacao; className?: string }) {
  return <span className={cn('cond-maiusc rounded-full px-2 py-0.5 text-[0.68rem]', COR[situacao], className)}>{SITUACOES[situacao]}</span>
}

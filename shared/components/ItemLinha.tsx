import { ArrowDown, ArrowUp, Pencil } from 'lucide-react'
import { BotaoMini } from '@shared/components/ui/Botao'
import { cn } from '@shared/lib/utils'

// Uma linha da lista: miniatura, nome, resumo e as ações (subir, descer,
// editar). O que está fora do site aparece apagado, com o selo "oculto".
export function ItemLinha({
  nome,
  resumo,
  miniatura,
  visivel,
  ordenavel,
  primeiro,
  ultimo,
  onSubir,
  onDescer,
  onEditar,
}: {
  nome: string
  resumo: string
  miniatura?: string
  visivel: boolean
  ordenavel?: boolean
  primeiro?: boolean
  ultimo?: boolean
  onSubir?: () => void
  onDescer?: () => void
  onEditar: () => void
}) {
  return (
    <div className={cn('mb-3 flex items-center gap-3.5 rounded-[14px] border border-line bg-navy-2 p-3', !visivel && 'opacity-50')}>
      {miniatura ? (
        <img src={miniatura} alt="" loading="lazy" className="h-13 w-13 shrink-0 rounded-[10px] bg-navy-3 object-contain p-1" />
      ) : (
        <div className="grid h-13 w-13 shrink-0 place-items-center rounded-[10px] bg-navy-3 text-xl">📄</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-cond text-[1.1rem] font-bold tracking-wide">
          {nome}
          {!visivel && (
            <span className="cond-maiusc ml-2 rounded-full bg-red-2/15 px-2 py-0.5 text-[0.68rem] text-red-200">oculto</span>
          )}
        </div>
        <div className="truncate text-[0.85rem] text-gray max-sm:whitespace-normal">{resumo}</div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {ordenavel && (
          <>
            <BotaoMini aria-label="Subir" title="Subir" disabled={primeiro} onClick={onSubir}>
              <ArrowUp size={16} />
            </BotaoMini>
            <BotaoMini aria-label="Descer" title="Descer" disabled={ultimo} onClick={onDescer}>
              <ArrowDown size={16} />
            </BotaoMini>
          </>
        )}
        <BotaoMini aria-label="Editar" title="Editar" onClick={onEditar}>
          <Pencil size={16} />
        </BotaoMini>
      </div>
    </div>
  )
}

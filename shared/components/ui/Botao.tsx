import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@shared/lib/utils'

type Variante = 'padrao' | 'principal' | 'perigo' | 'fantasma'

const VARIANTES: Record<Variante, string> = {
  padrao: 'bg-navy-3 text-cream border-line hover:border-gold',
  principal: 'bg-gold text-navy border-gold hover:bg-gold-2',
  perigo: 'bg-transparent text-red-300 border-red-2/50 hover:border-red-2',
  fantasma: 'bg-transparent text-gray border-transparent hover:text-gold hover:bg-navy-3',
}

export function Botao({
  variante = 'padrao',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type={type}
      className={cn(
        'cond-maiusc inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-[0.85rem] transition',
        'disabled:pointer-events-none disabled:opacity-55',
        VARIANTES[variante],
        className,
      )}
      {...props}
    />
  )
}

/** Botão quadrado pequeno para ações da lista (subir, descer, editar). */
export function BotaoMini({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-lg border border-line bg-navy-3 text-gray transition',
        'hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-35',
        className,
      )}
      {...props}
    />
  )
}

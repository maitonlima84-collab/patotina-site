import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@shared/lib/utils'

export function Rotulo({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('rotulo mb-1.5', className)} {...props} />
}

export function Entrada({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('campo', className)} {...props} />
}

export function AreaTexto({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('campo min-h-24 resize-y', className)} {...props} />
}

export function Dica({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-[0.82rem] text-gray">{children}</p>
}

export function ErroCampo({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 text-[0.82rem] text-red-300">{children}</p>
}

/** Caixa de marcar com o rótulo ao lado, em texto normal. */
export function LinhaSim({
  id,
  rotulo,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; rotulo: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input id={id} type="checkbox" className="h-5.5 w-5.5 accent-gold" {...props} />
      <label htmlFor={id} className="text-[0.95rem] text-cream">
        {rotulo}
      </label>
    </div>
  )
}

export function Recado({ tipo = 'erro', children }: { tipo?: 'erro' | 'info'; children?: ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className={cn(
        'mt-4 rounded-lg border px-3.5 py-2.5 text-[0.95rem]',
        tipo === 'erro' ? 'border-red-2/50 bg-red-2/15 text-red-200' : 'border-gold/40 bg-gold/10 text-gold-2',
      )}
    >
      {children}
    </p>
  )
}

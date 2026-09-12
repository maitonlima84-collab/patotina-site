import type { ReactNode } from 'react'

export function PageHeader({ titulo, ajuda, children }: { titulo: string; ajuda?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div>
        <h2 className="titulo-anton text-[1.6rem]">{titulo}</h2>
        {ajuda && <p className="text-[0.9rem] text-gray">{ajuda}</p>}
      </div>
      {children && <div className="ml-auto max-sm:w-full max-sm:[&>*]:w-full">{children}</div>}
    </div>
  )
}

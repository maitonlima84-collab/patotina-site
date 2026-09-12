import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

// Formulário que abre por cima da lista, em <dialog> nativo: no celular vira
// uma folha que ocupa a tela, no computador uma janela centralizada.
export function Janela({
  aberta,
  titulo,
  onFechar,
  rodape,
  children,
}: {
  aberta: boolean
  titulo: string
  onFechar: () => void
  rodape?: ReactNode
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (aberta && !el.open) el.showModal()
    if (!aberta && el.open) el.close()
  }, [aberta])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onFechar()
      }}
      className="m-auto w-full max-w-[min(560px,94vw)] rounded-2xl border border-line bg-navy-2 p-0 shadow-2xl backdrop:bg-black/70"
    >
      {aberta && (
        <div className="flex max-h-[90dvh] flex-col">
          <header className="flex items-center gap-4 border-b border-line px-5 py-4">
            <h3 className="titulo-anton text-[1.25rem]">{titulo}</h3>
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="ml-auto rounded-md p-1 text-gray hover:text-cream"
            >
              <X size={20} />
            </button>
          </header>
          <div className="overflow-y-auto px-5 pb-5">{children}</div>
          {rodape && <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">{rodape}</footer>}
        </div>
      )}
    </dialog>
  )
}

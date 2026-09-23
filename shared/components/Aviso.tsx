import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@shared/lib/utils'

// O "Salvo! Já está no ar." que sobe no rodapé da tela — o retorno que a
// diretoria precisa ver depois de cada ação, sem virar um diálogo para fechar.
interface AvisoContextValue {
  avisar: (texto: string, ehErro?: boolean) => void
}

const AvisoContext = createContext<AvisoContextValue | null>(null)

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const avisar = useCallback((texto: string, ehErro = false) => {
    setAviso({ texto, erro: ehErro })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAviso(null), ehErro ? 5000 : 2500)
  }, [])

  const value = useMemo(() => ({ avisar }), [avisar])

  return (
    <AvisoContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        hidden={!aviso}
        className={cn(
          // w-max: preso em left-1/2, o aviso só teria meia tela de largura e
          // quebraria em três linhas no celular.
          'cond-maiusc fixed bottom-6 left-1/2 z-60 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-[0.85rem] shadow-2xl',
          aviso?.erro ? 'bg-red-2 text-white' : 'bg-green text-[#04240f]',
        )}
      >
        {aviso?.texto}
      </div>
    </AvisoContext.Provider>
  )
}

export function useAviso() {
  const ctx = useContext(AvisoContext)
  if (!ctx) throw new Error('useAviso precisa estar dentro de <AvisoProvider>')
  return ctx.avisar
}

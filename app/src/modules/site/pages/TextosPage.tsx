import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAviso } from '@/shared/components/Aviso'
import { PageHeader } from '@/shared/components/PageHeader'
import { Botao } from '@/shared/components/ui/Botao'
import { AreaTexto, Dica, Entrada, Rotulo } from '@/shared/components/ui/Campos'
import { mensagemDeErro } from '@/shared/lib/erros'
import { CAMPOS_TEXTOS } from '../colecoes'
import type { Textos } from '../types'
import { lerTextos, salvarTextos } from '../repositories/siteRepository'

// As frases fixas das seções, num formulário só — salva tudo de uma vez.
export function TextosPage() {
  const avisar = useAviso()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['site', 'textos'], queryFn: lerTextos })
  const [valores, setValores] = useState<Partial<Textos>>({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (data) setValores(data)
  }, [data])

  async function salvar() {
    setSalvando(true)
    try {
      const limpos: Partial<Textos> = {}
      for (const c of CAMPOS_TEXTOS) limpos[c.n] = String(valores[c.n] ?? '').trim().slice(0, 600)
      await salvarTextos(limpos)
      await queryClient.invalidateQueries({ queryKey: ['site', 'textos'] })
      avisar('Textos atualizados. Já está no ar.')
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <PageHeader titulo="Textos do site" ajuda="As frases fixas das seções. Mexa com calma: elas aparecem para todo mundo." />
      {error && <p className="mb-4 text-red-200">{mensagemDeErro(error)}</p>}
      {isLoading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : (
        <div>
          {CAMPOS_TEXTOS.map((c) => (
            <div key={c.n} className="mt-4">
              <Rotulo htmlFor={`t-${c.n}`}>{c.r}</Rotulo>
              {c.t === 'area' ? (
                <AreaTexto id={`t-${c.n}`} value={valores[c.n] ?? ''} onChange={(e) => setValores((v) => ({ ...v, [c.n]: e.target.value }))} />
              ) : (
                <Entrada id={`t-${c.n}`} type="text" value={valores[c.n] ?? ''} onChange={(e) => setValores((v) => ({ ...v, [c.n]: e.target.value }))} />
              )}
              {c.dica && <Dica>{c.dica}</Dica>}
            </div>
          ))}
          <Botao variante="principal" className="mt-7" onClick={() => void salvar()} disabled={salvando}>
            Salvar textos
          </Botao>
        </div>
      )}
    </>
  )
}

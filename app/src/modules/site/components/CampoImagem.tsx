import { useRef, useState } from 'react'
import { prepararImagem } from '@shared/lib/imagem'
import { mensagemDeErro } from '@shared/lib/erros'
import { Botao } from '@shared/components/ui/Botao'
import { cn } from '@shared/lib/utils'
import type { CampoDef } from '../colecoes'
import { subirImagem } from '../repositories/siteRepository'

// Escolhe, reduz e sobe a imagem na hora; devolve o caminho no Storage e a
// URL pública para o formulário guardar. Se a pessoa cancelar o formulário
// depois, o arquivo fica órfão — aceitável para o volume de uma escolinha.
export function CampoImagem({
  campo,
  caminho,
  url,
  onChange,
}: {
  campo: CampoDef
  caminho: string
  url: string
  onChange: (valor: { caminho: string; url: string }) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<string>('')
  const [ocupado, setOcupado] = useState(false)

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    setOcupado(true)
    setEstado('Preparando a imagem…')
    try {
      const pronta = await prepararImagem(arquivo, { larguraMax: campo.larguraMax, proporcao: campo.proporcao })
      setEstado('Enviando…')
      const r = await subirImagem(campo.pasta ?? 'geral', pronta)
      onChange(r)
      setEstado('Imagem pronta 💙')
    } catch (e) {
      setEstado(mensagemDeErro(e, 'Não deu para usar essa imagem.'))
    } finally {
      setOcupado(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="mt-1">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-navy-3',
            campo.larga ? 'h-[74px] w-[130px]' : 'h-[104px] w-[84px]',
          )}
        >
          {url ? (
            <img src={url} alt="" className={cn('h-full w-full', campo.larga ? 'object-contain p-1' : 'object-cover')} />
          ) : (
            <span className="text-2xl opacity-40">🖼️</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Botao onClick={() => inputRef.current?.click()} disabled={ocupado}>
            Escolher imagem
          </Botao>
          {caminho && (
            <Botao variante="perigo" onClick={() => onChange({ caminho: '', url: '' })} disabled={ocupado}>
              Tirar
            </Botao>
          )}
        </div>
      </div>
      {estado && <p className="mt-1.5 text-[0.85rem] text-gold">{estado}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void escolher(e.target.files?.[0])} />
    </div>
  )
}

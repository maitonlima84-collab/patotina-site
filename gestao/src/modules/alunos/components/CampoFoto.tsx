import { useRef, useState } from 'react'
import { Botao } from '@shared/components/ui/Botao'
import { mensagemDeErro } from '@shared/lib/erros'
import { prepararImagem } from '@shared/lib/imagem'
import { apagarFoto, subirFoto } from '../repositories/alunosRepository'

// Foto do aluno: reduz no celular, sobe na hora e devolve caminho + URL para
// o formulário guardar. Retrato 3:4, o rosto em cima.
export function CampoFoto({ valor, onChange }: { valor: { caminho: string; url: string }; onChange: (v: { caminho: string; url: string }) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    setOcupado(true)
    setEstado('Preparando a foto…')
    try {
      const pronta = await prepararImagem(arquivo, { larguraMax: 600, proporcao: 3 / 4 })
      setEstado('Enviando…')
      const anterior = valor.caminho
      const r = await subirFoto(pronta)
      onChange(r)
      await apagarFoto(anterior)
      setEstado('')
    } catch (e) {
      setEstado(mensagemDeErro(e, 'Não deu para usar essa foto.'))
    } finally {
      setOcupado(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-[104px] w-[78px] shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-navy-3">
        {valor.url ? <img src={valor.url} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl opacity-40">🙂</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Botao onClick={() => inputRef.current?.click()} disabled={ocupado}>
          {valor.url ? 'Trocar foto' : 'Escolher foto'}
        </Botao>
        {valor.caminho && (
          <Botao variante="perigo" onClick={() => onChange({ caminho: '', url: '' })} disabled={ocupado}>
            Tirar
          </Botao>
        )}
        {estado && <p className="text-[0.85rem] text-gold">{estado}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void escolher(e.target.files?.[0])} />
    </div>
  )
}

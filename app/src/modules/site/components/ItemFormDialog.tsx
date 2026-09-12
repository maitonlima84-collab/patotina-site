import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAviso } from '@/shared/components/Aviso'
import { Botao } from '@/shared/components/ui/Botao'
import { AreaTexto, Dica, Entrada, ErroCampo, LinhaSim, Recado, Rotulo } from '@/shared/components/ui/Campos'
import { Janela } from '@/shared/components/ui/Janela'
import { mensagemDeErro } from '@/shared/lib/erros'
import { esquemaDaSecao, valoresIniciais, type CampoDef, type SecaoDef } from '../colecoes'
import type { ItemDoSite } from '../types'
import { apagarItem, salvarItem } from '../services/siteService'
import { CampoImagem } from './CampoImagem'

type Valores = Record<string, unknown>

// O formulário de qualquer seção: cada campo da definição vira uma linha.
// `item` nulo = criar; com item = editar (e o botão Apagar aparece).
export function ItemFormDialog({
  secao,
  item,
  ultimo,
  aberta,
  onFechar,
}: {
  secao: SecaoDef
  item: ItemDoSite | null
  ultimo?: ItemDoSite
  aberta: boolean
  onFechar: () => void
}) {
  const avisar = useAviso()
  const [erro, setErro] = useState<string | null>(null)
  const esquema = useMemo(() => esquemaDaSecao(secao), [secao])

  const form = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: valoresIniciais(secao, item),
  })
  const { register, handleSubmit, reset, watch, setValue, formState } = form

  useEffect(() => {
    if (aberta) {
      reset(valoresIniciais(secao, item))
      setErro(null)
    }
  }, [aberta, secao, item, reset])

  const salvar = handleSubmit(async (valores) => {
    setErro(null)
    try {
      await salvarItem(secao, item, valores, ultimo)
      onFechar()
      avisar('Salvo! Já está no ar.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  })

  async function apagar() {
    if (!item) return
    if (!confirm(`Apagar "${secao.nome(item)}"? Isso não tem volta.`)) return
    try {
      await apagarItem(secao, item)
      onFechar()
      avisar('Removido do site.')
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  // Campos com `metade` vão dois por linha.
  const linhas: CampoDef[][] = []
  for (const c of secao.campos) {
    const ultima = linhas[linhas.length - 1]
    if (c.metade && ultima && ultima.length === 1 && ultima[0]!.metade) ultima.push(c)
    else linhas.push([c])
  }

  return (
    <Janela
      aberta={aberta}
      titulo={item ? `Editar ${secao.nomeItem}` : `Novo ${secao.nomeItem}`}
      onFechar={onFechar}
      rodape={
        <>
          {item && (
            <Botao variante="perigo" onClick={() => void apagar()}>
              Apagar
            </Botao>
          )}
          <span className="flex-1" />
          <Botao onClick={onFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={() => void salvar()} disabled={formState.isSubmitting}>
            Salvar
          </Botao>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        {linhas.map((linha, i) => (
          <div key={i} className={linha.length === 2 ? 'grid gap-4 sm:grid-cols-2' : undefined}>
            {linha.map((campo) => {
              const id = `campo-${campo.n}`
              const mensagem = formState.errors[campo.n]?.message as string | undefined

              if (campo.t === 'sim') {
                return <LinhaSim key={campo.n} id={id} rotulo={campo.r} className="mt-5" {...register(campo.n)} />
              }

              return (
                <div key={campo.n} className="mt-4">
                  <Rotulo htmlFor={id}>{campo.r}</Rotulo>
                  {campo.t === 'imagem' ? (
                    <CampoImagem
                      campo={campo}
                      caminho={String(watch(campo.n) ?? '')}
                      url={String(watch(`${campo.n}Url`) ?? '')}
                      onChange={({ caminho, url }) => {
                        setValue(campo.n, caminho, { shouldDirty: true })
                        setValue(`${campo.n}Url`, url, { shouldDirty: true })
                      }}
                    />
                  ) : campo.t === 'area' ? (
                    <AreaTexto id={id} {...register(campo.n)} />
                  ) : (
                    <Entrada
                      id={id}
                      type={campo.t === 'numero' ? 'number' : campo.t === 'data' ? 'date' : campo.t === 'url' ? 'url' : 'text'}
                      inputMode={campo.t === 'numero' ? 'numeric' : undefined}
                      {...register(campo.n)}
                    />
                  )}
                  {campo.dica && <Dica>{campo.dica}</Dica>}
                  <ErroCampo>{mensagem}</ErroCampo>
                </div>
              )
            })}
          </div>
        ))}
        {/* Enter dentro de um campo salva, em vez de fechar a janela sem gravar. */}
        <button type="submit" hidden />
      </form>
      <Recado>{erro}</Recado>
    </Janela>
  )
}

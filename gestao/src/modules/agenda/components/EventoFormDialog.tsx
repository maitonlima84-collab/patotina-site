import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { AreaTexto, Dica, Entrada, ErroCampo, LinhaSim, Recado, Rotulo, Selecao } from '@shared/components/ui/Campos'
import { Janela } from '@shared/components/ui/Janela'
import { mensagemDeErro } from '@shared/lib/erros'
import type { Turma } from '@/modules/turmas/types'
import { TIPOS_EVENTO, type Evento } from '../types'
import { esquemaEvento, salvarEvento, valoresIniciais, type EventoForm } from '../services/eventosService'

export function EventoFormDialog({
  evento,
  turmas,
  aberta,
  onFechar,
  onSalvo,
}: {
  evento: Evento | null
  turmas: Turma[]
  aberta: boolean
  onFechar: () => void
  onSalvo?: (id: string) => void
}) {
  const { user } = useAuth()
  const avisar = useAviso()
  const [erro, setErro] = useState<string | null>(null)
  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<EventoForm>({
    resolver: zodResolver(esquemaEvento),
    defaultValues: valoresIniciais(evento),
  })
  const turmaIds = watch('turmaIds')
  const tipo = watch('tipo')

  useEffect(() => {
    if (aberta) {
      reset(valoresIniciais(evento))
      setErro(null)
    }
  }, [aberta, evento, reset])

  const salvar = handleSubmit(async (valores) => {
    setErro(null)
    try {
      const id = await salvarEvento(evento, valores, user?.uid ?? '')
      onFechar()
      avisar('Evento salvo.')
      onSalvo?.(id)
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  })

  const alternarTurma = (id: string) => setValue('turmaIds', turmaIds.includes(id) ? turmaIds.filter((x) => x !== id) : [...turmaIds, id])

  return (
    <Janela
      aberta={aberta}
      titulo={evento ? 'Editar evento' : 'Novo evento'}
      onFechar={onFechar}
      rodape={
        <>
          <span className="flex-1" />
          <Botao onClick={onFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={() => void salvar()} disabled={formState.isSubmitting}>
            Salvar
          </Botao>
        </>
      }
    >
      <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <div>
            <Rotulo htmlFor="e-tipo">Tipo</Rotulo>
            <Selecao id="e-tipo" {...register('tipo')}>
              {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.icone} {v.nome}
                </option>
              ))}
            </Selecao>
          </div>
          <div>
            <Rotulo htmlFor="e-titulo">Título</Rotulo>
            <Entrada id="e-titulo" placeholder={tipo === 'jogo' ? 'Ex.: Amistoso contra Tiros' : tipo === 'sem_treino' ? 'Ex.: Feriado' : 'Ex.: Festival de Campos Altos'} {...register('titulo')} />
            <ErroCampo>{formState.errors.titulo?.message}</ErroCampo>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <Rotulo htmlFor="e-data">Data</Rotulo>
            <Entrada id="e-data" type="date" {...register('data')} />
            <ErroCampo>{formState.errors.data?.message}</ErroCampo>
          </div>
          <div>
            <Rotulo htmlFor="e-hora">Hora</Rotulo>
            <Entrada id="e-hora" type="time" {...register('hora')} />
          </div>
          <div className="max-sm:col-span-2">
            <Rotulo htmlFor="e-local">Local</Rotulo>
            <Entrada id="e-local" {...register('local')} />
          </div>
        </div>
        <div>
          <Rotulo>Turmas envolvidas</Rotulo>
          <div className="flex flex-wrap gap-1.5">
            {turmas
              .filter((t) => t.ativa)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => alternarTurma(t.id)}
                  className={`cond-maiusc rounded-full border px-3.5 py-1.5 text-[0.75rem] ${turmaIds.includes(t.id) ? 'border-gold bg-gold text-navy' : 'border-line bg-navy text-gray'}`}
                >
                  {t.nome}
                </button>
              ))}
          </div>
          <Dica>Define de onde vêm os convocados. Sem turma marcada, vale para a escolinha inteira.</Dica>
        </div>
        <div>
          <Rotulo htmlFor="e-desc">Descrição</Rotulo>
          <AreaTexto id="e-desc" rows={3} placeholder="O que levar, horário de saída, valor do lanche…" {...register('descricao')} />
        </div>
        <LinhaSim id="e-site" rotulo="Mostrar no site (seção “Próximos compromissos”)" {...register('visivelNoSite')} />
        <Recado>{erro}</Recado>
      </form>
    </Janela>
  )
}

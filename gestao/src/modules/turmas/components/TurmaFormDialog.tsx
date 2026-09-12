import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao, BotaoMini } from '@shared/components/ui/Botao'
import { Dica, Entrada, ErroCampo, LinhaSim, Recado, Rotulo, Selecao } from '@shared/components/ui/Campos'
import { Janela } from '@shared/components/ui/Janela'
import { mensagemDeErro } from '@shared/lib/erros'
import { DIAS_SEMANA } from '@shared/lib/utils'
import { useUsuarios } from '@shared/modules/contas/hooks/useUsuarios'
import type { Turma } from '../types'
import { esquemaTurma, salvarTurma, valoresIniciais, type TurmaForm } from '../services/turmasService'
import { useCardsDoSite } from '../hooks/useCardsDoSite'

export function TurmaFormDialog({ turma, aberta, onFechar }: { turma: Turma | null; aberta: boolean; onFechar: () => void }) {
  const { user } = useAuth()
  const avisar = useAviso()
  const [erro, setErro] = useState<string | null>(null)
  const { rows: usuarios } = useUsuarios()
  const cards = useCardsDoSite()
  // Quem pode ser professor de turma: qualquer conta ativa que entre no app.
  const professores = usuarios.filter((u) => u.ativo && u.papeis.some((p) => ['Professor', 'Gestor', 'Master'].includes(p)))

  const { register, handleSubmit, reset, control, formState } = useForm<TurmaForm>({
    resolver: zodResolver(esquemaTurma),
    defaultValues: valoresIniciais(turma),
  })
  const horarios = useFieldArray({ control, name: 'horarios' })

  useEffect(() => {
    if (aberta) {
      reset(valoresIniciais(turma))
      setErro(null)
    }
  }, [aberta, turma, reset])

  const salvar = handleSubmit(async (valores) => {
    setErro(null)
    try {
      await salvarTurma(turma, valores, user?.uid ?? '')
      onFechar()
      avisar('Turma salva.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  })

  const erros = formState.errors

  return (
    <Janela
      aberta={aberta}
      titulo={turma ? 'Editar turma' : 'Nova turma'}
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
        <div>
          <Rotulo htmlFor="t-nome">Nome da turma</Rotulo>
          <Entrada id="t-nome" placeholder="Ex.: Sub-9, Fut Baby, Formação" {...register('nome')} />
          <ErroCampo>{erros.nome?.message}</ErroCampo>
        </div>

        <div>
          <Rotulo htmlFor="t-prof">Professor</Rotulo>
          <Selecao id="t-prof" {...register('professorUid')}>
            <option value="">— sem professor definido —</option>
            {professores.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </Selecao>
          <Dica>Quem aparece aqui tem conta no app (aba Contas) com acesso de professor ou gestão.</Dica>
        </div>

        <div>
          <Rotulo>Treinos</Rotulo>
          <div className="flex flex-col gap-2">
            {horarios.fields.map((campo, i) => (
              <div key={campo.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-line bg-navy p-2 sm:grid-cols-[1.1fr_0.8fr_0.8fr_1.4fr_auto]">
                <Selecao aria-label="Dia" {...register(`horarios.${i}.dia`)}>
                  {DIAS_SEMANA.map((d, n) => (
                    <option key={n} value={n}>
                      {d}
                    </option>
                  ))}
                </Selecao>
                <BotaoMini aria-label="Tirar treino" title="Tirar treino" className="sm:order-last" onClick={() => horarios.remove(i)} disabled={horarios.fields.length === 1}>
                  <Trash2 size={16} />
                </BotaoMini>
                <Entrada type="time" aria-label="Início" {...register(`horarios.${i}.inicio`)} />
                <Entrada type="time" aria-label="Fim" {...register(`horarios.${i}.fim`)} />
                <Entrada placeholder="Local" className="col-span-2 sm:col-span-1" {...register(`horarios.${i}.local`)} />
                <ErroCampo>{erros.horarios?.[i]?.fim?.message ?? erros.horarios?.[i]?.inicio?.message}</ErroCampo>
              </div>
            ))}
          </div>
          <ErroCampo>{erros.horarios?.message ?? erros.horarios?.root?.message}</ErroCampo>
          <Botao variante="fantasma" className="mt-2" onClick={() => horarios.append({ dia: 1, inicio: '18:00', fim: '19:00', local: '' })}>
            <Plus size={16} /> Mais um treino
          </Botao>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Rotulo htmlFor="t-min">Idade mínima</Rotulo>
            <Entrada id="t-min" type="number" min={3} max={18} {...register('idadeMin')} />
          </div>
          <div>
            <Rotulo htmlFor="t-max">Idade máxima</Rotulo>
            <Entrada id="t-max" type="number" min={3} max={18} {...register('idadeMax')} />
          </div>
          <div>
            <Rotulo htmlFor="t-cap">Vagas</Rotulo>
            <Entrada id="t-cap" type="number" min={1} placeholder="sem limite" {...register('capacidade')} />
          </div>
          <div>
            <Rotulo htmlFor="t-mens">Mensalidade sugerida (R$)</Rotulo>
            <Entrada id="t-mens" type="number" min={0} step="0.01" inputMode="decimal" {...register('mensalidade')} />
          </div>
          <div>
            <Rotulo htmlFor="t-temp">Temporada</Rotulo>
            <Entrada id="t-temp" placeholder="2026" {...register('temporada')} />
          </div>
          <div>
            <Rotulo htmlFor="t-card">Card no site</Rotulo>
            <Selecao id="t-card" {...register('cardSiteId')}>
              <option value="">— nenhum —</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
          </div>
        </div>
        <Dica>A faixa etária sugere a turma na matrícula; a mensalidade sugerida preenche o plano do aluno, que pode ser ajustado.</Dica>

        <LinhaSim id="t-ativa" rotulo="Turma ativa (aparece na chamada e na matrícula)" {...register('ativa')} />
        <Recado>{erro}</Recado>
      </form>
    </Janela>
  )
}

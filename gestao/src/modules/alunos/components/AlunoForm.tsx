import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Botao, BotaoMini } from '@shared/components/ui/Botao'
import { AreaTexto, Dica, Entrada, ErroCampo, LinhaSim, Recado, Rotulo, Selecao } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn, idadeEm, moeda } from '@shared/lib/utils'
import type { Turma } from '@/modules/turmas/types'
import { faixaEtaria, sugerirTurma } from '@/modules/turmas/services/turmasService'
import type { Aluno } from '../types'
import { PASSOS, esquemaAluno, responsavelVazio, valoresIniciais, type AlunoForm as Valores } from '../services/alunosService'
import { CampoFoto } from './CampoFoto'

// O formulário do aluno em passos: matrícula (aluno nulo) e edição da ficha
// usam o mesmo. Na edição a turma fica travada — muda pela movimentação,
// que registra no histórico.
export function AlunoForm({
  aluno,
  turmas,
  turmaSugerida,
  inicial,
  rotuloFinal,
  onSalvar,
  onCancelar,
}: {
  aluno: Aluno | null
  turmas: Turma[]
  turmaSugerida?: Turma
  // O que já se sabe antes de abrir (pré-matrícula do site, por exemplo).
  inicial?: Partial<Valores>
  rotuloFinal: string
  onSalvar: (valores: Valores) => Promise<void>
  onCancelar: () => void
}) {
  const [passo, setPasso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const editando = aluno !== null

  const form = useForm<Valores>({
    resolver: zodResolver(esquemaAluno),
    defaultValues: { ...valoresIniciais(aluno, { mensalidade: turmaSugerida?.mensalidade }), turmaId: turmaSugerida?.id ?? '', ...inicial },
    mode: 'onTouched',
  })
  const { register, control, handleSubmit, trigger, watch, setValue, formState } = form
  const responsaveis = useFieldArray({ control, name: 'responsaveis' })
  const erros = formState.errors

  const nascimento = watch('nascimento')
  const idade = idadeEm(nascimento ?? '')
  const turmaId = watch('turmaId')
  const plano = watch('plano')
  const ativas = turmas.filter((t) => t.ativa || t.id === aluno?.turmaId)
  const sugestao = sugerirTurma(ativas, idade)

  async function avancar() {
    const ok = await trigger(PASSOS[passo]!.campos)
    if (ok) setPasso((p) => p + 1)
  }

  function escolherTurma(id: string) {
    setValue('turmaId', id)
    // Mensalidade sugerida da turma preenche o plano se ainda está em zero
    // (matrícula nova); numa ficha já com valor, quem edita decide.
    const t = turmas.find((x) => x.id === id)
    if (!editando && t?.mensalidade != null && !plano?.valor) setValue('plano.valor', t.mensalidade)
  }

  const salvar = handleSubmit(
    async (valores) => {
      setErro(null)
      try {
        await onSalvar(valores)
      } catch (e) {
        setErro(mensagemDeErro(e))
      }
    },
    // Erro em passo anterior: leva a pessoa até ele em vez de falhar mudo.
    (errs) => {
      const i = PASSOS.findIndex((p) => p.campos.some((c) => c in errs))
      if (i >= 0) setPasso(i)
    },
  )

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
      <ol className="flex gap-1.5 overflow-x-auto sem-barra">
        {PASSOS.map((p, i) => (
          <li key={p.titulo}>
            <button
              type="button"
              onClick={() => (editando || i < passo ? setPasso(i) : undefined)}
              className={cn(
                'cond-maiusc whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[0.75rem]',
                i === passo ? 'border-gold bg-gold text-navy' : 'border-line bg-navy-2 text-gray',
              )}
            >
              {i + 1}. {p.titulo}
            </button>
          </li>
        ))}
      </ol>

      {/* ---------- 1. Criança ---------- */}
      <section hidden={passo !== 0} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <div>
              <Rotulo htmlFor="a-nome">Nome completo</Rotulo>
              <Entrada id="a-nome" autoComplete="off" {...register('nome')} />
              <ErroCampo>{erros.nome?.message}</ErroCampo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Rotulo htmlFor="a-apelido">Como é chamado</Rotulo>
                <Entrada id="a-apelido" placeholder="Apelido" {...register('apelido')} />
              </div>
              <div>
                <Rotulo htmlFor="a-sexo">Sexo</Rotulo>
                <Selecao id="a-sexo" {...register('sexo')}>
                  <option value="">—</option>
                  <option value="M">Menino</option>
                  <option value="F">Menina</option>
                </Selecao>
              </div>
            </div>
          </div>
          <Controller control={control} name="foto" render={({ field }) => <CampoFoto valor={field.value} onChange={field.onChange} />} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Rotulo htmlFor="a-nasc">Nascimento</Rotulo>
            <Entrada id="a-nasc" type="date" {...register('nascimento')} />
            <ErroCampo>{erros.nascimento?.message}</ErroCampo>
            {idade != null && <Dica>{idade} anos</Dica>}
          </div>
          <div>
            <Rotulo htmlFor="a-escola">Escola</Rotulo>
            <Entrada id="a-escola" {...register('escola')} />
          </div>
        </div>
        <div>
          <Rotulo>Endereço</Rotulo>
          <div className="grid grid-cols-[2fr_1fr] gap-3 sm:grid-cols-[3fr_1fr_2fr_2fr]">
            <Entrada placeholder="Rua" {...register('endereco.rua')} />
            <Entrada placeholder="Nº" {...register('endereco.numero')} />
            <Entrada placeholder="Bairro" {...register('endereco.bairro')} />
            <Entrada placeholder="Cidade" {...register('endereco.cidade')} />
          </div>
        </div>
        <div>
          <Rotulo>Uniforme</Rotulo>
          <div className="grid grid-cols-2 gap-3 sm:max-w-[300px]">
            <Entrada placeholder="Camisa (ex.: 10, P)" {...register('uniforme.camisa')} />
            <Entrada placeholder="Calção" {...register('uniforme.calcao')} />
          </div>
        </div>
      </section>

      {/* ---------- 2. Responsáveis ---------- */}
      <section hidden={passo !== 1} className="flex flex-col gap-3">
        {responsaveis.fields.map((campo, i) => (
          <div key={campo.id} className="rounded-xl border border-line bg-navy-2 p-4">
            <div className="mb-3 flex items-center">
              <span className="rotulo">Responsável {i + 1}</span>
              <BotaoMini aria-label="Tirar responsável" className="ml-auto" disabled={responsaveis.fields.length === 1} onClick={() => responsaveis.remove(i)}>
                <Trash2 size={16} />
              </BotaoMini>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Entrada placeholder="Nome" autoComplete="off" {...register(`responsaveis.${i}.nome`)} />
                <ErroCampo>{erros.responsaveis?.[i]?.nome?.message}</ErroCampo>
              </div>
              <Entrada placeholder="Parentesco (mãe, pai, avó…)" {...register(`responsaveis.${i}.parentesco`)} />
              <div>
                <Entrada placeholder="Telefone / WhatsApp" type="tel" inputMode="tel" {...register(`responsaveis.${i}.telefone`)} />
                <ErroCampo>{erros.responsaveis?.[i]?.telefone?.message}</ErroCampo>
              </div>
              <Entrada placeholder="CPF (opcional)" inputMode="numeric" {...register(`responsaveis.${i}.cpf`)} />
              <div className="flex flex-wrap gap-4">
                <LinhaSim id={`r-${i}-principal`} rotulo="Contato principal" {...register(`responsaveis.${i}.principal`)} />
                <LinhaSim id={`r-${i}-pagador`} rotulo="Paga a mensalidade" {...register(`responsaveis.${i}.pagador`)} />
              </div>
            </div>
          </div>
        ))}
        <ErroCampo>{erros.responsaveis?.message ?? erros.responsaveis?.root?.message}</ErroCampo>
        <Botao variante="fantasma" className="self-start" onClick={() => responsaveis.append(responsavelVazio())}>
          <Plus size={16} /> Outro responsável
        </Botao>
      </section>

      {/* ---------- 3. Saúde e autorizações ---------- */}
      <section hidden={passo !== 2} className="flex flex-col gap-4">
        <div>
          <Rotulo htmlFor="a-alergias">Alergias</Rotulo>
          <Entrada id="a-alergias" placeholder="Nenhuma" {...register('saude.alergias')} />
        </div>
        <div>
          <Rotulo htmlFor="a-med">Medicamentos de uso contínuo</Rotulo>
          <Entrada id="a-med" placeholder="Nenhum" {...register('saude.medicamentos')} />
        </div>
        <div>
          <Rotulo htmlFor="a-restr">Restrições ou cuidados no treino</Rotulo>
          <AreaTexto id="a-restr" rows={2} placeholder="Asma, lesão recente, precisa de óculos…" {...register('saude.restricoes')} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Rotulo htmlFor="a-planoSaude">Plano de saúde</Rotulo>
            <Entrada id="a-planoSaude" placeholder="SUS / Unimed…" {...register('saude.plano')} />
          </div>
          <div>
            <Rotulo htmlFor="a-emerg">Contato de emergência</Rotulo>
            <Entrada id="a-emerg" placeholder="Nome" {...register('saude.emergencia.nome')} />
          </div>
          <div>
            <Rotulo htmlFor="a-emergTel">Telefone de emergência</Rotulo>
            <Entrada id="a-emergTel" type="tel" inputMode="tel" {...register('saude.emergencia.telefone')} />
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-line bg-navy-2 p-4">
          <LinhaSim id="a-imagem" rotulo="Autoriza uso de imagem (site, Instagram, fotos de jogos)" {...register('autorizacoes.imagem')} />
          <LinhaSim id="a-transporte" rotulo="Autoriza transporte para jogos e festivais" {...register('autorizacoes.transporte')} />
          <div>
            <Rotulo htmlFor="a-buscam">Quem pode buscar a criança</Rotulo>
            <Entrada id="a-buscam" placeholder="Nomes, se for diferente dos responsáveis" {...register('autorizacoes.buscam')} />
          </div>
        </div>
      </section>

      {/* ---------- 4. Turma e mensalidade ---------- */}
      <section hidden={passo !== 3} className="flex flex-col gap-4">
        <div>
          <Rotulo>Turma</Rotulo>
          {editando && <Dica>A turma muda pela ficha (botão "Mudar de turma"), para ficar no histórico.</Dica>}
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {ativas.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={editando}
                onClick={() => escolherTurma(t.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition disabled:opacity-60',
                  turmaId === t.id ? 'border-gold bg-gold/10' : 'border-line bg-navy-2 hover:border-gray',
                )}
              >
                <div className="font-cond text-[1.05rem] font-bold tracking-wide">
                  {t.nome}
                  {sugestao?.id === t.id && !editando && <span className="cond-maiusc ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] text-gold">sugerida pela idade</span>}
                </div>
                <div className="text-[0.85rem] text-gray">{[faixaEtaria(t), t.mensalidade != null && moeda(t.mensalidade)].filter(Boolean).join(' · ')}</div>
              </button>
            ))}
            {ativas.length === 0 && <p className="text-gray">Nenhuma turma cadastrada ainda — cadastre em Turmas.</p>}
          </div>
          {!editando && turmaId && (
            <Botao variante="fantasma" className="mt-2" onClick={() => setValue('turmaId', '')}>
              Sem turma por enquanto
            </Botao>
          )}
        </div>

        <div className="rounded-xl border border-line bg-navy-2 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Rotulo htmlFor="a-valor">Mensalidade (R$)</Rotulo>
              <Entrada id="a-valor" type="number" min={0} step="0.01" inputMode="decimal" {...register('plano.valor')} />
            </div>
            <div>
              <Rotulo htmlFor="a-venc">Dia do vencimento</Rotulo>
              <Entrada id="a-venc" type="number" min={1} max={28} {...register('plano.vencimentoDia')} />
            </div>
            <div>
              <Rotulo htmlFor="a-desc">Desconto (R$)</Rotulo>
              <Entrada id="a-desc" type="number" min={0} step="0.01" inputMode="decimal" {...register('plano.desconto.valor')} />
            </div>
            <div>
              <Rotulo htmlFor="a-descMotivo">Motivo do desconto</Rotulo>
              <Entrada id="a-descMotivo" placeholder="Irmão, bolsa, acordo…" {...register('plano.desconto.motivo')} />
              <ErroCampo>{erros.plano?.desconto?.motivo?.message}</ErroCampo>
            </div>
          </div>
          <LinhaSim id="a-isento" rotulo="Isento de mensalidade" className="mt-4" {...register('plano.isento')} />
          {plano?.isento && (
            <div className="mt-3">
              <Entrada placeholder="Motivo da isenção" {...register('plano.motivoIsencao')} />
              <ErroCampo>{erros.plano?.motivoIsencao?.message}</ErroCampo>
            </div>
          )}
          <Dica>O valor é da família, não da turma: cada condição fica registrada aqui, com motivo.</Dica>
        </div>

        <div>
          <Rotulo htmlFor="a-obs">Observações</Rotulo>
          <AreaTexto id="a-obs" rows={3} {...register('observacoes')} />
        </div>
      </section>

      <Recado>{erro}</Recado>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Botao variante="fantasma" onClick={onCancelar}>
          Cancelar
        </Botao>
        <span className="flex-1" />
        {passo > 0 && <Botao onClick={() => setPasso((p) => p - 1)}>Voltar</Botao>}
        {passo < PASSOS.length - 1 ? (
          <Botao variante="principal" onClick={() => void avancar()}>
            Continuar
          </Botao>
        ) : (
          <Botao variante="principal" onClick={() => void salvar()} disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Salvando…' : rotuloFinal}
          </Botao>
        )}
        {editando && passo < PASSOS.length - 1 && (
          <Botao variante="principal" onClick={() => void salvar()} disabled={formState.isSubmitting}>
            Salvar
          </Botao>
        )}
      </div>
    </form>
  )
}

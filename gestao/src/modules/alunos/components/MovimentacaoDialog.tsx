import { useEffect, useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { AreaTexto, Dica, Entrada, Recado, Rotulo, Selecao } from '@shared/components/ui/Campos'
import { Janela } from '@shared/components/ui/Janela'
import { mensagemDeErro } from '@shared/lib/erros'
import { hojeIso } from '@shared/lib/utils'
import type { Turma } from '@/modules/turmas/types'
import type { Aluno } from '../types'
import { anotar, desligar, mudarTurma, reativar, trancar } from '../services/alunosService'

export type Movimentacao = 'mudanca_turma' | 'trancamento' | 'desligamento' | 'retorno' | 'observacao'

const TITULOS: Record<Movimentacao, string> = {
  mudanca_turma: 'Mudar de turma',
  trancamento: 'Trancar matrícula',
  desligamento: 'Desligar aluno',
  retorno: 'Reativar matrícula',
  observacao: 'Anotar no histórico',
}

// As movimentações da ficha (docs/gestao.md, §2.2): cada uma grava a mudança
// e a linha do histórico juntas. Data editável porque muita coisa é
// registrada depois de acontecer.
export function MovimentacaoDialog({
  tipo,
  aluno,
  turmas,
  onFechar,
}: {
  tipo: Movimentacao | null
  aluno: Aluno
  turmas: Turma[]
  onFechar: () => void
}) {
  const { user, usuarioDoc } = useAuth()
  const avisar = useAviso()
  const [data, setData] = useState(hojeIso())
  const [turmaId, setTurmaId] = useState('')
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const ativas = turmas.filter((t) => t.ativa)

  useEffect(() => {
    if (!tipo) return
    setData(hojeIso())
    setTurmaId(tipo === 'retorno' ? aluno.turmaId : '')
    setTexto('')
    setErro(null)
  }, [tipo, aluno.turmaId])

  const precisaTurma = tipo === 'mudanca_turma' || tipo === 'retorno'
  const precisaTexto = tipo === 'observacao'

  async function confirmar() {
    if (!tipo) return
    setErro(null)
    if (precisaTurma && !turmaId) return setErro('Escolha a turma.')
    if (precisaTexto && !texto.trim()) return setErro('Escreva a anotação.')
    if (tipo === 'mudanca_turma' && turmaId === aluno.turmaId) return setErro('É a turma atual.')
    const por = { uid: user?.uid ?? '', nome: usuarioDoc?.nome ?? '' }
    setOcupado(true)
    try {
      if (tipo === 'mudanca_turma') await mudarTurma(aluno, turmaId, por, data)
      if (tipo === 'trancamento') await trancar(aluno, texto.trim(), por, data)
      if (tipo === 'desligamento') await desligar(aluno, texto.trim(), por, data)
      if (tipo === 'retorno') await reativar(aluno, turmaId, por, data)
      if (tipo === 'observacao') await anotar(aluno, texto.trim(), por, data)
      onFechar()
      avisar('Registrado.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Janela
      aberta={tipo !== null}
      titulo={tipo ? TITULOS[tipo] : ''}
      onFechar={onFechar}
      rodape={
        <>
          <span className="flex-1" />
          <Botao onClick={onFechar}>Cancelar</Botao>
          <Botao variante={tipo === 'desligamento' ? 'perigo' : 'principal'} onClick={() => void confirmar()} disabled={ocupado}>
            Confirmar
          </Botao>
        </>
      }
    >
      <div className="mt-4 flex flex-col gap-4">
        {tipo === 'desligamento' && <Dica>A ficha e o histórico continuam guardados; o aluno some das listas do dia a dia e da chamada. Dá para reativar depois.</Dica>}
        {tipo === 'trancamento' && <Dica>Pausa: sai da chamada e das mensalidades até ser reativado.</Dica>}
        <div>
          <Rotulo htmlFor="m-data">Data</Rotulo>
          <Entrada id="m-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        {precisaTurma && (
          <div>
            <Rotulo htmlFor="m-turma">Turma</Rotulo>
            <Selecao id="m-turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
              <option value="">— escolha —</option>
              {ativas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Selecao>
          </div>
        )}
        {tipo !== 'mudanca_turma' && tipo !== 'retorno' && (
          <div>
            <Rotulo htmlFor="m-texto">{precisaTexto ? 'Anotação' : 'Motivo (opcional)'}</Rotulo>
            <AreaTexto id="m-texto" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
        )}
        <Recado>{erro}</Recado>
      </div>
    </Janela>
  )
}

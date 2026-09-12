import { useEffect, useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { Dica, Entrada, Recado, Rotulo, Selecao } from '@shared/components/ui/Campos'
import { Janela } from '@shared/components/ui/Janela'
import { mensagemDeErro } from '@shared/lib/erros'
import { hojeIso, moeda } from '@shared/lib/utils'
import { nomeDoMes } from '@/modules/chamada/services/chamadaService'
import { FORMAS, valorDevido, type Cobranca, type FormaPagamento } from '../types'
import { pagar } from '../services/mensalidadesService'

export function PagamentoDialog({ cobranca, onFechar, onPago }: { cobranca: Cobranca | null; onFechar: () => void; onPago?: (c: Cobranca, recibo: number) => void }) {
  const { user, usuarioDoc } = useAuth()
  const avisar = useAviso()
  const [em, setEm] = useState(hojeIso())
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!cobranca) return
    setEm(hojeIso())
    setForma('pix')
    setValor(String(valorDevido(cobranca)))
    setErro(null)
  }, [cobranca])

  async function confirmar() {
    if (!cobranca) return
    const v = Number(String(valor).replace(',', '.'))
    if (!(v >= 0)) return setErro('Valor recebido.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(em)) return setErro('Data do pagamento.')
    setOcupado(true)
    try {
      const recibo = await pagar(cobranca, { em, forma, valor: v }, { uid: user?.uid ?? '', nome: usuarioDoc?.nome ?? '' })
      avisar(`Pago. Recibo nº ${recibo}.`)
      onPago?.(cobranca, recibo)
      onFechar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Janela
      aberta={cobranca !== null}
      titulo="Registrar pagamento"
      onFechar={onFechar}
      rodape={
        <>
          <span className="flex-1" />
          <Botao onClick={onFechar}>Cancelar</Botao>
          <Botao variante="principal" onClick={() => void confirmar()} disabled={ocupado}>
            Confirmar
          </Botao>
        </>
      }
    >
      {cobranca && (
        <div className="mt-4 flex flex-col gap-4">
          <p>
            <b>{cobranca.alunoNome}</b> · {nomeDoMes(cobranca.competencia)} · {moeda(valorDevido(cobranca))}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Rotulo htmlFor="p-em">Data</Rotulo>
              <Entrada id="p-em" type="date" value={em} onChange={(e) => setEm(e.target.value)} />
            </div>
            <div>
              <Rotulo htmlFor="p-forma">Forma</Rotulo>
              <Selecao id="p-forma" value={forma} onChange={(e) => setForma(e.target.value as FormaPagamento)}>
                {Object.entries(FORMAS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Selecao>
            </div>
            <div>
              <Rotulo htmlFor="p-valor">Valor recebido (R$)</Rotulo>
              <Entrada id="p-valor" type="number" min={0} step="0.01" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
          </div>
          <Dica>O recibo ganha o próximo número sozinho. Recebeu parcial? Registre o valor recebido e anote o resto na observação da cobrança.</Dica>
          <Recado>{erro}</Recado>
        </div>
      )}
    </Janela>
  )
}

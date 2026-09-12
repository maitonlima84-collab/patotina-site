import { useEffect, useState } from 'react'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { AreaTexto, Dica, Entrada, Recado, Rotulo } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { salvarConfiguracoes } from '../repositories/configuracoesRepository'
import type { Configuracoes } from '../types'

export function ConfiguracoesPage() {
  const { config, loading } = useConfiguracoes()
  const avisar = useAviso()
  const [v, setV] = useState<Configuracoes>(config)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  // O formulário parte do que está no banco; depois de carregado, mudanças
  // de fora não sobrescrevem o que a pessoa está digitando.
  useEffect(() => {
    if (!loading) setV(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const campo = <K extends keyof Configuracoes>(k: K, valor: Configuracoes[K]) => setV((x) => ({ ...x, [k]: valor }))
  const texto = (k: keyof Configuracoes['textos'], valor: string) => setV((x) => ({ ...x, textos: { ...x.textos, [k]: valor } }))

  async function salvar() {
    setErro(null)
    if (!v.nome.trim()) return setErro('Nome da escolinha.')
    if (v.vencimentoDia < 1 || v.vencimentoDia > 28) return setErro('Dia de vencimento entre 1 e 28.')
    setOcupado(true)
    try {
      await salvarConfiguracoes({
        ...v,
        nome: v.nome.trim(),
        locais: v.locais.map((l) => l.trim()).filter(Boolean),
        mensalidadePadrao: Number(v.mensalidadePadrao) || 0,
        vencimentoDia: Number(v.vencimentoDia) || 10,
        proximoRecibo: Math.max(1, Number(v.proximoRecibo) || 1),
      })
      avisar('Configurações salvas.')
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setOcupado(false)
    }
  }

  if (loading) return <p className="py-10 text-center text-gray">Carregando…</p>

  return (
    <>
      <PageHeader titulo="Configurações" ajuda="O que vale para a escolinha inteira. O que é de um aluno ou de uma turma fica na ficha dele." />

      <div className="grid gap-4 md:grid-cols-2">
        <Secao titulo="Escolinha">
          <Rotulo htmlFor="c-nome">Nome</Rotulo>
          <Entrada id="c-nome" value={v.nome} onChange={(e) => campo('nome', e.target.value)} />
          <Rotulo htmlFor="c-temp" className="mt-3">
            Temporada
          </Rotulo>
          <Entrada id="c-temp" value={v.temporada} onChange={(e) => campo('temporada', e.target.value)} />
          <Rotulo htmlFor="c-locais" className="mt-3">
            Locais de treino
          </Rotulo>
          <AreaTexto id="c-locais" rows={3} value={v.locais.join('\n')} onChange={(e) => campo('locais', e.target.value.split('\n'))} />
          <Dica>Um por linha.</Dica>
        </Secao>

        <Secao titulo="Mensalidade e Pix">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Rotulo htmlFor="c-mens">Mensalidade padrão (R$)</Rotulo>
              <Entrada id="c-mens" type="number" min={0} step="0.01" value={v.mensalidadePadrao} onChange={(e) => campo('mensalidadePadrao', Number(e.target.value))} />
            </div>
            <div>
              <Rotulo htmlFor="c-venc">Dia de vencimento</Rotulo>
              <Entrada id="c-venc" type="number" min={1} max={28} value={v.vencimentoDia} onChange={(e) => campo('vencimentoDia', Number(e.target.value))} />
            </div>
          </div>
          <Rotulo htmlFor="c-pix" className="mt-3">
            Chave Pix
          </Rotulo>
          <Entrada id="c-pix" value={v.chavePix} onChange={(e) => campo('chavePix', e.target.value)} placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória" />
          <Rotulo htmlFor="c-titular" className="mt-3">
            Nome do titular do Pix
          </Rotulo>
          <Entrada id="c-titular" value={v.titularPix} onChange={(e) => campo('titularPix', e.target.value)} />
          <Rotulo htmlFor="c-recibo" className="mt-3">
            Próximo número de recibo
          </Rotulo>
          <Entrada id="c-recibo" type="number" min={1} value={v.proximoRecibo} onChange={(e) => campo('proximoRecibo', Number(e.target.value))} />
          <Dica>Sobe sozinho a cada pagamento registrado. Só mexa para continuar uma numeração antiga.</Dica>
        </Secao>

        <Secao titulo="Mensagens de WhatsApp" larga>
          <Dica>
            Modelos que o app preenche na hora. Entre chaves: {'{responsavel} {aluno} {competencia} {valor} {vencimento} {pix}'} no lembrete; {'{evento} {data} {hora} {local}'} na
            convocação; {'{numero} {data} {forma}'} no recibo.
          </Dica>
          <Rotulo htmlFor="c-lembrete" className="mt-3">
            Lembrete de mensalidade
          </Rotulo>
          <AreaTexto id="c-lembrete" rows={4} value={v.textos.lembreteMensalidade} onChange={(e) => texto('lembreteMensalidade', e.target.value)} />
          <Rotulo htmlFor="c-conv" className="mt-3">
            Convocação para jogo ou evento
          </Rotulo>
          <AreaTexto id="c-conv" rows={3} value={v.textos.convocacao} onChange={(e) => texto('convocacao', e.target.value)} />
          <Rotulo htmlFor="c-rec" className="mt-3">
            Recibo
          </Rotulo>
          <AreaTexto id="c-rec" rows={4} value={v.textos.recibo} onChange={(e) => texto('recibo', e.target.value)} />
        </Secao>
      </div>

      <Recado>{erro}</Recado>
      <div className="mt-5 flex">
        <span className="flex-1" />
        <Botao variante="principal" onClick={() => void salvar()} disabled={ocupado}>
          Salvar
        </Botao>
      </div>
    </>
  )
}

function Secao({ titulo, larga, children }: { titulo: string; larga?: boolean; children: React.ReactNode }) {
  return (
    <section className={`rounded-xl border border-line bg-navy-2 p-4 ${larga ? 'md:col-span-2' : ''}`}>
      <h3 className="rotulo mb-3">{titulo}</h3>
      {children}
    </section>
  )
}

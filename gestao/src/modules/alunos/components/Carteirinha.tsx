import { useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { cn, dataBr, telefoneBonito } from '@shared/lib/utils'
import type { Turma } from '@/modules/turmas/types'
import type { Aluno, Carteirinha } from '../types'
import { faixaDaTurma, nomeCurto, urlValidacao } from '../services/carteirinhaService'
import { responsavelPrincipal } from '../services/alunosService'
import './carteirinha.css'

export interface DadosCartao {
  aluno: Aluno
  carteirinha: Carteirinha
  turma?: Turma
  // Só o Gestor lê as contas; para a família o verso sai sem professor.
  professor?: string
}

type Formato = 'paisagem' | 'retrato'

// QR desenhado em SVG (nítido em qualquer tamanho e na impressora), sem
// imagem gerada nem serviço de fora.
export function QrCode({ texto, rotulo }: { texto: string; rotulo?: string }) {
  const { tamanho, caminho } = useMemo(() => {
    const { modules } = QRCode.create(texto, { errorCorrectionLevel: 'M' })
    let d = ''
    for (let l = 0; l < modules.size; l++) for (let c = 0; c < modules.size; c++) if (modules.get(l, c)) d += `M${c} ${l}h1v1h-1z`
    return { tamanho: modules.size, caminho: d }
  }, [texto])
  return (
    <svg viewBox={`-1 -1 ${tamanho + 2} ${tamanho + 2}`} shapeRendering="crispEdges" role="img" aria-label={rotulo ?? 'QR code'}>
      <path d={caminho} fill="#002838" />
    </svg>
  )
}

function Foto({ aluno }: { aluno: Aluno }) {
  const iniciais = aluno.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return <div className="cart__foto">{aluno.foto?.url ? <img src={aluno.foto.url} alt="" /> : iniciais}</div>
}

function Marca() {
  return (
    <div className="cart__marca">
      PATOTINA
      <b>ESCOLINHA</b>
    </div>
  )
}

const LEMA = (
  <>
    Futebol, amizade e desenvolvimento para crianças de <b>4 a 14 anos</b>
  </>
)

export function CartaoFrente({ dados, formato = 'paisagem' }: { dados: DadosCartao; formato?: Formato }) {
  const { aluno, carteirinha, turma } = dados
  const qr = <QrCode texto={urlValidacao(carteirinha.codigo)} rotulo="QR para validar a carteirinha" />
  const categoria = (
    <>
      <div className="cart__rotulo">Categoria</div>
      <div className="cart__valor cart__ouro">{turma?.nome || '—'}</div>
      <div className="cart__rotulo">Matrícula</div>
      <div className="cart__valor">{carteirinha.matricula}</div>
    </>
  )
  const validade = (
    <>
      <div className="cart__rotulo">Validade</div>
      <div className="cart__valor cart__ouro">{dataBr(carteirinha.validade)}</div>
    </>
  )

  if (formato === 'retrato') {
    return (
      <div className="cart-caixa">
        <div className="cart cart--retrato cart--frente">
          <div className="cart__topo">
            <img className="cart__escudo" src="/img/escudo.webp" alt="Escudo da Patotina" />
            <Marca />
          </div>
          <div className="cart__faixa cart__cond">Carteirinha do aluno</div>
          <div className="cart__corpo">
            <Foto aluno={aluno} />
            <div className="cart__info">
              <div className="cart__nome">{nomeCurto(aluno.nome)}</div>
              {categoria}
            </div>
          </div>
          <div className="cart__base">
            <div>{validade}</div>
            <div className="cart__qr">{qr}</div>
          </div>
          <div className="cart__rodape">
            <span className="cart__coracoes">💙🤍❤️</span>
            <span>{LEMA}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-caixa">
      <div className="cart cart--paisagem cart--frente">
        <div className="cart__topo">
          <img className="cart__escudo" src="/img/escudo.webp" alt="Escudo da Patotina" />
          <div>
            <Marca />
            <div className="cart__subtitulo cart__cond">Carteirinha do aluno</div>
          </div>
        </div>
        <div className="cart__corpo">
          <Foto aluno={aluno} />
          <div className="cart__info">
            <div className="cart__nome">{nomeCurto(aluno.nome)}</div>
            {categoria}
            {validade}
          </div>
          <div className="cart__qr">{qr}</div>
        </div>
        <div className="cart__rodape">
          <span className="cart__coracoes">💙🤍❤️</span>
          <span>{LEMA}</span>
        </div>
      </div>
    </div>
  )
}

export function CartaoVerso({ dados, formato = 'paisagem' }: { dados: DadosCartao; formato?: Formato }) {
  const { aluno, carteirinha, turma, professor } = dados
  const resp = responsavelPrincipal(aluno)
  const faixa = faixaDaTurma(turma)
  const linhas: [string, string][] = [
    ['Nome completo', aluno.nome],
    ['Nascimento', dataBr(aluno.nascimento)],
    ['Turma', [turma?.nome, faixa && `(${faixa})`].filter(Boolean).join(' ')],
    ['Professor', professor ?? ''],
    ['Matrícula em', dataBr(aluno.entrouEm)],
    ['Responsável', [resp?.nome, resp?.telefone && telefoneBonito(resp.telefone)].filter(Boolean).join(' · ')],
  ]
  return (
    <div className="cart-caixa">
      <div className={cn('cart cart--verso', formato === 'retrato' ? 'cart--retrato' : 'cart--paisagem')}>
        <div className="cart__topo">
          <img className="cart__escudo" src="/img/escudo.webp" alt="" />
          <Marca />
          {formato === 'paisagem' && (
            <div className="cart__local cart__cond cart__ouro">
              » Matutina · Minas Gerais
              <br />
              Escolinha desde 2021
            </div>
          )}
        </div>
        <div className="cart__painel">
          <dl className="cart__linhas">
            {linhas
              .filter(([, v]) => v)
              .map(([r, v]) => (
                <Linha key={r} rotulo={r} valor={v} />
              ))}
          </dl>
          <div className="cart__validar">
            <div className="cart__qr">
              <QrCode texto={urlValidacao(carteirinha.codigo)} rotulo="QR para validar a carteirinha" />
            </div>
            <small>
              Escaneie para
              <br />
              validar a carteirinha
            </small>
          </div>
        </div>
        <div className="cart__rodape">
          <span className="cart__lema">Mais que futebol, grandes amizades</span>
          <span className="cart__coracoes">💙🤍❤️</span>
        </div>
      </div>
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <>
      <dt>{rotulo}</dt>
      <dd title={valor}>{valor}</dd>
    </>
  )
}

// A carteirinha no celular: em pé, como o cartão de um app de banco; um
// toque vira para o verso (dados e QR maior).
export function CarteirinhaDigital({ dados }: { dados: DadosCartao }) {
  const [verso, setVerso] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setVerso((v) => !v)}
        className={cn('cart-virar block w-full cursor-pointer text-left', verso && 'cart-virar--verso')}
        aria-label={verso ? 'Mostrar a frente da carteirinha' : 'Mostrar o verso da carteirinha'}
      >
        <div className="cart-virar__miolo">
          <div className="cart-virar__face" aria-hidden={verso}>
            <CartaoFrente dados={dados} formato="retrato" />
          </div>
          <div className="cart-virar__face cart-virar__face--verso" aria-hidden={!verso}>
            <CartaoVerso dados={dados} formato="retrato" />
          </div>
        </div>
      </button>
      <p className="mt-2 text-center text-[0.8rem] text-gray">Toque na carteirinha para ver {verso ? 'a frente' : 'o verso'}.</p>
    </div>
  )
}

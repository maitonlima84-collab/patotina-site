import { Download, EllipsisVertical, Plus, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { cn } from '@shared/lib/utils'
import { PLATAFORMA, convidarSozinho, fecharConvite, instalar, podeConvidarSozinho, useInstalacao } from './instalacao'

// Folha que desce do topo convidando a pôr o app na tela inicial. Desce
// sozinha pouco depois de entrar (uma vez por visita, e some por uma semana
// se a pessoa dispensar); o botão "Instalar no celular" do menu a traz de
// volta. Fecha no X, tocando fora ou arrastando para cima.
export function ConviteInstalar({ descricao }: { descricao: string }) {
  const { evento, aberto } = useInstalacao()
  const avisar = useAviso()
  const [arrasto, setArrasto] = useState<number | null>(null)
  const inicioY = useRef(0)
  const folha = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!podeConvidarSozinho()) return
    // No Android dá um tempo para o evento do navegador chegar: melhor abrir
    // já com o botão do que mostrar o passo a passo e trocar logo depois.
    const t = window.setTimeout(convidarSozinho, PLATAFORMA === 'android' && !evento ? 4000 : 1500)
    return () => window.clearTimeout(t)
  }, [evento])

  useEffect(() => {
    if (!aberto) return
    folha.current?.focus({ preventScroll: true })
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && fecharConvite()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  if (PLATAFORMA === 'outra') return null

  const instalarAgora = async () => {
    if (await instalar()) avisar('Pronto! A Patotina está na sua tela inicial.')
  }

  // Para cima a folha acompanha o dedo; para baixo, só cede um pouco.
  const moverDedo = (y: number) => {
    const d = y - inicioY.current
    setArrasto(d < 0 ? d : d * 0.25)
  }
  // Decide pelo ponto onde o dedo saiu, não pelo estado: num gesto rápido o
  // último movimento ainda não virou render quando o toque termina.
  const soltarDedo = (y: number) => {
    if (y - inicioY.current < -60) fecharConvite()
    setArrasto(null)
  }

  const modo = evento ? 'botao' : PLATAFORMA

  return (
    <>
      <div
        aria-hidden
        onClick={fecharConvite}
        className={cn(
          'fixed inset-0 z-40 touch-none bg-[#00141e]/65 backdrop-blur-[3px] transition-opacity duration-300',
          aberto ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <section
        ref={folha}
        role="dialog"
        aria-modal="true"
        aria-labelledby="convite-instalar-titulo"
        tabIndex={-1}
        onTouchStart={(e) => (inicioY.current = e.touches[0]!.clientY)}
        onTouchMove={(e) => moverDedo(e.touches[0]!.clientY)}
        onTouchEnd={(e) => soltarDedo(e.changedTouches[0]!.clientY)}
        onTouchCancel={() => setArrasto(null)}
        style={arrasto !== null ? { translate: `0 ${arrasto}px`, transition: 'none' } : undefined}
        className={cn(
          'fixed inset-x-0 top-0 z-50 mx-auto max-w-[520px] touch-none outline-none',
          'transition-[translate,visibility] motion-reduce:transition-none',
          // Desce com um leve passo além do ponto e volta; sobe rápido.
          aberto ? 'visible translate-y-0 duration-500 ease-[cubic-bezier(0.2,1.25,0.4,1)]' : 'invisible -translate-y-[calc(100%+2rem)] duration-300 ease-in',
        )}
      >
        <div className="relative overflow-hidden rounded-b-[28px] border-x border-b border-line bg-navy-2 px-5 pb-2.5 pt-[calc(env(safe-area-inset-top)+1.25rem)] shadow-[0_28px_60px_-16px_rgba(0,0,0,0.8)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(110%_100%_at_50%_0%,rgba(232,176,24,0.2),transparent_70%)]" />

          <div className="relative flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-navy shadow-lg ring-1 ring-gold/45">
                <img src="/img/escudo.webp" alt="" width={44} height={44} />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-gold text-navy ring-[3px] ring-navy-2">
                <Plus size={15} strokeWidth={3} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="cond-maiusc text-[0.72rem] text-gold">No seu celular</p>
              <h2 id="convite-instalar-titulo" className="titulo-anton text-[1.4rem] leading-[1.15]">
                Patotina na <span className="whitespace-nowrap text-gold">tela inicial</span>
              </h2>
              <p className="mt-1 text-[0.92rem] leading-snug text-sand">{descricao}</p>
            </div>
            <button type="button" onClick={fecharConvite} aria-label="Fechar" className="-mr-2 -mt-2 rounded-full p-2 text-gray hover:text-cream">
              <X size={20} />
            </button>
          </div>

          {modo === 'botao' && (
            <div className="relative mt-5 flex flex-col gap-1.5">
              <Botao variante="principal" onClick={() => void instalarAgora()} className="w-full py-3.5 text-[0.95rem] shadow-[0_8px_24px_-6px_rgba(232,176,24,0.55)]">
                <Download size={19} /> Instalar o app
              </Botao>
              <Botao variante="fantasma" onClick={fecharConvite} className="w-full">
                Agora não
              </Botao>
            </div>
          )}

          {modo === 'ios' && (
            <Passos
              aberto={aberto}
              passos={[
                { icone: <Share size={20} />, titulo: 'Toque em Compartilhar', detalhe: 'Na barra do Safari. No iOS 26, fica dentro do botão ···' },
                { icone: <SquarePlus size={20} />, titulo: 'Adicionar à Tela de Início', detalhe: 'Role a lista. Se não aparecer, toque em "Ver Mais".' },
                { icone: <IconeDoApp />, titulo: 'Toque em "Adicionar"', detalhe: 'O escudo aparece junto dos seus apps.' },
              ]}
              dica="Abriu pelo WhatsApp ou Instagram? Abra no Safari antes."
            />
          )}

          {modo === 'android' && (
            <Passos
              aberto={aberto}
              passos={[
                { icone: <EllipsisVertical size={20} />, titulo: 'Toque no menu ⋮', detalhe: 'No canto de cima do navegador.' },
                { icone: <Download size={20} />, titulo: 'Instalar app', detalhe: 'Ou "Adicionar à tela inicial", conforme o navegador.' },
                { icone: <IconeDoApp />, titulo: 'Confirme em "Instalar"', detalhe: 'O escudo aparece junto dos seus apps.' },
              ]}
              dica='Abriu pelo WhatsApp? Toque em ⋮ › "Abrir no Chrome" antes.'
            />
          )}

          {modo !== 'botao' && (
            <Botao variante="principal" onClick={fecharConvite} className="relative mt-4 w-full py-3">
              Entendi
            </Botao>
          )}

          {/* A alça diz que dá para arrastar a folha de volta para cima. */}
          <div className="mt-2.5 flex justify-center">
            <span className="h-1.5 w-11 rounded-full bg-line" />
          </div>
        </div>
      </section>
    </>
  )
}

interface Passo {
  icone: ReactNode
  titulo: string
  detalhe: string
}

// Os passos entram um depois do outro, logo atrás da folha. O ícone vem num
// quadrado claro, parecido com o que a pessoa vai procurar no navegador.
function Passos({ aberto, passos, dica }: { aberto: boolean; passos: Passo[]; dica: string }) {
  return (
    <>
      <ol className="relative mt-5 flex flex-col gap-2">
        {passos.map((p, i) => (
          <li
            key={p.titulo}
            style={{ transitionDelay: aberto ? `${200 + i * 90}ms` : '0ms' }}
            className={cn(
              'flex items-center gap-3 rounded-2xl border border-line bg-navy/70 p-3 transition duration-500 motion-reduce:transition-none',
              aberto ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
            )}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold font-cond text-[0.85rem] font-bold text-navy">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight text-cream">{p.titulo}</p>
              <p className="mt-0.5 text-[0.82rem] leading-snug text-gray">{p.detalhe}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream text-navy shadow-md">{p.icone}</span>
          </li>
        ))}
      </ol>
      <p className="relative mt-3 text-center text-[0.8rem] text-gray">{dica}</p>
    </>
  )
}

function IconeDoApp() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy">
      <img src="/img/escudo.webp" alt="" width={28} height={28} />
    </span>
  )
}

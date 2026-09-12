import { ExternalLink, KeyRound, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { MinhaSenhaDialog } from '@shared/auth/MinhaSenhaDialog'
import { Janela } from '@shared/components/ui/Janela'
import { cn } from '@shared/lib/utils'
import { ABAS, type Aba } from '@/app/routes/abas'

const SITE = 'https://www.patotina.com.br'
const GRUPOS: Aba['grupo'][] = ['Escolinha', 'Administração']

// Casca do app: sidebar no computador, barra inferior no celular (docs/gestao.md,
// §3). O celular é o caso principal — o professor abre isso no campo — então
// a barra tem só o que se usa todo dia e o resto fica atrás de "Mais".
export function AppLayout() {
  const auth = useAuth()
  const { usuarioDoc, signOut } = auth
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const [maisAberto, setMaisAberto] = useState(false)
  const { pathname } = useLocation()

  const abas = ABAS.filter((a) => !a.mostrar || a.mostrar(auth))
  const naBarra = abas.filter((a) => a.barra)
  const noMais = abas.filter((a) => !a.barra)
  const tituloAtual = abas.find((a) => pathname.startsWith(a.caminho))?.titulo ?? 'Gestão'

  const conta = (
    <>
      <button type="button" onClick={() => setTrocandoSenha(true)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.9rem] text-gray hover:bg-navy-3 hover:text-cream">
        <KeyRound size={18} /> Minha conta
      </button>
      {auth.isEditor && (
        <a href={`${SITE}/app/`} target="_blank" rel="noopener" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9rem] text-gray hover:bg-navy-3 hover:text-cream">
          <ExternalLink size={18} /> Painel do site
        </a>
      )}
      <button type="button" onClick={() => void signOut()} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.9rem] text-gray hover:bg-navy-3 hover:text-cream">
        <LogOut size={18} /> Sair
      </button>
    </>
  )

  return (
    <div className="min-h-dvh md:flex">
      {/* ---- computador: sidebar ---- */}
      <aside className="hidden w-[230px] shrink-0 flex-col border-r border-line bg-navy-2 md:sticky md:top-0 md:flex md:h-dvh">
        <div className="flex items-center gap-2.5 px-5 py-5 font-anton text-[1rem] tracking-wide">
          <img src="/img/escudo.webp" alt="" width={30} height={30} />
          GESTÃO <span className="text-gold">PATOTINA</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3" aria-label="Seções">
          {GRUPOS.map((grupo) => {
            const doGrupo = abas.filter((a) => a.grupo === grupo)
            if (doGrupo.length === 0) return null
            return (
              <div key={grupo} className="mb-5">
                <p className="rotulo px-3 pb-1.5 text-[0.7rem]">{grupo}</p>
                {doGrupo.map((aba) => (
                  <LinkDaAba key={aba.caminho} aba={aba} />
                ))}
              </div>
            )
          })}
        </nav>
        <div className="border-t border-line p-3">
          <p className="truncate px-3 pb-1 text-[0.85rem] text-cream" title={usuarioDoc?.email}>
            {usuarioDoc?.nome}
          </p>
          <div className="flex flex-col">{conta}</div>
        </div>
      </aside>

      {/* ---- celular: cabeçalho ---- */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-navy/95 px-4 py-3 backdrop-blur md:hidden">
        <img src="/img/escudo.webp" alt="" width={28} height={28} />
        <h1 className="font-anton text-[1rem] tracking-wide">{tituloAtual}</h1>
        <button type="button" onClick={() => setMaisAberto(true)} aria-label="Menu" className="ml-auto rounded-md p-1.5 text-gray hover:text-cream">
          <Menu size={22} />
        </button>
      </header>

      <main className="mx-auto w-full max-w-[1000px] flex-1 p-[clamp(1rem,4vw,2rem)] pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ---- celular: barra inferior ---- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-navy-2/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Atalhos"
      >
        {naBarra.map((aba) => (
          <NavLink
            key={aba.caminho}
            to={aba.caminho}
            className={({ isActive }) =>
              cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-cond font-semibold uppercase tracking-wider', isActive ? 'text-gold' : 'text-gray')
            }
          >
            <aba.icone size={22} />
            {aba.titulo}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMaisAberto(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 font-cond text-[0.7rem] font-semibold uppercase tracking-wider text-gray"
        >
          <Menu size={22} />
          Mais
        </button>
      </nav>

      <Janela aberta={maisAberto} titulo="Menu" onFechar={() => setMaisAberto(false)}>
        <div className="mt-3 flex flex-col" onClick={() => setMaisAberto(false)}>
          {noMais.map((aba) => (
            <LinkDaAba key={aba.caminho} aba={aba} />
          ))}
          {noMais.length > 0 && <hr className="my-3 border-line" />}
          <p className="truncate px-3 pb-1 text-[0.85rem] text-cream">{usuarioDoc?.nome}</p>
          {conta}
        </div>
      </Janela>

      <MinhaSenhaDialog aberta={trocandoSenha} onFechar={() => setTrocandoSenha(false)} />
    </div>
  )
}

function LinkDaAba({ aba }: { aba: Aba }) {
  return (
    <NavLink
      to={aba.caminho}
      className={({ isActive }) =>
        cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.95rem] transition', isActive ? 'bg-gold text-navy' : 'text-gray hover:bg-navy-3 hover:text-cream')
      }
    >
      <aba.icone size={18} />
      {aba.titulo}
    </NavLink>
  )
}

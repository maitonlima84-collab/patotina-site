import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { MinhaSenhaDialog } from '@shared/auth/MinhaSenhaDialog'
import { ABAS } from '@/app/routes/abas'
import { cn } from '@shared/lib/utils'
import { URL_GESTAO } from '@shared/lib/enderecos'

export function AppLayout() {
  const { isMaster, isProfessor, signOut, usuarioDoc } = useAuth()
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const abas = ABAS.filter((a) => !a.soMaster || isMaster)

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-line bg-navy/95 px-[clamp(1rem,4vw,2rem)] py-3 backdrop-blur">
        <div className="flex items-center gap-2.5 font-anton text-[1rem] tracking-wide">
          <img src="/img/escudo.webp" alt="" width={30} height={30} />
          PAINEL <span className="text-gold">PATOTINA</span>
        </div>
        <nav className="ml-auto flex flex-wrap gap-1" aria-label="Conta">
          <a className="rotulo rounded-md px-2.5 py-2 hover:bg-navy-3 hover:text-gold" href="/" target="_blank" rel="noopener">
            Ver o site ↗
          </a>
          {isProfessor && (
            <a className="rotulo rounded-md px-2.5 py-2 hover:bg-navy-3 hover:text-gold" href={URL_GESTAO} target="_blank" rel="noopener">
              Gestão ↗
            </a>
          )}
          <button
            type="button"
            className="rotulo rounded-md px-2.5 py-2 hover:bg-navy-3 hover:text-gold"
            onClick={() => setTrocandoSenha(true)}
            title={usuarioDoc?.email}
          >
            Minha conta
          </button>
          <button type="button" className="rotulo rounded-md px-2.5 py-2 hover:bg-navy-3 hover:text-gold" onClick={() => void signOut()}>
            Sair
          </button>
        </nav>
      </header>

      <nav className="sem-barra flex gap-1.5 overflow-x-auto border-b border-line px-[clamp(1rem,4vw,2rem)] py-3" aria-label="Seções do site">
        {abas.map((aba) => (
          <NavLink
            key={aba.caminho}
            to={aba.caminho}
            className={({ isActive }) =>
              cn(
                'cond-maiusc whitespace-nowrap rounded-full border px-4 py-2 text-[0.8rem] transition',
                isActive ? 'border-gold bg-gold text-navy' : 'border-line bg-navy-2 text-gray hover:text-cream',
              )
            }
          >
            {aba.titulo}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto max-w-[900px] p-[clamp(1.2rem,4vw,2rem)]">
        <Outlet />
      </main>

      <MinhaSenhaDialog aberta={trocandoSenha} onFechar={() => setTrocandoSenha(false)} />
    </div>
  )
}

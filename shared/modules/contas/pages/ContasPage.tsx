import { useState } from 'react'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { ItemLinha } from '@shared/components/ItemLinha'
import type { Usuario } from '../types'
import { useUsuarios } from '../hooks/useUsuarios'
import { UsuarioFormDialog } from '../components/UsuarioFormDialog'
import { enviarLinkDeSenha } from '../repositories/usuariosRepository'
import { mensagemDeErro } from '@shared/lib/erros'

// "administrador" já diz tudo; para os outros, o nível na escolinha e, se
// houver, o site — na mesma ordem do formulário (do maior para o menor).
function resumoDosPapeis(papeis: string[]) {
  if (papeis.includes('Master')) return 'administrador'
  const partes = [
    papeis.includes('Gestor') ? 'gestor' : papeis.includes('Professor') ? 'professor' : null,
    papeis.includes('Editor') ? 'site' : null,
  ].filter(Boolean)
  return partes.join(' + ') || 'sem acesso'
}

export function ContasPage() {
  const { rows, loading, erro } = useUsuarios()
  const { user } = useAuth()
  const avisar = useAviso()
  const [editando, setEditando] = useState<{ item: Usuario | null } | null>(null)

  async function linkDeSenha(u: Usuario) {
    if (!confirm(`Enviar para ${u.email} um link para criar senha nova?`)) return
    try {
      await enviarLinkDeSenha(u.email)
      avisar('Link enviado por e-mail.')
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  return (
    <>
      <PageHeader titulo="Contas" ajuda="Quem entra no painel do site e no app de gestão — a conta é a mesma, o que muda é o acesso. Desligar o acesso é mais seguro do que apagar — e apagar não existe.">
        <Botao variante="principal" onClick={() => setEditando({ item: null })}>
          + Adicionar pessoa
        </Botao>
      </PageHeader>

      {erro && <p className="mb-4 text-red-200">{erro}</p>}
      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : (
        rows.map((u) => (
          <ItemLinha
            key={u.id}
            nome={u.id === user?.uid ? `${u.nome} (você)` : u.nome}
            resumo={[u.email, resumoDosPapeis(u.papeis), !u.ativo && 'acesso desligado'].filter(Boolean).join(' · ')}
            visivel={u.ativo}
            onEditar={() => setEditando({ item: u })}
          />
        ))
      )}

      <UsuarioFormDialog
        item={editando?.item ?? null}
        aberta={editando !== null}
        onFechar={() => setEditando(null)}
        onLinkDeSenha={(u) => void linkDeSenha(u)}
      />
    </>
  )
}

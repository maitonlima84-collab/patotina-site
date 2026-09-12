import { doc, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth, db } from '@shared/lib/firebase'

// Papéis, na mesma disciplina do OnTrac: lista de strings no documento do
// usuário, conferida pelas regras do Firestore. Uma conta só vale para os
// dois apps — Editor é do painel do site; Gestor e Professor, do app de
// gestão; Master cuida das contas e passa em tudo (docs/gestao.md, §1).
export const PAPEIS = ['Master', 'Editor', 'Gestor', 'Professor'] as const
export type Papel = (typeof PAPEIS)[number]

export const DESCRICAO_PAPEL: Record<Papel, string> = {
  Master: 'cria contas e acessa tudo',
  Editor: 'edita o site',
  Gestor: 'gestão da escolinha: alunos, turmas, mensalidades',
  Professor: 'chamada e alunos das turmas dele',
}

export interface UsuarioDoc {
  nome: string
  email: string
  ativo: boolean
  papeis: string[]
}

interface AuthContextValue {
  user: User | null
  usuarioDoc: UsuarioDoc | null
  loading: boolean
  // Não deu para saber se a pessoa tem acesso — leitura recusada ou sem
  // resposta. Separado de "não tem permissão": a saída é outra (tentar de
  // novo com internet, não pedir liberação).
  falhaNoCadastro: boolean
  temPapel: (papel: Papel) => boolean
  isMaster: boolean
  isEditor: boolean
  isGestor: boolean
  isProfessor: boolean
  acessoLiberado: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuarioDoc, setUsuarioDoc] = useState<UsuarioDoc | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [falhaNoCadastro, setFalhaNoCadastro] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoadingAuth(false)
      if (!u) {
        setUsuarioDoc(null)
        setFalhaNoCadastro(false)
      }
    })
  }, [])

  // O documento em usuarios/{uid} é o que diz se a pessoa pode entrar e com
  // quais papéis. Em tempo real: desligar o acesso no painel derruba a
  // pessoa na hora, sem esperar ela sair e entrar.
  useEffect(() => {
    if (!user) return
    setLoadingDoc(true)
    setFalhaNoCadastro(false)
    const parar = onSnapshot(
      doc(db, 'usuarios', user.uid),
      (snap) => {
        setUsuarioDoc(snap.exists() ? (snap.data() as UsuarioDoc) : null)
        setLoadingDoc(false)
      },
      (e) => {
        console.error('Falha ao ler o cadastro do usuário:', e)
        setUsuarioDoc(null)
        setFalhaNoCadastro(true)
        setLoadingDoc(false)
      },
    )
    return parar
  }, [user])

  const value = useMemo<AuthContextValue>(() => {
    const papeis = usuarioDoc?.ativo ? usuarioDoc.papeis : []
    const temPapel = (papel: Papel) => papeis.includes(papel)
    const isMaster = temPapel('Master')
    return {
      user,
      usuarioDoc,
      loading: loadingAuth || loadingDoc,
      falhaNoCadastro,
      temPapel,
      isMaster,
      isEditor: isMaster || temPapel('Editor'),
      isGestor: isMaster || temPapel('Gestor'),
      // Gestor também faz chamada — o Professor é o papel menor, não outro.
      isProfessor: isMaster || temPapel('Gestor') || temPapel('Professor'),
      acessoLiberado: papeis.length > 0,
      signOut: () => firebaseSignOut(auth),
    }
  }, [user, usuarioDoc, loadingAuth, loadingDoc, falhaNoCadastro])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

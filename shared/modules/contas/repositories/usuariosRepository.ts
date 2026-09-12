import { getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth'
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, firebaseConfig, usandoEmuladores } from '@shared/lib/firebase'
import type { Usuario } from '../types'

export function subscribeUsuarios(onChange: (usuarios: Usuario[], erro?: string) => void) {
  return onSnapshot(
    collection(db, 'usuarios'),
    (snap) =>
      onChange(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Usuario)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      ),
    (e) => {
      console.error('Falha ao ler usuários:', e)
      onChange([], 'Não foi possível carregar as contas.')
    },
  )
}

// Criar a conta de outra pessoa pelo SDK de cliente troca a sessão de quem
// está logado — por isso o cadastro roda num segundo app Firebase, isolado,
// que é desconectado logo em seguida. Sem Cloud Functions (plano Blaze) este
// é o caminho; quando o app de gestão tiver Functions, vira uma callable.
function authParaCadastro() {
  const nome = 'cadastro-de-contas'
  const appSecundario = getApps().find((a) => a.name === nome) ?? initializeApp(firebaseConfig, nome)
  const authSecundario = getAuth(appSecundario)
  if (usandoEmuladores && !('emulatorConfig' in authSecundario && authSecundario.emulatorConfig)) {
    connectAuthEmulator(authSecundario, 'http://127.0.0.1:9099', { disableWarnings: true })
  }
  return authSecundario
}

export async function criarUsuario(dados: { nome: string; email: string; senha: string; papeis: string[]; ativo: boolean }) {
  const authSecundario = authParaCadastro()
  const cred = await createUserWithEmailAndPassword(authSecundario, dados.email, dados.senha)
  try {
    await setDoc(doc(db, 'usuarios', cred.user.uid), {
      nome: dados.nome,
      email: dados.email,
      ativo: dados.ativo,
      papeis: dados.papeis,
      criadoEm: serverTimestamp(),
    })
  } finally {
    await signOut(authSecundario)
  }
  return cred.user.uid
}

export async function editarUsuario(id: string, dados: Partial<Pick<Usuario, 'nome' | 'ativo' | 'papeis'>>) {
  await updateDoc(doc(db, 'usuarios', id), dados)
}

export function enviarLinkDeSenha(email: string) {
  return sendPasswordResetEmail(auth, email)
}

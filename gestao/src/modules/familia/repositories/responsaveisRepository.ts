import { arrayRemove, arrayUnion, collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import type { ResponsavelDoc } from '@shared/auth/AuthProvider'
import { db } from '@shared/lib/firebase'
import { criarContaNoAuth } from '@shared/modules/contas/repositories/usuariosRepository'

export interface Responsavel extends ResponsavelDoc {
  id: string
}

// As contas de família ligadas a um aluno (array-contains: um campo só).
export function subscribeResponsaveisDoAluno(alunoId: string, onChange: (r: Responsavel[]) => void) {
  return onSnapshot(
    query(collection(db, 'responsaveis'), where('alunoIds', 'array-contains', alunoId)),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Responsavel)),
    (e) => {
      console.error('Falha ao ler responsáveis:', e)
      onChange([])
    },
  )
}

export async function buscarResponsavelPorEmail(email: string): Promise<Responsavel | null> {
  const snap = await getDocs(query(collection(db, 'responsaveis'), where('email', '==', email.trim().toLowerCase())))
  const d = snap.docs[0]
  return d ? ({ id: d.id, ...d.data() } as Responsavel) : null
}

// Conta nova no Auth + documento em responsaveis/{uid}, já com o filho.
export async function criarAcessoFamilia(dados: { nome: string; email: string; telefone: string; senha: string; alunoId: string }, por: string) {
  const uid = await criarContaNoAuth(dados.email, dados.senha)
  await setDoc(doc(db, 'responsaveis', uid), {
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    alunoIds: [dados.alunoId],
    ativo: true,
    criadoEm: serverTimestamp(),
    criadoPor: por,
  })
  return uid
}

export const vincularAluno = (uid: string, alunoId: string) => updateDoc(doc(db, 'responsaveis', uid), { alunoIds: arrayUnion(alunoId), atualizadoEm: serverTimestamp() })
export const desvincularAluno = (uid: string, alunoId: string) => updateDoc(doc(db, 'responsaveis', uid), { alunoIds: arrayRemove(alunoId), atualizadoEm: serverTimestamp() })
export const ativarResponsavel = (uid: string, ativo: boolean) => updateDoc(doc(db, 'responsaveis', uid), { ativo, atualizadoEm: serverTimestamp() })

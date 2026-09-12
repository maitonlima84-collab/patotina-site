import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import type { Turma, TurmaDados } from '../types'

export function subscribeTurmas(onChange: (turmas: Turma[], erro?: string) => void) {
  return onSnapshot(
    collection(db, 'turmas'),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Turma)),
    (e) => {
      console.error('Falha ao ler turmas:', e)
      onChange([], 'Não foi possível carregar as turmas. Confira a internet e tente de novo.')
    },
  )
}

export async function criarTurma(dados: TurmaDados, por: string) {
  const r = await addDoc(collection(db, 'turmas'), { ...dados, criadoEm: serverTimestamp(), criadoPor: por, atualizadoEm: serverTimestamp() })
  return r.id
}

export async function editarTurma(id: string, dados: Partial<TurmaDados>) {
  await updateDoc(doc(db, 'turmas', id), { ...dados, atualizadoEm: serverTimestamp() })
}

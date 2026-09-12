import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import type { PreMatricula } from '../types'

export function subscribePreMatriculas(onChange: (itens: PreMatricula[], erro?: string) => void) {
  return onSnapshot(
    collection(db, 'pre_matriculas'),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PreMatricula)),
    (e) => {
      console.error('Falha ao ler pré-matrículas:', e)
      onChange([], 'Não foi possível carregar as pré-matrículas.')
    },
  )
}

export async function atualizarPreMatricula(id: string, dados: Partial<Omit<PreMatricula, 'id'>>) {
  await updateDoc(doc(db, 'pre_matriculas', id), { ...dados, atualizadoEm: serverTimestamp() })
}

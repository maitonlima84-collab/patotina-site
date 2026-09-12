import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import type { Evento, EventoDados } from '../types'

export function subscribeEventos(onChange: (eventos: Evento[], erro?: string) => void) {
  return onSnapshot(
    collection(db, 'eventos'),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento)),
    (e) => {
      console.error('Falha ao ler eventos:', e)
      onChange([], 'Não foi possível carregar a agenda.')
    },
  )
}

export async function criarEvento(dados: EventoDados, por: string) {
  const r = await addDoc(collection(db, 'eventos'), { ...dados, criadoEm: serverTimestamp(), criadoPor: por, atualizadoEm: serverTimestamp() })
  return r.id
}

export async function editarEvento(id: string, dados: Partial<EventoDados>) {
  await updateDoc(doc(db, 'eventos', id), { ...dados, atualizadoEm: serverTimestamp() })
}

export async function apagarEvento(id: string) {
  await deleteDoc(doc(db, 'eventos', id))
}

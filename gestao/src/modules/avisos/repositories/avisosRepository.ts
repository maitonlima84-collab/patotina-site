import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'

export interface Aviso {
  id: string
  titulo: string
  texto: string
  filtro: string
  quantidade: number
  enviadoEm: string
  porNome: string
}

export function subscribeAvisos(onChange: (avisos: Aviso[]) => void) {
  return onSnapshot(
    collection(db, 'avisos'),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Aviso).sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm))),
    (e) => {
      console.error('Falha ao ler avisos:', e)
      onChange([])
    },
  )
}

export async function registrarAviso(dados: Omit<Aviso, 'id'>, por: string) {
  await addDoc(collection(db, 'avisos'), { ...dados, por, criadoEm: serverTimestamp() })
}

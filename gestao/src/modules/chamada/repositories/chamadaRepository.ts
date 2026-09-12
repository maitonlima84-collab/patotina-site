import { collection, deleteField, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import { idChamada, type Chamada } from '../types'

export function subscribeChamada(turmaId: string, data: string, onChange: (c: Chamada | null) => void) {
  return onSnapshot(
    doc(db, 'chamadas', idChamada(turmaId, data)),
    (snap) => onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Chamada) : null),
    (e) => {
      console.error('Falha ao ler chamada:', e)
      onChange(null)
    },
  )
}

// Todas as chamadas entre duas datas (todas as turmas). Um campo só no
// filtro, então não pede índice composto; quem chama separa por turma ou
// por aluno. Volume: turmas × treinos por semana × semanas — pequeno.
export function subscribeChamadasEntre(de: string, ate: string, onChange: (c: Chamada[]) => void) {
  return onSnapshot(
    query(collection(db, 'chamadas'), where('data', '>=', de), where('data', '<=', ate)),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chamada)),
    (e) => {
      console.error('Falha ao ler chamadas:', e)
      onChange([])
    },
  )
}

// Grava por cima (merge): cada toque na lista salva na hora, e o cache
// offline do Firestore segura sem sinal e envia quando voltar.
export async function salvarChamada(turmaId: string, data: string, dados: Partial<Omit<Chamada, 'id'>>) {
  await setDoc(doc(db, 'chamadas', idChamada(turmaId, data)), { turmaId, data, ...dados, atualizadoEm: serverTimestamp() }, { merge: true })
}

// Tira a marca de alguns alunos (volta a "sem marcar"). Apaga só as chaves,
// pelo mesmo merge — o documento e a observação ficam.
export async function apagarPresencas(turmaId: string, data: string, alunoIds: string[]) {
  const presencas = Object.fromEntries(alunoIds.map((id) => [id, deleteField()]))
  await setDoc(doc(db, 'chamadas', idChamada(turmaId, data)), { turmaId, data, presencas, atualizadoEm: serverTimestamp() }, { merge: true })
}

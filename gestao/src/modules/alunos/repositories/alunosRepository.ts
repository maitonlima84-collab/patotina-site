import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '@shared/lib/firebase'
import type { Aluno, AlunoDados, Historico } from '../types'

export function subscribeAlunos(onChange: (alunos: Aluno[], erro?: string) => void) {
  return onSnapshot(
    collection(db, 'alunos'),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Aluno)),
    (e) => {
      console.error('Falha ao ler alunos:', e)
      onChange([], 'Não foi possível carregar os alunos. Confira a internet e tente de novo.')
    },
  )
}

export function subscribeAluno(id: string, onChange: (aluno: Aluno | null, erro?: string) => void) {
  return onSnapshot(
    doc(db, 'alunos', id),
    (snap) => onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Aluno) : null),
    (e) => {
      console.error('Falha ao ler aluno:', e)
      onChange(null, 'Não foi possível abrir a ficha.')
    },
  )
}

export function subscribeHistorico(alunoId: string, onChange: (itens: Historico[]) => void) {
  return onSnapshot(
    collection(db, 'alunos', alunoId, 'historico'),
    // Ordem no navegador (data, depois ordem de gravação): são poucas linhas
    // e evita um índice composto só para isso.
    (snap) =>
      onChange(
        snap.docs
          .map((d) => {
            const { criadoEm, ...resto } = d.data()
            return { id: d.id, ...resto, _criadoEm: criadoEm?.toMillis?.() ?? 0 } as Historico & { _criadoEm: number }
          })
          .sort((x, y) => y.data.localeCompare(x.data) || y._criadoEm - x._criadoEm),
      ),
    (e) => {
      console.error('Falha ao ler histórico:', e)
      onChange([])
    },
  )
}

type Registro = Omit<Historico, 'id'>

export async function criarAluno(dados: AlunoDados, registro: Registro) {
  const novo = doc(collection(db, 'alunos'))
  const lote = writeBatch(db)
  lote.set(novo, { ...dados, criadoEm: serverTimestamp(), criadoPor: registro.por, atualizadoEm: serverTimestamp() })
  lote.set(doc(collection(novo, 'historico')), { ...registro, criadoEm: serverTimestamp() })
  await lote.commit()
  return novo.id
}

export async function editarAluno(id: string, dados: Partial<AlunoDados>) {
  await updateDoc(doc(db, 'alunos', id), { ...dados, atualizadoEm: serverTimestamp() })
}

// Movimentação = mudança na ficha + linha no histórico, numa escrita só:
// nunca fica um sem o outro.
export async function movimentarAluno(id: string, dados: Partial<AlunoDados>, registro: Registro) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'alunos', id), { ...dados, atualizadoEm: serverTimestamp() })
  lote.set(doc(collection(db, 'alunos', id, 'historico')), { ...registro, criadoEm: serverTimestamp() })
  await lote.commit()
}

export async function registrarHistorico(id: string, registro: Registro) {
  await addDoc(collection(db, 'alunos', id, 'historico'), { ...registro, criadoEm: serverTimestamp() })
}

export async function subirFoto(blob: Blob) {
  const caminho = `gestao/alunos/${crypto.randomUUID()}.webp`
  const r = ref(storage, caminho)
  await uploadBytes(r, blob, { contentType: 'image/webp' })
  return { caminho, url: await getDownloadURL(r) }
}

export async function apagarFoto(caminho: string) {
  if (!caminho) return
  await deleteObject(ref(storage, caminho)).catch(() => undefined)
}

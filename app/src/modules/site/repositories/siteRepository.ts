import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '@shared/lib/firebase'
import type { ItemDoSite, Textos } from '../types'

// Tudo que o painel grava passa por aqui. Quem lê SEM login é o site
// (site/js/conteudo.js), com filtro visivel == true — este repositório é o
// lado do editor, que enxerga tudo.

export function subscribeColecao<T extends ItemDoSite>(
  colecao: string,
  onChange: (itens: T[], erro?: string) => void,
) {
  return onSnapshot(
    collection(db, colecao),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
    (e) => {
      console.error(`Falha ao ler ${colecao}:`, e)
      onChange([], 'Não foi possível carregar a lista. Confira a internet e tente de novo.')
    },
  )
}

export async function criarItem(colecao: string, dados: Record<string, unknown>) {
  const r = await addDoc(collection(db, colecao), { ...dados, atualizadoEm: serverTimestamp() })
  return r.id
}

export async function editarItem(colecao: string, id: string, dados: Record<string, unknown>) {
  await updateDoc(doc(db, colecao, id), { ...dados, atualizadoEm: serverTimestamp() })
}

export async function removerItem(colecao: string, id: string) {
  await deleteDoc(doc(db, colecao, id))
}

/** Regrava o campo `ordem` na sequência recebida, tudo numa escrita só. */
export async function reordenar(colecao: string, ids: string[]) {
  const lote = writeBatch(db)
  ids.forEach((id, i) => lote.update(doc(db, colecao, id), { ordem: (i + 1) * 10 }))
  await lote.commit()
}

const DOC_TEXTOS = doc(db, 'site_config', 'textos')

export async function lerTextos(): Promise<Partial<Textos>> {
  const snap = await getDoc(DOC_TEXTOS)
  return snap.exists() ? (snap.data() as Partial<Textos>) : {}
}

export async function salvarTextos(dados: Partial<Textos>) {
  await setDoc(DOC_TEXTOS, { ...dados, atualizadoEm: serverTimestamp() }, { merge: true })
}

/* ---------------- imagens (Storage) ---------------- */

export async function subirImagem(pasta: string, blob: Blob): Promise<{ caminho: string; url: string }> {
  const caminho = `site/${pasta}/${crypto.randomUUID()}.webp`
  const referencia = ref(storage, caminho)
  await uploadBytes(referencia, blob, {
    contentType: 'image/webp',
    // Nome único por arquivo: trocar o logo gera outro endereço, então o
    // navegador pode guardar este para sempre.
    cacheControl: 'public, max-age=31536000, immutable',
  })
  return { caminho, url: await getDownloadURL(referencia) }
}

export async function apagarImagem(caminho: string) {
  if (!caminho) return
  try {
    await deleteObject(ref(storage, caminho))
  } catch {
    // arquivo já sumiu: tudo bem
  }
}

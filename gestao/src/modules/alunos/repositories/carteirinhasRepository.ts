import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import type { Carteirinha, CarteirinhaPublica } from '../types'

// O contador da matrícula mora num documento só dele, e não em
// configuracoes/escolinha: a tela de Configurações regrava aquele documento
// inteiro, e um salvar com a tela aberta há tempo voltaria o número.
const DOC_CONTADOR = doc(db, 'configuracoes', 'carteirinhas')

export function subscribeCarteirinhaPublica(codigo: string, onChange: (c: CarteirinhaPublica | null) => void) {
  return onSnapshot(
    doc(db, 'carteirinhas', codigo),
    (snap) => onChange(snap.exists() ? (snap.data() as CarteirinhaPublica) : null),
    (e) => {
      console.error('Falha ao ler a carteirinha:', e)
      onChange(null)
    },
  )
}

export async function lerCarteirinhaPublica(codigo: string) {
  const snap = await getDoc(doc(db, 'carteirinhas', codigo))
  return snap.exists() ? (snap.data() as CarteirinhaPublica) : null
}

// Emissão (primeira ou reemissão) numa transação: a matrícula sai do
// contador sem repetir, o código novo não pode existir, e a ficha, a
// carteirinha pública e a antiga (que passa a "substituída") mudam juntas.
// `matricula` vazia = primeira emissão, o número vem do contador.
export async function gravarEmissao(
  alunoId: string,
  emissao: { codigo: string; matricula: string; anoMatricula: string; emitidaEm: string; validade: string; codigoAntigo?: string },
  publica: Omit<CarteirinhaPublica, 'matricula' | 'validade' | 'situacao'>,
): Promise<Carteirinha> {
  return runTransaction(db, async (tx) => {
    const novo = doc(db, 'carteirinhas', emissao.codigo)
    if ((await tx.get(novo)).exists()) throw new Error('codigo-repetido')
    let matricula = emissao.matricula
    if (!matricula) {
      const n = Number((await tx.get(DOC_CONTADOR)).data()?.proximaMatricula ?? 1)
      tx.set(DOC_CONTADOR, { proximaMatricula: n + 1, atualizadoEm: serverTimestamp() }, { merge: true })
      matricula = `PT-${emissao.anoMatricula}-${String(n).padStart(4, '0')}`
    }
    const carteirinha: Carteirinha = { codigo: emissao.codigo, matricula, emitidaEm: emissao.emitidaEm, validade: emissao.validade }
    tx.set(novo, { ...publica, matricula, validade: emissao.validade, situacao: 'ativa', criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp() })
    if (emissao.codigoAntigo) {
      tx.update(doc(db, 'carteirinhas', emissao.codigoAntigo), { situacao: 'substituida', atualizadoEm: serverTimestamp() })
    }
    tx.update(doc(db, 'alunos', alunoId), { carteirinha, atualizadoEm: serverTimestamp() })
    return carteirinha
  })
}

export async function gravarValidade(alunoId: string, carteirinha: Carteirinha, publica: Omit<CarteirinhaPublica, 'situacao'>) {
  const lote = writeBatch(db)
  lote.update(doc(db, 'alunos', alunoId), { carteirinha, atualizadoEm: serverTimestamp() })
  lote.set(doc(db, 'carteirinhas', carteirinha.codigo), { ...publica, situacao: 'ativa', atualizadoEm: serverTimestamp() }, { merge: true })
  await lote.commit()
}

export async function atualizarPublica(codigo: string, dados: Partial<CarteirinhaPublica>) {
  await setDoc(doc(db, 'carteirinhas', codigo), { ...dados, atualizadoEm: serverTimestamp() }, { merge: true })
}

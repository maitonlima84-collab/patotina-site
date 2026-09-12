import { collection, doc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import { DOC_CONFIG } from '@/modules/configuracoes/repositories/configuracoesRepository'
import { idCobranca, type Cobranca } from '../types'

function ler(onChange: (c: Cobranca[]) => void, ...filtros: Parameters<typeof query>[1][]) {
  return onSnapshot(
    query(collection(db, 'cobrancas'), ...filtros),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cobranca)),
    (e) => {
      console.error('Falha ao ler cobranças:', e)
      onChange([])
    },
  )
}

// Cada consulta filtra por UM campo — nenhuma pede índice composto.
export const subscribeCobrancasDaCompetencia = (competencia: string, onChange: (c: Cobranca[]) => void) =>
  ler(onChange, where('competencia', '==', competencia))

export const subscribeCobrancasDoAluno = (alunoId: string, onChange: (c: Cobranca[]) => void) => ler(onChange, where('alunoId', '==', alunoId))

export const subscribeCobrancasAbertas = (onChange: (c: Cobranca[]) => void) => ler(onChange, where('situacao', '==', 'aberta'))

// Gera só o que ainda não existe: rodar duas vezes o mesmo mês não duplica
// nem sobrescreve o que já foi pago.
export async function gerarCobrancas(novas: Omit<Cobranca, 'id'>[], por: string): Promise<number> {
  const existentes = new Set((await getDocs(query(collection(db, 'cobrancas'), where('competencia', '==', novas[0]?.competencia ?? '')))).docs.map((d) => d.id))
  const lote = writeBatch(db)
  let n = 0
  for (const c of novas) {
    const id = idCobranca(c.alunoId, c.competencia)
    if (existentes.has(id)) continue
    lote.set(doc(db, 'cobrancas', id), { ...c, criadoEm: serverTimestamp(), criadoPor: por, atualizadoEm: serverTimestamp() })
    n++
  }
  if (n > 0) await lote.commit()
  return n
}

// O número do recibo vem de configuracoes.proximoRecibo, numa transação:
// dois pagamentos ao mesmo tempo nunca pegam o mesmo número.
export async function registrarPagamento(id: string, pagamento: Omit<NonNullable<Cobranca['pagamento']>, 'recibo'>): Promise<number> {
  return runTransaction(db, async (tx) => {
    const config = await tx.get(DOC_CONFIG)
    const numero = Number(config.data()?.proximoRecibo ?? 1)
    tx.set(DOC_CONFIG, { proximoRecibo: numero + 1 }, { merge: true })
    tx.update(doc(db, 'cobrancas', id), { situacao: 'paga', pagamento: { ...pagamento, recibo: numero }, atualizadoEm: serverTimestamp() })
    return numero
  })
}

export async function atualizarCobranca(id: string, dados: Partial<Omit<Cobranca, 'id'>>) {
  await updateDoc(doc(db, 'cobrancas', id), { ...dados, atualizadoEm: serverTimestamp() })
}

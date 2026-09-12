import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import { CONFIG_PADRAO, type Configuracoes } from '../types'

export const DOC_CONFIG = doc(db, 'configuracoes', 'escolinha')

// Sem documento ainda, valem os padrões — a tela funciona antes de alguém
// abrir Configurações pela primeira vez.
export function subscribeConfiguracoes(onChange: (c: Configuracoes) => void) {
  return onSnapshot(
    DOC_CONFIG,
    (snap) => onChange(mesclar(snap.exists() ? snap.data() : {})),
    (e) => {
      console.error('Falha ao ler configurações:', e)
      onChange(CONFIG_PADRAO)
    },
  )
}

export async function salvarConfiguracoes(dados: Partial<Configuracoes>) {
  await setDoc(DOC_CONFIG, { ...dados, atualizadoEm: serverTimestamp() }, { merge: true })
}

function mesclar(dados: Record<string, unknown>): Configuracoes {
  const textos = (dados.textos ?? {}) as Partial<Configuracoes['textos']>
  return { ...CONFIG_PADRAO, ...dados, textos: { ...CONFIG_PADRAO.textos, ...textos } } as Configuracoes
}

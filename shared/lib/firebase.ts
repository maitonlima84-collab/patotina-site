import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

// Config de cliente do Firebase não é segredo: a segurança vem das regras do
// Firestore e do Storage. Em desenvolvimento (.env.development) aponta para
// o projeto demo dos emuladores; em produção, para o projeto real
// (.env.production, copiado de .env.example).
export const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const usandoEmuladores = import.meta.env.VITE_USAR_EMULADORES === 'true'

export const app = getApps()[0] ?? initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Cache local persistente: o app de gestão precisa abrir a chamada sem sinal
// no campo, e o painel não perde nada com isso. Várias abas compartilham o
// mesmo cache em vez de brigar por ele.
export const db = iniciarFirestore()

function iniciarFirestore() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  } catch {
    // Já iniciado (recarga a quente do Vite reavalia este módulo): reaproveita.
    return getFirestore(app)
  }
}
export const storage = getStorage(app)

if (usandoEmuladores) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}

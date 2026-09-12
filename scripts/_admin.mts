// Inicialização compartilhada dos scripts de linha de comando (seed e
// criação de acesso). Dois alvos:
//
//   --emulador            fala com os emuladores locais (npm run emulators)
//   --projeto <id>        fala com o projeto real. Precisa de credencial:
//                         --chave conta-de-servico.json (Console → Configurações
//                         do projeto → Contas de serviço → Gerar nova chave),
//                         ou GOOGLE_APPLICATION_CREDENTIALS no ambiente.
import fs from 'node:fs'
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export function argumento(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

export function temFlag(nome: string) {
  return process.argv.includes(`--${nome}`)
}

export function conectar() {
  const emulador = temFlag('emulador')
  const projeto = argumento('projeto') ?? (emulador ? 'demo-patotina' : undefined)
  if (!projeto) {
    console.error('Diga o alvo: --emulador (local) ou --projeto <id-do-projeto> (nuvem).')
    process.exit(1)
  }

  if (emulador) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199'
  }

  const chave = argumento('chave')
  // No emulador não há credencial nenhuma (e passar `credential: undefined`
  // é recusado pelo SDK) — por isso a chave só entra quando existe.
  const credential = chave ? cert(JSON.parse(fs.readFileSync(chave, 'utf-8'))) : emulador ? null : applicationDefault()

  const app = initializeApp({ projectId: projeto, ...(credential ? { credential } : {}) })
  console.log(`Alvo: ${emulador ? 'emuladores locais' : 'projeto ' + projeto}`)
  return { app, auth: getAuth(app), db: getFirestore(app), emulador, projeto }
}

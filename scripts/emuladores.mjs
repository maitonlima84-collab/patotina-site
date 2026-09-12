// Sobe os emuladores do Firebase (Auth, Firestore, Storage, Hosting e a UI em
// http://localhost:4000) com os dados persistidos em .emulator-data.
//
// O firebase-tools exige Java 21+, e nesta máquina o `java` do PATH é o 8.
// Se JAVA_HOME apontar para um JDK/JRE novo, ele entra na frente do PATH.
import { spawn } from 'node:child_process'
import path from 'node:path'

const env = { ...process.env }
if (env.JAVA_HOME) env.PATH = `${path.join(env.JAVA_HOME, 'bin')}${path.delimiter}${env.PATH}`

const args = [
  'emulators:start',
  '--project', 'demo-patotina',
  '--import=./.emulator-data',
  '--export-on-exit=./.emulator-data',
  ...process.argv.slice(2),
]

const filho = spawn('firebase', args, { stdio: 'inherit', env, shell: process.platform === 'win32' })
filho.on('exit', (codigo) => process.exit(codigo ?? 0))

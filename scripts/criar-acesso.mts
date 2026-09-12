// Cria (ou reseta) o acesso de alguém — o primeiro administrador nasce por
// aqui; os seguintes, pela aba Contas. A conta vale para o painel do site e
// para o app de gestão; o papel diz a porta: master (tudo), editor (site),
// gestor (gestão da escolinha), professor (chamada).
//
//   npm run criar-acesso -- --emulador --nome "Maiton Lima" --email maiton@exemplo.com --senha "SenhaForte123" --papel master
//   npm run criar-acesso -- --projeto patotina --chave conta.json --nome "Lucas" --email lucas@exemplo.com --senha "Senha123" --papel editor
//
// Se o e-mail já existir, troca a senha e religa o acesso.
import { conectar, argumento } from './_admin.mts'

const nome = argumento('nome')
const email = argumento('email')?.trim().toLowerCase()
const senha = argumento('senha')
const PAPEIS = {
  master: ['Master', 'Editor', 'Gestor'],
  editor: ['Editor'],
  gestor: ['Gestor'],
  professor: ['Professor'],
} as const
const papel = (argumento('papel') ?? 'editor') as keyof typeof PAPEIS

if (!nome || !email || !senha || !(papel in PAPEIS)) {
  console.error('Faltou informação. Use: --nome "Nome" --email email@x.com --senha "SenhaForte123" [--papel master|editor|gestor|professor]')
  process.exit(1)
}
if (senha.length < 8 || !/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
  console.error('A senha precisa de pelo menos 8 caracteres, com letra e número.')
  process.exit(1)
}

const { auth, db } = conectar()

const existente = await auth.getUserByEmail(email).catch(() => null)
const user = existente
  ? await auth.updateUser(existente.uid, { password: senha, disabled: false })
  : await auth.createUser({ email, password: senha, emailVerified: true, displayName: nome })

await db.doc(`usuarios/${user.uid}`).set(
  {
    nome,
    email,
    ativo: true,
    papeis: [...PAPEIS[papel]],
    criadoEm: new Date(),
  },
  { merge: true },
)

console.log(`${existente ? 'Atualizado' : 'Criado'}: ${nome} <${email}> — ${papel} (uid ${user.uid})`)
process.exit(0)

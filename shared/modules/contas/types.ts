export interface Usuario {
  id: string // uid do Firebase Auth
  nome: string
  email: string
  ativo: boolean
  papeis: string[]
}

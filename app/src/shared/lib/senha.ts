/** Regra mínima de senha, avisada em português. A mesma vale ao criar conta. */
export function senhaFraca(senha: string): string | null {
  if (senha.length < 8) return 'A senha precisa de pelo menos 8 caracteres.'
  if (senha.length > 200) return 'Senha longa demais.'
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) return 'Use pelo menos uma letra e um número na senha.'
  return null
}

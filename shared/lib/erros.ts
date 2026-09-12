import { FirebaseError } from 'firebase/app'

// O SDK fala inglês e em código; quem usa o painel é professor e diretoria.
// Traduz o que dá para traduzir e cai numa frase honesta para o resto.
const MENSAGENS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha não conferem.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-not-found': 'E-mail ou senha não conferem.',
  'auth/wrong-password': 'E-mail ou senha não conferem.',
  'auth/user-disabled': 'Este acesso foi desligado. Fale com um administrador.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão. Confira a internet e tente de novo.',
  'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
  'auth/weak-password': 'A senha precisa de pelo menos 8 caracteres, com letra e número.',
  'auth/requires-recent-login': 'Por segurança, saia e entre de novo antes de trocar a senha.',
  'permission-denied': 'Você não tem permissão para fazer isso.',
  'unavailable': 'Sem conexão com o servidor. Tente de novo em instantes.',
  'storage/unauthorized': 'Você não tem permissão para enviar imagens.',
  'storage/canceled': 'Envio cancelado.',
}

export function mensagemDeErro(e: unknown, padrao = 'Não deu para concluir. Tente de novo.'): string {
  if (e instanceof FirebaseError) return MENSAGENS[e.code] ?? padrao
  if (e instanceof Error && e.message) return e.message
  return padrao
}

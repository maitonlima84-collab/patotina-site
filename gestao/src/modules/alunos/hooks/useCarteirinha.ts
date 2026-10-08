import { useEffect, useState } from 'react'
import type { Aluno, CarteirinhaPublica } from '../types'
import { subscribeUsuarios } from '@shared/modules/contas/repositories/usuariosRepository'
import { subscribeCarteirinhaPublica } from '../repositories/carteirinhasRepository'
import { sincronizarCarteirinha } from '../services/carteirinhaService'

// A cópia pública da carteirinha do aluno, e — quando quem olha é o Gestor —
// a correção automática dela: a ficha mudou (nome, foto, turma, situação)
// e a cópia ainda não, regrava. É o que faz o QR de um aluno desligado
// passar a dizer "inativo" sem ninguém lembrar de mexer na carteirinha.
export function useCarteirinhaPublica(aluno: Aluno | null, turmaNome: string, podeCorrigir: boolean) {
  const codigo = aluno?.carteirinha?.codigo
  const [publica, setPublica] = useState<{ codigo: string; dados: CarteirinhaPublica | null } | null>(null)

  useEffect(() => {
    if (!codigo) return
    return subscribeCarteirinhaPublica(codigo, (dados) => setPublica({ codigo, dados }))
  }, [codigo])

  const atual = publica && publica.codigo === codigo ? publica.dados : null

  useEffect(() => {
    if (!podeCorrigir || !aluno || !atual) return
    sincronizarCarteirinha(aluno, turmaNome, atual).catch((e) => console.error('Falha ao atualizar a carteirinha pública:', e))
  }, [podeCorrigir, aluno, turmaNome, atual])

  return atual
}

// Nome de quem dá aula, para o verso. Só o Gestor lê as contas (regra de
// `usuarios`); para os outros o verso sai sem a linha do professor.
export function useNomesDosProfessores(podeLer: boolean) {
  const [nomes, setNomes] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    if (!podeLer) return
    return subscribeUsuarios((us) => setNomes(new Map(us.map((u) => [u.id, u.nome]))))
  }, [podeLer])
  return nomes
}

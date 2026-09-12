export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

// "2026-08-04" -> "04 · AGO · 2026", o formato das etiquetas de data do site.
export function dataCurta(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00-03:00`)
  const mes = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
  return `${iso.slice(8, 10)} · ${mes.replace('.', '').toUpperCase()} · ${iso.slice(0, 4)}`
}

export const hojeIso = () => new Date().toISOString().slice(0, 10)

// Idade completa em anos numa data (hoje, por padrão). Nascimento em ISO.
export function idadeEm(nascimentoIso: string, referenciaIso = hojeIso()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimentoIso)) return null
  const [an, mn, dn] = nascimentoIso.split('-').map(Number) as [number, number, number]
  const [ar, mr, dr] = referenciaIso.split('-').map(Number) as [number, number, number]
  let idade = ar - an
  if (mr < mn || (mr === mn && dr < dn)) idade -= 1
  return idade
}

// "10/03/2019" ⇄ "2019-03-10": o formulário mostra à brasileira, o banco
// guarda ISO (ordena e compara como texto).
export function dataBr(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : iso
}

// Texto para busca e comparação: minúsculo, sem acento, espaços simples.
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Só dígitos; "(34) 98865-8518" -> "34988658518". Com DDI para o wa.me.
export function telefoneDigitos(telefone: string): string {
  return telefone.replace(/\D/g, '')
}

export function linkWhatsApp(telefone: string, mensagem?: string): string {
  const d = telefoneDigitos(telefone)
  const numero = d.length <= 11 ? `55${d}` : d
  return `https://wa.me/${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`
}

// "34988658518" -> "(34) 98865-8518" para mostrar; devolve como veio se não
// reconhecer o formato.
export function telefoneBonito(telefone: string): string {
  const d = telefoneDigitos(telefone)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return telefone
}

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const
export const DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const

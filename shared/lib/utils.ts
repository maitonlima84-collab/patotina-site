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

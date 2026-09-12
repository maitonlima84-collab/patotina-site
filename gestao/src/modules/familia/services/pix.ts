// Pix "copia e cola" estático (BR Code, padrão EMV do Banco Central): a
// chave da escolinha, o valor e um identificador — sem gateway, sem custo.
// O responsável cola no app do banco e o pagamento sai com o valor certo.

function campo(id: string, valor: string) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

// Só o que o padrão aceita: sem acento, maiúsculas, tamanho limitado.
function limpar(texto: string, max: number) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max)
}

function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function pixCopiaECola({ chave, nome, cidade, valor, txid }: { chave: string; nome: string; cidade: string; valor?: number; txid?: string }) {
  if (!chave) return ''
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim())
  const id = limpar(txid || '***', 25).replace(/ /g, '') || '***'
  const partes = [
    campo('00', '01'),
    campo('26', conta),
    campo('52', '0000'),
    campo('53', '986'),
    valor && valor > 0 ? campo('54', valor.toFixed(2)) : '',
    campo('58', 'BR'),
    campo('59', limpar(nome || 'ESCOLINHA PATOTINA', 25) || 'ESCOLINHA PATOTINA'),
    campo('60', limpar(cidade || 'MATUTINA', 15) || 'MATUTINA'),
    campo('62', campo('05', id)),
    '6304',
  ].join('')
  return partes + crc16(partes)
}

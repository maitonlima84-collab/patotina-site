// Reduz (e opcionalmente recorta) a imagem no próprio celular antes de enviar:
// sobe rápido mesmo com internet ruim e o site carrega leve para quem visita.
// Mesma estratégia do compressImage do OnTrac, com WEBP em vez de JPEG por
// causa dos logos com fundo transparente.
export async function prepararImagem(
  arquivo: File,
  { larguraMax = 800, proporcao }: { larguraMax?: number; proporcao?: number } = {},
): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Formato de imagem não reconhecido. Tente JPG ou PNG.')
  }

  let { width: largura, height: altura } = bitmap
  let x = 0
  let y = 0

  if (proporcao) {
    if (largura / altura > proporcao) {
      const nova = altura * proporcao
      x = (largura - nova) / 2 // corta as laterais em partes iguais
      largura = nova
    } else {
      // Corta por baixo: em foto de gente, o rosto está em cima.
      altura = largura / proporcao
    }
  }

  const escala = Math.min(1, larguraMax / largura)
  const tela = document.createElement('canvas')
  tela.width = Math.round(largura * escala)
  tela.height = Math.round(altura * escala)
  const ctx = tela.getContext('2d')
  if (!ctx) throw new Error('Não deu para preparar a imagem.')
  ctx.drawImage(bitmap, x, y, largura, altura, 0, 0, tela.width, tela.height)
  bitmap.close?.()

  let blob = await gerar(tela, 'image/webp')
  // O Safari (iPhone/Mac) não gera WebP e devolve PNG sem avisar. PNG de foto
  // fica pesado, então vira JPEG; PNG só fica quando há transparência, para o
  // logo não ganhar fundo preto.
  if (blob.type !== 'image/webp' && !temTransparencia(ctx, tela)) blob = await gerar(tela, 'image/jpeg')
  return blob
}

// Extensão do arquivo no Storage conforme o que o navegador conseguiu gerar.
export function extensaoDe(blob: Blob) {
  if (blob.type === 'image/jpeg') return 'jpg'
  if (blob.type === 'image/png') return 'png'
  return 'webp'
}

async function gerar(tela: HTMLCanvasElement, tipo: string) {
  const blob = await new Promise<Blob | null>((r) => tela.toBlob(r, tipo, 0.85))
  if (!blob) throw new Error('Não deu para preparar a imagem.')
  return blob
}

function temTransparencia(ctx: CanvasRenderingContext2D, tela: HTMLCanvasElement) {
  const { data } = ctx.getImageData(0, 0, tela.width, tela.height)
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true
  return false
}

// Desenha os marcadores numerados e as setas sobre cada screenshot. As
// posições vêm do cenas.json (gerado por scripts/capturar-ajuda.mts): cada
// <li data-alvo> da lista de passos aponta para um elemento medido na
// captura, então o número da lista e o número na imagem são o mesmo.
;(function () {
  // Tamanho da bolinha e distância dela até o elemento, em px de tela. Numa
  // imagem larga a bolinha tem 30px; no celular a imagem encolhe e a bolinha
  // encolhe junto (até 20px), senão cobre o que devia apontar.
  let RAIO = 15
  let AFASTAMENTO = 44

  fetch('cenas.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
    .then(montar)
    .catch((e) => console.warn('Guia sem marcadores: cenas.json não carregou.', e))

  function montar(cenas) {
    for (const fig of document.querySelectorAll('figure.cena[data-cena]')) {
      const cena = cenas[fig.dataset.cena]
      const quadro = fig.querySelector('.quadro')
      const img = quadro && quadro.querySelector('img')
      const lista = listaDe(fig)
      if (!cena || !quadro || !img || !lista) continue

      // A imagem chega depois (lazy); a proporção segura o espaço antes.
      img.style.aspectRatio = `${cena.largura} / ${cena.altura}`

      const itens = []
      Array.from(lista.querySelectorAll('li[data-alvo]')).forEach((li, i) => {
        const caixa = cena.alvos[li.dataset.alvo]
        if (!caixa) {
          li.classList.add('sem-alvo')
          return
        }
        itens.push({ li, caixa, n: i + 1 })
      })

      const marcas = document.createElement('div')
      marcas.className = 'marcas'
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'setas')
      svg.setAttribute('aria-hidden', 'true')
      quadro.append(svg, marcas)

      const desenhar = () => desenharCena(quadro, svg, marcas, itens)
      new ResizeObserver(desenhar).observe(quadro)
      desenhar()
    }
  }

  // A lista de passos que explica a figura: a <ol> logo depois dela, ou, nas
  // cenas lado a lado, a <ol> do bloco de texto vizinho.
  function listaDe(fig) {
    let el = fig.nextElementSibling
    while (el && !el.matches('ol.passos')) {
      const dentro = el.querySelector && el.querySelector('ol.passos')
      if (dentro) return dentro
      el = el.nextElementSibling
    }
    return el
  }

  function desenharCena(quadro, svg, marcas, itens) {
    const W = quadro.clientWidth
    const H = quadro.clientHeight
    if (!W || !H) return
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.innerHTML = ''
    marcas.innerHTML = ''
    const bolaPx = Math.max(20, Math.min(30, Math.round((30 * W) / 900)))
    RAIO = bolaPx / 2
    AFASTAMENTO = Math.round(bolaPx * 1.45)
    quadro.style.setProperty('--bola', `${bolaPx}px`)
    // Tela estreita: a bolinha não pode sair da imagem (seria cortada pela
    // borda da página); elemento na beirada ganha a bolinha no canto.
    const estreita = W < 600

    const colocadas = []
    const emPx = (caixa) => ({ x: (caixa.x / 100) * W, y: (caixa.y / 100) * H, w: (caixa.w / 100) * W, h: (caixa.h / 100) * H })
    // Os elementos pequenos dos outros passos: a bolinha não pode cobrir o
    // botão do vizinho (a data ao lado das turmas, "Todos presentes" ao lado
    // de "Limpar").
    const vizinhos = itens.map(({ caixa }) => emPx(caixa)).filter((b) => b.w * b.h < 0.1 * W * H)
    for (const { li, caixa, n } of itens) {
      const box = emPx(caixa)
      // Região grande (um bloco, o menu inteiro): só o contorno tracejado e o
      // número no canto. Elemento pequeno (botão, campo): contorno, bolinha ao
      // lado e uma seta até ele.
      const grande = box.w * box.h > 0.1 * W * H || (box.w > 0.45 * W && box.h > 0.25 * H)

      const alvo = document.createElement('div')
      alvo.className = 'alvo' + (grande ? ' grande' : '')
      Object.assign(alvo.style, { left: `${caixa.x}%`, top: `${caixa.y}%`, width: `${caixa.w}%`, height: `${caixa.h}%` })
      marcas.appendChild(alvo)

      let bola
      if (grande) {
        bola = { x: box.x + 4, y: box.y + 4 }
      } else {
        const meioX = box.x + box.w / 2
        const meioY = box.y + box.h / 2
        const esquerda = { x: box.x - AFASTAMENTO, y: meioY, fim: { x: box.x - 2, y: meioY } }
        const direita = { x: box.x + box.w + AFASTAMENTO, y: meioY, fim: { x: box.x + box.w + 2, y: meioY } }
        // Elemento dentro de outro passo (a marca dentro da linha do aluno):
        // a bolinha sai pelo lado de fora da linha, e a linha não conta como
        // obstáculo. Fora isso, a seta vem pela esquerda.
        const dono = vizinhos.find((v) => v !== box && !mesmaCaixa(v, box) && contem(v, box))
        const outros = vizinhos.filter((v) => v !== box && !mesmaCaixa(v, box) && !contem(v, box))
        const candidatas = dono && meioX > dono.x + dono.w / 2 ? [direita, esquerda] : [esquerda, direita]
        bola = candidatas.find((c) => cabe(c, W, H, colocadas, outros, estreita))
        if (bola) desenharSeta(svg, bola, bola.fim)
        // Botões colados uns nos outros (Trancar, Desligar…): não há lado livre,
        // então a bolinha senta no canto do próprio botão, sem seta.
        else bola = { x: box.x + box.w - 4, y: box.y - 4 }
      }
      colocadas.push(bola)

      const el = document.createElement('div')
      el.className = 'bola'
      el.textContent = String(n)
      el.title = li.textContent.trim()
      Object.assign(el.style, { left: `${bola.x}px`, top: `${bola.y}px` })
      marcas.appendChild(el)

      // Passar o mouse num lado acende o outro.
      const acender = (sim) => {
        alvo.classList.toggle('aceso', sim)
        el.classList.toggle('acesa', sim)
        li.classList.toggle('aceso', sim)
      }
      li.addEventListener('mouseenter', () => acender(true))
      li.addEventListener('mouseleave', () => acender(false))
      el.addEventListener('mouseenter', () => acender(true))
      el.addEventListener('mouseleave', () => acender(false))
      el.addEventListener('click', () => li.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }
  }

  // Cabe se a bolinha fica dentro da imagem (com folga), longe das outras
  // bolinhas e sem cobrir o elemento de outro passo.
  function cabe(c, W, H, colocadas, vizinhos, estreita) {
    const folga = estreita ? -RAIO : AFASTAMENTO + RAIO / 2 // pode sair da imagem, como um balão na margem
    if (c.x < -folga || c.y < -folga || c.x > W + folga || c.y > H + folga) return false
    if (!colocadas.every((o) => Math.hypot(o.x - c.x, o.y - c.y) > RAIO * 2 + 6)) return false
    return vizinhos.every((v) => !circuloTocaCaixa(c, RAIO + 3, v))
  }

  function contem(a, b) {
    return a.x <= b.x + 1 && a.y <= b.y + 1 && a.x + a.w >= b.x + b.w - 1 && a.y + a.h >= b.y + b.h - 1
  }

  function mesmaCaixa(a, b) {
    return Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.w - b.w) < 1 && Math.abs(a.h - b.h) < 1
  }

  function circuloTocaCaixa(c, r, b) {
    const px = Math.max(b.x, Math.min(c.x, b.x + b.w))
    const py = Math.max(b.y, Math.min(c.y, b.y + b.h))
    return Math.hypot(c.x - px, c.y - py) < r
  }

  function desenharSeta(svg, de, ate) {
    const dx = ate.x - de.x
    const dy = ate.y - de.y
    const comp = Math.hypot(dx, dy)
    if (comp < RAIO + 6) return
    const ux = dx / comp
    const uy = dy / comp
    // Sai da borda da bolinha, não do centro.
    const ini = { x: de.x + ux * (RAIO + 2), y: de.y + uy * (RAIO + 2) }
    const ponta = 9
    const base = { x: ate.x - ux * ponta, y: ate.y - uy * ponta }

    const linha = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    linha.setAttribute('d', `M${ini.x},${ini.y} L${base.x},${base.y}`)
    linha.setAttribute('vector-effect', 'non-scaling-stroke')
    svg.appendChild(linha)

    const cabeca = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const px = -uy
    const py = ux
    cabeca.setAttribute(
      'points',
      [
        `${ate.x},${ate.y}`,
        `${base.x + px * (ponta * 0.6)},${base.y + py * (ponta * 0.6)}`,
        `${base.x - px * (ponta * 0.6)},${base.y - py * (ponta * 0.6)}`,
      ].join(' '),
    )
    cabeca.setAttribute('class', 'ponta')
    svg.appendChild(cabeca)
  }
})()

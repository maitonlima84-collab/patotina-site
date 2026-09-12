/* ================================================================
   PATOTINA — conteúdo vindo do painel (Firestore) 💙🤍❤️

   O que a escolinha edita em /app aparece aqui. A página já vem com o
   conteúdo escrito no próprio index.html; este módulo troca o miolo das
   seções pelo que está no banco assim que a leitura termina. Se o banco
   não responder, nada é trocado — o site nunca fica vazio.

   Lê só o que está marcado como visível (where visivel == true), que é o
   que as regras do Firestore liberam sem login.
   ================================================================ */

const VERSAO_SDK = '12.19.0';
const CDN = `https://www.gstatic.com/firebasejs/${VERSAO_SDK}`;

const $ = (s, c) => (c || document).querySelector(s);
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);

/* Texto da escolinha com um toque de destaque: *entre asteriscos* fica em negrito. */
const rico = t => esc(t).replace(/\*([^*]+)\*/g, '<b>$1</b>');

/* Títulos das seções: o que vem depois do "|" é a parte dourada. */
function titulo(texto) {
  const [inicio, ...resto] = String(texto || '').split('|');
  return resto.length ? `${esc(inicio)}<span class="gd">${esc(resto.join('|'))}</span>` : esc(inicio);
}

/* "2026-08-04" -> "04 · AGO · 2026" */
function dataCurta(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return esc(iso);
  const d = new Date(`${iso}T12:00:00-03:00`);
  const mes = d.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' }).replace('.', '').toUpperCase();
  return `${iso.slice(8, 10)} · ${mes} · ${iso.slice(0, 4)}`;
}

const wa = (numero, texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

/* ---------------- blocos ---------------- */

function faixa(texto) {
  const t = String(texto || '').trim();
  const m = t.match(/^(\d+)\s*a\s*(\d+)$/i);
  if (m) return `${m[1]} <small>a</small> ${m[2]}`;
  if (/^\d+\+$/.test(t)) return `${t.slice(0, -1)}<small>+</small>`;
  return esc(t);
}

function turmas(lista, numero) {
  return lista.map((t, i) => {
    const treinos = String(t.horarios || '').split('\n').map(l => l.trim()).filter(Boolean).map(linha => {
      const [dia = '', hora = '', local = ''] = linha.split('|').map(p => p.trim());
      return `<li><b>${esc(dia)}</b> ${esc(hora)}${local ? ` <span>${esc(local)}</span>` : ''}</li>`;
    }).join('');
    const msg = t.mensagem || `Olá! Quero informações sobre a turma ${t.nome}${t.faixa ? ` (${t.faixa} anos)` : ''}.`;
    return `<article class="turma${t.destaque ? ' turma--mid' : ''}" data-reveal style="--d:${i * .1}s" data-tilt>
      <div class="turma__shine"></div>
      <span class="turma__age">${faixa(t.faixa)}</span>
      <h3 class="turma__name">${esc(t.nome)}</h3>
      ${t.descricao ? `<p class="turma__desc">${rico(t.descricao)}</p>` : ''}
      ${treinos ? `<ul class="turma__sched">${treinos}</ul>` : ''}
      <a class="btn btn--wa btn--sm" href="${esc(wa(numero, msg))}" target="_blank" rel="noopener"><svg class="ico"><use href="#wa"/></svg> Quero essa turma</a>
    </article>`;
  }).join('');
}

function destaques(lista) {
  const [principal, ...resto] = lista;
  const big = `<div class="story__big">
      <span class="story__badge">⭐ ${dataCurta(principal.publicadoEm)}</span>
      <h3>${esc(principal.titulo)}</h3>
      ${principal.texto ? `<p>${rico(principal.texto)}</p>` : ''}
      ${principal.citacao ? `<blockquote>“${esc(principal.citacao)}”<cite>— Escolinha Patotina</cite></blockquote>` : ''}
      ${principal.link ? `<a class="tl__link" href="${esc(principal.link)}" target="_blank" rel="noopener">Ver mais ↗</a>` : ''}
    </div>`;
  const minis = resto.map(n => `<article class="mini">
      <span class="mini__date">${dataCurta(n.publicadoEm)}</span>
      <h4>${esc(n.titulo)}</h4>
      ${n.texto ? `<p>${rico(n.texto)}</p>` : ''}
      ${n.link ? `<a class="tl__link" href="${esc(n.link)}" target="_blank" rel="noopener">Ver mais ↗</a>` : ''}
    </article>`).join('');
  return { html: big + (minis ? `<div class="story__side">${minis}</div>` : ''), soUm: !minis };
}

function trofeus(lista) {
  return lista.map((t, i) => `<button class="trophy${t.destaque ? ' trophy--gold' : ''}" data-reveal style="--d:${i * .08}s" data-confetti>
      <span class="trophy__icon" aria-hidden="true">${esc(t.icone || '🏆')}</span>
      <span class="trophy__year">${esc(t.ano)}</span>
      <span class="trophy__name">${esc(t.nome)}</span>
      ${t.descricao ? `<span class="trophy__desc">${rico(t.descricao)}</span>` : ''}
    </button>`).join('');
}

function historia(lista) {
  return lista.map(h => `<article class="tl__item${h.destaque ? ' tl__item--big' : ''}" data-reveal>
      <span class="tl__year${h.destaque ? ' gd-bg' : ''}">${esc(h.ano)}</span>
      <div class="tl__card${h.destaque ? ' tl__card--glory' : ''}">
        <h3>${esc(h.titulo)}</h3>
        ${h.texto ? `<p>${rico(h.texto)}</p>` : ''}
        ${h.link ? `<a class="tl__link" href="${esc(h.link)}" target="_blank" rel="noopener">${esc(h.linkTexto || 'Ver mais ↗')}</a>` : ''}
      </div>
    </article>`).join('');
}

function parceiros(lista) {
  return lista.map((p, i) => {
    const [nome, ...resto] = String(p.nome || '').split('|');
    const marca = p.logoUrl
      ? `<img class="sponsor__logo" src="${esc(p.logoUrl)}" alt="${esc(nome.trim())}" loading="lazy" decoding="async">`
      : `<b>${esc(nome.trim())}${resto.length ? ` <span>${esc(resto.join('|').trim())}</span>` : ''}</b>`;
    const miolo = marca + (p.rotulo ? `<small>${esc(p.rotulo)}</small>` : '');
    const classe = `sponsor${p.master ? ' sponsor--master' : ''}`;
    const atraso = ` style="--d:${(i * .05).toFixed(2)}s"`;
    return p.site
      ? `<a class="${classe}" href="${esc(p.site)}" target="_blank" rel="noopener" data-reveal${atraso}>${miolo}</a>`
      : `<div class="${classe}" data-reveal${atraso}>${miolo}</div>`;
  }).join('');
}

function chips(texto) {
  return String(texto || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const ouro = l.startsWith('*');
    return `<span class="chip${ouro ? ' chip--gold' : ''}">${esc(ouro ? l.slice(1).trim() : l)}</span>`;
  }).join('');
}

/* Próximos eventos cadastrados na gestão e marcados para o site. */
function agenda(lista) {
  const TIPOS = { jogo: '⚽ Jogo', festival: '🏆 Festival', viagem: '🚌 Viagem', reuniao: '👨‍👩‍👧 Reunião', sem_treino: '⛔ Sem treino' };
  return lista.map(e => `
    <article class="mini" data-reveal>
      <span class="mini__date">${dataCurta(e.data)}${e.hora ? ' · ' + esc(e.hora) : ''}</span>
      <h4>${esc(e.titulo)}</h4>
      <p class="mini__meta">${esc(TIPOS[e.tipo] || '')}${e.local ? ' · ' + esc(e.local) : ''}</p>
      ${e.descricao ? `<p>${rico(e.descricao)}</p>` : ''}
    </article>`).join('');
}

/* ---------------- montagem ---------------- */

function trocar(seletor, html) {
  const el = $(seletor);
  if (el && html != null) el.innerHTML = html;
}

function contar(id, valor) {
  const el = $(id);
  if (!el) return;
  el.dataset.count = String(valor);
  // Se a faixa já passou pela tela, o contador já rodou: atualiza direto.
  if (el.closest('.stat')?.classList.contains('in')) el.textContent = Number(valor).toLocaleString('pt-BR');
}

function montar({ turmas: ts, destaques: ds, titulos, historia: hs, parceiros: ps, textos: t, eventos: evs }) {
  const numero = String(t.whatsapp || '').replace(/\D/g, '') || '5534988658518';
  const numeroCompleto = numero.startsWith('55') ? numero : `55${numero}`;

  // Todos os botões de WhatsApp passam a usar o número do painel.
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
    a.href = a.href.replace(/wa\.me\/\d+/, `wa.me/${numeroCompleto}`);
  });
  // Junta ao que carregar() já pendurou (gravarPreMatricula) em vez de trocar.
  window.PATOTINA = {
    ...(window.PATOTINA || {}),
    whatsapp: numeroCompleto,
    turmas: ts.map(x => ({
      nome: x.nome, faixa: x.faixa, idadeMin: Number(x.idadeMin), idadeMax: Number(x.idadeMax),
      resumo: [...new Set(String(x.horarios || '').split('\n').map(l => l.split('|')[0]?.trim()).filter(Boolean))].join(' e ').toLowerCase(),
    })),
  };

  // Hero
  if (t.heroEyebrow) trocar('#hero-eyebrow', esc(t.heroEyebrow));
  if (t.heroTag) trocar('#hero-tag', rico(t.heroTag));
  if (t.heroChips) trocar('#hero-chips', chips(t.heroChips));

  // Faixa dourada
  if (t.anosEscolinha) contar('#stat-anos', parseInt(t.anosEscolinha, 10) || 0);
  // Lista vazia = banco ainda sem conteúdo: fica o que está escrito no HTML.
  if (titulos.length) contar('#stat-trofeus', titulos.length);
  if (ts.length) contar('#stat-turmas', ts.length);

  // Turmas
  if (t.turmasTag) trocar('#turmas-tag', esc(t.turmasTag));
  if (t.turmasTitulo) trocar('#turmas-titulo', titulo(t.turmasTitulo));
  if (t.turmasSub) trocar('#turmas-sub', rico(t.turmasSub));
  if (t.turmasNota) trocar('#turmas-nota', rico(t.turmasNota));
  if (ts.length) trocar('#tgrid', turmas(ts, numeroCompleto));

  // Agenda — só aparece com evento futuro marcado para o site.
  const secAgenda = $('#agenda');
  if (secAgenda) {
    const hoje = new Date().toISOString().slice(0, 10);
    const futuros = (evs || []).filter(e => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6);
    if (futuros.length) trocar('#agenda-lista', agenda(futuros));
    secAgenda.hidden = !futuros.length;
  }

  // Destaques — a seção só existe quando há pelo menos um.
  const secDestaques = $('#destaques');
  if (secDestaques) {
    if (ds.length) {
      if (t.destaquesTag) trocar('#destaques-tag', esc(t.destaquesTag));
      if (t.destaquesTitulo) trocar('#destaques-titulo', titulo(t.destaquesTitulo));
      const { html, soUm } = destaques(ds);
      trocar('#story', html);
      $('#story').style.gridTemplateColumns = soUm ? '1fr' : '';
      secDestaques.hidden = false;
    } else {
      secDestaques.hidden = true;
    }
  }

  // Títulos
  if (t.titulosTag) trocar('#titulos-tag', esc(t.titulosTag));
  if (t.titulosTitulo) trocar('#titulos-titulo', titulo(t.titulosTitulo));
  if (titulos.length) trocar('#trophies', trofeus(titulos));

  // Professor
  if (t.professorNome) {
    trocar('#prof-nome', esc(t.professorNome));
    trocar('#prof-ava', esc(t.professorNome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()));
  }
  if (t.professorDesc) trocar('#prof-desc', rico(t.professorDesc));
  const insta = $('#prof-insta');
  if (insta) { if (t.professorInstagram) insta.href = t.professorInstagram; insta.hidden = !t.professorInstagram; }

  // Linha do tempo
  if (hs.length) trocar('#tl', historia(hs));

  // Parceiros
  if (t.parceirosTag) trocar('#parceiros-tag', esc(t.parceirosTag));
  if (t.parceirosTitulo) trocar('#parceiros-titulo', titulo(t.parceirosTitulo));
  if (ps.length) trocar('#sponsors', parceiros(ps));

  // main.js religa os efeitos (reveal, tilt, confete) no que acabou de entrar.
  dispatchEvent(new CustomEvent('patotina:conteudo', { detail: {} }));
}

/* ---------------- leitura ---------------- */

const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

/**
 * Config do Firebase: no ar, o Hosting entrega a do próprio projeto em
 * /__/firebase/init.json (nada para configurar à mão). Na máquina do
 * desenvolvedor, o projeto demo dos emuladores.
 */
async function configuracao() {
  try {
    const r = await fetch('/__/firebase/init.json', { cache: 'no-store' });
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
      const cfg = await r.json();
      if (cfg.projectId) return { cfg, emuladores: cfg.projectId.startsWith('demo-') };
    }
  } catch { /* sem Hosting por perto */ }
  if (LOCAL) return { cfg: { projectId: 'demo-patotina', apiKey: 'demo' }, emuladores: true };
  return null;
}

async function carregar() {
  const conf = await configuracao();
  if (!conf) return; // sem projeto: fica o conteúdo escrito no HTML

  const [{ initializeApp }, fs] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-firestore-lite.js`),
  ]);
  const app = initializeApp(conf.cfg);
  const db = fs.getFirestore(app);
  if (conf.emuladores) fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);

  const visiveis = (nome, campo = 'visivel') => fs.getDocs(fs.query(fs.collection(db, nome), fs.where(campo, '==', true)))
    .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
  const porOrdem = (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0);

  // A pré-matrícula do formulário vai para o app de gestão (coleção
  // pre_matriculas, criação pública validada pelas regras). O WhatsApp abre
  // de qualquer jeito — main.js não espera esta gravação para isso.
  window.PATOTINA = window.PATOTINA || {};
  window.PATOTINA.gravarPreMatricula = dados => fs.addDoc(fs.collection(db, 'pre_matriculas'), {
    crianca: String(dados.crianca || '').slice(0, 80),
    idade: Number(dados.idade) || 0,
    turmaSugerida: String(dados.turmaSugerida || '').slice(0, 80),
    responsavel: String(dados.responsavel || '').slice(0, 80),
    telefone: String(dados.telefone || '').slice(0, 20),
    observacao: String(dados.observacao || '').slice(0, 500),
    situacao: 'nova',
    origem: 'site',
    criadoEm: new Date(),
  });

  const [ts, ds, tis, hs, ps, textos, evs] = await Promise.all([
    visiveis('site_turmas'), visiveis('site_destaques'), visiveis('site_titulos'),
    visiveis('site_historia'), visiveis('site_parceiros'),
    fs.getDoc(fs.doc(db, 'site_config', 'textos')).then(s => (s.exists() ? s.data() : {})),
    visiveis('eventos', 'visivelNoSite').catch(() => []),
  ]);

  montar({
    turmas: ts.sort(porOrdem),
    destaques: ds.sort((a, b) => Number(!!b.principal) - Number(!!a.principal) || String(b.publicadoEm).localeCompare(String(a.publicadoEm))),
    titulos: tis.sort(porOrdem),
    historia: hs.sort(porOrdem),
    parceiros: ps.sort(porOrdem),
    textos: textos || {},
    eventos: evs,
  });
}

carregar().catch(e => console.warn('Conteúdo do painel indisponível; fica o conteúdo fixo da página.', e));

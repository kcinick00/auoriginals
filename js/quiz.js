/* =========================================================
   quiz.js · «Encuentra tu perfume ideal»
   5 preguntas → 1 match + 2 alternativas (+ decant opcional).
   Usa los perfiles de perfiles.js y la API que expone app.js (window.AU).
   ========================================================= */
(function () {
  'use strict';
  if (!window.AU || typeof PERFILES === 'undefined') return;
  const A = window.AU, $ = (s, r = document) => r.querySelector(s);
  const OPC = typeof QUIZ_OPCIONES !== 'undefined' ? QUIZ_OPCIONES : {};

  // iconos de línea (24×24)
  const I = {
    male: '<circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M15 4h5v5"/>',
    female: '<circle cx="12" cy="9" r="5"/><path d="M12 14v8M8.5 18h7"/>',
    both: '<circle cx="9" cy="14" r="4"/><circle cx="16" cy="8" r="4"/><path d="M12 11l1-1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path d="M17 3v3M15.5 4.5h3"/>',
    correr: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
    infinito: '<path d="M12 12c-2-3-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1 5.5-4zm0 0c2 3 3.5 4 5.5 4a4 4 0 0 0 0-8c-2 0-3.5 1-5.5 4z"/>',
    ola: '<path d="M2 9c2.5-3 4.5-3 7 0s4.5 3 7 0 3-2 6 0M2 15c2.5-3 4.5-3 7 0s4.5 3 7 0 3-2 6 0"/>',
    grano: '<ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(35 12 12)"/><path d="M9 6c3 2 0 4 3 6s0 4 3 6"/>',
    arbol: '<path d="M12 3l5 7h-3l4 6H6l4-6H7z"/><path d="M12 16v5"/>',
    flor: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C10 7 10 4 12 3c2 1 2 4 0 6.5zM14.5 12c2.5-2 5.5-2 6.5 0-1 2-4 2-6.5 0zM12 14.5c2 2.5 2 5.5 0 6.5-2-1-2-4 0-6.5zM9.5 12c-2.5 2-5.5 2-6.5 0 1-2 4-2 6.5 0z"/>',
    alta: '<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15"/>',
    media: '<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9"/>',
    suave: '<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14zM5 19l9-9"/>',
    nieve: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>',
    termo: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  };
  const ico = k => `<svg class="q-ico" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;

  const PASOS = [
    { id: 'para', t: '¿Para quién es el perfume?', s: 'Así solo te mostramos lo que corresponde.', ops: [
      { k: 'Hombre', l: 'Para él', d: 'Colección Ellos', i: 'male' },
      { k: 'Mujer', l: 'Para ella', d: 'Colección Ellas', i: 'female' },
      { k: 'Todos', l: 'Me da igual', d: 'Ellos, ellas y unisex', i: 'both' }] },
    { id: 'uso', t: '¿En qué momentos lo vas a usar?', s: 'Define qué tan versátil debe ser.', ops: [
      { k: 'D', l: 'Diario, trabajo o universidad', i: 'sun' },
      { k: 'N', l: 'Citas y eventos de noche', i: 'luna' },
      { k: 'S', l: 'Ejercicio y días calurosos', i: 'correr' },
      { k: 'T', l: 'Mi perfume firma, para todo', i: 'infinito' }] },
    { id: 'fam', t: '¿Qué aromas van más contigo?', s: 'Elige el que te haga sentir mejor.', ops: [
      { k: 'F', l: 'Frescos, cítricos y marinos', i: 'ola' },
      { k: 'D', l: 'Dulces, vainilla y ámbar', i: 'grano' },
      { k: 'M', l: 'Maderas, especias y cuero', i: 'arbol' },
      { k: 'R', l: 'Florales y románticos', i: 'flor' }] },
    { id: 'proy', t: '¿Qué quieres proyectar al caminar?', s: 'Ajusta la intensidad y la estela.', ops: [
      { k: 3, l: 'Que me sientan a distancia', d: 'Proyección alta', i: 'alta' },
      { k: 2, l: 'Elegancia cercana', d: 'Burbuja personal', i: 'media' },
      { k: 1, l: 'Limpieza y sutileza', d: 'Proyección suave', i: 'suave' }] },
    { id: 'clima', t: '¿En qué clima lo usarás más?', s: 'Filtra los aromas pesados o muy volátiles.', ops: [
      { k: 'C', l: 'Cálido, verano, sol', i: 'sun' },
      { k: 'F', l: 'Frío, noches frescas', i: 'nieve' },
      { k: 'T', l: 'Templado, oficina con A/C', i: 'termo' }] },
  ];

  let paso = 0, resp = {}, resultado = null;

  // ---------- puntuación ----------
  const tienePerfil = p => !!(p.perfil || PERFILES[p.id]);
  function perfil(p) {
    const s = p.perfil || PERFILES[p.id];
    if (!s) return { fam: p.genero === 'Mujer' ? 'RD' : 'FM', proy: 2, clima: 'T', uso: 'DNS', neutro: true };
    const [f, pr, c, u] = s.split('|');
    return { fam: f, proy: +pr, clima: c, uso: u === 'T' ? 'DNS' : u };
  }
  function puntuar(p) {
    const pf = perfil(p), r = resp, razones = []; let pts = 0;
    // familia olfativa (máx. 4)
    if (pf.fam[0] === r.fam) { pts += 4; razones.push(['fam', 4]); } else if (pf.fam[1] === r.fam) { pts += 2; razones.push(['fam', 2]); }
    // momento de uso (máx. 3)
    if (r.uso === 'T') { pts += pf.uso.length >= 2 ? 3 : 2; razones.push(['uso', 2]); } else if (pf.uso.includes(r.uso)) { pts += 3; razones.push(['uso', 3]); }
    // proyección (máx. 3)
    const dp = Math.abs(pf.proy - r.proy); pts += dp === 0 ? 3 : dp === 1 ? 1 : 0; if (dp === 0) razones.push(['proy', 3]);
    // clima (máx. 3)
    if (pf.clima === r.clima) { pts += 3; razones.push(['clima', 3]); } else if (pf.clima === 'T' || r.clima === 'T') pts += 1.5;
    // concentración (máx. 1): la noche pide parfum, el calor/deporte pide toilette
    if (r.uso === 'N' && /parfum/i.test(p.presentacion)) pts += 1; if (r.uso === 'S' && /toilette/i.test(p.presentacion)) pts += 1;
    return { p, pts, razones, perfil: pf };
  }
  function calcular() {
    const cand = A.PRODUCTOS.filter(p => p.stock > 0 && (resp.para === 'Todos' || p.genero === resp.para || p.genero === 'Unisex'));
    const pool = (cand.length ? cand : A.PRODUCTOS.filter(p => p.stock > 0)).map(puntuar);
    pool.sort((a, b) => b.pts - a.pts || (A.DESTACADOS.indexOf(a.p.id) + 1 || 999) - (A.DESTACADOS.indexOf(b.p.id) + 1 || 999) || a.p.orden - b.p.orden);
    const mejor = pool[0], alt = [];
    for (const c of pool.slice(1)) {                                    // alternativas de otras casas, si hay cerca
      if (alt.length === 2) break;
      if (c.p.marca !== mejor.p.marca && !alt.some(x => x.p.marca === c.p.marca) && c.pts >= mejor.pts - 6) alt.push(c);
    }
    for (const c of pool.slice(1)) { if (alt.length === 2) break; if (!alt.includes(c)) alt.push(c); }
    const max = 14, pct = x => Math.max(40, Math.min(99, Math.round(x.pts / max * 100)));
    return { mejor: Object.assign(mejor, { pct: pct(mejor) }), alt: alt.map(x => Object.assign(x, { pct: pct(x) })) };
  }

  // ---------- pantallas ----------
  const cuerpo = () => $('#quiz-cuerpo');
  const FAM_TXT = { F: 'Aroma fresco', D: 'Aroma dulce', M: 'Maderas y especias', R: 'Aroma floral' };
  function etiquetas(x) {
    const t = [], r = x.razones.map(z => z[0]);
    if (r.includes('fam')) t.push(FAM_TXT[resp.fam]);
    if (r.includes('uso')) t.push({ D: 'Ideal para el día', N: 'Para la noche', S: 'Frescura para el calor', T: 'Para todo uso' }[resp.uso]);
    if (r.includes('proy')) t.push({ 3: 'Proyección alta', 2: 'Elegancia cercana', 1: 'Suave y limpio' }[resp.proy]);
    if (r.includes('clima')) t.push({ C: 'Va con el calor', F: 'Va con el frío', T: 'Clima templado' }[resp.clima]);
    return t.slice(0, 4);
  }

  function pintarPregunta() {
    const q = PASOS[paso];
    $('#quiz-paso').textContent = `Pregunta ${paso + 1} de ${PASOS.length}`;
    $('#quiz-barra').style.width = ((paso + 1) / PASOS.length * 100) + '%';
    $('#quiz-atras').hidden = paso === 0;
    cuerpo().innerHTML = `<div class="q-pregunta" key="${paso}">
      <h2>${A.esc(q.t)}</h2><p>${A.esc(q.s)}</p>
      <div class="q-ops${q.ops.length === 3 ? ' tres' : ''}">${q.ops.map(o => `<button type="button" class="q-op${resp[q.id] === o.k ? ' sel' : ''}" data-k="${o.k}">${ico(o.i)}<span class="q-l">${A.esc(o.l)}</span>${o.d ? `<span class="q-d">${A.esc(o.d)}</span>` : ''}</button>`).join('')}</div>
    </div>`;
    cuerpo().scrollTop = 0;
  }

  function tarjetaAlt(x, n) {
    const p = x.p;
    return `<article class="card q-alt" data-id="${p.id}" style="--tinte:${Frascos.tinte(p)}" tabindex="0">
      <div class="card-vis"><div class="card-tags"><span class="tag">${n}ª opción · ${x.pct}%</span></div>${Frascos.visual(p, { decorativo: true })}</div>
      <div class="card-info"><span class="card-marca">${A.esc(p.marca)}</span><h3 class="card-nombre">${A.esc(p.nombre)}</h3>
        <span class="card-meta">${A.esc(p.presentacion)} · ${A.esc(p.tamano)}</span>
        <div class="card-pie"><div class="precio">${A.precioHTML(p)}</div>
        <button class="btn-add" type="button" data-add="${p.id}" aria-label="Añadir a la bolsa: ${A.esc(p.nombre)}"><svg viewBox="0 0 16 16"><path d="M8 2v12M2 8h12"/></svg></button></div></div>
    </article>`;
  }

  function pintarResultado() {
    $('#quiz-paso').textContent = 'Tu resultado';
    $('#quiz-barra').style.width = '100%'; $('#quiz-atras').hidden = false;
    const m = resultado.mejor, p = m.p;
    const wa = A.waURL(`Hola AU Originals ✨\nHice el quiz y me salió: ${p.marca} · ${p.nombre} (${p.presentacion} ${p.tamano}). ¿Sigue disponible?`);
    const waDecant = A.waURL(`Hola AU Originals ✨\nMe interesa probar ${p.marca} · ${p.nombre} antes de comprarlo. ¿Tienes decant de 5 ml o 10 ml?`);
    cuerpo().innerHTML = `<div class="q-res">
      <span class="eyebrow">Tu match perfecto · ${m.pct}% de coincidencia</span>
      <h2>${A.esc(p.nombre)}</h2>
      <div class="q-match card" data-id="${p.id}" style="--tinte:${Frascos.tinte(p)}">
        <div class="card-vis">${Frascos.visual(p, { decorativo: true })}</div>
        <div class="q-info">
          <span class="card-marca">${A.esc(p.marca)}</span>
          <span class="card-meta">${A.esc(p.presentacion)} · ${A.esc(p.tamano)} · ${p.genero === 'Hombre' ? 'Ellos' : p.genero === 'Mujer' ? 'Ellas' : 'Unisex'}</span>
          <div class="q-tags">${etiquetas(m).map(t => `<span>${A.esc(t)}</span>`).join('')}</div>
          <div class="precio q-precio">${A.precioHTML(p, true)}</div>
          <div class="q-acc">
            <button class="btn btn-oro" type="button" data-add="${p.id}">Comprar ahora</button>
            <button class="btn" type="button" data-ficha="${p.id}">Ver ficha</button>
            <a class="btn" href="${wa}" target="_blank" rel="noopener">Preguntar</a>
          </div>
        </div>
      </div>
      ${resultado.alt.length ? `<h3 class="q-sub">Otras opciones para ti</h3><div class="q-alts">${resultado.alt.map((x, i) => tarjetaAlt(x, i + 2)).join('')}</div>` : ''}
      ${OPC.decants ? `<div class="q-decant"><div><strong>¿Indeciso? Pruébalo antes</strong><span>Pregunta por el decant de 5 ml o 10 ml de ${A.esc(p.nombre)}.</span></div><a class="btn" href="${waDecant}" target="_blank" rel="noopener">Pedir decant</a></div>` : ''}
      <div class="q-fin"><button class="btn" type="button" id="q-repetir">Repetir el quiz</button><button class="btn" type="button" data-catalogo>Ver todo el catálogo</button></div>
    </div>`;
    cuerpo().scrollTop = 0;
  }

  // ---------- flujo ----------
  function abrir(reiniciar) {
    if (reiniciar || !resultado) { paso = 0; resp = {}; resultado = null; }
    resultado ? pintarResultado() : pintarPregunta();
    A.abrirCapa('quiz');
  }
  function elegir(k) {
    const q = PASOS[paso]; resp[q.id] = /^\d+$/.test(k) ? +k : k;
    [...document.querySelectorAll('.q-op')].forEach(b => b.classList.toggle('sel', b.dataset.k === String(k)));
    setTimeout(() => {
      if (paso < PASOS.length - 1) { paso++; pintarPregunta(); }
      else { resultado = calcular(); pintarResultado(); }
    }, 260);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-quiz]'); if (b) { e.preventDefault(); abrir(false); return; }
    if (!$('#quiz').classList.contains('on')) return;
    const op = e.target.closest('.q-op'); if (op) return elegir(op.dataset.k);
    const add = e.target.closest('[data-add]'); if (add) { A.agregar(add.dataset.add); if (add.classList.contains('btn-oro')) A.abrirCapa('bolsa'); return; }
    const fi = e.target.closest('[data-ficha]'); if (fi) { A.abrirFicha(fi.dataset.ficha); return; }
    if (e.target.closest('#q-repetir')) { abrir(true); return; }
    if (e.target.closest('[data-catalogo]')) { A.cerrarCapa(); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); return; }
    const alt = e.target.closest('.q-alt'); if (alt) A.abrirFicha(alt.dataset.id);
  });
  $('#quiz-atras').addEventListener('click', () => {
    if (resultado) { resultado = null; paso = PASOS.length - 1; pintarPregunta(); }
    else if (paso > 0) { paso--; pintarPregunta(); }
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('q-alt')) { e.preventDefault(); A.abrirFicha(e.target.dataset.id); }
  });
  // ---------- "alternativa similar a menor precio" en la ficha ----------
  const ALT = typeof ALTERNATIVAS !== 'undefined' ? ALTERNATIVAS : {};   // {id: id-de-la-alternativa} para elegirla a mano
  function similitud(a, b) {
    let s = 0;
    if (a.fam[0] === b.fam[0]) s += 4; else if (a.fam[0] === b.fam[1] || a.fam[1] === b.fam[0]) s += 2;
    if (a.fam[1] && a.fam[1] === b.fam[1]) s += 1;
    const dp = Math.abs(a.proy - b.proy); s += dp === 0 ? 2 : dp === 1 ? 1 : 0;
    s += a.clima === b.clima ? 2 : (a.clima === 'T' || b.clima === 'T') ? 1 : 0;
    if ([...a.uso].some(u => b.uso.includes(u))) s += 2;
    return s;
  }
  function alternativaDe(p) {
    const elegida = p.alternativa || ALT[p.id];
    if (elegida === 'ninguna') return null;
    const man = elegida && elegida !== 'auto' && A.PRODUCTOS.find(x => x.id === elegida && x.stock > 0);
    if (man) return man;
    if (!tienePerfil(p) || p.precio < 45) return null;                  // solo tiene sentido en perfumes de precio alto
    const pa = perfil(p);
    const c = A.PRODUCTOS.filter(x => x.id !== p.id && x.stock > 0 && tienePerfil(x) && (x.genero === p.genero || x.genero === 'Unisex' || p.genero === 'Unisex')
      && x.precio <= p.precio * 0.8 && p.precio - x.precio >= 10)
      .map(x => ({ x, s: similitud(pa, perfil(x)) })).filter(o => o.s >= 9 && perfil(o.x).fam[0] === pa.fam[0]);   // misma familia principal
    c.sort((a, b) => b.s - a.s || a.x.precio - b.x.precio);
    return c.length ? c[0].x : null;
  }
  window.AU_ficha = function (p) {
    const box = $('#ficha-alt'); if (!box) return;
    const alt = alternativaDe(p);
    if (!alt) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = `<span class="fa-t">Alternativa similar a menor precio</span>
      <button type="button" class="fa-b" data-alt="${alt.id}"><span><b>${A.esc(alt.marca)} · ${A.esc(alt.nombre)}</b><small>${A.esc(alt.presentacion)} · ${A.esc(alt.tamano)}</small></span><span class="fa-p">${A.fmtUSD(alt.precio)}<small>ahorras ${A.fmtUSD(Math.round((p.precio - alt.precio) * 100) / 100)}</small></span></button>
      <p class="fa-n">Es un perfume distinto, con un perfil olfativo parecido. No es una copia ni tiene el mismo aroma exacto.</p>`;
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-alt]'); if (b) A.abrirFicha(b.dataset.alt); });

})();

// =========================================================
// app.js · AU Originals by Ale Urdaneta
// Catálogo, filtros, ficha de producto, bolsa y pedido por WhatsApp.
// =========================================================
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const PRODUCTOS = CATALOGO.filter(p => !p.oculto).map((p, i) => Object.assign({ orden: i }, p));
  const PORID = Object.fromEntries(PRODUCTOS.map(p => [p.id, p]));
  // Tasa euro BCV: arranca con la última guardada (o la de config.js) y se actualiza en línea.
  let TASA = Number(CONFIG.tasaBs) || 0;
  let TASA_FECHA = '';

  // Perfumes que abren el orden "Destacados" (por id de catalogo.js)
  const DESTACADOS = [
    'valentino-donna-born-in-roma-purple-melancholia', 'al-haramain-amber-oud-gold-edition',
    'versace-dylan-blue-pour-homme',
    'lattafa-yara', 'lattafa-asad', 'montblanc-emblem', 'armaf-club-de-nuit-intense-man',
    'lattafa-bade-e-al-oud-amethyst', 'montale-boise-vanille', 'ferragamo-signorina-misteriosa',
  ];

  // ---------- almacenamiento seguro ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };

  // ---------- formato ----------
  const fmtUSD = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  const fmtBs = n => 'Bs ' + n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const abrev = t => /parfum/i.test(t) ? 'EDP' : /toilette/i.test(t) ? 'EDT' : /set/i.test(t) ? 'Set' : /desodorante/i.test(t) ? 'Spray' : t;
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // ---------- estado ----------
  const estado = {
    genero: 'Todos', q: '', marca: '', tipo: '', orden: 'destacados',
    moneda: store.get('au-moneda', 'USD'),
  };
  let bolsa = store.get('au-bolsa', {});
  // limpia ids que ya no existen o exceden existencia
  Object.keys(bolsa).forEach(id => { const p = PORID[id]; if (!p || p.stock <= 0) delete bolsa[id]; else bolsa[id] = Math.min(bolsa[id], p.stock); });

  const precioHTML = (p, grande) => {
    const usd = fmtUSD(p.precio), bs = TASA ? fmtBs(p.precio * TASA) : '';
    if (estado.moneda === 'BS' && TASA) return `${bs.replace('Bs ', 'Bs ')}<small>${usd}</small>`;
    return `${usd}${bs ? `<small>${bs}</small>` : ''}`;
  };

  // ---------- WhatsApp ----------
  function waURL(texto) {
    const num = String(CONFIG.whatsapp || '').replace(/\D/g, '');
    const base = /^\d{10,15}$/.test(num) ? 'https://wa.me/' + num : 'https://wa.me/';
    return base + '?text=' + encodeURIComponent(texto);
  }

  // ---------- tasa euro BCV automática ----------
  const fmtTasa = n => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtFecha = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Caracas' }); };
  function pintarTasa() {
    const t = TASA ? 'Bs ' + fmtTasa(TASA) : '—';
    $('#tasa-anuncio').textContent = t;
    $('#tasa-pie').textContent = TASA ? fmtTasa(TASA) : '—';
    $('#tasa-fecha').textContent = TASA_FECHA ? ' · ' + TASA_FECHA : '';
  }
  function aplicarTasa(valor, fecha) {
    if (!(valor > 0)) return false;
    TASA = Math.round(valor * 100) / 100; TASA_FECHA = fecha || '';
    pintarTasa(); render(); renderBolsa();
    if (fichaId && capaActiva === 'ficha') $('#ficha-precio').innerHTML = precioHTML(PORID[fichaId]);
    return true;
  }
  async function actualizarTasa() {
    const guardada = store.get('au-tasa-eur', null);
    if (guardada) aplicarTasa(guardada.valor, guardada.fecha);
    if (!CONFIG.tasaAutomatica) return;
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(CONFIG.tasaURL, { signal: ctl.signal, cache: 'no-store' });
      clearTimeout(to);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const reg = Array.isArray(d) ? d.find(x => x.fuente === 'oficial') || d[0] : d;
      const valor = Number(reg && (reg.promedio || reg.venta || reg.compra));
      const fecha = fmtFecha(reg && reg.fechaActualizacion);
      if (aplicarTasa(valor, fecha)) store.set('au-tasa-eur', { valor: TASA, fecha });
    } catch (e) { /* sin conexión: queda la última tasa guardada o la de config.js */ }
  }
  setInterval(actualizarTasa, 30 * 60 * 1000);

  // ---------- encabezados, datos y marquesina ----------
  function prepararInicio() {
    const casas = [...new Set(PRODUCTOS.map(p => p.marca.replace(/\s*\(.*\)/, '').replace(/^Antonio /, '')))].sort((a, b) => a.localeCompare(b, 'es'));
    $('#dato-total').textContent = PRODUCTOS.length;
    $('#dato-casas').textContent = casas.length;
    $('#dato-desde').textContent = fmtUSD(Math.min(...PRODUCTOS.map(p => p.precio)));
    const pista = casas.map(c => `<span>${esc(c)}</span>`).join('');
    $('#casas-pista').innerHTML = pista + pista;

    pintarTasa();
    $('#anio').textContent = new Date().getFullYear();


    // frascos de cada colección: los 3 primeros destacados de ese género
    $$('[data-frascos]').forEach(el => {
      const g = el.dataset.frascos;
      const lista = ordenar(PRODUCTOS.filter(p => p.genero === g), 'destacados').slice(0, 3);
      el.innerHTML = '';
    });
    ['Hombre', 'Mujer', 'Unisex'].forEach(g => {
      const n = PRODUCTOS.filter(p => p.genero === g).length;
      $$(`[data-cuenta="${g}"]`).forEach(e => e.textContent = n + ' fragancias');
      $$(`.n[data-n="${g}"]`).forEach(e => e.textContent = n);
    });
    $$('.n[data-n="Todos"]').forEach(e => e.textContent = PRODUCTOS.length);

    const saludo = CONFIG.saludo + '\nQuisiera asesoría para elegir un perfume.';
    $$('.js-wa').forEach(a => a.href = waURL(saludo));
    const ig = String(CONFIG.instagram || '').replace(/^@/, '');
    if (ig) { const a = $('#footer-ig a'); a.href = 'https://instagram.com/' + ig; a.textContent = 'Instagram @' + ig; }
    else $('#footer-ig').hidden = true;
  }

  // ---------- filtros ----------
  function prepararFiltros() {
    const marcas = [...new Set(PRODUCTOS.map(p => p.marca))].sort((a, b) => a.localeCompare(b, 'es'));
    $('#f-marca').insertAdjacentHTML('beforeend', marcas.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join(''));
    const tipos = [...new Set(PRODUCTOS.map(p => p.presentacion))];
    $('#f-tipo').insertAdjacentHTML('beforeend', tipos.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join(''));

    $$('.chip[data-genero]').forEach(b => b.addEventListener('click', () => { estado.genero = b.dataset.genero; render(); }));
    let t; $('#f-buscar').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value; render(); }, 120); });
    $('#f-marca').addEventListener('change', e => { estado.marca = e.target.value; render(); });
    $('#f-tipo').addEventListener('change', e => { estado.tipo = e.target.value; render(); });
    $('#f-orden').addEventListener('change', e => { estado.orden = e.target.value; render(); });
    $$('.moneda button').forEach(b => b.addEventListener('click', () => {
      estado.moneda = b.dataset.moneda; store.set('au-moneda', estado.moneda); render(); renderBolsa();
    }));
    $('#btn-filtros').addEventListener('click', e => {
      const f = $('#filtros'); const on = !f.classList.contains('abierto');
      f.classList.toggle('abierto', on); e.currentTarget.setAttribute('aria-expanded', on);
    });
    $$('[data-ir-genero]').forEach(a => a.addEventListener('click', () => {
      estado.genero = a.dataset.irGenero; render();
    }));
  }

  function ordenar(lista, modo) {
    const l = lista.slice();
    if (modo === 'precio-asc') l.sort((a, b) => a.precio - b.precio || a.orden - b.orden);
    else if (modo === 'precio-desc') l.sort((a, b) => b.precio - a.precio || a.orden - b.orden);
    else if (modo === 'az') l.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    else if (modo === 'marca') l.sort((a, b) => a.marca.localeCompare(b.marca, 'es') || a.nombre.localeCompare(b.nombre, 'es'));
    else l.sort((a, b) => {
      const ia = DESTACADOS.indexOf(a.id), ib = DESTACADOS.indexOf(b.id);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.orden - b.orden;
    });
    return l;
  }

  function filtrar() {
    const q = norm(estado.q.trim());
    return ordenar(PRODUCTOS.filter(p =>
      (estado.genero === 'Todos' || p.genero === estado.genero) &&
      (!estado.marca || p.marca === estado.marca) &&
      (!estado.tipo || p.presentacion === estado.tipo) &&
      (!q || norm(p.marca + ' ' + p.nombre + ' ' + p.presentacion).includes(q))
    ), estado.orden);
  }

  // ---------- catálogo ----------
  function tarjeta(p) {
    const enBolsa = bolsa[p.id] > 0;
    const agotado = p.stock <= 0;
    const stockTag = agotado ? '<span class="tag tag-stock">Agotado</span>' : '';
    return `<article class="card${agotado ? ' agotado' : ''}" data-id="${p.id}" style="--tinte:${Frascos.tinte(p)}" tabindex="0" aria-label="${esc(p.marca + ' ' + p.nombre)}">
      <div class="card-vis">
        <div class="card-tags"><span class="tag">${abrev(p.presentacion)}</span>${stockTag}</div>
        ${Frascos.visual(p, { decorativo: true })}
      </div>
      <div class="card-info">
        <span class="card-marca">${esc(p.marca)}</span>
        <h3 class="card-nombre">${esc(p.nombre)}</h3>
        <span class="card-meta">${esc(p.presentacion)} · ${esc(p.tamano)} · ${p.genero === 'Hombre' ? 'Ellos' : p.genero === 'Mujer' ? 'Ellas' : 'Unisex'}</span>
        <div class="card-pie">
          <div class="precio">${precioHTML(p)}</div>
          <button class="btn-add${enBolsa ? ' en-bolsa' : ''}" type="button" data-add="${p.id}" ${agotado ? 'disabled' : ''}
            aria-label="${enBolsa ? 'En tu bolsa' : 'Añadir a la bolsa'}: ${esc(p.nombre)}">
            ${enBolsa ? '<svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7"/></svg>' : '<svg viewBox="0 0 16 16"><path d="M8 2v12M2 8h12"/></svg>'}
          </button>
        </div>
      </div>
    </article>`;
  }

  function render() {
    $$('.chip[data-genero]').forEach(b => b.setAttribute('aria-pressed', b.dataset.genero === estado.genero));
    $$('.moneda button').forEach(b => b.setAttribute('aria-pressed', b.dataset.moneda === estado.moneda));
    $('#f-marca').value = estado.marca; $('#f-tipo').value = estado.tipo;
    const lista = filtrar();
    const nombreCol = { Todos: 'la colección', Hombre: 'Ellos', Mujer: 'Ellas', Unisex: 'Unisex' }[estado.genero];
    $('#resultado').textContent = `${lista.length} ${lista.length === 1 ? 'fragancia' : 'fragancias'} · ${nombreCol}`;
    $('#carrusel').innerHTML = ordenar(PRODUCTOS.filter(p => p.stock > 0), 'destacados').slice(0, 10).map(tarjeta).join('');
    $('#grid').innerHTML = lista.length ? lista.map(tarjeta).join('')
      : `<div class="vacio"><strong>Sin coincidencias</strong>Prueba con otra casa o borra la búsqueda.</div>`;
  }

  // ---------- ficha ----------
  let fichaId = null;
  function abrirFicha(id) {
    const p = PORID[id]; if (!p) return; fichaId = id;
    $('#ficha').style.setProperty('--tinte', Frascos.tinte(p));
    $('#ficha-vis').innerHTML = Frascos.visual(p);
    $('#ficha-marca').textContent = p.marca;
    $('#ficha-nombre').textContent = p.nombre;
    $('#ficha-datos').innerHTML = `
      <dt>Concentración</dt><dd>${esc(p.presentacion)}</dd>
      <dt>Contenido</dt><dd>${esc(p.tamano)}</dd>
      <dt>Colección</dt><dd>${p.genero === 'Hombre' ? 'Ellos · Hombre' : p.genero === 'Mujer' ? 'Ellas · Mujer' : 'Unisex'}</dd>${p.stock <= 0 ? '\n      <dt>Disponible</dt><dd>Agotado</dd>' : ''}`;
    $('#ficha-precio').innerHTML = precioHTML(p, true);
    actualizarBotonFicha();
    $('#ficha-wa').href = waURL(`${CONFIG.saludo}\nMe interesa: ${p.marca} · ${p.nombre} (${p.presentacion} ${p.tamano}) · ${fmtUSD(p.precio)}\n¿Sigue disponible?`);
    abrirCapa('ficha');
  }
  function actualizarBotonFicha() {
    const p = PORID[fichaId]; if (!p) return;
    const b = $('#ficha-add'); const n = bolsa[p.id] || 0;
    b.disabled = p.stock <= 0 || n >= p.stock;
    b.textContent = p.stock <= 0 ? 'Agotado' : n >= p.stock ? 'En tu bolsa ✓' : n ? `Añadir otra (${n} en bolsa)` : 'Añadir a la bolsa';
  }

  // ---------- bolsa ----------
  function guardarBolsa() { store.set('au-bolsa', bolsa); }
  function agregar(id) {
    const p = PORID[id]; if (!p || p.stock <= 0) return;
    const n = bolsa[id] || 0;
    if (n >= p.stock) { toast('Ya tienes en tu bolsa todas las unidades de este perfume'); return; }
    bolsa[id] = n + 1; guardarBolsa();
    toast(`${p.nombre} se añadió a tu bolsa`);
    render(); renderBolsa(); actualizarBotonFicha();
  }
  function cambiar(id, d) {
    const p = PORID[id]; if (!p) return;
    const n = Math.max(0, Math.min(p.stock, (bolsa[id] || 0) + d));
    if (n) bolsa[id] = n; else delete bolsa[id];
    guardarBolsa(); render(); renderBolsa(); actualizarBotonFicha();
  }

  function mensajePedido(items, total) {
    const nombre = $('#b-nombre').value.trim(), nota = $('#b-nota').value.trim();
    let m = CONFIG.saludo + '\nQuiero hacer este pedido:\n\n';
    items.forEach(({ p, n }) => { m += `• ${n} × ${p.marca} · ${p.nombre} (${abrev(p.presentacion)} ${p.tamano}) — ${fmtUSD(p.precio * n)}\n`; });
    m += `\nTotal: ${fmtUSD(total)}`;
    if (TASA) m += ` (${fmtBs(total * TASA)} a tasa euro BCV ${fmtTasa(TASA)}${TASA_FECHA ? ' del ' + TASA_FECHA : ''})`;
    if (nombre) m += `\nNombre: ${nombre}`;
    if (nota) m += `\nNota: ${nota}`;
    return m;
  }

  function renderBolsa() {
    const items = Object.entries(bolsa).map(([id, n]) => ({ p: PORID[id], n })).filter(x => x.p);
    const cuenta = items.reduce((s, x) => s + x.n, 0);
    const total = items.reduce((s, x) => s + x.n * x.p.precio, 0);
    const c = $('#bolsa-count'); c.textContent = cuenta; c.dataset.n = cuenta;
    $('#fab').classList.toggle('on', cuenta > 0);
    $('#fab-txt').textContent = `Bolsa · ${cuenta} · ${fmtUSD(total)}`;

    $('#bolsa-items').innerHTML = items.length ? items.map(({ p, n }) => `
      <div class="item">
        <div class="item-vis">${Frascos.visual(p, { decorativo: true })}</div>
        <div style="min-width:0">
          <div class="item-marca">${esc(p.marca)}</div>
          <div class="item-nombre">${esc(p.nombre)}</div>
          <div class="item-meta">${abrev(p.presentacion)} · ${esc(p.tamano)}</div>
        </div>
        <div class="item-der">
          <div class="item-precio">${fmtUSD(p.precio * n)}</div>
          <div class="qty">
            <button type="button" data-menos="${p.id}" aria-label="Quitar uno">−</button>
            <span>${n}</span>
            <button type="button" data-mas="${p.id}" aria-label="Añadir uno" ${n >= p.stock ? 'disabled' : ''}>+</button>
          </div>
        </div>
      </div>`).join('')
      : `<div class="bolsa-vacia"><strong>Tu bolsa está vacía</strong>Añade fragancias desde el catálogo.</div>`;

    $('#bolsa-total').textContent = fmtUSD(total);
    $('#bolsa-total-bs').textContent = TASA ? fmtBs(total * TASA) : '';
    const enviar = $('#b-enviar');
    enviar.setAttribute('aria-disabled', items.length ? 'false' : 'true');
    enviar.href = items.length ? waURL(mensajePedido(items, total)) : '#';
  }

  // ---------- capas ----------
  let capaActiva = null, focoPrevio = null;
  function abrirCapa(cual) {
    focoPrevio = document.activeElement;
    cerrarCapa(true);
    capaActiva = cual;
    const el = cual === 'bolsa' ? $('#panel-bolsa') : $('#ficha');
    el.classList.add('on'); el.setAttribute('aria-hidden', 'false');
    $('#velo').classList.add('on');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const c = el.querySelector('[data-cerrar]'); c && c.focus(); }, 50);
  }
  function cerrarCapa(silencioso) {
    ['#panel-bolsa', '#ficha'].forEach(s => { $(s).classList.remove('on'); $(s).setAttribute('aria-hidden', 'true'); });
    $('#velo').classList.remove('on');
    document.body.style.overflow = '';
    if (!silencioso && focoPrevio && focoPrevio.focus) focoPrevio.focus();
    capaActiva = null;
  }

  // ---------- toast ----------
  let tt;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200);
  }

  // ---------- polvo de lavanda del hero ----------
  function prepararCielo() {
    const cv = $('#cielo'); if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let estrellas = [], w = 0, h = 0, dpr = 1;
    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(w * h / 2600);
      estrellas = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h * .85, r: Math.random() < .08 ? 1.3 : Math.random() * .8 + .2,
        a: Math.random() * .7 + .2, f: Math.random() * 2 + .5, o: Math.random() * 6.28,
        c: Math.random() < .2 ? '221,185,104' : (Math.random() < .5 ? '196,170,250' : '243,236,252'),
      }));
    }
    function pintar(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of estrellas) {
        const a = quieto ? s.a : s.a * (.55 + .45 * Math.sin(t / 1000 * s.f + s.o));
        ctx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y * 1, s.r, 0, 6.283); ctx.fill();
      }
    }
    let visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(cv);
    function bucle(t) { if (visible) pintar(t); requestAnimationFrame(bucle); }
    medir(); pintar(0);
    window.addEventListener('resize', () => { medir(); pintar(performance.now()); });
    if (!quieto) requestAnimationFrame(bucle);
  }

  // ---------- eventos ----------
  function eventos() {
    [$('#grid'), $('#carrusel')].forEach(zona => {
      zona.addEventListener('click', e => {
        const add = e.target.closest('[data-add]');
        if (add) { e.stopPropagation(); agregar(add.dataset.add); return; }
        const card = e.target.closest('.card'); if (card) abrirFicha(card.dataset.id);
      });
      zona.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); abrirFicha(e.target.dataset.id); }
      });
    });
    $('#bolsa-items').addEventListener('click', e => {
      const m = e.target.closest('[data-menos]'), p = e.target.closest('[data-mas]');
      if (m) cambiar(m.dataset.menos, -1); if (p) cambiar(p.dataset.mas, +1);
    });
    $('#ficha-add').addEventListener('click', () => fichaId && agregar(fichaId));
    $('#btn-bolsa').addEventListener('click', () => abrirCapa('bolsa'));
    $('#fab').addEventListener('click', () => abrirCapa('bolsa'));
    $('#velo').addEventListener('click', () => cerrarCapa());
    $('#ficha').addEventListener('click', e => { if (e.target.id === 'ficha') cerrarCapa(); });
    $$('[data-cerrar]').forEach(b => b.addEventListener('click', () => cerrarCapa()));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && capaActiva) cerrarCapa(); });
    ['#b-nombre', '#b-nota'].forEach(s => $(s).addEventListener('input', renderBolsa));
    $('#b-enviar').addEventListener('click', e => {
      if (e.currentTarget.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
      toast('Abriendo WhatsApp con tu pedido…');
    });
  }

  // ---------- arranque ----------
  prepararCielo();
  prepararInicio();
  prepararFiltros();
  eventos();
  render();
  renderBolsa();
  actualizarTasa();

  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude|claudeusercontent/.test(location.hostname)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();

/* =========================================================
   tema.js · Aplica la apariencia elegida en ajustes.js
   (fuentes, paleta de colores y modelo de página).
   Lo usan la tienda (se aplica sola) y el panel admin (solo funciones).
   Vista previa sin publicar:  index.html?vista=<ajustes en JSON>
   ========================================================= */
(function () {
  'use strict';
  const FUENTES = {
    'Roboto':             { q: 'ital,wght@0,300;0,400;0,500;0,700;1,300;1,400', tipo: 'sans' },
    'Poppins':            { q: 'ital,wght@0,300;0,400;0,500;1,300;1,400', tipo: 'sans' },
    'Montserrat':         { q: 'ital,wght@0,300;0,400;0,500;1,300;1,400', tipo: 'sans' },
    'Lato':               { q: 'ital,wght@0,300;0,400;0,700;1,300;1,400', tipo: 'sans' },
    'Open Sans':          { q: 'ital,wght@0,300;0,400;0,600;1,300;1,400', tipo: 'sans' },
    'Raleway':            { q: 'ital,wght@0,300;0,400;0,500;1,300;1,400', tipo: 'sans' },
    'Inter':              { q: 'wght@300;400;500', tipo: 'sans' },
    'DM Sans':            { q: 'ital,wght@0,300;0,400;0,500;1,300;1,400', tipo: 'sans' },
    'Jost':               { q: 'ital,wght@0,300;0,400;0,500;1,300;1,400', tipo: 'sans' },
    'Playfair Display':   { q: 'ital,wght@0,400;0,500;1,400;1,500', tipo: 'serif' },
    'Cormorant Garamond': { q: 'ital,wght@0,300;0,400;0,500;1,300;1,400', tipo: 'serif' },
    'Bodoni Moda':        { q: 'ital,wght@0,400;0,500;1,400', tipo: 'serif' },
  };
  // bg = fondo · fg = texto · a = acento principal (botones, precios, logo) · b = acento 2 (brillos) · c = acento suave (detalles)
  const PALETAS = {
    'violeta':    { nombre: 'Violeta',     bg: '#09040F', fg: '#F3ECFC', a: '#DDB968', b: '#8A46F0', c: '#B79CF2' },
    'medianoche': { nombre: 'Medianoche',  bg: '#06060B', fg: '#ECE8F3', a: '#E2C084', b: '#6E5BD6', c: '#9AA7F0' },
    'rosa':       { nombre: 'Rosa y oro',  bg: '#14070E', fg: '#FBEFF3', a: '#E8B89F', b: '#D6457A', c: '#F0A8C8' },
    'esmeralda':  { nombre: 'Esmeralda',   bg: '#04100C', fg: '#EEF8F3', a: '#D9C27A', b: '#1FA67A', c: '#7FE0BE' },
    'negro-oro':  { nombre: 'Negro y oro', bg: '#0A0A0A', fg: '#F5F1E6', a: '#D4AF37', b: '#8C6B1F', c: '#F1D98A' },
    'marfil':     { nombre: 'Marfil',      bg: '#FAF6EF', fg: '#1E1A24', a: '#8A6420', b: '#6B3FD0', c: '#7A5CC4' },
  };
  const MODELOS = {
    'sello':    { nombre: 'Sello',    desc: 'Portada en dos columnas con el logo grande a la derecha.' },
    'centrado': { nombre: 'Centrado', desc: 'Todo centrado: logo arriba y textos al medio. Muy elegante en el teléfono.' },
    'compacto': { nombre: 'Compacto', desc: 'Portada corta para que el catálogo se vea enseguida.' },
  };
  const DEFECTO = { modelo: 'sello', paleta: 'violeta', colores: {}, fuenteTitulos: 'Roboto', fuenteTexto: 'Roboto',
    mostrar: { carrusel: true, casas: true, datos: true }, textos: { eyebrow: '', lead: '' } };
  const fusionar = aj => { aj = aj || {}; const r = Object.assign({}, DEFECTO, aj); r.mostrar = Object.assign({}, DEFECTO.mostrar, aj.mostrar); r.textos = Object.assign({}, DEFECTO.textos, aj.textos); r.colores = aj.colores || {}; return r; };

  const hex = h => { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16); return isFinite(n) && h.length === 6 ? [n >> 16 & 255, n >> 8 & 255, n & 255] : [0, 0, 0]; };
  const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mezcla = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = h => { const c = hex(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const rgb = h => hex(h).join(',');

  function paletaDe(aj) {
    if (aj.paleta === 'personalizada') {
      const c = aj.colores || {}, p = PALETAS.violeta;
      const a = c.acento || p.a, b = c.acento2 || p.b;
      return { bg: c.fondo || p.bg, fg: c.texto || p.fg, a: a, b: b, c: mezcla(b, lum(c.fondo || p.bg) > .5 ? '#000000' : '#FFFFFF', .35) };
    }
    return PALETAS[aj.paleta] || PALETAS.violeta;
  }

  function variables(aj) {
    aj = fusionar(aj);
    const p = paletaDe(aj), claro = lum(p.bg) > .5;
    const fam = n => "'" + (FUENTES[n] ? n : 'Roboto') + "'," + ((FUENTES[n] || {}).tipo === 'serif' ? "Georgia,'Times New Roman',serif" : "system-ui,'Segoe UI',Arial,sans-serif");
    const v = {
      '--bg': p.bg, '--bg-2': mezcla(p.bg, p.fg, claro ? .035 : .045), '--surface': mezcla(p.bg, p.fg, claro ? .075 : .085), '--surface-2': mezcla(p.bg, p.fg, claro ? .12 : .14),
      '--deep': claro ? mezcla(p.bg, p.fg, .06) : mezcla(p.bg, '#000000', .45),
      '--fg': p.fg, '--muted': mezcla(p.fg, p.bg, claro ? .42 : .38),
      '--gold': p.a, '--gold-deep': mezcla(p.a, '#000000', .25), '--gold-soft': 'rgba(' + rgb(p.a) + ',.15)',
      '--violet': p.b, '--violet-soft': 'rgba(' + rgb(p.b) + ',' + (claro ? .14 : .26) + ')', '--lav': p.c,
      '--line': 'rgba(' + rgb(p.fg) + ',' + (claro ? .13 : .11) + ')', '--line-strong': 'rgba(' + rgb(p.fg) + ',' + (claro ? .3 : .26) + ')',
      '--on-gold': lum(p.a) > .38 ? mezcla(p.bg, '#000000', .5) : '#FFFFFF',
      '--accent-rgb': rgb(p.a), '--second-rgb': rgb(p.b), '--lav-rgb': rgb(p.c), '--bg-rgb': rgb(p.bg), '--surface-rgb': rgb(mezcla(p.bg, p.fg, .085)), '--fg-rgb': rgb(p.fg),
      '--ped-1': mezcla('#FFFFFF', p.c, .05), '--ped-2': mezcla('#FFFFFF', p.c, .3), '--ped-3': mezcla('#FFFFFF', p.c, .55),
      '--ped-ink': mezcla(p.b, '#000000', .45), '--ped-ink-rgb': rgb(mezcla(p.b, '#000000', .45)),
      '--f-display': fam(aj.fuenteTitulos), '--f-sans': fam(aj.fuenteTexto),
    };
    return { vars: v, claro: claro, bg: p.bg };
  }

  function urlFuentes(aj) {
    const nombres = [...new Set([aj.fuenteTitulos, aj.fuenteTexto].map(n => FUENTES[n] ? n : 'Roboto'))];
    return 'https://fonts.googleapis.com/css2?' + nombres.map(n => 'family=' + n.replace(/ /g, '+') + ':' + FUENTES[n].q).join('&') + '&display=swap';
  }

  function aplicar(aj, raiz) {
    aj = fusionar(aj);
    const r = variables(aj), el = raiz || document.documentElement;
    if (raiz) { Object.keys(r.vars).forEach(k => el.style.setProperty(k, r.vars[k])); return r; }
    let st = document.getElementById('tema-vars');
    if (!st) { st = document.createElement('style'); st.id = 'tema-vars'; document.head.appendChild(st); }
    st.textContent = 'html:root{color-scheme:' + (r.claro ? 'light' : 'dark') + ';' + Object.keys(r.vars).map(k => k + ':' + r.vars[k]).join(';') + '}';
    el.dataset.modelo = MODELOS[aj.modelo] ? aj.modelo : 'sello';
    el.dataset.ocultar = Object.keys(aj.mostrar).filter(k => aj.mostrar[k] === false).join(' ');
    const poner = () => ['eyebrow', 'lead'].forEach(k => { const n = document.querySelector('[data-t="' + k + '"]'); if (!n) return; if (n.dataset.orig == null) n.dataset.orig = n.textContent; n.textContent = String(aj.textos[k] || '').trim() || n.dataset.orig; });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner); else poner();
    let lk = document.getElementById('tema-fuentes');
    if (!lk) { lk = document.createElement('link'); lk.id = 'tema-fuentes'; lk.rel = 'stylesheet'; document.head.appendChild(lk); }
    lk.href = urlFuentes(aj);
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.content = r.bg);
    let cs = document.querySelector('meta[name="color-scheme"]');
    if (cs) cs.content = r.claro ? 'light' : 'dark';
    return r;
  }

  window.TEMA = { FUENTES, PALETAS, MODELOS, DEFECTO, fusionar, variables, urlFuentes, aplicar };

  if (document.documentElement.dataset.temaAuto !== 'no') {
    let aj = typeof AJUSTES !== 'undefined' ? AJUSTES : {};
    try { const q = new URLSearchParams(location.search).get('vista'); if (q) aj = Object.assign({}, aj, JSON.parse(q)); } catch (e) { /* vista inválida: se ignora */ }
    aplicar(aj);
  }
})();

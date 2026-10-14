// =========================================================
// admin.js · Panel privado de AU Originals (admin.html)
// Edita precios, existencias, fotos y datos, y publica los cambios
// guardando catalogo.js e imágenes en el repositorio de GitHub
// (la tienda pública lee de ahí). No hay servidor propio.
// =========================================================
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slug = t => norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const GEN = { Hombre: 'Ellos', Mujer: 'Ellas', Unisex: 'Unisex' };
  const abrev = t => /parfum/i.test(t) ? 'EDP' : /toilette/i.test(t) ? 'EDT' : /set/i.test(t) ? 'Set' : /desodorante/i.test(t) ? 'Spray' : t;
  const CAMPOS = ['id', 'marca', 'nombre', 'presentacion', 'tamano', 'genero', 'stock', 'precio', 'imagen'];

  // ---------- almacenamiento local (solo este teléfono) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('au-admin-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('au-admin-' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };

  // ---------- estado ----------
  const cfg = Object.assign({ repo: '', branch: 'main', token: '' }, store.get('cfg', {}));
  if (!cfg.repo && /\.github\.io$/.test(location.hostname)) {          // adivina el repo si está en GitHub Pages
    const dueno = location.hostname.split('.')[0], carpeta = location.pathname.split('/')[1];
    cfg.repo = dueno + '/' + (carpeta && !/\.html?$/.test(carpeta) ? carpeta : location.hostname);
  }
  let base = (typeof CATALOGO !== 'undefined' ? CATALOGO : []).map(p => Object.assign({}, p));
  let modo = 'local';                       // 'github' | 'local'
  let cambios = store.get('cambios', {});   // id -> { campo: valor }   (solo lo que cambió)
  let nuevos = store.get('nuevos', []);     // perfumes agregados (objetos completos)
  let fotos = store.get('fotos', {});       // id -> { data: dataURL, tipo: 'jpg' | 'png' }
  let filtro = 'todos', consulta = '', publicando = false;

  const guardar = () => {
    store.set('cambios', cambios); store.set('nuevos', nuevos);
    if (!store.set('fotos', fotos)) toast('La foto es grande: publica antes de cerrar el panel');
  };
  const esNuevo = id => nuevos.some(n => n.id === id);
  const ids = () => new Set([...Object.keys(cambios), ...nuevos.map(n => n.id), ...Object.keys(fotos)]);
  const baseDe = id => base.find(p => p.id === id);

  // perfume tal como se ve ahora (con borradores aplicados)
  function vista(p) {
    const v = Object.assign({}, p, cambios[p.id] || {});
    if (fotos[v.id]) v.imagen = fotos[v.id].data;
    return v;
  }
  const todos = () => base.map(vista).concat(nuevos.map(vista));

  // ---------- utilidades de interfaz ----------
  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); }
  function aviso(txt, tipo) { const a = $('#aviso'); if (!txt) { a.hidden = true; return; } a.textContent = txt; a.className = 'aviso' + (tipo ? ' ' + tipo : ''); a.hidden = false; }
  const precioTxt = n => String(+Number(n).toFixed(2));
  const leerPrecio = s => { const n = parseFloat(String(s).replace(',', '.').replace(/[^0-9.]/g, '')); return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null; };
  const leerStock = s => { const n = parseInt(String(s).replace(/\D/g, ''), 10); return isFinite(n) && n >= 0 ? n : null; };

  function miniatura(p) {
    return p.imagen ? `<img src="${esc(p.imagen)}" alt="" loading="lazy">` : Frascos.svg(p, { decorativo: true });
  }

  // ---------- lista ----------
  function filaHTML(p) {
    const mod = ids().has(p.id);
    return `<article class="fila${mod ? ' mod' : ''}" data-id="${esc(p.id)}">
      <button class="th" type="button" data-editar aria-label="Editar ${esc(p.nombre)}">${miniatura(p)}</button>
      <button class="dat" type="button" data-editar>
        <span class="m">${esc(p.marca)}</span>
        <span class="n">${esc(p.nombre)}</span>
        <span class="x">${esc(abrev(p.presentacion))} · ${esc(p.tamano)} · ${GEN[p.genero] || p.genero}${p.imagen ? '' : ' <span class="tag w">Sin foto</span>'}${esNuevo(p.id) ? ' <span class="tag">Nuevo</span>' : ''}</span>
      </button>
      <div class="ed">
        <label class="precio"><span>$</span><input inputmode="decimal" data-precio value="${precioTxt(p.precio)}" aria-label="Precio de ${esc(p.nombre)}"></label>
        <div class="qty${p.stock <= 0 ? ' cero' : ''}"><button type="button" data-menos aria-label="Una unidad menos">−</button><b>${p.stock}</b><button type="button" data-mas aria-label="Una unidad más">+</button></div>
      </div>
    </article>`;
  }

  function coincide(p) {
    if (filtro === 'sinfoto' && p.imagen) return false;
    if (filtro === 'agotado' && p.stock > 0) return false;
    if (filtro === 'cambios' && !ids().has(p.id)) return false;
    if (['Hombre', 'Mujer', 'Unisex'].includes(filtro) && p.genero !== filtro) return false;
    const q = norm(consulta.trim());
    return !q || norm(p.marca + ' ' + p.nombre).includes(q);
  }

  function render() {
    const lista = todos().filter(coincide);
    $('#lista').innerHTML = lista.length ? lista.map(filaHTML).join('') : '<div class="vacio">No hay perfumes con ese filtro.</div>';
    $('#conteo').textContent = `${lista.length} de ${base.length + nuevos.length} perfumes`;
    $$('#chips button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === filtro));
    actualizarPie();
  }

  function actualizarFila(id) {
    const fila = $(`.fila[data-id="${CSS.escape(id)}"]`);
    const p = todos().find(x => x.id === id);
    if (!fila || !p) return render();
    const tmp = document.createElement('div'); tmp.innerHTML = filaHTML(p);
    fila.replaceWith(tmp.firstElementChild);
    actualizarPie();
  }

  function actualizarPie() {
    const n = ids().size;
    $('#pie').hidden = n === 0;
    $('#pie-n').innerHTML = `<b>${n}</b> ${n === 1 ? 'cambio' : 'cambios'} sin publicar`;
    $('#btn-publicar').disabled = publicando;
  }

  // ---------- editar un campo (borrador) ----------
  function poner(id, campo, valor) {
    if (esNuevo(id)) { nuevos.find(n => n.id === id)[campo] = valor; }
    else {
      const o = baseDe(id); if (!o) return;
      const c = cambios[id] || (cambios[id] = {});
      if (o[campo] === valor || (campo === 'imagen' && !o[campo] && !valor)) delete c[campo]; else c[campo] = valor;
      if (!Object.keys(c).length) delete cambios[id];
    }
    guardar();
  }

  $('#lista').addEventListener('change', e => {
    const fila = e.target.closest('.fila'); if (!fila) return;
    if (e.target.matches('[data-precio]')) {
      const v = leerPrecio(e.target.value);
      if (v === null) { toast('Precio no válido'); return actualizarFila(fila.dataset.id); }
      poner(fila.dataset.id, 'precio', v); actualizarFila(fila.dataset.id);
    }
  });
  $('#lista').addEventListener('click', e => {
    const fila = e.target.closest('.fila'); if (!fila) return;
    const id = fila.dataset.id, p = todos().find(x => x.id === id);
    if (e.target.closest('[data-menos]')) { poner(id, 'stock', Math.max(0, p.stock - 1)); actualizarFila(id); }
    else if (e.target.closest('[data-mas]')) { poner(id, 'stock', p.stock + 1); actualizarFila(id); }
    else if (e.target.closest('[data-editar]')) abrirEditor(id);
  });
  $('#lista').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-precio]')) e.target.blur(); });
  // si una foto recién publicada aún no carga, se muestra el frasco ilustrado
  $('#lista').addEventListener('error', e => {
    if (e.target.tagName !== 'IMG') return;
    const fila = e.target.closest('.fila'), p = fila && todos().find(x => x.id === fila.dataset.id);
    if (p) e.target.replaceWith(Object.assign(document.createElement('span'), { innerHTML: Frascos.svg(p, { decorativo: true }) }).firstChild);
  }, true);

  $('#chips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { filtro = b.dataset.f; render(); } });
  let tq; $('#q').addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => { consulta = e.target.value; render(); }, 120); });

  // ---------- foto: reducir, quitar fondo blanco ----------
  function cargarImagen(file) {
    return new Promise((ok, mal) => {
      const u = URL.createObjectURL(file), im = new Image();
      im.onload = () => { URL.revokeObjectURL(u); ok(im); };
      im.onerror = () => { URL.revokeObjectURL(u); mal(new Error('No se pudo leer la imagen')); };
      im.src = u;
    });
  }

  // Quita el fondo blanco que toca los bordes (no toca blancos del interior de la botella).
  function quitarFondoBlanco(cx, w, h) {
    const img = cx.getImageData(0, 0, w, h), d = img.data, N = w * h, T = 36;
    const blanco = i => d[i] >= 255 - T && d[i + 1] >= 255 - T && d[i + 2] >= 255 - T;
    const bg = new Uint8Array(N), pila = new Int32Array(N); let sp = 0;
    const meter = p => { if (!bg[p] && blanco(p * 4)) { bg[p] = 1; pila[sp++] = p; } };
    for (let x = 0; x < w; x++) { meter(x); meter((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { meter(y * w); meter(y * w + w - 1); }
    while (sp) {
      const p = pila[--sp], x = p % w, y = (p / w) | 0;
      if (x > 0) meter(p - 1); if (x < w - 1) meter(p + 1); if (y > 0) meter(p - w); if (y < h - 1) meter(p + w);
    }
    let fuera = 0;
    for (let p = 0; p < N; p++) {
      const i = p * 4;
      if (bg[p]) { d[i + 3] = 0; fuera++; continue; }
      const x = p % w, y = (p / w) | 0;
      if ((x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (y > 0 && bg[p - w]) || (y < h - 1 && bg[p + w])) {
        const m = Math.min(d[i], d[i + 1], d[i + 2]);
        d[i + 3] = Math.round(255 * Math.max(0, Math.min(1, (255 - m - T * .5) / 70)));   // borde suave
      }
    }
    cx.putImageData(img, 0, 0);
    return fuera / N;
  }

  function recortar(cv) {
    const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return cv;
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * .04), cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2;
    const out = document.createElement('canvas'); out.width = cw; out.height = ch;
    out.getContext('2d').drawImage(cv, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
    return out;
  }

  async function procesarFoto(file, sinFondo) {
    const im = await cargarImagen(file);
    const max = sinFondo ? 900 : 1100, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
    let cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    if (!sinFondo) cx.fillStyle = '#fff', cx.fillRect(0, 0, w, h);
    cx.drawImage(im, 0, 0, w, h);
    if (!sinFondo) return { data: cv.toDataURL('image/jpeg', .86), tipo: 'jpg', nota: '' };
    const quitado = quitarFondoBlanco(cx, w, h);
    if (quitado > .985) return { data: null, nota: 'No se pudo separar la botella del fondo. Desmarca "Quitar fondo" e inténtalo de nuevo.' };
    cv = recortar(cv);
    return { data: cv.toDataURL('image/png'), tipo: 'png', nota: quitado < .02 ? 'El fondo no era blanco, así que se dejó la foto como está.' : '' };
  }

  // ---------- editor ----------
  let ed = null;   // { id, nuevo, file, foto, quitar }
  const dlgEd = $('#hoja-editor');

  function pintarPrev() {
    const p = ed.nuevo ? ed.borrador : todos().find(x => x.id === ed.id);
    const data = ed.foto ? ed.foto.data : (ed.quitar ? '' : p.imagen);
    $('#ed-prev').innerHTML = data ? `<img src="${esc(data)}" alt="Foto del perfume">` : Frascos.svg(Object.assign({}, p, { id: p.id || 'nuevo' }), { decorativo: true });
  }

  function abrirEditor(id) {
    const nuevo = id === null;
    const p = nuevo ? { id: '', marca: '', nombre: '', presentacion: 'Eau de Parfum', tamano: '100 ml', genero: 'Hombre', stock: 1, precio: 0, imagen: '' } : todos().find(x => x.id === id);
    ed = { id, nuevo, borrador: p, file: null, foto: null, quitar: false };
    $('#ed-titulo').textContent = nuevo ? 'Perfume nuevo' : 'Editar perfume';
    $('#ed-marca').value = p.marca; $('#ed-nombre').value = p.nombre; $('#ed-pres').value = p.presentacion;
    $('#ed-tamano').value = p.tamano; $('#ed-genero').value = p.genero; $('#ed-precio').value = nuevo ? '' : precioTxt(p.precio); $('#ed-stock').value = p.stock;
    $('#ed-file').value = ''; $('#ed-foto-msg').textContent = 'Mejor con la botella sola, de frente y sobre fondo blanco.';
    $('#ed-error').hidden = true; pintarPrev();
    dlgEd.showModal();
  }

  async function elegirFoto() {
    const f = $('#ed-file').files[0]; if (!f) return;
    ed.file = f; await aplicarFoto();
  }
  async function aplicarFoto() {
    if (!ed || !ed.file) return;
    $('#ed-foto-msg').textContent = 'Procesando foto…';
    try {
      const r = await procesarFoto(ed.file, $('#ed-sinfondo').checked);
      if (!r.data) { $('#ed-foto-msg').textContent = r.nota; return; }
      ed.foto = r; ed.quitar = false; pintarPrev();
      $('#ed-foto-msg').textContent = r.nota || 'Foto lista. Toca Guardar.';
    } catch (e) { $('#ed-foto-msg').textContent = e.message; }
  }
  $('#ed-file').addEventListener('change', elegirFoto);
  $('#ed-sinfondo').addEventListener('change', aplicarFoto);
  $('#ed-quitar').addEventListener('click', () => { ed.foto = null; ed.file = null; ed.quitar = true; $('#ed-file').value = ''; pintarPrev(); $('#ed-foto-msg').textContent = 'Se quitará la foto y se usará el frasco ilustrado.'; });

  $('#f-editor').addEventListener('submit', e => {
    e.preventDefault();
    const err = m => { const x = $('#ed-error'); x.textContent = m; x.hidden = false; };
    const marca = $('#ed-marca').value.trim(), nombre = $('#ed-nombre').value.trim();
    const precio = leerPrecio($('#ed-precio').value), stock = leerStock($('#ed-stock').value);
    if (!marca || !nombre) return err('Escribe la marca y el nombre.');
    if (precio === null) return err('Escribe un precio válido, por ejemplo 55 o 49.5.');
    if (stock === null) return err('Las existencias deben ser un número entero (0 si está agotado).');
    const datos = { marca, nombre, presentacion: $('#ed-pres').value, tamano: $('#ed-tamano').value.trim() || '100 ml', genero: $('#ed-genero').value, precio, stock };
    let id = ed.id;
    if (ed.nuevo) {
      id = slug(marca + '-' + nombre); let k = 2; const usados = new Set(todos().map(x => x.id));
      while (usados.has(id)) id = slug(marca + '-' + nombre) + '-' + k++;
      nuevos.push(Object.assign({ id, imagen: '' }, datos));
    } else {
      Object.keys(datos).forEach(c => poner(id, c, datos[c]));
    }
    if (ed.foto) { fotos[id] = { data: ed.foto.data, tipo: ed.foto.tipo }; if (!ed.nuevo) { const c = cambios[id]; if (c) { delete c.imagen; if (!Object.keys(c).length) delete cambios[id]; } } }
    else if (ed.quitar) { delete fotos[id]; poner(id, 'imagen', ''); }
    guardar(); dlgEd.close(); render(); toast(ed.nuevo ? 'Perfume agregado a los cambios' : 'Cambios guardados');
  });
  $('#btn-nuevo').addEventListener('click', () => abrirEditor(null));
  $$('dialog [data-cerrar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  // ---------- GitHub ----------
  function b64Texto(s) { const by = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < by.length; i += 0x8000) bin += String.fromCharCode.apply(null, by.subarray(i, i + 0x8000)); return btoa(bin); }
  function textoB64(b) { const bin = atob(b.replace(/\s/g, '')); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))); }
  const conectado = () => /^[\w.-]+\/[\w.-]+$/.test(cfg.repo) && cfg.token.length > 10;

  async function gh(metodo, ruta, cuerpo) {
    const url = `https://api.github.com/repos/${cfg.repo}${ruta}${metodo === 'GET' && ruta.includes('/contents/') ? '?ref=' + encodeURIComponent(cfg.branch) : ''}`;
    let r;
    try {
      r = await fetch(url, {
        method: metodo, cache: 'no-store',
        headers: Object.assign({ Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + cfg.token, 'X-GitHub-Api-Version': '2022-11-28' }, cuerpo ? { 'Content-Type': 'application/json' } : {}),
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
    } catch (e) { const x = new Error('Sin conexión con GitHub. Revisa tu internet e inténtalo otra vez.'); x.status = 0; throw x; }
    if (!r.ok) {
      const msg = r.status === 401 ? 'GitHub no aceptó el token. Puede haber caducado: genera uno nuevo en Ajustes.'
        : r.status === 403 ? 'El token no tiene permiso de escritura (Contents: Read and write) o se alcanzó el límite de GitHub.'
        : r.status === 404 ? 'No se encontró el repositorio o el archivo. Revisa el nombre del repositorio y la rama en Ajustes.'
        : r.status === 409 || r.status === 422 ? 'El catálogo cambió en otro lugar mientras publicabas.'
        : 'GitHub respondió con un error (' + r.status + ').';
      const x = new Error(msg); x.status = r.status; throw x;
    }
    return r.json();
  }

  function parsear(texto) {
    const a = texto.indexOf('[', Math.max(0, texto.indexOf('CATALOGO'))), z = texto.lastIndexOf(']');
    if (a < 0 || z < a) throw new Error('No se pudo leer catalogo.js en GitHub.');
    try { return JSON.parse(texto.slice(a, z + 1).replace(/,(\s*[\]}])/g, '$1')); }
    catch (e) { throw new Error('catalogo.js tiene un error de formato (revisa comas y comillas).'); }
  }
  function serializar(lista) {
    const filas = lista.map(p => {
      const o = {}; CAMPOS.forEach(k => { o[k] = p[k] === undefined ? (k === 'imagen' ? '' : p[k]) : p[k]; });
      Object.keys(p).forEach(k => { if (!(k in o)) o[k] = p[k]; });
      return '  ' + JSON.stringify(o);
    });
    return `// =========================================================
// catalogo.js · AU Originals by Ale Urdaneta
// Lo actualiza el panel admin.html desde el teléfono; también puedes editarlo a mano.
//  - imagen: ruta a una foto, ej. "images/perfumes/asad.png".
//    Si está vacía, se dibuja un frasco ilustrado automáticamente.
//  - stock: unidades disponibles (0 = agotado).
// =========================================================

const CATALOGO = [
${filas.join(',\n')}
];
`;
  }
  async function cargarRemoto() {
    const j = await gh('GET', '/contents/catalogo.js');
    return { lista: parsear(textoB64(j.content)), sha: j.sha };
  }

  // ---------- publicar ----------
  function progreso(txt) { $('#progreso').hidden = !txt; if (txt) $('#progreso-txt').textContent = txt; }

  async function publicar() {
    if (publicando || !ids().size) return;
    if (!conectado()) { aviso('Primero conecta el panel con GitHub (⚙ Ajustes) para poder publicar.', 'mal'); abrirAjustes(); return; }
    publicando = true; actualizarPie(); aviso('');
    const subidas = {};
    try {
      const idsFoto = Object.keys(fotos);
      for (let i = 0; i < idsFoto.length; i++) {
        const id = idsFoto[i], f = fotos[id];
        progreso(`Subiendo foto ${i + 1} de ${idsFoto.length}…`);
        const ruta = `images/perfumes/${id}-${Date.now().toString(36)}.${f.tipo}`;
        await gh('PUT', '/contents/' + ruta, { message: 'Foto: ' + id, content: f.data.split(',')[1], branch: cfg.branch });
        subidas[id] = ruta;
      }
      let ultimo = null;
      for (let intento = 0; intento < 2; intento++) {
        progreso('Guardando catálogo…');
        const remoto = await cargarRemoto();
        const mapa = new Map(remoto.lista.map(p => [p.id, p]));
        const final = remoto.lista.map(p => {
          const v = Object.assign({}, p, cambios[p.id] || {});
          if (subidas[p.id]) v.imagen = subidas[p.id];
          return v;
        });
        nuevos.forEach(n => { if (!mapa.has(n.id)) { const v = Object.assign({}, n); if (subidas[n.id]) v.imagen = subidas[n.id]; final.push(v); } });
        try {
          await gh('PUT', '/contents/catalogo.js', { message: `Catálogo: ${ids().size} ${ids().size === 1 ? 'cambio' : 'cambios'} desde el panel`, content: b64Texto(serializar(final)), sha: remoto.sha, branch: cfg.branch });
          ultimo = final; break;
        } catch (e) { if (!(e.status === 409 || e.status === 422) || intento) throw e; }
      }
      base = ultimo; cambios = {}; nuevos = []; fotos = {}; guardar();
      progreso(''); render();
      aviso('Publicado. Tus clientes verán los cambios en uno o dos minutos.', 'ok');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      progreso(''); aviso(e.message + ' Tus cambios siguen guardados en este teléfono.', 'mal');
    } finally { publicando = false; actualizarPie(); }
  }
  $('#btn-publicar').addEventListener('click', publicar);

  let confirmandoDescarte = false;
  $('#btn-descartar').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!confirmandoDescarte) { confirmandoDescarte = true; b.textContent = '¿Seguro?'; setTimeout(() => { confirmandoDescarte = false; b.textContent = 'Descartar'; }, 3000); return; }
    confirmandoDescarte = false; b.textContent = 'Descartar';
    cambios = {}; nuevos = []; fotos = {}; guardar(); render(); toast('Cambios descartados');
  });

  // ---------- ajustes ----------
  const dlgAj = $('#hoja-ajustes');
  function abrirAjustes() { $('#aj-repo').value = cfg.repo; $('#aj-rama').value = cfg.branch; $('#aj-token').value = cfg.token; $('#aj-error').hidden = true; dlgAj.showModal(); }
  $('#btn-ajustes').addEventListener('click', abrirAjustes);
  $('#estado').addEventListener('click', abrirAjustes);
  $('#f-ajustes').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#aj-error'); err.hidden = true;
    const nuevo = { repo: $('#aj-repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, ''), branch: $('#aj-rama').value.trim() || 'main', token: $('#aj-token').value.trim() };
    if (!/^[\w.-]+\/[\w.-]+$/.test(nuevo.repo)) { err.textContent = 'Escribe el repositorio como usuario/nombre, por ejemplo aleurdaneta/au-originals.'; err.hidden = false; return; }
    if (nuevo.token.length < 10) { err.textContent = 'Pega el token de acceso de GitHub.'; err.hidden = false; return; }
    Object.assign(cfg, nuevo);
    progreso('Probando conexión…');
    try {
      const info = await gh('GET', '');
      if (info.permissions && info.permissions.push === false) throw new Error('El token solo puede leer. Crea uno con permiso Contents: Read and write.');
      const r = await cargarRemoto(); base = r.lista;
      store.set('cfg', cfg); modo = 'github'; pintarEstado(); progreso(''); dlgAj.close(); render();
      aviso('Conectado a ' + cfg.repo + '. Ya puedes publicar cambios.', 'ok');
    } catch (x) { progreso(''); err.textContent = x.message; err.hidden = false; }
  });
  $('#aj-desconectar').addEventListener('click', () => {
    cfg.token = ''; store.set('cfg', cfg); modo = 'local'; base = (typeof CATALOGO !== 'undefined' ? CATALOGO : []).map(p => Object.assign({}, p));
    pintarEstado(); dlgAj.close(); render(); toast('Desconectado de GitHub');
  });
  function pintarEstado() { const s = $('#estado'); s.dataset.modo = modo; s.textContent = modo === 'github' ? 'Conectado' : 'Solo vista'; }

  // ---------- arranque ----------
  async function iniciar() {
    pintarEstado(); render();
    if (!conectado()) { aviso('Estás en modo vista. Toca el engranaje para conectar GitHub y poder publicar.'); return; }
    try {
      const r = await cargarRemoto(); base = r.lista; modo = 'github'; pintarEstado(); render();
    } catch (e) { aviso(e.message + ' Se muestra la última copia conocida; no podrás publicar hasta resolverlo.', 'mal'); }
  }
  window.addEventListener('beforeunload', e => { if (ids().size && publicando) { e.preventDefault(); e.returnValue = ''; } });
  iniciar();
})();

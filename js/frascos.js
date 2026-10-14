// =========================================================
// frascos.js · Ilustra un frasco en SVG para cada perfume.
// Forma según la casa/presentación y color del jugo según el nombre.
// Si un producto tiene "imagen" en catalogo.js, se usa la foto.
// =========================================================
(function (global) {
  let seq = 0;

  const CASAS_ORIENTALES = ['lattafa', 'armaf', 'afnan', 'al haramain', 'maison alhambra', 'reyane', 'paris corner',
    'grandeur', 'le chameau', 'milestone', 'volaré', 'volare', 'montale'];

  // palabra clave -> color del jugo (el primero que coincide gana)
  const TINTES = [
    [/amethyst|purple|melancholia|violet|morado/, '#7A4E95'],
    [/red currant|cherry|strawberry|rosa|pink|candy|can can|yara|olymp|touch of pink|cheesecake/, '#E3A3B0'],
    [/red|rojo|roja|nitro|magic red|cr7/, '#A7262B'],
    [/turquesa|zanzibar|ocean|breeze/, '#3C9AA0'],
    [/blue|azul|sail|dylan|neroli|nautica|marino|ice dive|altitude/, '#2E5B9A'],
    [/black|negra|noir|nuit|night|9pm|intimation|starwalker/, '#2B2629'],
    [/gold|golden|or\b|d'or|amber|1 million|supremacy|cobre|desirable|sublime/, '#C79A3E'],
    [/silver|cold|ice|platin|shaheen|blanca|white|emblem|9am/, '#B9C3CC'],
    [/green|jasmine|forest|verde|sport|tag/, '#5E7F4E'],
    [/naranja|orange|mandarin|sky|victory|pulse/, '#D9853B'],
    [/espresso|bourbon|madera|marrón|marron|teriaq|oud|cuba|boisé|vanill|tobacco|asad|stallion|hunter|club de nuit|milestone/, '#7A4A2A'],
    [/pistache|eclaire|mallow|gourmand|sweet|dream|haya|papillon|louvre|luxe/, '#D8C08A'],
  ];
  const TINTE_GENERO = { Hombre: '#4A5A70', Mujer: '#D7A9A6', Unisex: '#B88A4A' };

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }

  function tinte(p) {
    const t = (p.nombre + ' ' + p.marca).toLowerCase();
    for (const [re, c] of TINTES) if (re.test(t)) return c;
    return TINTE_GENERO[p.genero] || '#B88A4A';
  }

  function forma(p) {
    const n = (p.nombre + ' ' + p.presentacion).toLowerCase();
    const m = p.marca.toLowerCase();
    if (/desodorante/.test(n)) return 'spray';
    if (/set de regalo|collection/.test(n)) return 'set';
    if (/lata/.test(n)) return 'lata';
    if (CASAS_ORIENTALES.some(c => m.includes(c))) return ['oriental', 'redondo', 'oriental', 'columna'][hash(p.id) % 4];
    return ['clasico', 'columna', 'redondo', 'clasico'][hash(p.id) % 4];
  }

  function tapa(p) {
    const k = forma(p);
    if (k === 'oriental') return 'oro';
    return ['oro', 'negra', 'plata', 'oro'][hash(p.marca + p.nombre) % 4];
  }

  const TAPAS = {
    oro: ['#F3DDA6', '#C9A04E', '#7E5F24'],
    negra: ['#5A5357', '#1E1A1C', '#0B090A'],
    plata: ['#F4F6F8', '#B7BEC6', '#6F7780'],
  };

  function defs(id, liq, cap) {
    const t = TAPAS[cap];
    return `<defs>
      <linearGradient id="l${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${liq}" stop-opacity=".55"/>
        <stop offset="1" stop-color="${liq}" stop-opacity=".95"/>
      </linearGradient>
      <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".0"/>
        <stop offset=".18" stop-color="#fff" stop-opacity=".45"/>
        <stop offset=".3" stop-color="#fff" stop-opacity=".05"/>
        <stop offset=".8" stop-color="#000" stop-opacity=".0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".25"/>
      </linearGradient>
      <linearGradient id="c${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${t[2]}"/><stop offset=".35" stop-color="${t[0]}"/>
        <stop offset=".6" stop-color="${t[1]}"/><stop offset="1" stop-color="${t[2]}"/>
      </linearGradient>
    </defs>`;
  }

  // Cuerpo de vidrio: forma -> relleno de jugo + brillo + contorno
  function vidrio(id, d, top, bottom) {
    const aire = top + (bottom - top) * 0.16;
    return `<clipPath id="k${id}"><path d="${d}"/></clipPath>
      <path d="${d}" fill="#fff" fill-opacity=".10"/>
      <g clip-path="url(#k${id})">
        <rect x="0" y="${aire}" width="120" height="${bottom - aire + 4}" fill="url(#l${id})"/>
        <rect x="0" y="${aire - 1}" width="120" height="2.2" fill="#fff" fill-opacity=".35"/>
        <rect x="0" y="0" width="120" height="220" fill="url(#g${id})"/>
      </g>
      <path d="${d}" fill="none" style="stroke:var(--glass-stroke,rgba(255,255,255,.6))" stroke-opacity=".7" stroke-width="1.2"/>`;
  }

  const DIBUJOS = {
    clasico(id) {
      const d = 'M30 84 Q22 84 22 94 L22 200 Q22 210 32 210 L88 210 Q98 210 98 200 L98 94 Q98 84 90 84 Z';
      return `<rect x="50" y="70" width="20" height="16" fill="url(#c${id})" opacity=".85"/>
        <rect x="40" y="22" width="40" height="50" rx="3" fill="url(#c${id})"/>
        <rect x="40" y="62" width="40" height="3" fill="#000" opacity=".18"/>
        ${vidrio(id, d, 84, 210)}
        <rect x="40" y="140" width="40" height="26" rx="1.5" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".3" stroke-width=".6"/>`;
    },
    columna(id) {
      const d = 'M38 70 L82 70 Q86 70 86 76 L86 206 Q86 212 80 212 L40 212 Q34 212 34 206 L34 76 Q34 70 38 70 Z';
      return `<rect x="44" y="8" width="32" height="64" rx="2" fill="url(#c${id})"/>
        <rect x="44" y="56" width="32" height="2" fill="#000" opacity=".2"/>
        ${vidrio(id, d, 70, 212)}
        <line x1="44" y1="190" x2="76" y2="190" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>`;
    },
    redondo(id) {
      const d = 'M60 92 C 100 92 106 124 106 152 C 106 190 86 210 60 210 C 34 210 14 190 14 152 C 14 124 20 92 60 92 Z';
      return `<rect x="51" y="78" width="18" height="18" fill="url(#c${id})" opacity=".9"/>
        <circle cx="60" cy="56" r="24" fill="url(#c${id})"/>
        <ellipse cx="52" cy="47" rx="7" ry="5" fill="#fff" opacity=".35"/>
        ${vidrio(id, d, 92, 210)}`;
    },
    oriental(id) {
      const d = 'M42 92 L78 92 L100 112 L100 190 L78 210 L42 210 L20 190 L20 112 Z';
      return `<rect x="50" y="78" width="20" height="16" fill="url(#c${id})"/>
        <path d="M60 6 L64 20 Q82 30 82 54 L82 66 Q82 80 70 80 L50 80 Q38 80 38 66 L38 54 Q38 30 56 20 Z" fill="url(#c${id})"/>
        <path d="M38 62 L82 62" stroke="#000" stroke-opacity=".2"/>
        <circle cx="60" cy="8" r="3" fill="url(#c${id})"/>
        ${vidrio(id, d, 92, 210)}
        <path d="M60 128 L76 151 L60 174 L44 151 Z" fill="none" stroke="url(#c${id})" stroke-width="1.6"/>
        <path d="M60 138 L69 151 L60 164 L51 151 Z" fill="url(#c${id})" opacity=".7"/>`;
    },
    lata(id) {
      const d = 'M24 40 L96 40 L96 206 Q96 212 90 212 L30 212 Q24 212 24 206 Z';
      return `<path d="${d}" fill="url(#l${id})"/>
        <path d="${d}" fill="url(#g${id})"/>
        <ellipse cx="60" cy="40" rx="36" ry="7" fill="url(#c${id})"/>
        <rect x="24" y="96" width="72" height="1.2" fill="#fff" opacity=".4"/>
        <rect x="24" y="168" width="72" height="1.2" fill="#fff" opacity=".4"/>
        <circle cx="60" cy="132" r="18" fill="none" stroke="#fff" stroke-opacity=".45"/>`;
    },
    spray(id) {
      const d = 'M38 62 L82 62 L82 208 Q82 212 78 212 L42 212 Q38 212 38 208 Z';
      return `<rect x="40" y="22" width="40" height="42" rx="6" fill="url(#c${id})"/>
        <rect x="52" y="12" width="16" height="12" rx="2" fill="url(#c${id})"/>
        <path d="${d}" fill="url(#l${id})"/>
        <path d="${d}" fill="url(#g${id})"/>
        <rect x="38" y="120" width="44" height="40" fill="#fff" fill-opacity=".12"/>`;
    },
    set(id) {
      let out = '';
      [[8, 98], [36, 84], [64, 84], [92, 98]].forEach(([x, y], i) => {
        const d = `M${x + 2} ${y + 22} L${x + 22} ${y + 22} L${x + 22} ${y + 108} Q${x + 22} ${y + 112} ${x + 18} ${y + 112} L${x + 6} ${y + 112} Q${x + 2} ${y + 112} ${x + 2} ${y + 108} Z`;
        out += `<rect x="${x + 5}" y="${y}" width="14" height="24" rx="2" fill="url(#c${id})"/>` + vidrio(id + '_' + i, d, y + 22, y + 112)
          .replace(new RegExp(`url\\(#l${id}_${i}\\)`, 'g'), `url(#l${id})`)
          .replace(new RegExp(`url\\(#g${id}_${i}\\)`, 'g'), `url(#g${id})`);
      });
      return `<g transform="translate(0 6)">${out}</g>`;
    },
  };

  function frascoSVG(p, opts) {
    opts = opts || {};
    const id = 'f' + (++seq);
    const liq = opts.tinte || tinte(p);
    const k = opts.forma || forma(p);
    const cap = opts.tapa || tapa(p);
    const label = opts.decorativo ? 'aria-hidden="true"' : `role="img" aria-label="Frasco ilustrado de ${p.marca} ${p.nombre}"`;
    return `<svg viewBox="0 0 120 220" ${label} xmlns="http://www.w3.org/2000/svg">${defs(id, liq, cap)}${DIBUJOS[k](id)}</svg>`;
  }

  function visual(p, opts) {
    if (p.imagen) return `<img src="${p.imagen}" alt="${p.marca} ${p.nombre}" loading="lazy">`;
    return frascoSVG(p, opts);
  }

  global.Frascos = { svg: frascoSVG, visual, tinte, forma };
})(window);

// Wanna Go · genera las páginas internas (servicios y destinos), el menú, el pie y el bloque SEO
// del inicio y de Marruecos, sitemap.xml y robots.txt.
// Uso, desde sitio/:  node _herramientas/generar.mjs
// Textos: t('español', 'English'). El inglés de cada página llega a i18n.js como WG_EN_PAGE;
// los textos sin t() ya están en el diccionario WG_EN de i18n.js.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const BASE = 'https://feliperpovera.github.io/wannago/'; // cambiar al conectar el dominio propio
const INDEXAR = false; // true al salir en vivo: quita el noindex de todas las páginas
const V = '20261023c';  // sube este número cuando cambies un CSS o JS
const REPO = 'feliperpovera/wannago';
const OAUTH = ''; // URL del servicio de inicio de sesión del panel (Cloudflare Worker); ver LEEME
const WA = 'https://wa.me/573122899185';
const medidas = JSON.parse(readFileSync('fotos/medidas.json', 'utf8'));

const EN = {};
const t = (es, en) => {
  if (es in EN && EN[es] !== en) throw new Error(`Traducción distinta para «${es}»`);
  return EN[es] = en, es;
};
const L = v => typeof v === 'string' ? v : t(v.es, v.en || v.es);
// fotos: acepta 'guatape' o '/_originales/guatape.jpg' (como las guarda el panel)
const nf = f => f.split('/').pop().replace(/\.[a-z]+$/i, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const wa = texto => `${WA}?text=${encodeURIComponent(texto)}`;
let pre = ''; // prefijo relativo de la página en curso: '', '../' o '../../'
const href = ruta => pre + ruta || './';
const img = (foto, alt = '', sizes = '100vw', portada = false) => {
  foto = nf(foto);
  if (!medidas[foto]) throw new Error(`Falta la foto «${foto}»: corre python3 _herramientas/fotos.py`);
  const w = medidas[foto][0];
  return `<img src="${pre}fotos/${foto}.webp" srcset="${pre}fotos/${foto}-800.webp ${Math.round(w / 2)}w, ${pre}fotos/${foto}.webp ${w}w" sizes="${sizes}" alt="${esc(alt)}"${portada ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
};

// ---------- Contenido ----------

const SERVICIOS = [
  { slug: 'viajes-a-la-medida', nombre: 'Viajes a la medida' },
  { slug: 'viajes-grupales', nombre: 'Viajes grupales' },
  { slug: 'eventos-corporativos', nombre: 'Eventos corporativos' },
];

const DATOS = [t('Cómo llegar', 'Getting there'), t('Mejor época', 'Best time'), t('Tiempo sugerido', 'Suggested time'), t('Ideal para', 'Ideal for')];

// Destinos: un archivo por destino en _datos/destinos/ (se editan desde /admin)
const DESTINOS = readdirSync('_datos/destinos').filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync('_datos/destinos/' + f, 'utf8')))
  .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
  .map(d => ({
    slug: d.url, foto: d.foto, foto2: d.foto2, nombre: L(d.nombre), h1: L(d.h1), alt: L(d.alt), alt2: L(d.alt2),
    region: L(d.region), corto: L(d.corto), titulo: L(d.titulo_seo), desc: d.descripcion_seo, lead: L(d.lead), h2: L(d.h2),
    ps: d.parrafos.map(L), vivir: d.vivir.map(v => [L(v.titulo), L(v.texto)]),
    datos: ['llegar', 'epoca', 'tiempo', 'ideal'].map(k => L(d.datos[k])), otros: d.otros || [],
  }));
const D = Object.fromEntries(DESTINOS.map(d => [d.slug, d]));

// Viaje de temporada y cuadros de Colombia: se editan en _datos/viajes.json
const VIAJES = JSON.parse(readFileSync('_datos/viajes.json', 'utf8'));
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }); // AAAA-MM-DD en Colombia
const TEMP = VIAJES.temporadas.find(v => v.activo && (!v.hasta || v.hasta >= hoy)) || null;

// ---------- Datos estructurados ----------

const ORG = {
  '@type': 'TravelAgency', '@id': BASE + '#agencia', name: 'Wanna Go Colombia', url: BASE,
  image: BASE + 'fotos/og/medellin.jpg', telephone: '+57 312 289 9185', email: 'wannagoco@gmail.com',
  foundingDate: '2019', founder: { '@type': 'Person', name: 'María Lucía Vásquez Cock' },
  address: { '@type': 'PostalAddress', streetAddress: 'Cra. 30 #5F-185 Int 701, El Poblado', addressLocality: 'Medellín', addressRegion: 'Antioquia', addressCountry: 'CO' },
  areaServed: { '@type': 'Country', name: 'Colombia' },
  sameAs: ['https://www.instagram.com/wannagocol/'],
};
const migas = lista => ({
  '@type': 'BreadcrumbList',
  itemListElement: lista.map(([nombre, ruta], i) => ({ '@type': 'ListItem', position: i + 1, name: nombre, item: BASE + ruta })),
});

// ---------- Piezas ----------

const ISO = `<span class="lt">Wanna G<i class="iso"></i></span><span class="ds">COLOMBIA</span>`;

const nav = () => `<nav class="nav" id="nav">
  <div class="wrap">
    <a class="logo" href="${href('')}" aria-label="Wanna Go Colombia, inicio">${ISO}</a>
    <ul>
      <li><a href="${href('nosotros/')}">Nosotros</a></li>
      <li><a href="${href('viajes-a-la-medida/')}">${t('A la medida', 'Tailor-made')}</a></li>
      <li><a href="${href('viajes-grupales/')}">Viajes grupales</a></li>
      <li><a href="${href('destinos/')}">${t('Destinos', 'Destinations')}</a></li>
      <li><a href="${href('contacto/')}">Contacto</a></li>
    </ul>
    <div class="nav-actions"><button class="lang-btn" type="button" aria-label="Switch to English">EN</button><a class="btn btn-rojo" href="${WA}" target="_blank" rel="noopener">Escríbenos</a><button class="menu-btn" type="button" popovertarget="menu" aria-label="${t('Abrir menú', 'Open menu')}"><svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg></button></div>
  </div>
  <div class="menu" id="menu" popover>
    <div class="menu-top"><span class="label">${t('Menú', 'Menu')}</span><button class="lang-btn" type="button" aria-label="Switch to English">EN</button><button class="menu-close" type="button" popovertarget="menu" popovertargetaction="hide" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <ul>
      <li><a href="${href('')}">${t('Inicio', 'Home')}</a></li>
      <li><a href="${href('nosotros/')}">Nosotros</a></li>
      ${SERVICIOS.map(s => `<li><a href="${href(s.slug + '/')}">${s.nombre}</a></li>`).join('\n      ')}
      <li><a href="${href('destinos/')}">${t('Destinos', 'Destinations')}</a></li>
      <li><a href="${href('marruecos/')}">Marruecos entre mujeres</a></li>
      <li><a href="${href('contacto/')}">Contacto</a></li>
    </ul>
    <div class="menu-foot">
      <a class="btn btn-rojo" href="${WA}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>
      <p>Viajes con propósito · RNT 65568 · Medellín, Colombia</p>
    </div>
  </div>
</nav>`;

const pie = () => `<footer class="foot">
  <div class="wrap foot-grid">
    <div>
      <a class="logo" href="${href('')}" aria-label="Wanna Go Colombia, inicio">${ISO}</a>
      <p>${t('Agencia de turismo receptivo en Medellín. Viajar con propósito, volver con historias.', 'Inbound travel agency in Medellín. Travel with purpose, come back with stories.')}</p>
    </div>
    <nav aria-label="Experiencias"><b>Experiencias</b>${SERVICIOS.map(s => `<a href="${href(s.slug + '/')}">${s.nombre}</a>`).join('')}<a href="${href('marruecos/')}">Marruecos entre mujeres</a></nav>
    <nav aria-label="Destinos"><b>Destinos</b>${DESTINOS.map(d => `<a href="${href('destinos/' + d.slug + '/')}">${d.nombre}</a>`).join('')}</nav>
    <nav aria-label="Wanna Go"><b>Wanna Go</b><a href="${href('nosotros/')}">Nosotros</a><a href="${href('contacto/')}">Contacto</a><a href="${WA}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:wannagoco@gmail.com">wannagoco@gmail.com</a><a href="https://www.instagram.com/wannagocol/" target="_blank" rel="noopener">Instagram</a></nav>
  </div>
  <div class="wrap foot-bottom"><span>Viajes con propósito · RNT 65568 · Medellín, Colombia</span><span>Fotos de referencia: Unsplash</span></div>
</footer>`;

const WA_FLOAT = readFileSync('index.html', 'utf8').match(/<a class="wa-float"[\s\S]*?<\/a>/)[0];

const portada = p => `<header class="hero sm">
  ${img(p.foto, p.alt, '100vw', true)}
  <div class="wrap">
    <ol class="crumbs" aria-label="${t('Ruta de navegación', 'Breadcrumb')}">${p.migas.map(([n, r], i, a) => i < a.length - 1 ? `<li><a href="${href(r)}">${n}</a></li>` : `<li aria-current="page">${n}</li>`).join('')}</ol>
    <span class="label">${p.label}</span>
    <h1>${p.h1}</h1>
    <p class="lead">${p.lead}</p>
    ${p.boton ? `<div class="row"><a class="btn btn-rojo" href="${wa(p.boton)}" target="_blank" rel="noopener">${t('Cotizar por WhatsApp', 'Get a quote on WhatsApp')}</a></div>` : ''}
  </div>
</header>`;

const encabezado = (ceja, titulo, oscuro) => `<div class="head rv">
      <span class="eyebrow${oscuro ? ' on-dark' : ''}">${ceja}</span>
      <h2 class="h2">${titulo}</h2>
    </div>`;

const intro = (ceja, titulo, ps, foto, alt, extra = '') => `<section class="sec">
  <div class="wrap about">
    <div class="rv">
      <span class="eyebrow">${ceja}</span>
      <h2 class="h2">${titulo}</h2>
      ${ps.map(p => `<p class="body-lg">${p}</p>`).join('\n      ')}${extra}
    </div>
    <figure class="rv">${img(foto, alt, '(max-width:900px) 100vw, 50vw')}</figure>
  </div>
</section>`;

const tarjetas = (ceja, titulo, items) => `<section class="sec bg-arena">
  <div class="wrap">
    ${encabezado(ceja, titulo)}
    <div class="pillars">
      ${items.map(([h, p], i) => `<article class="pillar rv"><span class="num">0${i + 1}</span><h3>${h}</h3><p>${p}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>`;

const datos = (ceja, valores) => `<section class="sec">
  <div class="wrap">
    ${encabezado(ceja, t('Antes de ir', 'Before you go'))}
    <div class="facts rv">
      ${valores.map((v, i) => `<div class="fact"><small>${DATOS[i]}</small><b>${v}</b></div>`).join('\n      ')}
    </div>
  </div>
</section>`;

const tarjetaDestino = d => `<a class="svc rv" href="${href('destinos/' + d.slug + '/')}">
        ${img(d.foto, '', '(max-width:900px) 100vw, 33vw')}
        <div><span class="label">${d.region}</span><h3>${d.nombre}</h3><p>${d.corto}</p><span class="go">${t('Ver destino', 'See destination')} <span>→</span></span></div>
      </a>`;

const destinos = (ceja, titulo, slugs, fondo = '') => `<section class="sec${fondo}">
  <div class="wrap">
    ${encabezado(ceja, titulo)}
    <div class="services${slugs.length > 3 ? ' four' : ''}">
      ${slugs.filter(s => D[s]).map(s => tarjetaDestino(D[s])).join('\n      ')}
    </div>
  </div>
</section>`;

const tituloTemp = () => `${L(TEMP.titulo)} <em>${L(TEMP.titulo_resalte)}</em>`;
const datosTemp = () => TEMP.datos.map(({ numero, texto }) => `<span><b>${numero}</b> ${L(texto)}</span>`).join('') +
  `<span>Salida <span${TEMP.salida_por_definir ? ' class="tbd"' : ''}>${TEMP.salida}</span></span>`;

// Inicio, después de la portada: viaje de temporada arriba y cuadros de Colombia debajo
const seccionViajes = () => `<section class="sec bg-arena" id="viajes">
  <div class="wrap">
    ${encabezado(t('01 · Nuestros viajes', '01 · Our trips'), t('Elige tu próximo viaje', 'Choose your next trip'))}
    ${TEMP ? `<a class="featured rv" href="${href(TEMP.enlace)}">
      ${img(TEMP.foto, L(TEMP.alt), '(max-width:1200px) 100vw, 1200px')}
      <div class="in">
        <div class="tags"><span class="badge">${t('Viaje de temporada', 'Season trip')}</span><span class="badge soon">${L(TEMP.aviso)}</span></div>
        <span class="label">${L(TEMP.etiqueta)}</span>
        <h3>${tituloTemp()}</h3>
        <p>${L(TEMP.resumen)}</p>
        <div class="facts-row">${datosTemp()}</div>
        <span class="btn btn-rojo">${L(TEMP.boton)} <span>→</span></span>
      </div>
    </a>` : ''}
    <div class="squares">
      ${VIAJES.colombia.filter(v => D[v.destino]).map(({ destino, aviso }) => { const d = D[destino]; return `<a class="svc rv" href="${href('destinos/' + d.slug + '/')}">
        ${img(d.foto, '', '(max-width:900px) 50vw, 300px')}${aviso?.es ? `<span class="badge">${L(aviso)}</span>` : ''}
        <div><span class="label">${d.region}</span><h3>${d.nombre}</h3></div>
      </a>`; }).join('\n      ')}
      <a class="svc sq-cta rv" href="${href('viajes-a-la-medida/')}">
        <div><span class="label">A tu ritmo</span><h3>${t('Diseña tu propio viaje', 'Design your own trip')}</h3><span class="go">${t('Empezar', 'Get started')} <span>→</span></span></div>
      </a>
    </div>
  </div>
</section>`;

const promo = () => VIAJES.popup && TEMP ? `<dialog class="promo" id="promo" aria-labelledby="promo-title">
  <button class="promo-close" type="button" aria-label="Cerrar" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  <div class="promo-in">
    <figure>${img(TEMP.foto, L(TEMP.alt), '(max-width:720px) 100vw, 420px')}<span class="badge">${L(TEMP.aviso)}</span></figure>
    <div class="promo-body">
      <span class="label">${L(TEMP.etiqueta)}</span>
      <h2 id="promo-title">${tituloTemp()}</h2>
      <p>${L(TEMP.resumen)}</p>
      <div class="promo-facts">${datosTemp()}</div>
      <div class="promo-actions">
        <a class="btn btn-rojo" href="${href(TEMP.enlace)}">${L(TEMP.boton)}</a>
        <button class="btn btn-quiet" type="button" data-close>Ahora no</button>
      </div>
    </div>
  </div>
</dialog>` : '';

const resenas = () => `<section class="sec bg-arena reviews">
  <div class="wrap rv-head">
    <div class="rv">
      <span class="eyebrow">${t('Lo que dicen', 'What people say')}</span>
      <h2 class="h2">Historias de quienes viajaron con nosotros</h2>
    </div>
    <a class="rv-score rv" href="https://share.google/e8BOJXLnY23zuiExs" target="_blank" rel="noopener">
      <b>5.0</b>
      <span><span class="rv-stars" aria-hidden="true">★★★★★</span><small>13 reseñas en Google</small></span>
    </a>
  </div>
  <div class="rv-row" aria-label="Reseñas de Google"></div>
  <div class="rv-row rev" aria-hidden="true"></div>
</section>`;

const cierre = (titulo, mensaje, foto) => `<section class="quote">
  ${img(foto, '', '100vw')}
  <div class="wrap">
    <h2>${titulo}</h2>
    <div class="row">
      <a class="btn btn-rojo" href="${wa(mensaje)}" target="_blank" rel="noopener">${t('Escribir por WhatsApp', 'Message us on WhatsApp')}</a>
      <a class="btn btn-line" href="${href('contacto/')}">Diseñar mi viaje</a>
    </div>
  </div>
</section>`;

// ---------- Páginas ----------

const INICIO = [t('Inicio', 'Home'), ''];
const URLS = ['', 'marruecos/'];

function pagina(ruta, armar) {
  pre = '../'.repeat(ruta.split('/').length - 1);
  const p = armar();
  const cuerpo = [nav(), portada(p), p.cuerpo, pie(), WA_FLOAT].join('\n\n');
  const scripts = ['marca.js', 'i18n.js', 'wa.js', ...(cuerpo.includes('rv-row') ? ['resenas.js'] : [])]
    .map(s => `<script src="${pre}${s}?v=${V}"></script>`).join('\n');
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${seo({ ...p, ruta }, p.titulo + cuerpo)}
<link rel="icon" href="${ICONO}">
<link rel="stylesheet" href="${pre}marca.css?v=${V}">
<link rel="stylesheet" href="${pre}wa.css?v=${V}">
<link rel="stylesheet" href="${pre}menu.css?v=${V}">
</head>
<body>

${cuerpo}

${scripts}
</body>
</html>
`;
  mkdirSync(ruta, { recursive: true });
  writeFileSync(ruta + 'index.html', html);
  URLS.push(ruta);
}

const ICONO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ED3237'/%3E%3Cpath d='M20 7a10 10 0 0 1 10 10c0 7-10 23-10 23S10 24 10 17A10 10 0 0 1 20 7z' fill='%23fff'/%3E%3Ccircle cx='20' cy='17' r='4.4' fill='%23ED3237'/%3E%3C/svg%3E`;

// Bloque <head> de SEO: robots, título, descripción, canonical, Open Graph, fuente, JSON-LD y textos en inglés
function seo(p, texto) {
  const url = BASE + p.ruta;
  const en = Object.fromEntries(Object.entries(EN).filter(([es]) => texto.includes(es)));
  return [
    INDEXAR ? '' : '<meta name="robots" content="noindex">',
    `<title>${esc(p.titulo)}</title>`,
    `<meta name="description" content="${esc(p.desc)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="es_CO">`,
    `<meta property="og:site_name" content="Wanna Go Colombia">`,
    `<meta property="og:title" content="${esc(p.titulo)}">`,
    `<meta property="og:description" content="${esc(p.desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${BASE}fotos/og/${nf(p.foto)}.jpg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="preload" href="${pre}fuentes/montserrat.woff2" as="font" type="font/woff2" crossorigin>`,
    `<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': [...p.schema, ORG] })}</script>`,
    Object.keys(en).length ? `<script>self.WG_EN_PAGE=${json(en)}</script>` : '',
  ].filter(Boolean).join('\n');
}

// Destinos
for (const d of DESTINOS) pagina(`destinos/${d.slug}/`, () => {
  const ruta = `destinos/${d.slug}/`;
  const m = [INICIO, [t('Destinos', 'Destinations'), 'destinos/'], [d.nombre, ruta]];
  return {
    titulo: d.titulo, desc: d.desc, foto: d.foto, alt: d.alt, migas: m,
    label: d.region, h1: d.h1, lead: d.lead, boton: `Hola Wanna Go, quiero viajar a ${d.nombre}.`,
    schema: [migas(m), { '@type': 'TouristDestination', name: d.h1, description: d.desc, url: BASE + ruta, image: BASE + `fotos/og/${nf(d.foto)}.jpg` }],
    cuerpo: [
      intro(t('01 · Por qué ir', '01 · Why go'), d.h2, d.ps, d.foto2, d.alt2),
      tarjetas(t('02 · Qué vivir', '02 · What to experience'), t(`Qué hacer en ${d.nombre}`, `Things to do in ${EN[d.nombre] || d.nombre}`), d.vivir),
      datos(t('03 · Datos prácticos', '03 · Practical info'), d.datos),
      destinos(t('04 · Sigue explorando', '04 · Keep exploring'), t('Combínalo con', 'Pair it with'), d.otros, ' bg-arena'),
      cierre(t(`Diseñemos tu viaje a ${d.nombre}`, `Let's design your trip to ${EN[d.nombre] || d.nombre}`), `Hola Wanna Go, quiero viajar a ${d.nombre}.`, d.foto2),
    ].join('\n\n'),
  };
});

// Destinos (índice)
pagina('destinos/', () => {
  const m = [INICIO, [t('Destinos', 'Destinations'), 'destinos/']];
  return {
    titulo: t('Destinos en Colombia para viajar con propósito · Wanna Go', 'Destinations in Colombia for purposeful travel · Wanna Go'),
    desc: 'Guatapé, Comuna 13, Cartagena, Valle de Cocora, Tayrona y el Eje Cafetero: viajes por Colombia diseñados desde Medellín por Wanna Go.',
    foto: 'guatape', alt: D.guatape.alt, migas: m,
    label: t('Destinos en Colombia', 'Destinations in Colombia'), h1: 'Conoce Colombia desde adentro',
    lead: t('Lugares que diseñamos con cariño, desde Medellín hasta el Caribe. Cada uno se puede combinar en un viaje a tu medida.', 'Places we design with care, from Medellín to the Caribbean. Each one can be combined into a tailor-made trip.'),
    schema: [migas(m), { '@type': 'ItemList', itemListElement: DESTINOS.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: BASE + `destinos/${d.slug}/`, name: d.h1 })) }],
    cuerpo: [
      destinos(t('Destinos', 'Destinations'), t('Elige por dónde empezar', 'Choose where to start'), DESTINOS.map(d => d.slug)),
      cierre(t('¿No sabes cuál elegir? Te ayudamos', "Can't decide? We'll help"), 'Hola Wanna Go, quiero ideas para viajar por Colombia.', 'medellin'),
    ].join('\n\n'),
  };
});

// Servicios
const servicio = (slug, s) => pagina(`${slug}/`, () => {
  const m = [INICIO, [s.nombre, `${slug}/`]];
  return {
    ...s, migas: m, h1: s.h1,
    schema: [migas(m), { '@type': 'Service', name: s.nombre, serviceType: s.nombre, description: s.desc, url: BASE + slug + '/', provider: { '@id': ORG['@id'] }, areaServed: { '@type': 'Country', name: 'Colombia' } }],
    cuerpo: s.cuerpo(),
  };
});

servicio('viajes-a-la-medida', {
  nombre: 'Viajes a la medida', foto: 'salento', alt: 'Palmas de cera en el valle de Cocora',
  titulo: t('Viajes a la medida por Colombia · Wanna Go Medellín', 'Tailor-made trips across Colombia · Wanna Go Medellín'),
  desc: 'Itinerarios privados por Colombia diseñados alrededor de lo que te mueve: café, naturaleza, cocina, arte o descanso. Agencia en Medellín, RNT 65568.',
  label: 'A tu ritmo', h1: t('Viajes a la medida por Colombia', 'Tailor-made trips across Colombia'),
  lead: 'Itinerarios privados diseñados alrededor de lo que te mueve: café, naturaleza, cocina, arte o descanso.',
  boton: 'Hola Wanna Go, quiero un viaje a la medida.',
  cuerpo: () => [
    intro(t('01 · Cómo lo pensamos', '01 · How we think about it'), t('Un viaje que se parece a ti', 'A trip that feels like you'), [
      t('No trabajamos con paquetes cerrados. Empezamos por una conversación: qué te emociona, con quién viajas, cuánto tiempo tienes y a qué ritmo quieres moverte.', "We don't sell fixed packages. We start with a conversation: what excites you, who you are traveling with, how much time you have and the pace you want."),
      t('Con eso diseñamos una ruta por Colombia con alojamientos, guías locales y experiencias que elegimos una por una. Durante el viaje, estamos pendientes de ti.', 'From there we design a route through Colombia with lodging, local guides and experiences we choose one by one. During the trip, we are there for you.'),
    ], 'cafe', 'Granos de café maduros en la rama'),
    tarjetas(t('02 · Paso a paso', '02 · Step by step'), t('Así diseñamos tu viaje', 'How we design your trip'), [
      [t('Nos cuentas', 'Tell us'), t('Qué quieres vivir, fechas, presupuesto y quién viaja.', "What you want to experience, dates, budget and who's traveling.")],
      [t('Te proponemos', 'We propose'), t('Un itinerario día a día con alojamientos y experiencias.', 'A day-by-day itinerary with lodging and experiences.')],
      [t('Lo ajustamos', 'We fine-tune'), t('Cambiamos lo necesario hasta que sea tu viaje.', "We adjust whatever is needed until it's truly your trip.")],
      [t('Viajas tranquilo', 'You travel at ease'), t('Logística resuelta y contacto directo con nosotros.', 'Logistics handled and a direct line to us.')],
    ]),
    destinos(t('03 · Inspiración', '03 · Inspiration'), t('Destinos para empezar', 'Destinations to start with'), ['guatape', 'eje-cafetero', 'cartagena']),
    resenas(),
    cierre(t('¿Empezamos a diseñarlo?', 'Shall we start designing it?'), 'Hola Wanna Go, quiero un viaje a la medida.', 'guatape'),
  ].join('\n\n'),
});

servicio('viajes-grupales', {
  nombre: 'Viajes grupales', foto: 'grupo-atardecer', alt: 'Grupo de viajeros contemplando el atardecer',
  titulo: t('Viajes grupales con anfitriona · Wanna Go Colombia', 'Group trips with a host · Wanna Go Colombia'),
  desc: 'Salidas con fecha fija y grupos pequeños, con anfitriona de Wanna Go de principio a fin. Marruecos entre mujeres, Cartagena y el Eje Cafetero.',
  label: 'Grupos pequeños', h1: t('Viajes grupales con anfitriona', 'Group trips with a host'),
  lead: 'Salidas con fecha fija, grupos pequeños y una anfitriona de Wanna Go acompañándote todo el camino.',
  boton: 'Hola Wanna Go, quiero información de los viajes grupales.',
  cuerpo: () => [
    intro(t('01 · Cómo viajamos', '01 · How we travel'), t('Viajar en grupo, sin sentirte en un tour', "Group travel that doesn't feel like a tour"), [
      t('Nuestras salidas grupales son para pocas personas, con un itinerario pensado al detalle y tiempo libre para explorar a tu manera.', 'Our group departures are for just a few people, with a carefully planned itinerary and free time to explore your own way.'),
      t('Una anfitriona de Wanna Go viaja contigo de principio a fin. Se encarga de la logística para que tú solo te ocupes de vivir el viaje.', 'A Wanna Go host travels with you from start to finish and takes care of the logistics, so all you have to do is enjoy the trip.'),
    ], 'mujer-dunas', 'Viajera en las dunas del Sahara al atardecer'),
    `<section class="sec bg-petroleo">
  <div class="wrap">
    ${encabezado(t('02 · Próximas salidas', '02 · Upcoming departures'), t('Elige tu próximo viaje', 'Choose your next trip'), true)}
    <div class="trips">
      ${TEMP ? `<a class="trip big rv" href="${href(TEMP.enlace)}">
        ${img(TEMP.foto, L(TEMP.alt), '(max-width:900px) 100vw, 60vw')}
        <div class="in">
          <span class="badge">${L(TEMP.aviso)}</span>
          <span class="meta">${L(TEMP.etiqueta)}</span>
          <h3>${tituloTemp()}</h3>
          <span class="go">${L(TEMP.boton)} <span>→</span></span>
        </div>
      </a>` : ''}
      <a class="trip rv" href="${href('destinos/cartagena/')}">
        ${img('cartagena', 'Calle colonial de Cartagena con faroles', '(max-width:900px) 100vw, 40vw')}
        <div class="in">
          <span class="badge soon">Próximamente</span>
          <span class="meta"><span class="tbd">Fecha por definir</span></span>
          <h3>Cartagena y el Caribe</h3>
        </div>
      </a>
      <a class="trip rv" href="${href('destinos/eje-cafetero/')}">
        ${img('cafe', 'Granos de café maduros en la rama', '(max-width:900px) 100vw, 40vw')}
        <div class="in">
          <span class="badge soon">Próximamente</span>
          <span class="meta"><span class="tbd">Fecha por definir</span></span>
          <h3>Paisaje Cultural Cafetero</h3>
        </div>
      </a>
    </div>
  </div>
</section>`,
    tarjetas(t('03 · En cada salida', '03 · On every departure'), t('Lo que siempre tienes', 'What you always get'), [
      [t('Grupos pequeños', 'Small groups'), t('Pocas personas, para viajar con calma y conocerse.', 'Few people, so you travel calmly and get to know each other.')],
      [t('Anfitriona Wanna Go', 'A Wanna Go host'), t('Te acompaña desde la salida hasta el regreso.', 'With you from departure to return.')],
      [t('Experiencias locales', 'Local experiences'), t('Cocina, cultura y gente de cada destino.', 'Food, culture and people at every destination.')],
      [t('Todo organizado', 'Everything organized'), t('Alojamiento, traslados y reservas resueltos.', 'Lodging, transfers and bookings taken care of.')],
    ]),
    resenas(),
    cierre(t('¿Quieres saber de las próximas salidas?', 'Want to hear about upcoming departures?'), 'Hola Wanna Go, quiero información de los viajes grupales.', 'camellos'),
  ].join('\n\n'),
});

servicio('eventos-corporativos', {
  nombre: 'Eventos corporativos', foto: 'medellin-montanas', alt: 'Edificios de Medellín frente a las montañas',
  titulo: t('Eventos corporativos en Medellín y Antioquia · Wanna Go', 'Corporate events in Medellín and Antioquia · Wanna Go'),
  desc: 'Incentivos, convenciones y experiencias de equipo en Medellín y Antioquia, con logística completa y experiencias locales con propósito.',
  label: 'Empresas', h1: t('Eventos corporativos en Medellín y Antioquia', 'Corporate events in Medellín and Antioquia'),
  lead: 'Incentivos, convenciones y experiencias de equipo con logística completa en Medellín y Antioquia.',
  boton: 'Hola Wanna Go, quiero cotizar un evento corporativo.',
  cuerpo: () => [
    intro(t('01 · Para empresas', '01 · For companies'), t('Experiencias que unen equipos', 'Experiences that bring teams together'), [
      t('Diseñamos viajes de incentivo, convenciones y salidas de equipo que muestran Medellín y Antioquia desde adentro, con la misma calidez con la que recibimos a nuestros viajeros.', 'We design incentive trips, conventions and team outings that show Medellín and Antioquia from the inside, with the same warmth we offer every traveler.'),
      t('Nos encargamos de la logística completa: transporte, alojamiento, espacios, alimentación y experiencias locales, con un solo contacto para todo.', 'We handle the full logistics: transport, lodging, venues, catering and local experiences, with a single point of contact.'),
    ], 'medellin', 'Medellín iluminada al atardecer, rodeada de montañas'),
    tarjetas(t('02 · Qué organizamos', '02 · What we organize'), t('Formatos para tu empresa', 'Formats for your company'), [
      [t('Viajes de incentivo', 'Incentive trips'), t('Premia a tu equipo con experiencias que no olvidará.', "Reward your team with experiences they won't forget.")],
      [t('Convenciones y reuniones', 'Conventions and meetings'), t('Espacios, transporte y agenda coordinados.', 'Venues, transport and agenda, all coordinated.')],
      [t('Integración de equipos', 'Team building'), t('Actividades con propósito en la ciudad y la naturaleza.', 'Purposeful activities in the city and in nature.')],
      [t('Experiencias para visitantes', 'Experiences for visitors'), t('Recibe a clientes y socios con lo mejor de Medellín.', 'Welcome clients and partners with the best of Medellín.')],
    ]),
    destinos(t('03 · Experiencias', '03 · Experiences'), t('Ideas en Medellín y Antioquia', 'Ideas in Medellín and Antioquia'), ['comuna-13', 'guatape', 'plazas-de-mercado']),
    resenas(),
    cierre(t('Cuéntanos de tu evento', 'Tell us about your event'), 'Hola Wanna Go, quiero cotizar un evento corporativo.', 'medellin-montanas'),
  ].join('\n\n'),
});

// Nosotros
pagina('nosotros/', () => {
  const m = [INICIO, ['Nosotros', 'nosotros/']];
  const casa = readFileSync('index.html', 'utf8');
  const tomar = ini => casa.slice(casa.indexOf(ini), casa.indexOf('</section>', casa.indexOf(ini)) + 10);
  return {
    titulo: t('Quiénes somos · Wanna Go, agencia de viajes en Medellín', 'About us · Wanna Go, travel agency in Medellín'),
    desc: 'Wanna Go es una agencia de turismo receptivo en Medellín fundada en 2019 por Luchy Vásquez. Viajes con propósito, auténticos y con hospitalidad cálida.',
    foto: 'guatape-calle', alt: 'Calle con fachadas de colores y zócalos en Guatapé', migas: m,
    label: t('Quiénes somos', 'About us'), h1: t('Viajes con propósito desde Medellín', 'Purposeful travel from Medellín'),
    lead: t('Somos una agencia de turismo receptivo fundada en 2019. Te mostramos Colombia desde adentro: con su gente, su cocina y sus paisajes.', 'We are an inbound travel agency founded in 2019. We show you Colombia from the inside: its people, its food and its landscapes.'),
    schema: [migas(m), { '@type': 'AboutPage', url: BASE + 'nosotros/', mainEntity: { '@id': ORG['@id'] } }],
    cuerpo: [
      intro(t('01 · Nuestra historia', '01 · Our story'), 'Viajes con propósito', [
        'Wanna Go es una agencia de turismo receptivo con sede en Medellín, fundada en 2019 por María Lucía Vásquez Cock, Luchy.',
        'Huimos del turismo masivo y de lo predecible. Te mostramos cada destino desde adentro, con su gente, su cocina y sus paisajes, para que vuelvas distinto de como te fuiste.',
      ], 'comuna13', 'Casas de colores y murales en las laderas de la Comuna 13', `
      <div class="stats">
        <div class="stat"><b>2019</b><span>Año de fundación</span></div>
        <div class="stat"><b>RNT 65568</b><span>Registro Nacional de Turismo</span></div>
        <div class="stat"><b>Medellín</b><span>Colombia</span></div>
      </div>`),
      // fundadora y pilares: el mismo bloque del inicio
      tomar('<section class="sec bg-petroleo">\n  <div class="wrap founder">').replace('06 · Fundadora', t('02 · Fundadora', '02 · Founder')),
      tomar('<section class="sec">\n  <div class="wrap">\n    <div class="head rv">\n      <span class="eyebrow">04 · Nuestro sello').replace('04 · Nuestro sello', '03 · Nuestro sello'),
      resenas(),
      cierre('Colombia se vive mejor en buena compañía', 'Hola Wanna Go, quiero conocerlos.', 'grupo-atardecer'),
    ].join('\n\n'),
  };
});

// Contacto
pagina('contacto/', () => {
  const m = [INICIO, ['Contacto', 'contacto/']];
  const casa = readFileSync('index.html', 'utf8');
  const ini = casa.indexOf('<section class="sec bg-arena" id="contacto">');
  const seccion = casa.slice(ini, casa.indexOf('</section>', ini) + 10)
    .replace('<span class="eyebrow">07 · Contacto</span>\n      <h2 class="h2">Diseñemos tu próximo viaje</h2>', `<span class="eyebrow">${t('Canales', 'Channels')}</span>\n      <h2 class="h2">${t('Hablemos de tu viaje', "Let's talk about your trip")}</h2>`)
    .replace('</b></span></a>\n      </div>', `</b></span></a>
        <a class="channel" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent('Cra. 30 #5F-185, El Poblado, Medellín')}" target="_blank" rel="noopener"><span class="ico rojo sm"><svg viewBox="0 0 24 24"><path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg></span><span><small>${t('Oficina', 'Office')}</small><b>Cra. 30 #5F-185 Int 701, El Poblado, Medellín</b></span></a>
      </div>`);
  return {
    titulo: t('Contacto · Wanna Go Colombia, Medellín', 'Contact · Wanna Go Colombia, Medellín'),
    desc: 'Escríbenos por WhatsApp al +57 312 289 9185 o a wannagoco@gmail.com. Oficina en El Poblado, Medellín. Diseñamos tu viaje por Colombia.',
    foto: 'medellin', alt: 'Medellín iluminada al atardecer, rodeada de montañas', migas: m,
    label: 'Contacto', h1: 'Diseñemos tu próximo viaje',
    lead: 'Cuéntanos qué te mueve y te proponemos un itinerario a tu medida. Respondemos por WhatsApp.',
    schema: [migas(m), { '@type': 'ContactPage', url: BASE + 'contacto/', mainEntity: { '@id': ORG['@id'] } }],
    cuerpo: seccion,
  };
});

// ---------- Inicio y Marruecos: bloques entre marcadores <!-- x --> … <!-- /x --> ----------

function parche(archivo, ruta, bloques) {
  let h = readFileSync(archivo, 'utf8');
  for (const [k, v] of Object.entries(bloques)) {
    const a = `<!-- ${k} -->`, b = `<!-- /${k} -->`;
    if (!h.includes(a) || !h.includes(b)) throw new Error(`Falta el marcador ${a} en ${archivo}`);
    h = h.slice(0, h.indexOf(a) + a.length) + '\n' + v + '\n' + h.slice(h.indexOf(b));
  }
  writeFileSync(archivo, h);
}

pre = '';
const navInicio = nav(), pieInicio = pie(), viajesInicio = seccionViajes(), promoInicio = promo();
parche('index.html', '', {
  nav: navInicio, pie: pieInicio, viajes: viajesInicio, promo: promoInicio,
  seo: seo({
    ruta: '', foto: 'medellin',
    titulo: t('Wanna Go Colombia · Agencia de viajes con propósito en Medellín', 'Wanna Go Colombia · Purposeful travel agency in Medellín'),
    desc: 'Wanna Go: agencia de turismo receptivo en Medellín. Viajes a la medida, viajes grupales y eventos corporativos con propósito.',
    schema: [{ '@type': 'WebSite', '@id': BASE + '#sitio', name: 'Wanna Go Colombia', url: BASE, inLanguage: 'es', publisher: { '@id': ORG['@id'] } }],
  }, 'Wanna Go Colombia · Agencia de viajes con propósito en Medellín' + navInicio + pieInicio + viajesInicio + promoInicio),
});

pre = '../';
const m = [INICIO, ['Viajes grupales', 'viajes-grupales/'], ['Marruecos entre mujeres', 'marruecos/']];
parche('marruecos/index.html', 'marruecos/', {
  seo: seo({
    ruta: 'marruecos/', foto: 'mujer-dunas',
    titulo: 'Marruecos entre mujeres · Wanna Go',
    desc: 'Viaje grupal solo para mujeres a Marruecos: 10 días, 7 destinos y máximo 16 viajeras, con anfitriona de Wanna Go. Medinas, palacios y una noche en el Sahara.',
    schema: [migas(m), { '@type': 'TouristTrip', name: 'Marruecos entre mujeres', description: 'Viaje grupal solo para mujeres a Marruecos: 10 días, 7 destinos y máximo 16 viajeras.', url: BASE + 'marruecos/', image: BASE + 'fotos/og/mujer-dunas.jpg', touristType: 'Mujeres', provider: { '@id': ORG['@id'] } }],
  }, ''),
});

// ---------- Panel /admin (Decap CMS): admin/config.yml ----------
// Se escribe como JSON (que también es YAML válido) para no tener errores de sangría.

const tx = (label, name, { largo, opcional, ayuda } = {}) => ({
  label, name, widget: 'object', collapsed: false, required: !opcional, ...(ayuda && { hint: ayuda }),
  fields: [
    { label: 'Español', name: 'es', widget: largo ? 'text' : 'string', required: !opcional },
    { label: 'English', name: 'en', widget: largo ? 'text' : 'string', required: false },
  ],
});
const foto = (label, name) => ({ label, name, widget: 'image', choose_url: false, hint: 'JPG o PNG horizontal de al menos 1600 px. El sitio la optimiza solo.' });
const aDestino = (label, name, multiple) => ({ label, name, widget: 'relation', collection: 'destinos', value_field: 'url', search_fields: ['url'], display_fields: ['url'], multiple, ...(multiple && { required: false }) });

const CMS = {
  backend: {
    name: 'github', repo: REPO, branch: 'main', ...(OAUTH && { base_url: OAUTH, auth_endpoint: 'auth' }),
    commit_messages: { create: 'Panel: crear «{{slug}}»', update: 'Panel: actualizar «{{slug}}»', delete: 'Panel: borrar «{{slug}}»', uploadMedia: 'Panel: subir foto «{{path}}»', deleteMedia: 'Panel: borrar foto «{{path}}»' },
  },
  local_backend: true,
  locale: 'es',
  logo_url: 'logo.svg',
  site_url: BASE, display_url: BASE,
  media_folder: '_originales', public_folder: '/_originales',
  collections: [
    {
      name: 'inicio', label: 'Viajes del inicio', editor: { preview: false },
      files: [{
        name: 'viajes', label: 'Viaje de temporada, pop-up y cuadros de Colombia', file: '_datos/viajes.json',
        fields: [
          { label: 'Mostrar el pop-up del viaje de temporada', name: 'popup', widget: 'boolean', default: true },
          {
            label: 'Viajes de temporada', label_singular: 'viaje de temporada', name: 'temporadas', widget: 'list',
            hint: 'Se muestra el primero activo cuya fecha «hasta» no haya pasado. Agrega aquí el siguiente viaje para que entre solo.',
            summary: '{{fields.titulo.es}} {{fields.titulo_resalte.es}} · hasta {{fields.hasta}}',
            fields: [
              { label: 'Activo', name: 'activo', widget: 'boolean', default: true },
              { label: 'Mostrar hasta (último día)', name: 'hasta', widget: 'datetime', format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, required: false, hint: 'Normalmente la fecha de salida. Vacío: sin límite.' },
              { label: 'Página del viaje', name: 'enlace', widget: 'string', hint: 'Ej.: marruecos/ o destinos/cartagena/' },
              foto('Foto', 'foto'),
              tx('Descripción de la foto', 'alt'),
              tx('Título', 'titulo'),
              tx('Título, parte resaltada', 'titulo_resalte'),
              tx('Etiqueta', 'etiqueta', { ayuda: 'Ej.: Viaje grupal · Solo mujeres' }),
              tx('Aviso', 'aviso', { ayuda: 'Ej.: Cupos abiertos' }),
              tx('Resumen', 'resumen', { largo: true }),
              { label: 'Datos', label_singular: 'dato', name: 'datos', widget: 'list', summary: '{{fields.numero}} {{fields.texto.es}}', fields: [{ label: 'Número', name: 'numero', widget: 'string' }, tx('Texto', 'texto')] },
              { label: 'Salida', name: 'salida', widget: 'string', hint: 'Ej.: 2027 o 15 de marzo de 2027' },
              { label: 'Salida por definir (se marca como borrador)', name: 'salida_por_definir', widget: 'boolean', default: false },
              tx('Texto del botón', 'boton'),
            ],
          },
          {
            label: 'Cuadros de Colombia', label_singular: 'cuadro', name: 'colombia', widget: 'list', summary: '{{fields.destino}}',
            fields: [aDestino('Destino', 'destino', false), tx('Aviso (opcional)', 'aviso', { opcional: true, ayuda: 'Ej.: Salida grupal próximamente' })],
          },
        ],
      }],
    },
    {
      name: 'destinos', label: 'Destinos', label_singular: 'destino', folder: '_datos/destinos', format: 'json', extension: 'json',
      create: true, delete: true, slug: '{{fields.url}}', identifier_field: 'url', summary: '{{fields.orden}}. {{fields.url}}', sortable_fields: ['orden', 'url'],
      editor: { preview: false },
      fields: [
        { label: 'Dirección (url)', name: 'url', widget: 'string', pattern: ['^[a-z0-9-]+$', 'Solo minúsculas, números y guiones'], hint: 'La página queda en destinos/<url>/. No la cambies después de publicar.' },
        { label: 'Orden', name: 'orden', widget: 'number', value_type: 'int', default: 99 },
        tx('Nombre', 'nombre'), tx('Título grande (H1)', 'h1'), tx('Región', 'region'), tx('Frase corta para tarjetas', 'corto'),
        foto('Foto de portada', 'foto'), tx('Descripción de la foto de portada', 'alt'),
        foto('Segunda foto', 'foto2'), tx('Descripción de la segunda foto', 'alt2'),
        tx('Título para Google (máx. 60 caracteres)', 'titulo_seo'),
        { label: 'Descripción para Google (máx. 155 caracteres)', name: 'descripcion_seo', widget: 'text' },
        tx('Introducción', 'lead', { largo: true }), tx('Subtítulo de «Por qué ir»', 'h2'),
        { label: 'Párrafos de «Por qué ir»', label_singular: 'párrafo', name: 'parrafos', widget: 'list', summary: '{{fields.es}}', fields: [{ label: 'Español', name: 'es', widget: 'text' }, { label: 'English', name: 'en', widget: 'text', required: false }] },
        { label: 'Qué vivir', label_singular: 'experiencia', name: 'vivir', widget: 'list', summary: '{{fields.titulo.es}}', fields: [tx('Título', 'titulo'), tx('Texto', 'texto')] },
        { label: 'Datos prácticos', name: 'datos', widget: 'object', collapsed: false, fields: [tx('Cómo llegar', 'llegar'), tx('Mejor época', 'epoca'), tx('Tiempo sugerido', 'tiempo'), tx('Ideal para', 'ideal')] },
        aDestino('Combínalo con', 'otros', true),
      ],
    },
  ],
};
mkdirSync('admin', { recursive: true });
writeFileSync('admin/config.yml', '# Generado por _herramientas/generar.mjs: no editar a mano\n' + JSON.stringify(CMS, null, 2) + '\n');

// ---------- sitemap.xml y robots.txt ----------

writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(u => `  <url><loc>${BASE}${u}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);

console.log(`Temporada: ${TEMP ? L(TEMP.titulo) + ' ' + L(TEMP.titulo_resalte) : 'ninguna'} · ${URLS.length} URLs · ${INDEXAR ? 'indexables' : 'con noindex (borrador)'}`);

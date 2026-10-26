// Wanna Go · construye el sitio completo en dist/ a partir de contenido/ (lo que edita el panel),
// publico/ (CSS, JS, fuente y la landing de Marruecos) y panel/ (que queda en /admin).
// Uso: npm run construir  (corre antes herramientas/fotos.py, que deja las fotos optimizadas en dist/fotos)
// Textos: los de contenido/ vienen en {es, en}; los fijos del diseño van con t('español', 'English').
// El inglés de cada página llega a i18n.js como WG_EN_PAGE.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { PAGINAS } from '../panel/esquema.js';

const BASE = 'https://feliperpovera.github.io/wannago/'; // cambiar al conectar el dominio propio
const INDEXAR = false; // true al salir en vivo: quita el noindex de todas las páginas
const V = '20261023d';  // sube este número cuando cambies un CSS o JS
const WA = 'https://wa.me/573122899185';
const medidas = JSON.parse(readFileSync('dist/fotos/medidas.json', 'utf8'));

// dist/ se arma de cero en cada construcción, menos dist/fotos (las fotos optimizadas se reutilizan)
for (const f of readdirSync('dist')) if (f !== 'fotos') rmSync('dist/' + f, { recursive: true });
cpSync('publico', 'dist', { recursive: true });
cpSync('panel', 'dist/admin', { recursive: true });

// Traducciones: las del módulo valen para todo el sitio; las de cada página (ENP) mandan en esa página
const EN = {};
let ENP = null;
const t = (es, en) => ((ENP || EN)[es] = en, es);
const L = v => typeof v === 'string' ? v : t(v.es, v.en || v.es);
// fotos: acepta 'guatape', 'guatape.jpg' o una ruta; se usa solo el nombre
const nf = f => f.split('/').pop().replace(/\.[a-z]+$/i, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const wa = texto => `${WA}?text=${encodeURIComponent(texto)}`;
let pre = ''; // prefijo relativo de la página en curso: '', '../' o '../../'
const href = ruta => pre + ruta || './';
const img = (foto, alt = '', sizes = '100vw', portada = false, extra = '') => {
  foto = nf(foto);
  if (!medidas[foto]) throw new Error(`Falta la foto «${foto}»: sube el original a fotos/ y corre npm run construir`);
  const w = medidas[foto][0];
  return `<img${extra} src="${pre}fotos/${foto}.webp" srcset="${pre}fotos/${foto}-800.webp ${Math.round(w / 2)}w, ${pre}fotos/${foto}.webp ${w}w" sizes="${sizes}" alt="${esc(alt)}"${portada ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
};

// ---------- Datos ----------

const leer = ruta => JSON.parse(readFileSync(ruta, 'utf8'));

// Textos de cada página: contenido/paginas/<id>.json, con las secciones de panel/esquema.js
const PG = Object.fromEntries(PAGINAS.map(({ id, secciones }) => {
  const datos = leer(`contenido/paginas/${id}.json`);
  for (const s of secciones) if (!datos[s.id]) throw new Error(`contenido/paginas/${id}.json: falta la sección «${s.id}»`);
  return [id, datos];
}));

const SERVICIOS = [
  { slug: 'viajes-a-la-medida', nombre: 'Viajes a la medida' },
  { slug: 'viajes-grupales', nombre: 'Viajes grupales' },
  { slug: 'eventos-corporativos', nombre: 'Eventos corporativos' },
];

const DATOS = [t('Cómo llegar', 'Getting there'), t('Mejor época', 'Best time'), t('Tiempo sugerido', 'Suggested time'), t('Ideal para', 'Ideal for')];

// Destinos: un archivo por destino en contenido/destinos/
const DESTINOS = readdirSync('contenido/destinos').filter(f => f.endsWith('.json'))
  .map(f => leer('contenido/destinos/' + f))
  .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
  .map(d => ({
    slug: d.url, foto: d.foto, foto2: d.foto2, nombre: L(d.nombre), h1: L(d.h1), alt: L(d.alt), alt2: L(d.alt2),
    region: L(d.region), corto: L(d.corto), titulo: L(d.titulo_seo), desc: d.descripcion_seo, lead: L(d.lead), h2: L(d.h2),
    ps: d.parrafos.map(L), vivir: d.vivir.map(v => [L(v.titulo), L(v.texto)]),
    datos: ['llegar', 'epoca', 'tiempo', 'ideal'].map(k => L(d.datos[k])), otros: d.otros || [],
  }));
const D = Object.fromEntries(DESTINOS.map(d => [d.slug, d]));

// Viajes de temporada y cuadros de Colombia: contenido/viajes.json
const VIAJES = leer('contenido/viajes.json');
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

// ---------- Piezas comunes ----------

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

const WA_FLOAT = `<a class="wa-float" href="${WA}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp"><span class="wa-btn"><svg viewBox="0 0 32 32"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.7c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7zm5.9-8c-.3-.2-1.9-1-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.3-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5v-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 2.8 1.1 3.4.9 4 .8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5l-.6-.4z"/></svg><span class="wa-badge" aria-hidden="true">1</span></span><span class="wa-label">¿Planeamos tu viaje? <b>Escríbenos</b></span></a>`;

// Portada de las páginas internas, con migas de pan
const portada = (p, m, whatsapp) => `<header class="hero sm">
  ${img(p.foto, L(p.alt), '100vw', true)}
  <div class="wrap">
    <ol class="crumbs" aria-label="${t('Ruta de navegación', 'Breadcrumb')}">${m.map(([n, r], i, a) => i < a.length - 1 ? `<li><a href="${href(r)}">${n}</a></li>` : `<li aria-current="page">${n}</li>`).join('')}</ol>
    <span class="label">${L(p.etiqueta)}</span>
    <h1>${L(p.titulo)}</h1>
    <p class="lead">${L(p.texto)}</p>
    ${whatsapp ? `<div class="row"><a class="btn btn-rojo" href="${wa(whatsapp)}" target="_blank" rel="noopener">${t('Cotizar por WhatsApp', 'Get a quote on WhatsApp')}</a></div>` : ''}
  </div>
</header>`;

const encabezado = (s, oscuro) => `<div class="head rv">
      <span class="eyebrow${oscuro ? ' on-dark' : ''}">${L(s.ceja)}</span>
      <h2 class="h2">${L(s.titulo)}</h2>
    </div>`;

const cifras = lista => lista?.length ? `
      <div class="stats">
        ${lista.map(c => `<div class="stat"><b>${c.valor}</b><span>${L(c.texto)}</span></div>`).join('\n        ')}
      </div>` : '';

// Texto a la izquierda y foto a la derecha
const intro = (s, extra = '', id = '') => `<section class="sec"${id && ` id="${id}"`}>
  <div class="wrap about">
    <div class="rv">
      <span class="eyebrow">${L(s.ceja)}</span>
      <h2 class="h2">${L(s.titulo)}</h2>
      ${s.parrafos.map(p => `<p class="body-lg">${L(p)}</p>`).join('\n      ')}${extra}${cifras(s.cifras)}
    </div>
    <figure class="rv">${img(s.foto, L(s.alt), '(max-width:900px) 100vw, 50vw')}</figure>
  </div>
</section>`;

const tarjetas = (s, items = s.items) => `<section class="sec bg-arena">
  <div class="wrap">
    ${encabezado(s)}
    <div class="pillars">
      ${items.map((it, i) => `<article class="pillar rv"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${L(it.titulo)}</h3><p>${L(it.texto)}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>`;

const ICONOS = [
  ['petroleo', 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14zm0 0 7-7'],
  ['rojo', 'M12 21v-8m0 0c0-4-3-6-7-6 0 4 3 6 7 6zm0 0c0-4 3-7 7-7 0 4-3 7-7 7z'],
  ['petroleo', 'M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16 3-16'],
  ['rojo', 'M12 10s-4-2.5-4-5a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2.5-4 5-4 5zM3 15h4l4 2h5a2 2 0 0 1 0 3H9m-6 0h3l9-1 6-4'],
];
const pilares = s => `<section class="sec">
  <div class="wrap">
    ${encabezado(s)}
    <div class="pillars">
      ${s.items.map((it, i) => { const [color, d] = ICONOS[i % ICONOS.length]; return `<article class="pillar rv" style="background:var(--arena)">
        <span class="ico ${color}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg></span>
        <h3>${L(it.titulo)}</h3><p>${L(it.texto)}</p>
      </article>`; }).join('\n      ')}
    </div>
  </div>
</section>`;

const fundadora = s => `<section class="sec bg-petroleo">
  <div class="wrap founder">
    <div class="ph rv">Foto de Luchy<br>(pendiente)</div>
    <div class="rv">
      <span class="eyebrow on-dark">${L(s.ceja)}</span>
      <blockquote style="margin-top:20px">${L(s.cita)}</blockquote>
      <div class="who"><b>${s.nombre}</b><span>${L(s.cargo)}</span></div>
    </div>
  </div>
</section>`;

const datos = (ceja, valores) => `<section class="sec">
  <div class="wrap">
    ${encabezado({ ceja, titulo: t('Antes de ir', 'Before you go') })}
    <div class="facts rv">
      ${valores.map((v, i) => `<div class="fact"><small>${DATOS[i]}</small><b>${v}</b></div>`).join('\n      ')}
    </div>
  </div>
</section>`;

const tarjetaDestino = d => `<a class="svc rv" href="${href('destinos/' + d.slug + '/')}">
        ${img(d.foto, '', '(max-width:900px) 100vw, 33vw')}
        <div><span class="label">${d.region}</span><h3>${d.nombre}</h3><p>${d.corto}</p><span class="go">${t('Ver destino', 'See destination')} <span>→</span></span></div>
      </a>`;

const destinos = (s, slugs, fondo = '') => `<section class="sec${fondo}">
  <div class="wrap">
    ${encabezado(s)}
    <div class="services${slugs.length > 3 ? ' four' : ''}">
      ${slugs.filter(x => D[x]).map(x => tarjetaDestino(D[x])).join('\n      ')}
    </div>
  </div>
</section>`;

const resenas = (s, id) => `<section class="sec bg-arena reviews"${id ? ` id="${id}"` : ''}>
  <div class="wrap rv-head">
    <div class="rv">
      <span class="eyebrow">${L(s.ceja)}</span>
      <h2 class="h2">${L(s.titulo)}</h2>
    </div>
    <a class="rv-score rv" href="https://share.google/e8BOJXLnY23zuiExs" target="_blank" rel="noopener">
      <b>5.0</b>
      <span><span class="rv-stars" aria-hidden="true">★★★★★</span><small>13 reseñas en Google</small></span>
    </a>
  </div>
  <div class="rv-row" aria-label="Reseñas de Google"></div>
  <div class="rv-row rev" aria-hidden="true"></div>
</section>`;

const cierre = s => `<section class="quote">
  ${img(s.foto, '', '100vw')}
  <div class="wrap">
    <h2>${L(s.titulo)}</h2>
    <div class="row">
      <a class="btn btn-rojo" href="${wa(s.whatsapp)}" target="_blank" rel="noopener">${t('Escribir por WhatsApp', 'Message us on WhatsApp')}</a>
      <a class="btn btn-line" href="${href('contacto/')}">Diseñar mi viaje</a>
    </div>
  </div>
</section>`;

// Canales de contacto y formulario (inicio y página de contacto)
const contacto = (s, oficina) => `<section class="sec bg-arena" id="contacto">
  <div class="wrap contact">
    <div class="rv">
      <span class="eyebrow">${L(s.ceja)}</span>
      <h2 class="h2">${L(s.titulo)}</h2>
      ${s.texto?.es ? `<p class="body-lg">${L(s.texto)}</p>` : ''}
      <div class="channels">
        <a class="channel" href="${WA}" target="_blank" rel="noopener"><span class="ico rojo sm"><svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg></span><span><small>WhatsApp</small><b>+57 312 289 9185</b></span></a>
        <a class="channel" href="mailto:wannagoco@gmail.com"><span class="ico petroleo sm"><svg viewBox="0 0 24 24"><path d="M3 6h18v12H3zm0 0 9 7 9-7"/></svg></span><span><small>Correo</small><b>wannagoco@gmail.com</b></span></a>
        <a class="channel" href="https://www.instagram.com/wannagocol/" target="_blank" rel="noopener"><span class="ico agua sm"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/></svg></span><span><small>Instagram</small><b>@wannagocol</b></span></a>${oficina ? `
        <a class="channel" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent('Cra. 30 #5F-185, El Poblado, Medellín')}" target="_blank" rel="noopener"><span class="ico rojo sm"><svg viewBox="0 0 24 24"><path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg></span><span><small>${t('Oficina', 'Office')}</small><b>Cra. 30 #5F-185 Int 701, El Poblado, Medellín</b></span></a>` : ''}
      </div>
    </div>
    <form class="form rv" id="lead" novalidate>
      <label for="f-name">Nombre<input id="f-name" name="name" autocomplete="name" placeholder="Tu nombre"></label>
      <div class="two">
        <label for="f-wa">WhatsApp<input id="f-wa" name="wa" type="tel" autocomplete="tel" placeholder="+57 300 000 0000"></label>
        <label for="f-type">Tipo de viaje
          <select id="f-type" name="type"><option>A la medida</option><option>Viaje grupal</option><option>Evento corporativo</option></select>
        </label>
      </div>
      <label for="f-msg">¿Qué te gustaría vivir?<textarea id="f-msg" name="msg" rows="4" placeholder="Destino, fechas, número de personas…"></textarea></label>
      <button class="btn btn-rojo" type="submit">Enviar por WhatsApp</button>
      <p class="ok" id="msg" hidden></p>
    </form>
  </div>
</section>`;

const tituloTemp = v => `${L(v.titulo)} <em>${L(v.titulo_resalte)}</em>`;
const datosTemp = () => TEMP.datos.map(({ numero, texto }) => `<span><b>${numero}</b> ${L(texto)}</span>`).join('') +
  `<span>Salida <span${TEMP.salida_por_definir ? ' class="tbd"' : ''}>${TEMP.salida}</span></span>`;

// ---------- Páginas ----------

const INICIO = [t('Inicio', 'Home'), ''];
const URLS = ['marruecos/'];
const ICONO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ED3237'/%3E%3Cpath d='M20 7a10 10 0 0 1 10 10c0 7-10 23-10 23S10 24 10 17A10 10 0 0 1 20 7z' fill='%23fff'/%3E%3Ccircle cx='20' cy='17' r='4.4' fill='%23ED3237'/%3E%3C/svg%3E`;

// Bloque <head> de SEO: robots, título, descripción, canonical, Open Graph, fuente, JSON-LD y textos en inglés
function seo(p, texto) {
  const url = BASE + p.ruta;
  const filtrar = dic => Object.entries(dic || {}).filter(([es]) => texto.includes(es));
  const en = Object.fromEntries([...filtrar(EN), ...filtrar(ENP)]);
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

// armar() devuelve { seo: {titulo, descripcion, foto}, schema, portada, cuerpo, despues }
function pagina(ruta, armar) {
  pre = '../'.repeat(ruta.split('/').length - 1);
  ENP = {};
  const p = armar();
  const titulo = L(p.seo.titulo);
  const cuerpo = [nav(), p.portada, p.cuerpo, pie(), p.despues, WA_FLOAT].filter(Boolean).join('\n\n');
  const scripts = ['marca.js', 'i18n.js', 'wa.js', ...(cuerpo.includes('rv-row') ? ['resenas.js'] : [])]
    .map(s => `<script src="${pre}js/${s}?v=${V}"></script>`).join('\n');
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${seo({ ruta, titulo, desc: p.seo.descripcion, foto: p.seo.foto, schema: p.schema }, titulo + cuerpo)}
<link rel="icon" href="${ICONO}">
<link rel="stylesheet" href="${pre}css/marca.css?v=${V}">
<link rel="stylesheet" href="${pre}css/wa.css?v=${V}">
<link rel="stylesheet" href="${pre}css/menu.css?v=${V}">
</head>
<body>

${cuerpo}

${scripts}
</body>
</html>
`;
  mkdirSync('dist/' + ruta, { recursive: true });
  writeFileSync(`dist/${ruta}index.html`, html);
  URLS.push(ruta);
  ENP = null;
}

// Inicio
pagina('', () => {
  const P = PG.inicio, POP = PG.popup.popup;
  const pop = POP.activo && (POP.usar_temporada ? TEMP && { ...TEMP, texto: TEMP.resumen, datos: true } : POP.foto && POP);
  return {
    seo: P.seo,
    schema: [{ '@type': 'WebSite', '@id': BASE + '#sitio', name: 'Wanna Go Colombia', url: BASE, inLanguage: 'es', publisher: { '@id': ORG['@id'] } }],
    portada: `<header class="hero">
  ${img(P.portada.foto, L(P.portada.alt), '100vw', true)}
  <div class="wrap">
    <span class="label">${L(P.portada.etiqueta)}</span>
    <h1>${L(P.portada.titulo)}</h1>
    <p class="lead">${L(P.portada.texto)}</p>
    <div class="row">
      <a class="btn btn-rojo" href="#viajes">${L(P.portada.boton1)}</a>
      <a class="btn btn-line" href="#contacto">${L(P.portada.boton2)}</a>
    </div>
  </div>
</header>`,
    cuerpo: [
      `<section class="sec bg-arena" id="viajes">
  <div class="wrap">
    ${encabezado(P.viajes)}
    ${TEMP ? `<a class="featured rv" href="${href(TEMP.enlace)}">
      ${img(TEMP.foto, L(TEMP.alt), '(max-width:1200px) 100vw, 1200px')}
      <div class="in">
        <div class="tags"><span class="badge">${t('Viaje de temporada', 'Season trip')}</span><span class="badge soon">${L(TEMP.aviso)}</span></div>
        <span class="label">${L(TEMP.etiqueta)}</span>
        <h3>${tituloTemp(TEMP)}</h3>
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
        <div><span class="label">${L(P.viajes.cta_etiqueta)}</span><h3>${L(P.viajes.cta_titulo)}</h3><span class="go">${L(P.viajes.cta_boton)} <span>→</span></span></div>
      </a>
    </div>
  </div>
</section>`,
      intro(P.nosotros, `\n      <a class="more" href="${href('nosotros/')}">${L(P.nosotros.enlace)} <span>→</span></a>`, 'nosotros'),
      `<section class="sec bg-arena" id="experiencias">
  <div class="wrap">
    ${encabezado(P.experiencias)}
    <div class="services">
      ${P.experiencias.tarjetas.map(c => `<a class="svc rv" href="${href(c.enlace)}">
        ${img(c.foto, L(c.alt), '(max-width:900px) 100vw, 33vw')}
        <div><span class="label">${L(c.etiqueta)}</span><h3>${L(c.titulo)}</h3><p>${L(c.texto)}</p><span class="go">${L(P.experiencias.boton)} <span>→</span></span></div>
      </a>`).join('\n      ')}
    </div>
  </div>
</section>`,
      pilares(P.pilares),
      resenas(P.resenas, 'resenas'),
      fundadora(P.fundadora),
      `<section class="quote">
  ${img(P.frase.foto, '', '100vw', false, ' id="par"')}
  <div class="wrap">
    <h2>${L(P.frase.texto)}</h2>
    <span class="label">${P.frase.firma}</span>
  </div>
</section>`,
      contacto(P.contacto),
    ].join('\n\n'),
    despues: pop ? `<dialog class="promo" id="promo" aria-labelledby="promo-title">
  <button class="promo-close" type="button" aria-label="Cerrar" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  <div class="promo-in">
    <figure>${img(pop.foto, L(pop.alt), '(max-width:720px) 100vw, 420px')}${pop.aviso?.es ? `<span class="badge">${L(pop.aviso)}</span>` : ''}</figure>
    <div class="promo-body">
      <span class="label">${L(pop.etiqueta)}</span>
      <h2 id="promo-title">${tituloTemp(pop)}</h2>
      <p>${L(pop.texto)}</p>
      ${pop.datos === true ? `<div class="promo-facts">${datosTemp()}</div>` : ''}
      <div class="promo-actions">
        <a class="btn btn-rojo" href="${href(pop.enlace)}">${L(pop.boton)}</a>
        <button class="btn btn-quiet" type="button" data-close>${L(POP.cerrar)}</button>
      </div>
    </div>
  </div>
</dialog>` : '',
  };
});

// Destinos
for (const d of DESTINOS) pagina(`destinos/${d.slug}/`, () => {
  const ruta = `destinos/${d.slug}/`;
  const m = [INICIO, [t('Destinos', 'Destinations'), 'destinos/'], [d.nombre, ruta]];
  const enIngles = (es, plantilla) => plantilla(EN[es] || es);
  return {
    seo: { titulo: d.titulo, descripcion: d.desc, foto: d.foto },
    schema: [migas(m), { '@type': 'TouristDestination', name: d.h1, description: d.desc, url: BASE + ruta, image: BASE + `fotos/og/${nf(d.foto)}.jpg` }],
    portada: portada({ foto: d.foto, alt: d.alt, etiqueta: d.region, titulo: d.h1, texto: d.lead }, m, `Hola Wanna Go, quiero viajar a ${d.nombre}.`),
    cuerpo: [
      intro({ ceja: t('01 · Por qué ir', '01 · Why go'), titulo: d.h2, parrafos: d.ps, foto: d.foto2, alt: d.alt2 }),
      tarjetas({ ceja: t('02 · Qué vivir', '02 · What to experience'), titulo: t(`Qué hacer en ${d.nombre}`, enIngles(d.nombre, n => `Things to do in ${n}`)) },
        d.vivir.map(([titulo, texto]) => ({ titulo, texto }))),
      datos(t('03 · Datos prácticos', '03 · Practical info'), d.datos),
      destinos({ ceja: t('04 · Sigue explorando', '04 · Keep exploring'), titulo: t('Combínalo con', 'Pair it with') }, d.otros, ' bg-arena'),
      cierre({ titulo: t(`Diseñemos tu viaje a ${d.nombre}`, enIngles(d.nombre, n => `Let's design your trip to ${n}`)), whatsapp: `Hola Wanna Go, quiero viajar a ${d.nombre}.`, foto: d.foto2 }),
    ].join('\n\n'),
  };
});

// Destinos (índice)
pagina('destinos/', () => {
  const P = PG.destinos;
  const m = [INICIO, [t('Destinos', 'Destinations'), 'destinos/']];
  return {
    seo: P.seo,
    schema: [migas(m), { '@type': 'ItemList', itemListElement: DESTINOS.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: BASE + `destinos/${d.slug}/`, name: d.h1 })) }],
    portada: portada(P.portada, m),
    cuerpo: [destinos(P.listado, DESTINOS.map(d => d.slug)), cierre(P.cierre)].join('\n\n'),
  };
});

// Servicios: A la medida, Viajes grupales y Eventos corporativos
for (const { slug, nombre } of SERVICIOS) pagina(`${slug}/`, () => {
  const P = PG[slug];
  const m = [INICIO, [nombre, `${slug}/`]];
  const salidas = () => `<section class="sec bg-petroleo">
  <div class="wrap">
    ${encabezado(P.salidas, true)}
    <div class="trips">
      ${TEMP ? `<a class="trip big rv" href="${href(TEMP.enlace)}">
        ${img(TEMP.foto, L(TEMP.alt), '(max-width:900px) 100vw, 60vw')}
        <div class="in">
          <span class="badge">${L(TEMP.aviso)}</span>
          <span class="meta">${L(TEMP.etiqueta)}</span>
          <h3>${tituloTemp(TEMP)}</h3>
          <span class="go">${L(TEMP.boton)} <span>→</span></span>
        </div>
      </a>` : ''}
      ${P.salidas.proximas.map(s => `<a class="trip rv" href="${href(s.enlace)}">
        ${img(s.foto, L(s.alt), '(max-width:900px) 100vw, 40vw')}
        <div class="in">
          <span class="badge soon">${L(s.aviso)}</span>
          <span class="meta"><span${s.fecha_por_definir ? ' class="tbd"' : ''}>${L(s.fecha)}</span></span>
          <h3>${L(s.titulo)}</h3>
        </div>
      </a>`).join('\n      ')}
    </div>
  </div>
</section>`;
  return {
    seo: P.seo,
    schema: [migas(m), { '@type': 'Service', name: nombre, serviceType: nombre, description: P.seo.descripcion, url: BASE + slug + '/', provider: { '@id': ORG['@id'] }, areaServed: { '@type': 'Country', name: 'Colombia' } }],
    portada: portada(P.portada, m, P.portada.whatsapp),
    cuerpo: [
      intro(P.intro),
      P.salidas ? salidas() : tarjetas(P.pasos),
      P.salidas ? tarjetas(P.siempre) : destinos(P.destinos, P.destinos.lista),
      resenas(P.resenas),
      cierre(P.cierre),
    ].join('\n\n'),
  };
});

// Nosotros
pagina('nosotros/', () => {
  const P = PG.nosotros;
  const m = [INICIO, ['Nosotros', 'nosotros/']];
  return {
    seo: P.seo,
    schema: [migas(m), { '@type': 'AboutPage', url: BASE + 'nosotros/', mainEntity: { '@id': ORG['@id'] } }],
    portada: portada(P.portada, m),
    cuerpo: [intro(P.historia), fundadora(P.fundadora), pilares(P.pilares), resenas(P.resenas), cierre(P.cierre)].join('\n\n'),
  };
});

// Contacto
pagina('contacto/', () => {
  const P = PG.contacto;
  const m = [INICIO, ['Contacto', 'contacto/']];
  return {
    seo: P.seo,
    schema: [migas(m), { '@type': 'ContactPage', url: BASE + 'contacto/', mainEntity: { '@id': ORG['@id'] } }],
    portada: portada(P.portada, m),
    cuerpo: contacto(P.canales, true),
  };
});

// ---------- Marruecos: solo el bloque SEO entre <!-- seo --> … <!-- /seo --> ----------

{
  pre = '../';
  const archivo = 'dist/marruecos/index.html';
  const m = [INICIO, ['Viajes grupales', 'viajes-grupales/'], ['Marruecos entre mujeres', 'marruecos/']];
  const bloque = seo({
    ruta: 'marruecos/', foto: 'mujer-dunas',
    titulo: 'Marruecos entre mujeres · Wanna Go',
    desc: 'Viaje grupal solo para mujeres a Marruecos: 10 días, 7 destinos y máximo 16 viajeras, con anfitriona de Wanna Go. Medinas, palacios y una noche en el Sahara.',
    schema: [migas(m), { '@type': 'TouristTrip', name: 'Marruecos entre mujeres', description: 'Viaje grupal solo para mujeres a Marruecos: 10 días, 7 destinos y máximo 16 viajeras.', url: BASE + 'marruecos/', image: BASE + 'fotos/og/mujer-dunas.jpg', touristType: 'Mujeres', provider: { '@id': ORG['@id'] } }],
  }, '');
  const h = readFileSync(archivo, 'utf8');
  const a = h.indexOf('<!-- seo -->') + '<!-- seo -->'.length, b = h.indexOf('<!-- /seo -->');
  if (a < 12 || b < 0) throw new Error(`Falta el marcador <!-- seo --> en ${archivo}`);
  writeFileSync(archivo, h.slice(0, a) + '\n' + bloque + '\n' + h.slice(b));
}

// ---------- sitemap.xml y robots.txt ----------

URLS.sort((a, b) => a.length - b.length);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(u => `  <url><loc>${BASE}${u}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);

// Datos para ver el panel en modo demo (/admin/?demo) sin Supabase
writeFileSync('dist/admin/demo.json', JSON.stringify({
  paginas: Object.fromEntries(PAGINAS.map(({ id }) => [id, leer(`contenido/paginas/${id}.json`)])),
  destinos: readdirSync('contenido/destinos').filter(f => f.endsWith('.json')).map(f => leer('contenido/destinos/' + f)),
  viajes: VIAJES,
}));

console.log(`Temporada: ${TEMP ? L(TEMP.titulo) + ' ' + L(TEMP.titulo_resalte) : 'ninguna'} · ${URLS.length} URLs · ${INDEXAR ? 'indexables' : 'con noindex (borrador)'}`);

// Wanna Go · construye el sitio completo en dist/ a partir de contenido/ (lo que edita el panel),
// publico/ (CSS, JS, fuente y la landing de Marruecos) y panel/ (que queda en /admin).
// Uso: npm run construir  (corre antes herramientas/fotos.py, que deja las fotos optimizadas en dist/fotos)
// Textos: los de contenido/ vienen en {es, en}; los fijos del diseño van con t('español', 'English').
// El inglés de cada página llega a i18n.js como WG_EN_PAGE.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { PAGINAS } from '../panel/esquema.js';

const BASE = 'https://wannago.com.co/'; // dominio propio (Hostinger)
const INDEXAR = true; // false = todo el sitio con noindex (fuera de Google)
const V = '20261028c';  // sube este número cuando cambies un CSS o JS
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

// Páginas fuera de Google y del sitemap: Gracias siempre; Marruecos hasta que en el panel se active «Mostrar en Google»
const BORRADORES = ['gracias/', ...(PG.marruecos.seo.indexar ? [] : ['marruecos/'])];

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

// Blog: un archivo por entrada en contenido/blog/ (solo las publicadas), de la más nueva a la más vieja
const BLOG = readdirSync('contenido/blog').filter(f => f.endsWith('.json'))
  .map(f => leer('contenido/blog/' + f)).filter(e => e.publicado !== false)
  .sort((a, b) => (a.fecha < b.fecha) - (a.fecha > b.fecha));
const fechaLarga = f => {
  const d = new Date(f + 'T12:00:00');
  return L({ es: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }), en: d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) });
};

// Formato sencillo del blog: ## subtítulo, ### subtítulo menor, **negrita**, *cursiva*, - lista, > cita, [texto](enlace)
const md = texto => {
  const enLinea = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:)[^)\s]+)\)/g, (_, txt, url) =>
      `<a href="${url}"${url.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${txt}</a>`);
  return (texto || '').replace(/\r/g, '').split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map(b =>
    b.startsWith('### ') ? `<h3>${enLinea(b.slice(4))}</h3>`
    : b.startsWith('## ') ? `<h2>${enLinea(b.slice(3))}</h2>`
    : b.startsWith('> ') ? `<blockquote>${enLinea(b.replace(/^> ?/gm, ''))}</blockquote>`
    : /^[-*] /.test(b) ? `<ul>${b.split('\n').map(l => `<li>${enLinea(l.replace(/^[-*] /, ''))}</li>`).join('')}</ul>`
    : `<p>${b.split('\n').map(enLinea).join('<br>')}</p>`).join('\n');
};

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
      <li><a href="${href('blog/')}">Blog</a></li>
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
      <li><a href="${href('blog/')}">Blog</a></li>
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
    <nav aria-label="Wanna Go"><b>Wanna Go</b><a href="${href('nosotros/')}">Nosotros</a><a href="${href('blog/')}">Blog</a><a href="${href('contacto/')}">Contacto</a><a href="${WA}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:wannagoco@gmail.com">wannagoco@gmail.com</a><a href="https://www.instagram.com/wannagocol/" target="_blank" rel="noopener">Instagram</a></nav>
  </div>
  <div class="wrap foot-bottom"><span>Viajes con propósito · RNT 65568 · Medellín, Colombia</span><span>Fotos de referencia: Unsplash · <a href="${href('admin/')}" rel="nofollow">${t('Panel', 'Admin')}</a></span></div>
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
    ${s.foto ? `<figure class="rv">${img(s.foto, L(s.alt), '(max-width:860px) 100vw, 45vw')}</figure>` : `<div class="ph rv">${t('Foto pendiente', 'Photo pending')}</div>`}
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
    <form class="form rv" id="lead" data-gracias="${href('gracias/')}" novalidate>
      <label for="f-name">Nombre<input id="f-name" name="name" autocomplete="name" placeholder="Tu nombre"></label>
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
    INDEXAR && !BORRADORES.includes(p.ruta) ? '' : '<meta name="robots" content="noindex">',
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

// Blog: índice y una página por entrada
const tarjetaEntrada = e => `<a class="svc rv" href="${href('blog/' + e.url + '/')}">
        ${img(e.foto, '', '(max-width:900px) 100vw, 33vw')}
        <div><span class="label">${fechaLarga(e.fecha)}</span><h3>${L(e.titulo)}</h3><p>${L(e.resumen)}</p><span class="go">${t('Leer', 'Read')} <span>→</span></span></div>
      </a>`;
const entradas = (s, lista, fondo = '') => `<section class="sec${fondo}">
  <div class="wrap">
    ${encabezado(s)}
    ${lista.length ? `<div class="services">
      ${lista.map(tarjetaEntrada).join('\n      ')}
    </div>` : `<p class="body-lg vacio-blog">${L(s.vacio)}</p>`}
  </div>
</section>`;

pagina('blog/', () => {
  const P = PG.blog;
  const m = [INICIO, ['Blog', 'blog/']];
  return {
    seo: P.seo,
    schema: [migas(m), { '@type': 'Blog', name: L(P.portada.titulo), url: BASE + 'blog/', publisher: { '@id': ORG['@id'] },
      blogPost: BLOG.map(e => ({ '@type': 'BlogPosting', headline: e.titulo.es, url: BASE + `blog/${e.url}/`, datePublished: e.fecha })) }],
    portada: portada(P.portada, m),
    cuerpo: [entradas(P.listado, BLOG), cierre(P.cierre)].join('\n\n'),
  };
});

for (const e of BLOG) pagina(`blog/${e.url}/`, () => {
  const P = PG.blog;
  const ruta = `blog/${e.url}/`;
  const m = [INICIO, ['Blog', 'blog/'], [L(e.titulo), ruta]];
  const otras = BLOG.filter(x => x !== e).slice(0, 3);
  return {
    seo: { titulo: { es: `${e.titulo.es} · Blog Wanna Go`, en: `${e.titulo.en || e.titulo.es} · Wanna Go Blog` }, descripcion: e.resumen.es.slice(0, 160), foto: e.foto },
    schema: [migas(m), { '@type': 'BlogPosting', headline: e.titulo.es, description: e.resumen.es, datePublished: e.fecha, dateModified: (e.actualizado || e.fecha).slice(0, 10),
      image: BASE + `fotos/og/${nf(e.foto)}.jpg`, url: BASE + ruta, author: { '@type': 'Person', name: e.autor || 'Wanna Go' }, publisher: { '@id': ORG['@id'] } }],
    portada: portada({ foto: e.foto, alt: e.alt, etiqueta: fechaLarga(e.fecha), titulo: e.titulo, texto: e.resumen }, m),
    cuerpo: [
      `<section class="sec">
  <div class="wrap">
    <article class="post rv">
      <div class="post-es" lang="es">
${md(e.cuerpo.es)}
      </div>${e.cuerpo.en ? `
      <div class="post-en" lang="en">
${md(e.cuerpo.en)}
      </div>` : ''}
      <p class="post-autor"><span>${t('Por', 'By')}</span> ${esc(e.autor || 'Wanna Go')}</p>
    </article>
  </div>
</section>`,
      otras.length ? entradas({ ceja: P.listado.ceja, titulo: { es: 'Sigue leyendo', en: 'Keep reading' } }, otras, ' bg-arena') : '',
      cierre(P.cierre),
    ].filter(Boolean).join('\n\n'),
  };
});

// Gracias: a donde llegan los formularios (fuera de Google)
pagina('gracias/', () => {
  const P = PG.gracias.portada;
  return {
    seo: PG.gracias.seo,
    schema: [],
    portada: `<header class="hero">
  ${img(P.foto, L(P.alt), '100vw', true)}
  <div class="wrap">
    <span class="label">${L(P.etiqueta)}</span>
    <h1>${L(P.titulo)}</h1>
    <p class="lead">${L(P.texto)}</p>
    <div class="row">
      <a class="btn btn-rojo" href="${WA}" target="_blank" rel="noopener">${L(P.boton)}</a>
      <a class="btn btn-line" href="./">${t('Volver al inicio', 'Back to home')}</a>
    </div>
  </div>
</header>`,
    cuerpo: '',
  };
});

// ---------- Marruecos entre mujeres: landing con diseño propio (css/marruecos.css) ----------

{
  pre = '../';
  ENP = {};
  const M = PG.marruecos, ruta = 'marruecos/';
  // Texto con marcas: *resaltado* → <em>, {pendiente} → recuadro punteado. Cada pieza lleva su inglés.
  const R = v => {
    if (typeof v === 'string') v = { es: v, en: v };
    const corta = s => s.split(/(\*[^*]+\*|\{[^}]+\})/);
    const es = corta(v.es), en = corta(v.en || v.es);
    return es.map((p, i) => {
      const m = p.match(/^([*{])(.*)[*}]$/), txt = m ? m[2] : p, k = txt.trim();
      if (k && es.length === en.length) t(k, (en[i].match(/^[*{](.*)[*}]$/)?.[1] ?? en[i]).trim() || k);
      return !m ? txt : m[1] === '*' ? `<em>${txt}</em>` : `<span class="tbd">${txt}</span>`;
    }).join('');
  };
  const { portada: P, viaje: Vj, itinerario: I, noche: N, incluye: Inc, precio: Pr, anfitriona: A, preguntas: Q, reserva: Rs } = M;
  const enlaces = [['#viaje', 'El viaje'], ['#ruta', 'Itinerario'], ['#incluye', 'Incluye'], ['#precio', 'Inversión'], ['#faq', 'Preguntas']]
    .map(([h, n]) => `<li><a href="${h}">${n}</a></li>`);
  const m = [INICIO, ['Viajes grupales', 'viajes-grupales/'], ['Marruecos entre mujeres', ruta]];
  const pct = Pr.cupos_total ? Math.min(100, Math.round(Pr.cupos_reservados / Pr.cupos_total * 100)) : 0;
  const cuerpo = `<nav id="nav">${M.aviso.activo ? `
  <div class="draft">${R(M.aviso.texto)}</div>` : ''}
  <div class="wrap">
    <a class="logo" href="../" aria-label="Wanna Go Colombia, volver al inicio">${ISO}</a>
    <ul>
      <li><a href="../">Wanna Go</a></li>
      ${enlaces.join('\n      ')}
    </ul>
    <div class="nav-actions"><button class="lang-btn" type="button" aria-label="Switch to English">EN</button><a class="btn btn-coral" href="#reserva">Reservar</a><button class="menu-btn" type="button" popovertarget="menu" aria-label="Abrir menú"><svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg></button></div>
  </div>
  <div class="menu" id="menu" popover>
    <div class="menu-top"><span class="label">Menú</span><button class="lang-btn" type="button" aria-label="Switch to English">EN</button><button class="menu-close" type="button" popovertarget="menu" popovertargetaction="hide" aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <ul>
      ${enlaces.join('\n      ')}
      <li><a href="../">Wanna Go</a></li>
    </ul>
    <div class="menu-foot">
      <a class="btn btn-coral" href="#reserva">${L(P.boton1)}</a>
      <p>Viajes con propósito · RNT 65568 · Medellín, Colombia</p>
    </div>
  </div>
</nav>

<header class="hero" id="top">
  ${img(P.foto, L(P.alt), '100vw', true)}
  <div class="wrap">
    <span class="kicker">${R(P.etiqueta)}</span>
    <h1><span><i>${R(P.titulo)}</i></span><span><i><em>${R(P.titulo_resalte)}</em></i></span></h1>
    <div class="hero-row">
      <div style="display:grid;gap:26px">
        <p class="lead">${R(P.texto)}</p>
        <div class="ctas">
          <a class="btn btn-coral" href="#reserva">${L(P.boton1)}</a>
          <a class="btn btn-line" href="#ruta">${L(P.boton2)}</a>
        </div>
      </div>
      <div class="facts">
        ${P.datos.map(d => `<div><b>${d.numero}</b>${L(d.texto)}</div>`).join('\n        ')}
      </div>
    </div>
  </div>
</header>

<section id="viaje">
  <div class="wrap intro">
    <div class="rv">
      <span class="kicker c">${R(Vj.ceja)}</span>
      <h2 style="margin-top:18px">${R(Vj.titulo)}</h2>
      <div class="pillars">
        ${Vj.pilares.map(x => `<div><h3>${R(x.titulo)}</h3><p>${R(x.texto)}</p></div>`).join('\n        ')}
      </div>
    </div>
    <div class="pics rv">
      ${img(Vj.foto1, L(Vj.alt1))}
      ${img(Vj.foto2, L(Vj.alt2))}
    </div>
  </div>
</section>

<div class="strip carousel" aria-label="Fotos del destino">
  <div class="strip-track" tabindex="0">
    ${M.galeria.fotos.map(f => `<figure>${img(f.foto, '', '(max-width:700px) 70vw, 330px')}<figcaption>${L(f.nombre)}</figcaption></figure>`).join('\n    ')}
  </div>
</div>

<section class="trip" id="ruta">
  <div class="wrap">
    <div class="head rv">
      <span class="kicker c">${R(I.ceja)}</span>
      <h2>${R(I.titulo)}</h2>
      <p>${R(I.texto)}</p>
    </div>
    <div class="trip-grid">
      <div class="stage" id="stage">
        ${I.capitulos.map((c, i) => img(c.foto, '', '100vw', false, i ? '' : ' class="on"')).join('\n        ')}
        <span class="place" id="place">${esc(I.capitulos[0]?.lugar || '')}</span>
      </div>
      <div class="chapters">
        ${I.capitulos.map((c, i) => `<article class="ch" data-i="${i}" data-place="${esc(c.lugar)}">
          ${img(c.foto, '', '100vw', false, ' class="mob"')}
          <span class="days">${R(c.dias)}</span>
          <h3>${R(c.titulo)}</h3>
          <p>${R(c.texto)}</p>${c.detalle?.length ? `
          <ul>${c.detalle.map(d => `<li><b>${R(d.dia)}</b>${R(d.texto)}</li>`).join('')}</ul>` : ''}
        </article>`).join('\n        ')}
      </div>
    </div>
  </div>
</section>

<section class="night">
  ${img(N.foto, L(N.alt), '100vw', false, ' id="par"')}
  <div class="wrap">
    <span class="kicker" style="color:var(--sand)">${R(N.ceja)}</span>
    <h2>${R(N.titulo).replace('<em>', '<em style="color:#fff">')}</h2>
    <p>${R(N.texto)}</p>
  </div>
</section>

<section id="incluye">
  <div class="wrap">
    <div class="head rv">
      <span class="kicker c">${R(Inc.ceja)}</span>
      <h2>${R(Inc.titulo)}</h2>
    </div>
    <div class="inc">
      <div class="rv">
        <h3>${L(Inc.titulo_si)}</h3>
        <ul>
          ${Inc.si.map(x => `<li>${R(x)}</li>`).join('\n          ')}
        </ul>
      </div>
      <div class="rv no">
        <h3>${L(Inc.titulo_no)}</h3>
        <ul>
          ${Inc.no.map(x => `<li>${R(x)}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="price" id="precio">
  <div class="wrap">
    <figure class="rv">${img(Pr.foto, L(Pr.alt))}</figure>
    <div class="stack rv">
      <span class="kicker c">${R(Pr.ceja)}</span>
      <h2>${R(Pr.titulo)}</h2>
      <div>
        <p style="color:var(--muted);font-size:14px">${R(Pr.nota)}</p>
        <div class="amt">${R(Pr.valor)}</div>
      </div>
      <div class="rows">
        ${Pr.filas.map(f => `<div class="row"><span>${R(f.etiqueta)}</span><b>${R(f.valor)}</b></div>`).join('\n        ')}
      </div>${Pr.mostrar_cupos ? `
      <div class="seats">
        <div class="row" style="border:0;padding:0"><span>${R(Pr.cupos_etiqueta)}</span><b>${Pr.cupos_reservados} <span>${t('de', 'of')}</span> ${Pr.cupos_total}</b></div>
        <div class="bar"><i id="seatbar" data-pct="${pct}"></i></div>
      </div>` : ''}
      <a class="btn btn-coral" href="#reserva" style="justify-self:start">${L(Pr.boton)}</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap host">
    ${A.foto ? `<div class="rv">${img(A.foto, L(A.alt), '(max-width:860px) 100vw, 45vw')}</div>` : `<div class="ph rv">${t('Foto pendiente', 'Photo pending')}</div>`}
    <div class="rv">
      <span class="kicker c">${R(A.ceja)}</span>
      <blockquote style="margin-top:20px">${R(A.cita)}</blockquote>
      <cite>${R(A.firma)}</cite>
    </div>
  </div>
</section>

<section id="faq" style="background:var(--paper)">
  <div class="wrap">
    <div class="head rv">
      <span class="kicker c">${R(Q.ceja)}</span>
      <h2>${R(Q.titulo)}</h2>
    </div>
    <div class="faq">
      ${Q.lista.map(x => `<details><summary>${R(x.pregunta)}</summary><p>${R(x.respuesta)}</p></details>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="join" id="reserva">
  ${img(Rs.foto)}
  <div class="wrap">
    <div class="rv" style="display:grid;gap:22px">
      <span class="kicker" style="color:var(--sand)">${R(Rs.ceja)}</span>
      <h2>${R(Rs.titulo).replace('<em>', '<em style="color:#fff">')}</h2>
      <p style="font-size:18px;max-width:42ch;opacity:.9">${R(Rs.texto)}</p>
      <p style="font-size:14px;opacity:.85">WhatsApp: <a href="${WA}" target="_blank" rel="noopener">+57 312 289 9185</a> · wannagoco@gmail.com</p>
    </div>
    <form id="lead" class="rv" data-gracias="../gracias/" novalidate>
      <label for="f-name">Nombre completo<input id="f-name" name="name" autocomplete="name" placeholder="Tu nombre"></label>
      <button class="btn btn-coral" type="submit">${L(Rs.boton)}</button>
      <p id="msg" class="ok" hidden></p>
    </form>
  </div>
</section>

<footer>
  <div class="wrap">
    <a class="logo" href="../" aria-label="Wanna Go Colombia">${ISO}</a>
    <span>Viajes con propósito · RNT 65568 · Medellín, Colombia</span>
    <a href="../admin/" rel="nofollow">Panel</a>
  </div>
</footer>

${WA_FLOAT}`;
  const titulo = L(M.seo.titulo);
  const head = seo({
    ruta, foto: M.seo.foto, titulo, desc: M.seo.descripcion,
    schema: [migas(m), { '@type': 'TouristTrip', name: 'Marruecos entre mujeres', description: M.seo.descripcion, url: BASE + ruta, image: BASE + `fotos/og/${nf(M.seo.foto)}.jpg`, touristType: 'Mujeres', provider: { '@id': ORG['@id'] } }],
  }, titulo + cuerpo);
  mkdirSync('dist/' + ruta, { recursive: true });
  writeFileSync(`dist/${ruta}index.html`, `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
<link rel="icon" href="${ICONO}">
${['marruecos.css', 'carrusel.css', 'wa.css', 'menu.css'].map(c => `<link rel="stylesheet" href="../css/${c}?v=${V}">`).join('\n')}
</head>
<body>
${cuerpo}

<script src="../js/marruecos.js?v=${V}"></script>
${['carrusel.js', 'i18n.js', 'wa.js'].map(s => `<script src="../js/${s}?v=${V}"></script>`).join('\n')}
</body>
</html>
`);
  ENP = null;
}

// ---------- sitemap.xml y robots.txt ----------

URLS.sort((a, b) => a.length - b.length);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.filter(u => INDEXAR && !BORRADORES.includes(u)).map(u => `  <url><loc>${BASE}${u}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${BASE}sitemap.xml\n`);

// Datos para ver el panel en modo demo (/admin/?demo) sin Supabase
writeFileSync('dist/admin/demo.json', JSON.stringify({
  paginas: Object.fromEntries(PAGINAS.map(({ id }) => [id, leer(`contenido/paginas/${id}.json`)])),
  destinos: readdirSync('contenido/destinos').filter(f => f.endsWith('.json')).map(f => leer('contenido/destinos/' + f)),
  viajes: VIAJES,
  blog: readdirSync('contenido/blog').filter(f => f.endsWith('.json')).map(f => leer('contenido/blog/' + f)),
}));

console.log(`Temporada: ${TEMP ? L(TEMP.titulo) + ' ' + L(TEMP.titulo_resalte) : 'ninguna'} · ${URLS.length} URLs · ${INDEXAR ? `abiertas a Google (menos ${BORRADORES.join(', ')})` : 'con noindex (borrador)'}`);

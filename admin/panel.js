// Panel Wanna Go · edita en Supabase el contenido del sitio y pide publicarlo.
// Guardar cambia la base de datos; «Publicar cambios» regenera el sitio en GitHub (2 a 3 minutos).
// Sin Supabase conectado (config.js vacío) se prueba en local con ?demo, leyendo _datos/.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
import { PAGINAS } from './esquema.js?v=2';

const CFG = window.WG_SUPABASE || {};
const DEMO = new URLSearchParams(location.search).has('demo');
const SITIO = new URL('../', location.href).href;
const sb = CFG.url && CFG.clave && !DEMO ? createClient(CFG.url, CFG.clave) : null;
const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

// ---------- utilidades ----------

const h = (tag, attrs = {}, ...hijos) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && !k.includes('-')) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...hijos.flat(Infinity).filter(x => x != null && x !== false));
  return el;
};
const app = document.getElementById('app');
const toast = (texto, error) => {
  const t = document.getElementById('toast');
  t.textContent = texto;
  t.className = error ? 'on error' : 'on';
  clearTimeout(toast.reloj);
  toast.reloj = setTimeout(() => (t.className = ''), 5000);
};
const listo = m => toast(DEMO ? `${m} (modo demo: solo en esta pestaña)` : m);
const fallo = e => toast(e?.message || String(e), true);
const copia = o => structuredClone(o);
const bi = () => ({ es: '', en: '' });
const raiz = f => (f || '').replace(/\.[a-z]+$/i, '');
const demoFotos = {};
const fotoURL = f => demoFotos[f] || `${SITIO}fotos/${raiz(f)}-800.webp`;
const fotoRespaldo = f => (CFG.url ? `${CFG.url}/storage/v1/object/public/fotos/${encodeURIComponent(f)}` : '');
const limpio = nombre => nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
const boton = (texto, fn, { off, cls = 'mini', titulo } = {}) => h('button', { type: 'button', class: cls, onclick: fn, disabled: off, title: titulo, 'aria-label': titulo }, texto);
const miniatura = f => {
  const img = h('img', { alt: '', loading: 'lazy' });
  if (f) { img.onerror = () => { img.onerror = null; img.src = fotoRespaldo(f); }; img.src = fotoURL(f); }
  return img;
};

// ---------- datos: Supabase o demo ----------

const api = sb ? {
  async listar(t, orden = 'orden', desc = false) {
    const { data, error } = await sb.from(t).select('*').order(orden, { ascending: !desc });
    if (error) throw error;
    return data;
  },
  async guardar(t, filas, nuevo) {
    const { error } = nuevo ? await sb.from(t).insert(filas) : await sb.from(t).upsert(filas);
    if (error) throw new Error(error.code === '23505' ? 'Ya existe un registro con esa dirección (url).' : error.message);
  },
  async borrar(t, col, val) {
    const { error } = await sb.from(t).delete().eq(col, val);
    if (error) throw error;
  },
  async cuadros(lista) {
    const { error } = await sb.rpc('guardar_cuadros', { lista });
    if (error) throw error;
  },
  async subir(archivo) {
    const base = limpio(archivo.name);
    const subir = n => sb.storage.from('fotos').upload(n, archivo, { contentType: archivo.type });
    let nombre = base, { error } = await subir(nombre);
    if (error && /exist|duplicate/i.test(error.message)) {
      nombre = base.replace(/(\.[a-z]+)$/i, `-${Date.now().toString(36)}$1`);
      ({ error } = await subir(nombre));
    }
    if (error) throw error;
    return nombre;
  },
  async publicar() {
    const { error } = await sb.functions.invoke('publicar');
    if (error) throw new Error('No se pudo publicar: ' + error.message);
  },
} : demoApi();

function demoApi() {
  let db;
  const cargar = async () => {
    if (db) return db;
    const json = async u => {
      const r = await fetch(new URL(u, SITIO));
      if (!r.ok) throw new Error('El modo demo solo funciona en local: python3 -m http.server 8765 --directory sitio');
      return r.json();
    };
    const v = await json('_datos/viajes.json');
    const indice = await fetch(new URL('_datos/destinos/', SITIO)).then(r => r.text());
    const urls = [...indice.matchAll(/href="([a-z0-9-]+)\.json"/g)].map(m => m[1]);
    const archivo = f => f.split('/').pop();
    db = {
      paginas: await Promise.all(PAGINAS.map(async p => ({ id: p.id, contenido: await json(`_datos/paginas/${p.id}.json`) }))),
      temporadas: v.temporadas.map((t, i) => ({ ...t, id: crypto.randomUUID(), orden: i + 1, hasta: t.hasta || null, foto: archivo(t.foto) })),
      cuadros: v.colombia.map((c, i) => ({ id: crypto.randomUUID(), orden: i + 1, destino: c.destino, aviso: c.aviso || null })),
      destinos: (await Promise.all(urls.map(u => json(`_datos/destinos/${u}.json`))))
        .map(d => ({ ...d, publicado: true, foto: archivo(d.foto), foto2: archivo(d.foto2) })),
      solicitudes: [], publicaciones: [],
    };
    return db;
  };
  const clave = t => (t === 'destinos' ? 'url' : 'id');
  return {
    async listar(t, orden = 'orden', desc = false) {
      const d = await cargar();
      return copia(d[t]).sort((a, b) => ((a[orden] > b[orden]) - (a[orden] < b[orden])) * (desc ? -1 : 1));
    },
    async guardar(t, filas, nuevo) {
      const d = await cargar(), k = clave(t);
      for (const f of [].concat(filas)) {
        f[k] ??= crypto.randomUUID();
        const i = d[t].findIndex(x => x[k] === f[k]);
        if (i >= 0 && nuevo) throw new Error('Ya existe un registro con esa dirección (url).');
        if (i < 0) d[t].push(copia(f)); else d[t][i] = { ...d[t][i], ...copia(f) };
      }
    },
    async borrar(t, col, val) {
      const d = await cargar();
      d[t] = d[t].filter(x => x[col] !== val);
      if (t === 'destinos') d.cuadros = d.cuadros.filter(c => c.destino !== val);
    },
    async cuadros(lista) {
      const d = await cargar();
      d.cuadros = lista.map((c, i) => ({ id: crypto.randomUUID(), orden: i + 1, destino: c.destino, aviso: c.aviso || null }));
    },
    async subir(archivo) {
      const n = limpio(archivo.name);
      demoFotos[n] = URL.createObjectURL(archivo);
      return n;
    },
    async publicar() {},
  };
}

// ---------- campos de formulario ----------

const B = (label, name, o = {}) => ({ tipo: 'bi', label, name, ...o });
const CAMPOS = {
  temporadas: [
    { tipo: 'bool', name: 'activo', label: 'Activo' },
    { tipo: 'fecha', name: 'hasta', label: 'Mostrar hasta (último día)', ayuda: 'Normalmente la fecha de salida. Vacío: sin límite. Al día siguiente entra el próximo viaje de la fila.' },
    { tipo: 'texto', name: 'enlace', label: 'Página del viaje', ayuda: 'Ej.: marruecos/ o destinos/cartagena/' },
    { tipo: 'foto', name: 'foto', label: 'Foto' },
    B('Descripción de la foto', 'alt', { ayuda: 'Para Google y lectores de pantalla.' }),
    B('Título', 'titulo'),
    B('Parte resaltada del título', 'titulo_resalte', { ayuda: 'Ej.: «entre mujeres»' }),
    B('Etiqueta', 'etiqueta', { ayuda: 'Ej.: Viaje grupal · Solo mujeres' }),
    B('Aviso', 'aviso', { ayuda: 'Ej.: Cupos abiertos' }),
    B('Resumen', 'resumen', { largo: true }),
    { tipo: 'lista', name: 'datos', label: 'Datos destacados', nuevo: { numero: '', texto: bi() },
      campos: [{ tipo: 'texto', name: 'numero', label: 'Número' }, B('Texto', 'texto')] },
    { tipo: 'texto', name: 'salida', label: 'Salida', ayuda: 'Ej.: 2027 o 15 de marzo de 2027' },
    { tipo: 'bool', name: 'salida_por_definir', label: 'Salida por definir (se marca como borrador)' },
    B('Texto del botón', 'boton'),
  ],
  destinos: [
    { tipo: 'texto', name: 'url', label: 'Dirección (url)', fija: true, patron: '[a-z0-9-]+',
      ayuda: 'La página queda en destinos/<url>/. Solo minúsculas, números y guiones. No se puede cambiar después de crear.' },
    { tipo: 'numero', name: 'orden', label: 'Orden' },
    { tipo: 'bool', name: 'publicado', label: 'Publicado en el sitio' },
    B('Nombre', 'nombre'), B('Título grande (H1)', 'h1'), B('Región', 'region'), B('Frase corta para tarjetas', 'corto'),
    { tipo: 'foto', name: 'foto', label: 'Foto de portada' }, B('Descripción de la foto de portada', 'alt'),
    { tipo: 'foto', name: 'foto2', label: 'Segunda foto' }, B('Descripción de la segunda foto', 'alt2'),
    B('Título para Google', 'titulo_seo', { max: 60 }),
    { tipo: 'largo', name: 'descripcion_seo', label: 'Descripción para Google (español)', max: 155 },
    B('Introducción', 'lead', { largo: true }),
    B('Subtítulo de «Por qué ir»', 'h2'),
    { tipo: 'lista', name: 'parrafos', label: 'Párrafos de «Por qué ir»', nuevo: bi(), item: B('', '', { largo: true }) },
    { tipo: 'lista', name: 'vivir', label: 'Qué vivir', nuevo: { titulo: bi(), texto: bi() }, campos: [B('Título', 'titulo'), B('Texto', 'texto')] },
    { tipo: 'grupo', name: 'datos', label: 'Datos prácticos',
      campos: [B('Cómo llegar', 'llegar'), B('Mejor época', 'epoca'), B('Tiempo sugerido', 'tiempo'), B('Ideal para', 'ideal')] },
    { tipo: 'destinos', name: 'otros', label: 'Combínalo con', ayuda: 'Destinos que salen al final de la página.' },
  ],
};

const contador = (el, max) => {
  const c = h('span', { class: 'contador' });
  const act = () => { c.textContent = `${el.value.length} / ${max}`; c.classList.toggle('pasado', el.value.length > max); };
  el.addEventListener('input', act); act();
  return c;
};

function campo(def, valor, ctx = {}) {
  const id = 'c' + Math.random().toString(36).slice(2, 9);
  const ayuda = def.ayuda && h('small', { class: 'ayuda' }, def.ayuda);
  const etiqueta = h('label', { class: 'lbl', for: id }, def.label);
  switch (def.tipo) {
    case 'texto': case 'numero': case 'fecha': {
      const i = h('input', { id, type: { numero: 'number', fecha: 'date' }[def.tipo] || 'text', value: valor ?? '', pattern: def.patron, readOnly: def.fija && ctx.existente });
      const leer = () => def.tipo === 'numero' ? Number(i.value || 0) : def.tipo === 'fecha' ? (i.value || null) : i.value.trim();
      return { el: h('div', { class: 'campo' }, etiqueta, i, ayuda), leer };
    }
    case 'largo': {
      const i = h('textarea', { id, rows: 3, value: valor ?? '' });
      return { el: h('div', { class: 'campo' }, etiqueta, i, def.max && contador(i, def.max), ayuda), leer: () => i.value.trim() };
    }
    case 'bool': {
      const i = h('input', { id, type: 'checkbox', checked: !!valor });
      return { el: h('label', { class: 'campo interruptor', for: id }, i, h('span', {}, def.label)), leer: () => i.checked };
    }
    case 'bi': {
      const v = valor || bi();
      const caja = (lang, nombre) => {
        const e = h(def.largo ? 'textarea' : 'input', { value: v[lang] ?? '', rows: def.largo ? 4 : null, 'aria-label': `${def.label || 'Texto'} · ${nombre}` });
        return [e, h('label', {}, h('span', { class: 'idioma' }, nombre), e, def.max && contador(e, def.max))];
      };
      const [es, cajaEs] = caja('es', 'Español'), [en, cajaEn] = caja('en', 'English');
      return {
        el: h('fieldset', { class: 'campo bi' }, h('legend', {}, def.label || ''), h('div', { class: 'par' }, cajaEs, cajaEn), ayuda),
        leer: () => ({ es: es.value.trim(), en: en.value.trim() }),
      };
    }
    case 'foto': {
      let nombre = valor || '';
      const prev = h('img', { alt: '' });
      const mostrar = () => {
        if (!nombre) return prev.removeAttribute('src');
        prev.onerror = () => { prev.onerror = null; prev.src = fotoRespaldo(nombre); };
        prev.src = fotoURL(nombre);
      };
      const texto = h('span', { class: 'archivo' }, nombre || 'Sin foto');
      const input = h('input', {
        id, type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'oculto',
        onchange: async () => {
          const f = input.files[0];
          if (!f) return;
          try {
            const bmp = await createImageBitmap(f);
            if (Math.max(bmp.width, bmp.height) < 1600) toast(`La foto mide ${bmp.width}×${bmp.height} px. Se ve mejor con al menos 1600 px.`, true);
            texto.textContent = 'Subiendo…';
            nombre = await api.subir(f);
            mostrar();
          } catch (e) { fallo(e); }
          texto.textContent = nombre || 'Sin foto';
          input.value = '';
        },
      });
      mostrar();
      return {
        el: h('div', { class: 'campo' }, etiqueta,
          h('div', { class: 'foto' }, prev, h('div', {}, texto, h('label', { class: 'btn sec', for: id }, nombre ? 'Cambiar foto' : 'Subir foto'), input)),
          h('small', { class: 'ayuda' }, 'JPG, PNG o WebP de al menos 1600 px. El sitio la optimiza solo.')),
        leer: () => nombre,
      };
    }
    case 'grupo': {
      const partes = def.campos.map(c => [c.name, campo(c, valor?.[c.name], ctx)]);
      return {
        el: h('fieldset', { class: 'campo grupo' }, h('legend', {}, def.label || ''), partes.map(p => p[1].el)),
        leer: () => Object.fromEntries(partes.map(([n, p]) => [n, p.leer()])),
      };
    }
    case 'lista': {
      const items = h('div', { class: 'items' });
      const filas = [];
      const nuevo = v => (def.item ? campo(def.item, v, ctx) : campo({ tipo: 'grupo', campos: def.campos }, v, ctx));
      const mover = (i, d) => { [filas[i], filas[i + d]] = [filas[i + d], filas[i]]; pintar(); };
      const pintar = () => items.replaceChildren(...filas.map((f, i) => h('div', { class: 'item' }, f.el,
        h('div', { class: 'item-acc' },
          boton('↑', () => mover(i, -1), { off: i === 0, titulo: 'Subir' }),
          boton('↓', () => mover(i, 1), { off: i === filas.length - 1, titulo: 'Bajar' }),
          boton('Quitar', () => { filas.splice(i, 1); pintar(); }, { cls: 'mini peligro' })))));
      (valor || []).forEach(v => filas.push(nuevo(v)));
      pintar();
      return {
        el: h('fieldset', { class: 'campo lista' }, h('legend', {}, def.label), items,
          boton('+ Agregar', () => { filas.push(nuevo(copia(def.nuevo))); pintar(); }, { cls: 'btn sec' }), ayuda),
        leer: () => filas.map(f => f.leer()),
      };
    }
    case 'destinos': {
      const marcas = (ctx.destinos || []).filter(d => d.url !== ctx.url)
        .map(d => [d.url, h('input', { type: 'checkbox', checked: (valor || []).includes(d.url) })]);
      return {
        el: h('fieldset', { class: 'campo' }, h('legend', {}, def.label),
          h('div', { class: 'opciones' }, marcas.map(([u, i]) => h('label', {}, i, (ctx.destinos.find(d => d.url === u).nombre.es)))), ayuda),
        leer: () => marcas.filter(([, i]) => i.checked).map(([u]) => u),
      };
    }
  }
  throw new Error('Tipo de campo desconocido: ' + def.tipo);
}

function formulario(campos, fila, ctx) {
  const partes = campos.map(c => [c.name, campo(c, fila[c.name], ctx)]);
  return {
    el: h('div', { class: 'form' }, partes.map(p => p[1].el)),
    leer: () => ({ ...fila, ...Object.fromEntries(partes.map(([n, p]) => [n, p.leer()])) }),
  };
}

function editor(main, { titulo, tabla, campos, fila, existente, ctx, volver }) {
  const f = formulario(campos, fila, { ...ctx, existente, url: fila.url });
  const guardar = async e => {
    const b = e.currentTarget;
    b.disabled = true;
    try {
      const datos = f.leer();
      if (tabla === 'destinos' && !/^[a-z0-9-]+$/.test(datos.url)) throw new Error('La dirección (url) solo admite minúsculas, números y guiones.');
      await api.guardar(tabla, datos, !existente);
      listo('Guardado. Pulsa «Publicar cambios» cuando quieras verlo en el sitio.');
      volver();
    } catch (er) { fallo(er); b.disabled = false; }
  };
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, titulo), boton('← Volver', volver, { cls: 'btn sec' })),
    f.el,
    h('div', { class: 'barra' }, boton('Guardar', guardar, { cls: 'btn rojo' }), boton('Cancelar', volver, { cls: 'btn sec' })),
  );
  scrollTo(0, 0);
}

// ---------- vistas ----------

async function vistaTemporadas(main) {
  const filas = await api.listar('temporadas');
  const vigente = filas.find(t => t.activo && (!t.hasta || t.hasta >= hoy));
  const estado = t => t === vigente ? ['En el sitio ahora', 'vivo'] : !t.activo ? ['Inactivo', 'apagado'] : t.hasta && t.hasta < hoy ? ['Vencido', 'apagado'] : ['En fila', ''];
  const volver = () => vistaTemporadas(main);
  const abrir = (fila, existente) => editor(main, { titulo: existente ? 'Editar viaje de temporada' : 'Nuevo viaje de temporada', tabla: 'temporadas', campos: CAMPOS.temporadas, fila, existente, volver });
  const mover = async (i, d) => {
    [filas[i], filas[i + d]] = [filas[i + d], filas[i]];
    filas.forEach((f, k) => (f.orden = k + 1));
    try { await api.guardar('temporadas', filas); volver(); } catch (e) { fallo(e); }
  };
  const borrar = async t => {
    if (!confirm(`¿Borrar «${t.titulo.es} ${t.titulo_resalte.es}»? No se puede deshacer.`)) return;
    try { await api.borrar('temporadas', 'id', t.id); listo('Borrado.'); volver(); } catch (e) { fallo(e); }
  };
  const vacio = { activo: true, hasta: null, enlace: '', foto: '', alt: bi(), titulo: bi(), titulo_resalte: bi(), etiqueta: bi(), aviso: bi(), resumen: bi(),
    datos: [], salida: '', salida_por_definir: false, boton: { es: 'Ver el viaje', en: 'See the trip' }, orden: filas.length + 1 };
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, 'Viajes de temporada'), boton('+ Nuevo viaje', () => abrir(copia(vacio), false), { cls: 'btn rojo' })),
    h('p', { class: 'intro' }, 'El sitio muestra el primero activo de la fila cuya fecha «hasta» no haya pasado: arriba en el inicio, en el pop-up y en Viajes grupales. Deja el siguiente viaje listo debajo y entra solo cuando el actual sale.'),
    filas.length ? h('div', { class: 'lista-filas' }, filas.map((t, i) => {
      const [txt, cls] = estado(t);
      return h('div', { class: 'fila' }, miniatura(t.foto),
        h('div', {}, h('b', {}, `${t.titulo.es} ${t.titulo_resalte.es}`), h('small', {}, `Hasta: ${t.hasta || 'sin fecha'} · ${t.enlace}`), ' ', h('span', { class: `chip ${cls}` }, txt)),
        h('div', { class: 'acc' },
          boton('Editar', () => abrir(copia(t), true)),
          boton('↑', () => mover(i, -1), { off: i === 0, titulo: 'Subir en la fila' }),
          boton('↓', () => mover(i, 1), { off: i === filas.length - 1, titulo: 'Bajar en la fila' }),
          boton('Borrar', () => borrar(t), { cls: 'mini peligro' })));
    })) : h('p', { class: 'vacio' }, 'No hay viajes de temporada. El inicio muestra solo los cuadros de Colombia.'),
  );
}

async function vistaCuadros(main) {
  const [cuadros, destinos] = await Promise.all([api.listar('cuadros'), api.listar('destinos')]);
  const filas = [];
  const items = h('div', { class: 'lista-filas' });
  const fila = c => {
    const sel = h('select', { 'aria-label': 'Destino' }, destinos.map(d => h('option', { value: d.url, selected: d.url === c.destino }, d.nombre.es)));
    const aviso = campo(B('Aviso (opcional)', 'aviso', { ayuda: 'Ej.: Salida grupal próximamente' }), c.aviso);
    return { el: h('div', { class: 'campo' }, h('span', { class: 'lbl' }, 'Destino'), sel, aviso.el), leer: () => ({ destino: sel.value, aviso: aviso.leer().es ? aviso.leer() : null }) };
  };
  const mover = (i, d) => { [filas[i], filas[i + d]] = [filas[i + d], filas[i]]; pintar(); };
  const pintar = () => items.replaceChildren(...filas.map((f, i) => h('div', { class: 'item' }, f.el,
    h('div', { class: 'item-acc' },
      boton('↑', () => mover(i, -1), { off: i === 0, titulo: 'Subir' }),
      boton('↓', () => mover(i, 1), { off: i === filas.length - 1, titulo: 'Bajar' }),
      boton('Quitar', () => { filas.splice(i, 1); pintar(); }, { cls: 'mini peligro' })))));
  cuadros.forEach(c => filas.push(fila(c)));
  pintar();
  const guardar = async e => {
    e.currentTarget.disabled = true;
    try { await api.cuadros(filas.map(f => f.leer())); listo('Cuadros guardados. Pulsa «Publicar cambios» para verlos en el sitio.'); } catch (er) { fallo(er); }
    e.target.disabled = false;
  };
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, 'Cuadros de Colombia')),
    h('p', { class: 'intro' }, 'Los cuadros que salen en el inicio debajo del viaje de temporada, en este orden. El último cuadro, «Diseña tu propio viaje», sale siempre.'),
    items,
    h('div', { class: 'barra' },
      boton('Guardar cuadros', guardar, { cls: 'btn rojo' }),
      boton('+ Agregar cuadro', () => { filas.push(fila({ destino: destinos[0]?.url })); pintar(); }, { cls: 'btn sec', off: !destinos.length })),
  );
}

async function vistaDestinos(main) {
  const destinos = await api.listar('destinos');
  const volver = () => vistaDestinos(main);
  const abrir = (fila, existente) => editor(main, { titulo: existente ? `Editar ${fila.nombre.es}` : 'Nuevo destino', tabla: 'destinos', campos: CAMPOS.destinos, fila, existente, ctx: { destinos }, volver });
  const borrar = async d => {
    if (!confirm(`¿Borrar el destino «${d.nombre.es}»? Su página desaparece al publicar y también su cuadro en el inicio. No se puede deshacer.`)) return;
    try { await api.borrar('destinos', 'url', d.url); listo('Destino borrado.'); volver(); } catch (e) { fallo(e); }
  };
  const vacio = { url: '', orden: destinos.length + 1, publicado: true, nombre: bi(), h1: bi(), region: bi(), corto: bi(), foto: '', alt: bi(), foto2: '', alt2: bi(),
    titulo_seo: bi(), descripcion_seo: '', lead: bi(), h2: bi(), parrafos: [bi()], vivir: [], datos: { llegar: bi(), epoca: bi(), tiempo: bi(), ideal: bi() }, otros: [] };
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, 'Destinos'), boton('+ Nuevo destino', () => abrir(copia(vacio), false), { cls: 'btn rojo' })),
    h('p', { class: 'intro' }, 'Cada destino tiene su propia página en destinos/<url>/ y aparece en el pie y en el índice de destinos. Para que salga en el inicio, agrégalo en «Cuadros de Colombia».'),
    h('div', { class: 'lista-filas' }, destinos.map(d => h('div', { class: 'fila' }, miniatura(d.foto),
      h('div', {}, h('b', {}, `${d.orden}. ${d.nombre.es}`), h('small', {}, `destinos/${d.url}/`), ' ', !d.publicado && h('span', { class: 'chip apagado' }, 'No publicado')),
      h('div', { class: 'acc' },
        boton('Editar', () => abrir(copia(d), true)),
        h('a', { class: 'mini', href: `${SITIO}destinos/${d.url}/`, target: '_blank', rel: 'noopener' }, 'Ver página'),
        boton('Borrar', () => borrar(d), { cls: 'mini peligro' }))))),
  );
}

// Textos de cada página, con las mismas secciones y en el mismo orden que en el sitio (admin/esquema.js)
async function vistaPaginas(main) {
  const [filas, destinos] = await Promise.all([api.listar('paginas', 'id'), api.listar('destinos')]);
  const contenido = Object.fromEntries(filas.map(f => [f.id, f.contenido]));
  const volver = () => vistaPaginas(main);
  const abrir = pag => {
    const datos = copia(contenido[pag.id] || {});
    const partes = pag.secciones.map((sec, i) => {
      const f = formulario(sec.campos, datos[sec.id] || {}, { destinos });
      return [sec.id, f, h('details', { class: 'seccion', open: i < 2 },
        h('summary', {}, sec.nombre),
        sec.ayuda && h('p', { class: 'ayuda sec-ayuda' }, sec.ayuda),
        f.el)];
    });
    const guardar = async e => {
      const b = e.currentTarget;
      b.disabled = true;
      try {
        for (const [id, f] of partes) datos[id] = f.leer();
        await api.guardar('paginas', { id: pag.id, contenido: datos });
        listo('Guardado. Pulsa «Publicar cambios» cuando quieras verlo en el sitio.');
        volver();
      } catch (er) { fallo(er); b.disabled = false; }
    };
    main.replaceChildren(
      h('div', { class: 'cabeza' }, h('h1', {}, pag.nombre),
        h('div', { class: 'acc-cabeza' },
          pag.id !== 'popup' && h('a', { class: 'btn sec', href: SITIO + pag.ruta, target: '_blank', rel: 'noopener' }, 'Ver página'),
          boton('← Volver', volver, { cls: 'btn sec' }))),
      h('p', { class: 'intro' }, 'Las secciones están en el mismo orden en que se ven en la página. Ábrelas para editar.'),
      ...partes.map(p => p[2]),
      h('div', { class: 'barra' }, boton('Guardar', guardar, { cls: 'btn rojo' }), boton('Cancelar', volver, { cls: 'btn sec' })),
    );
    scrollTo(0, 0);
  };
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, 'Páginas')),
    h('p', { class: 'intro' }, 'Los textos y fotos de cada página del sitio, en español e inglés. Los destinos, el viaje de temporada y los cuadros tienen su propia sección.'),
    h('div', { class: 'lista-filas' }, PAGINAS.map(pag => h('div', { class: 'fila' },
      miniatura(contenido[pag.id]?.seo?.foto || contenido[pag.id]?.portada?.foto || (contenido.popup?.popup?.foto) || ''),
      h('div', {}, h('b', {}, pag.nombre), h('small', {}, pag.id === 'popup' ? 'Ventana que aparece al entrar al inicio' : `${pag.secciones.length} secciones · /${pag.ruta}`)),
      h('div', { class: 'acc' }, boton('Editar', () => abrir(pag)),
        pag.id !== 'popup' && h('a', { class: 'mini', href: SITIO + pag.ruta, target: '_blank', rel: 'noopener' }, 'Ver página'))))),
  );
}

async function vistaPublicaciones(main) {
  const publicaciones = await api.listar('publicaciones', 'pedido', true);
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, 'Publicaciones')),
    h('p', { class: 'intro' }, 'Cada vez que alguien pulsa «Publicar cambios». El sitio tarda 2 a 3 minutos en actualizarse.'),
    publicaciones.length
      ? h('div', { class: 'envoltura' }, h('table', { class: 'tabla' }, h('tr', {}, h('th', {}, 'Fecha'), h('th', {}, 'Quién'), h('th', {}, 'Estado')),
          publicaciones.slice(0, 20).map(p => h('tr', {}, h('td', {}, new Date(p.pedido).toLocaleString('es-CO')), h('td', {}, p.por), h('td', {}, p.estado)))))
      : h('p', { class: 'vacio' }, 'Todavía no se ha publicado desde el panel.'),
  );
}

async function vistaSolicitudes(main) {
  const filas = await api.listar('solicitudes', 'creado', true);
  const wa = n => h('a', { href: `https://wa.me/${(n || '').replace(/\D/g, '')}`, target: '_blank', rel: 'noopener' }, n);
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, 'Solicitudes')),
    h('p', { class: 'intro' }, 'Lo que llega por los formularios del sitio. Se conectan cuando esté publicada la política de tratamiento de datos (Ley 1581).'),
    filas.length
      ? h('div', { class: 'envoltura' }, h('table', { class: 'tabla' },
          h('tr', {}, ['Fecha', 'Origen', 'Nombre', 'WhatsApp', 'Tipo', 'Mensaje'].map(t => h('th', {}, t))),
          filas.map(s => h('tr', {}, h('td', {}, new Date(s.creado).toLocaleString('es-CO')), h('td', {}, s.origen), h('td', {}, s.nombre), h('td', {}, s.whatsapp && wa(s.whatsapp)), h('td', {}, s.tipo || ''), h('td', {}, s.mensaje || '')))))
      : h('p', { class: 'vacio' }, 'Aún no hay solicitudes.'),
  );
}

const VISTAS = [
  ['paginas', 'Páginas', vistaPaginas],
  ['temporadas', 'Viajes de temporada', vistaTemporadas],
  ['cuadros', 'Cuadros de Colombia', vistaCuadros],
  ['destinos', 'Destinos', vistaDestinos],
  ['solicitudes', 'Solicitudes', vistaSolicitudes],
  ['publicaciones', 'Publicaciones', vistaPublicaciones],
];

async function ir() {
  const v = VISTAS.find(x => x[0] === location.hash.slice(1)) || VISTAS[0];
  document.querySelectorAll('.lado a').forEach(a => (a.dataset.k === v[0] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const main = document.getElementById('vista');
  main.replaceChildren(h('p', { class: 'cargando' }, 'Cargando…'));
  try { await v[2](main); } catch (e) { main.replaceChildren(h('p', { class: 'error' }, 'No se pudo cargar: ' + (e.message || e))); }
}

async function publicar(e) {
  const b = e.currentTarget;
  b.disabled = true;
  b.textContent = 'Publicando…';
  try { await api.publicar(); listo('Listo: el sitio se actualiza en 2 a 3 minutos.'); } catch (er) { fallo(er); }
  b.disabled = false;
  b.textContent = 'Publicar cambios';
}

function panel(usuario) {
  app.replaceChildren(
    h('header', { class: 'top' },
      h('div', { class: 'marca' }, h('img', { src: 'logo.svg', alt: '' }), h('b', {}, 'Wanna Go'), h('span', {}, 'Panel')),
      h('div', { class: 'top-acc' },
        DEMO && h('span', { class: 'chip' }, 'Modo demo'),
        h('span', { class: 'quien' }, usuario),
        h('a', { class: 'btn sec claro', href: SITIO, target: '_blank', rel: 'noopener' }, 'Ver sitio'),
        boton('Publicar cambios', publicar, { cls: 'btn rojo' }),
        sb && boton('Salir', () => sb.auth.signOut(), { cls: 'btn sec claro' }))),
    h('div', { class: 'cuerpo' },
      h('nav', { class: 'lado', 'aria-label': 'Secciones' }, VISTAS.map(([k, t]) => h('a', { href: '#' + k, 'data-k': k }, t))),
      h('main', { id: 'vista' })),
  );
  ir();
}
addEventListener('hashchange', () => document.getElementById('vista') && ir());

// ---------- acceso ----------

const tarjeta = (...hijos) => app.replaceChildren(h('div', { class: 'acceso' }, h('div', { class: 'tarjeta' }, h('img', { src: 'logo.svg', alt: '' }), ...hijos)));

function acceso(mensaje = '') {
  const email = h('input', { id: 'email', type: 'email', required: true, autocomplete: 'email', placeholder: 'tu@correo.com' });
  const nota = h('p', { class: 'nota', role: 'status' }, mensaje);
  const enviar = h('button', { class: 'btn rojo', type: 'submit' }, 'Enviarme el enlace');
  tarjeta(h('form', {
    style: 'display:grid;gap:14px',
    onsubmit: async e => {
      e.preventDefault();
      enviar.disabled = true;
      const { error } = await sb.auth.signInWithOtp({ email: email.value.trim().toLowerCase(), options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
      enviar.disabled = false;
      nota.textContent = error ? 'No pudimos enviar el enlace. Revisa que tu correo esté autorizado.' : 'Listo. Abre el enlace que te enviamos al correo para entrar.';
    },
  }, h('h1', {}, 'Panel Wanna Go'), h('p', {}, 'Escribe tu correo y te enviamos un enlace para entrar, sin contraseña.'),
    h('label', { class: 'lbl', for: 'email' }, 'Correo'), email, enviar, nota));
}

if (DEMO) panel('demo');
else if (!sb) {
  tarjeta(h('h1', {}, 'Panel Wanna Go'),
    h('p', {}, 'El panel está listo, pero falta conectar el proyecto de Supabase (admin/config.js).'),
    location.hostname === 'localhost' && h('a', { class: 'btn rojo', href: '?demo' }, 'Probar en modo demo'));
} else {
  let dentro = false;
  const entrar = async sesion => {
    if (!sesion) { dentro = false; return acceso(); }
    const { data: esEditor, error } = await sb.rpc('es_editor');
    if (error || !esEditor) {
      dentro = false;
      return tarjeta(h('h1', {}, 'Sin permiso'), h('p', {}, `El correo ${sesion.user.email} no está autorizado para editar. Pide que lo agreguen como editor.`), boton('Salir', () => sb.auth.signOut(), { cls: 'btn sec' }));
    }
    if (!dentro) { dentro = true; panel(sesion.user.email); }
  };
  // fuera del callback para no bloquear el cliente de Supabase
  sb.auth.onAuthStateChange((_evento, sesion) => setTimeout(() => entrar(sesion)));
}

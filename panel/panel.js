// Panel Wanna Go · edita en Supabase el contenido del sitio y pide publicarlo.
// Guardar cambia la base de datos; «Publicar cambios» regenera el sitio en GitHub (2 a 3 minutos).
// Con ?demo se prueba sin Supabase: lee demo.json (el contenido actual) y no guarda nada.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
import { PAGINAS } from './esquema.js?v=4';

const CFG = window.WG_SUPABASE || {};
const DEMO = new URLSearchParams(location.search).has('demo');
const SITIO = new URL('../', location.href).href;
// Si se llega desde el correo de invitación o de «olvidé mi contraseña», hay que crear una contraseña nueva
const CREAR_CLAVE = /type=(invite|recovery)/.test(location.hash);
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
    const r = await fetch('demo.json');
    if (!r.ok) throw new Error('No se encontró demo.json: corre npm run construir');
    const { paginas, destinos, viajes: v, blog } = await r.json();
    const archivo = f => f.split('/').pop();
    db = {
      paginas: PAGINAS.map(p => ({ id: p.id, contenido: paginas[p.id] })),
      temporadas: v.temporadas.map((t, i) => ({ ...t, id: crypto.randomUUID(), orden: i + 1, hasta: t.hasta || null, foto: archivo(t.foto) })),
      cuadros: v.colombia.map((c, i) => ({ id: crypto.randomUUID(), orden: i + 1, destino: c.destino, aviso: c.aviso || null })),
      destinos: destinos
        .map(d => ({ ...d, publicado: true, foto: archivo(d.foto), foto2: archivo(d.foto2) })),
      blog: (blog || []).map(e => ({ publicado: true, ...e, foto: archivo(e.foto) })),
      solicitudes: [], publicaciones: [],
    };
    return db;
  };
  const clave = t => (t === 'destinos' || t === 'blog' ? 'url' : 'id');
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

const FORMATO = 'Formato: deja una línea en blanco entre párrafos. ## Subtítulo · ### Subtítulo menor · **negrita** · *cursiva* · - lista · > cita · [texto del enlace](https://…)';
CAMPOS.blog = [
  { tipo: 'texto', name: 'url', label: 'Dirección (url)', fija: true, patron: '[a-z0-9-]+',
    ayuda: 'La entrada queda en blog/<url>/. Solo minúsculas, números y guiones, ej.: que-hacer-en-guatape. No se puede cambiar después de crear.' },
  { tipo: 'bool', name: 'publicado', label: 'Publicada en el sitio (si está apagado, queda como borrador)' },
  { tipo: 'fecha', name: 'fecha', label: 'Fecha' },
  { tipo: 'texto', name: 'autor', label: 'Autor' },
  B('Título', 'titulo', { max: 70 }),
  { tipo: 'foto', name: 'foto', label: 'Foto principal' },
  B('Descripción de la foto', 'alt'),
  B('Resumen (sale en la lista del blog y en Google)', 'resumen', { largo: true, max: 160 }),
  B('Texto de la entrada', 'cuerpo', { largo: true, filas: 18, ayuda: FORMATO }),
];

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
        const e = h(def.largo ? 'textarea' : 'input', { value: v[lang] ?? '', rows: def.largo ? def.filas || 4 : null, 'aria-label': `${def.label || 'Texto'} · ${nombre}` });
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
      if ((tabla === 'destinos' || tabla === 'blog') && !/^[a-z0-9-]+$/.test(datos.url)) throw new Error('La dirección (url) solo admite minúsculas, números y guiones.');
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

async function vistaBlog(main) {
  const entradas = await api.listar('blog', 'fecha', true);
  const volver = () => vistaBlog(main);
  const abrir = (fila, existente) => editor(main, { titulo: existente ? 'Editar entrada' : 'Nueva entrada', tabla: 'blog', campos: CAMPOS.blog, fila, existente, volver });
  const borrar = async e => {
    if (!confirm(`¿Borrar la entrada «${e.titulo.es}»? Su página desaparece al publicar. No se puede deshacer.`)) return;
    try { await api.borrar('blog', 'url', e.url); listo('Entrada borrada.'); volver(); } catch (er) { fallo(er); }
  };
  const vacia = { url: '', publicado: false, fecha: hoy, autor: 'Wanna Go', titulo: bi(), foto: '', alt: bi(), resumen: bi(), cuerpo: bi() };
  main.replaceChildren(
    h('div', { class: 'cabeza' }, h('h1', {}, 'Blog'), boton('+ Nueva entrada', () => abrir(copia(vacia), false), { cls: 'btn rojo' })),
    h('p', { class: 'intro' }, 'Cada entrada tiene su propia página en blog/<url>/ y sale en el índice del blog, de la más nueva a la más vieja. Escríbela como borrador y actívala cuando esté lista; luego pulsa «Publicar cambios».'),
    entradas.length
      ? h('div', { class: 'lista-filas' }, entradas.map(e => h('div', { class: 'fila' }, miniatura(e.foto),
          h('div', {}, h('b', {}, e.titulo.es || '(sin título)'), h('small', {}, `${e.fecha} · blog/${e.url}/`), ' ', h('span', { class: `chip ${e.publicado ? 'vivo' : 'apagado'}` }, e.publicado ? 'Publicada' : 'Borrador')),
          h('div', { class: 'acc' },
            boton('Editar', () => abrir(copia(e), true)),
            e.publicado && h('a', { class: 'mini', href: `${SITIO}blog/${e.url}/`, target: '_blank', rel: 'noopener' }, 'Ver página'),
            boton('Borrar', () => borrar(e), { cls: 'mini peligro' })))))
      : h('p', { class: 'vacio' }, 'Todavía no hay entradas. Crea la primera con «+ Nueva entrada».'),
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
  ['blog', 'Blog', vistaBlog],
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
  const email = h('input', { id: 'email', type: 'email', required: true, autocomplete: 'username', placeholder: 'tu@correo.com' });
  const clave = h('input', { id: 'clave', type: 'password', required: true, autocomplete: 'current-password' });
  const nota = h('p', { class: 'nota', role: 'status' }, mensaje);
  const entrar = h('button', { class: 'btn rojo', type: 'submit' }, 'Entrar');
  const olvide = boton('Olvidé mi contraseña', async () => {
    if (!email.value.trim()) { nota.textContent = 'Escribe tu correo arriba y vuelve a pulsar «Olvidé mi contraseña».'; return; }
    const { error } = await sb.auth.resetPasswordForEmail(email.value.trim().toLowerCase(), { redirectTo: location.origin + location.pathname });
    nota.textContent = error ? 'No pudimos enviar el correo. Intenta en unos minutos.' : 'Te enviamos un correo para crear una contraseña nueva.';
  }, { cls: 'enlace' });
  tarjeta(h('form', {
    style: 'display:grid;gap:14px',
    onsubmit: async e => {
      e.preventDefault();
      entrar.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: email.value.trim().toLowerCase(), password: clave.value });
      entrar.disabled = false;
      if (error) nota.textContent = 'Correo o contraseña incorrectos.';
    },
  }, h('h1', {}, 'Panel Wanna Go'), h('p', {}, 'Entra con tu correo y tu contraseña.'),
    h('label', { class: 'lbl', for: 'email' }, 'Correo'), email,
    h('label', { class: 'lbl', for: 'clave' }, 'Contraseña'), clave,
    entrar, olvide, nota));
}

// Primera vez (invitación) u olvido: la persona crea su propia contraseña; nadie más la conoce
function crearClave(sesion, alTerminar) {
  const c1 = h('input', { id: 'c1', type: 'password', required: true, minLength: 8, autocomplete: 'new-password' });
  const c2 = h('input', { id: 'c2', type: 'password', required: true, minLength: 8, autocomplete: 'new-password' });
  const nota = h('p', { class: 'nota', role: 'status' });
  const guardar = h('button', { class: 'btn rojo', type: 'submit' }, 'Guardar contraseña');
  tarjeta(h('form', {
    style: 'display:grid;gap:14px',
    onsubmit: async e => {
      e.preventDefault();
      if (c1.value !== c2.value) { nota.textContent = 'Las dos contraseñas no coinciden.'; return; }
      guardar.disabled = true;
      const { error } = await sb.auth.updateUser({ password: c1.value });
      guardar.disabled = false;
      if (error) { nota.textContent = 'No se pudo guardar: ' + (error.message.includes('weak') || error.message.includes('least') ? 'usa al menos 8 caracteres, con letras y números.' : error.message); return; }
      alTerminar();
    },
  }, h('h1', {}, 'Crea tu contraseña'), h('p', {}, `Para ${sesion.user.email}. Usa al menos 8 caracteres, con letras y números. Con ella entrarás al panel de ahora en adelante.`),
    h('label', { class: 'lbl', for: 'c1' }, 'Contraseña nueva'), c1,
    h('label', { class: 'lbl', for: 'c2' }, 'Repítela'), c2, guardar, nota));
}

if (DEMO) panel('demo');
else if (!sb) {
  tarjeta(h('h1', {}, 'Panel Wanna Go'),
    h('p', {}, 'El panel está listo, pero falta conectar el proyecto de Supabase (admin/config.js).'),
    h('a', { class: 'btn rojo', href: '?demo' }, 'Ver el panel en modo demo'));
} else {
  let dentro = false, porCrear = CREAR_CLAVE;
  const entrar = async (sesion, evento) => {
    if (!sesion) { dentro = false; return acceso(); }
    if (porCrear || evento === 'PASSWORD_RECOVERY') {
      porCrear = false;
      return crearClave(sesion, () => entrar(sesion));
    }
    const { data: esEditor, error } = await sb.rpc('es_editor');
    if (error || !esEditor) {
      dentro = false;
      return tarjeta(h('h1', {}, 'Sin permiso'), h('p', {}, `El correo ${sesion.user.email} no está autorizado para editar. Pide que lo agreguen como editor.`), boton('Salir', () => sb.auth.signOut(), { cls: 'btn sec' }));
    }
    if (!dentro) { dentro = true; panel(sesion.user.email); }
  };
  // fuera del callback para no bloquear el cliente de Supabase
  sb.auth.onAuthStateChange((evento, sesion) => setTimeout(() => entrar(sesion, evento)));
}

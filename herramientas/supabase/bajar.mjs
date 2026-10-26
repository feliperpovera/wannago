// Baja el contenido publicado de Supabase a contenido/ (mismo formato que usa generar.mjs)
// y las fotos que falten a fotos/. Lo corre la acción de GitHub antes de generar el sitio;
// así contenido/ queda como copia versionada de la base.
// Uso: SUPABASE_URL=… SUPABASE_ANON_KEY=… node herramientas/supabase/bajar.mjs
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: clave } = process.env;
if (!url || !clave) {
  console.log('Supabase no está conectado: se usa contenido/ tal como está.');
  process.exit(0);
}

const leer = async (tabla, consulta) => {
  const r = await fetch(`${url}/rest/v1/${tabla}?${consulta}`, { headers: { apikey: clave, Authorization: `Bearer ${clave}` } });
  if (!r.ok) throw new Error(`${tabla}: ${r.status} ${await r.text()}`);
  return r.json();
};
const guardar = (ruta, datos) => writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n');
const sin = (o, ...claves) => Object.fromEntries(Object.entries(o).filter(([k]) => !claves.includes(k)));

const paginas = await leer('paginas', 'select=id,contenido');
const temporadas = await leer('temporadas', 'select=*&order=orden');
const cuadros = await leer('cuadros', 'select=destino,aviso&order=orden');
const destinos = await leer('destinos', 'select=*&publicado=is.true&order=orden');

for (const p of paginas) guardar(`contenido/paginas/${p.id}.json`, p.contenido);
guardar('contenido/viajes.json', {
  temporadas: temporadas.map(t => ({ ...sin(t, 'id', 'orden', 'actualizado'), hasta: t.hasta || '' })),
  colombia: cuadros.map(c => c.aviso ? c : { destino: c.destino }),
});

const vivos = new Set(destinos.map(d => d.url + '.json'));
for (const f of readdirSync('contenido/destinos')) if (!vivos.has(f)) rmSync('contenido/destinos/' + f);
for (const d of destinos) guardar(`contenido/destinos/${d.url}.json`, sin(d, 'publicado', 'actualizado'));

// fotos de las páginas: cualquier campo «foto» dentro del contenido
const fotosDe = o => !o || typeof o !== 'object' ? [] : Object.entries(o).flatMap(([k, v]) => k === 'foto' && typeof v === 'string' ? [v] : fotosDe(v));
const usadas = new Set([...temporadas.map(t => t.foto), ...destinos.flatMap(d => [d.foto, d.foto2]), ...paginas.flatMap(p => fotosDe(p.contenido))].filter(Boolean).map(f => f.split('/').pop()));
let nuevas = 0;
for (const f of usadas) {
  if (existsSync('fotos/' + f)) continue;
  const r = await fetch(`${url}/storage/v1/object/public/fotos/${encodeURIComponent(f)}`);
  if (!r.ok) throw new Error(`No se pudo bajar la foto ${f}: ${r.status}`);
  writeFileSync('fotos/' + f, Buffer.from(await r.arrayBuffer()));
  nuevas++;
}
console.log(`Supabase → contenido: ${paginas.length} páginas, ${destinos.length} destinos, ${temporadas.length} temporadas, ${cuadros.length} cuadros, ${nuevas} fotos nuevas`);

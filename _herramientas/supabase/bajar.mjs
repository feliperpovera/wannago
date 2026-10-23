// Baja el contenido publicado de Supabase a _datos/ (mismo formato que usa generar.mjs)
// y las fotos que falten a _originales/. Lo corre la acción de GitHub antes de generar el sitio;
// así _datos/ queda como copia versionada de la base.
// Uso: SUPABASE_URL=… SUPABASE_ANON_KEY=… node _herramientas/supabase/bajar.mjs
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: clave } = process.env;
if (!url || !clave) {
  console.log('Supabase no está conectado: se usa _datos/ tal como está.');
  process.exit(0);
}

const leer = async (tabla, consulta) => {
  const r = await fetch(`${url}/rest/v1/${tabla}?${consulta}`, { headers: { apikey: clave, Authorization: `Bearer ${clave}` } });
  if (!r.ok) throw new Error(`${tabla}: ${r.status} ${await r.text()}`);
  return r.json();
};
const guardar = (ruta, datos) => writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n');
const foto = f => `/_originales/${f}`;
const sin = (o, ...claves) => Object.fromEntries(Object.entries(o).filter(([k]) => !claves.includes(k)));

const [ajustes] = await leer('ajustes', 'select=popup');
const temporadas = await leer('temporadas', 'select=*&order=orden');
const cuadros = await leer('cuadros', 'select=destino,aviso&order=orden');
const destinos = await leer('destinos', 'select=*&publicado=is.true&order=orden');

guardar('_datos/viajes.json', {
  popup: ajustes?.popup ?? true,
  temporadas: temporadas.map(t => ({ ...sin(t, 'id', 'orden', 'actualizado'), hasta: t.hasta || '', foto: foto(t.foto) })),
  colombia: cuadros.map(c => c.aviso ? c : { destino: c.destino }),
});

const vivos = new Set(destinos.map(d => d.url + '.json'));
for (const f of readdirSync('_datos/destinos')) if (!vivos.has(f)) rmSync('_datos/destinos/' + f);
for (const d of destinos) guardar(`_datos/destinos/${d.url}.json`, { ...sin(d, 'publicado', 'actualizado'), foto: foto(d.foto), foto2: foto(d.foto2) });

// Fotos usadas que aún no están en el repositorio
const usadas = new Set([...temporadas.map(t => t.foto), ...destinos.flatMap(d => [d.foto, d.foto2])]);
let nuevas = 0;
for (const f of usadas) {
  if (existsSync('_originales/' + f)) continue;
  const r = await fetch(`${url}/storage/v1/object/public/fotos/${encodeURIComponent(f)}`);
  if (!r.ok) throw new Error(`No se pudo bajar la foto ${f}: ${r.status}`);
  writeFileSync('_originales/' + f, Buffer.from(await r.arrayBuffer()));
  nuevas++;
}
console.log(`Supabase → _datos: ${destinos.length} destinos, ${temporadas.length} temporadas, ${cuadros.length} cuadros, ${nuevas} fotos nuevas`);

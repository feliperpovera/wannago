// Pasa el contenido actual de contenido/ a Supabase, una sola vez, al crear el proyecto.
//   node herramientas/supabase/semilla.mjs           → escribe supabase/seed.sql
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node herramientas/supabase/semilla.mjs --fotos
//                                                      → además sube fotos/ al bucket «fotos»
// La clave service_role nunca se guarda en el repositorio: solo se pasa en la terminal.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const lit = v => v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const js = v => `${lit(JSON.stringify(v))}::jsonb`;
const arr = v => `array[${v.map(lit).join(', ')}]::text[]`;
const archivo = f => f.split('/').pop(); // en la base solo va el nombre del archivo

const viajes = JSON.parse(readFileSync('contenido/viajes.json', 'utf8'));
const paginas = readdirSync('contenido/paginas').filter(f => f.endsWith('.json'))
  .map(f => [f.replace('.json', ''), JSON.parse(readFileSync('contenido/paginas/' + f, 'utf8'))]);
const blog = readdirSync('contenido/blog').filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync('contenido/blog/' + f, 'utf8')));
const destinos = readdirSync('contenido/destinos').filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync('contenido/destinos/' + f, 'utf8')))
  .sort((a, b) => a.orden - b.orden);

const sql = [
  '-- Generado por herramientas/supabase/semilla.mjs con el contenido de contenido/',
  ...paginas.map(([id, contenido]) => `insert into public.paginas (id, contenido) values (${lit(id)}, ${js(contenido)}) on conflict (id) do update set contenido = excluded.contenido;`),
  '',
  ...destinos.map(d => `insert into public.destinos (url, orden, nombre, h1, region, corto, foto, alt, foto2, alt2, titulo_seo, descripcion_seo, lead, h2, parrafos, vivir, datos, otros) values (${[
    lit(d.url), d.orden, js(d.nombre), js(d.h1), js(d.region), js(d.corto), lit(archivo(d.foto)), js(d.alt), lit(archivo(d.foto2)), js(d.alt2),
    js(d.titulo_seo), lit(d.descripcion_seo), js(d.lead), js(d.h2), js(d.parrafos), js(d.vivir), js(d.datos), arr(d.otros || []),
  ].join(', ')});`),
  '',
  ...viajes.temporadas.map((v, i) => `insert into public.temporadas (orden, activo, hasta, enlace, foto, alt, titulo, titulo_resalte, etiqueta, aviso, resumen, datos, salida, salida_por_definir, boton) values (${[
    i + 1, !!v.activo, v.hasta ? lit(v.hasta) : 'null', lit(v.enlace), lit(archivo(v.foto)), js(v.alt), js(v.titulo), js(v.titulo_resalte),
    js(v.etiqueta), js(v.aviso), js(v.resumen), js(v.datos), lit(v.salida || ''), !!v.salida_por_definir, js(v.boton),
  ].join(', ')});`),
  '',
  ...viajes.colombia.map((c, i) => `insert into public.cuadros (orden, destino, aviso) values (${i + 1}, ${lit(c.destino)}, ${c.aviso?.es ? js(c.aviso) : 'null'});`),
  '',
  ...blog.map(e => `insert into public.blog (url, publicado, fecha, autor, titulo, resumen, foto, alt, cuerpo) values (${[
    lit(e.url), e.publicado !== false, lit(e.fecha), lit(e.autor || 'Wanna Go'), js(e.titulo), js(e.resumen), lit(archivo(e.foto)), js(e.alt), js(e.cuerpo),
  ].join(', ')}) on conflict (url) do nothing;`),
  '',
  '-- Editores del panel',
  "insert into public.editores (email, nombre) values ('wannagoco@gmail.com', 'Wanna Go') on conflict (email) do nothing;",
  '',
].join('\n');
writeFileSync('supabase/seed.sql', sql);
console.log(`supabase/seed.sql · ${paginas.length} páginas, ${destinos.length} destinos, ${viajes.temporadas.length} temporadas, ${viajes.colombia.length} cuadros`);

if (process.argv.includes('--fotos')) {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: clave } = process.env;
  if (!url || !clave) throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  const tipos = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  for (const f of readdirSync('fotos')) {
    const tipo = tipos[f.split('.').pop().toLowerCase()];
    if (!tipo) continue;
    const r = await fetch(`${url}/storage/v1/object/fotos/${encodeURIComponent(f)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${clave}`, apikey: clave, 'Content-Type': tipo, 'x-upsert': 'true' },
      body: readFileSync('fotos/' + f),
    });
    console.log(r.ok ? '✓' : `✗ ${r.status}`, f);
  }
}

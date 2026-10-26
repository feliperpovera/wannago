-- Wanna Go · esquema del contenido editable desde /admin
-- Lectura pública del contenido publicado (la usa el generador del sitio).
-- Escritura solo para correos que estén en la tabla «editores».
-- Los textos bilingües son jsonb {"es": "...", "en": "..."}, igual que en contenido/.

-- ---------- Tipos ----------

create domain public.bilingue as jsonb
  check (jsonb_typeof(value) = 'object' and value ? 'es');

-- ---------- Quién puede editar ----------

create table public.editores (
  email text primary key check (email = lower(email)),
  nombre text,
  creado timestamptz not null default now()
);
comment on table public.editores is 'Correos con permiso para editar desde /admin. Se agregan desde el panel de Supabase.';

create function public.es_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.editores
    where email = lower((select auth.jwt() ->> 'email'))
  );
$$;

-- ---------- Contenido ----------

create table public.paginas (
  id text primary key check (id in ('inicio', 'nosotros', 'viajes-a-la-medida', 'viajes-grupales', 'eventos-corporativos', 'destinos', 'contacto', 'popup')),
  contenido jsonb not null check (jsonb_typeof(contenido) = 'object'),
  actualizado timestamptz not null default now()
);
comment on table public.paginas is 'Textos y fotos de cada página, por secciones (estructura en admin/esquema.js). Incluye el pop-up del inicio.';

create table public.destinos (
  url text primary key check (url ~ '^[a-z0-9-]+$'),
  orden int not null default 99,
  publicado boolean not null default true,
  nombre public.bilingue not null,
  h1 public.bilingue not null,
  region public.bilingue not null,
  corto public.bilingue not null,
  foto text not null,
  alt public.bilingue not null,
  foto2 text not null,
  alt2 public.bilingue not null,
  titulo_seo public.bilingue not null,
  descripcion_seo text not null check (char_length(descripcion_seo) <= 170),
  lead public.bilingue not null,
  h2 public.bilingue not null,
  parrafos jsonb not null default '[]' check (jsonb_typeof(parrafos) = 'array'),
  vivir jsonb not null default '[]' check (jsonb_typeof(vivir) = 'array'),
  datos jsonb not null check (datos ?& array['llegar', 'epoca', 'tiempo', 'ideal']),
  otros text[] not null default '{}',
  actualizado timestamptz not null default now()
);
comment on table public.destinos is 'Una fila por página en destinos/<url>/.';

create table public.temporadas (
  id uuid primary key default gen_random_uuid(),
  orden int not null default 1,
  activo boolean not null default true,
  hasta date,
  enlace text not null,
  foto text not null,
  alt public.bilingue not null,
  titulo public.bilingue not null,
  titulo_resalte public.bilingue not null,
  etiqueta public.bilingue not null,
  aviso public.bilingue not null,
  resumen public.bilingue not null,
  datos jsonb not null default '[]' check (jsonb_typeof(datos) = 'array'),
  salida text not null default '',
  salida_por_definir boolean not null default false,
  boton public.bilingue not null,
  actualizado timestamptz not null default now()
);
comment on table public.temporadas is 'Viajes de temporada en orden. El sitio muestra el primero activo cuya fecha «hasta» no haya pasado.';

create table public.cuadros (
  id uuid primary key default gen_random_uuid(),
  orden int not null,
  destino text not null references public.destinos (url) on update cascade on delete cascade,
  aviso public.bilingue
);
create index cuadros_destino_idx on public.cuadros (destino);
comment on table public.cuadros is 'Cuadros de Colombia en el inicio, en orden.';

-- ---------- Formularios y publicaciones ----------

create table public.solicitudes (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  origen text not null check (origen in ('contacto', 'lista-espera')),
  nombre text not null check (char_length(nombre) between 1 and 120),
  whatsapp text check (char_length(whatsapp) <= 40),
  tipo text check (char_length(tipo) <= 60),
  mensaje text check (char_length(mensaje) <= 2000),
  acepta_datos boolean not null default false
);
comment on table public.solicitudes is 'Formularios del sitio. Requiere la política de tratamiento de datos (Ley 1581) antes de conectarlos.';

create table public.publicaciones (
  id bigint generated always as identity primary key,
  pedido timestamptz not null default now(),
  por text not null,
  estado text not null
);
comment on table public.publicaciones is 'Historial del botón «Publicar cambios» del panel.';

-- «actualizado» al día en cada cambio
create function public.marcar_actualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado := now();
  return new;
end;
$$;

create trigger paginas_actualizado before update on public.paginas for each row execute function public.marcar_actualizado();
create trigger destinos_actualizado before update on public.destinos for each row execute function public.marcar_actualizado();
create trigger temporadas_actualizado before update on public.temporadas for each row execute function public.marcar_actualizado();

-- Reemplaza todos los cuadros de una vez (orden incluido), para que el panel no deje la lista a medias
create function public.guardar_cuadros(lista jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.es_editor() then
    raise exception 'Sin permiso para editar';
  end if;
  delete from public.cuadros where true;
  insert into public.cuadros (orden, destino, aviso)
  select (e.ord)::int, e.item ->> 'destino', nullif(e.item -> 'aviso', 'null'::jsonb)
  from jsonb_array_elements(lista) with ordinality as e(item, ord);
end;
$$;

-- ---------- Seguridad (RLS) ----------

alter table public.editores enable row level security;
alter table public.paginas enable row level security;
alter table public.destinos enable row level security;
alter table public.temporadas enable row level security;
alter table public.cuadros enable row level security;
alter table public.solicitudes enable row level security;
alter table public.publicaciones enable row level security;

-- editores: cada quien solo ve su propia fila (para saber si tiene permiso)
create policy "ver mi fila de editor" on public.editores for select to authenticated
  using (email = lower((select auth.jwt() ->> 'email')));

-- contenido: lectura pública; escritura de editores
create policy "leer paginas" on public.paginas for select to anon, authenticated using (true);
create policy "crear paginas" on public.paginas for insert to authenticated with check ((select public.es_editor()));
create policy "editar paginas" on public.paginas for update to authenticated
  using ((select public.es_editor())) with check ((select public.es_editor()));

create policy "leer destinos publicados" on public.destinos for select to anon, authenticated
  using (publicado or (select public.es_editor()));
create policy "crear destinos" on public.destinos for insert to authenticated with check ((select public.es_editor()));
create policy "editar destinos" on public.destinos for update to authenticated
  using ((select public.es_editor())) with check ((select public.es_editor()));
create policy "borrar destinos" on public.destinos for delete to authenticated using ((select public.es_editor()));

create policy "leer temporadas" on public.temporadas for select to anon, authenticated using (true);
create policy "crear temporadas" on public.temporadas for insert to authenticated with check ((select public.es_editor()));
create policy "editar temporadas" on public.temporadas for update to authenticated
  using ((select public.es_editor())) with check ((select public.es_editor()));
create policy "borrar temporadas" on public.temporadas for delete to authenticated using ((select public.es_editor()));

create policy "leer cuadros" on public.cuadros for select to anon, authenticated using (true);
create policy "crear cuadros" on public.cuadros for insert to authenticated with check ((select public.es_editor()));
create policy "borrar cuadros" on public.cuadros for delete to authenticated using ((select public.es_editor()));

-- solicitudes: cualquiera puede enviar; solo editores leen
create policy "enviar solicitud" on public.solicitudes for insert to anon, authenticated with check (true);
create policy "leer solicitudes" on public.solicitudes for select to authenticated using ((select public.es_editor()));

-- publicaciones: solo editores
create policy "registrar publicacion" on public.publicaciones for insert to authenticated with check ((select public.es_editor()));
create policy "ver publicaciones" on public.publicaciones for select to authenticated using ((select public.es_editor()));

-- ---------- Fotos (Storage) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 15728640, array['image/jpeg', 'image/png', 'image/webp']);

create policy "subir fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (select public.es_editor()));
create policy "cambiar fotos" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (select public.es_editor()));
create policy "borrar fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (select public.es_editor()));

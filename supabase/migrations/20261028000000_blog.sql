-- Wanna Go · blog: entradas editables desde /admin y página «blog» en la tabla de páginas.

alter table public.paginas drop constraint paginas_id_check;
alter table public.paginas add constraint paginas_id_check
  check (id in ('inicio', 'nosotros', 'viajes-a-la-medida', 'viajes-grupales', 'eventos-corporativos', 'destinos', 'contacto', 'blog', 'popup'));

create table public.blog (
  url text primary key check (url ~ '^[a-z0-9-]+$'),
  publicado boolean not null default false,
  fecha date not null default current_date,
  autor text not null default 'Wanna Go',
  titulo public.bilingue not null,
  resumen public.bilingue not null,
  foto text not null,
  alt public.bilingue not null,
  cuerpo public.bilingue not null,
  actualizado timestamptz not null default now()
);
comment on table public.blog is 'Entradas del blog. Una página por entrada en blog/<url>/. El cuerpo usa formato sencillo: ## subtítulo, **negrita**, *cursiva*, - lista, > cita, [texto](enlace).';

create trigger blog_actualizado before update on public.blog for each row execute function public.marcar_actualizado();

alter table public.blog enable row level security;
create policy "leer entradas publicadas" on public.blog for select to anon, authenticated
  using (publicado or (select public.es_editor()));
create policy "crear entradas" on public.blog for insert to authenticated with check ((select public.es_editor()));
create policy "editar entradas" on public.blog for update to authenticated
  using ((select public.es_editor())) with check ((select public.es_editor()));
create policy "borrar entradas" on public.blog for delete to authenticated using ((select public.es_editor()));

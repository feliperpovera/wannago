-- Wanna Go · página de gracias (a donde llegan los formularios), editable desde /admin.

alter table public.paginas drop constraint paginas_id_check;
alter table public.paginas add constraint paginas_id_check
  check (id in ('inicio', 'nosotros', 'viajes-a-la-medida', 'viajes-grupales', 'eventos-corporativos', 'destinos', 'contacto', 'blog', 'marruecos', 'gracias', 'popup'));

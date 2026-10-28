// Estructura editable de cada página: secciones y campos, en el mismo orden en que se ven en el sitio.
// La usan el panel /admin (para armar los formularios) y herramientas/generar.mjs (para validar los datos y armar las páginas).
// Marcas en textos de Marruecos: *resaltado* y {pendiente}.
// Tipos de campo: bi (español + inglés), texto, largo, numero, fecha, bool, foto, lista, grupo, destinos.

const B = (label, name, o = {}) => ({ tipo: 'bi', label, name, ...o });
const BL = (label, name, o = {}) => B(label, name, { largo: true, ...o });
const T = (label, name, o = {}) => ({ tipo: 'texto', label, name, ...o });
const F = (label, name = 'foto') => ({ tipo: 'foto', label, name });
const bi = () => ({ es: '', en: '' });

const seo = {
  id: 'seo', nombre: 'Google y redes sociales',
  campos: [
    B('Título para Google', 'titulo', { max: 60 }),
    { tipo: 'largo', name: 'descripcion', label: 'Descripción para Google (español)', max: 155 },
    F('Imagen al compartir en redes'),
  ],
};
const portada = (extra = []) => ({
  id: 'portada', nombre: 'Portada',
  campos: [F('Foto de portada'), B('Descripción de la foto', 'alt'), B('Etiqueta', 'etiqueta'), B('Título grande', 'titulo'), BL('Texto', 'texto'), ...extra],
});
const whatsapp = (label = 'Mensaje de WhatsApp del botón') => T(label, 'whatsapp', { ayuda: 'Texto que aparece escrito al abrir WhatsApp.' });
const encabezado = [B('Etiqueta de la sección', 'ceja', { ayuda: 'Ej.: 01 · Cómo lo pensamos' }), B('Título', 'titulo')];
const parrafos = { tipo: 'lista', name: 'parrafos', label: 'Párrafos', nuevo: bi(), item: BL('', '') };
const cifras = { tipo: 'lista', name: 'cifras', label: 'Cifras', nuevo: { valor: '', texto: bi() }, campos: [T('Cifra', 'valor'), B('Texto', 'texto')] };
const items = (label = 'Tarjetas') => ({ tipo: 'lista', name: 'items', label, nuevo: { titulo: bi(), texto: bi() }, campos: [B('Título', 'titulo'), B('Texto', 'texto')] });
const intro = (nombre = 'Introducción') => ({ id: 'intro', nombre, campos: [...encabezado, parrafos, F('Foto'), B('Descripción de la foto', 'alt')] });
const resenas = { id: 'resenas', nombre: 'Reseñas', campos: encabezado, ayuda: 'Las reseñas vienen de Google.' };
const fundadora = { id: 'fundadora', nombre: 'Fundadora', campos: [B('Etiqueta de la sección', 'ceja'), BL('Frase', 'cita'), T('Nombre', 'nombre'), B('Cargo', 'cargo')] };
const pilares = { id: 'pilares', nombre: 'Pilares', campos: [...encabezado, items('Pilares')], ayuda: 'Los íconos se asignan en orden.' };
const MARCAS = 'Usa *palabras* para resaltarlas en rojo y {texto} para marcarlo como pendiente (recuadro punteado).';
const cierre = { id: 'cierre', nombre: 'Cierre (franja con foto)', campos: [F('Foto de fondo'), B('Título', 'titulo'), whatsapp()] };

const servicio = (id, nombre, ruta) => ({
  id, nombre, ruta,
  secciones: [
    seo, portada([whatsapp()]), intro(),
    { id: 'pasos', nombre: 'Tarjetas', campos: [...encabezado, items()] },
    { id: 'destinos', nombre: 'Destinos sugeridos', campos: [...encabezado, { tipo: 'destinos', name: 'lista', label: 'Destinos' }] },
    resenas, cierre,
  ],
});

export const PAGINAS = [
  {
    id: 'inicio', nombre: 'Inicio', ruta: '',
    secciones: [
      seo,
      portada([B('Botón principal (lleva a los viajes)', 'boton1'), B('Botón secundario (lleva al contacto)', 'boton2')]),
      { id: 'viajes', nombre: '01 · Nuestros viajes', ayuda: 'El viaje de temporada y los cuadros se editan en sus propias secciones del panel.',
        campos: [...encabezado, B('Cuadro final: etiqueta', 'cta_etiqueta'), B('Cuadro final: título', 'cta_titulo'), B('Cuadro final: botón', 'cta_boton')] },
      { id: 'nosotros', nombre: '02 · Quiénes somos', campos: [...encabezado, parrafos, B('Enlace a Nosotros', 'enlace'), cifras, F('Foto'), B('Descripción de la foto', 'alt')] },
      { id: 'experiencias', nombre: '03 · Lo que hacemos',
        campos: [...encabezado, B('Texto del enlace de cada tarjeta', 'boton'),
          { tipo: 'lista', name: 'tarjetas', label: 'Tarjetas', nuevo: { enlace: '', foto: '', alt: bi(), etiqueta: bi(), titulo: bi(), texto: bi() },
            campos: [T('Página a la que lleva', 'enlace', { ayuda: 'Ej.: viajes-a-la-medida/' }), F('Foto'), B('Descripción de la foto', 'alt'), B('Etiqueta', 'etiqueta'), B('Título', 'titulo'), B('Texto', 'texto')] }] },
      { ...pilares, nombre: '04 · Nuestro sello' },
      { ...resenas, nombre: '05 · Reseñas' },
      { ...fundadora, nombre: '06 · Fundadora' },
      { id: 'frase', nombre: 'Frase de marca', campos: [F('Foto de fondo'), B('Frase', 'texto'), T('Firma', 'firma')] },
      { id: 'contacto', nombre: '07 · Contacto', campos: [...encabezado, BL('Texto', 'texto')] },
    ],
  },
  {
    id: 'nosotros', nombre: 'Nosotros', ruta: 'nosotros/',
    secciones: [seo, portada(), { id: 'historia', nombre: 'Nuestra historia', campos: [...encabezado, parrafos, cifras, F('Foto'), B('Descripción de la foto', 'alt')] },
      fundadora, pilares, resenas, cierre],
  },
  servicio('viajes-a-la-medida', 'A la medida', 'viajes-a-la-medida/'),
  {
    id: 'viajes-grupales', nombre: 'Viajes grupales', ruta: 'viajes-grupales/',
    secciones: [
      seo, portada([whatsapp()]), intro(),
      { id: 'salidas', nombre: 'Próximas salidas', ayuda: 'La tarjeta grande es el viaje de temporada vigente.',
        campos: [...encabezado, { tipo: 'lista', name: 'proximas', label: 'Otras salidas', nuevo: { enlace: '', foto: '', alt: bi(), aviso: bi(), fecha: bi(), fecha_por_definir: true, titulo: bi() },
          campos: [T('Página a la que lleva', 'enlace', { ayuda: 'Ej.: destinos/cartagena/' }), F('Foto'), B('Descripción de la foto', 'alt'), B('Aviso', 'aviso'), B('Fecha', 'fecha'),
            { tipo: 'bool', name: 'fecha_por_definir', label: 'Fecha por definir (se marca como borrador)' }, B('Título', 'titulo')] }] },
      { id: 'siempre', nombre: 'En cada salida', campos: [...encabezado, items()] },
      resenas, cierre,
    ],
  },
  servicio('eventos-corporativos', 'Eventos corporativos', 'eventos-corporativos/'),
  {
    id: 'destinos', nombre: 'Destinos (índice)', ruta: 'destinos/',
    secciones: [seo, portada(), { id: 'listado', nombre: 'Listado', campos: encabezado, ayuda: 'Las tarjetas salen de la sección Destinos del panel.' }, cierre],
  },
  {
    id: 'contacto', nombre: 'Contacto', ruta: 'contacto/',
    secciones: [seo, portada(), { id: 'canales', nombre: 'Canales y formulario', campos: [...encabezado, BL('Texto', 'texto')] }],
  },
  {
    id: 'blog', nombre: 'Blog (índice)', ruta: 'blog/',
    secciones: [seo, portada(), { id: 'listado', nombre: 'Listado', campos: [...encabezado, BL('Texto cuando no hay entradas', 'vacio')], ayuda: 'Las entradas se escriben en la sección Blog del panel.' }, cierre],
  },
  {
    id: 'marruecos', nombre: 'Marruecos entre mujeres', ruta: 'marruecos/',
    secciones: [
      { ...seo, ayuda: MARCAS, campos: [...seo.campos, { tipo: 'bool', name: 'indexar', label: 'Mostrar en Google (activar cuando tenga precios y fechas reales)' }] },
      { id: 'aviso', nombre: 'Franja de borrador', ayuda: 'Franja roja arriba de la página. Apágala cuando la página esté lista.',
        campos: [{ tipo: 'bool', name: 'activo', label: 'Mostrar la franja' }, B('Texto', 'texto', { ayuda: MARCAS })] },
      { id: 'portada', nombre: 'Portada', ayuda: MARCAS,
        campos: [F('Foto de portada'), B('Descripción de la foto', 'alt'), B('Etiqueta', 'etiqueta'), B('Título', 'titulo'), B('Parte resaltada del título', 'titulo_resalte'), BL('Texto', 'texto'),
          B('Botón principal (lleva al formulario)', 'boton1'), B('Botón secundario (lleva al itinerario)', 'boton2'),
          { tipo: 'lista', name: 'datos', label: 'Datos', nuevo: { numero: '', texto: bi() }, campos: [T('Número', 'numero'), B('Texto', 'texto')] }] },
      { id: 'viaje', nombre: 'El viaje', ayuda: MARCAS,
        campos: [...encabezado, { ...items('Pilares'), name: 'pilares' }, F('Foto 1', 'foto1'), B('Descripción foto 1', 'alt1'), F('Foto 2', 'foto2'), B('Descripción foto 2', 'alt2')] },
      { id: 'galeria', nombre: 'Carrusel de fotos',
        campos: [{ tipo: 'lista', name: 'fotos', label: 'Fotos', nuevo: { foto: '', nombre: bi() }, campos: [F('Foto'), B('Nombre', 'nombre')] }] },
      { id: 'itinerario', nombre: 'Itinerario', ayuda: MARCAS,
        campos: [...encabezado, BL('Texto', 'texto'),
          { tipo: 'lista', name: 'capitulos', label: 'Capítulos', nuevo: { foto: '', lugar: '', dias: bi(), titulo: bi(), texto: bi(), detalle: [] },
            campos: [F('Foto'), T('Lugar (sale sobre la foto)', 'lugar'), B('Días', 'dias'), B('Título', 'titulo'), BL('Texto', 'texto'),
              { tipo: 'lista', name: 'detalle', label: 'Día a día', nuevo: { dia: bi(), texto: bi() }, campos: [B('Día', 'dia'), B('Plan', 'texto')] }] }] },
      { id: 'noche', nombre: 'Noche en el Sahara', ayuda: MARCAS, campos: [F('Foto de fondo'), B('Descripción de la foto', 'alt'), ...encabezado, BL('Texto', 'texto')] },
      { id: 'incluye', nombre: 'Qué incluye', ayuda: MARCAS,
        campos: [...encabezado, B('Título incluido', 'titulo_si'), { tipo: 'lista', name: 'si', label: 'Incluido', nuevo: bi(), item: B('', '') },
          B('Título no incluido', 'titulo_no'), { tipo: 'lista', name: 'no', label: 'No incluido', nuevo: bi(), item: B('', '') }] },
      { id: 'precio', nombre: 'Precio y cupos', ayuda: MARCAS + ' Ej.: USD {0.000} mientras no haya precio; USD 4.900 cuando lo haya.',
        campos: [F('Foto'), B('Descripción de la foto', 'alt'), ...encabezado, B('Nota sobre el precio', 'nota'), B('Precio', 'valor'),
          { tipo: 'lista', name: 'filas', label: 'Detalles', nuevo: { etiqueta: bi(), valor: bi() }, campos: [B('Dato', 'etiqueta'), B('Valor', 'valor')] },
          { tipo: 'bool', name: 'mostrar_cupos', label: 'Mostrar la barra de cupos' }, B('Texto de cupos', 'cupos_etiqueta'),
          { tipo: 'numero', name: 'cupos_reservados', label: 'Cupos reservados' }, { tipo: 'numero', name: 'cupos_total', label: 'Cupos en total' }, B('Botón', 'boton')] },
      { id: 'anfitriona', nombre: 'Anfitriona', ayuda: 'Sin foto se ve un recuadro gris de «Foto pendiente».',
        campos: [F('Foto de Luchy'), B('Descripción de la foto', 'alt'), B('Etiqueta de la sección', 'ceja'), BL('Frase', 'cita'), B('Firma', 'firma')] },
      { id: 'preguntas', nombre: 'Preguntas frecuentes', ayuda: MARCAS,
        campos: [...encabezado, { tipo: 'lista', name: 'lista', label: 'Preguntas', nuevo: { pregunta: bi(), respuesta: bi() }, campos: [B('Pregunta', 'pregunta'), BL('Respuesta', 'respuesta')] }] },
      { id: 'reserva', nombre: 'Lista de espera', ayuda: MARCAS, campos: [F('Foto de fondo'), ...encabezado, BL('Texto', 'texto'), B('Botón del formulario', 'boton')] },
    ],
  },
  {
    id: 'popup', nombre: 'Pop-up del inicio', ruta: '',
    secciones: [{
      id: 'popup', nombre: 'Pop-up',
      ayuda: 'Sale una vez por visita en el inicio. Si usa el viaje de temporada, toma de ahí la foto, los textos y los datos.',
      campos: [
        { tipo: 'bool', name: 'activo', label: 'Mostrar el pop-up' },
        { tipo: 'bool', name: 'usar_temporada', label: 'Usar el viaje de temporada vigente' },
        B('Botón para cerrar', 'cerrar'),
        F('Foto (si no usa el viaje de temporada)'), B('Descripción de la foto', 'alt'), B('Aviso', 'aviso'), B('Etiqueta', 'etiqueta'),
        B('Título', 'titulo'), B('Parte resaltada del título', 'titulo_resalte'), BL('Texto', 'texto'), B('Texto del botón', 'boton'),
        T('Página a la que lleva el botón', 'enlace', { ayuda: 'Ej.: marruecos/' }),
      ],
    }],
  },
];

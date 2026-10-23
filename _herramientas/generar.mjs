// Wanna Go · genera las páginas internas (servicios y destinos), el menú, el pie y el bloque SEO
// del inicio y de Marruecos, sitemap.xml y robots.txt.
// Uso, desde sitio/:  node _herramientas/generar.mjs
// Textos: t('español', 'English'). El inglés de cada página llega a i18n.js como WG_EN_PAGE;
// los textos sin t() ya están en el diccionario WG_EN de i18n.js.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'https://feliperpovera.github.io/wannago/'; // cambiar al conectar el dominio propio
const INDEXAR = false; // true al salir en vivo: quita el noindex de todas las páginas
const V = '20261023c';  // sube este número cuando cambies un CSS o JS
const WA = 'https://wa.me/573122899185';
const medidas = JSON.parse(readFileSync('fotos/medidas.json', 'utf8'));

const EN = {};
const t = (es, en) => {
  if (es in EN && EN[es] !== en) throw new Error(`Traducción distinta para «${es}»`);
  return EN[es] = en, es;
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const wa = texto => `${WA}?text=${encodeURIComponent(texto)}`;
let pre = ''; // prefijo relativo de la página en curso: '', '../' o '../../'
const href = ruta => pre + ruta || './';
const img = (foto, alt = '', sizes = '100vw', portada = false) => {
  const w = medidas[foto][0];
  return `<img src="${pre}fotos/${foto}.webp" srcset="${pre}fotos/${foto}-800.webp ${Math.round(w / 2)}w, ${pre}fotos/${foto}.webp ${w}w" sizes="${sizes}" alt="${esc(alt)}"${portada ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
};

// ---------- Contenido ----------

const SERVICIOS = [
  { slug: 'viajes-a-la-medida', nombre: 'Viajes a la medida' },
  { slug: 'viajes-grupales', nombre: 'Viajes grupales' },
  { slug: 'eventos-corporativos', nombre: 'Eventos corporativos' },
];

const DATOS = [t('Cómo llegar', 'Getting there'), t('Mejor época', 'Best time'), t('Tiempo sugerido', 'Suggested time'), t('Ideal para', 'Ideal for')];

const DESTINOS = [
  {
    slug: 'guatape', foto: 'guatape', foto2: 'guatape-calle',
    nombre: 'Guatapé', h1: t('Guatapé y la Piedra del Peñol', 'Guatapé and the Piedra del Peñol'),
    alt: t('Embalse de Guatapé con sus islas verdes visto desde lo alto', 'Guatapé reservoir and its green islands seen from above'),
    alt2: 'Calle con fachadas de colores y zócalos en Guatapé',
    region: t('Antioquia · a 2 horas de Medellín', 'Antioquia · 2 hours from Medellín'),
    corto: t('Zócalos de colores y la Piedra del Peñol.', 'Colorful zócalos and the Piedra del Peñol.'),
    titulo: t('Guatapé y la Piedra del Peñol desde Medellín · Wanna Go', 'Guatapé and the Piedra del Peñol from Medellín · Wanna Go'),
    desc: 'Viaje a Guatapé desde Medellín: sube la Piedra del Peñol, recorre las calles de zócalos y navega el embalse. Diseñado a tu medida por Wanna Go.',
    lead: t('El pueblo de los zócalos y la piedra que mira sobre un mar de islas. A dos horas de Medellín, uno de los paisajes más fotografiados de Colombia.', 'The town of painted zócalos and the rock that looks out over a sea of islands. Two hours from Medellín, one of the most photographed landscapes in Colombia.'),
    h2: t('Color, agua y montaña', 'Color, water and mountains'),
    ps: [
      t('Guatapé es un pueblo de calles empedradas donde cada casa cuenta su historia en los zócalos: relieves de colores en la base de las fachadas que muestran oficios, animales y escenas de la vida local.', 'Guatapé is a town of cobbled streets where every house tells its story through its zócalos: colorful reliefs along the base of the façades depicting trades, animals and scenes of local life.'),
      t('Muy cerca está la Piedra del Peñol. Quien sube sus más de 700 escalones encuentra arriba una vista completa del embalse, con sus islas y penínsulas verdes. Con nosotros lo recorres sin afán, con tiempo para el agua, la cocina local y la conversación.', 'Nearby stands the Piedra del Peñol. Those who climb its more than 700 steps are rewarded with a full view of the reservoir, its islands and green peninsulas. With us you explore it unhurried, with time for the water, local food and conversation.'),
    ],
    vivir: [
      [t('Subir la Piedra del Peñol', 'Climb the Piedra del Peñol'), t('Más de 700 escalones y una de las vistas más amplias de Antioquia.', 'More than 700 steps up to one of the widest views in Antioquia.')],
      [t('Calles de zócalos', 'Streets of zócalos'), t('Un recorrido a pie por las fachadas pintadas y sus historias.', 'A walk past the painted façades and the stories they tell.')],
      [t('Paseo por el embalse', 'Out on the reservoir'), t('Lancha o velero entre islas, bahías y fincas a la orilla del agua.', 'Boat or sailboat among islands, bays and lakeside farms.')],
      [t('Cocina de pueblo', 'Small-town cooking'), t('Trucha, bandeja paisa y postres de la región en lugares que conocemos.', 'Trout, bandeja paisa and regional desserts at places we know well.')],
    ],
    datos: [
      t('2 horas por carretera desde Medellín', '2 hours by road from Medellín'),
      t('Todo el año', 'Year-round'),
      t('1 o 2 días', '1 or 2 days'),
      t('Familias, parejas y grupos', 'Families, couples and groups'),
    ],
    otros: ['comuna-13', 'plazas-de-mercado', 'eje-cafetero'],
  },
  {
    slug: 'comuna-13', foto: 'comuna13', foto2: 'medellin-montanas',
    nombre: 'Comuna 13', h1: 'Comuna 13, Medellín',
    alt: t('Casas de colores y murales en las laderas de la Comuna 13', 'Colorful houses and murals on the hillsides of Comuna 13'),
    alt2: 'Edificios de Medellín frente a las montañas',
    region: t('Medellín · barrio San Javier', 'Medellín · San Javier district'),
    corto: t('Grafiti, hip hop y una historia de transformación.', 'Graffiti, hip hop and a story of transformation.'),
    titulo: t('Tour por la Comuna 13 de Medellín · Wanna Go', 'Comuna 13 tour in Medellín · Wanna Go'),
    desc: 'Recorre la Comuna 13 de Medellín con guías del barrio: grafitis, escaleras eléctricas, hip hop y la historia de su transformación. Con Wanna Go.',
    lead: t('Grafitis, hip hop y escaleras eléctricas al aire libre en el barrio que se convirtió en símbolo de la transformación de Medellín.', "Graffiti, hip hop and open-air escalators in the neighborhood that became a symbol of Medellín's transformation."),
    h2: t('Una historia contada desde adentro', 'A story told from the inside'),
    ps: [
      t('La Comuna 13 pasó de ser uno de los lugares más difíciles de Medellín a uno de sus barrios más visitados. Sus muros pintados, la música en la calle y las escaleras eléctricas que suben la ladera cuentan ese cambio mejor que cualquier libro.', 'Comuna 13 went from being one of the toughest places in Medellín to one of its most visited neighborhoods. Its painted walls, street music and the escalators climbing the hillside tell that change better than any book.'),
      t('Lo recorres con guías que nacieron y crecieron en el barrio. Ellos te muestran sus calles, te presentan a artistas locales y te explican el significado de cada mural.', 'You walk it with guides who were born and raised in the neighborhood. They show you their streets, introduce you to local artists and explain the meaning behind each mural.'),
    ],
    vivir: [
      [t('Grafitour', 'Graffiti tour'), t('Los murales más importantes, explicados por quienes los vieron nacer.', 'The key murals, explained by the people who watched them being painted.')],
      [t('Escaleras eléctricas', 'Outdoor escalators'), t('El recorrido por las escaleras que cambiaron la vida de la ladera.', 'A ride up the escalators that changed life on the hillside.')],
      [t('Hip hop y baile', 'Hip hop and dance'), t('Música y baile en la calle con los grupos del barrio.', 'Street music and dance with local crews.')],
      [t('Sabores del barrio', 'Neighborhood flavors'), t('Paletas artesanales, empanadas y café en negocios locales.', 'Handmade ice pops, empanadas and coffee at local businesses.')],
    ],
    datos: [
      t('En Medellín, desde la estación San Javier del metro', 'In Medellín, from the San Javier metro station'),
      t('Todo el año', 'Year-round'),
      t('Medio día', 'Half a day'),
      t('Viajeros curiosos y grupos', 'Curious travelers and groups'),
    ],
    otros: ['plazas-de-mercado', 'guatape', 'cartagena'],
  },
  {
    slug: 'cartagena', foto: 'cartagena-casas', foto2: 'cartagena',
    nombre: 'Cartagena', h1: 'Cartagena de Indias',
    alt: t('Casas coloniales de colores en el centro histórico de Cartagena', 'Colorful colonial houses in the historic center of Cartagena'),
    alt2: 'Calle colonial de Cartagena con faroles',
    region: t('Caribe colombiano · Bolívar', 'Colombian Caribbean · Bolívar'),
    corto: t('La ciudad amurallada y el mar Caribe.', 'The walled city and the Caribbean Sea.'),
    titulo: t('Viaje a Cartagena de Indias a tu medida · Wanna Go', 'Tailor-made trip to Cartagena de Indias · Wanna Go'),
    desc: 'Viaje a Cartagena a tu medida: ciudad amurallada, Getsemaní e Islas del Rosario, con hoteles boutique y guías locales. Diseñado desde Medellín por Wanna Go.',
    lead: t('Murallas, balcones con flores y atardeceres sobre el Caribe. La ciudad amurallada vista con calma, lejos del recorrido de siempre.', 'City walls, flower-draped balconies and sunsets over the Caribbean. The walled city seen calmly, away from the usual route.'),
    h2: t('La ciudad que se camina despacio', 'A city meant to be walked slowly'),
    ps: [
      t('El centro histórico de Cartagena, con su puerto, sus fortalezas y su conjunto monumental, es Patrimonio de la Humanidad de la UNESCO desde 1984. Sus calles coloniales, plazas y casas de colores se disfrutan mejor a pie, al ritmo del Caribe.', "Cartagena's historic center, with its port, fortresses and monumental ensemble, has been a UNESCO World Heritage Site since 1984. Its colonial streets, squares and colorful houses are best enjoyed on foot, at a Caribbean pace."),
      t('Diseñamos tu viaje combinando la ciudad amurallada, el barrio de Getsemaní y el mar de las Islas del Rosario, con hoteles boutique y restaurantes que hemos probado.', 'We design your trip combining the walled city, the Getsemaní neighborhood and the sea around the Rosario Islands, with boutique hotels and restaurants we have tried ourselves.'),
    ],
    vivir: [
      [t('Ciudad amurallada', 'The walled city'), t('Plazas, iglesias y balcones con un guía local.', 'Squares, churches and balconies with a local guide.')],
      ['Getsemaní', t('Murales, música y la vida de barrio al caer la tarde.', 'Murals, music and neighborhood life as evening falls.')],
      [t('Islas del Rosario', 'Rosario Islands'), t('Un día de mar turquesa y playas tranquilas.', 'A day of turquoise water and quiet beaches.')],
      [t('Cocina del Caribe', 'Caribbean cuisine'), t('Pescado fresco, arroz con coco y frutas tropicales.', 'Fresh fish, coconut rice and tropical fruit.')],
    ],
    datos: [
      t('Vuelo directo desde Medellín', 'Direct flight from Medellín'),
      t('De diciembre a abril, la temporada más seca', 'December to April, the driest season'),
      t('3 a 4 días', '3 to 4 days'),
      t('Parejas, amigas y celebraciones', 'Couples, friends and celebrations'),
    ],
    otros: ['tayrona', 'eje-cafetero', 'guatape'],
  },
  {
    slug: 'valle-de-cocora', foto: 'salento', foto2: 'cafe',
    nombre: 'Valle de Cocora', h1: t('Valle de Cocora y Salento', 'Cocora Valley and Salento'),
    alt: 'Palmas de cera en el valle de Cocora',
    alt2: 'Granos de café maduros en la rama',
    region: t('Quindío · Eje Cafetero', 'Quindío · Coffee Region'),
    corto: t('Caminatas entre las palmas de cera.', 'Hikes among the wax palms.'),
    titulo: t('Valle de Cocora y Salento: palmas de cera · Wanna Go', 'Cocora Valley and Salento: wax palms · Wanna Go'),
    desc: 'Camina entre las palmas de cera del Valle de Cocora, conoce Salento y visita una finca cafetera. Viaje al Quindío diseñado por Wanna Go.',
    lead: t('Caminar entre palmas de cera, el árbol nacional de Colombia, en un valle de niebla y montaña a las afueras de Salento.', "Walk among wax palms, Colombia's national tree, in a misty mountain valley just outside Salento."),
    h2: t('El valle de las palmas más altas', 'The valley of the tallest palms'),
    ps: [
      t('La palma de cera del Quindío es el árbol nacional de Colombia y una de las palmas más altas del mundo: puede llegar a los 60 metros. En el Valle de Cocora crecen cientos de ellas sobre potreros verdes y laderas cubiertas de niebla.', "The Quindío wax palm is Colombia's national tree and one of the tallest palms in the world: it can reach 60 meters. Hundreds of them rise over green pastures and mist-covered slopes in the Cocora Valley."),
      t('Combinamos la caminata con Salento, uno de los pueblos más tradicionales del Eje Cafetero, y con una finca cafetera para entender el café desde la semilla hasta la taza.', 'We pair the hike with Salento, one of the most traditional towns in the Coffee Region, and with a coffee farm to understand coffee from seed to cup.'),
    ],
    vivir: [
      [t('Caminata entre palmas', 'Hike among the palms'), t('Senderos de distintos niveles, a tu ritmo.', 'Trails for different levels, at your own pace.')],
      ['Salento', t('Calle Real, balcones de colores y artesanías.', 'Calle Real, colorful balconies and local crafts.')],
      [t('Finca cafetera', 'Coffee farm'), t('Recolección, tostión y cata con productores.', 'Picking, roasting and tasting with growers.')],
      [t('Trucha y patacón', 'Trout and patacón'), t('El plato típico del valle, frente a las montañas.', "The valley's classic dish, with mountain views.")],
    ],
    datos: [
      t('Vuelo a Pereira o Armenia y 1 hora por carretera', 'Flight to Pereira or Armenia, then 1 hour by road'),
      t('Todo el año; las mañanas suelen ser más despejadas', 'Year-round; mornings tend to be clearer'),
      t('2 o 3 días con Salento', '2 or 3 days including Salento'),
      t('Amantes de la naturaleza y la caminata', 'Nature and hiking lovers'),
    ],
    otros: ['eje-cafetero', 'guatape', 'tayrona'],
  },
  {
    slug: 'tayrona', foto: 'tayrona', foto2: 'grupo-atardecer',
    nombre: t('Parque Tayrona', 'Tayrona Park'), h1: t('Parque Nacional Natural Tayrona', 'Tayrona National Natural Park'),
    alt: t('Playa del Parque Tayrona con selva y rocas junto al mar', 'Tayrona Park beach with jungle and boulders by the sea'),
    alt2: 'Grupo de viajeros contemplando el atardecer',
    region: t('Caribe colombiano · Magdalena', 'Colombian Caribbean · Magdalena'),
    corto: t('Selva y playas al pie de la Sierra Nevada.', 'Jungle and beaches at the foot of the Sierra Nevada.'),
    titulo: t('Viaje al Parque Tayrona con Wanna Go', 'Trip to Tayrona Park with Wanna Go'),
    desc: 'Viaje al Parque Tayrona: senderos de selva, Cabo San Juan y la cultura de la Sierra Nevada de Santa Marta, con guías locales. Diseñado por Wanna Go.',
    lead: t('Selva que baja de la Sierra Nevada hasta playas de arena dorada. Un parque nacional para recorrer con respeto y sin prisa.', 'Jungle that runs down from the Sierra Nevada to golden-sand beaches. A national park to explore respectfully and unhurried.'),
    h2: t('Donde la sierra se encuentra con el mar', 'Where the mountains meet the sea'),
    ps: [
      t('El Parque Nacional Natural Tayrona, cerca de Santa Marta, protege bosques, bahías y playas al pie de la Sierra Nevada de Santa Marta, territorio ancestral de los pueblos kogui, arhuaco, wiwa y kankuamo.', 'Tayrona National Natural Park, near Santa Marta, protects forests, bays and beaches at the foot of the Sierra Nevada de Santa Marta, ancestral land of the Kogi, Arhuaco, Wiwa and Kankuamo peoples.'),
      t('Organizamos tu visita con guías locales, alojamiento en la zona y los tiempos del parque, que cierra algunas temporadas al año para su descanso ecológico. Te confirmamos las fechas antes de reservar.', 'We plan your visit with local guides, nearby lodging and the park schedule, since it closes for a few periods each year to let the ecosystem rest. We confirm the dates before booking.'),
    ],
    vivir: [
      [t('Senderos de selva', 'Jungle trails'), t('Caminatas entre bosque tropical, monos y rocas gigantes.', 'Walks through tropical forest, monkeys and giant boulders.')],
      ['Cabo San Juan', t('Una de las playas más bonitas del Caribe colombiano.', "One of the most beautiful beaches on Colombia's Caribbean coast.")],
      [t('Cultura de la Sierra', 'Culture of the Sierra'), t('Un acercamiento a la visión de los pueblos indígenas de la Sierra Nevada.', "An introduction to the worldview of the Sierra Nevada's Indigenous peoples.")],
      ['Santa Marta', t('La ciudad más antigua de Colombia, como base del viaje.', "Colombia's oldest city, as your base.")],
    ],
    datos: [
      t('Vuelo directo a Santa Marta y 1 hora por carretera', 'Direct flight to Santa Marta, then 1 hour by road'),
      t('De diciembre a abril, la temporada más seca', 'December to April, the driest season'),
      t('3 a 4 días', '3 to 4 days'),
      t('Naturaleza, mar y aventura suave', 'Nature, sea and gentle adventure'),
    ],
    otros: ['cartagena', 'valle-de-cocora', 'comuna-13'],
  },
  {
    slug: 'eje-cafetero', foto: 'cafe', foto2: 'salento',
    nombre: 'Eje Cafetero', h1: t('Eje Cafetero', 'Coffee Region'),
    alt: 'Granos de café maduros en la rama',
    alt2: 'Palmas de cera en el valle de Cocora',
    region: t('Caldas, Risaralda y Quindío', 'Caldas, Risaralda and Quindío'),
    corto: t('Fincas, pueblos y café de origen.', 'Farms, villages and single-origin coffee.'),
    titulo: t('Viaje al Eje Cafetero: fincas y café · Wanna Go', 'Trip to the Coffee Region: farms and coffee · Wanna Go'),
    desc: 'Viaje al Eje Cafetero de Colombia: fincas cafeteras, Salento, Filandia y el Valle de Cocora, en el Paisaje Cultural Cafetero. Diseñado por Wanna Go.',
    lead: t('Montañas sembradas de café, pueblos de bahareque y fincas donde el día empieza con una taza recién hecha.', 'Coffee-planted mountains, bahareque villages and farms where the day starts with a freshly brewed cup.'),
    h2: t('Un paisaje que es patrimonio', 'A landscape that is World Heritage'),
    ps: [
      t('El Paisaje Cultural Cafetero de Colombia es Patrimonio Mundial de la UNESCO desde 2011. Reconoce una forma de vida: familias que cultivan café en laderas empinadas desde hace generaciones y pueblos con arquitectura de colores.', "Colombia's Coffee Cultural Landscape has been a UNESCO World Heritage Site since 2011. It recognizes a way of life: families who have grown coffee on steep slopes for generations and villages with colorful architecture."),
      t('Te llevamos a fincas donde los productores te enseñan su oficio, a pueblos como Filandia y Salento, y a paisajes como el Valle de Cocora. Dormir en una finca es parte del viaje.', 'We take you to farms where growers share their craft, to villages like Filandia and Salento, and to landscapes like the Cocora Valley. Staying on a farm is part of the trip.'),
    ],
    vivir: [
      [t('Del grano a la taza', 'From bean to cup'), t('Recolección, secado, tostión y cata con una familia cafetera.', 'Picking, drying, roasting and tasting with a coffee-growing family.')],
      [t('Filandia y Salento', 'Filandia and Salento'), t('Pueblos de balcones de colores y miradores.', 'Villages of colorful balconies and lookouts.')],
      [t('Dormir en una finca', 'Stay on a farm'), t('Casas tradicionales rodeadas de cafetales.', 'Traditional houses surrounded by coffee plantations.')],
      [t('Termales y naturaleza', 'Hot springs and nature'), t('Aguas termales, avistamiento de aves y jardines botánicos.', 'Hot springs, birdwatching and botanical gardens.')],
    ],
    datos: [
      t('Vuelo a Pereira o Armenia, o 5 a 6 horas por carretera desde Medellín', 'Flight to Pereira or Armenia, or 5 to 6 hours by road from Medellín'),
      t('Todo el año; la cosecha principal va de septiembre a diciembre', 'Year-round; the main harvest runs from September to December'),
      t('3 a 5 días', '3 to 5 days'),
      t('Amantes del café, familias y parejas', 'Coffee lovers, families and couples'),
    ],
    otros: ['valle-de-cocora', 'guatape', 'plazas-de-mercado'],
  },
  {
    slug: 'plazas-de-mercado', foto: 'frutas', foto2: 'medellin',
    nombre: 'Plazas de mercado', h1: t('Plazas de mercado de Medellín', "Medellín's market halls"),
    alt: t('Puesto de frutas tropicales en una plaza de mercado', 'Tropical fruit stall at a market hall'),
    alt2: 'Medellín iluminada al atardecer, rodeada de montañas',
    region: 'Medellín',
    corto: t('Frutas exóticas y cocina popular.', 'Exotic fruit and home-style cooking.'),
    titulo: t('Tour de frutas en plazas de mercado de Medellín · Wanna Go', 'Fruit tour in Medellín market halls · Wanna Go'),
    desc: 'Tour de frutas exóticas por las plazas de mercado de Medellín: cata en el puesto, yerbateros y almuerzo típico, con guías locales de Wanna Go.',
    lead: t('Lulo, granadilla, maracuyá, guanábana. Colombia se prueba en sus plazas de mercado, entre puestos de frutas, hierbas y cocina popular.', 'Lulo, granadilla, passion fruit, soursop. Colombia is tasted in its market halls, among stalls of fruit, herbs and home-style cooking.'),
    h2: t('La despensa de Medellín', "Medellín's pantry"),
    ps: [
      t('Las plazas de mercado son el lugar donde se cruza todo Antioquia: campesinos, cocineras, yerbateros y vendedores que llevan toda la vida en el mismo puesto. Colombia tiene una enorme variedad de frutas y aquí se ve, se huele y se prueba.', 'Market halls are where all of Antioquia meets: farmers, cooks, herbalists and vendors who have spent a lifetime at the same stall. Colombia has an enormous variety of fruit, and here you see it, smell it and taste it.'),
      t('Recorremos plazas como la Minorista con guías locales, probamos frutas que no encontrarás en otro país y terminamos en la mesa, con un almuerzo típico.', "We walk through market halls like La Minorista with local guides, taste fruit you won't find anywhere else and finish at the table with a traditional lunch."),
    ],
    vivir: [
      [t('Cata de frutas', 'Fruit tasting'), t('Frutas exóticas explicadas y probadas en el puesto.', 'Exotic fruits explained and tasted right at the stall.')],
      [t('Hierbas y saberes', 'Herbs and folk wisdom'), t('Los yerbateros y sus remedios tradicionales.', 'Herbalists and their traditional remedies.')],
      [t('Almuerzo de plaza', 'Market lunch'), t('Sopa, frijoles o sancocho donde comen los que trabajan ahí.', 'Soup, beans or sancocho where the market workers eat.')],
      [t('Café y arepa', 'Coffee and arepa'), t('Desayuno paisa para empezar con energía.', 'A paisa breakfast to start the day.')],
    ],
    datos: [
      t('En Medellín, cerca del centro', 'In Medellín, near downtown'),
      t('Todo el año, mejor en la mañana', 'Year-round, best in the morning'),
      t('Medio día', 'Half a day'),
      t('Viajeros curiosos y amantes de la cocina', 'Curious travelers and food lovers'),
    ],
    otros: ['comuna-13', 'guatape', 'eje-cafetero'],
  },
];
const D = Object.fromEntries(DESTINOS.map(d => [d.slug, d]));

// Viaje de temporada y cuadros de Colombia: se editan en _datos/viajes.json
const VIAJES = JSON.parse(readFileSync('_datos/viajes.json', 'utf8'));
const TEMP = VIAJES.temporada.activo ? VIAJES.temporada : null;
const L = v => typeof v === 'string' ? v : t(v.es, v.en);

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

// ---------- Piezas ----------

const ISO = `<span class="lt">Wanna G<i class="iso"></i></span><span class="ds">COLOMBIA</span>`;

const nav = () => `<nav class="nav" id="nav">
  <div class="wrap">
    <a class="logo" href="${href('')}" aria-label="Wanna Go Colombia, inicio">${ISO}</a>
    <ul>
      <li><a href="${href('nosotros/')}">Nosotros</a></li>
      <li><a href="${href('viajes-a-la-medida/')}">${t('A la medida', 'Tailor-made')}</a></li>
      <li><a href="${href('viajes-grupales/')}">Viajes grupales</a></li>
      <li><a href="${href('destinos/')}">${t('Destinos', 'Destinations')}</a></li>
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
    <nav aria-label="Wanna Go"><b>Wanna Go</b><a href="${href('nosotros/')}">Nosotros</a><a href="${href('contacto/')}">Contacto</a><a href="${WA}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:wannagoco@gmail.com">wannagoco@gmail.com</a><a href="https://www.instagram.com/wannagocol/" target="_blank" rel="noopener">Instagram</a></nav>
  </div>
  <div class="wrap foot-bottom"><span>Viajes con propósito · RNT 65568 · Medellín, Colombia</span><span>Fotos de referencia: Unsplash</span></div>
</footer>`;

const WA_FLOAT = readFileSync('index.html', 'utf8').match(/<a class="wa-float"[\s\S]*?<\/a>/)[0];

const portada = p => `<header class="hero sm">
  ${img(p.foto, p.alt, '100vw', true)}
  <div class="wrap">
    <ol class="crumbs" aria-label="${t('Ruta de navegación', 'Breadcrumb')}">${p.migas.map(([n, r], i, a) => i < a.length - 1 ? `<li><a href="${href(r)}">${n}</a></li>` : `<li aria-current="page">${n}</li>`).join('')}</ol>
    <span class="label">${p.label}</span>
    <h1>${p.h1}</h1>
    <p class="lead">${p.lead}</p>
    ${p.boton ? `<div class="row"><a class="btn btn-rojo" href="${wa(p.boton)}" target="_blank" rel="noopener">${t('Cotizar por WhatsApp', 'Get a quote on WhatsApp')}</a></div>` : ''}
  </div>
</header>`;

const encabezado = (ceja, titulo, oscuro) => `<div class="head rv">
      <span class="eyebrow${oscuro ? ' on-dark' : ''}">${ceja}</span>
      <h2 class="h2">${titulo}</h2>
    </div>`;

const intro = (ceja, titulo, ps, foto, alt, extra = '') => `<section class="sec">
  <div class="wrap about">
    <div class="rv">
      <span class="eyebrow">${ceja}</span>
      <h2 class="h2">${titulo}</h2>
      ${ps.map(p => `<p class="body-lg">${p}</p>`).join('\n      ')}${extra}
    </div>
    <figure class="rv">${img(foto, alt, '(max-width:900px) 100vw, 50vw')}</figure>
  </div>
</section>`;

const tarjetas = (ceja, titulo, items) => `<section class="sec bg-arena">
  <div class="wrap">
    ${encabezado(ceja, titulo)}
    <div class="pillars">
      ${items.map(([h, p], i) => `<article class="pillar rv"><span class="num">0${i + 1}</span><h3>${h}</h3><p>${p}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>`;

const datos = (ceja, valores) => `<section class="sec">
  <div class="wrap">
    ${encabezado(ceja, t('Antes de ir', 'Before you go'))}
    <div class="facts rv">
      ${valores.map((v, i) => `<div class="fact"><small>${DATOS[i]}</small><b>${v}</b></div>`).join('\n      ')}
    </div>
  </div>
</section>`;

const tarjetaDestino = d => `<a class="svc rv" href="${href('destinos/' + d.slug + '/')}">
        ${img(d.foto, '', '(max-width:900px) 100vw, 33vw')}
        <div><span class="label">${d.region}</span><h3>${d.nombre}</h3><p>${d.corto}</p><span class="go">${t('Ver destino', 'See destination')} <span>→</span></span></div>
      </a>`;

const destinos = (ceja, titulo, slugs, fondo = '') => `<section class="sec${fondo}">
  <div class="wrap">
    ${encabezado(ceja, titulo)}
    <div class="services${slugs.length > 3 ? ' four' : ''}">
      ${slugs.map(s => tarjetaDestino(D[s])).join('\n      ')}
    </div>
  </div>
</section>`;

const tituloTemp = () => `${L(TEMP.titulo)} <em>${L(TEMP.titulo_resalte)}</em>`;
const datosTemp = () => TEMP.datos.map(([n, u]) => `<span><b>${n}</b> ${L(u)}</span>`).join('') +
  `<span>Salida <span${TEMP.salida_por_definir ? ' class="tbd"' : ''}>${TEMP.salida}</span></span>`;

// Inicio, después de la portada: viaje de temporada arriba y cuadros de Colombia debajo
const seccionViajes = () => `<section class="sec bg-arena" id="viajes">
  <div class="wrap">
    ${encabezado(t('01 · Nuestros viajes', '01 · Our trips'), t('Elige tu próximo viaje', 'Choose your next trip'))}
    ${TEMP ? `<a class="featured rv" href="${href(TEMP.enlace)}">
      ${img(TEMP.foto, L(TEMP.alt), '(max-width:1200px) 100vw, 1200px')}
      <div class="in">
        <div class="tags"><span class="badge">${t('Viaje de temporada', 'Season trip')}</span><span class="badge soon">${L(TEMP.aviso)}</span></div>
        <span class="label">${L(TEMP.etiqueta)}</span>
        <h3>${tituloTemp()}</h3>
        <p>${L(TEMP.resumen)}</p>
        <div class="facts-row">${datosTemp()}</div>
        <span class="btn btn-rojo">${L(TEMP.boton)} <span>→</span></span>
      </div>
    </a>` : ''}
    <div class="squares">
      ${VIAJES.colombia.map(({ destino, aviso }) => { const d = D[destino]; return `<a class="svc rv" href="${href('destinos/' + d.slug + '/')}">
        ${img(d.foto, '', '(max-width:900px) 50vw, 300px')}${aviso ? `<span class="badge">${L(aviso)}</span>` : ''}
        <div><span class="label">${d.region}</span><h3>${d.nombre}</h3></div>
      </a>`; }).join('\n      ')}
      <a class="svc sq-cta rv" href="${href('viajes-a-la-medida/')}">
        <div><span class="label">A tu ritmo</span><h3>${t('Diseña tu propio viaje', 'Design your own trip')}</h3><span class="go">${t('Empezar', 'Get started')} <span>→</span></span></div>
      </a>
    </div>
  </div>
</section>`;

const promo = () => TEMP ? `<dialog class="promo" id="promo" aria-labelledby="promo-title">
  <button class="promo-close" type="button" aria-label="Cerrar" data-close><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  <div class="promo-in">
    <figure>${img(TEMP.foto, L(TEMP.alt), '(max-width:720px) 100vw, 420px')}<span class="badge">${L(TEMP.aviso)}</span></figure>
    <div class="promo-body">
      <span class="label">${L(TEMP.etiqueta)}</span>
      <h2 id="promo-title">${tituloTemp()}</h2>
      <p>${L(TEMP.resumen)}</p>
      <div class="promo-facts">${datosTemp()}</div>
      <div class="promo-actions">
        <a class="btn btn-rojo" href="${href(TEMP.enlace)}">${L(TEMP.boton)}</a>
        <button class="btn btn-quiet" type="button" data-close>Ahora no</button>
      </div>
    </div>
  </div>
</dialog>` : '';

const resenas = () => `<section class="sec bg-arena reviews">
  <div class="wrap rv-head">
    <div class="rv">
      <span class="eyebrow">${t('Lo que dicen', 'What people say')}</span>
      <h2 class="h2">Historias de quienes viajaron con nosotros</h2>
    </div>
    <a class="rv-score rv" href="https://share.google/e8BOJXLnY23zuiExs" target="_blank" rel="noopener">
      <b>5.0</b>
      <span><span class="rv-stars" aria-hidden="true">★★★★★</span><small>13 reseñas en Google</small></span>
    </a>
  </div>
  <div class="rv-row" aria-label="Reseñas de Google"></div>
  <div class="rv-row rev" aria-hidden="true"></div>
</section>`;

const cierre = (titulo, mensaje, foto) => `<section class="quote">
  ${img(foto, '', '100vw')}
  <div class="wrap">
    <h2>${titulo}</h2>
    <div class="row">
      <a class="btn btn-rojo" href="${wa(mensaje)}" target="_blank" rel="noopener">${t('Escribir por WhatsApp', 'Message us on WhatsApp')}</a>
      <a class="btn btn-line" href="${href('contacto/')}">Diseñar mi viaje</a>
    </div>
  </div>
</section>`;

// ---------- Páginas ----------

const INICIO = [t('Inicio', 'Home'), ''];
const URLS = ['', 'marruecos/'];

function pagina(ruta, armar) {
  pre = '../'.repeat(ruta.split('/').length - 1);
  const p = armar();
  const cuerpo = [nav(), portada(p), p.cuerpo, pie(), WA_FLOAT].join('\n\n');
  const scripts = ['marca.js', 'i18n.js', 'wa.js', ...(cuerpo.includes('rv-row') ? ['resenas.js'] : [])]
    .map(s => `<script src="${pre}${s}?v=${V}"></script>`).join('\n');
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${seo({ ...p, ruta }, p.titulo + cuerpo)}
<link rel="icon" href="${ICONO}">
<link rel="stylesheet" href="${pre}marca.css?v=${V}">
<link rel="stylesheet" href="${pre}wa.css?v=${V}">
<link rel="stylesheet" href="${pre}menu.css?v=${V}">
</head>
<body>

${cuerpo}

${scripts}
</body>
</html>
`;
  mkdirSync(ruta, { recursive: true });
  writeFileSync(ruta + 'index.html', html);
  URLS.push(ruta);
}

const ICONO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ED3237'/%3E%3Cpath d='M20 7a10 10 0 0 1 10 10c0 7-10 23-10 23S10 24 10 17A10 10 0 0 1 20 7z' fill='%23fff'/%3E%3Ccircle cx='20' cy='17' r='4.4' fill='%23ED3237'/%3E%3C/svg%3E`;

// Bloque <head> de SEO: robots, título, descripción, canonical, Open Graph, fuente, JSON-LD y textos en inglés
function seo(p, texto) {
  const url = BASE + p.ruta;
  const en = Object.fromEntries(Object.entries(EN).filter(([es]) => texto.includes(es)));
  return [
    INDEXAR ? '' : '<meta name="robots" content="noindex">',
    `<title>${esc(p.titulo)}</title>`,
    `<meta name="description" content="${esc(p.desc)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="es_CO">`,
    `<meta property="og:site_name" content="Wanna Go Colombia">`,
    `<meta property="og:title" content="${esc(p.titulo)}">`,
    `<meta property="og:description" content="${esc(p.desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${BASE}fotos/og/${p.foto}.jpg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="preload" href="${pre}fuentes/montserrat.woff2" as="font" type="font/woff2" crossorigin>`,
    `<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': [...p.schema, ORG] })}</script>`,
    Object.keys(en).length ? `<script>self.WG_EN_PAGE=${json(en)}</script>` : '',
  ].filter(Boolean).join('\n');
}

// Destinos
for (const d of DESTINOS) pagina(`destinos/${d.slug}/`, () => {
  const ruta = `destinos/${d.slug}/`;
  const m = [INICIO, [t('Destinos', 'Destinations'), 'destinos/'], [d.nombre, ruta]];
  return {
    titulo: d.titulo, desc: d.desc, foto: d.foto, alt: d.alt, migas: m,
    label: d.region, h1: d.h1, lead: d.lead, boton: `Hola Wanna Go, quiero viajar a ${d.nombre}.`,
    schema: [migas(m), { '@type': 'TouristDestination', name: d.h1, description: d.desc, url: BASE + ruta, image: BASE + `fotos/og/${d.foto}.jpg` }],
    cuerpo: [
      intro(t('01 · Por qué ir', '01 · Why go'), d.h2, d.ps, d.foto2, d.alt2),
      tarjetas(t('02 · Qué vivir', '02 · What to experience'), t(`Qué hacer en ${d.nombre}`, `Things to do in ${EN[d.nombre] || d.nombre}`), d.vivir),
      datos(t('03 · Datos prácticos', '03 · Practical info'), d.datos),
      destinos(t('04 · Sigue explorando', '04 · Keep exploring'), t('Combínalo con', 'Pair it with'), d.otros, ' bg-arena'),
      cierre(t(`Diseñemos tu viaje a ${d.nombre}`, `Let's design your trip to ${EN[d.nombre] || d.nombre}`), `Hola Wanna Go, quiero viajar a ${d.nombre}.`, d.foto2),
    ].join('\n\n'),
  };
});

// Destinos (índice)
pagina('destinos/', () => {
  const m = [INICIO, [t('Destinos', 'Destinations'), 'destinos/']];
  return {
    titulo: t('Destinos en Colombia para viajar con propósito · Wanna Go', 'Destinations in Colombia for purposeful travel · Wanna Go'),
    desc: 'Guatapé, Comuna 13, Cartagena, Valle de Cocora, Tayrona y el Eje Cafetero: viajes por Colombia diseñados desde Medellín por Wanna Go.',
    foto: 'guatape', alt: D.guatape.alt, migas: m,
    label: t('Destinos en Colombia', 'Destinations in Colombia'), h1: 'Conoce Colombia desde adentro',
    lead: t('Siete lugares que diseñamos con cariño, desde Medellín hasta el Caribe. Cada uno se puede combinar en un viaje a tu medida.', 'Seven places we design with care, from Medellín to the Caribbean. Each one can be combined into a tailor-made trip.'),
    schema: [migas(m), { '@type': 'ItemList', itemListElement: DESTINOS.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: BASE + `destinos/${d.slug}/`, name: d.h1 })) }],
    cuerpo: [
      destinos(t('Destinos', 'Destinations'), t('Elige por dónde empezar', 'Choose where to start'), DESTINOS.map(d => d.slug)),
      cierre(t('¿No sabes cuál elegir? Te ayudamos', "Can't decide? We'll help"), 'Hola Wanna Go, quiero ideas para viajar por Colombia.', 'medellin'),
    ].join('\n\n'),
  };
});

// Servicios
const servicio = (slug, s) => pagina(`${slug}/`, () => {
  const m = [INICIO, [s.nombre, `${slug}/`]];
  return {
    ...s, migas: m, h1: s.h1,
    schema: [migas(m), { '@type': 'Service', name: s.nombre, serviceType: s.nombre, description: s.desc, url: BASE + slug + '/', provider: { '@id': ORG['@id'] }, areaServed: { '@type': 'Country', name: 'Colombia' } }],
    cuerpo: s.cuerpo(),
  };
});

servicio('viajes-a-la-medida', {
  nombre: 'Viajes a la medida', foto: 'salento', alt: 'Palmas de cera en el valle de Cocora',
  titulo: t('Viajes a la medida por Colombia · Wanna Go Medellín', 'Tailor-made trips across Colombia · Wanna Go Medellín'),
  desc: 'Itinerarios privados por Colombia diseñados alrededor de lo que te mueve: café, naturaleza, cocina, arte o descanso. Agencia en Medellín, RNT 65568.',
  label: 'A tu ritmo', h1: t('Viajes a la medida por Colombia', 'Tailor-made trips across Colombia'),
  lead: 'Itinerarios privados diseñados alrededor de lo que te mueve: café, naturaleza, cocina, arte o descanso.',
  boton: 'Hola Wanna Go, quiero un viaje a la medida.',
  cuerpo: () => [
    intro(t('01 · Cómo lo pensamos', '01 · How we think about it'), t('Un viaje que se parece a ti', 'A trip that feels like you'), [
      t('No trabajamos con paquetes cerrados. Empezamos por una conversación: qué te emociona, con quién viajas, cuánto tiempo tienes y a qué ritmo quieres moverte.', "We don't sell fixed packages. We start with a conversation: what excites you, who you are traveling with, how much time you have and the pace you want."),
      t('Con eso diseñamos una ruta por Colombia con alojamientos, guías locales y experiencias que elegimos una por una. Durante el viaje, estamos pendientes de ti.', 'From there we design a route through Colombia with lodging, local guides and experiences we choose one by one. During the trip, we are there for you.'),
    ], 'cafe', 'Granos de café maduros en la rama'),
    tarjetas(t('02 · Paso a paso', '02 · Step by step'), t('Así diseñamos tu viaje', 'How we design your trip'), [
      [t('Nos cuentas', 'Tell us'), t('Qué quieres vivir, fechas, presupuesto y quién viaja.', "What you want to experience, dates, budget and who's traveling.")],
      [t('Te proponemos', 'We propose'), t('Un itinerario día a día con alojamientos y experiencias.', 'A day-by-day itinerary with lodging and experiences.')],
      [t('Lo ajustamos', 'We fine-tune'), t('Cambiamos lo necesario hasta que sea tu viaje.', "We adjust whatever is needed until it's truly your trip.")],
      [t('Viajas tranquilo', 'You travel at ease'), t('Logística resuelta y contacto directo con nosotros.', 'Logistics handled and a direct line to us.')],
    ]),
    destinos(t('03 · Inspiración', '03 · Inspiration'), t('Destinos para empezar', 'Destinations to start with'), ['guatape', 'eje-cafetero', 'cartagena']),
    resenas(),
    cierre(t('¿Empezamos a diseñarlo?', 'Shall we start designing it?'), 'Hola Wanna Go, quiero un viaje a la medida.', 'guatape'),
  ].join('\n\n'),
});

servicio('viajes-grupales', {
  nombre: 'Viajes grupales', foto: 'grupo-atardecer', alt: 'Grupo de viajeros contemplando el atardecer',
  titulo: t('Viajes grupales con anfitriona · Wanna Go Colombia', 'Group trips with a host · Wanna Go Colombia'),
  desc: 'Salidas con fecha fija y grupos pequeños, con anfitriona de Wanna Go de principio a fin. Marruecos entre mujeres, Cartagena y el Eje Cafetero.',
  label: 'Grupos pequeños', h1: t('Viajes grupales con anfitriona', 'Group trips with a host'),
  lead: 'Salidas con fecha fija, grupos pequeños y una anfitriona de Wanna Go acompañándote todo el camino.',
  boton: 'Hola Wanna Go, quiero información de los viajes grupales.',
  cuerpo: () => [
    intro(t('01 · Cómo viajamos', '01 · How we travel'), t('Viajar en grupo, sin sentirte en un tour', "Group travel that doesn't feel like a tour"), [
      t('Nuestras salidas grupales son para pocas personas, con un itinerario pensado al detalle y tiempo libre para explorar a tu manera.', 'Our group departures are for just a few people, with a carefully planned itinerary and free time to explore your own way.'),
      t('Una anfitriona de Wanna Go viaja contigo de principio a fin. Se encarga de la logística para que tú solo te ocupes de vivir el viaje.', 'A Wanna Go host travels with you from start to finish and takes care of the logistics, so all you have to do is enjoy the trip.'),
    ], 'mujer-dunas', 'Viajera en las dunas del Sahara al atardecer'),
    `<section class="sec bg-petroleo">
  <div class="wrap">
    ${encabezado(t('02 · Próximas salidas', '02 · Upcoming departures'), t('Elige tu próximo viaje', 'Choose your next trip'), true)}
    <div class="trips">
      ${TEMP ? `<a class="trip big rv" href="${href(TEMP.enlace)}">
        ${img(TEMP.foto, L(TEMP.alt), '(max-width:900px) 100vw, 60vw')}
        <div class="in">
          <span class="badge">${L(TEMP.aviso)}</span>
          <span class="meta">${L(TEMP.etiqueta)}</span>
          <h3>${tituloTemp()}</h3>
          <span class="go">${L(TEMP.boton)} <span>→</span></span>
        </div>
      </a>` : ''}
      <a class="trip rv" href="${href('destinos/cartagena/')}">
        ${img('cartagena', 'Calle colonial de Cartagena con faroles', '(max-width:900px) 100vw, 40vw')}
        <div class="in">
          <span class="badge soon">Próximamente</span>
          <span class="meta"><span class="tbd">Fecha por definir</span></span>
          <h3>Cartagena y el Caribe</h3>
        </div>
      </a>
      <a class="trip rv" href="${href('destinos/eje-cafetero/')}">
        ${img('cafe', 'Granos de café maduros en la rama', '(max-width:900px) 100vw, 40vw')}
        <div class="in">
          <span class="badge soon">Próximamente</span>
          <span class="meta"><span class="tbd">Fecha por definir</span></span>
          <h3>Paisaje Cultural Cafetero</h3>
        </div>
      </a>
    </div>
  </div>
</section>`,
    tarjetas(t('03 · En cada salida', '03 · On every departure'), t('Lo que siempre tienes', 'What you always get'), [
      [t('Grupos pequeños', 'Small groups'), t('Pocas personas, para viajar con calma y conocerse.', 'Few people, so you travel calmly and get to know each other.')],
      [t('Anfitriona Wanna Go', 'A Wanna Go host'), t('Te acompaña desde la salida hasta el regreso.', 'With you from departure to return.')],
      [t('Experiencias locales', 'Local experiences'), t('Cocina, cultura y gente de cada destino.', 'Food, culture and people at every destination.')],
      [t('Todo organizado', 'Everything organized'), t('Alojamiento, traslados y reservas resueltos.', 'Lodging, transfers and bookings taken care of.')],
    ]),
    resenas(),
    cierre(t('¿Quieres saber de las próximas salidas?', 'Want to hear about upcoming departures?'), 'Hola Wanna Go, quiero información de los viajes grupales.', 'camellos'),
  ].join('\n\n'),
});

servicio('eventos-corporativos', {
  nombre: 'Eventos corporativos', foto: 'medellin-montanas', alt: 'Edificios de Medellín frente a las montañas',
  titulo: t('Eventos corporativos en Medellín y Antioquia · Wanna Go', 'Corporate events in Medellín and Antioquia · Wanna Go'),
  desc: 'Incentivos, convenciones y experiencias de equipo en Medellín y Antioquia, con logística completa y experiencias locales con propósito.',
  label: 'Empresas', h1: t('Eventos corporativos en Medellín y Antioquia', 'Corporate events in Medellín and Antioquia'),
  lead: 'Incentivos, convenciones y experiencias de equipo con logística completa en Medellín y Antioquia.',
  boton: 'Hola Wanna Go, quiero cotizar un evento corporativo.',
  cuerpo: () => [
    intro(t('01 · Para empresas', '01 · For companies'), t('Experiencias que unen equipos', 'Experiences that bring teams together'), [
      t('Diseñamos viajes de incentivo, convenciones y salidas de equipo que muestran Medellín y Antioquia desde adentro, con la misma calidez con la que recibimos a nuestros viajeros.', 'We design incentive trips, conventions and team outings that show Medellín and Antioquia from the inside, with the same warmth we offer every traveler.'),
      t('Nos encargamos de la logística completa: transporte, alojamiento, espacios, alimentación y experiencias locales, con un solo contacto para todo.', 'We handle the full logistics: transport, lodging, venues, catering and local experiences, with a single point of contact.'),
    ], 'medellin', 'Medellín iluminada al atardecer, rodeada de montañas'),
    tarjetas(t('02 · Qué organizamos', '02 · What we organize'), t('Formatos para tu empresa', 'Formats for your company'), [
      [t('Viajes de incentivo', 'Incentive trips'), t('Premia a tu equipo con experiencias que no olvidará.', "Reward your team with experiences they won't forget.")],
      [t('Convenciones y reuniones', 'Conventions and meetings'), t('Espacios, transporte y agenda coordinados.', 'Venues, transport and agenda, all coordinated.')],
      [t('Integración de equipos', 'Team building'), t('Actividades con propósito en la ciudad y la naturaleza.', 'Purposeful activities in the city and in nature.')],
      [t('Experiencias para visitantes', 'Experiences for visitors'), t('Recibe a clientes y socios con lo mejor de Medellín.', 'Welcome clients and partners with the best of Medellín.')],
    ]),
    destinos(t('03 · Experiencias', '03 · Experiences'), t('Ideas en Medellín y Antioquia', 'Ideas in Medellín and Antioquia'), ['comuna-13', 'guatape', 'plazas-de-mercado']),
    resenas(),
    cierre(t('Cuéntanos de tu evento', 'Tell us about your event'), 'Hola Wanna Go, quiero cotizar un evento corporativo.', 'medellin-montanas'),
  ].join('\n\n'),
});

// Nosotros
pagina('nosotros/', () => {
  const m = [INICIO, ['Nosotros', 'nosotros/']];
  const casa = readFileSync('index.html', 'utf8');
  const tomar = ini => casa.slice(casa.indexOf(ini), casa.indexOf('</section>', casa.indexOf(ini)) + 10);
  return {
    titulo: t('Quiénes somos · Wanna Go, agencia de viajes en Medellín', 'About us · Wanna Go, travel agency in Medellín'),
    desc: 'Wanna Go es una agencia de turismo receptivo en Medellín fundada en 2019 por Luchy Vásquez. Viajes con propósito, auténticos y con hospitalidad cálida.',
    foto: 'guatape-calle', alt: 'Calle con fachadas de colores y zócalos en Guatapé', migas: m,
    label: t('Quiénes somos', 'About us'), h1: t('Viajes con propósito desde Medellín', 'Purposeful travel from Medellín'),
    lead: t('Somos una agencia de turismo receptivo fundada en 2019. Te mostramos Colombia desde adentro: con su gente, su cocina y sus paisajes.', 'We are an inbound travel agency founded in 2019. We show you Colombia from the inside: its people, its food and its landscapes.'),
    schema: [migas(m), { '@type': 'AboutPage', url: BASE + 'nosotros/', mainEntity: { '@id': ORG['@id'] } }],
    cuerpo: [
      intro(t('01 · Nuestra historia', '01 · Our story'), 'Viajes con propósito', [
        'Wanna Go es una agencia de turismo receptivo con sede en Medellín, fundada en 2019 por María Lucía Vásquez Cock, Luchy.',
        'Huimos del turismo masivo y de lo predecible. Te mostramos cada destino desde adentro, con su gente, su cocina y sus paisajes, para que vuelvas distinto de como te fuiste.',
      ], 'comuna13', 'Casas de colores y murales en las laderas de la Comuna 13', `
      <div class="stats">
        <div class="stat"><b>2019</b><span>Año de fundación</span></div>
        <div class="stat"><b>RNT 65568</b><span>Registro Nacional de Turismo</span></div>
        <div class="stat"><b>Medellín</b><span>Colombia</span></div>
      </div>`),
      // fundadora y pilares: el mismo bloque del inicio
      tomar('<section class="sec bg-petroleo">\n  <div class="wrap founder">').replace('06 · Fundadora', t('02 · Fundadora', '02 · Founder')),
      tomar('<section class="sec">\n  <div class="wrap">\n    <div class="head rv">\n      <span class="eyebrow">04 · Nuestro sello').replace('04 · Nuestro sello', '03 · Nuestro sello'),
      resenas(),
      cierre('Colombia se vive mejor en buena compañía', 'Hola Wanna Go, quiero conocerlos.', 'grupo-atardecer'),
    ].join('\n\n'),
  };
});

// Contacto
pagina('contacto/', () => {
  const m = [INICIO, ['Contacto', 'contacto/']];
  const casa = readFileSync('index.html', 'utf8');
  const ini = casa.indexOf('<section class="sec bg-arena" id="contacto">');
  const seccion = casa.slice(ini, casa.indexOf('</section>', ini) + 10)
    .replace('<span class="eyebrow">07 · Contacto</span>\n      <h2 class="h2">Diseñemos tu próximo viaje</h2>', `<span class="eyebrow">${t('Canales', 'Channels')}</span>\n      <h2 class="h2">${t('Hablemos de tu viaje', "Let's talk about your trip")}</h2>`)
    .replace('</b></span></a>\n      </div>', `</b></span></a>
        <a class="channel" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent('Cra. 30 #5F-185, El Poblado, Medellín')}" target="_blank" rel="noopener"><span class="ico rojo sm"><svg viewBox="0 0 24 24"><path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg></span><span><small>${t('Oficina', 'Office')}</small><b>Cra. 30 #5F-185 Int 701, El Poblado, Medellín</b></span></a>
      </div>`);
  return {
    titulo: t('Contacto · Wanna Go Colombia, Medellín', 'Contact · Wanna Go Colombia, Medellín'),
    desc: 'Escríbenos por WhatsApp al +57 312 289 9185 o a wannagoco@gmail.com. Oficina en El Poblado, Medellín. Diseñamos tu viaje por Colombia.',
    foto: 'medellin', alt: 'Medellín iluminada al atardecer, rodeada de montañas', migas: m,
    label: 'Contacto', h1: 'Diseñemos tu próximo viaje',
    lead: 'Cuéntanos qué te mueve y te proponemos un itinerario a tu medida. Respondemos por WhatsApp.',
    schema: [migas(m), { '@type': 'ContactPage', url: BASE + 'contacto/', mainEntity: { '@id': ORG['@id'] } }],
    cuerpo: seccion,
  };
});

// ---------- Inicio y Marruecos: bloques entre marcadores <!-- x --> … <!-- /x --> ----------

function parche(archivo, ruta, bloques) {
  let h = readFileSync(archivo, 'utf8');
  for (const [k, v] of Object.entries(bloques)) {
    const a = `<!-- ${k} -->`, b = `<!-- /${k} -->`;
    if (!h.includes(a) || !h.includes(b)) throw new Error(`Falta el marcador ${a} en ${archivo}`);
    h = h.slice(0, h.indexOf(a) + a.length) + '\n' + v + '\n' + h.slice(h.indexOf(b));
  }
  writeFileSync(archivo, h);
}

pre = '';
const navInicio = nav(), pieInicio = pie(), viajesInicio = seccionViajes(), promoInicio = promo();
parche('index.html', '', {
  nav: navInicio, pie: pieInicio, viajes: viajesInicio, promo: promoInicio,
  seo: seo({
    ruta: '', foto: 'medellin',
    titulo: t('Wanna Go Colombia · Agencia de viajes con propósito en Medellín', 'Wanna Go Colombia · Purposeful travel agency in Medellín'),
    desc: 'Wanna Go: agencia de turismo receptivo en Medellín. Viajes a la medida, viajes grupales y eventos corporativos con propósito.',
    schema: [{ '@type': 'WebSite', '@id': BASE + '#sitio', name: 'Wanna Go Colombia', url: BASE, inLanguage: 'es', publisher: { '@id': ORG['@id'] } }],
  }, 'Wanna Go Colombia · Agencia de viajes con propósito en Medellín' + navInicio + pieInicio + viajesInicio + promoInicio),
});

pre = '../';
const m = [INICIO, ['Viajes grupales', 'viajes-grupales/'], ['Marruecos entre mujeres', 'marruecos/']];
parche('marruecos/index.html', 'marruecos/', {
  seo: seo({
    ruta: 'marruecos/', foto: 'mujer-dunas',
    titulo: 'Marruecos entre mujeres · Wanna Go',
    desc: 'Viaje grupal solo para mujeres a Marruecos: 10 días, 7 destinos y máximo 16 viajeras, con anfitriona de Wanna Go. Medinas, palacios y una noche en el Sahara.',
    schema: [migas(m), { '@type': 'TouristTrip', name: 'Marruecos entre mujeres', description: 'Viaje grupal solo para mujeres a Marruecos: 10 días, 7 destinos y máximo 16 viajeras.', url: BASE + 'marruecos/', image: BASE + 'fotos/og/mujer-dunas.jpg', touristType: 'Mujeres', provider: { '@id': ORG['@id'] } }],
  }, ''),
});

// ---------- sitemap.xml y robots.txt ----------

const hoy = new Date().toISOString().slice(0, 10);
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(u => `  <url><loc>${BASE}${u}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);

console.log(`${URLS.length} URLs · ${INDEXAR ? 'indexables' : 'con noindex (borrador)'}`);

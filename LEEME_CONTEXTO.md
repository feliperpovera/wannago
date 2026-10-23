# Wanna Go · Sitio web + landing "Marruecos entre mujeres"

Documento de traspaso para continuar el proyecto en otra conversación con Claude.
**Pégale este archivo a Claude al empezar** y pídele que lea la carpeta `sitio/`.

---

## 1. Quién es quién

- **Agencia que hace el sitio:** RevUp Agency Group (Martín Ruiz). Cuenta de GitHub: `RevUpAG`.
- **Cliente:** Wanna Go Colombia. Es una agencia de turismo receptivo en Medellín, fundada en 2019 por **María Lucía Vásquez Cock, "Luchy"**. Tiene el RNT 65568 y también la marca Medellín con Estilo (medellinconestilo.com).
- **Proyecto prioritario:** viaje grupal **solo para mujeres a Marruecos**. Se inspiró en sultanaviajes.com/viajes/marruecos-legendario/.

## 2. Dónde está

- **En vivo (borrador):** https://revupag.github.io/wannago-marruecos/
  - Landing: https://revupag.github.io/wannago-marruecos/marruecos/
- **Repositorio actual:** https://github.com/feliperpovera/wannago (en vivo: https://feliperpovera.github.io/wannago/). El original era https://github.com/RevUpAG/wannago-marruecos. Es público, con GitHub Pages en la rama `main` y la raíz `/`.
- **Carpeta local original:** `/Users/martinruiz/Paginas Web Claude/wannago-site/`
- **Para publicar cambios:**
  ```
  cd wannago-site && git add -A && git commit -m "..." && git push
  ```
  GitHub Pages tarda entre 1 y 3 minutos en reflejar el cambio.
- **Caché:** cada CSS/JS se carga con `?v=NUMERO`. Cuando cambies un CSS o JS, **sube el número** en `index.html` y `marruecos/index.html` para que los navegadores no muestren la versión vieja.
- **Previsualizar localmente:**
  ```
  python3 -m http.server 8765 --directory sitio
  ```
  Luego abre http://localhost:8765. Si abres los archivos directamente, sin servidor, las fotos no cargan.

## 3. Estructura de archivos (`sitio/`)

| Archivo | Qué hace |
|---|---|
| `index.html` | Página principal de Wanna Go. Tiene su CSS propio en `<style>` y usa los archivos compartidos. |
| `marruecos/index.html` | Landing del viaje. Es autónoma: tiene su propio CSS y JS dentro, y además carga `../carrusel.*`, `../wa.*` e `../i18n.js`. |
| `marca.css` | Base de marca: colores, tipografía, logo, botones, nav, formulario, pie y aparición suave. Solo la usa el inicio. |
| `marca.js` | Nav sólida al bajar, aparición suave y parallax (solo inicio). |
| `carrusel.css/js` | Carruseles de fotos con flechas, teclado, arrastre y avance automático. Se pausa al interactuar. Lo usan las dos páginas. |
| `wa.css/js` | Botón flotante de WhatsApp: aros, sacudida, aviso "1" y saludo. No se anima mientras hay un pop-up abierto. |
| `i18n.js` | Traducción ES ⇄ EN con el botón EN/ES de la nav. El HTML está en español y el diccionario `WG_EN` lo pasa a inglés por coincidencia exacta de texto. **Si cambias o agregas un texto en español, agrega su traducción a `WG_EN`**, o se queda en español en la versión en inglés. Guarda el idioma en localStorage y lanza el evento `wg-lang`. |
| `resenas.js` | 9 reseñas reales de Google, en dos filas que se mueven. Cada una tiene su texto original y su traducción. Escucha `wg-lang`. |
| `fotos/` | Fotos de Unsplash, que tienen licencia comercial gratuita. Son de referencia hasta que el cliente mande las suyas. |

## 3b. Páginas individuales, SEO y velocidad (octubre 2026)

- **Páginas generadas:** `nosotros/`, `viajes-a-la-medida/`, `viajes-grupales/`, `eventos-corporativos/`, `contacto/`, `destinos/` y 7 destinos (`destinos/guatape/`, `comuna-13/`, `cartagena/`, `valle-de-cocora/`, `tayrona/`, `eje-cafetero/`, `plazas-de-mercado/`). **No se editan a mano:** el contenido (español + inglés) está en `_herramientas/generar.mjs`. Después de cambiarlo:
  ```
  node _herramientas/generar.mjs
  ```
  El generador también reescribe el menú y el pie del inicio, el bloque SEO del inicio y de Marruecos (entre los marcadores `<!-- seo -->`, `<!-- nav -->`, `<!-- pie -->`), `sitemap.xml` y `robots.txt`.
- **Textos de los destinos y servicios:** borrador escrito por nosotros. Falta la revisión de Luchy.
- **Al salir en vivo o conectar el dominio:** en `generar.mjs`, cambia `BASE` (dominio) y pon `INDEXAR = true`, luego corre el generador.
- **Fotos:** los originales están en `_originales/` (Jekyll no publica carpetas que empiezan con `_`). Para agregar o cambiar una foto, ponla ahí y corre `python3 _herramientas/fotos.py`: crea `fotos/NOMBRE.webp` (1600 px), `NOMBRE-800.webp` y `fotos/og/NOMBRE.jpg` (1200×630 para compartir).
- **Fuente:** Montserrat va alojada en `fuentes/montserrat.woff2` (ya no se carga desde Google Fonts).
- **Caché:** la versión `?v=` está en `V` de `generar.mjs` y, a mano, en `index.html` y `marruecos/index.html`.

## 4. Manual de marca (seguirlo al pie de la letra)

El PDF completo está en `manual/Manual_de_marca_Wanna_Go.pdf`.

- **Colores principales:**
  - Verde petróleo `#13484F` (50 %)
  - Blanco `#FFFFFF` (20 %)
  - Arena `#F4EEE6` (15 %)
  - Rojo destino `#ED3237` (10 %)
  - Verde agua `#4E8A8A` (5 %)
- **Color de apoyo:** Carbón `#1F2A2C`.
- **Tipografía: solo Montserrat.**
  - SemiBold: titulares
  - Medium: subtítulos
  - Regular: textos
  - Light: textos largos y pies de foto
  - Etiquetas: mayúsculas con espaciado amplio
- **Logo:** "Wanna G" más el isotipo, que es la "O" convertida en un pin (círculo rojo, pin blanco y punto rojo), con el descriptor "COLOMBIA" debajo. Mínimo 140 px de ancho en digital. No se deforma, no se gira y no se le cambian los colores.
  - En el sitio está **redibujado en HTML/CSS** porque no tenemos el archivo original. Hay que pedir el SVG.
- **Sobre fotos:** se pone una veladura en verde petróleo o carbón.
- **Frases de marca:**
  - "Viajar con propósito, volver con historias."
  - "Colombia se vive mejor en buena compañía."
- **Pilares:** impacto local y sostenibilidad, transformación personal, autenticidad y exclusividad, hospitalidad cálida.
- **Única excepción al manual:** el botón de WhatsApp usa el verde oficial `#25D366`, para que se reconozca.

## 5. Datos reales del cliente

- **WhatsApp de la web:** **+57 312 289 9185** (`wa.me/573122899185`). Así lo pidió Martín; está en todos los botones.
  - El manual trae otro número, el +57 321 784 3880, que quedó viejo.
- **Correo:** wannagoco@gmail.com
- **Instagram:** @wannagocol
- **Dirección:** Cra. 30 #5F-185 Int 701, El Poblado, Medellín
- **Google:** 5.0 ★, 13 reseñas. Link: https://share.google/e8BOJXLnY23zuiExs

## 6. Contenido actual

**Inicio**
1. Nav con logo, menú, botón EN/ES y "Escríbenos".
2. Portada con Medellín de noche.
3. 01 Quiénes somos.
4. 02 Servicios: a la medida, grupales y corporativos.
5. 03 Pilares.
6. 04 Viajes grupales: Marruecos destacado; Cartagena y Eje Cafetero como "Próximamente".
7. 05 Carrusel de destinos de Colombia.
8. 06 Reseñas en movimiento.
9. 07 Fundadora.
10. Frase de marca con parallax.
11. 08 Contacto, con un formulario que abre WhatsApp con el mensaje armado.
12. Pie de página.
13. **Pop-up de Marruecos:** sale a los 1,4 s, una vez por sesión del navegador (sessionStorage `wg-promo`).

**Landing de Marruecos**
1. Franja de BORRADOR.
2. Portada: mujer en las dunas, "Marruecos es tuyo", 10 días, 7 destinos, 16 viajeras como máximo.
3. Por qué viajar con nosotras.
4. Carrusel de fotos.
5. Itinerario de 10 días en 5 capítulos, con una foto fija que cambia según el capítulo.
6. Noche en el Sahara.
7. Qué incluye y qué no incluye.
8. Inversión, con barra de cupos de 9 de 16 (es **dato de ejemplo**).
9. Anfitriona.
10. Preguntas frecuentes.
11. Lista de espera.
12. Pie de página.

## 7. Pendientes

**Del cliente**
- Precio, anticipo, suplemento de habitación individual, fecha de salida y número de cuotas de Marruecos. Hoy salen marcados como `por definir` con la clase `.tbd`.
- Fechas de Cartagena y Eje Cafetero.
- Foto de Luchy y su aprobación de las frases que se le atribuyen. La frase del inicio es inventada como borrador; la de la landing salió del primer borrador.
- Logo original en SVG o PNG grande, y fotos propias.
- Medios de pago y requisitos de visa vigentes para colombianas.
- Revisión de los textos en inglés.
- **Dominio:** ella tiene dominio propio. Para conectarlo hay que crear en su DNS:
  - registros A `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153 y 185.199.111.153;
  - un CNAME `www` → `revupag.github.io`.
  - Después, poner el dominio en Settings → Pages del repositorio y activar HTTPS.
  - Antes de tocar nada, verificar que no tenga correo (MX) ni otra web en ese dominio.

**Nuestros, antes de salir en vivo**
- Quitar la franja BORRADOR y todos los `.tbd`.
- Quitar `<meta name="robots" content="noindex">` de las dos páginas.
- Agregar metadatos SEO y Open Graph (título, descripción e imagen para compartir).
- **El formulario de lista de espera de la landing no envía datos.** Hay que conectarlo a WhatsApp, como el del inicio.
- Redactar una política de tratamiento de datos (Ley 1581 de Colombia), porque los formularios piden nombre y teléfono.
- Opcional: renombrar el repositorio o la URL, y agregar analítica.

## 8. Preferencias de Martín (cómo trabaja)

- Quiere todo en **español**, con una explicación final clara de qué se hizo.
- Quiere un diseño **aspiracional y "wow"** que **no parezca hecho con IA**, con fotos reales y movimiento, siguiendo buenas prácticas de UI/UX.
- Pide **seguir el manual de marca al pie de la letra**.
- Quiere probar en el navegador antes de dar algo por terminado, y publicar en GitHub cuando lo pide.
- Los carruseles deben tener flechas, además del movimiento automático.

## 9. Otros archivos de referencia (incluidos en `referencias/`)

- `Programa_Medellin_Comuna13_Prado.pdf`: ejemplo de propuesta de Martín.
- `wannago-marruecos-artifact-v1.html`: primera versión de la landing, publicada como artifact de Claude en https://claude.ai/artifact/AhiewC1pLCAKDTswNkS8sb. Esa versión ya está desactualizada.

# Wanna Go · Contexto del cliente y del proyecto

Información del cliente, la marca y los pendientes. **Lo técnico (estructura, panel, Supabase, cómo publicar) está en el [README](../README.md).**
Para continuar el proyecto con Claude: pásale este archivo y el README.

---

## 1. Quién es quién

- **Agencia que hace el sitio:** RevUp Agency Group (Martín Ruiz). Cuenta de GitHub: `RevUpAG`.
- **Cliente:** Wanna Go Colombia. Es una agencia de turismo receptivo en Medellín, fundada en 2019 por **María Lucía Vásquez Cock, "Luchy"**. Tiene el RNT 65568 y también la marca Medellín con Estilo (medellinconestilo.com).
- **Proyecto prioritario:** viaje grupal **solo para mujeres a Marruecos**. Se inspiró en sultanaviajes.com/viajes/marruecos-legendario/.

## 2. Dónde está

- **En vivo (borrador):** https://wannago.com.co/ · Landing: https://wannago.com.co/marruecos/ · Panel: https://wannago.com.co/admin/
- **Hosting:** Hostinger (plan Premium de la cuenta de Luchy, que también aloja medellinconestilo.com). Copia en GitHub Pages: https://feliperpovera.github.io/wannago/
- **Dominio:** wannago.com.co, en traslado de GoDaddy a Hostinger (pagado el 28-10-2026). Sus DNS ya apuntan a Hostinger. medellinconestilo.com sigue registrado en GoDaddy.
- **Backend:** Supabase, proyecto «WannaGo» (cuenta wannagoco@gmail.com).
- **Repositorio:** https://github.com/feliperpovera/wannago (público). El original de la agencia era https://github.com/RevUpAG/wannago-marruecos.
- **Manual de marca y referencias:** fuera del repositorio, en la carpeta `manual/` y `referencias/` del traspaso.

## 3. Manual de marca (seguirlo al pie de la letra)

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

## 4. Datos reales del cliente

- **WhatsApp de la web:** **+57 312 289 9185** (`wa.me/573122899185`). Así lo pidió Martín; está en todos los botones.
  - El manual trae otro número, el +57 321 784 3880, que quedó viejo.
- **Correo:** wannagoco@gmail.com
- **Instagram:** @wannagocol
- **Dirección:** Cra. 30 #5F-185 Int 701, El Poblado, Medellín
- **Google:** 5.0 ★, 13 reseñas. Link: https://share.google/e8BOJXLnY23zuiExs

## 5. Contenido actual

**Inicio:** portada · 01 Nuestros viajes (viaje de temporada y cuadros de Colombia) · 02 Quiénes somos · 03 Lo que hacemos · 04 Pilares · 05 Reseñas · 06 Fundadora · frase de marca · 07 Contacto (formulario que abre WhatsApp) · pop-up del viaje de temporada (a los 1,4 s, una vez por visita).
**Páginas internas:** Nosotros, Viajes a la medida, Viajes grupales, Eventos corporativos, Destinos (índice y 7 destinos), Contacto.
**Landing de Marruecos:** franja de BORRADOR, portada, por qué viajar con nosotras, carrusel, itinerario de 10 días, noche en el Sahara, qué incluye, inversión (cupos 9 de 16, **dato de ejemplo**), anfitriona, preguntas y lista de espera.

## 6. Pendientes

**Del cliente**
- Precio, anticipo, suplemento de habitación individual, fecha de salida y número de cuotas de Marruecos. Hoy salen marcados como `por definir` con la clase `.tbd`.
- Fechas de Cartagena y Eje Cafetero.
- Foto de Luchy y su aprobación de las frases que se le atribuyen. La frase del inicio es inventada como borrador; la de la landing salió del primer borrador.
- Logo original en SVG o PNG grande, y fotos propias.
- Medios de pago y requisitos de visa vigentes para colombianas.
- Revisión de los textos en inglés.
- **Dominio:** ella tiene dominio propio. Para conectarlo hay que crear en su DNS:
  - registros A `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153 y 185.199.111.153;
  - un CNAME `www` → `feliperpovera.github.io`.
  - Después, poner el dominio en Settings → Pages del repositorio y activar HTTPS.
  - Antes de tocar nada, verificar que no tenga correo (MX) ni otra web en ese dominio.

**Nuestros, antes de salir en vivo**
- Quitar la franja BORRADOR y todos los `.tbd`.
- Quitar el `noindex`: poner `INDEXAR = true` en `herramientas/generar.mjs` (también quitarlo a mano de la landing de Marruecos).
- **El formulario de lista de espera de la landing no envía datos.** Hay que conectarlo a WhatsApp, como el del inicio.
- Redactar una política de tratamiento de datos (Ley 1581 de Colombia), porque los formularios piden nombre y teléfono.
- Conectar Supabase (pasos en el README).
- Opcional: renombrar el repositorio o la URL, y agregar analítica.

## 7. Preferencias de Martín (cómo trabaja)

- Quiere todo en **español**, con una explicación final clara de qué se hizo.
- Quiere un diseño **aspiracional y "wow"** que **no parezca hecho con IA**, con fotos reales y movimiento, siguiendo buenas prácticas de UI/UX.
- Pide **seguir el manual de marca al pie de la letra**.
- Quiere probar en el navegador antes de dar algo por terminado, y publicar en GitHub cuando lo pide.
- Los carruseles deben tener flechas, además del movimiento automático.

## 8. Otros archivos de referencia (incluidos en `referencias/`)

- `Programa_Medellin_Comuna13_Prado.pdf`: ejemplo de propuesta de Martín.
- `wannago-marruecos-artifact-v1.html`: primera versión de la landing, publicada como artifact de Claude en https://claude.ai/artifact/AhiewC1pLCAKDTswNkS8sb. Esa versión ya está desactualizada.

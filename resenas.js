// Reseñas reales de Google (perfil Wanna Go, 5.0 · 13 opiniones). Texto original + traducción.
// orig: idioma en que la escribió la persona; el otro idioma lleva la marca "Traducida".
const WG_REVIEWS = [
  { name: "Sebastián F.", when: { es: "Hace 8 meses", en: "8 months ago" }, orig: "es",
    es: "Tuve una experiencia increíble en la Comuna 13 gracias a este tour guiado. El guía nació y creció allí, y eso hizo toda la diferencia… Fue una experiencia inolvidable que recomiendo al 100%.",
    en: "I had an incredible experience in Comuna 13 thanks to this guided tour. The guide was born and raised there, and that made all the difference… It was an unforgettable experience that I wholeheartedly recommend." },
  { name: "Ginny B.", when: { es: "Hace 9 meses", en: "9 months ago" }, orig: "en",
    es: "La pasamos increíble en Colombia. Luchy nos ayudó con cada detalle: que llegáramos a nuestros destinos, que estuviéramos seguros y bien atendidos. ¡Recomiendo muchísimo a Wanna Go para viajar!",
    en: "We had the best time in Colombia. Luchy helped with every detail- making sure we got to our destinations, we were safe, and we were taken care of. Would highly recommend Wanna Go for travel!" },
  { name: "Sandra R.", when: { es: "Hace 8 meses", en: "8 months ago" }, orig: "es",
    es: "Nos fue muy bien. Fuimos un grupo de 7 amigas, Luchy nos recomendó una experiencia de crucero y todo estuvo perfecto. Las habitaciones, lo incluido, sus tips para ingresar, salir y aprovechar todo el crucero. ¡Muchas gracias!",
    en: "We had a wonderful time. We were a group of seven friends, and Luchy recommended a cruise experience for us. Everything was perfect: the cabins, the included amenities and her tips for boarding, disembarking and making the most of the cruise. Thank you so much!" },
  { name: "Adriana G.", when: { es: "Hace una semana", en: "A week ago" }, orig: "es",
    es: "Un viaje muy bien organizado. Los lugares escogidos hicieron que esta experiencia fuera mágica. Super recomendado el viaje a San Rafael.",
    en: "A very well-organized trip. The chosen locations made this experience magical. I highly recommend the trip to San Rafael." },
  { name: "Nina S.", when: { es: "Hace 9 meses", en: "9 months ago" }, orig: "en",
    es: "Pasamos un día maravilloso recorriendo la Comuna 13 con Jonatan. Es súper amable y habla muy buen inglés. Es de la zona, así que compartió su experiencia personal junto con la historia del barrio. ¡Fue una experiencia fantástica de principio a fin!",
    en: "We had a wonderful day exploring Comuna 13 with Jonatan. He is super friendly and his english is great. He is a local from the area so he was able to sprinkle in his personal experience along with sharing the history of the neighborhood. It was a fantastic experience from beginning to end!" },
  { name: "Omaira T.", when: { es: "Hace 2 meses", en: "2 months ago" }, orig: "es",
    es: "Fue un día inolvidable… poder ver y darle gracias a Dios por tanta naturaleza y gente tan linda. Conocimos, nos reímos, bailamos y aprendimos al lado de un buen guía. Mil gracias.",
    en: "It was an unforgettable day… being able to see and thank God for so much nature and such lovely people. We met, laughed, danced and learned alongside a great guide. Thank you so much." },
  { name: "Deborah M.", when: { es: "Hace 2 meses", en: "2 months ago" }, orig: "es",
    es: "Demasiado organizados, queridos, proactivos, amables y una experiencia demasiado bonita, repetible 🖤",
    en: "So organized, lovely, proactive and kind, and a really beautiful experience, one to repeat 🖤" },
  { name: "Paty", when: { es: "Hace 2 meses", en: "2 months ago" }, orig: "es",
    es: "Pasamos delicioso, la atención súper, la van cómoda y buen chofer. Juan Pablo, el guía, muy especial, paciente y buen fotógrafo. ¡Excelente experiencia!",
    en: "We had a wonderful time, the service was excellent, the van was comfortable and the driver was great. Juan Pablo, our guide, was very special, patient and a good photographer! Excellent experience." },
  { name: "Antonio M.", when: { es: "Hace 2 meses", en: "2 months ago" }, orig: "es",
    es: "Maravillosa experiencia, muy interesante todo el recorrido y muy bien organizado. Habrá que repetirlo.",
    en: "A wonderful experience, the whole tour was very interesting and very well organized. We'll have to do it again." },
];

(() => {
  const rows = document.querySelectorAll('.rv-row');
  if (!rows.length) return;
  const colors = ['var(--petroleo)', 'var(--rojo)', 'var(--agua)'];
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const card = (r, i, lang, hidden) => `
    <article class="rv-card"${hidden ? ' aria-hidden="true"' : ''}>
      <div class="rv-stars" aria-label="5/5">★★★★★</div>
      <p>“${esc(r[lang])}”</p>
      <footer>
        <span class="rv-av" style="background:${colors[i % 3]}">${esc(r.name[0])}</span>
        <span><b>${esc(r.name)}</b><small>${r.when[lang]} · Google${r.orig !== lang ? (lang === 'en' ? ' · Translated' : ' · Traducida') : ''}</small></span>
      </footer>
    </article>`;
  const render = lang => {
    const half = Math.ceil(WG_REVIEWS.length / 2);
    [WG_REVIEWS.slice(0, half), WG_REVIEWS.slice(half)].forEach((list, k) => {
      const offset = k * half;
      const html = list.map((r, i) => card(r, i + offset, lang, false)).join('');
      // se duplica para un bucle continuo; la copia queda oculta a lectores de pantalla
      rows[k].innerHTML = `<div class="rv-track">${html}${list.map((r, i) => card(r, i + offset, lang, true)).join('')}</div>`;
    });
  };
  render(typeof wgLang !== 'undefined' ? wgLang : 'es');
  addEventListener('wg-lang', e => render(e.detail));
})();

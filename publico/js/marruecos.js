// Landing «Marruecos entre mujeres»: menú, revelado, itinerario, parallax, cupos y formulario
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nav turns solid after the hero
document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => a.closest('.menu').hidePopover?.()));
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('solid', scrollY > innerHeight * .7);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// Gentle reveal: only for items below the fold at load
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { threshold: .1 });
document.querySelectorAll('.rv').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); } });

// Itinerary: sticky photo follows the chapter in view
const imgs = [...document.querySelectorAll('#stage img')], place = document.getElementById('place');
const chs = [...document.querySelectorAll('.ch')];
const setCh = c => {
  chs.forEach(x => x.classList.toggle('on', x === c));
  imgs.forEach((im, k) => im.classList.toggle('on', k === +c.dataset.i));
  place.textContent = c.dataset.place;
};
setCh(chs[0]);
const cio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setCh(e.target)), { rootMargin: '-45% 0px -50% 0px' });
chs.forEach(c => cio.observe(c));

// Parallax on the Sahara night photo
const par = document.getElementById('par');
if (!reduce) addEventListener('scroll', () => {
  const r = par.parentElement.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) par.style.transform = `translateY(${(r.top / innerHeight) * -8}%)`;
}, { passive: true });

// Seat bar fills when seen
const bar = document.getElementById('seatbar');
if (bar) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { bar.style.width = bar.dataset.pct + '%'; o.disconnect(); } }).observe(bar);

// Lista de espera → abre WhatsApp con el mensaje armado y pasa a la página de gracias
document.getElementById('lead').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, msg = document.getElementById('msg');
  const name = f.name.value.trim();
  if (!name) { msg.hidden = false; msg.textContent = wgT('Escribe tu nombre para que sepamos a quién responder.'); return; }
  const text = `Hola Wanna Go, soy ${name}. Quiero entrar a la lista de espera de Marruecos entre mujeres.`;
  window.open('https://wa.me/573122899185?text=' + encodeURIComponent(text), '_blank', 'noopener');
  location.href = f.dataset.gracias;
});

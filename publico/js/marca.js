// Wanna Go · comportamiento compartido
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav sólida al pasar la portada
  const nav = document.getElementById('nav');
  if (nav) {
    const f = () => nav.classList.toggle('solid', scrollY > innerHeight * .6);
    addEventListener('scroll', f, { passive: true }); f();
  }

  // Aparición suave solo para lo que está bajo el pliegue al cargar
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); } }), { threshold: .1 });
  document.querySelectorAll('.rv').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); } });

  // Parallax suave en la foto marcada
  const par = document.getElementById('par');
  if (par && !reduce) addEventListener('scroll', () => {
    const r = par.parentElement.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) par.style.transform = `translateY(${(r.top / innerHeight) * -8}%)`;
  }, { passive: true });
})();

// Formulario → abre WhatsApp con el mensaje armado
document.getElementById('lead')?.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, msg = document.getElementById('msg');
  const name = f.name.value.trim();
  msg.hidden = false;
  if (!name) { msg.textContent = wgT('Escribe tu nombre para que sepamos a quién responder.'); return; }
  const text = `Hola Wanna Go, soy ${name}. Me interesa un ${f.type.value.toLowerCase()}. ${f.msg.value.trim()}`.trim();
  window.open('https://wa.me/573122899185?text=' + encodeURIComponent(text), '_blank', 'noopener');
  msg.textContent = wgT('Te abrimos WhatsApp con tu mensaje listo para enviar.');
});

// Menú de celular: se cierra al tocar un enlace
document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => a.closest('.menu').hidePopover?.()));

// Pop-up del inicio: una vez por visita, tras un momento
(() => {
  const d = document.getElementById('promo');
  if (!d || !d.showModal) return;
  const visto = () => { try { sessionStorage.setItem('wg-promo', '1'); } catch (e) {} };
  let seen = false;
  try { seen = sessionStorage.getItem('wg-promo') === '1'; } catch (e) {}
  const close = () => { d.close(); visto(); };
  d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  d.addEventListener('click', e => { if (e.target === d) close(); });
  d.addEventListener('cancel', visto);
  if (!seen) setTimeout(() => d.showModal(), 1400);
})();

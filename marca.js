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

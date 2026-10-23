// Carrusel: flechas, teclado, arrastre nativo y avance automático que se pausa al interactuar
document.querySelectorAll('.carousel').forEach(car => {
  const track = car.querySelector('.strip-track');
  const arrow = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
  car.insertAdjacentHTML('beforeend',
    `<button class="car-btn prev" type="button" aria-label="Foto anterior">${arrow('M15 5l-7 7 7 7')}</button>` +
    `<button class="car-btn next" type="button" aria-label="Foto siguiente">${arrow('M9 5l7 7-7 7')}</button>`);

  const step = () => (track.querySelector('figure')?.offsetWidth || 300) + 16;
  const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  const go = dir => {
    if (dir > 0 && atEnd()) track.scrollTo({ left: 0 });
    else if (dir < 0 && track.scrollLeft <= 4) track.scrollTo({ left: track.scrollWidth });
    else track.scrollBy({ left: dir * step() });
  };

  let pausedUntil = 0;
  const hold = () => { pausedUntil = Date.now() + 8000; };
  car.querySelector('.prev').addEventListener('click', () => { hold(); go(-1); });
  car.querySelector('.next').addEventListener('click', () => { hold(); go(1); });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); hold(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); hold(); go(-1); }
  });
  ['pointerdown', 'wheel', 'touchstart'].forEach(ev => track.addEventListener(ev, hold, { passive: true }));

  let hover = false;
  car.addEventListener('mouseenter', () => hover = true);
  car.addEventListener('mouseleave', () => hover = false);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    setInterval(() => { if (!hover && Date.now() > pausedUntil && !document.hidden) go(1); }, 3800);
});

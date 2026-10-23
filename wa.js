// WhatsApp flotante: se presenta con un saludo, se sacude cada tanto y vuelve a saludar
(() => {
  const wa = document.querySelector('.wa-float');
  if (!wa) return;
  const store = (k, v) => { try { return v === undefined ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch (e) { return null; } };
  if (store('wg-wa-seen')) wa.classList.add('seen');
  wa.addEventListener('click', () => { wa.classList.add('seen'); wa.classList.remove('open'); store('wg-wa-seen', '1'); });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // No anima mientras hay un pop-up abierto ni con la pestaña oculta
  const busy = () => document.hidden || !!document.querySelector('dialog[open]');
  const phone = matchMedia('(max-width: 600px)').matches;
  let greets = 0;
  const greet = ms => {
    if (busy() || (phone && greets >= 2)) return;
    greets++;
    wa.classList.add('open');
    setTimeout(() => wa.classList.remove('open'), ms);
  };
  const shake = () => {
    if (busy()) return;
    wa.classList.remove('shake'); void wa.offsetWidth; wa.classList.add('shake');
  };
  wa.addEventListener('animationend', e => e.animationName === 'wa-shake' && wa.classList.remove('shake'));

  // Primer saludo: 4 s después de cargar, o cuando se cierre el pop-up
  const first = () => { shake(); greet(5000); };
  const promo = document.getElementById('promo');
  setTimeout(() => busy() && promo ? promo.addEventListener('close', () => setTimeout(first, 1200), { once: true }) : first(), 4000);
  setInterval(shake, 8000);
  setInterval(() => greet(4000), 30000);
})();

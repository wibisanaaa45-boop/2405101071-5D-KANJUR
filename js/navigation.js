// Menu responsif
document.addEventListener('click', e => {
  const h = document.getElementById('site-header'); if (!h) return;
  if (e.target.closest('#nav-toggle')) h.classList.toggle('nav-open');
  else if (!e.target.closest('.nav-links')) h.classList.remove('nav-open');
});
document.addEventListener('keydown', e => e.key === 'Escape' && document.getElementById('site-header')?.classList.remove('nav-open'));

(() => {
  function fechaLocal(valor) {
    const [y, m, d] = String(valor).split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatoFecha(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function cambiarFecha(cantidad) {
    const input = document.getElementById('agendaFecha');
    if (!input || !input.value) return;

    const fecha = fechaLocal(input.value);
    fecha.setDate(fecha.getDate() + cantidad);
    input.value = formatoFecha(fecha);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function irHoy() {
    const input = document.getElementById('agendaFecha');
    if (!input) return;

    const hoy = new Date();
    input.value = formatoFecha(hoy);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function instalar() {
    const input = document.getElementById('agendaFecha');
    if (!input || document.getElementById('agenda-navegacion')) return;

    const contenedor = input.parentElement;
    if (!contenedor) return;

    const navegacion = document.createElement('div');
    navegacion.id = 'agenda-navegacion';
    navegacion.className = 'agenda-navegacion';
    navegacion.innerHTML = `
      <button type="button" class="agenda-nav-btn" aria-label="Día anterior">←</button>
      <button type="button" class="agenda-nav-hoy">Hoy</button>
      <button type="button" class="agenda-nav-btn" aria-label="Día siguiente">→</button>
    `;

    navegacion.children[0].addEventListener('click', () => cambiarFecha(-1));
    navegacion.children[1].addEventListener('click', irHoy);
    navegacion.children[2].addEventListener('click', () => cambiarFecha(1));

    contenedor.appendChild(navegacion);
  }

  function iniciar() {
    instalar();
    setTimeout(instalar, 300);
    setTimeout(instalar, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  new MutationObserver(instalar).observe(document.body, {
    childList: true,
    subtree: true
  });

  function instalarEstilosMobile() {
    if (document.getElementById('admin-mobile-css')) return;
    const link = document.createElement('link');
    link.id = 'admin-mobile-css';
    link.rel = 'stylesheet';
    link.href = './admin-mobile.css?v=1';
    document.head.appendChild(link);
  }

  instalarEstilosMobile();
})();

(() => {
  const init = () => {
    if (typeof supabaseClient === 'undefined' || typeof NEGOCIO_ID === 'undefined') return false;
    if (document.getElementById('seccion-historial')) return true;

    const C = supabaseClient;
    const negocioId = NEGOCIO_ID;
    const key = `admin_historial_reset_${negocioId}`;
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

    const menu = document.querySelector('.menu');
    const btnAgenda = menu?.querySelector('[data-seccion="turnos"]');
    if (menu && !menu.querySelector('[data-seccion="historial"]')) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.seccion = 'historial'; b.textContent = '📋 Historial';
      b.onclick = () => abrirHistorial(b);
      if (btnAgenda?.nextSibling) menu.insertBefore(b, btnAgenda.nextSibling); else menu.appendChild(b);
    }

    const contenido = document.querySelector('.contenido');
    if (!contenido) return false;

    const section = document.createElement('section');
    section.id = 'seccion-historial'; section.className = 'seccion-admin';
    section.innerHTML = `
      <div class="titulo-seccion"><h1>Historial de turnos</h1><p>Consultá los turnos anteriores de tu barbería.</p></div>
      <div class="card">
        <div class="historial-filtros">
          <div class="campo"><label>Período</label><select id="historialPeriodo"><option value="7">Últimos 7 días</option><option value="15">Últimos 15 días</option><option value="30" selected>Último mes</option><option value="90">Últimos 3 meses</option><option value="365">Último año</option><option value="0">Todos</option></select></div>
          <div class="campo"><label>Estado</label><select id="historialEstado"><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="confirmado">Confirmado</option><option value="completado">Realizado</option><option value="cancelado">Cancelado</option></select></div>
          <div class="campo historial-busqueda"><label>Buscar cliente</label><input id="historialCliente" type="search" placeholder="Nombre del cliente"></div>
          <div class="historial-acciones"><button class="btn" type="button" onclick="cargarHistorialTurnos()">🔎 Buscar</button><button class="btn btn-danger" type="button" onclick="reiniciarContadorTurnos()">🔄 Reiniciar contador</button></div>
        </div>
        <div id="historialInfo" class="historial-info"></div>
        <div class="tabla-wrapper"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Barbero</th><th>Estado</th><th>Total</th></tr></thead><tbody id="tablaHistorial"><tr><td colspan="6">Cargando...</td></tr></tbody></table></div>
      </div>`;
    contenido.appendChild(section);

    const style = document.createElement('style'); style.id = 'historial-admin-style'; style.textContent = `.historial-filtros{display:grid;grid-template-columns:1fr 1fr 1.4fr auto;gap:12px;align-items:end}.historial-filtros .campo{margin-bottom:0}.historial-acciones{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.historial-info{color:#aaa;font-size:12px;margin:4px 0 16px}@media(max-width:750px){.historial-filtros{grid-template-columns:1fr!important}.historial-acciones .btn{flex:1}.historial-info{line-height:1.5}}`; document.head.appendChild(style);

    const normalizarEstado = e => { e = String(e || '').toLowerCase(); return e === 'realizado' ? 'completado' : e; };

    async function obtenerServicios(turnos) {
      const ids = [...new Set(turnos.map(t => t.id).filter(Boolean))]; if (!ids.length) return {};
      const { data: links, error } = await C.from('turno_servicios').select('turno_id,servicio_id').in('turno_id', ids); if (error || !links?.length) return {};
      const serviceIds = [...new Set(links.map(x => x.servicio_id).filter(Boolean))]; if (!serviceIds.length) return {};
      const { data: servicios } = await C.from('servicios').select('id,nombre').in('id', serviceIds).eq('negocio_id', negocioId);
      const mapa = Object.fromEntries((servicios || []).map(s => [String(s.id), s.nombre])); const salida = {};
      links.forEach(x => { if (!salida[x.turno_id]) salida[x.turno_id] = []; if (mapa[String(x.servicio_id)]) salida[x.turno_id].push(mapa[String(x.servicio_id)]); }); return salida;
    }

    async function cargarHistorialTurnos() {
      const tbody = document.getElementById('tablaHistorial'); const periodo = Number(document.getElementById('historialPeriodo')?.value || 30); const estado = document.getElementById('historialEstado')?.value || ''; const cliente = (document.getElementById('historialCliente')?.value || '').trim().toLowerCase();
      tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
      let query = C.from('turnos').select('id,barbero_id,fecha_hora_inicio,fecha_hora_fin,estado,nombre_cliente,cliente_nombre,precio_reservado_total,created_at').eq('negocios_id', negocioId).order('fecha_hora_inicio', {ascending:false}).limit(1000);
      if (periodo > 0) { const desde = new Date(); desde.setDate(desde.getDate() - periodo); query = query.gte('fecha_hora_inicio', desde.toISOString()); }
      if (estado) query = query.eq('estado', estado);
      const { data: turnos, error } = await query;
      if (error) { tbody.innerHTML = `<tr><td colspan="6">Error: ${esc(error.message)}</td></tr>`; return; }
      const lista = (turnos || []).filter(t => !cliente || String(t.nombre_cliente || t.cliente_nombre || '').toLowerCase().includes(cliente));
      const barberoIds = [...new Set(lista.map(t => t.barbero_id).filter(Boolean))];
      const { data: barberos } = barberoIds.length ? await C.from('barberos').select('id,nombre').in('id', barberoIds).eq('negocio_id', negocioId) : {data:[]};
      const mapaBarberos = Object.fromEntries((barberos || []).map(b => [String(b.id), b.nombre])); const servicios = await obtenerServicios(lista);
      if (!lista.length) tbody.innerHTML = '<tr><td colspan="6">No hay turnos para este filtro.</td></tr>';
      else tbody.innerHTML = lista.map(t => { const d = new Date(t.fecha_hora_inicio); const estadoN = normalizarEstado(t.estado); const clase = estadoN === 'confirmado' ? 'estado-confirmado' : estadoN === 'cancelado' ? 'estado-cancelado' : estadoN === 'completado' ? 'estado-completado' : 'estado-pendiente'; return `<tr><td>${d.toLocaleDateString('es-AR')}<br><small>${d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</small></td><td><strong>${esc(t.nombre_cliente || t.cliente_nombre || 'Cliente')}</strong></td><td>${esc((servicios[t.id] || []).join(', ') || '—')}</td><td>${esc(mapaBarberos[String(t.barbero_id)] || 'Barbero')}</td><td><span class="estado ${clase}">${esc(estadoN || '—')}</span></td><td>$${Number(t.precio_reservado_total || 0).toLocaleString('es-AR')}</td></tr>`; }).join('');
      const reset = localStorage.getItem(key); const info = document.getElementById('historialInfo'); info.textContent = reset ? `Contador reiniciado desde ${new Date(reset).toLocaleString('es-AR')}. Los turnos anteriores siguen guardados.` : `${lista.length} turno(s) encontrados con el filtro actual.`;
    }

    window.cargarHistorialTurnos = cargarHistorialTurnos;
    window.reiniciarContadorTurnos = () => { if (!confirm('¿Reiniciar el contador de turnos?\n\nNo se borrará ningún turno. Solo se tomará este momento como nuevo punto de inicio del contador.')) return; localStorage.setItem(key, new Date().toISOString()); if (typeof window.actualizarEstadisticas === 'function') window.actualizarEstadisticas(); cargarHistorialTurnos(); alert('Contador reiniciado. Los turnos nuevos serán los que se contabilicen desde ahora.'); };
    window.abrirHistorial = (boton) => { document.querySelectorAll('.seccion-admin').forEach(s => s.classList.remove('activa')); section.classList.add('activa'); document.querySelectorAll('.menu button').forEach(x => x.classList.remove('activo')); boton?.classList.add('activo'); const top = document.getElementById('tituloTopbar'); if (top) top.textContent = 'Historial de turnos'; cargarHistorialTurnos(); };

    const originalStats = window.actualizarEstadisticas;
    if (typeof originalStats === 'function') {
      window.actualizarEstadisticas = async function() { const reset = localStorage.getItem(key); let query = C.from('turnos').select('id,estado').eq('negocios_id', negocioId); if (reset) query = query.gte('created_at', reset); const { data, error } = await query; if (error) return originalStats(); const arr = data || []; const total = document.getElementById('statTurnos'); const pendientes = document.getElementById('statPendientes'); if (total) total.textContent = arr.length; if (pendientes) pendientes.textContent = arr.filter(t => normalizarEstado(t.estado) === 'pendiente').length; };
      window.actualizarEstadisticas();
    }
    return true;
  };
  if (!init()) { const timer = setInterval(() => { if (init()) clearInterval(timer); }, 300); setTimeout(() => clearInterval(timer), 15000); }
})();

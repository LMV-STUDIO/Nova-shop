(() => {
  const C = window.supabaseClient;
  const negocioId = new URLSearchParams(location.search).get('negocio');
  if (!C || !negocioId) return;

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const hm = v => { const p=String(v||'').split(':').map(Number); return Number.isFinite(p[0])&&Number.isFinite(p[1]) ? p[0]*60+p[1] : null; };

  const style = document.createElement('style');
  style.textContent = `
    .horario.estado-pendiente{background:#332b13!important;border-color:#8f7928!important;color:#e8c95d!important}
    .horario.estado-confirmado,.horario.estado-reservado{background:#3a2612!important;border-color:#9a6424!important;color:#ffad4a!important}
    .horario.estado-cancelado{background:#351717!important;border-color:#a34a4a!important;color:#ff8888!important}
    .horario.estado-completado{background:#182b35!important;border-color:#4d9db8!important;color:#72cbe8!important}
    .horario.fijo-recurrente{background:#281c3c!important;border-color:#7655a8!important;color:#c2a6ff!important;cursor:not-allowed!important}
    #fijos-recurrentes-card{margin-top:20px}
  `;
  document.head.appendChild(style);

  function colorEstados(){
    document.querySelectorAll('.horario').forEach(el => {
      const s=(el.querySelector('.horario-estado')?.textContent||'').toLowerCase();
      el.classList.remove('estado-pendiente','estado-confirmado','estado-reservado','estado-cancelado','estado-completado');
      if(s.includes('pend')) el.classList.add('estado-pendiente');
      else if(s.includes('reserv')||s.includes('confirm')) el.classList.add('estado-reservado');
      else if(s.includes('cancel')) el.classList.add('estado-cancelado');
      else if(s.includes('realiz')||s.includes('complet')) el.classList.add('estado-completado');
    });
  }

  async function cargarBarberos(){
    const {data,error}=await C.from('barberos').select('id,nombre,activo').eq('negocio_id',negocioId).order('nombre');
    if(error) throw error;
    return data||[];
  }

  async function cargarFijos(){
    const {data,error}=await C.from('bloqueos_fijos').select('id,barbero_id,dia_semana,hora_inicio,hora_fin,motivo,activo').eq('negocio_id',negocioId).eq('activo',true).order('dia_semana').order('hora_inicio');
    if(error) throw error;
    return data||[];
  }

  async function crearFijo(){
    const b=document.getElementById('fijo-barbero')?.value;
    const d=Number(document.getElementById('fijo-dia')?.value);
    const hi=document.getElementById('fijo-inicio')?.value;
    const hf=document.getElementById('fijo-fin')?.value;
    const motivo=document.getElementById('fijo-motivo')?.value.trim()||null;
    if(!b||!hi||!hf||hm(hi)>=hm(hf)){ alert('Completá los datos y verificá el horario.'); return; }
    const {error}=await C.from('bloqueos_fijos').insert({negocio_id:negocioId,barbero_id:b,dia_semana:d,hora_inicio:hi,hora_fin:hf,motivo,activo:true});
    if(error){ alert('No se pudo crear el fijo: '+error.message); return; }
    document.getElementById('fijo-motivo').value='';
    await renderFijos();
    alert('Fijo semanal creado.');
  }

  async function eliminarFijo(id){
    if(!confirm('¿Eliminar este horario fijo semanal?')) return;
    const {error}=await C.from('bloqueos_fijos').delete().eq('id',id).eq('negocio_id',negocioId);
    if(error){ alert('No se pudo eliminar: '+error.message); return; }
    await renderFijos();
  }
  window.crearFijoSemanal=crearFijo;
  window.eliminarFijoSemanal=eliminarFijo;

  async function renderFijos(){
    const lista=document.getElementById('fijos-lista'); if(!lista) return;
    try{
      const [barberos,fijos]=await Promise.all([cargarBarberos(),cargarFijos()]);
      const byId=Object.fromEntries(barberos.map(b=>[b.id,b.nombre]));
      lista.innerHTML=fijos.length?fijos.map(f=>`<div class="fijo-row"><div><b>🟪 ${esc(byId[f.barbero_id]||'Barbero')}</b><br><span>${dias[f.dia_semana]} · ${String(f.hora_inicio).slice(0,5)} - ${String(f.hora_fin).slice(0,5)}</span>${f.motivo?`<small>${esc(f.motivo)}</small>`:''}</div><button class="btn btn-danger btn-small" onclick="eliminarFijoSemanal('${f.id}')">Eliminar</button></div>`).join(''):'<div style="color:#888">No hay horarios fijos.</div>';
      const select=document.getElementById('fijo-barbero');
      if(select && !select.options.length) select.innerHTML=barberos.filter(b=>b.activo).map(b=>`<option value="${b.id}">${esc(b.nombre)}</option>`).join('');
    }catch(e){ lista.innerHTML=`<div class="mensaje error visible">${esc(e.message)}</div>`; }
  }

  function insertarPanel(){
    if(document.getElementById('fijos-recurrentes-card')) return;
    const anchor=document.querySelector('.agenda-cabecera');
    if(!anchor) return false;
    const card=document.createElement('div');
    card.id='fijos-recurrentes-card'; card.className='card';
    card.innerHTML=`<h3>🟪 Fijos semanales</h3><p style="color:#aaa;font-size:13px;margin-bottom:16px">Bloquea este horario ese día de la semana, todas las semanas. La página pública también lo respetará.</p><div class="form-grid"><div class="campo"><label>Barbero</label><select id="fijo-barbero"></select></div><div class="campo"><label>Día</label><select id="fijo-dia">${dias.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></div><div class="campo"><label>Desde</label><input id="fijo-inicio" type="time" value="12:00"></div><div class="campo"><label>Hasta</label><input id="fijo-fin" type="time" value="13:00"></div><div class="campo campo-completo"><label>Motivo (opcional)</label><input id="fijo-motivo" maxlength="120" placeholder="Ej: almuerzo / compromiso fijo"></div></div><button class="btn" type="button" onclick="crearFijoSemanal()">+ Agregar fijo semanal</button><div id="fijos-lista" style="margin-top:18px"></div>`;
    anchor.parentNode.insertBefore(card,anchor.nextSibling);
    return true;
  }

  async function aplicarFijosAgenda(){
    colorEstados();
    const dateInput=document.querySelector('.agenda-cabecera input[type="date"]');
    const fecha=dateInput?.value; if(!fecha) return;
    const d=new Date(fecha+'T00:00:00').getDay();
    const {data}=await C.from('bloqueos_fijos').select('id,barbero_id,hora_inicio,hora_fin,motivo').eq('negocio_id',negocioId).eq('dia_semana',d).eq('activo',true);
    if(!data?.length) return;
    document.querySelectorAll('.agenda-barbero').forEach(box=>{
      const nombre=box.querySelector('.agenda-barbero-header h3')?.textContent?.trim();
      // We identify the barber by matching the rendered header with the DB list.
      const cells=[...box.querySelectorAll('.horario')];
      cells.forEach(cell=>{
        const hora=cell.querySelector('.horario-hora')?.textContent?.trim();
        const m=hm(hora); if(m===null) return;
        const fijo=data.find(f=>hm(f.hora_inicio)<m+30 && hm(f.hora_fin)>m);
        if(fijo){ cell.classList.add('fijo-recurrente'); cell.classList.remove('libre','ocupado','estado-pendiente','estado-confirmado','estado-reservado','estado-cancelado','estado-completado'); const estado=cell.querySelector('.horario-estado'); if(estado) estado.textContent='Fijo semanal'; }
      });
    });
  }

  const observer=new MutationObserver(()=>{ colorEstados(); aplicarFijosAgenda(); });
  observer.observe(document.body,{subtree:true,childList:true});
  const timer=setInterval(()=>{ insertarPanel(); renderFijos(); aplicarFijosAgenda(); },1500);
  window.addEventListener('beforeunload',()=>clearInterval(timer));
  insertarPanel(); renderFijos();
})();
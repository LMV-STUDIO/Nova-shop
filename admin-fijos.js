(() => {
  'use strict';

  const C = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  const negocioId = new URLSearchParams(location.search).get('negocio');
  if (!C || !negocioId) return;

  const TABLE = 'bloqueos_recurrentes_barbero';
  const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const minutos = v => { const m = String(v ?? '').slice(0,5).match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1])*60+Number(m[2]) : null; };

  let listaBarberos = [];
  let listaServicios = [];

  function estilos(){
    if(document.getElementById('admin-fijos-estilos')) return;
    const s=document.createElement('style'); s.id='admin-fijos-estilos'; s.textContent=`
      .fijos-card{margin-top:18px}.fijos-ayuda{color:#999;font-size:13px;margin:-8px 0 18px}
      .fijo-form{display:grid;grid-template-columns:1.2fr 1.2fr 1.4fr 1fr 1fr;gap:12px;align-items:end}.fijo-form .campo{margin:0}
      .fijos-lista{margin-top:18px;border-top:1px solid var(--borde)}.fijo-item{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid var(--borde)}
      .fijo-dato{font-size:13px;color:#ddd}.fijo-dato small{display:block;color:#888;margin-top:4px}.fijo-dato .fijo-cliente{color:#fff;font-weight:700}.fijo-dato .fijo-servicio{color:#bdbdbd}
      .horario.fijo-recurrente{background:#45246a!important;border-color:#a56be8!important;color:#ead8ff!important}.horario.fijo-recurrente .horario-estado{color:#ead8ff!important;font-weight:800}
      @media(max-width:900px){.fijo-form{grid-template-columns:1fr 1fr}.fijo-form .campo-completo{grid-column:1/-1}}
      @media(max-width:750px){.fijo-item{align-items:flex-start;flex-direction:column}}
    `; document.head.appendChild(s);
  }

  async function cargar(){
    const {data,error}=await C.from(TABLE).select('id,negocio_id,barbero_id,dia_semana,hora_inicio,hora_fin,motivo,cliente_nombre,servicio_id,activo').eq('negocio_id',negocioId).eq('activo',true).order('dia_semana').order('hora_inicio');
    if(error) throw error; return data||[];
  }

  async function barberos(){
    const {data,error}=await C.from('barberos').select('id,nombre,activo').eq('negocio_id',negocioId).order('nombre');
    if(error) throw error; listaBarberos=data||[]; return listaBarberos;
  }

  async function servicios(){
    const {data,error}=await C.from('servicios').select('id,nombre,activo').eq('negocio_id',negocioId).order('nombre');
    if(error) throw error; listaServicios=data||[]; return listaServicios;
  }

  function htmlCard(bs,fijos,ss){
    const opcionesBarberos=bs.filter(b=>b.activo).map(b=>`<option value="${b.id}">${esc(b.nombre)}</option>`).join('');
    const opcionesServicios='<option value="">Sin servicio</option>'+ss.filter(s=>s.activo).map(s=>`<option value="${s.id}">${esc(s.nombre)}</option>`).join('');
    const lista=fijos.length?fijos.map(f=>{
      const b=bs.find(x=>String(x.id)===String(f.barbero_id));
      const srv=ss.find(x=>String(x.id)===String(f.servicio_id));
      const cliente=f.cliente_nombre?`<span class="fijo-cliente">👤 ${esc(f.cliente_nombre)}</span>`:'<span class="fijo-cliente">👤 Sin cliente</span>';
      const servicio=srv?.nombre?`<span class="fijo-servicio">✂️ ${esc(srv.nombre)}</span>`:'<span class="fijo-servicio">✂️ Sin servicio</span>';
      return `<div class="fijo-item"><div class="fijo-dato"><strong>🟪 ${esc(b?.nombre||'Barbero')}</strong><small>${DIAS[Number(f.dia_semana)]||'Día'} · ${esc(String(f.hora_inicio).slice(0,5))} - ${esc(String(f.hora_fin).slice(0,5))}${f.motivo?' · '+esc(f.motivo):''}</small><small>${cliente} · ${servicio}</small></div><button type="button" class="btn btn-danger btn-small" data-eliminar-fijo="${f.id}">Eliminar</button></div>`;
    }).join(''):'<div style="color:#888;padding:14px 0">No hay bloqueos fijos configurados.</div>';
    return `<div class="card fijos-card" id="admin-fijos-card"><h3>🟪 Fijos semanales</h3><p class="fijos-ayuda">Bloqueá un horario que se repite todas las semanas para un barbero. No modifica turnos ya reservados.</p><div class="fijo-form"><div class="campo"><label>Barbero</label><select id="fijo-barbero">${opcionesBarberos}</select></div><div class="campo"><label>Cliente</label><input id="fijo-cliente" type="text" maxlength="120" placeholder="Nombre del cliente"></div><div class="campo"><label>Servicio</label><select id="fijo-servicio">${opcionesServicios}</select></div><div class="campo"><label>Día</label><select id="fijo-dia">${DIAS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></div><div class="campo"><label>Desde</label><input id="fijo-inicio" type="time" value="12:00"></div><div class="campo"><label>Hasta</label><input id="fijo-fin" type="time" value="13:00"></div><div class="campo campo-completo"><label>Motivo (opcional)</label><input id="fijo-motivo" maxlength="120" placeholder="Ej: cliente fijo semanal"></div></div><button type="button" class="btn" id="btn-agregar-fijo">+ Agregar fijo semanal</button><div class="fijos-lista" id="fijos-lista">${lista}</div></div>`;
  }

  async function render(){
    estilos(); const cab=document.querySelector('.agenda-cabecera'); if(!cab||document.getElementById('admin-fijos-card')) return;
    try{const [bs,fijos,ss]=await Promise.all([barberos(),cargar(),servicios()]);cab.insertAdjacentHTML('afterend',htmlCard(bs,fijos,ss));enlazar();}
    catch(e){console.error('Fijos semanales:',e);cab.insertAdjacentHTML('afterend',`<div class="card fijos-card" id="admin-fijos-card"><h3>🟪 Fijos semanales</h3><div class="mensaje error visible">No se pudieron cargar los fijos: ${esc(e.message)}</div></div>`);}
  }

  function enlazar(){
    const btn=document.getElementById('btn-agregar-fijo'); if(btn) btn.onclick=agregar;
    document.querySelectorAll('[data-eliminar-fijo]').forEach(b=>b.onclick=()=>eliminar(b.dataset.eliminarFijo));
  }

  async function agregar(){
    const b=document.getElementById('fijo-barbero')?.value;
    const cliente=document.getElementById('fijo-cliente')?.value.trim()||null;
    const servicio=document.getElementById('fijo-servicio')?.value||null;
    const d=Number(document.getElementById('fijo-dia')?.value),hi=document.getElementById('fijo-inicio')?.value,hf=document.getElementById('fijo-fin')?.value,motivo=document.getElementById('fijo-motivo')?.value.trim()||null;
    if(!b||!hi||!hf||minutos(hi)>=minutos(hf)){if(typeof mostrarGlobal==='function')mostrarGlobal('Completá los datos y verificá el horario.','error');else alert('Completá los datos y verificá el horario.');return;}
    const {error}=await C.from(TABLE).insert({negocio_id:negocioId,barbero_id:b,dia_semana:d,hora_inicio:hi,hora_fin:hf,motivo,cliente_nombre:cliente,servicio_id:servicio});
    if(error){console.error(error);if(typeof mostrarGlobal==='function')mostrarGlobal('No se pudo crear el fijo: '+error.message,'error');return;}
    if(typeof mostrarGlobal==='function')mostrarGlobal('Fijo semanal agregado correctamente.'); await refrescar(); if(typeof cargarAgenda==='function')await cargarAgenda();
  }

  async function eliminar(id){
    if(!confirm('¿Eliminar este horario fijo semanal?'))return;
    const {error}=await C.from(TABLE).delete().eq('id',id).eq('negocio_id',negocioId);
    if(error){if(typeof mostrarGlobal==='function')mostrarGlobal('No se pudo eliminar: '+error.message,'error');return;}
    if(typeof mostrarGlobal==='function')mostrarGlobal('Fijo semanal eliminado.'); await refrescar(); if(typeof cargarAgenda==='function')await cargarAgenda();
  }

  async function refrescar(){const card=document.getElementById('admin-fijos-card');if(!card)return;try{const [bs,fijos,ss]=await Promise.all([barberos(),cargar(),servicios()]);card.outerHTML=htmlCard(bs,fijos,ss);enlazar();}catch(e){console.error(e);}}

  async function aplicarEnAgenda(){
    const agenda=document.getElementById('agenda'),input=document.getElementById('agendaFecha'); if(!agenda||!input?.value)return;
    let fijos=[]; try{fijos=await cargar();}catch{return;}
    const dia=new Date(input.value+'T12:00:00').getDay();
    document.querySelectorAll('.agenda-barbero').forEach(box=>{
      const titulo=box.querySelector('.agenda-barbero-header h3')?.textContent||'';
      const b=listaBarberos.find(x=>titulo.includes(x.nombre)); if(!b)return;
      const propios=fijos.filter(f=>Number(f.dia_semana)===dia&&String(f.barbero_id)===String(b.id));
      box.querySelectorAll('.horario').forEach(cell=>{
        const m=minutos(cell.querySelector('.horario-hora')?.textContent?.trim()); if(m==null)return;
        const fijo=propios.find(f=>m>=minutos(f.hora_inicio)&&m<minutos(f.hora_fin));
        if(fijo&&!cell.classList.contains('ocupado')){
          cell.classList.add('fijo-recurrente');
          const estado=cell.querySelector('.horario-estado'); if(estado)estado.textContent='Fijo semanal';
          const cliente=cell.querySelector('.horario-cliente'); if(cliente)cliente.textContent=fijo.cliente_nombre||'Cliente fijo';
          const servicio=cell.querySelector('.horario-servicio');
          if(servicio){const srv=listaServicios.find(s=>String(s.id)===String(fijo.servicio_id));servicio.textContent=srv?.nombre||'Servicio fijo';}
        }
      });
    });
  }

  function iniciar(){
    render(); setTimeout(aplicarEnAgenda,700);
    if(typeof cargarAgenda==='function'&&!cargarAgenda.__fijosWrapped){const original=cargarAgenda;const wrapped=async function(...args){const r=await original.apply(this,args);await aplicarEnAgenda();return r;};wrapped.__fijosWrapped=true;window.cargarAgenda=wrapped;}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();

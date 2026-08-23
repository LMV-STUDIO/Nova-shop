(() => {
  'use strict';

  function limpiarMarcadorMarkdown(){
    const limpiar=nodo=>{
      if(nodo.nodeType===3){
        const t=nodo.nodeValue||'';
        if(t.trim()==='```html'||t.trim()==='```'){nodo.remove();return;}
        if(t.trim().startsWith('```html')) nodo.nodeValue=t.replace(/^\s*```html\s*/,'');
      }
    };
    if(document.body) Array.from(document.body.childNodes).forEach(limpiar);
  }
  limpiarMarcadorMarkdown();
  setTimeout(limpiarMarcadorMarkdown,100);

  const C = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  const negocioId = new URLSearchParams(location.search).get('negocio');
  if (!C || !negocioId) return;

  const hm = v => {
    const m = String(v ?? '').slice(0,5).match(/^(\d{1,2}):(\d{2})$/);
    return m ? Number(m[1])*60 + Number(m[2]) : null;
  };
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  async function fijos(barberoId,dia){
    const {data,error}=await C.from('bloqueos_recurrentes_barbero')
      .select('id,hora_inicio,hora_fin,motivo')
      .eq('negocio_id',negocioId).eq('barbero_id',barberoId).eq('dia_semana',dia).eq('activo',true);
    if(error){console.error('Error consultando fijos:',error);return []}
    return data||[];
  }

  const style=document.createElement('style');
  style.textContent=`
    .horario-btn.fijo-semanal{background:#281c3c!important;border-color:#7655a8!important;color:#c2a6ff!important;opacity:1!important;cursor:not-allowed!important;text-decoration:none!important}
    .horario-btn.fijo-semanal:hover{transform:none!important;color:#c2a6ff!important}
  `;
  document.head.appendChild(style);

  async function aplicarFijos(){
    const b=document.getElementById('barberoSelect')?.value;
    const fecha=document.getElementById('fechaTurno')?.value;
    if(!b||!fecha)return;
    const dia=new Date(fecha+'T12:00:00').getDay();
    const bloques=await fijos(b,dia);
    document.querySelectorAll('#horariosContainer .horario-btn').forEach(btn=>{
      btn.classList.remove('fijo-semanal');
      btn.disabled = btn.dataset.fijoOriginalDisabled === 'true';
      const h=btn.textContent.trim().slice(0,5);
      const m=hm(h); if(m===null)return;
      const fijo=bloques.find(x=>hm(x.hora_inicio)<m+30&&hm(x.hora_fin)>m);
      if(fijo){
        btn.dataset.fijoOriginalDisabled = btn.disabled ? 'true' : 'false';
        btn.disabled=true;
        btn.classList.add('fijo-semanal');
        btn.title=fijo.motivo||'Horario fijo semanal';
        btn.textContent=h+' · FIJO';
      }
    });
  }

  const cargarOriginal = typeof cargarHorariosDisponibles === 'function' ? cargarHorariosDisponibles : null;
  if(cargarOriginal && !cargarOriginal.__fijosPublicos){
    const wrapped=async function(...args){
      const r=await cargarOriginal.apply(this,args);
      await aplicarFijos();
      return r;
    };
    wrapped.__fijosPublicos=true;
    window.cargarHorariosDisponibles=wrapped;
  }

  const reservarOriginal = typeof reservarTurno === 'function' ? reservarTurno : null;
  if(reservarOriginal && !reservarOriginal.__fijosPublicos){
    const wrapped=async function(...args){
      const b=document.getElementById('barberoSelect')?.value;
      const fecha=document.getElementById('fechaTurno')?.value;
      const hora=document.getElementById('horaTurno')?.value;
      if(b&&fecha&&hora){
        const dia=new Date(fecha+'T12:00:00').getDay();
        const bloques=await fijos(b,dia);
        const m=hm(hora);
        if(m!==null && bloques.some(x=>hm(x.hora_inicio)<m+30&&hm(x.hora_fin)>m)){
          const msg=document.getElementById('mensajeReserva');
          if(msg) msg.innerHTML='<div class="error">❌ Ese horario está bloqueado como fijo semanal.</div>';
          return;
        }
      }
      return reservarOriginal.apply(this,args);
    };
    wrapped.__fijosPublicos=true;
    window.reservarTurno=wrapped;
  }

  document.addEventListener('change',e=>{
    if(['barberoSelect','fechaTurno','servicioSelect'].includes(e.target?.id)) setTimeout(aplicarFijos,100);
  });
  setTimeout(aplicarFijos,700);
})();

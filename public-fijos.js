(() => {
  const C=window.supabaseClient;
  const negocioId=new URLSearchParams(location.search).get('negocio');
  if(!C||!negocioId) return;
  const hm=v=>{const p=String(v||'').split(':').map(Number);return Number.isFinite(p[0])&&Number.isFinite(p[1])?p[0]*60+p[1]:null};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  const style=document.createElement('style');
  style.textContent='.horario-btn.fijo-semanal{background:#281c3c!important;border-color:#7655a8!important;color:#c2a6ff!important;opacity:1!important;cursor:not-allowed!important;text-decoration:none!important}';
  document.head.appendChild(style);

  async function fijos(barberoId,dia){
    const {data,error}=await C.from('bloqueos_fijos').select('id,hora_inicio,hora_fin,motivo').eq('negocio_id',negocioId).eq('barbero_id',barberoId).eq('dia_semana',dia).eq('activo',true);
    if(error){console.error('Error consultando fijos:',error);return []}
    return data||[];
  }

  async function aplicarFijos(){
    const b=document.getElementById('barberoSelect')?.value;
    const fecha=document.getElementById('fechaTurno')?.value;
    if(!b||!fecha)return;
    const dia=new Date(fecha+'T00:00:00').getDay();
    const bloques=await fijos(b,dia);
    if(!bloques.length)return;
    document.querySelectorAll('#horariosContainer .horario-btn').forEach(btn=>{
      const h=btn.textContent.trim().slice(0,5); const m=hm(h); if(m===null)return;
      const fijo=bloques.find(x=>hm(x.hora_inicio)<m+30&&hm(x.hora_fin)>m);
      if(fijo){
        btn.disabled=true; btn.classList.add('fijo-semanal'); btn.title=fijo.motivo||'Horario fijo semanal'; btn.textContent=h+' · FIJO';
      }
    });
  }

  const originalCargar=window.cargarHorariosDisponibles;
  if(typeof originalCargar==='function'){
    window.cargarHorariosDisponibles=async function(){await originalCargar();await aplicarFijos();};
  }

  const originalReservar=window.reservarTurno;
  if(typeof originalReservar==='function'){
    window.reservarTurno=async function(){
      const b=document.getElementById('barberoSelect')?.value;
      const fecha=document.getElementById('fechaTurno')?.value;
      const hora=document.getElementById('horaTurno')?.value;
      if(b&&fecha&&hora){
        const dia=new Date(fecha+'T00:00:00').getDay();
        const bloques=await fijos(b,dia); const m=hm(hora);
        if(bloques.some(x=>hm(x.hora_inicio)<m+30&&hm(x.hora_fin)>m)){
          const msg=document.getElementById('mensajeReserva');
          if(msg)msg.innerHTML='<div class="error">❌ Ese horario está bloqueado como fijo semanal.</div>';
          return;
        }
      }
      return originalReservar();
    };
  }

  document.addEventListener('change',e=>{
    if(['barberoSelect','fechaTurno','servicioSelect'].includes(e.target?.id)) setTimeout(aplicarFijos,100);
  });
  setTimeout(aplicarFijos,500);
})();
/* KORA booking enhancer — multiple services + overlap protection. Loaded after each KORA page's inline script. */
(function(){
  const boot=()=>{
    if(!window.supabase || !window.sb || !window.negocio) return;
    const form=document.getElementById('form'), modal=document.getElementById('modal'), serviceEl=document.getElementById('service'), msg=document.getElementById('msg');
    if(!form||!serviceEl||!msg) return;
    let selected=[];
    const originalServices=window.services||[];
    const isComplementary=s=>String(s?.tipo_servicio||'').toLowerCase()==='complementario';
    const renderSelector=()=>{
      serviceEl.multiple=true; serviceEl.size=Math.min(6,Math.max(3,originalServices.length)); serviceEl.required=true;
      serviceEl.innerHTML=originalServices.map((s,i)=>`<option value="${i}">${isComplementary(s)?'＋ ':''}${s.nombre} — $${Number(s.precio||0).toLocaleString('es-AR')} · ${s.duracion_minutos||60} min</option>`).join('');
      serviceEl.title='Elegí 1 servicio principal y los complementarios que quieras';
    };
    const sync=()=>{selected=[...serviceEl.selectedOptions].map(o=>Number(o.value)).filter(Number.isFinite); const principal=selected.filter(i=>!isComplementary(originalServices[i])); if(principal.length>1){const keep=principal[principal.length-1];[...serviceEl.options].forEach(o=>{if(selected.includes(Number(o.value))&&!isComplementary(originalServices[Number(o.value)])&&Number(o.value)!==keep)o.selected=false});selected=[...serviceEl.selectedOptions].map(o=>Number(o.value));} msg.textContent=selected.length?`Seleccionados: ${selected.length} · Total: $${selected.reduce((a,i)=>a+Number(originalServices[i]?.precio||0),0).toLocaleString('es-AR')} · ${selected.reduce((a,i)=>a+Number(originalServices[i]?.duracion_minutos||60),0)} min`:''};
    serviceEl.addEventListener('change',sync);
    renderSelector();
    window.pick=function(i){ if(modal) modal.style.display='flex'; [...serviceEl.options].forEach(o=>o.selected=false); const o=serviceEl.options[i]; if(o)o.selected=true; sync(); if(window.time&&!window.time.options.length) window.openBooking&&window.openBooking(); };
    const oldOpen=window.openBooking; window.openBooking=function(){ if(oldOpen) oldOpen(); renderSelector(); sync(); };
    form.addEventListener('submit',async function(e){
      e.preventDefault();
      const indices=[...serviceEl.selectedOptions].map(o=>Number(o.value));
      if(!indices.length){msg.textContent='Elegí al menos un servicio.';return;}
      const principal=indices.filter(i=>!isComplementary(originalServices[i]));
      if(principal.length!==1){msg.textContent='Elegí un solo servicio principal. Podés sumar complementarios.';return;}
      const totalPrice=indices.reduce((a,i)=>a+Number(originalServices[i]?.precio||0),0);
      const totalMin=indices.reduce((a,i)=>a+Number(originalServices[i]?.duracion_minutos||60),0);
      const start=new Date(document.getElementById('date').value+'T'+document.getElementById('time').value+':00');
      const end=new Date(start.getTime()+totalMin*60000);
      msg.textContent='Comprobando disponibilidad…';
      let busy=sb.from('turnos').select('id').eq('negocios_id',negocio.id).lt('fecha_hora_inicio',end.toISOString()).gt('fecha_hora_fin',start.toISOString());
      const barberEl=document.getElementById('barber'); if(barberEl&&window.barbers?.length){const b=barbers[barberEl.value];if(b?.id)busy=busy.eq('barbero_id',b.id)}
      const br=await busy; if(br.error){msg.textContent=br.error.message;return;} if(br.data?.length){msg.textContent='Ese horario no alcanza para todos los servicios seleccionados. Elegí otro horario.';return;}
      msg.textContent='Guardando…';
      const barberEl2=document.getElementById('barber'); const b=barberEl2&&window.barbers?.length?barbers[barberEl2.value]:null;
      const payload={negocios_id:negocio.id,barbero_id:b?.id||null,fecha_hora_inicio:start.toISOString(),fecha_hora_fin:end.toISOString(),precio_reservado_total:totalPrice,estado:'pendiente',nombre_cliente:document.getElementById('name').value,cliente_nombre:document.getElementById('name').value};
      const x=await sb.from('turnos').insert(payload).select('id').single(); if(x.error){msg.textContent=x.error.message;return;}
      const rows=indices.filter(i=>originalServices[i]?.id).map(i=>({turno_id:x.data.id,servicio_id:originalServices[i].id,precio_reservado:Number(originalServices[i].precio||0),duracion_minutos:Number(originalServices[i].duracion_minutos||60)}));
      if(rows.length){const ts=await sb.from('turno_servicios').insert(rows);if(ts.error){msg.textContent='El turno se creó, pero no se pudieron guardar todos los servicios: '+ts.error.message;return;}}
      msg.textContent=`¡Turno reservado! ${indices.length} servicio${indices.length>1?'s':''} · ${totalMin} min · $${totalPrice.toLocaleString('es-AR')}`;
      setTimeout(()=>{if(window.closeBooking)closeBooking();form.reset();selected=[];},1200);
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50));else setTimeout(boot,50);
})();

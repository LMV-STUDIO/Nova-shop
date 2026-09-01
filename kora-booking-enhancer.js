/* KORA booking enhancer — multiple services + overlap protection. */
(function(){
  const URL='https://cqelidpshitntewsktwx.supabase.co';
  const KEY='sb_publishable_o1q2pLVF1zIlZCzPHMaheg_KSawjVvD';
  const boot=async()=>{
    if(!window.supabase)return;
    const form=document.getElementById('form'),modal=document.getElementById('modal'),serviceEl=document.getElementById('service'),msg=document.getElementById('msg');
    if(!form||!serviceEl||!msg)return;
    const sb2=supabase.createClient(URL,KEY);
    const page=location.pathname.split('/').pop().toLowerCase();
    const types={
      'barberia-kora.html':'barberia','nails-kora.html':'nails','lashes-kora.html':'lashes',
      'estetica-kora.html':'cosmetologia','depilacion-laser-kora.html':'depilacion_laser'
    };
    const id=new URLSearchParams(location.search).get('negocio');
    let nq=sb2.from('negocios').select('*').limit(1); if(id)nq=nq.eq('id',id); else nq=nq.eq('tipo_negocio',types[page]||'nails');
    const nr=await nq.maybeSingle(); if(nr.error||!nr.data){msg.textContent='No se pudo cargar el negocio.';return;}
    const negocio2=nr.data;
    const sr=await sb2.from('servicios').select('*').eq('negocio_id',negocio2.id).eq('activo',true).order('nombre');
    const services2=sr.data||[]; if(!services2.length)return;
    let barbers2=[];
    if(page==='barberia-kora.html'){
      const br=await sb2.from('barberos').select('*').eq('negocio_id',negocio2.id).eq('activo',true).order('nombre'); barbers2=br.data||[];
    }
    const isComp=s=>String(s?.tipo_servicio||'').toLowerCase()==='complementario';
    const render=()=>{
      serviceEl.multiple=true; serviceEl.size=Math.min(7,Math.max(4,services2.length)); serviceEl.required=true;
      serviceEl.innerHTML=services2.map((s,i)=>`<option value="${i}">${isComp(s)?'＋ COMPLEMENTARIO · ':'PRINCIPAL · '}${s.nombre} — $${Number(s.precio||0).toLocaleString('es-AR')} · ${s.duracion_minutos||60} min</option>`).join('');
      serviceEl.title='Elegí 1 principal y agregá los complementarios que necesites';
    };
    const sync=()=>{
      const opts=[...serviceEl.options], chosen=opts.filter(o=>o.selected).map(o=>Number(o.value));
      const principals=chosen.filter(i=>!isComp(services2[i]));
      if(principals.length>1){const keep=principals[principals.length-1];opts.forEach(o=>{const i=Number(o.value);if(o.selected&&!isComp(services2[i])&&i!==keep)o.selected=false});}
      const final=opts.filter(o=>o.selected).map(o=>Number(o.value));
      if(!final.length){msg.textContent='Elegí 1 servicio principal y, si querés, complementarios.';return final;}
      const p=final.reduce((a,i)=>a+Number(services2[i]?.precio||0),0),m=final.reduce((a,i)=>a+Number(services2[i]?.duracion_minutos||60),0);
      msg.textContent=`${final.length} servicio${final.length>1?'s':''} · ${m} min · $${p.toLocaleString('es-AR')}`;return final;
    };
    render();
    serviceEl.addEventListener('change',sync);
    const oldPick=window.pick; window.pick=async i=>{if(oldPick&&false)oldPick(i);if(modal)modal.style.display='flex';render();[...serviceEl.options].forEach(o=>o.selected=false);if(serviceEl.options[i])serviceEl.options[i].selected=true;sync();};
    const oldOpen=window.openBooking; window.openBooking=function(){if(oldOpen)oldOpen();render();sync();};
    if(page==='barberia-kora.html'){
      const barberEl=document.getElementById('barber');
      if(barberEl)barberEl.innerHTML=(barbers2.length?barbers2:[{id:null,nombre:'Cualquier barbero'}]).map((b,i)=>`<option value="${i}">${b.nombre}</option>`).join('');
    }
    form.addEventListener('submit',async e=>{
      e.preventDefault(); e.stopImmediatePropagation();
      const indices=sync(); if(!indices||!indices.length)return;
      const principal=indices.filter(i=>!isComp(services2[i]));
      if(principal.length!==1){msg.textContent='Elegí un solo servicio principal. Podés sumar complementarios.';return;}
      const dateEl=document.getElementById('date'),timeEl=document.getElementById('time');
      if(!dateEl.value||!timeEl.value){msg.textContent='Elegí fecha y horario.';return;}
      const totalPrice=indices.reduce((a,i)=>a+Number(services2[i]?.precio||0),0);
      const totalMin=indices.reduce((a,i)=>a+Number(services2[i]?.duracion_minutos||60),0);
      const start=new Date(dateEl.value+'T'+timeEl.value+':00'),end=new Date(start.getTime()+totalMin*60000);
      if(Number.isNaN(start.getTime())){msg.textContent='Fecha u horario inválido.';return;}
      msg.textContent='Comprobando disponibilidad…';
      let busy=sb2.from('turnos').select('id').eq('negocios_id',negocio2.id).lt('fecha_hora_inicio',end.toISOString()).gt('fecha_hora_fin',start.toISOString());
      const barberEl=document.getElementById('barber');let selectedBarber=null;
      if(barberEl&&barbers2.length){selectedBarber=barbers2[Number(barberEl.value)];if(selectedBarber?.id)busy=busy.eq('barbero_id',selectedBarber.id);}
      const check=await busy;if(check.error){msg.textContent=check.error.message;return;}
      if(check.data?.length){msg.textContent='Ese horario se superpone con otro turno. Elegí otro horario.';return;}
      msg.textContent='Guardando…';
      const name=document.getElementById('name').value,phone=document.getElementById('phone')?.value||'';
      const x=await sb2.from('turnos').insert({negocios_id:negocio2.id,barbero_id:selectedBarber?.id||null,fecha_hora_inicio:start.toISOString(),fecha_hora_fin:end.toISOString(),precio_reservado_total:totalPrice,estado:'pendiente',nombre_cliente:name,cliente_nombre:name}).select('id').single();
      if(x.error){msg.textContent=x.error.message;return;}
      const rows=indices.map(i=>({turno_id:x.data.id,servicio_id:services2[i].id,precio_reservado:Number(services2[i].precio||0),duracion_minutos:Number(services2[i].duracion_minutos||60)}));
      const ts=await sb2.from('turno_servicios').insert(rows);if(ts.error){msg.textContent='El turno se creó, pero falló el detalle de servicios: '+ts.error.message;return;}
      msg.textContent=`¡Turno reservado! ${indices.length} servicio${indices.length>1?'s':''} · ${totalMin} min · $${totalPrice.toLocaleString('es-AR')}`;
      setTimeout(()=>{if(window.closeBooking)closeBooking();form.reset();render();},1200);
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,50));else setTimeout(boot,50);
})();

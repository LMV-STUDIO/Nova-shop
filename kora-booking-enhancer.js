/* KORA booking enhancer — standalone visual services + date/time + overlap protection. */
(function(){
  const SUPA_URL='https://cqelidpshitntewsktwx.supabase.co';
  const SUPA_KEY='sb_publishable_o1q2pLVF1zIlZCzPHMaheg_KSawjVvD';
  const TYPE_BY_PAGE={
    'nails-kora.html':'nails','lashes-kora.html':'lashes','estetica-kora.html':'cosmetologia',
    'depilacion-laser-kora.html':'depilacion_laser','barberia-kora.html':'barberia'
  };
  const isComp=s=>String(s?.tipo_servicio||'').toLowerCase()==='complementario';
  const money=n=>'$'+Number(n||0).toLocaleString('es-AR');
  const boot=async()=>{
    const form=document.getElementById('form'),modal=document.getElementById('modal'),serviceEl=document.getElementById('service'),msg=document.getElementById('msg');
    if(!form||!serviceEl||!msg)return;
    if(!window.supabase?.createClient)return;
    const db=window.supabase.createClient(SUPA_URL,SUPA_KEY);
    const qs=new URLSearchParams(location.search);
    const page=(location.pathname.split('/').pop()||'').toLowerCase();
    let negocioId=qs.get('negocio');
    let negocio=null,services=[],barbers=[];
    if(negocioId){const r=await db.from('negocios').select('*').eq('id',negocioId).maybeSingle();negocio=r.data}
    if(!negocio){
      const tipo=TYPE_BY_PAGE[page];
      if(!tipo)return;
      const r=await db.from('negocios').select('*').eq('tipo_negocio',tipo).limit(1).maybeSingle();
      negocio=r.data; negocioId=negocio?.id;
    }
    if(!negocioId)return;
    const sr=await db.from('servicios').select('*').eq('negocio_id',negocioId).eq('activo',true).order('nombre');
    if(sr.error){msg.textContent=sr.error.message;return}
    services=sr.data||[];
    const isBarber=page==='barberia-kora.html';
    if(isBarber){const br=await db.from('barberos').select('*').eq('negocio_id',negocioId).eq('activo',true).order('nombre');barbers=br.data||[]}
    const dateEl=document.getElementById('date'),timeEl=document.getElementById('time'),barberEl=document.getElementById('barber');
    serviceEl.style.display='none';
    serviceEl.multiple=true;
    serviceEl.innerHTML='';
    let selected=[];
    const style=document.createElement('style');
    style.textContent=`#service{display:none!important}.kora-booking-services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0 16px}.kora-booking-card{border:1px solid #b9b9b9;background:#fff;padding:15px;text-align:left;cursor:pointer;font:inherit;min-height:88px;transition:transform .18s,border-color .18s,box-shadow .18s}.kora-booking-card:hover{transform:translateY(-2px)}.kora-booking-card.on{border-color:#111;box-shadow:inset 0 0 0 2px #111}.kora-booking-card .tag{display:block;font:9px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px}.kora-booking-card b{display:block;font-size:14px}.kora-booking-card small{display:block;margin-top:7px;color:#666}.kora-booking-total{padding:5px 0 14px;font:10px 'DM Mono',monospace;text-transform:uppercase;min-height:16px}.kora-booking-datetime{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kora-booking-datetime input{width:100%;box-sizing:border-box}@media(max-width:600px){.kora-booking-services{grid-template-columns:1fr}.kora-booking-datetime{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
    let wrap=document.querySelector('.kora-booking-services');
    if(!wrap){wrap=document.createElement('div');wrap.className='kora-booking-services';serviceEl.parentNode.insertBefore(wrap,serviceEl)}
    wrap.innerHTML='';
    let total=document.querySelector('.kora-booking-total');
    if(!total){total=document.createElement('div');total.className='kora-booking-total';serviceEl.parentNode.insertBefore(total,serviceEl)}
    if(dateEl&&timeEl){timeEl.type='time';timeEl.step=1800;dateEl.type='date';dateEl.min=new Date().toISOString().slice(0,10);}
    services.forEach((s,i)=>{
      const opt=document.createElement('option');opt.value=i;opt.textContent=s.nombre;serviceEl.appendChild(opt);
      const card=document.createElement('button');card.type='button';card.className='kora-booking-card';card.innerHTML=`<span class="tag">${isComp(s)?'Complementario':'Principal'}</span><b>${s.nombre}</b><small>${money(s.precio)} · ${s.duracion_minutos||60} min</small>`;
      card.addEventListener('click',()=>{
        if(isComp(s)){
          opt.selected=!opt.selected;
        }else{
          [...serviceEl.options].forEach(o=>{const x=services[Number(o.value)];if(!isComp(x))o.selected=false});
          opt.selected=true;
        }
        sync();
      });
      wrap.appendChild(card);
    });
    const sync=()=>{
      selected=[...serviceEl.options].filter(o=>o.selected).map(o=>Number(o.value));
      wrap.querySelectorAll('.kora-booking-card').forEach((c,i)=>c.classList.toggle('on',selected.includes(i)));
      const price=selected.reduce((a,i)=>a+Number(services[i]?.precio||0),0);
      const mins=selected.reduce((a,i)=>a+Number(services[i]?.duracion_minutos||60),0);
      total.textContent=selected.length?`✓ ${selected.length} servicio${selected.length>1?'s':''} · ${mins} min · ${money(price)}`:'';
    };
    const rebuildOpen=()=>{sync();if(modal)modal.style.display='flex';if(dateEl)dateEl.min=new Date().toISOString().slice(0,10)};
    window.openBooking=rebuildOpen;
    window.pick=i=>{rebuildOpen();const o=serviceEl.options[i];if(o){[...serviceEl.options].forEach(x=>{const s=services[Number(x.value)];if(!isComp(s))x.selected=false});o.selected=true;sync()}};
    form.addEventListener('submit',async e=>{
      e.preventDefault();e.stopImmediatePropagation();
      const indices=[...serviceEl.options].filter(o=>o.selected).map(o=>Number(o.value));
      const principals=indices.filter(i=>!isComp(services[i]));
      if(principals.length!==1){msg.textContent='Elegí 1 servicio principal y después los complementarios que quieras.';return}
      if(!dateEl?.value||!timeEl?.value){msg.textContent='Elegí fecha y hora.';return}
      const totalPrice=indices.reduce((a,i)=>a+Number(services[i]?.precio||0),0);
      const totalMin=indices.reduce((a,i)=>a+Number(services[i]?.duracion_minutos||60),0);
      const start=new Date(dateEl.value+'T'+timeEl.value+':00');
      const end=new Date(start.getTime()+totalMin*60000);
      if(Number.isNaN(start.getTime())){msg.textContent='Fecha u hora inválida.';return}
      msg.textContent='Comprobando disponibilidad…';
      let q=db.from('turnos').select('id').eq('negocios_id',negocioId).lt('fecha_hora_inicio',end.toISOString()).gt('fecha_hora_fin',start.toISOString());
      let barber=null;
      if(isBarber&&barberEl&&barbers.length){barber=barbers[Number(barberEl.value)];if(barber?.id)q=q.eq('barbero_id',barber.id)}
      const busy=await q;
      if(busy.error){msg.textContent=busy.error.message;return}
      if(busy.data?.length){msg.textContent='Ese horario se superpone con otro turno. Elegí otra hora.';return}
      const name=document.getElementById('name')?.value?.trim();
      if(!name){msg.textContent='Completá tu nombre.';return}
      msg.textContent='Guardando…';
      const payload={negocios_id:negocioId,barbero_id:barber?.id||null,fecha_hora_inicio:start.toISOString(),fecha_hora_fin:end.toISOString(),precio_reservado_total:totalPrice,estado:'pendiente',nombre_cliente:name,cliente_nombre:name};
      const ins=await db.from('turnos').insert(payload).select('id').single();
      if(ins.error){msg.textContent=ins.error.message;return}
      const rows=indices.filter(i=>services[i]?.id).map(i=>({turno_id:ins.data.id,servicio_id:services[i].id,precio_reservado:Number(services[i].precio||0),duracion_minutos:Number(services[i].duracion_minutos||60)}));
      if(rows.length){const ts=await db.from('turno_servicios').insert(rows);if(ts.error){msg.textContent='El turno se creó, pero hubo un error guardando los servicios: '+ts.error.message;return}}
      msg.textContent=`¡Turno reservado! ${indices.length} servicio${indices.length>1?'s':''} · ${totalMin} min · ${money(totalPrice)}`;
      setTimeout(()=>{if(window.closeBooking)window.closeBooking();form.reset();serviceEl.selectedIndex=-1;sync()},1200);
    },true);
    sync();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));else setTimeout(boot,500);
})();
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

  const style=document.createElement('style');
  style.textContent=`
    .horario-btn.fijo-semanal{background:#281c3c!important;border-color:#7655a8!important;color:#c2a6ff!important;opacity:1!important;cursor:not-allowed!important;text-decoration:none!important}
    .horario-btn.fijo-semanal:hover{transform:none!important;color:#c2a6ff!important}
    .boton-ubicacion{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;padding:10px 16px;border-radius:8px;background:transparent;color:var(--principal);border:1px solid var(--principal);text-decoration:none;font-weight:800;font-size:13px;transition:.2s}
    .boton-ubicacion:hover{background:var(--principal);color:#111;transform:translateY(-2px)}

    /* =====================================================
       HORARIOS POR BARBERO
       ===================================================== */
    .horarios-multi-barberos{
      display:grid;
      gap:18px;
      margin:22px 0 8px;
      text-align:left
    }
    .tabla-horarios-barbero{
      background:rgba(13,13,13,.82);
      border:1px solid var(--borde);
      border-radius:14px;
      padding:18px;
      overflow:hidden
    }
    .tabla-horarios-barbero.activo-seleccionado{
      border-color:var(--principal);
      box-shadow:0 0 0 1px rgba(212,175,55,.12)
    }
    .tabla-horarios-cabecera{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:14px
    }
    .tabla-horarios-cabecera h3{
      margin:0;
      color:#fff;
      font-size:18px
    }
    .tabla-horarios-cabecera span{
      color:var(--principal);
      font-size:12px;
      font-weight:800;
      text-transform:uppercase;
      letter-spacing:.5px
    }
    .tabla-horarios-grid{
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:9px
    }
    .tabla-horario-btn{
      min-height:44px;
      padding:10px 7px;
      border-radius:8px;
      border:1px solid var(--borde);
      background:#0d0d0d;
      color:#fff;
      cursor:pointer;
      font-weight:700;
      transition:.2s
    }
    .tabla-horario-btn:hover:not(:disabled){
      border-color:var(--principal);
      color:var(--principal);
      transform:translateY(-2px)
    }
    .tabla-horario-btn.seleccionado{
      background:var(--principal);
      border-color:var(--principal);
      color:#111
    }
    .tabla-horario-btn.ocupado,
    .tabla-horario-btn.fijo{
      opacity:.35;
      cursor:not-allowed;
      text-decoration:line-through
    }
    .tabla-horario-btn.fijo{
      opacity:.55;
      text-decoration:none
    }
    .tabla-horarios-vacio{
      padding:16px;
      border:1px solid var(--borde);
      border-radius:10px;
      color:var(--gris);
      text-align:center;
      font-size:14px
    }
    .tabla-horarios-ayuda{
      color:var(--gris);
      font-size:12px;
      margin-top:11px
    }
    @media(max-width:650px){
      .tabla-horarios-grid{grid-template-columns:repeat(3,1fr)}
    }
    @media(max-width:430px){
      .tabla-horarios-grid{grid-template-columns:repeat(2,1fr)}
      .tabla-horarios-barbero{padding:14px}
    }
  `;
  document.head.appendChild(style);

  function encontrarBloqueUbicacion(){
    const direccion=document.getElementById('direccion');
    if(direccion) return {direccion,contenedor:direccion.parentElement};

    const tarjetas=[...document.querySelectorAll('.info-card')];
    const tarjeta=tarjetas.find(card=>{
      const titulo=card.querySelector('h3');
      return titulo && titulo.textContent.trim().toLowerCase()==='ubicación';
    });
    if(!tarjeta) return null;

    const parrafo=tarjeta.querySelector('p');
    if(!parrafo) return null;
    return {direccion:parrafo,contenedor:tarjeta};
  }

  function agregarBotonUbicacion(){
    const bloque=encontrarBloqueUbicacion();
    if(!bloque) return;

    const texto=(bloque.direccion.textContent||'').trim();
    if(!texto || texto==='Dirección del local') return;
    if(document.getElementById('botonUbicacion')) return;

    const boton=document.createElement('a');
    boton.id='botonUbicacion';
    boton.className='boton-ubicacion';
    boton.target='_blank';
    boton.rel='noopener noreferrer';
    boton.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(texto);
    boton.innerHTML='📍 Cómo llegar';
    bloque.direccion.insertAdjacentElement('afterend',boton);
  }

  agregarBotonUbicacion();
  setTimeout(agregarBotonUbicacion,300);
  setTimeout(agregarBotonUbicacion,1000);
  setTimeout(agregarBotonUbicacion,2000);
  new MutationObserver(agregarBotonUbicacion).observe(document.body,{subtree:true,childList:true,characterData:true});

  const C = window.supabaseClient || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  const negocioId = new URLSearchParams(location.search).get('negocio');
  if (!C || !negocioId) return;

  const hm = v => {
    const m = String(v ?? '').slice(0,5).match(/^(\d{1,2}):(\d{2})$/);
    return m ? Number(m[1])*60 + Number(m[2]) : null;
  };

  async function fijos(barberoId,dia){
    const {data,error}=await C.from('bloqueos_recurrentes_barbero')
      .select('id,hora_inicio,hora_fin,motivo')
      .eq('negocio_id',negocioId).eq('barbero_id',barberoId).eq('dia_semana',dia).eq('activo',true);
    if(error){console.error('Error consultando fijos:',error);return []}
    return data||[]
  }

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

  /* =====================================================
     TABLAS DE HORARIOS INDEPENDIENTES POR BARBERO
     ===================================================== */

  function obtenerDuracionServicio(){
    const select=document.getElementById('servicioSelect');
    const valor=select?.value ?? '';

    if(valor!=='' && typeof servicios!=='undefined' && Array.isArray(servicios)){
      const servicio=servicios[Number(valor)];
      const duracion=Number(servicio?.duracion_minutos || 30);
      if(Number.isFinite(duracion) && duracion>0) return duracion;
    }

    return 30;
  }

  function obtenerNombreBarbero(id){
    if(typeof BARBEROS!=='undefined' && Array.isArray(BARBEROS)){
      const b=BARBEROS.find(x=>String(x.id)===String(id));
      if(b) return b.nombre;
    }
    return 'Barbero';
  }

  async function cargarHorariosDeTodosLosBarberos(){
    const fecha=document.getElementById('fechaTurno')?.value;
    const contenedor=document.getElementById('horariosPorBarbero');
    const selector=document.getElementById('barberoSelect');

    if(!contenedor) return;

    const barberos=(typeof BARBEROS!=='undefined' && Array.isArray(BARBEROS)) ? BARBEROS : [];

    if(!fecha){
      contenedor.innerHTML='<div class="tabla-horarios-vacio">Seleccioná una fecha para ver los horarios de cada barbero.</div>';
      return;
    }

    if(!barberos.length){
      contenedor.innerHTML='<div class="tabla-horarios-vacio">No hay barberos disponibles.</div>';
      return;
    }

    contenedor.innerHTML='<div class="tabla-horarios-vacio">Cargando horarios de los barberos...</div>';

    const diaSemana=new Date(fecha+'T12:00:00').getDay();
    const duracion=obtenerDuracionServicio();
    const ahora=new Date();

    try{
      const {data:turnos,error:errorTurnos}=await C.from('turnos')
        .select('id,barbero_id,fecha_hora_inicio,fecha_hora_fin,estado')
        .eq('negocios_id',negocioId)
        .neq('estado','cancelado')
        .gte('fecha_hora_inicio',fecha+'T00:00:00')
        .lt('fecha_hora_inicio',fecha+'T23:59:59');

      if(errorTurnos) throw errorTurnos;

      const turnosPorBarbero=new Map();
      (turnos||[]).forEach(turno=>{
        const clave=String(turno.barbero_id);
        if(!turnosPorBarbero.has(clave)) turnosPorBarbero.set(clave,[]);
        turnosPorBarbero.get(clave).push(turno);
      });

      const resultados=await Promise.all(barberos.map(async barbero=>{
        const {data:horario,error:errorHorario}=await C.from('barbero_horarios')
          .select('id,barbero_id,dia_semana,hora_inicio,hora_fin,activo')
          .eq('barbero_id',barbero.id)
          .eq('dia_semana',diaSemana)
          .eq('activo',true)
          .maybeSingle();

        if(errorHorario) throw errorHorario;

        const bloques=await fijos(barbero.id,diaSemana);
        return {barbero,horario,bloques,turnos:turnosPorBarbero.get(String(barbero.id))||[]};
      }));

      contenedor.innerHTML='';

      resultados.forEach(({barbero,horario,bloques,turnos})=>{
        const tarjeta=document.createElement('div');
        tarjeta.className='tabla-horarios-barbero';
        tarjeta.dataset.barberoId=barbero.id;

        const cabecera=document.createElement('div');
        cabecera.className='tabla-horarios-cabecera';
        cabecera.innerHTML=`<h3>✂️ ${escapeHtmlLocal(barbero.nombre)}</h3><span>${String(selector?.value)===String(barbero.id)?'Seleccionado':'Disponible'}</span>`;
        tarjeta.appendChild(cabecera);

        if(!horario){
          const vacio=document.createElement('div');
          vacio.className='tabla-horarios-vacio';
          vacio.textContent='Este barbero no atiende ese día.';
          tarjeta.appendChild(vacio);
          contenedor.appendChild(tarjeta);
          return;
        }

        const inicio=hm(horario.hora_inicio);
        const fin=hm(horario.hora_fin);

        if(inicio===null || fin===null || inicio>=fin){
          const vacio=document.createElement('div');
          vacio.className='tabla-horarios-vacio';
          vacio.textContent='El horario configurado no es válido.';
          tarjeta.appendChild(vacio);
          contenedor.appendChild(tarjeta);
          return;
        }

        const grid=document.createElement('div');
        grid.className='tabla-horarios-grid';
        let cantidad=0;

        for(let minutos=inicio; minutos+duracion<=fin; minutos+=30){
          const horas=Math.floor(minutos/60);
          const mins=minutos%60;
          const hora=String(horas).padStart(2,'0')+':'+String(mins).padStart(2,'0');
          const inicioTurno=new Date(`${fecha}T${hora}:00`);
          const finTurno=new Date(inicioTurno.getTime()+duracion*60000);

          if(inicioTurno<=ahora) continue;
          cantidad++;

          const ocupado=turnos.some(turno=>{
            const a=new Date(turno.fecha_hora_inicio);
            const b=new Date(turno.fecha_hora_fin);
            return a<finTurno && b>inicioTurno;
          });

          const bloqueado=bloques.some(bloque=>{
            const a=hm(bloque.hora_inicio);
            const b=hm(bloque.hora_fin);
            return a!==null && b!==null && a<minutos+duracion && b>minutos;
          });

          const boton=document.createElement('button');
          boton.type='button';
          boton.className='tabla-horario-btn';
          boton.textContent=hora;

          if(ocupado){
            boton.disabled=true;
            boton.classList.add('ocupado');
            boton.title='Horario ocupado';
          }else if(bloqueado){
            boton.disabled=true;
            boton.classList.add('fijo');
            boton.title=bloques.find(x=>{
              const a=hm(x.hora_inicio),b=hm(x.hora_fin);
              return a!==null&&b!==null&&a<minutos+duracion&&b>minutos;
            })?.motivo || 'Horario bloqueado';
          }else{
            boton.addEventListener('click',()=>{
              if(selector) selector.value=barbero.id;
              const horaInput=document.getElementById('horaTurno');
              if(horaInput) horaInput.value=hora;

              document.querySelectorAll('.tabla-horario-btn.seleccionado').forEach(b=>b.classList.remove('seleccionado'));
              boton.classList.add('seleccionado');
              document.querySelectorAll('.tabla-horarios-barbero').forEach(t=>t.classList.remove('activo-seleccionado'));
              tarjeta.classList.add('activo-seleccionado');
              cabecera.querySelector('span').textContent='Seleccionado';
              document.querySelectorAll('.tabla-horarios-barbero').forEach(t=>{
                if(t!==tarjeta){
                  const s=t.querySelector('.tabla-horarios-cabecera span');
                  if(s) s.textContent='Disponible';
                }
              });
            });
          }

          grid.appendChild(boton);
        }

        if(!cantidad){
          const vacio=document.createElement('div');
          vacio.className='tabla-horarios-vacio';
          vacio.textContent='No quedan horarios para esta fecha.';
          tarjeta.appendChild(vacio);
        }else{
          tarjeta.appendChild(grid);
          const ayuda=document.createElement('div');
          ayuda.className='tabla-horarios-ayuda';
          ayuda.textContent='Elegí un horario en esta tabla para reservar con este barbero.';
          tarjeta.appendChild(ayuda);
        }

        if(String(selector?.value)===String(barbero.id)) tarjeta.classList.add('activo-seleccionado');
        contenedor.appendChild(tarjeta);
      });

    }catch(error){
      console.error('Error cargando tablas de horarios por barbero:',error);
      contenedor.innerHTML=`<div class="tabla-horarios-vacio">No se pudieron cargar los horarios. ${escapeHtmlLocal(error?.message||'Error desconocido')}</div>`;
    }
  }

  function escapeHtmlLocal(valor){
    return String(valor??'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function instalarTablasPorBarbero(){
    const original=document.getElementById('horariosContainer');
    const fecha=document.getElementById('fechaTurno');
    const formulario=original?.parentElement;
    if(!original || !fecha || !formulario) return false;

    if(document.getElementById('horariosPorBarbero')) return true;

    const titulo=document.getElementById('horariosTitulo');
    if(titulo) titulo.style.display='none';
    original.style.display='none';

    const contenedor=document.createElement('div');
    contenedor.id='horariosPorBarbero';
    contenedor.className='horarios-multi-barberos';
    contenedor.innerHTML='<div class="tabla-horarios-vacio">Seleccioná una fecha para ver los horarios de cada barbero.</div>';
    original.insertAdjacentElement('afterend',contenedor);

    const refrescar=()=>setTimeout(cargarHorariosDeTodosLosBarberos,50);
    fecha.addEventListener('change',refrescar);
    document.getElementById('servicioSelect')?.addEventListener('change',refrescar);
    document.getElementById('barberoSelect')?.addEventListener('change',refrescar);

    setTimeout(cargarHorariosDeTodosLosBarberos,700);
    setTimeout(cargarHorariosDeTodosLosBarberos,1400);
    return true;
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
    if(['fechaTurno','servicioSelect','barberoSelect'].includes(e.target?.id)) setTimeout(cargarHorariosDeTodosLosBarberos,120);
  });
  setTimeout(aplicarFijos,700);
  setTimeout(instalarTablasPorBarbero,500);
  setTimeout(instalarTablasPorBarbero,1200);
  setTimeout(cargarHorariosDeTodosLosBarberos,1800);
})();

(() => {
  if (new URLSearchParams(location.search).get('demo') !== 'true') return;
  window.__LMV_DEMO__ = true;
  const fakeBusiness = {nombre:'Studio Demo', telefono:'11 5555-5555', dirección:'Av. Demo 123, Buenos Aires', instagram:'@studio.demo', whatsapp:'5491155555555', descripcion:'Esta es una demostración visual del sistema LMV Studio.'};
  const services = [
    {id:'demo-1',nombre:'Servicio Premium',descripcion:'Servicio de demostración.',precio:18000,duracion_minutos:60,activo:true,categoria:'principal',tipo_servicio:'principal'},
    {id:'demo-2',nombre:'Servicio Clásico',descripcion:'Una opción rápida y profesional.',precio:12000,duracion_minutos:45,activo:true,categoria:'principal',tipo_servicio:'principal'},
    {id:'demo-3',nombre:'Complemento',descripcion:'Podés sumarlo a tu servicio.',precio:5000,duracion_minutos:20,activo:true,categoria:'complementario',tipo_servicio:'complementario'},
    {id:'demo-4',nombre:'Diseño Especial',descripcion:'Detalle adicional de muestra.',precio:7000,duracion_minutos:30,activo:true,categoria:'complementario',tipo_servicio:'complementario'}
  ];
  const hours = [0,1,2,3,4,5,6].map(dia_semana=>({dia_semana,hora_inicio:'09:00',hora_fin:'18:00',abierto:true,activo:true}));
  const barbers=[{id:'demo-b1',nombre:'Alex Demo',activo:true},{id:'demo-b2',nombre:'Sofi Demo',activo:true}];
  function result(table){
    if(table==='negocios') return fakeBusiness;
    if(table==='servicios') return services;
    if(table==='horarios_negocio') return hours;
    if(table==='barberos') return barbers;
    if(table==='barbero_horarios') return hours.map(x=>({...x,barbero_id:'demo-b1'}));
    if(table==='turnos') return [];
    if(table==='turno_servicios') return [];
    return [];
  }
  function query(table){
    let rows=result(table), action='select';
    const q={
      select(){action='select';return q}, insert(){action='insert';return q}, update(){action='update';return q}, delete(){action='delete';return q},
      eq(){return q}, neq(){return q}, gt(){return q}, gte(){return q}, lt(){return q}, lte(){return q}, in(){return q}, order(){return q}, limit(){return q},
      maybeSingle(){return Promise.resolve({data:Array.isArray(rows)?(rows[0]||null):rows,error:null})},
      single(){return Promise.resolve({data:Array.isArray(rows)?(rows[0]||null):rows,error:null})},
      then(resolve,reject){
        if(action==='insert') return Promise.resolve({data:[{id:'demo-turno'}],error:null}).then(resolve,reject);
        return Promise.resolve({data:rows,error:null}).then(resolve,reject);
      }
    }; return q;
  }
  const auth={getSession:async()=>({data:{session:null},error:null}),signInWithOAuth:async()=>({data:null,error:null})};
  window.supabase = window.supabase || {};
  window.supabase.createClient = () => ({from:query,auth});
  const msg='Esto es una demo de prueba. La reserva de turnos no está habilitada en esta demostración.';
  document.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    const t=(b.textContent||'').trim().toLowerCase();
    if(/reservar|confirmar turno|confirmar reserva|agendar/.test(t)) { e.preventDefault(); e.stopImmediatePropagation(); alert(msg); }
  },true);
  document.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();alert(msg)},true);
})();

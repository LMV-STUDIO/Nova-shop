/* LMV V4 — cambia composición, no toca lógica ni contenido dinámico */
(function(){'use strict';
function init(){
 const root=document.documentElement, body=document.body, r=root.dataset.lmvRubro||'';
 if(body.dataset.lmvV4==='1')return; body.dataset.lmvV4='1'; body.classList.add('lmv-v4-'+r);
 const hero=document.querySelector('.hero');
 const main=document.querySelector('main');
 const sections=[...document.querySelectorAll('main>.section,main>.contact')];
 const labels={nails:['Estudio','Colección','Servicios','Agenda','Contacto'],lashes:['Signature','Universo','Servicios','Reserva','Contacto'],estetica:['Clínica','Experiencia','Tratamientos','Agenda','Contacto'],'depilacion-laser':['Tecnología','Experiencia','Tratamientos','Agenda','Contacto'],barberia:['Barbería','Experiencia','Servicios','Reservas','Contacto'],comida:['Restaurante','Concepto','Carta','Reservas','Ubicación'],ferreteria:['Ferretería','Soluciones','Productos','Consulta','Contacto'],ropa:['Boutique','Editorial','Colección','Comprar','Contacto']};
 const words=labels[r]||['Inicio','Servicios','Reserva','Contacto'];
 // Rebuild only the visual navigation; existing IDs remain untouched.
 const nav=document.createElement('nav'); nav.className='lmv-v4-nav';
 const brand=document.querySelector('.brand,.logo')?.textContent?.trim()||('LMV · '+r.toUpperCase());
 nav.innerHTML='<strong>'+brand+'</strong><div class="lmv-v4-navlinks"></div>';
 const links=nav.querySelector('.lmv-v4-navlinks');
 if(hero){hero.id=hero.id||'inicio'; addLink(hero.id,words[0]);}
 sections.forEach((s,i)=>{s.dataset.lmvV4Section=String(i+1); if(!s.id)s.id='lmv-seccion-'+(i+1); addLink(s.id,words[Math.min(i+1,words.length-1)]);});
 function addLink(id,text){const a=document.createElement('a');a.href='#'+id;a.textContent=text;links.appendChild(a)}
 const cta=document.createElement('a'); cta.className='lmv-v4-cta'; cta.href='#reservar'; cta.textContent='Reservar'; nav.appendChild(cta); body.prepend(nav);
 // Animated reveal, safe even when a rubro has a different DOM.
 const targets=[...sections,...document.querySelectorAll('.card,.service,.serviceBox,.contact,.form')];
 targets.forEach((el,i)=>{el.classList.add('lmv-v4-reveal');el.style.setProperty('--lmv-delay',Math.min(i,8)*45+'ms')});
 if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('lmv-v4-show');io.unobserve(e.target)}}),{threshold:.08});targets.forEach(e=>io.observe(e))}else targets.forEach(e=>e.classList.add('lmv-v4-show'));
 // Progress + active navigation.
 const bar=document.createElement('div');bar.className='lmv-v4-progress';body.appendChild(bar);
 function scrollUI(){const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=(max?scrollY/max*100:0)+'%';nav.classList.toggle('is-scrolled',scrollY>30);let cur=hero?.id;[...sections].forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.42)cur=s.id});links.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash==='#'+cur))}
 addEventListener('scroll',scrollUI,{passive:true});scrollUI();
 // Subtle pointer effect only on cards; never changes booking inputs/buttons.
 document.querySelectorAll('.card,.service').forEach(el=>{el.addEventListener('pointermove',e=>{if(innerWidth<900)return;const q=el.getBoundingClientRect();el.style.setProperty('--rx',((e.clientY-q.top)/q.height-.5)*-2+'deg');el.style.setProperty('--ry',((e.clientX-q.left)/q.width-.5)*2+'deg')});el.addEventListener('pointerleave',()=>{el.style.removeProperty('--rx');el.style.removeProperty('--ry')})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* LMV EXPERIENCIA 2.0 — navegación, estructura y microinteracciones. No modifica lógica de reservas/Supabase. */
(function(){
'use strict';
function init(){
 const root=document.documentElement, body=document.body, rubro=root.dataset.lmvRubro||'cliente';
 if(body.dataset.lmvExperience==='2') return; body.dataset.lmvExperience='2';
 const main=document.querySelector('main')||body;
 main.classList.add('lmv-experience-main');
 const hero=document.querySelector('.hero');
 if(hero){hero.insertAdjacentHTML('afterbegin','<div class="lmv-hero-orb"></div><div class="lmv-hero-grid"></div><div class="lmv-scroll-cue">Explorar</div>')}
 const labels={nails:['Colección','Servicios','Agenda','Estudio'],lashes:['Signature','Servicios','Reservas','Contacto'],estetica:['Experiencia','Tratamientos','Agenda','Contacto'],'depilacion-laser':['Tecnología','Tratamientos','Agenda','Contacto'],barberia:['Estilo','Servicios','Reservas','Barbería'],comida:['La carta','Menú','Reservas','Ubicación'],ferreteria:['Soluciones','Productos','Consulta','Contacto'],ropa:['Colección','Productos','Comprar','Boutique']};
 const words=labels[rubro]||['Inicio','Servicios','Reservar','Contacto'];
 const nav=document.createElement('nav'); nav.className='lmv-experience-nav'; nav.innerHTML='<div class="lmv-nav-brand">'+(document.querySelector('.brand,.logo')?.textContent?.trim()||('LMV · '+rubro))+'</div><div class="lmv-nav-links"></div><a class="lmv-nav-cta" href="#reservar">Reservar</a>';
 const navLinks=nav.querySelector('.lmv-nav-links');
 const candidates=[];
 if(hero) candidates.push({el:hero,id:'inicio',label:words[0]});
 document.querySelectorAll('main>.section,main>.contact').forEach((el,i)=>{
   if(!el.id) el.id='lmv-seccion-'+(i+1);
   let label=words[Math.min(i+1,words.length-1)];
   const h=el.querySelector('h2'); if(h&&h.textContent.trim()) label=h.textContent.trim().slice(0,18);
   candidates.push({el,id:el.id,label});
 });
 if(candidates.length){ candidates.slice(0,5).forEach((x,i)=>{const a=document.createElement('a');a.href='#'+x.id;a.textContent=x.label;a.dataset.target=x.id;navLinks.appendChild(a);}); }
 body.prepend(nav);
 const rail=document.createElement('div'); rail.className='lmv-side-rail'; candidates.forEach(x=>{const a=document.createElement('a');a.href='#'+x.id;a.title=x.label;a.dataset.target=x.id;rail.appendChild(a)});body.appendChild(rail);
 const progress=document.createElement('div');progress.className='lmv-progress';body.appendChild(progress);
 document.querySelectorAll('main>.section,main>.contact,.card,.serviceBox,.contactCard,.form').forEach(el=>el.classList.add('lmv-reveal'));
 document.querySelectorAll('.btn,.boton,.nav-turno,.contactBtn,.lmv-nav-links a').forEach(el=>el.classList.add('lmv-ripple'));
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('lmv-show')}),{threshold:.12});document.querySelectorAll('.lmv-reveal').forEach(el=>observer.observe(el));
 const sections=candidates.map(x=>x.el);
 function update(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?(scrollY/max*100):0)+'%';nav.classList.toggle('scrolled',scrollY>50);let current=sections[0]?.id;sections.forEach(s=>{if(s.getBoundingClientRect().top<=innerHeight*.38)current=s.id});document.querySelectorAll('.lmv-nav-links a,.lmv-side-rail a').forEach(a=>a.classList.toggle('active',a.dataset.target===current));}
 addEventListener('scroll',update,{passive:true});update();
 document.querySelectorAll('.lmv-nav-links a,.lmv-side-rail a,.lmv-nav-cta').forEach(a=>a.addEventListener('click',()=>setTimeout(update,50)));
 document.querySelectorAll('.card,.service,.serviceBox,.contactCard').forEach(card=>{card.addEventListener('pointermove',e=>{if(innerWidth<900)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.classList.add('lmv-tilt');card.style.transform='perspective(700px) rotateX('+(-y*3)+'deg) rotateY('+(x*3)+'deg) translateY(-5px)'});card.addEventListener('pointerleave',()=>{card.style.transform=''})});
 document.querySelectorAll('.lmv-ripple').forEach(el=>el.addEventListener('pointerdown',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--x',(e.clientX-r.left)+'px');el.style.setProperty('--y',(e.clientY-r.top)+'px');el.classList.remove('lmv-ripple');void el.offsetWidth;el.classList.add('lmv-ripple')}));
 // Add semantic labels/numbers without touching existing booking logic.
 document.querySelectorAll('main>.section,main>.contact').forEach((el,i)=>{if(!el.querySelector('.lmv-section-label')){const l=document.createElement('div');l.className='lmv-section-label';l.textContent=(words[Math.min(i+1,words.length-1)]||'Sección');const first=el.querySelector('.head')||el.firstElementChild;if(first) first.prepend(l)}const n=document.createElement('span');n.className='lmv-section-number';n.textContent=String(i+1).padStart(2,'0');el.appendChild(n)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

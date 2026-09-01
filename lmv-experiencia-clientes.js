/* LMV EXPERIENCIA — parche seguro. No modifica estructura, IDs, formularios, reservas ni datos. */
(function(){'use strict';
 function init(){
  const body=document.body;
  if(!body || body.dataset.lmvSafeExperience==='1') return;
  body.dataset.lmvSafeExperience='1';
  const items=[...document.querySelectorAll('.section,.contact,.card,.service,.serviceBox')];
  items.forEach((el,i)=>{el.classList.add('lmv-v4-reveal');el.style.setProperty('--lmv-delay',Math.min(i,8)*35+'ms')});
  const showAll=()=>items.forEach(el=>el.classList.add('lmv-v4-show'));
  if('IntersectionObserver' in window){
   const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('lmv-v4-show');io.unobserve(e.target)}}),{threshold:0.03});
   items.forEach(el=>io.observe(el));
   setTimeout(showAll,1800);
  }else showAll();
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();

(()=>{
'use strict';
const isBuyer=/distribuidora-compras\.html/i.test(location.pathname);
const isProvider=/distribuidora-proveedor\.html/i.test(location.pathname);
if(!isBuyer&&!isProvider)return;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
const buyerScale=[
 {min:1,max:9,label:'Precio normal',discount:0},
 {min:10,max:24,label:'Precio mayorista',discount:5},
 {min:25,max:49,label:'Precio distribuidor',discount:8},
 {min:50,max:null,label:'Precio por bulto',discount:10}
];
function scaleForQty(qty){const q=Math.max(1,Number(qty)||1);return buyerScale.find(s=>q>=s.min&&(s.max===null||q<=s.max))||buyerScale[0]}
function discountedPrice(base,qty){const s=scaleForQty(qty);return Number(base)*(1-s.discount/100)}
function scaleRange(s){return s.max===null?`${s.min}+`:`${s.min}–${s.max}`}
const css=`
.dv3{margin:18px 0;padding:0}.dv3-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.dv3-card{background:#fff;border:1px solid #d7e0e9;border-radius:16px;padding:18px;box-shadow:0 8px 22px rgba(16,36,59,.08)}.dv3-card h3{margin:0 0 7px;font-size:18px}.dv3-card p{margin:0;color:#657487;font-size:12px;line-height:1.5}.dv3-kpi{font-size:27px;font-weight:950;margin:8px 0}.dv3-accent{background:linear-gradient(135deg,#10243a,#1c587d);color:#fff}.dv3-accent p{color:#c9d9e7}.dv3-accent .dv3-kpi{font-size:30px}.dv3-title{font-size:26px;font-weight:950;margin:0 0 5px}.dv3-sub{color:#657487;font-size:12px;margin:0 0 14px}.dv3-tools{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.dv3-form{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.dv3-field label{display:block;font-size:10px;font-weight:900;color:#657487;margin-bottom:5px}.dv3-field input,.dv3-field select{width:100%;padding:11px;border:1px solid #d7e0e9;border-radius:9px;background:#fff}.dv3-result{margin-top:12px;padding:14px;border-radius:12px;background:#eef8f4;border:1px solid #b9e4d1}.dv3-result strong{font-size:21px}.dv3-pills{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.dv3-pill{padding:7px 9px;border-radius:999px;background:#edf2f7;font-size:10px;font-weight:900}.dv3-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.dv3-btn{border:0;border-radius:9px;padding:11px 14px;background:#e87516;color:#fff;font-weight:900;cursor:pointer}.dv3-btn.sec{background:#e9eff5;color:#152235}.dv3-table{width:100%;border-collapse:collapse;font-size:12px}.dv3-table th,.dv3-table td{text-align:left;padding:10px 8px;border-bottom:1px solid #edf1f4}.dv3-table th{font-size:9px;text-transform:uppercase;color:#657487}.dv3-green{color:#15956b;font-weight:950}.dv3-orange{color:#a84d09;font-weight:950}.dv3-note{font-size:11px;color:#657487;line-height:1.5;margin-top:9px}.dv3-hidden{display:none!important}.dv3-scale{margin:0 0 14px;padding:14px 16px;border:1px solid #d7e0e9;border-radius:14px;background:#f7f9fb}.dv3-scale-title{font-size:14px;font-weight:950;margin-bottom:9px}.dv3-scale-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.dv3-scale-item{padding:10px;border-radius:10px;background:#fff;border:1px solid #e1e7ed}.dv3-scale-item strong{display:block;font-size:12px}.dv3-scale-item span{display:block;font-size:10px;color:#657487;margin-top:3px}.dv3-price-old{text-decoration:line-through;color:#657487;font-size:11px;margin-right:7px}.dv3-price-saving{font-size:10px;color:#15956b;font-weight:950}.dv3-cart-price{font-weight:950}.dv3-cart-old{text-decoration:line-through;color:#657487;margin-right:5px}.dv3-mode{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}.dv3-mode button{border:1px solid #d7e0e9;border-radius:10px;padding:10px 12px;background:#f7f9fb;color:#152235;font-weight:900;font-size:11px;cursor:pointer;text-align:left}.dv3-mode button.active{background:#eaf7f2;border-color:#9bd7bd;color:#116c50}.dv3-result-head{font-size:13px;font-weight:950;margin-bottom:10px;color:#152235}.dv3-result-section{padding:10px 0;border-top:1px solid #d7e8df}.dv3-result-section:first-of-type{padding-top:0;border-top:0}.dv3-result-section-title{font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.04em;color:#657487;margin-bottom:7px}.dv3-result-row{display:flex;justify-content:space-between;gap:12px;padding:4px 0;font-size:11px;color:#405064}.dv3-result-row strong{font-size:12px}.dv3-result-main{margin-top:9px;padding:10px 12px;border-radius:10px;background:#fff;border:1px solid #b9e4d1}.dv3-result-main span{display:block;font-size:10px;color:#657487;font-weight:900}.dv3-result-main strong{display:block;margin-top:3px;font-size:22px;color:#15956b}.dv3-result-note{margin-top:8px;font-size:10px;color:#657487;line-height:1.4}
@media(max-width:1000px){.dv3-grid{grid-template-columns:repeat(2,1fr)}.dv3-tools{grid-template-columns:1fr}.dv3-scale-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:650px){.dv3{margin:12px 0}.dv3-grid{grid-template-columns:1fr}.dv3-card{padding:16px}.dv3-title{font-size:24px}.dv3-form{grid-template-columns:1fr}.dv3-kpi{font-size:25px}.dv3-scale-grid{grid-template-columns:1fr 1fr}.dv3-scale-item{padding:9px 8px}.dv3-mode{grid-template-columns:1fr}}
`;
function injectStyle(){if($('#dv3-style'))return;const st=document.createElement('style');st.id='dv3-style';st.textContent=css;document.head.appendChild(st)}
async function dolar(){
  const keys=['blue','oficial'];const out={};
  try{const r=await fetch('https://dolarapi.com/v1/dolares',{cache:'no-store'});const a=await r.json();a.forEach(x=>{if(keys.includes(x.casa))out[x.casa]=x})}catch(e){}
  return out;
}
function insertAfter(el,node){el.parentNode.insertBefore(node,el.nextSibling)}
function insertBuyerScale(){
 const catalog=$('.catalog');if(!catalog||$('#dv3-buyer-scale'))return;
 const box=document.createElement('div');box.id='dv3-buyer-scale';box.className='dv3-scale';
 box.innerHTML=`<div class="dv3-scale-title">📦 Precios por cantidad</div><div class="dv3-scale-grid">${buyerScale.map(s=>`<div class="dv3-scale-item"><strong>${scaleRange(s)} unidades</strong><span>${esc(s.label)} (${s.discount?'-'+s.discount+'%':'0%'})</span></div>`).join('')}</div>`;
 const head=$('.catalog-head',catalog);head?insertAfter(head,box):catalog.prepend(box);
}
function updateProductPrices(){
 $$('.product').forEach(card=>{
   const input=$('.qty',card),priceEl=$('.price',card);if(!input||!priceEl)return;
   if(!priceEl.dataset.basePrice){const raw=priceEl.textContent.replace(/[^0-9]/g,'');if(raw)priceEl.dataset.basePrice=String(Number(raw))}
   const base=Number(priceEl.dataset.basePrice)||0,q=Math.max(1,Number(input.value)||1),s=scaleForQty(q),final=discountedPrice(base,q);
   priceEl.innerHTML=s.discount?`<span class="dv3-price-old">${money(base)}</span>${money(final)}`:money(base);
   let save=$('.dv3-price-saving',card);if(s.discount){if(!save){save=document.createElement('span');save.className='dv3-price-saving';priceEl.insertAdjacentElement('afterend',save)}save.textContent=`${s.label} · ${s.discount}% menos`}else if(save)save.remove();
 }
 )
}
function updateCartPrices(){
 const items=$$('.cartitem');let total=0;
 items.forEach(item=>{
   const small=$('small',item),line=$('.cartline',item);if(!small||!line)return;
   const text=small.textContent;
   const qm=text.match(/(\d+)\s+unidades/);const pm=text.match(/·\s*([^·]+)\s*c\/u/);if(!qm||!pm)return;
   const qty=Math.max(1,Number(qm[1])||1),base=Number(pm[1].replace(/[^0-9]/g,''))||0,s=scaleForQty(qty),unit=discountedPrice(base,qty),sub=unit*qty;total+=sub;
   small.innerHTML=`${qty} unidades · ${s.discount?`<span class="dv3-cart-old">${money(base)}</span>`:''}<span class="dv3-cart-price">${money(unit)} c/u</span>${s.discount?` · <span class="dv3-price-saving">${s.label} (-${s.discount}%)</span>`:''}`;
   const subtotal=line.querySelector('span');if(subtotal)subtotal.textContent=`Subtotal ${money(sub)}`;
 });
 if(!items.length)return;
 const totalEl=$('#total'),mobile=$('#mobileTotal'),profitEl=$('#profit'),topProfit=$('#proftop'),mEl=$('#margin');
 const margin=Math.max(0,Number(mEl?.value)||0),profit=total*margin/100;
 if(totalEl)totalEl.textContent=money(total);if(mobile)mobile.textContent=money(total);if(profitEl)profitEl.textContent=money(profit);if(topProfit)topProfit.textContent=money(profit);
}
function buyer(){
 const main=$('.wrap')||document.body;if(!main)return;
 const box=document.createElement('section');box.className='dv3';box.innerHTML=`<div class="dv3-title">Herramientas para comprar mejor</div><p class="dv3-sub">Pensado para dueños de comercios: mirá el dólar, calculá tu margen y decidí cuánto te conviene vender antes de confirmar el pedido.</p><div class="dv3-grid"><div class="dv3-card dv3-accent"><h3>💵 Dólar blue</h3><div class="dv3-kpi" id="dv3-blue">Actualizando…</div><p id="dv3-blue-meta">Cotización de referencia</p></div><div class="dv3-card"><h3>🏦 Dólar oficial</h3><div class="dv3-kpi" id="dv3-oficial">Actualizando…</div><p id="dv3-oficial-meta">Cotización de referencia</p></div><div class="dv3-card"><h3>📈 Tu margen</h3><div class="dv3-kpi" id="dv3-margin-kpi">30%</div><p>Se aplica sobre el costo para estimar tu precio de venta.</p></div><div class="dv3-card"><h3>🧾 Compra mínima</h3><div class="dv3-kpi">Mayorista</div><p>Podés analizar el pedido completo antes de enviarlo.</p></div></div><div class="dv3-tools" style="margin-top:14px"><div class="dv3-card"><h3>🧮 Calculadora de rentabilidad</h3><div class="dv3-mode"><button type="button" id="dv3-mode-buy" class="active">📦 Total de la compra</button><button type="button" id="dv3-mode-profit">📈 Rentabilidad de un producto</button></div><div class="dv3-form"><div class="dv3-field"><label>Costo unitario</label><input id="dv3-cost" type="number" value="10000" min="0"></div><div class="dv3-field"><label>Margen deseado (%)</label><input id="dv3-margin" type="number" value="30" min="0" max="500"></div><div class="dv3-field"><label>Precio según cantidad</label><div id="dv3-discount" style="padding:11px;border:1px solid #d7e0e9;border-radius:9px;background:#f7f9fb;font-weight:900;color:#15956b">Precio normal (0%)</div></div><div class="dv3-field"><label>Cantidad</label><input id="dv3-qty" type="number" value="1" min="1"></div></div><div class="dv3-result" id="dv3-calc"></div><div class="dv3-actions"><button class="dv3-btn" id="dv3-save-quote">Guardar cálculo</button><button class="dv3-btn sec" id="dv3-copy-quote">Copiar resumen</button></div></div><div class="dv3-card"><h3>📦 Escalas de compra</h3><table class="dv3-table"><thead><tr><th>Cantidad</th><th>Precio</th></tr></thead><tbody>${buyerScale.map((s,i)=>`<tr><td>${scaleRange(s)}</td><td class="${i===0?'':'dv3-green'}">${esc(s.label)} (${s.discount?'-'+s.discount+'%':'0%'})</td></tr>`).join('')}</tbody></table></div></div>`;
 const hero=$('.hero');hero?insertAfter(hero,box):main.prepend(box);
 let mode='buy';
 const getValues=()=>{const c=+$('#dv3-cost').value||0,m=Math.max(0,+$('#dv3-margin').value||0),q=Math.max(1,+$('#dv3-qty').value||1),scale=scaleForQty(q),d=scale.discount;const net=c*(1-d/100),price=net*(1+m/100),unitProfit=price-net,total=price*q,profit=unitProfit*q;return{c,m,d,q,net,price,unitProfit,total,profit,scale}};
 const renderCalc=()=>{const x=getValues();$('#dv3-margin-kpi').textContent=x.m+'%';$('#dv3-discount').textContent=`${x.scale.label} (${x.d?'−'+x.d+'%':'0%'})`;if(mode==='buy'){$('#dv3-calc').innerHTML=`<div class="dv3-result-head">Cotización estimada</div><div class="dv3-result-section"><div class="dv3-result-section-title">📦 Resumen de compra</div><div class="dv3-result-row"><span>Cantidad</span><strong>${x.q} ${x.q===1?'unidad':'unidades'}</strong></div><div class="dv3-result-row"><span>Costo por unidad</span><strong>${money(x.c)}</strong></div><div class="dv3-result-row"><span>Descuento aplicado</span><strong>${esc(x.scale.label)} (${x.d?'−'+x.d+'%':'0%'})</strong></div><div class="dv3-result-row"><span>Costo total de compra</span><strong>${money(x.net*x.q)}</strong></div></div><div class="dv3-result-section"><div class="dv3-result-section-title">📈 Si revendés</div><div class="dv3-result-row"><span>Margen aplicado</span><strong>${x.m}%</strong></div><div class="dv3-result-row"><span>Precio sugerido por unidad</span><strong>${money(x.price)}</strong></div><div class="dv3-result-row"><span>Venta total estimada</span><strong>${money(x.total)}</strong></div></div><div class="dv3-result-main"><span>Ganancia total estimada</span><strong>${money(x.profit)}</strong></div><div class="dv3-result-note">La ganancia estimada surge de comparar tu costo real con el precio sugerido de reventa.</div>`}else{$('#dv3-calc').innerHTML=`<div class="dv3-result-head">Cotización estimada</div><div class="dv3-result-section"><div class="dv3-result-section-title">📈 Rentabilidad del producto</div><div class="dv3-result-row"><span>Costo original</span><strong>${money(x.c)}</strong></div><div class="dv3-result-row"><span>Descuento proveedor</span><strong>${esc(x.scale.label)} (${x.d?'−'+x.d+'%':'0%'})</strong></div><div class="dv3-result-row"><span>Costo real</span><strong>${money(x.net)}</strong></div><div class="dv3-result-row"><span>Margen aplicado</span><strong>${x.m}%</strong></div></div><div class="dv3-result-section"><div class="dv3-result-section-title">💰 Resultado por unidad</div><div class="dv3-result-row"><span>Precio sugerido</span><strong>${money(x.price)}</strong></div><div class="dv3-result-row"><span>Ganancia por unidad</span><strong>${money(x.unitProfit)}</strong></div></div><div class="dv3-result-main"><span>Ganancia estimada · ${x.q} ${x.q===1?'unidad':'unidades'}</span><strong>${money(x.profit)}</strong></div><div class="dv3-result-note">Usá esta vista para saber cuánto te queda por cada producto y cuánto representarían las unidades indicadas.</div>`}};
 const setMode=m=>{mode=m;$('#dv3-mode-buy').classList.toggle('active',m==='buy');$('#dv3-mode-profit').classList.toggle('active',m==='profit');renderCalc()};
 $$('#dv3-cost,#dv3-margin,#dv3-qty').forEach(x=>x.addEventListener('input',renderCalc));$('#dv3-mode-buy').onclick=()=>setMode('buy');$('#dv3-mode-profit').onclick=()=>setMode('profit');renderCalc();
 $('#dv3-save-quote').onclick=()=>{const x=getValues();localStorage.setItem('dv3-last-quote',JSON.stringify({...x,mode,savedAt:new Date().toISOString()}));alert('Cálculo guardado en este dispositivo.');};
 $('#dv3-copy-quote').onclick=async()=>{const x=getValues();const text=mode==='buy'?`Cotización estimada\
Total de la compra\
Cantidad: ${x.q}\
Costo por unidad: ${money(x.c)}\
Precio según cantidad: ${x.scale.label} (${x.d?'−'+x.d+'%':'0%'})\
Costo total de compra: ${money(x.net*x.q)}\
Margen: ${x.m}%\
Precio sugerido por unidad: ${money(x.price)}\
Venta total estimada: ${money(x.total)}\
Ganancia total estimada: ${money(x.profit)}`:`Cotización estimada\
Rentabilidad del producto\
Cantidad: ${x.q}\
Costo original: ${money(x.c)}\
Precio según cantidad: ${x.scale.label} (${x.d?'−'+x.d+'%':'0%'})\
Costo real: ${money(x.net)}\
Margen: ${x.m}%\
Precio sugerido: ${money(x.price)}\
Ganancia por unidad: ${money(x.unitProfit)}\
Ganancia estimada: ${money(x.profit)}`;try{await navigator.clipboard.writeText(text);alert('Resumen copiado.')}catch(e){prompt('Copiá este resumen:',text)}};
 dolar().then(d=>{for(const k of ['blue','oficial']){const x=d[k];const el=$('#dv3-'+k);if(x){el.textContent=money(x.venta);$('#dv3-'+k+'-meta').textContent=`Compra ${money(x.compra)} · Venta ${money(x.venta)} · ${new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}`}else el.textContent='No disponible';}});
 insertBuyerScale();
 updateProductPrices();
 const originalRender=window.render;
 if(typeof originalRender==='function')window.render=function(){originalRender();insertBuyerScale();updateProductPrices()};
 const originalRenderCart=window.renderCart;
 if(typeof originalRenderCart==='function')window.renderCart=function(){originalRenderCart();updateProductPrices();updateCartPrices()};
 document.addEventListener('input',e=>{if(e.target.matches('.qty')){updateProductPrices();setTimeout(updateCartPrices,0)}});
}
function provider(){
 const main=$('.main')||document.body;if(!main)return;
 const box=document.createElement('section');box.className='dv3';box.innerHTML=`<div class="dv3-title">Centro comercial del proveedor</div><p class="dv3-sub">Herramientas para vender el producto y, al mismo tiempo, ofrecerle al comercio información para decidir su compra.</p><div class="dv3-grid"><div class="dv3-card dv3-accent"><h3>💵 Dólar de referencia</h3><div class="dv3-kpi" id="dv3-pblue">Actualizando…</div><p id="dv3-pblue-meta">Referencia para listas y reposición.</p></div><div class="dv3-card"><h3>🎯 Precio por cliente</h3><div class="dv3-kpi">Personalizable</div><p>Asigná margen, descuento y condiciones diferentes a cada comercio.</p></div><div class="dv3-card"><h3>📦 Volumen</h3><div class="dv3-kpi">4 niveles</div><p>Definí descuentos automáticos por cantidad, bulto o monto.</p></div><div class="dv3-card"><h3>📊 Rentabilidad</h3><div class="dv3-kpi" id="dv3-proj">30%</div><p>Simulá cuánto gana el comercio y cuánto margen conserva el proveedor.</p></div></div><div class="dv3-tools" style="margin-top:14px"><div class="dv3-card"><h3>💹 Simulador de precio comercial</h3><div class="dv3-form"><div class="dv3-field"><label>Costo proveedor</label><input id="dv3-pcost" type="number" value="10000" min="0"></div><div class="dv3-field"><label>Margen proveedor (%)</label><input id="dv3-pmargin" type="number" value="20" min="0" max="500"></div><div class="dv3-field"><label>Descuento al comercio (%)</label><input id="dv3-pdiscount" type="number" value="0" min="0" max="100"></div><div class="dv3-field"><label>Margen recomendado para el comercio (%)</label><input id="dv3-cmargin" type="number" value="30" min="0" max="500"></div></div><div class="dv3-result" id="dv3-pcalc"></div></div><div class="dv3-card"><h3>🏷️ Reglas comerciales sugeridas</h3><div class="dv3-pills"><span class="dv3-pill">Cliente nuevo · bienvenida</span><span class="dv3-pill">10+ unidades · volumen</span><span class="dv3-pill">25+ unidades · mayorista</span><span class="dv3-pill">50+ unidades · especial</span><span class="dv3-pill">30 días sin compra · reactivación</span></div><p class="dv3-note">Estas reglas sirven para convertir el portal en un servicio comercial: el distribuidor vende el producto y también le da al comercio herramientas para decidir cuánto comprar y a qué precio vender.</p><div class="dv3-actions"><button class="dv3-btn" id="dv3-export-rules">Guardar reglas</button></div></div></div>`;
 const top=$('.top');top?insertAfter(top,box):main.prepend(box);
 const calc=()=>{const c=+$('#dv3-pcost').value||0,pm=Math.max(0,+$('#dv3-pmargin').value||0),d=Math.min(100,Math.max(0,+$('#dv3-pdiscount').value||0)),cm=Math.max(0,+$('#dv3-cmargin').value||0);const base=c*(1+pm/100),sell=base*(1-d/100),retail=sell*(1+cm/100),provProfit=base-c;$('#dv3-proj').textContent=cm+'%';$('#dv3-pcalc').innerHTML=`Precio de lista: <strong>${money(base)}</strong><br>Precio al comercio: <strong>${money(sell)}</strong><br>Ganancia proveedor: <span class="dv3-green">${money(provProfit)}</span><br>Precio sugerido de reventa: <strong>${money(retail)}</strong><br>Ganancia estimada del comercio: <span class="dv3-green">${money(retail-sell)}</span>`;};
 $$('#dv3-pcost,#dv3-pmargin,#dv3-pdiscount,#dv3-cmargin').forEach(x=>x.addEventListener('input',calc));calc();
 $('#dv3-export-rules').onclick=()=>{localStorage.setItem('dv3-provider-rules',JSON.stringify({savedAt:new Date().toISOString(),levels:[{min:1,max:9,discount:0},{min:10,max:24,discount:2},{min:25,max:49,discount:4},{min:50,max:null,discount:7}]}));alert('Reglas comerciales guardadas en este dispositivo.');};
 dolar().then(d=>{const x=d.blue||d.oficial;const el=$('#dv3-pblue');if(x){el.textContent=money(x.venta);$('#dv3-pblue-meta').textContent=`Compra ${money(x.compra)} · Venta ${money(x.venta)}`}else el.textContent='No disponible';});
}
function boot(){injectStyle();isBuyer?buyer():provider()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
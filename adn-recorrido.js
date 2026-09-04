/* Recorrido "Estrategia y Desarrollo": une los paneles insignia en una secuencia guiada.
   Se incluye con <script src="adn-recorrido.js" defer></script> en cada panel del hub.
   No depende de lucide (usa flechas de texto) y se inserta antes del footer. */
(function(){
  var STEPS=[
    {f:'adn-minero-desarrollo.html', t:'La foto país'},
    {f:'adn-minero-comparador.html', t:'Chile vs. el mundo'},
    {f:'adn-minero-riqueza.html',    t:'¿A dónde va la riqueza?'},
    {f:'adn-minero-valor.html',      t:'Agregar valor'},
    {f:'adn-minero-metas.html',      t:'Metas 2030–2050'},
    {f:'adn-minero-indice.html',     t:'Índice de desarrollo'}
  ];
  var here=(location.pathname||'').replace(/^.*\//,'')||'';
  var i=-1; for(var k=0;k<STEPS.length;k++){ if(STEPS[k].f===here){ i=k; break; } }
  if(i<0) return;
  var wrap=document.querySelector('.wrap'); if(!wrap) return;
  var prev=i>0?STEPS[i-1]:null, next=i<STEPS.length-1?STEPS[i+1]:null;

  var dots=STEPS.map(function(s,idx){
    var bg = idx===i ? '#cf9b6f' : (idx<i ? 'rgba(207,155,111,.42)' : 'rgba(255,255,255,.09)');
    return '<a href="'+s.f+'" title="'+s.t+'" style="flex:1;height:6px;border-radius:999px;background:'+bg+';transition:background .3s"></a>';
  }).join('');

  var el=document.createElement('div');
  el.className='glass rounded-2xl p-4 mt-3';
  el.innerHTML=''+
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">'+
      '<span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#e0c3a0">Recorrido · Estrategia y Desarrollo</span>'+
      '<span style="font-size:11px;color:#9c8f83">Paso '+(i+1)+' de '+STEPS.length+'</span>'+
    '</div>'+
    '<div style="display:flex;gap:5px;margin-bottom:13px">'+dots+'</div>'+
    '<div style="display:flex;align-items:center;gap:10px">'+
      (prev?'<a href="'+prev.f+'" style="flex:none;font-size:12.5px;font-weight:700;color:#9c8f83;text-decoration:none">← '+prev.t+'</a>':'<span></span>')+
      (next
        ?'<a href="'+next.f+'" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#211a15;background:linear-gradient(150deg,#e8c9a6,#cf9b6f);padding:9px 15px;border-radius:999px;text-decoration:none">Siguiente: '+next.t+' →</a>'
        :'<a href="index.html" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#e8c9a6;text-decoration:none">Fin del recorrido · Inicio →</a>')+
    '</div>';

  var foot=null, kids=wrap.children;
  for(var j=kids.length-1;j>=0;j--){ if(kids[j].tagName==='P' && /Inicio/.test(kids[j].innerHTML)){ foot=kids[j]; break; } }
  if(foot) wrap.insertBefore(el, foot); else wrap.appendChild(el);
})();

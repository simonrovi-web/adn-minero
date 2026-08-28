/* ADN UI · pulido de consistencia para los paneles de ADN Minero.
   Se incluye con <script src="adn-ui.js"></script> y NO requiere cambiar el HTML.
   - Scroll suave + barra de scroll consistente (global).
   - Animación de entrada (fade-up) SOLO en bloques bajo el pliegue → sin parpadeo.
   - A prueba de fallos: nunca deja contenido oculto (red de seguridad + try/catch).
   - En paneles-presentación (sin scroll / kiosco) no hace nada. */
(function(){
  'use strict';
  try{
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var css=document.createElement('style'); css.id='adnui-style';
    css.textContent=
      'html{scroll-behavior:smooth}'+
      '::-webkit-scrollbar{width:9px;height:9px}'+
      '::-webkit-scrollbar-track{background:transparent}'+
      '::-webkit-scrollbar-thumb{background:rgba(196,168,148,.26);border-radius:8px}'+
      '::-webkit-scrollbar-thumb:hover{background:rgba(196,168,148,.44)}'+
      '.adnui-rev{opacity:0;transform:translateY(16px);transition:opacity .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1);will-change:opacity,transform}'+
      '.adnui-rev.in{opacity:1;transform:none}';
    (document.head||document.documentElement).appendChild(css);

    function revealAll(){ try{ var a=document.querySelectorAll('.adnui-rev'); for(var i=0;i<a.length;i++) a[i].classList.add('in'); }catch(e){} }

    function run(){
      try{
        var se=document.scrollingElement||document.documentElement;
        var scrollable=(se.scrollHeight - se.clientHeight) > 80;
        if(reduce || !scrollable) return; // kiosco / sin scroll: no animamos
        var vh=window.innerHeight||800;
        var cand=Array.prototype.slice.call(document.querySelectorAll('section, [class*="glass"]'));
        var nodes=[];
        cand.forEach(function(el){
          if(el.closest('#stage')||el.closest('#ov')||el.closest('#ovF')||el.closest('#onb')||el.closest('.leaflet-container')||el.closest('#wincha')) return;
          // evitar anidados: si un ancestro ya es candidato, saltar
          var p=el.parentElement, nested=false;
          while(p){ if(cand.indexOf(p)>=0){ nested=true; break; } p=p.parentElement; }
          if(nested) return;
          var r=el.getBoundingClientRect();
          if(r.height<44) return;
          // SOLO bloques claramente bajo el pliegue → cero parpadeo en lo ya visible
          if(r.top < vh*0.92) return;
          nodes.push(el);
        });
        if(!nodes.length) return;
        nodes.forEach(function(el){ el.classList.add('adnui-rev'); });
        if('IntersectionObserver' in window){
          var io=new IntersectionObserver(function(ents){
            ents.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
          }, {threshold:.08, rootMargin:'0px 0px -5% 0px'});
          nodes.forEach(function(el){ io.observe(el); });
        } else { revealAll(); }
        setTimeout(revealAll, 1800); // red de seguridad
      }catch(e){ revealAll(); }
    }

    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(run,60); });
    else setTimeout(run,60);
    // segunda pasada por si el panel arma su contenido después
    window.addEventListener('load', function(){ setTimeout(run,80); });
  }catch(e){ try{ var a=document.querySelectorAll('.adnui-rev'); for(var i=0;i<a.length;i++) a[i].classList.add('in'); }catch(_){} }
})();

/* ADN UI · pulido de consistencia para los paneles de ADN Minero.
   Se incluye con <script src="adn-ui.js"></script> y NO requiere cambiar el HTML.
   - Scroll suave + barra de scroll consistente (global).
   - Animación de entrada (fade-up) SOLO en bloques bajo el pliegue → sin parpadeo.
   - A prueba de fallos: nunca deja contenido oculto (red de seguridad + try/catch).
   - En paneles-presentación (sin scroll / kiosco) no hace nada. */
(function(){
  'use strict';
  // Registrar el service worker (caché offline de los paneles visitados; también maneja el push)
  try{
    if('serviceWorker' in navigator && location.protocol!=='file:'){
      window.addEventListener('load', function(){ navigator.serviceWorker.register('adn-push-sw.js').catch(function(){}); });
    }
  }catch(e){}

  // ===== Aviso de fuente + disclaimer de seguridad en paneles críticos =====
  try{
    var inFrN=false; try{ inFrN = window.top!==window.self; }catch(e){ inFrN=true; }
    var fileN=(location.pathname||'').replace(/^.*\//,'').toLowerCase();
    var NOTE={
      'adn-minero-semaforo.html':{s:true, src:'Clima: Open-Meteo · Sismos: USGS'},
      'adn-minero-sismos.html':{s:true, src:'USGS Earthquake (monitoreo global)'},
      'adn-minero-panel.html':{s:true, src:'Open-Meteo'},
      'adn-minero-emergencias.html':{s:true, src:'Números de referencia pública'},
      'adn-minero-mar.html':{s:true, src:'Open-Meteo Marine'},
      'adn-minero-faena.html':{s:true, src:'Open-Meteo · USGS'},
      'adn-minero-commodities.html':{s:false, src:'mindicador.cl y datos de mercado'},
      'adn-minero-indicadores.html':{s:false, src:'mindicador.cl'},
      'adn-minero-historico.html':{s:false, src:'mindicador.cl'},
      'adn-minero-bolsa.html':{s:false, src:'Avisos publicados por la comunidad'}
    };
    var cfg=NOTE[fileN];
    if(cfg && !inFrN){
      var mkNote=function(){
        if(!document.body || document.getElementById('adnui-note')) return;
        var n=document.createElement('div'); n.id='adnui-note';
        n.style.cssText='max-width:680px;margin:10px auto 16px;padding:11px 14px;border-radius:12px;'+
          'font:500 11.5px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;'+
          (cfg.s?'background:rgba(224,113,90,.08);border:1px solid rgba(224,113,90,.28);color:#eab6a6;'
                :'background:rgba(196,168,148,.06);border:1px solid rgba(196,168,148,.18);color:#b7a794;');
        n.innerHTML=(cfg.s?'<b style="color:#f0b8a6">⚠️ Información referencial.</b> No reemplaza los sistemas ni protocolos oficiales de seguridad de tu faena. Ante una emergencia, sigue siempre los canales oficiales.<br>':'')+
          '<span style="opacity:.85">Fuente: '+cfg.src+' · Actualización sujeta a la conexión.</span>';
        document.body.appendChild(n);
      };
      if(document.body) mkNote(); else document.addEventListener('DOMContentLoaded', mkNote);
      window.addEventListener('load', mkNote);
    }
  }catch(e){}

  // ===== Asistente IA contextual (botón flotante en todos los paneles) =====
  try{
    var inFrameAi=false; try{ inFrameAi = window.top!==window.self; }catch(e){ inFrameAi=true; }
    if(!inFrameAi && !document.getElementById('adnai-loader')){
      var sc=document.createElement('script'); sc.id='adnai-loader'; sc.src='adn-ai.js'; sc.defer=true;
      (document.head||document.documentElement).appendChild(sc);
    }
  }catch(e){}

  // ===== Métricas propias (privacidad primero) =====
  // Un ping anónimo por sesión/panel. NO envía IP, cookies ni datos personales.
  // Respeta "No rastrear" del navegador y no cuenta si el panel va dentro de un iframe (streaming).
  try{
    var dnt = (navigator.doNotTrack==='1' || window.doNotTrack==='1' || navigator.msDoNotTrack==='1');
    var inFrame = false; try{ inFrame = window.top !== window.self; }catch(e){ inFrame = true; }
    if(!dnt && !inFrame && location.protocol!=='file:'){
      var panel=(location.pathname||'').replace(/^.*\//,'')||'index.html';
      if(/^[a-z0-9-]+\.html$/i.test(panel)){
        var mk='adn_m_'+panel, seen=false;
        try{ seen = sessionStorage.getItem(mk)==='1'; }catch(e){}
        if(!seen){
          try{ sessionStorage.setItem(mk,'1'); }catch(e){}
          var send=function(){
            try{
              var url='https://adn-muro.simonrovi.workers.dev/m', data=JSON.stringify({p:panel});
              if(navigator.sendBeacon){ navigator.sendBeacon(url, new Blob([data],{type:'application/json'})); }
              else{ fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:data,keepalive:true}).catch(function(){}); }
            }catch(e){}
          };
          if(document.readyState==='complete') setTimeout(send,1200);
          else window.addEventListener('load', function(){ setTimeout(send,1200); });
        }
      }
    }
  }catch(e){}

  // ===== Sonido de clic suave y compartido (todos los paneles) =====
  try{
    var AC=null, lastClick=0;
    function adnClick(){
      try{
        if(window.ADN_NO_CLICK_SOUND) return;              // el panel puede desactivarlo
        var now=Date.now(); if(now-lastClick<70) return; lastClick=now;
        AC=AC||new (window.AudioContext||window.webkitAudioContext)();
        if(AC.state==='suspended') AC.resume();
        var t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
        o.type='sine'; o.frequency.setValueAtTime(660,t); o.frequency.exponentialRampToValueAtTime(300,t+.11);
        g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.028,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+.16);
        o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+.17);
      }catch(e){}
    }
    window.adnClick=adnClick;
    // Suena al tocar controles interactivos (no en enlaces que navegan ni en inputs)
    var CLICK_SEL='button, [role="button"], .role, .mat, .hcard, .cattile, .item, .chip, .tile, .lg-row, .catchip, .cell, [data-i], [data-k]';
    document.addEventListener('click', function(e){
      try{
        var el=e.target.closest && e.target.closest(CLICK_SEL);
        if(!el || el.matches('input,textarea,select')) return;
        adnClick();
      }catch(_){}
    }, true);
  }catch(e){}
  // ===== Modo faena (texto grande / contraste) + indicador sin conexión =====
  try{
    var a11y=document.createElement('style'); a11y.id='adnui-a11y';
    a11y.textContent=
      'html.adn-faena{font-size:118%}'+
      'html.adn-faena .text-stone-400, html.adn-faena .text-stone-500{color:#cfbdad!important}'+
      '#adnui-offline{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:99999;'+
      'background:linear-gradient(160deg,#3a2a22,#2a1d17);color:#f0d7b6;border:1px solid rgba(224,163,90,.5);border-radius:999px;'+
      'padding:7px 15px;font:600 12.5px/1 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);display:none}'+
      '#adnui-offline.on{display:block}'+
      // Accesibilidad: foco de teclado visible en controles interactivos
      'a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible,[role="button"]:focus-visible{outline:2px solid #e0a35a;outline-offset:2px;border-radius:6px}';
    (document.head||document.documentElement).appendChild(a11y);
    try{ if(localStorage.getItem('adn_faena_mode')==='1') document.documentElement.classList.add('adn-faena'); }catch(e){}
    var mount=function(){
      if(document.getElementById('adnui-offline')||!document.body) return;
      var off=document.createElement('div'); off.id='adnui-offline'; off.textContent='📡 Sin conexión · mostrando lo guardado';
      document.body.appendChild(off);
      var upd=function(){ try{ off.classList.toggle('on', navigator.onLine===false); }catch(e){} };
      window.addEventListener('online',upd); window.addEventListener('offline',upd); upd();
    };
    if(document.body) mount(); else document.addEventListener('DOMContentLoaded',mount);
  }catch(e){}

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

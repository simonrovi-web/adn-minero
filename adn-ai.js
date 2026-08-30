/* ADN IA · Asistente contextual flotante para TODOS los paneles de ADN Minero.
   Lo carga adn-ui.js automáticamente. Muestra un botón "✨ Pregúntale a ADN"
   que abre un mini-chat ya sembrado con el TEMA del panel donde está el usuario.
   Usa el mismo backend gratuito (Workers AI / Llama 3.3) del panel ADN Minero IA.
   - No se muestra dentro de iframes (streaming) ni en el propio panel de IA. */
(function(){
  'use strict';
  try{
    // ---- No mostrar en ciertos contextos ----
    var inFrame=false; try{ inFrame = window.top!==window.self; }catch(e){ inFrame=true; }
    if(inFrame) return;
    var file=(location.pathname||'').replace(/^.*\//,'').toLowerCase();
    var SKIP=['adn-minero-ia.html','adn-minero-metricas.html'];
    if(SKIP.indexOf(file)>=0) return;
    if(/^(wincha|paneles-stream|secuencia|noticias-stream|wincha-auto)/.test(file)) return;
    if(document.getElementById('adnai-fab')) return; // ya montado

    var WORKER_URL='https://adn-minero-ia.simonrovi.workers.dev';
    var FULL_URL='adn-minero-ia.html';

    // Paneles de datos/cifras: el botón se enfoca en "explicar las cifras"
    var DATA_PANELS=['adn-minero-aporte-fiscal.html','adn-minero-royalty.html','adn-minero-produccion.html',
      'adn-minero-indicadores.html','adn-minero-commodities.html','adn-minero-cuenta-publica.html',
      'adn-minero-cartera.html','adn-minero-historico.html','adn-minero-chile-mundo.html'];
    var isData=DATA_PANELS.indexOf(file)>=0;

    // ---- Tema del panel (para sembrar el contexto) ----
    function tema(){
      var t=(document.title||'').replace(/ADN\s*Minero\s*[·|:–-]?\s*/i,'').trim();
      if(!t || /^ADN\s*Minero$/i.test(document.title||'')){
        var h=document.querySelector('h1,[class*="uppercase"]');
        t=h?h.textContent.trim().slice(0,60):'';
      }
      return t || 'la minería de Chile';
    }
    var TEMA=tema();

    // ---- Estilos (aislados) ----
    var css=document.createElement('style'); css.id='adnai-css';
    css.textContent=
      '#adnai-fab{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;'+
        'display:inline-flex;align-items:center;gap:8px;padding:11px 15px;border-radius:999px;cursor:pointer;'+
        'font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:#211a15;border:0;'+
        'background:linear-gradient(150deg,#e8c9a6,#cf9b6f);box-shadow:0 8px 26px rgba(0,0,0,.45),0 0 0 1px rgba(232,201,166,.4);'+
        'transition:transform .15s ease, box-shadow .15s ease}'+
      '#adnai-fab:hover{transform:translateY(-1px)}#adnai-fab:active{transform:scale(.97)}'+
      '#adnai-fab .sp{font-size:15px;line-height:1}'+
      '@media(max-width:380px){#adnai-fab .lbl{display:none}}'+
      '#adnai-back{position:fixed;inset:0;z-index:2147483001;background:rgba(10,8,7,.55);backdrop-filter:blur(3px);'+
        'opacity:0;pointer-events:none;transition:opacity .22s ease}'+
      '#adnai-back.on{opacity:1;pointer-events:auto}'+
      '#adnai-sheet{position:fixed;left:50%;bottom:0;transform:translate(-50%,102%);z-index:2147483002;'+
        'width:100%;max-width:560px;max-height:82vh;display:flex;flex-direction:column;'+
        'background:linear-gradient(180deg,#221b16,#181310);color:#f4ece5;'+
        'border:1px solid rgba(196,168,148,.2);border-bottom:0;border-radius:20px 20px 0 0;'+
        'box-shadow:0 -14px 50px rgba(0,0,0,.55);transition:transform .28s cubic-bezier(.2,.8,.2,1);'+
        'font-family:system-ui,-apple-system,"Segoe UI",sans-serif}'+
      '#adnai-sheet.on{transform:translate(-50%,0)}'+
      '#adnai-head{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid rgba(196,168,148,.14)}'+
      '#adnai-head .ic{width:34px;height:34px;border-radius:10px;flex:none;display:grid;place-items:center;'+
        'background:rgba(207,155,111,.16);border:1px solid rgba(207,155,111,.35);font-size:17px}'+
      '#adnai-head .ti{font-weight:800;font-size:14px}'+
      '#adnai-head .su{font-size:11px;color:#b7a794;margin-top:1px}'+
      '#adnai-x{margin-left:auto;background:rgba(255,255,255,.06);border:0;color:#e8dccb;width:32px;height:32px;'+
        'border-radius:9px;cursor:pointer;font-size:17px;line-height:1}'+
      '#adnai-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}'+
      '.adnai-b{max-width:86%;padding:9px 12px;border-radius:14px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}'+
      '.adnai-b.u{align-self:flex-end;background:linear-gradient(150deg,#cf9b6f,#b5824f);color:#1c140d;border-bottom-right-radius:5px}'+
      '.adnai-b.a{align-self:flex-start;background:rgba(255,255,255,.05);border:1px solid rgba(196,168,148,.14);border-bottom-left-radius:5px}'+
      '.adnai-b.a.think{color:#b7a794;font-style:italic}'+
      '#adnai-chips{display:flex;gap:7px;flex-wrap:wrap;padding:0 16px 4px}'+
      '.adnai-chip{font:600 12px/1 system-ui;padding:8px 12px;border-radius:999px;cursor:pointer;'+
        'background:rgba(232,201,166,.08);border:1px solid rgba(196,168,148,.24);color:#e8c9a6}'+
      '#adnai-foot{display:flex;gap:8px;align-items:flex-end;padding:10px 14px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(196,168,148,.14)}'+
      '#adnai-in{flex:1;resize:none;max-height:104px;background:#2a221c;color:#f4ece5;border:1px solid rgba(196,168,148,.25);'+
        'border-radius:13px;padding:10px 12px;font:400 14px/1.4 system-ui;outline:none}'+
      '#adnai-in:focus{border-color:rgba(207,155,111,.6)}'+
      '#adnai-send{flex:none;width:42px;height:42px;border-radius:12px;border:0;cursor:pointer;color:#1c140d;'+
        'background:linear-gradient(150deg,#e8c9a6,#cf9b6f);font-size:18px;display:grid;place-items:center}'+
      '#adnai-send:disabled{opacity:.5;cursor:default}'+
      '#adnai-open-full{display:block;text-align:center;font-size:11px;color:#b7a794;text-decoration:none;padding:2px 0 8px}'+
      '#adnai-open-full b{color:#e8c9a6}';
    (document.head||document.documentElement).appendChild(css);

    // ---- FAB ----
    var fab=document.createElement('button'); fab.id='adnai-fab'; fab.type='button';
    fab.setAttribute('aria-label', isData?'Explícame las cifras de este panel con IA':'Pregúntale a la IA sobre este panel');
    fab.innerHTML=isData?'<span class="sp">🧮</span><span class="lbl">Explica las cifras</span>':'<span class="sp">✨</span><span class="lbl">Pregúntale a ADN</span>';

    // ---- Sheet ----
    var back=document.createElement('div'); back.id='adnai-back';
    var sheet=document.createElement('div'); sheet.id='adnai-sheet';
    sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-label','Asistente ADN Minero IA');
    sheet.innerHTML=
      '<div id="adnai-head">'+
        '<div class="ic">✨</div>'+
        '<div style="min-width:0"><div class="ti">ADN Minero IA</div><div class="su" id="adnai-topic"></div></div>'+
        '<button id="adnai-x" type="button" aria-label="Cerrar">✕</button>'+
      '</div>'+
      '<div id="adnai-msgs"></div>'+
      '<div id="adnai-chips"></div>'+
      '<div id="adnai-foot">'+
        '<textarea id="adnai-in" rows="1" placeholder="Escribe o habla tu pregunta…" autocomplete="off"></textarea>'+
        '<button id="adnai-mic" type="button" aria-label="Hablar" style="flex:none;width:42px;height:42px;border-radius:12px;border:0;cursor:pointer;background:rgba(207,155,111,.16);color:#e8c9a6;display:grid;place-items:center;font-size:18px">🎤</button>'+
        '<button id="adnai-send" type="button" aria-label="Enviar">➤</button>'+
      '</div>'+
      '<a id="adnai-open-full" href="'+FULL_URL+'">Abrir el chat completo · <b>ADN Minero IA</b></a>';

    function mount(){
      if(!document.body || document.getElementById('adnai-fab')) return;
      document.body.appendChild(fab); document.body.appendChild(back); document.body.appendChild(sheet);
      sheet.querySelector('#adnai-topic').textContent='sobre: '+TEMA;
      wire();
    }

    // ---- Lógica del chat ----
    var msgsEl, inEl, sendEl, chipsEl, busy=false, started=false, primed=false;
    // El backend ya tiene su propio system prompt de minería; el contexto del panel
    // se inyecta como "primer" del usuario (más fiable que un 2º mensaje de sistema).
    var history=[];
    var CHIPS=isData
      ? ['Explícame estas cifras en simple','¿Qué significa esto para mí?','¿De dónde salen estos datos?']
      : ['¿De qué trata este panel?','Explícalo simple','Dame un dato curioso'];

    // Texto visible del encabezado del panel, para aterrizar el contexto (se calcula 1 vez).
    var _snip=null;
    function snippet(){
      if(_snip!==null) return _snip;
      try{
        var t;
        if(isData){ // en paneles de datos, incluir más texto para capturar las cifras visibles
          t=(document.body?document.body.innerText:'')||'';
          _snip=t.replace(/\s+/g,' ').trim().slice(0,650);
        } else {
          var h=document.querySelector('header'); t=h?(h.innerText||h.textContent||''):'';
          if(!t || t.length<20){ t=(document.body?document.body.innerText:'')||''; }
          _snip=t.replace(/\s+/g,' ').trim().slice(0,240);
        }
      }catch(e){ _snip=''; }
      return _snip;
    }
    function prime(){
      if(primed) return; primed=true;
      var sn=snippet();
      var ctx='Estoy usando la app ADN Minero (el medio de comunicación de la minería chilena) y viendo el panel «'+TEMA+'».'+
        (sn?' Contenido visible del panel: "'+sn+'".':'')+
        ' Responde en español de Chile, breve y claro, enfocado en la minería y en este panel. '+
        'No des recomendaciones de inversión financiera; si algo no es de minería, redirígelo con amabilidad; puedes equivocarte.';
      history.push({role:'user', content:ctx});
      history.push({role:'assistant', content:'Entendido, ¿qué quieres saber sobre «'+TEMA+'»?'});
    }

    function bubble(role, text){
      var b=document.createElement('div'); b.className='adnai-b '+(role==='user'?'u':'a');
      b.textContent=text||''; msgsEl.appendChild(b); msgsEl.scrollTop=msgsEl.scrollHeight; return b;
    }
    function open(){
      back.classList.add('on'); sheet.classList.add('on');
      if(!started){ started=true; renderChips(); bubble('assistant', isData?('Puedo explicarte las cifras de «'+TEMA+'» en simple. Toca una sugerencia o pregúntame. 🧮'):('¡Hola! Pregúntame lo que quieras sobre «'+TEMA+'» o la minería. 👷')); }
      setTimeout(function(){ try{ inEl.focus(); }catch(e){} }, 300);
    }
    function close(){ back.classList.remove('on'); sheet.classList.remove('on'); }
    function pageText(){ try{ var t=(document.body?document.body.innerText:'')||''; return t.replace(/\s+/g,' ').trim().slice(0,1600); }catch(e){ return snippet(); } }
    function translate(){
      send('🌐 Traducir esta página al inglés', 'Translate the following content of the ADN Minero app (a Chilean mining media outlet) into clear, natural English. Return only the translation, no comments:\n\n'+pageText());
    }
    function renderChips(){
      chipsEl.innerHTML='';
      CHIPS.forEach(function(c){
        var el=document.createElement('button'); el.type='button'; el.className='adnai-chip'; el.textContent=c;
        el.addEventListener('click', function(){ send(c); });
        chipsEl.appendChild(el);
      });
      var tr=document.createElement('button'); tr.type='button'; tr.className='adnai-chip'; tr.textContent='🌐 English';
      tr.style.cssText='background:rgba(103,193,214,.1);border-color:rgba(103,193,214,.3);color:#9ad3e0';
      tr.addEventListener('click', translate);
      chipsEl.appendChild(tr);
    }
    function autoGrow(){ inEl.style.height='auto'; inEl.style.height=Math.min(104, inEl.scrollHeight)+'px'; }

    async function send(text, payload){
      text=(text||inEl.value||'').trim(); if(!text || busy) return;
      chipsEl.innerHTML=''; inEl.value=''; autoGrow();
      prime();
      bubble('user', text);
      history.push({role:'user', content: payload||text});
      busy=true; sendEl.disabled=true;
      var b=bubble('assistant',''); b.classList.add('think'); b.textContent='pensando…';
      try{
        var res=await fetch(WORKER_URL,{ method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ messages: history.slice(-13) }) });
        if(!res.ok){
          var m='La IA no está disponible ahora. Intenta de nuevo en un rato.';
          try{ var j=await res.json(); if(j&&j.error) m=j.error; }catch(e){}
          b.classList.remove('think'); b.textContent=m; busy=false; sendEl.disabled=false; return;
        }
        var reader=res.body.getReader(), dec=new TextDecoder(), buf='', acc='';
        b.classList.remove('think'); b.textContent='';
        while(true){
          var r=await reader.read(); if(r.done) break;
          buf+=dec.decode(r.value,{stream:true});
          var lines=buf.split('\n'); buf=lines.pop();
          for(var i=0;i<lines.length;i++){
            var l=lines[i].trim(); if(l.indexOf('data:')!==0) continue;
            var d=l.slice(5).trim(); if(d==='[DONE]') continue;
            try{ var jj=JSON.parse(d); if(jj.response){ acc+=jj.response; b.textContent=acc; msgsEl.scrollTop=msgsEl.scrollHeight; } }catch(e){}
          }
        }
        if(!acc){ b.textContent='(sin respuesta, intenta reformular)'; }
        history.push({role:'assistant', content:acc||''});
      }catch(e){
        b.classList.remove('think'); b.textContent='No se pudo conectar. Revisa tu conexión e intenta de nuevo.';
      }
      busy=false; sendEl.disabled=false;
      try{ inEl.focus(); }catch(e){}
    }

    function wire(){
      msgsEl=sheet.querySelector('#adnai-msgs'); inEl=sheet.querySelector('#adnai-in');
      sendEl=sheet.querySelector('#adnai-send'); chipsEl=sheet.querySelector('#adnai-chips');
      fab.addEventListener('click', open);
      sheet.querySelector('#adnai-x').addEventListener('click', close);
      back.addEventListener('click', close);
      sendEl.addEventListener('click', function(){ send(); });
      // Micrófono (voz a texto)
      var micEl=sheet.querySelector('#adnai-mic'), vh=null, listn=false;
      if(micEl){ micEl.addEventListener('click', function(){
        if(!window.adnVoice) return;
        if(listn && vh){ vh.stop(); return; }
        vh=window.adnVoice(function(t){ if(t){ inEl.value=(inEl.value?inEl.value+' ':'')+t; autoGrow(); try{ inEl.focus(); }catch(e){} } }, {
          onstart:function(){ listn=true; micEl.textContent='⏹'; micEl.style.background='rgba(224,90,63,.25)'; },
          onthinking:function(){ micEl.textContent='…'; },
          onend:function(){ listn=false; micEl.textContent='🎤'; micEl.style.background='rgba(207,155,111,.16)'; },
          onerror:function(){ listn=false; micEl.textContent='🎤'; micEl.style.background='rgba(207,155,111,.16)'; }
        });
      }); }
      inEl.addEventListener('input', autoGrow);
      inEl.addEventListener('keydown', function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape' && sheet.classList.contains('on')) close(); });
    }

    if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  }catch(e){}
})();

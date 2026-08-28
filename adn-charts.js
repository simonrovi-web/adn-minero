/* ADN Charts · mini-librería de gráficas para ADN Minero
   Sin dependencias. Barras, línea/área y donut, con degradados,
   grid suave, números que suben animados y tooltips.
   Uso:
     ADNChart.bars('chart', [{l:'Hoy', v:17}], {unit:'%', accent:'#e08aa8'})
     ADNChart.area('serie', [{l:'2020', v:3.1}], {prefix:'US$ ', decimals:2})
     ADNChart.donut('anillo', [{l:'China', v:54, color:'#e0715a'}], {sub:'del cobre'})
*/
(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  let uid=0;

  // ---- helpers ----
  const el=(x)=> typeof x==='string' ? document.getElementById(x) : x;
  function hexToRgb(h){ h=(h||'').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h||'cf9b6f',16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
  function lighten(hex,amt){ const c=hexToRgb(hex); const m=v=>Math.round(v+(255-v)*amt); return `rgb(${m(c.r)},${m(c.g)},${m(c.b)})`; }
  function rgba(hex,a){ const c=hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
  const easeOut = t => 1-Math.pow(1-t,3);

  // ---- estilos + tooltip (una sola vez) ----
  let TIP=null;
  function ensureBase(){
    if(document.getElementById('adnc-style')) { TIP=document.getElementById('adnc-tip'); return; }
    const st=document.createElement('style'); st.id='adnc-style';
    st.textContent=`
      .adnc{ width:100%; display:block; }
      .adnc *{ font-family:inherit; }
      .adnc .grow{ transform:scaleY(0); transform-box:fill-box; transform-origin:bottom; transition:transform 1s cubic-bezier(.22,.85,.25,1); }
      .adnc.on .grow{ transform:scaleY(1); }
      .adnc .draw{ transition:stroke-dashoffset 1.15s cubic-bezier(.3,.7,.2,1); }
      .adnc .fadein{ opacity:0; transition:opacity .5s ease .5s; }
      .adnc.on .fadein{ opacity:1; }
      .adnc .arc{ transition:stroke-dashoffset 1.1s cubic-bezier(.3,.7,.2,1); }
      .adnc .hit{ cursor:pointer; }
      .adnc .dotp{ transform-box:fill-box; transform-origin:center; }
      .adnc.on .dotp{ animation:adncPulse 1.8s ease-in-out infinite; }
      @keyframes adncPulse{ 0%,100%{opacity:1} 50%{opacity:.45} }
      #adnc-tip{ position:fixed; z-index:9999; pointer-events:none; opacity:0; transform:translate(-50%,-8px);
        background:linear-gradient(160deg,#2b2520,#1c1714); color:#f4ece5; border:1px solid rgba(196,168,148,.28);
        border-radius:10px; padding:7px 11px; font-size:12.5px; font-weight:600; line-height:1.35;
        box-shadow:0 10px 30px rgba(0,0,0,.5); transition:opacity .12s ease; white-space:nowrap; font-variant-numeric:tabular-nums; }
      #adnc-tip b{ color:#fff; }
      #adnc-tip .s{ color:#c9a888; font-weight:500; }
    `;
    document.head.appendChild(st);
    TIP=document.createElement('div'); TIP.id='adnc-tip'; document.body.appendChild(TIP);
  }
  function showTip(html, x, y){ TIP.innerHTML=html; TIP.style.left=x+'px'; TIP.style.top=(y-14)+'px'; TIP.style.opacity='1'; }
  function hideTip(){ if(TIP) TIP.style.opacity='0'; }

  function svgEl(tag,attrs){ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function fmt(v, o){ const d=o.decimals||0; let s=Number(v).toLocaleString('es-CL',{minimumFractionDigits:d, maximumFractionDigits:d}); return (o.prefix||'')+s+(o.unit||''); }

  function whenVisible(node, cb){
    let ran=false; const go=()=>{ if(ran) return; ran=true; cb(); };
    if(!('IntersectionObserver' in window)){ go(); return; }
    const io=new IntersectionObserver((ents)=>{ ents.forEach(en=>{ if(en.isIntersecting){ go(); io.disconnect(); } }); }, {threshold:.2});
    io.observe(node);
    setTimeout(()=>{ go(); io.disconnect(); }, 1300); // respaldo si nunca intersecta
  }
  function countUp(textNode, to, o){
    const dur=1000, t0=performance.now(); let done=false;
    function step(now){ const p=Math.min(1,(now-t0)/dur); textNode.textContent=fmt(to*easeOut(p), o); if(p<1 && !done) requestAnimationFrame(step); else done=true; }
    requestAnimationFrame(step);
    // Respaldo: si rAF está limitado (pestaña oculta / sin compositar), fija el valor final
    setTimeout(()=>{ if(!done){ done=true; textNode.textContent=fmt(to,o); } }, dur+120);
  }

  // ================= BARRAS =================
  function bars(target, data, opts){
    ensureBase(); const host=el(target); if(!host||!data||!data.length) return;
    const o=opts||{}; const id=++uid;
    const accent=o.accent||'#cf9b6f';
    const max=o.max || Math.max.apply(null, data.map(d=>d.v))*1.15 || 1;
    const W=Math.max(300, data.length*80), H=o.height||220;
    const padT=30, padB=32, padX=14, plot=H-padT-padB, base=H-padB;
    const n=data.length, bw=Math.min(56, (W-padX*2)/n*0.62), gap=(W-padX*2-bw*n)/Math.max(1,n-1);

    const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`, class:'adnc', preserveAspectRatio:'xMidYMid meet', style:`max-width:${W}px;margin:0 auto`});
    const defs=svgEl('defs',{});
    // grid
    const g=svgEl('g',{});
    for(let i=0;i<=4;i++){ const y=padT+plot*i/4; g.appendChild(svgEl('line',{x1:padX,y1:y,x2:W-padX,y2:y,stroke:'rgba(255,255,255,.06)','stroke-width':1})); }
    g.appendChild(svgEl('line',{x1:padX,y1:base,x2:W-padX,y2:base,stroke:'rgba(255,255,255,.14)','stroke-width':1}));
    svg.appendChild(g);

    data.forEach((d,i)=>{
      const col=d.color||accent, gid=`adncb${id}_${i}`;
      const grad=svgEl('linearGradient',{id:gid,x1:0,y1:0,x2:0,y2:1});
      grad.appendChild(svgEl('stop',{offset:'0%','stop-color':lighten(col,.28)}));
      grad.appendChild(svgEl('stop',{offset:'100%','stop-color':col}));
      defs.appendChild(grad);
      const x=padX+i*(bw+gap), full=Math.max(2, plot*(d.v/max)), y=base-full, r=Math.min(8,bw/2);
      const path=`M${x},${base} L${x},${y+r} Q${x},${y} ${x+r},${y} L${x+bw-r},${y} Q${x+bw},${y} ${x+bw},${y+r} L${x+bw},${base} Z`;
      const grp=svgEl('g',{class:'grow',style:`transition-delay:${i*90}ms`});
      grp.appendChild(svgEl('path',{d:path, fill:`url(#${gid})`, filter:`drop-shadow(0 3px 8px ${rgba(col,.35)})`}));
      svg.appendChild(grp);
      // valor (cuenta sola)
      const val=svgEl('text',{x:x+bw/2,y:y-8,'text-anchor':'middle',fill:'#f4ece5','font-size':14,'font-weight':800,class:'fadein',style:'font-variant-numeric:tabular-nums'});
      val.textContent=fmt(0,o); val._to=d.v; svg.appendChild(val);
      // etiqueta
      const lab=svgEl('text',{x:x+bw/2,y:H-10,'text-anchor':'middle',fill:'#a99e92','font-size':12}); lab.textContent=d.l; svg.appendChild(lab);
      // hit + tooltip
      const hit=svgEl('rect',{x:x-gap/2,y:padT,width:bw+gap,height:plot+padB,fill:'transparent',class:'hit'});
      hit.addEventListener('pointerenter',ev=>showTip(`<b>${fmt(d.v,o)}</b> <span class="s">${d.l}</span>`, ev.clientX, ev.clientY));
      hit.addEventListener('pointermove',ev=>showTip(`<b>${fmt(d.v,o)}</b> <span class="s">${d.l}</span>`, ev.clientX, ev.clientY));
      hit.addEventListener('pointerleave',hideTip);
      svg.appendChild(hit);
    });
    svg.insertBefore(defs, svg.firstChild);
    host.innerHTML=''; host.appendChild(svg);
    whenVisible(host, ()=>{ svg.classList.add('on'); svg.querySelectorAll('text.fadein').forEach(t=>countUp(t,t._to,o)); });
  }

  // ================= LÍNEA / ÁREA =================
  function area(target, data, opts){
    ensureBase(); const host=el(target); if(!host||!data||!data.length) return;
    const o=opts||{}; const id=++uid; const accent=o.accent||'#cf9b6f';
    const W=Math.max(320,data.length*64), H=o.height||220, padT=24, padB=30, padX=16;
    const plot=H-padT-padB, base=H-padB;
    const vals=data.map(d=>d.v); const mx=o.max||Math.max.apply(null,vals), mn=o.min!=null?o.min:Math.min.apply(null,vals);
    const span=(mx-mn)||1;
    const X=i=> padX + (W-padX*2)*(i/Math.max(1,data.length-1));
    const Y=v=> base - plot*((v-mn)/span);
    const gid=`adnca${id}`, gida=`adncf${id}`;

    const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,class:'adnc',preserveAspectRatio:'xMidYMid meet',style:`max-width:${W}px;margin:0 auto`});
    const defs=svgEl('defs',{});
    const lg=svgEl('linearGradient',{id:gid,x1:0,y1:0,x2:1,y2:0});
    lg.appendChild(svgEl('stop',{offset:'0%','stop-color':lighten(accent,.25)}));
    lg.appendChild(svgEl('stop',{offset:'100%','stop-color':accent}));
    const fg=svgEl('linearGradient',{id:gida,x1:0,y1:0,x2:0,y2:1});
    fg.appendChild(svgEl('stop',{offset:'0%','stop-color':rgba(accent,.35)}));
    fg.appendChild(svgEl('stop',{offset:'100%','stop-color':rgba(accent,0)}));
    defs.appendChild(lg); defs.appendChild(fg); svg.appendChild(defs);
    // grid
    for(let i=0;i<=4;i++){ const y=padT+plot*i/4; svg.appendChild(svgEl('line',{x1:padX,y1:y,x2:W-padX,y2:y,stroke:'rgba(255,255,255,.06)','stroke-width':1})); }

    let dLine='', dArea='';
    data.forEach((d,i)=>{ const x=X(i),y=Y(d.v); dLine+=(i?'L':'M')+x+','+y+' '; });
    dArea=dLine+`L${X(data.length-1)},${base} L${X(0)},${base} Z`;
    svg.appendChild(svgEl('path',{d:dArea,fill:`url(#${gida})`,class:'fadein'}));
    const line=svgEl('path',{d:dLine,fill:'none',stroke:`url(#${gid})`,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round',class:'draw'});
    svg.appendChild(line);
    // etiquetas x (primera, media, última)
    [0, Math.floor((data.length-1)/2), data.length-1].filter((v,i,a)=>a.indexOf(v)===i).forEach(i=>{
      svg.appendChild(Object.assign(svgEl('text',{x:X(i),y:H-9,'text-anchor':i===0?'start':(i===data.length-1?'end':'middle'),fill:'#a99e92','font-size':11}),{textContent:data[i].l}));
    });
    // puntos + tooltip
    data.forEach((d,i)=>{ const x=X(i),y=Y(d.v);
      const c=svgEl('circle',{cx:x,cy:y,r:4.5,fill:'#1c1714',stroke:accent,'stroke-width':2.5,class:'hit'+(i===data.length-1?' dotp':'')});
      c.addEventListener('pointerenter',ev=>showTip(`<b>${fmt(d.v,o)}</b> <span class="s">${d.l}</span>`,ev.clientX,ev.clientY));
      c.addEventListener('pointermove',ev=>showTip(`<b>${fmt(d.v,o)}</b> <span class="s">${d.l}</span>`,ev.clientX,ev.clientY));
      c.addEventListener('pointerleave',hideTip); svg.appendChild(c);
    });
    host.innerHTML=''; host.appendChild(svg);
    const len=line.getTotalLength ? line.getTotalLength() : W;
    line.style.strokeDasharray=len; line.style.strokeDashoffset=len;
    whenVisible(host, ()=>{ svg.classList.add('on'); line.style.strokeDashoffset='0'; });
  }

  // ================= DONUT =================
  function donut(target, segs, opts){
    ensureBase(); const host=el(target); if(!host||!segs||!segs.length) return;
    const o=opts||{}; const S=180, cx=S/2, cy=S/2, rad=70, circ=2*Math.PI*rad;
    const total=o.total||segs.reduce((a,b)=>a+b.v,0);
    const palette=['#cf9b6f','#e0715a','#7fb0d9','#7fbf9a','#d6a94f','#e08aa8','#5fd1bd','#a7d18a'];

    const wrap=document.createElement('div'); wrap.style.cssText='display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:center';
    const svg=svgEl('svg',{viewBox:`0 0 ${S} ${S}`,class:'adnc',width:S,height:S,style:'flex:0 0 auto;max-width:190px'});
    svg.appendChild(svgEl('circle',{cx,cy,r:rad,fill:'none',stroke:'rgba(255,255,255,.06)','stroke-width':22}));
    let acc=0;
    segs.forEach((s,i)=>{ const col=s.color||palette[i%palette.length]; const frac=s.v/total;
      const arc=svgEl('circle',{cx,cy,r:rad,fill:'none',stroke:col,'stroke-width':22,'stroke-linecap':'round',
        'stroke-dasharray':circ, 'stroke-dashoffset':circ, class:'arc',
        transform:`rotate(${-90+acc*360} ${cx} ${cy})`, style:`transition-delay:${i*140}ms`, 'data-off':circ*(1-frac)});
      arc.addEventListener('pointerenter',ev=>showTip(`<b>${fmt(s.v,o)}</b> <span class="s">${s.l}</span>`,ev.clientX,ev.clientY));
      arc.addEventListener('pointermove',ev=>showTip(`<b>${fmt(s.v,o)}</b> <span class="s">${s.l}</span>`,ev.clientX,ev.clientY));
      arc.addEventListener('pointerleave',hideTip);
      arc.classList.add('hit'); svg.appendChild(arc); acc+=frac;
    });
    // centro
    const big=o.center!=null?o.center:fmt(segs[0].v,o);
    const cT=svgEl('text',{x:cx,y:cy-2,'text-anchor':'middle',fill:'#f4ece5','font-size':26,'font-weight':800,style:'font-variant-numeric:tabular-nums'}); cT.textContent=big;
    const cS=svgEl('text',{x:cx,y:cy+18,'text-anchor':'middle',fill:'#a99e92','font-size':12}); cS.textContent=o.sub||segs[0].l;
    svg.appendChild(cT); svg.appendChild(cS);

    // leyenda
    const leg=document.createElement('div'); leg.style.cssText='display:flex;flex-direction:column;gap:7px;min-width:0';
    segs.forEach((s,i)=>{ const col=s.color||palette[i%palette.length];
      const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px;font-size:13px';
      row.innerHTML=`<span style="width:11px;height:11px;border-radius:3px;background:${col};box-shadow:0 0 6px ${rgba(col,.6)};flex:0 0 auto"></span><span style="color:#d8ccc0"><b style="color:#f4ece5">${fmt(s.v,o)}</b> · ${s.l}</span>`;
      leg.appendChild(row);
    });
    wrap.appendChild(svg); wrap.appendChild(leg);
    host.innerHTML=''; host.appendChild(wrap);
    whenVisible(host, ()=>{ svg.classList.add('on'); svg.querySelectorAll('.arc').forEach(a=>{ a.style.strokeDashoffset=a.getAttribute('data-off'); }); });
  }

  window.ADNChart={ bars, area, donut };
})();

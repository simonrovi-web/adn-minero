/* Cifras país de ADN Minero — FUENTE ÚNICA.
   Para actualizar los números del medio, editar SOLO este archivo y subir la fecha.
   Los paneles (dashboard, etc.) las leen desde aquí y muestran "Cifras actualizadas". */
window.ADN_DATOS = {
  actualizado: "2026-09-04",                 // YYYY-MM-DD · subir en cada revisión de cifras
  fuentes: "Banco Central, Cochilco, Consejo Minero, Ministerio de Minería",
  // KPIs de la "foto país" (dashboard El Cobre y el Desarrollo)
  kpis: [
    { ic:"mountain",  c:"#cf9b6f", vc:"#e8c9a6", lab:"Producción de cobre", v:"≈5,3", u:" Mt/año", nota:"1º del mundo · ≈24% del cobre global" },
    { ic:"pie-chart", c:"#7fbf9a", vc:"#a7d18a", lab:"Peso en el PIB",       v:"10–15", u:" %",     nota:"Según el año y el precio del cobre" },
    { ic:"ship",      c:"#7fb0d9", vc:"#a7c6de", lab:"De las exportaciones", v:"≈60",  u:" %",      nota:"El cobre solo, ≈50%" },
    { ic:"landmark",  c:"#d6a94f", vc:"#e8c9a6", lab:"Aporte fiscal 2026",   v:"US$12.458", u:" M", link:"adn-minero-aporte-fiscal.html", linkTxt:"Ver detalle →" },
    { ic:"users",     c:"#e0955f", vc:"#e8c9a6", lab:"Empleo directo",       v:"≈270", u:" mil",    nota:"Más el empleo indirecto que arrastra" },
    { ic:"hard-hat",  c:"#c9a888", vc:"#e8c9a6", lab:"Cartera 2025–2034",    v:"US$104.549", u:" M", link:"adn-minero-cartera.html", linkTxt:"Ver proyectos →" }
  ],
  // Otras cifras reutilizables (para migrar más paneles a esta fuente)
  comunasRoyalty: 309,
  reservasCobrePct: 19,
  litioReservasPct: 33
};

/* Rellena automáticamente cualquier elemento con [data-datos-sello] con la fecha + fuentes. */
(function(){
  function sello(){
    try{
      var D=window.ADN_DATOS; if(!D) return;
      var d=new Date(D.actualizado+'T12:00:00');
      var mes=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];
      var html='📅 Cifras actualizadas: <b style="color:#c9bcae">'+d.getDate()+' '+mes+' '+d.getFullYear()+'</b> · Fuentes: '+D.fuentes;
      var els=document.querySelectorAll('[data-datos-sello]');
      for(var i=0;i<els.length;i++) els[i].innerHTML=html;
    }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', sello);
  else sello();
})();

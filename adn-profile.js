/* ADN Minero · Perfil "Mi Faena" (compartido)
   Guarda en localStorage la faena, empresa y turno del usuario para
   personalizar la app. Uso: ADNProfile.get() / .set(obj) / .clear()   */
(function(){
  'use strict';
  var KEY='adn_profile';
  window.ADNProfile = {
    FAENAS: ['Escondida','Collahuasi','Chuquicamata','Radomiro Tomic','Ministro Hales','Gabriela Mistral',
      'El Teniente','Andina','Salvador','Los Bronces','El Soldado','Spence','Centinela','Antucoya',
      'Los Pelambres','Zaldívar','Candelaria','Caserones','El Abra','Quebrada Blanca','Sierra Gorda',
      'Mantoverde','Lomas Bayas','Mantos Blancos','El Peñón','La Coipa','Maricunga','Los Colorados',
      'El Romeral','Salar de Atacama'],
    TURNOS: ['7x7','4x3','5x2','4x4','14x14','10x10','8x6'],
    FAENA_COORD: {
      'Escondida':[-24.27,-69.07],'Collahuasi':[-20.98,-68.68],'Chuquicamata':[-22.29,-68.90],'Radomiro Tomic':[-22.28,-68.92],
      'Ministro Hales':[-22.05,-68.92],'Gabriela Mistral':[-24.30,-69.20],'El Teniente':[-34.08,-70.36],'Andina':[-33.05,-70.28],
      'Salvador':[-26.25,-69.62],'Los Bronces':[-33.14,-70.28],'El Soldado':[-32.66,-71.00],'Spence':[-22.75,-69.28],
      'Centinela':[-23.05,-69.02],'Antucoya':[-22.35,-69.90],'Los Pelambres':[-31.75,-70.49],'Zaldívar':[-24.20,-69.05],
      'Candelaria':[-27.51,-70.28],'Caserones':[-28.00,-69.70],'El Abra':[-21.75,-68.77],'Quebrada Blanca':[-20.99,-68.75],
      'Sierra Gorda':[-22.90,-69.30],'Mantoverde':[-27.00,-70.70],'Lomas Bayas':[-22.90,-69.50],'Mantos Blancos':[-23.52,-70.13],
      'El Peñón':[-24.40,-69.35],'La Coipa':[-26.78,-69.28],'Maricunga':[-27.13,-69.05],'Los Colorados':[-28.30,-70.60],
      'El Romeral':[-29.70,-71.28],'Salar de Atacama':[-23.50,-68.20]
    },
    get: function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } },
    set: function(p){ try{ localStorage.setItem(KEY, JSON.stringify(p||{})); }catch(e){} },
    clear: function(){ try{ localStorage.removeItem(KEY); }catch(e){} }
  };
})();

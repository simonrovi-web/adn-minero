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
    get: function(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } },
    set: function(p){ try{ localStorage.setItem(KEY, JSON.stringify(p||{})); }catch(e){} },
    clear: function(){ try{ localStorage.removeItem(KEY); }catch(e){} }
  };
})();

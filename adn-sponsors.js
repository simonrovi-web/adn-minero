/* ADN Minero · Auspiciadores (espacios de auspicio)
   Edita esta lista para poner o quitar marcas patrocinadoras.
   Formato de cada auspiciador:
     { nombre:'Nombre de la marca',
       texto:'Mensaje corto (una línea)',
       emoji:'🏢',                 // o deja '' y usa un color
       color:'#cf9b6f',            // color de acento
       url:'https://...',          // a dónde lleva al tocar
       hasta:'2026-12-31' }        // opcional: fecha en que expira (YYYY-MM-DD)
   Deja la lista vacía [] para mostrar el espacio libre ("Tu marca aquí"). */
window.ADN_SPONSORS = [
  // Ejemplo (borrar o reemplazar por auspiciadores reales):
  // { nombre:'Minera Ejemplo', texto:'Comprometidos con la seguridad minera', emoji:'⛏️', color:'#cf9b6f', url:'https://ejemplo.cl', hasta:'2026-12-31' }
];

// Correo para vender el espacio (usado por el placeholder "Tu marca aquí")
window.ADN_SPONSORS_CONTACT = 'adnminerochile@gmail.com';

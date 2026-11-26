/* RIDE EDU · Margens · carrega as edições listadas em newsletters/lista.js
   (na ordem da lista: a primeira é a edição atual da capa).
   Usa document.write para que as edições estejam prontas antes do
   código do site, como quando cada uma tinha sua linha no index.html. */
(function () {
  "use strict";
  var lista = window.RIDE_EDICOES_LISTA || [];
  for (var i = 0; i < lista.length; i++) {
    if (!/^\d{4}-\d{2}-\d{2}_[0-9-]+$/.test(lista[i])) continue;
    document.write('<script src="newsletters/edicoes/' + lista[i] + '.js"><\/script>');
  }
})();

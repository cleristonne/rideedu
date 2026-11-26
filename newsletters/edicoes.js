/* RIDE EDU · registro das edições do Margens (antigo Vale Educa)
   Cada edição fica em newsletters/edicoes/<id>.js e chama RIDE_EDICOES.registrar().
   A ordem é a das linhas <script> no index.html: a PRIMEIRA é a edição atual,
   as demais formam o arquivo, na ordem em que aparecem no seletor.
   Como publicar uma edição nova: COMO-PUBLICAR-EDICAO.txt                       */
window.RIDE_EDICOES = (function () {
  "use strict";
  var lista = [];
  return {
    registrar: function (opcoes, edicao) {
      if (!edicao || !edicao.id) {
        if (window.console) console.error("Vale Educa: edição sem \"id\" foi ignorada.", edicao);
        return;
      }
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].dados.id === edicao.id) {
          if (window.console) console.error("Vale Educa: edição repetida ignorada: " + edicao.id);
          return;
        }
      }
      lista.push({ opcoes: opcoes || {}, dados: edicao });
    },
    mapa: function () {
      var m = {};
      lista.forEach(function (e) { m[e.dados.id] = e.dados; });
      return m;
    },
    atual: function () { return lista.length ? lista[0].dados.id : ""; },
    rotulos: function () {
      var r = {};
      lista.forEach(function (e, i) {
        var base = e.opcoes.rotulo || e.dados.shortDate || e.dados.weekLabel || e.dados.id;
        r[e.dados.id] = base + (i === 0 ? " · edição atual" : "");
      });
      return r;
    },
    // Endereço da página de uma reportagem: materia.html?ed=<id>&m=<título-em-minúsculas-sem-acentos>
    slug: function (texto) {
      var t = String(texto || "").replace(/<[^>]*>/g, "");
      if (t.normalize) t = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90).replace(/-+$/, "");
    },
    linkMateria: function (edicaoId, titulo) {
      return "materia.html?ed=" + encodeURIComponent(edicaoId) + "&m=" + this.slug(titulo);
    },
    // Todas as reportagens de uma edição, na ordem da capa (seções novas ou destaques antigos)
    materias: function (ed) {
      var out = [];
      (ed.sections || []).forEach(function (s) {
        (s.stories || []).forEach(function (st) { out.push({ secao: s, materia: st }); });
      });
      if (!out.length) {
        (ed.highlights || []).forEach(function (h) {
          out.push({ secao: null, materia: { rubric: h.rubric, title: h.title, paragraphs: [h.body], service: h.service } });
        });
      }
      return out;
    }
  };
})();

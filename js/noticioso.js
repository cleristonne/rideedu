/* RIDE EDU · Margens · capa em padrão de jornal
   - Manchetes, fotos e títulos da capa abrem a reportagem completa
     em nova aba (materia.html), como nos portais de jornal.
   - Na capa fica só o começo do texto (linha fina).
   - Reaplica ao trocar de edição (o noticiário é redesenhado).
   - A linha do cartão "Margens · edição atual" acompanha a edição. */
(function () {
  "use strict";
  var E = window.RIDE_EDICOES;
  var panel = document.getElementById("panel-noticias");
  if (!E || !panel) return;

  function edAtual() {
    var id = typeof ACTIVE_NEWSLETTER_ID !== "undefined" ? ACTIVE_NEWSLETTER_ID : E.atual();
    return E.mapa()[id] || null;
  }
  function linkar(titulo, href, rotulo) {
    if (!titulo || titulo.querySelector("a.jn-link")) return;
    var a = document.createElement("a");
    a.className = "jn-link";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", titulo.textContent.trim() + " (" + (rotulo || "abre a reportagem") + " em nova aba)");
    while (titulo.firstChild) a.appendChild(titulo.firstChild);
    titulo.appendChild(a);
  }
  function lerMais(depois, href, texto) {
    if (!depois || !depois.parentNode || depois.parentNode.querySelector(":scope > .jn-readmore")) return;
    var a = document.createElement("a");
    a.className = "jn-readmore";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = texto || "Ler reportagem completa";
    depois.parentNode.insertBefore(a, depois.nextSibling);
  }

  function enhance() {
    var ed = edAtual();
    if (!ed) return;
    var lista = E.materias(ed);
    var porSlug = {};
    lista.forEach(function (x) { porSlug[E.slug(x.materia.title)] = x.materia; });
    var url = function (titulo) { return E.linkMateria(ed.id, titulo); };

    // Seções do noticiário
    Array.prototype.forEach.call(panel.querySelectorAll(".np-full-story"), function (story) {
      var h = story.querySelector("h4");
      if (!h) return;
      var href = url(h.textContent);
      linkar(h, href);
      story.classList.add("jn-teaser");
      var foto = story.querySelector(".np-news-photo > a");
      if (foto) { foto.href = href; foto.target = "_blank"; foto.rel = "noopener"; foto.setAttribute("tabindex", "-1"); }
      // Linha fina (dek) da reportagem, quando houver, substitui o começo do texto na capa
      var dados = porSlug[E.slug(h.textContent)];
      if (dados && dados.dek && !story.querySelector(":scope > .jn-dek")) {
        var dek = document.createElement("p");
        dek.className = "jn-dek";
        dek.textContent = dados.dek;
        var primeiro = story.querySelector(":scope > p");
        story.insertBefore(dek, primeiro || null);
      }
      var paras = story.querySelectorAll(":scope > p:not(.np-story-service)");
      lerMais(paras[0] || h, href);
    });

    // Edições antigas (destaques sem seções)
    Array.prototype.forEach.call(panel.querySelectorAll("#npLead .np-headline, #npStories .np-story h4"), function (h) {
      if (porSlug[E.slug(h.textContent)]) linkar(h, url(h.textContent));
    });

    // Manchete do topo: leva à reportagem de mesmo título, quando houver
    var sp = panel.querySelector(".np-spotlight h2");
    if (sp && porSlug[E.slug(sp.textContent)]) linkar(sp, url(sp.textContent));

    // Editorial: na capa, título e primeiro parágrafo; o texto inteiro na página própria
    var edTitle = panel.querySelector(".np-ed-headline");
    if (edTitle && ed.editorial) {
      var edHref = "materia.html?ed=" + encodeURIComponent(ed.id) + "&m=editorial";
      linkar(edTitle, edHref, "abre o editorial");
      var body = panel.querySelector(".np-ed-body");
      if (body) {
        body.classList.add("jn-teaser");
        lerMais(body.querySelector(":scope > p") || body.lastElementChild, edHref, "Ler editorial completo");
      }
    }

    var lead = panel.querySelector(".news-archive .card-lead");
    if (lead && ed.weekLabel) {
      lead.textContent = "Edição de " + ed.weekLabel.replace(/^Semana de\s+/i, "") + ". Consulte também as edições anteriores.";
    }
  }

  enhance();
  ["npFullSections", "npLegacyBody", "npEditorial", "npSpotlight"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) new MutationObserver(function () { enhance(); }).observe(el, { childList: true, subtree: true });
  });
})();

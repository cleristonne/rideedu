/* RIDE EDU · Margens · página de uma reportagem (materia.html)
   Endereço: materia.html?ed=<id da edição>&m=<título sem acentos>
   (o link é gerado pela capa: RIDE_EDICOES.linkMateria)
   O texto vem do mesmo arquivo da edição em newsletters/edicoes/,
   então nada precisa ser copiado: a reportagem é a mesma da capa. */
(function () {
  "use strict";
  var E = window.RIDE_EDICOES;
  var params = new URLSearchParams(location.search);
  var edId = params.get("ed") || "";
  var alvo = params.get("m") || "";
  var statusEl = document.getElementById("mtStatus");
  var art = document.getElementById("mtArticle");
  var more = document.getElementById("mtMore");

  /* ── Cabeçalho: o mesmo menu leva às seções da página principal ── */
  function irPara(name) {
    location.href = name === "noticias" ? "index.html" : "index.html#" + name;
  }
  window.rideNavigate = irPara; // usado pela gaveta do celular (ride-novo.js)
  Array.prototype.forEach.call(document.querySelectorAll("header .nav-tab"), function (b) {
    b.addEventListener("click", function () { irPara(b.dataset.panel); });
  });
  document.addEventListener("click", function (e) {
    Array.prototype.forEach.call(document.querySelectorAll(".nav-group[open]"), function (g) {
      if (!g.contains(e.target)) g.removeAttribute("open");
    });
  });
  function botaoBusca(cls) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.setAttribute("aria-label", "Buscar município ou tema");
    b.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    b.addEventListener("click", function () { location.href = "index.html#buscar"; });
    return b;
  }
  document.addEventListener("DOMContentLoaded", function () {
    // Aqui as seções abrem na mesma aba: tira o aviso "nova aba" da gaveta do celular
    document.body.classList.remove("rn-on-home");
    var nav = document.querySelector(".nav-scroll");
    if (nav) nav.appendChild(botaoBusca("rn-search-btn"));
    var menuBtn = document.querySelector(".rn-menu-btn");
    if (menuBtn) menuBtn.parentNode.insertBefore(botaoBusca("rn-search-btn-m"), menuBtn);
  });

  /* ── Reportagem ── */
  function texto(html) {
    var d = document.createElement("div");
    d.innerHTML = html || "";
    return d.textContent.trim();
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function naoEncontrada() {
    statusEl.innerHTML = 'Reportagem não encontrada. <a href="index.html">Ir para a capa do Margens</a>.';
    document.title = "Reportagem não encontrada · Margens";
  }
  function barraCompartilhar(titulo) {
    var url = location.href;
    return '<div class="mt-share">' +
      '<button type="button" class="mt-share-btn" data-copy>Copiar link</button>' +
      '<a class="mt-share-btn" href="https://wa.me/?text=' + encodeURIComponent(titulo + " " + url) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
      '<button type="button" class="mt-share-btn" data-print>Imprimir</button>' +
      "</div>";
  }
  function ligarCompartilhar() {
    var c = art.querySelector("[data-copy]");
    if (c) c.addEventListener("click", function () {
      var feito = function () { c.textContent = "Link copiado"; setTimeout(function () { c.textContent = "Copiar link"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(feito, function () { prompt("Copie o link:", location.href); });
      else prompt("Copie o link:", location.href);
    });
    var p = art.querySelector("[data-print]");
    if (p) p.addEventListener("click", function () { window.print(); });
  }
  function paragrafosEditorial(lista) {
    return (lista || []).map(function (p) {
      if (p.indexOf("np-ed-data-card") >= 0 || p.indexOf("np-ed-source") >= 0 || p.indexOf("np-ed-close") >= 0) return p;
      if (p.indexOf("np-ed-pull") >= 0) {
        var m = p.match(/<span class="np-ed-pull">([\s\S]*?)<\/span>/);
        if (m) return '<blockquote class="np-ed-pull">' + m[1] + "</blockquote>";
      }
      return "<p>" + p + "</p>";
    }).join("");
  }

  function render(ed) {
    var lista = E.materias(ed);
    var linhaEdicao = "Margens · edição de " + esc(String(ed.weekLabel || ed.shortDate || "").replace(/^Semana de\s+/i, ""));
    var html, titulo, atual = null;

    if (alvo === "editorial" && ed.editorial) {
      var o = ed.editorial;
      titulo = texto(o.title);
      html =
        '<nav class="mt-crumbs" aria-label="Você está em"><a class="mt-marca" href="index.html"><img src="marca/margens-simbolo.svg" alt="" width="18" height="18">Margens</a><span aria-hidden="true">›</span><span>opinião</span></nav>' +
        '<div class="mt-kicker">' + (o.rubric || "Editorial") + "</div>" +
        '<h1 class="mt-title mt-title-ed">' + o.title + "</h1>" +
        '<div class="mt-meta"><div><strong>' + (o.byline || "") + "</strong>" + (o.place ? " · " + o.place : "") + "<br>" + linhaEdicao + "</div>" + barraCompartilhar(titulo) + "</div>" +
        '<div class="mt-body np-ed-body">' + paragrafosEditorial(o.paragraphs) + "</div>";
    } else {
      for (var i = 0; i < lista.length; i++) {
        if (E.slug(lista[i].materia.title) === alvo) { atual = lista[i]; break; }
      }
      if (!atual) { naoEncontrada(); return; }
      var st = atual.materia, sec = atual.secao;
      titulo = texto(st.title);
      var paras = (st.paragraphs || [st.body || ""]).filter(Boolean);
      var servico = st.service ? String(st.service).replace(/^Para gestores?:\s*/i, "") : "";
      html =
        '<nav class="mt-crumbs" aria-label="Você está em"><a class="mt-marca" href="index.html"><img src="marca/margens-simbolo.svg" alt="" width="18" height="18">Margens</a>' +
        (sec && sec.title ? '<span aria-hidden="true">›</span><span>' + sec.title + "</span>" : "") + "</nav>" +
        '<div class="mt-kicker">' + (st.rubric || "") + "</div>" +
        '<h1 class="mt-title">' + st.title + "</h1>" +
        (st.dek ? '<p class="mt-dek">' + st.dek + "</p>" : "") +
        '<div class="mt-meta"><div>' + (st.byline ? "<strong>Por " + esc(st.byline) + "</strong><br>" : "") + linhaEdicao +
        (st.sourceLabel ? "<br>" + (st.byline ? "Com informações de " : "Fonte: ") + st.sourceLabel + (st.published ? " · publicado em " + st.published : "") : "") +
        "</div>" + barraCompartilhar(titulo) + "</div>" +
        (st.photo ?
          '<figure class="mt-photo"><img src="' + esc(st.photo) + '" alt="Imagem relacionada à reportagem" onerror="this.closest(\'figure\').classList.add(\'np-photo-unavailable\')">' +
          "<figcaption>" + (st.credit || "") + (st.photoSource || st.sourceUrl ? ' · <a href="' + esc(st.photoSource || st.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Fonte da imagem</a>' : "") + "</figcaption></figure>" : "") +
        '<div class="mt-body">' + paras.map(function (p) {
          // "## Texto" no arquivo da edição vira intertítulo
          return /^##\s+/.test(p) ? '<h2 class="mt-subhead">' + p.replace(/^##\s+/, "") + "</h2>" : "<p>" + p + "</p>";
        }).join("") + "</div>" +
        (servico ? '<aside class="mt-service"><strong>Para a gestão</strong><p>' + servico + "</p></aside>" : "") +
        (st.sourceUrl ? '<div class="mt-source"><span>Fonte: ' + (st.sourceLabel || "publicação original") + (st.published ? " · " + st.published : "") +
          '</span><a href="' + esc(st.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Ler na fonte original ↗</a></div>' : "");
    }

    html += '<p class="mt-back"><a href="index.html">← Capa do Margens</a></p>';
    art.innerHTML = html;
    art.hidden = false;
    statusEl.hidden = true;
    document.title = titulo + " · Margens";
    ligarCompartilhar();

    // Mais desta edição
    var itens = lista.filter(function (x) { return x !== atual; }).map(function (x) {
      return '<li><a href="' + E.linkMateria(ed.id, x.materia.title) + '"><span>' + (x.materia.rubric || (x.secao && x.secao.title) || "") + "</span>" + x.materia.title + "</a></li>";
    });
    if (ed.editorial && alvo !== "editorial") {
      itens.push('<li><a href="materia.html?ed=' + encodeURIComponent(ed.id) + '&m=editorial"><span>Editorial</span>' + ed.editorial.title + "</a></li>");
    }
    if (itens.length) {
      more.innerHTML = '<h2>mais desta edição</h2><p class="mt-more-sub">' + esc(ed.weekLabel || "") + "</p><ul>" + itens.join("") + "</ul>";
      more.hidden = false;
    }
  }

  if (!E || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9-]+$/.test(edId) || !alvo) { naoEncontrada(); return; }
  var s = document.createElement("script");
  s.src = "newsletters/edicoes/" + edId + ".js?v=20261126-5";
  s.onload = function () {
    var ed = E.mapa()[edId];
    if (ed) render(ed); else naoEncontrada();
  };
  s.onerror = naoEncontrada;
  document.body.appendChild(s);
})();

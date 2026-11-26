/* RIDE EDU · recursos de uso dos dados · 26/11/2026
   Carregado depois do script principal. Não altera dados nem cálculos:
   apenas acrescenta ferramentas às seções já renderizadas.

   1. Baixar imagem (PNG) de cada gráfico e CSV de cada tabela
   2. Tabelas ordenáveis pelo cabeçalho
   3. Selo de fonte nos gráficos e tabelas
   4. Barra de ferramentas da seção: copiar link e imprimir / gerar ficha em PDF
   5. Links que guardam os filtros (#municipio?m=…, #comparativo?a=…&b=…, #vaar?q=…)
   6. Busca geral (botão "Buscar", atalho "/" ou Ctrl+K)                        */
(function () {
  "use strict";

  /* ── Utilidades ─────────────────────────────────────────── */
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }
  function slug(s) {
    return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "ride-edu";
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function activePanelName() {
    var p = document.querySelector(".panel.active");
    return p ? p.id.replace("panel-", "") : "noticias";
  }
  function today() {
    return new Date().toLocaleDateString("pt-BR");
  }
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById("rnToast");
    if (!t) {
      t = el("div", "rn-toast");
      t.id = "rnToast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }
  function download(filename, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* Seções, nomes e fontes (as fontes são as que o próprio site declara). */
  var SECTIONS = {
    financas:      { label: "Recursos e aplicação", area: "Orçamento", source: "RREO/Siope · 6º bimestre de 2025", keys: "fundeb vaat vaar mde remuneracao recursos orcamento financiamento receita dinheiro" },
    evolucao:      { label: "Evolução 2020–2025", area: "Orçamento", source: "RREO/Siope · 2020–2025", keys: "evolucao serie historica fundeb vaat orcamento financiamento" },
    vaar:          { label: "VAAR 2026", area: "Orçamento", source: "FNDE · Fundeb 2026 · 3ª publicação", keys: "vaar condicionalidades complementacao fundeb fnde habilitacao" },
    ideb2025:      { label: "Ideb 2025", area: "Aprendizagem", source: "MEC/Inep", keys: "ideb 2025 escola nota avaliacao saeb aprendizagem" },
    ideb:          { label: "Ideb na RIDE", area: "Aprendizagem", source: "Inep · Ideb por município", keys: "ideb meta fluxo aprendizado portugues matematica" },
    calculadoras:  { label: "Estime o Ideb", area: "Aprendizagem", source: null, keys: "calculadora estimar simular ideb" },
    alfabetizacao: { label: "Alfabetização", area: "Aprendizagem", source: "MEC/Inep · Indicador Criança Alfabetizada 2025", keys: "alfabetizacao crianca alfabetizada leitura" },
    infantil:      { label: "Educação infantil", area: "Rede e acesso", source: "Observatório da Criança e do Adolescente (Unicef) · 2025", keys: "creche pre-escola pre escola infantil cobertura taxa liquida" },
    censo:         { label: "Censo Escolar", area: "Rede e acesso", source: "QEdu/Inep · Censo Escolar 2025, rede municipal", keys: "censo escolas matriculas professores docentes eja" },
    visao:         { label: "Visão geral", area: "Território", source: null, keys: "visao geral resumo ride regiao" },
    municipio:     { label: "Por município", area: "Território", source: null, keys: "municipio ficha perfil" },
    comparativo:   { label: "Comparativo", area: "Território", source: null, keys: "comparar comparativo lado a lado" },
    desigualdades: { label: "Desigualdades", area: "Território", source: null, keys: "desigualdade bolsa familia rural nse pobreza" },
    populacao:     { label: "População", area: "Território", source: "IBGE · Censo 2022 e estimativa 2025", keys: "populacao habitantes ibge censo 2022" },
    noticias:      { label: "Notícias · Margens", area: "", source: null, keys: "noticias margens newsletter vale educa boletim jornal reportagem" },
    apresentacao:  { label: "Sobre o RIDE EDU", area: "", source: null, keys: "sobre apresentacao projeto metodologia" }
  };
  var DATA_PANELS = Object.keys(SECTIONS).filter(function (k) { return k !== "noticias" && k !== "apresentacao"; });

  function municipios() {
    try { if (Array.isArray(window.MUNICIPIOS)) return window.MUNICIPIOS.slice(); } catch (e) {}
    var sel = document.getElementById("municipioSelect");
    return sel ? Array.prototype.map.call(sel.options, function (o) { return o.value; }) : [];
  }

  /* ── 1. Imagem do gráfico ───────────────────────────────── */
  function cardTitle(card) {
    var h = card && card.querySelector("h2, h3, .card-title");
    return h ? h.textContent.trim() : "Gráfico";
  }

  function canvasPainted(canvas) {
    try {
      var d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      for (var i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) return true;
    } catch (e) { return true; }
    return false;
  }

  function exportChartPNG(canvas, card, retried) {
    var title = cardTitle(card);
    // Gráfico ainda não desenhado (clique logo ao abrir a página): espera e tenta de novo
    if (!canvasPainted(canvas) && !retried) {
      setTimeout(function () { exportChartPNG(canvas, card, true); }, 900);
      return;
    }
    var panel = canvas.closest(".panel");
    var info = panel ? SECTIONS[panel.id.replace("panel-", "")] : null;
    var scale = (canvas.clientWidth ? canvas.width / canvas.clientWidth : 1) || 1;
    var pad = 32 * scale, headH = 64 * scale, footH = 44 * scale;
    var w = canvas.width, h = canvas.height;
    var out = document.createElement("canvas");
    out.width = w + pad * 2;
    out.height = h + headH + footH + pad;
    var ctx = out.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = "#0B1530";
    ctx.font = "700 " + (22 * scale) + "px Inter, system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(title, pad, pad * 0.8);
    ctx.drawImage(canvas, pad, headH + pad * 0.4, w, h);
    ctx.fillStyle = "#4D5874";
    ctx.font = "500 " + (12 * scale) + "px Inter, system-ui, sans-serif";
    var foot = (info && info.source ? "Fonte: " + info.source + " · " : "") + "RIDE EDU · rideedu.com.br · " + today();
    ctx.fillText(foot, pad, out.height - footH + 6 * scale);
    out.toBlob(function (blob) {
      if (blob) { download(slug(title) + ".png", blob); toast("Imagem do gráfico baixada."); }
    }, "image/png");
  }

  /* ── 1b. CSV da tabela ──────────────────────────────────── */
  // Achata cabeçalhos com rowspan/colspan: "Creche — 0 a 3 anos (%) · 2020"
  function headerColumns(table) {
    var rows = table.tHead ? Array.prototype.slice.call(table.tHead.rows) : [];
    if (!rows.length) {
      var first = table.rows[0];
      return first ? Array.prototype.map.call(first.cells, function (c) { return c.textContent.trim(); }) : [];
    }
    var grid = [];
    rows.forEach(function (tr, r) {
      grid[r] = grid[r] || [];
      var c = 0;
      Array.prototype.forEach.call(tr.cells, function (cell) {
        while (grid[r][c] !== undefined) c++;
        var rs = cell.rowSpan || 1, cs = cell.colSpan || 1, txt = cell.textContent.trim();
        for (var i = 0; i < rs; i++) {
          grid[r + i] = grid[r + i] || [];
          for (var j = 0; j < cs; j++) grid[r + i][c + j] = { t: txt, top: i === 0 };
        }
        c += cs;
      });
    });
    var n = Math.max.apply(null, grid.map(function (g) { return g.length; }));
    var cols = [];
    for (var c = 0; c < n; c++) {
      var parts = [];
      for (var r = 0; r < grid.length; r++) {
        var g = grid[r][c];
        if (g && g.top && g.t && parts.indexOf(g.t) === -1) parts.push(g.t);
      }
      cols.push(parts.join(" · "));
    }
    return cols;
  }

  function csvCell(v) {
    v = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
    return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function exportTableCSV(table, title) {
    var lines = [headerColumns(table).map(csvCell).join(";")];
    var body = table.tBodies.length ? table.tBodies : [table];
    Array.prototype.forEach.call(body, function (tb) {
      Array.prototype.forEach.call(tb.rows, function (tr) {
        if (tr.parentElement && tr.parentElement.tagName === "THEAD") return;
        lines.push(Array.prototype.map.call(tr.cells, function (td) {
          return csvCell(td.textContent);
        }).join(";"));
      });
    });
    // BOM: o Excel em português abre os acentos corretamente; ";" é o separador do Excel pt-BR
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    download(slug(title) + ".csv", blob);
    toast("Tabela baixada em CSV.");
  }

  /* ── 2. Ordenação de tabelas ────────────────────────────── */
  // Não ordenar: ranking do Ideb 2025 (ordem própria), VAAR (paginado),
  // comparativo (linhas são indicadores) e tabelas de cabeçalho duplo.
  function sortableTable(table) {
    if (!table.tHead || table.tHead.rows.length !== 1) return false;
    if (table.closest("#panel-comparativo, #panel-ideb2025, #panel-vaar")) return false;
    if (!table.closest(".panel")) return false;
    return table.tBodies.length === 1 && table.tBodies[0].rows.length > 1;
  }
  function parseCell(text) {
    var t = String(text || "").trim();
    if (!t || /^[—–-]+$/.test(t) || /^sem /i.test(t)) return null;
    var m = t.replace(/\s/g, "").match(/^(-|−)?R?\$?(-|−)?([\d.]+(,\d+)?)(%|mi|bi|mil)?/i);
    if (!m) return t;
    var n = parseFloat(m[3].replace(/\./g, "").replace(",", "."));
    if (isNaN(n)) return t;
    if (m[1] || m[2]) n = -n;
    return n;
  }
  function isPinnedRow(tr) {
    var first = tr.cells[0] ? norm(tr.cells[0].textContent) : "";
    return /^(ride|total|media|regiao)\b/.test(first) || tr.classList.contains("total") || tr.classList.contains("total-row");
  }
  function sortTable(table, idx, th) {
    var tbody = table.tBodies[0];
    var rows = Array.prototype.slice.call(tbody.rows);
    var pinned = rows.filter(isPinnedRow);
    var data = rows.filter(function (r) { return !isPinnedRow(r); });
    var current = th.getAttribute("aria-sort");
    var sample = data.map(function (r) { return parseCell(r.cells[idx] && r.cells[idx].textContent); });
    var numeric = sample.some(function (v) { return typeof v === "number"; });
    var dir = current === "descending" ? "ascending" : current === "ascending" ? "descending" : (numeric ? "descending" : "ascending");
    var pairs = data.map(function (r, i) { return { r: r, v: sample[i] }; });
    pairs.sort(function (a, b) {
      if (a.v === null && b.v === null) return 0;
      if (a.v === null) return 1;
      if (b.v === null) return -1;
      var res = (typeof a.v === "number" && typeof b.v === "number") ? a.v - b.v : String(a.v).localeCompare(String(b.v), "pt-BR");
      return dir === "ascending" ? res : -res;
    });
    pairs.forEach(function (p) { tbody.appendChild(p.r); });
    pinned.forEach(function (r) { tbody.appendChild(r); });
    Array.prototype.forEach.call(table.tHead.rows[0].cells, function (c) { c.removeAttribute("aria-sort"); });
    th.setAttribute("aria-sort", dir);
  }
  document.addEventListener("click", function (e) {
    var th = e.target.closest && e.target.closest("th.rn-sortable");
    if (!th) return;
    var table = th.closest("table");
    if (table) sortTable(table, th.cellIndex, th);
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("rn-sortable")) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ── Decoração (refeita quando uma seção é redesenhada) ─── */
  function toolButton(label, icon, onClick) {
    var b = el("button", "rn-tool");
    b.type = "button";
    b.innerHTML = '<span aria-hidden="true">' + icon + "</span>";
    b.appendChild(document.createTextNode(label));
    b.addEventListener("click", onClick);
    return b;
  }
  var ICON_DL = "↓";

  function decorate() {
    DATA_PANELS.forEach(function (name) {
      var panel = document.getElementById("panel-" + name);
      if (!panel) return;
      var info = SECTIONS[name];

      // Gráficos
      panel.querySelectorAll("canvas").forEach(function (canvas) {
        var card = canvas.closest(".card") || canvas.parentElement;
        if (!card || card.querySelector(".rn-card-tools")) return;
        // Rodapé do cartão: fonte à esquerda, botão de imagem à direita
        var tools = el("div", "rn-card-tools");
        if (info.source && !/fonte/i.test(card.textContent)) {
          tools.appendChild(el("p", "rn-source", "Fonte: " + info.source));
        }
        tools.appendChild(toolButton("Baixar imagem", ICON_DL, function () {
          var c = card.querySelector("canvas");
          if (c) exportChartPNG(c, card);
        }));
        tools.lastChild.setAttribute("aria-label", "Baixar imagem do gráfico " + cardTitle(card));
        card.appendChild(tools);
      });

      // Tabelas
      panel.querySelectorAll("table").forEach(function (table) {
        var wrap = table.closest(".table-wrap, .ideb25-table-wrap") || table;
        var prev = wrap.previousElementSibling;
        if (!(prev && prev.classList.contains("rn-table-tools"))) {
          var bar = el("div", "rn-table-tools");
          var card = wrap.closest(".card");
          var title = card ? cardTitle(card) : info.label;
          bar.appendChild(toolButton("Baixar CSV", ICON_DL, function () {
            var t = bar.nextElementSibling && (bar.nextElementSibling.tagName === "TABLE" ? bar.nextElementSibling : bar.nextElementSibling.querySelector("table"));
            if (t) exportTableCSV(t, info.label + " " + title);
          }));
          bar.lastChild.setAttribute("aria-label", "Baixar tabela " + title + " em CSV");
          if (sortableTable(table)) bar.appendChild(el("span", "rn-table-hint", "Clique no cabeçalho para ordenar"));
          if (info.source && !(card && /fonte/i.test(card.textContent))) bar.appendChild(el("span", "rn-source", "Fonte: " + info.source));
          wrap.parentNode.insertBefore(bar, wrap);
        }
        if (sortableTable(table)) {
          Array.prototype.forEach.call(table.tHead.rows[0].cells, function (th) {
            if (th.classList.contains("rn-sortable") || !th.textContent.trim()) return;
            th.classList.add("rn-sortable");
            th.tabIndex = 0;
            th.title = "Ordenar por " + th.textContent.trim();
          });
        }
      });

      // Barra de ferramentas da seção (abaixo da barra de área)
      var areaBar = panel.querySelector(".rn-area-bar");
      if (areaBar && !panel.querySelector(".rn-panel-tools")) {
        var pt = el("div", "rn-panel-tools");
        pt.appendChild(toolButton("Copiar link", "🔗", copyLink));
        var printLabel = name === "municipio" ? "Gerar ficha em PDF" : "Imprimir / PDF";
        pt.appendChild(toolButton(printLabel, "⎙", function () { printPanel(name); }));
        areaBar.parentNode.insertBefore(pt, areaBar.nextSibling);
      }
    });
  }

  var decorateTimer;
  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(decorate, 120);
  }

  /* ── 4. Copiar link e imprimir ──────────────────────────── */
  function copyLink() {
    syncHash();
    var url = location.href;
    var done = function () { toast("Link copiado: os filtros escolhidos vão junto."); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copie o link:", url); });
    } else {
      window.prompt("Copie o link:", url);
    }
  }

  function printPanel(name) {
    var head = document.getElementById("rnPrintHead");
    if (!head) {
      head = el("div", "rn-print-head");
      head.id = "rnPrintHead";
      var main = document.querySelector("main") || document.body;
      main.insertBefore(head, main.firstChild);
    }
    var info = SECTIONS[name] || { label: name };
    var title = info.label;
    if (name === "municipio") {
      var sel = document.getElementById("municipioSelect");
      title = "Ficha do município · " + (sel ? sel.value : "");
    } else if (name === "comparativo") {
      var a = document.getElementById("compareMunicipioA"), b = document.getElementById("compareMunicipioB");
      if (a && b) title = "Comparativo · " + a.value + " × " + b.value;
    }
    head.innerHTML = "";
    head.appendChild(el("strong", null, "RIDE EDU"));
    head.appendChild(el("span", "rn-print-title", title));
    head.appendChild(el("span", "rn-print-meta", "Polo Petrolina–Juazeiro · gerado em " + today() + " · " + location.href));
    document.body.dataset.printPanel = name;
    window.print();
  }
  window.addEventListener("afterprint", function () { delete document.body.dataset.printPanel; });

  /* ── 5. Links com filtros ───────────────────────────────── */
  function hashParams() {
    var h = location.hash.replace(/^#/, "");
    var i = h.indexOf("?");
    return { panel: (i < 0 ? h : h.slice(0, i)).toLowerCase(), params: new URLSearchParams(i < 0 ? "" : h.slice(i + 1)) };
  }
  function currentParams() {
    var name = activePanelName(), p = new URLSearchParams();
    if (name === "municipio") {
      var s = document.getElementById("municipioSelect");
      if (s && s.value) p.set("m", s.value);
    } else if (name === "comparativo") {
      var a = document.getElementById("compareMunicipioA"), b = document.getElementById("compareMunicipioB");
      if (a && b) { p.set("a", a.value); p.set("b", b.value); }
    } else if (name === "vaar") {
      var q = document.getElementById("vaarQuery");
      if (q && q.value.trim()) p.set("q", q.value.trim());
    }
    return { name: name, params: p };
  }
  function syncHash() {
    var c = currentParams();
    if (c.name === "noticias") return;
    var qs = c.params.toString();
    var h = "#" + c.name + (qs ? "?" + qs : "");
    if (location.hash !== h) history.replaceState(null, "", location.pathname + location.search + h);
  }
  function pickOption(select, value) {
    if (!select || !value) return false;
    var v = norm(value);
    var opt = Array.prototype.find.call(select.options, function (o) { return norm(o.value) === v || norm(o.textContent) === v; });
    if (!opt) return false;
    select.value = opt.value;
    return true;
  }
  function applyHashParams() {
    var hp = hashParams(), p = hp.params;
    if (!p.toString()) return;
    try {
      if (hp.panel === "municipio") {
        if (pickOption(document.getElementById("municipioSelect"), p.get("m")) && typeof window.renderMunicipio === "function") window.renderMunicipio();
      } else if (hp.panel === "comparativo") {
        var okA = pickOption(document.getElementById("compareMunicipioA"), p.get("a"));
        var okB = pickOption(document.getElementById("compareMunicipioB"), p.get("b"));
        if ((okA || okB) && typeof window.renderComparativo === "function") window.renderComparativo();
      } else if (hp.panel === "vaar" && p.get("q")) {
        var q = document.getElementById("vaarQuery");
        if (q) {
          q.value = p.get("q");
          if (typeof window.runVaarSearch === "function") window.runVaarSearch();
        }
      }
    } catch (e) { /* filtros inválidos no link: mantém a seção sem filtro */ }
  }
  function watchFilters() {
    ["municipioSelect", "compareMunicipioA", "compareMunicipioB"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.addEventListener("change", function () { setTimeout(syncHash, 0); });
    });
    var btn = document.getElementById("vaarSearchBtn");
    if (btn) btn.addEventListener("click", function () { setTimeout(syncHash, 0); });
    var q = document.getElementById("vaarQuery");
    if (q) q.addEventListener("keydown", function (e) { if (e.key === "Enter") setTimeout(syncHash, 0); });
  }

  /* ── 6. Busca geral ─────────────────────────────────────── */
  var searchDlg, searchInput, searchList, searchItems = [], searchIdx = 0, searchLastFocus;

  function buildIndex(query) {
    var q = norm(query);
    var words = q.split(/\s+/).filter(Boolean);
    var res = [];
    var munis = municipios();
    var muniHit = munis.filter(function (m) {
      var nm = norm(m);
      return words.length && (q.indexOf(nm) !== -1 || words.some(function (w) { return w.length >= 3 && nm.indexOf(w) === 0; }));
    });
    var restWords = words.filter(function (w) {
      return !muniHit.some(function (m) { return norm(m).split(/\s+/).some(function (p) { return p.indexOf(w) === 0 || w.indexOf(p) === 0; }); });
    });

    function sectionScore(key) {
      var s = SECTIONS[key];
      var hay = norm(s.label + " " + s.area + " " + s.keys);
      if (!restWords.length) return 0;
      var hits = restWords.filter(function (w) { return hay.indexOf(w) !== -1; }).length;
      return hits / restWords.length;
    }

    muniHit.forEach(function (m) {
      var enc = encodeURIComponent(m);
      var wantsVaar = restWords.some(function (w) { return "vaar".indexOf(w) === 0 && w.length >= 3; });
      if (wantsVaar) res.push({ title: "VAAR 2026 de " + m, sub: "Condicionalidades e valor previsto", hash: "#vaar?q=" + enc, score: 3 });
      res.push({ title: m + " — ficha do município", sub: "Fundeb, Ideb, matrículas e cobertura infantil", hash: "#municipio?m=" + enc, score: 2.5 });
      var other = munis.filter(function (x) { return x !== m; })[0];
      if (muniHit.length >= 2 && m === muniHit[0]) {
        res.push({ title: muniHit[0] + " × " + muniHit[1], sub: "Comparativo lado a lado", hash: "#comparativo?a=" + enc + "&b=" + encodeURIComponent(muniHit[1]), score: 2.8 });
      } else if (!wantsVaar && muniHit.length === 1) {
        res.push({ title: "Comparar " + m + " com outro município", sub: "Comparativo lado a lado", hash: "#comparativo?a=" + enc + "&b=" + encodeURIComponent(other), score: 1.2 });
        res.push({ title: "VAAR 2026 de " + m, sub: "Condicionalidades e valor previsto", hash: "#vaar?q=" + enc, score: 1.1 });
      }
    });

    Object.keys(SECTIONS).forEach(function (key) {
      var sc = restWords.length ? sectionScore(key) : (words.length ? 0 : 0.5);
      if (sc > 0) res.push({ title: SECTIONS[key].label, sub: SECTIONS[key].area ? "Seção · " + SECTIONS[key].area : "Página", hash: "#" + key, score: 1 + sc });
    });

    // Fora da RIDE: a consulta do VAAR cobre todos os municípios do país
    if (q.length >= 3 && !muniHit.length && !res.length) {
      res.push({ title: "Buscar “" + query.trim() + "” no VAAR 2026", sub: "Consulta nacional por município ou código IBGE", hash: "#vaar?q=" + encodeURIComponent(query.trim()), score: 0.4 });
    }
    if (!words.length) {
      return Object.keys(SECTIONS).filter(function (k) { return k !== "apresentacao"; }).map(function (k) {
        return { title: SECTIONS[k].label, sub: SECTIONS[k].area ? "Seção · " + SECTIONS[k].area : "Página", hash: k === "noticias" ? "#" : "#" + k, score: 0 };
      });
    }
    var seen = {};
    return res.sort(function (a, b) { return b.score - a.score; }).filter(function (r) {
      if (seen[r.hash]) return false;
      seen[r.hash] = 1;
      return true;
    }).slice(0, 8);
  }

  function renderResults() {
    searchItems = buildIndex(searchInput.value);
    searchIdx = 0;
    searchList.innerHTML = "";
    if (!searchItems.length) {
      searchList.appendChild(el("li", "rn-search-empty", "Nada encontrado. Tente o nome de um município ou um tema (Fundeb, creche, Ideb…)."));
      return;
    }
    searchItems.forEach(function (it, i) {
      var li = el("li");
      var b = el("button", "rn-search-item");
      b.type = "button";
      b.id = "rnSearchOpt" + i;
      b.setAttribute("role", "option");
      b.appendChild(el("span", "rn-search-title", it.title));
      b.appendChild(el("span", "rn-search-sub", it.sub));
      b.addEventListener("click", function () { goTo(it.hash); });
      b.addEventListener("mousemove", function () { setActive(i); });
      li.appendChild(b);
      searchList.appendChild(li);
    });
    setActive(0);
  }
  function setActive(i) {
    searchIdx = i;
    Array.prototype.forEach.call(searchList.querySelectorAll(".rn-search-item"), function (b, j) {
      b.classList.toggle("is-active", j === i);
      b.setAttribute("aria-selected", j === i ? "true" : "false");
    });
    searchInput.setAttribute("aria-activedescendant", "rnSearchOpt" + i);
  }
  function goTo(hash) {
    closeSearch(true);
    if (hash === "#") {
      if (typeof window.openPanel === "function") window.openPanel("noticias");
      return;
    }
    if (location.hash === hash) applyHashParams();
    else location.hash = hash;
  }
  function openSearch() {
    if (!searchDlg) buildSearch();
    searchLastFocus = document.activeElement;
    searchDlg.hidden = false;
    document.body.classList.add("rn-search-open");
    searchInput.value = "";
    renderResults();
    setTimeout(function () { searchInput.focus(); }, 0);
  }
  function closeSearch(skipFocus) {
    if (!searchDlg || searchDlg.hidden) return;
    searchDlg.hidden = true;
    document.body.classList.remove("rn-search-open");
    if (!skipFocus && searchLastFocus && searchLastFocus.focus) searchLastFocus.focus();
  }
  function buildSearch() {
    searchDlg = el("div", "rn-search");
    searchDlg.id = "rnSearch";
    searchDlg.hidden = true;
    searchDlg.setAttribute("role", "dialog");
    searchDlg.setAttribute("aria-modal", "true");
    searchDlg.setAttribute("aria-label", "Buscar no RIDE EDU");
    var back = el("div", "rn-search-backdrop");
    back.addEventListener("click", function () { closeSearch(); });
    var box = el("div", "rn-search-box");
    var row = el("div", "rn-search-row");
    searchInput = el("input", "rn-search-input");
    searchInput.type = "search";
    searchInput.placeholder = "Município ou tema: “Juazeiro”, “creche”, “Curaçá VAAR”…";
    searchInput.setAttribute("aria-label", "Buscar município ou tema");
    searchInput.setAttribute("role", "combobox");
    searchInput.setAttribute("aria-expanded", "true");
    searchInput.setAttribute("aria-controls", "rnSearchList");
    searchInput.setAttribute("autocomplete", "off");
    var close = el("button", "rn-search-close", "Esc");
    close.type = "button";
    close.setAttribute("aria-label", "Fechar busca");
    close.addEventListener("click", function () { closeSearch(); });
    row.appendChild(searchInput);
    row.appendChild(close);
    searchList = el("ul", "rn-search-list");
    searchList.id = "rnSearchList";
    searchList.setAttribute("role", "listbox");
    box.appendChild(row);
    box.appendChild(searchList);
    searchDlg.appendChild(back);
    searchDlg.appendChild(box);
    document.body.appendChild(searchDlg);
    searchInput.addEventListener("input", renderResults);
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(searchIdx + 1, searchItems.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(searchIdx - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); if (searchItems[searchIdx]) goTo(searchItems[searchIdx].hash); }
    });
    searchDlg.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSearch(); });
  }
  function searchButton(cls, withLabel) {
    var b = el("button", cls);
    b.type = "button";
    b.setAttribute("aria-label", "Buscar município ou tema (atalho: /)");
    b.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' + (withLabel ? "<span>Buscar</span>" : "");
    b.addEventListener("click", function (e) { e.stopPropagation(); openSearch(); });
    return b;
  }
  function installSearch() {
    var nav = document.querySelector(".nav-scroll");
    if (nav && !nav.querySelector(".rn-search-btn")) nav.appendChild(searchButton("rn-search-btn", false));
    var menuBtn = document.querySelector(".rn-menu-btn");
    if (menuBtn && !document.querySelector(".rn-search-btn-m")) menuBtn.parentNode.insertBefore(searchButton("rn-search-btn-m", false), menuBtn);
    document.addEventListener("keydown", function (e) {
      var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
        e.preventDefault();
        openSearch();
      }
    });
  }

  /* ── Início ─────────────────────────────────────────────── */
  function start() {
    decorate();
    watchFilters();
    installSearch();
    applyHashParams();
    var main = document.querySelector("main");
    if (main && window.MutationObserver) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var t = muts[i].target;
          if (t.closest && (t.closest(".rn-card-tools, .rn-table-tools, .rn-panel-tools") || t.id === "rnPrintHead")) continue;
          scheduleDecorate();
          return;
        }
      }).observe(main, { childList: true, subtree: true });
    }
    // Vindo da página de uma reportagem (materia.html), "#buscar" abre a busca
    if (location.hash === "#buscar") {
      history.replaceState(null, "", location.pathname + location.search);
      openSearch();
    }
    window.addEventListener("hashchange", function () { setTimeout(applyHashParams, 0); });
    // Ao trocar de seção pelos menus, o roteador grava "#secao"; os filtros atuais voltam ao link.
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".nav-tab, .rn-area-pill, .rn-drawer-link")) setTimeout(syncHash, 50);
    });
  }
  window.rideSearch = { open: openSearch };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();

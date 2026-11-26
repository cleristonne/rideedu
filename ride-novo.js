/* RIDE EDU · redesign de novembro de 2026
   1. Padrões visuais dos gráficos (Chart.js)
   2. Barra de área nas seções de dados (seções irmãs lado a lado)
   3. Números do bloco "Orçamento em destaque" da página inicial,
      lidos da tabela financeira já renderizada pelo site            */
(function () {
  "use strict";

  /* ── 1. Gráficos ─────────────────────────────────────────── */
  if (window.Chart) {
    var C = window.Chart;
    C.defaults.font.family = "Inter, system-ui, sans-serif";
    C.defaults.font.size = 12;
    C.defaults.color = "#4D5874";
    C.defaults.borderColor = "#E6E9F0";
    C.defaults.datasets.bar.maxBarThickness = 24;
    C.defaults.datasets.bar.borderRadius = 4;
    C.defaults.datasets.line.borderWidth = 2;
    C.defaults.datasets.line.pointRadius = 4;
    C.defaults.datasets.line.pointHoverRadius = 6;
    C.defaults.datasets.line.pointBorderColor = "#FFFFFF";
    C.defaults.datasets.line.pointBorderWidth = 2;
    C.defaults.plugins.legend.labels.usePointStyle = true;
    C.defaults.plugins.legend.labels.pointStyle = "rectRounded";
    C.defaults.plugins.tooltip.backgroundColor = "#0B1530";
    C.defaults.plugins.tooltip.titleColor = "#FFFFFF";
    C.defaults.plugins.tooltip.bodyColor = "#FFFFFF";
    C.defaults.plugins.tooltip.padding = 10;
    C.defaults.plugins.tooltip.cornerRadius = 8;
    C.defaults.plugins.tooltip.displayColors = true;
    C.defaults.plugins.tooltip.boxPadding = 4;

    /* Legenda: cor sólida e texto escuro. Em séries de linha sem
       backgroundColor, o Chart.js pinta a amostra de cinza-claro;
       aqui a amostra passa a usar a cor da própria linha.          */
    C.defaults.plugins.legend.labels.color = "#0B1530";
    C.defaults.plugins.legend.labels.font = { family: "Inter, system-ui, sans-serif", size: 13, weight: "600" };
    var baseLegendLabels = C.defaults.plugins.legend.labels.generateLabels;
    C.defaults.plugins.legend.labels.generateLabels = function (chart) {
      var items = baseLegendLabels.call(this, chart);
      items.forEach(function (it) {
        var ds = chart.data.datasets[it.datasetIndex];
        if (!ds) return;
        var type = ds.type || chart.config.type;
        if (type === "line" && typeof ds.borderColor === "string") {
          it.fillStyle = ds.borderColor;
          it.strokeStyle = ds.borderColor;
        }
        it.fontColor = it.hidden ? "#8A93A8" : "#0B1530";
      });
      return items;
    };

    /* Pontos das linhas na mesma cor da linha (antes: cinza-claro). */
    C.register({
      id: "rnLineColors",
      beforeUpdate: function (chart) {
        chart.data.datasets.forEach(function (ds) {
          var type = ds.type || chart.config.type;
          if (type !== "line" || typeof ds.borderColor !== "string") return;
          if (ds.pointBackgroundColor == null) ds.pointBackgroundColor = ds.borderColor;
        });
      }
    });

    /* Rótulos de valor sobre as barras.
       Ativado por options.plugins.rnValueLabels = { format: fn }.
       Se o texto não couber na largura da barra, usa a forma curta
       (format(v, true)) e fonte menor.                              */
    C.register({
      id: "rnValueLabels",
      afterDatasetsDraw: function (chart, args, opts) {
        if (!opts || typeof opts.format !== "function") return;
        var ctx = chart.ctx;
        ctx.save();
        ctx.textAlign = "center";
        // Mesma forma (longa ou curta) para todas as barras do gráfico.
        var FULL = "700 12px Inter, system-ui, sans-serif";
        var SHORT = "700 11px Inter, system-ui, sans-serif";
        var useShort = false;
        ctx.font = FULL;
        chart.data.datasets.forEach(function (ds, di) {
          var meta = chart.getDatasetMeta(di);
          if (meta.hidden || meta.type !== "bar") return;
          meta.data.forEach(function (bar, i) {
            var v = ds.data[i];
            if (v == null || isNaN(v)) return;
            if (ctx.measureText(opts.format(v, false)).width > (bar.width || 0) + 14) useShort = true;
          });
        });
        ctx.font = useShort ? SHORT : FULL;
        chart.data.datasets.forEach(function (ds, di) {
          var meta = chart.getDatasetMeta(di);
          if (meta.hidden || meta.type !== "bar") return;
          meta.data.forEach(function (bar, i) {
            var v = ds.data[i];
            if (v == null || isNaN(v)) return;
            var text = opts.format(v, useShort);
            var neg = v < 0;
            ctx.fillStyle = "#0B1530";
            ctx.textBaseline = neg ? "top" : "bottom";
            ctx.fillText(text, bar.x, neg ? bar.y + 4 : bar.y - 4);
          });
        });
        ctx.restore();
      }
    });
  }

  /* ── 2. Áreas ────────────────────────────────────────────── */
  var AREAS = [
    { name: "Orçamento e financiamento", panels: [["financas", "Recursos e aplicação"], ["evolucao", "Evolução 2020–2025"], ["vaar", "VAAR 2026"]] },
    { name: "Aprendizagem e avaliação", panels: [["ideb2025", "Ideb 2025"], ["ideb", "Ideb na RIDE"], ["calculadoras", "Estime o Ideb"], ["alfabetizacao", "Alfabetização"]] },
    { name: "Rede e acesso", panels: [["infantil", "Educação infantil"], ["censo", "Censo Escolar"]] },
    { name: "Território", panels: [["visao", "Visão geral"], ["municipio", "Por município"], ["comparativo", "Comparativo"], ["desigualdades", "Desigualdades"], ["populacao", "População"]] }
  ];

  function buildAreaBars() {
    AREAS.forEach(function (area) {
      area.panels.forEach(function (entry) {
        var panel = document.getElementById("panel-" + entry[0]);
        if (!panel || panel.querySelector(".rn-area-bar")) return;
        var bar = document.createElement("div");
        bar.className = "rn-area-bar";

        var home = document.createElement("a");
        home.className = "rn-area-home";
        home.href = "#noticias";
        home.textContent = "← Notícias";
        bar.appendChild(home);

        var name = document.createElement("span");
        name.className = "rn-area-name";
        name.textContent = area.name;
        bar.appendChild(name);

        var pills = document.createElement("div");
        pills.className = "rn-area-pills";
        pills.setAttribute("role", "group");
        pills.setAttribute("aria-label", "Seções de " + area.name);
        area.panels.forEach(function (sib) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "rn-area-pill";
          b.dataset.areaPanel = sib[0];
          b.textContent = sib[1];
          if (sib[0] === entry[0]) {
            b.classList.add("is-current");
            b.setAttribute("aria-current", "page");
          }
          b.addEventListener("click", function () {
            if (typeof window.openPanel === "function") window.openPanel(sib[0]);
          });
          pills.appendChild(b);
        });
        bar.appendChild(pills);
        panel.insertBefore(bar, panel.firstChild);
      });
    });
  }

  /* ── 2b. Menu de telas estreitas (gaveta lateral) ───────────
     Em telas até 900px o menu horizontal some e dá lugar a um
     botão "Menu", que abre uma gaveta com todas as áreas e seções. */
  var drawer, drawerBtn, lastFocus;

  function navigateTo(name) {
    closeDrawer();
    if (typeof window.rideNavigate === "function") window.rideNavigate(name);
    else if (typeof window.openPanel === "function") window.openPanel(name);
  }

  function drawerItem(name, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "rn-drawer-link";
    b.dataset.drawerPanel = name;
    b.textContent = label;
    b.addEventListener("click", function () { navigateTo(name); });
    return b;
  }

  function buildMobileMenu() {
    var inner = document.querySelector(".header-inner");
    if (!inner || document.getElementById("rnDrawer")) return;

    drawerBtn = document.createElement("button");
    drawerBtn.type = "button";
    drawerBtn.className = "rn-menu-btn";
    drawerBtn.setAttribute("aria-controls", "rnDrawer");
    drawerBtn.setAttribute("aria-expanded", "false");
    drawerBtn.innerHTML = '<span class="rn-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span><span class="rn-menu-label">Menu</span>';
    drawerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (document.body.classList.contains("rn-drawer-open")) closeDrawer(); else openDrawer();
    });
    inner.appendChild(drawerBtn);

    drawer = document.createElement("div");
    drawer.id = "rnDrawer";
    drawer.className = "rn-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "Menu de seções");
    drawer.hidden = true;

    var backdrop = document.createElement("div");
    backdrop.className = "rn-drawer-backdrop";
    backdrop.addEventListener("click", closeDrawer);
    drawer.appendChild(backdrop);

    var sheet = document.createElement("nav");
    sheet.className = "rn-drawer-sheet";
    sheet.setAttribute("aria-label", "Seções do site");

    var head = document.createElement("div");
    head.className = "rn-drawer-head";
    head.innerHTML = '<strong>RIDE <span>EDU</span></strong>';
    var close = document.createElement("button");
    close.type = "button";
    close.className = "rn-drawer-close";
    close.setAttribute("aria-label", "Fechar menu");
    close.innerHTML = '<span aria-hidden="true">×</span>';
    close.addEventListener("click", closeDrawer);
    head.appendChild(close);
    sheet.appendChild(head);

    var top = document.createElement("div");
    top.className = "rn-drawer-top";
    top.appendChild(drawerItem("noticias", "Notícias"));
    top.appendChild(drawerItem("apresentacao", "Sobre o RIDE EDU"));
    sheet.appendChild(top);

    AREAS.forEach(function (area) {
      var group = document.createElement("div");
      group.className = "rn-drawer-group";
      var h = document.createElement("p");
      h.className = "rn-drawer-area";
      h.textContent = area.name;
      group.appendChild(h);
      area.panels.forEach(function (p) { group.appendChild(drawerItem(p[0], p[1])); });
      sheet.appendChild(group);
    });

    drawer.appendChild(sheet);
    document.body.appendChild(drawer);

    drawer.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDrawer(); return; }
      if (e.key !== "Tab") return;
      var f = sheet.querySelectorAll("button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeDrawer();
    });
  }

  function markDrawerCurrent() {
    if (!drawer) return;
    var active = document.querySelector(".panel.active");
    var current = active ? active.id.replace("panel-", "") : "noticias";
    drawer.querySelectorAll(".rn-drawer-link").forEach(function (b) {
      var on = b.dataset.drawerPanel === current;
      b.classList.toggle("is-current", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    markDrawerCurrent();
    drawer.hidden = false;
    document.body.classList.add("rn-drawer-open");
    drawerBtn.setAttribute("aria-expanded", "true");
    var cur = drawer.querySelector(".rn-drawer-link.is-current") || drawer.querySelector(".rn-drawer-close");
    if (cur) cur.focus();
  }

  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    document.body.classList.remove("rn-drawer-open");
    drawerBtn.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Chamado por openPanel(): marca no corpo da página qual área está aberta.
  window.rideSyncArea = function (name) {
    var isHome = name === "noticias";
    document.body.classList.toggle("rn-on-home", isHome);
    document.body.classList.toggle("rn-on-data", !isHome && name !== "apresentacao");
    markDrawerCurrent();
  };

  /* ── 3. Números da página inicial ────────────────────────── */
  function parsePct(text) {
    var n = parseFloat(String(text).replace("%", "").replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }
  function fmtPct(n) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  }
  function syncBudgetKpis() {
    try {
      var rows = document.querySelectorAll("#panel-financas table tbody tr");
      if (!rows.length) return;
      var mde = [], rem = [];
      rows.forEach(function (tr) {
        var td = tr.children;
        if (td.length < 6) return;
        var a = parsePct(td[4].textContent), b = parsePct(td[5].textContent);
        if (a !== null) mde.push(a);
        if (b !== null) rem.push(b);
      });
      var set = function (id, arr) {
        var el = document.getElementById(id);
        if (el && arr.length) el.textContent = fmtPct(Math.min.apply(null, arr)) + " a " + fmtPct(Math.max.apply(null, arr));
      };
      set("rnKpiMde", mde);
      set("rnKpiRem", rem);
    } catch (e) { /* mantém o texto estático do HTML */ }
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildAreaBars();
    buildMobileMenu();
    var active = document.querySelector(".panel.active");
    window.rideSyncArea(active ? active.id.replace("panel-", "") : "noticias");
  });
  window.addEventListener("load", function () { setTimeout(syncBudgetKpis, 300); });
})();

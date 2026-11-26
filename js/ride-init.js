/* RIDE EDU · inicialização final (antes dentro do index.html) */
/* ════════════════════════════════════════════════════════
   MOVIMENTO — revelação, contagem de indicadores e cabeçalho
   Enhancement progressivo: só roda com JS; honra prefers-reduced-motion.
   ──────────────────────────────────────────────────────── */
(function(){
  const root = document.documentElement;
  root.classList.add("is-anim");
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Cabeçalho: profundidade ao rolar ---- */
  const header = document.querySelector("body > header");
  if (header){
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
  }

  if (REDUCE) return; // conteúdo permanece visível e estático

  /* ---- Contagem animada dos números (pt-BR) ---- */
  const NUM_SEL = ".kpi-value,.stat-value,.pop-value,.np-stat-value";
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function countUp(el){
    if (el.dataset.counting === "1") return;
    const original = (el.textContent || "").trim();
    const m = original.match(/^(\D*?)(\d[\d.\,]*)(.*)$/s);
    if (!m) return;                         // texto puro (nomes de município): ignora
    const prefix = m[1], token = m[2], suffix = m[3];
    const decimals = (token.split(",")[1] || "").length;
    const target = parseFloat(token.replace(/\./g, "").replace(",", "."));
    if (!isFinite(target)) return;
    if (target > 5_000_000) return;         // salvaguarda
    el.dataset.counting = "1";
    el.classList.add("counting");
    const dur = 950, t0 = performance.now();
    const fmt = v => v.toLocaleString("pt-BR", { minimumFractionDigits:decimals, maximumFractionDigits:decimals });
    function step(now){
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = prefix + fmt(target * easeOut(p)) + suffix;
      if (p < 1){ requestAnimationFrame(step); }
      else { el.textContent = original; el.classList.remove("counting"); el.dataset.counting = "0"; }
    }
    requestAnimationFrame(step);
  }

  /* ---- Revelação em rolagem ---- */
  const REVEAL_SEL = ".kpi,.card,.desig-kpi,.pop-card,.obj-card,.insight-card,.news-card,.home-news-card,.np-story,.np-event,.ride-mini-card";

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      io.unobserve(el);
      el.classList.add("in");
      el.querySelectorAll(NUM_SEL).forEach(countUp);
      const done = () => {
        el.classList.remove("reveal","in");
        el.style.removeProperty("--rev-i");
      };
      el.addEventListener("transitionend", done, { once:true });
      setTimeout(done, 1200);
    });
  }, { threshold:0.08, rootMargin:"0px 0px -6% 0px" });

  function prepare(scope){
    if (!scope) return;
    const seen = new Map();
    scope.querySelectorAll(REVEAL_SEL).forEach(el => {
      // evita revelar blocos aninhados dentro de outro alvo já revelável
      if (el.parentElement && el.parentElement.closest(REVEAL_SEL)) return;
      const key = el.parentElement || scope;
      const i = seen.get(key) || 0; seen.set(key, i + 1);
      el.style.setProperty("--rev-i", Math.min(i, 7));
      el.classList.add("reveal");
      el.classList.remove("in");
      io.observe(el);
    });
  }

  /* ---- Prepara painel ativo agora e a cada troca de aba ---- */
  const panels = document.querySelectorAll(".panel");
  const active = document.querySelector(".panel.active");
  if (active) prepare(active);

  const paneMo = new MutationObserver(muts => {
    muts.forEach(mut => {
      const p = mut.target;
      if (p.classList.contains("active")){
        // re-renderizações internas (IDEB, comparativo…) já concluíram neste ponto
        requestAnimationFrame(() => prepare(p));
      }
    });
  });
  panels.forEach(p => paneMo.observe(p, { attributes:true, attributeFilter:["class"] }));
})();

// Cartão "Margens" (antigo Vale Educa) da aba Sobre: sempre mostra a edição atual (antes era texto fixo)
(function () {
  try {
    if (!window.RIDE_EDICOES) return;
    var id = window.RIDE_EDICOES.atual();
    var ed = window.RIDE_EDICOES.mapa()[id];
    var card = Array.prototype.find.call(document.querySelectorAll(".home-news-card"), function (c) {
      var t = c.querySelector(".home-news-tag");
      return c.getAttribute("data-panel-target") === "noticias" && t && /Vale Educa|Margens/.test(t.textContent);
    });
    if (!ed || !card) return;
    var tag = card.querySelector(".home-news-tag");
    var p = card.querySelector("p");
    if (tag && ed.shortDate) tag.textContent = "Margens · " + ed.shortDate;
    if (p && ed.spotlight && ed.spotlight.title) p.textContent = "Nova edição: " + ed.spotlight.title + ".";
  } catch (e) { /* mantém o texto do HTML */ }
})();

// Logo do cabeçalho: volta à página de abertura (notícias) na própria aba
(function () {
  var logo = document.querySelector("header a.logo");
  if (!logo) return;
  logo.addEventListener("click", function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // nova aba: comportamento normal do link
    if (typeof openPanel !== "function") return;
    e.preventDefault();
    openPanel(HOME_PANEL);
  });
})();

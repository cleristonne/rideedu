/* RIDE EDU · lógica do site: gráficos, navegação, seções, notícias e VAAR.
   Antes dentro do index.html. Depende de js/ride-dados.js e newsletters/edicoes.js. */
// Edições do Vale Educa: cada uma fica em newsletters/edicoes/<id>.js e se
// registra em RIDE_EDICOES (newsletters/edicoes.js). A primeira registrada é a atual.
// Como publicar uma edição nova: COMO-PUBLICAR-EDICAO.txt
const NEWSLETTER_ISSUES = window.RIDE_EDICOES ? window.RIDE_EDICOES.mapa() : {};
let ACTIVE_NEWSLETTER_ID = window.RIDE_EDICOES ? window.RIDE_EDICOES.atual() : "";
const MUNICIPIOS = ["Petrolina","Juazeiro","Casa Nova","Curaçá","Lagoa Grande","Orocó","Santa Maria da Boa Vista","Sobradinho"];
const YEARS_FUNDEB = ["2020","2021","2022","2023","2024","2025"];
const YEARS_COVER = ["2014","2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"];
const COLORS = ["#1A3FD6","#EB6834","#1BAF7A","#EDA100","#E87BA4","#008300","#6250D6","#E34948"];

let chartRefs = {};

// ── Formatters ──
const fmtInt = v => new Intl.NumberFormat("pt-BR").format(v || 0);
const fmtPct = (v, d=1) => (v == null || isNaN(v)) ? "—" : new Intl.NumberFormat("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(v)+"%";
const fmtMoneyMi = v => (v == null || isNaN(v)) ? "—" : "R$ "+new Intl.NumberFormat("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1}).format(v/1e6)+" mi";
const mean = arr => { const v=arr.filter(x=>x!=null&&!isNaN(x)); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; };
const sum = arr => arr.reduce((a,b)=>a+(Number(b)||0),0);
const abbr = m => m.replace("Santa Maria da Boa Vista","Sta. Maria");

// ── Chart helpers ──
function destroyChart(id) { if(chartRefs[id]){ chartRefs[id].destroy(); delete chartRefs[id]; } }

const chartDefaults = {
  font: { family: "Inter, system-ui, sans-serif", size: 12, weight: '500' },
  color: '#0B1530'
};

function applyDefaults(options) {
  return {
    ...options,
    plugins: {
      ...options.plugins,
      legend: { labels: { font: chartDefaults.font, color: chartDefaults.color, boxWidth: 18, boxHeight: 10, padding: 16 }, ...(options.plugins?.legend || {}) }
    }
  };
}

// Rótulo de valor sobre a barra. short=true: forma curta quando a barra é estreita.
function barValueLabel(v, opts, short) {
  const nf = d => new Intl.NumberFormat("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
  if (opts.money) {
    const n = nf(Math.abs(v) >= 100 ? 0 : 1).format(v);
    return short ? n : "R$ " + n + " mi";
  }
  if (opts.percent) return nf(1).format(v) + (short ? "" : "%");
  return fmtInt(v);
}

function mkBar(id, labels, data, opts={}) {
  destroyChart(id);
  // Ordena do maior para o menor (cores acompanham cada município).
  // Use opts.sort === false para manter a ordem original.
  let colors = opts.colors || "#1A3FD6";
  if (opts.sort !== false) {
    const idx = data.map((_, i) => i).sort((a, b) => (data[b] ?? -Infinity) - (data[a] ?? -Infinity));
    labels = idx.map(i => labels[i]);
    data = idx.map(i => data[i]);
    if (Array.isArray(colors)) colors = idx.map(i => colors[i]);
  }
  chartRefs[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 5, borderSkipped: false }] },
    options: applyDefaults({
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 22 } },
      plugins: {
        rnValueLabels: { format: (v, short) => barValueLabel(v, opts, short) },
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => opts.money ? fmtMoneyMi(ctx.parsed.y*1e6) : opts.percent ? fmtPct(ctx.parsed.y) : fmtInt(ctx.parsed.y) } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45, font: chartDefaults.font, color: chartDefaults.color } },
        y: { beginAtZero: true, grid: { color: '#E6E9F0' }, ticks: { callback: v => opts.money ? "R$ "+v+"mi" : opts.percent ? v+"%" : v, font: chartDefaults.font, color: chartDefaults.color }, suggestedMax: opts.percent ? 100 : undefined }
      }
    })
  });
}

function mkLine(id, labels, datasets, opts={}) {
  destroyChart(id);
  chartRefs[id] = new Chart(document.getElementById(id), {
    type: "line",
    data: { labels, datasets },
    options: applyDefaults({
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { grid: { display: false }, ticks: { font: chartDefaults.font, color: chartDefaults.color } },
        y: { beginAtZero: opts.beginZero ?? true, grid: { color: '#E6E9F0' }, ticks: { callback: v => opts.money ? "R$"+v+"mi" : opts.percent ? v+"%" : v, font: chartDefaults.font, color: chartDefaults.color } }
      }
    })
  });
}

function mkHorizontal(id, labels, datasets, opts={}) {
  destroyChart(id);
  chartRefs[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels, datasets },
    options: applyDefaults({
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: ctx => opts.money ? fmtMoneyMi(ctx.parsed.x*1e6) : fmtPct(ctx.parsed.x) } } },
      scales: {
        x: { beginAtZero: true, grid: { color: '#E6E9F0' }, ticks: { callback: v => opts.money ? "R$"+v : opts.percent ? v+"%" : v, font: chartDefaults.font, color: chartDefaults.color }, suggestedMax: opts.percent ? 100 : undefined },
        y: { grid: { display: false }, ticks: { font: chartDefaults.font, color: chartDefaults.color } }
      }
    })
  });
}

// Área empilhada — séries temporais com composição
function mkStackedArea(id, labels, datasets, opts={}) {
  destroyChart(id);
  const dsWithFill = datasets.map((d, i) => ({
    ...d,
    fill: true,
    tension: .3,
    borderWidth: 1.5,
    pointRadius: 2.5,
    pointHoverRadius: 5
  }));
  chartRefs[id] = new Chart(document.getElementById(id), {
    type: "line",
    data: { labels, datasets: dsWithFill },
    options: applyDefaults({
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${opts.money ? fmtMoneyMi(ctx.parsed.y*1e6) : fmtPct(ctx.parsed.y)}`,
            footer: items => {
              const total = items.reduce((s, it) => s + it.parsed.y, 0);
              return `Total: ${opts.money ? fmtMoneyMi(total*1e6) : fmtPct(total)}`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: chartDefaults.font, color: chartDefaults.color } },
        y: { beginAtZero: true, stacked: true, grid: { color: '#E6E9F0' }, ticks: { callback: v => opts.money ? "R$"+v+"mi" : opts.percent ? v+"%" : v, font: chartDefaults.font, color: chartDefaults.color } }
      }
    })
  });
}

// Barras empilhadas verticais — séries temporais por categoria
function mkStackedBar(id, labels, datasets, opts={}) {
  destroyChart(id);
  chartRefs[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels, datasets: datasets.map(d => ({ ...d, borderWidth: 0, borderRadius: 3 })) },
    options: applyDefaults({
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${opts.money ? fmtMoneyMi(ctx.parsed.y*1e6) : fmtPct(ctx.parsed.y)}`,
            footer: items => {
              const total = items.reduce((s, it) => s + it.parsed.y, 0);
              return `Total: ${opts.money ? fmtMoneyMi(total*1e6) : fmtPct(total)}`;
            }
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: chartDefaults.font, color: chartDefaults.color } },
        y: { stacked: true, beginAtZero: true, grid: { color: '#E6E9F0' }, ticks: { callback: v => opts.money ? "R$"+v+"mi" : opts.percent ? v+"%" : v, font: chartDefaults.font, color: chartDefaults.color } }
      }
    })
  });
}

// ── Navigation ──
const VALID_PANELS = ["apresentacao","visao","ideb2025","comparativo","infantil","ideb","calculadoras","alfabetizacao","censo","desigualdades","populacao","financas","vaar","evolucao","municipio","noticias"];

// Página inicial: notícias. A apresentação institucional passou a ser a aba "Sobre".
const HOME_PANEL = "noticias";

// Na página inicial, as seções de dados abrem em nova aba do navegador,
// para que as notícias continuem abertas. Dentro de uma seção de dados,
// a navegação acontece na própria aba.
function rideNavigate(name) {
  const active = document.querySelector(".panel.active");
  const onHome = active && active.id === "panel-" + HOME_PANEL;
  const isData = VALID_PANELS.includes(name) && name !== HOME_PANEL && name !== "apresentacao";
  if (onHome && isData) {
    window.open(window.location.pathname + window.location.search + "#" + name, "_blank", "noopener");
    document.querySelectorAll(".nav-group[open]").forEach(group => group.removeAttribute("open"));
    return;
  }
  openPanel(name);
}

function openPanel(name, opts = {}) {
  if (!VALID_PANELS.includes(name)) name = HOME_PANEL;
  document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const tab = document.querySelector(`.nav-tab[data-panel="${name}"]`);
  if (tab) tab.classList.add("active");
  document.querySelectorAll(".nav-group").forEach(group => {
    group.classList.toggle("has-active", Boolean(group.querySelector(".nav-tab.active")));
    group.removeAttribute("open");
  });
  const panel = document.getElementById("panel-" + name);
  if (panel) panel.classList.add("active");
  if (!opts.silentScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "ideb2025" && typeof window.renderIdeb2025 === "function") window.renderIdeb2025();
  if (name === "ideb") renderIdeb();
  if (name === "alfabetizacao") renderAlfabetizacao();
  if (name === "municipio") renderMunicipio();
  if (name === "comparativo") renderComparativo();
  if (name === "evolucao") renderEvolucao();
  if (name === "vaar") initVaar();

  // Atualiza URL com hash da aba (sem recarregar)
  if (!opts.fromHash) {
    const newHash = name === HOME_PANEL ? "" : "#" + name;
    if (window.location.hash !== newHash) {
      history.replaceState(null, "", window.location.pathname + window.location.search + newHash);
    }
  }
  if (typeof window.rideSyncArea === "function") window.rideSyncArea(name);
}

function getPanelFromHash() {
  // Aceita parâmetros depois da seção: #municipio?m=Juazeiro (lidos por ride-extras.js)
  const h = (window.location.hash || "").replace(/^#/, "").split("?")[0].trim().toLowerCase();
  return VALID_PANELS.includes(h) ? h : null;
}

function setupNav() {
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", () => rideNavigate(btn.dataset.panel));
  });
  document.addEventListener("click", event => {
    document.querySelectorAll(".nav-group[open]").forEach(group => {
      if (!group.contains(event.target)) group.removeAttribute("open");
    });
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      document.querySelectorAll(".nav-group[open]").forEach(group => group.removeAttribute("open"));
    }
  });
  // Botões/ cards que apontam para painéis por data-panel-target
  // Inclui atalhos do hero e cards editoriais da página inicial.
  document.querySelectorAll("[data-panel-target]").forEach(btn => {
    btn.addEventListener("click", () => rideNavigate(btn.dataset.panelTarget));
    if (btn.tagName === "BUTTON" || btn.tagName === "A") return;
    btn.setAttribute("role", btn.getAttribute("role") || "button");
    btn.setAttribute("tabindex", btn.getAttribute("tabindex") || "0");
    btn.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        rideNavigate(btn.dataset.panelTarget);
      }
    });
  });
  // Botões inline com data-goto-panel (links cruzados entre painéis)
  document.querySelectorAll("[data-goto-panel]").forEach(btn => {
    btn.addEventListener("click", () => openPanel(btn.dataset.gotoPanel));
  });
  // Deep-link: responder a mudanças de hash (ex: link colado, botão voltar)
  window.addEventListener("hashchange", () => {
    const p = getPanelFromHash();
    openPanel(p || HOME_PANEL, { fromHash: true });
  });
  // Aplicar hash inicial, se houver
  const initial = getPanelFromHash();
  if (initial) openPanel(initial, { fromHash: true, silentScroll: true });
}

// ── Render: Visão Geral ──
function renderOverview() {
  const fundeb2025 = sum(MUNICIPIOS.map(m => DATA[m].fundeb["2025"]));
  const investTotal = sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie["2025"].total));
  const creche2024 = mean(MUNICIPIOS.map(m => DATA[m].creche["2025"]));
  const pre2024 = mean(MUNICIPIOS.map(m => DATA[m].pre["2025"]));
  const totalSchools = sum(MUNICIPIOS.map(m => DATA[m].censo.escolas));
  const totalMat = sum(MUNICIPIOS.map(m => DATA[m].censo.creche + DATA[m].censo.pre + DATA[m].censo.anos_iniciais + DATA[m].censo.anos_finais));

  const accentCls = ["","orange","green","purple","amber","teal"];
  const kpis = [
    ["Fundeb 2025 — RIDE", fmtMoneyMi(fundeb2025), "Receita realizada somada dos oito municípios", ""],
    ["Educação infantil 2025", fmtMoneyMi(investTotal), "Investimentos estimados em creche e pré-escola", "orange"],
    ["Cobertura média em creche", fmtPct(creche2024), "Taxa líquida média da RIDE em 2025", "green"],
    ["Cobertura média em pré-escola", fmtPct(pre2024), "Taxa líquida média da RIDE em 2025", "purple"],
    ["Escolas municipais", fmtInt(totalSchools), "Rede municipal — Censo 2025", "amber"],
    ["Matrículas — quatro etapas", fmtInt(totalMat), "Creche, pré-escola, iniciais e finais", "teal"]
  ];
  document.getElementById("overviewKpis").innerHTML = kpis.map(([label,val,note,cls]) => `
    <div class="kpi ${cls}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${val}</div>
      <div class="kpi-note">${note}</div>
    </div>`).join("");

  const rideSeries = YEARS_FUNDEB.map(y => sum(MUNICIPIOS.map(m => DATA[m].fundeb[y]))/1e6);
  mkLine("chartFundebRide", YEARS_FUNDEB, [{
    label:"RIDE", data:rideSeries, borderColor:"#1A3FD6", backgroundColor:"rgba(26,63,214,.08)", fill:true, tension:.28, borderWidth:2.5, pointRadius:4, pointBackgroundColor:"#1A3FD6"
  }], {money:true});

  const topFundeb = MUNICIPIOS.slice().sort((a,b)=>DATA[b].fundeb["2025"]-DATA[a].fundeb["2025"])[0];
  const topCreche = MUNICIPIOS.slice().sort((a,b)=>DATA[b].creche["2025"]-DATA[a].creche["2025"])[0];
  const topPre = MUNICIPIOS.slice().sort((a,b)=>DATA[b].pre["2025"]-DATA[a].pre["2025"])[0];
  const topMde = MUNICIPIOS.slice().sort((a,b)=>DATA[b].mde["2025"].percent-DATA[a].mde["2025"].percent)[0];
  document.getElementById("overviewMini").innerHTML = `
    <div class="stat"><div class="stat-label">Maior Fundeb 2025</div><div class="stat-value">${topFundeb}</div><div class="stat-sub">${fmtMoneyMi(DATA[topFundeb].fundeb["2025"])}</div></div>
    <div class="stat"><div class="stat-label">Maior cobertura em creche</div><div class="stat-value">${topCreche}</div><div class="stat-sub">${fmtPct(DATA[topCreche].creche["2025"])}</div></div>
    <div class="stat"><div class="stat-label">Maior cobertura em pré-escola</div><div class="stat-value">${topPre}</div><div class="stat-sub">${fmtPct(DATA[topPre].pre["2025"])}</div></div>
    <div class="stat"><div class="stat-label">Maior MDE 2025</div><div class="stat-value">${topMde}</div><div class="stat-sub">${fmtPct(DATA[topMde].mde["2025"].percent)}</div></div>
  `;
  mkBar("chartCreche2025", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m => DATA[m].creche["2025"]), {percent:true});
  mkBar("chartPre2025", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m => DATA[m].pre["2025"]), {percent:true});
}

// ── Render: Infantil ──
function renderInfantil() {
  const rideCreche = YEARS_COVER.map(y => mean(MUNICIPIOS.map(m => DATA[m].creche[y])));
  const ridePre = YEARS_COVER.map(y => mean(MUNICIPIOS.map(m => DATA[m].pre[y])));
  mkLine("chartCrecheSeries", YEARS_COVER, [
    {label:"RIDE", data:rideCreche, borderColor:"#1A3FD6", fill:false, tension:.25, borderWidth:2.5, pointRadius:3},
    {label:"Brasil", data:YEARS_COVER.map(y=>DATA["Brasil"].creche[y]), borderColor:"#EB6834", fill:false, tension:.25, borderWidth:2.5, pointRadius:3, borderDash:[6,3]}
  ], {percent:true});
  mkLine("chartPreSeries", YEARS_COVER, [
    {label:"RIDE", data:ridePre, borderColor:"#1A3FD6", fill:false, tension:.25, borderWidth:2.5, pointRadius:3},
    {label:"Brasil", data:YEARS_COVER.map(y=>DATA["Brasil"].pre[y]), borderColor:"#EB6834", fill:false, tension:.25, borderWidth:2.5, pointRadius:3, borderDash:[6,3]}
  ], {percent:true});
  // Evolução 2020-2025 da composição do investimento em educação infantil — RIDE consolidada
  const yearsEdInf = ["2020","2021","2022","2023","2024","2025"];
  const fundebSerie = yearsEdInf.map(y => sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie[y].fundeb))/1e6);
  const mdeSerie    = yearsEdInf.map(y => sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie[y].mde))/1e6);
  const outrasSerie = yearsEdInf.map(y => sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie[y].outras))/1e6);
  mkStackedArea("chartInvestEdInf", yearsEdInf, [
    {label:"Fundeb (creche + pré-escola)", data:fundebSerie, backgroundColor:"rgba(26,63,214,.78)",  borderColor:"#1A3FD6"},
    {label:"MDE (creche + pré-escola)",    data:mdeSerie,    backgroundColor:"rgba(235,104,52,.78)", borderColor:"#EB6834"},
    {label:"Outras fontes",                 data:outrasSerie, backgroundColor:"rgba(27,175,122,.78)", borderColor:"#1BAF7A"}
  ], {money:true});

  const fasterCreche = MUNICIPIOS.slice().sort((a,b)=>(DATA[b].creche["2025"]-DATA[b].creche["2014"])-(DATA[a].creche["2025"]-DATA[a].creche["2014"]))[0];
  const slowerCreche = MUNICIPIOS.slice().sort((a,b)=>(DATA[a].creche["2025"]-DATA[a].creche["2014"])-(DATA[b].creche["2025"]-DATA[b].creche["2014"]))[0];
  const topPre = MUNICIPIOS.slice().sort((a,b)=>DATA[b].pre["2025"]-DATA[a].pre["2025"])[0];
  const preOver100 = MUNICIPIOS.filter(m => DATA[m].pre["2022"]>100);
  document.getElementById("infantilMini").innerHTML = `
    <div class="stat"><div class="stat-label">Maior expansão em creche (2014–2025)</div><div class="stat-value">${fasterCreche}</div><div class="stat-sub">${fmtPct(DATA[fasterCreche].creche["2025"]-DATA[fasterCreche].creche["2014"])} pontos</div></div>
    <div class="stat"><div class="stat-label">Menor expansão em creche</div><div class="stat-value">${slowerCreche}</div><div class="stat-sub">${fmtPct(DATA[slowerCreche].creche["2025"]-DATA[slowerCreche].creche["2014"])} pontos</div></div>
    <div class="stat"><div class="stat-label">Maior pré-escola em 2025</div><div class="stat-value">${topPre}</div><div class="stat-sub">${fmtPct(DATA[topPre].pre["2025"])}</div></div>
    <div class="stat"><div class="stat-label">Dado que exige cautela</div><div class="stat-value">${preOver100.join(", ")||"—"}</div><div class="stat-sub">Taxa líquida acima de 100% em 2022</div></div>
  `;

  // Tabela de taxas por município
  const anosTabela = ["2020","2021","2022","2023","2024","2025"];
  document.getElementById("infantilTaxasTableWrap").innerHTML = `
    <table>
      <thead>
        <tr>
          <th rowspan="2">Município</th>
          <th colspan="6" style="text-align:center;background:#fff5f0;color:#EB6834">Creche — 0 a 3 anos (%)</th>
          <th colspan="6" style="text-align:center;background:#f0faf4;color:#1BAF7A">Pré-escola — 4 a 5 anos (%)</th>
        </tr>
        <tr>
          ${anosTabela.map(y=>`<th style="background:#fff5f0">${y}</th>`).join("")}
          ${anosTabela.map(y=>`<th style="background:#f0faf4">${y}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${MUNICIPIOS.map(m=>`
          <tr>
            <td><strong>${m}</strong></td>
            ${anosTabela.map(y=>{const v=DATA[m].creche[y];return`<td class="num">${v!=null?fmtPct(v,1):"—"}</td>`}).join("")}
            ${anosTabela.map(y=>{const v=DATA[m].pre[y];return`<td class="num">${v!=null?fmtPct(v,1):"—"}</td>`}).join("")}
          </tr>`).join("")}
        <tr style="border-top:2px solid var(--border-strong);background:var(--cream)">
          <td><strong>Brasil</strong></td>
          ${anosTabela.map(y=>{const v=DATA["Brasil"].creche[y];return`<td class="num">${v!=null?fmtPct(v,1):"—"}</td>`}).join("")}
          ${anosTabela.map(y=>{const v=DATA["Brasil"].pre[y];return`<td class="num">${v!=null?fmtPct(v,1):"—"}</td>`}).join("")}
        </tr>
      </tbody>
    </table>
  `;
}

// ── Render: IDEB ──
function renderIdeb() {
  const stage = document.getElementById("idebStageSelect").value;
  const rows = MUNICIPIOS.map(m => ({ muni:m, ...(DATA[m].ideb[stage]||{}) }));
  document.getElementById("idebCards").innerHTML = rows.map(r => {
    const hit = r.ideb!=null && r.meta!=null && r.ideb>=r.meta;
    const cls = r.ideb==null ? "" : hit ? "green" : "orange";
    return `<div class="kpi ${cls}">
      <div class="kpi-label">${stage==="iniciais"?"Anos iniciais":"Anos finais"}</div>
      <div class="kpi-value">${r.ideb==null?"—":r.ideb.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</div>
      <div class="kpi-note"><strong>${r.muni}</strong> · Meta ${r.meta==null?"—":r.meta.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} · ${r.ideb==null?"Sem dado":hit?"✓ Atingiu":"✗ Abaixo"}</div>
    </div>`;
  }).join("");

  mkBar("chartIdebCompare", rows.map(r=>abbr(r.muni)), rows.map(r=>r.ideb??0));
  destroyChart("chartIdebFlow");
  chartRefs["chartIdebFlow"] = new Chart(document.getElementById("chartIdebFlow"), {
    type:"bar",
    data:{ labels:rows.map(r=>abbr(r.muni)), datasets:[
      {label:"Aprendizado", data:rows.map(r=>r.aprendizado??0), backgroundColor:"#1A3FD6", borderRadius:5},
      {label:"Fluxo", data:rows.map(r=>r.fluxo??0), backgroundColor:"#EB6834", borderRadius:5}
    ]},
    options: applyDefaults({ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:"bottom"}}, scales:{y:{beginAtZero:true,grid:{color:'#E6E9F0'},ticks:{font:chartDefaults.font,color:chartDefaults.color}},x:{grid:{display:false},ticks:{font:chartDefaults.font,color:chartDefaults.color,maxRotation:45}}} })
  });

  document.getElementById("idebTableWrap").innerHTML = `<table>
    <thead><tr><th>Município</th><th>IDEB</th><th>Meta</th><th>Aprendizado</th><th>Fluxo</th><th>Port.</th><th>Mat.</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td><strong>${r.muni}</strong></td>
      <td class="num">${r.ideb==null?"—":r.ideb.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</td>
      <td class="num">${r.meta==null?"—":r.meta.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</td>
      <td class="num">${r.aprendizado==null?"—":r.aprendizado.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td class="num">${r.fluxo==null?"—":r.fluxo.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      <td class="num">${r.port==null?"—":r.port.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</td>
      <td class="num">${r.mat==null?"—":r.mat.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</td>
    </tr>`).join("")}</tbody>
  </table>`;
}

// ── Render: Censo ──
function renderCenso() {
  const totalEscolas = sum(MUNICIPIOS.map(m=>DATA[m].censo.escolas));
  const totalMat = sum(MUNICIPIOS.map(m=>DATA[m].censo.anos_iniciais+DATA[m].censo.anos_finais));
  const totalCreche = sum(MUNICIPIOS.map(m=>DATA[m].censo.creche));
  const totalPre = sum(MUNICIPIOS.map(m=>DATA[m].censo.pre));
  const totalMedio = sum(MUNICIPIOS.map(m=>DATA[m].censo.medio));
  const totalEja = sum(MUNICIPIOS.map(m=>DATA[m].censo.eja));
  document.getElementById("censoKpis").innerHTML = `
    <div class="kpi"><div class="kpi-label">Escolas municipais</div><div class="kpi-value">${fmtInt(totalEscolas)}</div><div class="kpi-note">Rede municipal — Censo 2025</div></div>
    <div class="kpi orange"><div class="kpi-label">Matrículas em creche</div><div class="kpi-value">${fmtInt(totalCreche)}</div><div class="kpi-note">Rede municipal</div></div>
    <div class="kpi green"><div class="kpi-label">Matrículas em pré-escola</div><div class="kpi-value">${fmtInt(totalPre)}</div><div class="kpi-note">Rede municipal</div></div>
    <div class="kpi purple"><div class="kpi-label">Anos iniciais e finais</div><div class="kpi-value">${fmtInt(totalMat)}</div><div class="kpi-note">Rede municipal</div></div>
    <div class="kpi amber"><div class="kpi-label">Ensino médio</div><div class="kpi-value">${fmtInt(totalMedio)}</div><div class="kpi-note">Rede municipal</div></div>
    <div class="kpi teal"><div class="kpi-label">EJA</div><div class="kpi-value">${fmtInt(totalEja)}</div><div class="kpi-note">Educação de Jovens e Adultos</div></div>
  `;
  destroyChart("chartCensoTotals");
  chartRefs["chartCensoTotals"] = new Chart(document.getElementById("chartCensoTotals"),{
    type:"bar",
    data:{
      labels:["Creche","Pré-escola","Anos iniciais","Anos finais","Médio","EJA"],
      datasets:[{data:[totalCreche,totalPre,sum(MUNICIPIOS.map(m=>DATA[m].censo.anos_iniciais)),sum(MUNICIPIOS.map(m=>DATA[m].censo.anos_finais)),totalMedio,totalEja],backgroundColor:COLORS,borderRadius:5}]
    },
    options:applyDefaults({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:chartDefaults.font,color:chartDefaults.color}},y:{beginAtZero:true,grid:{color:'#E6E9F0'},ticks:{font:chartDefaults.font,color:chartDefaults.color}}}})
  });
  mkBar("chartCensoSchools", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m=>DATA[m].censo.escolas));
  document.getElementById("censoTableWrap").innerHTML = `<table>
    <thead><tr><th>Município</th><th>UF</th><th>Escolas</th><th>Doc. Iniciais</th><th>Doc. Finais</th><th>Creche</th><th>Pré-escola</th><th>Anos iniciais</th><th>Anos finais</th><th>Médio</th><th>EJA</th></tr></thead>
    <tbody>${MUNICIPIOS.map(m=>{const c=DATA[m].censo;return`<tr><td><strong>${m}</strong></td><td class="num">${c.uf}</td><td class="num">${fmtInt(c.escolas)}</td><td class="num">${fmtInt(c.prof_iniciais)}</td><td class="num">${fmtInt(c.prof_finais)}</td><td class="num">${fmtInt(c.creche)}</td><td class="num">${fmtInt(c.pre)}</td><td class="num">${fmtInt(c.anos_iniciais)}</td><td class="num">${fmtInt(c.anos_finais)}</td><td class="num">${fmtInt(c.medio)}</td><td class="num">${fmtInt(c.eja)}</td></tr>`;}).join("")}</tbody>
  </table>
  <div class="alert" style="margin-top:14px">Fonte: QEdu/Inep — Censo Escolar 2025, rede pública municipal, escolas rurais e urbanas. Os dados de Ensino Médio e EJA incluem matrículas registradas na rede municipal; em municípios como Casa Nova e Curaçá, o Ensino Médio é ofertado exclusivamente pela rede estadual, razão pela qual o QEdu registra 0 professores de EM na rede municipal mesmo quando há matrículas da rede estadual no território.</div>`;
}

// ── Render: Desigualdades ──
function renderDesigualdades() {
  const items = MUNICIPIOS.map(m=>({muni:m,...DESIG[m]}));
  const habilitados = items.filter(x=>x.vaar).length;
  const mediaBolsa = mean(items.map(x=>x.bolsa));
  const mediaGap = mean(items.map(x=>x.high-x.low));
  const maiorRural = items.slice().sort((a,b)=>b.rural-a.rural)[0];
  const maiorVaar = items.slice().sort((a,b)=>b.vaar_valor_2025-a.vaar_valor_2025)[0];
  document.getElementById("desigKpis").innerHTML = `
    <div class="desig-kpi"><div class="kpi-label">Receberam VAAR 2025</div><div class="kpi-value">${habilitados} / 8</div></div>
    <div class="desig-kpi"><div class="kpi-label">Bolsa Família médio</div><div class="kpi-value">${fmtPct(mediaBolsa)}</div></div>
    <div class="desig-kpi"><div class="kpi-label">Hiato médio de aprendizagem</div><div class="kpi-value">${fmtPct(mediaGap)}</div></div>
    <div class="desig-kpi"><div class="kpi-label">Maior ruralidade</div><div class="kpi-value">${maiorRural.muni}</div></div>
    <div class="desig-kpi"><div class="kpi-label">Maior VAAR 2025</div><div class="kpi-value">${maiorVaar.muni}</div></div>
  `;
  const insights = [
    {icon:"✅",title:"Todos receberam VAAR em 2025",body:"Os oito municípios da RIDE registraram receita de complementação VAAR no RREO de 2025, ainda que em intensidades muito diferentes."},
    {icon:"💰",title:"VAAR concentrado nos maiores sistemas",body:"Petrolina (R$ 3,7 mi), Santa Maria da Boa Vista (R$ 3,36 mi), Casa Nova (R$ 1,73 mi) e Juazeiro (R$ 1,40 mi) lideram os valores recebidos."},
    {icon:"🌾",title:"Vulnerabilidade continua desigual",body:"Orocó (80,0% de Bolsa Família) e Santa Maria da Boa Vista (74,3%) seguem com maior pressão social, somando alta dependência de transferência de renda e forte peso rural."},
    {icon:"📉",title:"O hiato permanece",body:"Em 2023, o aprendizado adequado entre estudantes de NSE baixo foi de apenas 7,9% em Casa Nova e 8,5% em Orocó, muito abaixo de Petrolina (37,4%) e Lagoa Grande (30,7%)."}
  ];
  document.getElementById("desigInsights").innerHTML = insights.map(i=>`
    <div class="insight-card">
      <div class="insight-icon">${i.icon}</div>
      <div class="insight-title">${i.title}</div>
      <div class="insight-body">${i.body}</div>
    </div>`).join("");

  destroyChart("chartDesigContexto");
  chartRefs["chartDesigContexto"] = new Chart(document.getElementById("chartDesigContexto"),{
    type:"bar",
    data:{labels:items.map(x=>abbr(x.muni)),datasets:[
      {label:"Bolsa Família",data:items.map(x=>x.bolsa),backgroundColor:"#EB6834",borderRadius:5},
      {label:"Pop. rural",data:items.map(x=>x.rural),backgroundColor:"#1BAF7A",borderRadius:5}
    ]},
    options:applyDefaults({responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:true,suggestedMax:100,grid:{color:'#E6E9F0'},ticks:{callback:v=>v+"%",font:chartDefaults.font,color:chartDefaults.color}},x:{grid:{display:false},ticks:{maxRotation:45,font:chartDefaults.font,color:chartDefaults.color}}}})
  });
  destroyChart("chartDesigAprendiz");
  chartRefs["chartDesigAprendiz"] = new Chart(document.getElementById("chartDesigAprendiz"),{
    type:"bar",
    data:{labels:items.map(x=>abbr(x.muni)),datasets:[
      {label:"NSE baixo",data:items.map(x=>x.low),backgroundColor:"#1A3FD6",borderRadius:5},
      {label:"NSE alto",data:items.map(x=>x.high),backgroundColor:"#EB6834",borderRadius:5}
    ]},
    options:applyDefaults({responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:true,suggestedMax:60,grid:{color:'#E6E9F0'},ticks:{callback:v=>v+"%",font:chartDefaults.font,color:chartDefaults.color}},x:{grid:{display:false},ticks:{maxRotation:45,font:chartDefaults.font,color:chartDefaults.color}}}})
  });
  document.getElementById("desigTableWrap").innerHTML = `<table>
    <thead><tr><th>Município</th><th>Bolsa Família</th><th>Não alf.</th><th>Pop. rural</th><th>NSE baixo</th><th>Aprend. NSE baixo</th><th>VAAR 2025</th><th>Situação</th></tr></thead>
    <tbody>${items.map(x=>`<tr>
      <td><strong>${x.muni}</strong></td>
      <td class="num">${fmtPct(x.bolsa)}</td><td class="num">${fmtPct(x.naoalf)}</td><td class="num">${fmtPct(x.rural)}</td>
      <td class="num">${fmtPct(x.nse_baixo)}</td><td class="num">${fmtPct(x.low)}</td>
      <td class="num">${fmtMoneyMi(x.vaar_valor_2025||0)}</td>
      <td>${x.vaar?'<span class="pill green">Recebeu VAAR</span>':'<span class="pill orange">Sem VAAR</span>'}</td>
    </tr>`).join("")}</tbody>
  </table>`;
}

// ── Render: População ──
function renderPopulacao() {
  const items = MUNICIPIOS.map(m=>({muni:m,...POP[m]}));
  const total2022 = sum(items.map(x=>x.censo2022));
  const total2025 = sum(items.map(x=>x.est2025));
  const maior = items.slice().sort((a,b)=>b.est2025-a.est2025)[0];
  const menor = items.slice().sort((a,b)=>a.est2025-b.est2025)[0];
  const crescMedio = mean(items.map(x=>((x.est2025-x.censo2022)/x.censo2022)*100));
  document.getElementById("popKpis").innerHTML = `
    <div class="pop-card"><div class="pop-label">RIDE no Censo 2022</div><div class="pop-value">${fmtInt(total2022)}</div></div>
    <div class="pop-card"><div class="pop-label">Estimativa oficial 2025</div><div class="pop-value">${fmtInt(total2025)}</div></div>
    <div class="pop-card"><div class="pop-label">Maior município</div><div class="pop-value">${maior.muni}</div></div>
    <div class="pop-card"><div class="pop-label">Menor município</div><div class="pop-value">${menor.muni}</div></div>
    <div class="pop-card"><div class="pop-label">Crescimento médio</div><div class="pop-value">${fmtPct(crescMedio)}</div></div>
  `;
  destroyChart("chartPopComp");
  chartRefs["chartPopComp"] = new Chart(document.getElementById("chartPopComp"),{
    type:"bar",
    data:{labels:items.map(x=>abbr(x.muni)),datasets:[
      {label:"Censo 2022",data:items.map(x=>x.censo2022),backgroundColor:"#1A3FD6",borderRadius:5},
      {label:"Est. 2025",data:items.map(x=>x.est2025),backgroundColor:"#EB6834",borderRadius:5}
    ]},
    options:applyDefaults({responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:true,grid:{color:'#E6E9F0'},ticks:{font:chartDefaults.font,color:chartDefaults.color}},x:{grid:{display:false},ticks:{maxRotation:45,font:chartDefaults.font,color:chartDefaults.color}}}})
  });
  mkBar("chartPopVar", items.map(x=>abbr(x.muni)), items.map(x=>((x.est2025-x.censo2022)/x.censo2022)*100), {percent:true, colors:Array(8).fill("#1A3FD6")});
  document.getElementById("popTableWrap").innerHTML = `<table>
    <thead><tr><th>Município</th><th>Censo 2022</th><th>Est. 2025</th><th>Variação %</th></tr></thead>
    <tbody>${items.map(x=>`<tr><td><strong>${x.muni}</strong></td><td class="num">${fmtInt(x.censo2022)}</td><td class="num">${fmtInt(x.est2025)}</td><td class="num">${fmtPct(((x.est2025-x.censo2022)/x.censo2022)*100)}</td></tr>`).join("")}</tbody>
  </table>`;
}

// ── Render: Finanças ──
function renderFinancas() {
  mkBar("chartFundeb2025", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m=>DATA[m].fundeb["2025"]/1e6), {money:true});
  mkBar("chartVaat2025", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m=>DATA[m].vaat["2025"]/1e6), {money:true});
  mkBar("chartVaar2025", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m=>(DATA[m].vaar?.["2025"]||0)/1e6), {money:true});
  mkBar("chartMde2025", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m=>DATA[m].mde["2025"].percent), {percent:true});
  mkBar("chartAdicionais", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m=>DATA[m].adicionais.total/1e6), {money:true});
  mkBar("chartRemuneracao", MUNICIPIOS.map(abbr), MUNICIPIOS.map(m=>DATA[m].remuneracao["2025"]), {percent:true, colors:MUNICIPIOS.map(m=>DATA[m].remuneracao["2025"]>=70?"#1A3FD6":"#EB6834")});
  document.getElementById("financeTableWrap").innerHTML = `<table>
    <thead><tr><th>Município</th><th>Fundeb 2025</th><th>VAAT 2025</th><th>VAAR 2025</th><th>MDE 2025</th><th>Remuneração</th><th>Rec. adicionais</th></tr></thead>
    <tbody>${MUNICIPIOS.map(m=>`<tr><td><strong>${m}</strong></td><td class="num">${fmtMoneyMi(DATA[m].fundeb["2025"])}</td><td class="num">${fmtMoneyMi(DATA[m].vaat["2025"])}</td><td class="num">${fmtMoneyMi(DATA[m].vaar?.["2025"]||0)}</td><td class="num">${fmtPct(DATA[m].mde["2025"].percent)}</td><td class="num">${fmtPct(DATA[m].remuneracao["2025"])}</td><td class="num">${fmtMoneyMi(DATA[m].adicionais.total)}</td></tr>`).join("")}</tbody>
  </table>`;
}

// ── Render: Evolução 2020-2025 ──
const EVOL_PALETTE = ["#1A3FD6","#EB6834","#1BAF7A","#EDA100","#E87BA4","#008300","#6250D6","#E34948"];

function renderEvolucao() {
  const ANOS_FIN = ["2020","2021","2022","2023","2024","2025"];
  const ANOS_VAAT = ["2021","2022","2023","2024","2025"];
  const ANOS_REM = ["2021","2022","2023","2024","2025"];
  const ANOS_ADIC = ["2021","2022","2023","2024","2025"];

  // 1) Fundeb consolidado
  const fundebRide = ANOS_FIN.map(y => sum(MUNICIPIOS.map(m => DATA[m].fundeb[y]))/1e6);
  mkLine("chartEvolFundebRide", ANOS_FIN, [
    {label:"Fundeb realizado — RIDE", data:fundebRide, borderColor:"#1A3FD6", backgroundColor:"rgba(26,63,214,.12)", fill:true, tension:.25, borderWidth:2.5, pointRadius:4}
  ], {money:true});

  // 2) VAAT consolidado
  const vaatRide = ANOS_VAAT.map(y => sum(MUNICIPIOS.map(m => DATA[m].vaat[y]||0))/1e6);
  mkLine("chartEvolVaatRide", ANOS_VAAT, [
    {label:"VAAT — RIDE", data:vaatRide, borderColor:"#EB6834", backgroundColor:"rgba(235,104,52,.14)", fill:true, tension:.25, borderWidth:2.5, pointRadius:4}
  ], {money:true});

  // 3) Trajetórias do Fundeb por município (linhas — BA pontilhadas, PE contínuas)
  const fundebMuniDS = MUNICIPIOS.map((m, i) => {
    const uf = DATA[m].censo?.uf || (DESIG[m] && DESIG[m].uf) || "";
    return {
      label: m,
      data: ANOS_FIN.map(y => DATA[m].fundeb[y]/1e6),
      borderColor: EVOL_PALETTE[i % EVOL_PALETTE.length],
      backgroundColor: EVOL_PALETTE[i % EVOL_PALETTE.length],
      fill: false,
      tension: .25,
      borderWidth: 2,
      pointRadius: 3,
      borderDash: uf === "BA" ? [6,4] : []
    };
  });
  mkLine("chartEvolFundebMuni", ANOS_FIN, fundebMuniDS, {money:true});

  // 4) Educação infantil — composição RIDE consolidada (área empilhada)
  const fundebSerieRide = ANOS_FIN.map(y => sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie[y].fundeb))/1e6);
  const mdeSerieRide    = ANOS_FIN.map(y => sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie[y].mde))/1e6);
  const outrasSerieRide = ANOS_FIN.map(y => sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie[y].outras))/1e6);
  mkStackedArea("chartEvolEdInfStack", ANOS_FIN, [
    {label:"Fundeb (creche + pré-escola)", data:fundebSerieRide, backgroundColor:"rgba(26,63,214,.78)",  borderColor:"#1A3FD6"},
    {label:"MDE (creche + pré-escola)",    data:mdeSerieRide,    backgroundColor:"rgba(235,104,52,.78)", borderColor:"#EB6834"},
    {label:"Outras fontes",                data:outrasSerieRide, backgroundColor:"rgba(27,175,122,.78)", borderColor:"#1BAF7A"}
  ], {money:true});

  // 5) Educação infantil por município — total (com seletor)
  const sel = document.getElementById("evolEdInfMuniSelect");
  if (sel && !sel.dataset.populated) {
    sel.innerHTML = MUNICIPIOS.map(m => `<option value="${m}">${m}</option>`).join("");
    sel.dataset.populated = "1";
    sel.addEventListener("change", () => drawEvolEdInfMuni(sel.value));
  }
  drawEvolEdInfMuni(sel ? sel.value : MUNICIPIOS[0]);

  // 6) Receitas adicionais — composição RIDE
  const ride = (campo, anos) => anos.map(y => sum(MUNICIPIOS.map(m => (ADICIONAIS_SERIE[m]?.[y]?.[campo])||0))/1e6);
  mkStackedBar("chartEvolAdicionais", ANOS_ADIC, [
    {label:"Salário-Educação", data:ride("salario_educacao", ANOS_ADIC), backgroundColor:"#1A3FD6"},
    {label:"PNAE",             data:ride("pnae", ANOS_ADIC),             backgroundColor:"#EB6834"},
    {label:"PNATE",            data:ride("pnate", ANOS_ADIC),            backgroundColor:"#1BAF7A"},
    {label:"Outras FNDE",      data:ride("outras_fnde", ANOS_ADIC),      backgroundColor:"#EDA100"},
    {label:"Convênios",        data:ride("convenios", ANOS_ADIC),        backgroundColor:"#E87BA4"},
    {label:"PDDE",             data:ride("pdde", ANOS_ADIC),             backgroundColor:"#008300"}
  ], {money:true});

  // 7) MDE % aplicação por ano — média RIDE com banda de min/máx
  const mdePctMedia = ANOS_FIN.map(y => mean(MUNICIPIOS.map(m => DATA[m].mde[y].percent)));
  const mdePctMin   = ANOS_FIN.map(y => Math.min(...MUNICIPIOS.map(m => DATA[m].mde[y].percent)));
  const mdePctMax   = ANOS_FIN.map(y => Math.max(...MUNICIPIOS.map(m => DATA[m].mde[y].percent)));
  mkLine("chartEvolMdePct", ANOS_FIN, [
    {label:"Máximo da RIDE", data:mdePctMax, borderColor:"#1BAF7A", backgroundColor:"rgba(27,175,122,.06)", fill:false, tension:.25, borderWidth:1.5, pointRadius:2.5, borderDash:[4,3]},
    {label:"Média da RIDE",  data:mdePctMedia, borderColor:"#1A3FD6", backgroundColor:"rgba(26,63,214,.10)", fill:false, tension:.25, borderWidth:2.5, pointRadius:4},
    {label:"Mínimo da RIDE", data:mdePctMin, borderColor:"#EB6834", backgroundColor:"rgba(235,104,52,.06)", fill:false, tension:.25, borderWidth:1.5, pointRadius:2.5, borderDash:[4,3]}
  ], {percent:true, beginZero:false});

  // 8) Remuneração — todos os municípios
  const remDS = MUNICIPIOS.map((m, i) => ({
    label: m,
    data: ANOS_REM.map(y => DATA[m].remuneracao[y]),
    borderColor: EVOL_PALETTE[i % EVOL_PALETTE.length],
    backgroundColor: EVOL_PALETTE[i % EVOL_PALETTE.length],
    fill: false,
    tension: .25,
    borderWidth: 2,
    pointRadius: 3
  }));
  mkLine("chartEvolRemuneracao", ANOS_REM, remDS, {percent:true, beginZero:false});

  // 9) KPIs
  const fundeb2020 = sum(MUNICIPIOS.map(m => DATA[m].fundeb["2020"]));
  const fundeb2025 = sum(MUNICIPIOS.map(m => DATA[m].fundeb["2025"]));
  const crescFundeb = ((fundeb2025/fundeb2020) - 1) * 100;

  const edinf2020 = sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie["2020"].total));
  const edinf2025 = sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie["2025"].total));
  const crescEdInf = ((edinf2025/edinf2020) - 1) * 100;

  const vaat2021 = sum(MUNICIPIOS.map(m => DATA[m].vaat["2021"]||0));
  const vaat2025 = sum(MUNICIPIOS.map(m => DATA[m].vaat["2025"]||0));

  const adic2021 = sum(MUNICIPIOS.map(m => ADICIONAIS_SERIE[m]?.["2021"]?.total||0));
  const adic2025 = sum(MUNICIPIOS.map(m => ADICIONAIS_SERIE[m]?.["2025"]?.total||0));

  document.getElementById("evolKpis").innerHTML = `
    <div class="kpi"><div class="kpi-label">Fundeb 2020 → 2025</div><div class="kpi-value">${fmtMoneyMi(fundeb2025)}</div><div class="kpi-note">Crescimento de ${fmtPct(crescFundeb)} no período</div></div>
    <div class="kpi"><div class="kpi-label">Ed. infantil 2020 → 2025</div><div class="kpi-value">${fmtMoneyMi(edinf2025)}</div><div class="kpi-note">Crescimento de ${fmtPct(crescEdInf)} no período</div></div>
    <div class="kpi"><div class="kpi-label">VAAT 2021 → 2025</div><div class="kpi-value">${fmtMoneyMi(vaat2025)}</div><div class="kpi-note">Partiu de ${fmtMoneyMi(vaat2021)} em 2021</div></div>
    <div class="kpi"><div class="kpi-label">Receitas adicionais 2025</div><div class="kpi-value">${fmtMoneyMi(adic2025)}</div><div class="kpi-note">Eram ${fmtMoneyMi(adic2021)} em 2021</div></div>
  `;

  // 10) Tabela de síntese RIDE
  const linhas = [
    ["Fundeb realizado",        ANOS_FIN, y => sum(MUNICIPIOS.map(m => DATA[m].fundeb[y]))],
    ["VAAT",                    ANOS_FIN, y => sum(MUNICIPIOS.map(m => DATA[m].vaat[y]||0))],
    ["Investimento ed. infantil",ANOS_FIN, y => sum(MUNICIPIOS.map(m => DATA[m].ed_infantil_serie[y].total))],
    ["Receitas adicionais",     ANOS_FIN, y => sum(MUNICIPIOS.map(m => ADICIONAIS_SERIE[m]?.[y]?.total||0))]
  ];
  document.getElementById("evolSinteseTableWrap").innerHTML = `
    <table>
      <thead><tr><th>Indicador</th>${ANOS_FIN.map(y=>`<th>${y}</th>`).join("")}<th>Variação 2020→2025</th></tr></thead>
      <tbody>
        ${linhas.map(([nome, anos, fn]) => {
          const vals = anos.map(fn);
          const v0 = vals[0], v1 = vals[vals.length-1];
          const var_ = v0 > 0 ? ((v1/v0)-1)*100 : null;
          return `<tr><td><strong>${nome}</strong></td>${vals.map(v=>`<td class="num">${v>0?fmtMoneyMi(v):"—"}</td>`).join("")}<td class="num">${var_!==null?fmtPct(var_):"—"}</td></tr>`;
        }).join("")}
      </tbody>
    </table>`;

  // 11) Tabela detalhada — Investimento em educação infantil por município
  document.getElementById("evolEdInfTableWrap").innerHTML = `
    <table>
      <thead><tr><th>Município</th>${ANOS_FIN.map(y=>`<th>${y}</th>`).join("")}<th>Variação 2020→2025</th></tr></thead>
      <tbody>
        ${MUNICIPIOS.map(m => {
          const vals = ANOS_FIN.map(y => DATA[m].ed_infantil_serie[y].total);
          const v0 = vals[0], v1 = vals[vals.length-1];
          const var_ = v0 > 0 ? ((v1/v0)-1)*100 : null;
          return `<tr><td><strong>${m}</strong></td>${vals.map(v=>`<td class="num">${fmtMoneyMi(v)}</td>`).join("")}<td class="num">${var_!==null?fmtPct(var_):"—"}</td></tr>`;
        }).join("")}
        <tr style="background:#F3F5F9;font-weight:600">
          <td>RIDE consolidada</td>
          ${ANOS_FIN.map(y=>`<td class="num">${fmtMoneyMi(sum(MUNICIPIOS.map(m=>DATA[m].ed_infantil_serie[y].total)))}</td>`).join("")}
          ${(() => {
            const v0 = sum(MUNICIPIOS.map(m=>DATA[m].ed_infantil_serie["2020"].total));
            const v1 = sum(MUNICIPIOS.map(m=>DATA[m].ed_infantil_serie["2025"].total));
            return `<td class="num">${fmtPct(((v1/v0)-1)*100)}</td>`;
          })()}
        </tr>
      </tbody>
    </table>`;

  // 12) Tabela detalhada — Receitas adicionais por município
  document.getElementById("evolAdicTableWrap").innerHTML = `
    <table>
      <thead><tr><th>Município</th>${ANOS_ADIC.map(y=>`<th>${y}</th>`).join("")}<th>Variação 2021→2025</th></tr></thead>
      <tbody>
        ${MUNICIPIOS.map(m => {
          const vals = ANOS_ADIC.map(y => ADICIONAIS_SERIE[m]?.[y]?.total||0);
          const v0 = vals[0], v1 = vals[vals.length-1];
          const var_ = v0 > 0 ? ((v1/v0)-1)*100 : null;
          return `<tr><td><strong>${m}</strong></td>${vals.map(v=>`<td class="num">${fmtMoneyMi(v)}</td>`).join("")}<td class="num">${var_!==null?fmtPct(var_):"—"}</td></tr>`;
        }).join("")}
        <tr style="background:#F3F5F9;font-weight:600">
          <td>RIDE consolidada</td>
          ${ANOS_ADIC.map(y=>`<td class="num">${fmtMoneyMi(sum(MUNICIPIOS.map(m=>ADICIONAIS_SERIE[m]?.[y]?.total||0)))}</td>`).join("")}
          ${(() => {
            const v0 = sum(MUNICIPIOS.map(m=>ADICIONAIS_SERIE[m]?.["2021"]?.total||0));
            const v1 = sum(MUNICIPIOS.map(m=>ADICIONAIS_SERIE[m]?.["2025"]?.total||0));
            return `<td class="num">${fmtPct(((v1/v0)-1)*100)}</td>`;
          })()}
        </tr>
      </tbody>
    </table>`;
}

function drawEvolEdInfMuni(muni) {
  const ANOS_FIN = ["2020","2021","2022","2023","2024","2025"];
  const fundeb = ANOS_FIN.map(y => DATA[muni].ed_infantil_serie[y].fundeb/1e6);
  const mde    = ANOS_FIN.map(y => DATA[muni].ed_infantil_serie[y].mde/1e6);
  const outras = ANOS_FIN.map(y => DATA[muni].ed_infantil_serie[y].outras/1e6);
  mkStackedBar("chartEvolEdInfMuni", ANOS_FIN, [
    {label:"Fundeb",       data:fundeb, backgroundColor:"#1A3FD6"},
    {label:"MDE",          data:mde,    backgroundColor:"#EB6834"},
    {label:"Outras fontes",data:outras, backgroundColor:"#1BAF7A"}
  ], {money:true});
}

// ── Render: Município ──
function renderMunicipio() {
  const muni = document.getElementById("municipioSelect").value || MUNICIPIOS[0];
  const x = DATA[muni];
  const idebIni = x.ideb.iniciais?.ideb;
  const idebFin = x.ideb.finais?.ideb;
  const accentCls = ["","orange","green","purple","amber","teal"];
  document.getElementById("municipioKpis").innerHTML = [
    ["Fundeb 2025",fmtMoneyMi(x.fundeb["2025"]),muni,""],
    ["MDE 2025",fmtPct(x.mde["2025"].percent),"Percentual aplicado","orange"],
    ["Creche 2025",fmtPct(x.creche["2025"]),"Taxa líquida","green"],
    ["Pré-escola 2025",fmtPct(x.pre["2025"]),"Taxa líquida","purple"],
    ["IDEB anos iniciais",idebIni==null?"—":idebIni.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1}),"IDEB 2023","amber"],
    ["IDEB anos finais",idebFin==null?"—":idebFin.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1}),"IDEB 2023","teal"]
  ].map(([l,v,n,c])=>`<div class="kpi ${c}"><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-note">${n}</div></div>`).join("");

  mkLine("chartMunicipioFundeb", YEARS_FUNDEB, [{
    label:muni, data:YEARS_FUNDEB.map(y=>x.fundeb[y]/1e6), borderColor:"#1A3FD6", backgroundColor:"rgba(26,63,214,.08)", fill:true, tension:.28, borderWidth:2.5, pointRadius:4, pointBackgroundColor:"#1A3FD6"
  }], {money:true});
  mkLine("chartMunicipioInfantil", YEARS_COVER, [
    {label:"Creche",data:YEARS_COVER.map(y=>x.creche[y]),borderColor:"#EB6834",fill:false,tension:.2,borderWidth:2.5,pointRadius:3},
    {label:"Pré-escola",data:YEARS_COVER.map(y=>x.pre[y]),borderColor:"#1BAF7A",fill:false,tension:.2,borderWidth:2.5,pointRadius:3}
  ], {percent:true});

  document.getElementById("municipioSummary").textContent =
    muni === "Lagoa Grande"
      ? `${muni} registrou ${fmtMoneyMi(x.fundeb["2025"])} em receita do Fundeb em 2025 e aplicou ${fmtPct(x.mde["2025"].percent)} em MDE. Na educação infantil, alcançou ${fmtPct(x.creche["2025"])} em creche e ${fmtPct(x.pre["2025"])} em pré-escola em 2024. No IDEB 2023, apresentou ${idebIni==null?"sem dado":idebIni.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} nos anos iniciais. Não há anos finais na rede municipal de Lagoa Grande.`
      : `${muni} registrou ${fmtMoneyMi(x.fundeb["2025"])} em receita do Fundeb em 2025 e aplicou ${fmtPct(x.mde["2025"].percent)} em MDE. Na educação infantil, alcançou ${fmtPct(x.creche["2025"])} em creche e ${fmtPct(x.pre["2025"])} em pré-escola em 2024. No IDEB 2023, apresentou ${idebIni==null?"sem dado":idebIni.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} nos anos iniciais e ${idebFin==null?"sem dado":idebFin.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} nos anos finais.`;

  document.getElementById("municipioMini").innerHTML = `
    <div class="stat"><div class="stat-label">Escolas municipais</div><div class="stat-value">${fmtInt(x.censo.escolas)}</div></div>
    <div class="stat"><div class="stat-label">Matrículas anos iniciais</div><div class="stat-value">${fmtInt(x.censo.anos_iniciais)}</div></div>
    <div class="stat"><div class="stat-label">Matrículas anos finais</div><div class="stat-value">${fmtInt(x.censo.anos_finais)}</div></div>
    <div class="stat"><div class="stat-label">VAAT 2025</div><div class="stat-value">${fmtMoneyMi(x.vaat["2025"])}</div></div>
  `;
}

// ── Render: Comparativo ──
function renderComparativo() {
  const a = document.getElementById("compareMunicipioA").value || MUNICIPIOS[0];
  const b = document.getElementById("compareMunicipioB").value || MUNICIPIOS[1];
  const A = DATA[a], B = DATA[b];
  const cards = [
    ["Fundeb 2025",fmtMoneyMi(A.fundeb["2025"]),fmtMoneyMi(B.fundeb["2025"]),""],
    ["Creche 2025",fmtPct(A.creche["2025"]),fmtPct(B.creche["2025"]),"green"],
    ["Pré-escola 2025",fmtPct(A.pre["2025"]),fmtPct(B.pre["2025"]),"purple"],
    ["MDE 2025",fmtPct(A.mde["2025"].percent),fmtPct(B.mde["2025"].percent),"amber"],
    ["VAAT 2025",fmtMoneyMi(A.vaat["2025"]),fmtMoneyMi(B.vaat["2025"]),"orange"],
    ["VAAR 2025",fmtMoneyMi(A.vaar?.["2025"]||0),fmtMoneyMi(B.vaar?.["2025"]||0),"teal"]
  ];
  document.getElementById("compareCards").innerHTML = cards.map(([l,va,vb,cls])=>`
    <div class="kpi ${cls}">
      <div class="kpi-label">${l}</div>
      <div class="kpi-note"><strong>${a}:</strong> ${va}</div>
      <div class="kpi-note" style="margin-top:4px"><strong>${b}:</strong> ${vb}</div>
    </div>`).join("");

  destroyChart("chartCompareFundeb");
  chartRefs["chartCompareFundeb"] = new Chart(document.getElementById("chartCompareFundeb"),{
    type:"bar",
    data:{labels:[a,b],datasets:[{label:"Fundeb 2025",data:[A.fundeb["2025"]/1e6,B.fundeb["2025"]/1e6],backgroundColor:["#1A3FD6","#EB6834"],borderRadius:6}]},
    options:applyDefaults({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#E6E9F0'},ticks:{callback:v=>"R$ "+v+"mi",font:chartDefaults.font,color:chartDefaults.color}},x:{grid:{display:false},ticks:{font:chartDefaults.font,color:chartDefaults.color}}}})
  });
  destroyChart("chartCompareInfantil");
  chartRefs["chartCompareInfantil"] = new Chart(document.getElementById("chartCompareInfantil"),{
    type:"bar",
    data:{labels:[a,b],datasets:[
      {label:"Creche 2025",data:[A.creche["2025"],B.creche["2025"]],backgroundColor:"#1BAF7A",borderRadius:5},
      {label:"Pré-escola 2025",data:[A.pre["2025"],B.pre["2025"]],backgroundColor:"#E87BA4",borderRadius:5}
    ]},
    options:applyDefaults({responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:true,suggestedMax:100,grid:{color:'#E6E9F0'},ticks:{callback:v=>v+"%",font:chartDefaults.font,color:chartDefaults.color}},x:{grid:{display:false},ticks:{font:chartDefaults.font,color:chartDefaults.color}}}})
  });

  const idebA = A.ideb?.iniciais?.ideb, idebB = B.ideb?.iniciais?.ideb;
  document.getElementById("compareTableWrap").innerHTML = `<table>
    <thead><tr><th>Indicador</th><th>${a}</th><th>${b}</th></tr></thead>
    <tbody>
      <tr><td><strong>Fundeb 2025</strong></td><td class="num">${fmtMoneyMi(A.fundeb["2025"])}</td><td class="num">${fmtMoneyMi(B.fundeb["2025"])}</td></tr>
      <tr><td><strong>VAAT 2025</strong></td><td class="num">${fmtMoneyMi(A.vaat["2025"])}</td><td class="num">${fmtMoneyMi(B.vaat["2025"])}</td></tr>
      <tr><td><strong>VAAR 2025</strong></td><td class="num">${fmtMoneyMi(A.vaar?.["2025"]||0)}</td><td class="num">${fmtMoneyMi(B.vaar?.["2025"]||0)}</td></tr>
      <tr><td><strong>MDE 2025</strong></td><td class="num">${fmtPct(A.mde["2025"].percent)}</td><td class="num">${fmtPct(B.mde["2025"].percent)}</td></tr>
      <tr><td><strong>Creche 2025</strong></td><td class="num">${fmtPct(A.creche["2025"])}</td><td class="num">${fmtPct(B.creche["2025"])}</td></tr>
      <tr><td><strong>Pré-escola 2025</strong></td><td class="num">${fmtPct(A.pre["2025"])}</td><td class="num">${fmtPct(B.pre["2025"])}</td></tr>
      <tr><td><strong>IDEB anos iniciais</strong></td><td class="num">${idebA==null?"—":idebA.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</td><td class="num">${idebB==null?"—":idebB.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}</td></tr>
    </tbody>
  </table>`;
}

// ── Render: Notícias ──
function renderNoticias(issueId = ACTIVE_NEWSLETTER_ID) {
  const NEWSLETTER = NEWSLETTER_ISSUES[issueId] || NEWSLETTER_ISSUES[ACTIVE_NEWSLETTER_ID] || {};
  ACTIVE_NEWSLETTER_ID = NEWSLETTER.id || issueId;
  const weekLabel = document.getElementById("npWeekLabel"); if (weekLabel) weekLabel.textContent = NEWSLETTER.weekLabel || "";
  const shortDate = document.getElementById("npShortDate"); if (shortDate) shortDate.textContent = NEWSLETTER.shortDate || "";
  const footerStamp = document.getElementById("npFooterStamp"); if (footerStamp) footerStamp.textContent = NEWSLETTER.footerStamp || "";
  const footerSource = document.getElementById("npFooterSource"); if (footerSource) footerSource.textContent = NEWSLETTER.footerSource || "";
  const agendaSub = document.getElementById("npAgendaSub"); if (agendaSub) agendaSub.textContent = NEWSLETTER.agendaSub || "Prazos e pontos de atenção para a gestão educacional";
  const pdfLink = document.getElementById("newsPdfLink"); if (pdfLink) { if (NEWSLETTER.pdf) { pdfLink.href = NEWSLETTER.pdf; pdfLink.hidden = false; } else { pdfLink.hidden = true; } }
  // Números da semana
  const stats = NEWSLETTER.stats || [];
  document.getElementById("npStats").innerHTML = stats.map(s => `
    <div class="np-stat">
      <div class="np-stat-rubric">${s.rubric}</div>
      <div class="np-stat-value ${s.color || ''}">${s.value}</div>
      <div class="np-stat-label">${s.label}</div>
    </div>`).join("");

  // Destaque da semana
  const spotlight = NEWSLETTER.spotlight;
  const spotlightEl = document.getElementById("npSpotlight");
  if (spotlightEl) {
    spotlightEl.innerHTML = spotlight ? `
      <div class="np-rubric">${spotlight.rubric}</div>
      <h2>${spotlight.title}</h2>
      <p>${spotlight.dek || ""}</p>
      ` : "";
    spotlightEl.hidden = !spotlight;
  }

  // Editorial
  const ed = NEWSLETTER.editorial;
  if (ed) {
    document.getElementById("npEditorial").innerHTML = `
      <div class="np-ed-rubric">${ed.rubric}</div>
      <h2 class="np-ed-headline">${ed.title}</h2>
      <div class="np-ed-byline">
        <em>${ed.byline}</em>
        <span>${ed.place}</span>
      </div>
      <div class="np-ed-body">
        ${ed.paragraphs.map(p => {
          if (p.includes('np-ed-data-card') || p.includes('np-ed-source') || p.includes('np-ed-close')) return p;
          if (p.includes('np-ed-pull')) {
            const m = p.match(/<span class="np-ed-pull">([\s\S]*?)<\/span>/);
            if (m) return `<blockquote class="np-ed-pull">${m[1]}</blockquote>`;
          }
          return `<p>${p}</p>`;
        }).join("")}
      </div>`;
  }

  const fullSectionsEl = document.getElementById("npFullSections");
  const legacyBody = document.getElementById("npLegacyBody");
  const fullSections = NEWSLETTER.sections || [];
  if (fullSectionsEl) {
    fullSectionsEl.hidden = !fullSections.length;
    fullSectionsEl.innerHTML = fullSections.map(section => `<section class="np-full-section"><div class="np-full-section-kicker">${section.kicker || ''}</div><h3>${section.title || ''}</h3>${(section.stories || []).map(story => `<article class="np-full-story"><div class="np-full-story-rubric">${story.rubric || ''}</div><h4>${story.title || ''}</h4>${story.photo ? `<figure class="np-news-photo"><a href="${story.photoSource || story.sourceUrl}" target="_blank" rel="noopener noreferrer"><img src="${story.photo}" alt="Imagem relacionada à notícia" loading="lazy" onerror="this.closest('figure').classList.add('np-photo-unavailable')"></a><figcaption>${story.credit} · <a href="${story.photoSource || story.sourceUrl}" target="_blank" rel="noopener noreferrer">Fonte da imagem</a></figcaption></figure>` : ''}${(story.paragraphs || [story.body || '']).filter(Boolean).map(p => `<p>${p}</p>`).join('')}${story.service ? `<p class="np-story-service"><strong>Para a gestão · </strong>${story.service}</p>` : ''}${story.sourceUrl ? `<div class="np-story-source"><span>Fonte: ${story.sourceLabel || 'Publicação original'} · ${story.published || 'data indicada na fonte'}</span><a href="${story.sourceUrl}" target="_blank" rel="noopener noreferrer" aria-label="Consultar fonte de ${story.title || 'notícia'}">Ler fonte original ↗</a></div>` : ''}</article>`).join('')}</section>`).join('');
  }
  if (legacyBody) legacyBody.hidden = !!fullSections.length;

  const hl = NEWSLETTER.highlights || [];
  const lead = hl[0];
  const others = hl.slice(1);
  const serviceHtml = item => item?.service ? `<p class="np-story-service"><strong>Para a gestão · </strong>${item.service.replace(/^Para gestores?:\s*/i,'')}</p>` : "";

  // Manchete
  if (lead) {
    const sentences = lead.body.split(/(?<=[.!?])\s+/).filter(Boolean);
    const half = Math.ceil(sentences.length/2);
    const para1 = sentences.slice(0,half).join(" ");
    const para2 = sentences.slice(half).join(" ") || "";
    const deck = sentences[0] || "";
    document.getElementById("npLead").innerHTML = `
      <div class="np-rubric">${lead.rubric || "Capa"}</div>
      <h2 class="np-headline">${lead.title}</h2>
      <p class="np-deck">${deck}</p>
      <div class="np-byline">
        <span>Por Redação Vale Educa</span>
        <span>${NEWSLETTER.dateLabel || "Vale do São Francisco"}</span>
      </div>
      <div class="np-lead-body">
        <p>${para1}</p>
        ${para2 ? `<p style="margin-top:10px">${para2}</p>` : ""}
      </div>
      ${serviceHtml(lead)}`;
  } else {
    document.getElementById("npLead").innerHTML = "";
  }

  // Demais notícias
  document.getElementById("npStories").innerHTML = others.map(x => `
    <article class="np-story">
      <div class="np-rubric ${x.rubricCls || ''}">${x.rubric || ''}</div>
      <h4>${x.title}</h4>
      <p>${x.body}</p>
      ${serviceHtml(x)}
    </article>`).join("");

  // Documento da semana
  const doc = NEWSLETTER.documentWeek;
  const docEl = document.getElementById("npDocument");
  if (docEl) {
    docEl.innerHTML = doc ? `
      <div>
        <div class="np-rubric amber">${doc.rubric}</div>
        <h3>${doc.title}</h3>
        <p>${doc.body}</p>
      </div>
      <a class="np-document-link" href="${doc.link}" target="_blank" rel="noopener noreferrer">${doc.linkLabel} ↗</a>` : "";
    docEl.hidden = !doc;
  }

  // Agenda
  const KIND_LABEL = {"data":"Data única","ate":"Prazo final","intervalo":"Período","previsto":"Acompanhar"};
  document.getElementById("npAgenda").innerHTML = (NEWSLETTER.agenda || []).map(item => {
    let dateBlock;
    if (item.display) {
      dateBlock = `<div class="np-cal np-cal-tentative"><div class="np-cal-leaf"><span class="np-cal-month" style="font-size:10px;padding:14px 7px">${item.display}</span></div></div>`;
    } else if (item.endDay) {
      dateBlock = `<div class="np-cal np-cal-range"><div class="np-cal-leaf"><span class="np-cal-day">${item.day}</span><span class="np-cal-month">${item.month}</span></div><span class="np-cal-arrow">→</span><div class="np-cal-leaf"><span class="np-cal-day">${item.endDay}</span><span class="np-cal-month">${item.endMonth}</span></div></div>`;
    } else if (item.kind === "ate") {
      dateBlock = `<div class="np-cal np-cal-deadline"><div class="np-cal-leaf"><span class="np-cal-prefix">até</span><span class="np-cal-day">${item.day}</span><span class="np-cal-month">${item.month}</span></div></div>`;
    } else if (item.kind === "previsto") {
      dateBlock = `<div class="np-cal np-cal-tentative"><div class="np-cal-leaf"><span class="np-cal-day np-cal-day-tilde">~</span><span class="np-cal-month">${item.month}</span></div></div>`;
    } else {
      dateBlock = `<div class="np-cal"><div class="np-cal-leaf"><span class="np-cal-day">${item.day}</span><span class="np-cal-month">${item.month}</span></div></div>`;
    }
    return `<article class="np-event-card np-event-${item.kind}">${dateBlock}<div class="np-event-body"><div class="np-event-meta"><span class="np-event-tag">${item.tag || KIND_LABEL[item.kind] || "Agenda"}</span><span class="np-event-program">${item.label}</span></div><p class="np-event-text">${item.text}</p></div></article>`;
  }).join("");

  // Leitura temática
  document.getElementById("npThemes").innerHTML = (NEWSLETTER.themes || []).map((x,i) => `
    <div class="np-theme-item">
      <div class="np-theme-rubric">§ ${String(i+1).padStart(2,'0')} · ${x[0]}</div>
      <div class="np-theme-text">${x[1]}</div>
    </div>`).join("");

  // Fontes consultadas
  const sourcesEl = document.getElementById("npSources");
  if (sourcesEl) {
    sourcesEl.innerHTML = (NEWSLETTER.sources || []).map(src => `<a class="np-source-link" href="${src.url}" target="_blank" rel="noopener noreferrer">${src.label} ↗</a>`).join("");
  }
}

function setupNewsArchive() {
  const select = document.getElementById("newsIssueSelect");
  if (!select) return;
  const labels = window.RIDE_EDICOES ? window.RIDE_EDICOES.rotulos() : {};
  select.innerHTML = Object.keys(NEWSLETTER_ISSUES).map(id => `<option value="${id}">${labels[id] || NEWSLETTER_ISSUES[id].weekLabel || id}</option>`).join("");
  select.value = ACTIVE_NEWSLETTER_ID;
  select.addEventListener("change", () => renderNoticias(select.value));
}

// ── VAAR 2026 · consulta nacional ──
const VAAR_UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
let VAAR_DATA = null;
let VAAR_LOADING = null;
let VAAR_META = null;
let VAAR_INITIALIZED = false;
let VAAR_SELECTED = null;
let VAAR_FILTERED = [];
let VAAR_PAGE = 1;
const VAAR_PAGE_SIZE = 50;

function vaarNorm(v){ return String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
function vaarEscape(v){ return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function vaarYes(v){ return vaarNorm(v).startsWith("sim") || vaarNorm(v) === "habilitado" || vaarNorm(v) === "beneficiario"; }
function vaarPill(v, yesLabel="Sim", noLabel="Não") { const ok=vaarYes(v); return `<span class="pill ${ok?'green':'orange'}">${ok?'✓ '+yesLabel:'✗ '+noLabel}</span>`; }
function vaarMoney(v){ if(v===null || v===undefined || v==="") return "—"; const n=Number(v); return Number.isFinite(n)?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):String(v); }
function vaarMoneyForRecord(r){
  if(r && !vaarYes(r.beneficiario)) return '<span class="vaar-no-transfer">Sem repasse</span><small class="vaar-value-note">não beneficiário em 2026</small>';
  if(r && r.valorVaar!==null && r.valorVaar!==undefined && r.valorVaar!=="") return '<strong>'+vaarMoney(r.valorVaar)+'</strong>';
  return '<span class="vaar-value-missing">Valor indisponível</span><small class="vaar-value-note">fonte oficial não carregada</small>';
}
function vaarNum(v){ if(v===null || v===undefined || v==="") return "—"; const n=Number(String(v).replace(",",".")); return Number.isFinite(n)?n.toLocaleString("pt-BR",{maximumFractionDigits:6}):String(v); }

async function loadVaarData(){
  if(VAAR_DATA) return VAAR_DATA;
  if(VAAR_LOADING) return VAAR_LOADING;
  const state=document.getElementById("vaarLoadState");
  if(state) state.textContent='Consultando os arquivos oficiais do FNDE…';
  VAAR_LOADING=(async()=>{
    try{
      const res=await fetch('/api/vaar', {headers:{'Accept':'application/json'},cache:'no-store'});
      if(!res.ok) throw new Error('A consulta respondeu HTTP '+res.status);
      const payload=await res.json();
      const records=Array.isArray(payload)?payload:payload.records;
      // Uma resposta HTTP 200 sem a base nacional não deve aparecer como sucesso.
      if(!Array.isArray(records) || records.length<5000) {
        throw new Error('A base nacional retornou incompleta.');
      }
      VAAR_META=Array.isArray(payload)?{}:payload;
      VAAR_DATA=records;
      const valueCount=records.filter(r=>r.valorVaar!==null&&r.valorVaar!==undefined&&r.valorVaar!==''&&Number.isFinite(Number(r.valorVaar))).length;
      const quality=VAAR_META.sourceStatus||{};
      const indicatorsWarning=quality.indicadores==='indisponivel'?' · indicadores numéricos indisponíveis':'';
      const valuesWarning=quality.valores==='indisponivel'?' · valores previstos indisponíveis':'';
      if(state) state.textContent=`Base oficial carregada · ${records.length.toLocaleString('pt-BR')} municípios · ${valueCount.toLocaleString('pt-BR')} valores previstos${indicatorsWarning}${valuesWarning}`;
      return VAAR_DATA;
    }catch(err){
      console.error('Falha de consulta VAAR 2026:',err);
      if(state){
        state.innerHTML='Falha de acesso à base oficial. <button class="vaar-retry" id="vaarRetryBtn" type="button">Tentar novamente</button> · <a href="https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026" target="_blank" rel="noopener noreferrer">Consultar FNDE ↗</a>';
        document.getElementById('vaarRetryBtn')?.addEventListener('click',runVaarSearch);
      }
      throw err;
    }finally{
      VAAR_LOADING=null;
    }
  })();
  return VAAR_LOADING;
}

function renderVaarSummary(records){
  const el=document.getElementById("vaarSummary"); if(!el) return;
  if(!records.length){ el.innerHTML=''; return; }
  const hab=records.filter(r=>vaarYes(r.habilitado)).length;
  const ben=records.filter(r=>vaarYes(r.beneficiario)).length;
  const c3=records.filter(r=>vaarYes(r.cond3)).length;
  const vaarValues=records.map(r=>r.valorVaar).filter(v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))).map(Number);
  const totalVaar=vaarValues.reduce((sum,v)=>sum+v,0);
  const compactMoney = !vaarValues.length ? '—' : totalVaar >= 1e9 ? `R$ ${(totalVaar/1e9).toLocaleString('pt-BR',{maximumFractionDigits:2})} bi` : totalVaar >= 1e6 ? `R$ ${(totalVaar/1e6).toLocaleString('pt-BR',{maximumFractionDigits:2})} mi` : vaarMoney(totalVaar);
  el.innerHTML=`<div class="vaar-mini"><strong>${records.length.toLocaleString('pt-BR')}</strong><span>resultado(s)</span></div><div class="vaar-mini"><strong>${hab.toLocaleString('pt-BR')}</strong><span>habilitado(s)</span></div><div class="vaar-mini"><strong>${ben.toLocaleString('pt-BR')}</strong><span>beneficiário(s)</span></div><div class="vaar-mini"><strong>${c3.toLocaleString('pt-BR')}</strong><span>cumpriram Cond. III</span></div><div class="vaar-mini"><strong>${compactMoney}</strong><span>VAAR previsto no recorte</span></div>`;
}

function renderVaarResults(records, page = 1){
  const body=document.getElementById("vaarResultsBody");
  const count=document.getElementById("vaarResultCount");
  const pager=document.getElementById("vaarPagination");
  if(!body) return;
  VAAR_FILTERED=records;
  const pages=Math.max(1,Math.ceil(records.length/VAAR_PAGE_SIZE));
  VAAR_PAGE=Math.min(Math.max(1,page),pages);
  const start=(VAAR_PAGE-1)*VAAR_PAGE_SIZE;
  const shown=records.slice(start,start+VAAR_PAGE_SIZE);
  count.textContent=records.length ? `${records.length.toLocaleString('pt-BR')} município(s) encontrado(s) · exibindo ${start+1}–${start+shown.length}.` : 'Nenhum município encontrado com os filtros selecionados.';
  body.innerHTML=shown.length?shown.map(r=>`<tr><td><strong>${vaarEscape(r.municipio)}</strong></td><td>${vaarEscape(r.uf)}</td><td class="num">${r.codigo}</td><td>${vaarPill(r.cond3,'Cumpriu','Não cumpriu')}</td><td>${vaarPill(r.habilitado,'Habilitado','Não habilitado')}</td><td>${vaarPill(r.beneficiario,'Beneficiário','Não beneficiário')}</td><td class="num vaar-value-cell">${vaarMoneyForRecord(r)}</td><td><button class="vaar-detail-btn" data-vaar-code="${r.codigo}">Detalhar</button></td></tr>`).join(''):`<tr><td colspan="8" class="vaar-empty">Nenhum resultado.</td></tr>`;
  body.querySelectorAll('[data-vaar-code]').forEach(btn=>btn.addEventListener('click',()=>showVaarDetail(btn.dataset.vaarCode)));
  renderVaarSummary(records);
  if(pager){
    if(records.length>VAAR_PAGE_SIZE){
      pager.hidden=false;
      pager.innerHTML=`<button type="button" class="vaar-btn secondary" data-vaar-page="${VAAR_PAGE-1}" ${VAAR_PAGE===1?'disabled':''}>← Anterior</button><span>Página <strong>${VAAR_PAGE}</strong> de ${pages}</span><button type="button" class="vaar-btn secondary" data-vaar-page="${VAAR_PAGE+1}" ${VAAR_PAGE===pages?'disabled':''}>Próxima →</button>`;
      pager.querySelectorAll('[data-vaar-page]').forEach(btn=>btn.addEventListener('click',()=>{renderVaarResults(VAAR_FILTERED,Number(btn.dataset.vaarPage));document.querySelector('.vaar-results')?.scrollIntoView({behavior:'smooth',block:'start'});}));
    }else{
      pager.hidden=true;
      pager.innerHTML='';
    }
  }
}

function showVaarDetail(code){
  const r=(VAAR_DATA||[]).find(x=>String(x.codigo)===String(code)); if(!r) return;
  VAAR_SELECTED=r;
  const el=document.getElementById("vaarDetail"); el.hidden=false;
  const conds=[1,2,3,4,5].map(n=>`<div class="vaar-cond"><span>Condicionalidade ${n}</span>${vaarPill(r['cond'+n],'Cumprida','Não cumprida')}</div>`).join('');
  el.innerHTML=`<div class="vaar-detail-head"><div><div class="editorial-kicker">VAAR 2026 · ${vaarEscape(r.uf)}</div><h3>${vaarEscape(r.municipio)}</h3><p>Código IBGE ${r.codigo}</p></div><button class="vaar-close" id="vaarCloseDetail" aria-label="Fechar">×</button></div>
    <div class="vaar-detail-status"><div><span>Habilitação</span>${vaarPill(r.habilitado,'Habilitado','Não habilitado')}</div><div><span>Beneficiário</span>${vaarPill(r.beneficiario,'Beneficiário','Não beneficiário')}</div><div><span>Evoluiu atendimento</span>${vaarPill(r.evoluiuAtendimento)}</div><div><span>Evoluiu aprendizagem</span>${vaarPill(r.evoluiuAprendizagem)}</div></div>
    <div class="vaar-cond-grid">${conds}</div>
    <div class="vaar-metrics"><div><span>Indicador de atendimento</span><strong>${vaarNum(r.indicadorAtendimento)}</strong></div><div><span>Indicador de aprendizagem</span><strong>${vaarNum(r.indicadorAprendizagem)}</strong></div><div><span>Coeficiente de distribuição</span><strong>${vaarNum(r.coeficiente)}</strong></div><div><span>Complementação-VAAR prevista</span>${vaarMoneyForRecord(r)}</div></div>
    ${r.pendencia?`<div class="vaar-pendencia"><strong>Pendência identificada</strong><p>${vaarEscape(r.pendencia)}</p></div>`:''}
    <div class="vaar-method"><strong>Leitura correta:</strong> cumprir as cinco condicionalidades significa estar habilitado. O recebimento da complementação depende dos critérios de distribuição e dos indicadores previstos na regulamentação do Fundeb.${!vaarYes(r.beneficiario)?' Como esta rede aparece na lista oficial como <strong>não beneficiária em 2026</strong>, não existe valor previsto de VAAR para o exercício.':''} <strong>Estes dados são do VAAR 2026 e não antecipam a situação da rede para o VAAR 2027.</strong></div>`;
  document.getElementById('vaarCloseDetail').addEventListener('click',()=>{el.hidden=true;});
  el.scrollIntoView({behavior:'smooth',block:'start'});
}

async function runVaarSearch(){
  let data;
  try{ data=await loadVaarData(); }catch(_){ return; }
  const q=vaarNorm(document.getElementById('vaarQuery').value);
  const uf=document.getElementById('vaarUf').value;
  const status=document.getElementById('vaarStatus').value;
  const c3=document.getElementById('vaarCond3').value;
  let out=data.filter(r=>{
    const text=vaarNorm(`${r.municipio} ${r.codigo}`);
    if(q && !text.includes(q)) return false;
    if(uf && r.uf!==uf) return false;
    if(status==='habilitado' && !vaarYes(r.habilitado)) return false;
    if(status==='nao-habilitado' && vaarYes(r.habilitado)) return false;
    if(status==='beneficiario' && !vaarYes(r.beneficiario)) return false;
    if(status==='nao-beneficiario' && vaarYes(r.beneficiario)) return false;
    if(c3==='sim' && !vaarYes(r.cond3)) return false;
    if(c3==='nao' && vaarYes(r.cond3)) return false;
    return true;
  });
  out.sort((a,b)=>a.municipio.localeCompare(b.municipio,'pt-BR'));
  renderVaarResults(out,1);
}

function initVaar(){
  if(VAAR_INITIALIZED) return;
  VAAR_INITIALIZED=true;
  const uf=document.getElementById('vaarUf'); if(uf) uf.innerHTML='<option value="">Todas</option>'+VAAR_UFS.map(x=>`<option value="${x}">${x}</option>`).join('');
  document.getElementById('vaarSearchBtn')?.addEventListener('click',runVaarSearch);
  document.getElementById('vaarQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter') runVaarSearch();});
  document.getElementById('vaarClearBtn')?.addEventListener('click',()=>{document.getElementById('vaarQuery').value='';document.getElementById('vaarUf').value='';document.getElementById('vaarStatus').value='';document.getElementById('vaarCond3').value='';renderVaarResults([],1);document.getElementById('vaarResultCount').textContent='Digite um município para consultar.';document.getElementById('vaarDetail').hidden=true;});
  loadVaarData().catch(()=>{});
}

// ── Setup selects ──
function setupSelects() {
  const sel = document.getElementById("municipioSelect");
  sel.innerHTML = MUNICIPIOS.map(m=>`<option value="${m}">${m}</option>`).join("");
  sel.addEventListener("change", renderMunicipio);

  const a = document.getElementById("compareMunicipioA");
  const b = document.getElementById("compareMunicipioB");
  a.innerHTML = MUNICIPIOS.map((m,i)=>`<option value="${m}" ${i===0?"selected":""}>${m}</option>`).join("");
  b.innerHTML = MUNICIPIOS.map((m,i)=>`<option value="${m}" ${i===1?"selected":""}>${m}</option>`).join("");
  a.addEventListener("change", renderComparativo);
  b.addEventListener("change", renderComparativo);
}

function setupHomeExplorer() {
  const theme = document.getElementById("homeThemeSelect");
  const municipality = document.getElementById("homeMunicipioSelect");
  const button = document.getElementById("homeExploreButton");
  if (!theme || !municipality || !button) return;

  municipality.innerHTML += MUNICIPIOS.map(m => `<option value="${m}">${m}</option>`).join("");
  municipality.addEventListener("change", () => {
    if (municipality.value) theme.value = "visao";
  });
  theme.addEventListener("change", () => {
    municipality.value = "";
  });

  button.addEventListener("click", () => {
    if (municipality.value) {
      openPanel("municipio");
      const target = document.getElementById("municipioSelect");
      if (target) {
        target.value = municipality.value;
        renderMunicipio();
      }
      return;
    }
    openPanel(theme.value || "visao");
  });
}

document.getElementById("idebStageSelect").addEventListener("change", renderIdeb);

const ALFAB = {
  "Petrolina":               {a2023:66, a2024:70, a2025:73, meta2025:71, nivel:4, part:90.3},
  "Juazeiro":                {a2023:31, a2024:29, a2025:50, meta2025:46, nivel:1, part:88.3},
  "Casa Nova":               {a2023:13, a2024:21, a2025:24, meta2025:28, nivel:0, part:86.3},
  "Curaçá":                  {a2023:30, a2024:23, a2025:52, meta2025:45, nivel:2, part:92.7},
  "Lagoa Grande":            {a2023:55, a2024:68, a2025:74, meta2025:63, nivel:4, part:96.0},
  "Orocó":                   {a2023:46, a2024:51, a2025:82, meta2025:57, nivel:5, part:89.9},
  "Santa Maria da Boa Vista":{a2023:46, a2024:64, a2025:83, meta2025:57, nivel:5, part:93.2},
  "Sobradinho":              {a2023:26, a2024:34, a2025:47, meta2025:42, nivel:1, part:91.3}
};

const NIVEL_LABEL = ["Abaixo do básico","Básico inferior","Básico","Intermediário","Adequado","Avançado"];

// ── Render: Alfabetização ──
function renderAlfabetizacao() {
  const items = MUNICIPIOS.map(m => ({muni:m, ...ALFAB[m]}));
  const mediaRide = mean(items.map(x => x.a2025));
  const acima = items.filter(x => x.a2025 >= x.meta2025).length;
  const maiorGanho = items.slice().sort((a,b)=>(b.a2025-b.a2023)-(a.a2025-a.a2023))[0];
  const menor = items.slice().sort((a,b)=>a.a2025-b.a2025)[0];

  document.getElementById("alfabKpis").innerHTML = `
    <div class="kpi"><div class="kpi-label">Média RIDE 2025</div><div class="kpi-value">${fmtPct(mediaRide,0)}</div><div class="kpi-note">Rede municipal — 2º ano EF</div></div>
    <div class="kpi green"><div class="kpi-label">Atingiram a meta</div><div class="kpi-value">${acima} / 8</div><div class="kpi-note">Municípios acima da meta 2025</div></div>
    <div class="kpi purple"><div class="kpi-label">Maior avanço 2023–2025</div><div class="kpi-value">${maiorGanho.muni}</div><div class="kpi-note">+${maiorGanho.a2025-maiorGanho.a2023} p.p. no período</div></div>
    <div class="kpi orange"><div class="kpi-label">Menor resultado 2025</div><div class="kpi-value">${menor.muni}</div><div class="kpi-note">${fmtPct(menor.a2025,0)} — meta: ${fmtPct(menor.meta2025,0)}</div></div>
  `;

  destroyChart("chartAlfabMeta");
  chartRefs["chartAlfabMeta"] = new Chart(document.getElementById("chartAlfabMeta"), {
    type:"bar",
    data:{
      labels: items.map(x=>abbr(x.muni)),
      datasets:[
        {label:"Resultado 2025", data:items.map(x=>x.a2025),
         backgroundColor: items.map(x=>x.a2025>=x.meta2025?"#1BAF7A":"#EB6834"), borderRadius:5},
        {label:"Meta 2025", data:items.map(x=>x.meta2025),
         backgroundColor:"rgba(0,0,0,0)", borderColor:"#1A3FD6", borderWidth:2,
         type:"line", pointRadius:5, pointBackgroundColor:"#1A3FD6"}
      ]
    },
    options: applyDefaults({
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:"bottom"}},
      scales:{
        y:{beginAtZero:true, suggestedMax:100, grid:{color:'#E6E9F0'},
           ticks:{callback:v=>v+"%", font:chartDefaults.font, color:chartDefaults.color}},
        x:{grid:{display:false}, ticks:{maxRotation:45, font:chartDefaults.font, color:chartDefaults.color}}
      }
    })
  });

  mkLine("chartAlfabEvolucao", ["2023","2024","2025"],
    items.map((x,i)=>({
      label: abbr(x.muni),
      data:[x.a2023, x.a2024, x.a2025],
      borderColor: COLORS[i], backgroundColor:"transparent",
      tension:.2, borderWidth:2, pointRadius:4, pointBackgroundColor:COLORS[i]
    })),
    {percent:true}
  );

  document.getElementById("alfabTableWrap").innerHTML = `<table>
    <thead><tr><th>Município</th><th>2023</th><th>2024</th><th>2025</th><th>Meta 2025</th><th>Situação</th><th>Nível</th><th>Participação</th></tr></thead>
    <tbody>${items.map(x=>{
      const ok = x.a2025 >= x.meta2025;
      return `<tr>
        <td><strong>${x.muni}</strong></td>
        <td class="num">${fmtPct(x.a2023,0)}</td>
        <td class="num">${fmtPct(x.a2024,0)}</td>
        <td class="num">${fmtPct(x.a2025,0)}</td>
        <td class="num">${fmtPct(x.meta2025,0)}</td>
        <td>${ok?'<span class="pill green">✓ Atingiu</span>':'<span class="pill orange">✗ Abaixo</span>'}</td>
        <td class="num">${x.nivel} — ${NIVEL_LABEL[x.nivel]}</td>
        <td class="num">${fmtPct(x.part,1)}</td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;
}

// ── Boot ──
setupNav();
setupSelects();
setupNewsArchive();
setupHomeExplorer();
renderOverview();
renderComparativo();
renderInfantil();
renderIdeb();
renderAlfabetizacao();
renderCenso();
renderDesigualdades();
renderPopulacao();
renderFinancas();
renderNoticias();
renderMunicipio();

/* ═══════════════ CALCULADORAS IDEB ═══════════════ */
(function initCalculadorasIdeb() {
  const fmt = (v, d = 2) => (v === null || v === undefined || !isFinite(v) ? "—" : v.toFixed(d).replace(".", ","));
  const num = (s) => {
    if (s === undefined || s === null || s === "") return NaN;
    const v = parseFloat(String(s).replace(",", "."));
    return isFinite(v) ? v : NaN;
  };
  const setOut = (key, val) => {
    const el = document.querySelector(`[data-out="${key}"]`);
    if (el) el.textContent = val;
  };

  // Sub-abas
  document.querySelectorAll(".calc-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.calc;
      document.querySelectorAll(".calc-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".calc-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const pane = document.getElementById("calc-pane-" + target);
      if (pane) pane.classList.add("active");
    });
  });

  // Genérico para AI e AF (P inserido direto)
  function calcEtapaSimples(prefix, limInfLP, limSupLP, limInfMT, limSupMT) {
    const lp = num(document.querySelector(`[data-input="${prefix}-lp"]`).value);
    const mt = num(document.querySelector(`[data-input="${prefix}-mt"]`).value);
    const p  = num(document.querySelector(`[data-input="${prefix}-p"]`).value);

    const ampLP = limSupLP - limInfLP;
    const ampMT = limSupMT - limInfMT;
    const numLP = isFinite(lp) ? lp - limInfLP : null;
    const numMT = isFinite(mt) ? mt - limInfMT : null;
    const indLP = numLP !== null ? (numLP / ampLP) * 10 : null;
    const indMT = numMT !== null ? (numMT / ampMT) * 10 : null;
    const N = (indLP !== null && indMT !== null) ? (indLP + indMT) / 2 : null;
    const ideb = (N !== null && isFinite(p)) ? N * p : null;

    setOut(`${prefix}-num-lp`, fmt(numLP));
    setOut(`${prefix}-num-mt`, fmt(numMT));
    setOut(`${prefix}-ind-lp`, fmt(indLP));
    setOut(`${prefix}-ind-mt`, fmt(indMT));
    setOut(`${prefix}-n`, fmt(N));
    setOut(`${prefix}-p-display`, isFinite(p) ? fmt(p, 4) : "—");
    setOut(`${prefix}-ideb`, fmt(ideb));
    setOut(`${prefix}-ideb-detail`, ideb !== null
      ? `N = ${fmt(N)} × P = ${fmt(p, 4)}`
      : "Preencha os três campos acima para ver o resultado.");
    setOut(`${prefix}-d-lp`, fmt(indLP));
    setOut(`${prefix}-d-mt`, fmt(indMT));
    setOut(`${prefix}-d-n`, fmt(N));
    setOut(`${prefix}-d-p`, isFinite(p) ? fmt(p, 4) : "—");
    setOut(`${prefix}-d-ideb`, fmt(ideb));
  }

  // Específico para EM (P por média harmônica das 3 taxas)
  function calcEnsinoMedio() {
    const lp = num(document.querySelector('[data-input="em-lp"]').value);
    const mt = num(document.querySelector('[data-input="em-mt"]').value);
    const t1 = num(document.querySelector('[data-input="em-t1"]').value);
    const t2 = num(document.querySelector('[data-input="em-t2"]').value);
    const t3 = num(document.querySelector('[data-input="em-t3"]').value);

    const numLP = isFinite(lp) ? lp - 117 : null;
    const numMT = isFinite(mt) ? mt - 111 : null;
    const indLP = numLP !== null ? (numLP / 334) * 10 : null;
    const indMT = numMT !== null ? (numMT / 356) * 10 : null;
    const N = (indLP !== null && indMT !== null) ? (indLP + indMT) / 2 : null;

    let harmonica = null, P = null;
    if (isFinite(t1) && isFinite(t2) && isFinite(t3) && t1 > 0 && t2 > 0 && t3 > 0) {
      harmonica = 3 / (1/t1 + 1/t2 + 1/t3);
      P = harmonica / 100;
    }
    const ideb = (N !== null && P !== null) ? N * P : null;

    setOut("em-num-lp", fmt(numLP));
    setOut("em-num-mt", fmt(numMT));
    setOut("em-ind-lp", fmt(indLP));
    setOut("em-ind-mt", fmt(indMT));
    setOut("em-n", fmt(N));
    setOut("em-p-display", P !== null ? fmt(P, 4) : "—");
    setOut("em-ideb", fmt(ideb));
    setOut("em-ideb-detail", ideb !== null
      ? `N = ${fmt(N)} × P = ${fmt(P, 4)}`
      : "Preencha proficiências e as três taxas de aprovação para ver o resultado.");
    setOut("em-d-lp", fmt(indLP));
    setOut("em-d-mt", fmt(indMT));
    setOut("em-d-n", fmt(N));
    setOut("em-d-p", P !== null ? fmt(P, 4) : "—");
    setOut("em-d-t1", isFinite(t1) ? fmt(t1) + "%" : "—");
    setOut("em-d-t2", isFinite(t2) ? fmt(t2) + "%" : "—");
    setOut("em-d-t3", isFinite(t3) ? fmt(t3) + "%" : "—");
    setOut("em-d-ideb", fmt(ideb));

    const harmEl = document.querySelector('[data-out="em-harmonic-info"]');
    if (harmEl) {
      if (harmonica !== null) {
        harmEl.style.display = "block";
        harmEl.innerHTML = `<strong>Média harmônica:</strong> 3 / (1/${fmt(t1)} + 1/${fmt(t2)} + 1/${fmt(t3)}) = ${fmt(harmonica, 4)} &nbsp;→&nbsp; <strong>P = ${fmt(P, 4)}</strong>`;
      } else {
        harmEl.style.display = "none";
      }
    }
  }

  // Listeners
  document.querySelectorAll('[data-input^="ai-"]').forEach(i =>
    i.addEventListener("input", () => calcEtapaSimples("ai", 49, 324, 60, 322)));
  document.querySelectorAll('[data-input^="af-"]').forEach(i =>
    i.addEventListener("input", () => calcEtapaSimples("af", 100, 400, 100, 400)));
  document.querySelectorAll('[data-input^="em-"]').forEach(i =>
    i.addEventListener("input", calcEnsinoMedio));

  // Botão "Copiar link" — gera URL com hash da aba calculadoras
  const copyBtn = document.getElementById("btnCopyCalcLink");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const url = window.location.origin + window.location.pathname + "#calculadoras";
      const labelEl = copyBtn.querySelector(".btn-copy-label");
      const iconEl = copyBtn.querySelector(".btn-copy-icon");
      const restore = () => {
        copyBtn.classList.remove("copied");
        if (labelEl) labelEl.textContent = "Copiar link";
        if (iconEl) iconEl.textContent = "🔗";
      };
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          // Fallback para contextos sem clipboard API
          const ta = document.createElement("textarea");
          ta.value = url;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        copyBtn.classList.add("copied");
        if (labelEl) labelEl.textContent = "Link copiado!";
        if (iconEl) iconEl.textContent = "✓";
        setTimeout(restore, 2200);
      } catch (e) {
        if (labelEl) labelEl.textContent = "Falha — copie manualmente";
        setTimeout(restore, 2500);
      }
    });
  }
})();

(function(){
  "use strict";
  const INDEX=window.IDEB2025_INDEX;
  if(!INDEX) return;

  const $=id=>document.getElementById(id);
  const els={
    panel:$("panel-ideb2025"),scope:$("ideb25Scope"),uf:$("ideb25UF"),stage:$("ideb25Stage"),
    municipalityField:$("ideb25MunicipalityField"),municipality:$("ideb25Municipality"),network:$("ideb25Network"),
    schoolFields:$("ideb25SchoolFields"),schoolFilter:$("ideb25SchoolFilter"),school:$("ideb25School"),
    submit:$("ideb25Submit"),count:$("ideb25Count"),status:$("ideb25Status"),placeholder:$("ideb25Placeholder"),
    result:$("ideb25Result"),resultHead:$("ideb25ResultHead"),score:$("ideb25Score"),kpis:$("ideb25Kpis"),
    narrative:$("ideb25Narrative"),rank:$("ideb25Rank"),tableTitle:$("ideb25TableTitle"),tableSub:$("ideb25TableSub"),
    tableBody:$("ideb25TableBody"),chart:$("ideb25Chart"),heroMunicipios:$("ideb25HeroMunicipios"),heroEscolas:$("ideb25HeroEscolas")
  };
  if(!els.panel) return;

  const UF_DATA=window.IDEB2025_UF_DATA=window.IDEB2025_UF_DATA||{};
  const ufMeta=new Map(INDEX.ufs.map(x=>[x.s,x]));
  const regionValues={norte:"Norte",nordeste:"Nordeste",centro:"Centro-Oeste",sudeste:"Sudeste",sul:"Sul"};
  const scopeNames={brasil:"Brasil inteiro",norte:"Região Norte",nordeste:"Região Nordeste",centro:"Região Centro-Oeste",sudeste:"Região Sudeste",sul:"Região Sul",ride:"RIDE Petrolina–Juazeiro",vale:"Vale do São Francisco",valeBA:"Vale do São Francisco — Bahia",valePE:"Vale do São Francisco — Pernambuco"};
  const stageLabel={iniciais:"Anos iniciais",finais:"Anos finais",medio:"Ensino médio"};
  const specialScopes=new Set(["ride","vale","valeBA","valePE"]);
  const specialUfs={ride:["BA","PE"],vale:["BA","PE"],valeBA:["BA"],valePE:["PE"]};
  let mode="municipio",chart=null,lastRecord=null,loadToken=0,initialized=false;

  const norm=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/\s+/g," ").trim();
  const esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const valid=n=>typeof n==="number"&&Number.isFinite(n);
  const f1=n=>valid(n)?n.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1}):"—";
  const f2=n=>valid(n)?n.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):"—";
  const pct=n=>valid(n)?n.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})+"%":"—";
  const delta=(a,b)=>valid(a)&&valid(b)?Math.round((a-b)*10)/10:null;
  const deltaText=d=>d===null?"sem comparação":`${d>0?"+":""}${f1(d)} ponto${Math.abs(d)===1?"":"s"}`;
  const deltaClass=d=>d===null||d===0?"flat":d>0?"up":"down";
  const deltaArrow=d=>d===null||d===0?"•":d>0?"↑":"↓";
  const score=r=>r?.y?.[r.y.length-1]??null;
  const prior=r=>r?.y?.[r.y.length-2]??null;
  const mean=values=>{const v=values.filter(valid);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  const regionOf=uf=>ufMeta.get(uf)?.r||"";

  function scopeLabel(){return scopeNames[els.scope.value]||"Brasil inteiro";}
  function scopeUfs(scope=els.scope.value){
    if(specialScopes.has(scope)) return specialUfs[scope];
    if(regionValues[scope]) return INDEX.ufs.filter(x=>x.r===regionValues[scope]).map(x=>x.s);
    return INDEX.ufs.map(x=>x.s);
  }
  function allowedMunicipality(code,scope=els.scope.value){
    if(!specialScopes.has(scope)) return true;
    return (INDEX.territorios[scope]||[]).includes(String(code));
  }
  function scopeForRanking(){
    const s=els.scope.value;
    if(regionValues[s]) return "region";
    if(s==="brasil") return "brasil";
    return "special";
  }

  function setStatus(text,error=false){
    if(!els.status)return;
    els.status.textContent=text||"";
    els.status.classList.toggle("error",!!error);
  }

  function loadUF(uf){
    if(UF_DATA[uf]) return Promise.resolve(UF_DATA[uf]);
    const token=++loadToken;
    setStatus(`Carregando dados de ${ufMeta.get(uf)?.n||uf}…`);
    return new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src=`ideb2025-data/ufs/${uf}.js`;
      script.async=true;
      script.onload=()=>{
        script.remove();
        if(token===loadToken)setStatus("");
        UF_DATA[uf]?resolve(UF_DATA[uf]):reject(new Error("Arquivo de dados não inicializado"));
      };
      script.onerror=()=>{script.remove();setStatus("Não foi possível carregar os dados desta UF.",true);reject(new Error("Falha ao carregar UF"));};
      document.head.appendChild(script);
    });
  }

  function fillUFs(preferred){
    const allowed=new Set(scopeUfs());
    const options=INDEX.ufs.filter(x=>allowed.has(x.s));
    const current=preferred||els.uf.value;
    els.uf.innerHTML=options.map(x=>`<option value="${x.s}">${esc(x.n)} — ${x.s}</option>`).join("");
    const fallback=options.some(x=>x.s==="BA")?"BA":options[0]?.s;
    els.uf.value=options.some(x=>x.s===current)?current:fallback;
  }

  function updateStages(){
    const current=els.stage.value;
    const list=[["iniciais","Anos iniciais"],["finais","Anos finais"],["medio","Ensino médio"]];
    els.stage.innerHTML=list.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
    els.stage.value=list.some(x=>x[0]===current)?current:"iniciais";
  }

  function currentData(){return UF_DATA[els.uf.value]||{municipios:[],escolas:[]};}
  function municipalRows(){return currentData().municipios.filter(r=>r.t===els.stage.value&&allowedMunicipality(r.c));}
  function schoolRows(){return currentData().escolas.filter(r=>r.t===els.stage.value&&allowedMunicipality(r.c));}

  function updateMunicipalities(preferred){
    const data=mode==="escola"?schoolRows():municipalRows();
    const available=new Map(data.map(r=>[r.c,r.m]));
    const options=(INDEX.municipios[els.uf.value]||[]).filter(x=>allowedMunicipality(x.c)&&available.has(x.c));
    const current=preferred||els.municipality.value;
    els.municipality.innerHTML=options.map(x=>`<option value="${x.c}">${esc(x.n)}</option>`).join("");
    const juazeiro=options.find(x=>norm(x.n)==="JUAZEIRO")?.c;
    els.municipality.value=options.some(x=>x.c===current)?current:(juazeiro||options[0]?.c||"");
    updateNetworks();
  }

  function updateNetworks(){
    let rows;
    if(mode==="estado") rows=municipalRows();
    else if(mode==="municipio") rows=municipalRows().filter(r=>r.c===els.municipality.value);
    else rows=schoolRows().filter(r=>r.c===els.municipality.value);
    const nets=[...new Set(rows.map(r=>r.r).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const current=els.network.value;
    els.network.innerHTML=nets.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join("");
    const preference=mode==="escola"?["Estadual","Municipal","Federal","Privada"]:["Pública","Municipal","Estadual","Federal"];
    els.network.value=nets.includes(current)?current:(preference.find(x=>nets.includes(x))||nets[0]||"");
    updateSchools();
  }

  function updateSchools(){
    if(mode!=="escola"){els.count.textContent=mode==="estado"?`${municipalRows().filter(r=>r.r===els.network.value).length} registros municipais no recorte`:"";return;}
    const all=schoolRows().filter(r=>r.c===els.municipality.value&&r.r===els.network.value);
    const q=norm(els.schoolFilter.value),filtered=all.filter(r=>!q||norm(r.s).includes(q)||String(r.i).includes(q));
    const current=els.school.value;
    els.school.innerHTML=filtered.map(r=>`<option value="${r.i}">${esc(r.s)}</option>`).join("");
    if(filtered.some(r=>r.i===current))els.school.value=current;
    els.count.textContent=`${filtered.length.toLocaleString("pt-BR")} escola${filtered.length===1?"":"s"} encontrada${filtered.length===1?"":"s"}`;
  }

  async function refreshData(preferredMunicipality){
    const uf=els.uf.value;
    if(!uf)return;
    try{
      await loadUF(uf);
      updateMunicipalities(preferredMunicipality);
      els.submit.disabled=false;
    }catch{
      els.submit.disabled=true;
    }
  }

  async function setMode(next){
    mode=next;
    document.querySelectorAll("[data-ideb25-mode]").forEach(b=>b.classList.toggle("active",b.dataset.ideb25Mode===mode));
    els.municipalityField.classList.toggle("is-hidden",mode==="estado");
    els.schoolFields.classList.toggle("visible",mode==="escola");
    $("ideb25ModeCopy").textContent=mode==="estado"?"Veja o panorama dos municípios de uma unidade da Federação.":mode==="municipio"?"Compare redes, etapas e posições de um município.":"Pesquise escolas dos anos iniciais, anos finais ou do ensino médio em todo o país.";
    updateStages();
    await refreshData(els.municipality.value);
    els.placeholder.hidden=false;els.result.hidden=true;
  }

  function aggregateState(){
    const rows=municipalRows().filter(r=>r.r===els.network.value);
    const years=INDEX.years[els.stage.value]||[];
    const y=years.map((_,i)=>mean(rows.map(r=>r.y[i])));
    return {aggregate:true,u:els.uf.value,t:els.stage.value,m:ufMeta.get(els.uf.value)?.n||els.uf.value,r:els.network.value,
      a:mean(rows.map(r=>r.a)),f:mean(rows.map(r=>r.f)),x:mean(rows.map(r=>r.x)),p:mean(rows.map(r=>r.p)),n:mean(rows.map(r=>r.n)),y,q:rows.filter(r=>valid(score(r))).length,rows};
  }

  function selectedRecord(){
    if(mode==="estado")return aggregateState();
    if(mode==="municipio")return municipalRows().find(r=>r.c===els.municipality.value&&r.r===els.network.value)||null;
    return schoolRows().find(r=>r.c===els.municipality.value&&r.r===els.network.value&&r.i===els.school.value)||null;
  }

  function tableRows(rec){
    if(mode==="estado")return rec.rows.filter(r=>valid(score(r)));
    if(mode==="municipio")return municipalRows().filter(r=>r.r===rec.r&&valid(score(r)));
    return schoolRows().filter(r=>r.c===rec.c&&valid(score(r)));
  }
  function sortedRows(rows){return [...rows].sort((a,b)=>(score(b)-score(a))||((a.s||a.m).localeCompare(b.s||b.m,"pt-BR")));}
  function currentId(r){return mode==="escola"?r.i:r.c;}
  function localRank(rec,rows){const sorted=sortedRows(rows);const idx=sorted.findIndex(r=>currentId(r)===currentId(rec)&&r.r===rec.r);return {position:idx>=0?idx+1:null,total:sorted.length,sorted};}

  function stateSummary(rec){return INDEX.resumosEstados.find(s=>s.u===rec.u&&s.t===rec.t&&s.r===rec.r)||null;}
  function stateComparatorRows(rec){
    let rows=INDEX.resumosEstados.filter(s=>s.t===rec.t&&s.r===rec.r);
    if(regionValues[els.scope.value])rows=rows.filter(s=>regionOf(s.u)===regionValues[els.scope.value]);
    return rows;
  }

  function renderHead(rec){
    const title=mode==="estado"?rec.m:mode==="municipio"?rec.m:rec.s;
    const kicker=mode==="estado"?"Panorama estadual":mode==="municipio"?"Resultado municipal":"Resultado escolar";
    const meta=[stageLabel[rec.t],`Rede ${rec.r}`,mode==="escola"?rec.m:`${ufMeta.get(els.uf.value)?.n} · ${els.uf.value}`,scopeLabel()];
    if(mode==="escola")meta.push(`Código Inep ${rec.i}`);
    if(mode==="municipio")meta.push(`Código IBGE ${rec.c}`);
    els.resultHead.innerHTML=`<div><div class="ideb25-result-kicker">${kicker}</div><h3>${esc(title)}</h3><div class="ideb25-meta">${meta.map(x=>`<span>${esc(x)}</span>`).join("")}</div></div><div class="ideb25-tools"><button class="ideb25-tool" id="ideb25Copy" type="button">Copiar resumo</button><button class="ideb25-tool" id="ideb25Print" type="button">Imprimir</button></div>`;
    $("ideb25Copy").addEventListener("click",copySummary);$("ideb25Print").addEventListener("click",()=>window.print());
  }

  function renderScore(rec,local,avg){
    const sc=score(rec),pr=prior(rec),d=delta(sc,pr);
    const label=mode==="estado"?"Média municipal do Ideb · 2025":"Ideb observado · 2025";
    const note=mode==="estado"?`Média simples de ${rec.q} resultados municipais válidos. Não corresponde ao Ideb oficial da unidade da Federação.`:valid(sc)?`Escala de 0 a 10. Em 2023, o resultado foi ${f1(pr)}.`:"O Inep não publicou resultado válido para esta combinação em 2025.";
    els.score.innerHTML=`<div class="ideb25-score-label">${label}</div><div class="ideb25-score-value ${valid(sc)?"":"missing"}">${valid(sc)?f1(sc):"Sem resultado"}</div><div class="ideb25-change ${deltaClass(d)}">${deltaArrow(d)} ${deltaText(d)} frente a 2023</div><div class="ideb25-scale"><div class="ideb25-scale-track"><div class="ideb25-scale-fill" style="width:${valid(sc)?Math.max(0,Math.min(100,sc*10)):0}%"></div></div><div class="ideb25-scale-labels"><span>0</span><span>5</span><span>10</span></div></div><div class="ideb25-score-note">${note}</div>`;

    let position="—",positionNote="Sem resultado para ordenar",quantityLabel="Posição no recorte";
    if(mode==="estado"){
      const ss=stateSummary(rec),kind=scopeForRanking();
      if(ss&&kind!=="special"){
        position=`${kind==="region"?ss.rr:ss.rb}º`;
        positionNote=`entre ${kind==="region"?ss.tr:ss.tb} UFs com média municipal comparável`;
      }
      quantityLabel="Posição entre UFs";
    }else if(local.position){position=`${local.position}º`;positionNote=`entre ${local.total} resultados no recorte da tabela`;}
    const diff=valid(sc)&&valid(avg)?sc-avg:null;
    const secondValue=mode==="estado"?rec.q:f2(rec.n);
    const secondLabel=mode==="estado"?"Municípios com resultado":"Nota média padronizada";
    const secondNote=mode==="estado"?"Resultados válidos usados na média simples":"Síntese das proficiências do Saeb";
    els.kpis.innerHTML=`
      <div class="ideb25-kpi"><div class="ideb25-kpi-label">Aprovação em 2025</div><div class="ideb25-kpi-value">${pct(rec.a)}</div><div class="ideb25-kpi-note">${mode==="estado"?"Média das taxas municipais válidas":"Componente de fluxo utilizado no indicador"}</div></div>
      <div class="ideb25-kpi"><div class="ideb25-kpi-label">${secondLabel}</div><div class="ideb25-kpi-value">${secondValue}</div><div class="ideb25-kpi-note">${secondNote}</div></div>
      <div class="ideb25-kpi"><div class="ideb25-kpi-label">${quantityLabel}</div><div class="ideb25-kpi-value">${position}</div><div class="ideb25-kpi-note">${positionNote}</div></div>
      <div class="ideb25-kpi"><div class="ideb25-kpi-label">Distância da média comparável</div><div class="ideb25-kpi-value">${diff===null?"—":`${diff>0?"+":""}${f1(diff)}`}</div><div class="ideb25-kpi-note">Média comparável: ${f1(avg)}</div></div>`;
  }

  function renderChart(rec){
    const years=INDEX.years[rec.t]||[];
    const pairs=years.map((y,i)=>[String(y),rec.y[i]]).filter(x=>valid(x[1]));
    let empty=$("ideb25ChartEmpty");
    if(!empty){empty=document.createElement("div");empty.id="ideb25ChartEmpty";empty.className="ideb25-chart-empty";empty.hidden=true;els.chart.parentElement.appendChild(empty);}
    if(chart){chart.destroy();chart=null;}
    if(!pairs.length||typeof Chart==="undefined"){
      els.chart.hidden=true;empty.hidden=false;empty.innerHTML=typeof Chart==="undefined"?"<strong>Gráfico temporariamente indisponível</strong><span>Os demais dados continuam acessíveis.</span>":"<strong>Série histórica indisponível</strong><span>Não há edições válidas suficientes para desenhar o gráfico.</span>";return;
    }
    els.chart.hidden=false;empty.hidden=true;
    const labels=pairs.map(x=>x[0]),values=pairs.map(x=>x[1]);
    chart=new Chart(els.chart,{type:"line",data:{labels,datasets:[{label:mode==="estado"?"Média municipal":"Ideb observado",data:values,borderColor:"#1F3A5F",backgroundColor:"rgba(31,58,95,.10)",pointBackgroundColor:labels.map(y=>y==="2025"?"#B8492C":"#1F3A5F"),pointRadius:labels.map(y=>y==="2025"?6:4),pointHoverRadius:7,borderWidth:3,tension:.28,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${mode==="estado"?"Média municipal":"Ideb"} ${f1(c.parsed.y)}`}}},scales:{x:{grid:{display:false},ticks:{color:"#4A4540",font:{family:"Inter",size:11}}},y:{beginAtZero:false,suggestedMin:Math.max(0,Math.floor(Math.min(...values)-1)),suggestedMax:Math.min(10,Math.ceil(Math.max(...values)+1)),grid:{color:"#E8DFCB"},ticks:{stepSize:.5,color:"#4A4540",font:{family:"Inter",size:10},callback:v=>Number(v).toLocaleString("pt-BR",{minimumFractionDigits:1})}}}}});
  }

  function renderNarrative(rec,avg){
    const sc=score(rec),pr=prior(rec),d=delta(sc,pr);
    if(!valid(sc)){els.narrative.textContent="Não há resultado válido para os filtros selecionados. A ausência pode decorrer dos critérios de divulgação do Inep e não deve ser interpretada como nota zero.";return;}
    const movement=d===null?"não permite comparação direta com 2023":d>0?`avançou ${f1(Math.abs(d))} ponto${Math.abs(d)===1?"":"s"} em relação a 2023`:d<0?`recuou ${f1(Math.abs(d))} ponto${Math.abs(d)===1?"":"s"} em relação a 2023`:"manteve o resultado de 2023";
    const compare=valid(avg)?sc>avg?`ficou ${f1(sc-avg)} ponto acima da média comparável`:sc<avg?`ficou ${f1(avg-sc)} ponto abaixo da média comparável`:"coincidiu com a média comparável":"não dispõe de média comparável";
    if(mode==="estado"){
      els.narrative.textContent=`No recorte selecionado, ${rec.m} apresenta média simples municipal de ${f1(sc)} nos ${stageLabel[rec.t].toLowerCase()}, considerando ${rec.q} municípios com resultado válido na rede ${rec.r.toLowerCase()}. A média ${movement} e ${compare}. Esse panorama serve para comparar a distribuição dos resultados municipais e não substitui o Ideb oficial da rede estadual.`;
    }else{
      const subject=mode==="municipio"?`${rec.m}, na rede ${rec.r.toLowerCase()}`:rec.s;
      els.narrative.textContent=`Em 2025, ${subject} alcançou Ideb ${f1(sc)} nos ${stageLabel[rec.t].toLowerCase()}. O resultado ${movement} e ${compare}. A taxa de aprovação foi ${pct(rec.a)}, com proficiências de ${f1(rec.p)} em Língua Portuguesa e ${f1(rec.x)} em Matemática.`;
    }
  }

  function rankItems(rec,local){
    if(mode==="estado"){
      const ss=stateSummary(rec);if(!ss)return [];
      return [{l:"Brasil",p:ss.rb,t:ss.tb},{l:"Região",p:ss.rr,t:ss.tr},{l:"Municípios válidos",value:rec.q}];
    }
    if(mode==="municipio")return [{l:"Brasil",p:rec.rb,t:rec.tb},{l:"Região",p:rec.rr,t:rec.tr},{l:"Estado",p:rec.re,t:rec.te}];
    return [{l:"Município",p:rec.rm,t:rec.tm},{l:"Estado",p:rec.re,t:rec.te},{l:"Brasil",p:rec.rb,t:rec.tb}];
  }

  function renderRank(rec,local,avg,rows){
    const items=rankItems(rec,local);
    const headline=items.find(x=>x.p)||null;
    const max=sortedRows(rows)[0];
    els.rank.innerHTML=`<div class="ideb25-card-head"><div><h4>${mode==="estado"?"Posição do panorama estadual":"Posições comparáveis"}</h4><div class="ideb25-card-sub">Rankings consideram resultados válidos da mesma etapa${mode==="municipio"?" e rede":""}.</div></div></div>
      <div class="ideb25-rank-big"><strong>${headline?.p?headline.p+"º":"—"}</strong><span>${headline?.p?`de ${headline.t} · ${headline.l}`:"sem posição comparável"}</span></div>
      <div class="ideb25-rank-grid">${items.map(x=>`<div><span>${esc(x.l)}</span><strong>${x.p?`${x.p}º <small>de ${x.t}</small>`:(x.value??"—")}</strong></div>`).join("")}</div>
      <div class="ideb25-benchmark">${[
        {label:mode==="estado"?"Média selecionada":"Resultado selecionado",value:score(rec)},
        {label:"Média comparável",value:avg},
        {label:mode==="estado"?"Maior município":"Maior resultado da tabela",value:score(max)}
      ].map(x=>`<div class="ideb25-benchmark-row"><span>${esc(x.label)}</span><strong>${f1(x.value)}</strong><div class="ideb25-benchmark-bar"><span style="width:${valid(x.value)?Math.min(100,x.value*10):0}%"></span></div></div>`).join("")}</div>`;
  }

  function renderTable(rec,rows,local){
    const sorted=sortedRows(rows).slice(0,10);
    if(mode==="estado"){
      els.tableTitle.textContent="Maiores resultados municipais";
      els.tableSub.textContent=`${stageLabel[rec.t]} · rede ${rec.r.toLowerCase()} · ${rec.m} · ${scopeLabel()}`;
    }else if(mode==="municipio"){
      els.tableTitle.textContent="Ranking de municípios";
      els.tableSub.textContent=`${stageLabel[rec.t]} · rede ${rec.r.toLowerCase()} · ${ufMeta.get(els.uf.value)?.n} · ${scopeLabel()}`;
    }else{
      els.tableTitle.textContent="Maiores resultados no município";
      els.tableSub.textContent=`${stageLabel[rec.t]} · todas as redes · ${rec.m}`;
    }
    els.tableBody.innerHTML=sorted.map((r,i)=>{
      const d=delta(score(r),prior(r)),name=mode==="escola"?r.s:r.m;
      const current=mode==="escola"?r.i===rec.i:mode==="municipio"?r.c===rec.c&&r.r===rec.r:false;
      return `<tr class="${current?"is-current":""}"><td class="ideb25-rank-cell">${i+1}º</td><td><strong>${esc(name)}</strong>${mode==="escola"?`<small class="ideb25-code">${r.i}</small>`:""}</td><td>${esc(r.r)}</td><td class="ideb25-score-cell">${f1(score(r))}</td><td class="ideb25-delta-${deltaClass(d)}">${d===null?"—":`${d>0?"+":""}${f1(d)}`}</td></tr>`;
    }).join("")||'<tr><td colspan="5">Nenhum resultado válido para o recorte selecionado.</td></tr>';
  }

  function render(){
    const rec=selectedRecord();
    if(!rec){els.placeholder.hidden=false;els.result.hidden=true;els.placeholder.innerHTML='<div><div class="ideb25-placeholder-icon">?</div><strong>Resultado não localizado</strong><p>Revise os filtros ou escolha outra rede, município ou escola.</p></div>';return;}
    lastRecord=rec;
    const rows=tableRows(rec),local=localRank(rec,rows);
    let avg;
    if(mode==="estado")avg=scopeForRanking()==="special"?null:mean(stateComparatorRows(rec).map(x=>x.a));
    else avg=mean(rows.map(score));
    els.placeholder.hidden=true;els.result.hidden=false;
    renderHead(rec);renderScore(rec,local,avg);renderChart(rec);renderNarrative(rec,avg);renderRank(rec,local,avg,rows);renderTable(rec,rows,local);
    requestAnimationFrame(()=>els.result.scrollIntoView({behavior:"smooth",block:"start"}));
  }

  function copySummary(){
    if(!lastRecord)return;
    const r=lastRecord,sc=score(r),pr=prior(r),d=delta(sc,pr);
    const title=mode==="estado"?r.m:mode==="municipio"?r.m:r.s;
    const prefix=mode==="estado"?"Média simples dos resultados municipais":"Ideb";
    const text=`${title} — ${stageLabel[r.t]} — rede ${r.r}. ${prefix} 2025: ${f1(sc)}. Resultado comparável de 2023: ${f1(pr)}. Variação: ${deltaText(d)}. Aprovação 2025: ${pct(r.a)}. Fonte dos dados: MEC/Inep.`;
    navigator.clipboard?.writeText(text).then(()=>{const b=$("ideb25Copy");if(!b)return;const old=b.textContent;b.textContent="Resumo copiado";setTimeout(()=>b.textContent=old,1800);}).catch(()=>{});
  }

  async function onScopeChange(preferredUf){
    fillUFs(preferredUf);
    await refreshData();
    els.placeholder.hidden=false;els.result.hidden=true;
  }

  function bind(){
    document.querySelectorAll("[data-ideb25-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.ideb25Mode)));
    document.querySelectorAll("[data-ideb25-preset]").forEach(b=>b.addEventListener("click",async()=>{
      const preset=b.dataset.ideb25Preset,uf=b.dataset.ideb25Uf;
      els.scope.value=preset||"brasil";await onScopeChange(uf);
    }));
    els.scope.addEventListener("change",()=>onScopeChange());
    els.uf.addEventListener("change",()=>refreshData());
    els.stage.addEventListener("change",()=>updateMunicipalities(els.municipality.value));
    els.municipality.addEventListener("change",updateNetworks);
    els.network.addEventListener("change",updateSchools);
    els.schoolFilter.addEventListener("input",updateSchools);
    els.submit.addEventListener("click",render);
    els.school.addEventListener("dblclick",render);
    [els.scope,els.uf,els.stage,els.municipality,els.network,els.school].forEach(el=>el.addEventListener("keydown",e=>{if(e.key==="Enter")render();}));
  }

  async function init(){
    if(initialized)return;initialized=true;
    els.heroMunicipios.textContent=INDEX.totais.municipios.toLocaleString("pt-BR");
    els.heroEscolas.textContent=INDEX.totais.registrosEscolares.toLocaleString("pt-BR");
    bind();updateStages();fillUFs("BA");await refreshData();
    const juazeiro=(INDEX.municipios.BA||[]).find(x=>norm(x.n)==="JUAZEIRO")?.c;
    if(juazeiro){els.municipality.value=juazeiro;updateNetworks();}
    // Mantém a consulta no topo ao abrir. O resultado só é exibido após
    // uma ação explícita do usuário no botão “Ver resultado” ou pela tecla Enter.
    els.placeholder.hidden=false;
    els.result.hidden=true;
    lastRecord=null;
  }

  window.renderIdeb2025=function(){
    init();
    if(chart)setTimeout(()=>chart.resize(),80);
  };
  if(els.panel.classList.contains("active"))init();
})();

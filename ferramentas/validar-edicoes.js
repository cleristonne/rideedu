#!/usr/bin/env node
/* RIDE EDU · verificador das edições do Vale Educa
   Uso (na pasta do site):  node ferramentas/validar-edicoes.js
   Confere cada arquivo em newsletters/edicoes/, os campos obrigatórios,
   ids repetidos e se cada edição está em newsletters/lista.js
   (gerada por ferramentas/gerar-lista.js).                              */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = path.resolve(__dirname, "..");
const pasta = path.join(raiz, "newsletters", "edicoes");
const OBRIGATORIOS = ["id", "weekLabel", "shortDate", "footerStamp", "footerSource", "dateLabel", "spotlight", "stats", "editorial", "agenda", "sources"];

let erros = 0, avisos = 0;
const erro = m => { erros++; console.log("  ERRO  " + m); };
const aviso = m => { avisos++; console.log("  aviso " + m); };

const ctxLista = { window: {} };
try { vm.runInNewContext(fs.readFileSync(path.join(raiz, "newsletters", "lista.js"), "utf8"), ctxLista); } catch (e) { /* sem lista */ }
const listados = ctxLista.window.RIDE_EDICOES_LISTA || [];
const arquivos = fs.readdirSync(pasta).filter(f => f.endsWith(".js")).map(f => f.replace(/\.js$/, ""));
const ids = new Set();

for (const nome of arquivos) {
  console.log(nome + ".js");
  const registradas = [];
  const ctx = { RIDE_EDICOES: { registrar: (op, ed) => registradas.push({ op, ed }) } };
  try {
    vm.runInNewContext(fs.readFileSync(path.join(pasta, nome + ".js"), "utf8"), ctx, { filename: nome + ".js" });
  } catch (e) {
    erro("o arquivo não pôde ser lido (vírgula, aspas ou chave faltando?): " + e.message);
    continue;
  }
  if (registradas.length !== 1) { erro("o arquivo deve chamar RIDE_EDICOES.registrar(...) uma única vez"); continue; }
  const { op, ed } = registradas[0];
  for (const c of OBRIGATORIOS) if (ed[c] == null || ed[c] === "") erro("campo obrigatório ausente: " + c);
  if (ed.id && ed.id !== nome) erro(`o id ("${ed.id}") deve ser igual ao nome do arquivo ("${nome}")`);
  if (ids.has(ed.id)) erro("id repetido em outra edição: " + ed.id);
  ids.add(ed.id);
  if (!op || !op.rotulo) aviso("sem rotulo: o seletor usará shortDate");
  if (ed.spotlight && !ed.spotlight.title) erro("spotlight.title (manchete) está vazio");
  (ed.sections || []).forEach((s, i) => (s.stories || []).forEach((st, j) => {
    if (!st.title) erro(`sections[${i}].stories[${j}] sem title`);
    if (!st.sourceUrl) aviso(`"${st.title || j}" sem sourceUrl (link da fonte)`);
  }));
  if (ed.pdf && !fs.existsSync(path.join(raiz, ed.pdf))) erro("pdf indicado não existe: " + ed.pdf);
  if (ed.oculta === true) { if (listados.includes(nome)) erro("rascunho (oculta) não deveria estar na lista; rode node ferramentas/gerar-lista.js"); }
  else if (!listados.includes(nome)) erro("não está em newsletters/lista.js; rode node ferramentas/gerar-lista.js");
  if (ed.sections) (ed.sections || []).forEach((s, i) => (s.stories || []).forEach((st, j) => {
    if ((st.paragraphs || []).length && /^##\s/.test(st.paragraphs[0])) aviso(`"${st.title}" começa com intertítulo; o primeiro parágrafo deve ser texto`);
  }));
}
for (const l of listados) if (!arquivos.includes(l)) erro("newsletters/lista.js cita uma edição sem arquivo: " + l);

console.log("\nOrdem em newsletters/lista.js (a primeira é a edição atual):");
listados.forEach((l, i) => console.log((i === 0 ? "  ► " : "    ") + l));
console.log(`\n${erros} erro(s), ${avisos} aviso(s).`);
process.exit(erros ? 1 : 0);

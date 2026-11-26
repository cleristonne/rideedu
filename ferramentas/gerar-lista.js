#!/usr/bin/env node
/* RIDE EDU · Margens · gera newsletters/lista.js
   Lê todos os arquivos de newsletters/edicoes/ e escreve a lista de
   edições publicadas, da mais recente para a mais antiga (a primeira
   é a edição atual da capa). Edições marcadas como rascunho
   ("oculta": true, opção do painel) ficam de fora.
   Roda sozinho no Netlify a cada publicação (netlify.toml) e pode ser
   rodado à mão:  node ferramentas/gerar-lista.js                    */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = path.resolve(__dirname, "..");
const pasta = path.join(raiz, "newsletters", "edicoes");
const ID = /^\d{4}-\d{2}-\d{2}_[0-9-]+$/;

const ids = [];
for (const arq of fs.readdirSync(pasta).filter(f => f.endsWith(".js"))) {
  const nome = arq.replace(/\.js$/, "");
  if (!ID.test(nome)) { console.log("ignorado (nome fora do padrão AAAA-MM-DD_DD): " + arq); continue; }
  let ed = null;
  try {
    vm.runInNewContext(fs.readFileSync(path.join(pasta, arq), "utf8"), { RIDE_EDICOES: { registrar: (o, e) => { ed = e; } } });
  } catch (e) {
    console.log("ignorado (arquivo com erro, veja validar-edicoes.js): " + arq);
    continue;
  }
  if (!ed) continue;
  if (ed.oculta === true) { console.log("rascunho, fora do site: " + nome); continue; }
  ids.push(nome);
}
ids.sort().reverse();

const saida = "/* Gerado por ferramentas/gerar-lista.js. Não edite à mão.\n" +
  "   Ordem: da edição mais recente (capa) para a mais antiga. */\n" +
  "window.RIDE_EDICOES_LISTA = " + JSON.stringify(ids, null, 2) + ";\n";
fs.writeFileSync(path.join(raiz, "newsletters", "lista.js"), saida);
console.log("newsletters/lista.js: " + ids.length + " edição(ões); atual: " + (ids[0] || "nenhuma"));

/* RIDE EDU · Margens · formato dos arquivos de edição para o painel (Decap CMS)
   Os arquivos newsletters/edicoes/<id>.js têm a forma
       RIDE_EDICOES.registrar({"rotulo": "..."}, { ...JSON da edição... });
   O painel trabalha com um objeto simples. Este formato converte nos
   dois sentidos, para que o painel leia e grave os arquivos sem mudar
   a estrutura que o site usa:
   - "rotulo" (texto do seletor de edições) vira um campo comum;
   - os parágrafos de cada matéria e do editorial viram um único campo
     de texto ("corpo"): parágrafos separados por linha em branco,
     "## " no início da linha para intertítulo e [texto](https://...)
     para link;
   - "themes" (pares [rubrica, texto]) vira lista de objetos.
   Usado pelo painel (admin/index.html) e pelos testes em Node.        */
(function (raiz) {
  "use strict";

  var INICIO = "RIDE_EDICOES.registrar(";

  function lerArquivo(texto) {
    var i = texto.indexOf(INICIO);
    var j = texto.lastIndexOf(")");
    if (i < 0 || j < i) throw new Error("Arquivo de edição fora do formato esperado.");
    var args = JSON.parse("[" + texto.slice(i + INICIO.length, j) + "]");
    return { opcoes: args[0] || {}, edicao: args[1] || {} };
  }

  /* parágrafos (HTML simples) -> corpo (texto) */
  function paraCorpo(paragrafos) {
    return (paragrafos || []).map(function (p) {
      return String(p).replace(/<a\s+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, function (_, url, t) {
        return "[" + t + "](" + url + ")";
      });
    }).join("\n\n");
  }
  /* corpo (texto) -> parágrafos (HTML simples) */
  function paraParagrafos(corpo) {
    return String(corpo || "")
      .replace(/\r\n?/g, "\n")
      .split(/\n[ \t]*\n/)
      .map(function (p) { return p.replace(/\s*\n\s*/g, " ").trim(); })
      .filter(Boolean)
      .map(function (p) {
        return p.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, url) {
          return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + t + "</a>";
        });
      });
  }

  function clonar(o) { return JSON.parse(JSON.stringify(o == null ? {} : o)); }

  function fromFile(texto) {
    var lido = lerArquivo(texto);
    var d = clonar(lido.edicao);
    d.rotulo = lido.opcoes.rotulo || "";
    if (d.editorial && Array.isArray(d.editorial.paragraphs)) {
      d.editorial.corpo = paraCorpo(d.editorial.paragraphs);
      delete d.editorial.paragraphs;
    }
    (d.sections || []).forEach(function (s) {
      (s.stories || []).forEach(function (st) {
        st.corpo = paraCorpo(st.paragraphs || (st.body ? [st.body] : []));
        delete st.paragraphs;
      });
    });
    if (Array.isArray(d.themes)) {
      d.themes = d.themes.map(function (t) {
        return Array.isArray(t) ? { rubrica: t[0] || "", texto: t[1] || "" } : t;
      });
    }
    return d;
  }

  function semVazios(o) {
    // campos opcionais deixados em branco no painel não vão para o arquivo
    Object.keys(o).forEach(function (k) {
      if (o[k] === "" || o[k] === null || o[k] === undefined) delete o[k];
    });
    return o;
  }

  function toFile(dados) {
    var d = clonar(dados);
    var rotulo = d.rotulo || d.shortDate || d.id || "";
    delete d.rotulo;
    if (d.editorial) {
      if ("corpo" in d.editorial) {
        d.editorial.paragraphs = paraParagrafos(d.editorial.corpo);
        delete d.editorial.corpo;
      }
      semVazios(d.editorial);
    }
    (d.sections || []).forEach(function (s) {
      (s.stories || []).forEach(function (st) {
        if ("corpo" in st) {
          st.paragraphs = paraParagrafos(st.corpo);
          delete st.corpo;
        }
        semVazios(st);
      });
    });
    if (Array.isArray(d.themes)) {
      d.themes = d.themes.map(function (t) {
        return t && !Array.isArray(t) ? [t.rubrica || "", t.texto || ""] : t;
      });
    }
    (d.agenda || []).forEach(semVazios);
    if (d.spotlight) semVazios(d.spotlight);
    semVazios(d);
    // "id" e "formato" primeiro, como nos arquivos escritos à mão
    var ordenado = { id: d.id, formato: d.formato || "secoes" };
    Object.keys(d).forEach(function (k) { if (!(k in ordenado)) ordenado[k] = d[k]; });
    if (ordenado.oculta !== true) delete ordenado.oculta;

    return "/* Margens · " + String(ordenado.weekLabel || ordenado.id).replace(/\*\//g, "") + "\n" +
      "   Edição do noticiário. Pode ser editada pelo painel (/admin) ou à mão.\n" +
      "   O conteúdo entre os parênteses é JSON (aspas duplas, sem vírgula sobrando).\n" +
      "   rotulo = texto que aparece no seletor de edições. */\n" +
      INICIO + JSON.stringify({ rotulo: rotulo }).replace('":"', '": "') + ", " +
      JSON.stringify(ordenado, null, 2) + ");\n";
  }

  var api = { fromFile: fromFile, toFile: toFile, paraParagrafos: paraParagrafos, paraCorpo: paraCorpo };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.MargensFormato = api;
})(typeof window !== "undefined" ? window : this);

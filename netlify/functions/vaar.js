const SOURCES = {
  status: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026-1/ListaentesbeneficiariosenaobeneficiariosacomplementacaoVAARdoFundeb2026.csv',
  indicators: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026-1/indicadores-atendimento-aprendizagem-vaar-2026-iii.csv',
  distribution: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026-1/publicacoes-2026/3-publicacoes/6-redes-beneficiadas-coeficientes-de-distribuicao-e-complementacao-vaar-prevista-p11.csv',
  schedule: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026-1/publicacoes-2026/3-publicacoes/7-cronograma-de-distribuicao-da-complementacao-vaar-por-ente-federado-p11.csv'
};

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function compact(value) {
  return normalize(value).replace(/\s+/g, '');
}

function titleCase(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s'’-])([a-zà-ú])/g, (_, p, c) => p + c.toLocaleUpperCase('pt-BR'));
}

function parseCsv(text, delimiter = ';') {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n') {
      row.push(field.trim().replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field.trim().replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function parseCsvFlexible(text) {
  // Arquivos do FNDE normalmente usam ponto e vírgula, mas algumas exportações
  // podem vir com tabulação ou vírgula. Escolhemos o delimitador que produz
  // a estrutura mais consistente nas primeiras linhas.
  const candidates = [';', '\t', ','];
  let best = null;
  for (const delimiter of candidates) {
    const rows = parseCsv(text, delimiter);
    const widths = rows.slice(0, 20).map(r => r.length).filter(n => n > 1);
    const score = widths.length ? Math.max(...widths) + widths.length : 0;
    if (!best || score > best.score) best = { rows, score, delimiter };
  }
  return best ? best.rows : parseCsv(text);
}

function findHeaderRow(rows, predicates) {
  return rows.findIndex(row => predicates.every(predicate => row.some(cell => predicate(compact(cell), normalize(cell)))));
}

function headerIndex(headers, predicates) {
  const normalized = headers.map(h => ({ compact: compact(h), normalized: normalize(h) }));
  for (const pred of predicates) {
    const index = normalized.findIndex(h => pred(h.compact, h.normalized));
    if (index >= 0) return index;
  }
  return -1;
}

function at(row, idx) {
  return idx >= 0 ? String(row[idx] ?? '').trim() : '';
}

function parseNumberBr(value) {
  if (value === null || value === undefined || value === '') return null;
  let s = String(value).trim().replace(/R\$|\s/g, '');
  if (!s) return null;
  // Brazilian-formatted numbers use dot for thousands and comma for decimals.
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Os objetos CSV do portal FNDE/Plone possuem uma página de apresentação em
 * /arquivo.csv. Os bytes do CSV são servidos por /@@download/file. Consultar
 * apenas a página de apresentação devolve HTML e impede a leitura da base.
 */
async function fetchText(url) {
  const attempts = [
    `${url}/@@download/file`,
    `${url}/@@display-file/file`,
    url
  ];
  const errors = [];
  for (const endpoint of attempts) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'text/csv,text/plain,application/octet-stream;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(16000)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 40) throw new Error('Arquivo vazio ou incompleto');
      let value;
      try {
        value = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch (_) {
        value = new TextDecoder('windows-1252').decode(buffer);
      }
      value = value.replace(/^\uFEFF/, '');
      // Algumas URLs de arquivos do FNDE respondem HTTP 200, mas devolvem a
      // página HTML com o botão de download em vez dos registros do CSV.
      const head = value.slice(0, 1024).trimStart();
      if (/^(?:<!doctype\s+html|<html\b|<head\b)/i.test(head) ||
          /<title>.*<\/title>/is.test(head.slice(0, 700))) {
        throw new Error('O FNDE devolveu a página HTML, não o CSV');
      }
      if (!/[;,\t]/.test(value.slice(0, 5000))) {
        throw new Error('Arquivo sem estrutura de colunas CSV');
      }
      return value;
    } catch (e) {
      errors.push(`${new URL(endpoint).pathname.split('/').slice(-2).join('/')}: ${e.message}`);
    }
  }
  throw new Error(`Não foi possível ler o CSV oficial (${errors.join('; ')})`);
}

function parseStatusCsv(text) {
  const rows = parseCsvFlexible(text);
  const headerRow = findHeaderRow(rows, [
    c => c === 'uf',
    c => c.includes('codigoibge'),
    c => c.includes('condiii')
  ]);
  if (headerRow < 0) throw new Error('Cabeçalho da lista VAAR não localizado.');
  const headers = rows[headerRow];

  const idx = {
    uf: headerIndex(headers, [c => c === 'uf']),
    codigo: headerIndex(headers, [c => c.includes('codigoibge')]),
    municipio: headerIndex(headers, [c => c === 'entidade', c => c.includes('entefederado')]),
    cond1: headerIndex(headers, [c => c === 'condi', c => c.includes('condi')]),
    cond2: headerIndex(headers, [c => c === 'condii']),
    cond3: headerIndex(headers, [c => c === 'condiii']),
    cond4: headerIndex(headers, [c => c === 'condiv']),
    cond5: headerIndex(headers, [c => c === 'condv']),
    habilitado: headerIndex(headers, [c => c.startsWith('habilitado')]),
    evoluiuAtendimento: headerIndex(headers, [c => c.includes('evoluiuindicadordeatendimento')]),
    evoluiuAprendizagem: headerIndex(headers, [c => c.includes('evoluiuindicadordeaprendizagem')]),
    beneficiario: headerIndex(headers, [c => c.startsWith('beneficiario')]),
    pendencia: headerIndex(headers, [c => c.includes('pendenciaidentificada')])
  };

  return rows.slice(headerRow + 1).map(row => {
    const codigo = at(row, idx.codigo).replace(/\D/g, '');
    return {
      uf: at(row, idx.uf).toUpperCase(),
      codigo,
      municipio: titleCase(at(row, idx.municipio)),
      cond1: at(row, idx.cond1),
      cond2: at(row, idx.cond2),
      cond3: at(row, idx.cond3),
      cond4: at(row, idx.cond4),
      cond5: at(row, idx.cond5),
      habilitado: at(row, idx.habilitado),
      evoluiuAtendimento: at(row, idx.evoluiuAtendimento),
      evoluiuAprendizagem: at(row, idx.evoluiuAprendizagem),
      beneficiario: at(row, idx.beneficiario),
      pendencia: at(row, idx.pendencia)
    };
  }).filter(r => /^[0-9]{7}$/.test(r.codigo) && /^[A-Z]{2}$/.test(r.uf));
}

function parseIndicatorsCsv(text) {
  const rows = parseCsvFlexible(text);
  const headerRow = findHeaderRow(rows, [
    c => c === 'uf',
    c => c.includes('codigoibge'),
    c => c.includes('indicadoratendimento'),
    c => c.includes('indicadoraprendizagem')
  ]);
  if (headerRow < 0) throw new Error('Cabeçalho dos indicadores VAAR não localizado.');
  const headers = rows[headerRow];
  const idx = {
    codigo: headerIndex(headers, [c => c.includes('codigoibge')]),
    indicadorAtendimento: headerIndex(headers, [c => c === 'indicadoratendimento']),
    indicadorAprendizagem: headerIndex(headers, [c => c === 'indicadoraprendizagem'])
  };
  const map = new Map();
  rows.slice(headerRow + 1).forEach(row => {
    const codigo = at(row, idx.codigo).replace(/\D/g, '');
    if (!/^[0-9]{7}$/.test(codigo)) return;
    map.set(codigo, {
      indicadorAtendimento: parseNumberBr(at(row, idx.indicadorAtendimento)),
      indicadorAprendizagem: parseNumberBr(at(row, idx.indicadorAprendizagem))
    });
  });
  return map;
}

function parseDistributionCsv(text) {
  const rows = parseCsvFlexible(text);
  let headerRow = findHeaderRow(rows, [
    c => c.includes('codigoibge') || c.includes('codigomunicipio') || c === 'codigo',
    c => c.includes('coef') || c.includes('complementacao') || c.includes('vaar')
  ]);

  // Fallback: busca uma linha cuja junção contenha simultaneamente código e VAAR.
  if (headerRow < 0) {
    headerRow = rows.findIndex(row => {
      const joined = compact(row.join(' '));
      return joined.includes('codigo') && joined.includes('vaar');
    });
  }
  if (headerRow < 0) throw new Error('Cabeçalho da distribuição VAAR não localizado.');

  const headers = rows[headerRow];
  const idx = {
    uf: headerIndex(headers, [c => c === 'uf']),
    codigo: headerIndex(headers, [c => c.includes('codigoibge'), c => c.includes('codigomunicipio'), c => c === 'codigo', c => c.startsWith('cod') && c.includes('ibge')]),
    coeficiente: headerIndex(headers, [c => c.includes('coeficientededistr') && c.includes('vaar'), c => c.includes('coeficientededistr'), c => c.includes('coeficiente')]),
    valorVaar: headerIndex(headers, [
      c => c.includes('complementacao') && c.includes('vaar') && !c.includes('coeficiente'),
      c => c.includes('vaarprevista') && !c.includes('coeficiente'),
      c => c.includes('valor') && c.includes('vaar'),
      (c, n) => n.includes('complementacao da uniao vaar') && n.includes('r$')
    ])
  };

  // Nos anexos o valor total é a última coluna. Se o título vier quebrado por
  // exportação, isso evita perder o campo mesmo que o nome não seja reconhecido.
  if (idx.valorVaar < 0 && headers.length >= 4) idx.valorVaar = headers.length - 1;

  const map = new Map();
  rows.slice(headerRow + 1).forEach(row => {
    let codigo = at(row, idx.codigo).replace(/\D/g, '');
    if (!/^[0-9]{7}$/.test(codigo)) {
      const codeCell = row.find(cell => /^[0-9]{7}$/.test(String(cell).trim().replace(/\D/g, '')));
      codigo = String(codeCell || '').replace(/\D/g, '');
    }
    if (!/^[0-9]{7}$/.test(codigo)) return;
    const valorVaar = parseNumberBr(at(row, idx.valorVaar));
    const coeficiente = parseNumberBr(at(row, idx.coeficiente));
    if (valorVaar === null && coeficiente === null) return;
    map.set(codigo, { coeficiente, valorVaar, valorSource: 'anexo6' });
  });
  return map;
}

function parseScheduleCsv(text) {
  const rows = parseCsvFlexible(text);
  let headerRow = rows.findIndex(row => {
    const joined = compact(row.join(' '));
    return joined.includes('codigo') && (joined.includes('total') || joined.includes('janeiro') || joined.includes('jan'));
  });
  if (headerRow < 0) {
    headerRow = findHeaderRow(rows, [c => c.includes('codigoibge') || c.includes('codigo')]);
  }
  if (headerRow < 0) throw new Error('Cabeçalho do cronograma VAAR não localizado.');

  const headers = rows[headerRow];
  let codeIdx = headerIndex(headers, [c => c.includes('codigoibge'), c => c.includes('codigomunicipio'), c => c === 'codigo']);
  let totalIdx = headerIndex(headers, [c => c === 'total', c => c.includes('total') && (c.includes('vaar') || c.includes('ano')), c => c.includes('total')]);
  if (totalIdx < 0) totalIdx = headers.length - 1;

  const map = new Map();
  rows.slice(headerRow + 1).forEach(row => {
    let codigo = at(row, codeIdx).replace(/\D/g, '');
    if (!/^[0-9]{7}$/.test(codigo)) {
      const found = row.find(cell => /^[0-9]{7}$/.test(String(cell).trim().replace(/\D/g, '')));
      codigo = String(found || '').replace(/\D/g, '');
    }
    if (!/^[0-9]{7}$/.test(codigo)) return;

    let valor = parseNumberBr(at(row, totalIdx));
    if (valor === null) {
      // Último campo numérico da linha é o total anual nos cronogramas do FNDE.
      for (let i = row.length - 1; i >= 0; i--) {
        const candidate = parseNumberBr(row[i]);
        if (candidate !== null) { valor = candidate; break; }
      }
    }
    if (valor !== null) map.set(codigo, { valorVaar: valor, valorSource: 'cronograma' });
  });
  return map;
}

exports.handler = async function handler() {
  try {
    const settled = await Promise.allSettled([
      fetchText(SOURCES.status),
      fetchText(SOURCES.indicators),
      fetchText(SOURCES.distribution),
      fetchText(SOURCES.schedule)
    ]);

    if (settled[0].status !== 'fulfilled') throw settled[0].reason;
    const records = parseStatusCsv(settled[0].value);
    // O levantamento do FNDE cobre todos os municípios do país. Não aceitar
    // resposta 200 com lista vazia ou truncada (situação que mascararia erro).
    if (records.length < 5000) {
      throw new Error(`Lista nacional incompleta: apenas ${records.length} municípios`);
    }
    let indicators = new Map();
    let distribution = new Map();
    let schedule = new Map();
    let indicatorsOk = false;
    let distributionOk = false;
    let scheduleOk = false;
    if (settled[1].status === 'fulfilled') {
      try { indicators = parseIndicatorsCsv(settled[1].value); indicatorsOk = indicators.size >= 5000; }
      catch (e) { console.warn('VAAR indicadores:', e.message); }
    }
    if (settled[2].status === 'fulfilled') {
      try { distribution = parseDistributionCsv(settled[2].value); distributionOk = distribution.size >= 100; }
      catch (e) { console.warn('VAAR distribuição:', e.message); }
    }
    if (settled[3].status === 'fulfilled') {
      try { schedule = parseScheduleCsv(settled[3].value); scheduleOk = schedule.size >= 100; }
      catch (e) { console.warn('VAAR cronograma:', e.message); }
    }

    const merged = records.map(record => {
      const dist = distribution.get(record.codigo) || {};
      const sched = schedule.get(record.codigo) || {};
      const value = dist.valorVaar ?? sched.valorVaar ?? null;
      return {
        ...record,
        ...(indicators.get(record.codigo) || { indicadorAtendimento: null, indicadorAprendizagem: null }),
        coeficiente: dist.coeficiente ?? null,
        valorVaar: value,
        valorSource: dist.valorVaar != null ? 'anexo6' : (sched.valorVaar != null ? 'cronograma' : null)
      };
    });

    const sourceStatus = {
      condicionalidades: 'ok',
      indicadores: indicatorsOk ? 'ok' : 'indisponivel',
      distribuicao: distributionOk ? 'ok' : 'indisponivel',
      cronograma: scheduleOk ? 'ok' : 'indisponivel',
      valores: merged.filter(r => r.valorVaar !== null).length >= 100 ? 'ok' : 'indisponivel'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=1800',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        exercise: 2026,
        publication: '3ª publicação — Portaria MEC/MF nº 11, de 28/08/2026',
        generatedAt: new Date().toISOString(),
        count: merged.length,
        sourceStatus,
        sourceCounts: {
          indicadores: indicators.size,
          distribuicao: distribution.size,
          cronograma: schedule.size,
          valores: merged.filter(r => r.valorVaar !== null).length
        },
        records: merged
      })
    };
  } catch (error) {
    console.error('VAAR API:', error);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'Não foi possível obter a base oficial do VAAR no FNDE neste momento.', code: 'FNDE_CSV_UNAVAILABLE' })
    };
  }
};

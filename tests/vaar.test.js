// Testes sem rede externa: node tests/vaar.test.js
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/vaar.js');
const originalFetch = global.fetch;
const numRows = 5011;
const getCode = i => i === 0 ? '2918407' : i === 1 ? '2611101' : String(3000000 + i);
const getName = i => i === 0 ? 'JUAZEIRO' : i === 1 ? 'PETROLINA' : i === 2 ? 'CURAÇÁ' : `MUNICIPIO ${i}`;

function sources() {
  const status = [
    'UF;Código IBGE;Entidade;Cond. I;Cond. II;Cond. III;Cond. IV;Cond. V;Habilitados?;Evoluiu Indicador de Atendimento?;Evoluiu Indicador de Aprendizagem?;Beneficiário?;Pendência Identificada'
  ];
  const indicators = ['UF;Ente Federado;Código IBGE;Evoluiu Atendimento;Indicador Atendimento;Evoluiu Aprendizagem;Indicador Aprendizagem'];
  const distribution = ['UF;Ente Federado;Código IBGE;Coeficientes de distribuição da complementação da União-VAAR;Complementação da União-VAAR (R$)'];
  const schedule = ['UF;Código IBGE;Janeiro;Fevereiro;Total'];
  for (let i=0; i<numRows; i++) {
    const code = getCode(i), name = getName(i), uf = i===1?'PE':'BA';
    const ben = i < 1500;
    status.push([uf, code, name, 'Sim','Sim',i===2?'Não':'Sim','Sim','Sim',i===2?'Não Habilitado':'Habilitado','Sim','Sim',ben?'Beneficiário':'Não Beneficiário',i===2?'Condicionalidade III não atendida':''].join(';'));
    indicators.push([uf,name,code,'Sim','0,985491','Sim','1,23812'].join(';'));
    if(ben) {
      distribution.push([uf,name,code,'0,000123456789','1.003.564,13'].join(';'));
      schedule.push([uf,code,'35.000,00','35.000,00','1.003.564,13'].join(';'));
    }
  }
  return { status: status.join('\r\n'), indicators:indicators.join('\n'), distribution:distribution.join('\n'), schedule:schedule.join('\n') };
}
const csv=sources();
function detect(url) {
  if(url.includes('Listaentes')) return 'status';
  if(url.includes('indicadores-atendimento')) return 'indicators';
  if(url.includes('6-redes-beneficiadas')) return 'distribution';
  if(url.includes('7-cronograma')) return 'schedule';
  throw new Error('URL inesperada: '+url);
}
function response(body, status=200, headers={}) { return new Response(body,{status,headers}); }

async function testNormal() {
  const requested=[];
  global.fetch=async url => {
    requested.push(url);
    assert.ok(url.includes('/@@download/file'), 'Deve buscar os bytes, não a página do CSV');
    return response(csv[detect(url)],200,{'content-type':'text/csv'});
  };
  const result=await handler();
  assert.equal(result.statusCode,200);
  const body=JSON.parse(result.body);
  assert.equal(body.count,numRows);
  assert.equal(body.sourceStatus.condicionalidades,'ok');
  assert.equal(body.sourceStatus.indicadores,'ok');
  assert.equal(body.sourceStatus.valores,'ok');
  assert.equal(body.sourceCounts.valores,1500);
  const juazeiro=body.records.find(r=>r.codigo==='2918407');
  assert.equal(juazeiro.municipio,'Juazeiro');
  assert.equal(juazeiro.indicadorAtendimento,0.985491);
  assert.equal(juazeiro.valorVaar,1003564.13);
  assert.equal(juazeiro.coeficiente,0.000123456789);
  assert.equal(requested.length,4);
}
async function testHtmlFallback() {
  let pages=0;
  global.fetch=async url => {
    if(url.includes('/@@download/file')) { pages++; return response('<!DOCTYPE html><html><head><title>FNDE</title></head><body>CSV para baixar</body></html>'); }
    if(url.includes('/@@display-file/file')) return response(csv[detect(url)]);
    throw new Error('Sem página alterna');
  };
  const result=await handler();
  assert.equal(result.statusCode,200);
  assert.equal(pages,4);
}
async function testInvalidHtmlNever200() {
  global.fetch=async () => response('<html><head><title>Portal FNDE</title></head><body>Descrição CSV</body></html>');
  const result=await handler();
  assert.equal(result.statusCode,502);
  assert.equal(JSON.parse(result.body).code,'FNDE_CSV_UNAVAILABLE');
}
async function testPartialValues() {
  global.fetch=async url => {
    const name=detect(url);
    if(name==='distribution'||name==='schedule') return response('Indisponível',503);
    return response(csv[name]);
  };
  const result=await handler();
  const body=JSON.parse(result.body);
  assert.equal(result.statusCode,200);
  assert.equal(body.sourceStatus.valores,'indisponivel');
  assert.equal(body.records[0].valorVaar,null);
  assert.equal(body.sourceCounts.valores,0);
}
async function testBadUtf8EncodedAsWindows1252() {
  global.fetch=async url => {
    const data = csv[detect(url)];
    return response(Buffer.from(data, 'latin1'),200,{'content-type':'application/octet-stream'});
  };
  const result=await handler();
  assert.equal(result.statusCode,200);
  assert.equal(JSON.parse(result.body).records[2].municipio,'Curaçá');
}
(async () => {
 try {
  await testNormal();
  await testHtmlFallback();
  await testInvalidHtmlNever200();
  await testPartialValues();
  await testBadUtf8EncodedAsWindows1252();
  process.stdout.write('OK: 5 testes de VAAR 2026 (CSV completo, fallback HTML, erro 502, dados parciais e codificação).\n');
 } finally { global.fetch=originalFetch; }
})().catch(error=>{console.error(error); process.exitCode=1;});

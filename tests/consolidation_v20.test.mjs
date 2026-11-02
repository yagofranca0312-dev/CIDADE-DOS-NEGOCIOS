import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const load=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const old=load('tests/fixtures/core_v1_9_0.js');
const now=load('src/core/game.js');
const norm=x=>JSON.parse(JSON.stringify(x));
function command(C,state,type,payload,seq){const r=C.dispatch(state,{type,id:`v20-golden:${seq}`,payload});assert.equal(r.ok,true,`${type}: ${r.error}`);return r.state}
function career(C,{extra=false,tax=false}={}){
 const city=C.CITIES.find(x=>x.name==='Tianguá').id,sobral=C.CITIES.find(x=>x.name==='Sobral').id;
 let s=command(C,null,'CARREIRA.CRIAR',{name:'Empresa de Teste',companyName:'Rede de Ouro',cityId:city,seed:290711},1);
 s=command(C,s,'EMPRESA.ABRIR',{sector:'roupas',cityId:city,lot:1},2);
 s=command(C,s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:100},3);
 s=command(C,s,'TEMPO.AVANCAR_LOTE',{days:9},4);
 if(extra){s=command(C,s,'EMPRESA.ABRIR',{sector:'mercado',cityId:sobral,lot:3},5);s=command(C,s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'atacado',quantity:45},6);s=command(C,s,'TEMPO.AVANCAR_LOTE',{days:20},7);}
 if(tax){s=command(C,s,'FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true},8);s=command(C,s,'TEMPO.AVANCAR_LOTE',{days:30},9);}
 return s;
}
test('V2.0 motor mantém código e regras V1.9 idênticos, exceto versão exibida',()=>{
 const normCore=text=>text.replace('/* Cidade dos Negócios 1 — núcleo puro, sem DOM e sem rede. v2.1.0-rc.1 */','/* Cidade dos Negócios 1 — núcleo puro, sem DOM e sem rede. v1.9.0-rc.1 */').replace("const VERSION = '2.1.0-rc.1';","const VERSION = '1.9.0-rc.1';");
 assert.equal(normCore(readFileSync('src/core/game.js','utf8')),readFileSync('tests/fixtures/core_v1_9_0.js','utf8'));
 assert.equal(now.SCHEMA_VERSION,9);assert.equal(now.VERSION,'2.1.0-rc.1');
});
test('V2.0 e V1.9 produzem mesma rede, estoque, balanço, caixa e RNG',()=>{
 for(const opts of [{},{extra:true},{tax:true}]){
  const a=career(old,opts),b=career(now,opts);
  for(const key of ['world','player','rng','calendar','economy','fiscal','audit'])assert.deepEqual(norm(a[key]),norm(b[key]),`${key}, ${JSON.stringify(opts)}`);
  for(const fn of ['overview','groupReport','balanceSheet','reconciliationReport','incomeStatement','cashFlowStatement','taxReport'])assert.deepEqual(norm(old[fn](a)),norm(now[fn](b)),fn);
 }
});
test('V2.0 importa save genuíno da V1.9 sem migração, retrabalho nem correção retroativa',()=>{
 const a=career(old,{extra:true});const payload=old.exportSave(a);const x=now.importSave(payload);
 assert.equal(x.migrated,false);assert.deepEqual(norm(x.state),norm(a));
 assert.equal(now.exportSave(x.state),payload);
});
test('V2.0 navegação tem quatro áreas e comandos fiscais/backup ficam acessíveis',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8');
 const nav=template.match(/<nav class="nav-items nav-primary"[\s\S]*?<\/nav>/)?.[0];assert.ok(nav);
 assert.deepEqual([...nav.matchAll(/data-tab="([^"]+)"/g)].map(x=>x[1]),['cidade','empresa','mercado','financas']);
 assert.match(template,/data-tab="fiscal"/);assert.match(template,/data-tab="sistema"/);
 assert.match(template,/id="map-lot-status"/);assert.match(template,/class="world-drawer"/);
 assert.match(template,/id="map-canvas"/);assert.match(template,/id="fiscal-activate"/);
 assert.match(template,/id="export-btn"/);
});
test('V2.0 apresenta camada visual separada do domínio e um HTML offline independente',()=>{
 const v=readFileSync('src/visual/city-scene.js','utf8');const app=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));const html=readFileSync('index.html','utf8');
 assert.match(v,/const CidadeVisual/);assert.match(v,/function svgMap\(/);assert.doesNotMatch(v,/\.dispatch\(|\bMath\.random\(/);
 assert.match(app,/CidadeVisual\.svgMap\(/);assert.match(html,/const CidadeVisual/);
 assert.match(html,/--v2-void/);assert.equal((html.match(/<script\b/g)||[]).length,1);
 assert.doesNotMatch(html,/\b(?:fetch|XMLHttpRequest|eval)\s*\(/);
});

test('V2.0 organização de mercado/finanças e mapa em módulos de apresentação',()=>{
 const shell=readFileSync('src/ui/app.js','utf8');
 const market=readFileSync('src/ui/market-views.part.js','utf8');
 const finance=readFileSync('src/ui/finance-views.part.js','utf8');
 assert.match(shell,/\/\* CDN_MARKET_VIEWS \*\//);
 assert.match(shell,/\/\* CDN_FINANCE_VIEWS \*\//);
 assert.match(market,/function renderCommerce\(/);
 assert.match(finance,/function renderFinances\(/);
 assert.match(finance,/function renderFiscal\(/);
 const html=readFileSync('index.html','utf8');
 for(const tag of ['/* CDN_MARKET_VIEWS */','/* CDN_FINANCE_VIEWS */'])assert.ok(!html.includes(tag));
});

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
test('V2.4-A preserva schema 9 e mantém motor fiscal/contábil verificável',()=>{
 assert.equal(now.SCHEMA_VERSION,10);assert.equal(now.VERSION,'3.3.2');
 assert.ok(now.PARALEGAL_SERVICES.cadastro);
 assert.equal(typeof now.balanceSheet,'function');assert.equal(typeof now.taxReport,'function');
});
test('V2.0 e V1.9 preservam operação física, RNG e receitas, com fiscal V3.2 isolado',()=>{
 for(const opts of [{},{extra:true},{tax:true}]){
  const a=career(old,opts),b=career(now,opts);
  for(const key of ['world','player','rng','calendar'])assert.deepEqual(norm(a[key]),norm(b[key]),key);
  for(const key of ['cash','inventoryValue','inTransit','revenue','cogs','stock'])
   assert.equal(now.overview(b)[key],old.overview(a)[key],key);
  assert.equal(now.balanceSheet(b).balanced,true);
  assert.equal(now.reconciliationReport(b).ok,true);
  assert.equal(now.overview(b).taxPayable,b.fiscal.assessments.reduce((n,a)=>n+a.amount-a.paid,0));
 }
});
test('V2.0: save genuíno V1.9 migra para fiscal ativo sem reescrever razão histórico',()=>{
 const a=career(old,{extra:true}),snapshot=JSON.stringify(a.economy.ledger);
 const restored=now.importSave(old.exportSave(a));
 assert.equal(restored.migrated,true);
 assert.equal(restored.state.schemaVersion,10);
 assert.equal(restored.state.fiscal.mode,'ATIVO');
 assert.equal(JSON.stringify(restored.state.economy.ledger),snapshot);
 assert.equal(restored.state.calendar.date,a.calendar.date);
 assert.equal(restored.state.rng.seed,a.rng.seed);
});
test('V2.0 navegação tem quatro áreas e comandos fiscais/backup ficam acessíveis',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8');
 const nav=template.match(/<nav class="v31-dock"[\s\S]*?<\/nav>/)?.[0];assert.ok(nav);
 assert.deepEqual([...nav.matchAll(/data-v31-open="([^"]+)"/g)].map(x=>x[1]),
  ['empresa:dashboard','mercado:compras','administrativo:rh-dp','administrativo:contabilidade','sistema']);
 assert.match(template,/data-view="cidade"/);
 assert.match(template,/data-section-pane="administrativo:fiscal"/);
 assert.doesNotMatch(template,/<aside class="sidebar"/);
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

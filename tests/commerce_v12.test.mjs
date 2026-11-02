import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync('src/core/game.js','utf8');
const Core=runInNewContext(source+'\nCidadeCore',{});
const old=runInNewContext(readFileSync('tests/fixtures/core_v1_0_1.js','utf8')+'\nCidadeCore',{});
const city=Core.CITIES.find(x=>x.name==='Tianguá').id;
let seq=0;
const act=(s,type,payload={})=>{const r=Core.dispatch(s,{type,id:`qa-v12:${++seq}`,payload});assert.equal(r.ok,true,r.error);return r.state};
const created=()=>act(null,'CARREIRA.CRIAR',{name:'QA',companyName:'Mercado QA',cityId:city,seed:548});
const opened=()=>act(created(),'EMPRESA.ABRIR',{sector:'mercado',lot:3});
test('V1.2: cadastro abre com três SKUs distintos e contabilidade zerada',()=>{
 const s=opened(),b=s.world.business;assert.equal(s.schemaVersion,3);assert.equal(b.products.length,3);
 assert.equal(b.stockUnits,0);assert.equal(Core.overview(s).inventoryValue,0);
 assert.equal(new Set(b.products.map(p=>p.id)).size,3);Core.validate(s);
});
test('V1.2: compra por fornecedor e por produto aumenta estoque e ativo, não CMV',()=>{
 const s=opened(),cash=Core.overview(s).cash;
 const t=act(s,'COMPRAS.REGISTRAR',{supplierId:'atacado',items:[{productId:'base',quantity:10},{productId:'extra-1',quantity:3}]});
 const b=t.world.business,expectedCost=10*3200+3*2200;
 assert.equal(b.stockUnits,13);assert.equal(Core.overview(t).inventoryValue,expectedCost);
 assert.equal(Core.overview(t).cash,cash-expectedCost);assert.equal(Core.overview(t).cogs,0);
 assert.equal(b.purchaseOrders[0].supplierId,'atacado');Core.validate(t);
});
test('V1.2.1: a simulação diária reconhece receita, CMV e caixa por SKU atomicamente',()=>{
 let s=opened();s=act(s,'COMPRAS.REGISTRAR',{supplierId:'regional',items:[{productId:'base',quantity:10},{productId:'extra-1',quantity:5}]});
 const before=Core.overview(s);s=act(s,'TEMPO.AVANCAR_DIA');
 const info=Core.overview(s),sales=s.world.business.sales;
 assert.equal(sales.length,1);assert.equal(sales[0].kind,'SIMULACAO_DIARIA');
 assert.equal(sales[0].items.length,2);
 const revenue=sales[0].items.reduce((n,x)=>n+x.revenue,0),cogs=sales[0].items.reduce((n,x)=>n+x.cogs,0);
 assert.equal(info.cash,before.cash+revenue-Core.SECTORS.mercado.dailyCost);
 assert.equal(info.inventoryValue,before.inventoryValue-cogs);
 assert.equal(info.revenue,revenue);assert.equal(info.cogs,cogs);
 assert.equal(Core.productPerformance(s).reduce((n,x)=>n+x.cogs,0),cogs);Core.validate(s);
});
test('V1.2: venda rejeitada não remove saldo, não gera evento nem avança RNG',()=>{
 let s=opened();s=act(s,'ESTOQUE.COMPRAR',{productId:'extra-2',supplierId:'regional',quantity:2});const baseline=JSON.stringify(s);
 for(const items of [[{productId:'extra-2',quantity:3}],[{productId:'extra-2',quantity:1},{productId:'extra-2',quantity:1}],[{productId:'unknown',quantity:1}]]){
  const r=Core.dispatch(s,{type:'VENDA.REGISTRAR',id:`failed-${++seq}`,payload:{items}});
  assert.equal(r.ok,false);assert.equal(JSON.stringify(s),baseline);
 }
});
test('V1.2: fornecedores e saldo insuficiente são rejeitados sem afetar o estado',()=>{
 const s=opened(),baseline=JSON.stringify(s);
 for(const payload of [{supplierId:'fraude',items:[{productId:'base',quantity:1}]},{supplierId:'regional',items:[{productId:'base',quantity:1500}]}]){
  const r=Core.dispatch(s,{type:'COMPRAS.REGISTRAR',id:`rejected-${++seq}`,payload});assert.equal(r.ok,false);
  assert.equal(JSON.stringify(s),baseline);
 }
});
test('V1.2: novo produto tem preço, custo e histórico; não inventa compras',()=>{
 let s=opened();s=act(s,'PRODUTO.CADASTRAR',{name:'Açúcar 1 kg',costCents:425,priceCents:680});
 const p=s.world.business.products.at(-1);assert.equal(p.stockUnits,0);assert.equal(p.name,'Açúcar 1 kg');
 s=act(s,'PRECO.DEFINIR',{productId:p.id,cents:790});assert.equal(s.world.business.products.at(-1).priceCents,790);
 assert.equal(Core.priceHistory(s).at(-1).productName,'Açúcar 1 kg');
 s=act(s,'ESTOQUE.COMPRAR',{productId:p.id,quantity:10,supplierId:'regional'});
 s=act(s,'TEMPO.AVANCAR_DIA');
 const sold=Core.productPerformance(s).at(-1).sold;assert.ok(sold>0);
 assert.equal(Core.productPerformance(s).at(-1).cogs,sold*425);Core.validate(s);
});
test('V1.2: save legado v2 migra sem inventar venda e preserva caixa, CMV, RNG e comandos',()=>{
 const c=(s,type,payload,id)=>{const r=old.dispatch(s,{type,id,payload});assert.equal(r.ok,true,r.error);return r.state};
 let legacy=c(null,'CARREIRA.CRIAR',{name:'Anterior',companyName:'Venda antiga',cityId:city,seed:888},'old:create');
 legacy=c(legacy,'EMPRESA.ABRIR',{sector:'mercado',lot:2},'old:open');
 legacy=c(legacy,'ESTOQUE.COMPRAR',{quantity:120},'old:buy');
 legacy=c(legacy,'TEMPO.AVANCAR_LOTE',{days:9},'old:days');
 const imported=Core.importSave(old.exportSave(legacy));
 assert.equal(imported.migrated,true);assert.equal(imported.state.schemaVersion,3);
 assert.equal(imported.state.world.business.stockUnits,legacy.world.business.stockUnits);
 assert.equal(imported.state.world.business.totalSold,legacy.world.business.totalSold);
 assert.equal(imported.state.rng.seed,legacy.rng.seed);
 assert.equal(imported.state.revision,legacy.revision);
 assert.equal(JSON.stringify(imported.state.economy.ledger),JSON.stringify(legacy.economy.ledger));
 assert.equal(Core.productPerformance(imported.state)[0].sold,0); // histórico antigo permanece agregado
 const stocked=act(imported.state,'ESTOQUE.COMPRAR',{productId:'base',quantity:2});
 const s=act(stocked,'TEMPO.AVANCAR_DIA');
 assert.ok(s.world.business.totalSold>legacy.world.business.totalSold);
 const repacked=Core.importSave(Core.exportSave(s));assert.equal(repacked.migrated,false);
 assert.equal(JSON.stringify(repacked.state),JSON.stringify(s));Core.validate(s);
});
test('V1.2: regras diárias conciliam três produtos, estoque e resultado, e são determinísticas',()=>{
 const prep=()=>{let s=opened();return act(s,'COMPRAS.REGISTRAR',{supplierId:'regional',items:[{productId:'base',quantity:500},{productId:'extra-1',quantity:150},{productId:'extra-2',quantity:150}]});};
 const a=act(prep(),'TEMPO.AVANCAR_LOTE',{days:30}),b=act(prep(),'TEMPO.AVANCAR_LOTE',{days:30});
 assert.equal(a.rng.seed,b.rng.seed);assert.equal(a.world.business.stockUnits,b.world.business.stockUnits);assert.equal(JSON.stringify(a.world.business.sales),JSON.stringify(b.world.business.sales));
 assert.equal(a.calendar.tick,30);assert.ok(a.world.business.sales.length>1);
 assert.equal(Core.productPerformance(a).reduce((n,x)=>n+x.cogs,0),Core.overview(a).cogs);
 assert.equal(Core.productPerformance(a).reduce((n,x)=>n+x.stockValue,0),Core.overview(a).inventoryValue);
 Core.validate(a);
});
test('V1.2.1: o relatório financeiro mantém filtros e concilia as vendas diárias',()=>{
 let s=opened();s=act(s,'ESTOQUE.COMPRAR',{productId:'base',quantity:10});s=act(s,'TEMPO.AVANCAR_DIA');
 const sold=s.world.business.sales[0].items[0].quantity;
 const report=Core.financialReport(s,'day','2026-11-01');
 assert.equal(report.revenue,sold*4900);assert.equal(report.cogs,sold*3200);
 assert.equal(report.grossProfit,sold*(4900-3200));assert.equal(report.closingInventory,(10-sold)*3200);
 assert.equal(s.fiscal.coverageStatus,'NOT_COVERED');
});


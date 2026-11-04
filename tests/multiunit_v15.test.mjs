import {readFileSync,copyFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const engine=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const C=engine('src/core/game.js'),Old=engine('tests/fixtures/core_v1_4_0.js');
const T=C.CITIES.find(c=>c.name==='Tianguá').id,S=C.CITIES.find(c=>c.name==='Sobral').id;
let serial=0;
function cmd(e,state,type,payload={}){
  const x=e.dispatch(state,{id:`m15:${++serial}`,type,payload});
  assert.equal(x.ok,true,`${type}: ${x.error}`);return x.state;
}
function decline(state,type,payload={}){
  const snapshot=JSON.stringify(state),r=C.dispatch(state,{id:`m15:${++serial}`,type,payload});
  assert.equal(r.ok,false,`Comando deveria ter sido rejeitado: ${type}`);
  assert.equal(JSON.stringify(state),snapshot,'Rejeição não deve mutar carreira');return r.error;
}
function fresh(e=C,sector='mercado'){
  let s=cmd(e,null,'CARREIRA.CRIAR',{name:'Yago',companyName:'Rede Ibiapaba',cityId:T,seed:12345});
  return cmd(e,s,'EMPRESA.ABRIR',{sector,lot:1});
}
function openSecond(s,{sector='padaria',cityId=S,lot=1}={}){
  return cmd(C,s,'EMPRESA.ABRIR',{sector,cityId,lot});
}
test('V1.5: nova carreira com matriz, identidade estável e caixa central sem aporte nas filiais',()=>{
  let s=fresh();assert.equal(C.VERSION,'2.4.0-alpha.3');assert.equal(s.schemaVersion,9);
  assert.equal(C.activeBusiness(s).id,'est-1');assert.equal(s.world.business.cityId,T);
  const cash=C.overview(s).cash;
  s=openSecond(s);assert.equal(C.activeBusiness(s).id,'est-2');
  assert.equal(C.businesses(s).length,2);assert.equal(C.overview(s).cash,cash-C.SECTORS.padaria.openCost);
  assert.equal(s.economy.ledger.filter(j=>j.memo==='Capital inicial do empreendedor').length,1);
  assert.equal(C.groupReport(s).group.cash,C.overview(s).cash);C.validate(s);
});
test('V1.5: abertura em outras cidades/lotes, não duplica imóveis e limita cinco estabelecimentos',()=>{
  let s=fresh();decline(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:T,lot:1});
  decline(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'XX-INVALIDO',lot:2});
  s=openSecond(s,{sector:'mercado',cityId:T,lot:2});s=openSecond(s,{sector:'mercado',cityId:S,lot:2});
  assert.equal(C.businesses(s).length,3);
  // Capital adicional fictício apenas na fixture de teste para exercitar limite estrutural.
  s.economy.ledger.push({id:`jnl-${++s.economy.journalSeq}`,date:s.calendar.date,memo:'Aporte de teste',entries:[{account:'CASH',debit:5000000,credit:0},{account:'CAPITAL',debit:0,credit:5000000}]});
  C.validate(s);
  s=openSecond(s,{sector:'padaria',cityId:S,lot:3});s=openSecond(s,{sector:'roupas',cityId:S,lot:4});
  assert.equal(C.businesses(s).length,5);
  assert.match(decline(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:S,lot:5}),/cinco estabelecimentos/);
});
test('V1.5: alternância da unidade ativa é determinística, sem mudar estoques, caixa, calendário ou RNG',()=>{
  let s=openSecond(fresh());const initial=JSON.stringify(C.groupReport(s)),seed=s.rng.seed,date=s.calendar.date;
  s=cmd(C,s,'EMPRESA.ATIVAR',{businessId:'est-1'});
  assert.equal(C.activeBusiness(s).id,'est-1');assert.equal(JSON.stringify(C.groupReport(s)),initial);
  assert.equal(s.rng.seed,seed);assert.equal(s.calendar.date,date);
  decline(s,'EMPRESA.ATIVAR',{businessId:'est-404'});
  s=cmd(C,s,'EMPRESA.ATIVAR',{businessId:'est-2'});assert.equal(C.activeBusiness(s).sector,'padaria');
});
test('V1.5: pedidos, recebimentos e estoques segregados com caixa do grupo',()=>{
  let s=openSecond(fresh());s=cmd(C,s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:80});
  assert.equal(C.businessById(s,'est-2').purchaseOrders[0].status,'PENDING');
  assert.equal(C.businessById(s,'est-1').purchaseOrders.length,0);
  s=cmd(C,s,'EMPRESA.ATIVAR',{businessId:'est-1'});
  s=cmd(C,s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'atacado',quantity:50});
  const before=C.overview(s),one=C.businessById(s,'est-1').purchaseOrders[0];
  assert.equal(one.status,'PENDING');
  s=cmd(C,s,'TEMPO.AVANCAR_DIA');
  assert.equal(C.businessById(s,'est-2').purchaseOrders[0].status,'RECEIVED');
  assert.equal(C.businessById(s,'est-2').stockUnits,80);assert.equal(C.businessById(s,'est-1').stockUnits,0);
  assert.equal(C.overview(s).inTransit,one.total);
  assert.equal(C.overview(s).inventoryValue,C.businessById(s,'est-2').products[0].stockValueCents);
  s=cmd(C,s,'TEMPO.AVANCAR_LOTE',{days:2});
  assert.equal(C.businessById(s,'est-1').purchaseOrders[0].status,'RECEIVED');
  assert.equal(C.overview(s).inTransit,0);C.validate(s);
});
test('V1.5: dois mercados na mesma cidade dividem mercado endereçável e RNG é reprodutível',()=>{
  let s=fresh();s=openSecond(s,{sector:'mercado',cityId:T,lot:2});
  const raw=C.exportSave(s);
  const adv=state=>cmd(C,state,'TEMPO.AVANCAR_DIA');
  const a=adv(s),b=adv(C.importSave(raw).state);
  assert.equal(a.rng.seed,b.rng.seed);
  assert.equal(JSON.stringify(a.audit.events),JSON.stringify(b.audit.events));
  const estimates=a.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA');
  assert.equal(estimates.length,2);
  for(const d of estimates)assert.equal(d.data.marketShare,0.5);
  const total=estimates.reduce((n,e)=>n+e.data.estimated,0);
  // Ambos recebem 1/2 da procura base, não 100% cada; variabilidade residual é RNG.
  assert.ok(total>0&&total<80);
});
test('V1.5: duas unidades em cidades diferentes mantêm a demanda individual completa',()=>{
  let s=openSecond(fresh(),{sector:'mercado',cityId:S,lot:1});
  s=cmd(C,s,'TEMPO.AVANCAR_DIA');
  const es=s.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA');
  assert.equal(es.length,2);
  assert.ok(es.every(e=>e.data.marketShare===1));
});
test('V1.5: unidades suportam promoções, preços e cadastro sem cruzamento de SKUs',()=>{
  let s=openSecond(fresh());s=cmd(C,s,'PRODUTO.CADASTRAR',{name:'Empada grande',costCents:450,priceCents:900});
  s=cmd(C,s,'PROMO.DEFINIR',{productId:'base',percent:10,days:7});
  assert.equal(C.businessById(s,'est-2').products.length,4);
  assert.equal(C.businessById(s,'est-1').products.length,3);
  assert.equal(C.businessById(s,'est-1').promotions.base,undefined);
  s=cmd(C,s,'EMPRESA.ATIVAR',{businessId:'est-1'});
  assert.equal(C.productPerformance(s).length,3);assert.equal(C.priceHistory(s).length,0);
});
test('V1.5: demonstrativo por loja soma fluxos no consolidado; caixa não é repartido',()=>{
  let s=openSecond(fresh());s=cmd(C,s,'TEMPO.AVANCAR_LOTE',{days:5});
  const ref='2026-11-05',total=C.financialReport(s,'all',ref),a=C.financialReport(s,'all',ref,null,'est-1'),b=C.financialReport(s,'all',ref,null,'est-2');
  assert.equal(a.revenue+b.revenue,total.revenue);
  assert.equal(a.cogs+b.cogs,total.cogs);
  assert.equal(a.expenses+b.expenses,total.expenses);
  assert.equal(a.profit+b.profit,total.profit);
  assert.equal(a.closingCash,null);assert.equal(b.closingCash,null);
  assert.equal(total.closingCash,C.overview(s).cash);
  assert.equal(a.entries.every(x=>!x.businessId||x.businessId==='est-1'),true);
  assert.equal(b.entries.every(x=>x.businessId==='est-2'),true);
  assert.equal(C.groupReport(s).units.reduce((n,x)=>n+x.profit,0),C.overview(s).profit);
  decline(s,'EMPRESA.ATIVAR',{businessId:'est-999'});
  assert.throws(()=>C.financialReport(s,'all',ref,null,'est-999'),/Filtro de estabelecimento inválido/);
});
test('V1.5: save v1.4 em schema5 importa com estoque, ledger e vendas originais idênticos',()=>{
  let old=fresh(Old);old=cmd(Old,old,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:100});
  old=cmd(Old,old,'TEMPO.AVANCAR_LOTE',{days:3});
  old=cmd(Old,old,'PROMO.DEFINIR',{productId:'base',percent:5,days:5});
  const saved=Old.exportSave(old),loaded=C.importSave(saved),s=loaded.state;
  assert.equal(loaded.migrated,true);assert.equal(s.schemaVersion,9);
  assert.equal(JSON.stringify(s.economy.ledger),JSON.stringify(old.economy.ledger));
  assert.equal(JSON.stringify(s.world.business.products),JSON.stringify(old.world.business.products));
  assert.equal(JSON.stringify(s.world.business.sales),JSON.stringify(old.world.business.sales));
  assert.equal(JSON.stringify(s.world.business.purchaseOrders),JSON.stringify(old.world.business.purchaseOrders));
  assert.equal(s.rng.seed,old.rng.seed);assert.equal(s.world.business.cityId,T);
  assert.equal(C.overview(s).cash,Old.overview(old).cash);
  assert.equal(C.overview(s).revenue,Old.overview(old).revenue);
  assert.equal(C.financialReport(s,'all','2026-11-03',null,'est-1').profit,C.financialReport(s,'all','2026-11-03').profit);
  assert.equal(C.importSave(C.exportSave(s)).migrated,false);
  C.validate(s);
});
test('V1.5: importação também migra save antigo sem empresa, conservando capital inicial',()=>{
  let old=cmd(Old,null,'CARREIRA.CRIAR',{name:'Yago',companyName:'Sem unidade',cityId:T,seed:95});
  const saved=Old.exportSave(old);let s=C.importSave(saved).state;
  assert.equal(s.schemaVersion,9);assert.equal(C.businesses(s).length,0);assert.equal(C.activeBusiness(s),null);
  assert.equal(C.overview(s).cash,3000000);C.validate(s);
  s=cmd(C,s,'EMPRESA.ABRIR',{sector:'roupas',cityId:S,lot:8});
  assert.equal(C.activeBusiness(s).cityId,S);C.validate(s);
});
test('V1.5: 180 dias com três filiais, pedidos e vendas conciliados por unidade',()=>{
  let s=fresh();s=openSecond(s,{sector:'mercado',cityId:S,lot:1});s=openSecond(s,{sector:'padaria',cityId:T,lot:2});
  s=cmd(C,s,'EMPRESA.ATIVAR',{businessId:'est-1'});
  s=cmd(C,s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:100});
  s=cmd(C,s,'EMPRESA.ATIVAR',{businessId:'est-3'});
  s=cmd(C,s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:100});
  for(let i=0;i<6;i++)s=cmd(C,s,'TEMPO.AVANCAR_LOTE',{days:30});
  assert.equal(s.calendar.tick,180);
  const r=C.groupReport(s),overview=C.overview(s);
  assert.equal(r.units.reduce((n,x)=>n+x.revenue,0),overview.revenue);
  assert.equal(r.units.reduce((n,x)=>n+x.cogs,0),overview.cogs);
  assert.equal(r.units.reduce((n,x)=>n+x.expenses,0),overview.expenses);
  assert.equal(r.units.reduce((n,x)=>n+x.stockValue,0),overview.inventoryValue);
  assert.equal(r.units.reduce((n,x)=>n+x.inTransit,0),overview.inTransit);
  assert.equal(C.diagnostics(s).ok,true);
  assert.equal(C.importSave(C.exportSave(s)).migrated,false);
});
test('V1.5: UI e schema exibem gestão da rede e bloqueiam caixa por unidade',()=>{
  const template=readFileSync('src/shell/index.template.html','utf8');const ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));
  for(const id of ['unit-switch','unit-rows','finance-scope','group-available-cash','group-operating-result'])assert.match(template,new RegExp(`id="${id}"`));
  assert.match(template,/Caixa compartilhado/);
  assert.match(template,/Projeções são cenários hipotéticos/);
  assert.match(ui,/Core\.groupReport\(state\)/);
  assert.match(ui,/Core\.activeBusiness\(state\)/);
  assert.match(ui,/financeScope==='all'/);
});
test('V1.5: rede com três estabelecimentos permanece íntegra após 365 dias',()=>{
  let s=fresh();s=openSecond(s,{sector:'mercado',cityId:S,lot:2});s=openSecond(s,{sector:'padaria',cityId:T,lot:3});
  for(let d=0;d<365;d+=30){const chunk=Math.min(30,365-d);s=cmd(C,s,'TEMPO.AVANCAR_LOTE',{days:chunk});}
  assert.equal(s.calendar.tick,365);assert.equal(C.businesses(s).length,3);
  const group=C.groupReport(s),all=C.overview(s);
  assert.equal(group.units.reduce((n,u)=>n+u.profit,0),all.profit);
  assert.equal(group.units.reduce((n,u)=>n+u.stockValue,0),all.inventoryValue);
  assert.equal(group.units.reduce((n,u)=>n+u.inTransit,0),all.inTransit);
  C.validate(s);
});

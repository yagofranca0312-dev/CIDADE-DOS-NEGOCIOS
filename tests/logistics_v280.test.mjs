import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function go(s,type,payload={}){
 const r=C.dispatch(s,{id:'logistics-v280-'+(++seq),type,payload});
 assert.equal(r.ok,true,r.error||type);return r.state;
}
function reject(s,type,payload={}){
 const old=JSON.stringify(s);const r=C.dispatch(s,{id:'rejected-v280-'+(++seq),type,payload});
 assert.equal(r.ok,false,type+' should be rejected');assert.equal(JSON.stringify(s),old);return r.error;
}
function career(seed=2801,city='CE-TIANGUA'){
 let s=go(null,'CARREIRA.CRIAR',{name:'Empresa fictícia',companyName:'Rede Logística Testes',cityId:city,seed});
 return s;
}
function open(s,sector='mercado',lot=1,cityId='CE-TIANGUA'){
 return go(s,'EMPRESA.ABRIR',{sector,lot,cityId});
}
function step(s,days){while(days>0){const n=Math.min(days,30);s=go(s,'TEMPO.AVANCAR_LOTE',{days:n});days-=n;}return s;}
function check(s){
 C.validate(s);
 const bal=C.balanceSheet(s),rec=C.reconciliationReport(s);
 assert.equal(bal.balanced,true,'Balanço desequilibrado');
 assert.equal(bal.difference,0,'Diferença contábil');
 assert.equal(rec.ok,true,rec.errors.join(' / '));
 assert.ok(Math.abs(bal.accounts.INTERNAL_CLEARING||0)===0);
 return s;
}
function twoMarkets(seed=2801){
 let s=open(career(seed),'mercado',1),origin=C.activeBusiness(s).id;
 s=open(s,'mercado',2);const dest=C.activeBusiness(s).id;
 return {s,origin,dest};
}
function buyToStore(s,id,productId='base',quantity=60){
 s=go(s,'EMPRESA.ATIVAR',{businessId:id});
 s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId,quantity});
 return step(s,1);
}
test('V2.8: backward-compatible schema9 does not invent logistics on old careers',()=>{
 const s=open(career(28001));
 assert.equal(s.schemaVersion,9);
 assert.equal(s.economy.logistics,undefined);
 assert.equal(C.logisticsReport(s).enabled,false);
 assert.equal(C.logisticsReport(s).totalPhysicalUnits,s.world.business.stockUnits);
 const old=JSON.stringify(s),copy=C.importSave(C.exportSave(s)).state;
 assert.equal(JSON.stringify(copy),old);
 check(copy);
});
test('V2.8: route distances are abstract indices, not geographic kilometers',()=>{
 const x=twoMarkets(28002);const q=C.logisticsRouteQuote(x.s,x.origin,x.dest,10);
 assert.equal(q.distanceType,'SIMULATED_INDEX_NOT_KM');
 assert.ok(/simulad|NÃO|n[aã]o/i.test(q.note));
 assert.ok(q.days>=1&&q.days<=5);
 assert.ok(q.feeCents>0&&Number.isInteger(q.distanceUnits));
 assert.equal(JSON.stringify(x.s),JSON.stringify(x.s));
 reject(x.s,'LOGISTICA.TRANSFERIR',{fromId:x.origin,toId:x.origin,productId:'base',quantity:10});
});
test('V2.8: transfer between two stores reduces origin, adds in-transit, no revenue or COGS',()=>{
 let {s,origin,dest}=twoMarkets(28003);
 s=buyToStore(s,origin,'base',80);
 const before=C.overview(s),out=C.businessById(s,origin).products.find(p=>p.id==='base');
 const costBefore=out.stockValueCents;
 s=go(s,'LOGISTICA.TRANSFERIR',{fromId:origin,toId:dest,productId:'base',quantity:24});
 const t=C.logisticsReport(s).transfers[0],during=C.overview(s);
 assert.equal(t.status,'PENDING');
 assert.equal(during.revenue,before.revenue);
 assert.equal(during.cogs,before.cogs);
 assert.equal(during.inventoryValue,before.inventoryValue-t.valueCents);
 assert.equal(during.inTransit,before.inTransit+t.valueCents);
 assert.equal(C.businessById(s,origin).products[0].stockValueCents,costBefore-t.valueCents);
 check(s);
 s=step(s,1);
 const arrived=C.logisticsReport(s).transfers[0];
 assert.equal(arrived.status,'RECEIVED');
 assert.equal(arrived.deliveredQuantity,24);
 assert.equal(C.businessById(s,dest).products[0].stockUnits,24);
 assert.equal(C.balanceSheet(s).accounts.INTERNAL_CLEARING,0);
 check(s);
});
test('V2.8: same command ID idempotent and different payload conflicts',()=>{
 let {s,origin,dest}=twoMarkets(28004);s=buyToStore(s,origin,'base',40);
 const cmd={id:'logistic-idempotent',type:'LOGISTICA.TRANSFERIR',
   payload:{fromId:origin,toId:dest,productId:'base',quantity:10}};
 const a=C.dispatch(s,cmd);assert.equal(a.ok,true,a.error);
 const b=C.dispatch(a.state,cmd);assert.equal(b.ok,true);assert.equal(b.status,'DUPLICATE');
 assert.equal(JSON.stringify(a.state),JSON.stringify(b.state));
 assert.equal(C.dispatch(a.state,{...cmd,payload:{...cmd.payload,quantity:9}}).ok,false);
 check(a.state);
});
test('V2.8: CD cannot open without two stores and has real opening and daily cost',()=>{
 let s=open(career(28005));
 reject(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
 s=open(s,'mercado',2);const cash=C.overview(s).cash,expenses=C.overview(s).expenses;
 s=go(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
 let lg=C.logisticsReport(s);
 assert.equal(lg.depot.cityId,'CE-TIANGUA');
 assert.equal(C.overview(s).cash,cash-80000);
 assert.equal(C.overview(s).expenses,expenses+80000);
 const before=C.overview(s).expenses;
 s=step(s,1);
 assert.equal(C.overview(s).expenses,before+850+2*C.SECTORS.mercado.dailyCost);
 const route=C.logisticsRouteQuote(s,C.businesses(s)[0].id,'CD-1',10);
 assert.ok(route.discountCents>0&&route.feeCents<route.baseFeeCents);
 check(s);
});
test('V2.8: CD purchases supplier goods, receives stock, then ships to branch without sale',()=>{
 let {s,origin,dest}=twoMarkets(28006);
 s=go(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
 const revenue=C.overview(s).revenue,cogs=C.overview(s).cogs,cash=C.overview(s).cash;
 s=go(s,'LOGISTICA.CD.COMPRAR',{businessId:origin,productId:'base',supplierId:'regional',quantity:80});
 assert.equal(C.overview(s).revenue,revenue);
 assert.equal(C.overview(s).cogs,cogs);
 assert.equal(C.logisticsReport(s).depot.stock.length,0);
 assert.equal(C.logisticsReport(s).depotPurchases[0].status,'PENDING');
 assert.ok(C.overview(s).cash<cash);
 check(s);
 s=step(s,1);
 const depot=C.logisticsReport(s).depot;
 assert.equal(depot.stock[0].stockUnits,80);
 assert.equal(C.logisticsReport(s).depotPurchases[0].status,'RECEIVED');
 check(s);
 const recent=C.overview(s),sourceId='CD-1';
 s=go(s,'LOGISTICA.TRANSFERIR',{fromId:sourceId,toId:dest,sector:'mercado',productId:'base',quantity:30});
 assert.equal(C.overview(s).revenue,recent.revenue);
 assert.equal(C.overview(s).cogs,recent.cogs);
 check(s);
 s=step(s,1);
 assert.equal(C.logisticsReport(s).depot.stock[0].stockUnits,50);
 assert.equal(C.businessById(s,dest).products[0].stockUnits,30);
 check(s);
});
test('V2.8: unpaid CD maintenance is recognized as payable without repeated expense',()=>{
 let {s}=twoMarkets(28013);
 s=go(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
 s=step(s,80);
 const before=C.overview(s),payable=C.logisticsReport(s).depotPayableCents;
 assert.ok(payable>0,'Maintenance should accrue when cash is insufficient');
 assert.ok(before.payable>=payable);
 reject(s,'LOGISTICA.CD.PAGAR_DESPESAS',{amountCents:payable+1});
 if(before.cash<payable)reject(s,'LOGISTICA.CD.PAGAR_DESPESAS',{amountCents:payable});
 assert.equal(C.logisticsReport(s).depotPayableCents,payable);
 assert.equal(C.overview(s).expenses,before.expenses);
 check(s);
});
test('V2.8: CD capacity counts stock and pending supplier / inbound shipments',()=>{
 let {s,origin,dest}=twoMarkets(28007);
 s=go(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
 reject(s,'LOGISTICA.CD.COMPRAR',{businessId:origin,productId:'base',supplierId:'regional',quantity:250});
 reject(s,'LOGISTICA.CD.COMPRAR',{businessId:origin,productId:'base',supplierId:'regional',quantity:0});
 assert.equal(C.logisticsReport(s).depotPurchases.length,0);
 check(s);
});
test('V2.8: bakery input requires opt-in, material is consumed and product cost is traceable',()=>{
 let s=open(career(28008),'padaria',1),unit=C.activeBusiness(s).id;
 reject(s,'LOGISTICA.PRODUZIR',{businessId:unit,inputQuantity:10});
 s=go(s,'LOGISTICA.PRODUCAO.HABILITAR',{businessId:unit});
 reject(s,'LOGISTICA.PRODUCAO.HABILITAR',{businessId:unit});
 s=go(s,'LOGISTICA.INSUMO.COMPRAR',{businessId:unit,supplierId:'regional',quantity:25});
 s=step(s,1);
 const before=C.overview(s),raw=C.businessById(s,unit).products.find(p=>p.id==='raw-farinha');
 const material=raw.stockValueCents,loaves=C.businessById(s,unit).products[0].stockUnits;
 s=go(s,'LOGISTICA.PRODUZIR',{businessId:unit,inputQuantity:25});
 const after=C.overview(s);
 assert.equal(C.businessById(s,unit).products.find(p=>p.id==='raw-farinha').stockUnits,0);
 assert.equal(C.businessById(s,unit).products[0].stockUnits,loaves+75);
 assert.equal(after.inventoryValue,before.inventoryValue+3000);
 assert.equal(after.cash,before.cash-3000);
 assert.equal(after.revenue,before.revenue);
 assert.equal(after.cogs,before.cogs);
 assert.equal(C.logisticsReport(s).metrics.produced,75);
 assert.ok(C.logisticsReport(s).batches.some(l=>l.productId==='base'&&l.quantity===75));
 reject(s,'LOGISTICA.PRODUZIR',{businessId:unit,inputQuantity:1});
 check(s);
});
test('V2.8: new bakery goods expire and are expensed exactly once (not cost of sales)',()=>{
 let s=open(career(28009),'padaria',1),unit=C.activeBusiness(s).id;
 s=go(s,'LOGISTICA.PRODUCAO.HABILITAR',{businessId:unit});
 s=buyToStore(s,unit,'extra-1',100); // Bolo caseiro: 5 days, older stock untouched.
 const originalStock=C.businessById(s,unit).products.find(p=>p.id==='extra-1').stockUnits;
 assert.equal(originalStock,100);
 assert.ok(C.logisticsReport(s).batches.some(l=>l.productId==='extra-1'));
 s=step(s,6);
 const lost=s.audit.events.filter(e=>e.type==='LOGISTICA.DESPERDICIO'&&e.data.productId==='extra-1');
 assert.equal(lost.length,1);
 assert.ok(lost[0].data.quantity>0);
 const waste=lost[0].data.valueCents;
 assert.ok(waste>0);
 assert.equal(C.logisticsReport(s).metrics.waste,waste);
 const cogs=C.overview(s).cogs;
 s=step(s,1);
 assert.equal(C.logisticsReport(s).metrics.waste,waste);
 assert.equal(C.overview(s).cogs,cogs);
 check(s);
});
test('V2.8: goods perishing in transit are expense, not phantom stock or sale',()=>{
 let s=open(career(28010),'padaria',1,'CE-TIANGUA'),origin=C.activeBusiness(s).id;
 s=open(s,'padaria',1,'AC-RIO-BRANCO');const dest=C.activeBusiness(s).id;
 s=go(s,'LOGISTICA.PRODUCAO.HABILITAR',{businessId:origin});
 s=go(s,'LOGISTICA.INSUMO.COMPRAR',{businessId:origin,supplierId:'regional',quantity:25});
 s=step(s,1);
 s=go(s,'LOGISTICA.PRODUZIR',{businessId:origin,inputQuantity:25});
 const quote=C.logisticsRouteQuote(s,origin,dest,75);
 assert.ok(quote.days>=3,'Expected a cross-city route long enough to test expiry');
 s=go(s,'LOGISTICA.TRANSFERIR',{fromId:origin,toId:dest,productId:'base',quantity:75});
 const before=C.overview(s);
 s=step(s,quote.days);
 const trip=C.logisticsReport(s).transfers[0],end=C.overview(s);
 assert.equal(trip.status,'RECEIVED');
 assert.equal(trip.deliveredQuantity,0,'Expired all perishable cargo');
 assert.equal(trip.lostQuantity,75);
 assert.equal(C.businessById(s,dest).products[0].stockUnits,0);
 assert.ok(end.expenses>before.expenses);
 assert.ok(s.audit.events.some(e=>e.type==='LOGISTICA.PERDA_EM_TRANSITO'));
 check(s);
});
test('V2.8: route suggestions are pure, editable, and never automatically spend cash',()=>{
 let {s,origin,dest}=twoMarkets(28011);
 s=buyToStore(s,origin,'base',100);
 const before=JSON.stringify(s),cash=C.overview(s).cash;
 const suggestions=C.logisticsSuggestions(s);
 assert.ok(suggestions.length>0);
 assert.ok(suggestions.every(x=>x.kind==='TRANSFER'||x.kind==='SUPPLIER'));
 assert.equal(JSON.stringify(s),before);
 assert.equal(C.overview(s).cash,cash);
 assert.ok(suggestions.some(x=>x.kind==='TRANSFER'&&x.toId===dest));
 check(s);
});
test('V2.8: all funds and product value reconcile after incoming supplier, CD, internal trip and production',()=>{
 let s=open(career(28012),'mercado',1),market=C.activeBusiness(s).id;
 s=open(s,'mercado',2);const branch=C.activeBusiness(s).id;
 s=open(s,'padaria',3);const bakery=C.activeBusiness(s).id;
 s=go(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
 s=go(s,'LOGISTICA.CD.COMPRAR',{businessId:market,productId:'base',supplierId:'regional',quantity:120});
 s=go(s,'LOGISTICA.PRODUCAO.HABILITAR',{businessId:bakery});
 s=go(s,'LOGISTICA.INSUMO.COMPRAR',{businessId:bakery,supplierId:'regional',quantity:25});
 check(s);
 s=step(s,1);check(s);
 s=go(s,'LOGISTICA.PRODUZIR',{businessId:bakery,inputQuantity:12});check(s);
 s=go(s,'LOGISTICA.TRANSFERIR',{fromId:'CD-1',toId:market,sector:'mercado',productId:'base',quantity:60});
 s=go(s,'LOGISTICA.TRANSFERIR',{fromId:'CD-1',toId:branch,sector:'mercado',productId:'base',quantity:40});
 check(s);
 s=step(s,2);check(s);
 const roundtrip=C.importSave(C.exportSave(s)).state;
 assert.equal(JSON.stringify(roundtrip),JSON.stringify(s));
 check(roundtrip);
});
test('V2.8: compiled offline HTML includes navigation, forms and no external dependency',()=>{
 const html=readFileSync('index.html','utf8');
 assert.match(html,/v3\.0\.0/);
 for(const id of ['v23-tab-administrativo-logistica','v23-pane-administrativo-logistica',
  'logistics-transfer-form','logistics-depot-buy-form','logistics-produce-form',
  'logistics-proposal-rows','logistics-lot-rows','logistics-integrity']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 const m=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)][0];
 assert.ok(m);assert.doesNotThrow(()=>new Script(m[1]));
});

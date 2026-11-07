import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function send(state,type,payload={},id=null){
  return C.dispatch(state,{type,payload,id:id||'v3-patch-a-'+(++seq)});
}
function go(s,type,payload={}){
  const r=send(s,type,payload);
  assert.equal(r.ok,true,r.error||type);return r.state;
}
function start(seed=300000){
  let s=go(null,'CARREIRA.CRIAR',{name:'QA Patch A',companyName:'Rede Econômica Simulada',cityId:'CE-TIANGUA',seed});
  return go(s,'EMPRESA.ABRIR',{cityId:'CE-TIANGUA',sector:'mercado',lot:1});
}
function days(s,n){while(n>0){const d=Math.min(30,n);s=go(s,'TEMPO.AVANCAR_LOTE',{days:d});n-=d;}return s;}
function quote(s,mode='equilibrado'){return C.operationalBalanceReport(s,mode);}
function invariants(s){C.validate(s);assert.equal(C.reconciliationReport(s).ok,true);assert.equal(C.balanceSheet(s).balanced,true);}
test('Patch A: versão isolada, schema 9 e nenhuma migração retroativa',()=>{
 const s=start(300001);assert.equal(C.VERSION,'3.0.0-alpha.1');assert.equal(C.SCHEMA_VERSION,9);
 assert.equal(s.schemaVersion,9);assert.equal(s.economy.logistics,undefined);
 invariants(s);
});
test('Patch A: três perfis calculados sem mutação, RNG ou lançamentos',()=>{
 const s=start(300002),before=JSON.stringify(s);
 const conservative=quote(s,'conservador'),balanced=quote(s),aggressive=quote(s,'agressivo');
 assert.equal(conservative.mode,'conservador');assert.equal(balanced.mode,'equilibrado');assert.equal(aggressive.mode,'agressivo');
 assert.equal(conservative.reserveDays,14);assert.equal(balanced.reserveDays,7);assert.equal(aggressive.reserveDays,3);
 assert.ok(conservative.reservedCents>balanced.reservedCents);
 assert.ok(balanced.reservedCents>aggressive.reservedCents);
 assert.equal(balanced.cashCents,C.overview(s).cash);
 assert.equal(JSON.stringify(s),before);
});
test('Patch A: propostas têm orçamento, reserva e fornecedores coerentes',()=>{
 const s=start(300003);
 for(const mode of ['conservador','equilibrado','agressivo']){
   const q=quote(s,mode);
   assert.equal(q.spendCents,q.products.reduce((n,p)=>n+p.spendCents,0));
   assert.equal(q.postPurchaseCashCents,q.cashCents-q.spendCents);
   assert.ok(q.spendCents<=q.availableBudgetCents,'Reserva de caixa ultrapassada');
   assert.ok(q.remainingReserveCents>=0,'Plano comprometeu reserva prometida');
   assert.equal(q.lines.length,q.products.filter(p=>p.quantity>0).length);
   assert.ok(q.products.every(p=>p.quantity<=p.recommendedQty && p.quantity<=p.maxDailyQty));
 }
});
test('Patch A: fornecedor conservador poupa preço mas tem prazo maior',()=>{
 const s=start(300004),a=quote(s,'conservador'),b=quote(s,'equilibrado');
 assert.equal(a.supplierId,'atacado');assert.equal(a.supplierLeadDays,3);
 assert.equal(b.supplierId,'regional');assert.equal(b.supplierLeadDays,1);
 assert.ok(a.products.find(p=>p.productId==='base').unitCostCents<
   b.products.find(p=>p.productId==='base').unitCostCents);
});
test('Patch A: cenário de preço ajusta demanda potencial sem mudar o preço real',()=>{
 const s=start(300005),before=JSON.stringify(s),q=quote(s);
 const p=q.products.find(p=>p.productId==='base'),sc=p.priceScenarios;
 assert.equal(sc.length,3);assert.ok(sc[0].priceCents<sc[1].priceCents);
 assert.ok(sc[2].priceCents>sc[1].priceCents);
 assert.ok(sc[0].potentialDailyUnits>=sc[2].potentialDailyUnits);
 assert.equal(C.activeBusiness(s).products[0].priceCents,p.currentPriceCents);
 assert.equal(JSON.stringify(s),before);
});
test('Patch A: compra estratégica executa um pedido confirmado, sem inventar receita nem crédito',()=>{
 const s=start(300006),p=quote(s),old=C.overview(s);
 assert.ok(p.spendCents>0&&p.lines.length>0);
 const r=send(s,'ECONOMIA.COMPRAR_PLANO',{mode:p.mode,businessId:p.businessId,revision:p.revision,quoteId:p.quoteId},'purchase-fixed-v3a');
 assert.equal(r.ok,true,r.error);const next=r.state,now=C.overview(next);
 assert.equal(now.cash,old.cash-p.spendCents);
 assert.equal(now.revenue,old.revenue);
 assert.equal(now.cogs,old.cogs);
 assert.equal(now.payable,old.payable);
 assert.equal(next.economy.ledger.filter(j=>j.kind==='PURCHASE').length,1);
 assert.equal(C.activeBusiness(next).purchaseOrders.filter(o=>o.status==='PENDING').length,1);
 assert.ok(next.audit.events.some(e=>e.type==='ECONOMIA.COMPRA_PLANEJADA'));
 invariants(next);
 const dup=send(next,'ECONOMIA.COMPRAR_PLANO',{mode:p.mode,businessId:p.businessId,revision:p.revision,quoteId:p.quoteId},'purchase-fixed-v3a');
 assert.equal(dup.ok,true);assert.equal(dup.status,'DUPLICATE');
 assert.equal(JSON.stringify(dup.state),JSON.stringify(next));
});
test('Patch A: plano sem estoque não cria venda antes do recebimento',()=>{
 let s=start(300007),p=quote(s);
 s=go(s,'ECONOMIA.COMPRAR_PLANO',{mode:p.mode,businessId:p.businessId,revision:p.revision,quoteId:p.quoteId});
 assert.equal(C.activeBusiness(s).stockUnits,0);
 const income=C.overview(s).revenue;
 s=go(s,'TEMPO.AVANCAR_DIA');
 assert.equal(C.overview(s).revenue,income);
 assert.ok(C.activeBusiness(s).stockUnits>0);
 invariants(s);
});
test('Patch A: cotação antiga não é usada depois de outro comando',()=>{
 let s=start(300008),p=quote(s);
 s=go(s,'PRECO.DEFINIR',{productId:'base',cents:5200});
 const before=JSON.stringify(s);
 const r=send(s,'ECONOMIA.COMPRAR_PLANO',{mode:p.mode,businessId:p.businessId,revision:p.revision,quoteId:p.quoteId});
 assert.equal(r.ok,false);assert.match(r.error,/desatualizado/i);
 assert.equal(JSON.stringify(s),before);
});
test('Patch A: cotação adulterada, modo inválido e negócio errado falham atomicamente',()=>{
 const s=start(300009),p=quote(s),before=JSON.stringify(s);
 for(const change of [{quoteId:'abcdef01'},{mode:'inexistente'},{businessId:'est-9999'}]){
   const r=send(s,'ECONOMIA.COMPRAR_PLANO',{mode:p.mode,businessId:p.businessId,
     revision:p.revision,quoteId:p.quoteId,...change});
   assert.equal(r.ok,false);
   assert.equal(JSON.stringify(s),before);
 }
});
test('Patch A: três aberturas descapitalizadas geram alerta sem compra automática',()=>{
 let s=start(300010);
 s=go(s,'EMPRESA.ABRIR',{cityId:'CE-TIANGUA',sector:'padaria',lot:2});
 s=go(s,'EMPRESA.ABRIR',{cityId:'CE-TIANGUA',sector:'roupas',lot:3});
 const before=JSON.stringify(s),q=quote(s,'conservador');
 assert.ok(q.flags.some(x=>x.id==='UNDERCAPITALIZED'));
 assert.equal(q.availableBudgetCents,0);
 assert.equal(q.lines.length,0);
 assert.equal(JSON.stringify(s),before);
 const r=send(s,'ECONOMIA.COMPRAR_PLANO',{mode:q.mode,businessId:q.businessId,
   revision:q.revision,quoteId:q.quoteId});
 assert.equal(r.ok,false);assert.equal(JSON.stringify(s),before);
});
test('Patch A: preço abaixo do custo não motiva compra artificial',()=>{
 let s=start(300011);
 for(const p of C.activeBusiness(s).products)s=go(s,'PRECO.DEFINIR',{productId:p.id,cents:100});
 const q=quote(s);
 assert.equal(q.lines.length,0);
 assert.ok(q.flags.some(f=>f.id==='NEGATIVE_UNIT_MARGIN'));
 assert.ok(q.products.every(p=>p.contributionCents<=0));
});
test('Patch A: pedidos em trânsito não são comprados novamente até o destino',()=>{
 let s=start(300012),p=quote(s,'equilibrado');
 s=go(s,'ECONOMIA.COMPRAR_PLANO',{mode:p.mode,businessId:p.businessId,
   revision:p.revision,quoteId:p.quoteId});
 const q=quote(s,'equilibrado');
 assert.ok(q.products.every(x=>x.incomingQty>=0));
 assert.ok(q.products.some(x=>x.incomingQty>0));
 assert.ok(q.products.every(x=>x.recommendedQty<=x.targetUnits));
 invariants(s);
});
test('Patch A: 30 e 90 dias de operação com compra e decisão têm contabilidade íntegra',()=>{
 let s=start(300013),plan=quote(s);
 s=go(s,'ECONOMIA.COMPRAR_PLANO',{mode:plan.mode,businessId:plan.businessId,revision:plan.revision,quoteId:plan.quoteId});
 s=days(s,30);invariants(s);
 assert.ok(C.overview(s).revenue>0,'Venda deve vir do mercado, não da compra');
 const q=quote(s,'agressivo');assert.ok(q.fixedDailyCents>0);
 s=days(s,60);invariants(s);
 assert.equal(s.calendar.tick,90);assert.equal(C.qualityReport(s,90).balanced,true);
});
test('Patch A: backup tradicional e compacto preservam integralmente o pedido e o histórico',()=>{
 let s=start(300014),p=quote(s);
 s=go(s,'ECONOMIA.COMPRAR_PLANO',{mode:p.mode,businessId:p.businessId,revision:p.revision,quoteId:p.quoteId});
 for(const data of [C.exportSave(s),C.exportSaveCompact(s)]){
   const result=C.importSave(data);
   assert.equal(JSON.stringify(result.state),JSON.stringify(s));
   invariants(result.state);
 }
});
test('Patch A: painel entra no executável único sem chamadas externas ou novos schemas',()=>{
 const html=readFileSync('index.html','utf8');
 for(const id of ['v300a-balance-panel','v300a-mode','v300a-summary','v300a-lines',
   'v300a-flags','v300a-price-scenarios','v300a-apply'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/v3\.0\.0-alpha\.1/);
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][2]));
});

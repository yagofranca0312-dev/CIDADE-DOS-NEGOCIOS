import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// P1 PR-01/PR-02: motor real + funções reais do assistente de reposição.
// Mantém modelo do jogo V2 e só executa cenários artificiais determinísticos.
const coreSource=readFileSync('src/core/game.js','utf8');
const restockSource=readFileSync('src/ui/restock-views.part.js','utf8');
const C=runInNewContext(coreSource+'\nCidadeCore',{});
const H=runInNewContext(restockSource.split('function renderRestockSummary()')[0]+
  '\n({restockRoom,restockSupplierLimit,prepareRestockPlan,reviewRestockPlan,adjustRestockToBudget})',{});
let seq=0;
function command(state,type,payload={}){
  return C.dispatch(state,{id:'v300-pr01-pr02-'+(++seq),type,payload});
}
function go(state,type,payload={}){
  const result=command(state,type,payload);
  assert.equal(result.ok,true,type+': '+result.error);
  return result.state;
}
function init(seed=300701){
  let s=go(null,'CARREIRA.CRIAR',{
    name:'Pessoa de teste',companyName:'Rede Simulada',cityId:'CE-TIANGUA',seed});
  return go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});
}
function days(s,n){
  while(n>0){const qty=Math.min(n,30);s=go(s,'TEMPO.AVANCAR_LOTE',{days:qty});n-=qty;}
  return s;
}
const tx=(s,kind)=>s.economy.ledger.filter(j=>j.kind===kind);
const events=(s,type)=>s.audit.events.filter(e=>e.type===type);
const integrity=s=>{
  assert.equal(C.validate(s),true);
  assert.equal(C.balanceSheet(s).difference,0);
  assert.equal(C.reconciliationReport(s).ok,true);
};

test('PR-01: previsão e competência usam uma única função de pró-rata, sem duplicar lógica',()=>{
  const src=coreSource.split('  // PR-01: única regra de pró-rata do RH.')[1]?.split('  function initialProducts(')[0];
  assert.ok(src,'Contrato do cálculo RH não localizado');
  assert.equal((src.match(/Math\.round\(x\.salaryCents\*days\/30\)/g)||[]).length,1);
  assert.match(src,/function payrollPeriodQuote\(staff,businessId,period\)/);
  assert.match(src,/return payrollPeriodQuote\(rhEmployees\(state\),businessId,period\)\.amount/);
  assert.match(src,/const \{amount,eligibleCount\}=payrollPeriodQuote\(staff,b\.id,period\)/);
  assert.equal((src.match(/journal\(draft/g)||[]).length,1);
});

test('PR-01: dois estabelecimentos usam cálculo mensal isolado; pagar não reapura despesa',()=>{
  let s=init(300702),first=C.activeBusiness(s).id;
  s=go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:2});
  const second=C.activeBusiness(s).id;
  s=go(s,'RH.CONTRATAR',{businessId:first,name:'Atendimento Sintético',role:'atendimento'});
  s=go(s,'RH.CONTRATAR',{businessId:second,name:'Logística Sintética',role:'logistica'});
  const raw=JSON.stringify(s),ledger=s.economy.ledger.length;
  const predictedFirst=C.estimatedPayrollMonth(s,first,'2026-11');
  const predictedSecond=C.estimatedPayrollMonth(s,second,'2026-11');
  assert.equal(predictedFirst,150000);
  assert.equal(predictedSecond,190000);
  assert.equal(C.estimatedPayrollMonth(s,first,'2026-11'),predictedFirst);
  assert.equal(s.economy.ledger.length,ledger,'Cotação RH não pode escrever no razão');
  assert.equal(JSON.stringify(s),raw,'Cotação RH não pode alterar estado');
  s=days(s,30);
  assert.equal(events(s,'RH.FOLHA_APURADA').length,2);
  assert.equal(tx(s,'PAYROLL_ACCRUAL').length,2);
  const report=C.rhReport(s);
  assert.equal(report.units.find(u=>u.businessId===first).payrolls[0].amount,predictedFirst);
  assert.equal(report.units.find(u=>u.businessId===second).payrolls[0].amount,predictedSecond);
  assert.equal(report.pendingCents,predictedFirst+predictedSecond);
  const expenses=C.incomeStatement(s).expenses;
  s=go(s,'RH.PAGAR_FOLHA',{businessId:first,period:'2026-11'});
  assert.equal(tx(s,'PAYROLL_PAYMENT').length,1);
  assert.equal(C.rhReport(s).pendingCents,predictedSecond);
  assert.equal(C.incomeStatement(s).expenses,expenses);
  const old=JSON.stringify(s);
  const duplicate=command(s,'RH.PAGAR_FOLHA',{businessId:first,period:'2026-11'});
  assert.equal(duplicate.ok,false);
  assert.equal(JSON.stringify(s),old);
  integrity(s);
});

test('PR-01: contratação e desligamento no meio de novembro preservam o arredondamento por pessoa',()=>{
  let s=init(300703),businessId=C.activeBusiness(s).id;
  s=days(s,10); // Novembro 11
  s=go(s,'RH.CONTRATAR',{businessId,name:'Pro rata A',role:'atendimento'});
  s=days(s,6); // Novembro 17
  const id=C.rhReport(s).units[0].employees[0].id;
  s=go(s,'RH.DESLIGAR',{employeeId:id});
  const predicted=C.estimatedPayrollMonth(s,businessId,'2026-11');
  assert.equal(predicted,Math.round(150000*7/30));
  s=days(s,14); // Dezembro 1
  assert.equal(events(s,'RH.FOLHA_APURADA').length,1);
  assert.equal(C.rhReport(s).units[0].payrolls[0].amount,predicted);
  assert.equal(C.rhReport(s).pendingCents,predicted);
  integrity(s);
});

test('PR-01: teto de 30 dias em dezembro com 31 dias mantém o critério histórico',()=>{
  let s=init(300704),businessId=C.activeBusiness(s).id;
  s=days(s,30); // Dezembro 1
  s=go(s,'RH.CONTRATAR',{businessId,name:'Colaborador Dezembro',role:'atendimento'});
  const before=JSON.stringify(s);
  const prediction=C.estimatedPayrollMonth(s,businessId,'2026-12');
  assert.equal(prediction,150000);
  assert.equal(JSON.stringify(s),before);
  s=days(s,31); // Janeiro 1
  const payroll=C.rhReport(s).units[0].payrolls.find(x=>x.period==='2026-12');
  assert.equal(payroll.amount,prediction);
  assert.equal(events(s,'RH.FOLHA_APURADA').filter(x=>x.data.period==='2026-12').length,1);
  integrity(s);
});

test('PR-02: capacidade manual inclui transferências internas PENDING, preservando legado sem estado',()=>{
  let s=init(300705),origin=C.activeBusiness(s).id;
  s=go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:2});
  const dest=C.activeBusiness(s).id;
  s=go(s,'EMPRESA.ATIVAR',{businessId:origin});
  s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:90});
  s=days(s,1);
  s=go(s,'LOGISTICA.TRANSFERIR',{fromId:origin,toId:dest,productId:'base',quantity:24});
  s=go(s,'EMPRESA.ATIVAR',{businessId:dest});
  const unit=C.activeBusiness(s),supplier=C.SUPPLIERS.find(x=>x.id==='regional');
  const rows=C.inventoryReport(s),transfer=C.logisticsReport(s).transfers.find(t=>t.toId===dest);
  assert.equal(transfer.status,'PENDING');
  const amount=transfer.quantity;
  assert.equal(H.restockRoom(unit,s),100000-unit.stockUnits-amount);
  assert.equal(H.restockRoom(unit),100000-unit.stockUnits,'V2 assistente sem estado não deve quebrar');
  // Unidade fictícia quase cheia: o motor inclui incoming, enquanto o plano legado ignorava.
  const nearFull={...unit,stockUnits:100000-amount-1};
  assert.equal(H.restockRoom(nearFull,s),1);
  assert.equal(H.restockRoom(nearFull),amount+1);
  const snapshot=JSON.stringify(s);
  const draft=H.prepareRestockPlan(nearFull,rows,supplier,'ideal',s.calendar.date,s.revision,s);
  assert.ok(draft.lines.reduce((sum,x)=>sum+x.quantity,0)<=1);
  const forced={businessId:dest,revision:s.revision,supplierId:supplier.id,
    mode:'personalizado',lines:[{productId:'base',selected:true,quantity:2}]};
  const review=H.reviewRestockPlan(forced,nearFull,rows,supplier,Number.MAX_SAFE_INTEGER,
    s.calendar.date,s.revision,s);
  assert.equal(review.valid,false);
  assert.match(review.errors.join(' '),/Capacidade total/);
  H.adjustRestockToBudget(forced,nearFull,rows,supplier,Number.MAX_SAFE_INTEGER,s.calendar.date,s);
  assert.ok(forced.lines[0].quantity<=1);
  assert.equal(JSON.stringify(s),snapshot,'Cotação não pode alterar snapshot da carreira');
  integrity(s);
});

test('PR-02: compra manual e Patch A compartilham um único escritor; proposta antiga é recusada',()=>{
  let s=init(300706),unit=C.activeBusiness(s),supplier=C.SUPPLIERS.find(x=>x.id==='regional');
  const strategic=C.operationalBalanceReport(s,'equilibrado');
  assert.ok(strategic.lines.length>0);
  const rows=C.inventoryReport(s),cash=C.overview(s).cash,old=JSON.stringify(s);
  const draft=H.prepareRestockPlan(unit,rows,supplier,'ideal',s.calendar.date,s.revision,s);
  for(const line of draft.lines){line.selected=line.productId==='base';line.quantity=line.selected?2:0;}
  const reviewed=H.reviewRestockPlan(draft,unit,rows,supplier,cash,s.calendar.date,s.revision,s);
  assert.equal(reviewed.valid,true,reviewed.errors.join('; '));
  assert.equal(JSON.stringify(s),old,'Duas cotações não lançam despesas, estoques ou vendas');
  const ledgerBefore=tx(s,'PURCHASE').length,orderBefore=events(s,'COMPRA.ENCOMENDADA').length;
  s=go(s,'COMPRAS.REGISTRAR',{supplierId:supplier.id,items:reviewed.items.map(x=>({productId:x.productId,quantity:x.quantity}))});
  assert.equal(tx(s,'PURCHASE').length,ledgerBefore+1);
  assert.equal(events(s,'COMPRA.ENCOMENDADA').length,orderBefore+1);
  const stale=command(s,'ECONOMIA.COMPRAR_PLANO',{
    businessId:strategic.businessId,mode:strategic.mode,revision:strategic.revision,quoteId:strategic.quoteId});
  assert.equal(stale.ok,false);
  const quote=C.operationalBalanceReport(s,'equilibrado');
  assert.equal(quote.revision,s.revision);
  if(quote.lines.length){
    const result=command(s,'ECONOMIA.COMPRAR_PLANO',{
      businessId:quote.businessId,mode:quote.mode,revision:quote.revision,quoteId:quote.quoteId});
    assert.equal(result.ok,true,result.error);
    s=result.state;
    assert.equal(tx(s,'PURCHASE').length,ledgerBefore+2);
    assert.equal(events(s,'COMPRA.ENCOMENDADA').length,orderBefore+2);
  }
  integrity(s);
});

test('PR-02: cotação limita orçamento, fornecedor e capacidade; valores não viram receita',()=>{
  let s=init(300707);
  const raw=JSON.stringify(s),start=C.overview(s);
  for(const mode of ['conservador','equilibrado','agressivo']){
    const quote=C.operationalBalanceReport(s,mode);
    assert.ok(quote.spendCents<=quote.availableBudgetCents);
    assert.equal(quote.postPurchaseCashCents,quote.cashCents-quote.spendCents);
    assert.ok(quote.lines.length<=40);
    assert.ok(quote.products.every(p=>p.quantity<=p.maxDailyQty));
    assert.equal(C.overview(s).revenue,start.revenue);
  }
  assert.equal(JSON.stringify(s),raw);
  // Exceder a capacidade do fornecedor é REJECTED atomicamente pelo escritor canônico.
  const failed=command(s,'COMPRAS.REGISTRAR',{supplierId:'regional',items:[
    {productId:'base',quantity:2000}]});
  assert.equal(failed.ok,false);
  assert.equal(JSON.stringify(s),raw);
  integrity(s);
});

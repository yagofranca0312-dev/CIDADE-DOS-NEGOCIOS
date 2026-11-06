import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function run(s,type,payload={}){
  const result=C.dispatch(s,{id:'credit-v270-'+(++seq),type,payload});
  assert.equal(result.ok,true,result.error||type);
  return result.state;
}
function reject(s,type,payload={}){
  const old=JSON.stringify(s);
  const result=C.dispatch(s,{id:'credit-v270-rejected-'+(++seq),type,payload});
  assert.equal(result.ok,false,type+' unexpectedly applied');
  assert.equal(JSON.stringify(s),old,'Rejected command changed the original state');
  return result.error;
}
function initial(seed=1070){
  let s=run(null,'CARREIRA.CRIAR',{name:'Jogador fictício',companyName:'Rede de Testes',cityId:'CE-TIANGUA',seed});
  return run(s,'EMPRESA.ABRIR',{sector:'mercado',lot:1});
}
function advance(s,days){
  while(days>0){const count=Math.min(30,days);s=run(s,'TEMPO.AVANCAR_LOTE',{days:count});days-=count;}
  return s;
}
function ready(seed=1070){
  let s=initial(seed);
  s=run(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:200});
  s=advance(s,7);
  assert.ok(C.creditReport(s).eligibility.availableCents>=50000,'Expected enough actual historical sales for credit');
  return s;
}
function payLoan(s,loanId,amountCents){
  return run(s,'CREDITO.PAGAR',{loanId,amountCents});
}
function sheet(s){
  const b=C.balanceSheet(s),r=C.reconciliationReport(s);
  assert.equal(b.difference,0);assert.equal(b.balanced,true);
  assert.equal(r.ok,true,JSON.stringify(r.errors));
}
test('V2.7: V2.6 and legacy saves do not activate credit retroactively',()=>{
  let s=initial(27001);
  assert.equal(s.economy.financing,undefined);
  assert.equal(C.creditReport(s).principalOutstanding,0);
  assert.equal(C.creditReport(s).eligibility.eligible,false);
  const copy=C.importSave(C.exportSave(s)).state;
  assert.equal(copy.economy.financing,undefined);
  assert.equal(JSON.stringify(copy),JSON.stringify(s));
  sheet(copy);
});
test('V2.7: credit eligibility is based on real sales and limits simultaneous borrowing',()=>{
  let s=ready(27002),elig=C.creditReport(s).eligibility;
  assert.equal(elig.eligible,true);
  assert.ok(elig.creditLimitCents<=3000000);
  const amount=Math.min(200000,elig.availableCents);
  s=run(s,'CREDITO.CONTRATAR',{principalCents:amount,termMonths:6});
  const after=C.creditReport(s).eligibility;
  assert.equal(after.outstandingPrincipalCents,amount);
  assert.equal(after.availableCents,elig.availableCents-amount);
  reject(s,'CREDITO.CONTRATAR',{principalCents:after.availableCents+50000,termMonths:12});
  sheet(s);
});
test('V2.7: loan cash inflow never becomes revenue, equity, or capital',()=>{
  let s=ready(27003),before=C.overview(s),bs=C.balanceSheet(s);
  s=run(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:3});
  const after=C.overview(s),next=C.balanceSheet(s),flow=C.cashFlowStatement(s);
  assert.equal(after.cash,before.cash+50000);
  assert.equal(after.revenue,before.revenue);
  assert.equal(after.profit,before.profit);
  assert.equal(next.accounts.LOAN_PAYABLE,50000);
  assert.equal(next.liabilities,bs.liabilities+50000);
  assert.equal(next.assets,bs.assets+50000);
  assert.equal(next.paidInCapital,bs.paidInCapital);
  assert.equal(flow.categories.loanDraws,50000);
  sheet(s);
});
test('V2.7: financing is idempotent by command ID and rejects conflicting payload',()=>{
  let s=ready(27004);
  const cmd={id:'v270-credit-idempotency',type:'CREDITO.CONTRATAR',payload:{principalCents:50000,termMonths:12}};
  const once=C.dispatch(s,cmd);
  assert.equal(once.ok,true,once.error);
  const again=C.dispatch(once.state,cmd);
  assert.equal(again.status,'DUPLICATE');
  assert.equal(JSON.stringify(once.state),JSON.stringify(again.state));
  const conflict=C.dispatch(once.state,{...cmd,payload:{principalCents:100000,termMonths:12}});
  assert.equal(conflict.ok,false);
  assert.equal(once.state.economy.financing.loans.length,1);
  sheet(once.state);
});
test('V2.7: interest is accrued on time, late fee is capped, default is observable',()=>{
  let s=ready(27005);
  s=run(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:3});
  const start=s.calendar.date;
  s=advance(s,30);
  let loan=C.creditReport(s).loans[0];
  assert.equal(loan.lastDueDate,s.calendar.date);
  assert.equal(loan.nextDueDate!==start,true);
  assert.ok(loan.interestDueCents>0);
  assert.ok(loan.duePrincipalCents>0);
  assert.equal(loan.status,'DUE');
  s=advance(s,1);
  loan=C.creditReport(s).loans[0];
  assert.equal(loan.status,'DELINQUENT');
  s=advance(s,300);
  loan=C.creditReport(s).loans[0];
  assert.ok(loan.assessedFeesCents<=Math.floor(loan.principalCents*.2));
  assert.ok(loan.feesDueCents>0);
  assert.ok(C.overview(s).expenses>0);
  sheet(s);
});
test('V2.7: early principal repayment records pro-rata interest without double posting',()=>{
  let s=ready(27006);
  s=run(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:6});
  s=advance(s,10);
  const balanceBefore=C.balanceSheet(s),profit=C.overview(s).profit;
  s=payLoan(s,'cr-1',50000);
  const l=C.creditReport(s).loans[0],bal=C.balanceSheet(s);
  assert.ok(l.interestDueCents>=0);
  assert.ok(l.remainingCents>0,'Part of payment must cover pro-rata interest');
  assert.ok(C.overview(s).profit<profit);
  assert.ok(bal.accounts.INTEREST_PAYABLE>=0);
  assert.ok(bal.accounts.LOAN_PAYABLE<balanceBefore.accounts.LOAN_PAYABLE);
  sheet(s);
  const copied=C.importSave(C.exportSave(s)).state;
  assert.equal(JSON.stringify(copied),JSON.stringify(s));
});
test('V2.7: partial and complete loan settlement clear all liabilities exactly once',()=>{
  let s=ready(27007);
  s=run(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:3});
  s=advance(s,30);
  let due=C.creditReport(s).loans[0];
  const expenses=C.overview(s).expenses;
  const first=due.interestDueCents+due.duePrincipalCents;
  s=payLoan(s,due.id,first);
  due=C.creditReport(s).loans[0];
  assert.equal(due.duePrincipalCents,0);
  assert.equal(due.interestDueCents,0);
  assert.equal(C.overview(s).expenses,expenses,'Paying interest does not re-recognize interest expense');
  s=payLoan(s,due.id,due.remainingCents);
  due=C.creditReport(s).loans[0];
  assert.equal(due.status,'PAID');assert.equal(due.remainingCents,0);
  assert.equal(C.balanceSheet(s).accounts.LOAN_PAYABLE,0);
  assert.equal(C.balanceSheet(s).accounts.INTEREST_PAYABLE,0);
  reject(s,'CREDITO.PAGAR',{loanId:due.id,amountCents:100});
  sheet(s);
});
test('V2.7: default can be renegotiated without erasing recognized interest and penalties',()=>{
  let s=ready(27008);
  s=run(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:3});
  s=advance(s,61);
  const before=C.creditReport(s).loans[0],interest=before.interestDueCents,fees=before.feesDueCents;
  assert.equal(before.status,'DELINQUENT');assert.ok(fees>0);
  s=run(s,'CREDITO.RENEGOCIAR',{loanId:before.id,termMonths:12});
  const next=C.creditReport(s).loans[0];
  assert.equal(next.renegotiations,1);assert.equal(next.status,'RESTRUCTURED');
  assert.equal(next.remainingCents,before.remainingCents);
  assert.equal(next.interestDueCents,interest);assert.equal(next.feesDueCents,fees);
  reject(s,'CREDITO.RENEGOCIAR',{loanId:before.id,termMonths:6});
  sheet(s);
});
test('V2.7: supplier agreement executes recurring cash purchases and receives stock',()=>{
  let s=initial(27009),b=C.activeBusiness(s);
  const originalCash=C.overview(s).cash;
  s=run(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:b.id,supplierId:'regional',productId:'base',
    quantity:20,periodDays:7,cycles:2});
  assert.equal(C.overview(s).cash,originalCash,'Unfulfilled future commitments are not expenses or cash movements');
  s=advance(s,7);
  let contract=C.creditReport(s).contracts[0];
  assert.equal(contract.fulfilled,1);
  assert.equal(C.activeBusiness(s).purchaseOrders.length,1);
  assert.equal(C.activeBusiness(s).purchaseOrders[0].contractId,contract.id);
  assert.ok(C.overview(s).cash<originalCash);
  sheet(s);
  s=advance(s,8);
  contract=C.creditReport(s).contracts[0];
  assert.equal(contract.status,'COMPLETED');assert.equal(contract.fulfilled,2);
  assert.equal(C.activeBusiness(s).purchaseOrders.length,2);
  assert.equal(C.balanceSheet(s).accounts.CONTRACT_PAYABLE,0);
  sheet(s);
});
test('V2.7: failed automatic order posts a single contract penalty and does not invent inventory',()=>{
  let s=initial(27010);
  s=run(s,'PRODUTO.CADASTRAR',{name:'Mercadoria cara fictícia',costCents:1000000,priceCents:1000000});
  const b=C.activeBusiness(s);
  s=run(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:b.id,supplierId:'regional',productId:'custom-1',
    quantity:10,periodDays:7,cycles:2});
  const old=C.overview(s);
  s=advance(s,7);
  const c=C.creditReport(s).contracts[0],ov=C.overview(s);
  assert.equal(c.missed,1);assert.equal(c.fulfilled,0);
  assert.ok(c.penaltyDueCents>0);
  assert.equal(ov.contractPayable,c.penaltyDueCents);
  assert.equal(C.activeBusiness(s).purchaseOrders.length,0);
  assert.equal(ov.revenue,old.revenue);
  sheet(s);
});
test('V2.7: supplier termination recognizes fee, cancels future orders and can be paid',()=>{
  let s=initial(27011);
  s=run(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:C.activeBusiness(s).id,supplierId:'atacado',
    productId:'base',quantity:10,periodDays:14,cycles:6});
  const contract=C.creditReport(s).contracts[0],future=contract.quantity*contract.unitCostCents*contract.cycles;
  const revenues=C.overview(s).revenue;
  s=run(s,'CONTRATO.FORNECEDOR.RESCINDIR',{contractId:contract.id});
  let c=C.creditReport(s).contracts[0];
  assert.equal(c.status,'TERMINATED');
  assert.equal(c.penaltyDueCents,Math.round(future*.05));
  assert.equal(C.overview(s).revenue,revenues);
  assert.equal(C.balanceSheet(s).accounts.CONTRACT_PAYABLE,c.penaltyDueCents);
  s=run(s,'CONTRATO.FORNECEDOR.PAGAR_PENALIDADE',{contractId:c.id,amountCents:c.penaltyDueCents});
  c=C.creditReport(s).contracts[0];assert.equal(c.penaltyDueCents,0);
  assert.equal(C.balanceSheet(s).accounts.CONTRACT_PAYABLE,0);
  s=advance(s,40);assert.equal(C.activeBusiness(s).purchaseOrders.length,0);
  sheet(s);
});
test('V2.7: contract penalties are idempotent and cancellation blocks repeated charges',()=>{
  let s=initial(27012);
  s=run(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:C.activeBusiness(s).id,supplierId:'regional',
    productId:'base',quantity:5,periodDays:7,cycles:2});
  s=run(s,'CONTRATO.FORNECEDOR.RESCINDIR',{contractId:'cf-1'});
  const snap=JSON.stringify(s),fees=C.creditReport(s).contractFeesOutstanding;
  reject(s,'CONTRATO.FORNECEDOR.RESCINDIR',{contractId:'cf-1'});
  assert.equal(JSON.stringify(s),snap);
  s=advance(s,30);assert.equal(C.creditReport(s).contracts[0].processed,0);
  assert.equal(C.creditReport(s).contractFeesOutstanding,fees);
  sheet(s);
});
test('V2.7: financial calendar separates recognized debt from future commitments',()=>{
  let s=ready(27013);
  s=run(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:12});
  s=run(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:C.activeBusiness(s).id,supplierId:'regional',
    productId:'base',quantity:10,periodDays:7,cycles:3});
  const before=JSON.stringify(s),cal=C.financialCommitmentsReport(s,90);
  assert.ok(cal.recognizedLiabilities>=50000);
  assert.ok(cal.expectedSupplierCents>0);
  assert.ok(cal.expectedLoanCents>0);
  assert.ok(cal.expectedUnrecognizedLoanInterestCents>0);
  assert.ok(cal.events.some(e=>e.certainty==='CONTRACTED_UNPOSTED'));
  assert.ok(cal.events.some(e=>e.certainty==='PROJECTED'));
  assert.equal(cal.cashAfterRecognizedIfPaid,cal.cash-cal.recognizedLiabilities);
  assert.equal(cal.stressCashNoSales,cal.cash-cal.recognizedLiabilities-
    cal.expectedSupplierCents-cal.expectedUnrecognizedLoanInterestCents-cal.fixedOperatingScenarioCents);
  assert.equal(JSON.stringify(s),before,'Reading forecast must never mutate the ledger');
});
test('V2.7: multiple units, loans, suppliers, 90 days, save and full reconciliation',()=>{
  let s=ready(27014);
  s=run(s,'EMPRESA.ABRIR',{sector:'roupas',cityId:'CE-FORTALEZA',lot:1});
  const first=C.businesses(s)[0],second=C.businesses(s)[1];
  s=run(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:6});
  s=run(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:first.id,supplierId:'regional',productId:'base',
    quantity:10,periodDays:14,cycles:4});
  s=run(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:second.id,supplierId:'atacado',productId:'base',
    quantity:10,periodDays:30,cycles:3});
  s=advance(s,90);sheet(s);
  const restored=C.importSave(C.exportSave(s)).state;
  assert.equal(JSON.stringify(restored),JSON.stringify(s));
  sheet(restored);
  assert.equal(C.creditReport(restored).contracts.length,2);
});
test('V2.7: compiled HTML uses updated version, real controls, and one offline script',()=>{
  const html=readFileSync('index.html','utf8');
  assert.match(html,/v2\.7\.0-alpha\.1/);
  for(const id of ['credit-contract-form','credit-summary','credit-loan-list',
    'credit-payment-form','credit-renegotiate-form','supplier-contract-form',
    'supplier-contract-list','credit-calendar-summary','credit-calendar-rows']){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(html,/CONTRATO\.FORNECEDOR\.ASSINAR/);
  assert.equal((html.match(/<script\b/g)||[]).length,1);
  assert.doesNotThrow(()=>new Script([...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)][0][1]));
});

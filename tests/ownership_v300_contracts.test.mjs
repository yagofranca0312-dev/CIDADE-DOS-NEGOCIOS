import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Contratos de responsabilidade e efeitos únicos da V3.0.
// Não altera motor, economia, save ou gameplay; protege a arquitetura da linha V2.
const root=readFileSync('src/core/game.js','utf8');
const uiPaths=['src/ui/app.js','src/ui/company-views.part.js','src/ui/finance-views.part.js',
  'src/ui/logistics-views.part.js','src/ui/market-views.part.js','src/ui/restock-views.part.js'];
const uiFiles=Object.fromEntries(uiPaths.map(path=>[path,readFileSync(path,'utf8')]));
const C=runInNewContext(root+'\nCidadeCore',{});
let seq=0;
const req=(s,type,payload={},id='v300-owner-'+(++seq))=>C.dispatch(s,{id,type,payload});
function doIt(s,type,payload={}){
  const r=req(s,type,payload);assert.equal(r.ok,true,r.error||type);return r.state;
}
function career(seed=300950){
  let s=doIt(null,'CARREIRA.CRIAR',{name:'Auditoria de proprietários',companyName:'Empreendimento fictício',cityId:'CE-TIANGUA',seed});
  return doIt(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});
}
function days(s,n){while(n){const step=Math.min(n,30);s=doIt(s,'TEMPO.AVANCAR_LOTE',{days:step});n-=step;}return s;}
function integrity(s){
  assert.equal(C.validate(s),true);
  assert.equal(C.balanceSheet(s).difference,0);
  assert.equal(C.reconciliationReport(s).ok,true);
}
const count=(s,pattern)=>(s.match(pattern)||[]).length;
const tx=(s,k)=>s.economy.ledger.filter(j=>j.kind===k);
const evt=(s,k)=>s.audit.events.filter(e=>e.type===k);

test('V3.0 ownership: único escritor de journal, evento, comando e calendário; UI não contorna motor',()=>{
  assert.equal(count(root,/\.economy\.ledger\.push\(/g),1,'Um único escritor do ledger');
  assert.equal(count(root,/\.audit\.events\.push\(/g),1,'Um único escritor de eventos');
  assert.equal(count(root,/function dispatch\(/g),1);
  assert.equal(count(root,/function journal\(/g),1);
  assert.equal(count(root,/function event\(/g),1);
  assert.equal(count(root,/function day\(/g),1);
  assert.equal(count(root,/\.calendar\.tick\+\+/g),1);
  assert.equal(count(root,/\.calendar\.date\s*=\s*dateNext\(/g),1);
  assert.equal(count(root,/function registerPurchase\(/g),1);
  assert.equal(count(root,/function registerSale\(/g),1);
  assert.equal(count(uiFiles['src/ui/app.js'],/Core\.dispatch\(/g),1,'UI encaminha por commit único');
  for(const [path,source] of Object.entries(uiFiles)){
    assert.doesNotMatch(source,/\.economy\.ledger\.push\(|\.audit\.events\.push\(|\.calendar\.tick\+\+/,path+' tentou escrever estado autoritativo');
    if(path!=='src/ui/app.js')assert.doesNotMatch(source,/Core\.dispatch\(/,path+' bypass no commit');
  }
  assert.doesNotMatch(root,/\blocalStorage\b|\bwindow\.|\bdocument\./,'Motor não pode depender de navegador');
});

test('V3.0 ownership: quatro entradas de compra executam um pedido, journal e evento cada',()=>{
  const scenarios=[
    {name:'ESTOQUE.COMPRAR',type:'ESTOQUE.COMPRAR',payload:{supplierId:'regional',productId:'base',quantity:10}},
    {name:'COMPRAS.REGISTRAR',type:'COMPRAS.REGISTRAR',payload:{supplierId:'regional',items:[
      {productId:'base',quantity:10},{productId:'extra-1',quantity:7}]}},
    {name:'LOGISTICA.REABASTECER',type:'LOGISTICA.REABASTECER',payload:{supplierId:'regional',productId:'base',quantity:10}},
    {name:'ECONOMIA.COMPRAR_PLANO',type:'ECONOMIA.COMPRAR_PLANO',payload:null}
  ];
  scenarios.forEach((sample,i)=>{
    let s=career(300951+i),b=C.activeBusiness(s);
    if(sample.type==='LOGISTICA.REABASTECER')sample.payload.businessId=b.id;
    if(sample.type==='ECONOMIA.COMPRAR_PLANO'){
      const q=C.operationalBalanceReport(s,'equilibrado');
      assert.ok(q.spendCents>0,sample.name+' não propôs compra');
      sample.payload={businessId:q.businessId,mode:q.mode,revision:q.revision,quoteId:q.quoteId};
    }
    const snapshot=JSON.stringify(s),before=C.overview(s),purchaseCount=tx(s,'PURCHASE').length,events=evt(s,'COMPRA.ENCOMENDADA').length;
    const cmd={id:'v3-owner-purchase-'+i,type:sample.type,payload:sample.payload};
    const applied=C.dispatch(s,cmd);
    assert.equal(applied.ok,true,sample.name+': '+applied.error);
    assert.equal(JSON.stringify(s),snapshot,sample.name+' mutou snapshot original');
    s=applied.state;b=C.activeBusiness(s);
    assert.equal(tx(s,'PURCHASE').length,purchaseCount+1,sample.name+' duplicou compra contábil');
    assert.equal(evt(s,'COMPRA.ENCOMENDADA').length,events+1,sample.name+' duplicou pedido');
    assert.equal(b.purchaseOrders.length,1,sample.name+' duplicou ordem');
    assert.equal(C.overview(s).revenue,before.revenue,sample.name+' inventou receita');
    assert.equal(C.overview(s).cogs,before.cogs,sample.name+' gerou CMV sem venda');
    assert.equal(C.dispatch(s,cmd).status,'DUPLICATE',sample.name+' aceita retry indevido');
    integrity(s);
  });
});

test('V3.0 ownership: venda manual rejeitada e uma única venda por unidade/dia após recebimento',()=>{
  let s=career(300955),base=C.overview(s),snapshot=JSON.stringify(s);
  const rejected=req(s,'VENDA.REGISTRAR',{productId:'base',quantity:5});
  assert.equal(rejected.ok,false);
  assert.equal(JSON.stringify(s),snapshot);
  s=doIt(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:150});
  assert.equal(C.overview(s).revenue,base.revenue,'Compra não cria venda');
  s=days(s,1);
  assert.equal(C.overview(s).revenue,base.revenue,'Pedido ainda não estava disponível durante a demanda inicial');
  s=days(s,1);
  const sales=tx(s,'SALE'),finished=evt(s,'VENDA.CONCLUIDA');
  assert.equal(sales.length,finished.length,'Vendas no razão e eventos não conciliam em quantidade');
  assert.ok(sales.length<=1,'Só houve um dia com estoque para esta unidade');
  assert.equal(evt(s,'DIA.ENCERRADO').length,2);
  assert.equal(s.calendar.tick,2);
  integrity(s);
});

test('V3.0 ownership: tempo aplica um único dia e retry não repete despesas ou eventos',()=>{
  const s=career(300956),before=JSON.stringify(s),cmd={id:'v300-owner-day-fixed',type:'TEMPO.AVANCAR_DIA',payload:{}};
  const result=C.dispatch(s,cmd);
  assert.equal(result.ok,true,result.error);
  const after=result.state;
  assert.equal(after.calendar.tick,s.calendar.tick+1);
  assert.equal(evt(after,'DIA.ENCERRADO').length,evt(s,'DIA.ENCERRADO').length+1);
  assert.equal(tx(after,'DAILY_EXPENSE').length,tx(s,'DAILY_EXPENSE').length+1);
  const again=C.dispatch(after,cmd);
  assert.equal(again.status,'DUPLICATE');
  assert.equal(JSON.stringify(again.state),JSON.stringify(after));
  assert.equal(JSON.stringify(s),before,'Calendário da versão anterior foi alterado');
  integrity(after);
});

test('V3.0 ownership: contrato de fornecedor cria uma compra e um único ciclo, sem novo capital',()=>{
  let s=career(300957),businessId=C.activeBusiness(s).id,base=C.overview(s);
  s=doIt(s,'CONTRATO.FORNECEDOR.ASSINAR',{
    businessId,supplierId:'regional',productId:'base',quantity:10,periodDays:7,cycles:2});
  assert.equal(tx(s,'PURCHASE').length,0,'Contrato futuro não é compra realizada');
  assert.equal(C.overview(s).cash,base.cash);
  s=days(s,7);
  assert.equal(C.creditReport(s).contracts[0].fulfilled,1);
  assert.equal(tx(s,'PURCHASE').length,1,'Primeiro ciclo deve emitir apenas um journal de compra');
  assert.equal(evt(s,'COMPRA.ENCOMENDADA').length,1);
  assert.equal(evt(s,'CONTRATO.FORNECEDOR.CUMPRIDO').length,1);
  assert.equal(C.activeBusiness(s).purchaseOrders.length,1);
  const quote=C.operationalBalanceReport(s,'equilibrado');
  assert.equal(quote.products.every(x=>x.incomingQty>=0),true);
  integrity(s);
});

test('V3.0 ownership: estimativa de folha bate com competência, e pagamento não reapura despesa',()=>{
  let s=career(300958),businessId=C.activeBusiness(s).id;
  s=days(s,15);
  s=doIt(s,'RH.CONTRATAR',{businessId,name:'Profissional de teste',role:'atendimento'});
  s=days(s,5);
  const employeeId=C.rhReport(s).units[0].employees[0].id;
  s=doIt(s,'RH.DESLIGAR',{employeeId});
  const estimated=C.estimatedPayrollMonth(s,businessId,'2026-11');
  assert.ok(estimated>0);
  s=days(s,10);
  assert.equal(tx(s,'PAYROLL_ACCRUAL').length,1);
  assert.equal(evt(s,'RH.FOLHA_APURADA').length,1);
  assert.equal(C.rhReport(s).units[0].payrolls[0].amount,estimated,'Desvio entre estimativa e apuração');
  const expense=C.incomeStatement(s).expenses;
  const amount=C.rhReport(s).units[0].payrolls[0].amount;
  const cmd={id:'v300-owner-payroll-pay-once',type:'RH.PAGAR_FOLHA',payload:{businessId,period:'2026-11'}};
  const response=C.dispatch(s,cmd);
  assert.equal(response.ok,true,response.error);s=response.state;
  assert.equal(tx(s,'PAYROLL_PAYMENT').length,1);
  assert.equal(C.incomeStatement(s).expenses,expense,'Baixa não pode duplicar despesa');
  assert.equal(C.rhReport(s).pendingCents,0);
  assert.equal(C.dispatch(s,cmd).status,'DUPLICATE');
  assert.ok(amount>0);
  integrity(s);
});

test('V3.0 ownership: fiscal operacional só registra encerramento, não calcula tributo novo',()=>{
  let s=career(300959),businessId=C.activeBusiness(s).id;
  s=doIt(s,'FISCAL_OP.ATIVAR',{businessId,acceptSimulation:true});
  s=days(s,30);
  for(const task of ['vendas','estoque','razao'])s=doIt(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId,period:'2026-11',task});
  const before=JSON.stringify(s.economy.ledger),cash=C.overview(s).cash,tax=C.overview(s).taxPayable;
  const cmd={id:'v300-owner-fiscal-close',type:'FISCAL_OP.FECHAR',payload:{businessId,period:'2026-11'}};
  const r=C.dispatch(s,cmd);assert.equal(r.ok,true,r.error);s=r.state;
  assert.equal(JSON.stringify(s.economy.ledger),before,'Fiscal operacional alterou ledger');
  assert.equal(C.overview(s).cash,cash);
  assert.equal(C.overview(s).taxPayable,tax);
  assert.equal(evt(s,'FISCAL_OP.FECHADO').length,1);
  assert.equal(C.dispatch(s,cmd).status,'DUPLICATE');
  integrity(s);
});

test('V3.0 ownership: relatórios, exportações e importações não criam transações',()=>{
  let s=career(300960);
  s=doIt(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:60});
  s=days(s,4);
  const before=JSON.stringify(s),ledger=s.economy.ledger.length,events=s.audit.events.length;
  for(let i=0;i<2;i++){
    C.overview(s);C.qualityReport(s,30);C.operationalBalanceReport(s,'equilibrado');
    C.incomeStatement(s);C.balanceSheet(s);C.cashFlowStatement(s);C.reconciliationReport(s);
    C.financialCommitmentsReport(s,30);C.logisticsReport(s);C.creditReport(s);C.progressionReport(s);
    C.exportSave(s);C.exportSaveCompact(s);
  }
  assert.equal(JSON.stringify(s),before);
  for(const data of [C.exportSave(s),C.exportSaveCompact(s)]){
    const imported=C.importSave(data).state;
    assert.equal(JSON.stringify(imported),before);
    assert.equal(imported.economy.ledger.length,ledger);
    assert.equal(imported.audit.events.length,events);
    integrity(imported);
  }
});

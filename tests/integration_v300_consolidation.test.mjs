import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Regressões de integração da V3.0: sistemas homologados da V2 e Patch A convivem
// na mesma carreira. Não depende de rede, navegador nem save real do titular.
const load=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const C=load('src/core/game.js');
const Legacy=load('tests/fixtures/core_v1_7_0.js');
let sequence=0;
const send=(state,type,payload={},id='v300-cross-'+(++sequence))=>C.dispatch(state,{id,type,payload});
function go(state,type,payload={}){
  const result=send(state,type,payload);
  assert.equal(result.ok,true,result.error||type);
  return result.state;
}
function start(seed=300910){
  let state=go(null,'CARREIRA.CRIAR',{name:'Integração V3',companyName:'Rede de Teste Fictícia',cityId:'CE-TIANGUA',seed});
  return go(state,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});
}
function advance(state,days){
  while(days>0){const n=Math.min(30,days);state=go(state,'TEMPO.AVANCAR_LOTE',{days:n});days-=n;}
  return state;
}
function integratedIntegrity(state){
  C.validate(state);
  const sheet=C.balanceSheet(state),reconciled=C.reconciliationReport(state);
  assert.equal(sheet.balanced,true,'Balanço desbalanceado');
  assert.equal(sheet.difference,0,'Diferença no balanço');
  assert.equal(reconciled.ok,true,JSON.stringify(reconciled.errors));
  assert.equal(sheet.accounts.INTERNAL_CLEARING||0,0,'Compensação interfilial pendente');
}
function roundtrips(state){
  const snapshot=JSON.stringify(state);
  for(const [format,encoded] of [['V1 tradicional',C.exportSave(state)],['V2 compacto',C.exportSaveCompact(state)]]){
    const decoded=C.importSave(encoded);
    assert.equal(decoded.migrated,false,format+' migrou save schema 9 indevidamente');
    assert.equal(JSON.stringify(decoded.state),snapshot,format+' alterou campos, saldos ou ordem');
    integratedIntegrity(decoded.state);
  }
}

test('V3.0 consolidação: crédito, contratos, RH, fiscal operacional, paralegal, concorrência e transferências coexistem',()=>{
  let s=start(300911),first=C.activeBusiness(s).id;
  s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:200});
  s=advance(s,7);
  assert.ok(C.creditReport(s).eligibility.availableCents>=50000);
  const previousRevenue=C.overview(s).revenue;
  s=go(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:6});
  assert.equal(C.overview(s).revenue,previousRevenue,'Financiamento não é receita');
  s=go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:2});
  const second=C.activeBusiness(s).id;
  s=go(s,'MUNDO.CONCORRENCIA_ATIVAR');
  s=go(s,'RH.CONTRATAR',{businessId:first,name:'Colaboradora Teste',role:'atendimento'});
  s=go(s,'FISCAL_OP.ATIVAR',{businessId:first,acceptSimulation:true});
  s=go(s,'PARALEGAL.PROTOCOLAR',{businessId:first,service:'cadastro'});
  s=go(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:first,supplierId:'regional',productId:'base',quantity:10,periodDays:7,cycles:2});
  const before=C.overview(s);
  s=go(s,'LOGISTICA.TRANSFERIR',{fromId:first,toId:second,productId:'base',quantity:10});
  assert.equal(C.overview(s).revenue,before.revenue,'Remanejamento não gera receita');
  assert.equal(C.overview(s).cogs,before.cogs,'Remanejamento não gera CMV');
  integratedIntegrity(s);
  s=advance(s,26);
  integratedIntegrity(s);
  assert.equal(C.businesses(s).length,2);
  assert.equal(C.creditReport(s).loans.length,1);
  assert.equal(C.creditReport(s).contracts.length,1);
  assert.equal(C.rhReport(s).totalActive,1);
  assert.ok(C.rhReport(s).pendingCents>0,'Folha do período deve ser reconhecida');
  assert.ok(C.fiscalOperationsReport(s).openPeriods>=1);
  assert.equal(C.paralegalReport(s).find(x=>x.businessId===first)?.processes.find(x=>x.service==='cadastro')?.status,'CONCLUIDO');
  assert.equal(C.rivalMarketReport(s).enabled,true);
  assert.equal(C.logisticsReport(s).transfers[0].status,'RECEIVED');
  assert.equal(C.balanceSheet(s).accounts.INTERNAL_CLEARING,0);
  roundtrips(s);
});

test('V3.0 consolidação: Patch A e módulos V2 mantêm saves intactos após folha e passagem do tempo',()=>{
  let s=start(300912),businessId=C.activeBusiness(s).id;
  const plan=C.operationalBalanceReport(s,'equilibrado');
  assert.ok(plan.spendCents>0&&plan.lines.length>0,'Plano econômico deveria propor compra inicial');
  const cmd={id:'v300-integrated-purchase-1',type:'ECONOMIA.COMPRAR_PLANO',payload:{
    businessId:plan.businessId,mode:plan.mode,revision:plan.revision,quoteId:plan.quoteId}};
  const first=C.dispatch(s,cmd);
  assert.equal(first.ok,true,first.error);
  s=first.state;
  assert.equal(C.dispatch(s,cmd).status,'DUPLICATE');
  s=go(s,'RH.CONTRATAR',{businessId,name:'Equipe Integrada',role:'atendimento'});
  s=go(s,'FISCAL_OP.ATIVAR',{businessId,acceptSimulation:true});
  s=advance(s,30);
  integratedIntegrity(s);
  const original=JSON.stringify(s);
  // Todos os painéis abaixo devem ser consultas, sem alterar calendário, RNG ou razão.
  C.qualityReport(s,30);
  C.progressionReport(s);
  C.operationalBalanceReport(s,'conservador');
  C.creditReport(s);C.financialCommitmentsReport(s,90);
  C.rhReport(s);C.fiscalOperationsReport(s);C.logisticsReport(s);
  C.incomeStatement(s);C.cashFlowStatement(s);C.balanceSheet(s);C.reconciliationReport(s);
  assert.equal(JSON.stringify(s),original,'Consulta gerencial mudou estado do jogo');
  roundtrips(s);
});

test('V3.0 consolidação: save da V1.7 migra sem reescrever ledger e sem ativação retroativa',()=>{
  const legacyId=Legacy.CITIES.find(c=>c.name==='Tianguá').id;
  let old=Legacy.dispatch(null,{type:'CARREIRA.CRIAR',id:'v3-legacy-create',
    payload:{name:'Carreira Legada',companyName:'Comércio Antigo',cityId:legacyId,seed:91919}}).state;
  old=Legacy.dispatch(old,{type:'EMPRESA.ABRIR',id:'v3-legacy-open',payload:{sector:'mercado',lot:1}}).state;
  old=Legacy.dispatch(old,{type:'ESTOQUE.COMPRAR',id:'v3-legacy-stock',
    payload:{supplierId:'regional',productId:'base',quantity:80}}).state;
  old=Legacy.dispatch(old,{type:'TEMPO.AVANCAR_LOTE',id:'v3-legacy-days',payload:{days:30}}).state;
  const prevLedger=JSON.stringify(old.economy.ledger),prevEvents=JSON.stringify(old.audit.events),prevCash=Legacy.overview(old).cash;
  const migrated=C.importSave(Legacy.exportSave(old));
  assert.equal(migrated.migrated,true);
  assert.equal(migrated.state.schemaVersion,9);
  assert.equal(JSON.stringify(migrated.state.economy.ledger),prevLedger);
  assert.equal(JSON.stringify(migrated.state.audit.events),prevEvents);
  assert.equal(C.overview(migrated.state).cash,prevCash);
  assert.equal(migrated.state.fiscal.coverageStatus,'NOT_COVERED');
  assert.equal(C.creditReport(migrated.state).principalOutstanding,0);
  assert.equal(C.rhReport(migrated.state).totalActive,0);
  assert.equal(C.logisticsReport(migrated.state).enabled,false);
  assert.equal(C.rivalMarketReport(migrated.state).enabled,false);
  integratedIntegrity(migrated.state);
  roundtrips(migrated.state);
});

test('V3.0 consolidação: corrupções e comandos repetidos não prejudicam snapshot íntegro',()=>{
  let s=start(300913);
  s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:30});
  const raw=JSON.stringify(s);
  const invalid=JSON.parse(C.exportSave(s));
  invalid.payload.economy.ledger[0].entries[0].debit+=100;
  assert.throws(()=>C.importSave(JSON.stringify(invalid)),/Checksum/);
  const compact=JSON.parse(C.exportSaveCompact(s));
  compact.checksum='00000000';
  assert.throws(()=>C.importSave(JSON.stringify(compact)),/Checksum/);
  const request={id:'v300-id-reused',type:'TEMPO.AVANCAR_DIA',payload:{}};
  const first=C.dispatch(s,request);
  assert.equal(first.ok,true,first.error);
  assert.equal(C.dispatch(first.state,request).status,'DUPLICATE');
  assert.equal(C.dispatch(first.state,{...request,payload:{days:30}}).ok,false);
  assert.equal(JSON.stringify(s),raw,'Operação inválida alterou origem');
  assert.equal(JSON.stringify(C.importSave(C.exportSave(s)).state),raw);
  integratedIntegrity(first.state);
});

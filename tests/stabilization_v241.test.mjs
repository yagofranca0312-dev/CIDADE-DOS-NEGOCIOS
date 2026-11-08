import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let n=0;
function act(state,type,payload={},id='v241-'+(++n)){
  const result=Core.dispatch(state,{type,payload,id});
  assert.equal(result.ok,true,result.error||type);
  return result.state;
}
function start(units=1){
  let s=act(null,'CARREIRA.CRIAR',{name:'Pessoa fictícia',companyName:'Rede Fictícia',cityId:'CE-TIANGUA',seed:340145});
  for(let i=0;i<units;i++)s=act(s,'EMPRESA.ABRIR',{sector:['mercado','padaria','roupas'][i],cityId:'CE-TIANGUA',lot:i+1});
  return s;
}
function days(s,count){
  while(count>0){const step=Math.min(30,count);s=act(s,'TEMPO.AVANCAR_LOTE',{days:step});count-=step;}
  return s;
}
function injectTestCapital(s,cents){
  // APENAS fixture isolada: prepara liquidez para testar a baixa sem adicionar comando de aporte ao jogo.
  const clone=JSON.parse(JSON.stringify(s));
  clone.economy.ledger.push({id:'jnl-'+(++clone.economy.journalSeq),date:clone.calendar.date,kind:'CAPITAL',
    memo:'Aporte de teste isolado',entries:[
      {account:'CASH',debit:cents,credit:0},{account:'CAPITAL',debit:0,credit:cents}]});
  Core.validate(clone);return clone;
}

test('V3.0.0: passivos diários observados por unidade sem confundir RH ou tributos',()=>{
  let s=days(start(3),10);
  const report=Core.operatingPayablesReport(s);
  assert.equal(report.units.length,3);
  assert.ok(report.units.every(u=>u.outstanding>0));
  assert.equal(report.total,Core.overview(s).payable);
  assert.equal(report.unclassified,0);
  assert.equal(Core.reconciliationReport(s).ok,true);
});
test('V3.0.0: quitação parcial reduz PAYABLE e CASH, nunca repete EXPENSE',()=>{
  let s=injectTestCapital(days(start(3),10),100000);
  const id=s.world.business.id,amount=10000,before=Core.overview(s);
  const expense=Core.incomeStatement(s).expenses;
  const result=Core.dispatch(s,{id:'pay-once',type:'PAYABLES.PAGAR_OPERACIONAL',payload:{businessId:id,amountCents:amount}});
  assert.equal(result.ok,true,result.error);
  s=result.state;
  assert.equal(Core.overview(s).cash,before.cash-amount);
  assert.equal(Core.overview(s).payable,before.payable-amount);
  assert.equal(Core.incomeStatement(s).expenses,expense);
  assert.equal(Core.cashFlowStatement(s).categories.operatingSettlements,amount);
  assert.equal(Core.operatingPayablesReport(s).units[0].paid,amount);
  assert.equal(Core.reconciliationReport(s).ok,true);
  assert.equal(Core.dispatch(s,{id:'pay-once',type:'PAYABLES.PAGAR_OPERACIONAL',payload:{businessId:id,amountCents:amount}}).status,'DUPLICATE');
  assert.equal(Core.dispatch(s,{id:'new-overpay',type:'PAYABLES.PAGAR_OPERACIONAL',
    payload:{businessId:id,amountCents:10000000}}).ok,false);
});
test('V3.0.0: guardas de caixa, unidade, valor, passivo e comando não alteram save',()=>{
  let s=days(start(3),10);
  const raw=JSON.stringify(s),id=s.world.business.id;
  for(const payload of [
    {businessId:'unknown',amountCents:1},{businessId:id,amountCents:-1},
    {businessId:id,amountCents:0},{businessId:id,amountCents:1.5},
    {businessId:id,amountCents:10000000}]){
    const response=Core.dispatch(s,{id:'invalid-'+(++n),type:'PAYABLES.PAGAR_OPERACIONAL',payload});
    assert.equal(response.ok,false);assert.equal(JSON.stringify(s),raw);
  }
});
test('V3.0.0: pagamento operacional não liquida folha de RH já apurada',()=>{
  let s=start(3);
  s=act(s,'RH.CONTRATAR',{businessId:s.world.business.id,name:'Equipe Fictícia',role:'atendimento'});
  s=injectTestCapital(days(s,30),450000);
  const before=Core.rhReport(s).pendingCents;
  assert.ok(before>0);
  const ops=Core.operatingPayablesReport(s);
  assert.equal(ops.unclassified,0);
  const id=s.world.business.id;
  s=act(s,'PAYABLES.PAGAR_OPERACIONAL',{businessId:id,amountCents:10000});
  assert.equal(Core.rhReport(s).pendingCents,before);
  assert.equal(Core.operatingPayablesReport(s).total,ops.total-10000);
  s=act(s,'RH.PAGAR_FOLHA',{businessId:id,period:'2026-11'});
  assert.equal(Core.rhReport(s).pendingCents,0);
  assert.equal(Core.operatingPayablesReport(s).total,ops.total-10000);
  assert.equal(Core.reconciliationReport(s).ok,true);
});
test('V3.0.0: folha prevista é passivo, não saída automática de caixa',()=>{
  let s=start();
  const base=Core.strategyReport(s,30);
  s=act(s,'RH.CONTRATAR',{businessId:s.world.business.id,name:'Equipe Projetada',role:'atendimento'});
  const before=JSON.stringify(s),p=Core.strategyReport(s,30);
  assert.equal(p.projectedPayrollAccrual,150000);
  assert.equal(p.projectedCash,base.projectedCash);
  assert.equal(p.projectedProfit,base.projectedProfit-150000);
  assert.equal(p.projectedPayable,base.projectedPayable+150000);
  assert.equal(p.knownObligations.tax,0);
  assert.equal(JSON.stringify(s),before);
});
test('V3.0.0: save exportado após quitação importa e detecta corrupção',()=>{
  let s=injectTestCapital(days(start(3),10),120000);
  s=act(s,'PAYABLES.PAGAR_OPERACIONAL',{businessId:s.world.business.id,amountCents:5000});
  const raw=Core.exportSave(s),imported=Core.importSave(raw);
  assert.equal(imported.state.schemaVersion,9);
  assert.equal(JSON.stringify(imported.state),JSON.stringify(s));
  assert.equal(Core.operatingPayablesReport(imported.state).total,Core.operatingPayablesReport(s).total);
  assert.throws(()=>Core.importSave(raw.replace('Aporte de teste isolado','Aporte adulterado')),/Checksum/);
});
test('V3.0.0: novos controles ficam no HTML único e script compilado é sintaticamente válido',()=>{
  const tpl=readFileSync('src/shell/index.template.html','utf8');
  const app=readFileSync('src/ui/app.js','utf8'),html=readFileSync('index.html','utf8');
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.version,'3.0.0');
  for(const id of ['payable-operating-form','payable-operating-unit','restore-prior-save-btn','safety-backup-status'])
    assert.ok(tpl.includes('id="'+id+'"'));
  assert.match(app,/SAFETY_KEY/);
  assert.match(app,/backupCurrent\(\)/);
  assert.match(app,/if\(!await persistDurable\(incoming\.state\)\)/);
  assert.match(app,/if\(!await persistDurable\(result\.state\)\)return false;/);
  assert.match(html,/const VERSION = '3\.0\.0-alpha\.1'/);
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new Script(scripts[0][1]));
});

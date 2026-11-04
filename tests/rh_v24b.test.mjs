import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
const request=(state,type,payload={},id='v24b-'+(++seq))=>Core.dispatch(state,{id,type,payload});
function apply(state,type,payload={}){const result=request(state,type,payload);assert.equal(result.ok,true,result.error||type);return result.state;}
function career(){let s=apply(null,'CARREIRA.CRIAR',{name:'Teste RH',companyName:'Rede Teste',cityId:'CE-TIANGUA',seed:443322});return apply(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});}
const unit=s=>Core.activeBusiness(s).id;
const hire=(s,name='Lia Fictícia',role='atendimento')=>apply(s,'RH.CONTRATAR',{businessId:unit(s),name,role});
const advance=(s,days)=>{while(days>0){const d=Math.min(days,30);s=apply(s,'TEMPO.AVANCAR_LOTE',{days:d});days-=d;}return s;};

test('RH-B: sem folha retroativa, contratação sem custo imediato e schema 9',()=>{
 let s=career();const cash=Core.overview(s).cash,ledger=s.economy.ledger.length;
 assert.equal(Core.VERSION,'2.4.1-rc.1');assert.equal(s.schemaVersion,9);
 assert.equal(Core.rhReport(s).totalActive,0);assert.equal(Core.rhReport(s).pendingCents,0);
 s=hire(s);assert.equal(Core.overview(s).cash,cash);assert.equal(s.economy.ledger.length,ledger);
 assert.equal(Core.rhReport(s).units[0].activeCount,1);
});
test('RH-B: cargos, unidade, limites e bônus máximo',()=>{
 let s=career();
 assert.equal(request(s,'RH.CONTRATAR',{businessId:'x',name:'Ana',role:'gestao'}).ok,false);
 assert.equal(request(s,'RH.CONTRATAR',{businessId:unit(s),name:'Ana',role:'invalido'}).ok,false);
 assert.equal(request(s,'RH.CONTRATAR',{businessId:unit(s),name:'',role:'gestao'}).ok,false);
 for(let i=0;i<4;i++)s=hire(s,'Personagem '+i,'logistica');
 assert.equal(Core.rhReport(s).units[0].activeCount,4);
 assert.equal(request(s,'RH.CONTRATAR',{businessId:unit(s),name:'Quinto',role:'atendimento'}).ok,false);
 assert.equal(Core.rhReport(s).units[0].bonusPercent,25);
});
test('RH-B: idempotência e produtividade auditada; desligamento',()=>{
 let s=career(),payload={businessId:unit(s),name:'Carol',role:'atendimento'};
 let first=request(s,'RH.CONTRATAR',payload,'rh-contract-1');assert.equal(first.ok,true,first.error);s=first.state;
 assert.equal(request(s,'RH.CONTRATAR',payload,'rh-contract-1').status,'DUPLICATE');
 assert.equal(Core.rhReport(s).units[0].bonusPercent,6);
 s=advance(s,1);
 assert.equal(s.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA').at(-1).data.staffBonusPercent,6);
 const id=Core.rhReport(s).units[0].employees[0].id;
 s=apply(s,'RH.DESLIGAR',{employeeId:id});
 assert.equal(Core.rhReport(s).units[0].activeCount,0);
 assert.equal(request(s,'RH.DESLIGAR',{employeeId:id}).ok,false);
});
test('RH-B: competência, pagamento separado, DRE, caixa, balanço e conciliação',()=>{
 let s=hire(career()),businessId=unit(s);s=advance(s,30);
 assert.equal(s.calendar.date,'2026-12-01');
 const due=Core.rhReport(s).units[0].payrolls[0];
 assert.equal(due.period,'2026-11');assert.equal(due.amount,150000);assert.equal(due.status,'OPEN');
 assert.equal(s.economy.ledger.filter(j=>j.kind==='PAYROLL_ACCRUAL').length,1);
 assert.equal(Core.incomeStatement(s,'month','2026-11-01').payrollExpenses,150000);
 const cash=Core.overview(s).cash;
 let first=request(s,'RH.PAGAR_FOLHA',{businessId,period:'2026-11'},'rh-pay-once');
 assert.equal(first.ok,true,first.error);s=first.state;
 assert.equal(Core.overview(s).cash,cash-150000);
 assert.equal(Core.rhReport(s).units[0].payrolls[0].status,'PAID');
 assert.equal(Core.cashFlowStatement(s).categories.payroll,150000);
 assert.equal(Core.cashFlowStatement(s).reconciled,true);
 assert.equal(Core.balanceSheet(s).balanced,true);assert.equal(Core.reconciliationReport(s).ok,true);
 assert.equal(request(s,'RH.PAGAR_FOLHA',{businessId,period:'2026-11'}).ok,false);
 assert.equal(request(s,'RH.PAGAR_FOLHA',{businessId,period:'2026-11'},'rh-pay-once').status,'DUPLICATE');
});
test('RH-B: salário pró-rata de contratação e desligamento',()=>{
 let s=career();s=advance(s,15);s=hire(s,'Teste Prorata');
 const id=Core.rhReport(s).units[0].employees[0].id;
 s=advance(s,5);s=apply(s,'RH.DESLIGAR',{employeeId:id});s=advance(s,10);
 const p=Core.rhReport(s).units[0].payrolls[0];
 assert.equal(p.period,'2026-11');assert.equal(p.amount,30000);
});
test('RH-B: exportação/importação preservam histórico e folha',()=>{
 let s=hire(career());s=advance(s,30);
 const before=JSON.stringify(Core.rhReport(s)),restored=Core.importSave(Core.exportSave(s));
 assert.equal(restored.migrated,false);assert.equal(restored.state.schemaVersion,9);
 assert.equal(JSON.stringify(Core.rhReport(restored.state)),before);
 assert.equal(Core.balanceSheet(restored.state).balanced,true);
});
test('RH-B: interface + HTML compilado offline sintaticamente íntegros',()=>{
 const tpl=readFileSync('src/shell/index.template.html','utf8'),ui=readFileSync('src/ui/app.js','utf8'),html=readFileSync('index.html','utf8');
 assert.match(tpl,/id="rh-hire-form"/);assert.match(tpl,/id="rh-unit-list"/);
 assert.match(ui,/function renderRH/);assert.match(ui,/RH\.PAGAR_FOLHA/);
 assert.match(tpl,/sem validade trabalhista ou previdenciária/);
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
 assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][1]));
 assert.match(html,/const VERSION = '2\.4\.1-rc\.1'/);
});

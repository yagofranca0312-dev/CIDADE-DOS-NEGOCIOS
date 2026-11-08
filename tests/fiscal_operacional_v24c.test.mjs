import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let sequence=0;
function request(state,type,payload={},id='v24c-'+(++sequence)){
  return Core.dispatch(state,{id,type,payload});
}
function apply(state,type,payload={}){
  const result=request(state,type,payload);
  assert.equal(result.ok,true,result.error||type);
  return result.state;
}
function career(){
  let state=apply(null,'CARREIRA.CRIAR',{name:'Teste Fiscal Operacional',companyName:'Rede de Testes',cityId:'CE-TIANGUA',seed:19042026});
  return apply(state,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});
}
const unit=state=>Core.businesses(state)[0].id;
const activate=state=>apply(state,'FISCAL_OP.ATIVAR',{businessId:unit(state),acceptSimulation:true});
function advance(state,days){
  while(days>0){const amount=Math.min(days,30);state=apply(state,'TEMPO.AVANCAR_LOTE',{days:amount});days-=amount;}
  return state;
}
const row=(s,period='2026-11',id=unit(s))=>Core.fiscalOperationsReport(s).units.find(u=>u.businessId===id)?.periods.find(p=>p.period===period);

test('C: opt-in, schema 9 e carreira antiga sem pendências operacionais automáticas',()=>{
 let s=career(),before=Core.exportSave(s);
 assert.equal(Core.VERSION,'3.0.0');
 assert.equal(s.schemaVersion,9);
 assert.equal(Core.fiscalOperationsReport(s).openPeriods,0);
 assert.equal(Core.fiscalOperationsReport(s).units[0].activatedAt,null);
 assert.equal(Core.exportSave(s),before,'relatório é consulta pura');
 s=advance(s,30);
 assert.equal(Core.fiscalOperationsReport(s).openPeriods,0);
 assert.equal(s.audit.events.some(x=>x.type.startsWith('FISCAL_OP.')),false);
});
test('C: ativação requer consentimento e unidade válida; não existe competência anterior',()=>{
 let s=advance(career(),45),id=unit(s);
 assert.equal(s.calendar.date,'2026-12-16');
 assert.equal(request(s,'FISCAL_OP.ATIVAR',{businessId:id}).ok,false);
 assert.equal(request(s,'FISCAL_OP.ATIVAR',{businessId:'est-999',acceptSimulation:true}).ok,false);
 s=activate(s);
 assert.equal(Core.fiscalOperationsReport(s).units[0].activatedAt,'2026-12-16');
 assert.equal(row(s,'2026-11'),undefined);
 assert.equal(Core.fiscalOperationsReport(s).openPeriods,0);
 assert.equal(request(s,'FISCAL_OP.ATIVAR',{businessId:id,acceptSimulation:true}).ok,false);
 s=advance(s,16);
 assert.ok(row(s,'2026-12'));
 assert.equal(row(s,'2026-11'),undefined);
});
test('C: calendário e alertas são apenas vencimentos internos do jogo',()=>{
 let s=activate(career());s=advance(s,30);
 const p=row(s),expected=['2026-12-05','2026-12-08','2026-12-12'];
 assert.equal(s.calendar.date,'2026-12-01');
 assert.deepEqual(Array.from(p.tasks.map(x=>x.dueDate)),expected);
 assert.equal(p.dueDate,'2026-12-15');
 assert.equal(p.status,'EM_ANDAMENTO');
 s=advance(s,16);
 assert.equal(row(s).status,'ATRASADO');
 assert.equal(Core.fiscalOperationsReport(s).overdueTasks,3);
 assert.equal(row(s).tasks.every(x=>x.status==='ATRASADA'),true);
});
test('C: bloqueia competência aberta, tarefa desconhecida e fechamento prematuro',()=>{
 let s=activate(career()),id=unit(s);
 assert.equal(request(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId:id,period:'2026-11',task:'vendas'}).ok,false);
 s=advance(s,30);
 assert.equal(request(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId:id,period:'2026-11',task:'IRPJ'}).ok,false);
 assert.equal(request(s,'FISCAL_OP.FECHAR',{businessId:id,period:'2026-11'}).ok,false);
 assert.equal(request(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId:id,period:'2026-10',task:'vendas'}).ok,false);
});
test('C: três revisões e fechamento idempotentes, sem lançamento econômico ou tributo novo',()=>{
 let s=advance(activate(career()),30),id=unit(s);
 const ledgerBefore=JSON.stringify(s.economy.ledger),cashBefore=Core.overview(s).cash;
 for(const task of ['vendas','estoque','razao'])s=apply(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId:id,period:'2026-11',task});
 assert.equal(row(s).canClose,true);
 assert.equal(request(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId:id,period:'2026-11',task:'vendas'}).ok,false);
 const payload={businessId:id,period:'2026-11'};
 const first=request(s,'FISCAL_OP.FECHAR',payload,'fiscal-closure-once');
 assert.equal(first.ok,true,first.error);
 s=first.state;
 assert.equal(request(s,'FISCAL_OP.FECHAR',payload,'fiscal-closure-once').status,'DUPLICATE');
 assert.equal(request(s,'FISCAL_OP.FECHAR',payload).ok,false);
 assert.equal(row(s).status,'FECHADO');
 assert.equal(Core.overview(s).cash,cashBefore);
 assert.equal(JSON.stringify(s.economy.ledger),ledgerBefore);
 assert.equal(Core.overview(s).taxPayable,0);
 assert.equal(Core.balanceSheet(s).balanced,true);
 assert.equal(Core.reconciliationReport(s).ok,true);
});
test('C: competência pertence a cada unidade; fechado em uma não fecha outra',()=>{
 let s=career(),first=unit(s);
 s=apply(s,'EMPRESA.ABRIR',{sector:'roupas',cityId:'CE-TIANGUA',lot:2});
 const second=Core.businesses(s).find(x=>x.id!==first).id;
 s=apply(s,'FISCAL_OP.ATIVAR',{businessId:first,acceptSimulation:true});
 s=apply(s,'FISCAL_OP.ATIVAR',{businessId:second,acceptSimulation:true});
 s=advance(s,30);
 for(const task of ['vendas','estoque','razao'])s=apply(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId:first,period:'2026-11',task});
 s=apply(s,'FISCAL_OP.FECHAR',{businessId:first,period:'2026-11'});
 assert.equal(row(s,'2026-11',first).status,'FECHADO');
 assert.equal(row(s,'2026-11',second).status,'EM_ANDAMENTO');
 assert.equal(Core.fiscalOperationsReport(s).closedPeriods,1);
 assert.equal(Core.fiscalOperationsReport(s).openPeriods,1);
});
test('C: RH e Paralegal coexistem e cenário tributário antigo permanece opt-in',()=>{
 let s=career(),id=unit(s);
 s=apply(s,'RH.CONTRATAR',{businessId:id,name:'Funcionário Fictício',role:'atendimento'});
 s=apply(s,'PARALEGAL.PROTOCOLAR',{businessId:id,service:'cadastro'});
 s=activate(s);
 s=advance(s,30);
 assert.equal(Core.rhReport(s).totalActive,1);
 assert.equal(Core.paralegalReport(s)[0].processes[0].status,'CONCLUIDO');
 assert.equal(Core.taxReport(s).mode,'DEMONSTRACAO_ECONOMICA');
 assert.equal(Core.overview(s).taxPayable,0);
 assert.equal(request(s,'FISCAL.PAGAR_SIMULADO',{period:'2026-11'}).ok,false);
});
test('C: roundtrip de save preserva marcações e fechamento sem retroagir o estado',()=>{
 let s=advance(activate(career()),30),id=unit(s);
 s=apply(s,'FISCAL_OP.CONCLUIR_TAREFA',{businessId:id,period:'2026-11',task:'vendas'});
 const before=JSON.stringify(Core.fiscalOperationsReport(s)),saved=Core.exportSave(s);
 const restored=Core.importSave(saved);
 assert.equal(restored.migrated,false);assert.equal(restored.state.schemaVersion,9);
 assert.equal(JSON.stringify(Core.fiscalOperationsReport(restored.state)),before);
 assert.equal(Core.exportSave(restored.state),saved);
});
test('C: HTML offline único contém a tela Fiscal Operacional e scripts válidos',()=>{
 const source=readFileSync('src/shell/index.template.html','utf8');
 const ui=readFileSync('src/ui/finance-views.part.js','utf8');
 const html=readFileSync('index.html','utf8');
 assert.match(source,/id="fiscal-op-unit-list"/);
 assert.match(source,/não representam vencimentos ou obrigações brasileiras/);
 assert.match(ui,/function renderFiscalOperations/);
 assert.match(ui,/FISCAL_OP\.FECHADO|FISCAL_OP\.FECHAR|data-fiscal-op-close/);
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
 assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][1]));
 assert.match(html,/const VERSION = '3\.0\.0-alpha\.1'/);
});

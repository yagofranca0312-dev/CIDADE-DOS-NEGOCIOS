import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createV333DecisionEngine} from '../src/contracts/v333-decision-engine.mjs';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
const send=(s,type,payload={})=>{
  const out=Core.dispatch(s,{type,payload,id:'v333b-'+(++seq)});
  assert.equal(out.ok,true,String(out.error));return out.state;
};
const fresh=()=>send(null,'CARREIRA.CRIAR',{name:'QA Agenda',companyName:'Empresa Agenda',cityId:'CE-TIANGUA',seed:333002});
const seed=()=>({worldId:'b-carreira',revision:1,player:{cityId:'CE-TIANGUA'},
  world:{activeBusinessId:'u1'},calendar:{date:'2026-12-12'},
  units:[{id:'u1'},{id:'u2'}],stocks:{u1:[],u2:[]},
  payables:{units:[]},fiscal:{assessments:[]},fiscalOp:{units:[]},financial:[]});
const fakeCore={
  businesses:s=>s.units,
  inventoryReport:s=>s.stocks[s.world.activeBusinessId]||[],
  operatingPayablesReport:s=>s.payables,
  fiscalOperationsReport:s=>s.fiscalOp,
  financialCommitmentsReport:s=>({events:s.financial}),
  money:n=>'R$ '+(n/100).toFixed(2)
};
const engine=createV333DecisionEngine(fakeCore),tracker=engine.createTracker();
const snap=x=>JSON.parse(JSON.stringify(x));
const tax=(due='2026-12-10',paid=0)=>({id:'T-1',period:'2026-11',status:'OPEN',
  amount:15000,paid,dueDate:due});
const fiscalOp=(taskDue='2026-12-09')=>({units:[{businessId:'u2',
  periods:[{period:'2026-11',dueDate:'2026-12-15',closed:false,tasks:[
    {id:'vendas',status:'ATRASADA',dueDate:taskDue},
    {id:'estoque',status:'PENDENTE',dueDate:'2026-12-12'}]}]}]});

test('B-01: fiscal agenda compartilha IDs/escopos exatos da Central',()=>{
  const s=seed();s.fiscal.assessments=[tax()];s.fiscalOp=fiscalOp();
  const occurrences=engine.candidates(s),rows=engine.agenda(s,{occurrences});
  assert.equal(rows.length,2);
  for(const row of rows){
    assert.equal(row.sourceKind,'CENTRAL_OCORRENCIA');
    assert.ok(occurrences.some(x=>x.id===row.occurrenceId));
    assert.equal(row.id,'AGENDA|'+row.occurrenceId);
    assert.equal(row.evidence.dueDate,row.date);
    assert.equal(row.route,'administrativo:fiscal');
  }
  assert.equal(rows.find(x=>x.occurrenceId.startsWith('FIS-02|')).scope.businessId,'u2');
});

test('B-02: FIN-01 sem vencimento não entra na agenda',()=>{
  const s=seed();s.payables.units=[{businessId:'u1',outstanding:500000}];
  assert.equal(engine.candidates(s).filter(x=>x.rule==='FIN-01').length,1);
  assert.equal(engine.agenda(s).length,0);
});

test('B-03: guia ou tarefa sem data comprovada não ganha vencimento',()=>{
  const s=seed();s.fiscal.assessments=[tax(null)];
  s.fiscalOp={units:[{businessId:'u2',periods:[{period:'2026-11',
    dueDate:null,closed:false,tasks:[{id:'estoque',status:'PENDENTE'}]}]}]};
  assert.ok(engine.candidates(s).length>=2);
  assert.equal(engine.agenda(s).length,0);
});

test('B-04: prazo fiscal usa data da tarefa pendente, não inventa dia 15',()=>{
  const s=seed();s.fiscalOp=fiscalOp();
  const rows=engine.agenda(s);
  assert.equal(rows[0].date,'2026-12-09');
  assert.equal(rows[0].status,'vencido');
  assert.equal(rows[0].scope.businessId,'u2');
  assert.equal(rows[0].evidence.periodDueDate,'2026-12-15');
});

test('B-05: compromissos financeiros respeitam origem, datas e certeza',()=>{
  const s=seed();s.financial=[
    {kind:'LOAN_SCHEDULE',id:'L-1',date:'2026-12-18',amountCents:25000,certainty:'PROJECTED'},
    {kind:'SUPPLIER_COMMITMENT',id:'C-1',date:'2026-12-17',amountCents:18000,certainty:'CONTRACTED_UNPOSTED'},
    {kind:'RECOGNIZED_PAYABLES',id:'group',date:'2026-12-12',amountCents:90000,certainty:'RECOGNIZED'}];
  const rows=engine.agenda(s);
  assert.equal(rows.length,2);
  assert.ok(rows.every(x=>x.sourceKind==='COMPROMISSO_FINANCEIRO'&&x.occurrenceId===null));
  assert.equal(rows[0].certainty,'CONTRACTED_UNPOSTED');
  assert.equal(rows[1].certainty,'PROJECTED');
  assert.equal(rows[0].scope.referenceId,'C-1');
});

test('B-06: dispensa em assessoria não apaga obrigação datada',()=>{
  const s=seed();s.fiscal.assessments=[tax()];
  const before=JSON.stringify(s),row=tracker.inspect(s).active[0];
  assert.ok(row);assert.equal(tracker.dismiss(row.id,s),true);
  assert.equal(tracker.inspect(s).active.length,0);
  const agenda=engine.agenda(s,{occurrences:tracker.inspect(s).all});
  assert.equal(agenda.length,1);assert.equal(agenda[0].occurrenceId,row.id);
  assert.equal(JSON.stringify(s),before);
});

test('B-07: agenda determinística ordena vencidos, hoje e próximos, limita três',()=>{
  const s=seed();s.fiscal.assessments=[tax('2026-12-10')];
  s.fiscalOp=fiscalOp('2026-12-09');
  s.financial=[
    {kind:'LOAN_DUE',id:'L-1',date:'2026-12-12',amountCents:20000,certainty:'RECOGNIZED'},
    {kind:'LOAN_SCHEDULE',id:'L-2',date:'2026-12-18',amountCents:10000,certainty:'PROJECTED'}];
  const first=snap(engine.agenda(s)),second=snap(engine.agenda(s));
  assert.deepEqual(first,second);
  assert.equal(first.length,3);
  assert.deepEqual(first.map(x=>x.status),['vencido','vencido','hoje']);
  assert.equal(new Set(first.map(x=>x.id)).size,3);
});

test('B-08: mudança de empresa não remove compromisso da agenda',()=>{
  const s=seed();s.fiscalOp=fiscalOp();
  const a=snap(engine.agenda(s)),b=snap(engine.agenda({...s,world:{activeBusinessId:'u2'}}));
  assert.deepEqual(a,b);
});

test('B-09: engine canônica e save real continuam read-only',()=>{
  let s=fresh();s=send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
  const before=JSON.stringify(s),rows=createV333DecisionEngine(Core).agenda(s);
  assert.ok(Array.isArray(rows));
  assert.equal(JSON.stringify(s),before);
  assert.equal(Core.SCHEMA_VERSION,10);
  assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.2');
});

test('B-10: UI usa motor único e protege o alvo da unidade sem dispatch',()=>{
  const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
  const engineSrc=readFileSync('src/contracts/v333-decision-engine.mjs','utf8');
  const agendaBody=ui.slice(ui.indexOf('function v332AgendaItems(current){'),
    ui.indexOf('function v332RenderAgenda(){'));
  assert.match(agendaBody,/CidadeV333DecisionEngine\.agenda/);
  assert.match(agendaBody,/v333DecisionTracker\.inspect\(current\)\.all/);
  assert.match(ui,/dataset\.v333OccurrenceId/);
  assert.match(ui,/button\.dataset\.v332BusinessId=item\.scope\.businessId/);
  assert.match(ui,/CidadeV333DecisionEngine\.planQuickAction\(state/);
  assert.match(ui,/Core\.activeBusiness\(state\)\?\.id!==plan\.switchBusinessId/);
  assert.doesNotMatch(agendaBody,/Core\.dispatch\(|commit\(|localStorage\.|indexedDB\./);
  assert.doesNotMatch(engineSrc,/Core\.dispatch\(|localStorage\.|indexedDB\.|fetch\(/);
});

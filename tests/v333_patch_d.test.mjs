import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createV333DecisionEngine} from '../src/contracts/v333-decision-engine.mjs';
import {createV333OperationsView} from '../src/contracts/v333-operations-view.mjs';

const coreCode=readFileSync('src/core/game.js','utf8');
const Core=runInNewContext(coreCode+'\nCidadeCore',{});
const engine=createV333DecisionEngine(Core),view=createV333OperationsView(Core,engine);
let sequence=0;
const send=(s,type,payload={})=>{
 const result=Core.dispatch(s,{type,payload,id:'v333-d-'+(++sequence)});
 assert.equal(result.ok,true,type+': '+String(result.error));return result.state;
};
function fixture(){
 let s=send(null,'CARREIRA.CRIAR',{
  name:'Teste de Interface',companyName:'Companhia Exemplo',cityId:'CE-TIANGUA',seed:333045
 });
 s=send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
 s=send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:4});
 return s;
}
const take=s=>engine.createTracker().inspect(s);
const project=(s,opts={})=>view.project(s,take(s),opts);

test('D-01: resumo diário usa apenas data, unidades e ocorrências verificadas',()=>{
 const s=fixture(),p=project(s);
 assert.equal(p.summary.date,s.calendar.date);
 assert.equal(p.summary.units,Core.businesses(s).length);
 assert.equal(p.summary.activeTotal,take(s).active.length);
 assert.equal(p.summary.urgentTotal,take(s).active.filter(x=>x.severity==='urgente').length);
 assert.equal(p.summary.overdueTotal,p.agenda.filter(x=>x.status==='vencido').length);
});
test('D-02: filtros de empresa mantêm identidade e isolam itens da unidade',()=>{
 const s=fixture(),units=Core.businesses(s);
 const all=project(s),one=project(s,{businessId:units[0].id});
 const two=project(s,{businessId:units[1].id});
 assert.ok(all.team.length>0);assert.ok(one.team.length>0);assert.ok(two.team.length>0);
 assert.ok(one.team.every(x=>x.scope.businessId===units[0].id));
 assert.ok(two.team.every(x=>x.scope.businessId===units[1].id));
 assert.ok(all.summary.activeTotal>=one.summary.shownTeam);
 assert.ok(all.summary.activeTotal>=two.summary.shownTeam);
 assert.equal(one.filters.businessId,units[0].id);
});
test('D-03: severidade e prazo filtram exibição sem alterar total real',()=>{
 const s=fixture(),full=project(s);
 const urg=project(s,{severity:'urgente'});
 assert.ok(urg.team.every(x=>x.severity==='urgente'));
 assert.equal(urg.summary.activeTotal,full.summary.activeTotal);
 for(const due of ['vencido','hoje','previsto']){
  const p=project(s,{due});
  assert.ok(p.agenda.every(x=>x.status===due));
  assert.equal(p.summary.datedTotal,full.summary.datedTotal);
 }
});
test('D-04: seleção inválida regride para todos, nunca consulta unidade fictícia',()=>{
 const s=fixture(),baseline=project(s);
 const unexpected=project(s,{businessId:'est-inexistente',severity:'crítica',due:'amanhã'});
 assert.deepEqual(unexpected,baseline);
 assert.deepEqual(unexpected.filters,{businessId:'all',severity:'all',due:'all'});
});
test('D-05: nenhuma carreira equivale à Central vazia, sem eventos inventados',()=>{
 const p=view.project(null,{},{});assert.equal(p.summary.activeTotal,0);
 assert.equal(p.summary.urgentTotal,0);assert.equal(p.summary.datedTotal,0);
 assert.deepEqual(p.team,[]);assert.deepEqual(p.agenda,[]);
});
test('D-06: dispensa filtra Equipe, mas não remove compromisso fiscal datado',()=>{
 const CoreFake={
  businesses:s=>s.units,financialCommitmentsReport:s=>({events:s.commitments||[]}),
  money:n=>'R$ '+(n/100).toFixed(2),inventoryReport:()=>[],
  operatingPayablesReport:()=>({units:[]}),fiscalOperationsReport:()=>({units:[]})
 };
 const fake=createV333DecisionEngine(CoreFake),tracker=fake.createTracker();
 const fakeView=createV333OperationsView(CoreFake,fake);
 const s={worldId:'d-world',revision:1,player:{cityId:'CE-TIANGUA'},
  calendar:{date:'2026-11-14'},world:{activeBusinessId:'u1'},
  units:[{id:'u1'}],fiscal:{assessments:[{id:'F-1',period:'2026-11',
   status:'OPEN',dueDate:'2026-11-13',amount:9000,paid:0}]},
  commitments:[]};
 const snapshot=tracker.inspect(s);
 const row=snapshot.active.find(x=>x.rule==='FIS-01');
 assert.ok(row);assert.equal(tracker.dismiss(row.id,s),true);
 const next=fakeView.project(s,tracker.inspect(s));
 assert.equal(next.team.length,0);assert.equal(next.agenda.length,1);
 assert.equal(next.agenda[0].occurrenceId,row.id);
 assert.equal(next.summary.overdueTotal,1);
});
test('D-07: filtros e visualizações não mutam game state nem schema',()=>{
 const s=fixture(),raw=JSON.stringify(s);
 const tracker=engine.createTracker();
 const ss=tracker.inspect(s);
 for(const unit of Core.businesses(s))for(const severity of ['all','urgente','atenção','informativa']){
  view.project(s,ss,{businessId:unit.id,severity,due:'vencido'});
 }
 assert.equal(JSON.stringify(s),raw);
 assert.equal(Core.SCHEMA_VERSION,10);
 assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.2');
});
test('D-08: casos sem filtro mantêm as três ocorrências da agenda B',()=>{
 const s=fixture(),snapshot=take(s);
 const result=view.project(s,snapshot);
 const agenda=engine.agenda(s,{limit:3,occurrences:snapshot.all});
 assert.deepEqual(result.agenda,agenda);
});
test('D-09: abas e filtros acessíveis têm labels e controles não duplicados',()=>{
 const h=readFileSync('src/shell/index.template.html','utf8');
 for(const k of ['equipe','agenda','acoes']){
  assert.match(h,new RegExp('data-v333-hub-tab="'+k+'"'));
 }
 for(const id of ['v333-command-hub','v333-hub-summary','v333-hub-unit',
  'v333-hub-severity','v333-hub-due','v333-quick-actions']){
  assert.equal((h.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(h,/aria-label="Abas de gestão"/);
 assert.match(h,/aria-live="polite"/);
 assert.match(h,/aria-controls="v332-advisor-drawer"/);
});
test('D-10: render da equipe/agenda projeta snapshot único sem novas regras',()=>{
 const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
 const projection=ui.slice(ui.indexOf('function v333HubProject(){'),
  ui.indexOf('function v333SyncHubTabs(){'));
 assert.match(projection,/CidadeV333OperationsView\.project/);
 assert.match(projection,/v333DecisionTracker\.inspect\(state\)/);
 assert.match(ui,/const items=v333HubProject\(\)\.agenda/);
 assert.match(ui,/visible=v333HubProject\(\)\.team/);
 assert.doesNotMatch(projection,/Core\.dispatch\(|commit\(|indexedDB\.|localStorage\./);
});
test('D-11: atalho do centro integrado só abre Equipe, Agenda e Ações',()=>{
 const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
 const block=ui.slice(ui.indexOf('function v333OpenHub(tab){'),
   ui.indexOf('function v332RenderAgenda(){'));
 assert.match(block,/tab==='equipe'/);
 assert.match(block,/tab==='agenda'/);
 assert.match(block,/tab==='acoes'/);
 assert.match(block,/v333SyncHubTabs\(\)/);
 assert.doesNotMatch(block,/commit\(|Core\.dispatch\(|COMPRAS\.REGISTRAR/);
});
test('D-12: espaço reservado mantém arte e viewport responsivo, sem mexer no core',()=>{
 const css=readFileSync('src/shell/v31.css','utf8');
 assert.match(css,/V3\.3\.3-D/);
 assert.match(css,/\.v333-command-hub/);
 assert.match(css,/--v332-map-bottom:336px/);
 assert.match(css,/@media\(max-height:750px\) and \(max-width:900px\)/);
 assert.doesNotMatch(css.slice(css.lastIndexOf('V3.3.3-D')),/transform:\s*scale\(|map-canvas\s*\{/);
 const build=readFileSync('tools/build.mjs','utf8');
 assert.match(build,/v333-operations-view\.mjs/);
 assert.match(build,/\+v333operations/);
});

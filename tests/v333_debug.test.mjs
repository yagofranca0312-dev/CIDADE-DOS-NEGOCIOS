import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createV333DecisionEngine} from '../src/contracts/v333-decision-engine.mjs';
import {createV333OperationsView} from '../src/contracts/v333-operations-view.mjs';
const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
function take(start,end){const a=ui.indexOf(start),b=ui.indexOf(end,a);assert.ok(a>=0&&b>a);return ui.slice(a,b);}
const shortcut=take('  async function v332ShortcutOpen(button){','  // V3.3.3-A — todas as unidades');
for(const flag of ['commitInFlight','startupBlocked'])test('DBG-001: atalho recusa navegação durante '+flag,async()=>{
 const trace=[];
 const sandbox={trace,commitInFlight:flag==='commitInFlight',startupBlocked:flag==='startupBlocked',
  state:{world:{activeBusinessId:'old'}},Core:{},
  CidadeV333DecisionEngine:{planQuickAction:()=>({status:'READY',route:'mercado:compras'})},
  notify:msg=>trace.push(['notice',msg]),setText:()=>{},v332MoreClose:()=>{},
  v31OpenPanel:(...args)=>trace.push(['open',...args]),
  $:()=>({}),document:{querySelector:()=>null}};
 runInNewContext(shortcut+'\nglobalThis.open=v332ShortcutOpen',sandbox);
 await sandbox.open({dataset:{v332Route:'mercado:compras'},closest:()=>null});
 assert.equal(trace.filter(x=>x[0]==='open').length,0,'Rota abriu com contexto ainda não confirmado');
 assert.ok(trace.some(x=>x[0]==='notice'));
});

test('DBG-002: abrir Equipe pelo botão legado fecha Agenda',()=>{
 const agenda={hidden:false,setAttribute(k,v){this[k]=v;}};
 const nodes={'v332-agenda-list':agenda,'v332-agenda-toggle':agenda,'v332-advisor-close':{focus(){}}};
 const source=take('  function v332AdvisorExpand(){','  function v31Render');
 const context={$:id=>nodes[id],document:{activeElement:null},v332AdviceExpanded:false,
  v332AdvisorReturnFocus:null,v332MoreClose(){},v332RenderAdvisor(){},v333SyncHubTabs(){},v332AdvisorCollapse(){}};
 runInNewContext(source+'\nv332AdvisorExpand()',context);
 assert.equal(agenda.hidden,true,'Agenda e Equipe ficaram abertas simultaneamente');
 assert.equal(agenda['aria-expanded'],'false');
});

test('DBG-003: dispensa atualiza resumo e HUD no mesmo evento',()=>{
 const trace=[],node={focus(){},querySelector:()=>null};
 const handler=take("    $('v332-advisor-panel').addEventListener('click',event=>{","    document.addEventListener('keydown',event=>{");
 const ctx={state:{},v332AdviceCache:[{id:'notice'}],v333DecisionTracker:{dismiss:()=>true},
  v333RenderHub:()=>trace.push('summary'),v332RenderAdvisor:()=>trace.push('hud'),
  $:id=>id==='v332-advisor-panel'?{addEventListener:(_,fn)=>{ctx.click=fn;}}:node};
 runInNewContext(handler,ctx);
 ctx.click({target:{closest:sel=>sel==='[data-v332-advisor-dismiss]'?{dataset:{v332AdvisorDismiss:'notice'}}:null}});
 assert.ok(trace.includes('hud'));assert.ok(trace.includes('summary'),'Resumo conserva total antigo após dispensa');
});

test('DBG-004: filtros alcançam compromisso depois dos primeiros 100 sem subcontar totais',()=>{
 const Core={businesses:s=>s.units,money:String,financialCommitmentsReport:()=>({events:[]})};
 const engine=createV333DecisionEngine(Core),view=createV333OperationsView(Core,engine);
 const state={player:{cityId:'test'},world:{},calendar:{date:'2026-11-13'},units:[{id:'u1'},{id:'u2'}]};
 const all=Array.from({length:101},(_,i)=>({id:'FIS-02|'+i,rule:'FIS-02',severity:'atenção',
  scope:{businessId:i===100?'u2':'u1',period:'2026-10'},evidence:{dueDate:'2026-11-12'}}));
 const p=view.project(state,{active:all,all},{businessId:'u2'});
 assert.equal(p.summary.datedTotal,101);assert.equal(p.summary.overdueTotal,101);
 assert.equal(p.agenda.length,1,'Filtro escondeu compromisso existente da unidade u2');
 assert.equal(p.agenda[0].occurrenceId,all[100].id);
});

test('DBG-004 real: carreira 1825 dias com checklists excede 100 e conserva saves',()=>{
 const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore');
 let s=null,seq=0;
 const send=(type,payload={})=>{const r=Core.dispatch(s,{type,payload,id:'debug-long-'+(++seq)});assert.equal(r.ok,true,r.error);s=r.state;};
 send('CARREIRA.CRIAR',{name:'Debug Longo',companyName:'Rede Sintética',cityId:'CE-TIANGUA',seed:333399});
 for(const lot of [3,4]){send('EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot});send('FISCAL_OP.ATIVAR',{businessId:Core.activeBusiness(s).id,acceptSimulation:true});}
 for(let remaining=1825;remaining>0;remaining-=30)send('TEMPO.AVANCAR_LOTE',{days:Math.min(remaining,30)});
 const engine=createV333DecisionEngine(Core),tracker=engine.createTracker();
 const all=engine.agenda(s,{limit:Infinity});assert.ok(all.length>100);
 const original=JSON.stringify(s),snapshot=tracker.inspect(s);
 const view=createV333OperationsView(Core,engine).project(s,snapshot);
 assert.equal(view.summary.datedTotal,all.length);
 assert.equal(view.summary.overdueTotal,all.filter(x=>x.status==='vencido').length);
 assert.deepEqual(view.agenda,all.slice(0,3));
 assert.equal(tracker.inspect(s).history.length,0);
 for(const raw of [Core.exportSave(s),Core.exportSaveCompact(s)]){
  const loaded=Core.importSave(raw).state;
  assert.equal(JSON.stringify(loaded),original);
  assert.equal(Core.balanceSheet(loaded).balanced,true);
  assert.equal(Core.reconciliationReport(loaded).ok,true);
 }
 assert.equal(JSON.stringify(s),original);
});

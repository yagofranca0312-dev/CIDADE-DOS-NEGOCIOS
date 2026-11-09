import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const tpl=readFileSync('src/shell/index.template.html','utf8');
const finance=readFileSync('src/ui/finance-views.part.js','utf8');
const app=readFileSync('src/ui/app.js','utf8');
const css=readFileSync('src/shell/v2.css','utf8');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function send(state,type,payload={}){
  const r=Core.dispatch(state,{type,payload,id:'v23d:regression:'+(++seq)});
  assert.equal(r.ok,true,r.error||type);
  return r.state;
}
function stateScenario(){
  const city=Core.CITIES.find(x=>x.name==='Tianguá');
  let state=send(null,'CARREIRA.CRIAR',{name:'Teste Administrativo',companyName:'Empresa Central',cityId:city.id,seed:20261103});
  state=send(state,'EMPRESA.ABRIR',{sector:'mercado',cityId:city.id,lot:1});
  state=send(state,'ESTOQUE.COMPRAR',{productId:'base',quantity:30,supplierId:'regional'});
  state=send(state,'TEMPO.AVANCAR_LOTE',{days:6});
  return state;
}
function section(root,sub,nextSub){
  const start=tpl.indexOf('id="v23-pane-'+root+'-'+sub+'"');
  const end=nextSub?tpl.indexOf('id="v23-pane-'+root+'-'+nextSub+'"',start+1):
    tpl.indexOf('<section data-view="sistema"',start);
  assert.ok(start>0&&end>start,'department '+sub);
  return tpl.slice(start,end);
}
test('V2.3-D: filtros contábeis compartilhados entre Finanças e Contabilidade, sem cópias',()=>{
  const r=tpl.indexOf('id="admin-shared-filters"'),f=tpl.indexOf('id="v23-pane-administrativo-financas"'),
    c=tpl.indexOf('id="v23-pane-administrativo-contabilidade"');
  assert.ok(r>0&&r<f&&f<c);
  const ids=[...tpl.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const key of ['admin-shared-filters','finance-period','finance-scope','finance-validation','finance-summary','journal-events','fiscal-summary','treasury-cash','treasury-categories','treasury-performance'])
    assert.equal(ids.filter(id=>id===key).length,1,key);
});
test('V2.3-D: tesouraria, estratégias e demonstrativos estão nos departamentos corretos',()=>{
  const fin=section('administrativo','financas','rh-dp'),acc=section('administrativo','contabilidade','fiscal');
  assert.match(fin,/id="treasury-heading"/);assert.match(fin,/id="treasury-cash"/);
  assert.match(fin,/id="treasury-categories"/);assert.match(fin,/id="strategy-horizon"/);
  assert.doesNotMatch(fin,/id="finance-summary"|id="journal-events"/);
  assert.match(acc,/id="finance-summary"/);assert.match(acc,/id="journal-events"/);
  assert.match(acc,/data-statement-view="dre"/);
  assert.match(acc,/data-statement-view="balance"/);
  assert.match(acc,/data-statement-view="check"/);
  assert.doesNotMatch(acc,/id="treasury-cash"|id="strategy-horizon"/);
  assert.match(app,/contabilidade:\['administrativo','contabilidade'\]/);
  assert.match(app,/admin-shared-filters/);
  assert.match(app,/includes\(activeSection\.administrativo\)\)\|\|financeQuery\)renderFinances\(\)/);
});
test('V2.3-D: cálculo de tesouraria usa exatamente o caixa e fluxo existentes',()=>{
  const state=stateScenario(),before=Core.exportSave(state);
  const q={period:'all'},params={date:state.calendar.date,range:null};
  const report=Core.financialReport(state,'all',params.date,null,'all');
  const flow=Core.cashFlowStatement(state,'all',params.date,null,'all');
  const texts={},html={};
  const ctx={state,Core,q,params,report,financeScope:'all',setText:(id,value)=>{texts[id]=String(value);},
    $:id=>html[id]||(html[id]={innerHTML:''}),
    escape:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    BRDate:iso=>iso.split('-').reverse().join('/')};
  const start=finance.indexOf('  function renderTreasury('),end=finance.indexOf('  function renderFinances()',start);
  assert.ok(start>=0&&end>start);
  runInNewContext(finance.slice(start,end)+'\nrenderTreasury(report,q,params);',ctx);
  assert.equal(texts['treasury-cash'],Core.money(flow.closingCash));
  assert.equal(texts['treasury-inflows'],Core.money(flow.inflows));
  assert.equal(texts['treasury-outflows'],Core.money(flow.outflows));
  assert.equal(texts['treasury-net'],Core.money(flow.netCash));
  assert.equal(texts['treasury-payable'],Core.money(report.closingPayable));
  assert.equal(texts['treasury-transit'],Core.money(report.closingInTransit));
  assert.match(html['treasury-categories'].innerHTML,/Pagamentos a fornecedores/);
  assert.match(texts['treasury-scope-note'],/grupo conciliados/);
  assert.equal(Core.exportSave(state),before);
});
test('V2.3-D: unidade não recebe caixa nem tributo artificial',()=>{
  const state=stateScenario(),before=Core.exportSave(state);
  const unit=Core.activeBusiness(state),q={period:'all'},params={date:state.calendar.date,range:null};
  const report=Core.financialReport(state,'all',params.date,null,unit.id);
  const texts={},html={};
  const ctx={state,Core,q,params,report,financeScope:unit.id,setText:(id,value)=>{texts[id]=String(value);},
    $:id=>html[id]||(html[id]={innerHTML:''}),escape:String,BRDate:iso=>iso.split('-').reverse().join('/')};
  const start=finance.indexOf('  function renderTreasury('),end=finance.indexOf('  function renderFinances()',start);
  runInNewContext(finance.slice(start,end)+'\nrenderTreasury(report,q,params);',ctx);
  assert.equal(texts['treasury-cash'],'Somente grupo');
  assert.equal(texts['treasury-tax'],'Somente grupo');
  assert.match(texts['treasury-scope-note'],/Não existe saldo individual/);
  assert.equal(Core.exportSave(state),before);
});
test('V2.4-A: Fiscal e RH/DP preservados, Paralegal funcional e explicitamente fictício',()=>{
  const f=section('administrativo','fiscal','paralegal'),r=section('administrativo','rh-dp','contabilidade');
  const p=section('administrativo','paralegal',null);
  assert.match(f,/id="fiscal-summary"/);assert.match(f,/id="fiscal-assessments"/);
  assert.match(f,/id="fiscal-activate"/);
  assert.match(r,/id="rh-hire-form"/);assert.match(r,/id="rh-unit-list"/);assert.match(r,/Cadastro de empregados fictícios/);
  assert.match(p,/id="paralegal-unit-list"/);assert.match(p,/não há emissão de CNPJ/);
  assert.doesNotMatch(r+p,/id="buy-form"|id="fiscal-activate"/);
});
test('V2.3-D: mudanças são de apresentação, não adicionam comandos econômicos',()=>{
  const fn=finance.slice(finance.indexOf('function renderTreasury('),finance.indexOf('function renderFinances()'));
  assert.doesNotMatch(fn,/Core\.dispatch|commit\(|saveLocal\(|localStorage/);
  assert.match(css,/\.admin-treasury-kpis/);assert.match(css,/\.admin-shared-filters\[hidden\]/);
  const state=stateScenario(),before=Core.exportSave(state);
  Core.financialReport(state);Core.cashFlowStatement(state);Core.incomeStatement(state);Core.balanceSheet(state);
  Core.reconciliationReport(state);
  assert.equal(Core.exportSave(state),before);
  assert.equal(state.schemaVersion,10);
});
test('V2.3-D: HTML único offline reúne o Fiscal, tesouraria e razão sem duplicação',()=>{
  const built=readFileSync('index.html','utf8');
  const scripts=[...built.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][1]));
  for(const id of ['admin-shared-filters','treasury-cash','finance-summary','journal-events','fiscal-summary'])
    assert.ok(built.includes('id="'+id+'"'),id);
  assert.match(built,/const VERSION = '3\.2\.0'/);
});

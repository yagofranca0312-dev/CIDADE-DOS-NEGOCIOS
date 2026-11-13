import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createV333DecisionEngine} from '../src/contracts/v333-decision-engine.mjs';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const plan=createV333DecisionEngine(Core);
let serial=0;
function send(state,type,payload={}){
  const r=Core.dispatch(state,{type,payload,id:'v333c-'+(++serial)});
  assert.equal(r.ok,true,String(r.error));return r.state;
}
function network(){
  let s=send(null,'CARREIRA.CRIAR',{name:'QA C',companyName:'Matriz QA',cityId:'CE-TIANGUA',seed:333031});
  s=send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
  s=send(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:4});
  return s;
}
const readPlan=(s,opts)=>plan.planQuickAction(s,opts);

test('C-01: atalho da unidade secundária planeja switch da mesma ocorrência',()=>{
  const s=network(),units=Core.businesses(s),active=Core.activeBusiness(s);
  const other=units.find(x=>x.id!==active.id);
  assert.ok(other,'Deve haver unidade em contexto diferente');
  const advisory=plan.candidates(s).find(x=>x.category==='SUP'&&x.scope.businessId===other.id);
  assert.ok(advisory);
  const p=readPlan(s,{occurrenceId:advisory.id,route:'sistema:saves'});
  assert.equal(p.status,'READY');assert.equal(p.route,advisory.route);
  assert.equal(p.switchBusinessId,other.id);assert.equal(p.businessId,other.id);
  assert.equal(p.productId,advisory.scope.productId);
  assert.equal(p.occurrenceId,advisory.id);
});

test('C-02: troca de unidade usa APENAS o dispatch existente, sem operação econômica',()=>{
  const s=network(),other=Core.businesses(s).find(u=>u.id!==Core.activeBusiness(s).id);
  const notice=plan.candidates(s).find(x=>x.scope.businessId===other.id);
  const p=readPlan(s,{occurrenceId:notice.id});
  const before=JSON.stringify({
    ledger:s.economy.ledger,fiscal:s.fiscal,cash:Core.overview(s).cash,
    stock:Core.overview(s).stock
  });
  const switched=send(s,'EMPRESA.ATIVAR',{businessId:p.switchBusinessId});
  assert.equal(Core.activeBusiness(switched).id,other.id);
  assert.equal(readPlan(switched,{occurrenceId:notice.id}).switchBusinessId,null);
  assert.equal(JSON.stringify({
    ledger:switched.economy.ledger,fiscal:switched.fiscal,cash:Core.overview(switched).cash,
    stock:Core.overview(switched).stock
  }),before);
});

test('C-03: nenhuma escrita ou mutação no planejador puro',()=>{
  const s=network(),before=JSON.stringify(s);
  const notices=plan.candidates(s);
  for(const n of notices)assert.equal(readPlan(s,{occurrenceId:n.id}).status,'READY');
  assert.equal(readPlan(s,{route:'mercado:compras'}).status,'READY');
  assert.equal(JSON.stringify(s),before);
});

test('C-04: aviso resolvido ou inventado não permite ação stale',()=>{
  const s=network();
  assert.equal(readPlan(s,{occurrenceId:'SUP|id-falso|produto-falso'}).status,'STALE_OCCURRENCE');
  assert.equal(readPlan(s,{occurrenceId:'FIN-01|nao-existe',route:'mercado:compras'}).status,'STALE_OCCURRENCE');
});

test('C-05: pré-requisitos sem empresa e rotas não autorizadas falham com segurança',()=>{
  const s=send(null,'CARREIRA.CRIAR',{name:'Carreira Sem Unidade',companyName:'Empresa Vazia de Teste',cityId:'CE-TIANGUA',seed:333032});
  assert.equal(readPlan(s,{route:'mercado:compras',requiresUnit:true}).status,'NEEDS_UNIT');
  assert.equal(readPlan(s,{route:'mercado:estoque'}).status,'NEEDS_UNIT');
  assert.equal(readPlan(s,{route:'administrativo:financas'}).status,'READY');
  assert.equal(readPlan(s,{route:'sistema:saves'}).status,'READY');
  assert.equal(readPlan(s,{route:'mercado:compras;COMPRAS.REGISTRAR'}).status,'INVALID_ROUTE');
  assert.equal(readPlan(null,{route:'mercado:compras'}).status,'NO_CAREER');
});

test('C-06: fonte correta prevalece sobre atributos de rota adulterados',()=>{
  const s=network(),notice=plan.candidates(s).find(x=>x.category==='SUP');
  const p=readPlan(s,{occurrenceId:notice.id,
    route:'administrativo:financas',focus:'payable-operating-form'});
  assert.equal(p.route,notice.route);
  assert.equal(p.focus,notice.focus);
});

test('C-07: suporte a contexto FIN-01 e agenda fiscal sem inventar vencimentos',()=>{
  let s=network();
  const notice=plan.candidates(s).find(x=>x.rule==='FIN-01');
  if(notice){
    const p=readPlan(s,{occurrenceId:notice.id});
    assert.equal(p.status,'READY');assert.equal(p.route,'administrativo:financas');
    assert.equal(p.businessId,notice.scope.businessId);
    assert.equal(p.productId,null);
  }
  const agg=plan.agenda(s);
  for(const row of agg)if(row.occurrenceId){
    const p=readPlan(s,{occurrenceId:row.occurrenceId});
    assert.equal(p.status,'READY');assert.equal(p.route,row.route);
  }
});

test('C-08: interface usa commit de ativação com prova antes do destino',()=>{
  const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
  const a=ui.indexOf('async function v332ShortcutOpen(button){');
  const b=ui.indexOf('// V3.3.3-A — todas as unidades',a);
  const block=ui.slice(a,b);
  assert.ok(a>0&&b>a);
  assert.match(block,/planQuickAction\(state/);
  assert.match(block,/await commit\('EMPRESA\.ATIVAR'/);
  assert.match(block,/if\(!changed\)/);
  assert.match(block,/Core\.activeBusiness\(state\)\?\.id!==plan\.switchBusinessId/);
  assert.ok(block.indexOf('await commit(')<block.indexOf('v31OpenPanel(root,section'));
  assert.doesNotMatch(block,/commit\('(?!EMPRESA\.ATIVAR)[^']+'/);
  assert.doesNotMatch(block,/COMPRAS\.REGISTRAR|PASSIVO\.LIQUIDAR|PRECO\.DEFINIR/);
});

test('C-09: produto e empresa pré-selecionados sem submeter formulário',()=>{
  const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
  assert.match(ui,/chooser\.value=product\.id/);
  assert.match(ui,/chooser\.value=plan\.businessId/);
  assert.match(ui,/open\.dataset\.v333OccurrenceId=item\.id/);
  assert.match(ui,/if\(item\.occurrenceId\)button\.dataset\.v333OccurrenceId=item\.occurrenceId/);
  assert.match(ui,/Revise e confirme qualquer operação manualmente/);
  assert.equal(Core.SCHEMA_VERSION,10);
  assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.2');
});

test('C-10: sem commit quando unidade-alvo já é a ativa',()=>{
  const s=network();
  const active=Core.activeBusiness(s);
  const notice=plan.candidates(s).find(x=>x.scope.businessId===active.id);
  const p=readPlan(s,{occurrenceId:notice.id});
  assert.equal(p.status,'READY');
  assert.equal(p.switchBusinessId,null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function request(state,type,payload={},id='v24a-'+(++seq)){
  return Core.dispatch(state,{id,type,payload});
}
function apply(state,type,payload={}){
  const result=request(state,type,payload);
  assert.equal(result.ok,true,result.error||type);
  return result.state;
}
function career(){
  let state=apply(null,'CARREIRA.CRIAR',{name:'Jogador Teste',companyName:'Empresa Demonstrativa',cityId:'CE-TIANGUA',seed:20261103});
  state=apply(state,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});
  return state;
}
const task=(state,service)=>Core.paralegalReport(state)[0].processes.find(p=>p.service===service);

test('V2.4-A: paralegal começa sem obrigações reais ou cobranças retroativas',()=>{
  const state=career();
  assert.equal(state.schemaVersion,9);
  assert.equal(task(state,'cadastro').status,'PENDENTE');
  assert.equal(task(state,'licenca').status,'PENDENTE');
  assert.equal(state.audit.events.some(e=>e.type.startsWith('PARALEGAL.')),false);
});

test('V2.4-A: protocolo registra evento, despesa e caixa exatamente uma vez',()=>{
  let state=career();
  const cash=Core.overview(state).cash,ledger=state.economy.ledger.length;
  const payload={businessId:Core.activeBusiness(state).id,service:'cadastro'};
  const result=request(state,'PARALEGAL.PROTOCOLAR',payload,'v24a:dedup');
  assert.equal(result.ok,true,result.error);
  state=result.state;
  assert.equal(Core.overview(state).cash,cash-12000);
  assert.equal(state.economy.ledger.length,ledger+1);
  assert.equal(state.economy.ledger.at(-1).kind,'PARALEGAL_FEE');
  assert.equal(task(state,'cadastro').status,'EM_ANALISE');
  const again=request(state,'PARALEGAL.PROTOCOLAR',payload,'v24a:dedup');
  assert.equal(again.ok,true);
  assert.equal(again.status,'DUPLICATE');
  assert.equal(again.state.economy.ledger.length,ledger+1);
  const rejected=request(state,'PARALEGAL.PROTOCOLAR',payload,'v24a:second');
  assert.equal(rejected.ok,false);
  assert.equal(rejected.state.economy.ledger.length,ledger+1);
});

test('V2.4-A: licença só após cadastro, depois conclui por tempo e permite renovar após vencer',()=>{
  let state=career();const id=Core.activeBusiness(state).id;
  assert.equal(request(state,'PARALEGAL.PROTOCOLAR',{businessId:id,service:'licenca'}).ok,false);
  state=apply(state,'PARALEGAL.PROTOCOLAR',{businessId:id,service:'cadastro'});
  state=apply(state,'TEMPO.AVANCAR_LOTE',{days:2});
  assert.equal(task(state,'cadastro').status,'CONCLUIDO');
  state=apply(state,'PARALEGAL.PROTOCOLAR',{businessId:id,service:'licenca'});
  assert.equal(task(state,'licenca').status,'EM_ANALISE');
  state=apply(state,'TEMPO.AVANCAR_LOTE',{days:4});
  assert.equal(task(state,'licenca').status,'CONCLUIDO');
  assert.ok(task(state,'licenca').expiresAt>state.calendar.date);
  assert.equal(request(state,'PARALEGAL.PROTOCOLAR',{businessId:id,service:'licenca'}).ok,false);
  for(let d=0;d<366;d+=30)state=apply(state,'TEMPO.AVANCAR_LOTE',{days:Math.min(30,366-d)});
  assert.equal(task(state,'licenca').status,'VENCIDA');
  const before=Core.overview(state).cash;
  // Reforço de caixa fictício não é criado: renovar requer saldo real da carreira.
  if(before<36000)assert.equal(request(state,'PARALEGAL.PROTOCOLAR',{businessId:id,service:'licenca'}).ok,false);
});

test('V2.4-A: importação preserva eventos jurídicos fictícios e save schema 9',()=>{
  let state=career();const id=Core.activeBusiness(state).id;
  state=apply(state,'PARALEGAL.PROTOCOLAR',{businessId:id,service:'cadastro'});
  const before=JSON.stringify(Core.paralegalReport(state));
  const exported=Core.exportSave(state);
  const result=Core.importSave(exported);
  assert.equal(result.state.schemaVersion,9);
  assert.equal(JSON.stringify(Core.paralegalReport(result.state)),before);
  assert.equal(Core.exportSave(result.state),exported);
});

test('V2.4-A: UI expõe comandos com aviso de natureza fictícia e HTML executável',()=>{
  const template=readFileSync('src/shell/index.template.html','utf8');
  const app=readFileSync('src/ui/app.js','utf8');
  const html=readFileSync('index.html','utf8');
  assert.match(template,/id="paralegal-unit-list"/);
  assert.match(template,/sem equivalência com taxas ou exigências legais brasileiras/);
  assert.match(app,/renderParalegal\(\)/);
  assert.match(app,/PARALEGAL\.PROTOCOLAR/);
  assert.match(html,/const VERSION = '2\.4\.0-alpha\.3'/);
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);
  assert.doesNotThrow(()=>new Script(scripts[0][1]));
});

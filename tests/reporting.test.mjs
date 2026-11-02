import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{}, {filename:'game.js'});
const oldCore=runInNewContext(readFileSync('tests/fixtures/core_v1_0_1.js','utf8')+'\nCidadeCore',{}, {filename:'old.js'});
const city=core.CITIES.find(c=>c.name==='Tianguá').id;
const cmd=(type,payload,id)=>({type,id,payload});
function build(engine=core) {
  let s=engine.dispatch(null,cmd('CARREIRA.CRIAR',{name:'Teste',companyName:'Negócio Teste',cityId:city,seed:1234},'create')).state;
  s=engine.dispatch(s,cmd('EMPRESA.ABRIR',{sector:'mercado',lot:3},'open')).state;
  const purchase=engine.dispatch(s,cmd('ESTOQUE.COMPRAR',{quantity:500},'stock'));
  assert.equal(purchase.ok,true,purchase.error);
  return purchase.state;
}
function apply(s,engine,type,payload,id){
  const r=engine.dispatch(s,cmd(type,payload,id));assert.equal(r.ok,true,r.error);return r.state;
}
test('Relatório integral replica overview sem alterar o save',()=>{
  let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days');
  const before=JSON.stringify(s),all=core.financialReport(s),o=core.overview(s);
  for(const k of ['revenue','cogs','expenses','profit'])assert.equal(all[k],o[k],k);
  assert.equal(all.closingCash,o.cash);assert.equal(all.closingInventory,o.inventoryValue);
  assert.equal(all.closingPayable,o.payable);assert.equal(JSON.stringify(s),before);
});
test('Competência novembro concentra os resultados de 30 dias; dezembro não duplica receita',()=>{
  let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days');
  const nov=core.financialReport(s,'month','2026-11-15');
  const dec=core.financialReport(s,'month','2026-12-01');
  assert.equal(nov.from,'2026-11-01');assert.equal(nov.to,'2026-11-30');
  assert.equal(nov.revenue,core.overview(s).revenue);assert.equal(nov.profit,core.overview(s).profit);
  assert.equal(dec.revenue,0);assert.equal(dec.cogs,0);assert.equal(dec.expenses,0);
  assert.equal(dec.closingCash,nov.closingCash);
});
test('Filtro diário usa data do lançamento e não data seguinte do calendário',()=>{
  let s=build();s=apply(s,core,'TEMPO.AVANCAR_DIA',{},'one');
  const day=core.financialReport(s,'day','2026-11-01');
  const next=core.financialReport(s,'day','2026-11-02');
  assert.ok(day.revenue>0);assert.ok(day.expenses>0);
  assert.equal(next.revenue,0);assert.equal(next.expenses,0);
  assert.equal(next.entries.length,0);assert.equal(next.closingCash,day.closingCash);
});
test('Trimestre e ano somam igual ao total após 30 dias',()=>{
  let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days');
  const q=core.financialReport(s,'quarter','2026-11-30');
  const year=core.financialReport(s,'year','2026-11-30');
  const all=core.financialReport(s,'all');
  assert.equal(q.from,'2026-10-01');assert.equal(q.to,'2026-12-31');
  assert.equal(q.profit,all.profit);assert.equal(year.profit,all.profit);
});
test('Estoque comprado não é despesa ou CMV antes da primeira venda',()=>{
  const s=build(),all=core.financialReport(s);
  assert.equal(all.revenue,0);assert.equal(all.cogs,0);
  assert.equal(all.closingInventory,500*core.SECTORS.mercado.cost);
  assert.equal(all.expenses,core.SECTORS.mercado.openCost);
});
test('Histórico recupera eventos da carreira e não altera GameState',()=>{
  let s=build();assert.equal(core.priceHistory(s).length,0);
  s=apply(s,core,'PRECO.DEFINIR',{cents:5200},'price1');
  s=apply(s,core,'PRECO.DEFINIR',{cents:6000},'price2');
  const before=JSON.stringify(s),history=core.priceHistory(s);
  assert.equal(history.length,2);
  assert.equal(history[0].old,4900);assert.equal(history[0].cents,5200);
  assert.equal(history[1].old,5200);assert.equal(history[1].cents,6000);
  assert.equal(JSON.stringify(s),before);
});
test('Save V1.0.1 importa na V1.1 sem migração e preserva histórico',()=>{
  let old=build(oldCore);
  old=apply(old,oldCore,'TEMPO.AVANCAR_LOTE',{days:7},'oldweek');
  old=apply(old,oldCore,'PRECO.DEFINIR',{cents:5300},'oldprice');
  const saved=oldCore.exportSave(old),loaded=core.importSave(saved);
  assert.equal(loaded.migrated,false);
  assert.equal(JSON.stringify(loaded.state),JSON.stringify(old));
  assert.equal(core.priceHistory(loaded.state)[0].cents,5300);
  assert.equal(core.financialReport(loaded.state,'month','2026-11-03').profit,core.overview(loaded.state).profit);
  const later=apply(loaded.state,core,'TEMPO.AVANCAR_DIA',{},'newday');
  assert.equal(later.schemaVersion,2);assert.ok(later.revision>old.revision);
});
test('Filtro inválido e data futura não alteram o estado',()=>{
  const s=build(),before=JSON.stringify(s);
  assert.throws(()=>core.financialReport(s,'fortnight'),/Período/);
  assert.throws(()=>core.financialReport(s,'month','2030-01-01'),/futura/);
  assert.equal(JSON.stringify(s),before);
});
test('Total acumulado respeita data de corte escolhida',()=>{
  let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days');
  const first=core.financialReport(s,'all','2026-11-01');
  const last=core.financialReport(s,'all','2026-11-30');
  assert.ok(last.revenue>first.revenue);
  assert.equal(first.effectiveEnd,'2026-11-01');
});

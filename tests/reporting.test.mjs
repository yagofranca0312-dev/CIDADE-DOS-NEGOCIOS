import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{}, {filename:'game.js'});
const oldCore=runInNewContext(readFileSync('tests/fixtures/core_v1_0_1.js','utf8')+'\nCidadeCore',{}, {filename:'old.js'});
const city=core.CITIES.find(c=>c.name==='Tianguá').id;
const cmd=(type,payload={},id=type+Math.random().toString(36).slice(2))=>({type,id,payload});
function build(engine=core) {
 let s=engine.dispatch(null,cmd('CARREIRA.CRIAR',{name:'Teste',companyName:'Negócio Teste',cityId:city,seed:1234},'create')).state;
 s=engine.dispatch(s,cmd('EMPRESA.ABRIR',{sector:'mercado',lot:3},'open')).state;
 s=engine.dispatch(s,cmd('ESTOQUE.COMPRAR',{quantity:500},'stock')).state;
 return s;
}
function apply(s,engine,type,payload,id){const r=engine.dispatch(s,cmd(type,payload,id));assert.equal(r.ok,true,r.error);return r.state;}
test('Relatório integral replica valores do overview sem alterar o save',()=>{
 let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days');
 const original=JSON.stringify(s),all=core.financialReport(s),o=core.overview(s);
 assert.equal(all.revenue,o.revenue);assert.equal(all.cogs,o.cogs);assert.equal(all.expenses,o.expenses);assert.equal(all.profit,o.profit);
 assert.equal(all.closingCash,o.cash);assert.equal(all.closingInventory,o.inventoryValue);
 assert.equal(all.closingPayable,o.payable);assert.equal(JSON.stringify(s),original);
});
test('Relatório de competência conserva fechamento Nov/2026, e Dec/2026 não duplica receita',()=>{
 let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days'); // Nov 1..30
 const nov=core.financialReport(s,'month','2026-11-15');const dec=core.financialReport(s,'month','2026-12-01');
 assert.equal(nov.from,'2026-11-01');assert.equal(nov.to,'2026-11-30');
 assert.equal(nov.revenue,core.overview(s).revenue);assert.equal(nov.profit,core.overview(s).profit);
 assert.equal(dec.revenue,0);assert.equal(dec.cogs,0);assert.equal(dec.expenses,0);
 assert.equal(dec.closingCash,nov.closingCash);assert.equal(dec.closingInventory,nov.closingInventory);
});
test('Filtragem diária usa data econômica do lançamento, não a data de visualização',()=>{
 let s=build();s=apply(s,core,'TEMPO.AVANCAR_DIA',{},'one');
 const day=core.financialReport(s,'day','2026-11-01');const next=core.financialReport(s,'day','2026-11-02');
 assert.ok(day.revenue>0);assert.ok(day.expenses>0);
 assert.equal(next.revenue,0);assert.equal(next.expenses,0);assert.equal(next.entries.length,0);
 assert.equal(next.closingCash,day.closingCash);
});
test('Agrupamento trimestral e anual = total para uma carreira de 30 dias',()=>{
 let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days');
 const quarter=core.financialReport(s,'quarter','2026-11-30');
 const annual=core.financialReport(s,'year','2026-11-30');
 const all=core.financialReport(s,'all');
 assert.equal(quarter.from,'2026-10-01');assert.equal(quarter.to,'2026-12-31');
 assert.equal(quarter.profit,all.profit);assert.equal(annual.profit,all.profit);
});
test('Sem venda no período mantém saldo do inventário, não o reconhece como CMV',()=>{
 const s=build();const all=core.financialReport(s);
 assert.equal(all.revenue,0);assert.equal(all.cogs,0);assert.equal(all.closingInventory,500*core.SECTORS.mercado.cost);
 assert.equal(all.expenses,core.SECTORS.mercado.openCost);
});
test('O histórico de preços reconstrói registros do save sem inventar valores',()=>{
 let s=build();assert.equal(core.priceHistory(s).length,0);
 s=apply(s,core,'PRECO.DEFINIR',{cents:5200},'price1');
 s=apply(s,core,'PRECO.DEFINIR',{cents:6000},'price2');
 const before=JSON.stringify(s),history=core.priceHistory(s);
 assert.equal(history.length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(history.map(x=>[x.old,x.cents]))),[[4900,5200],[5200,6000]]);
 assert.equal(JSON.stringify(s),before);
});
test('Saves originais V1.0.1 importam V1.2 com migração verificável e dados preservados',()=>{
 let v1=build(oldCore);v1=apply(v1,oldCore,'TEMPO.AVANCAR_LOTE',{days:7},'oldweek');
 v1=apply(v1,oldCore,'PRECO.DEFINIR',{cents:5300},'oldprice');
 const raw=oldCore.exportSave(v1),migrated=core.importSave(raw);
 assert.equal(migrated.migrated,true);
 assert.equal(migrated.state.schemaVersion,3);
 assert.equal(migrated.state.world.business.stockUnits,v1.world.business.stockUnits);
 assert.equal(migrated.state.world.business.totalSold,v1.world.business.totalSold);
 assert.equal(core.overview(migrated.state).cash,oldCore.overview(v1).cash);
 assert.equal(core.overview(migrated.state).inventoryValue,oldCore.overview(v1).inventoryValue);
 assert.equal(migrated.state.economy.ledger.length,v1.economy.ledger.length);
 assert.equal(core.priceHistory(migrated.state)[0].cents,5300);
 assert.equal(core.financialReport(migrated.state,'month','2026-11-03').profit,core.overview(migrated.state).profit);
 const later=apply(migrated.state,core,'TEMPO.AVANCAR_DIA',{},'newday');
 assert.equal(later.schemaVersion,3);assert.ok(later.revision>v1.revision);
});
test('Períodos inválidos e data futura são rejeitados sem alterar estado',()=>{
 const s=build(),before=JSON.stringify(s);
 assert.throws(()=>core.financialReport(s,'fortnight'),/Período/);
 assert.throws(()=>core.financialReport(s,'month','2030-01-01'),/futura/);
 assert.equal(JSON.stringify(s),before);
});

test('Relatório de toda a carreira respeita a data de corte selecionada',()=>{
 let s=build();s=apply(s,core,'TEMPO.AVANCAR_LOTE',{days:30},'30days');
 const partial=core.financialReport(s,'all','2026-11-01');
 const total=core.financialReport(s,'all','2026-11-30');
 assert.ok(total.revenue>partial.revenue);
 assert.equal(partial.effectiveEnd,'2026-11-01');
});

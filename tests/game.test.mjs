import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const sandbox={};
const coreSource=readFileSync(resolve('tests/fixtures/core_v1_2_1.js'),'utf8');
const core=runInNewContext(`${coreSource}\nCidadeCore`,sandbox,{filename:'tests/fixtures/core_v1_2_1.js'});
const tiangua=core.CITIES.find(c=>c.name==='Tianguá').id;
function cmd(type,payload={},id=type+':'+JSON.stringify(payload).replace(/[^a-z\d]/gi,'').slice(0,45)) {return {type,id,payload};}
function play(seed=1234,cityId=tiangua){
  let s=core.dispatch(null,cmd('CARREIRA.CRIAR',{name:'Teste',companyName:'Teste Comércio',cityId,seed},'create-1')).state;
  s=core.dispatch(s,cmd('EMPRESA.ABRIR',{sector:'mercado',lot:1},'open-1')).state;
  s=core.dispatch(s,cmd('ESTOQUE.COMPRAR',{quantity:500},'buy-1')).state;
  return s;
}
test('Catálogo nacional: 30 cidades, 27 UFs, Fortaleza e Brasília únicas',()=>{
  assert.equal(core.CITIES.length,30);
  assert.equal(new Set(core.CITIES.map(x=>x.id)).size,30);
  assert.equal(new Set(core.CITIES.map(x=>x.uf)).size,27);
  assert.equal(core.CITIES.filter(x=>x.name==='Fortaleza').length,1);
  assert.equal(core.CITIES.filter(x=>x.name==='Brasília').length,1);
  for(const c of core.CITIES){const r=core.dispatch(null,cmd('CARREIRA.CRIAR',{name:'Jogador',companyName:'Loja Teste',cityId:c.id,seed:9},'new-1'));assert.equal(r.ok,true,c.id);}
});
test('Compra, estoque e lançamentos reconciliáveis',()=>{
  const s=play();core.validate(s);
  assert.equal(s.world.business.stockUnits,500);
  assert.equal(core.overview(s).inventoryValue,500*core.SECTORS.mercado.cost);
  assert.equal(core.overview(s).cash,3000000-core.SECTORS.mercado.openCost-500*core.SECTORS.mercado.cost);
  assert.equal(core.overview(s).revenue,0);
});
test('Falha por saldo e ID com payload diferente não alteram estado/revisão/RNG',()=>{
  const base=play();const original=JSON.stringify(base);
  const r=core.dispatch(base,cmd('ESTOQUE.COMPRAR',{quantity:2000},'buy-too-much'));
  assert.equal(r.ok,false);assert.equal(JSON.stringify(base),original);
  const conflict=core.dispatch(base,cmd('ESTOQUE.COMPRAR',{quantity:9},'buy-1'));
  assert.equal(conflict.ok,false);assert.match(conflict.error,/Conflito/);
  assert.equal(JSON.stringify(base),original);
});
test('Retry exato é idempotente e não duplica venda, débito ou evento',()=>{
  let s=play();const input=cmd('ESTOQUE.COMPRAR',{quantity:3},'retry-32');
  const applied=core.dispatch(s,input);assert.equal(applied.ok,true);s=applied.state;
  const before=JSON.stringify(s),retry=core.dispatch(s,input);
  assert.equal(retry.status,'DUPLICATE');assert.equal(JSON.stringify(retry.state),before);
});
test('30 dias de economia: inventário jamais negativo, dia e ledger corretos',()=>{
  const s=play(),r=core.dispatch(s,cmd('TEMPO.AVANCAR_LOTE',{days:30},'month'));
  assert.equal(r.ok,true,r.error);assert.equal(r.state.calendar.tick,30);
  assert.equal(r.state.calendar.date,'2026-12-01');
  assert.ok(core.overview(r.state).revenue>0);
  assert.ok(core.overview(r.state).stock>=0);
  core.validate(r.state);
});
test('O mesmo seed e comandos produzem estado idêntico',()=>{
  const a=core.dispatch(play(),cmd('TEMPO.AVANCAR_LOTE',{days:30},'month')).state;
  const b=core.dispatch(play(),cmd('TEMPO.AVANCAR_LOTE',{days:30},'month')).state;
  assert.equal(JSON.stringify(a),JSON.stringify(b));
});
test('RNG e revisão permanecem estáveis em consultas e diagnóstico',()=>{
  const s=play();const before=JSON.stringify(s);
  core.overview(s);core.diagnostics(s);core.cityById(tiangua);
  assert.equal(JSON.stringify(s),before);
});
test('Export/import íntegro e mutação detectada',()=>{
  const s=play(),data=core.exportSave(s);
  const recovered=core.importSave(data);
  assert.equal(JSON.stringify(recovered.state),JSON.stringify(s));
  const broken=JSON.parse(data);broken.payload.rng.seed=98;
  assert.throws(()=>core.importSave(JSON.stringify(broken)),/Checksum/);
});
test('Save legado vazio CP000 migra sem inventar vendas, estoque ou saldo',()=>{
  const legacy={schemaVersion:1,meta:{title:'Cidade dos Negócios',version:'0.0.1',seed:20261101},world:{entities:[]},player:{},calendar:{tick:0},history:[]};
  const migrated=core.importSave(JSON.stringify(legacy));
  assert.equal(migrated.migrated,true);
  assert.equal(migrated.state.player.cityId,null);
  assert.equal(migrated.state.economy.ledger.length,0);
  assert.equal(core.overview(migrated.state).cash,0);
});
test('Save legado com histórico não suportado é rejeitado com segurança',()=>{
  const legacy={schemaVersion:1,meta:{title:'Cidade dos Negócios',seed:123},world:{entities:[{id:'x'}]},player:{},calendar:{tick:1},history:['x']};
  assert.throws(()=>core.importSave(JSON.stringify(legacy)),/não suportada/);
});
test('2027, 2033 e após: tempo contínuo, regras fiscais permanecem NOT_COVERED',()=>{
  let s=play();
  for(let i=0;i<80;i++) {
    const r=core.dispatch(s,{type:'TEMPO.AVANCAR_LOTE',id:`step-${i}`,payload:{days:30}});
    assert.equal(r.ok,true,r.error);s=r.state;
  }
  assert.ok(s.calendar.date>'2033-01-01');assert.equal(s.fiscal.coverageStatus,'NOT_COVERED');
});
test('Lote rejeitado não confirma nenhum dia',()=>{
  const s=play(),before=JSON.stringify(s);
  const r=core.dispatch(s,cmd('TEMPO.AVANCAR_LOTE',{days:31},'bad-batch'));
  assert.equal(r.ok,false);assert.equal(JSON.stringify(s),before);
});
test('30 cidades: carreira, 30 dias e finanças validadas em cada uma',()=>{
  for(const c of core.CITIES){
    const base=play(7,c.id);
    const r=core.dispatch(base,cmd('TEMPO.AVANCAR_LOTE',{days:30},'month-30'));
    assert.equal(r.ok,true,`${c.id}: ${r.error}`);core.validate(r.state);
  }
});

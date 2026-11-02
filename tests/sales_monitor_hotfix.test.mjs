import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const load=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const game=load('src/core/game.js');
const old=load('tests/fixtures/core_v1_2_0.js');
const city=game.CITIES.find(x=>x.name==='Tianguá').id;
let seq=0;
const apply=(engine,s,type,payload={})=>{
  const result=engine.dispatch(s,{type,id:`h121:${++seq}`,payload});
  assert.equal(result.ok,true,result.error);return result.state;
};
const prepared=(engine=game,base=20,other=12)=>{
  let s=apply(engine,null,'CARREIRA.CRIAR',{name:'QA',companyName:'Mercado',cityId:city,seed:17845});
  s=apply(engine,s,'EMPRESA.ABRIR',{sector:'mercado',lot:3});
  s=apply(engine,s,'COMPRAS.REGISTRAR',{supplierId:'regional',items:[
    {productId:'base',quantity:base},{productId:'extra-1',quantity:other}
  ]});
  return s;
};

test('Hotfix: venda manual bloqueada pelo núcleo não altera qualquer estado nem gera eventos',()=>{
  const s=prepared();const before=JSON.stringify(s);
  for(const payload of [
    {items:[{productId:'base',quantity:1}]},
    {items:[{productId:'base',quantity:2},{productId:'extra-1',quantity:2}]},
    {},
  ]){
    const response=game.dispatch(s,{type:'VENDA.REGISTRAR',id:`refused:${++seq}`,payload});
    assert.equal(response.ok,false);
    assert.match(response.error,/Venda manual desativada/);
    assert.equal(JSON.stringify(s),before);
    assert.equal(JSON.stringify(response.state),before);
  }
});

test('Hotfix: demanda diária é registrada e corresponde às vendas e ao CMV',()=>{
  const before=prepared();const after=apply(game,before,'TEMPO.AVANCAR_DIA');
  const ev=after.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA');
  assert.equal(ev.length,1);
  assert.equal(ev[0].date,'2026-11-01');
  const d=ev[0].data;
  assert.equal(d.estimated,d.fulfilled+d.unmet);
  assert.equal(d.estimated,d.items.reduce((n,x)=>n+(x.estimated??0),0));
  assert.equal(d.fulfilled,d.items.reduce((n,x)=>n+x.fulfilled,0));
  assert.equal(d.withoutStock,d.items.filter(x=>x.estimated===null).length);
  assert.equal(d.withoutStock,1);
  const sales=after.world.business.sales;
  assert.equal(sales.length,1);
  assert.equal(sales[0].kind,'SIMULACAO_DIARIA');
  assert.equal(sales[0].items.reduce((n,x)=>n+x.quantity,0),d.fulfilled);
  assert.equal(game.overview(after).revenue,sales[0].total);
  assert.equal(game.overview(after).cogs,sales[0].cogs);
  assert.equal(after.world.business.totalSold,d.fulfilled);
  assert.equal(after.world.business.stockUnits,before.world.business.stockUnits-d.fulfilled);
  game.validate(after);
});

test('Hotfix: ruptura registra demanda não atendida e SKU sem estoque não é falsamente zero',()=>{
  const initial=prepared(game,1,1);
  const after=apply(game,initial,'TEMPO.AVANCAR_DIA');
  const demand=after.audit.events.find(e=>e.type==='DEMANDA.SIMULADA').data;
  assert.ok(demand.unmet>0);
  assert.equal(demand.fulfilled,2);
  const out=demand.items.find(x=>x.productId==='extra-2');
  assert.equal(out.estimated,null);
  assert.equal(out.unmet,null);
  assert.equal(out.fulfilled,0);
  const second=apply(game,after,'TEMPO.AVANCAR_DIA');
  const latest=second.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA').at(-1).data;
  assert.equal(latest.withoutStock,3);
  assert.equal(latest.estimated,0); // nenhum SKU tem estoque; não significa demanda de mercado igual a zero
  assert.equal(latest.items.every(x=>x.estimated===null),true);
  assert.equal(second.world.business.sales.length,1);
});

test('Hotfix: economia, RNG e recibos automáticos idênticos à V1.2 para mesmos comandos',()=>{
  const baseNew=prepared(game,200,150);
  const baseOld=prepared(old,200,150);
  const a=apply(game,baseNew,'TEMPO.AVANCAR_LOTE',{days:21});
  const b=apply(old,baseOld,'TEMPO.AVANCAR_LOTE',{days:21});
  assert.equal(a.rng.seed,b.rng.seed);
  assert.equal(a.calendar.date,b.calendar.date);
  assert.equal(a.calendar.tick,b.calendar.tick);
  assert.equal(JSON.stringify(a.economy),JSON.stringify(b.economy));
  assert.equal(JSON.stringify(a.world.business),JSON.stringify(b.world.business));
  assert.equal(JSON.stringify(game.overview(a)),JSON.stringify(old.overview(b)));
  assert.equal(a.audit.events.filter(x=>x.type==='DEMANDA.SIMULADA').length,21);
  assert.equal(b.audit.events.filter(x=>x.type==='DEMANDA.SIMULADA').length,0);
  game.validate(a);
});

test('Hotfix: importação de save com venda manual antiga preserva histórico sem converter',()=>{
  let s=prepared(old,50,20);
  s=apply(old,s,'VENDA.REGISTRAR',{items:[{productId:'base',quantity:2}]});
  const preserved=old.exportSave(s);
  const imported=game.importSave(preserved);
  assert.equal(imported.migrated,false);
  assert.equal(JSON.stringify(imported.state),JSON.stringify(s));
  assert.equal(imported.state.world.business.sales[0].kind,'BALCAO');
  const after=apply(game,imported.state,'TEMPO.AVANCAR_DIA');
  assert.equal(after.world.business.sales[0].kind,'BALCAO');
  assert.equal(after.world.business.sales[1].kind,'SIMULACAO_DIARIA');
  assert.equal(after.world.business.sales.length,2);
  const oldFirst=s.world.business.sales[0];
  assert.equal(JSON.stringify(after.world.business.sales[0]),JSON.stringify(oldFirst));
  const copied=game.importSave(game.exportSave(after));
  assert.equal(JSON.stringify(copied.state),JSON.stringify(after));
  assert.equal(copied.state.schemaVersion,3);
  game.validate(copied.state);
});

test('Hotfix: interface não contém venda manual e exibe demanda e comprovantes',()=>{
  const ui=readFileSync('src/ui/app.js','utf8');
  const template=readFileSync('src/shell/index.template.html','utf8');
  assert.doesNotMatch(template,/id="cart-(?:add|checkout|clear)"/);
  assert.doesNotMatch(template,/id="sale-quantity"|id="sale-product"/);
  assert.doesNotMatch(ui,/commit\('VENDA.REGISTRAR'/);
  assert.match(template,/Painel de vendas automáticas/);
  for(const token of ['demand-estimated','demand-fulfilled','demand-unmet','demand-without-stock','demand-day-revenue','demand-day-cogs','demand-rows','recent-sales']){
    assert.ok(template.includes(`id="${token}"`),token);
  }
  assert.match(ui,/Venda manual histórica \(V1\.2\)/);
});

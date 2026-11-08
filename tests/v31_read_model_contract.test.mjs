import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createV31ReadModel,V31_READ_MODEL_VERSION} from '../src/contracts/v31-read-model.mjs';

const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const model=createV31ReadModel(core);
let seq=0;
function cmd(state,type,payload={}){
  const result=core.dispatch(state,{id:'v31-contract-'+(++seq),type,payload});
  assert.equal(result.ok,true,type+': '+result.error);
  return result.state;
}
function start(seed=310701){
  return cmd(null,'CARREIRA.CRIAR',{name:'Teste V31',companyName:'Negócios do Laboratório',cityId:'CE-TIANGUA',seed});
}
function opened(seed=310702){
  let s=start(seed);
  s=cmd(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:2});
  return s;
}

test('V3.0-07: catálogo e cidade vazia usam 30 cidades e 18 lotes sem inventar empresas',()=>{
  const cities=model.listCities();
  assert.equal(cities.length,30);
  assert.equal(cities.find(c=>c.name==='Tianguá').id,'CE-TIANGUA');
  assert.equal(V31_READ_MODEL_VERSION,1);
  assert.equal(model.version,1);
  const first=model.readCity(null);
  assert.equal(first.city,null);
  assert.equal(first.group,null);
  assert.equal(first.lots.length,0);
  const view=model.readCity(null,{cityId:'CE-TIANGUA',selectedLot:2});
  assert.equal(view.lots.length,18);
  assert.equal(view.lots[1].selected,true);
  assert.ok(view.lots.every(x=>x.ownership==='UNCLAIMED_BY_PLAYER'&&x.unit===null));
  assert.equal(view.city.economicModel,'SIMULATED');
  assert.throws(()=>model.readCity(null,{cityId:'CE-FAKE'}),/Cidade inválida/);
  assert.throws(()=>model.readCity(null,{cityId:'CE-TIANGUA',selectedLot:19}),/Lote/);
});

test('V3.0-07: projeção lê unidade real, cidade e lote, sem alterar inventário',()=>{
  let s=opened();
  s=cmd(s,'ESTOQUE.COMPRAR',{quantity:12,supplierId:'regional',productId:'base'});
  const before=JSON.stringify(s),city=model.readCity(s,{selectedLot:2});
  assert.equal(city.worldId,s.worldId);
  assert.equal(city.revision,s.revision);
  assert.equal(city.schemaVersion,9);
  assert.equal(city.city.name,'Tianguá');
  assert.equal(city.lots.length,18);
  assert.equal(city.lots[1].unit.id,core.activeBusiness(s).id);
  assert.equal(city.lots[1].unit.sector,'mercado');
  assert.equal(city.lots[1].unit.stockUnits,core.activeBusiness(s).stockUnits);
  assert.equal(city.lots[1].unit.active,true);
  assert.equal(city.group.cashCents,core.overview(s).cash);
  assert.equal(JSON.stringify(s),before);
  assert.equal(Object.isFrozen(city),true);
  assert.equal(Object.isFrozen(city.group),true);
  assert.equal(Object.isFrozen(city.lots[1].unit),true);
  assert.throws(()=>{city.group.cashCents=999999999;},TypeError);
  assert.throws(()=>{city.lots.push({lot:19});},TypeError);
  assert.equal(JSON.stringify(s),before);
});

test('V3.0-07: projeção cross-city distingue unidades reais e lotes livres',()=>{
  let s=opened(310703);
  s=cmd(s,'EMPRESA.ABRIR',{cityId:'CE-SOBRAL',lot:7,sector:'roupas'});
  const sobral=model.readCity(s,{cityId:'CE-SOBRAL',selectedLot:7});
  const tiangua=model.readCity(s,{cityId:'CE-TIANGUA',selectedLot:2});
  assert.equal(sobral.lots[6].unit.sector,'roupas');
  assert.equal(sobral.lots[6].unit.active,true);
  assert.equal(tiangua.lots[1].unit.sector,'mercado');
  assert.equal(tiangua.lots[1].unit.active,false);
  assert.equal(sobral.lots.filter(x=>x.unit!==null).length,1);
  assert.equal(tiangua.lots.filter(x=>x.unit!==null).length,1);
  assert.equal(sobral.group.units,2);
  assert.equal(tiangua.group.units,2);
  assert.equal(sobral.lots[0].ownership,'UNCLAIMED_BY_PLAYER');
});

test('V3.0-07: evento recente vem em ordem reversa e sem payload/razão bruto',()=>{
  let s=opened(310704);
  s=cmd(s,'TEMPO.AVANCAR_LOTE',{days:3});
  const original=JSON.stringify(s),feed=model.readEvents(s,{mode:'recent',limit:5});
  assert.equal(feed.events.length,5);
  assert.equal(feed.totalRecorded,s.audit.events.length);
  assert.equal(feed.nextSeq,s.audit.eventSeq);
  assert.equal(feed.events[0].id,s.audit.events.at(-1).id);
  assert.equal(feed.events[0].textFormat,'PLAIN_TEXT');
  assert.equal(Object.hasOwn(feed.events[0],'data'),false);
  assert.equal(Object.hasOwn(feed.events[0],'entries'),false);
  assert.equal(JSON.stringify(s),original);
  assert.equal(Object.isFrozen(feed.events),true);
  assert.throws(()=>model.readEvents(s,{limit:101}),/Limite/);
  assert.throws(()=>model.readEvents(s,{mode:'unsafe'}),/Modo/);
});

test('V3.0-07: delta de eventos usa cursor confirmado, não inventa atualizações',()=>{
  let s=opened(310705);
  const oldSeq=s.audit.eventSeq;
  s=cmd(s,'TEMPO.AVANCAR_LOTE',{days:4});
  let nextSeq=oldSeq,seen=[];
  for(let i=0;i<100;i++){
    const page=model.readEvents(s,{mode:'delta',afterSeq:nextSeq,limit:2});
    assert.ok(page.events.length<=2);
    assert.ok(page.events.every(x=>x.seq>nextSeq));
    if(page.events.length)nextSeq=page.nextSeq;
    seen.push(...page.events);
    if(!page.hasMore)break;
  }
  assert.equal(nextSeq,s.audit.eventSeq);
  assert.equal(seen.length,s.audit.events.length-oldSeq);
  assert.equal(new Set(seen.map(e=>e.id)).size,seen.length);
  assert.equal(model.readEvents(s,{mode:'delta',afterSeq:nextSeq}).events.length,0);
  assert.equal(model.readEvents(s,{mode:'delta',afterSeq:nextSeq}).nextSeq,nextSeq);
});

test('V3.0-07: filtro municipal não expõe histórico de outra unidade como se fosse local',()=>{
  let s=opened(310706);
  s=cmd(s,'EMPRESA.ABRIR',{cityId:'CE-SOBRAL',lot:1,sector:'padaria'});
  const original=JSON.stringify(s);
  const local=model.readEvents(s,{cityId:'CE-SOBRAL'});
  const other=model.readEvents(s,{cityId:'CE-TIANGUA'});
  assert.ok(local.events.some(x=>x.businessId===core.activeBusiness(s).id));
  assert.ok(other.events.some(x=>x.businessId!==core.activeBusiness(s).id));
  assert.ok(local.events.every(x=>x.businessId===core.activeBusiness(s).id ||
    x.type==='EMPRESA.ABERTA'));
  assert.equal(JSON.stringify(s),original);
  assert.throws(()=>model.readEvents(s,{cityId:'CE-FAKE'}),/Cidade inválida/);
});

test('V3.0-07: sugestões de ações são consultivas, sem comando nem sucesso implícito',()=>{
  const s=start(310707);
  const hinted=model.readActionHints(s,{cityId:'CE-TIANGUA',lot:2});
  assert.equal(hinted.authority,'ADVISORY_ONLY');
  assert.equal(hinted.dispatchOwner,'CidadeCore.dispatch');
  assert.equal(hinted.revision,s.revision);
  const open=hinted.actions.find(a=>a.intent==='EMPRESA.ABRIR');
  assert.equal(open.kind,'GAME_COMMAND');
  assert.equal(open.advisoryEnabled,true);
  assert.equal(open.options.length,3);
  assert.equal(open.options[0].openCostCents,core.SECTORS.mercado.openCost);
  assert.equal(open.payloadFields.includes('cityId'),true);
  assert.equal(open.payloadFields.includes('sector'),true);
  assert.equal(hinted.actions.find(a=>a.intent==='SELECT_LOT').kind,'UI_ONLY');
  assert.equal(hinted.actions.some(a=>a.intent==='VENDA.REGISTRAR'),false);
  assert.equal(Object.hasOwn(s,'v31ReadModel'),false);
  assert.equal(Object.hasOwn(s.world,'overlay'),false);
  assert.equal(typeof hinted.dispatch,'undefined');
  assert.equal(typeof model.dispatch,'undefined');
  assert.equal(Object.isFrozen(hinted.actions),true);
  assert.throws(()=>{open.advisoryEnabled=false;},TypeError);
});

test('V3.0-07: unidade ocupada oferece ativação, não permite sugestão de abertura duplicada',()=>{
  let s=opened(310708);
  let hints=model.readActionHints(s,{cityId:'CE-TIANGUA',lot:2});
  assert.equal(hints.actions.find(x=>x.intent==='EMPRESA.ABRIR').advisoryEnabled,false);
  assert.equal(hints.actions.find(x=>x.intent==='EMPRESA.ATIVAR').advisoryEnabled,false);
  s=cmd(s,'EMPRESA.ABRIR',{cityId:'CE-SOBRAL',lot:3,sector:'padaria'});
  hints=model.readActionHints(s,{cityId:'CE-TIANGUA',lot:2});
  const active=hints.actions.find(x=>x.intent==='EMPRESA.ATIVAR');
  assert.equal(active.advisoryEnabled,true);
  assert.equal(active.targetBusinessId,s.world.business.id);
  assert.equal(model.readActionHints(null,{cityId:'CE-TIANGUA',lot:2})
    .actions.find(x=>x.intent==='EMPRESA.ABRIR').advisoryEnabled,false);
});

test('V3.0-07: revisão e worldId impedem uso do overlay de carreira obsoleta',()=>{
  const one=start(310709),first=model.readCity(one,{selectedLot:1});
  assert.equal(model.isCurrent(first,one),true);
  const advanced=cmd(one,'TEMPO.AVANCAR_DIA');
  assert.equal(model.isCurrent(first,advanced),false);
  const other=start(310710);
  assert.equal(one.revision,other.revision);
  assert.equal(model.isCurrent(first,other),false);
  assert.equal(model.isCurrent(model.readCity(other),other),true);
  assert.equal(model.isCurrent(model.readCity(null),null),true);
});

test('V3.0-07: leituras repetidas nunca disparam motor, storage, timers ou mutam RNG',()=>{
  let calls=0;
  const wrapped=Object.assign({},core,{dispatch(){calls++;throw Error('dispatch proibido no modelo');}});
  const readOnly=createV31ReadModel(wrapped);
  let s=opened(310711);
  s=cmd(s,'TEMPO.AVANCAR_LOTE',{days:30});
  const before=JSON.stringify(s),seed=s.rng.seed,events=s.audit.eventSeq;
  for(let i=0;i<120;i++){
    const c=readOnly.readCity(s,{cityId:i%2?'CE-TIANGUA':'CE-SOBRAL',selectedLot:2});
    const e=readOnly.readEvents(s,{limit:10});
    const d=readOnly.readActionHints(s,{cityId:'CE-TIANGUA',lot:2});
    assert.ok(Object.isFrozen(c)&&Object.isFrozen(e)&&Object.isFrozen(d));
  }
  assert.equal(JSON.stringify(s),before);
  assert.equal(s.rng.seed,seed);
  assert.equal(s.audit.eventSeq,events);
  assert.equal(calls,0);
});

test('V3.0-07: nenhuma mudança no build/HTML; adapter separado para V3.1',()=>{
  const build=readFileSync('tools/build.mjs','utf8');
  const shell=readFileSync('src/ui/app.js','utf8');
  const contract=readFileSync('src/contracts/v31-read-model.mjs','utf8');
  assert.doesNotMatch(build,/v31-read-model/);
  assert.doesNotMatch(shell,/v31-read-model/);
  assert.doesNotMatch(contract,/\bwindow\b|\bdocument\b|localStorage\.|setInterval\(|setTimeout\(|requestAnimationFrame\(/);
  assert.doesNotMatch(contract,/core\.dispatch\s*\(|Core\.dispatch\s*\(/);
  assert.match(contract,/ADVISORY_ONLY/);
  assert.match(contract,/V31_READ_MODEL_VERSION = 1/);
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.version,'3.0.0-alpha.1');
});

import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const load=p=>runInNewContext(readFileSync(p,'utf8')+'\nCidadeCore',{});
const V16=load('src/core/game.js'),V15=load('tests/fixtures/core_v1_5_0.js');
const C=name=>V16.CITIES.find(c=>c.name===name),T=C('Tianguá'),S=C('Sobral'),F=C('Fortaleza'),U=C('Ubajara');
let i=0;
function run(engine,state,type,payload={}){
 const r=engine.dispatch(state,{id:`r16:${++i}`,type,payload});
 assert.equal(r.ok,true,`${type}: ${r.error}`);return r.state;
}
function fresh(engine=V16,name='Tianguá',seed=88){
 const city=(engine.CITIES.find(x=>x.name===name)||{}).id;
 let state=run(engine,null,'CARREIRA.CRIAR',{name:'Pessoa Teste',companyName:'Rede Regional',cityId:city,seed});
 return run(engine,state,'EMPRESA.ABRIR',{sector:'mercado',lot:1});
}
test('V1.6: versão/schema 7, 30 municípios oficiais identificados sem duplicação',()=>{
 assert.equal(V16.VERSION,'1.8.0-rc.1');assert.equal(V16.SCHEMA_VERSION,8);
 assert.equal(V16.CITIES.length,30);
 assert.equal(new Set(V16.CITIES.map(c=>c.ibgeCode)).size,30);
 assert.equal(new Set(V16.CITIES.map(c=>c.id)).size,30);
 assert.equal(new Set(V16.CITIES.map(c=>c.uf)).size,27);
 assert.ok(V16.CITIES.every(c=>/^\d{7}$/.test(c.ibgeCode)&&Number.isInteger(c.population2026)&&c.population2026>30000&&c.populationYear===2026));
});
test('V1.6: fonte IBGE 2026, período e cidades CE exatas',()=>{
 assert.equal(V16.ECONOMIC_REFERENCES.population.year,2026);
 assert.equal(V16.ECONOMIC_REFERENCES.population.referenceDate,'2026-07-01');
 assert.match(V16.ECONOMIC_REFERENCES.population.url,/ibge\.gov\.br.*POP2026_20261029\.pdf/);
 assert.deepEqual([T.ibgeCode,T.population2026],['2313401',87757]);
 assert.deepEqual([S.ibgeCode,S.population2026],['2312908',217690]);
 assert.deepEqual([U.ibgeCode,U.population2026],['2313609',34531]);
 assert.deepEqual([F.ibgeCode,F.population2026],['2304400',2582360]);
});
test('V1.6: cidades de capitais distintas usam dados oficiais verificados',()=>{
 assert.equal(C('São Paulo').population2026,11911337);
 assert.equal(C('Brasília').population2026,3009996);
 assert.equal(C('Rio de Janeiro').population2026,6731133);
 assert.equal(C('Manaus').population2026,2327101);
 assert.equal(C('Natal').population2026,783196);
 assert.equal(C('Campo Grande').population2026,970843);
});
test('V1.6: PIB 2023 e REGIC 2018 permanecem sem dados quando não verificáveis',()=>{
 const p=V16.regionalProfile(T.id);
 assert.equal(p.gdp2023Thousand,2265253);assert.equal(p.regic2018,null);
 assert.equal(V16.ECONOMIC_REFERENCES.gdp.available,true);
 assert.equal(V16.ECONOMIC_REFERENCES.regic.available,false);
 assert.match(p.note,/fictícias/);
 assert.equal(V16.regionalProfile('xx'),null);
});
test('V1.6: porte e calibração de mercado são limitados, monotônicos e distintos',()=>{
 assert.equal(U.sizeTier,'local');assert.equal(T.sizeTier,'local');
 assert.equal(S.sizeTier,'regional');assert.equal(F.sizeTier,'metropole');
 assert.ok(U.factor<T.factor&&T.factor<S.factor&&S.factor<F.factor);
 assert.ok(V16.CITIES.every(c=>c.factor>=80&&c.factor<=130));
 assert.ok(V16.CITIES.every(c=>c.competitionFactor>=96&&c.competitionFactor<=102));
 assert.ok(V16.CITIES.every(c=>c.priceElasticity>=1.25&&c.priceElasticity<=1.7));
});
test('V1.6: concorrência metropolitana muda referência sem alterar preço de tabela',()=>{
 let t=fresh(V16),f=fresh(V16,'Fortaleza');
 const pT=V16.activeBusiness(t).products[0],pF=V16.activeBusiness(f).products[0];
 assert.equal(pT.priceCents,pF.priceCents);
 assert.ok(V16.competitorReference(f,pF,F)<V16.competitorReference(t,pT,T));
 assert.ok(V16.demandElasticity(pF.priceCents,V16.competitorReference(f,pF,F),F)<V16.demandElasticity(pT.priceCents,V16.competitorReference(t,pT,T),T));
});
test('V1.6: importação V1.5 schema6 preserva matriz, filial e histórico sem reiniciar a rede',()=>{
 let legacy=fresh(V15);legacy=run(V15,legacy,'EMPRESA.ABRIR',{sector:'padaria',cityId:V15.CITIES.find(c=>c.name==='Sobral').id,lot:2});
 legacy=run(V15,legacy,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:50});
 legacy=run(V15,legacy,'TEMPO.AVANCAR_LOTE',{days:4});
 const original=JSON.parse(JSON.stringify(legacy)),serialized=V15.exportSave(legacy);
 const converted=V16.importSave(serialized);
 assert.equal(converted.migrated,true);assert.equal(converted.state.schemaVersion,8);
 assert.equal(converted.state.world.regional.datasetId,'IBGE-POP2026-20261029');
 assert.equal(converted.state.world.regional.effectiveFrom,original.calendar.date);
 assert.equal(converted.state.world.activeBusinessId,original.world.activeBusinessId);
 assert.equal(JSON.stringify(converted.state.world.business),JSON.stringify(original.world.business));
 assert.equal(JSON.stringify(converted.state.world.branches),JSON.stringify(original.world.branches));
 assert.equal(JSON.stringify(converted.state.economy),JSON.stringify(original.economy));
 assert.equal(JSON.stringify(converted.state.audit),JSON.stringify(original.audit));
 assert.equal(converted.state.rng.seed,original.rng.seed);
 assert.equal(V16.overview(converted.state).cash,V15.overview(legacy).cash);
 assert.equal(V16.overview(converted.state).stock,V15.overview(legacy).stock);
 V16.validate(converted.state);
 const repeat=V16.importSave(V16.exportSave(converted.state));assert.equal(repeat.migrated,false);
});
test('V1.6: migração só adiciona dados regionais, sem registrar venda/reclassificar balanço',()=>{
 let s=fresh(V15);s=run(V15,s,'TEMPO.AVANCAR_LOTE',{days:12});
 const before=V15.overview(s),after=V16.importSave(V15.exportSave(s)).state;
 const current=V16.overview(after);
 for(const key of ['cash','inventoryValue','inTransit','receivables','payable','revenue','cogs','expenses','profit','stock'])assert.equal(current[key],before[key],key);
 assert.equal(JSON.stringify(s.economy.ledger),JSON.stringify(after.economy.ledger));
});
test('V1.6: adulteração de metadados regionais é rejeitada sem mutar a carreira',()=>{
 let s=fresh();const old=JSON.stringify(s);s.world.regional.datasetId='fake';
 assert.throws(()=>V16.validate(s),/regional/);
 let ok=JSON.parse(old),r=V16.dispatch(ok,{type:'TEMPO.AVANCAR_DIA',id:'reject:test'});
 assert.equal(r.ok,true);assert.equal(ok.calendar.tick,0);assert.equal(ok.schemaVersion,8);
});
test('V1.6: não faz chamada externa para jogar e mapa diferencia porte sem fonte de rede',()=>{
 const html=readFileSync('src/shell/index.template.html','utf8');const ui=readFileSync('src/ui/app.js','utf8');
 for(const id of ['regional-population','regional-code','regional-gdp','regional-regic','regional-source','regional-demand-factor'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(ui,/function renderRegional\(city\)/);assert.match(ui,/urbanSize\*7/);
 assert.doesNotMatch(ui,/\b(?:fetch|XMLHttpRequest|eval)\s*\(/);
});
test('V1.6: evolução de 365 dias com 3 unidades concilia lançamentos e demanda regional',()=>{
 let s=fresh();s=run(V16,s,'EMPRESA.ABRIR',{sector:'mercado',cityId:S.id,lot:1});
 s=run(V16,s,'EMPRESA.ABRIR',{sector:'mercado',cityId:T.id,lot:2});
 for(let j=0;j<12;j++)s=run(V16,s,'TEMPO.AVANCAR_LOTE',{days:30});
 s=run(V16,s,'TEMPO.AVANCAR_LOTE',{days:5});
 assert.equal(s.calendar.tick,365);assert.equal(V16.businesses(s).length,3);
 assert.equal(s.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA').length,1095);
 const e=s.audit.events.find(e=>e.type==='DEMANDA.SIMULADA'&&e.businessId==='est-1');
 assert.equal(e.data.regionalDataset,'IBGE-POP2026-20261029');assert.equal(e.data.regionalFactor,T.factor);
 V16.validate(s);
 const totals=V16.groupReport(s);assert.equal(totals.units.reduce((n,u)=>n+u.profit,0),totals.group.profit);
});

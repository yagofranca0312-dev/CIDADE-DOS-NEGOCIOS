import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const load=p=>runInNewContext(readFileSync(p,'utf8')+'\nCidadeCore',{});
const C=load('src/core/game.js'),Old=load('tests/fixtures/core_v1_6_0.js');
const city=n=>C.CITIES.find(x=>x.name===n);
let seq=0;
const run=(engine,state,type,payload={})=>{
 const r=engine.dispatch(state,{id:`v17:${++seq}`,type,payload});
 assert.equal(r.ok,true,`${type}: ${r.error}`); return r.state;
};
const fresh=(engine=C)=>{
 let s=run(engine,null,'CARREIRA.CRIAR',{name:'Auditoria PIB',companyName:'Mercado Regional',cityId:engine.CITIES.find(c=>c.name==='Tianguá').id,seed:2026});
 return run(engine,s,'EMPRESA.ABRIR',{sector:'mercado',lot:1});
};
test('V1.7: dados oficiais PIB 2023 cobrem 30 municípios com códigos únicos e unidade R$ mil',()=>{
 assert.equal(C.VERSION,'2.7.0-alpha.1'); assert.equal(C.SCHEMA_VERSION,9);
 assert.equal(C.CITIES.length,30);
 assert.equal(new Set(C.CITIES.map(c=>c.ibgeCode)).size,30);
 assert.ok(C.CITIES.every(c=>Number.isSafeInteger(c.gdp2023Thousand)&&c.gdp2023Thousand>0&&c.gdpYear===2023));
 assert.equal(C.ECONOMIC_REFERENCES.gdp.year,2023);
 assert.equal(C.ECONOMIC_REFERENCES.gdp.unit,'R$ mil');
 assert.equal(C.ECONOMIC_REFERENCES.gdp.available,true);
});
test('V1.7: IBGE SIDRA 5938 PIB total de cidades-chave corresponde à tabela oficial',()=>{
 assert.equal(city('Tianguá').gdp2023Thousand,2265253);
 assert.equal(city('Sobral').gdp2023Thousand,6588929);
 assert.equal(city('Ubajara').gdp2023Thousand,839887);
 assert.equal(city('Fortaleza').gdp2023Thousand,86939832);
 assert.equal(city('São Paulo').gdp2023Thousand,1066825105);
 assert.match(C.regionalProfile(city('Tianguá').id).gdpSource,/apisidra\.ibge\.gov\.br\/values\/t\/5938\/n6\/2313401\/v\/37\/p\/2023/);
});
test('V1.7: uso do PIB é limitado a 8 p.p., não vira PIB per capita nem renda',()=>{
 for(const c of C.CITIES){
  assert.ok(c.gdpAdjustment>=-8&&c.gdpAdjustment<=8);
  assert.equal(c.factor,Math.max(80,Math.min(130,c.populationFactor+c.gdpAdjustment)));
  assert.ok(c.factor>=80&&c.factor<=130);
 }
 const p=C.regionalProfile(city('Sobral').id);
 assert.equal(p.regic2018,null);
 assert.equal(C.ECONOMIC_REFERENCES.regic.available,false);
 assert.ok(!('gdpPerCapita2023' in p));
 assert.match(p.note,/sem classificação municipal integrada/);
});
test('V1.7: comparação regional é pura, tipada e não inventa fluxo entre municípios',()=>{
 let s=fresh();const before=JSON.stringify(s);
 const list=C.regionalComparison([city('Tianguá').id,city('Sobral').id]);
 assert.equal(list.length,2);
 assert.equal(list[0].gdp2023Thousand,2265253);
 assert.ok(list[1].simulatedDemandFactor>list[0].simulatedDemandFactor);
 assert.equal(JSON.stringify(s),before);
 assert.throws(()=>C.regionalComparison(['INEXISTENTE']),/Cidade/);
});
test('V1.7: migração de save V1.6 preserva ledger, vendas, matriz/filiais, RNG e datas anteriores',()=>{
 let previous=fresh(Old);
 previous=run(Old,previous,'EMPRESA.ABRIR',{sector:'padaria',cityId:city('Sobral').id,lot:2});
 previous=run(Old,previous,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:50});
 previous=run(Old,previous,'TEMPO.AVANCAR_LOTE',{days:7});
 const before=JSON.parse(JSON.stringify(previous)),restored=C.importSave(Old.exportSave(previous));
 assert.equal(restored.migrated,true);
 const after=restored.state;
 assert.equal(after.schemaVersion,9);
 assert.deepEqual(JSON.stringify(after.world.business),JSON.stringify(before.world.business));
 assert.deepEqual(JSON.stringify(after.world.branches),JSON.stringify(before.world.branches));
 assert.equal(JSON.stringify(after.economy),JSON.stringify(before.economy));
 assert.equal(JSON.stringify(after.audit),JSON.stringify(before.audit));
 assert.equal(after.rng.seed,before.rng.seed);
 assert.equal(after.calendar.date,before.calendar.date);
 assert.equal(after.world.regional.effectiveFrom,before.world.regional.effectiveFrom);
 assert.equal(after.world.regional.gdpEffectiveFrom,before.calendar.date);
 assert.equal(after.world.regional.gdpDatasetId,C.ECONOMIC_REFERENCES.gdp.id);
 C.validate(after);
 assert.equal(C.importSave(C.exportSave(after)).migrated,false);
});
test('V1.7: dados PIB não criam caixa, vendas ou eventos antes do avanço do dia',()=>{
 let old=fresh(Old),migrated=C.importSave(Old.exportSave(old)).state;
 assert.equal(C.overview(migrated).cash,Old.overview(old).cash);
 assert.equal(C.overview(migrated).revenue,Old.overview(old).revenue);
 assert.equal(migrated.audit.events.length,old.audit.events.length);
 assert.equal(migrated.economy.ledger.length,old.economy.ledger.length);
 migrated=run(C,migrated,'TEMPO.AVANCAR_DIA');
 const today=migrated.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA').at(-1);
 assert.equal(today.data.regionalGdpDataset,'IBGE-SIDRA5938-V37-2023');
 assert.equal(today.data.regionalModelId,'REGIONAL-V2-PIB');
});
test('V1.7: data e ID da base de PIB protegidos por validação',()=>{
 let s=fresh();s.world.regional.gdpDatasetId='INVENTADO';
 assert.throws(()=>C.validate(s),/PIB/);
 s=fresh();s.world.regional.gdpEffectiveFrom='1900-01-01';
 assert.throws(()=>C.validate(s),/PIB/);
});
test('V1.7: 365 dias, três unidades e caixa e resultado consolidados conciliados',()=>{
 let s=fresh();
 s=run(C,s,'EMPRESA.ABRIR',{sector:'mercado',cityId:city('Sobral').id,lot:2});
 s=run(C,s,'EMPRESA.ABRIR',{sector:'mercado',cityId:city('Tianguá').id,lot:3});
 for(let i=0;i<12;i++)s=run(C,s,'TEMPO.AVANCAR_LOTE',{days:30});
 s=run(C,s,'TEMPO.AVANCAR_LOTE',{days:5});
 C.validate(s);
 assert.equal(s.calendar.tick,365);
 const report=C.groupReport(s);
 assert.equal(report.units.length,3);
 assert.equal(report.units.reduce((n,u)=>n+u.profit,0),report.group.profit);
});
test('V1.7: rodapé, topo, abertura e título não repetem v1.5 nem v1.6',()=>{
 const html=readFileSync('index.html','utf8'),template=readFileSync('src/shell/index.template.html','utf8'),ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));
 for(const s of [html,template]){
  assert.match(s,/id="intro-version">v2\.7\.0-alpha\.1/);
  assert.match(s,/id="build-version">v2\.7\.0-alpha\.1/);
  assert.match(s,/id="footer-version">v2\.7\.0-alpha\.1/);
  assert.match(s,/<title>Cidade dos Negócios 1 · v2\.7\.0-alpha\.1<\/title>/);
  assert.doesNotMatch(s,/V1\.5\.0-RC\.1|v1\.6\.0-rc\.1|V1\.4\.0-rc\.1/);
 }
 assert.match(ui,/for\(const id of \['intro-version','build-version','footer-version'\]\)/);
 assert.match(ui,/`v\$\{Core\.VERSION\}`/);
 assert.match(ui,/document\.title=`Cidade dos Negócios 1 · v\$\{Core\.VERSION\}`/);
});

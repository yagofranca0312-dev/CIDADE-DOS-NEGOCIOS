import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const load=(file,symbol)=>runInNewContext(readFileSync(file,'utf8')+'\n'+symbol,{});
const core=load('src/core/game.js','CidadeCore');
const baseline=load('tests/fixtures/city-scene_v22.js','CidadeVisual');
const pilot=load('src/visual/city-scene.js','CidadeVisual');
const source=readFileSync('src/visual/city-scene.js','utf8');
const css=readFileSync('src/shell/v22.css','utf8');
const html=readFileSync('index.html','utf8');
const t=core.CITIES.find(x=>x.id==='CE-TIANGUA');
const all=svg=>[...svg.matchAll(/data-lot="(\d+)" data-owned="(true|false)" tabindex="0" role="button" aria-pressed="(true|false)"/g)];

test('Piloto restringe-se ao ID oficial de Tianguá no cadastro e não ao nome exibido',()=>{
 assert.ok(t);assert.equal(t.name,'Tianguá');assert.equal(t.uf,'CE');
 assert.match(source,/pilotTiangua=city\?\.id==='CE-TIANGUA'/);
 const fake={...t,id:'CE-SOBRAL'};
 assert.equal(pilot.svgMap(fake,[],1),baseline.svgMap(fake,[],1));
});
test('Todas as outras 29 cidades continuam SVG byte por byte idênticas à V2.2',()=>{
 assert.equal(core.CITIES.length,30);
 for(const city of core.CITIES.filter(x=>x.id!=='CE-TIANGUA')){
   for(const [own,selected] of [[[],1],[[3],3],[[1,9,18],18]]){
     assert.equal(pilot.svgMap(city,own,selected),
                  baseline.svgMap(city,own,selected),
                  'Mapa não pode mudar fora do piloto: '+city.name);
   }
 }
});
test('Tianguá ganha cenário diferente da V2.2 para mapa vazio e ocupado',()=>{
 const now=pilot.svgMap(t,[3],3),old=baseline.svgMap(t,[3],3);
 assert.notEqual(now,old);
 assert.match(now,/class="v22-city-svg v221-pilot-tiangua"/);
 assert.match(now,/class="v221-tiagua-scenery"/);
 assert.match(now,/class="v221-shop"/);
 assert.match(now,/class="v221-lamp"/);
 assert.match(now,/aria-hidden="true" pointer-events="none"/);
 assert.ok((now.match(/class="v221-shop"/g)||[]).length>=12);
});
test('Mapa de Tianguá conserva 18 lotes e semântica de posse/seleção',()=>{
 for(const [own,selected] of [[[],1],[[3],3],[[1,4,12],12]]){
   const result=pilot.svgMap(t,own,selected);
   const items=all(result);
   assert.deepEqual(items.map(x=>Number(x[1])),Array.from({length:18},(_,i)=>i+1));
   assert.deepEqual(items.filter(x=>x[2]==='true').map(x=>Number(x[1])),own);
   assert.equal(items.filter(x=>x[3]==='true').length,1);
   assert.equal(Number(items.find(x=>x[3]==='true')[1]),selected);
   assert.match(result,/tabindex="0" role="button"/);
 }
});
test('Elementos cosméticos são apresentados atrás dos lotes e nunca capturam clique',()=>{
 const svg=pilot.svgMap(t,[3],3);
 assert.ok(svg.indexOf('v221-tiagua-scenery')<svg.indexOf('v22-lot-layer'));
 assert.match(svg,/<g class="v221-tiagua-scenery" aria-hidden="true" pointer-events="none">/);
 assert.match(css,/\.v22-city-svg\.v221-pilot-tiangua \.v221-tiagua-scenery \*/);
 assert.match(svg,/class="v22-hit"/);
});
test('Aparência não depende de RNG, relógio, transação, rede nem muta entradas',()=>{
 const city=Object.freeze({...t}),own=Object.freeze([3,7]);
 assert.equal(pilot.svgMap(city,own,3),pilot.svgMap(city,own,3));
 assert.deepEqual([...own],[3,7]);
 assert.doesNotMatch(source,/\bMath\.random\s*\(|\bDate\.now\s*\(|\.dispatch\s*\(|\bfetch\s*\(/);
});
test('Orçamento do SVG e HTML único permanecem dentro das balizas estruturais',()=>{
 const svg=pilot.svgMap(t,[3],3);
 assert.ok(svg.length<70000,'Cena SVG muito grande');
 assert.ok((svg.match(/<g\b/g)||[]).length<120,'Camadas de cena em excesso');
 assert.ok(html.includes('const CidadeVisual'));
 assert.ok(html.includes('pilotTianguaScenery'));
 assert.equal((html.match(/<script\b/g)||[]).length,1);
 assert.doesNotMatch(html,/<script[^>]+src=/);
});
test('Sem alterar versão econômica e schema: piloto ainda não é release',()=>{
 assert.equal(core.VERSION,'2.2.0-rc.1');
 assert.equal(core.SCHEMA_VERSION,9);
 assert.equal(core.CITIES.length,30);
});

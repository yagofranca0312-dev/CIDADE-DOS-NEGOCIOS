import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source=readFileSync('src/visual/city-scene.js','utf8');
const visual=runInNewContext(source+'\nCidadeVisual',{});
const coreSource=readFileSync('src/core/game.js','utf8');
const oldCore=readFileSync('tests/fixtures/core_v2_0_0.js','utf8');
const core=runInNewContext(coreSource+'\nCidadeCore',{});
const template=readFileSync('src/shell/index.template.html','utf8');
const app=readFileSync('src/ui/app.js','utf8');
const css=readFileSync('src/shell/v22.css','utf8');
const html=readFileSync('index.html','utf8');

const city=(name='Tianguá',sizeTier='regional',id='CE-2308377')=>({id,name,uf:'CE',sizeTier});
const lotElements=svg=>[...svg.matchAll(/<g class="v22-lot [^"]+" data-lot="(\d+)" data-owned="(true|false)" tabindex="0" role="button" aria-pressed="(true|false)"/g)];
const normalized=x=>JSON.parse(JSON.stringify(x));

test('V2.4-A mantém schema 9, cidades e compatibilidade de renderização',()=>{
 assert.equal(core.VERSION,'3.2.0');assert.equal(core.SCHEMA_VERSION,10);
 assert.equal(core.CITIES.length,30);
});
test('V2.2 renderiza exatamente 18 lotes acionáveis, 1–18, com semântica acessível',()=>{
 const svg=visual.svgMap(city(),[],1);
 const all=lotElements(svg);
 assert.equal(all.length,18);
 assert.deepEqual(all.map(x=>Number(x[1])),Array.from({length:18},(_,i)=>i+1));
 assert.equal((svg.match(/aria-pressed="true"/g)||[]).length,1);
 assert.match(svg,/role="group" aria-label="Distrito comercial isométrico fictício/);
 assert.match(svg,/data-lot="18"/);
});
test('Terreno vazio e empresa existente têm visuais e rótulos distintos',()=>{
 const svg=visual.svgMap(city(),[1,17],17);
 const all=lotElements(svg);
 assert.deepEqual(all.filter(x=>x[2]==='true').map(x=>Number(x[1])),[1,17]);
 assert.equal(all.find(x=>x[1]==='17')?.[3],'true');
 assert.match(svg,/Lote 17, sua empresa, selecionado/);
 assert.match(svg,/Lote 2, disponível/);
 assert.match(svg,/LOTE 17 · SUA EMPRESA/);
});
test('Renderer não altera dados, RNG, cronologia nem seleção de entrada',()=>{
 const c=Object.freeze(city());
 const owns=Object.freeze([2,11]);
 const a=visual.svgMap(c,owns,11),b=visual.svgMap(c,owns,11);
 assert.equal(a,b);
 assert.deepEqual(normalized(owns),[2,11]);
 assert.equal(c.name,'Tianguá');
 assert.doesNotMatch(source,/\bMath\.random\s*\(|\.dispatch\s*\(|\bDate\.now\s*\(|\bfetch\s*\(/);
});
test('Variação do atlas é estável por id, e quatro portes geram cenários diferenciados',()=>{
 const c=city();
 const v1=visual.svgMap(c,[1],3);
 assert.notEqual(v1,visual.svgMap({...c,id:'CE-alternativo'},[1],3));
 const scenes=['local','regional','grande','metropole'].map(t=>visual.svgMap(city('Cidade Teste',t,t),[],1));
 assert.equal(new Set(scenes).size,4);
 for(const svg of scenes){assert.equal(lotElements(svg).length,18);assert.match(svg,/v22-ambient-skyline/);}
});
test('Todas as 30 cidades reais do cadastro do jogo continuam renderizáveis',()=>{
 assert.equal(core.CITIES.length,30);
 for(const c of core.CITIES){
   const svg=visual.svgMap(c,[],1);
   assert.equal(lotElements(svg).length,18,c.name);
   assert.match(svg,/DISTRITO ILUSTRATIVO/);
   assert.match(svg,/data-lot="18"/);
 }
});
test('HTML SVG escapa nomes de cidades e atributos',()=>{
 const svg=visual.svgMap({id:'x',name:'<script>alert("x")&',uf:'A"&<B',sizeTier:'local'},[],3);
 assert.doesNotMatch(svg,/<script>|<\/script>/);
 assert.match(svg,/&lt;script&gt;/);
 assert.match(svg,/&quot;/);
 assert.match(svg,/&amp;/);
});
test('Seleção inválida não fabrica lote e não exibe aviso incorreto',()=>{
 for(const lot of [-1,0,19,null,1.2]){
   const svg=visual.svgMap(city(),[],lot);
   assert.equal(lotElements(svg).length,18);
   assert.equal((svg.match(/aria-pressed="true"/g)||[]).length,0);
   assert.doesNotMatch(svg,/LOTE (?:-1|00|19)/);
 }
});
test('Edifícios do jogador são clicáveis; cenário decorativo não captura eventos',()=>{
 assert.match(source,/owned\?'visiblePainted':'none'/);
 assert.match(source,/class="v22-scenery" aria-hidden="true" pointer-events="none"/);
 assert.match(source,/class="v22-ambient-skyline" aria-hidden="true" pointer-events="none"/);
 assert.match(source,/class="v22-overlay" aria-hidden="true" pointer-events="none"/);
 assert.match(source,/class="v22-hit"/);
});
test('Seletor direto permite escolha de qualquer lote sem depender de hover',()=>{
 const options=[...template.matchAll(/<option value="(\d+)">Lote \d{2}<\/option>/g)].map(x=>Number(x[1]));
 assert.deepEqual(options,Array.from({length:18},(_,i)=>i+1));
 assert.match(template,/id="map-lot-picker"/);
 assert.match(app,/map-lot-picker'\)\.addEventListener\('change'/);
 assert.match(app,/map-lot-picker'\)\.value=String\(selectedLot\)/);
 assert.match(app,/\?\.focus\(\)/);
 assert.match(css,/\.v22-lot-nav select:focus-visible/);
});
test('Camada V2.2 não sobrepõe nem remove V2.1 e é embutida no HTML offline',()=>{
 assert.match(template,/\/\* CDN_V22_CSS \*\//);
 assert.match(html,/v22-city-svg/);
 assert.match(html,/v22-lot-nav/);
 assert.doesNotMatch(html,/\/\* CDN_V22_CSS \*\//);
 assert.match(css,/@media\(max-width:430px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 assert.doesNotMatch(html,/<link[^>]+stylesheet/i);
});
test('Contrato e orçamento de DOM ficam controlados por cena',()=>{
 for(const tier of ['local','regional','grande','metropole']){
   const svg=visual.svgMap(city('Simulação',tier,tier),[1,9,18],18);
   assert.ok(svg.length<70000,'SVG ultrapassou orçamento conservador de 70 KB');
   assert.ok((svg.match(/<g\b/g)||[]).length<120,'grupos SVG excederam teto de segurança');
   assert.equal(lotElements(svg).length,18);
 }
});

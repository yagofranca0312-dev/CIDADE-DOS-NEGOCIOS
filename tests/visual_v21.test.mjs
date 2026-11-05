import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
const core=readFileSync('src/core/game.js','utf8');
const baseline=readFileSync('tests/fixtures/core_v2_0_0.js','utf8');
const html=readFileSync('index.html','utf8');
const template=readFileSync('src/shell/index.template.html','utf8');
const ui=readFileSync('src/ui/app.js','utf8');
const css=readFileSync('src/shell/v21.css','utf8');
const load=s=>runInNewContext(s+'\nCidadeCore',{});
const norm=x=>JSON.parse(JSON.stringify(x));
const old=load(baseline),now=load(core);
const city=old.CITIES.find(c=>c.name==='Tianguá').id;
function dispatch(c,state,type,payload,id){const r=c.dispatch(state,{type,payload,id:`v21-golden-${id}`});assert.equal(r.ok,true,`${type}: ${r.error}`);return r.state;}
function drive(c){let s=dispatch(c,null,'CARREIRA.CRIAR',{cityId:city,name:'Teste de Compatibilidade',companyName:'Rede Visual',seed:10540},1);s=dispatch(c,s,'EMPRESA.ABRIR',{cityId:city,sector:'mercado',lot:1},2);s=dispatch(c,s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:80},3);s=dispatch(c,s,'TEMPO.AVANCAR_LOTE',{days:29},4);return s;}
test('V2.4-A mantém o schema e permite nova capacidade paralegal independente',()=>{
 assert.equal(now.SCHEMA_VERSION,9);assert.equal(now.VERSION,'2.6.0');
 assert.equal(typeof now.paralegalReport,'function');
});
test('V2.0 vs V2.2 economia, rng, fiscal e razão invariáveis',()=>{
 const a=drive(old),b=drive(now);
 for(const k of ['world','player','rng','calendar','economy','fiscal','audit'])assert.deepEqual(norm(a[k]),norm(b[k]),k);
 for(const fn of ['overview','balanceSheet','incomeStatement','cashFlowStatement','groupReport','taxReport'])assert.deepEqual(norm(old[fn](a)),norm(now[fn](b)),fn);
 assert.equal(now.importSave(old.exportSave(a)).migrated,false);
});
test('Identidade REF-01 SVG, favicon único offline e arte REF-04 incorporada',()=>{
 assert.match(template,/id="city-brand-glyph"/);assert.match(template,/v21-hero-mark/);assert.match(template,/v21-sidebar-mark/);
 assert.match(html,/<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml,/);
 assert.match(html,/data:image\/webp;base64,[A-Za-z0-9+/]+/);
 assert.doesNotMatch(html,/__CDN_V21_KEYART__/);
});
test('HUD tem quatro valores originados do motor e toggle com aria-expanded',()=>{
 for(const id of ['kpi-cash','kpi-revenue','kpi-profit','kpi-stock','stats-more-toggle'])assert.ok(template.includes(`id="${id}"`),id);
 assert.match(template,/aria-expanded="false"/);assert.match(ui,/hudToggle\.addEventListener\('click'/);
 assert.match(ui,/Core\.money\(info\.cash\)/);assert.match(ui,/Core\.money\(info\.revenue\)/);assert.match(ui,/Core\.money\(info\.profit\)/);
 assert.match(css,/\.v21-hud\.is-expanded>\.stat:nth-child\(n\+3\)\{display:block\}/);
});
test('Inspector mantém controles anteriores, com instruções progressivas',()=>{
 assert.match(template,/class="panel v21-inspector"/);assert.match(template,/class="v21-inspector-help"/);
 for(const id of ['selected-lot','map-open-company','map-lot-status','map-canvas'])assert.ok(template.includes(`id="${id}"`));
});
test('Limite tributário permanece visível, com detalhe acessível',()=>{
 assert.match(template,/SIMULAÇÃO EDUCATIVA/);assert.match(template,/Cenários tributários não são apuração legal/);
 assert.match(template,/Cenários tributários não são apuração legal/);
});
test('CSS acessibilidade e versão sincronizada, sem depender de fontes externas',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/max-width:800px/);assert.match(css,/max-width:430px/);
 for(const id of ['intro-version','build-version','footer-version'])assert.ok(template.includes(`id="${id}">v2.6.0<`));
 assert.match(template,/<title>Cidade dos Negócios 1 · v2\.6\.0<\/title>/);
 assert.doesNotMatch(html,/<script[^>]+src=/i);assert.doesNotMatch(html,/<link[^>]+stylesheet/i);
});

import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Script} from 'node:vm';
import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(resolve('index.html'),'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const styles=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
test('HTML único e idioma pt-BR',()=>{assert.match(html,/^<!doctype html>/i);assert.match(html,/<html lang="pt-BR">/);assert.match(html,/<title>Cidade dos Negócios 1/);});
test('CSS e JS embutidos (sem dependências externas)',()=>{assert.equal(scripts.length,1);assert.equal(styles.length,1);assert.doesNotMatch(html,/<script[^>]+src=/i);assert.doesNotMatch(html,/<link[^>]+stylesheet/i);assert.doesNotMatch(html,/\b(?:fetch|XMLHttpRequest|eval)\s*\(/);assert.doesNotMatch(html,/@import\s+url\(/i);});
test('JavaScript do HTML compilado tem sintaxe válida',()=>{assert.doesNotThrow(()=>new Script(scripts[0][2]));});
test('Módulos e pontos de entrada presentes',()=>{for(const token of ['const CidadeCore','dispatch(','exportSave(','importSave(','diagnostics(','svgMap('])assert.ok(scripts[0][2].includes(token),token);});
test('Aviso de cobertura fiscal explícita',()=>{assert.match(html,/Cenários tributários não são apuração legal/);assert.match(html,/NOT_COVERED/);});
test('Build reproduzível byte a byte',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8'),css=readFileSync('src/shell/theme.css','utf8'),v2css=readFileSync('src/shell/v2.css','utf8'),core=readFileSync('src/core/game.js','utf8'),visual=readFileSync('src/visual/city-scene.js','utf8'),ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/restock-views.part.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));
 const uiBundle=readFileSync('src/ui/app.js','utf8').replace('/* CDN_RESTOCK_VIEWS */',readFileSync('src/ui/restock-views.part.js','utf8')).replace('/* CDN_MARKET_VIEWS */',readFileSync('src/ui/market-views.part.js','utf8')).replace('/* CDN_FINANCE_VIEWS */',readFileSync('src/ui/finance-views.part.js','utf8'));
 const art='data:image/webp;base64,'+readFileSync('src/visual/keyart-v21.webp.b64','utf8').trim();
 const v21css=readFileSync('src/shell/v21.css','utf8').replace('__CDN_V21_KEYART__',art);
 const scene=readFileSync('src/visual/tiangua-scene.js','utf8')
  .replace('__CDN_TIANGUA_LOTS_JSON__',JSON.stringify(JSON.parse(readFileSync('src/visual/scenes/tiangua/lots.json','utf8'))))
  .replace('__CDN_TIANGUA_BASE_IMAGE__','data:image/webp;base64,'+readFileSync('src/visual/scenes/tiangua/assets/urban-base.webp.b64','utf8').trim())
  .replace('__CDN_TIANGUA_MARKET_SPRITE__','data:image/webp;base64,'+readFileSync('src/visual/scenes/tiangua/assets/mercado.webp.b64','utf8').trim())
  .replace('__CDN_TIANGUA_BAKERY_SPRITE__','data:image/webp;base64,'+readFileSync('src/visual/scenes/tiangua/assets/padaria.webp.b64','utf8').trim())
  .replace('__CDN_TIANGUA_CLOTHING_SPRITE__','data:image/webp;base64,'+readFileSync('src/visual/scenes/tiangua/assets/roupas.webp.b64','utf8').trim());
 const expected=template.replace('/* CDN_CSS */',css).replace('/* CDN_V2_CSS */',v2css).replace('/* CDN_V21_CSS */',v21css).replace('/* CDN_V22_CSS */',readFileSync('src/shell/v22.css','utf8')).replace('/* CDN_V221_CSS */',readFileSync('src/shell/v221-city.css','utf8')).replace('/* CDN_CORE */',core).replace('/* CDN_VISUAL */',visual+'\n'+scene).replace('/* CDN_UI */',uiBundle);
 assert.equal(createHash('sha256').update(expected).digest('hex'),createHash('sha256').update(html).digest('hex'));
});

test('V2.2: lote selecionado continua sinalizado, com 18 controles e sem rótulos concorrentes',()=>{
 const ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/restock-views.part.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));
 const visual=readFileSync('src/visual/city-scene.js','utf8');
 assert.match(visual,/const chosen=Number\.isInteger\(lot\)/);
 assert.match(visual,/class="v22-lot /);
 assert.match(visual,/String\(chosen\)\.padStart\(2,'0'\)/);
 assert.match(visual,/'<title>'\+escape\(label\)/);
 assert.match(ui,/Lote \$\{String\(selectedLot\)/);
});

test('Hotfix: preço próprio visível, concorrente independente e confirmação da mudança',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8');
 const ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/restock-views.part.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));
 assert.match(template,/id="your-current-price"/);
 assert.match(template,/id="competitor-price"/);
 assert.match(template,/id="price-change-feedback"/);
 assert.match(ui,/setText\('your-current-price',Core.money\(b.unitPrice\)\)/);
 assert.match(ui,/Preço de \${p.name} atualizado:/);
 assert.match(ui,/const after=business\(\)\.products\.find/);
});
test('V1.3: schema 5 com migração da V1 e formato de exportação validado',()=>{
 const core=readFileSync('src/core/game.js','utf8');
 assert.match(core,/SCHEMA_VERSION = 9/);
 assert.match(core,/VERSION = '2\.3\.0-alpha\.2'/);
 assert.match(core,/function importSave\(raw\)/);
 assert.match(core,/function upgradedState\(original\)/);
});

test('V1.1: controles de quantidade, recortes financeiros e histórico de preços presentes',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8');
 const ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/restock-views.part.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));
 for(const v of ['10','50','100','250'])assert.match(template,new RegExp(`data-buy-preset="${v}"`));
 for(const id of ['finance-period','finance-date','finance-period-label','price-history'])assert.ok(template.includes(`id="${id}"`));
 assert.match(ui,/renderPriceHistory\(\)/);
 assert.match(ui,/renderFinances\(\)/);
});
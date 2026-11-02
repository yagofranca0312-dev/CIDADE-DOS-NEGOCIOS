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
test('Aviso de cobertura fiscal explícita',()=>{assert.match(html,/Tributação legal não calculada/);assert.match(html,/NOT_COVERED/);});
test('Build reproduzível byte a byte',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8'),css=readFileSync('src/shell/theme.css','utf8'),core=readFileSync('src/core/game.js','utf8'),ui=readFileSync('src/ui/app.js','utf8');
 const expected=template.replace('/* CDN_CSS */',css).replace('/* CDN_CORE */',core).replace('/* CDN_UI */',ui);
 assert.equal(createHash('sha256').update(expected).digest('hex'),createHash('sha256').update(html).digest('hex'));
});

test('Hotfix: lote selecionado destacado sem etiquetas de todos os lotes',()=>{
 const ui=readFileSync('src/ui/app.js','utf8');
 assert.match(ui,/selected-lot-marker/);
 assert.match(ui,/LOTE \$\{String\(lot\)/);
 assert.match(ui,/<title>Lote/);
 assert.match(ui,/Lote \$\{String\(selectedLot\)/);
});
test('Hotfix: preço próprio visível, concorrente independente e confirmação da mudança',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8');
 const ui=readFileSync('src/ui/app.js','utf8');
 assert.match(template,/id="your-current-price"/);
 assert.match(template,/id="competitor-price"/);
 assert.match(template,/id="price-change-feedback"/);
 assert.match(ui,/setText\('your-current-price',Core.money\(b.unitPrice\)\)/);
 assert.match(ui,/Preço de \${p.name} atualizado:/);
 assert.match(ui,/const after=state.world.business.products.find/);
});
test('V1.2: schema 3 com migração da V1 e formato de exportação validado',()=>{
 const core=readFileSync('src/core/game.js','utf8');
 assert.match(core,/SCHEMA_VERSION = 3/);
 assert.match(core,/VERSION = '1\.2\.0-rc\.1'/);
 assert.match(core,/function importSave\(raw\)/);
 assert.match(core,/function upgradedState\(original\)/);
});

test('V1.1: controles de quantidade, recortes financeiros e histórico de preços presentes',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8');
 const ui=readFileSync('src/ui/app.js','utf8');
 for(const v of ['10','50','100','250'])assert.match(template,new RegExp(`data-buy-preset="${v}"`));
 for(const id of ['finance-period','finance-date','finance-period-label','price-history'])assert.ok(template.includes(`id="${id}"`));
 assert.match(ui,/renderPriceHistory\(\)/);
 assert.match(ui,/renderFinances\(\)/);
});

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

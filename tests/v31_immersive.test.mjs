import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(p,'utf8'),html=read('index.html'),ui=read('src/ui/v31-immersive.part.js');
test('V3.1 HTML unico integra read-model, cidade, cameras e dock',()=>{
 for(const id of ['v31-dock','v31-overlay-close','v31-camera-plus','v31-camera-minus','v31-camera-home','v31-alert-list','v31-hud-pause','v31-lot-quick'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/const CidadeV31ReadModel=createV31ReadModel\(CidadeCore\)/);
 assert.match(html,/const VERSION = '3\.1\.0'/);
 assert.doesNotThrow(()=>new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]));
});
test('V3.1 read-model permanece puro, mutacoes somente via commit existente',()=>{
 assert.doesNotMatch(ui,/Core\.dispatch|CidadeCore\.dispatch|state\s*=\s*result\.state/);
 assert.match(ui,/CidadeV31ReadModel\.readCity/);
 assert.match(ui,/CidadeV31ReadModel\.readEvents/);
 assert.match(ui,/commit\('EMPRESA\.ATIVAR'/);
 assert.match(ui,/sessionStorage\.setItem/);
});
test('V3.1 versao, schema e acessibilidade',()=>{
 assert.equal(JSON.parse(read('package.json')).version,'3.1.0');
 assert.match(read('src/core/game.js'),/const SCHEMA_VERSION = 9/);
 assert.match(read('src/shell/v31.css'),/prefers-reduced-motion:reduce/);
 assert.match(read('src/shell/v31.css'),/focus-visible/);
 assert.match(read('docs/HOMOLOGACAO_V300_EXCEPCIONAL.md'),/Não é uma certificação/);
});

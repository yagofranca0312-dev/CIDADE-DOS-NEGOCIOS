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


test('V3.1 full-screen: mapa 100dvh, dock central, modal, backdrop e toast acima',()=>{
  const css=read('src/shell/v31.css');
  const ui=read('src/ui/v31-immersive.part.js');
  for(const id of ['v31-backdrop','v31-hud-cash','v31-hud-date','v31-modal-title-empresa'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(css,/height:100dvh!important/);
  assert.match(css,/#map-canvas>svg\.v221-city-svg/);
  assert.match(css,/backdrop-filter:blur/);
  assert.match(css,/transform:translate\(-50%,-50%\)/);
  assert.match(css,/body \.toast\{z-index:10000!important/);
  assert.match(ui,/setAttribute\('aria-modal','true'\)/);
  assert.match(ui,/v31-backdrop'\)\.addEventListener\('click',v31ClosePanel\)/);
  assert.match(ui,/event\.key==='Escape'/);
  assert.match(ui,/v31CameraChange/);
});


test('Tycoon: abas icônicas e trilho integrado acima dos KPIs sem valores inventados',()=>{
  const ui=read('src/ui/v31-immersive.part.js'),css=read('src/shell/v31.css');
  assert.match(ui,/v31-command-chrome/);
  assert.match(ui,/chrome\.append\(tabs\)/);
  assert.match(ui,/chrome\.after\(kpis\)/);
  assert.match(ui,/v31-tab-icon/);
  assert.match(ui,/v31-tab-label/);
  assert.match(ui,/choices\[root\]\?\.\[active\]/);
  assert.match(ui,/Core\.overview\(state\)/);
  assert.match(ui,/aria-label',original/);
  assert.match(css,/v31-command-tabs.*v23-subtab\[aria-selected="true"\]/);
  assert.match(css,/0 0 18px #f0c47e4b/);
  assert.match(css,/position:sticky/);
  assert.doesNotMatch(ui,/v31ClassicMode|v31-classic-switch|v31-classic-return/);
  assert.doesNotMatch(html,/<aside class="sidebar"/);
});

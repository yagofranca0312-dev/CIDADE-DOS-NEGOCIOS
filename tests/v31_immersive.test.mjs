import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(p,'utf8'),html=read('index.html'),ui=read('src/ui/v31-immersive.part.js');
test('V3.1 HTML unico integra read-model, cidade, cameras e dock',()=>{
 for(const id of ['v31-dock','v31-overlay-close','v31-camera-plus','v31-camera-minus','v31-camera-home','v31-alert-list','v31-hud-pause','v31-lot-quick'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/const CidadeV31ReadModel=createV31ReadModel\(CidadeCore\)/);
 assert.match(html,/const VERSION = '3\.2\.0'/);
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
 assert.equal(JSON.parse(read('package.json')).version,'3.2.0');
 assert.match(read('src/core/game.js'),/const SCHEMA_VERSION = 10/);
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


test('V3.1 scroll architecture: fixed modal chrome and KPI board; only visible section pane scrolls',()=>{
  const css=read('src/shell/v31.css');
  const source=read('src/ui/v31-immersive.part.js');
  assert.match(css,/display:flex!important;\s*flex-direction:column!important;\s*overflow:hidden!important/);
  assert.match(css,/\.v23-subpane:not\(\[hidden\]\)\s*\{/);
  assert.match(css,/overflow-y:auto!important/);
  assert.match(css,/overscroll-behavior:contain!important/);
  assert.match(css,/height:92dvh!important/);
  assert.match(css,/border-radius:18px 18px 0 0!important/);
  assert.match(css,/padding:6px 8px!important/);
  assert.match(css,/min-height:48px!important/);
  assert.match(source,/data-section-pane="sistema:integridade"/);
  assert.match(html,/data-section-tab="sistema:saves"/);
  assert.match(source,/pane\.prepend\(\.\.\.loose\)/);
  assert.match(source,/visiblePane\.scrollTop=0/);
  assert.doesNotMatch(source,/v31ClassicMode/);
});


test('V3.1 city cleanup: noninteractive banner and keyboard-only lot picker',()=>{
 const html=read('index.html'),scene=read('src/visual/tiangua-scene.js');
 const css=read('src/shell/v31.css'),ui=read('src/ui/v31-immersive.part.js');
 assert.doesNotMatch(html,/id="v221-city-info-trigger"/);
 assert.doesNotMatch(scene,/data-city-switch-art|v31-city-art-hotspot|v221-live-legend/);
 assert.doesNotMatch(ui,/data-city-switch-art/);
 assert.match(ui,/reports\.appendChild\(\$\('v221-observatory'\)\)/);
 assert.match(ui,/saves\.prepend\(cityAction\)/);
 assert.match(css,/#unit-switch-container/);
 assert.match(css,/\.v22-lot-nav:focus-within/);
 assert.match(css,/clip-path:inset\(50%\)!important/);
 assert.match(css,/@media\(max-width:768px\)/);
 assert.match(css,/flex-wrap:nowrap!important/);
 assert.match(css,/max-height:48px!important/);
 assert.match(html,/id="v31-next-day"[^>]*>\+1<\/button>/);
 assert.match(ui,/recent\.events\.length\)\)/);
});

test('V3.1 desktop: ocultação de cartões de resumo legados e SVG',()=>{
  const css=read('src/shell/v31.css');
  const expected=/body\.v31-immersive \.v221-live-legend,\s*body\.v31-immersive \.map-legend,\s*body\.v31-immersive #v221-map-summary,\s*body\.v31-immersive \.v221-summary-entries\s*\{\s*display:\s*none\s*!important;\s*\}/;
  assert.match(css,expected);
  // Nenhum grupo textual ou hotspot é desenhado sobre a arte aprovada.
  assert.doesNotMatch(read('src/visual/tiangua-scene.js'),/v221-live-legend|data-city-switch-art/);
  assert.match(css,/object-fit:contain!important/);
});

test('V3.1 câmera natural: inicia 100%, não restaura zoom salvo e ajusta mapas à viewport',()=>{
  const source=read('src/ui/v31-immersive.part.js'),css=read('src/shell/v31.css');
  assert.match(source,/v31Camera=\{zoom:1,x:0,y:0\};\s*v31CameraCenterPending=true/);
  const load=source.match(/function v31CameraLoad\(cityId\)\{([\s\S]*?)\n  \}/)?.[1];
  assert.ok(load,'Função de inicialização da câmera ausente');
  assert.doesNotMatch(load,/sessionStorage/,'A inicialização não pode restaurar zoom/pan antigos');
  assert.match(css,/#map-canvas>svg\.v221-city-svg\{width:100vw!important;max-width:100vw!important;height:100dvh!important;max-height:100dvh!important/);
  assert.match(css,/#map-canvas>svg\.v22-city-svg\{width:100vw!important/);
  assert.match(css,/max-height:calc\(100dvh - 110px\)!important/);
  assert.doesNotMatch(source,/data-city-switch-art/);
  assert.doesNotMatch(read('src/ui/app.js'),/v31OpenPanel\('sistema','saves',\$\('v221-city-switch-trigger'\)\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('src/shell/v31.css','utf8');
const tpl=readFileSync('src/shell/index.template.html','utf8');
const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
const lots=JSON.parse(readFileSync('src/visual/scenes/tiangua/lots.json','utf8')).lots;

test('V3.3.1: remove enquadramento cover anterior sem esticar ou cortar',()=>{
 const i=css.lastIndexOf('V3.3.1 — ajuste solicitado');
 assert.ok(i>0,'override corretivo ausente');
 const patch=css.slice(i);
 assert.doesNotMatch(patch,/object-fit:fill|width:max\(|min-height:100dvh/);
 assert.match(patch,/object-fit:contain!important/);
 assert.match(patch,/width:min\(100vw,231\.325301dvh\)!important/);
 assert.match(patch,/width:min\(100vw,158\.024691dvh\)!important/);
 assert.match(patch,/align-content:center!important/);
 assert.match(patch,/aspect-ratio:1536\/664!important/);
 assert.match(patch,/aspect-ratio:640\/405!important/);
});

test('V3.3.1: composiçao proporcional mobile, tablet, desktop e tela ultrawide',()=>{
 const viewports=[[320,844],[390,844],[750,917],[768,900],[1366,900],[1920,1080],[1920,600]];
 for(const [vw,vh] of viewports)for(const [aw,ah] of [[1536,664],[640,405]]){
  const w=Math.min(vw,vh*aw/ah),h=w*ah/aw;
  assert.ok(w<=vw+1e-6,'sem corte lateral');
  assert.ok(h<=vh+1e-6,'sem corte superior ou inferior');
  assert.ok(Math.abs(w/h-aw/ah)<1e-6,'proporcao mantida');
 }
});

test('V3.3.1: zoom, 100%, + e centralizar na mesma barra superior',()=>{
 const start=tpl.indexOf('<div class="v31-top-controls');
 const end=tpl.indexOf('<p class="v221-trust-ribbon"',start);
 assert.ok(start>0&&end>start);
 const hud=tpl.slice(start,end);
 const speed=hud.indexOf('id="v31-hud-speed"');
 const camera=hud.indexOf('class="v31-camera"');
 assert.ok(speed>=0&&camera>speed,'câmera depois do seletor de ritmo');
 for(const id of ['v31-camera-minus','v31-camera-label','v31-camera-plus','v31-camera-home']){
  assert.ok(hud.includes('id="'+id+'"'),'controle '+id+' no HUD');
  assert.equal(tpl.split('id="'+id+'"').length,2,'controle duplicado '+id);
 }
 const patch=css.slice(css.lastIndexOf('V3.3.1 — ajuste solicitado'));
 assert.match(patch,/\.v31-top-controls \.v31-camera\{/);
 assert.match(patch,/position:static!important/);
 assert.match(patch,/flex-wrap:nowrap!important/);
 assert.match(patch,/overflow-x:auto!important/);
});

test('V3.3.1: mantém motor fiscal, integridade do save, lotes e comandos',()=>{
 assert.equal(lots.length,18);
 assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.1');
 const core=readFileSync('src/core/game.js','utf8');
 assert.match(core,/const VERSION = '3\.3\.1'/);
 assert.match(core,/const SCHEMA_VERSION = 10/);
 for(const needle of ['v31CameraChange','v31CameraApply','v31-camera-home','canvas.scrollLeft','canvas.scrollTop'])assert.ok(ui.includes(needle));
});

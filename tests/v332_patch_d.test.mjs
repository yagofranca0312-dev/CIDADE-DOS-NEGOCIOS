import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync('src/shell/index.template.html','utf8');
const css=readFileSync('src/shell/v31.css','utf8');
const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
const qa=readFileSync('tools/qa-windows-v310.mjs','utf8');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const last=css.slice(css.lastIndexOf('V3.3.2-D — acabamento'));

test('D-01: nenhuma mudanca na arte ou no save e mapa matematicamente integral',()=>{
  assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.1');
  assert.equal(Core.SCHEMA_VERSION,10);
  assert.match(last,/V3\.3\.2-D/);
  assert.match(last,/v31-lot-selected \.city-stage>\.right-column/);
  assert.match(last,/bottom:calc\(var\(--v332-map-bottom\) \+ 10px\)/);
  assert.match(last,/@media\(min-width:1500px\)/,'Desktop largo deve preencher cartões, não escalar mapa');
  assert.doesNotMatch(last,/(object-fit:cover|object-fit:fill|transform:scale\(|viewBox=)/);
  const screens=[[320,700],[390,844],[430,932],[768,1024],[1024,768],[1366,768],[1920,1080]];
  for(const [w,h] of screens){
    const top=w<=768?119:122;
    const bottom=w<=900?(h<=750?226:237):174;
    const available=h-top-bottom;
    assert.ok(available>120, 'viewport sem área de mapa '+w+'x'+h);
    const mapWidth=Math.min(w,available*1536/664);
    const mapHeight=mapWidth*664/1536;
    assert.ok(mapWidth<=w&&mapHeight<=available+1e-8);
    assert.ok(Math.abs(mapWidth/mapHeight-1536/664)<1e-8);
  }
});

test('D-02: matriz real de resolução e capturas do CI inclui mobile, tablet e desktop',()=>{
  for(const viewport of [
   '{width:320,height:700}','{width:390,height:844}','{width:430,height:932}',
   '{width:768,height:1024}','{width:1024,height:768}',
   '{width:1366,height:768}','{width:1920,height:1080}'
  ])assert.ok(qa.includes(viewport),'resolução sem QA '+viewport);
  assert.match(qa,/gate-d-city\.png/);
  assert.match(qa,/gate-d-advisor\.png/);
  assert.match(qa,/Alvo de toque reduzido/);
  assert.match(qa,/Central expandida invade indicadores superiores/);
});

test('D-03: controles inclusivos, alvo de toque ampliado e painel sem invadir HUD',()=>{
  assert.ok(last.includes('min-height:42px!important'));
  assert.ok(last.includes('min-height:40px!important'));
  assert.ok(last.includes('max-height:min(52dvh'));
  assert.ok(last.includes('prefers-reduced-motion:reduce'));
  assert.ok(last.includes('body.v31-immersive .v332-advisor-drawer'));
  assert.match(html,/id="v332-advisor-drawer" role="region" aria-labelledby="v332-advisor-drawer-title"/);
  assert.match(html,/id="v332-advisor-drawer-title"/);
  assert.match(html,/id="v332-advisor-toggle" aria-controls="v332-advisor-drawer"/);
  assert.match(html,/id="v332-hud-advice-trigger" aria-controls="v332-advisor-drawer"/);
});

test('D-04: retorno de foco, detalhes acessíveis e menus mutuamente exclusivos',()=>{
  assert.match(ui,/let v332AdvisorReturnFocus=null/);
  assert.match(ui,/v332AdvisorReturnFocus=document\.activeElement/);
  assert.match(ui,/v332AdvisorReturnFocus\?\.isConnected/);
  assert.match(ui,/details\.setAttribute\('aria-controls',detailId\)/);
  assert.match(ui,/proof\.id=detailId/);
  assert.match(ui,/next\?\.focus\(\{preventScroll:true\}\)/);
  assert.match(ui,/v332AdviceExpanded=false;v332RenderAdvisor\(\)/);
  assert.match(ui,/const fromTeam=!!button\.closest\('#v332-advisor-panel'\)/);
  assert.match(ui,/const source=fromTeam\?\$\('v332-advisor-toggle'\):button/);
});

test('D-05: proteção econômica e ausência de operações automáticas',()=>{
  const region=ui.slice(ui.indexOf('function v332AdviceCandidates'),
    ui.indexOf('function v31Render(){'));
  assert.ok(region.includes('function v332AdvisorCollapse'));
  assert.doesNotMatch(region,/Core\.dispatch\(|commit\(|localStorage\.|indexedDB\.|fetch\(/);
  assert.match(ui,/Nenhuma ação prioritária identificada neste momento/);
  assert.match(html,/Dispensar oculta o aviso, mas não resolve a pendência/);
  assert.doesNotMatch(last,/display:none!important;\s*\/\* esconder mapa/);
});

test('D-06: loteamento preservado e controles de camera e acesso a areas existentes',()=>{
 const scene=JSON.parse(readFileSync('src/visual/scenes/tiangua/lots.json','utf8'));
 assert.equal(scene.lots.length,18);
 assert.equal(new Set(scene.lots.map(l=>l.number)).size,18);
 for(const id of ['v31-camera-minus','v31-camera-label','v31-camera-plus','v31-camera-home',
   'v31-hud-speed','v31-hud-pause','v31-next-day','v332-more-toggle']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.ok(html.includes('data-v332-route="mercado:outros" data-v332-focus="price-form"'));
 assert.ok(html.includes('data-v332-route="mercado:compras" data-v332-focus="restock-assistant"'));
 assert.ok(html.includes('data-v332-route="administrativo:fiscal"'));
});

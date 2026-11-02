import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const template=readFileSync('src/shell/index.template.html','utf8');
const css=readFileSync('src/shell/v221-city.css','utf8');
const ui=readFileSync('src/ui/app.js','utf8');
const scene=readFileSync('src/visual/tiangua-scene.js','utf8');
test('V221 mobile: aviso educativo claro, sem números DEMO apresentados como reais',()=>{
 assert.match(template,/class="v221-trust-ribbon"/);
 assert.match(template,/Valores financeiros fictícios do jogo/);
 assert.doesNotMatch(template,/\+4,8%/);
});
test('V221 mobile: situação dos lotes vem da carreira e não da imagem estática',()=>{
 for(const id of ['v221-legend-free','v221-legend-owned','v221-legend-selection'])assert.match(template,new RegExp(`id="${id}"`));
 assert.match(ui,/18-cityUnits\.length/);
 assert.match(ui,/cityUnits\.length===1\?'empresa':'empresas'/);
 assert.match(scene,/const amount=unitMap\.size,free=18-amount/);
});
test('V221 mobile: panorama responsivo por padrão com zoom de navegação opt-in',()=>{
 assert.match(css,/width:100%!important;min-width:0!important;height:auto!important/);
 assert.match(css,/\.v221-city-mode\.v221-map-zoomed \.map-canvas svg\.v221-city-svg/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(template,/id="v221-map-zoom"/);
 assert.match(ui,/mapZoomed=!mapZoomed/);
});
test('V221 mobile: banner de Tianguá é visível no smartphone, sem cortar a interface',()=>{
 assert.match(css,/\.v221-city-mode\.v221-tiangua-scene \.map-panel>\.v221-city-switch-trigger/);
 assert.match(css,/\.v221-city-mode\.v221-tiangua-scene \.map-panel>\.v221-city-switch-trigger>[*]\{visibility:visible!important\}/);
 assert.match(css,/max-width:620px/);
});
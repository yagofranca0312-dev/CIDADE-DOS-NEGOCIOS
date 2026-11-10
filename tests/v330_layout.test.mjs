import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/shell/v31.css', 'utf8');
const ui = readFileSync('src/ui/v31-immersive.part.js', 'utf8');
const city = JSON.parse(readFileSync('src/visual/scenes/tiangua/lots.json', 'utf8'));

test('V3.3.0 etapa 01: regra final supera contain e centralizacao do mobile', () => {
  const at = css.lastIndexOf('V3.3.0 / microetapa 01');
  assert.ok(at > 0, 'override responsivo ausente');
  const patch = css.slice(at);
  assert.match(patch, /body\.v31-immersive #map-canvas\{/);
  assert.match(patch, /display:block!important/);
  assert.match(patch, /height:100dvh!important/);
  assert.match(patch, /overflow:auto!important/);
  assert.match(patch, /#map-canvas>svg\.v221-city-svg/);
  assert.match(patch, /width:max\(100vw,231\.325301dvh\)!important/);
  assert.match(patch, /aspect-ratio:1536\/664!important/);
  assert.match(patch, /#map-canvas>svg\.v22-city-svg/);
  assert.match(patch, /width:max\(100vw,158\.024691dvh\)!important/);
  assert.match(patch, /object-fit:fill!important/);
  assert.doesNotMatch(patch, /object-fit:contain/);
  assert.doesNotMatch(patch, /max-height:calc\(100dvh - 110px\)/);
});

test('V3.3.0 etapa 01: enquadramento cover preserva proporcao nos quatro tamanhos', () => {
  const formats = [[390,844],[750,917],[1280,720],[1920,1080]];
  for (const [width, height] of formats) {
    for (const [artWidth,artHeight] of [[1536,664],[640,405]]) {
      const fittedWidth = Math.max(width, height * artWidth / artHeight);
      const fittedHeight = fittedWidth * artHeight / artWidth;
      assert.ok(fittedWidth >= width - .01, 'nao cobre largura '+width);
      assert.ok(fittedHeight >= height - .01, 'nao cobre altura '+height);
      assert.ok(Math.abs(fittedWidth/fittedHeight - artWidth/artHeight) < 1e-6, 'arte distorcida');
    }
  }
});

test('V3.3.0 etapa 01: 18 lotes, zoom e arrasto permanecem disponiveis', () => {
  assert.equal(city.lots.length,18);
  for(const required of ['v31CameraChange','v31CameraApply','canvas.scrollLeft','canvas.scrollTop','v31-camera-home']){
    assert.ok(ui.includes(required), 'interacao preservada: '+required);
  }
  assert.match(readFileSync('src/core/game.js','utf8'), /const SCHEMA_VERSION = 10/);
  assert.equal(JSON.parse(readFileSync('package.json','utf8')).version, '3.3.0');
});

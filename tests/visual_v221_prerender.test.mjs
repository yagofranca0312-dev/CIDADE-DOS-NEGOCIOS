import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const core=runInNewContext(read('src/core/game.js')+'\nCidadeCore',{});
const old=read('src/visual/city-scene.js');
const base=read('tests/fixtures/city-scene_v22.js');
const data=JSON.parse(read('src/visual/scenes/tiangua/lots.json'));
const manifest=JSON.parse(read('src/visual/scenes/tiangua/manifest.json'));
const original=read('src/visual/tiangua-scene.js');
const runtime=original.replace('__CDN_TIANGUA_LOTS_JSON__',JSON.stringify(data)).replace('__CDN_TIANGUA_BASE_IMAGE__','data:image/webp;base64,'+read('src/visual/scenes/tiangua/assets/urban-base.webp.b64').trim()).replace('__CDN_TIANGUA_MARKET_SPRITE__','data:image/webp;base64,'+read('src/visual/scenes/tiangua/assets/mercado.webp.b64').trim()).replace('__CDN_TIANGUA_BAKERY_SPRITE__','data:image/webp;base64,'+read('src/visual/scenes/tiangua/assets/padaria.webp.b64').trim()).replace('__CDN_TIANGUA_CLOTHING_SPRITE__','data:image/webp;base64,'+read('src/visual/scenes/tiangua/assets/roupas.webp.b64').trim());
const scene=runInNewContext(runtime+'\nCidadeTianguaCena',{});
const city=core.CITIES.find(c=>c.id==='CE-TIANGUA');
const units=(data)=>data;

test('V221 preserva o core 2.2 e o save schema 9',()=>{assert.equal(core.VERSION,'2.4.0-alpha.2');assert.equal(core.SCHEMA_VERSION,9);assert.equal(core.CITIES.length,30);});
test('V221 preserva literalmente o renderer de fallback V2.2 para 29 cidades',()=>{assert.equal(old,base);for(const c of core.CITIES.filter(c=>c.id!=='CE-TIANGUA'))assert.notEqual(c.id,'CE-TIANGUA');});
test('V221 18 lotes únicos e ordenados, com hit areas poligonais e foco',()=>{assert.equal(data.lots.length,18);assert.deepEqual(data.lots.map(x=>x.number),Array.from({length:18},(_,i)=>i+1));const svg=scene.svgMap(city,[],null);assert.equal((svg.match(/role="button" tabindex="0"/g)||[]).length,18);assert.equal((svg.match(/data-lot="/g)||[]).length,18);assert.equal((svg.match(/data-building-for=/g)||[]).length,0);assert.match(svg,/role="group"/);});
test('V221 cena vazia não contém sprites de empresas',()=>{const svg=scene.svgMap(city,[],null);assert.doesNotMatch(svg,/data-building-for=/);assert.doesNotMatch(svg,/class="v221-selection-line"/);});
test('V221 estados de três ramos são derivados das unidades reais, não de DEMO',()=>{const u=units([{id:'A',cityId:city.id,lot:3,sector:'mercado'},{id:'B',cityId:city.id,lot:8,sector:'padaria'},{id:'C',cityId:city.id,lot:17,sector:'roupas'}]);const svg=scene.svgMap(city,u,8);assert.equal((svg.match(/data-building-for=/g)||[]).length,3);for(const s of ['mercado','padaria','roupas'])assert.match(svg,new RegExp('data-sector="'+s+'"'));assert.equal((svg.match(/aria-pressed="true"/g)||[]).length,1);});
test('V221 seleção lote 03 nunca cruza a fachada pré-renderizada',()=>{const svg=scene.svgMap(city,[],3);assert.doesNotMatch(svg,/class="v221-selection-line"/);assert.match(svg,/data-lot="3"/);assert.doesNotMatch(svg,/selection-halo|filter="url/);});
test('V221 não aceita renderizar outras cidades por engano',()=>{assert.throws(()=>scene.svgMap({...city,id:'CE-SOBRAL'},[],null),/exclusiva/);});
test('V221 arte homologada com manifesto e 4 assets íntegros',()=>{assert.equal(manifest.status,'HOMOLOGATED');for(const f of ['urban-base.webp','mercado.webp','padaria.webp','roupas.webp']){const b=Buffer.from(read('src/visual/scenes/tiangua/assets/'+f+'.b64').trim(),'base64');assert.equal(b.length,manifest[f].size);assert.equal(createHash('sha256').update(b).digest('hex'),manifest[f].sha256);}});
test('V221 código de cena não executa rede, RNG ou mutação no core',()=>{assert.doesNotMatch(original,/Math\.random\(|Date\.now\(|fetch\(|\.dispatch\(/);assert.match(read('src/ui/app.js'),/CidadeTianguaCena\.svgMap/);});

test('V221 hotfix lote 03: imóvel embutido é apenas fachada do cenário, placa muda quando a unidade existe',()=>{
  const empty=scene.svgMap(city,[],3);
  assert.doesNotMatch(empty,/data-building-for="3"/);
  assert.doesNotMatch(empty,/class="v221-selection-line"/);
  const opened=scene.svgMap(city,[{id:'M',cityId:city.id,lot:3,sector:'mercado'}],3);
  assert.match(opened,/class="v221-original-building-sign" data-building-for="3" data-sector="mercado"/);
  assert.match(opened,/>MERCADO<\/text>/);
  assert.doesNotMatch(opened,/<image data-building-for="3"/);
  const bakery=scene.svgMap(city,[{id:'P',cityId:city.id,lot:3,sector:'padaria'}],3);
  assert.match(bakery,/>PADARIA<\/text>/);
});
test('V221 hotfix seleção outros lotes é insetada e legenda reflete o motor',()=>{
  const l=data.lots.find(x=>x.number===8);
  const svg=scene.svgMap(city,[],8);
  const polygon=svg.match(/class="v221-selection-line" points="([^"]+)"/);
  assert.ok(polygon);
  const old=l.footprint.map(x=>x.join(',')).join(' ');
  assert.notEqual(polygon[1],old,'a linha não pode cobrir ruas/bordas da quadra');
  assert.match(svg,/18 disponíveis/);
  const owned=scene.svgMap(city,[{id:'A',cityId:city.id,lot:8,sector:'padaria'},{id:'B',cityId:city.id,lot:17,sector:'roupas'}],8);
  assert.match(owned,/16 disponíveis/);
  assert.match(owned,/2 empresas/);
  assert.equal((owned.match(/data-building-for=/g)||[]).length,2);
});
test('V221 hotfix usa imagem aprovada intocada, mantém tamanho e histórico fiscal',()=>{
  assert.match(manifest.backgroundSource,/approved prototype/);
  assert.equal(core.SCHEMA_VERSION,9);
  const asset=Buffer.from(read('src/visual/scenes/tiangua/assets/urban-base.webp.b64').trim(),'base64');
  assert.ok(asset.length>500000);
  assert.match(read('src/shell/v221-city.css'),/v221-tiangua-scene/);
  assert.match(read('src/ui/app.js'),/v221-tiangua-scene/);
});
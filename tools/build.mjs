import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const cwd=process.cwd();
const template=readFileSync(resolve(cwd,'src/shell/index.template.html'),'utf8');
const css=readFileSync(resolve(cwd,'src/shell/theme.css'),'utf8');
const v2css=readFileSync(resolve(cwd,'src/shell/v2.css'),'utf8');
const v21css=readFileSync(resolve(cwd,'src/shell/v21.css'),'utf8');
const v22css=readFileSync(resolve(cwd,'src/shell/v22.css'),'utf8');
const keyartBase64=readFileSync(resolve(cwd,'src/visual/keyart-v21.webp.b64'),'utf8').trim();
if (!/^[A-Za-z0-9+/]+=*$/.test(keyartBase64)) throw Error('Arte V2.1 inválida');
const v21Inline=v21css.replace('__CDN_V21_KEYART__',`data:image/webp;base64,${keyartBase64}`);
const visual=readFileSync(resolve(cwd,'src/visual/city-scene.js'),'utf8');
const tianguaBase=readFileSync(resolve(cwd,'src/visual/scenes/tiangua/assets/urban-base.webp.b64'),'utf8').trim();
const tianguaSprites=Object.fromEntries(['mercado','padaria','roupas'].map(sector=>[sector,readFileSync(resolve(cwd,`src/visual/scenes/tiangua/assets/${sector}.webp.b64`),'utf8').trim()]));
const tianguaLots=JSON.parse(readFileSync(resolve(cwd,'src/visual/scenes/tiangua/lots.json'),'utf8'));
if(tianguaLots.lots.length!==18 || new Set(tianguaLots.lots.map(x=>x.number)).size!==18)throw Error('Geometria Tianguá não contém 18 lotes únicos');
const tianguaVisual=readFileSync(resolve(cwd,'src/visual/tiangua-scene.js'),'utf8')
 .replace('__CDN_TIANGUA_LOTS_JSON__',JSON.stringify(tianguaLots))
 .replace('__CDN_TIANGUA_BASE_IMAGE__','data:image/webp;base64,'+tianguaBase)
 .replace('__CDN_TIANGUA_MARKET_SPRITE__','data:image/webp;base64,'+tianguaSprites.mercado)
 .replace('__CDN_TIANGUA_BAKERY_SPRITE__','data:image/webp;base64,'+tianguaSprites.padaria)
 .replace('__CDN_TIANGUA_CLOTHING_SPRITE__','data:image/webp;base64,'+tianguaSprites.roupas);
if(tianguaVisual.includes('__CDN_TIANGUA_'))throw Error('Ativos visuais Tianguá incompletos');
const v221css=readFileSync(resolve(cwd,'src/shell/v221-city.css'),'utf8');
const core=readFileSync(resolve(cwd,'src/core/game.js'),'utf8');
const uiShell=readFileSync(resolve(cwd,'src/ui/app.js'),'utf8');
const marketViews=readFileSync(resolve(cwd,'src/ui/market-views.part.js'),'utf8');
const financeViews=readFileSync(resolve(cwd,'src/ui/finance-views.part.js'),'utf8');
const ui=uiShell.replace('/* CDN_MARKET_VIEWS */',marketViews).replace('/* CDN_FINANCE_VIEWS */',financeViews);
if (ui.includes('/* CDN_MARKET_VIEWS */') || ui.includes('/* CDN_FINANCE_VIEWS */')) throw Error('Fragmentos visuais incompletos');
const pkg=JSON.parse(readFileSync(resolve(cwd,'package.json'),'utf8'));
const coreVersion=core.match(/const VERSION = '([^']+)'/)?.[1];
if (!coreVersion || pkg.version!==coreVersion) throw Error('Versão divergente entre motor e package.json');
for (const id of ['intro-version','build-version','footer-version']) {
  if (!template.includes(`id="${id}">v${coreVersion}<`)) throw Error(`Versão incorreta no ${id}; esperado v${coreVersion}`);
}
if (!template.includes(`<title>Cidade dos Negócios 1 · v${coreVersion}</title>`)) throw Error('Versão incorreta no título HTML');
const html=template.replace('/* CDN_CSS */',css).replace('/* CDN_V2_CSS */',v2css).replace('/* CDN_V21_CSS */',v21Inline).replace('/* CDN_V22_CSS */',v22css).replace('/* CDN_V221_CSS */',v221css).replace('/* CDN_CORE */',core).replace('/* CDN_VISUAL */',visual+'\n'+tianguaVisual).replace('/* CDN_UI */',ui);
if (/\/\* CDN_(CSS|V2_CSS|V21_CSS|V22_CSS|V221_CSS|CORE|VISUAL|UI) \*\//.test(html)) throw Error('Build incompleto');
writeFileSync(resolve(cwd,'index.html'),html,'utf8');
const hash=createHash('sha256').update(html).digest('hex');
console.log(`HTML gerado: ${Buffer.byteLength(html)} bytes | SHA256 ${hash}`);
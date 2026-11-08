import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const url=pathToFileURL(resolve('index.html')).href,out=join(process.env.RUNNER_TEMP||tmpdir(),'v310-visual-evidence');
mkdirSync(out,{recursive:true});
const results=[];
for(const channel of ['chrome','msedge'])for(const width of [390,1366]){
 const folder=mkdtempSync(join(tmpdir(),'cidade-v310-'+channel+'-'));let ctx;
 try{
  ctx=await chromium.launchPersistentContext(folder,{channel,headless:true,viewport:{width,height:width<600?844:900},isMobile:width<600,hasTouch:width<600});
  const page=ctx.pages()[0]||await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  await page.locator('#player-name').fill('Jogador QA');await page.locator('#company-name').fill('Empresa QA');
  await page.locator('#start-city').selectOption('CE-TIANGUA');
  await page.locator('#career-form button[type=submit]').click();
  await page.locator('#v31-dock').waitFor({state:'visible'});
  // Viewport real, sem menu lateral e sem altura de painel ERP.
  const geometry=await page.evaluate(()=>{
    const canvas=document.getElementById('map-canvas'),svg=canvas.querySelector('svg');
    const r=canvas.getBoundingClientRect(),sr=svg.getBoundingClientRect();
    const dock=document.getElementById('v31-dock').getBoundingClientRect();
    const sidebar=document.querySelector('.sidebar');
    const metric=(id)=>document.getElementById(id).textContent;
    return {width:innerWidth,height:innerHeight,map:{x:r.x,y:r.y,w:r.width,h:r.height},
      svg:{w:sr.width,h:sr.height},
      dock:{x:dock.x,w:dock.width},
      sidebarHidden:getComputedStyle(sidebar).display==='none',
      topbarHidden:getComputedStyle(document.querySelector('.topbar')).display==='none',
      scrollWidth:document.documentElement.scrollWidth,
      cash:metric('v31-hud-cash'),date:metric('v31-hud-date')};
  });
  assert.equal(geometry.sidebarHidden,true,'Sidebar ERP ainda ocupa a tela');
  assert.equal(geometry.topbarHidden,true,'Topbar antigo ainda ocupa a tela');
  assert.ok(Math.abs(geometry.map.x)<=2 && Math.abs(geometry.map.y)<=2,'Mapa nao inicia na origem da viewport');
  assert.ok(geometry.map.w>=width-2 && geometry.map.h>=geometry.height-2,'Mapa nao ocupa 100% da viewport');
  assert.ok(geometry.svg.w>=width-3 && geometry.svg.h>=geometry.height-3,'Cena SVG nao cobre a viewport');
  assert.ok(geometry.scrollWidth<=width+4,'Rolagem horizontal fora do viewport');
  assert.ok(Math.abs(geometry.dock.x+geometry.dock.w/2-width/2)<=4,'Dock nao centralizada');
  assert.ok(geometry.cash!=='—' && geometry.date!=='—','HUD sem dados reais da carreira');
  const before=await page.evaluate(async()=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore),s=CidadeCore.importSave(raw).state;
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion};
  });
  await page.locator('#v31-camera-plus').click();
  await page.locator('#v31-camera-minus').click();
  await page.locator('#v31-camera-plus').click();
  // Clique no SVG transformado valida a geometria real do lote, nao o seletor auxiliar.
  await page.locator('#map-canvas [data-lot="10"]').click();
  assert.match(await page.locator('#selected-lot').textContent(),/Lote 10/);
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  const panBefore=await page.locator('#map-canvas').evaluate(el=>el.scrollLeft);
  await page.locator('#map-canvas').focus();
  await page.keyboard.press('ArrowRight');
  const panAfter=await page.locator('#map-canvas').evaluate(el=>el.scrollLeft);
  assert.ok(panAfter>panBefore,'Pan por teclado nao moveu a camera');
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  assert.equal(await page.locator('[data-view="cidade"]').isVisible(),true);
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),true);
  assert.equal(await page.locator('#v31-backdrop').isVisible(),true);
  assert.equal(await page.locator('[data-view="mercado"]').getAttribute('aria-modal'),'true');
  const layers=await page.evaluate(()=>({
    toast:parseInt(getComputedStyle(document.getElementById('toast')).zIndex,10),
    modal:parseInt(getComputedStyle(document.querySelector('.view[data-view="mercado"]')).zIndex,10),
    backdrop:parseInt(getComputedStyle(document.getElementById('v31-backdrop')).zIndex,10),
    dock:parseInt(getComputedStyle(document.getElementById('v31-dock')).zIndex,10)}));
  assert.ok(layers.toast>layers.modal && layers.modal>layers.backdrop && layers.backdrop>layers.dock,
    'Toast/backdrop/modal/dock com z-index incorreto');
  await page.screenshot({path:join(out,channel+'-'+width+'-overlay.png')});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#v31-backdrop').isVisible(),false,'Esc nao fechou backdrop');
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  await page.locator('#v31-backdrop').click({position:{x:4,y:4}});
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),false,'Backdrop nao fechou modal');
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  await page.locator('#v31-overlay-close').click();
  assert.equal(await page.locator('#v31-backdrop').isVisible(),false);
  const after=await page.evaluate(async()=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore),s=CidadeCore.importSave(raw).state;
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion};
  });
  assert.deepEqual(after,before,'Camera e overlays nao alteram save');
  await page.locator('#v31-classic-switch').click();
  assert.equal(await page.locator('.sidebar').isVisible(),true,'Fallback classico indisponivel');
  await page.locator('#v31-classic-return').click();
  assert.equal(await page.locator('#map-canvas').isVisible(),true,'Nao retornou a cidade imersiva');
  await page.reload({waitUntil:'load'});await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  assert.equal(await page.locator('#v31-camera-label').textContent(),'125%');
  await page.locator('#v31-camera-home').click();
  assert.equal(await page.locator('#map-canvas [data-lot]').count(),18);
  await page.locator('#map-lot-picker').selectOption('2');
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  await page.screenshot({path:join(out,channel+'-'+width+'-cidade.png')});
  assert.equal(errors.length,0,errors.join(';'));
  results.push({channel,width,result:'PASS',fullscreen:true,centeredDock:true,modals:true,escape:true,backdrop:true,lotHitTest:true,economyUnaffected:true});
 }finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS_EMULATED',physicalMobileTested:false,privateSaveTested:false,results},null,2));
console.log('V310_VISUAL_QA '+JSON.stringify({status:'PASS_EMULATED',scenarios:results.length}));

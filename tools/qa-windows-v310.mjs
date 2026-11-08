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
  const before=await page.evaluate(async()=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore),s=CidadeCore.importSave(raw).state;
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion};
  });
  await page.locator('#v31-camera-plus').click();
  await page.locator('#v31-camera-minus').click();
  await page.locator('#v31-camera-plus').click();
  await page.locator('#v31-dock [data-v31-open="mercado:compras"]').click();
  assert.equal(await page.locator('[data-view="cidade"]').isVisible(),true);
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),true);
  await page.screenshot({path:join(out,channel+'-'+width+'-overlay.png')});
  await page.locator('#v31-overlay-close').click();
  const after=await page.evaluate(async()=>{
   const raw=await CidadeDurableStore.readCurrent(CidadeCore),s=CidadeCore.importSave(raw).state;
   return {revision:s.revision,tick:s.calendar.tick,cash:CidadeCore.overview(s).cash,schema:s.schemaVersion};
  });
  assert.deepEqual(after,before,'Camera e overlays nao alteram save');
  await page.reload({waitUntil:'load'});await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  assert.equal(await page.locator('#v31-camera-label').textContent(),'125%');
  await page.locator('#v31-camera-home').click();
  assert.equal(await page.locator('#map-canvas [data-lot]').count(),18);
  await page.locator('#map-lot-picker').selectOption('2');
  assert.equal(await page.locator('#v31-lot-quick').isVisible(),true);
  await page.screenshot({path:join(out,channel+'-'+width+'-cidade.png')});
  assert.equal(errors.length,0,errors.join(';'));
  results.push({channel,width,result:'PASS',economyUnaffected:true});
 }finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
writeFileSync(join(out,'report.json'),JSON.stringify({status:'PASS_EMULATED',physicalMobileTested:false,privateSaveTested:false,results},null,2));
console.log('V310_VISUAL_QA '+JSON.stringify({status:'PASS_EMULATED',scenarios:results.length}));

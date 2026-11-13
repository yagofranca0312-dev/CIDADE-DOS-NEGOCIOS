// Debug pré-homologação: somente saves sintéticos, perfis temporários e file://.
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {chromium} from 'playwright';
assert.equal(process.platform,'win32','Executar no Windows hospedado, sem alegar dispositivo físico.');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore');
let sequence=0;
function step(s,type,payload={}){const r=Core.dispatch(s,{type,payload,id:'debug-'+(++sequence)});assert.equal(r.ok,true,r.error);return r.state;}
let seed=step(null,'CARREIRA.CRIAR',{name:'Debug Sintético',companyName:'Rede QA',cityId:'CE-TIANGUA',seed:333399});
for(const lot of [3,4])seed=step(seed,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot});
const raw=Core.exportSave(seed),target=pathToFileURL(resolve('index.html')).href;
const persisted=page=>page.evaluate(()=>CidadeDurableStore.readCurrent(CidadeCore));
async function scenario(channel,width,height){
 const folder=mkdtempSync(join(tmpdir(),'cidade-debug-'+channel+'-'));let ctx;
 const errors=[];
 try{
  ctx=await chromium.launchPersistentContext(folder,{channel,headless:true,viewport:{width,height},isMobile:width<600,hasTouch:width<600,acceptDownloads:true});
  const page=ctx.pages()[0]||await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(target,{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  const importSave=async()=>{
   await page.locator('#import-file').setInputFiles({name:'debug-synthetic.json',mimeType:'application/json',buffer:Buffer.from(raw)});
   await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
   await page.locator('#v333-command-hub').waitFor({state:'visible'});
  };
  await importSave();const before=await persisted(page);
  await page.locator('[data-v333-hub-tab="equipe"]').click();
  const count=Number(await page.locator('#v332-hud-advisory').textContent());
  assert.ok(count>0);
  await page.locator('[data-v332-advisor-dismiss]').first().click();
  assert.equal(Number(await page.locator('#v332-hud-advisory').textContent()),count-1);
  assert.ok((await page.locator('#v333-hub-summary').textContent()).includes((count-1)+' aviso(s)'));
  assert.equal(await persisted(page),before,'Dispensa escreveu no save');
  await page.locator('[data-v333-hub-tab="agenda"]').click();
  await page.locator('#v332-advisor-toggle').click();
  assert.equal(await page.locator('#v332-agenda-list').isVisible(),false);
  assert.equal(await page.locator('#v332-agenda-toggle').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),true);
  await page.locator('#v332-advisor-close').press('Escape');
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),false);
  await page.locator('[data-v333-hub-tab="equipe"]').focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('[data-v333-hub-tab="acoes"]').evaluate(el=>el===document.activeElement),true);

  // Importação retida no File.text real: memória antiga continua visível,
  // mas nenhum atalho deve abrir formulário até a persistência ser confirmada.
  await page.evaluate(()=>{
   const native=File.prototype.text;
   File.prototype.text=async function(){
    await new Promise(resolve=>{window.__debugReleaseImport=resolve;});
    return native.call(this);
   };
   window.__debugNativeText=native;
  });
  await page.locator('#import-file').setInputFiles({name:'debug-held.json',mimeType:'application/json',buffer:Buffer.from(raw)});
  await page.waitForFunction(()=>document.body.dataset.storageBusy==='true'&&typeof window.__debugReleaseImport==='function');
  await page.locator('.v332-quick-actions [data-v332-route="mercado:compras"]').click();
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),false,'Atalho abriu com importação pendente');
  assert.equal(await persisted(page),before,'Importação retida alterou o save');
  await page.evaluate(()=>{File.prototype.text=window.__debugNativeText;window.__debugReleaseImport();});
  await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
  await page.locator('.v332-quick-actions [data-v332-route="mercado:compras"]').click();
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),true,'Atalho não recuperou após importação');
  await page.locator('#v31-overlay-close').click();

  // Falha real em transação IDB durante ativação contextual deve abortar a rota.
  await page.locator('[data-v333-hub-tab="equipe"]').click();
  const other=Core.businesses(seed).find(u=>u.id!==seed.world.activeBusinessId).id;
  const action=page.locator('#v332-advisor-active-list button[data-v332-business-id="'+other+'"]').first();
  const stable=await persisted(page);
  await page.evaluate(()=>{
   window.__debugPut=IDBObjectStore.prototype.put;
   IDBObjectStore.prototype.put=function(value,key){const request=window.__debugPut.call(this,value,key);if(key==='current')this.transaction.abort();return request;};
  });
  await action.click();await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
  assert.equal(await persisted(page),stable,'Ativação abortada alterou save');
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),false,'Rota abriu após falha de persistência');
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.__debugPut;});
  await action.click();await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
  assert.equal(await page.locator('[data-view="mercado"]').isVisible(),true);
  const loaded=Core.importSave(await persisted(page)).state;
  assert.equal(loaded.world.activeBusinessId,other);assert.equal(loaded.revision,seed.revision+1);
  for(const key of ['economy','fiscal'])assert.equal(JSON.stringify(loaded[key]),JSON.stringify(seed[key]),'Navegação alterou '+key);
  assert.deepEqual(errors,[]);
  return {channel,width,height,status:'PASS',summarySynced:true,exclusivePanels:true,pendingImportBlocked:true,contextualAbortAndRetry:true,keyboard:true};
 }finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
const results=[];
for(const channel of ['chrome','msedge'])for(const [width,height] of [[320,720],[390,844],[768,1024],[1366,900]])results.push(await scenario(channel,width,height));
console.log('V333_DEBUG_WINDOWS_QA '+JSON.stringify({status:'PASS',results,userSaveUsed:false,physicalDevicesTested:false,releaseAuthorized:false}));

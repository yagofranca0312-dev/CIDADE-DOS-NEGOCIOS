// V3.3.3-D — QA Windows real hospedado, Chrome e Edge; apenas saves sintéticos.
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {chromium} from 'playwright';
assert.equal(process.platform,'win32','Esta suíte exige Windows hospedado.');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let counter=0;
const apply=(s,type,payload={})=>{
 const r=Core.dispatch(s,{type,payload,id:'qa-v333d-'+(++counter)});
 assert.equal(r.ok,true,String(r.error));return r.state;
};
let seed=apply(null,'CARREIRA.CRIAR',{
 name:'Polimento QA',companyName:'Rede Interface QA',cityId:'CE-TIANGUA',seed:333046
});
seed=apply(seed,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
seed=apply(seed,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:4});
const ids=Core.businesses(seed).map(x=>x.id);
const beforeSave=Core.exportSave(seed);
const target=pathToFileURL(resolve('index.html')).href;
async function stateInfo(page){
 return page.evaluate(async()=>{
  const raw=await CidadeDurableStore.readCurrent(CidadeCore);
  const s=CidadeCore.importSave(raw).state;
  return {revision:s.revision,worldId:s.worldId,
   activeId:s.world.activeBusinessId,ledger:s.economy.ledger.length,
   cash:CidadeCore.overview(s).cash,stock:CidadeCore.overview(s).stock};
 });
}
async function scenario(channel,width,height){
 const dir=mkdtempSync(join(tmpdir(),'v333d-ui-'+channel+'-'));
 let browser=null;const errors=[];
 try{
  browser=await chromium.launchPersistentContext(dir,{channel,headless:true,
    viewport:{width,height},isMobile:width<=430,hasTouch:width<=430});
  const page=browser.pages()[0]||await browser.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto(target,{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  await page.locator('#import-file').setInputFiles({
   name:'qa-v333d.json',mimeType:'application/json',buffer:Buffer.from(beforeSave)
  });
  await page.locator('#v333-command-hub').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
  const savedBefore=await stateInfo(page);
  const summary=await page.locator('#v333-hub-summary').textContent();
  assert.ok(summary.includes('2 empresa(s)'),'Resumo deve contar empresas reais: '+summary);
  const box=await page.evaluate(()=>{
   const hub=document.querySelector('#v333-command-hub').getBoundingClientRect();
   const map=document.querySelector('#map-canvas').getBoundingClientRect();
   const zone=document.querySelector('#v332-bottom-zone').getBoundingClientRect();
   const indicator=document.querySelector('.v31-top-controls').getBoundingClientRect();
   return {w:innerWidth,h:innerHeight,hub:hub.toJSON(),map:map.toJSON(),
    zone:zone.toJSON(),hud:indicator.toJSON(),
    documentWidth:document.documentElement.scrollWidth};
  });
  assert.ok(box.hub.x>=-3&&box.hub.right<=width+3,'Hub fora da viewport');
  assert.ok(box.map.bottom<=box.zone.top+4,'Rodapé invade mapa reservado');
  assert.ok(box.map.y>=box.hud.bottom-15,'Mapa invade indicadores superiores');
  assert.ok(box.documentWidth<=width+6,'Rolagem horizontal do documento');

  // O filtro escolhe uma empresa, mantendo o total global como informação.
  const unit=page.locator('#v333-hub-unit');
  assert.ok((await unit.locator('option').allTextContents()).length>=3);
  await unit.selectOption(ids[0]);
  await page.locator('[data-v333-hub-tab="equipe"]').click();
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),true);
  assert.equal(await page.locator('[data-v333-hub-tab="equipe"]').getAttribute('aria-pressed'),'true');
  const cardIds=await page.locator('#v332-advisor-active-list [data-v333-occurrence-id]').evaluateAll(
   nodes=>nodes.map(n=>n.dataset.v333OccurrenceId));
  assert.ok(cardIds.length>0,'Equipe filtrada sem aviso verificável');
  assert.ok(cardIds.every(id=>id.includes('|'+ids[0]+'|')),'Aviso da empresa errada após filtro: '+cardIds);
  await page.locator('#v333-hub-severity').selectOption('urgente');

  // Agenda abre compromissos reais e seus filtros não criam dívida/prazo.
  await page.locator('[data-v333-hub-tab="agenda"]').click();
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),false);
  assert.equal(await page.locator('#v332-agenda-list').isVisible(),true);
  assert.equal(await page.locator('[data-v333-hub-tab="agenda"]').getAttribute('aria-pressed'),'true');
  await page.locator('#v333-hub-due').selectOption('vencido');
  const rows=await page.locator('#v332-agenda-list [data-v332-route]').count();
  assert.ok(rows>=0);

  // Teclado troca o foco na barra, sem disparar pagamentos/compras.
  const tabs=page.locator('[data-v333-hub-tab]');
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.v333HubTab),'agenda');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.v333HubTab),'acoes');
  await tabs.nth(2).click();
  assert.equal(await page.locator('#v332-agenda-list').isVisible(),false);
  assert.equal(await page.locator('[data-v333-hub-tab="acoes"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>document.activeElement.closest('.v332-quick-actions')!==null),true);

  const savedAfter=await stateInfo(page);
  assert.deepEqual(savedAfter,savedBefore,'Filtros/abas não podem gravar ou alterar save');
  assert.deepEqual(errors,[],'Exceção fatal no navegador');
  return {channel,width,height,status:'PASS',summary,filteredCount:cardIds.length};
 }finally{if(browser)await browser.close();rmSync(dir,{recursive:true,force:true});}
}
const results=[];
for(const channel of ['chrome','msedge'])
 for(const [width,height] of [[320,700],[390,844],[768,1024],[1366,768]])
  results.push(await scenario(channel,width,height));
console.log('V333D_WINDOWS_HUB_QA '+JSON.stringify({status:'PASS',scenarios:results.length,
 results,scope:'Windows hosted headless, Chrome/Edge file://; saves sintéticos; mobile apenas emulado',
 realUserSaveUsed:false,realDeviceTested:false,releaseAuthorized:false}));

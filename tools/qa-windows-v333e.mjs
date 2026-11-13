// Patch E/E — regressão adversarial fim a fim do usuário, dados 100% sintéticos.
// Chrome/Edge Windows hospedado em file://; não substitui aceite em dispositivo real.
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {chromium} from 'playwright';
assert.equal(process.platform,'win32','QA específico só em runner Windows');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let serial=0;
const send=(s,type,payload={})=>{
 const o=Core.dispatch(s,{type,payload,id:'qa-e-'+(++serial)});
 assert.equal(o.ok,true,type+': '+String(o.error));return o.state;
};
let a=send(null,'CARREIRA.CRIAR',{
 name:'Qualidade Global',companyName:'Matriz de Testes',cityId:'CE-TIANGUA',seed:333501
});
a=send(a,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
a=send(a,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:4});
let b=send(null,'CARREIRA.CRIAR',{
 name:'Outro Mundo',companyName:'Outra Empresa QA',cityId:'CE-TIANGUA',seed:333502
});
b=send(b,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
assert.notEqual(a.worldId,b.worldId,'Os mundos de teste precisam ser distintos');
const aSave=Core.exportSave(a),bSave=Core.exportSave(b),unitId=Core.businesses(a)[0].id;
const target=pathToFileURL(resolve('index.html')).href;
async function persisted(page){
 return page.evaluate(async()=>await CidadeDurableStore.readCurrent(CidadeCore));
}
async function scenario(channel,width,height){
 const folder=mkdtempSync(join(tmpdir(),'v333e-'+channel+'-'));let context;
 const errors=[];
 try{
  context=await chromium.launchPersistentContext(folder,{
   channel,headless:true,viewport:{width,height},
   isMobile:width<=430,hasTouch:width<=430});
  const page=context.pages()[0]||await context.newPage();
  page.on('dialog',d=>d.accept());
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(target,{waitUntil:'load'});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready');
  const importSave=async(raw,name)=>{
   await page.locator('#import-file').setInputFiles({
    name,mimeType:'application/json',buffer:Buffer.from(raw)
   });
   await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
   await page.locator('#v333-command-hub').waitFor({state:'visible'});
  };
  await importSave(aSave,'candidate-e-first.json');
  const original=await persisted(page);
  const summary=await page.locator('#v333-hub-summary').textContent();
  assert.ok(summary.includes('2 empresa(s)'));
  await page.locator('[data-v333-hub-tab="equipe"]').click();
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),true);
  const activeCount=await page.locator('#v332-advisor-active-list [data-v332-advisor-dismiss]').count();
  assert.ok(activeCount>0,'A fixture precisa ter ocorrência original');
  const indicator=await page.locator('#v332-hud-advisory').textContent();
  assert.equal(Number(indicator),activeCount);
  await page.locator('#v333-hub-severity').selectOption('informativa');
  assert.equal(await page.locator('#v332-advisor-active-list [data-v332-advisor-dismiss]').count(),0);
  assert.match(await page.locator('#v332-advisor-preview-text').textContent(),/Nenhum aviso corresponde aos filtros/);
  assert.equal(await page.locator('#v332-advisor-panel').getAttribute('data-severity'),'normal');
  assert.equal(await page.locator('#v332-hud-advisory').textContent(),indicator);
  assert.deepEqual(errors,[],'Filtro vazio provocou exceção JavaScript');

  await page.locator('#v333-hub-severity').selectOption('all');
  await page.locator('#v333-hub-unit').selectOption(unitId);
  const alerts=page.locator('#v332-advisor-active-list [data-v332-advisor-dismiss]');
  assert.ok(await alerts.count()>0,'O filtro por empresa perdeu avisos');
  await alerts.first().click();
  assert.equal(await persisted(page),original,'Dispensar aviso gravou no save');
  await page.locator('#v332-advisor-history-tab').click();
  assert.ok((await page.locator('#v332-advisor-history-list').textContent()).includes('Dispensada'),
   'Dispensa não entrou no histórico visual');
  await page.locator('#v332-advisor-active-tab').click();
  await page.locator('[data-v333-hub-tab="agenda"]').click();
  assert.equal(await page.locator('#v332-agenda-list').isVisible(),true);
  assert.equal(await page.locator('#v332-advisor-drawer').isVisible(),false);
  assert.equal(await persisted(page),original,'Abrir Agenda gravou no save');
  await page.locator('[data-v333-hub-tab="acoes"]').click();
  assert.equal(await page.locator('#v332-agenda-list').isVisible(),false);
  assert.equal(await persisted(page),original,'Ações Rápidas gravaram ao abrir');

  // Mudança de mundo destrói estado efêmero do filtro e das dispensas.
  await importSave(bSave,'candidate-e-second.json');
  assert.equal(await page.locator('#v333-hub-unit').inputValue(),'all');
  assert.equal(await page.locator('#v333-hub-severity').inputValue(),'all');
  assert.equal(await page.locator('#v333-hub-due').inputValue(),'all');
  assert.ok((await page.locator('#v333-hub-summary').textContent()).includes('1 empresa(s)'));
  await page.locator('[data-v333-hub-tab="equipe"]').click();
  await page.locator('#v332-advisor-history-tab').click();
  assert.match(await page.locator('#v332-advisor-history-list').textContent(),
   /Nenhum aviso resolvido ou dispensado/);
  assert.deepEqual(errors,[],'Erro não tratado no navegador');
  return {channel,width,height,status:'PASS',initialUnits:2,finalUnits:1,
    filteredZeroWithoutCrash:true,dismissWithoutWrite:true,worldIsolation:true};
 }finally{if(context)await context.close();rmSync(folder,{force:true,recursive:true});}
}
const reports=[];
for(const channel of ['chrome','msedge'])
 for(const [width,height] of [[390,844],[1366,768]])
  reports.push(await scenario(channel,width,height));
console.log('V333E_WINDOWS_GLOBAL_QA '+JSON.stringify({
 status:'PASS',scenarios:reports.length,results:reports,
 syntheticOnly:true,realPersonalInstallation:false,realSave:false,
 mobileEmulated:true,releaseAuthorized:false}));

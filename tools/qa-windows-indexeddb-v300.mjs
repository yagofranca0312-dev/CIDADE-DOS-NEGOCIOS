/**
 * P0-04: teste isolado do IndexedDB real em Windows, Chrome e Edge.
 * Migra save V2.9 por reinício de app, aborta transaction IDB real e confere
 * fail-closed, retenta, backup e reload. Não utiliza perfil ou save pessoal.
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {chromium} from 'playwright';

assert.equal(process.platform,'win32');
const target=pathToFileURL(resolve('index.html')).href;
const key='cidade-dos-negocios-save-v1';
const legacyCore=runInNewContext(readFileSync('tests/fixtures/core_v2_9_0_homologada.js','utf8')+'\nCidadeCore',{});
const findings=[];
function chk(value,label){
  assert.ok(value,label);
  findings.push(label);
}
async function open(context){
  const page=context.pages()[0]??await context.newPage();
  await page.goto(target,{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready',{timeout:25000});
  return page;
}
async function read(page){
  await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true',{timeout:30000});
  return page.evaluate(async()=>{
    const raw=await CidadeDurableStore.readCurrent(CidadeCore);
    if(!raw)return {raw:null};
    const s=CidadeCore.importSave(raw).state;
    return {raw,tick:s.calendar.tick,revision:s.revision,
      unitCount:CidadeCore.businesses(s).length,
      balanced:CidadeCore.balanceSheet(s).balanced,
      mode:CidadeDurableStore.mode(),
      legacy:localStorage.getItem('cidade-dos-negocios-save-v1')};
  });
}
function oldSave(){
  let r=legacyCore.dispatch(null,{type:'CARREIRA.CRIAR',id:'migration-v290-start',
    payload:{name:'Carreira fictícia legada',companyName:'Empresa fictícia V2.9',
      cityId:'CE-TIANGUA',seed:902012}});
  assert.equal(r.ok,true,r.error);
  r=legacyCore.dispatch(r.state,{type:'EMPRESA.ABRIR',id:'migration-v290-open',
    payload:{sector:'mercado',cityId:'CE-TIANGUA',lot:2}});
  assert.equal(r.ok,true,r.error);
  return legacyCore.exportSave(r.state);
}
for(const channel of ['chrome','msedge']){
  const folder=mkdtempSync(join(tmpdir(),'cidade-indexeddb-p004-'+channel+'-'));
  let ctx;
  try{
    ctx=await chromium.launchPersistentContext(folder,{channel,headless:true,
      viewport:{width:1366,height:900},args:['--disable-background-networking']});
    let page=await open(ctx);
    chk((await page.evaluate(()=>CidadeDurableStore.mode()))==='indexeddb',
      channel+': IndexedDB real habilitado sob file://');
    const original=oldSave();
    await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,original]);
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>document.body.dataset.storageReady==='ready',{timeout:25000});
    let v=await read(page);
    chk(v.raw!==null&&v.mode==='indexeddb'&&v.unitCount===1&&v.balanced,
      channel+': carreira V2.9 migrada, validada e armazenada em IndexedDB');
    chk(v.legacy===null&&v.raw.length<original.length,
      channel+': após readback, chave local antiga liberada e save compacto menor');
    const before=v.raw;
    // Falha em transação IndexedDB real: o write tem requisição, mas a transação
    // é abortada antes de completar. Guarda só libera memória se transação concluir.
    await page.evaluate(()=>{
      const originalPut=IDBObjectStore.prototype.put;
      window.__qaOriginalIdbPut=originalPut;
      IDBObjectStore.prototype.put=function(value,key){
        const request=originalPut.call(this,value,key);
        if(key==='current')this.transaction.abort();
        return request;
      };
    });
    await page.locator('#v221-hud-time').click();
    await page.locator('[data-v221-time="1"]').click();
    await page.waitForFunction(()=>document.body.dataset.storageBusy!=='true',{timeout:30000});
    v=await read(page);
    const notice=await page.locator('#autosave-label').textContent();
    chk(v.raw===before&&v.tick===0&&v.balanced&&/NÃO confirmada/.test(notice),
      channel+': transação abortada rejeita avanço sem alterar JSON, calendário nem balanço');
    await page.evaluate(()=>{
      IDBObjectStore.prototype.put=window.__qaOriginalIdbPut;
      delete window.__qaOriginalIdbPut;
    });
    await page.locator('#v221-hud-time').click();
    await page.locator('[data-v221-time="1"]').click();
    v=await read(page);
    chk(v.tick===1&&v.revision>1&&v.raw!==before,
      channel+': recuperação do IndexedDB grava apenas um dia após a falha');
    const durable=v.raw;
    await ctx.close();ctx=null;
    ctx=await chromium.launchPersistentContext(folder,{channel,headless:true,
      viewport:{width:1366,height:900},args:['--disable-background-networking']});
    page=await open(ctx);
    v=await read(page);
    chk(v.raw===durable&&v.tick===1&&v.balanced&&v.legacy===null,
      channel+': fechar navegador e reabrir IndexedDB recupera a mesma carreira');
  }finally{
    if(ctx)await ctx.close();
    rmSync(folder,{recursive:true,force:true});
  }
}
console.log('V300_INDEXEDDB_MIGRATION_QA '+JSON.stringify({
  result:'PASS',assertions:findings.length,browsers:['chrome','msedge'],
  scope:'Windows hosted file:// real IndexedDB and old V2.9 fixture',
  verified:['migration','compact-local','legacy-cleanup-after-write','transaction-abort-fail-closed','retry','browser-reopen'],
  realUserSaveUsed:false,realUserWindowsTested:false,releaseApproved:false
}));

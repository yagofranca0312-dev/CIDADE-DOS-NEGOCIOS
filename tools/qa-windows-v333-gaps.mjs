// Lacunas 1 -> 2 -> 3, saves sintéticos, file://, duas instâncias independentes
// da UI no mesmo perfil. Gates transacionais explícitos, sem sleeps de sincronização.
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {chromium} from 'playwright';
assert.equal(process.platform,'win32');
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore');
const plain=x=>JSON.parse(JSON.stringify(x));
let seq=0;
const step=(s,type,payload={})=>{const r=Core.dispatch(s,{type,payload,id:'gaps-fixture-'+(++seq)});assert.equal(r.ok,true,r.error);return r.state;};
function seed(id){let s=step(null,'CARREIRA.CRIAR',{name:'Carreira '+id,companyName:'Rede Sintética '+id,cityId:'CE-TIANGUA',seed:333700+id});for(const lot of [3,4])s=step(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot});return plain(s);}
const A=seed(1),B=seed(2),url=pathToFileURL(resolve('index.html')).href;
const input=(s,name='synthetic.json')=>({name,mimeType:'application/json',buffer:Buffer.from(Core.exportSave(s))});
const idle=p=>p.waitForFunction(()=>document.body.dataset.storageBusy!=='true');
async function durable(p){return p.evaluate(()=>CidadeDurableStore.readCurrent(CidadeCore));}
async function memory(p,compact=false){const pending=p.waitForEvent('download');await p.locator(compact?'#export-compact-btn':'#export-btn').evaluate(el=>el.click());const dl=await pending;return plain(Core.importSave(readFileSync(await dl.path(),'utf8')).state);}
async function open(ctx){const p=await ctx.newPage();p.on('dialog',d=>d.accept());p.on('pageerror',e=>{throw e;});await p.goto(url);await p.waitForFunction(()=>document.body.dataset.storageReady==='ready');return p;}
async function load(p,s){await p.locator('#import-file').setInputFiles(input(s));await idle(p);assert.deepEqual(await memory(p),plain(s));}
async function same(p,s){assert.deepEqual(await memory(p),plain(s));assert.deepEqual(plain(Core.importSave(await durable(p)).state),plain(s));}
async function reload(p){await p.reload();await p.waitForFunction(()=>document.body.dataset.storageReady==='ready');}
async function holdFile(p){await p.evaluate(()=>{window.__gapText=File.prototype.text;File.prototype.text=async function(){await new Promise(resolve=>window.__gapReleaseFile=resolve);return window.__gapText.call(this);};});}
async function releaseFile(p){await p.evaluate(()=>{File.prototype.text=window.__gapText;window.__gapReleaseFile();});await idle(p);}
async function holdDB(p){await p.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('cidade-dos-negocios-v300-durable',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves');let active=true,started=false;window.__gapReleaseDB=()=>{active=false;};tx.oncomplete=()=>db.close();const next=()=>{const r=store.get('__gap_barrier__');r.onsuccess=()=>{if(!started){started=true;resolve();}if(active)next();};};next();};}));}
async function releaseDB(p){await p.evaluate(()=>window.__gapReleaseDB());}
async function clickDay(p){await p.locator('#v31-next-day').click();await idle(p);}
async function scenario(channel){
 const folder=mkdtempSync(join(tmpdir(),'v333-gaps-'+channel+'-'));let ctx;
 const checks=[];let stage='G1';
 const launch=()=>chromium.launchPersistentContext(folder,{channel,headless:true,acceptDownloads:true,viewport:{width:1366,height:900}});
 try{
  ctx=await launch();let p=await open(ctx);await load(p,A);
  // G1: importação B retida; segunda importação e avanço recusados.
  await holdFile(p);await p.locator('#import-file').setInputFiles(input(B));
  await p.waitForFunction(()=>typeof window.__gapReleaseFile==='function'&&document.body.dataset.storageBusy==='true');
  await p.locator('#import-file').setInputFiles(input(A,'other.json'));await p.locator('#v31-next-day').click();
  await same(p,A);await releaseFile(p);await same(p,B);checks.push('G1_pending_import_distinct_blocked');
  await load(p,A);
  // Leitura/gravação IDB pendente: nenhum import B pode substituir o avanço.
  await holdDB(p);await p.locator('#v31-next-day').click();await p.waitForFunction(()=>document.body.dataset.storageBusy==='true');
  await p.locator('#import-file').setInputFiles(input(B));assert.deepEqual(await memory(p),A);
  await releaseDB(p);await idle(p);let advanced=await memory(p);assert.equal(advanced.worldId,A.worldId);assert.equal(advanced.calendar.tick,1);await same(p,advanced);checks.push('G1_pending_IDB_blocks_import');
  await load(p,A);
  // Cancelamento de confirm não escreve; arquivo inválido não escreve.
  p.removeAllListeners('dialog');p.on('dialog',d=>d.dismiss());await p.locator('#import-file').setInputFiles(input(B));await idle(p);await same(p,A);
  p.removeAllListeners('dialog');p.on('dialog',d=>d.accept());
  await p.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{')});await idle(p);await same(p,A);
  await p.evaluate(()=>{window.__nativeFileText=File.prototype.text;File.prototype.text=async()=>{throw Error('leitura interrompida pelo teste');};});
  await p.locator('#import-file').setInputFiles(input(B));await idle(p);await same(p,A);await p.evaluate(()=>File.prototype.text=window.__nativeFileText);
  // Abort real da transação de importação; UI/armazenamento preservam A.
  await p.evaluate(()=>{window.__gapPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){const r=window.__gapPut.call(this,value,key);if(key==='current')this.transaction.abort();return r;};});
  await p.locator('#import-file').setInputFiles(input(B));await idle(p);await same(p,A);await p.evaluate(()=>IDBObjectStore.prototype.put=window.__gapPut);
  await load(p,B);await same(p,B);checks.push('G1_cancel_invalid_read_abort_recovery');
  // Fechar aba enquanto lê B: reabrir mantém A, nunca uma mistura A/B.
  await load(p,A);await holdFile(p);await p.locator('#import-file').setInputFiles(input(B));await p.waitForFunction(()=>typeof window.__gapReleaseFile==='function');await p.close();p=await open(ctx);await same(p,A);checks.push('G1_close_pending_read_preserves_A');
  stage='G2';
  const original=await memory(p),other=Core.businesses(original).find(u=>u.id!==original.world.activeBusinessId).id;
  await p.locator('[data-v333-hub-tab="equipe"]').click();await p.locator('#v332-advisor-active-list button[data-v332-business-id="'+other+'"]').first().click();await idle(p);
  const selected=await memory(p),newIds=Object.keys(selected.audit.commands).filter(k=>!(k in original.audit.commands));assert.equal(newIds.length,1);
  const expected=Core.dispatch(original,{type:'EMPRESA.ATIVAR',payload:{businessId:other},id:newIds[0]});assert.equal(expected.ok,true);assert.deepEqual(selected,plain(expected.state));await same(p,selected);
  await p.locator('#v31-overlay-close').click();
  await p.locator('[data-v333-hub-tab="agenda"]').click();await p.locator('[data-v333-hub-tab="acoes"]').click();
  await p.locator('.v332-quick-actions [data-v332-route="mercado:compras"]').click();await p.locator('#v31-overlay-close').click();
  assert.deepEqual(await memory(p,true),selected);await same(p,selected);await reload(p);await same(p,selected);
  await load(p,selected);await same(p,selected);await p.locator('#import-file').setInputFiles({name:'compact.json',mimeType:'application/json',buffer:Buffer.from(Core.exportSaveCompact(selected))});await idle(p);await same(p,selected);
  await ctx.close();ctx=await launch();p=await open(ctx);await same(p,selected);checks.push('G2_full_state_context_forms_formats_browser_reopen');
  stage='G3';
  await load(p,A);const q=await open(ctx);await same(q,A);
  // A avança; B ainda contém A antigo. B deve RECUSAR a escrita, sem apagar A.
  await clickDay(p);const afterA=await durable(p);await clickDay(q);
  const afterB=await durable(q);
  console.log('V333_GAPS_STALE_WRITE '+JSON.stringify({channel,preserved:afterA===afterB,originalTick:A.calendar.tick,afterATick:Core.importSave(afterA).state.calendar.tick,afterBTick:Core.importSave(afterB).state.calendar.tick}));
  assert.equal(afterB,afterA,'P1 LOST_UPDATE: aba B sobrescreveu a gravação confirmada de A');checks.push('G3_stale_writer_rejected');
  await reload(q);await same(q,Core.importSave(afterA).state);
  // Escritas sobre a mesma revisão, ordenadas por barreira IDB real.
  await holdDB(p);await p.locator('#v31-next-day').click();await q.locator('#v31-next-day').click();
  await Promise.all([p,q].map(x=>x.waitForFunction(()=>document.body.dataset.storageBusy==='true')));await releaseDB(p);await Promise.all([idle(p),idle(q)]);
  const afterRace=plain(Core.importSave(await durable(p)).state);assert.equal(afterRace.calendar.tick,2);
  const mems=await Promise.all([memory(p),memory(q)]);assert.equal(mems.filter(s=>JSON.stringify(s)===JSON.stringify(afterRace)).length,1);checks.push('G3_simultaneous_exactly_one_writer');
  // Importação de outro world por A invalida B; B não pode restaurar world antigo.
  await reload(p);await reload(q);await load(p,B);const imported=await durable(p);await clickDay(q);assert.equal(await durable(p),imported);await reload(q);await same(q,B);checks.push('G3_cross_world_import_conflict');
  await q.close();await ctx.close();ctx=await launch();p=await open(ctx);await same(p,B);checks.push('G3_reopen_converges');
  return {channel,status:'PASS',checks,fullWorld:true,personalSave:false};
 }catch(e){return {channel,status:'FAIL',stage,checks,error:String(e.message).slice(0,500)};}
 finally{if(ctx)await ctx.close();rmSync(folder,{recursive:true,force:true});}
}
const results=[];for(const channel of ['chrome','msedge'])results.push(await scenario(channel));
const report={status:results.every(x=>x.status==='PASS')?'PASS':'FAIL',results,physicalDevice:false,userSave:false};
writeFileSync(join(process.env.RUNNER_TEMP||tmpdir(),'v333-gaps.json'),JSON.stringify(report,null,2));
console.log('V333_GAPS_QA '+JSON.stringify(report));if(report.status!=='PASS')process.exitCode=1;

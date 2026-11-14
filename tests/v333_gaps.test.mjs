import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore');
const app=readFileSync('src/ui/app.js','utf8');
const take=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b,app.indexOf(a)));
const functions=take('  function persistLocal(candidate){','  function renderSafetyBackup(){')+
 take('  async function commit(type,payload={}){','  // Rotas anteriores')+
 take('  async function importFile(file){','  function launchAuto(){');
const plain=x=>JSON.parse(JSON.stringify(x));
let n=0;
function step(s,type,payload={}){const r=Core.dispatch(s,{type,payload,id:'gaps-'+(++n)});assert.equal(r.ok,true,r.error);return r.state;}
function seed(id){let s=step(null,'CARREIRA.CRIAR',{name:'Sintético '+id,companyName:'Rede '+id,cityId:'CE-TIANGUA',seed:333700+id});for(const lot of [3,4])s=step(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot});return s;}
const A=seed(1),B=seed(2);
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function harness(initial=A){
 let raw=Core.exportSaveCompact(initial),backup=null,writeGate=null,backupGate=null,fail=false;
 const trace={notices:[],renders:0,confirmed:true};
 const store={mode:()=> 'indexeddb',readCurrent:async()=>raw,readBackup:async()=>backup,
  async writeCurrent(next){if(writeGate)await writeGate.promise;if(fail)throw Error('abort sintético');raw=next;},
  async writeBackup(next){if(backupGate)await backupGate.promise;backup=next;}};
 const c={Core,CidadeDurableStore:store,trace,initial,initialRaw:raw,document:{body:{dataset:{}}},
  confirm:()=>trace.confirmed,notify:m=>trace.notices.push(m),setText(){},render:()=>trace.renders++,resetTimer(){}};
 runInNewContext(`let state=initial,durableSnapshot=initialRaw,commitInFlight=false,startupBlocked=false,safetyBackupAvailable=false,restockDraft=null,viewCityId=null,selectedLot=1,inspectorOpen=false,financeQuery=null,financeScope='all',statementView='summary',autosaveStatus='';const business=()=>Core.activeBusiness(state);let seq=0;const nextId=()=>'h-'+(++seq);${functions}\nglobalThis.driver={commit,importFile,state:()=>state,busy:()=>commitInFlight};`,c);
 return {d:c.driver,trace,raw:()=>raw,backup:()=>backup,holdWrite:()=>writeGate=deferred(),holdRead:()=>backupGate=deferred(),fail:v=>fail=v};
}
const file=(s=B)=>({size:100,text:async()=>Core.exportSave(s)});

test('G1: importação diferente pendente bloqueia importação e comandos; só ativa B após confirmação',async()=>{
 const h=harness(),gate=deferred(),f={size:100,text:()=>gate.promise};
 const pending=h.d.importFile(f);assert.equal(h.d.busy(),true);
 await h.d.importFile(file(A));assert.equal(await h.d.commit('TEMPO.AVANCAR_DIA'),false);
 assert.deepEqual(plain(h.d.state()),plain(A));assert.deepEqual(plain(Core.importSave(h.raw()).state),plain(A));
 gate.resolve(Core.exportSave(B));await pending;
 assert.deepEqual(plain(h.d.state()),plain(B));assert.deepEqual(plain(Core.importSave(h.raw()).state),plain(B));assert.equal(h.d.busy(),false);
});
test('G1: gravação pendente recusa importação B sem substituir avanço de A',async()=>{
 const h=harness(),gate=h.holdWrite(),pending=h.d.commit('TEMPO.AVANCAR_DIA');
 await h.d.importFile(file());assert.deepEqual(plain(h.d.state()),plain(A));
 gate.resolve();assert.equal(await pending,true);assert.equal(h.d.state().worldId,A.worldId);assert.equal(h.d.state().calendar.tick,1);
 assert.deepEqual(plain(Core.importSave(h.raw()).state),plain(h.d.state()));
});
test('G1: leitura de backup pendente mantém A e bloqueia nova importação',async()=>{
 const h=harness(),gate=h.holdRead(),pending=h.d.importFile(file());await Promise.resolve();await h.d.importFile(file(A));
 assert.deepEqual(plain(h.d.state()),plain(A));gate.resolve();await pending;assert.deepEqual(plain(h.d.state()),plain(B));
});
test('G1: cancelamento, JSON inválido, leitura interrompida e falha de gravação preservam A; recuperação aceita B',async()=>{
 for(const mode of ['cancel','invalid','read-error','write-error']){
  const h=harness(),before=h.raw();h.trace.confirmed=mode!=='cancel';h.fail(mode==='write-error');
  const f=mode==='invalid'?{size:10,text:async()=>'{'}:mode==='read-error'?{size:10,text:async()=>{throw Error('leitura interrompida');}}:file();
  await h.d.importFile(f);assert.equal(h.raw(),before,mode);assert.deepEqual(plain(h.d.state()),plain(A),mode);assert.equal(h.d.busy(),false);
  h.trace.confirmed=true;h.fail(false);await h.d.importFile(file());assert.deepEqual(plain(h.d.state()),plain(B));
 }
});
test('G2: world e TODAS as estruturas persistidas sobrevivem à seleção e aos dois formatos',()=>{
 const unit=Core.businesses(A).find(u=>u.id!==A.world.activeBusinessId).id;
 const before=plain(A),after=step(A,'EMPRESA.ATIVAR',{businessId:unit}),expected=plain(before);expected.world.activeBusinessId=unit;
 assert.deepEqual(plain(after.world),expected.world);
 for(const key of Object.keys(before).filter(k=>!['world','revision','audit'].includes(k)))assert.deepEqual(plain(after[key]),before[key],key);
 assert.equal(after.revision,A.revision+1);assert.deepEqual(plain({...after.audit,commands:A.audit.commands}),before.audit);
 assert.equal(Object.keys(after.audit.commands).length,Object.keys(A.audit.commands).length+1);
 for(const s of [A,B,after])for(const raw of [Core.exportSave(s),Core.exportSaveCompact(s)])assert.deepEqual(plain(Core.importSave(raw).state),plain(s));
 assert.deepEqual(plain(A),before);
});

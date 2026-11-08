import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Carrega as funções de produção (não uma reimplementação da guarda).
// O stub oferece somente as dependências externas do IIFE da interface.
const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore');
const app=readFileSync('src/ui/app.js','utf8');
const take=(begin,end)=>{
  const start=app.indexOf(begin),stop=app.indexOf(end,start);
  assert.ok(start>=0&&stop>start,'Trecho da UI não encontrado: '+begin);
  return app.slice(start,stop);
};
const persistSource=take('  function persistLocal(candidate){','  function backupCurrent(){');
const commitSource=take('  async function commit(type,payload={}){','  // Rotas anteriores de Finanças');
const KEY='cidade-dos-negocios-save-v1';

function storage(){
  const map=new Map();
  let mode='normal';
  return {
    getItem(key){
      if(mode==='read-denied')throw Error('SecurityError');
      return map.has(key)?map.get(key):null;
    },
    setItem(key,value){
      if(mode==='quota')throw Error('QuotaExceededError');
      if(mode==='write-then-throw-once'){
        map.set(key,value);mode='normal';throw Error('InterruptedWrite');
      }
      if(mode==='drop')return; // falha silenciosa no storage simulado
      map.set(key,value);
    },
    removeItem(key){
      if(mode==='quota'||mode==='read-denied')throw Error('SecurityError');
      map.delete(key);
    },
    setMode(value){mode=value;},
    peek(key=KEY){return map.has(key)?map.get(key):null;}
  };
}
function harness(coreOverride=core){
  const localStorage=storage();
  const trace={notices:[],text:{},renders:0,resets:0};
  const context={CidadeCore:coreOverride,localStorage,trace};
  const script=`
'use strict';
const Core=CidadeCore,KEY='cidade-dos-negocios-save-v1';
let state=null,restockDraft=null,viewCityId=null,selectedLot=1,inspectorOpen=false;
let commitInFlight=false,startupBlocked=false;
const document={body:{dataset:{}}};
let financeQuery=null,financeScope='all',statementView='summary',autosaveStatus='Backup JSON recomendado';
let sequence=0;
const nextId=()=>'p0-ui-guard-'+(++sequence);
const business=()=>state?Core.activeBusiness(state):null;
const setText=(id,value)=>{trace.text[id]=String(value)};
const notify=(message,isError=false)=>{trace.notices.push({message:String(message),isError})};
function render(){trace.renders++}
function resetTimer(){trace.resets++}
${persistSource}
async function persistDurable(candidate){return persistLocal(candidate);}
${commitSource}
globalThis.driver={
  commit,persistLocal,getState:()=>state,status:()=>autosaveStatus,
  getUi:()=>({viewCityId,selectedLot,inspectorOpen})
};
`;
  runInNewContext(script,context,{timeout:5000});
  const d=context.driver;
  const create=()=>d.commit('CARREIRA.CRIAR',{
    name:'Teste P0',companyName:'Comércio de Teste',cityId:'CE-TIANGUA',seed:700102});
  return {d,create,localStorage,trace};
}
const snapshot=s=>JSON.stringify(s);

test('V3.0 P0: carreira criada só fica ativa depois de escrita e leitura verificadas',async()=>{
  const {d,create,localStorage,trace}=harness();
  assert.equal(await create(),true);
  const current=d.getState();
  assert.equal(current.revision,1);
  assert.equal(core.importSave(localStorage.peek()).state.revision,current.revision);
  assert.equal(snapshot(core.importSave(localStorage.peek()).state),snapshot(current));
  assert.equal(trace.renders,1);
  assert.equal(d.status().startsWith('Cópia local verificada'),true);
});

test('V3.0 P0: quota cheia recusa comando e mantém estado, caixa, estoque, calendário e save anterior',async()=>{
  const {d,create,localStorage,trace}=harness();
  await create();
  const before=snapshot(d.getState()),durable=localStorage.peek(),revision=d.getState().revision;
  const uiBefore=d.getUi(),renders=trace.renders;
  localStorage.setMode('quota');
  const ok=await d.commit('EMPRESA.ABRIR',{cityId:'CE-TIANGUA',lot:2,sector:'mercado'});
  assert.equal(ok,false);
  assert.equal(snapshot(d.getState()),before);
  assert.equal(localStorage.peek(),durable);
  assert.equal(d.getState().revision,revision);
  assert.equal(snapshot(d.getUi()),snapshot(uiBefore));
  assert.equal(trace.renders,renders);
  assert.equal(trace.notices.at(-1).isError,true);
  assert.match(trace.notices.at(-1).message,/NÃO confirmada/);
  assert.match(d.status(),/Salvamento local indisponível/);
  assert.equal(trace.text['footer-state'],'Salvamento local sem garantia');
});

test('V3.0 P0: criação sem storage é rejeitada, não cria carreira imaginária',async()=>{
  const {d,create,localStorage,trace}=harness();
  localStorage.setMode('quota');
  assert.equal(await create(),false);
  assert.equal(d.getState(),null);
  assert.equal(localStorage.peek(),null);
  assert.equal(trace.renders,0);
  assert.equal(trace.resets,0);
  assert.match(trace.notices.at(-1).message,/NÃO confirmada/);
});

test('V3.0 P0: storage que perde silenciosamente o write é detectado pelo read-back',async()=>{
  const {d,create,localStorage}=harness();
  assert.equal(await create(),true);
  const before=snapshot(d.getState()),durable=localStorage.peek();
  localStorage.setMode('drop');
  assert.equal(await d.commit('EMPRESA.ABRIR',{cityId:'CE-TIANGUA',lot:4,sector:'padaria'}),false);
  assert.equal(snapshot(d.getState()),before);
  assert.equal(localStorage.peek(),durable);
  assert.match(d.status(),/Falha de leitura de retorno/);
});

test('V3.0 P0: write interrompido tenta restaurar o último save íntegro',async()=>{
  const {d,create,localStorage,trace}=harness();
  await create();
  const old=snapshot(d.getState()),durable=localStorage.peek();
  localStorage.setMode('write-then-throw-once');
  assert.equal(await d.commit('EMPRESA.ABRIR',{cityId:'CE-TIANGUA',lot:2,sector:'mercado'}),false);
  assert.equal(snapshot(d.getState()),old);
  assert.equal(localStorage.peek(),durable);
  assert.equal(snapshot(core.importSave(localStorage.peek()).state),old);
  assert.match(trace.notices.at(-1).message,/InterruptedWrite/);
});

test('V3.0 P0: storage de leitura bloqueada também recusa comando sem tocar estado',async()=>{
  const {d,create,localStorage}=harness();
  await create();
  const before=snapshot(d.getState()),durable=localStorage.peek();
  localStorage.setMode('read-denied');
  assert.equal(await d.commit('TEMPO.AVANCAR_DIA'),false);
  assert.equal(snapshot(d.getState()),before);
  localStorage.setMode('normal');
  assert.equal(localStorage.peek(),durable);
});

test('V3.0 P0: após remover quota uma nova tentativa confirma uma única operação',async()=>{
  const {d,create,localStorage,trace}=harness();
  await create();
  const before=d.getState(),durable=localStorage.peek(),initialNotices=trace.notices.length;
  localStorage.setMode('quota');
  assert.equal(await d.commit('EMPRESA.ABRIR',{cityId:'CE-TIANGUA',lot:2,sector:'mercado'}),false);
  assert.equal(d.getState().revision,before.revision);
  localStorage.setMode('normal');
  assert.equal(await d.commit('EMPRESA.ABRIR',{cityId:'CE-TIANGUA',lot:2,sector:'mercado'}),true);
  const newState=d.getState();
  assert.equal(newState.revision,before.revision+1);
  assert.equal(core.businesses(newState).length,1);
  assert.equal(newState.economy.ledger.length,before.economy.ledger.length+1);
  assert.equal(newState.audit.events.length,before.audit.events.length+1);
  assert.notEqual(localStorage.peek(),durable);
  assert.equal(snapshot(core.importSave(localStorage.peek()).state),snapshot(newState));
  assert.ok(trace.notices.length>initialNotices);
  assert.match(trace.notices.at(-1).message,/confirmada|confirmado/i);
});

test('V3.0 P0: avançar muitos dias com falha de persistência não avança tick nem RNG',async()=>{
  const {d,create,localStorage}=harness();
  await create();
  const before=snapshot(d.getState()),day=d.getState().calendar.tick,seed=d.getState().rng.seed;
  localStorage.setMode('quota');
  assert.equal(await d.commit('TEMPO.AVANCAR_LOTE',{days:30}),false);
  assert.equal(snapshot(d.getState()),before);
  assert.equal(d.getState().calendar.tick,day);
  assert.equal(d.getState().rng.seed,seed);
});

test('V3.0 P0: erro na serialização rejeita commit, mantém estado e cópia durável',async()=>{
  let throwExport=false;
  const wrapped={...core,exportSave(s){if(throwExport)throw Error('Arquivo excede limite seguro de exportação');return core.exportSave(s)}};
  const {d,create,localStorage}=harness(wrapped);
  await create();
  const old=snapshot(d.getState()),durable=localStorage.peek();
  throwExport=true;
  assert.equal(await d.commit('TEMPO.AVANCAR_DIA'),false);
  assert.equal(snapshot(d.getState()),old);
  assert.equal(localStorage.peek(),durable);
});

test('V3.0 P0: importação e restauração persistem candidata antes de substituir carreira',async()=>{
  const incoming="if(!await persistDurable(incoming.state))";
  assert.equal(app.split(incoming).length-1,2);
  const importBlock=take('  async function importFile(file){','  function launchAuto(){');
  const restoreBlock=take("    $('restore-prior-save-btn').addEventListener('click'","    $('payable-operating-unit').addEventListener");
  for(const block of [importBlock,restoreBlock]){
    const saveIndex=block.indexOf(incoming),activateIndex=block.indexOf('state=incoming.state');
    assert.ok(saveIndex>=0&&activateIndex>saveIndex,'Candidata importada só se ativa após persistência');
    assert.ok(block.includes('if(!await backupCurrent())return;'),'Backup anterior obrigatório antes de substituir');
  }
});

test('V3.0 P0: Windows hospedado é PASS parcial; release bloqueada até QA pessoal',async()=>{
  const evidence=JSON.parse(readFileSync('docs/V300_READINESS_EVIDENCE.json','utf8'));
  const qa=evidence.requirements.find(r=>r.id==='RG-12'),risk=evidence.requirements.find(r=>r.id==='RG-06');
  assert.equal(qa.status,'PARTIAL');
  assert.equal(risk.status,'PARTIAL');
  assert.match(qa.evidence,/42432588846/);
  assert.equal(evidence.checkpointStatus.find(r=>r.id==='3.0.0-08').status,'BLOCKED');
});

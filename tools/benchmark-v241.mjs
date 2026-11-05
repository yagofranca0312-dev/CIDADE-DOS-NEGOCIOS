import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {performance} from 'node:perf_hooks';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
const run=(state,type,payload={})=>{
  const r=Core.dispatch(state,{id:'bench-v241-'+(++seq),type,payload});
  if(!r.ok)throw Error(type+': '+r.error);
  return r.state;
};
function fixture(count){
  let state=run(null,'CARREIRA.CRIAR',{
    name:'Benchmark Fictício',companyName:'Rede de Teste',cityId:'CE-TIANGUA',seed:202611041});
  if(count===5){
    // Capital EXCLUSIVAMENTE na fixture: permite abrir cinco unidades; não altera regras do jogo.
    const amount=3000000;
    state.economy.ledger.push({id:'jnl-'+(++state.economy.journalSeq),
      date:state.calendar.date,memo:'Aporte adicional da fixture',kind:'CAPITAL',entries:[
        {account:'CASH',debit:amount,credit:0},{account:'CAPITAL',debit:0,credit:amount}]});
    Core.validate(state);
  }
  for(let i=0;i<count;i++){
    state=run(state,'EMPRESA.ABRIR',{sector:['mercado','padaria','roupas'][i%3],cityId:'CE-TIANGUA',lot:i+1});
    state=run(state,'FISCAL_OP.ATIVAR',{businessId:Core.activeBusiness(state).id,acceptSimulation:true});
  }
  state=run(state,'RH.CONTRATAR',{businessId:Core.businesses(state)[0].id,role:'atendimento',name:'Funcionário da fixture'});
  return state;
}
const scenarios=[{days:30,units:1},{days:30,units:5},{days:365,units:1},
  {days:365,units:5},{days:1825,units:1},{days:1825,units:5}];
const limit=Number(process.env.BENCH_MAX_DAYS||0);
for(const {days,units} of scenarios){
  if(limit>0&&days>limit)continue;
  let state=fixture(units),remaining=days;
  const started=performance.now(),initialHeap=process.memoryUsage().heapUsed;
  while(remaining>0){
    const segment=Math.min(30,remaining);
    state=run(state,'TEMPO.AVANCAR_LOTE',{days:segment});
    remaining-=segment;
  }
  const simulateMs=Math.round(performance.now()-started);
  const rep=Core.operatingPayablesReport(state),ops=Core.fiscalOperationsReport(state);
  const integrity=Core.reconciliationReport(state),finance=Core.balanceSheet(state);
  const raw=Core.exportSave(state),restored=Core.importSave(raw);
  if(!integrity.ok||!finance.balanced||restored.state.calendar.date!==state.calendar.date||rep.total<0||ops.units.length!==units)
    throw Error('Falha em integridade de cenário '+days+' dias / '+units+' unidades');
  const out={
    days,units,simulationMs:simulateMs,msPerDay:Number((simulateMs/days).toFixed(2)),
    saveBytes:Buffer.byteLength(raw),heapIncreaseMB:Number(((process.memoryUsage().heapUsed-initialHeap)/1048576).toFixed(2)),
    ledger:state.economy.ledger.length,events:state.audit.events.length,operatingPayablesCents:rep.total,
    fiscalOpenPeriods:ops.openPeriods,integrity:'PASS',schema:state.schemaVersion
  };
  console.log('BENCH_V241 '+JSON.stringify(out));
}

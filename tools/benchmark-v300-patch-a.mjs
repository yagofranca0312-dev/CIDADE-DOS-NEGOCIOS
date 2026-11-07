import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let n=0;
function run(s,type,payload={}){
 const r=C.dispatch(s,{type,payload,id:'benchmark-v300a-'+(++n)});
 if(!r.ok)throw Error(type+': '+r.error);
 return r.state;
}
function start(seed){
 let s=run(null,'CARREIRA.CRIAR',{name:'Gerente Simulado',companyName:'Empresa Fictícia de Teste',cityId:'CE-TIANGUA',seed});
 s=run(s,'EMPRESA.ABRIR',{sector:'mercado',lot:1,cityId:'CE-TIANGUA'});
 return run(s,'MUNDO.CONCORRENCIA_ATIVAR');
}
function advance(s,days){
 while(days){const n=Math.min(days,30);s=run(s,'TEMPO.AVANCAR_LOTE',{days:n});days-=n;}
 return s;
}
function buy(s,mode){
 const q=C.operationalBalanceReport(s,mode);
 if(!q.lines.length)return s;
 const actual=run(s,'ECONOMIA.COMPRAR_PLANO',{businessId:q.businessId,mode:q.mode,
   revision:q.revision,quoteId:q.quoteId});
 return actual;
}
function verify(s){
 C.validate(s);const rec=C.reconciliationReport(s),b=C.balanceSheet(s);
 if(!rec.ok||!b.balanced||b.difference!==0)throw Error('Contabilidade inconsistente: '+rec.errors.join(';'));
 const data=C.exportSave(s),loaded=C.importSave(data).state;
 if(JSON.stringify(s)!==JSON.stringify(loaded))throw Error('Backup tradicional não reimportou');
 if(data.length>=25000000)throw Error('Limite 25M ultrapassado');
 return data.length;
}
function simulate({days,mode,seed,restock=true,pricePct=100}){
 let s=start(seed),purchases=0;
 if(pricePct!==100){
  const b=C.activeBusiness(s),value=Math.round(b.products[0].priceCents*pricePct/100);
  s=run(s,'PRECO.DEFINIR',{productId:'base',cents:value});
 }
 while(s.calendar.tick<days){
  if(restock){
   const q=C.operationalBalanceReport(s,mode);
   if(q.lines.length){s=buy(s,mode);purchases++;}
  }
  s=advance(s,Math.min(7,days-s.calendar.tick));
 }
 const size=verify(s),quality=C.qualityReport(s,90),balance=C.overview(s),units=C.businesses(s);
 const result={days,mode,restock,pricePct,seed,units:units.length,orders:purchases,
  cashCents:balance.cash,revenueCents:balance.revenue,
  profitCents:balance.profit,liabilitiesCents:C.balanceSheet(s).liabilities,
  lostDemandPercent:quality.unmetDemandPercent,
  sales:units.reduce((n,b)=>n+b.totalSold,0),saveChars:size};
 console.log('BENCH_V300A '+JSON.stringify({...result,status:'PASS'}));
 return result;
}
const seed=300301;
const noStock=simulate({days:30,mode:'equilibrado',seed,restock:false});
const controlled=simulate({days:30,mode:'equilibrado',seed,restock:true});
if(noStock.revenueCents!==0||noStock.sales!==0)throw Error('Controle sem mercadoria gerou vendas fictícias');
if(controlled.revenueCents<=noStock.revenueCents||controlled.sales===0)
 throw Error('Compra confirmada não alterou abastecimento/vendas de forma legítima');
const series=[];
for(const mode of ['conservador','equilibrado','agressivo']){
 for(const days of [90,365]){
   const r=simulate({days,mode,seed,restock:true});
   series.push(r);
 }
}
const bankrupt=(()=>{
 let s=start(300399);
 s=run(s,'EMPRESA.ABRIR',{sector:'padaria',lot:2,cityId:'CE-TIANGUA'});
 s=run(s,'EMPRESA.ABRIR',{sector:'roupas',lot:3,cityId:'CE-TIANGUA'});
 const q=C.operationalBalanceReport(s,'conservador');
 if(q.lines.length||!q.flags.some(f=>f.id==='UNDERCAPITALIZED'))
  throw Error('A expansão sem capital de giro não recebeu alerta de risco');
 s=advance(s,90);const saveChars=verify(s),o=C.overview(s);
 console.log('BENCH_V300A '+JSON.stringify({days:90,mode:'expansao-descapitalizada',
  orders:0,units:C.businesses(s).length,cashCents:o.cash,profitCents:o.profit,
  revenueCents:o.revenue,saveChars,status:'PASS'}));
})();
const prices=[92,100,108].map(pricePct=>simulate({days:30,mode:'equilibrado',seed:300331,
 restock:true,pricePct}));
if(!prices.every(x=>x.saveChars<25000000))throw Error('Arquivo fora do orçamento');
console.log('BENCH_V300A_SUMMARY '+JSON.stringify({
 series,prices,riskScenario:'Expansão descapitalizada sinalizada e sem compra automática',
 stableSchema:C.SCHEMA_VERSION,mode:'gameplay verificável, sem subsídio de venda',status:'PASS'}));

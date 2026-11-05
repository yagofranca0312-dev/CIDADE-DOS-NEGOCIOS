import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {performance} from 'node:perf_hooks';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
const act=(state,type,payload={})=>{
 const r=Core.dispatch(state,{id:'bench-v260-'+(++seq),type,payload});
 if(!r.ok)throw Error(type+': '+r.error);
 return r.state;
};
function make(cityId='CE-TIANGUA',seed=20261105) {
 let s=act(null,'CARREIRA.CRIAR',{name:'Benchmark fictício',companyName:'Empresa de simulação',cityId,seed});
 return act(s,'MUNDO.CONCORRENCIA_ATIVAR');
}
function check(s,tag,ms){
 const integrity=Core.reconciliationReport(s),finance=Core.balanceSheet(s);
 if(!integrity.ok||!finance.balanced)throw Error(tag+': falta conciliação');
 const raw=Core.exportSave(s),copy=Core.importSave(raw).state;
 if(copy.schemaVersion!==9||JSON.stringify(copy)!==JSON.stringify(s))
  throw Error(tag+': roundtrip incompatível');
 const x={scenario:tag,days:s.calendar.tick,units:Core.businesses(s).length,
   simulationMs:Math.round(ms),saveBytes:Buffer.byteLength(raw),
   grossRevenueCents:Core.overview(s).revenue,cashCents:Core.overview(s).cash,
   competitorEvents:s.audit.events.filter(e=>e.type.startsWith('RIVAL.')).length,
   localEvents:s.world.rivalEconomy.events.length,
   rivals:s.world.rivalEconomy.rivals.length,
   status:'PASS'};
 console.log('BENCH_V260 '+JSON.stringify(x));return x;
}
const profiles=[
 {name:'conservador',city:'CE-TIANGUA',sector:'mercado',price:5200,target:100,seed:20261151},
 {name:'equilibrado',city:'CE-FORTALEZA',sector:'padaria',price:960,target:150,seed:20261152},
 {name:'agressivo',city:'SP-SAO-PAULO',sector:'roupas',price:7600,target:180,seed:20261153}
];
for(const profile of profiles){
 let s=make(profile.city,profile.seed);
 s=act(s,'EMPRESA.ABRIR',{sector:profile.sector,lot:1});
 s=act(s,'PRECO.DEFINIR',{productId:'base',cents:profile.price});
 const started=performance.now();
 for(let d=0;d<365;d++){
   const b=Core.activeBusiness(s),p=b.products[0];
   const pending=b.purchaseOrders.filter(o=>o.status==='PENDING')
     .reduce((n,o)=>n+o.items.filter(x=>x.productId==='base').reduce((sum,x)=>sum+x.quantity,0),0);
   const qty=Math.min(profile.target,200);
   if(p.stockUnits+pending<35&&Core.overview(s).cash>=qty*p.costCents){
     s=act(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:qty});
   }
   s=act(s,'TEMPO.AVANCAR_DIA');
 }
 check(s,profile.name+'-'+profile.city,performance.now()-started);
}
const long=Number(process.env.BENCH_V260_LONG??1);
if(long){
 let s=make('CE-TIANGUA',20261199);
 s.economy.ledger.push({id:'jnl-'+(++s.economy.journalSeq),date:s.calendar.date,
   memo:'Capital adicional somente da fixture de 5 unidades',kind:'CAPITAL',
   entries:[{account:'CASH',debit:3000000,credit:0},{account:'CAPITAL',debit:0,credit:3000000}]});
 Core.validate(s);
 for(let i=0;i<5;i++){
   s=act(s,'EMPRESA.ABRIR',{sector:['mercado','padaria','roupas'][i%3],cityId:'CE-TIANGUA',lot:i+1});
   s=act(s,'FISCAL_OP.ATIVAR',{businessId:Core.activeBusiness(s).id,acceptSimulation:true});
 }
 s=act(s,'RH.CONTRATAR',{businessId:Core.businesses(s)[0].id,role:'atendimento',name:'Funcionário da fixture'});
 const started=performance.now();
 for(let d=0;d<1825;d+=30)
   s=act(s,'TEMPO.AVANCAR_LOTE',{days:Math.min(30,1825-d)});
 check(s,'1825-dias-5-unidades-economia-viva',performance.now()-started);
}

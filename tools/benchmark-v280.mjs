import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function go(s,type,payload={}){
 const r=C.dispatch(s,{id:'bench-v280-'+(++seq),type,payload});
 if(!r.ok)throw Error(type+' @ '+(s?.calendar.date||'?')+': '+r.error);
 return r.state;
}
function step(s,days){
 while(days){const n=Math.min(days,30);s=go(s,'TEMPO.AVANCAR_LOTE',{days:n});days-=n;}
 return s;
}
function create(seed,sector='mercado',cityId='CE-TIANGUA'){
 let s=go(null,'CARREIRA.CRIAR',{name:'Cenário logístico fictício',companyName:'Rede Integrada Teste',cityId,seed});
 return go(s,'EMPRESA.ABRIR',{sector,cityId,lot:1});
}
function check(s,name){
 C.validate(s);
 const bal=C.balanceSheet(s),rec=C.reconciliationReport(s),lg=C.logisticsReport(s);
 if(!bal.balanced||bal.difference!==0||!rec.ok||Math.abs(bal.accounts.INTERNAL_CLEARING||0)!==0)
  throw Error(name+': razão/estoque/transito não conciliados: '+rec.errors.join('; '));
 const save=C.exportSave(s);
 if(save.length>=25000000)throw Error(name+': save ultrapassou o limite');
 const imported=C.importSave(save).state;
 if(JSON.stringify(imported)!==JSON.stringify(s))throw Error(name+': roundtrip de save divergente');
 const trips=lg.transfers;
 if(s.economy.ledger.some(j=>['LOGISTICS_DISPATCH','LOGISTICS_CLEAR','LOGISTICS_RECEIVE',
  'LOGISTICS_CD_DISPATCH','LOGISTICS_CD_CLEAR','LOGISTICS_CD_RECEIVE'].includes(j.kind)&&
  j.entries.some(e=>e.account==='REVENUE'||e.account==='COGS')))
  throw Error(name+': movimento interno gerou faturamento ou CMV');
 const result={scenario:name,tick:s.calendar.tick,units:C.businesses(s).length,
  depot:!!lg.depot,internalTransfers:trips.length,inTransit:trips.filter(t=>t.status==='PENDING').length,
  lossesCents:lg.metrics.waste||0,producedUnits:lg.metrics.produced||0,feesCents:lg.metrics.fees||0,
  inventoryCents:bal.accounts.INVENTORY,transitCents:bal.accounts.IN_TRANSIT,
  revenueCents:C.overview(s).revenue,cogsCents:C.overview(s).cogs,cashCents:C.overview(s).cash,
  saveBytes:save.length,status:'PASS'};
 console.log('BENCH_V280 '+JSON.stringify(result));return result;
}
const all=[];
{
 let s=create(28090,'mercado');
 const a=C.activeBusiness(s).id;
 s=go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-SOBRAL',lot:1});
 const b=C.activeBusiness(s).id;
 s=go(s,'EMPRESA.ABRIR',{sector:'padaria',cityId:'CE-FORTALEZA',lot:1});
 const bakery=C.activeBusiness(s).id;
 s=go(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});
 s=go(s,'LOGISTICA.CD.COMPRAR',{businessId:a,productId:'base',supplierId:'regional',quantity:80});
 s=go(s,'LOGISTICA.PRODUCAO.HABILITAR',{businessId:bakery});
 s=go(s,'LOGISTICA.INSUMO.COMPRAR',{businessId:bakery,supplierId:'regional',quantity:25});
 s=step(s,1);
 s=go(s,'LOGISTICA.PRODUZIR',{businessId:bakery,inputQuantity:25});
 s=go(s,'LOGISTICA.TRANSFERIR',{fromId:'CD-1',toId:b,sector:'mercado',productId:'base',quantity:30});
 s=step(s,90);
 all.push(check(s,'90-dias-3-unidades-CD-producao-perecibilidade'));
}
{
 let s=create(280365,'mercado');
 const cities=['CE-SOBRAL','CE-FORTALEZA','SP-SAO-PAULO','RJ-RIO-DE-JANEIRO'];
 s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:200});
 s=step(s,1);
 let cdBuilt=false,centralPurchase=false,centralMoved=false,directMoved=false,unlocked=0;
 const target=1832;
 while(s.calendar.tick<target){
  // Até atingir cinco lojas, a rede compra e cresce com caixa real. Depois do primeiro ano,
  // o horizonte prolongado mede persistência/obrigações sem criar milhares de compras artificiais.
  const activeOperations=s.calendar.tick<400||(C.businesses(s).length<5&&s.calendar.tick<900);
  let units=C.businesses(s);
  if(activeOperations){
  // Pagamentos, compras e expansões são reais no simulador; não há aporte adicional.
  for(const b of units){
   const base=b.products.find(p=>p.id==='base');
   const inTransit=b.purchaseOrders.filter(o=>o.status==='PENDING')
     .reduce((n,o)=>n+o.items.filter(x=>x.productId==='base').reduce((v,x)=>v+x.quantity,0),0);
   if(base.stockUnits+inTransit<65){
    const cash=C.overview(s).cash;
    const maxAffordable=Math.floor(Math.max(0,cash-120000)/base.costCents);
    const qty=Math.min(200,maxAffordable);
    if(qty>=25)s=go(s,'LOGISTICA.REABASTECER',{businessId:b.id,productId:'base',
      supplierId:'regional',quantity:qty});
   }
  }
  units=C.businesses(s);
  if(units.length<5){
   const nextCity=cities[units.length-1];
   if(C.overview(s).cash>=C.SECTORS.mercado.openCost+650000&&C.cityById(nextCity)){
    s=go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:nextCity,lot:1});unlocked++;
   }
  }
  units=C.businesses(s);
  if(!cdBuilt&&units.length>=2&&C.overview(s).cash>200000){
   s=go(s,'LOGISTICA.CD.ABRIR',{cityId:'CE-TIANGUA'});cdBuilt=true;
  }
  if(cdBuilt&&!centralPurchase&&C.overview(s).cash>=300000){
   s=go(s,'LOGISTICA.CD.COMPRAR',{businessId:units[0].id,productId:'base',
     supplierId:'regional',quantity:25});centralPurchase=true;
  }
  if(centralPurchase&&!centralMoved&&C.logisticsReport(s).depot.stock.some(x=>x.stockUnits>=12)&&units.length>=2&&C.overview(s).cash>=20000){
   s=go(s,'LOGISTICA.TRANSFERIR',{fromId:'CD-1',toId:units[1].id,
     sector:'mercado',productId:'base',quantity:12});centralMoved=true;
  }
  if(!directMoved&&units.length>=3&&units[0].products[0].stockUnits>=20&&C.overview(s).cash>=20000){
   s=go(s,'LOGISTICA.TRANSFERIR',{fromId:units[0].id,toId:units[2].id,productId:'base',quantity:10});
   directMoved=true;
  }
  }
  s=step(s,Math.min(activeOperations?7:30,target-s.calendar.tick));
  if(s.calendar.tick>=365&&!all.some(x=>x.scenario==='365-dias-rede-logistica'))all.push(check(s,'365-dias-rede-logistica'));
 }
 const last=check(s,'1832-dias-5-unidades-economia-integrada');
 if(last.units!==5)throw Error('Gate de cinco lojas não atingido: '+last.units+' lojas após '+last.tick+' dias; sem injeção artificial de capital.');
 if(!last.depot||last.internalTransfers<2)throw Error('Não houve cadeia CD+transferências suficientes.');
 all.push(last);
}
if(all.length!==3||all.some(x=>x.status!=='PASS'))throw Error('Gate final não aprovado.');

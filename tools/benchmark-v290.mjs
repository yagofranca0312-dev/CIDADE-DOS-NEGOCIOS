import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let sequence=0;
function go(s,type,payload={}){
 const r=C.dispatch(s,{id:'bench-qa-v29-'+(++sequence),type,payload});
 if(!r.ok)throw Error(type+': '+r.error);
 return r.state;
}
function start(seed=290){
 let s=go(null,'CARREIRA.CRIAR',{name:'Simulação QA',companyName:'Rede QA Integral',cityId:'CE-TIANGUA',seed});
 return go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:1});
}
function days(s,n){while(n){let p=Math.min(30,n);s=go(s,'TEMPO.AVANCAR_LOTE',{days:p});n-=p;}return s;}
function measure(s,label,minimumUnits){
 C.validate(s);
 const before=JSON.stringify(s);
 const quality=C.qualityReport(s,30),q90=C.qualityReport(s,90);
 const compact=C.exportSaveCompact(s),restored=C.importSave(compact).state;
 const save=C.exportSave(s),health=C.saveHealthReport(s);
 const sheet=C.balanceSheet(s),rec=C.reconciliationReport(s);
 if(JSON.stringify(s)!==before||JSON.stringify(restored)!==before)
   throw Error('QA alterou estado, RNG ou perdeu conteúdo de save: '+label);
 if(!sheet.balanced||!rec.ok)throw Error('Razão ou estoques divergem: '+label+' '+rec.errors.join(';'));
 if(C.businesses(s).length<minimumUnits)throw Error('Quantidade de lojas abaixo do esperado: '+label);
 if(compact.length>=save.length||compact.length>=25000000)throw Error('Compactação não reduziu limite de save: '+label);
 if(health.standardChars<health.compactChars||health.compactNearLimit)throw Error('Saúde de save insuficiente: '+label);
 if(quality.cashCents!==C.overview(s).cash||q90.units!==quality.units)
   throw Error('Resultado gerencial não corresponde ao estado do jogo: '+label);
 console.log('BENCH_V290 '+JSON.stringify({
  scenario:label,days:s.calendar.tick,units:C.businesses(s).length,
  cashCents:quality.cashCents,revenue30Cents:quality.salesCents,
  periodResult30Cents:quality.periodResultCents,freeCashCents:quality.freeCashCents,
  runwayDays:quality.fixedCostRunwayDays,unmetDemandPercent:quality.unmetDemandPercent,
  flags:quality.flags.map(x=>x.id),saveTraditionalChars:save.length,
  saveCompactChars:compact.length,saveReductionPercent:health.savedPercent,
  ledgerBalanced:sheet.balanced,reconciliationOK:rec.ok,status:'PASS'}));
 return s;
}
{
 let s=start(29090);
 s=go(s,'EMPRESA.ABRIR',{sector:'padaria',cityId:'CE-TIANGUA',lot:2});
 s=go(s,'EMPRESA.ABRIR',{sector:'roupas',cityId:'CE-TIANGUA',lot:3});
 // Capital inicial usado integralmente na abertura de 3 setores: sem injetar caixa ou forçar compra.
 // O cenário evidencia justamente ruptura e baixa liquidez, não simula vendas inexistentes.
 s=days(s,90);
 measure(s,'90-dias-3-setores-conciliados',3);
}
{
 let s=start(29365);
 s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:200});
 s=days(s,1);
 const targets=['CE-SOBRAL','CE-FORTALEZA','SP-SAO-PAULO','RJ-RIO-DE-JANEIRO'];
 while(s.calendar.tick<365){
  const units=C.businesses(s);
  for(const b of units){
   const p=b.products[0],pending=b.purchaseOrders.filter(o=>o.status==='PENDING').reduce((n,o)=>n+o.items.filter(x=>x.productId==='base').reduce((v,x)=>v+x.quantity,0),0);
   const cash=C.overview(s).cash;
   if(p.stockUnits+pending<55&&cash>300000){
    const quantity=Math.min(180,Math.floor((cash-150000)/p.costCents));
    if(quantity>=20){
      s=go(s,'EMPRESA.ATIVAR',{businessId:b.id});
      s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity});
    }
   }
  }
  if(C.businesses(s).length<5){
   const index=C.businesses(s).length-1,cityId=targets[index];
   if(C.overview(s).cash>C.SECTORS.mercado.openCost+450000)
    s=go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId,lot:1});
  }
  s=days(s,Math.min(7,365-s.calendar.tick));
 }
 measure(s,'365-dias-5-unidades-balanceamento-sem-regras-novas',5);
}

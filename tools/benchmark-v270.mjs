import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function go(s,type,payload={}){
 const r=C.dispatch(s,{id:'bench-v270-'+(++seq),type,payload});
 if(!r.ok)throw Error(type+': '+r.error);
 return r.state;
}
function build(seed,city='CE-TIANGUA',sector='mercado'){
 let s=go(null,'CARREIRA.CRIAR',{name:'Cenário financeiro fictício',companyName:'Companhia de Validação',cityId:city,seed});
 s=go(s,'EMPRESA.ABRIR',{cityId:city,sector,lot:1});
 s=go(s,'MUNDO.CONCORRENCIA_ATIVAR');
 s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:200});
 s=go(s,'TEMPO.AVANCAR_LOTE',{days:7});
 return s;
}
function advance(s,total){
 let remaining=total;
 while(remaining>0){
  const days=Math.min(30,remaining);
  s=go(s,'TEMPO.AVANCAR_LOTE',{days});
  remaining-=days;
 }
 return s;
}
function check(s,scenario){
 C.validate(s);
 const balance=C.balanceSheet(s),reconciliation=C.reconciliationReport(s),report=C.creditReport(s);
 if(!balance.balanced||balance.difference!==0||!reconciliation.ok)
   throw Error(scenario+': balanço ou estoque não conciliado '+JSON.stringify(reconciliation.errors));
 const saved=C.exportSave(s);
 if(saved.length>=25000000)throw Error(scenario+': save ultrapassou limite');
 const restored=C.importSave(saved).state;
 if(JSON.stringify(restored)!==JSON.stringify(s))throw Error(scenario+': roundtrip de save divergente');
 if(C.overview(s).revenue<0)throw Error(scenario+': receita negativa');
 if(balance.accounts.LOAN_PAYABLE!==report.principalOutstanding)throw Error(scenario+': saldo de empréstimos diverge');
 return {scenario,days:s.calendar.tick,units:C.businesses(s).length,loans:report.loans.length,
  supplierContracts:report.contracts.length,loanPrincipalCents:report.principalOutstanding,
  interestDueCents:report.interestOutstanding,contractFeesCents:report.contractFeesOutstanding,
  revenueCents:C.overview(s).revenue,cashCents:C.overview(s).cash,saveChars:saved.length,
  status:'PASS'};
}
const scenarios=[];
{
 let s=build(270101);
 const elig=C.creditReport(s).eligibility;
 if(!elig.eligible)throw Error('Não há elegibilidade após sete dias de vendas do teste');
 s=go(s,'CREDITO.CONTRATAR',{principalCents:Math.min(50000,elig.availableCents),termMonths:12});
 s=go(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:C.activeBusiness(s).id,supplierId:'regional',productId:'base',
  quantity:20,periodDays:14,cycles:12});
 s=advance(s,90);
 scenarios.push(check(s,'90-dias-credito-fornecedor-CE'));
}
{
 let s=build(270102,'CE-FORTALEZA');
 s=go(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:6});
 s=go(s,'EMPRESA.ABRIR',{sector:'roupas',cityId:'CE-TIANGUA',lot:1});
 s=go(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:C.businesses(s)[0].id,supplierId:'atacado',
  productId:'base',quantity:10,periodDays:30,cycles:12});
 s=advance(s,365);
 scenarios.push(check(s,'365-dias-rede-e-default-CE'));
}
{
 let s=build(270103,'SP-SAO-PAULO');
 s=go(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:24});
 // Inaugurações só podem acontecer com capital EFETIVAMENTE disponível.
 // O benchmark não injeta crédito fictício acima do limite para forçar cinco unidades.
 const areas=['CE-TIANGUA','CE-FORTALEZA','RJ-RIO-DE-JANEIRO','MG-BELO-HORIZONTE'];
 for(const cityId of areas){
  if(!C.cityById(cityId))continue;
  if(C.overview(s).cash<C.SECTORS.mercado.openCost+100000)break;
  s=go(s,'EMPRESA.ABRIR',{sector:'mercado',cityId,lot:1});
 }
 if(C.businesses(s).length<2)throw Error('Cenário prolongado precisa de pelo menos duas lojas reais');
 s=go(s,'CONTRATO.FORNECEDOR.ASSINAR',{businessId:C.businesses(s)[0].id,supplierId:'regional',
  productId:'base',quantity:10,periodDays:30,cycles:12});
 s=advance(s,1825);
 scenarios.push(check(s,'1825-dias-multiloja-credito-contratos'));
}
for(const x of scenarios)console.log('BENCH_V270 '+JSON.stringify(x));
if(scenarios.length!==3||scenarios.some(x=>x.status!=='PASS'))process.exitCode=1;

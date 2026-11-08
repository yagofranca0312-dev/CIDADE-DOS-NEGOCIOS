import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const load=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const Core=load('src/core/game.js');
const V13=load('tests/fixtures/core_v1_3_0.js');
const city=Core.CITIES.find(x=>x.name==='Tianguá').id;
let n=0;
const cmd=(engine,state,type,payload={})=>{
 const r=engine.dispatch(state,{id:`strat:${++n}`,type,payload});
 assert.equal(r.ok,true,`${type}: ${r.error}`);return r.state;
};
const reject=(state,type,payload)=>{
 const before=JSON.stringify(state);
 const r=Core.dispatch(state,{id:`strat:${++n}`,type,payload});
 assert.equal(r.ok,false);assert.equal(JSON.stringify(state),before);return r;
};
const make=(engine=Core,sector='mercado',seed=1234)=>{
 let s=cmd(engine,null,'CARREIRA.CRIAR',{name:'Yago',companyName:'Empresa Estratégica',cityId:city,seed});
 return cmd(engine,s,'EMPRESA.ABRIR',{sector,lot:2});
};
const advance=(s,days=1,engine=Core)=>cmd(engine,s,'TEMPO.AVANCAR_LOTE',{days});
const order=(s,qty=100,id='base')=>cmd(Core,s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:id,quantity:qty});

test('V1.4: nova carreira schema 5 e campanhas vazias, sem mudar contabilidade inicial',()=>{
 const s=make();assert.equal(Core.VERSION,'3.0.0');assert.equal(s.schemaVersion,9);
 assert.deepEqual(JSON.parse(JSON.stringify(s.world.business.promotions)),{});
 assert.equal(Core.overview(s).cash,2250000);
 Core.validate(s);
});
test('V1.4: desconto temporário aplica ao preço efetivo, sem alterar tabela',()=>{
 let s=make();const b=s.world.business,p=b.products[0];
 const full=p.priceCents;s=cmd(Core,s,'PROMO.DEFINIR',{productId:'base',percent:10,days:7});
 assert.equal(s.world.business.products[0].priceCents,full);
 assert.equal(Core.effectivePrice(s.world.business,s.world.business.products[0],s.calendar.date),Math.round(full*.9));
 assert.equal(s.world.business.promotions.base.until,'2026-11-07');
 assert.equal(Core.overview(s).cash,2250000);
});
test('V1.4: venda automática descontada contabiliza receita, CMV e caixa sem venda manual',()=>{
 let s=order(make(),100);s=advance(s);const p=s.world.business.products[0];
 s=cmd(Core,s,'PROMO.DEFINIR',{productId:'base',percent:15,days:2});
 const before=Core.overview(s);s=advance(s);const last=s.world.business.sales.at(-1),item=last.items.find(x=>x.productId==='base');
 assert.ok(item&&item.quantity>0);assert.equal(item.unitPrice,Math.round(p.priceCents*.85));
 assert.equal(item.revenue,item.quantity*item.unitPrice);
 assert.equal(Core.overview(s).cash-before.cash, last.total-Core.SECTORS.mercado.dailyCost);
 assert.equal(Core.overview(s).revenue-before.revenue,last.total);
 assert.equal(Core.overview(s).cogs-before.cogs,last.cogs);
 assert.ok(!s.world.business.sales.some(x=>x.kind==='BALCAO'));Core.validate(s);
});
test('V1.4: promoções de 2 dias expiram sem mutar histórico ou RNG em consulta',()=>{
 let s=order(make(),120);s=advance(s);s=cmd(Core,s,'PROMO.DEFINIR',{productId:'base',percent:5,days:2});
 const seed=s.rng.seed,rev=s.revision,copy=JSON.stringify(s);
 Core.effectivePrice(s.world.business,s.world.business.products[0],s.calendar.date);
 Core.strategyReport(s,7);
 assert.equal(s.rng.seed,seed);assert.equal(s.revision,rev);assert.equal(JSON.stringify(s),copy);
 s=advance(s,2);
 assert.equal(Core.effectivePrice(s.world.business,s.world.business.products[0],s.calendar.date),4900);
 assert.equal(s.world.business.promotions.base.percent,5);
 s=cmd(Core,s,'PROMO.DEFINIR',{productId:'base',percent:0,days:0});
 assert.equal(s.world.business.promotions.base,undefined);
});
test('V1.4: promoção rejeitada é transacional e comando idempotente',()=>{
 let s=make();
 for(const pair of [[20,5],[10,0],[0,1],[5,31],[-5,4]])reject(s,'PROMO.DEFINIR',{productId:'base',percent:pair[0],days:pair[1]});
 reject(s,'PROMO.DEFINIR',{productId:'inexistente',percent:5,days:7});
 s=cmd(Core,s,'PROMO.DEFINIR',{productId:'base',percent:10,days:7});
 const last=Object.keys(s.audit.commands).at(-1),same=Core.dispatch(s,{id:last,type:'PROMO.DEFINIR',payload:{productId:'base',percent:10,days:7}});
 assert.equal(same.status,'DUPLICATE');assert.equal(JSON.stringify(same.state),JSON.stringify(s));
});
test('V1.4: save 4 com pedido em trânsito migra 4→5 preservando caixa, custo e RNG',()=>{
 let old=make(V13);old=cmd(V13,old,'ESTOQUE.COMPRAR',{supplierId:'atacado',productId:'base',quantity:70});
 old=advance(old,1,V13);const report=V13.overview(old),raw=V13.exportSave(old);
 const result=Core.importSave(raw),s=result.state;
 assert.equal(result.migrated,true);assert.equal(s.schemaVersion,9);
 assert.equal(JSON.stringify(s.economy.ledger),JSON.stringify(old.economy.ledger));
 assert.equal(s.rng.seed,old.rng.seed);
 assert.equal(Core.overview(s).cash,report.cash);
 assert.equal(Core.overview(s).inTransit,report.inTransit);
 assert.equal(s.world.business.purchaseOrders[0].status,'PENDING');
 assert.deepEqual(JSON.parse(JSON.stringify(s.world.business.promotions)),{});
 s.world.business.promotions.base={percent:10,until:'2026-11-10'};
 Core.validate(s);
 assert.equal(Core.importSave(Core.exportSave(s)).migrated,false);
});
test('V1.4: projeção é pura e determinística em horizontes 7/30/90',()=>{
 let s=order(make(),100);s=advance(s);const before=JSON.stringify(s);
 for(const horizon of [7,30,90]){
  const a=Core.strategyReport(s,horizon),b=Core.strategyReport(s,horizon);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
  assert.equal(a.horizonDays,horizon);
  assert.ok(a.projectedRevenue>=0&&a.projectedCogs>=0&&a.projectedCash>=0);
  assert.equal(a.projectedProfit,a.projectedRevenue-a.projectedCogs-a.projectedFixed);
  assert.ok(a.projectedPayable>=Core.overview(s).payable);
 }
 assert.equal(JSON.stringify(s),before);
});
test('V1.4: estoque esgotado prevê receitas nulas, despesa fixa e falta de caixa',()=>{
 let s=make();const rep=Core.strategyReport(s,90);
 assert.equal(rep.projectedRevenue,0);assert.equal(rep.projectedCogs,0);
 assert.equal(rep.projectedFixed,90*Core.SECTORS.mercado.dailyCost);
 assert.equal(rep.projectedCash,Core.overview(s).cash-90*Core.SECTORS.mercado.dailyCost);
 assert.equal(rep.projectedProfit,-rep.projectedFixed);
 assert.ok(rep.estimatedLostUnits>0);
});
test('V1.4: projeção respeita pedidos já pagos, não debita duas vezes na entrega',()=>{
 let s=cmd(Core,make(),'ESTOQUE.COMPRAR',{productId:'base',supplierId:'atacado',quantity:100});
 const current=Core.overview(s),report=Core.strategyReport(s,7);
 assert.equal(current.inTransit,300800);assert.ok(report.projectedRevenue>0);
 assert.ok(report.projectedCash>=current.cash-7*Core.SECTORS.mercado.dailyCost);
 assert.equal(Core.overview(s).cash,current.cash);
 assert.equal(s.world.business.products[0].stockUnits,0);
});
test('V1.4: efetivo de promoção aumenta ou mantém demanda, projeção não altera tabela',()=>{
 let normal=order(make(),160);normal=advance(normal);
 const base=Core.strategyReport(normal,7),full=normal.world.business.products[0].priceCents;
 const promo=cmd(Core,normal,'PROMO.DEFINIR',{productId:'base',percent:10,days:7});
 const alternative=Core.strategyReport(promo,7);
 assert.equal(promo.world.business.products[0].priceCents,full);
 assert.notEqual(base.projectedRevenue,alternative.projectedRevenue);
});
test('V1.4: custos de operação separados de CMV e gastos de abertura no realizado',()=>{
 let s=order(make(),100);s=advance(s,2);
 const a=Core.strategyReport(s,7);assert.ok(a.recent.revenue>0);
 assert.ok(a.recent.cogs>0);assert.equal(a.recent.fixed,2*Core.SECTORS.mercado.dailyCost);
 assert.equal(a.recent.oneOff,Core.SECTORS.mercado.openCost);
 assert.equal(a.recent.operatingResult,a.recent.revenue-a.recent.cogs-a.recent.fixed-a.recent.oneOff);
});
test('V1.4: capital de giro considera estoque, trânsito, obrigações e caixa sem dupla contagem',()=>{
 let s=order(make(),30);
 const o=Core.overview(s),a=Core.strategyReport(s,7);
 assert.equal(a.workingCapital,o.cash+o.inventoryValue+o.inTransit+o.receivables-o.payable);
 assert.equal(a.dailyFixed,Core.SECTORS.mercado.dailyCost);
 assert.ok(a.breakEvenUnits>0);
});
test('V1.4: ponto de equilíbrio sinaliza margens negativas, sem inventar unidades lucrativas',()=>{
 let s=make();for(const p of s.world.business.products){
  s=cmd(Core,s,'PRECO.DEFINIR',{productId:p.id,cents:100});
 }
 const report=Core.strategyReport(s,7);assert.equal(report.breakEvenUnits,null);
});
test('V1.4: todos os setores suportam 90/180/365 dias, inclusive crise de estoque e caixa',()=>{
 for(const sector of ['mercado','padaria','roupas']){
  let s=make(Core,sector,20261102),start=s.calendar.date;
  for(const days of [90,180,365]){
   let step=days-(s.calendar.tick);
   while(step>0){const part=Math.min(30,step);s=advance(s,part);step-=part;}
   assert.equal(s.calendar.tick,days);Core.validate(s);
   const o=Core.overview(s);
   assert.ok(o.cash>=0&&o.inventoryValue>=0&&o.payable>=0);
   assert.equal(o.revenue,0);
   assert.equal(o.expenses,Core.SECTORS[sector].openCost+days*Core.SECTORS[sector].dailyCost);
   const a=Core.strategyReport(s,30);assert.ok(a.estimatedLostUnits>0);
  }
 }
});
test('V1.4: estratégia e reabastecimento coexistem e mantêm estoque/ledger conciliados em 180 dias',()=>{
 let s=make(Core,'mercado',321);
 for(let d=0;d<180;d++){
  if(d%10===0){
   for(const id of ['base','extra-1','extra-2']){
    const x=Core.dispatch(s,{type:'ESTOQUE.COMPRAR',id:`batch:${++n}`,payload:{productId:id,supplierId:'regional',quantity:60}});
    if(x.ok)s=x.state;
   }
  }
  if(d%30===0)s=cmd(Core,s,'PROMO.DEFINIR',{productId:'base',percent:5,days:7});
  s=advance(s,1);
 }
 assert.equal(s.calendar.tick,180);Core.validate(s);
 assert.ok(Core.overview(s).revenue>0);
 assert.ok(s.world.business.sales.every(x=>x.kind==='SIMULACAO_DIARIA'));
 const exported=Core.exportSave(s),restored=Core.importSave(exported);
 assert.equal(restored.migrated,false);assert.equal(JSON.stringify(restored.state),JSON.stringify(s));
});
test('V1.4: UI inclui estratégias, cenários e mensagens sem prometer impostos ou fluxo garantido',()=>{
 const ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8')),html=readFileSync('src/shell/index.template.html','utf8');
 for(const term of ['id="promo-product"','id="promo-days"','id="strategy-horizon"','id="strategy-metrics"','id="strategy-cost-rows"'])assert.ok(html.includes(term),term);
 assert.ok(ui.includes("'PROMO.DEFINIR'"));assert.ok(ui.includes('renderStrategy()'));
 assert.ok(html.includes('cenários hipotéticos'));
 assert.ok(html.includes('não realizam novas compras'));
});

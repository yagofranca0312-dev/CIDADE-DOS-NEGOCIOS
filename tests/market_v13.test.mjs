import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const load=p=>runInNewContext(readFileSync(p,'utf8')+'\nCidadeCore',{});
const Core=load('src/core/game.js');
const Old=load('tests/fixtures/core_v1_2_1.js');
const Oldest=load('tests/fixtures/core_v1_0_1.js');
const oldSales=load('tests/fixtures/core_v1_2_0.js');
const city=Core.CITIES.find(x=>x.name==='Tianguá').id;
let seq=0;
const command=(engine,state,type,payload={})=>{
  const r=engine.dispatch(state,{type,id:`v13:${++seq}`,payload});
  assert.equal(r.ok,true,r.error);
  return r.state;
};
const make=(engine=Core)=>{
  let s=command(engine,null,'CARREIRA.CRIAR',{name:'Teste',companyName:'Loja de teste',cityId:city,seed:20261101});
  return command(engine,s,'EMPRESA.ABRIR',{sector:'mercado',lot:4});
};
const order=(s,quantity=20,supplierId='regional',productId='base')=>command(Core,s,'ESTOQUE.COMPRAR',{quantity,supplierId,productId});
const advance=(s,days=1)=>command(Core,s,days===1?'TEMPO.AVANCAR_DIA':'TEMPO.AVANCAR_LOTE',days===1?{}:{days});
const demand=s=>s.audit.events.filter(e=>e.type==='DEMANDA.SIMULADA').at(-1).data;
const json=x=>JSON.stringify(x);

test('V1.3: nova carreira inicia com schema 4, 3 SKUs, preços e políticas default',()=>{
 const s=make();assert.equal(s.schemaVersion,8);assert.equal(Core.VERSION,'1.7.0-rc.1');
 assert.equal(s.world.business.products.length,3);
 for(const p of s.world.business.products){assert.equal(p.stockValueCents,0);assert.ok(p.targetStock>=p.reorderPoint);}
 assert.equal(Core.overview(s).inTransit,0);Core.validate(s);
});
test('V1.3: pedido regional pago fica em trânsito; entra em estoque ao final de 1 dia',()=>{
 let s=order(make(),20);const b=s.world.business,o=b.purchaseOrders.at(-1);
 assert.equal(o.status,'PENDING');assert.equal(o.dueDate,'2026-11-02');
 assert.equal(b.stockUnits,0);assert.equal(Core.overview(s).inventoryValue,0);
 assert.equal(Core.overview(s).inTransit,64000);
 assert.equal(Core.overview(s).cash,3000000-750000-64000);
 s=advance(s);
 assert.equal(s.calendar.date,'2026-11-02');assert.equal(s.world.business.stockUnits,20);
 assert.equal(s.world.business.purchaseOrders.at(-1).status,'RECEIVED');
 assert.equal(s.world.business.purchaseOrders.at(-1).receivedAt,'2026-11-02');
 assert.equal(Core.overview(s).inTransit,0);assert.equal(Core.overview(s).inventoryValue,64000);
 assert.equal(Core.overview(s).revenue,0); // O dia 01 teve demanda perdida antes da entrega.
 Core.validate(s);
});
test('V1.3: demanda existe sem estoque e faturamento perdido é apenas potencial',()=>{
 const s=advance(make()),d=demand(s);
 assert.equal(d.withoutStock,3);assert.equal(d.items.length,3);
 assert.ok(d.estimated>0);assert.equal(d.fulfilled,0);assert.equal(d.unmet,d.estimated);
 assert.ok(d.lostPotentialCents>0);assert.equal(Core.overview(s).revenue,0);
 assert.equal(d.lostPotentialCents,d.items.reduce((n,x)=>n+x.lostPotentialCents,0));
 for(const p of d.items)assert.equal(p.unmet,p.estimated);
 Core.validate(s);
});
test('V1.3: atacado aplica 94% e recebe após 3 dias corridos de jogo',()=>{
 let s=order(make(),60,'atacado');let o=s.world.business.purchaseOrders.at(-1);
 assert.equal(o.items[0].unitCost,3008);assert.equal(o.total,180480);
 assert.equal(o.dueDate,'2026-11-04');assert.equal(Core.overview(s).inTransit,180480);
 s=advance(s,2);assert.equal(s.calendar.date,'2026-11-03');assert.equal(s.world.business.stockUnits,0);
 s=advance(s);assert.equal(s.calendar.date,'2026-11-04');assert.equal(s.world.business.stockUnits,60);
 assert.equal(Core.overview(s).inventoryValue,180480);assert.equal(Core.overview(s).inTransit,0);
 Core.validate(s);
});
test('V1.3: não realiza venda adicional fora da demanda; CMV reduz custo real do estoque recebido',()=>{
 let s=order(make(),40,'atacado');s=advance(s,3);
 const before=Core.overview(s).inventoryValue;
 s=advance(s);const sale=s.world.business.sales.at(-1);
 assert.equal(sale.kind,'SIMULACAO_DIARIA');assert.ok(sale.items.length>=1);
 assert.equal(sale.cogs,before-Core.overview(s).inventoryValue);
 assert.equal(sale.total,Core.overview(s).revenue);
 assert.ok(sale.cogs>0);Core.validate(s);
});
test('V1.3: custo médio ponderado de lotes regionais e atacadistas concilia estoque/CMV',()=>{
 let s=order(make(),40,'regional');s=order(s,40,'atacado');
 s=advance(s); // somente regional chega hoje
 const first=s.world.business.products[0];assert.equal(first.stockValueCents,40*3200);
 s=advance(s,2); // Atacado chega em 04/11
 const p=s.world.business.products[0];assert.ok(p.stockUnits>0);
 assert.equal(Core.overview(s).inventoryValue,s.world.business.products.reduce((n,x)=>n+x.stockValueCents,0));
 assert.equal(Core.overview(s).inTransit,0);
 const snapshot=Core.overview(s);
 s=advance(s);
 const latest=Core.overview(s);assert.equal(snapshot.inventoryValue-latest.inventoryValue,latest.cogs-snapshot.cogs);
 Core.validate(s);
});
test('V1.3: limite do fornecedor é diário e por SKU, não só por operação',()=>{
 let s=order(make(),150,'regional');const before=json(s);
 const r=Core.dispatch(s,{type:'ESTOQUE.COMPRAR',id:'reject:capacity',payload:{supplierId:'regional',productId:'base',quantity:60}});
 assert.equal(r.ok,false);assert.match(r.error,/Capacidade diária/);assert.equal(json(s),before);
 s=order(s,50,'regional');assert.equal(s.world.business.purchaseOrders.length,2);Core.validate(s);
});
test('V1.3: fornecedor e pedidos pendentes são considerados na capacidade total',()=>{
 let s=order(make(),200,'regional');const first=Core.inventoryReport(s)[0];
 assert.equal(first.inTransit,200);assert.equal(first.stock,0);assert.equal(first.alert,false);
 assert.equal(first.recommended,0);
 // Produtos diferentes compartilham limite total, mas não o limite diário por SKU.
 s=order(s,120,'regional','extra-1');Core.validate(s);
 assert.equal(Core.inventoryReport(s)[1].inTransit,120);
});
test('V1.3: rejeição por caixa e limites deixa estado/RNG/contabilidade intactos',()=>{
 const s=make(),snapshot=json(s);
 for(const payload of [
   {supplierId:'regional',productId:'base',quantity:201},
   {supplierId:'atacado',productId:'base',quantity:501},
   {supplierId:'regional',productId:'inexistente',quantity:5},
   {supplierId:'inexistente',productId:'base',quantity:5},
 ]){
   const r=Core.dispatch(s,{type:'ESTOQUE.COMPRAR',id:`reject:${++seq}`,payload});
   assert.equal(r.ok,false);assert.equal(json(s),snapshot);
 }
});
test('V1.3: política de reposição configurável, sem comprar automaticamente',()=>{
 let s=make();s=command(Core,s,'ESTOQUE.POLITICA_DEFINIR',{productId:'base',reorderPoint:10,targetStock:60});
 const report=Core.inventoryReport(s)[0];
 assert.equal(report.alert,true);assert.equal(report.recommended,60);
 assert.equal(s.world.business.purchaseOrders.length,0);
 s=advance(s,3);assert.equal(s.world.business.purchaseOrders.length,0);
 assert.equal(Core.inventoryReport(s)[0].sampleDays,3);
 Core.validate(s);
});
test('V1.3: política inválida rejeitada sem criar evento',()=>{
 const s=make(),base=json(s);
 for(const payload of [
   {productId:'base',reorderPoint:-1,targetStock:10},
   {productId:'base',reorderPoint:80,targetStock:40},
   {productId:'base',reorderPoint:1,targetStock:100001},
   {productId:'inexistente',reorderPoint:1,targetStock:10},
 ]){
   const result=Core.dispatch(s,{type:'ESTOQUE.POLITICA_DEFINIR',id:`wrong:${++seq}`,payload});
   assert.equal(result.ok,false);assert.equal(json(s),base);
 }
});
test('V1.3: previsão usa últimos 7 eventos e consulta não altera save',()=>{
 let s=advance(make(),10);const snapshot=json(s);
 const rows=Core.inventoryReport(s);for(const r of rows){
   assert.equal(r.sampleDays,7);assert.ok(r.forecastDaily>=0);
   assert.ok(r.recommended>=0);assert.equal(r.stock,0);
 }
 Core.inventoryReport(s);Core.diagnostics(s);assert.equal(json(s),snapshot);
});
test('V1.3: relatório financeiro distingue caixa, estoque e mercadorias em trânsito',()=>{
 let s=order(make(),50,'atacado');let rep=Core.financialReport(s,'day','2026-11-01');
 assert.equal(rep.closingInTransit,150400);assert.equal(rep.closingInventory,0);
 assert.equal(rep.revenue,0);assert.equal(rep.cogs,0);
 s=advance(s,3);const all=Core.financialReport(s,'all');
 assert.equal(all.closingInTransit,0);assert.equal(all.closingInventory,150400);
 assert.equal(all.profit,Core.overview(s).profit);
});
test('V1.3: seed e sequência idênticos reproduzem demanda, custos e chegada',()=>{
 const scenario=()=>{
   let s=make();s=order(s,60,'atacado');s=order(s,50,'regional','extra-1');
   s=advance(s,17);return s;
 };
 const a=scenario(),b=scenario();
 assert.equal(json(a.world.business),json(b.world.business));
 assert.equal(json(a.economy),json(b.economy));
 assert.equal(a.rng.seed,b.rng.seed);Core.validate(a);
});
test('V1.3: importação schema 3 mantém caixa, RNG, vendas manuais históricas e livros',()=>{
 let original=make(oldSales);
 original=command(oldSales,original,'ESTOQUE.COMPRAR',{quantity:80});
 original=command(oldSales,original,'VENDA.REGISTRAR',{items:[{productId:'base',quantity:5}]});
 const originalLedger=json(original.economy.ledger),oldRng=original.rng.seed;
 const imported=Core.importSave(oldSales.exportSave(original));
 assert.equal(imported.migrated,true);const s=imported.state;
 assert.equal(s.schemaVersion,8);assert.equal(s.rng.seed,oldRng);
 assert.equal(json(s.economy.ledger),originalLedger);
 assert.equal(s.world.business.sales[0].kind,'BALCAO');
 assert.equal(s.world.business.purchaseOrders[0].status,'RECEIVED');
 assert.equal(Core.overview(s).inventoryValue,oldSales.overview(original).inventoryValue);
 assert.equal(Core.overview(s).cash,oldSales.overview(original).cash);
 assert.equal(Core.overview(s).inTransit,0);Core.validate(s);
 const after=advance(s);assert.equal(after.world.business.sales[0].kind,'BALCAO');Core.validate(after);
});
test('V1.3: importação schema 2 preserva estoque e histórico contábil',()=>{
 let old=make(Oldest);old=command(Oldest,old,'ESTOQUE.COMPRAR',{quantity:25});old=command(Oldest,old,'TEMPO.AVANCAR_DIA');
 const v=Core.importSave(Oldest.exportSave(old));assert.equal(v.migrated,true);
 assert.equal(v.state.schemaVersion,8);
 assert.equal(v.state.world.business.products[0].stockUnits,old.world.business.stockUnits);
 assert.equal(json(v.state.economy.ledger),json(old.economy.ledger));
 assert.equal(Core.overview(v.state).inventoryValue,Oldest.overview(old).inventoryValue);
 assert.equal(v.state.rng.seed,old.rng.seed);Core.validate(v.state);
});
test('V1.3: saves com pedido pendente são portáteis e entrega não duplica',()=>{
 let s=order(make(),80,'atacado');s=advance(s);
 const restored=Core.importSave(Core.exportSave(s));assert.equal(restored.migrated,false);
 assert.equal(json(restored.state),json(s));
 let done=advance(restored.state,3);
 assert.equal(done.world.business.purchaseOrders[0].status,'RECEIVED');
 assert.equal(done.audit.events.filter(e=>e.type==='COMPRA.RECEBIDA').length,1);
 Core.validate(done);
});
test('V1.3: venda manual continua bloqueada; diagnóstico não altera estado',()=>{
 const s=make(),before=json(s);
 const r=Core.dispatch(s,{type:'VENDA.REGISTRAR',id:'manual:blocked',payload:{items:[{productId:'base',quantity:1}]}});
 assert.equal(r.ok,false);assert.equal(json(s),before);
 assert.equal(Core.diagnostics(s).status,'PASS (integridade estrutural e contábil)');
});
test('V1.3: UI contém prazos, alerta, metas e vendas perdidas sem checkout manual',()=>{
 const template=readFileSync('src/shell/index.template.html','utf8'),ui=readFileSync('src/ui/app.js','utf8');
 for(const id of ['supplier-terms','inventory-planner-rows','policy-product','policy-reorder','policy-target','demand-lost-potential'])assert.ok(template.includes(`id="${id}"`),id);
 assert.doesNotMatch(template,/id="cart-checkout"/);
 assert.match(ui,/renderInventoryPlanner/);
 assert.match(ui,/ESTOQUE.POLITICA_DEFINIR/);
 assert.match(ui,/Core.inventoryReport/);
});

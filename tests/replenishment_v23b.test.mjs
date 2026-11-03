import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const src=readFileSync('src/ui/restock-views.part.js','utf8');
const helpers=runInNewContext(src.split('function renderRestockSummary()')[0]+'\n({restockSupplierLimit,restockRoom,prepareRestockPlan,reviewRestockPlan,adjustRestockToBudget})',{});
const json=x=>JSON.parse(JSON.stringify(x));
let sequence=0;
const send=(s,type,payload={})=>core.dispatch(s,{type,payload,id:'v23b:test:'+(++sequence)});
function fresh(){
  const city=core.CITIES.find(x=>x.name==='Tianguá').id;
  const start=send(null,'CARREIRA.CRIAR',{cityId:city,name:'Teste B',companyName:'Rede B',seed:20261103});
  assert.equal(start.ok,true,start.error);
  const opened=send(start.state,'EMPRESA.ABRIR',{cityId:city,lot:1,sector:'mercado'});
  assert.equal(opened.ok,true,opened.error);
  return opened.state;
}
function make(mode='ideal',supplierId='regional'){
  const state=fresh(),unit=core.activeBusiness(state),rows=core.inventoryReport(state);
  const supplier=core.SUPPLIERS.find(x=>x.id===supplierId);
  const draft=helpers.prepareRestockPlan(unit,rows,supplier,mode,state.calendar.date,state.revision);
  return {state,unit,rows,supplier,draft};
}
test('V2.3-B: relatório sugere metas sem ignorar estoque em trânsito',()=>{
  let {state,unit,rows,supplier,draft}=make();
  assert.equal(draft.lines.length,unit.products.length);
  for(const line of draft.lines)assert.ok(line.quantity>=0&&line.quantity<=rows.find(x=>x.id===line.productId).recommended);
  const first=rows[0];assert.ok(first.recommended>0);
  const a=send(state,'COMPRAS.REGISTRAR',{supplierId:supplier.id,items:[{productId:first.id,quantity:2}]});
  assert.equal(a.ok,true,a.error);
  const pending=core.inventoryReport(a.state).find(x=>x.id===first.id);
  assert.equal(pending.inTransit,2);
  assert.equal(pending.recommended,Math.max(0,pending.targetStock-pending.stock-2));
});
test('V2.3-B: modo críticos filtra e modo ideal inclui produtos com meta pendente',()=>{
  const {state,unit,rows,supplier}=make();
  const ideal=helpers.prepareRestockPlan(unit,rows,supplier,'ideal',state.calendar.date,state.revision);
  const critical=helpers.prepareRestockPlan(unit,rows,supplier,'criticos',state.calendar.date,state.revision);
  assert.ok(ideal.lines.some(x=>x.quantity>0));
  for(const l of critical.lines)if(!rows.find(x=>x.id===l.productId).alert)assert.equal(l.quantity,0);
  assert.equal(critical.businessId,unit.id);assert.equal(critical.revision,state.revision);
});
test('V2.3-B: proposta confirma compra de vários SKUs com um único despacho atômico',()=>{
  const {state,unit,rows,supplier}=make('ideal','regional');
  const draft={businessId:unit.id,revision:state.revision,supplierId:supplier.id,mode:'personalizado',
    lines:rows.map((r,i)=>({productId:r.id,selected:i<2,quantity:i<2?2:0}))};
  const before=core.overview(state).cash;
  const result=helpers.reviewRestockPlan(draft,unit,rows,supplier,before,state.calendar.date,state.revision);
  assert.equal(result.valid,true,result.errors.join('; '));assert.equal(result.items.length,2);
  assert.ok(result.total>0);
  const next=send(state,'COMPRAS.REGISTRAR',{supplierId:supplier.id,items:result.items.map(x=>({productId:x.productId,quantity:x.quantity}))});
  assert.equal(next.ok,true,next.error);
  assert.equal(core.overview(next.state).cash,before-result.total);
  const order=core.activeBusiness(next.state).purchaseOrders.at(-1);
  assert.equal(order.items.length,2);assert.equal(order.status,'PENDING');
  assert.equal(order.total,result.total);
  assert.equal(core.overview(next.state).inTransit,result.total);
  const paid=send(next.state,'TEMPO.AVANCAR_DIA');
  assert.equal(paid.ok,true,paid.error);
  assert.equal(core.activeBusiness(paid.state).purchaseOrders.at(-1).status,'RECEIVED');
});
test('V2.3-B: proposta acima do caixa é bloqueada, sem compra parcial implícita',()=>{
  const {state,unit,rows,supplier,draft}=make();
  const review=helpers.reviewRestockPlan(draft,unit,rows,supplier,1,state.calendar.date,state.revision);
  assert.equal(review.valid,false);assert.match(review.errors.join(' '),/Caixa insuficiente/);
  const before=core.exportSave(state);
  const budget=helpers.adjustRestockToBudget(draft,unit,rows,supplier,1,state.calendar.date);
  const after=helpers.reviewRestockPlan(budget,unit,rows,supplier,1,state.calendar.date,state.revision);
  assert.equal(after.total,0);assert.equal(after.valid,false);
  assert.equal(core.exportSave(state),before,'Preparar/ajustar não altera a carreira');
});
test('V2.3-B: ajuste ao orçamento prioriza menor cobertura e respeita limite total',()=>{
  const {state,unit,rows,supplier,draft}=make();
  for(const line of draft.lines){line.selected=true;line.quantity=20;}
  const cost=unit.products.reduce((n,p)=>n+Math.round(p.costCents*supplier.priceFactor/100)*20,0);
  const budget=Math.floor(cost/3);
  helpers.adjustRestockToBudget(draft,unit,rows,supplier,budget,state.calendar.date);
  const result=helpers.reviewRestockPlan(draft,unit,rows,supplier,budget,state.calendar.date,state.revision);
  assert.ok(result.total<=budget);assert.ok(result.valid,result.errors.join('; '));
  const first=rows.slice().sort((a,b)=>a.coverageDays-b.coverageDays||a.id.localeCompare(b.id))[0];
  assert.ok(draft.lines.find(x=>x.productId===first.id).quantity>0);
});
test('V2.3-B: limitações do fornecedor, revisão stale e capacidade física são respeitadas',()=>{
  const {state,unit,rows,supplier,draft}=make();
  const tooMany=draft.lines.find(x=>x.selected);
  tooMany.quantity=supplier.maxDailyPerSku+1;
  const invalid=helpers.reviewRestockPlan(draft,unit,rows,supplier,Number.MAX_SAFE_INTEGER,state.calendar.date,state.revision);
  assert.equal(invalid.valid,false);assert.match(invalid.errors.join(' '),/Limite/);
  const stale=helpers.reviewRestockPlan(draft,unit,rows,supplier,Number.MAX_SAFE_INTEGER,state.calendar.date,state.revision+1);
  assert.match(stale.errors.join(' '),/desatualizada/);
  const fake={...unit,stockUnits:99998,purchaseOrders:unit.purchaseOrders};
  const short=helpers.prepareRestockPlan(fake,rows,supplier,'ideal',state.calendar.date,state.revision);
  assert.ok(short.lines.reduce((n,l)=>n+l.quantity,0)<=2);
});
test('V2.3-B: compra inválida do motor mantém razão, estoque, caixa e RNG intactos',()=>{
  const {state,rows}=make();
  const before=core.exportSave(state);
  const invalid=send(state,'COMPRAS.REGISTRAR',{supplierId:'regional',items:[{productId:rows[0].id,quantity:9999},{productId:rows[1].id,quantity:1}]});
  assert.equal(invalid.ok,false);assert.equal(core.exportSave(state),before);
  const duplicate=send(state,'COMPRAS.REGISTRAR',{supplierId:'regional',items:[{productId:rows[0].id,quantity:1},{productId:rows[0].id,quantity:1}]});
  assert.equal(duplicate.ok,false);assert.equal(core.exportSave(state),before);
});
test('V2.3-B: UI existe, compra exige confirmação e nenhum dado de jogo é persistido pela proposta',()=>{
  const tpl=readFileSync('src/shell/index.template.html','utf8');
  const app=readFileSync('src/ui/app.js','utf8');
  const html=readFileSync('index.html','utf8');
  for(const id of ['restock-mode','restock-supplier','restock-prepare','restock-compare','restock-alerts','restock-order-rows','restock-preview','restock-adjust-budget','restock-confirm','restock-cancel','restock-cheapest','restock-fastest'])
    assert.ok(tpl.includes('id="'+id+'"'),id);
  assert.match(src,/confirm\(message\)/);assert.match(src,/commit\('COMPRAS.REGISTRAR'/);
  assert.match(app,/restockDraft=null;state=result.state/);
  assert.doesNotMatch(src,/localStorage|saveLocal|TEMPO\.AVANCAR_DIA/);
  assert.match(tpl,/data-section-go="mercado:compras"/);
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][1]));
});

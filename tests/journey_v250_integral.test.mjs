import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const C=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
let seq=0;
function go(s,type,payload={}){
 const r=C.dispatch(s,{id:'journey-integral-'+(++seq),type,payload});
 assert.equal(r.ok,true,r.error||type);return r.state;
}
function career(seed=4001){
 let s=go(null,'CARREIRA.CRIAR',{name:'Jogador fictício',companyName:'Rede teste',cityId:'CE-TIANGUA',seed});
 s=go(s,'MUNDO.CONCORRENCIA_ATIVAR');
 return go(s,'EMPRESA.ABRIR',{sector:'mercado',lot:1});
}
function advance(s,days){
 while(days>0){const n=Math.min(days,30);s=go(s,'TEMPO.AVANCAR_LOTE',{days:n});days-=n;}
 return s;
}
test('Jornada: oito conquistas derivadas e desbloqueios não geram caixa',()=>{
 let s=career(),before=JSON.stringify(s);
 const x=C.progressionReport(s);
 assert.equal(x.achievements.length,8);
 assert.equal(x.unlocks.length,3);
 assert.ok(x.achievements.every(a=>typeof a.completed==='boolean'));
 assert.ok(x.unlocks.some(a=>a.id==='dilemas'&&a.unlocked));
 assert.equal(C.progressionReport(s).total,12);
 assert.equal(JSON.stringify(s),before);
 assert.equal(s.economy.ledger.filter(j=>j.kind==='PROGRESSION_REWARD').length,0);
});
test('Jornada: tutorial contextual guia abertura, compra, entrega, venda e estabilização',()=>{
 let s=go(null,'CARREIRA.CRIAR',{name:'Jogador',companyName:'Empresinha',cityId:'CE-TIANGUA',seed:402});
 assert.equal(C.journeyGuide(s).stage,'abrir');
 s=go(s,'EMPRESA.ABRIR',{sector:'mercado',lot:1});
 assert.equal(C.journeyGuide(s).stage,'comprar');
 s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:150});
 assert.equal(C.journeyGuide(s).stage,'vender');
 s=advance(s,2);
 assert.equal(C.journeyGuide(s).stage,'concorrencia');
 s=go(s,'MUNDO.CONCORRENCIA_ATIVAR');
 assert.equal(C.journeyGuide(s).stage,'estabilizar');
});
test('Jornada: cada um dos seis dilemas é uma decisão real e registrada',()=>{
 let s=career(403);
 const selections=[
  ['caixa-estoque','abastecer'],
  ['preco-volume','promover'],
  ['equipe-liquidez','contratar'],
  ['expansao-reserva','guardar'],
  ['fornecedor-prazo','barato'],
  ['passivo-operacao','operar']
 ];
 const before=C.overview(s).cash;
 for(const [dilemmaId,choice] of selections){
  const decision=C.dilemmaReport(s).find(x=>x.id===dilemmaId);
  assert.ok(decision.choices.find(x=>x.id===choice)?.available,dilemmaId);
  s=go(s,'DILEMA.ESCOLHER',{dilemmaId,choice});
 }
 const decisions=s.audit.events.filter(e=>e.type==='DILEMA.DECIDIDO');
 assert.equal(decisions.length,6);
 assert.equal(new Set(decisions.map(e=>e.data.dilemmaId)).size,6);
 assert.ok(C.overview(s).cash<before);
 assert.ok(s.world.business.promotions.base.percent===10);
 assert.ok(C.rhEmployees(s).length===1);
 assert.ok(s.world.business.purchaseOrders.length>=3);
 C.validate(s);
});
test('Jornada: escolhas alternativas preservam orçamento e expansão gera despesa verdadeira',()=>{
 let s=career(404),cash=C.overview(s).cash;
 s=go(s,'DILEMA.ESCOLHER',{dilemmaId:'caixa-estoque',choice:'reservar'});
 s=go(s,'DILEMA.ESCOLHER',{dilemmaId:'equipe-liquidez',choice:'adiar'});
 assert.equal(C.overview(s).cash,cash);
 const before=C.overview(s).cash;
 s=go(s,'DILEMA.ESCOLHER',{dilemmaId:'expansao-reserva',choice:'expandir'});
 assert.equal(C.businesses(s).length,2);
 assert.equal(C.overview(s).cash,before-C.SECTORS.mercado.openCost);
 assert.equal(C.overview(s).revenue,0);
});
test('Jornada: decisão de quitação reduz passivo mas não repete despesa',()=>{
 let s=career(405);
 s=advance(s,230); // despesas maiores do que caixa, registra passivo operacional
 const before=C.operatingPayablesReport(s).units.find(x=>x.businessId===s.world.business.id);
 const cash=C.overview(s).cash,expense=C.overview(s).expenses;
 assert.ok(before.outstanding>0);
 // Pode não haver caixa livre: use uma receita real primeiro, sem introduzir capital fictício.
 // O contrato exige rejeição atômica quando não há caixa suficiente para quitar.
 const report=C.dilemmaReport(s).find(x=>x.id==='passivo-operacao');
 if(cash===0){
  const raw=JSON.stringify(s);
  const result=C.dispatch(s,{type:'DILEMA.ESCOLHER',id:'pay-fail',payload:{dilemmaId:'passivo-operacao',choice:'quitar'}});
  assert.equal(result.ok,false);assert.equal(JSON.stringify(s),raw);
 }else{
  s=go(s,'DILEMA.ESCOLHER',{dilemmaId:'passivo-operacao',choice:'quitar'});
  assert.ok(C.operatingPayablesReport(s).units[0].outstanding<before.outstanding);
  assert.equal(C.overview(s).expenses,expense);
 }
 assert.ok(report);
});
test('Jornada: mesmo dilema exige sete dias de observação; comando duplicado é idempotente',()=>{
 let s=career(406);
 s=go(s,'DILEMA.ESCOLHER',{dilemmaId:'preco-volume',choice:'promover'});
 const snap=JSON.stringify(s);
 const rejected=C.dispatch(s,{type:'DILEMA.ESCOLHER',id:'cooldown-rejected',payload:{dilemmaId:'preco-volume',choice:'margem'}});
 assert.equal(rejected.ok,false);assert.match(rejected.error,/sete dias|avaliação/i);
 assert.equal(JSON.stringify(s),snap);
 s=advance(s,7);
 s=go(s,'DILEMA.ESCOLHER',{dilemmaId:'preco-volume',choice:'margem'});
 assert.ok(!s.world.business.promotions.base);
});
test('Jornada: reputação é calculada após amostragem e impacto de demanda é limitado',()=>{
 let s=career(407);
 s=go(s,'ESTOQUE.COMPRAR',{supplierId:'regional',productId:'base',quantity:150});
 let rep=C.reputationReport(s);
 assert.equal(rep.units[0].score,null);
 s=advance(s,10);
 rep=C.reputationReport(s);
 assert.ok(Number.isInteger(rep.units[0].score));
 assert.ok(rep.units[0].score>=10&&rep.units[0].score<=90);
 assert.ok(Math.abs(rep.units[0].impactPct)<=20);
 const old=JSON.stringify(s);
 C.reputationReport(s);C.journeyGuide(s);C.dilemmaReport(s);
 assert.equal(JSON.stringify(s),old);
});
test('Jornada: seis dilemas e reputação continuam iguais após exportar e importar',()=>{
 let s=career(408);
 s=go(s,'DILEMA.ESCOLHER',{dilemmaId:'fornecedor-prazo',choice:'rapido'});
 s=advance(s,8);
 const copy=C.importSave(C.exportSave(s)).state;
 assert.equal(JSON.stringify(copy),JSON.stringify(s));
 assert.equal(JSON.stringify(C.dilemmaReport(copy)),JSON.stringify(C.dilemmaReport(s)));
 assert.equal(JSON.stringify(C.reputationReport(copy)),JSON.stringify(C.reputationReport(s)));
});

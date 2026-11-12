import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createV333DecisionEngine} from '../src/contracts/v333-decision-engine.mjs';

const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const engine=createV333DecisionEngine(Core);
const plain=x=>JSON.parse(JSON.stringify(x));
const stock=(stockUnits,inTransit=0,alert=false,productId='arroz')=>({
  id:productId,name:productId==='arroz'?'Arroz':'Feijão',
  stock:stockUnits,inTransit,reorderPoint:12,targetStock:40,alert
});
function sample(){
  return {
    worldId:'carreira-a',revision:1,player:{cityId:'CE-TIANGUA'},
    calendar:{date:'2026-12-12'},world:{activeBusinessId:'u1'},
    units:[{id:'u1'},{id:'u2'}],
    stockByUnit:{u1:[stock(8,0,true)],u2:[stock(40,0,false)]},
    payables:{units:[]},fiscalOperations:{units:[]},
    fiscal:{assessments:[]}
  };
}
const fakeCore={
  businesses:s=>s.units,
  inventoryReport:s=>s.stockByUnit[s.world.activeBusinessId]||[],
  operatingPayablesReport:s=>s.payables,
  fiscalOperationsReport:s=>s.fiscalOperations,
  money:value=>'R$ '+(value/100).toFixed(2).replace('.',',')
};
const fake=createV333DecisionEngine(fakeCore);
const next=(s,props={})=>({...s,revision:s.revision+1,...props});

test('A-01: varrer todas as unidades sem modificar ativo, estado ou estoque',()=>{
  const s=sample();s.stockByUnit.u2=[stock(0,0,true,'feijao')];
  const before=JSON.stringify(s);
  const rows=plain(fake.candidates(s));
  assert.equal(rows.filter(x=>x.category==='SUP').length,2);
  assert.deepEqual(rows.filter(x=>x.category==='SUP').map(x=>x.scope.businessId).sort(),['u1','u2']);
  assert.equal(s.world.activeBusinessId,'u1');
  assert.equal(JSON.stringify(s),before,'Leitura alterou o save');
  assert.ok(rows.every(x=>x.scope?.businessId&&x.evidence?.businessId));
});

test('A-02: alternar unidade nunca marca como resolvida',()=>{
  const tracker=fake.createTracker(),s=sample();
  const a=tracker.inspect(s);assert.equal(a.active.length,1);
  const b=tracker.inspect(next(s,{world:{activeBusinessId:'u2'}}));
  assert.deepEqual(plain(b.active.map(x=>x.id)),plain(a.active.map(x=>x.id)));
  assert.equal(b.history.length,0,'Troca de unidade criou resolução falsa');
});

test('A-03: baixo -> zerado conserva identidade, agrava sem resolver',()=>{
  const tracker=fake.createTracker(),s=sample();
  const initial=tracker.inspect(s);assert.equal(initial.active[0].rule,'SUP-01');
  const zero=next(s,{stockByUnit:{...s.stockByUnit,u1:[stock(0,0,true)]}});
  const after=tracker.inspect(zero);
  assert.equal(after.active[0].rule,'SUP-02');
  assert.equal(after.active[0].id,initial.active[0].id);
  assert.equal(after.active[0].severity,'urgente');
  assert.equal(after.history.filter(x=>x.status==='agravada').length,1);
  assert.equal(after.history.filter(x=>x.status==='resolvida').length,0);
  assert.equal(tracker.inspect(zero).history.length,1,'Render duplicou mudança');
});

test('A-04: estoque em trânsito é diferente de estoque físico disponível',()=>{
  const s=sample();
  s.stockByUnit.u1=[stock(0,20,false)];
  const a=fake.candidates(s)[0];
  assert.equal(a.rule,'SUP-02');assert.equal(a.severity,'atenção');
  assert.equal(a.evidence.stock,0);assert.equal(a.evidence.inTransit,20);
  assert.match(a.message,/em trânsito/);
  const b=fake.candidates(next(s,{stockByUnit:{...s.stockByUnit,u1:[stock(0,0,true)]}}))[0];
  assert.equal(b.severity,'urgente');
});

test('A-05: dispensa não quita; variação não material não gera spam',()=>{
  const tracker=fake.createTracker(),s=sample(),a=tracker.inspect(s);
  assert.equal(tracker.dismiss(a.all[0].id,s),true);
  assert.equal(tracker.dismiss(a.all[0].id,s),false);
  assert.equal(tracker.inspect(s).active.length,0);
  assert.equal(tracker.inspect(s).history.filter(x=>x.status==='dispensada').length,1);
  const reduced=next(s,{stockByUnit:{...s.stockByUnit,u1:[stock(7,0,true)]}});
  assert.equal(tracker.inspect(reduced).active.length,0,'Apenas 1 unidade de diferença reativou alerta');
  const worse=next(reduced,{stockByUnit:{...reduced.stockByUnit,u1:[stock(0,0,true)]}});
  assert.equal(tracker.inspect(worse).active.length,1,'Agravo material deve reabrir aviso');
  assert.equal(tracker.inspect(worse).history.filter(x=>x.status==='agravada').length,1);
});

test('A-06: resolver depende de correção real, não de ocultação',()=>{
  const tracker=fake.createTracker(),s=sample();
  const id=tracker.inspect(s).all[0].id;
  tracker.dismiss(id,s);
  const fixed=next(s,{stockByUnit:{...s.stockByUnit,u1:[stock(40,0,false)]}});
  const a=tracker.inspect(fixed);
  assert.equal(a.active.length,0);assert.equal(a.all.length,0);
  assert.equal(a.history.filter(x=>x.status==='resolvida').length,1);
  assert.equal(tracker.inspect(fixed).history.filter(x=>x.status==='resolvida').length,1);
});

test('A-07: histórico efêmero isolado entre carreiras',()=>{
  const tracker=fake.createTracker(),s=sample();
  tracker.inspect(s);tracker.dismiss('SUP|u1|arroz',s);
  const another={...s,worldId:'carreira-b'};
  const b=tracker.inspect(another);
  assert.equal(b.active.length,1);
  assert.equal(b.history.length,0);
  assert.equal(b.hidden,0);
});

test('A-08: FIN-01 não inventa vencimento e não reapresenta por centavos',()=>{
  const tracker=fake.createTracker(),s=sample();
  s.stockByUnit.u1=[stock(40,0,false)];
  s.payables={units:[{businessId:'u1',outstanding:48500}]};
  const a=tracker.inspect(s);
  assert.equal(a.active[0].rule,'FIN-01');
  assert.equal(a.active[0].evidence.dueDate,null);
  assert.match(a.active[0].message,/não informa vencimento/);
  assert.equal(tracker.dismiss(a.active[0].id,s),true);
  const changed=next(s,{payables:{units:[{businessId:'u1',outstanding:48501}]}});
  assert.equal(tracker.inspect(changed).active.length,0);
  assert.equal(tracker.inspect(changed).history.filter(x=>x.status==='dispensada').length,1);
  const settled=next(changed,{payables:{units:[{businessId:'u1',outstanding:0}]}});
  assert.equal(tracker.inspect(settled).history.filter(x=>x.status==='resolvida').length,1);
});

test('A-09: apuração fiscal vencida, pendente e paga',()=>{
  const tracker=fake.createTracker(),s=sample();s.stockByUnit.u1=[stock(40,0,false)];
  const tax={id:'TAX-2036-11',period:'2036-11',status:'OPEN',
    amount:12000,paid:0,dueDate:'2026-12-20'};
  const open=next(s,{fiscal:{assessments:[tax]}});
  assert.equal(tracker.inspect(open).active[0].severity,'atenção');
  const late=next(open,{calendar:{date:'2026-12-22'},fiscal:{assessments:[{...tax,status:'OVERDUE'}]}});
  const a=tracker.inspect(late);
  assert.equal(a.active[0].severity,'urgente');
  assert.equal(a.history.filter(x=>x.status==='agravada').length,1);
  const paid=next(late,{fiscal:{assessments:[{...tax,status:'SETTLED',paid:12000}]}});
  assert.equal(tracker.inspect(paid).history.filter(x=>x.status==='resolvida').length,1);
});

test('A-10: checklist fiscal mantém unidade/competência e status verificável',()=>{
  const s=sample();s.stockByUnit.u1=[stock(40,0,false)];
  s.fiscalOperations={units:[{businessId:'u2',periods:[{
    period:'2026-11',closed:false,tasks:[
      {id:'vendas',status:'ATRASADA'},{id:'estoque',status:'PENDENTE'},
      {id:'balancete',status:'CONCLUIDA'}]}]}]};
  const row=fake.candidates(s)[0];
  assert.equal(row.id,'FIS-02|u2|2026-11');
  assert.equal(row.scope.businessId,'u2');assert.equal(row.severity,'urgente');
  assert.equal(row.evidence.pending.length,2);
});

test('A-11: ordenação determinística, sem duplicar e sem COM-01 inventado',()=>{
  const s=sample();s.stockByUnit.u2=[stock(0,0,true,'feijao')];
  s.payables={units:[{businessId:'u1',outstanding:20000}]};
  const first=plain(fake.candidates(s)),second=plain(fake.candidates(s));
  assert.deepEqual(first,second);
  assert.equal(new Set(first.map(x=>x.id)).size,first.length);
  assert.ok(first.every(x=>x.scope&&x.sourceVersion==='V333-A-1'&&x.signature));
  assert.ok(first.every(x=>x.rule!=='COM-01'));
  assert.deepEqual(first.slice(0,1).map(x=>x.severity),['urgente']);
});

test('A-12: leitura real da engine e compatibilidade de save V3.3.2',()=>{
  let seq=0;const send=(s,type,payload={})=>{
    const result=Core.dispatch(s,{type,payload,id:'v333-a-'+(++seq)});
    assert.equal(result.ok,true,String(result.error));return result.state;
  };
  const start=send(null,'CARREIRA.CRIAR',{name:'QA Gestor Completo',companyName:'Empresa de Testes',cityId:'CE-TIANGUA',seed:333001});
  const opened=send(start,'EMPRESA.ABRIR',{sector:'mercado',cityId:'CE-TIANGUA',lot:3});
  const before=JSON.stringify(opened);
  const result=engine.candidates(opened);
  assert.ok(Array.isArray(result));
  assert.ok(result.every(x=>x.role&&x.scope&&x.evidence&&x.signature));
  assert.equal(JSON.stringify(opened),before);
  assert.equal(Core.SCHEMA_VERSION,10);
  assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'3.3.2');
});

test('A-13: contrato read-only, build e roteamento atualizados',()=>{
  const src=readFileSync('src/contracts/v333-decision-engine.mjs','utf8');
  const ui=readFileSync('src/ui/v31-immersive.part.js','utf8');
  const build=readFileSync('tools/build.mjs','utf8');
  assert.doesNotMatch(src,/Math\.random\(|fetch\(|Core\.dispatch\(|localStorage\.|indexedDB\.|\.push\(.*ledger/);
  assert.match(build,/v333-decision-engine\.mjs/);
  assert.match(ui,/CidadeV333DecisionEngine\.createTracker\(\)/);
  assert.match(ui,/v333DecisionTracker\.dismiss/);
  assert.match(ui,/data-v332-business-id|dataset\.v332BusinessId/);
  assert.doesNotMatch(ui,/v332AdviceDismissed\.set/);
});

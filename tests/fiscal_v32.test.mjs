import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const Core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const V31=runInNewContext(readFileSync('tests/fixtures/core_v2_9_0_homologada.js','utf8')+'\nCidadeCore',{});
let seq=0;
const json=x=>JSON.parse(JSON.stringify(x));
function request(state,type,payload={},id='fiscal32-'+(++seq)){return Core.dispatch(state,{type,payload,id});}
function send(state,type,payload={},id){const r=request(state,type,payload,id);assert.equal(r.ok,true,type+': '+r.error);return r.state;}
function fresh(sector='mercado',location='CE-TIANGUA'){
  let s=send(null,'CARREIRA.CRIAR',{name:'Fiscal QA',companyName:'Comércio Educativo',cityId:location,seed:320011});
  return send(s,'EMPRESA.ABRIR',{sector,cityId:location,lot:1});
}
function forward(s,days){while(days){const n=Math.min(days,30);s=send(s,'TEMPO.AVANCAR_LOTE',{days:n});days-=n;}return s;}
function stocked(){let s=fresh();s=send(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:180});return s;}
function balanced(s){
  assert.equal(Core.balanceSheet(s).balanced,true);
  assert.equal(Core.reconciliationReport(s).ok,true);
  assert.equal(Core.overview(s).taxPayable,s.fiscal.assessments.reduce((n,a)=>n+a.amount-a.paid,0));
  for(const j of s.economy.ledger)assert.equal(j.entries.reduce((n,e)=>n+e.debit,0),j.entries.reduce((n,e)=>n+e.credit,0),j.id);
}
test('V3.2: novo motor e estado inicial no schema 10, sem alterar história fiscal',()=>{
  assert.equal(Core.VERSION,'3.3.0');assert.equal(Core.SCHEMA_VERSION,10);
  const s=fresh();assert.equal(s.schemaVersion,10);assert.equal(s.fiscal.mode,'ATIVO');
  assert.equal(s.fiscal.regime,'SIMPLES');assert.equal(s.fiscal.simplesIvaMode,'DENTRO_DAS');
  assert.equal(s.fiscal.taxCreditsCents,0);assert.equal(s.fiscal.assessments.length,0);
  assert.equal(Core.overview(s).taxExpense,0);balanced(s);
  assert.equal(Core.taxReport(s).regular,true);
});
test('V3.2: migração de save verdadeiro schema 9 preserva journals e sem imposto retroativo',()=>{
  const city=V31.CITIES.find(x=>x.name==='Tianguá').id;
  let s=V31.dispatch(null,{type:'CARREIRA.CRIAR',id:'v32-old-create',payload:{name:'Empresa QA',companyName:'Mundo Histórico',cityId:city,seed:320032}}).state;
  s=V31.dispatch(s,{type:'EMPRESA.ABRIR',id:'v32-old-open',payload:{sector:'mercado',cityId:city,lot:1}}).state;
  s=V31.dispatch(s,{type:'TEMPO.AVANCAR_LOTE',id:'v32-old-time',payload:{days:30}}).state;
  const old=json(s),raw=V31.exportSave(s),restored=Core.importSave(raw);
  assert.equal(restored.migrated,true);
  assert.equal(restored.state.schemaVersion,10);
  assert.equal(restored.state.fiscal.mode,'ATIVO');
  assert.equal(restored.state.fiscal.taxStartDate,old.calendar.date);
  assert.deepEqual(json(restored.state.economy),old.economy);
  assert.deepEqual(json(restored.state.audit),old.audit);
  assert.deepEqual(json(restored.state.calendar),old.calendar);
  assert.deepEqual(json(restored.state.rng),old.rng);
  assert.equal(Core.overview(restored.state).taxPayable,0);
  balanced(restored.state);
  const future=forward(restored.state,1);balanced(future);
  assert.equal(future.fiscal.assessments.some(a=>a.period==='2026-11'),false);
  assert.equal(json(Core.importSave(Core.exportSave(restored.state)).state).schemaVersion,10);
});
test('V3.2: Simples Anexos I e II, Presumido e Real são estimados sem mutação do core',()=>{
  let s=fresh('padaria');s=send(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:130});
  s=forward(s,6);
  const before=JSON.stringify(s);
  const p=Core.taxPlanningComparison(s,'2026-11');
  assert.equal(p.regimes.length,3);
  assert.deepEqual(json(p.regimes.map(x=>x.regime)),['SIMPLES','PRESUMIDO','REAL']);
  assert.ok(['SIMPLES','PRESUMIDO','REAL'].includes(p.recommendedRegime));
  assert.ok(p.regimes.every(x=>Number.isSafeInteger(x.principalCents)&&x.principalCents>=0));
  assert.equal(JSON.stringify(s),before,'comparador não pode lançar tributos');
  assert.equal(Core.FISCAL_RULE_PACKS.simplesII.brackets[0][1],450);
  assert.equal(Core.FISCAL_RULE_PACKS.simples2026.brackets[0][1],400);
  assert.equal(Core.FISCAL_RULE_PACKS.icmsUF.CE,2000);
});
test('V3.2: apuração automática e partidas dobradas na virada mensal, sem segundo lançamento',()=>{
  let s=stocked();s=forward(s,29);
  assert.equal(s.calendar.date,'2026-11-30');
  assert.equal(s.fiscal.assessments.length,0);
  s=forward(s,1);assert.equal(s.calendar.date,'2026-12-01');
  const a=s.fiscal.assessments.find(x=>x.period==='2026-11');
  assert.ok(a&&a.principalCents>=0);
  assert.equal(a.id,'TAX-2026-11');
  assert.equal(a.dueDate,'2026-12-20');
  assert.equal(a.amount,a.principalCents);
  assert.equal(a.status,a.amount?'OPEN':'SETTLED');
  assert.equal(Core.overview(s).taxPayable,a.amount);
  const taxJournalCount=s.economy.ledger.filter(j=>j.kind==='TAX_ASSESSMENT').length;
  s=forward(s,1);assert.equal(s.fiscal.assessments.filter(a=>a.period==='2026-11').length,1);
  assert.equal(s.economy.ledger.filter(j=>j.kind==='TAX_ASSESSMENT').length,taxJournalCount);
  balanced(s);
});
test('V3.2: troca de regime imediato em janeiro e programado após janeiro',()=>{
  let s=fresh();s=send(s,'FISCAL.ALTERAR_REGIME',{regime:'REAL',simplesIvaMode:'POR_FORA'});
  assert.equal(s.fiscal.regime,'REAL');
  assert.equal(s.fiscal.simplesIvaMode,'POR_FORA');
  s=forward(s,35);
  s=send(s,'FISCAL.ALTERAR_REGIME',{regime:'PRESUMIDO'});
  assert.equal(s.fiscal.regime,'REAL');
  assert.equal(s.fiscal.scheduledRegime,'PRESUMIDO');
  const mark=s.calendar.date;
  s=forward(s,61-35);
  assert.equal(s.calendar.date,'2027-01-01');
  assert.equal(s.fiscal.regime,'PRESUMIDO');
  assert.equal(s.fiscal.scheduledRegime,null);
  assert.ok(mark.startsWith('2026-12'));
  balanced(s);
});
test('V3.2: guia vencida gera mora em partidas dobradas e restringe contratação de crédito',()=>{
  let s=stocked();
  s=forward(s,50);
  const a=s.fiscal.assessments.find(x=>x.period==='2026-11');
  assert.ok(a&&a.principalCents>0,'Fixture de vendas deve gerar tributo');
  assert.equal(a.status,'OVERDUE');
  assert.ok(a.fineCents>0&&a.interestCents>0);
  assert.equal(a.amount,a.principalCents+a.fineCents+a.interestCents);
  assert.equal(Core.taxReport(s).regular,false);
  assert.equal(Core.creditReport(s).eligibility.eligible,false);
  assert.match(Core.creditReport(s).eligibility.reason,/tributos vencidos/);
  const loan=request(s,'CREDITO.CONTRATAR',{principalCents:50000,termMonths:6});
  assert.equal(loan.ok,false);assert.match(loan.error,/tributos vencidos/);
  const before=a.amount;s=forward(s,1);
  assert.ok(s.fiscal.assessments[0].amount>=before);
  assert.ok(s.economy.ledger.some(j=>j.kind==='TAX_LATE_FEE'));
  assert.ok(s.economy.ledger.some(j=>j.entries.some(e=>e.account==='INTEREST_EXPENSE')));
  balanced(s);
});
test('V3.2: pagamento parcial e integral baixam passivo, sem duplicar despesa',()=>{
  let s=stocked();s=forward(s,50);
  const a=s.fiscal.assessments.find(x=>x.period==='2026-11');
  assert.ok(a&&a.amount>200);
  const before=Core.overview(s),pay=Math.min(500,Math.floor(a.amount/2));
  s=send(s,'FISCAL.PAGAR_COMPETENCIA',{period:a.period,amountCents:pay},'tax-v32-partial');
  assert.equal(Core.overview(s).cash,before.cash-pay);
  assert.equal(Core.overview(s).taxPayable,before.taxPayable-pay);
  assert.equal(Core.overview(s).taxExpense,before.taxExpense);
  const duplicate=request(s,'FISCAL.PAGAR_COMPETENCIA',{period:a.period,amountCents:pay},'tax-v32-partial');
  assert.equal(duplicate.ok,true);assert.equal(duplicate.status,'DUPLICATE');
  const still=s.fiscal.assessments.find(x=>x.period===a.period);
  assert.equal(still.status,'OVERDUE');
  const remaining=still.amount-still.paid;
  if(Core.overview(s).cash>=remaining){
    s=send(s,'FISCAL.PAGAR_COMPETENCIA',{period:a.period,amountCents:remaining});
    assert.equal(s.fiscal.assessments.find(x=>x.period===a.period).status,'PAID');
    assert.equal(Core.taxReport(s).regular,true);
  }
  balanced(s);
});
test('V3.2: Reforma 2026 demonstra, 2027+ fica ativa mas parâmetros futuros não são alíquotas legais',()=>{
  const s=stocked(),ref=Core.taxEstimate(s,'2026-11');
  assert.equal(ref.tests2026.postingToLedger,false);
  const next=Core.taxEstimate(s,'2027-01');
  assert.equal(next.coverageStatus,'SIMULATED_PARTIAL');
  const future=Core.taxEstimate(s,'2033-01');
  assert.equal(future.coverageStatus,'SIMULATED_PARTIAL');
  assert.ok(/HYPOTHETICAL|HIPOT|hipótes/i.test(Core.FISCAL_RULE_PACKS.fiscalGame.source));
  assert.equal(Core.FISCAL_RULE_PACKS.fiscalGame.cbsHypothesisBp,880);
  assert.equal(Core.FISCAL_RULE_PACKS.fiscalGame.ibsFullHypothesisBp,1770);
  assert.equal(Core.FISCAL_RULE_PACKS.fiscalGame.interstateTransferHypothesisBp,200);
});
test('V3.2: quatro painéis, botões funcionais e cidade imersiva V3.1 intocada',()=>{
  const tpl=readFileSync('src/shell/index.template.html','utf8'),ui=readFileSync('src/ui/app.js','utf8');
  const views=readFileSync('src/ui/finance-views.part.js','utf8');
  for(const id of ['fiscal-regime-select','fiscal-iva-mode','fiscal-regime-apply','fiscal-comparison-table','fiscal-assessments','fiscal-preview','fiscal-op-unit-list'])
    assert.match(tpl,new RegExp('id="'+id+'"'));
  assert.match(ui,/FISCAL\.ALTERAR_REGIME/);
  assert.match(ui,/FISCAL\.PAGAR_COMPETENCIA/);
  assert.match(views,/taxPlanningComparison|f\.planning/);
  assert.match(tpl,/Cenários tributários não são apuração legal/);
  const css=readFileSync('src/shell/v31.css','utf8');
  assert.match(css,/v221-live-legend/);
  assert.doesNotMatch(readFileSync('src/visual/tiangua-scene.js','utf8'),/data-city-switch-art/);
});

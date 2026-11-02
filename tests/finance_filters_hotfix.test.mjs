import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const core=runInNewContext(readFileSync('tests/fixtures/core_v1_2_1.js','utf8')+'\nCidadeCore',{});
const city=core.CITIES.find(x=>x.name==='Tianguá').id;
function command(type,payload,id){return {type,payload,id};}
function sample(){
  let state=core.dispatch(null,command('CARREIRA.CRIAR',{name:'QA',companyName:'Teste de Vendas',cityId:city,seed:1234},'create')).state;
  for(const [type,payload,id] of [['EMPRESA.ABRIR',{sector:'mercado',lot:3},'open'],['ESTOQUE.COMPRAR',{quantity:500},'buy'],['TEMPO.AVANCAR_LOTE',{days:30},'month']]){
    const result=core.dispatch(state,command(type,payload,id));assert.equal(result.ok,true,result.error);state=result.state;
  }
  return state;
}
test('Filtro de semestre mostra intervalo civil completo sem projetar vendas futuras',()=>{
 const s=sample(),second=core.financialReport(s,'semester','2026-11-01');
 assert.equal(second.from,'2026-07-01');assert.equal(second.to,'2026-12-31');
 assert.equal(second.effectiveEnd,'2026-12-01');
 assert.equal(second.revenue,core.overview(s).revenue);
 const first=core.financialReport(s,'semester','2026-03-01');
 assert.equal(first.from,'2026-01-01');assert.equal(first.to,'2026-06-30');assert.equal(first.revenue,0);
});
test('Intervalo personalizado considera apenas movimentos entre início e fim',()=>{
 const s=sample(),before=JSON.stringify(s);
 const range=core.financialReport(s,'range','2026-11-15',{from:'2026-11-05',to:'2026-11-15'});
 const nov=core.financialReport(s,'month','2026-11-01');
 assert.equal(range.from,'2026-11-05');assert.equal(range.to,'2026-11-15');
 assert.equal(range.effectiveEnd,'2026-11-15');
 assert.ok(range.revenue>0 && range.revenue<nov.revenue);
 const upTo=core.financialReport(s,'all','2026-11-15');
 assert.equal(range.closingCash,upTo.closingCash);
 assert.ok(range.entries.every(e=>e.date>='2026-11-05'&&e.date<='2026-11-15'));
 assert.equal(JSON.stringify(s),before,'Consulta não pode alterar o save');
});
test('Datas invertidas, impossíveis ou posteriores ao calendário são rejeitadas',()=>{
 const s=sample(),before=JSON.stringify(s);
 assert.throws(()=>core.financialReport(s,'range','2026-11-25',{from:'2026-11-25',to:'2026-11-10'}),/inicial/);
 assert.throws(()=>core.financialReport(s,'range','2026-11-20',{from:'2026-11-31',to:'2026-12-01'}),/válidas/);
 assert.throws(()=>core.financialReport(s,'range','2026-12-10',{from:'2026-11-01',to:'2026-12-10'}),/futura/);
 assert.throws(()=>core.financialReport(s,'day','2026-11-31'),/referência inválida/);
 assert.equal(JSON.stringify(s),before);
});
test('Data de referência fixa permanece válida ao avançar a simulação',()=>{
 let state=sample();const query='2026-11-10',before=core.financialReport(state,'day',query);
 const r=core.dispatch(state,command('TEMPO.AVANCAR_LOTE',{days:7},'week'));assert.equal(r.ok,true,r.error);state=r.state;
 const after=core.financialReport(state,'day',query);
 assert.equal(after.referenceDate,query);assert.equal(after.revenue,before.revenue);
 assert.equal(after.expenses,before.expenses);assert.equal(after.entries.length,before.entries.length);
});
test('O seletor usa campos específicos e não prende a data ao render automático',()=>{
 const html=readFileSync('src/shell/index.template.html','utf8');const ui=readFileSync('src/ui/app.js','utf8');
 for(const id of ['finance-date','finance-day','finance-month','finance-quarter','finance-quarter-year',
    'finance-semester','finance-semester-year','finance-year','finance-range-from','finance-range-to'])
   assert.ok(html.includes(`id="${id}"`),`${id} não encontrado`);
 assert.match(ui,/let financeQuery=null/);
 assert.match(ui,/ensureFinanceQuery\(\)/);
 assert.doesNotMatch(ui,/financeDatePinned/);
 assert.match(ui,/Consulta fixa até você alterar os filtros/);
});

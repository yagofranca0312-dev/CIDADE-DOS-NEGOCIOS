import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const city=core.CITIES.find(c=>c.name==='Tianguá').id;
const cmd=(type,payload,id)=>({type,payload,id});
function sample(){
 let s=core.dispatch(null,cmd('CARREIRA.CRIAR',{name:'QA',companyName:'Negocio QA',cityId:city,seed:42},'career')).state;
 for(const [type,payload,id] of [['EMPRESA.ABRIR',{sector:'mercado',lot:3},'open'],['ESTOQUE.COMPRAR',{quantity:500},'buy'],['TEMPO.AVANCAR_LOTE',{days:30},'month']]){
   const r=core.dispatch(s,cmd(type,payload,id));assert.equal(r.ok,true,r.error);s=r.state;
 }
 return s;
}
test('Consulta de semestre determina início/fim corretos e não inventa receita futura',()=>{
 const s=sample(),half=core.financialReport(s,'semester','2026-11-01');
 assert.equal(half.from,'2026-07-01');assert.equal(half.to,'2026-12-31');
 assert.equal(half.revenue,core.overview(s).revenue);
 const first=core.financialReport(s,'semester','2026-03-01');
 assert.equal(first.from,'2026-01-01');assert.equal(first.to,'2026-06-30');assert.equal(first.revenue,0);
});
test('Intervalo personalizado filtra movimentações e preserva saldos cumulativos',()=>{
 const s=sample(),before=JSON.stringify(s);
 const report=core.financialReport(s,'range','2026-11-15',{from:'2026-11-05',to:'2026-11-15'});
 const nov=core.financialReport(s,'month','2026-11-01');
 assert.ok(report.revenue>0&&report.revenue<nov.revenue);
 assert.equal(report.from,'2026-11-05');assert.equal(report.to,'2026-11-15');
 assert.ok(report.entries.every(x=>x.date>=report.from&&x.date<=report.to));
 assert.equal(report.closingCash,core.financialReport(s,'all','2026-11-15').closingCash);
 assert.equal(JSON.stringify(s),before);
});
test('Intervalo invertido, data inválida e data futura são rejeitados sem escrever no save',()=>{
 const s=sample(),before=JSON.stringify(s);
 assert.throws(()=>core.financialReport(s,'range','2026-11-25',{from:'2026-11-25',to:'2026-11-10'}),/inicial/);
 assert.throws(()=>core.financialReport(s,'range','2026-11-25',{from:'2026-11-31',to:'2026-12-01'}),/válidas/);
 assert.throws(()=>core.financialReport(s,'range','2026-12-10',{from:'2026-11-01',to:'2026-12-10'}),/futura/);
 assert.throws(()=>core.financialReport(s,'day','2026-11-31'),/referência inválida/);
 assert.equal(JSON.stringify(s),before);
});
test('Relatório escolhido em data antiga não varia após avanço do jogo',()=>{
 let s=sample();const date='2026-11-10',old=core.financialReport(s,'day',date);
 const r=core.dispatch(s,cmd('TEMPO.AVANCAR_LOTE',{days:7},'week'));assert.equal(r.ok,true,r.error);s=r.state;
 const next=core.financialReport(s,'day',date);
 assert.equal(next.referenceDate,date);assert.equal(next.revenue,old.revenue);
 assert.equal(next.expenses,old.expenses);assert.equal(next.entries.length,old.entries.length);
});
test('Interface oferece campos próprios para competência, dia, trimestre, semestre, ano e intervalo',()=>{
 const html=readFileSync('src/shell/index.template.html','utf8');
 const ui=readFileSync('src/ui/app.js','utf8');
 for(const id of ['finance-period','finance-date','finance-day','finance-month','finance-quarter',
  'finance-quarter-year','finance-semester','finance-semester-year','finance-year',
  'finance-range-from','finance-range-to','finance-current-date','finance-validation'])
   assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(ui,/let financeQuery=null/);
 assert.doesNotMatch(ui,/financeDatePinned/);
 assert.match(ui,/Consulta fixa até você alterar os filtros/);
});

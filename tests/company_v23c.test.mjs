import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync('src/ui/company-views.part.js','utf8');
const core=runInNewContext(readFileSync('src/core/game.js','utf8')+'\nCidadeCore',{});
const helperCode=source.split('function companyFillSelect(')[0]+'\n({companyShiftDate,companyReportWindow,companyScopedUnits,companyMetricReport,companyTrendRows,companyComparisonRows})';
const m=runInNewContext(helperCode,{});
let seq=0;
function send(s,type,payload){
  const r=core.dispatch(s,{type,payload,id:'v23c:test:'+ ++seq});
  assert.equal(r.ok,true,type+' '+r.error);
  return r.state;
}
function scenario(){
  const t=core.CITIES.find(x=>x.name==='Tianguá'),s=core.CITIES.find(x=>x.name==='Sobral');
  let state=send(null,'CARREIRA.CRIAR',{cityId:t.id,name:'Teste de Rede',companyName:'Rede Analítica',seed:20261103});
  state=send(state,'EMPRESA.ABRIR',{sector:'padaria',cityId:t.id,lot:1});
  state=send(state,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:80});
  state=send(state,'TEMPO.AVANCAR_LOTE',{days:6});
  state=send(state,'EMPRESA.ABRIR',{sector:'mercado',cityId:s.id,lot:3});
  state=send(state,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:85});
  state=send(state,'TEMPO.AVANCAR_LOTE',{days:6});
  return {state,tiangua:t.id,sobral:s.id};
}
test('V2.3-C: recortes temporais estritos não utilizam datas futuras ou inválidas',()=>{
  const {state}=scenario();
  const all=m.companyReportWindow(state,core,'all');
  assert.equal(all.from,core.START_DATE);assert.equal(all.to,state.calendar.date);
  for(const days of ['7','30','90']){
    const w=m.companyReportWindow(state,core,days);
    assert.ok(w.from>=core.START_DATE&&w.to<=state.calendar.date&&w.from<=w.to);
  }
  const month=m.companyReportWindow(state,core,'month');assert.equal(month.from.slice(0,7),state.calendar.date.slice(0,7));
  const custom=m.companyReportWindow(state,core,'custom',core.START_DATE,state.calendar.date);
  assert.equal(custom.from,core.START_DATE);
  for(const range of [['2026-13-01','2026-11-04'],['2026-11-01','9999-01-01'],['2026-11-03','2026-11-01']])
    assert.throws(()=>m.companyReportWindow(state,core,'custom',...range));
});
test('V2.3-C: receitas e despesas do grupo vêm do mesmo ledger, sem projeções',()=>{
  const {state}=scenario(),w=m.companyReportWindow(state,core,'all'),group=m.companyMetricReport(state,core,'all',w);
  const report=core.financialReport(state,'all',state.calendar.date,null,'all');
  assert.equal(group.revenue,report.revenue);assert.equal(group.cogs,report.cogs);
  assert.equal(group.expenses,report.expenses);assert.equal(group.taxExpense,report.taxExpense);
  assert.equal(group.operatingResult,report.revenue-report.cogs-report.expenses);
  assert.equal(group.afterTax,report.profit);
  assert.equal(group.cash,core.overview(state).cash);assert.equal(group.unitCount,2);
});
test('V2.3-C: cidade, setor e unidade filtram resultados operacionais corretamente',()=>{
  const {state,tiangua,sobral}=scenario(),w=m.companyReportWindow(state,core,'all');
  const b=core.businesses(state),city=m.companyMetricReport(state,core,'city:'+tiangua,w);
  const sector=m.companyMetricReport(state,core,'sector:mercado',w);
  const one=m.companyMetricReport(state,core,'unit:'+b[0].id,w);
  assert.equal(city.unitCount,1);assert.equal(city.units[0].cityId,tiangua);
  assert.equal(sector.unitCount,1);assert.equal(sector.units[0].sector,'mercado');
  assert.equal(one.unitCount,1);assert.equal(one.units[0].id,b[0].id);
  const cityRevenue=core.financialReport(state,'range',state.calendar.date,{from:w.from,to:w.to},city.units[0].id).revenue;
  assert.equal(city.revenue,cityRevenue);
  assert.equal(city.cash,null);assert.equal(city.taxPayable,null);assert.equal(city.hasCorporateTax,false);
  assert.equal(city.taxExpense,0);
  assert.equal(m.companyScopedUnits(state,core,'city:'+sobral).length,1);
  assert.throws(()=>m.companyMetricReport(state,core,'unit:UNKNOWN',w));
});
test('V2.3-C: tendências reproduzem totais históricos sem adicionar dados simulados',()=>{
  const {state}=scenario(),w=m.companyReportWindow(state,core,'all'),r=m.companyMetricReport(state,core,'all',w);
  const rows=m.companyTrendRows(r);
  assert.ok(rows.length>=1);
  assert.equal(rows.reduce((n,x)=>n+x.revenue,0),r.revenue);
  assert.equal(rows.reduce((n,x)=>n+x.operatingResult,0),r.operatingResult);
  assert.ok(rows.every(x=>x.key>=core.START_DATE.slice(0,7)));
});
test('V2.3-C: comparativos agrupam os mesmos valores por unidade, cidade e ramo',()=>{
  const {state}=scenario(),w=m.companyReportWindow(state,core,'all');
  const group=m.companyMetricReport(state,core,'all',w);
  for(const dimension of ['unit','city','sector']){
    const rows=m.companyComparisonRows(state,core,w,dimension);
    assert.equal(rows.length,2);
    assert.equal(rows.reduce((n,r)=>n+r.unitCount,0),2);
    assert.equal(rows.reduce((n,r)=>n+r.revenue,0),group.revenue);
    assert.equal(rows.reduce((n,r)=>n+r.operatingResult,0),group.operatingResult);
  }
  const city=core.businesses(state)[0].cityId;
  const filtered=m.companyComparisonRows(state,core,w,'unit',city);
  assert.equal(filtered.length,1);
  assert.equal(filtered[0].unitCount,1);
  assert.equal(filtered[0].revenue,m.companyMetricReport(state,core,'city:'+city,w).revenue);
});
test('V2.3-C: datas, filtros, rankings e tendências são consultas sem mutação de save/RNG',()=>{
  const {state}=scenario(),before=core.exportSave(state);
  for(const k of ['all','7','30','90','month']){
    const w=m.companyReportWindow(state,core,k);
    for(const scope of ['all','sector:padaria','sector:mercado']){
      const report=m.companyMetricReport(state,core,scope,w);
      m.companyTrendRows(report);
    }
    for(const dimension of ['unit','city','sector'])m.companyComparisonRows(state,core,w,dimension,'all','all','operating');
  }
  assert.equal(core.exportSave(state),before);
  assert.equal(state.schemaVersion,10);
});
test('V2.3-C: interface tem navegação, filtros, indicadores, comparativos e HTML compilável',()=>{
  const t=readFileSync('src/shell/index.template.html','utf8'),app=readFileSync('src/ui/app.js','utf8');
  for(const id of ['company-dashboard-revenue','company-dashboard-margin','company-dashboard-operating','company-dashboard-net','company-dashboard-stock','company-dashboard-tax','company-dashboard-alerts',
    'company-unit-city','company-unit-sector','company-unit-search','company-analysis-scope','company-analysis-period','company-analysis-from','company-analysis-to',
    'company-analysis-tax-note','company-trend-rows','company-compare-dimension','company-compare-period','company-compare-city','company-compare-sector','company-compare-rows'])
    assert.ok(t.includes('id="'+id+'"'),id);
  assert.match(app,/renderGroup\(\);\s*renderCompanyPanels\(\)/);
  assert.doesNotMatch(source,/Core\.dispatch|commit\(|saveLocal\(|localStorage/);
  const ids=[...t.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
  const html=readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][1]));
});

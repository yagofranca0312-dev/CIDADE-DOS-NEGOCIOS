import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const load=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const Core=load('src/core/game.js');
const V18=load('tests/fixtures/core_v1_8_0.js');
const tCity=Core.CITIES.find(c=>c.name==='Tianguá').id;
const fort=Core.CITIES.find(c=>c.name==='Fortaleza').id;
const sp=Core.CITIES.find(c=>c.name==='São Paulo').id;
let n=0;
function cmd(state,type,payload={}){
 const r=Core.dispatch(state,{type,id:`fiscal:${++n}`,payload});assert.equal(r.ok,true,`${type}: ${r.error}`);return r.state;
}
function fresh(sector='roupas'){
 let s=cmd(null,'CARREIRA.CRIAR',{name:'Empresa',companyName:'Mercado Exemplo',cityId:tCity,seed:20261102});
 return cmd(s,'EMPRESA.ABRIR',{sector,cityId:tCity,lot:1});
}
function advance(state,days){while(days>0){const take=Math.min(30,days);state=cmd(state,'TEMPO.AVANCAR_LOTE',{days:take});days-=take;}return state;}
function payReady(){let s=fresh();s=cmd(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:170});s=cmd(s,'FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true});s=advance(s,35);s=cmd(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:175});s=advance(s,27);return s;}
const normal=value=>JSON.parse(JSON.stringify(value));

test('V1.9: versão e schema9; histórico das V1.8 continua legível',()=>{
 assert.equal(Core.VERSION,'3.1.0');assert.equal(Core.SCHEMA_VERSION,9);
 assert.equal(V18.VERSION,'1.8.0-rc.1');assert.equal(V18.SCHEMA_VERSION,8);
 assert.equal(Core.FISCAL_RULE_PACKS.simples2026.coverage,'SIMULATED_PARTIAL');
 const s=fresh();assert.equal(s.schemaVersion,9);assert.equal(s.fiscal.coverageStatus,'NOT_COVERED');
});
test('V1.9: save genuíno V1.8 não recria impostos retroativos nem mexe no ledger',()=>{
 const city=V18.CITIES.find(c=>c.name==='Tianguá').id;
 let old=V18.dispatch(null,{type:'CARREIRA.CRIAR',id:'legacy:1',payload:{name:'Legado',companyName:'Lojas Históricas',cityId:city,seed:991101}}).state;
 old=V18.dispatch(old,{type:'EMPRESA.ABRIR',id:'legacy:2',payload:{sector:'roupas',cityId:city,lot:1}}).state;
 old=V18.dispatch(old,{type:'TEMPO.AVANCAR_LOTE',id:'legacy:3',payload:{days:30}}).state;
 const copied=Core.importSave(V18.exportSave(old));assert.equal(copied.migrated,true);
 assert.equal(copied.state.schemaVersion,9);assert.equal(copied.state.fiscal.mode,'DEMONSTRACAO_ECONOMICA');
 assert.equal(copied.state.fiscal.assessments.length,0);
 for(const key of ['economy','world','rng','calendar','audit'])assert.deepEqual(normal(copied.state[key]),normal(old[key]));
 assert.equal(Core.overview(copied.state).cash,V18.overview(old).cash);
 assert.equal(Core.balanceSheet(copied.state).difference,0);
});
test('V1.9: por padrão jamais cria imposto; linha do tempo teste não vira obrigação',()=>{
 let s=fresh();s=cmd(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:120});s=advance(s,62);
 assert.equal(s.fiscal.mode,'DEMONSTRACAO_ECONOMICA');assert.equal(s.fiscal.assessments.length,0);
 assert.equal(Core.overview(s).taxExpense,0);assert.equal(Core.overview(s).taxPayable,0);
 const f=Core.transitionReport(s);assert.equal(f.postingToLedger,false);assert.equal(f.ibsTestCents,null);
 assert.equal(Core.taxReport(s).coverageStatus,'NOT_COVERED');
});
test('V1.9: ativar exige concordância e apenas comércio puro; padaria não é comércio por inferência',()=>{
 let s=fresh();let r=Core.dispatch(s,{type:'FISCAL.ATIVAR_CENARIO',id:'neg:1',payload:{}});assert.equal(r.ok,false);
 const old=JSON.stringify(s);assert.equal(JSON.stringify(r.state),old);
 s=fresh('padaria');r=Core.dispatch(s,{type:'FISCAL.ATIVAR_CENARIO',id:'neg:2',payload:{acceptSimplifications:true}});assert.equal(r.ok,false);
 assert.match(r.error,/comércio|padaria/i);
});
test('V1.9: ativação começa no mês seguinte, sem apuração de competência anterior',()=>{
 let s=fresh();s=cmd(s,'FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true});
 assert.equal(s.fiscal.effectiveFrom,'2026-12');s=advance(s,29);
 assert.equal(s.calendar.date,'2026-11-30');assert.equal(s.fiscal.assessments.length,0);
 s=advance(s,1);assert.equal(s.calendar.date,'2026-12-01');assert.equal(s.fiscal.assessments.length,0);
});
test('V1.9: faixas Anexo I e arredondamento final em centavos',()=>{
 const base=fresh();
 for(const [rbt12,bracket,nominal,offset] of [[18000000,1,400,0],[18000012,2,730,594000],[36000000,2,730,594000],
  [36000012,3,950,1386000],[72000000,3,950,1386000],[180000000,4,1070,2250000],[360000000,5,1430,8730000],[480000000,6,1900,37800000]]){
  const s=normal(base),revenue=Math.round(rbt12/12);s.economy.ledger.push({id:'synth',date:'2026-11-01',memo:'Synthetic test only',entries:[
    {account:'CASH',debit:revenue,credit:0},{account:'REVENUE',debit:0,credit:revenue}]});
  const e=Core.taxEstimate(s,'2026-11');assert.equal(e.bracket,bracket,`${rbt12} faixa`);
  const expected=Math.round(revenue*Math.max(0,e.rbt12*nominal-offset*10000)/e.rbt12/10000);
  assert.equal(e.amount,expected,`${rbt12} centavos`);
 }
});
test('V1.9: fechamento reconhece despesa e obrigação uma única vez; pagamento não duplica despesa',()=>{
 let s=payReady();const a=s.fiscal.assessments.find(x=>x.period==='2026-12');
 assert.ok(a&&a.amount>0&&a.status==='OPEN');assert.equal(a.paid,0);
 const cash=Core.overview(s).cash,expense=Core.overview(s).taxExpense;
 assert.equal(Core.overview(s).taxPayable,a.amount);assert.equal(expense,a.amount);
 assert.equal(Core.balanceSheet(s).balanced,true);assert.equal(Core.reconciliationReport(s).ok,true);
 const dec=Core.incomeStatement(s,'month','2026-12-15');assert.equal(dec.taxExpense,a.amount);
 assert.equal(dec.operatingResult-dec.taxExpense,dec.resultAfterSimulatedTax);
 s=cmd(s,'FISCAL.PAGAR_SIMULADO',{period:'2026-12'});
 assert.equal(Core.overview(s).cash,cash-a.amount);assert.equal(Core.overview(s).taxExpense,expense);
 assert.equal(Core.overview(s).taxPayable,0);assert.equal(Core.balanceSheet(s).balanced,true);
 assert.equal(Core.cashFlowStatement(s,'month',s.calendar.date).categories.taxPayments,a.amount);
 const r=Core.dispatch(s,{type:'FISCAL.PAGAR_SIMULADO',id:'neg:repeat',payload:{period:'2026-12'}});
 assert.equal(r.ok,false);assert.equal(Core.overview(s).taxPayable,0);
});
test('V1.9: comandos repetidos e caixa insuficiente não alteram histórico',()=>{
 let s=payReady();const period='2026-12',amount=s.fiscal.assessments.find(x=>x.period===period).amount;
 const c={type:'FISCAL.PAGAR_SIMULADO',id:'ident:paid',payload:{period}};
 const r=Core.dispatch(s,c);
 if(r.ok){const second=Core.dispatch(r.state,c);assert.equal(second.ok,true);assert.equal(second.status,'DUPLICATE');assert.equal(Core.overview(second.state).taxPayable,0);}
 else{assert.match(r.error,/insuficiente/i);assert.equal(Core.overview(s).taxPayable,amount);}
 const b=normal(s);b.economy.ledger.forEach(j=>{}); // Estado original continua intacto.
 assert.equal(Core.overview(s).taxPayable,amount);
});
test('V1.9: cenário multi-UF e produção própria não geram DAS simulado',()=>{
 let s=fresh('roupas');s=cmd(s,'FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true});
 s=cmd(s,'EMPRESA.ABRIR',{sector:'roupas',cityId:sp,lot:1});
 s=advance(s,62);assert.ok(s.fiscal.assessments.some(a=>a.status==='UNSUPPORTED'));assert.equal(Core.overview(s).taxPayable,0);
 let t=fresh('roupas');t=cmd(t,'FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true});
 t=cmd(t,'EMPRESA.ABRIR',{sector:'padaria',cityId:fort,lot:1});t=advance(t,62);
 assert.ok(t.fiscal.assessments.some(a=>a.status==='UNSUPPORTED'));assert.equal(Core.overview(t).taxExpense,0);
});
test('V1.9: em 2027 e anos seguintes pacote fiscal é UNSUPPORTED, nunca cobrança zero presumida',()=>{
 let s=fresh();s=cmd(s,'FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true});s=advance(s,155);
 assert.ok(s.calendar.date.startsWith('2027-'));
 assert.ok(s.fiscal.assessments.some(a=>a.period==='2027-01'&&a.status==='UNSUPPORTED'));
 assert.equal(Core.taxEstimate(s,'2027-02').coverageStatus,'UNSUPPORTED');
 assert.equal(Core.transitionReport(s).coverageStatus,'EDUCATIONAL_ONLY');
 assert.equal(Core.transitionReport(s).cbsTestCents,null);
});
test('V1.9: tempo em lote e dia a dia são reproduzíveis inclusive impostos',()=>{
 let a=fresh();a=cmd(a,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:150});a=cmd(a,'FISCAL.ATIVAR_CENARIO',{acceptSimplifications:true});
 const raw=normal(a);let b=normal(raw);
 a=cmd(a,'TEMPO.AVANCAR_LOTE',{days:30});
 for(let i=0;i<30;i++)b=cmd(b,'TEMPO.AVANCAR_DIA');
 // Logs de comandos e revisão podem divergir; o mundo econômico, o RNG e as apurações não.
 for(const key of ['economy','rng','calendar','fiscal'])assert.deepEqual(normal(a[key]),normal(b[key]));
});
test('V1.9: exportação e reimportação não reexecutam apuração',()=>{
 const s=payReady(),exported=Core.exportSave(s),r=Core.importSave(exported);
 assert.equal(r.migrated,false);assert.deepEqual(normal(r.state),normal(s));
 assert.equal(Core.diagnostics(r.state).status,'PASS (integridade estrutural e contábil)');
});
test('V1.9: não criar nova aba principal e versionamento uniforme em todos os pontos',()=>{
 const tpl=readFileSync('src/shell/index.template.html','utf8'),css=readFileSync('src/shell/theme.css','utf8');
 const ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));
 for(const id of ['intro-version','build-version','footer-version'])assert.ok(tpl.includes(`id="${id}">v3.1.0`));
 assert.match(tpl,/<title>Cidade dos Negócios 1 · v3\.1\.0<\/title>/);
 for(const id of ['fiscal-status','fiscal-optin','fiscal-acknowledge','fiscal-assessments','fiscal-transition'])assert.ok(tpl.includes(`id="${id}"`));
 assert.match(ui,/function renderFiscal/);assert.match(ui,/FISCAL\.ATIVAR_CENARIO/);assert.match(css,/fiscal-dashboard/);
 const navs=(tpl.match(/data-tab="fiscal"/g)||[]).length;assert.equal(navs,1);
});

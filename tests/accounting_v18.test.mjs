import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const load=path=>runInNewContext(readFileSync(path,'utf8')+'\nCidadeCore',{});
const Core=load('src/core/game.js');
const V17=load('tests/fixtures/core_v1_7_0.js'); // motor homologado, não modificado
const city=Core.CITIES.find(c=>c.name==='Tianguá').id;
let commandSeq=0;
const act=(s,type,payload={})=>{const a=Core.dispatch(s,{id:`acc:${++commandSeq}`,type,payload});assert.equal(a.ok,true,`${type}: ${a.error}`);return a.state};
const init=()=>act(null,'CARREIRA.CRIAR',{name:'Analista',companyName:'Rede Gestão',cityId:city,seed:32765});
const open=(s,cityId=city,lot=1,sector='mercado')=>act(s,'EMPRESA.ABRIR',{cityId,lot,sector});
const advance=(s,days)=>{while(days>0){const x=Math.min(30,days);s=act(s,'TEMPO.AVANCAR_LOTE',{days:x});days-=x;}return s;};
function sample(){let s=init();s=open(s);s=act(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:160});s=advance(s,3);return s;}

test('V1.8: versão visível e plano de contas com sinais, com migração de schema de save 8→9',()=>{
 assert.equal(Core.VERSION,'2.0.0-rc.1');assert.equal(Core.SCHEMA_VERSION,9);
 assert.equal(Core.ACCOUNT_CATALOG.CASH.normal,'DEBIT');
 assert.equal(Core.ACCOUNT_CATALOG.PAYABLE.normal,'CREDIT');
 assert.equal(Core.ACCOUNT_CATALOG.COGS.group,'COST');
 assert.equal(Core.ACCOUNT_CATALOG.IN_TRANSIT.group,'ASSET');
 const before=Core.exportSave(init());assert.equal(Core.importSave(before).migrated,false);
});

test('V1.8: capital e abertura: DRE, balanço e caixa conciliam sem impostos',()=>{
 const s=open(init());const snapshot=JSON.stringify(s);
 const dre=Core.incomeStatement(s),bp=Core.balanceSheet(s),cash=Core.cashFlowStatement(s),check=Core.reconciliationReport(s);
 assert.equal(dre.revenue,0);assert.equal(dre.openingExpenses,750000);
 assert.equal(dre.operatingResult,-750000);assert.equal(dre.fiscalCoverage,'NOT_COVERED');
 assert.equal(bp.assets,2250000);assert.equal(bp.paidInCapital,3000000);
 assert.equal(bp.retainedEarnings,-750000);assert.equal(bp.equity,2250000);
 assert.equal(bp.difference,0);assert.equal(bp.balanced,true);
 assert.equal(cash.categories.capital,3000000);assert.equal(cash.categories.opening,750000);
 assert.equal(cash.inflows,3000000);assert.equal(cash.outflows,750000);
 assert.equal(cash.closingCash,2250000);assert.equal(cash.openingCash+cash.netCash,cash.closingCash);
 assert.equal(check.ok,true);assert.equal(check.unitRows.length,1);
 assert.equal(JSON.stringify(s),snapshot,'Consultas jamais alteram save ou RNG');
});

test('V1.8: pagamento ao fornecedor é saída de caixa; recebimento é mera transferência de ativo',()=>{
 let s=open(init());s=act(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:50});
 let bp=Core.balanceSheet(s),cash=Core.cashFlowStatement(s);
 assert.equal(bp.accounts.IN_TRANSIT,160000);assert.equal(bp.accounts.INVENTORY,0);
 assert.equal(cash.categories.suppliers,160000);assert.equal(cash.netCash,3000000-750000-160000);
 assert.equal(Core.reconciliationReport(s).ok,true);
 s=advance(s,1);bp=Core.balanceSheet(s);cash=Core.cashFlowStatement(s);
 assert.equal(bp.accounts.IN_TRANSIT,0);
 assert.equal(bp.accounts.INVENTORY,160000); // Entrega após o fechamento do primeiro dia
 assert.equal(cash.categories.suppliers,160000,'Recebimento não é novo desembolso');
 assert.equal(Core.reconciliationReport(s).ok,true);
 assert.equal(Core.incomeStatement(s).revenue,Core.overview(s).revenue);
});

test('V1.8: contas a pagar por caixa insuficiente não inventam desembolso',()=>{
 let s=open(init());s=advance(s,200);
 const bp=Core.balanceSheet(s),cash=Core.cashFlowStatement(s),dre=Core.incomeStatement(s);
 assert.ok(bp.accounts.PAYABLE>0);
 assert.equal(bp.assets,bp.liabilities+bp.equity);assert.equal(cash.reconciled,true);
 assert.equal(cash.closingCash,Core.overview(s).cash);
 assert.equal(dre.fixedExpenses,200*Core.SECTORS.mercado.dailyCost);
 assert.equal(cash.outflows,750000+Math.floor(2250000/Core.SECTORS.mercado.dailyCost)*Core.SECTORS.mercado.dailyCost);
 assert.equal(Core.reconciliationReport(s).ok,true);
});

test('V1.8: DRE por filial soma no consolidado, sem caixa bancário por unidade',()=>{
 const sobral=Core.CITIES.find(x=>x.name==='Sobral').id;
 let s=open(init());const first=s.world.activeBusinessId;
 s=open(s,sobral,2,'padaria');const second=s.world.activeBusinessId;
 s=act(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'regional',quantity:100});s=advance(s,14);
 const total=Core.incomeStatement(s),a=Core.incomeStatement(s,'all',s.calendar.date,null,first),b=Core.incomeStatement(s,'all',s.calendar.date,null,second);
 assert.equal(total.revenue,a.revenue+b.revenue);
 assert.equal(total.cogs,a.cogs+b.cogs);
 assert.equal(total.expenses,a.expenses+b.expenses);
 assert.equal(total.operatingResult,a.operatingResult+b.operatingResult);
 const contribution=Core.cashFlowStatement(s,'all',s.calendar.date,null,second);
 assert.equal(contribution.openingCash,null);assert.equal(contribution.closingCash,null);
 assert.equal(contribution.reconciled,null);assert.equal(contribution.scope,'UNIT_CONTRIBUTION');
 assert.equal(Core.balanceSheet(s).scope,'GROUP');assert.equal(Core.reconciliationReport(s).unitRows.length,2);
});

test('V1.8: períodos mensais e histórico de cortes são imóveis, fechamento não registra transações',()=>{
 let s=sample(),initial=JSON.stringify(s);
 const nov=Core.monthlyClose(s,'2026-11');assert.equal(nov.status,'GERENCIAL_CONSULTA');
 assert.equal(nov.fiscalCoverage,'NOT_COVERED');assert.equal(nov.operatingResult,Core.incomeStatement(s,'month','2026-11-01').operatingResult);
 assert.equal(JSON.stringify(s),initial);
 const day=Core.incomeStatement(s,'day','2026-11-01');const cash=Core.cashFlowStatement(s,'day','2026-11-01');
 s=advance(s,40);
 assert.equal(Core.incomeStatement(s,'day','2026-11-01').operatingResult,day.operatingResult);
 assert.equal(Core.cashFlowStatement(s,'day','2026-11-01').netCash,cash.netCash);
 assert.equal(Core.balanceSheet(s,'2026-11-01').accounts.CASH,Core.balanceSheet(Core.importSave(Core.exportSave(sample())).state,'2026-11-01').accounts.CASH);
 assert.throws(()=>Core.monthlyClose(s,'2027-06'),/futura/);
 assert.throws(()=>Core.monthlyClose(s,'2026-13'),/inválida/);
});

test('V1.8: classifica estritamente lançamentos legados; desconhecidos permanecem sem classe',()=>{
 const s=sample(),old={...s, economy:{...s.economy,ledger:s.economy.ledger.map(j=>{const v={...j};delete v.kind;return v;})}};
 const oldCash=Core.cashFlowStatement(old),newCash=Core.cashFlowStatement(s);
 assert.equal(oldCash.netCash,newCash.netCash);
 assert.equal(oldCash.categories.sales,newCash.categories.sales);
 const copy=JSON.parse(JSON.stringify(old));copy.economy.ledger.push({id:'jnl-x',date:copy.calendar.date,memo:'Reclassificação não conhecida',entries:[{account:'CASH',debit:300,credit:0},{account:'PAYABLE',debit:0,credit:300}]});
 const fallback=Core.cashFlowStatement(copy);assert.equal(fallback.categories.unclassifiedIn,300);
 assert.equal(Core.transactionKind(copy.economy.ledger.at(-1)),'UNCLASSIFIED');
 assert.equal(Core.balanceSheet(copy).difference,0);
});

test('V1.8: 365 dias em três unidades com partidas e inventários conciliados',()=>{
 const sobral=Core.CITIES.find(x=>x.name==='Sobral').id;
 let s=open(init());s=open(s,sobral,3,'padaria');s=open(s,city,4,'roupas');
 s=act(s,'ESTOQUE.COMPRAR',{productId:'base',supplierId:'atacado',quantity:12});
 s=advance(s,365);
 const bp=Core.balanceSheet(s),q=Core.reconciliationReport(s),cf=Core.cashFlowStatement(s);
 assert.ok(bp.balanced);assert.equal(bp.difference,0);assert.equal(q.ok,true);assert.equal(q.unitRows.length,3);
 assert.equal(cf.reconciled,true);assert.equal(cf.closingCash,Core.overview(s).cash);
 assert.equal(Core.incomeStatement(s).operatingResult,Core.overview(s).profit);
 const saved=Core.exportSave(s),loaded=Core.importSave(saved);
 assert.equal(loaded.migrated,false);assert.deepEqual(JSON.parse(JSON.stringify(loaded.state)),JSON.parse(JSON.stringify(s)));
});

test('V1.8: importação do save produzido na V1.7 homologada é idêntica, sem recálculo retroativo',()=>{
 const location=V17.CITIES.find(c=>c.name==='Tianguá').id;
 let s=V17.dispatch(null,{type:'CARREIRA.CRIAR',id:'legacy-create',payload:{name:'Legado',companyName:'Empresa Histórica',cityId:location,seed:112233}}).state;
 s=V17.dispatch(s,{type:'EMPRESA.ABRIR',id:'legacy-open',payload:{sector:'mercado',lot:2}}).state;
 s=V17.dispatch(s,{type:'ESTOQUE.COMPRAR',id:'legacy-buy',payload:{productId:'base',supplierId:'regional',quantity:80}}).state;
 s=V17.dispatch(s,{type:'TEMPO.AVANCAR_LOTE',id:'legacy-time',payload:{days:30}}).state;
 const json=V17.exportSave(s),hash=JSON.stringify(s);
 const restored=Core.importSave(json);
 assert.equal(restored.migrated,true,'Esquema do save 8 é elevado para 9 sem lançar tributos');
 assert.equal(JSON.stringify(restored.state.economy.ledger),JSON.stringify(s.economy.ledger),'Lançamentos históricos devem permanecer equivalentes');
 assert.equal(restored.state.fiscal.coverageStatus,'NOT_COVERED');
 assert.equal(Core.balanceSheet(restored.state).difference,0);
 assert.equal(Core.reconciliationReport(restored.state).ok,true);
 assert.equal(Core.cashFlowStatement(restored.state).closingCash,V17.overview(s).cash);
 s=act(restored.state,'TEMPO.AVANCAR_DIA');
 assert.ok(s.economy.ledger.some(j=>j.kind==='DAILY_EXPENSE'));
});

test('V1.8: uma única área financeira com demonstrativos e verificações de versão',()=>{
 const tpl=readFileSync('src/shell/index.template.html','utf8');const ui=(readFileSync('src/ui/app.js','utf8')+readFileSync('src/ui/market-views.part.js','utf8')+readFileSync('src/ui/finance-views.part.js','utf8'));const build=readFileSync('tools/build.mjs','utf8');
 for(const v of ['summary','dre','balance','cash','check'])assert.match(tpl,new RegExp(`data-statement-view="${v}"`));
 for(const id of ['finance-summary','finance-statement-title','finance-statement-note'])assert.ok(tpl.includes(`id="${id}"`));
 assert.match(ui,/Core\.balanceSheet/);assert.match(ui,/Core\.cashFlowStatement/);
 assert.match(ui,/Core\.reconciliationReport/);assert.match(ui,/Core\.incomeStatement/);
 assert.match(build,/intro-version/);assert.match(build,/footer-version/);
 assert.match(tpl,/id="footer-version">v2\.0\.0-rc\.1/);
 assert.match(tpl,/<title>Cidade dos Negócios 1 · v2\.0\.0-rc\.1<\/title>/);
});

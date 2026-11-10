/**
 * QA V3.0 P1 — Fluxo integrado V2, executado via controles REAIS da UI offline.
 * Windows hosted, Chrome e Edge em file://, dados 100% sintéticos.
 *
 * Diferentemente da suíte de domínio, cada comando de gameplay é provocado por
 * formulário, botão, tab ou HUD do jogo; Core só é usado como oráculo de LEITURA.
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

if(process.platform!=='win32')throw Error('QA integrado: exige Windows real hospedado, não Node/Linux.');
const TARGET=pathToFileURL(resolve('index.html')).href;
const KEY='cidade-dos-negocios-save-v1';
const PASS=[];
const RESULTS=[];
const check=(condition,label,channel)=>{
  assert.ok(condition,channel+' — '+label);
  PASS.push(channel+': '+label);
};
const shortHash=x=>createHash('sha256').update(x).digest('hex').slice(0,16);
const open=async (ctx,errors,dialogs)=>{
  const page=ctx.pages()[0]??await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',async d=>{
    dialogs.push(d.message());
    if(d.type()==='confirm')await d.accept();
    else await d.dismiss();
  });
  await page.goto(TARGET,{waitUntil:'load',timeout:45000});
  await page.locator('#career-form').waitFor({state:'attached'});
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready',{timeout:20000});
  return page;
};
const stateOf=async page=>{
  await page.waitForFunction(()=>document.body.dataset.storageReady==='ready'&&document.body.dataset.storageBusy!=='true',{timeout:25000});
  return page.evaluate(async key=>{
  const raw=await CidadeDurableStore.readCurrent(CidadeCore);
  if(!raw)return null;
  const state=CidadeCore.importSave(raw).state;
  const report=CidadeCore.overview(state);
  const rh=CidadeCore.rhReport(state);
  const fin=CidadeCore.creditReport(state);
  const lg=CidadeCore.logisticsReport(state);
  const reconciliation=CidadeCore.reconciliationReport(state);
  return {
    raw,revision:state.revision,tick:state.calendar.tick,date:state.calendar.date,
    cash:report.cash,revenue:report.revenue,expenses:report.expenses,stock:report.stock,
    units:CidadeCore.businesses(state).map(b=>({id:b.id,cityId:b.cityId,lot:b.lot,
      stock:b.stockUnits,purchases:b.purchaseOrders.map(o=>({id:o.id,status:o.status,total:o.total}))})),
    journalKinds:state.economy.ledger.map(j=>j.kind),
    events:state.audit.events.map(e=>e.type),
    rh:{active:rh.totalActive,pending:rh.pendingCents,units:rh.units.map(u=>({
      id:u.businessId,payrolls:u.payrolls}))},
    credit:{loans:fin.loans.length,principal:fin.principalOutstanding,
      eligible:fin.eligibility.eligible,sales:fin.eligibility.salesLast30Cents},
    logistics:{transfers:lg.transfers.map(t=>({from:t.fromId,to:t.toId,
      quantity:t.quantity,status:t.status})),clearing:reconciliation.ok},
    schemaVersion:state.schemaVersion,balanced:CidadeCore.balanceSheet(state).balanced,
    reconcileErrors:reconciliation.errors
  };
},KEY);
};
const count=(s,kind)=>s.journalKinds.filter(x=>x===kind).length;
const events=(s,kind)=>s.events.filter(x=>x===kind).length;
async function nav(page,tab,section){
  const close=page.locator('#v31-overlay-close');
  if(await close.isVisible())await close.click();
  const root={empresa:'empresa:dashboard',mercado:'mercado:compras',
    administrativo:'administrativo:rh-dp',sistema:'sistema'}[tab];
  const dock=page.locator('#v31-dock [data-v31-open="'+root+'"]');
  if(await dock.isVisible())await dock.click();
  else await page.locator('.nav-primary [data-tab="'+tab+'"]').click();
  if(section){
    const button=page.locator('[data-section-tab="'+tab+':'+section+'"]');
    await button.click();
    assert.equal(await button.getAttribute('aria-selected'),'true',
      'Subaba não selecionada: '+tab+'/'+section);
    assert.ok(await page.locator('[data-section-pane="'+tab+':'+section+'"]').isVisible(),
      'Conteúdo da subaba não ficou visível: '+tab+'/'+section);
  }
  assert.ok(await page.locator('[data-view="'+tab+'"]').isVisible(),'Navegação falhou: '+tab);
}
async function city(page){
  if(await page.locator('#v31-overlay-close').isVisible())await page.locator('#v31-overlay-close').click();
  if(await page.locator('[data-view="cidade"]').isVisible())return;
  await page.locator('.nav-primary [data-tab="cidade"]').click();
  await page.locator('#v31-hud-turns').waitFor({state:'visible'});
}
async function advance(page,span){
  await city(page);
  await page.locator('#v31-hud-turns').click();
  await page.locator('[data-v221-time="'+span+'"]').click();
}
async function newUnit(page,lot){
  await city(page);
  await page.locator('#map-lot-picker').selectOption(String(lot));
  await page.locator('#map-open-company').click();
  assert.ok(await page.locator('#open-form').isVisible(),'Formulário de abertura invisível');
  await page.locator('#sector-select').selectOption('mercado');
  await page.locator('#open-form button[type="submit"]').click();
  await page.locator('#v31-hud-turns').waitFor({state:'visible'});
}
async function runChannel(channel){
  const dir=mkdtempSync(join(tmpdir(),'cdnegocios-v300-integrated-'+channel+'-'));
  const errors=[],dialogs=[];
  let context;
  let currentStep='setup';
  try{
    context=await chromium.launchPersistentContext(dir,{
      channel,headless:true,acceptDownloads:false,
      viewport:{width:1366,height:900},
      args:['--no-first-run','--disable-background-networking','--disable-extensions']});
    const page=await open(context,errors,dialogs);
    async function stage(name,fn){
      currentStep=name;console.log('V300_INTEGRATED_STAGE '+channel+' '+name);
      await fn();
    }
    let first,second;
    await stage('01-onboarding',async()=>{
      await page.locator('#player-name').fill('QA Integração');
      await page.locator('#company-name').fill('Rede Sintética QA');
      await page.locator('#start-city').selectOption('CE-TIANGUA');
      await page.locator('#career-form button[type=submit]').click();
      await page.locator('#v31-hud-turns').waitFor({state:'visible'});
      const s=await stateOf(page);
      check(s.units.length===0&&s.schemaVersion===10&&s.balanced&&s.logistics.clearing,
        'início íntegro sem compras ou empresas',channel);
    });
    await stage('02-abrir-primeira-unidade',async()=>{
      await newUnit(page,2);
      const s=await stateOf(page);
      check(s.units.length===1&&s.units[0].lot===2,'empresa inaugurada pelo seletor do mapa',channel);
      first=s.units[0].id;
      check(s.balanced&&s.logistics.clearing,'abertura contabilmente conciliada',channel);
    });
    await stage('03-mercado-compra-real',async()=>{
      await nav(page,'mercado','compras');
      const before=await stateOf(page);
      await page.locator('#buy-product').selectOption('base');
      await page.locator('#buy-supplier').selectOption('regional');
      await page.locator('#buy-quantity').fill('200');
      await page.locator('#buy-form button[type=submit]').click();
      const after=await stateOf(page);
      check(count(after,'PURCHASE')===count(before,'PURCHASE')+1&&
        after.units[0].purchases.length===1&&after.units[0].purchases[0].status==='PENDING',
        'compra real da UI cria pedido único em trânsito',channel);
      check(after.revenue===before.revenue&&after.cash<before.cash&&after.stock===before.stock,
        'pedido não inventa receita nem entrega imediata',channel);
      check(after.balanced&&after.logistics.clearing,'compra preserva conciliação',channel);
    });
    await stage('04-recebimento-pelo-tempo',async()=>{
      const before=await stateOf(page);
      await advance(page,'1');
      const after=await stateOf(page);
      check(after.tick===before.tick+1&&after.units[0].purchases[0].status==='RECEIVED',
        'HUD avança dia e recebimento efetivo no prazo',channel);
      check(after.stock>0&&count(after,'RECEIPT')===count(before,'RECEIPT')+1,
        'recebimento entra no estoque/razão uma vez',channel);
    });
    await stage('05-segunda-filial-real',async()=>{
      await newUnit(page,3);
      const s=await stateOf(page);
      second=s.units[1]?.id;
      check(s.units.length===2&&s.units.some(u=>u.lot===3),
        'segunda unidade aberta pelo mapa, sem reconstruir save',channel);
    });
    await stage('06-contratar-rh-com-confirmacao',async()=>{
      await nav(page,'administrativo','rh-dp');
      const before=await stateOf(page);
      await page.locator('#rh-hire-unit').selectOption(first);
      await page.locator('#rh-hire-name').fill('Colaborador Sintético');
      await page.locator('#rh-hire-role').selectOption('atendimento');
      await page.locator('#rh-hire-submit').click();
      const after=await stateOf(page);
      check(after.rh.active===1&&after.rh.pending===0&&
        events(after,'RH.CONTRATADO')===events(before,'RH.CONTRATADO')+1,
        'RH contrata personagem via confirmação sem folha retroativa',channel);
      check(after.journalKinds.length===before.journalKinds.length,
        'contratação não lança despesa antes da competência',channel);
    });
    await stage('07-logistica-transferencia-com-confirmacao',async()=>{
      await nav(page,'administrativo','logistica');
      const before=await stateOf(page);
      await page.locator('#logistics-transfer-from').selectOption(first);
      await page.locator('#logistics-transfer-to').selectOption(second);
      await page.locator('#logistics-transfer-product').selectOption('mercado::base');
      await page.locator('#logistics-transfer-quantity').fill('10');
      check(await page.locator('#logistics-transfer-submit').isEnabled(),
        'UI habilita transferência de 10 unidades',channel);
      await page.locator('#logistics-transfer-submit').click();
      const after=await stateOf(page);
      check(after.logistics.transfers.length===1&&
        after.logistics.transfers[0].status==='PENDING'&&
        after.logistics.transfers[0].from===first&&after.logistics.transfers[0].to===second,
        'transferência real gera carga em trânsito',channel);
      check(after.revenue===before.revenue&&after.balanced&&after.logistics.clearing,
        'transferência não cria venda nem desbalanceia o razão',channel);
    });
    await stage('08-navegacao-contabilidade-sem-efeitos',async()=>{
      const before=await stateOf(page);
      await nav(page,'administrativo','contabilidade');
      await page.locator('[data-statement-view="balance"]').click();
      const text=await page.locator('#finance-summary').innerText();
      check(text.length>10&&/Ativo|Passivo|Caixa|Balanço/i.test(text),
        'demonstrativo contábil visível',channel);
      await nav(page,'administrativo','financas');
      await nav(page,'administrativo','rh-dp');
      const after=await stateOf(page);
      check(after.raw===before.raw,'navegar por três módulos não altera save, tempo ou economia',channel);
    });
    await stage('09-reposicao-manual-cotacao-sem-compra',async()=>{
      await nav(page,'mercado','compras');
      const before=await stateOf(page);
      await page.locator('#restock-prepare').click();
      const preview=await page.locator('#restock-preview').innerText();
      check(preview.length>30&&/total|produto/i.test(preview),
        'cotação manual apresenta orçamento sem pedido',channel);
      await page.locator('#restock-cancel').click();
      const after=await stateOf(page);
      check(after.raw===before.raw,'preparar e cancelar reposição não altera livro nem RNG',channel);
    });
    await stage('10-estrategia-patch-a-com-pedido-unico',async()=>{
      const before=await stateOf(page);
      await page.locator('#v300a-mode').selectOption('equilibrado');
      check(await page.locator('#v300a-apply').isEnabled(),
        'Patch A propõe compra confirmável para a segunda unidade',channel);
      await page.locator('#v300a-apply').click();
      const after=await stateOf(page);
      check(count(after,'PURCHASE')===count(before,'PURCHASE')+1&&
        events(after,'ECONOMIA.COMPRA_PLANEJADA')===events(before,'ECONOMIA.COMPRA_PLANEJADA')+1,
        'Patch A executa uma compra pelo mesmo registro canônico',channel);
      check(after.revenue===before.revenue&&after.cash<before.cash&&after.balanced,
        'compra estratégica não inventa receita ou gera dupla despesa',channel);
    });
    await stage('11-demanda-e-credito',async()=>{
      // Transfere 7 dias pela UI (não por dispatch de teste).
      await advance(page,'7');
      let s=await stateOf(page);
      check(s.tick===8&&s.revenue>0&&s.balanced,'vendas por demanda do calendário são reais no ledger',channel);
      if(!s.credit.eligible){
        // Situação econômica não é mockada: mais uma semana real via HUD.
        await advance(page,'7');s=await stateOf(page);
      }
      await nav(page,'administrativo','financas');
      check(await page.locator('#credit-contract-submit').isEnabled()&&s.credit.eligible,
        'UI reflete elegibilidade derivada das vendas realizadas',channel);
      const before=await stateOf(page);
      await page.locator('#credit-principal').fill('500');
      await page.locator('#credit-term').selectOption('6');
      await page.locator('#credit-contract-submit').click();
      const after=await stateOf(page);
      check(after.credit.loans===before.credit.loans+1&&
        after.credit.principal===before.credit.principal+50000,
        'crédito fictício contratado e lançado como obrigação',channel);
      check(after.revenue===before.revenue&&after.cash===before.cash+50000,
        'empréstimo aumenta caixa mas nunca receita',channel);
    });
    await stage('12-fechar-competencia-e-pagar-folha',async()=>{
      const before=await stateOf(page);
      await advance(page,'30');
      await nav(page,'administrativo','rh-dp');
      const accrued=await stateOf(page);
      check(accrued.rh.pending>0&&
        count(accrued,'PAYROLL_ACCRUAL')===count(before,'PAYROLL_ACCRUAL')+1,
        'passagem do mês reconhece folha única em EXPENSE/PAYABLE',channel);
      const expenseBefore=accrued.expenses;
      const pay=page.locator('#rh-unit-list [data-rh-pay]').first();
      check(await pay.isVisible(),'botão de quitação da folha disponível',channel);
      await pay.click();
      const after=await stateOf(page);
      check(after.rh.pending===0&&count(after,'PAYROLL_PAYMENT')===1,
        'botão RH quita folha pendente uma vez',channel);
      check(after.expenses===expenseBefore&&after.cash<accrued.cash&&after.balanced,
        'quitação não reconhece segunda despesa',channel);
    });
    await stage('13-reabrir-save-com-mesma-identidade',async()=>{
      const before=await stateOf(page);
      await page.reload({waitUntil:'load'});
      await page.locator('#game-shell').waitFor({state:'visible'});
      const after=await stateOf(page);
      check(after.raw===before.raw&&after.revision===before.revision&&
        after.units.length===2&&after.credit.loans===1&&
        after.rh.pending===0&&after.logistics.transfers.length===1,
        'reabrir file:// conserva estado completo das cinco áreas',channel);
      check(after.balanced&&after.logistics.clearing&&after.reconcileErrors.length===0,
        'conciliação final e ledger preservados após reload',channel);
      check(errors.length===0,'zero pageerrors fatais em fluxo integrado',channel);
    });
    check(dialogs.some(x=>/Contratar/i.test(x))&&dialogs.some(x=>/Transferir/i.test(x))&&
      dialogs.some(x=>/Pagar folha/i.test(x)),
      'confirmações RH, logística e folha efetivamente mostradas',channel);
    const final=await stateOf(page);
    RESULTS.push({channel,result:'PASS',checks:PASS.filter(x=>x.startsWith(channel+':')).length,
      tick:final.tick,revision:final.revision,units:final.units.length,
      loanCents:final.credit.principal,ledgerEntries:final.journalKinds.length,
      hash16:shortHash(final.raw),scope:'synthetic-only Windows headless file://'});
  }catch(err){
    throw new Error('P1 QA integrado '+channel+' em etapa '+currentStep+': '+err.message,{cause:err});
  }finally{
    if(context)await context.close();
    rmSync(dir,{recursive:true,force:true});
  }
}
for(const channel of ['chrome','msedge'])await runChannel(channel);
console.log('V300_WINDOWS_INTEGRATED_QA '+JSON.stringify({
  status:'PASS',environment:'Windows hosted, Chrome/Edge headless, file:// local',
  assertions:PASS.length,results:RESULTS,
  preservedBusinessLedger:true,
  privateSaveUsed:false,personalInstallationTested:false,
  mobileDeviceTested:false,releaseAuthorized:false,
  notes:'Comandos provocados pela interface real; Core usado apenas para leitura do save.'
}));
